# CLAUDE.md – Altklausuren-App

Diese Datei ist die verbindliche Vorgabe für alle, die mit Claude Code an diesem Projekt arbeiten. Was hier steht, gilt. Weicht eine Aufgabe davon ab, frag zuerst nach.

## Wer arbeitet hier?

Vier Personen bauen die App gemeinsam. Jede Person hat eine eigene Aufgaben-Datei:

| Rolle | Branch | Aufgaben-Datei |
| --- | --- | --- |
| Person 1: Design-System, Landing Page, Routing, Build | `debi` | `docs/aufgaben/person-1.md` |
| Person 2: Datenbank, Datei-Handling, Startdaten | `julian` | `docs/aufgaben/person-2.md` |
| Person 3: REST-API, Gemini, Kursübersicht mit Filtern | `joshi` | `docs/aufgaben/person-3.md` |
| Person 4: Kursseite, Inhaltsseite, Formulare, Validierung | `alea` | `docs/aufgaben/person-4.md` |

Zu Beginn jeder Sitzung nennt dir die Person ihre Rolle. Lies dann diese Datei und die passende Aufgaben-Datei. Prüfe mit `git branch --show-current`, ob der Branch dieser Person ausgecheckt ist. Wenn nicht, sag es, bevor du etwas änderst. Arbeite nur an den Dateien dieser Rolle. Brauchst du eine Änderung in einer Datei einer anderen Rolle, schlag sie vor und ändere sie nur nach Rückfrage.

## Projekt

Web-App für Studierende der Wirtschaftsinformatik (WI) an der DHBW Lörrach. Höhere Semester teilen Altklausuren, Cheatsheets, Aufschriebe, Kurs-Zusammenfassungen und kurze Tipps als PDF oder Markdown-Text. Kurse werden mit Sternen und einem Erfahrungsbericht bewertet. Hilfreiche Inhalte bekommen Daumen hoch und stehen dadurch weiter oben. Angemeldete Nutzer merken sich Kurse und Inhalte in einem privaten Dashboard. Die Gemini-API erzeugt aus den Inhalten eines Kurses ein Multiple-Choice-Quiz.

Gruppenprojekt im Fach Web-Programmierung. Bewertet werden Projektstruktur, Komponenten, Styling und Responsive Design, Landing Page, dynamische Kernfunktion, State Management, Routing sowie die Boni Datenbank, externe API und Validierung.

## Prüfungsvorgaben (dürfen nie brechen)

- Der Prüfer führt auf einem fremden Rechner nur `git clone`, `npm install` und `npm run dev` aus. Danach muss die App fehlerfrei laufen.
- `npm run build` muss ohne Fehler durchlaufen.
- Die App muss ohne `.env` und ohne Gemini-Key starten. Fehlt der Key, ist nur das Quiz deaktiviert.
- Die App ist eine Single-Page-Application. Kein Seitenwechsel lädt die Seite neu.
- Keine Baukastensysteme oder Komplettlösungen (kein Firebase, kein Supabase, keine Auth-Dienste, keine fertigen UI-Kits). Jede Zeile muss von uns erklärbar sein.

## Regeln für Claude Code

- Keine neuen npm-Pakete ohne Rückfrage. Erlaubt sind nur die Pakete unter „Tech-Stack“.
- Nur JavaScript, kein TypeScript. ES-Module (`import`/`export`) im ganzen Projekt.
- Immer die einfachste Lösung. Keine zusätzlichen Abstraktionsschichten außer denen, die hier beschrieben sind. Keine Hilfsdateien „für später“, keine Klassen, wo eine Funktion reicht.
- Kommentare auf Deutsch. Variablen, Funktionen und Dateinamen auf Englisch.
- Texte in der Oberfläche auf Deutsch. Fehlermeldungen sagen, was falsch ist und wie man es behebt.
- Bei größeren Aufgaben zuerst einen Plan vorlegen und auf Freigabe warten.
- Nach jedem Arbeitsschritt `npm run build` ausführen und Fehler beheben, bevor der Schritt als fertig gilt.
- Funktionen, Routen und Komponenten, die andere Rollen nutzen, genau so benennen und aufbauen wie unter „Schnittstellen“ beschrieben.
- Am Ende jeder Aufgabe kurz erklären, was geändert wurde und warum, so dass die Person es in der Prüfung erklären kann.

## Tech-Stack

