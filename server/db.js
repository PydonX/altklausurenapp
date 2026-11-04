import { DatabaseSync } from 'node:sqlite';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { seed } from './seed.js';

// Absolute Pfade, damit es egal ist, von wo aus der Server gestartet wird
const serverDir = path.dirname(fileURLToPath(import.meta.url));
const dataDir = path.join(serverDir, 'data');
const uploadsDir = path.join(serverDir, 'uploads');

// Ordner anlegen, falls sie fehlen (beide stehen in .gitignore)
fs.mkdirSync(dataDir, { recursive: true });
fs.mkdirSync(uploadsDir, { recursive: true });

const db = new DatabaseSync(path.join(dataDir, 'app.db'));

// Fremdschlüssel sind in SQLite standardmäßig aus und müssen pro Verbindung eingeschaltet werden
db.exec('PRAGMA foreign_keys = ON');
// WAL: Lesen und Schreiben blockieren sich nicht gegenseitig
db.exec('PRAGMA journal_mode = WAL');

// Tabellen anlegen (CREATE TABLE IF NOT EXISTS, deshalb bei jedem Start ungefährlich)
db.exec(fs.readFileSync(path.join(serverDir, 'schema.sql'), 'utf8'));

// Beim ersten Start mit leerer Datenbank die Startdaten einlesen
const { count } = db.prepare('SELECT COUNT(*) AS count FROM courses').get();
if (count === 0) {
  seed(db);
}

// node:sqlite hat keine Transaktions-Hilfe: entweder alles oder nichts
export function withTransaction(fn) {
  db.exec('BEGIN');
  try {
    const result = fn();
    db.exec('COMMIT');
    return result;
  } catch (err) {
    db.exec('ROLLBACK');
    throw err;
  }
}

export default db;
