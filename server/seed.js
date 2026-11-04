import bcrypt from 'bcryptjs';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { REPORT_REASONS } from '../shared/constants.js';

const serverDir = path.dirname(fileURLToPath(import.meta.url));
const seedDir = path.join(serverDir, 'seed');
const uploadsDir = path.join(serverDir, 'uploads');

// Pro Tabelle ein festes INSERT, in der Reihenfolge der Fremdschlüssel (erst Eltern, dann Kinder).
// Die ids aus data.json bleiben erhalten, deshalb stimmen alle Verweise. COALESCE setzt die Standardwerte,
// falls eine von Hand geschriebene Zeile eine Spalte weglässt.
const inserts = {
  users: `INSERT INTO users (id, username, password_hash, role, email_domain, created_at)
          VALUES (@id, @username, @password_hash, COALESCE(@role, 'user'), @email_domain, COALESCE(@created_at, CURRENT_TIMESTAMP))`,
  courses: `INSERT INTO courses (id, name, studiengang, semester)
            VALUES (@id, @name, COALESCE(@studiengang, 'WI'), @semester)`,
  topics: `INSERT INTO topics (id, course_id, name) VALUES (@id, @course_id, @name)`,
  contents: `INSERT INTO contents (id, course_id, user_id, type, title, format, body_text, file_name, original_name, file_size, exam_year, source, created_at)
             VALUES (@id, @course_id, @user_id, @type, @title, @format, @body_text, @file_name, @original_name, @file_size, @exam_year, @source, COALESCE(@created_at, CURRENT_TIMESTAMP))`,
  content_topics: `INSERT INTO content_topics (content_id, topic_id) VALUES (@content_id, @topic_id)`,
  ratings: `INSERT INTO ratings (id, course_id, user_id, vorlesung, uebungen, schwierigkeit, aufwand, comment, created_at, updated_at)
            VALUES (@id, @course_id, @user_id, @vorlesung, @uebungen, @schwierigkeit, @aufwand, @comment, COALESCE(@created_at, CURRENT_TIMESTAMP), COALESCE(@updated_at, @created_at, CURRENT_TIMESTAMP))`,
  upvotes: `INSERT INTO upvotes (content_id, user_id, created_at)
            VALUES (@content_id, @user_id, COALESCE(@created_at, CURRENT_TIMESTAMP))`
};

// Welche Spalten pro Tabelle erwartet werden. Fehlt eine in data.json, wird sie als NULL übergeben.
const columns = {
  users: ['id', 'username', 'password_hash', 'role', 'email_domain', 'created_at'],
  courses: ['id', 'name', 'studiengang', 'semester'],
  topics: ['id', 'course_id', 'name'],
  contents: ['id', 'course_id', 'user_id', 'type', 'title', 'format', 'body_text', 'file_name', 'original_name', 'file_size', 'exam_year', 'source', 'created_at'],
  content_topics: ['content_id', 'topic_id'],
  ratings: ['id', 'course_id', 'user_id', 'vorlesung', 'uebungen', 'schwierigkeit', 'aufwand', 'comment', 'created_at', 'updated_at'],
  upvotes: ['content_id', 'user_id', 'created_at']
};

// data.json lesen. Fehlt die Datei oder ist sie kaputt, startet die App trotzdem (mit leeren Tabellen).
function readSeedData() {
  try {
    return JSON.parse(fs.readFileSync(path.join(seedDir, 'data.json'), 'utf8'));
  } catch (err) {
    console.warn(`Startdaten konnten nicht gelesen werden (${err.message}). Die App startet ohne Kurse.`);
    return {};
  }
}

// PDFs aus server/seed/files/ nach server/uploads/ kopieren, wenn sie dort noch fehlen
function copySeedFiles() {
  const filesDir = path.join(seedDir, 'files');
  fs.mkdirSync(uploadsDir, { recursive: true });
  if (!fs.existsSync(filesDir)) return;
  for (const name of fs.readdirSync(filesDir)) {
    if (!name.endsWith('.pdf')) continue; // .gitkeep und Sonstiges überspringen
    const target = path.join(uploadsDir, name);
    if (!fs.existsSync(target)) {
      fs.copyFileSync(path.join(filesDir, name), target);
    }
  }
}

// Testkonto anlegen, falls es den Benutzernamen noch nicht gibt (Passwort: demo1234)
function ensureAccount(db, username, role) {
  if (db.prepare('SELECT id FROM users WHERE username = ?').get(username)) return;
  const hash = bcrypt.hashSync('demo1234', 10);
  db.prepare('INSERT INTO users (username, password_hash, role) VALUES (?, ?, ?)').run(username, hash, role);
}

// Wird von db.js aufgerufen, wenn die Tabelle courses leer ist.
// Das Ganze läuft in einer Transaktion: Geht etwas schief, bleibt die Datenbank leer und der nächste Start versucht es erneut.
// db.js wird hier nicht importiert (db.js importiert seed.js), deshalb wird die Transaktion direkt gestartet.
export function seed(db) {
  const data = readSeedData();

  db.exec('BEGIN');
  try {
    for (const table of Object.keys(inserts)) {
      const insert = db.prepare(inserts[table]);
      for (const row of data[table] ?? []) {
        const params = {};
        for (const column of columns[table]) {
          params[column] = row[column] ?? null;
        }
        insert.run(params);
      }
    }

    ensureAccount(db, 'admin', 'admin');
    ensureAccount(db, 'test', 'user');

    // Gibt es Inhalte, aber keine Meldung, entsteht eine Beispielmeldung für die Admin-Seite in der Demo
    const firstContent = db.prepare('SELECT id FROM contents ORDER BY id LIMIT 1').get();
    const reportCount = db.prepare('SELECT COUNT(*) AS count FROM reports').get().count;
    if (firstContent && reportCount === 0) {
      const tester = db.prepare("SELECT id FROM users WHERE username = 'test'").get();
      db.prepare('INSERT INTO reports (user_id, content_id, reason) VALUES (?, ?, ?)')
        .run(tester.id, firstContent.id, REPORT_REASONS[2]);
    }

    db.exec('COMMIT');
  } catch (err) {
    db.exec('ROLLBACK');
    throw err;
  }

  // Dateien erst nach dem Commit kopieren: ein Fehler beim Kopieren soll die Datenbank nicht zurückrollen
  copySeedFiles();

  const courses = db.prepare('SELECT COUNT(*) AS count FROM courses').get().count;
  const contents = db.prepare('SELECT COUNT(*) AS count FROM contents').get().count;
  console.log(`Startdaten eingelesen: ${courses} Kurse, ${contents} Inhalte.`);
}