Node.js ab Version 24 (Vorgabe des Kurses, in `package.json` unter `engines` eintragen). Ein einziges `package.json` im Hauptordner, `"type": "module"`.

| Bereich | Paket | Zweck |
| --- | --- | --- |
| Frontend | `react`, `react-dom` | Oberfläche |
| Frontend | `react-router-dom` | Routing im Browser |
| Frontend | `axios` | HTTP-Anfragen an das Backend |
| Frontend | `react-markdown` | Text-Inhalte als Markdown anzeigen (rendert kein rohes HTML) |
| Build | `vite`, `@vitejs/plugin-react` | Dev-Server und Build |
| Styling | `tailwindcss`, `@tailwindcss/vite` | Tailwind CSS v4 |
| Backend | `express` | REST-API |
| Backend | `express-session` | Login per Session-Cookie |
| Backend | `bcryptjs` | Passwort-Hashing (reines JavaScript, kein natives Modul) |
| Backend | `multer` | PDF-Upload über `multipart/form-data` |
| Dev | `concurrently` | Frontend und Backend mit einem Befehl starten |

- Die Datenbank läuft über das eingebaute Modul `node:sqlite` von Node.js, ohne npm-Paket. Damit muss beim `npm install` auf dem Prüfungsrechner nichts kompiliert werden. In Node 24 gilt das Modul noch als experimentell und gibt beim Start eine Warnung aus, die die Skripte mit `--disable-warning=ExperimentalWarning` ausblenden.
- Gemini wird ohne SDK mit dem eingebauten `fetch` von Node aufgerufen.
- `.env` wird ohne `dotenv` mit `process.loadEnvFile()` gelesen (in `try/catch`, weil die Datei fehlen darf).
- Kein `cors`-Paket: Im Dev-Betrieb leitet Vite `/api` per Proxy an Express weiter, nach dem Build liefert Express das Frontend selbst aus. Frontend und API laufen damit immer unter derselben Adresse, es gibt keine Cross-Origin-Anfragen.
- Der PDF-Viewer nutzt den eingebauten Viewer des Browsers (`<iframe>`), kein Paket.

## Skripte in package.json

```json
"scripts": {
  "dev": "concurrently -n api,web -c blue,green \"node --watch --disable-warning=ExperimentalWarning server/index.js\" \"vite\"",
  "build": "vite build",
  "start": "node --disable-warning=ExperimentalWarning server/index.js",
  "seed:export": "node --disable-warning=ExperimentalWarning server/export-seed.js"
}
```

- Vite läuft auf Port 5173, Express auf Port 3001.
- `vite.config.js` leitet `/api` per Proxy an `http://localhost:3001` weiter.
- Nach `npm run build` liefert `npm start` den Ordner `dist/` über Express aus, mit Fallback auf `index.html` für alle Routen außerhalb von `/api`.
- `package-lock.json` kommt ins Repo.

## Ordnerstruktur

Die Zahl in Klammern ist die verantwortliche Person.

