import { Router } from 'express';
import { listCourses, getCourse } from '../queries/courses.js';
import { listCourseContents } from '../queries/contents.js';
import { CONTENT_TYPES } from '../../shared/constants.js';
import { checkId } from '../middleware.js';

const router = Router();

// Läuft vor jeder Route mit :id und lehnt ungültige IDs mit 400 ab
router.param('id', checkId);

// Ohne Anmeldung ist userId undefined. Die Abfragen brauchen dann null (kein Favorit).
function currentUserId(req) {
  return req.session.userId ?? null;
}

// Alle Kurse. Suchen und Filtern passiert im Frontend, deshalb gibt es hier keine Filter.
router.get('/courses', (req, res) => {
  res.json(listCourses(currentUserId(req)));
});

router.get('/courses/:id', (req, res) => {
  const course = getCourse(Number(req.params.id), currentUserId(req));
  if (!course) {
    return res.status(404).json({ error: 'Diesen Kurs gibt es nicht.' });
  }
  res.json(course);
});

// Inhalte eines Kurses. Filter: ?type=altklausur&topic=3&sort=votes|new
// Leere Werte (z. B. ?type=) bedeuten: nicht filtern.
router.get('/courses/:id/contents', (req, res) => {
  const courseId = Number(req.params.id);
  if (!getCourse(courseId, null)) {
    return res.status(404).json({ error: 'Diesen Kurs gibt es nicht.' });
  }

  const { type, topic, sort } = req.query;

  if (type && !CONTENT_TYPES.includes(type)) {
    return res.status(400).json({ error: `Der Typ "${type}" gibt es nicht. Erlaubt sind: ${CONTENT_TYPES.join(', ')}.` });
  }
  if (topic && !/^[1-9]\d*$/.test(topic)) {
    return res.status(400).json({ error: 'Das Themenfeld muss eine Zahl sein.' });
  }
  if (sort && sort !== 'votes' && sort !== 'new') {
    return res.status(400).json({ error: 'Sortiert werden kann nach "votes" oder "new".' });
  }

  const contents = listCourseContents(
    courseId,
    { type, topicId: topic, sort: sort || 'votes' },
    currentUserId(req)
  );
  res.json(contents);
});

export default router;
