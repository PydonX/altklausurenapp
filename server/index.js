import express from 'express';

// Minimalversion aus Schritt 0. Ab Schritt 1 gehört diese Datei Person 3.
const app = express();
const PORT = 3001;

app.get('/api/health', (req, res) => {
  res.json({ ok: true });
});

app.listen(PORT, () => {
  console.log(`API läuft auf http://localhost:${PORT}`);
});
