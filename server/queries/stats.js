import db from '../db.js';

// Zahlen für die Landing Page, jedes Mal frisch gezählt
const selectStats = db.prepare(`
  SELECT (SELECT COUNT(*) FROM courses) AS courses,
         (SELECT COUNT(*) FROM contents) AS contents,
         (SELECT COUNT(*) FROM contents WHERE type = 'altklausur') AS exams,
         (SELECT COUNT(*) FROM ratings) AS ratings,
         (SELECT COUNT(*) FROM upvotes) AS upvotes`);

export function getStats() {
  const row = selectStats.get();
  return { courses: row.courses, contents: row.contents, exams: row.exams, ratings: row.ratings, upvotes: row.upvotes };
}
