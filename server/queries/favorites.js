import db from '../db.js';
import { listCourses } from './courses.js';
import { listFavoriteContents } from './contents.js';

// "IS" statt "=": Anders als "=" vergleicht IS auch NULL mit NULL. Genau das braucht ein Favorit,
// bei dem entweder course_id oder content_id leer ist. Das UNIQUE im Schema greift bei NULL nicht,
// deshalb wird vor dem Einfügen selbst geprüft.
const findFavorite = db.prepare(
  'SELECT id FROM favorites WHERE user_id = ? AND course_id IS ? AND content_id IS ?'
);
const insertFavorite = db.prepare('INSERT INTO favorites (user_id, course_id, content_id) VALUES (?, ?, ?)');
const deleteFavorite = db.prepare(
  'DELETE FROM favorites WHERE user_id = ? AND course_id IS ? AND content_id IS ?'
);

// Ids aus der URL können Text sein, fehlende Werte werden zu NULL
function toIdOrNull(value) {
  return value === undefined || value === null || value === '' ? null : Number(value);
}

// Gemerkte Kurse und Inhalte in denselben Formen wie listCourses und listRanking
export function listFavorites(userId) {
  return {
    courses: listCourses(userId).filter((course) => course.isFavorite),
    contents: listFavoriteContents(userId)
  };
}

// Es muss genau eines von courseId und contentId gesetzt sein (sonst lehnt das CHECK im Schema ab).
// Ist der Favorit schon vorhanden, passiert nichts.
export function addFavorite(userId, { courseId, contentId }) {
  const course = toIdOrNull(courseId);
  const content = toIdOrNull(contentId);
  if (findFavorite.get(userId, course, content)) return;
  insertFavorite.run(userId, course, content);
}

export function removeFavorite(userId, { courseId, contentId }) {
  deleteFavorite.run(userId, toIdOrNull(courseId), toIdOrNull(contentId));
}