```
/
├── CLAUDE.md
├── README.md                     (1) Startanleitung, Testkonten, Hinweis zum Gemini-Key
├── package.json                  (1)
├── vite.config.js                (1)
├── index.html                    (1)
├── .env.example                  (1) GEMINI_API_KEY=, GEMINI_MODEL=, SESSION_SECRET=
├── .gitignore                    (1) node_modules, dist, .env, server/data, server/uploads
├── .github/workflows/build.yml   (1) npm ci und npm run build bei jedem Push
├── docs/
│   ├── aufgaben/                 Aufgaben-Dateien der vier Rollen
│   └── er-diagramm.md            (2) ER-Diagramm als Mermaid
├── shared/
│   ├── constants.js              (4) Typen, Kategorien, Grenzwerte
│   └── validation.js             (4) Prüffunktionen für Frontend und Backend
├── server/
│   ├── index.js                  (3) Express-App, Session, Routen, Fehlerbehandlung, dist ausliefern
│   ├── middleware.js             (3) requireLogin, requireAdmin
│   ├── gemini.js                 (3) Aufruf der Gemini-API
│   ├── routes/                   (3)
│   │   ├── auth.js
│   │   ├── courses.js
│   │   ├── contents.js
│   │   ├── ratings.js
│   │   ├── me.js
│   │   ├── reports.js
│   │   ├── stats.js
│   │   └── ai.js
│   ├── db.js                     (2) Verbindung, Schema anlegen, Startdaten beim ersten Start
│   ├── schema.sql                (2)
│   ├── queries/                  (2) alle SQL-Abfragen als Funktionen
│   │   ├── users.js
│   │   ├── courses.js
│   │   ├── contents.js
│   │   ├── ratings.js
│   │   ├── favorites.js
│   │   ├── reports.js
│   │   └── stats.js
│   ├── files.js                  (2) PDF annehmen, prüfen, speichern, löschen, ausliefern
│   ├── seed.js                   (2) Startdaten einlesen
│   ├── export-seed.js            (2) aktuellen Datenbankstand nach server/seed/ schreiben
│   ├── seed/                     (2)
│   │   ├── data.json
│   │   └── files/
│   ├── data/                     app.db (wird beim Start erzeugt, nicht im Repo)
│   └── uploads/                  hochgeladene PDFs (wird beim Start erzeugt, nicht im Repo)
└── src/
    ├── main.jsx                  (1)
    ├── App.jsx                   (1) Router und Layout
    ├── index.css                 (1) Tailwind, Dark-Mode-Variante, Animationen
    ├── theme.js                  (1) Dark Mode lesen, setzen, speichern
    ├── api.js                    (3) axios-Instanz mit baseURL "/api"
    ├── context/
    │   └── AuthContext.jsx       (3) angemeldeter Nutzer, login, logout, register
    ├── pages/
    │   ├── LandingPage.jsx       (1)
    │   ├── RulesPage.jsx         (1)
    │   ├── DashboardPage.jsx     (1)
    │   ├── NotFoundPage.jsx      (1)
    │   ├── AdminPage.jsx         (2)
    │   ├── CoursesPage.jsx       (3)
    │   ├── RankingPage.jsx       (3)
    │   ├── CoursePage.jsx        (4)
    │   ├── ContentPage.jsx       (4)
    │   ├── UploadPage.jsx        (4)
    │   ├── LoginPage.jsx         (4)
    │   └── RegisterPage.jsx      (4)
    └── components/
        ├── Layout.jsx            (1) Navbar, Inhalt, Footer
        ├── Navbar.jsx            (1)
        ├── Footer.jsx            (1)
        ├── Button.jsx            (1)
        ├── Modal.jsx             (1)
        ├── Spinner.jsx           (1)
        ├── EmptyState.jsx        (1)
        ├── Alert.jsx             (1) Fehler- und Erfolgsmeldungen
        ├── TypeBadge.jsx         (1)
        ├── ThemeToggle.jsx       (1)
        ├── ProtectedRoute.jsx    (1)
        ├── ReportButton.jsx      (2)
        ├── CourseCard.jsx        (3)
        ├── ContentCard.jsx       (3)
        ├── FavoriteButton.jsx    (3)
        ├── FilterBar.jsx         (3)
        ├── Quiz.jsx              (3)
        ├── FormField.jsx         (4)
        ├── StarRating.jsx        (4)
        ├── DifficultySlider.jsx  (4)
        ├── RatingSummary.jsx     (4)
        ├── RatingForm.jsx        (4)
        ├── ExperienceList.jsx    (4) Erfahrungsberichte zu einem Kurs
        ├── UpvoteButton.jsx      (4)
        ├── PdfViewer.jsx         (4)
        └── MarkdownView.jsx      (4)
```

## Gemeinsame Konstanten (shared/constants.js)

Frontend und Backend importieren dieselben Werte.

```js
export const CONTENT_TYPES = ['altklausur', 'cheatsheet', 'aufschrieb', 'zusammenfassung', 'tipp'];
export const TYPE_LABELS = {
  altklausur: 'Altklausur', cheatsheet: 'Cheatsheet', aufschrieb: 'Aufschrieb',
  zusammenfassung: 'Zusammenfassung', tipp: 'Tipp'
};
export const RATING_CATEGORIES = ['vorlesung', 'uebungen', 'schwierigkeit', 'aufwand'];
export const REPORT_REASONS = [
  'Enthält Namen oder persönliche Daten',
  'Beleidigend oder herabsetzend',
  'Falsch oder irreführend',
  'Urheberrecht verletzt',
  'Sonstiges'
];
// Erlaubte Mail-Domains bei der Registrierung (Stufe 3)
export const ALLOWED_EMAIL_DOMAINS = ['sick.de', 'dhbw-loerrach.de'];
export const LIMITS = {
  usernameMin: 3, usernameMax: 20,       // nur a-z, 0-9, Punkt, Unterstrich, Bindestrich
  passwordMin: 8,
  titleMin: 5, titleMax: 100,
  sourceMax: 100,
  textMin: 30, textMax: 20000,
  commentMax: 1000,                      // Erfahrungsbericht zur Kursbewertung
  pdfMaxBytes: 10 * 1024 * 1024,
  examYearMin: 2015                      // Maximum ist das aktuelle Jahr
};
```

