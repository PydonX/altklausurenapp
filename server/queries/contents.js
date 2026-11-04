import db, { withTransaction } from '../db.js';

// Spalten, die jede Inhalts-Liste braucht. Der Text ist fest im Code, Eingaben kommen nur als Parameter.
// Daumen werden gezählt statt gespeichert. Mit @userId = NULL ist hasUpvoted/isFavorite immer 0.
const listColumns = `
  c.id, c.type, c.title, c.format, c.exam_year AS examYear, c.source, c.created_at AS createdAt,
  u.username AS author,
  c.course_id AS courseId, co.name AS courseName,
  (SELECT COUNT(*) FROM upvotes v WHERE v.content_id = c.id) AS upvotes,
  EXISTS (SELECT 1 FROM upvotes v WHERE v.content_id = c.id AND v.user_id = @userId) AS hasUpvoted,
  EXISTS (SELECT 1 FROM favorites f WHERE f.content_id = c.id AND f.user_id = @userId) AS isFavorite`;

// LEFT JOIN auf users: Wurde das Konto gelöscht, ist user_id NULL und der Inhalt bleibt ohne Autor erhalten
const fromContents = `
  FROM contents c
  JOIN courses co ON co.id = c.course_id
  LEFT JOIN users u ON u.id = c.user_id`;

// Filter nach Typ und Themenfeld: ist der Parameter NULL, wird nicht gefiltert
const courseFilter = `
  WHERE c.course_id = @courseId
    AND (@type IS NULL OR c.type = @type)
    AND (@topicId IS NULL OR EXISTS (
      SELECT 1 FROM content_topics ct WHERE ct.content_id = c.id AND ct.topic_id = @topicId))`;

const selectByVotes = db.prepare(
  `SELECT ${listColumns} ${fromContents} ${courseFilter} ORDER BY upvotes DESC, c.created_at DESC, c.id DESC`
);
const selectByNew = db.prepare(
  `SELECT ${listColumns} ${fromContents} ${courseFilter} ORDER BY c.created_at DESC, c.id DESC`
);

const selectOne = db.prepare(`
  SELECT ${listColumns},
         c.user_id AS userId, c.body_text AS bodyText, c.file_name AS fileName,
         c.original_name AS originalName, c.file_size AS fileSize
  ${fromContents}
  WHERE c.id = @id`);

const selectRanking = db.prepare(`
  SELECT ${listColumns} ${fromContents}
  WHERE (@type IS NULL OR c.type = @type)
  ORDER BY upvotes DESC, c.created_at DESC, c.id DESC
  LIMIT @limit`);

const selectUploads = db.prepare(`
  SELECT ${listColumns} ${fromContents}
  WHERE c.user_id = @userId
  ORDER BY c.created_at DESC, c.id DESC`);

// Für das Dashboard (wird von favorites.js genutzt): gemerkte Inhalte, zuletzt gemerkte zuerst
const selectFavorites = db.prepare(`
  SELECT ${listColumns} ${fromContents}
  JOIN favorites fav ON fav.content_id = c.id AND fav.user_id = @userId
  ORDER BY fav.id DESC`);

const selectContentTopics = db.prepare(`
  SELECT t.id, t.name
  FROM content_topics ct JOIN topics t ON t.id = ct.topic_id
  WHERE ct.content_id = ?
  ORDER BY t.name`);

const insertContent = db.prepare(`
  INSERT INTO contents (course_id, user_id, type, title, format, body_text, file_name, original_name, file_size, exam_year, source)
  VALUES (@courseId, @userId, @type, @title, @format, @bodyText, @fileName, @originalName, @fileSize, @examYear, @source)`);
// OR IGNORE: kommt ein Themenfeld doppelt in der Liste vor, ist das kein Fehler
const insertContentTopic = db.prepare('INSERT OR IGNORE INTO content_topics (content_id, topic_id) VALUES (?, ?)');

// RETURNING liefert den Dateinamen der gelöschten Zeile, ohne vorher extra abzufragen
const deleteById = db.prepare('DELETE FROM contents WHERE id = ? RETURNING file_name AS fileName');

const insertUpvote = db.prepare('INSERT OR IGNORE INTO upvotes (content_id, user_id) VALUES (?, ?)');
const deleteUpvote = db.prepare('DELETE FROM upvotes WHERE content_id = ? AND user_id = ?');

