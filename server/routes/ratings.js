import { Router } from 'express';
import { getCourse } from '../queries/courses.js';
import { listCourseRatings, getUserRating, upsertRating, deleteRating } from '../queries/ratings.js';
import { validateRating } from '../../shared/validation.js';
import { requireLogin, requireAdmin, checkId } from '../middleware.js';

const router = Router();

// Läuft vor jeder Route mit :id und lehnt ungültige IDs mit 400 ab
router.param('id', checkId);

// Erfahrungsberichte eines Kurses (ohne Benutzername und user_id, das erledigt die Abfrage)
// plus die eigene Bewertung, falls jemand angemeldet ist.
router.get('/courses/:id/ratings', (req, res) => {
  const courseId = Number(req.params.id);
  if (!getCourse(courseId, null)) {
    return res.status(404).json({ error: 'Diesen Kurs gibt es nicht.' });
  }
  const userId = req.session.userId;
  res.json({
    ratings: listCourseRatings(courseId),
    mine: (userId && getUserRating(courseId, userId)) || null
  });
});

// Eigene Bewertung anlegen oder ändern. Pro Kurs und Person gibt es genau eine (UNIQUE im Schema),
// deshalb ist PUT passend: derselbe Aufruf zweimal ergibt denselben Zustand.
router.put('/courses/:id/ratings/me', requireLogin, (req, res) => {
  const courseId = Number(req.params.id);
  if (!getCourse(courseId, null)) {
    return res.status(404).json({ error: 'Diesen Kurs gibt es nicht.' });
  }

  const body = req.body ?? {};
  const fields = validateRating(body);
  if (Object.keys(fields).length > 0) {
    return res.status(400).json({ error: 'Bitte prüfe die markierten Felder.', fields });
  }

  // Die Zahlen können als Text ankommen ("4"), gespeichert werden echte Zahlen
  upsertRating(courseId, req.session.userId, {
    vorlesung: Number(body.vorlesung),
    uebungen: Number(body.uebungen),
    schwierigkeit: Number(body.schwierigkeit),
    aufwand: Number(body.aufwand),
    comment: body.comment ?? null
  });
  res.json(getUserRating(courseId, req.session.userId));
});

// Bewertung löschen (nur Admin, z. B. nach einer Meldung)
router.delete('/ratings/:id', requireAdmin, (req, res) => {
  if (!deleteRating(Number(req.params.id))) {
    return res.status(404).json({ error: 'Diese Bewertung gibt es nicht.' });
  }
  res.status(204).end();
});

export default router;