## Datenbank

SQLite über das eingebaute Modul `node:sqlite`, Datei `server/data/app.db`. Das Schema ist in der 3. Normalform: Themenfelder hängen über `content_topics` an Inhalten, Durchschnittswerte und Zählungen werden per SQL berechnet und nie gespeichert.

`db.js` legt beim Start den Ordner an, öffnet die Datenbank mit `new DatabaseSync(pfad)`, setzt `PRAGMA foreign_keys = ON`, führt `schema.sql` mit `db.exec` aus und ruft `seed.js` auf, wenn die Tabelle `courses` leer ist.

So wird `node:sqlite` benutzt:

```js
import { DatabaseSync } from 'node:sqlite';

const db = new DatabaseSync(dbPath);
db.exec('PRAGMA foreign_keys = ON');

// Prepared Statements: Platzhalter ? oder :name, nie Werte in den SQL-Text einsetzen
const findUser = db.prepare('SELECT id, username, role FROM users WHERE id = ?');
findUser.get(5);                       // eine Zeile oder undefined
db.prepare('SELECT * FROM courses').all();   // Array
const { lastInsertRowid, changes } = db.prepare('INSERT INTO courses (name, semester) VALUES (:name, :semester)')
  .run({ name: 'Datenbanken', semester: 2 });

// node:sqlite hat keine Transaktions-Hilfe wie better-sqlite3, deshalb diese Funktion in db.js
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
```

Alle Abfragen nur mit Prepared Statements. Niemals Eingaben per String in SQL einsetzen.

```sql
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
```

`UNIQUE (user_id, course_id, content_id)` verhindert in SQLite keine Duplikate, wenn eine Spalte NULL ist. Vor dem Einfügen eines Favoriten deshalb prüfen, ob er schon existiert.

## Startdaten (Seed)

Die App startet mit unseren echten Inhalten. Wir laden die vorhandenen Altklausuren am Anfang über die App hoch und übernehmen diesen Stand vor der Abgabe als Startdaten ins Repo. So sieht der Prüfer nach `git clone` genau unsere Daten.

1. Kurse und Themenfelder für WI stehen in `server/seed/data.json` (aus dem Modulhandbuch).
2. Inhalte werden ganz normal über die App hochgeladen. Vorher prüfen: keine Namen von Studierenden oder Dozierenden im PDF, auch nicht in den Dokumenteigenschaften (Autor, Titel).
3. `npm run seed:export` schreibt den aktuellen Stand der Datenbank nach `server/seed/data.json` und kopiert die PDFs aus `server/uploads/` nach `server/seed/files/`. Beides kommt ins Repo.
4. Beim ersten Start mit leerer Datenbank liest `seed.js` diese Datei ein und kopiert die PDFs nach `server/uploads/`.

Exportiert werden Kurse, Themenfelder, Inhalte mit Themenfeldern, Bewertungen, Daumen hoch und Benutzerkonten mit Passwort-Hash. Nicht exportiert werden Favoriten, Meldungen und Sessions.

`seed.js` legt außerdem die Testkonten `admin` (Rolle admin) und `test` (Rolle user) mit Passwort `demo1234` an, falls sie fehlen. Ist die Liste der Meldungen leer, legt es eine Beispielmeldung an, damit die Admin-Seite in der Demo etwas zeigt.

Das GitHub-Repo muss privat sein, weil echte Altklausuren darin liegen. Den Prüfer als Mitglied hinzufügen, damit er klonen kann.

## API-Routen

Alle Routen beginnen mit `/api` und antworten mit JSON.

Fehlerformat: `{ "error": "Text für die Oberfläche", "fields": { "title": "Der Titel braucht mindestens 5 Zeichen." } }`. `fields` nur bei Validierungsfehlern.

