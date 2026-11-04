import db from '../db.js';

// Statements werden einmal beim Laden der Datei vorbereitet, nicht bei jedem Aufruf.
// Eingaben gehen nur über Platzhalter (?) in die Abfrage, nie per String-Verkettung.
const findByUsername = db.prepare(
  'SELECT id, username, password_hash AS passwordHash, role FROM users WHERE username = ?'
);
const findById = db.prepare('SELECT id, username, role FROM users WHERE id = ?');
const insertUser = db.prepare(
  'INSERT INTO users (username, password_hash, role, email_domain) VALUES (?, ?, ?, ?)'
);

// Für den Login: enthält als Einziges den Passwort-Hash
export function findUserByUsername(username) {
  return findByUsername.get(username);
}

// Für /auth/me und die Session: ohne Passwort-Hash
export function findUserById(id) {
  return findById.get(id);
}

// Gibt die neue id zurück. Ist der Benutzername vergeben, wirft SQLite einen UNIQUE-Fehler.
export function createUser({ username, passwordHash, role = 'user', emailDomain = null }) {
  const result = insertUser.run(username, passwordHash, role, emailDomain);
  return Number(result.lastInsertRowid);
}
