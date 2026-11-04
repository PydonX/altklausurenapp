import db from '../db.js';

// Gemeinsamer Kopf der Kurs-Abfragen. Der Text ist fest im Code, Eingaben kommen nur über ?.
// Durchschnitte und Zählungen werden hier berechnet und nirgends gespeichert.
// Ohne Bewertung ist AVG gleich NULL, ohne Anmeldung (userId = NULL) findet EXISTS nie einen Favoriten.
const courseSelect = `
  SELECT c.id, c.name, c.semester, c.studiengang,
         COUNT(r.id) AS ratingCount,
         ROUND(AVG(r.vorlesung), 1) AS avgVorlesung,
         ROUND(AVG(r.uebungen), 1) AS avgUebungen,
         ROUND(AVG(r.schwierigkeit), 1) AS avgSchwierigkeit,
         ROUND(AVG(r.aufwand), 1) AS avgAufwand,
         (SELECT COUNT(*) FROM contents ct WHERE ct.course_id = c.id) AS contentCount,
         EXISTS (SELECT 1 FROM favorites f WHERE f.user_id = ? AND f.course_id = c.id) AS isFavorite
  FROM courses c
  LEFT JOIN ratings r ON r.course_id = c.id`;

const selectAllCourses = db.prepare(`${courseSelect} GROUP BY c.id ORDER BY c.semester, c.name`);
const selectOneCourse = db.prepare(`${courseSelect} WHERE c.id = ? GROUP BY c.id`);
const selectAllTopics = db.prepare('SELECT id, course_id AS courseId, name FROM topics ORDER BY name');
const selectCourseTopics = db.prepare('SELECT id, name FROM topics WHERE course_id = ? ORDER BY name');

// Zeile aus der Datenbank in die Form für die Routen bringen
function toCourse(row, topics) {
  return {
    id: row.id,
    name: row.name,
    semester: row.semester,
    studiengang: row.studiengang,
    topics,
    ratingCount: row.ratingCount,
    avg: row.ratingCount === 0 ? null : {
      vorlesung: row.avgVorlesung,
      uebungen: row.avgUebungen,
      schwierigkeit: row.avgSchwierigkeit,
      aufwand: row.avgAufwand
    },
    contentCount: row.contentCount,
    isFavorite: Boolean(row.isFavorite)
  };
}

export function listCourses(userId) {
  // Alle Themenfelder in einer Abfrage holen und den Kursen zuordnen (statt eine Abfrage pro Kurs)
  const topicsByCourse = new Map();
  for (const topic of selectAllTopics.all()) {
    if (!topicsByCourse.has(topic.courseId)) topicsByCourse.set(topic.courseId, []);
    topicsByCourse.get(topic.courseId).push({ id: topic.id, name: topic.name });
  }
  return selectAllCourses.all(userId ?? null).map((row) => toCourse(row, topicsByCourse.get(row.id) ?? []));
}

export function getCourse(id, userId) {
  const row = selectOneCourse.get(userId ?? null, id);
  if (!row) return undefined;
  return toCourse(row, listTopics(id));
}

export function listTopics(courseId) {
  return selectCourseTopics.all(courseId).map((topic) => ({ id: topic.id, name: topic.name }));
}