Statuscodes: 200 OK, 201 angelegt, 204 ohne Inhalt, 400 fehlerhafte Eingabe, 401 nicht angemeldet, 403 keine Berechtigung, 404 nicht gefunden, 409 Konflikt (z. B. Benutzername vergeben), 500 unerwarteter Serverfehler, 502 Gemini-Fehler, 503 Gemini nicht eingerichtet.

| Methode | Pfad | Zugriff | Zweck |
| --- | --- | --- | --- |
| POST | `/auth/register` | alle | Konto anlegen und direkt anmelden |
| POST | `/auth/login` | alle | Anmelden |
| POST | `/auth/logout` | angemeldet | Abmelden |
| GET | `/auth/me` | alle | Angemeldeter Nutzer oder `null` |
| GET | `/stats` | alle | Zahlen für die Landing Page: Kurse, Inhalte, Altklausuren, Bewertungen, Daumen hoch |
| GET | `/courses` | alle | Alle Kurse mit Themenfeldern, Durchschnittswerten, Anzahl Bewertungen und Inhalte, Favorit-Status. Gefiltert wird im Frontend |
| GET | `/courses/:id` | alle | Kurs mit Themenfeldern, Durchschnittswerten und Favorit-Status |
| GET | `/courses/:id/contents?type=&topic=&sort=votes\|new` | alle | Inhalte eines Kurses, gefiltert und sortiert |
| GET | `/courses/:id/ratings` | alle | Erfahrungsberichte ohne Benutzernamen und ohne `user_id`, plus eigene Bewertung falls angemeldet |
| PUT | `/courses/:id/ratings/me` | angemeldet | Eigene Bewertung anlegen oder ändern |
| DELETE | `/ratings/:id` | admin | Bewertung löschen |
| POST | `/courses/:id/quiz` | angemeldet | Quiz aus Themenfeldern und Text-Inhalten des Kurses erzeugen, optional `{ topicId }` |
| GET | `/contents/ranking?type=` | alle | Top 20 aller Inhalte nach Daumen hoch |
| GET | `/contents/:id` | alle | Ein Inhalt mit Themenfeldern, Anzahl Daumen hoch, eigenem Daumen und Favorit-Status |
| GET | `/contents/:id/file` | alle | PDF ausliefern (`Content-Type: application/pdf`, `Content-Disposition: inline`) |
| POST | `/contents` | angemeldet | Inhalt anlegen (`multipart/form-data`) |
| DELETE | `/contents/:id` | Ersteller oder admin | Inhalt löschen, PDF-Datei mit löschen |
| POST | `/contents/:id/upvote` | angemeldet | Daumen hoch setzen |
| DELETE | `/contents/:id/upvote` | angemeldet | Daumen hoch zurücknehmen |
| GET | `/me/favorites` | angemeldet | Gemerkte Kurse und Inhalte |
| PUT | `/me/favorites/courses/:id` | angemeldet | Kurs merken |
| DELETE | `/me/favorites/courses/:id` | angemeldet | Kurs nicht mehr merken |
| PUT | `/me/favorites/contents/:id` | angemeldet | Inhalt merken |
| DELETE | `/me/favorites/contents/:id` | angemeldet | Inhalt nicht mehr merken |
| GET | `/me/uploads` | angemeldet | Eigene Uploads |
| POST | `/reports` | angemeldet | Inhalt oder Erfahrungsbericht melden (`contentId` oder `ratingId`, `reason`) |
| GET | `/admin/reports` | admin | Offene Meldungen, gruppiert nach Inhalt bzw. Erfahrungsbericht |
| DELETE | `/admin/reports?contentId=` oder `?ratingId=` | admin | Meldungen verwerfen |
| GET | `/ai/status` | alle | `{ "enabled": true/false }` |
| PUT | `/admin/ai-key` | admin | Gemini-Key für die laufende Sitzung setzen |

## Frontend-Routen

