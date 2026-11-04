CREATE TABLE IF NOT EXISTS users (
  id            INTEGER PRIMARY KEY,
  username      TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  role          TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('user', 'admin')),
  email_domain  TEXT,              -- nur die Domain, z. B. 'sick.de', nie die ganze Adresse (Stufe 3)
  created_at    TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS courses (
  id          INTEGER PRIMARY KEY,
  name        TEXT NOT NULL,
  studiengang TEXT NOT NULL DEFAULT 'WI',
  semester    INTEGER NOT NULL CHECK (semester BETWEEN 1 AND 6)
);

CREATE TABLE IF NOT EXISTS topics (
  id        INTEGER PRIMARY KEY,
  course_id INTEGER NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  name      TEXT NOT NULL,
  UNIQUE (course_id, name)
);

CREATE TABLE IF NOT EXISTS contents (
  id            INTEGER PRIMARY KEY,
  course_id     INTEGER NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  user_id       INTEGER REFERENCES users(id) ON DELETE SET NULL,
  type          TEXT NOT NULL CHECK (type IN ('altklausur', 'cheatsheet', 'aufschrieb', 'zusammenfassung', 'tipp')),
  title         TEXT NOT NULL,
  format        TEXT NOT NULL CHECK (format IN ('text', 'pdf')),
  body_text     TEXT,              -- nur bei format = 'text'
  file_name     TEXT,              -- gespeicherter Dateiname in server/uploads, nur bei 'pdf'
  original_name TEXT,              -- Dateiname beim Hochladen, nur bei 'pdf'
  file_size     INTEGER,
  exam_year     INTEGER,           -- nur bei type = 'altklausur'
  source        TEXT,              -- optional, woher der Inhalt stammt, z. B. 'SICK-Jahrgang WI 2023'
  created_at    TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CHECK (type <> 'tipp' OR format = 'text')
);

CREATE TABLE IF NOT EXISTS content_topics (
  content_id INTEGER NOT NULL REFERENCES contents(id) ON DELETE CASCADE,
  topic_id   INTEGER NOT NULL REFERENCES topics(id) ON DELETE CASCADE,
  PRIMARY KEY (content_id, topic_id)
);

-- Kursbewertung: Sterne bzw. Schieberegler plus optionaler Erfahrungsbericht
CREATE TABLE IF NOT EXISTS ratings (
  id            INTEGER PRIMARY KEY,
  course_id     INTEGER NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  user_id       INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  vorlesung     INTEGER NOT NULL CHECK (vorlesung BETWEEN 1 AND 5),
  uebungen      INTEGER NOT NULL CHECK (uebungen BETWEEN 1 AND 5),
  schwierigkeit INTEGER NOT NULL CHECK (schwierigkeit BETWEEN 1 AND 5),
  aufwand       INTEGER NOT NULL CHECK (aufwand BETWEEN 1 AND 5),
  comment       TEXT,
  created_at    TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at    TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE (course_id, user_id)
);

CREATE TABLE IF NOT EXISTS upvotes (
  content_id INTEGER NOT NULL REFERENCES contents(id) ON DELETE CASCADE,
  user_id    INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (content_id, user_id)
);

-- Genau eine der beiden Spalten course_id / content_id ist gesetzt
CREATE TABLE IF NOT EXISTS favorites (
  id         INTEGER PRIMARY KEY,
  user_id    INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  course_id  INTEGER REFERENCES courses(id) ON DELETE CASCADE,
  content_id INTEGER REFERENCES contents(id) ON DELETE CASCADE,
  CHECK ((course_id IS NULL) <> (content_id IS NULL)),
  UNIQUE (user_id, course_id, content_id)
);

-- Gemeldet wird entweder ein Inhalt oder ein Erfahrungsbericht
CREATE TABLE IF NOT EXISTS reports (
  id         INTEGER PRIMARY KEY,
  user_id    INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  content_id INTEGER REFERENCES contents(id) ON DELETE CASCADE,
  rating_id  INTEGER REFERENCES ratings(id) ON DELETE CASCADE,
  reason     TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CHECK ((content_id IS NULL) <> (rating_id IS NULL))
);
