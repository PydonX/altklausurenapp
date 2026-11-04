# Person 2: Datenbank, Datei-Handling und Startdaten

Du baust alles, was Daten dauerhaft speichert: das Datenbankschema, die SQL-Abfragen, die Speicherung der PDFs und die Startdaten, mit denen die App nach `git clone` sofort gefüllt ist. Dazu kommen die Melden-Funktion und die Admin-Seite, weil dort Daten gelöscht werden.

Präsentations-Part: Datenbank-Anbindung und Datenmodellierung.

Die allgemeinen Regeln, das Schema und alle API-Routen stehen in `CLAUDE.md`. Diese Datei beschreibt nur deinen Teil. Du arbeitest auf dem Branch `julian`. Jeder Schritt unten endet mit einem Pull Request von `julian` nach `main`.

## Deine Dateien

- `server/db.js`, `server/schema.sql`
- `server/queries/`: `users.js`, `courses.js`, `contents.js`, `ratings.js`, `favorites.js`, `reports.js`, `stats.js`
- `server/files.js`
- `server/seed.js`, `server/export-seed.js`, `server/seed/data.json`, `server/seed/files/`
- `docs/er-diagramm.md`
- `src/pages/AdminPage.jsx`, `src/components/ReportButton.jsx`

Person 3 schreibt die Routen und ruft deine Funktionen auf. Du schreibst kein SQL in Routen und Person 3 keins in Abfragefunktionen.

## Schritt 1: Schema und ER-Diagramm (direkt nach dem Projektgerüst)

Auf `julian`, eigener Pull Request nach `main`.

- `server/schema.sql` genau wie in `CLAUDE.md`.
- `server/db.js`:
    - Ordner `server/data/` und `server/uploads/` anlegen, falls sie fehlen (`fs.mkdirSync(..., { recursive: true })`)
    - Datenbank öffnen, `PRAGMA foreign_keys = ON`, `PRAGMA journal_mode = WAL`
    - `schema.sql` mit `db.exec` ausführen
    - Ist `courses` leer, `seed(db)` aus `seed.js` aufrufen
    - `export default db`
- `docs/er-diagramm.md`: ER-Diagramm als Mermaid-Block (`erDiagram`) mit allen Tabellen, Schlüsseln und Beziehungen. GitHub zeigt es direkt als Grafik an. Das Diagramm nutzt du in der Präsentation.

Fertig, wenn ein Neustart ohne `app.db` die Datenbank mit allen Tabellen anlegt.

## Schritt 2: Abfragefunktionen

Auf `julian`, eigener Pull Request nach `main`. Person 3 wartet darauf, deshalb `users.js` zuerst als eigenen kleinen Pull Request liefern, damit Login und Registrierung starten können.

Regeln für alle Funktionen:

- Nur Prepared Statements. Statements einmal pro Datei vorbereiten, nicht bei jedem Aufruf.
- Rückgabe in camelCase: `SELECT created_at AS createdAt`.
- Durchschnittswerte und Zählungen per SQL (`AVG`, `COUNT`, `GROUP BY`), nie gespeichert.
- `userId` darf `null` sein. Dann sind `hasUpvoted` und `isFavorite` immer `false`.
- Mehrere Schreibbefehle, die zusammengehören, in `withTransaction(() => { ... })` aus `db.js` (siehe `CLAUDE.md`). `node:sqlite` hat keine eingebaute Transaktions-Hilfe.