| Pfad | Seite | Person |
| --- | --- | --- |
| `/` | LandingPage: Zweck, Live-Statistik, interaktive Funktions-Vorschau, beste Inhalte | 1 |
| `/regeln` | RulesPage: Nutzungsregeln, gespeicherte Daten, Melden | 1 |
| `/dashboard` | DashboardPage (angemeldet): gemerkte Kurse, gemerkte Inhalte, eigene Uploads | 1 |
| `/kurse` | CoursesPage: Suche und Filter in Echtzeit | 3 |
| `/rangliste` | RankingPage: Rangliste der Inhalte | 3 |
| `/kurse/:id` | CoursePage: Inhalte, Tipps, Bewertung, Erfahrungsberichte, Quiz | 4 |
| `/inhalte/:id` | ContentPage: PDF-Viewer oder Markdown, Daumen hoch, Merken, Melden | 4 |
| `/hochladen` | UploadPage (angemeldet), optional `?kurs=` | 4 |
| `/login`, `/registrieren` | LoginPage, RegisterPage | 4 |
| `/admin` | AdminPage (admin): Meldungen, Gemini-Key | 2 |
| `*` | NotFoundPage | 1 |

Seiten, die einen Login brauchen, laufen über `ProtectedRoute`. Nicht angemeldete Nutzer landen auf `/login` und nach dem Login wieder auf der ursprünglichen Seite.

## Schnittstellen zwischen den Rollen

Diese Namen und Formen gelten für alle. Wer eine Schnittstelle ändern will, spricht vorher mit der Gruppe.

### Person 2 liefert an Person 3: Abfragefunktionen in `server/queries/`

Jede Funktion ist synchron (`node:sqlite` mit `DatabaseSync`) und gibt einfache Objekte oder Arrays zurück. `userId` darf `null` sein (nicht angemeldet).

| Datei | Funktionen |
| --- | --- |
| `users.js` | `findUserByUsername(username)`, `findUserById(id)`, `createUser({ username, passwordHash, role, emailDomain })` |
| `courses.js` | `listCourses(userId)`, `getCourse(id, userId)`, `listTopics(courseId)` |
| `contents.js` | `listCourseContents(courseId, { type, topicId, sort }, userId)`, `getContent(id, userId)`, `createContent(data, topicIds)` (in einer Transaktion), `deleteContent(id)` (gibt `file_name` zurück), `listRanking(type, limit)`, `listUserUploads(userId)`, `addUpvote(contentId, userId)`, `removeUpvote(contentId, userId)`, `getQuizMaterial(courseId, topicId)` |
| `ratings.js` | `listCourseRatings(courseId)`, `getUserRating(courseId, userId)`, `upsertRating(courseId, userId, data)`, `deleteRating(id)` |
| `favorites.js` | `listFavorites(userId)`, `addFavorite(userId, { courseId, contentId })`, `removeFavorite(userId, { courseId, contentId })` |
| `reports.js` | `createReport(userId, { contentId, ratingId, reason })`, `listOpenReports()`, `dismissReports({ contentId, ratingId })` |
| `stats.js` | `getStats()` |

### Person 2 liefert an Person 3: Datei-Handling in `server/files.js`

- `uploadPdf`: multer-Middleware (`memoryStorage`, Limit `LIMITS.pdfMaxBytes`, Feldname `file`)
- `savePdf(buffer)` prüft die Signatur am Dateianfang, speichert unter `server/uploads/<crypto.randomUUID()>.pdf` und gibt den Dateinamen zurück. Ist es kein PDF, wirft die Funktion einen Fehler mit `status = 400`. Die Prüfung, ohne zusätzliches Paket:

```js
// Jede PDF-Datei beginnt mit den 5 Bytes "%PDF-" (die sogenannte Magic Number).
// multer mit memoryStorage liefert die Datei als Buffer in req.file.buffer.
function isPdf(buffer) {
  return buffer.length >= 5 && buffer.subarray(0, 5).toString('latin1') === '%PDF-';
}
```
- `deletePdf(fileName)`
- `sendPdf(res, content)` liefert die Datei mit den richtigen Headern aus.

### Person 4 liefert an Person 3 und an das Frontend: `shared/validation.js`

Jede Funktion bekommt ein Objekt und gibt ein Fehler-Objekt zurück, z. B. `{ title: 'Der Titel braucht mindestens 5 Zeichen.' }`. Ein leeres Objekt heißt: alles in Ordnung.

- `validateRegister({ username, password, passwordRepeat, acceptedRules, email })`
- `validateLogin({ username, password })`
- `validateContent({ courseId, type, title, topicIds, format, text, file, examYear, source, noNames }, courseTopicIds)` – `file` ist `{ name, size }`
- `validateRating({ vorlesung, uebungen, schwierigkeit, aufwand, comment })`
- `validateReport({ reason })`

