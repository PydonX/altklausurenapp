import { Router } from 'express';
import { getCourse, listTopics } from '../queries/courses.js';
import {
  getContent,
  listRanking,
  createContent,
  deleteContent,
  addUpvote,
  removeUpvote
} from '../queries/contents.js';
import { findUserById } from '../queries/users.js';
import { uploadPdf, savePdf, deletePdf, sendPdf } from '../files.js';
import { validateContent } from '../../shared/validation.js';
import { CONTENT_TYPES } from '../../shared/constants.js';
import { requireLogin, checkId } from '../middleware.js';

const router = Router();

// Läuft vor jeder Route mit :id und lehnt ungültige IDs mit 400 ab
router.param('id', checkId);

// Ohne Anmeldung ist userId undefined. Die Abfragen brauchen dann null.
function currentUserId(req) {
  return req.session.userId ?? null;
}

// Lädt den Inhalt aus der Datenbank oder antwortet mit 404. Gibt den Inhalt zurück
// bzw. undefined, wenn schon geantwortet wurde.
function findContentOr404(req, res) {
  const content = getContent(Number(req.params.id), currentUserId(req));
  if (!content) {
    res.status(404).json({ error: 'Diesen Inhalt gibt es nicht.' });
  }
  return content;
}

// Rangliste: die 20 Inhalte mit den meisten Daumen hoch, optional nur ein Typ.
// Steht vor /contents/:id, sonst würde "ranking" als ID gelesen.
router.get('/contents/ranking', (req, res) => {
  const { type } = req.query;
  if (type && !CONTENT_TYPES.includes(type)) {
    return res.status(400).json({ error: `Der Typ "${type}" gibt es nicht. Erlaubt sind: ${CONTENT_TYPES.join(', ')}.` });
  }
  res.json(listRanking(type, 20, currentUserId(req)));
});

// Ein Inhalt mit Themenfeldern, Daumen und Favorit-Status
router.get('/contents/:id', (req, res) => {
  const content = findContentOr404(req, res);
  if (!content) return;
  // Der gespeicherte Dateiname bleibt auf dem Server, die PDF gibt es über /file
  const { fileName, ...publicContent } = content;
  res.json(publicContent);
});

// PDF zur Anzeige im Browser (Viewer im iframe)
router.get('/contents/:id/file', (req, res) => {
  const content = findContentOr404(req, res);
  if (!content) return;
  if (content.format !== 'pdf') {
    return res.status(404).json({ error: 'Dieser Inhalt hat keine PDF-Datei.' });
  }
  sendPdf(res, content);
});

// Inhalt anlegen (multipart/form-data). Reihenfolge der Middleware:
// 1. requireLogin: ohne Anmeldung wird die Datei gar nicht erst angenommen
// 2. uploadPdf (multer): liest Formularfelder in req.body und die Datei in req.file
router.post('/contents', requireLogin, uploadPdf, (req, res) => {
  const body = req.body ?? {};

  // Im Formular kommt alles als Text an. topicIds wird als JSON-Text geschickt ("[1,2]").
  let topicIds = body.topicIds;
  if (typeof topicIds === 'string') {
    try {
      topicIds = JSON.parse(topicIds);
    } catch {
      topicIds = [];
    }
  }

  // multer liest Dateinamen als Latin-1, der Browser schickt aber UTF-8. Ohne Umwandlung
  // wird aus "Klausür.pdf" der Name "KlausÃ¼r.pdf".
  const originalName = req.file ? Buffer.from(req.file.originalname, 'latin1').toString('utf8') : null;

  const courseId = Number(body.courseId);
  const course = Number.isInteger(courseId) && courseId > 0 ? getCourse(courseId, null) : undefined;
  const courseTopicIds = course ? listTopics(courseId).map((topic) => topic.id) : [];

  const fields = validateContent(
    {
      courseId: body.courseId,
      type: body.type,
      title: body.title,
      topicIds,
      format: body.format,
      text: body.text,
      file: req.file ? { name: originalName, size: req.file.size } : undefined,
      examYear: body.examYear,
      source: body.source,
      noNames: body.noNames
    },
    courseTopicIds
  );
  if (!fields.courseId && !course) {
    fields.courseId = 'Diesen Kurs gibt es nicht. Bitte wähle einen anderen Kurs.';
  }
  if (Object.keys(fields).length > 0) {
    return res.status(400).json({ error: 'Bitte prüfe die markierten Felder.', fields });
  }

  const isPdf = body.format === 'pdf';

  // Erst die Datei speichern (savePdf prüft die ersten Bytes auf "%PDF-"), dann den Datenbankeintrag
  let fileName = null;
  if (isPdf) {
    try {
      fileName = savePdf(req.file.buffer);
    } catch (err) {
      if (err.status === 400) {
        return res.status(400).json({
          error: 'Bitte prüfe die markierten Felder.',
          fields: { file: 'Die Datei ist keine echte PDF. Bitte wähle eine andere Datei.' }
        });
      }
      throw err;
    }
  }

  try {
    const id = createContent(
      {
        courseId,
        userId: req.session.userId,
        type: body.type,
        title: body.title.trim(),
        format: body.format,
        bodyText: isPdf ? null : body.text.trim(),
        fileName,
        originalName: isPdf ? originalName : null,
        fileSize: isPdf ? req.file.size : null,
        examYear: body.type === 'altklausur' ? Number(body.examYear) : null,
        source: body.source?.trim() || null
      },
      topicIds.map(Number)
    );
    res.status(201).json({ id });
  } catch (err) {
    // Datenbankeintrag fehlgeschlagen: die gerade gespeicherte PDF nicht als Waise liegen lassen
    deletePdf(fileName);
    throw err;
  }
});

// Löschen darf nur, wem der Inhalt gehört, oder ein Admin
router.delete('/contents/:id', requireLogin, (req, res) => {
  const content = findContentOr404(req, res);
  if (!content) return;

  const isOwner = content.userId === req.session.userId;
  if (!isOwner) {
    // Die Rolle kommt aus der Datenbank, nie aus dem Frontend
    const user = findUserById(req.session.userId);
    if (!user || user.role !== 'admin') {
      return res.status(403).json({ error: 'Du kannst nur deine eigenen Inhalte löschen.' });
    }
  }

  // deleteContent gibt den Dateinamen zurück, damit auch die PDF verschwindet
  deletePdf(deleteContent(content.id));
  res.status(204).end();
});

// Daumen hoch setzen. Doppeltes Setzen ist kein Fehler (idempotent).
router.post('/contents/:id/upvote', requireLogin, (req, res) => {
  const content = findContentOr404(req, res);
  if (!content) return;
  addUpvote(content.id, req.session.userId);
  res.status(204).end();
});

// Daumen hoch zurücknehmen. Auch das ist idempotent.
router.delete('/contents/:id/upvote', requireLogin, (req, res) => {
  const content = findContentOr404(req, res);
  if (!content) return;
  removeUpvote(content.id, req.session.userId);
  res.status(204).end();
});

export default router;
