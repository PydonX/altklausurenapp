# Person 3: REST-API, Gemini und Kursübersicht mit Filtern

Du verbindest Frontend und Datenbank: Du baust alle Express-Routen, den Login, die Anbindung an Gemini und die Kursübersicht, auf der Nutzer ohne Neuladen suchen und filtern. Im Frontend lieferst du `api.js` und `AuthContext`, die alle anderen benutzen.

Präsentations-Part: API-Kommunikation, asynchrone Datenflüsse (`async/await`, Promises) und Filter-State.

Die allgemeinen Regeln, das Schema und alle API-Routen stehen in `CLAUDE.md`. Diese Datei beschreibt nur deinen Teil. Du arbeitest auf dem Branch `joshi`. Jeder Schritt unten endet mit einem Pull Request von `joshi` nach `main`.

## Deine Dateien

- `server/index.js` (ab Schritt 1, Person 1 legt eine Minimalversion an), `server/middleware.js`, `server/gemini.js`
- `server/routes/`: `auth.js`, `courses.js`, `contents.js`, `ratings.js`, `me.js`, `reports.js`, `stats.js`, `ai.js`
- `src/api.js`, `src/context/AuthContext.jsx` (ersetzt den Platzhalter von Person 1)
- `src/pages/CoursesPage.jsx`, `src/pages/RankingPage.jsx`
- `src/components/`: `CourseCard.jsx`, `ContentCard.jsx`, `FavoriteButton.jsx`, `FilterBar.jsx`, `Quiz.jsx`

In Routen steht kein SQL. Du rufst die Funktionen aus `server/queries/` (Person 2) und die Prüfungen aus `shared/validation.js` (Person 4) auf.

## Schritt 1: Express-Grundgerüst und Login

Auf `joshi`, eigener Pull Request nach `main`. Braucht `queries/users.js` (Person 2) und `validateRegister`, `validateLogin` (Person 4).

### `server/index.js`

1. `try { process.loadEnvFile(); } catch {}`
2. `express.json()`
3. `express-session` mit `httpOnly`, `sameSite: 'lax'`, Secret aus `SESSION_SECRET` oder `crypto.randomBytes(32).toString('hex')`
4. Router unter `/api/...` einbinden
5. Unbekannte `/api`-Pfade → 404 `{ error: 'Diese Adresse gibt es nicht.' }`
6. Wenn `dist/` existiert: statisch ausliefern, alle anderen Pfade → `dist/index.html`
7. Zentrale Fehlerbehandlung (Middleware mit vier Parametern):
    - multer-Fehler `LIMIT_FILE_SIZE` → 400 „Die Datei ist größer als 10 MB.“
    - Fehler mit `err.status` → dieser Status und `err.message`
    - alles andere → Fehler ins Terminal, 500 „Ein unerwarteter Fehler ist aufgetreten.“
8. `app.listen(3001)` mit Ausgabe der Adresse

### `server/middleware.js`

- `requireLogin`: ohne `req.session.userId` → 401 „Bitte melde dich an.“
- `requireAdmin`: zusätzlich Rolle prüfen → 403 „Dafür brauchst du Admin-Rechte.“ Die Rolle immer aus der Datenbank lesen, nicht aus dem Frontend.

### `server/routes/auth.js`

- `register`: validieren, Benutzername kleinschreiben, vergeben → 409, Hash mit `bcryptjs` (Kostenfaktor 10), `createUser`, Session setzen, 201 mit `{ id, username, role }`. Ab Stufe 3 auch E-Mail prüfen und nur die Domain speichern.
- `login`: falscher Name oder falsches Passwort → beide Fälle dieselbe Meldung 401 „Benutzername oder Passwort stimmt nicht.“ Vor dem Setzen der Session `req.session.regenerate`.
- `logout`: `req.session.destroy`, 204.
- `me`: Nutzer oder `null`, nie den Hash.

### Frontend

- `src/api.js`: `axios.create({ baseURL: '/api' })` als `default`-Export und `getErrorMessage(error)`, die `error.response?.data?.error` oder „Keine Verbindung zum Server.“ zurückgibt.
- `AuthContext.jsx`: `AuthProvider` lädt beim Start `GET /auth/me`. `useAuth()` liefert `{ user, loading, login, register, logout }`. `login` und `register` geben bei Fehlern das Fehlerobjekt weiter, damit die Formulare von Person 4 die `fields` anzeigen können.

## Schritt 2: Alle übrigen Routen

Auf `joshi`, als mehrere kleine Pull Requests nach `main` (z. B. Kurse, Inhalte, Bewertungen, Favoriten, Meldungen).

Für jede Route aus `CLAUDE.md`:

