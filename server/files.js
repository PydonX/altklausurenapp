import multer from 'multer';
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { LIMITS } from '../shared/constants.js';

// Ordner für die gespeicherten PDFs (db.js legt ihn auch an, hier zur Sicherheit, falls files.js allein geladen wird)
const uploadsDir = path.join(path.dirname(fileURLToPath(import.meta.url)), 'uploads');
fs.mkdirSync(uploadsDir, { recursive: true });

// Fehler mit Statuscode, den die Fehlerbehandlung in index.js als Antwort verwendet
function httpError(status, message) {
  const err = new Error(message);
  err.status = status;
  return err;
}

// multer liest multipart/form-data. Mit memoryStorage bleibt die Datei im Arbeitsspeicher (req.file.buffer),
// gespeichert wird erst, nachdem savePdf sie geprüft hat. Das Formularfeld heißt "file".
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: LIMITS.pdfMaxBytes }
}).single('file');

// Wie multer selbst als Middleware benutzbar. Zu große Dateien werden in einen 400-Fehler mit
// verständlichem Text umgewandelt, damit die Route nichts über multer wissen muss.
export function uploadPdf(req, res, next) {
  upload(req, res, (err) => {
    if (err?.code === 'LIMIT_FILE_SIZE') {
      return next(httpError(400, 'Die Datei ist größer als 10 MB. Bitte eine kleinere PDF hochladen.'));
    }
    next(err);
  });
}

// Jede PDF-Datei beginnt mit den 5 Bytes "%PDF-" (die sogenannte Magic Number).
// Der MIME-Typ und die Endung kommen vom Browser und lassen sich beliebig fälschen, der Dateianfang nicht.
function isPdf(buffer) {
  return buffer.length >= 5 && buffer.subarray(0, 5).toString('latin1') === '%PDF-';
}

// Speichert die PDF unter einem zufälligen Namen und gibt diesen Namen zurück.
// Der Originalname des Nutzers wird nie als Dateiname benutzt (Schutz vor Pfad-Tricks wie "../").
export function savePdf(buffer) {
  if (!isPdf(buffer)) {
    throw httpError(400, 'Die Datei ist kein gültiges PDF.');
  }
  const fileName = `${crypto.randomUUID()}.pdf`;
  fs.writeFileSync(path.join(uploadsDir, fileName), buffer);
  return fileName;
}

// Löscht die Datei. Fehlt sie schon, ist das kein Fehler.
export function deletePdf(fileName) {
  if (!fileName) return;
  // basename: selbst ein manipulierter Wert in der Datenbank kann den Ordner nicht verlassen
  fs.rmSync(path.join(uploadsDir, path.basename(fileName)), { force: true });
}

// Liefert die PDF zur Anzeige im Browser aus. content kommt aus getContent (fileName, originalName).
export function sendPdf(res, content) {
  const filePath = content?.fileName ? path.join(uploadsDir, path.basename(content.fileName)) : null;
  if (!filePath || !fs.existsSync(filePath)) {
    return res.status(404).json({ error: 'Die PDF-Datei wurde nicht gefunden.' });
  }
  // Anführungszeichen und Steuerzeichen aus dem Namen entfernen, damit der Header nicht aufbricht.
  // filename* (UTF-8) sorgt dafür, dass Umlaute im Dateinamen richtig ankommen.
  const cleanName = String(content.originalName || 'dokument.pdf').replace(/["\\\x00-\x1f]/g, '');
  const asciiName = cleanName.replace(/[^\x20-\x7e]/g, '_');
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader(
    'Content-Disposition',
    `inline; filename="${asciiName}"; filename*=UTF-8''${encodeURIComponent(cleanName)}`
  );
  // sendFile verlangt einen absoluten Pfad
  res.sendFile(filePath, (err) => {
    if (err && !res.headersSent) {
      res.status(404).json({ error: 'Die PDF-Datei wurde nicht gefunden.' });
    }
  });
}
