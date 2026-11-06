import { Router } from 'express';
import { createReport, listOpenReports, dismissReports } from '../queries/reports.js';
import { validateReport } from '../../shared/validation.js';
import { requireLogin, requireAdmin } from '../middleware.js';

const router = Router();

// Gemeldet wird entweder ein Inhalt (contentId) oder ein Erfahrungsbericht (ratingId), nie beides.
// Liest das aus dem Body (POST) oder aus der URL (DELETE). Gibt { contentId } oder { ratingId }
// zurück, bei falscher Eingabe { error }.
function readTarget(source) {
  const { contentId, ratingId } = source;
  const hasContent = contentId !== undefined && contentId !== null && contentId !== '';
  const hasRating = ratingId !== undefined && ratingId !== null && ratingId !== '';

  if (hasContent === hasRating) {
    return { error: 'Bitte gib entweder contentId (Inhalt) oder ratingId (Erfahrungsbericht) an, aber nicht beides.' };
  }
  const value = hasContent ? contentId : ratingId;
  if (!/^[1-9]\d*$/.test(String(value))) {
    return { error: 'Die ID muss eine positive ganze Zahl sein.' };
  }
  return hasContent ? { contentId: Number(value) } : { ratingId: Number(value) };
}

// Inhalt oder Erfahrungsbericht melden
router.post('/reports', requireLogin, (req, res) => {
  const body = req.body ?? {};

  const fields = validateReport(body);
  if (Object.keys(fields).length > 0) {
    return res.status(400).json({ error: 'Bitte prüfe die markierten Felder.', fields });
  }

  const target = readTarget(body);
  if (target.error) {
    return res.status(400).json({ error: target.error });
  }

  try {
    const id = createReport(req.session.userId, { ...target, reason: body.reason });
    res.status(201).json({ id });
  } catch (err) {
    // Gibt es das Gemeldete nicht (mehr), lehnt die Datenbank den Fremdschlüssel ab
    if (String(err.message).includes('FOREIGN KEY')) {
      return res.status(404).json({ error: 'Das Gemeldete gibt es nicht mehr.' });
    }
    throw err;
  }
});

// Offene Meldungen für die Admin-Seite, gruppiert nach Inhalt bzw. Erfahrungsbericht
router.get('/admin/reports', requireAdmin, (req, res) => {
  res.json(listOpenReports());
});

// Meldungen verwerfen: DELETE /admin/reports?contentId=3 oder ?ratingId=5
router.delete('/admin/reports', requireAdmin, (req, res) => {
  const target = readTarget(req.query);
  if (target.error) {
    return res.status(400).json({ error: target.error });
  }
  dismissReports(target);
  res.status(204).end();
});

export default router;