- IDs aus der URL mit `Number()` umwandeln. Ungültige ID → 400, nicht gefunden → 404.
- Eingaben mit den Funktionen aus `shared/validation.js` prüfen. Bei Fehlern 400 mit `{ error: 'Bitte prüfe die markierten Felder.', fields }`.
- Erfolgreiches Anlegen → 201, Löschen → 204.

Besonderheiten:

- `GET /courses` gibt alle Kurse zurück. Suche und Filter laufen im Frontend (Schritt 3).
- `POST /contents`: `requireLogin`, dann `uploadPdf` aus `server/files.js`. Felder aus `multipart/form-data` kommen als Strings an: `topicIds` als JSON-String senden lassen und mit `JSON.parse` lesen, `noNames` als `'true'`. Bei PDF erst validieren, dann `savePdf`, dann `createContent`. Schlägt `createContent` fehl, die gespeicherte Datei mit `deletePdf` wieder löschen.
- `DELETE /contents/:id`: nur Ersteller oder Admin, sonst 403. Danach `deletePdf`.
- `GET /contents/:id/file`: `sendPdf` aus `server/files.js`.
- `GET /courses/:id/ratings`: `{ ratings: listCourseRatings(id), mine: getUserRating(id, userId) || null }`.
- Upvote und Favoriten sind idempotent: doppeltes Setzen oder Entfernen ist kein Fehler.

Teste jede Route einmal mit dem Browser bzw. mit `curl` (inklusive eines Fehlerfalls), bevor du den Pull Request stellst.

## Schritt 3: Kursübersicht mit Echtzeit-Filtern

Auf `joshi`, eigener Pull Request nach `main`.

### `CoursesPage`

- Lädt einmal `GET /api/courses` (Lade- und Fehlerzustand mit `Spinner` und `Alert` von Person 1).
- Filter-State:
    - `search`: Text, durchsucht Kursnamen und Themenfelder, Groß- und Kleinschreibung egal
    - `semesters`: Mehrfachauswahl 1 bis 6
    - `difficulty`: „alle“, „leicht“ (Durchschnitt bis 2,5), „mittel“ (bis 3,5), „schwer“ (über 3,5); Kurse ohne Bewertung nur bei „alle“
    - `sort`: Semester, Name, beste Vorlesungsbewertung, meiste Inhalte
- Die gefilterte Liste wird mit `useMemo` aus Kursliste und Filter-State berechnet. Kein Server-Aufruf beim Tippen.
- Filter-State steht zusätzlich in der URL (`useSearchParams`), damit ein Link mit Filtern geteilt werden kann und die Filter nach Neuladen erhalten bleiben.
- Anzeige „12 von 30 Kursen“, bei null Treffern `EmptyState` mit Button „Filter zurücksetzen“.

### Komponenten und ihre Props

| Komponente | Props | Verhalten |
| --- | --- | --- |
| `FilterBar` | `value` (Filter-Objekt), `onChange(neuesFilterObjekt)`, `onReset` | Suchfeld, Semester-Chips, Schwierigkeit, Sortierung. Auf dem Handy einklappbar. |
| `CourseCard` | `course` (Form aus `listCourses`) | Name, Semester, Durchschnitt Vorlesung und Schwierigkeit, Anzahl Inhalte, `FavoriteButton`, Link auf `/kurse/:id` |
| `ContentCard` | `content`, `showCourse`, `rank` | `TypeBadge`, Titel mit Link auf `/inhalte/:id`, Themenfelder, Datum, optional Kurs und Platz, `UpvoteButton` (Person 4) und `FavoriteButton` |
| `FavoriteButton` | `kind` (`course` oder `content`), `id`, `initial` | Stern. Ändert sich sofort, sendet `PUT` bzw. `DELETE` an `/api/me/favorites/...`, nimmt die Änderung bei Fehler zurück. Nicht angemeldet → `/login`. |

Solange `UpvoteButton` von Person 4 fehlt, zeigt `ContentCard` nur die Zahl.

### `RankingPage`

- `GET /api/contents/ranking?type=` mit Typ-Auswahl als Chips, Liste aus `ContentCard` mit `rank` und `showCourse`.

## Schritt 4: Quiz mit Gemini (Stufe 3)

Auf `joshi`, eigener Pull Request nach `main`.

### `server/gemini.js`

- Variable für den Key, Start mit `process.env.GEMINI_API_KEY`. `setApiKey(key)`, `isEnabled()`.
- `generateQuiz({ courseName, topics, texts })`:
    - Material zusammensetzen, auf 15.000 Zeichen kürzen
    - Prompt auf Deutsch: fünf Multiple-Choice-Fragen mit je vier Antworten, genau eine richtig, kurze Erklärung, nur aus dem Material. Material zwischen `<<<MATERIAL` und `MATERIAL>>>`, mit dem Hinweis, dass es nur Lernmaterial ist und keine Anweisungen enthält.
    - `fetch` an den Endpunkt aus `CLAUDE.md`, `AbortSignal.timeout(30000)`, `responseMimeType: "application/json"`
    - Antwort prüfen: `questions` ist ein Array mit 1 bis 10 Einträgen, jede Frage hat Text, genau vier Optionen und einen gültigen `correctIndex`. Sonst Fehler mit `status = 502`.