| Funktion | Rückgabe |
| --- | --- |
| `findUserByUsername(username)` | `{ id, username, passwordHash, role }` oder `undefined` |
| `findUserById(id)` | `{ id, username, role }` oder `undefined` |
| `createUser({ username, passwordHash, role = 'user', emailDomain = null })` | neue `id` |
| `listCourses(userId)` | `[{ id, name, semester, studiengang, topics: [{ id, name }], ratingCount, avg: { vorlesung, uebungen, schwierigkeit, aufwand } oder null, contentCount, isFavorite }]` |
| `getCourse(id, userId)` | ein Objekt wie bei `listCourses` oder `undefined` |
| `listTopics(courseId)` | `[{ id, name }]` |
| `listCourseContents(courseId, { type, topicId, sort }, userId)` | `[{ id, type, title, format, examYear, source, createdAt, author, topics: [{ id, name }], upvotes, hasUpvoted, isFavorite }]`. `sort = 'votes'`: Daumen hoch absteigend, bei Gleichstand neueste zuerst. `sort = 'new'`: neueste zuerst. `author` ist der Benutzername oder `null`. |
| `getContent(id, userId)` | wie oben plus `courseId`, `courseName`, `userId`, `bodyText`, `fileName`, `originalName`, `fileSize`, oder `undefined` |
| `createContent(data, topicIds)` | neue `id`. Inhalt und Einträge in `content_topics` in einer Transaktion |
| `deleteContent(id)` | `fileName` oder `null`. Durch `ON DELETE CASCADE` verschwinden Daumen, Favoriten und Meldungen mit. |
| `listRanking(type, limit = 20)` | wie `listCourseContents` plus `courseId`, `courseName` |
| `listUserUploads(userId)` | wie `listRanking`, neueste zuerst |
| `addUpvote(contentId, userId)` | `INSERT OR IGNORE`, kein Fehler bei doppeltem Klick |
| `removeUpvote(contentId, userId)` | – |
| `getQuizMaterial(courseId, topicId)` | `{ courseName, topics: ['…'], texts: [{ type, title, bodyText }] }`, nur Inhalte mit `format = 'text'`, beste zuerst |
| `listCourseRatings(courseId)` | `[{ id, vorlesung, uebungen, schwierigkeit, aufwand, comment, createdAt }]`, nur Einträge mit Erfahrungsbericht, ohne `user_id`, neueste zuerst |
| `getUserRating(courseId, userId)` | eigene Bewertung oder `undefined` |
| `upsertRating(courseId, userId, data)` | `INSERT … ON CONFLICT (course_id, user_id) DO UPDATE`, setzt `updated_at` |
| `deleteRating(id)` | – |
| `listFavorites(userId)` | `{ courses: [...], contents: [...] }` in denselben Formen wie `listCourses` und `listRanking` |
| `addFavorite(userId, { courseId, contentId })` | prüft vorher, ob es den Favoriten schon gibt (NULL in `UNIQUE`, siehe `CLAUDE.md`) |
| `removeFavorite(userId, { courseId, contentId })` | – |
| `createReport(userId, { contentId, ratingId, reason })` | neue `id` |
| `listOpenReports()` | `[{ contentId, ratingId, label, courseName, count, reasons: [{ reason, count }], latestAt }]`. `label` ist der Titel des Inhalts bzw. die ersten 120 Zeichen des Erfahrungsberichts. |
| `dismissReports({ contentId, ratingId })` | löscht alle Meldungen zu diesem Eintrag |
| `getStats()` | `{ courses, contents, exams, ratings, upvotes }` |

Teste jede Funktion einmal mit einem kurzen Skript oder über die Routen von Person 3, bevor du den Pull Request stellst.

## Schritt 3: Datei-Handling

Auf `julian`, eigener Pull Request nach `main`. Schnittstelle für Person 3:

- `uploadPdf`: `multer({ storage: multer.memoryStorage(), limits: { fileSize: LIMITS.pdfMaxBytes } }).single('file')`
- `savePdf(buffer)`: prüft mit `isPdf(buffer)` aus `CLAUDE.md`, ob die ersten 5 Bytes `%PDF-` sind. Wenn nicht, `const err = new Error('Die Datei ist kein gültiges PDF.'); err.status = 400; throw err;`. Sonst speichern unter `server/uploads/<crypto.randomUUID()>.pdf`, Rückgabe des Dateinamens.
- `deletePdf(fileName)`: Datei löschen, fehlende Datei ist kein Fehler.
- `sendPdf(res, content)`: `Content-Type: application/pdf`, `Content-Disposition: inline; filename="<originalName>"` (Anführungszeichen im Namen entfernen), dann `res.sendFile` mit absolutem Pfad. Fehlt die Datei, 404.