const selectCourseName = db.prepare('SELECT name FROM courses WHERE id = ?');
const selectCourseTopicNames = db.prepare('SELECT name FROM topics WHERE course_id = ? ORDER BY name');
const selectTopicName = db.prepare('SELECT name FROM topics WHERE id = ? AND course_id = ?');
const selectQuizTexts = db.prepare(`
  SELECT c.type, c.title, c.body_text AS bodyText
  FROM contents c
  WHERE c.course_id = @courseId AND c.format = 'text' AND c.body_text IS NOT NULL
    AND (@topicId IS NULL OR EXISTS (
      SELECT 1 FROM content_topics ct WHERE ct.content_id = c.id AND ct.topic_id = @topicId))
  ORDER BY (SELECT COUNT(*) FROM upvotes v WHERE v.content_id = c.id) DESC, c.created_at DESC, c.id DESC`);

// Datenbankzeile in die Form für die Routen bringen: 0/1 wird true/false, Themenfelder kommen dazu
function toContent(row) {
  const { hasUpvoted, isFavorite, ...rest } = row;
  return {
    ...rest,
    hasUpvoted: Boolean(hasUpvoted),
    isFavorite: Boolean(isFavorite),
    topics: selectContentTopics.all(row.id).map((topic) => ({ id: topic.id, name: topic.name }))
  };
}

// Leere Werte aus der URL (zum Beispiel ?type=) bedeuten: nicht filtern
function emptyToNull(value) {
  return value === undefined || value === '' ? null : value;
}

export function listCourseContents(courseId, { type, topicId, sort } = {}, userId = null) {
  const statement = sort === 'new' ? selectByNew : selectByVotes;
  const rows = statement.all({
    courseId,
    type: emptyToNull(type),
    topicId: emptyToNull(topicId) === null ? null : Number(topicId),
    userId: userId ?? null
  });
  return rows.map(toContent);
}

export function getContent(id, userId = null) {
  const row = selectOne.get({ id, userId: userId ?? null });
  return row ? toContent(row) : undefined;
}

// data: { courseId, userId, type, title, format, bodyText, fileName, originalName, fileSize, examYear, source }
// Der Inhalt und seine Themenfelder werden zusammen gespeichert: entweder alles oder nichts.
export function createContent(data, topicIds) {
  return withTransaction(() => {
    const result = insertContent.run({
      courseId: data.courseId,
      userId: data.userId ?? null,
      type: data.type,
      title: data.title,
      format: data.format,
      bodyText: data.bodyText ?? null,
      fileName: data.fileName ?? null,
      originalName: data.originalName ?? null,
      fileSize: data.fileSize ?? null,
      examYear: data.examYear ?? null,
      source: data.source ?? null
    });
    const contentId = Number(result.lastInsertRowid);
    for (const topicId of topicIds) {
      insertContentTopic.run(contentId, topicId);
    }
    return contentId;
  });
}

// Gibt den Dateinamen der PDF zurück (null bei Text-Inhalten oder wenn es den Inhalt nicht gab).
// Daumen, Favoriten, Meldungen und Themen-Zuordnungen verschwinden durch ON DELETE CASCADE.
export function deleteContent(id) {
  const row = deleteById.get(id);
  return row?.fileName ?? null;
}

export function listRanking(type, limit = 20, userId = null) {
  return selectRanking.all({ type: emptyToNull(type), limit, userId: userId ?? null }).map(toContent);
}

export function listUserUploads(userId) {
  return selectUploads.all({ userId }).map(toContent);
}

export function listFavoriteContents(userId) {
  return selectFavorites.all({ userId }).map(toContent);
}

// Existiert der Inhalt nicht, wirft SQLite einen Fremdschlüssel-Fehler: die Route prüft vorher mit getContent.
export function addUpvote(contentId, userId) {
  insertUpvote.run(contentId, userId);
}

export function removeUpvote(contentId, userId) {
  deleteUpvote.run(contentId, userId);
}

// Material für das Quiz: nur Text-Inhalte, die beliebtesten zuerst. Mit topicId nur dieses Themenfeld.
export function getQuizMaterial(courseId, topicId = null) {
  const course = selectCourseName.get(courseId);
  if (!course) return undefined;
  const topic = emptyToNull(topicId) === null ? null : Number(topicId);

  let topics;
  if (topic === null) {
    topics = selectCourseTopicNames.all(courseId).map((row) => row.name);
  } else {
    const row = selectTopicName.get(topic, courseId);
    topics = row ? [row.name] : [];
  }
  const texts = selectQuizTexts.all({ courseId, topicId: topic }).map((row) => ({
    type: row.type,
    title: row.title,
    bodyText: row.bodyText
  }));
  return { courseName: course.name, topics, texts };
}