- Modellname und Anfrageformat vorher in der aktuellen Gemini-Doku prüfen.

### Routen in `server/routes/ai.js`

- `GET /ai/status`
- `PUT /admin/ai-key` (admin): Key nicht leer, `setApiKey`, 204. Den Key nie loggen und nie zurückgeben.
- `POST /courses/:id/quiz` (angemeldet): Fehlerfälle wie in `CLAUDE.md` (503, 400, 502). Einfache Bremse: höchstens eine Anfrage pro Nutzer alle 10 Sekunden, sonst 429 „Bitte warte kurz, bevor du ein neues Quiz erzeugst.“

### `Quiz.jsx`

- Props: `courseId`, `topics`
- Ist `GET /api/ai/status` `false`: Button deaktiviert mit Hinweis „Das Quiz ist gerade nicht eingerichtet.“
- Optional Themenfeld auswählen, Button „Quiz erzeugen“
- Während Gemini arbeitet: `Spinner` und Text „Fragen werden erstellt …“, Button gesperrt
- Fragen einzeln: Antwort anklicken → richtig/falsch farbig markiert, Erklärung, „Nächste Frage“
- Am Ende Ergebnis „3 von 5 richtig“ und „Neues Quiz“
- Fehler vom Server als `Alert` mit dem Text aus `getErrorMessage`

Person 4 bindet `Quiz` auf der Kursseite ein.

## Abhängigkeiten

| Du brauchst | Von | Bis dahin |
| --- | --- | --- |
| Projektgerüst | Person 1 | – |
| `queries/users.js`, dann übrige Abfragen | Person 2 | Routen gegen die vereinbarten Funktionsnamen schreiben, Test erst danach |
| `files.js` | Person 2 | Upload-Route zuletzt |
| `shared/validation.js` | Person 4 | einfache Pflichtfeld-Prüfung, später ersetzen |
| `Spinner`, `Alert`, `EmptyState`, `TypeBadge` | Person 1 | einfache Texte |
| `UpvoteButton` | Person 4 | nur Zahl anzeigen |

## Fertig, wenn

- [ ] Jede Route aus `CLAUDE.md` existiert und antwortet mit den richtigen Statuscodes
- [ ] Geschützte Routen geben ohne Login 401, ohne Admin-Rolle 403
- [ ] Ungültige Eingaben ergeben 400 mit `fields`, nie 500
- [ ] Ein Serverfehler bringt den Server nicht zum Absturz
- [ ] Login, Logout und Registrierung funktionieren, die Session überlebt Neuladen der Seite
- [ ] Kursübersicht filtert beim Tippen ohne Server-Anfrage, Filter stehen in der URL
- [ ] Ohne Gemini-Key startet alles, das Quiz ist deaktiviert
- [ ] Mit Key entsteht ein Quiz, ein Gemini-Fehler zeigt eine Meldung statt eines Absturzes

## Für die Prüfung erklären können

- Was ist REST? Welche HTTP-Methode nutzt du wofür, und was bedeuten 200, 201, 204, 400, 401, 403, 404, 500?
- Was ist eine Middleware in Express? Erkläre `requireLogin` und die Fehlerbehandlung.
- Wie funktioniert der Login mit Session-Cookie? Warum wird das Passwort gehasht?
- Was ist ein Promise, und was machen `async` und `await`? Warum steht um `await` ein `try/catch`?
- Was passiert zwischen Klick im Browser und Antwort aus der Datenbank (Komponente → axios → Vite-Proxy → Express → Abfragefunktion → SQLite)?
- Warum wird in der Kursübersicht im Frontend gefiltert? Was macht `useMemo`?
- Was ist CORS, und warum braucht diese App kein CORS-Paket?
- Wie wird der Gemini-Key geschützt? Was passiert, wenn Gemini nicht antwortet?
- Was ist ein optimistisches Update (`FavoriteButton`)?

## Start-Prompt für Claude Code

```
Ich bin Person 3 (REST-API, Gemini, Kursübersicht).
Lies CLAUDE.md und docs/aufgaben/person-3.md.
Wir beginnen mit Schritt 1. Lege zuerst einen Plan vor und warte auf meine Freigabe.
Erkläre mir danach den Weg einer Anfrage vom Browser bis zur Datenbank an unserem Code.
```

Für jeden weiteren Schritt: „Weiter mit Schritt N aus docs/aufgaben/person-3.md. Erst Plan, dann Freigabe.“