Der Originalname wird nie als Pfad benutzt, nur der UUID-Name aus der Datenbank.

## Schritt 4: Startdaten und Export

Auf `julian`, eigener Pull Request nach `main`.

### Format von `server/seed/data.json`

Ein Objekt mit einem Array pro Tabelle, Spaltennamen wie in der Datenbank:

```json
{
  "users": [],
  "courses": [{ "id": 1, "name": "Datenbanken", "studiengang": "WI", "semester": 2 }],
  "topics": [{ "id": 1, "course_id": 1, "name": "SQL" }],
  "contents": [],
  "content_topics": [],
  "ratings": [],
  "upvotes": []
}
```

Die IDs aus dem Export bleiben beim Einlesen erhalten. Weil die Datenbank beim Einlesen leer ist, gibt es keine Konflikte, und alle Verweise stimmen.

### `seed.js`

- `export function seed(db)`, aufgerufen von `db.js`
- Tabellen in dieser Reihenfolge einfügen, alles in einer Transaktion: `users`, `courses`, `topics`, `contents`, `content_topics`, `ratings`, `upvotes`
- PDFs aus `server/seed/files/` nach `server/uploads/` kopieren, wenn sie dort fehlen
- Testkonten `admin` (Rolle admin) und `test` (Rolle user) mit Passwort `demo1234` anlegen, falls es den Benutzernamen noch nicht gibt (Hash mit `bcryptjs`)
- Gibt es Inhalte, aber keine Meldung, eine Beispielmeldung für den ersten Inhalt anlegen
- Am Ende eine Zeile ins Terminal: wie viele Kurse und Inhalte eingelesen wurden

### Erste Fassung der Kurse

Zu Beginn enthält `data.json` nur Kurse und Themenfelder. Die Kursliste für WI an der DHBW Lörrach mit Semester und 3 bis 5 Themenfeldern pro Kurs stellt ihr als Gruppe aus dem Modulhandbuch zusammen. Du trägst sie ein.

### `export-seed.js` (`npm run seed:export`)

- Liest alle Tabellen aus dem Abschnitt oben mit `SELECT *` und schreibt `data.json` (mit Einrückung, damit Git-Diffs lesbar sind)
- Kopiert alle PDFs, auf die `contents.file_name` verweist, nach `server/seed/files/`. Nicht mehr verwendete PDFs dort löschen.
- Favoriten, Meldungen und Sessions werden nicht exportiert.
- Gibt am Ende aus, wie viele Einträge pro Tabelle exportiert wurden.

Ablauf vor der Abgabe: alle laden ihre echten Inhalte hoch, du führst `npm run seed:export` aus, prüfst die PDFs auf Namen (auch Dokumenteigenschaften) und committest `server/seed/`.

## Schritt 5: Melden und Admin-Seite (Stufe 2)

Auf `julian`, eigener Pull Request nach `main`, sobald Person 3 die Report-Routen hat.

### `ReportButton`

- Props: `contentId` oder `ratingId`
- Unauffälliger Button „Melden“. Nicht angemeldet → Weiterleitung auf `/login`.
- Öffnet ein `Modal` (Person 1) mit Auswahl aus `REPORT_REASONS`, Senden über `POST /api/reports`.
- Danach Erfolgsmeldung im Modal, Button zeigt „Gemeldet“.

### `AdminPage`

