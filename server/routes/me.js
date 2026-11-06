import { Router } from 'express';
import { getCourse } from '../queries/courses.js';
import { getContent, listUserUploads } from '../queries/contents.js';
import { listFavorites, addFavorite, removeFavorite } from '../queries/favorites.js';
import { requireLogin, checkId } from '../middleware.js';

const router = Router();

// Läuft vor jeder Route mit :id und lehnt ungültige IDs mit 400 ab
router.param('id', checkId);

// Alles unter /me gehört der angemeldeten Person: ohne Login gibt es nur 401.
router.use('/me', requireLogin);

// Gemerkte Kurse und Inhalte fürs Dashboard: { courses: [...], contents: [...] }
router.get('/me/favorites', (req, res) => {
  res.json(listFavorites(req.session.userId));
});

// Kurs merken. PUT ist idempotent: Merken, was schon gemerkt ist, ist kein Fehler.
router.put('/me/favorites/courses/:id', (req, res) => {
  const courseId = Number(req.params.id);
  if (!getCourse(courseId, null)) {
    return res.status(404).json({ error: 'Diesen Kurs gibt es nicht.' });
  }
  addFavorite(req.session.userId, { courseId });
  res.status(204).end();
});

// Auch Entfernen ist idempotent. Gibt es den Kurs oder den Favoriten nicht (mehr), ist das Ziel
// trotzdem erreicht (nicht gemerkt), deshalb hier kein 404.
router.delete('/me/favorites/courses/:id', (req, res) => {
  removeFavorite(req.session.userId, { courseId: Number(req.params.id) });
  res.status(204).end();
});

// Inhalt merken
router.put('/me/favorites/contents/:id', (req, res) => {
  const contentId = Number(req.params.id);
  if (!getContent(contentId, null)) {
    return res.status(404).json({ error: 'Diesen Inhalt gibt es nicht.' });
  }
  addFavorite(req.session.userId, { contentId });
  res.status(204).end();
});

router.delete('/me/favorites/contents/:id', (req, res) => {
  removeFavorite(req.session.userId, { contentId: Number(req.params.id) });
  res.status(204).end();
});

// Eigene Uploads, neueste zuerst
router.get('/me/uploads', (req, res) => {
  res.json(listUserUploads(req.session.userId));
});

export default router;
