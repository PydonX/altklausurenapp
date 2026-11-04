import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import db from './db.js';

// Schreibt den aktuellen Stand der Datenbank nach server/seed/ (npm run seed:export).
// Exportiert werden Benutzer, Kurse, Themenfelder, Inhalte, Bewertungen und Daumen hoch.
// Favoriten, Meldungen und Sessions gehören nicht in die Startdaten.
const serverDir = path.dirname(fileURLToPath(import.meta.url));
const seedFilesDir = path.join(serverDir, 'seed', 'files');
const uploadsDir = path.join(serverDir, 'uploads');

// Jede Tabelle hat ihre feste Abfrage, sortiert, damit Git-Diffs ruhig bleiben
const selects = {
  users: 'SELECT * FROM users ORDER BY id',
  courses: 'SELECT * FROM courses ORDER BY id',
  topics: 'SELECT * FROM topics ORDER BY id',
  contents: 'SELECT * FROM contents ORDER BY id',
  content_topics: 'SELECT * FROM content_topics ORDER BY content_id, topic_id',
  ratings: 'SELECT * FROM ratings ORDER BY id',
  upvotes: 'SELECT * FROM upvotes ORDER BY content_id, user_id'
};

const data = {};
for (const [table, sql] of Object.entries(selects)) {
  data[table] = db.prepare(sql).all();
}

// Mit Einrückung schreiben, damit man Änderungen im Git-Diff lesen kann
fs.writeFileSync(path.join(serverDir, 'seed', 'data.json'), JSON.stringify(data, null, 2) + '\n');

// PDFs kopieren, auf die contents.file_name verweist
fs.mkdirSync(seedFilesDir, { recursive: true });
const usedFiles = new Set();
let copied = 0;
for (const content of data.contents) {
  if (!content.file_name) continue;
  const source = path.join(uploadsDir, path.basename(content.file_name));
  if (!fs.existsSync(source)) {
    console.warn(`Warnung: Die Datei zu "${content.title}" fehlt in server/uploads (${content.file_name}).`);
    continue;
  }
  usedFiles.add(content.file_name);
  fs.copyFileSync(source, path.join(seedFilesDir, path.basename(content.file_name)));
  copied++;
}

// PDFs löschen, die keinem Inhalt mehr gehören (.gitkeep bleibt)
let removed = 0;
for (const name of fs.readdirSync(seedFilesDir)) {
  if (name.endsWith('.pdf') && !usedFiles.has(name)) {
    fs.rmSync(path.join(seedFilesDir, name));
    removed++;
  }
}

console.log('Exportiert nach server/seed/:');
for (const table of Object.keys(selects)) {
  console.log(`  ${table}: ${data[table].length}`);
}
console.log(`  PDFs kopiert: ${copied}, nicht mehr verwendete gelöscht: ${removed}`);