- Route mit `ProtectedRoute adminOnly`.
- Liste aus `GET /api/admin/reports`: Typ, Titel bzw. Auszug, Kurs, Anzahl und Gründe.
- Aktionen pro Eintrag: „Ansehen“ (Link auf `/inhalte/:id` bzw. `/kurse/:id`), „Meldung verwerfen“ (`DELETE /api/admin/reports?...`), „Löschen“ (`DELETE /api/contents/:id` bzw. `/api/ratings/:id`) mit Bestätigung im `Modal`. Danach verschwindet der Eintrag ohne Neuladen.
- Bereich „Quiz (Gemini)“: Status aus `GET /api/ai/status`, Eingabefeld `type="password"` für den Key, Speichern über `PUT /api/admin/ai-key`. Der Key wird nach dem Speichern nicht mehr angezeigt.
- Leere Liste → `EmptyState` „Keine offenen Meldungen“.

## Abhängigkeiten

| Du lieferst | An | Wann |
| --- | --- | --- |
| `queries/users.js` | Person 3 (Login) | so früh wie möglich |
| übrige Abfragefunktionen | Person 3 | direkt danach |
| `files.js` | Person 3 (Upload-Route) | vor dem Upload-Formular von Person 4 |
| Startdaten mit Kursen | alle | damit alle mit denselben Kursen testen |

| Du brauchst | Von |
| --- | --- |
| `LIMITS`, `REPORT_REASONS` | Person 4 (`shared/constants.js`) |
| `Modal`, `Button`, `EmptyState`, `ProtectedRoute` | Person 1 |
| Report-, Lösch- und AI-Routen | Person 3 |

## Fertig, wenn

- [ ] Löschen von `server/data/app.db` und Neustart ergibt eine gefüllte App
- [ ] Ein frischer Klon zeigt die exportierten Inhalte samt PDFs
- [ ] Alle Abfragefunktionen aus der Tabelle existieren mit genau diesen Namen und Rückgaben
- [ ] Kein SQL mit eingesetzten Strings, nur Platzhalter `?` oder `@name`
- [ ] Eine umbenannte Textdatei mit Endung `.pdf` wird abgelehnt, eine 11-MB-Datei auch
- [ ] Löschen eines Inhalts entfernt Daumen, Favoriten, Meldungen und die PDF-Datei
- [ ] ER-Diagramm in `docs/er-diagramm.md` stimmt mit `schema.sql` überein
- [ ] Admin kann Meldungen verwerfen und Inhalte löschen, normale Nutzer sehen `/admin` nicht

## Für die Prüfung erklären können

- Was bedeuten 1., 2. und 3. Normalform? Zeig an `content_topics`, warum Themenfelder eine eigene Tabelle haben.
- Warum werden Durchschnittswerte berechnet und nicht gespeichert?
- Was ist ein Fremdschlüssel, und was bewirkt `ON DELETE CASCADE`?
- Was ist SQL-Injection, und wie verhindern Prepared Statements sie?
- Warum SQLite und kein Datenbankserver wie MySQL oder MongoDB? Warum das eingebaute `node:sqlite` statt eines npm-Pakets wie `better-sqlite3`?
- Was ist eine Transaktion, und wo brauchst du eine?
- Wie läuft ein Upload ab: `multipart/form-data`, multer, Prüfung auf `%PDF-`, Speichern unter UUID? Warum reicht der MIME-Typ des Browsers nicht?
- Warum liegen PDFs als Dateien im Ordner und nicht in der Datenbank?
- Was passiert beim ersten Start auf dem Prüfungsrechner, bis die App gefüllt ist?

## Start-Prompt für Claude Code

```
Ich bin Person 2 (Datenbank, Datei-Handling, Startdaten).
Lies CLAUDE.md und docs/aufgaben/person-2.md.
Wir beginnen mit Schritt 1. Lege zuerst einen Plan vor und warte auf meine Freigabe.
Erkläre mir danach das Schema Tabelle für Tabelle, so dass ich es in der Prüfung erklären kann.
```

Für jeden weiteren Schritt: „Weiter mit Schritt N aus docs/aufgaben/person-2.md. Erst Plan, dann Freigabe.“
