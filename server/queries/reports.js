import db from '../db.js';

const insertReport = db.prepare(
  'INSERT INTO reports (user_id, content_id, rating_id, reason) VALUES (?, ?, ?, ?)'
);

// Alle Meldungen zu demselben Inhalt bzw. Erfahrungsbericht werden zu einer Zeile zusammengefasst.
// label: Titel des Inhalts bzw. die ersten 120 Zeichen des Erfahrungsberichts.
// courseId wird zusätzlich geliefert, damit die Admin-Seite auf /kurse/:id verlinken kann.
const selectOpenReports = db.prepare(`
  SELECT r.content_id AS contentId, r.rating_id AS ratingId,
         COALESCE(c.title, SUBSTR(ra.comment, 1, 120)) AS label,
         COALESCE(c.course_id, ra.course_id) AS courseId,
         co.name AS courseName,
         COUNT(*) AS count,
         MAX(r.created_at) AS latestAt
  FROM reports r
  LEFT JOIN contents c ON c.id = r.content_id
  LEFT JOIN ratings ra ON ra.id = r.rating_id
  LEFT JOIN courses co ON co.id = COALESCE(c.course_id, ra.course_id)
  GROUP BY r.content_id, r.rating_id
  ORDER BY latestAt DESC, r.content_id, r.rating_id`);

// Gründe zu einem Eintrag mit Häufigkeit (IS, weil eine der beiden Spalten NULL ist)
const selectReasons = db.prepare(`
  SELECT reason, COUNT(*) AS count
  FROM reports
  WHERE content_id IS ? AND rating_id IS ?
  GROUP BY reason
  ORDER BY count DESC, reason`);

const deleteReports = db.prepare('DELETE FROM reports WHERE content_id IS ? AND rating_id IS ?');

function toIdOrNull(value) {
  return value === undefined || value === null || value === '' ? null : Number(value);
}

// Genau eines von contentId und ratingId muss gesetzt sein, sonst lehnt das CHECK im Schema ab
export function createReport(userId, { contentId, ratingId, reason }) {
  const result = insertReport.run(userId, toIdOrNull(contentId), toIdOrNull(ratingId), reason);
  return Number(result.lastInsertRowid);
}

export function listOpenReports() {
  return selectOpenReports.all().map((row) => ({
    contentId: row.contentId,
    ratingId: row.ratingId,
    label: row.label,
    courseId: row.courseId,
    courseName: row.courseName,
    count: row.count,
    reasons: selectReasons.all(row.contentId, row.ratingId).map((r) => ({ reason: r.reason, count: r.count })),
    latestAt: row.latestAt
  }));
}

// Löscht alle Meldungen zu diesem Eintrag
export function dismissReports({ contentId, ratingId }) {
  deleteReports.run(toIdOrNull(contentId), toIdOrNull(ratingId));
}
