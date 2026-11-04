import db from '../db.js';

// Öffentliche Erfahrungsberichte: bewusst ohne user_id, damit niemand zurückverfolgt werden kann
const selectCourseRatings = db.prepare(`
  SELECT id, vorlesung, uebungen, schwierigkeit, aufwand, comment, created_at AS createdAt
  FROM ratings
  WHERE course_id = ? AND comment IS NOT NULL AND TRIM(comment) <> ''
  ORDER BY created_at DESC, id DESC`);

// Die eigene Bewertung darf alles enthalten, sie gehört der angemeldeten Person
const selectUserRating = db.prepare(`
  SELECT id, vorlesung, uebungen, schwierigkeit, aufwand, comment,
         created_at AS createdAt, updated_at AS updatedAt
  FROM ratings
  WHERE course_id = ? AND user_id = ?`);

// UNIQUE (course_id, user_id): Gibt es die Bewertung schon, wird sie aktualisiert statt neu angelegt
const upsert = db.prepare(`
  INSERT INTO ratings (course_id, user_id, vorlesung, uebungen, schwierigkeit, aufwand, comment)
  VALUES (@courseId, @userId, @vorlesung, @uebungen, @schwierigkeit, @aufwand, @comment)
  ON CONFLICT (course_id, user_id) DO UPDATE SET
    vorlesung = excluded.vorlesung,
    uebungen = excluded.uebungen,
    schwierigkeit = excluded.schwierigkeit,
    aufwand = excluded.aufwand,
    comment = excluded.comment,
    updated_at = CURRENT_TIMESTAMP`);

const deleteById = db.prepare('DELETE FROM ratings WHERE id = ?');

export function listCourseRatings(courseId) {
  return selectCourseRatings.all(courseId);
}

export function getUserRating(courseId, userId) {
  return selectUserRating.get(courseId, userId);
}

// data: { vorlesung, uebungen, schwierigkeit, aufwand, comment }. Ein leerer Erfahrungsbericht wird NULL.
export function upsertRating(courseId, userId, data) {
  upsert.run({
    courseId,
    userId,
    vorlesung: data.vorlesung,
    uebungen: data.uebungen,
    schwierigkeit: data.schwierigkeit,
    aufwand: data.aufwand,
    comment: data.comment?.trim() || null
  });
}

// Gibt true zurück, wenn es die Bewertung gab (für ein 404 in der Route)
export function deleteRating(id) {
  return deleteById.run(id).changes > 0;
}