Im Backend ruft Person 3 dieselben Funktionen auf und antwortet bei Fehlern mit 400 und `fields`.

### Person 3 liefert an das Frontend

- `src/api.js`: `export default api` (axios-Instanz, `baseURL: '/api'`) und `export function getErrorMessage(error)`, die aus einer axios-Fehlermeldung den Text aus `error` holt.
- `src/context/AuthContext.jsx`: `AuthProvider` und `useAuth()` mit `{ user, loading, login(username, password), register(data), logout() }`.
- `ContentCard`, `CourseCard`, `FavoriteButton` mit den Props aus `docs/aufgaben/person-3.md`.

### Person 1 liefert an alle: Basis-Komponenten

`Button`, `Modal`, `Spinner`, `EmptyState`, `Alert`, `TypeBadge`, `Layout`, `ProtectedRoute` mit den Props aus `docs/aufgaben/person-1.md`. Alle Farben über Tailwind-Klassen mit `dark:`-Variante.

## State Management

- `AuthContext` hält den angemeldeten Nutzer. Beim Start der App einmal `GET /api/auth/me` aufrufen.
- Das Farbschema (hell oder dunkel) steht in `theme.js` und wird in `localStorage` gespeichert.
- Alles andere ist lokaler State der jeweiligen Seite (`useState`, `useEffect`, `useMemo`). Kein Redux, keine weitere globale Datenhaltung.
- Daumen hoch und Merken aktualisieren die Anzeige sofort und nehmen die Änderung zurück, wenn der Server einen Fehler meldet.

## Validierung

Jede Eingabe wird im Frontend geprüft (Fehler direkt am Feld) und im Backend noch einmal mit denselben Funktionen aus `shared/validation.js`.

- Benutzername: 3 bis 20 Zeichen, nur `a-z`, `0-9`, `.`, `_`, `-`; wird kleingeschrieben gespeichert
- Passwort: mindestens 8 Zeichen, Wiederholung muss übereinstimmen
- Registrierung: Checkbox „Ich habe die Regeln gelesen und halte mich daran“ muss gesetzt sein
- E-Mail bei der Registrierung (Stufe 3): Pflichtfeld, gültiges Format, Domain muss in `ALLOWED_EMAIL_DOMAINS` stehen. Gespeichert wird nur die Domain, es wird keine Bestätigungsmail verschickt.
- Titel: 5 bis 100 Zeichen
- Quelle: optional, höchstens 100 Zeichen
- Text-Inhalt und Tipp: 30 bis 20.000 Zeichen
- Typ `tipp` nur als Text, nicht als PDF
- PDF: Endung `.pdf`, höchstens 10 MB; im Backend zusätzlich Prüfung auf `%PDF-` am Dateianfang
- Kurs muss existieren, mindestens ein Themenfeld, alle Themenfelder gehören zum Kurs
- Jahr der Klausur nur bei Typ `altklausur`: 2015 bis aktuelles Jahr
- Alle vier Bewertungskategorien 1 bis 5, Erfahrungsbericht optional, höchstens 1.000 Zeichen
- Upload: Checkbox „enthält keine Namen von Studierenden oder Dozierenden“ muss gesetzt sein

## Sicherheit

- Passwörter nur als Hash mit `bcryptjs` (Kostenfaktor 10).
- Session-Cookie: `httpOnly`, `sameSite: 'lax'`. Secret aus `SESSION_SECRET`, sonst beim Start zufällig erzeugt. Nach einem Neustart sind alle abgemeldet, das ist in Ordnung.
- `requireLogin` und `requireAdmin` schützen alle Routen mit Zugriff „angemeldet“ bzw. „admin“.
- Erfahrungsberichte werden ohne Benutzername und ohne `user_id` ausgeliefert.
- `react-markdown` ohne `rehype-raw`, damit kein HTML aus Inhalten ausgeführt wird.
- Der Originalname einer PDF wird nie als Dateipfad verwendet.
- Gespeichert werden nur Benutzername (Pseudonym), Passwort-Hash, Rolle und ab Stufe 3 die Mail-Domain. Keine vollständige E-Mail-Adresse, kein Klarname. Die Seite `/regeln` beschreibt genau diese Daten.

## Gemini-Anbindung

Datei `server/gemini.js` (Person 3). Aufruf ohne SDK über `fetch`.

