import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import express from 'express';
import session from 'express-session';
import authRouter from './routes/auth.js';
import statsRouter from './routes/stats.js';
import coursesRouter from './routes/courses.js';
import ratingsRouter from './routes/ratings.js';
import contentsRouter from './routes/contents.js';
import meRouter from './routes/me.js';

// .env darf fehlen: Die App muss auch ohne sie starten.
try {
  process.loadEnvFile();
} catch {}

const app = express();
const PORT = 3001;
const distDir = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'dist');

// Body als JSON lesen (req.body)
app.use(express.json());

// Login per Session-Cookie. Fehlt SESSION_SECRET, wird beim Start ein zufälliges erzeugt
// (nach einem Neustart sind dann alle abgemeldet).
app.use(
  session({
    secret: process.env.SESSION_SECRET || crypto.randomBytes(32).toString('hex'),
    resave: false,
    saveUninitialized: false,
    cookie: { httpOnly: true, sameSite: 'lax' }
  })
);

// API-Routen
app.get('/api/health', (req, res) => {
  res.json({ ok: true });
});
app.use('/api/auth', authRouter);
// Diese Router enthalten ihre vollen Pfade (z. B. /courses/:id), deshalb alle unter /api
app.use('/api', statsRouter);
app.use('/api', coursesRouter);
app.use('/api', ratingsRouter);
app.use('/api', contentsRouter);
app.use('/api', meRouter);

// Unbekannte /api-Adressen: JSON statt HTML
app.use('/api', (req, res) => {
  res.status(404).json({ error: 'Diese Adresse gibt es nicht.' });
});

// Nach "npm run build" liefert Express das Frontend selbst aus.
// Alle anderen Pfade bekommen index.html, den Rest erledigt der Router im Browser.
if (fs.existsSync(distDir)) {
  app.use(express.static(distDir));
  app.use((req, res) => {
    res.sendFile(path.join(distDir, 'index.html'));
  });
}

// Zentrale Fehlerbehandlung: erkennbar an den vier Parametern.
// Fehler aus allen Routen landen hier, der Server stürzt nicht ab.
app.use((err, req, res, next) => {
  if (err.code === 'LIMIT_FILE_SIZE') {
    return res.status(400).json({ error: 'Die Datei ist größer als 10 MB.' });
  }
  if (err.type === 'entity.parse.failed') {
    return res.status(400).json({ error: 'Die Anfrage konnte nicht gelesen werden.' });
  }
  if (err.status) {
    return res.status(err.status).json({ error: err.message });
  }
  console.error(err);
  res.status(500).json({ error: 'Ein unerwarteter Fehler ist aufgetreten.' });
});

app.listen(PORT, () => {
  console.log(`API läuft auf http://localhost:${PORT}`);
});