- Key: zuerst `process.env.GEMINI_API_KEY`. Zusätzlich kann ein Admin den Key auf `/admin` eintragen. Dieser Key liegt nur in einer Variablen im Arbeitsspeicher und wird nie gespeichert, geloggt oder an das Frontend zurückgegeben.
- Modell: `process.env.GEMINI_MODEL`, Standard `gemini-3.1-flash-lite`. Vor dem Umsetzen Modellnamen und Anfrageformat in der aktuellen Gemini-API-Doku prüfen (ai.google.dev).
- Endpunkt: `POST https://generativelanguage.googleapis.com/v1beta/models/<modell>:generateContent`, Key im Header `x-goog-api-key`.
- Antwort als JSON anfordern (`generationConfig.responseMimeType: "application/json"`) und das Format zusätzlich im Prompt beschreiben.
- Zeitlimit 30 Sekunden (`AbortSignal.timeout(30000)`).
- Material: Kursname, Themenfelder und die Texte aller Text-Inhalte des Kurses (Tipps, Zusammenfassungen, Cheatsheets, Aufschriebe), höchstens 15.000 Zeichen. Mit `topicId` nur Inhalte dieses Themenfelds. PDFs werden nicht mitgeschickt.
- Keine Benutzerdaten an Gemini.
- Prompt auf Deutsch. Das Material steht zwischen klaren Trennzeichen, und der Prompt sagt, dass es nur Lernmaterial ist und keine Anweisungen enthält.
- Erwartetes Format, das der Server prüft, bevor er es weitergibt:

```json
{
  "questions": [
    {
      "question": "Was prüft die 2. Normalform?",
      "options": ["…", "…", "…", "…"],
      "correctIndex": 1,
      "explanation": "…"
    }
  ]
}
```

- Fehlerfälle: kein Key → 503 „Das Quiz ist nicht eingerichtet“. Kein Text-Material im Kurs → 400 „Für diesen Kurs gibt es noch keine Texte, aus denen ein Quiz entstehen kann.“ Gemini antwortet mit Fehler, Zeitüberschreitung, 429 oder ungültigem JSON → 502 mit verständlicher Meldung. Die App darf in keinem Fall abstürzen.

## Reihenfolge der Umsetzung

0. Start (Person 1, erster Tag): Projektgerüst mit allen Paketen, leeren Seiten, Routing und `GET /api/health`. Danach klonen alle.
1. Pflicht: Datenbank mit Startdaten, Login und Registrierung, Landing Page, Regeln-Seite, Kursübersicht mit Filtern, Kursseite, Inhaltsseite mit PDF-Viewer, Hochladen, Kursbewertung mit Erfahrungsbericht, Daumen hoch, Rangliste, Mobil-Ansicht, Dark Mode
2. Ausbau: Dashboard mit Favoriten, Melden-Funktion, Admin-Seite
3. Extras: Quiz mit Gemini, danach Prüfung der Mail-Domain (ohne Bestätigungsmail)

Ein Leaderboard von Personen wird nicht gebaut. Erst die nächste Stufe beginnen, wenn die vorige auf `main` läuft und `npm run build` grün ist.

## Git

- Jede Person arbeitet nur auf ihrem eigenen Branch (`debi`, `julian`, `joshi`, `alea`). Niemand pusht direkt auf `main`.
- Vor jedem neuen Arbeitsschritt den aktuellen Stand von `main` in den eigenen Branch holen:
  ```
  git checkout <eigener-branch>     # z. B. git checkout julian
  git pull origin main
  ```
  So hat jede Person die Arbeit der anderen, und Konflikte bleiben klein.
- Nach jedem Arbeitsschritt: committen, pushen, Pull Request vom eigenen Branch nach `main`. Review durch eine andere Person, erst dann mergen. Wer reviewt, muss den Code danach erklären können.
- Konflikte löst die Person, die den Pull Request stellt, auf ihrem eigenen Branch.
- Mindestens alle zwei bis drei Tage nach `main` mergen, nicht erst am Ende. Ein persönlicher Branch, der wochenlang nicht gemergt wird, führt kurz vor der Abgabe zu großen Konflikten.
- Die GitHub Action führt bei jedem Push `npm ci` und `npm run build` aus. Ein roter Build wird zuerst behoben.
- Vor der Abgabe den kompletten Ablauf `git clone`, `npm install`, `npm run dev` auf einem Rechner testen, auf dem noch nicht entwickelt wurde.
