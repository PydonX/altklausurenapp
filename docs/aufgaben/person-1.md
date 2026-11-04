# Person 1: Design-System, Landing Page, Routing und Build

Du legst das Fundament, auf dem die anderen drei bauen: das Projektgerüst, die Navigation, die Basis-Komponenten und das Aussehen der App. Dazu kommt die Startseite, die als Erstes in der Prüfung gezeigt wird.

Präsentations-Part: Projektstruktur, Wiederverwendbarkeit der Komponenten und Routing.

Die allgemeinen Regeln, das Datenbankschema und alle API-Routen stehen in `CLAUDE.md`. Diese Datei beschreibt nur deinen Teil.

## Deine Dateien

- `package.json`, `vite.config.js`, `index.html`, `.gitignore`, `.env.example`, `README.md`, `.github/workflows/build.yml`
- `src/main.jsx`, `src/App.jsx`, `src/index.css`, `src/theme.js`
- `src/components/`: `Layout.jsx`, `Navbar.jsx`, `Footer.jsx`, `Button.jsx`, `Modal.jsx`, `Spinner.jsx`, `EmptyState.jsx`, `Alert.jsx`, `TypeBadge.jsx`, `ThemeToggle.jsx`, `ProtectedRoute.jsx`
- `src/pages/`: `LandingPage.jsx`, `RulesPage.jsx`, `DashboardPage.jsx`, `NotFoundPage.jsx`

## Schritt 0: Projektgerüst (erster Tag, vor allen anderen)

Branch `p1/geruest`. Die anderen können erst anfangen, wenn das auf `main` liegt.

- `package.json` mit allen Paketen aus `CLAUDE.md`, den Skripten und `"engines": { "node": ">=24" }`
- `vite.config.js` mit React-Plugin, Tailwind-Plugin und Proxy `/api` → `http://localhost:3001`
- `index.html`, `src/main.jsx`, `src/index.css` mit `@import "tailwindcss";`
- `src/App.jsx` mit allen Frontend-Routen aus `CLAUDE.md`. Für jede Seite eine Platzhalter-Datei mit Überschrift, damit jede Person ihre Seite direkt füllen kann.
- `server/index.js` als Minimalversion: Express auf Port 3001 mit `GET /api/health` → `{ "ok": true }`. Ab Schritt 1 gehört die Datei Person 3.
- `src/context/AuthContext.jsx` als Platzhalter: `useAuth()` gibt `{ user: null, loading: false, login, register, logout }` mit leeren Funktionen zurück. Person 3 ersetzt ihn.
- `.gitignore`, `.env.example`, kurze `README.md` mit den drei Startbefehlen
- GitHub Action `.github/workflows/build.yml`: bei jedem Push und Pull Request `npm ci` und `npm run build` mit Node 24

Fertig, wenn ein frischer Klon mit `npm install` und `npm run dev` startet, jede Route eine Platzhalter-Seite zeigt und `/api/health` antwortet.

## Schritt 1: Design-System und Basis-Komponenten

Branch `p1/design-system`. Das brauchen alle anderen, deshalb direkt nach Schritt 0.

### Farben, Schrift, Dark Mode

- In `src/index.css` eigene Farben und Schrift über `@theme` festlegen (z. B. `--color-brand-500`). Alle Komponenten nutzen diese Farben statt beliebiger Tailwind-Farben.
- Dark Mode über eine Klasse auf `<html>`: in `index.css` `@custom-variant dark (&:where(.dark, .dark *));`. Jede Farbe bekommt eine `dark:`-Variante.
- `src/theme.js`: `getInitialTheme()` (gespeicherter Wert aus `localStorage`, sonst `prefers-color-scheme`), `applyTheme(theme)` (Klasse setzen, speichern), `toggleTheme()`. Zugriffe auf `localStorage` in `try/catch`.
- Das Theme wird vor dem ersten Rendern gesetzt (kleines Skript in `index.html` oder Aufruf in `main.jsx`), damit die Seite nicht kurz hell aufblitzt.
- Animationen respektieren `prefers-reduced-motion` (Tailwind-Variante `motion-safe:`).

### Komponenten und ihre Props

Diese Props sind die Schnittstelle für alle anderen. Nicht ohne Absprache ändern.

| Komponente | Props | Verhalten |
| --- | --- | --- |
| `Button` | `variant` (`primary`, `secondary`, `danger`, `ghost`), `size` (`sm`, `md`), `loading`, `disabled`, `type`, `onClick`, `to`, `children` | Mit `to` wird ein `Link` von react-router daraus. `loading` zeigt einen Spinner und sperrt den Button. |
| `Modal` | `open`, `onClose`, `title`, `children`, `footer` | Schließt mit Esc und Klick auf den Hintergrund. `role="dialog"`, `aria-modal`, Fokus springt ins Fenster. Seite dahinter scrollt nicht. |
| `Spinner` | `size`, `label` (Standard „Lädt …“) | Text für Screenreader immer vorhanden |
| `EmptyState` | `title`, `text`, `action` | Für leere Listen, `action` ist z. B. ein Button |
| `Alert` | `type` (`error`, `success`, `info`), `children`, `onClose` | `role="alert"` bei Fehlern |
| `TypeBadge` | `type` | Text aus `TYPE_LABELS`, eine Farbe pro Typ, auch im Dark Mode lesbar |
| `ThemeToggle` | keine | Schaltet hell/dunkel, beschriftet für Screenreader |
| `ProtectedRoute` | `adminOnly`, `children` | Zeigt `Spinner`, solange `useAuth().loading`. Nicht angemeldet → `/login` mit `state.from`. `adminOnly` und keine Admin-Rolle → Startseite. |
| `Layout` | keine | `Navbar`, `<main>` mit `<Outlet />`, `Footer` |

### Navbar und Footer

- Navbar: Logo/Name, Links „Kurse“, „Rangliste“, „Hochladen“, „Dashboard“ (nur angemeldet), „Admin“ (nur Admin), rechts `ThemeToggle` und Anmelden bzw. Benutzername und Abmelden.
- Aktiver Link hervorgehoben (`NavLink`).
- Unter `md` ein Menü-Button, der die Links aufklappt. Nach einem Klick auf einen Link schließt das Menü.
- Footer: Link zu `/regeln`, kurzer Hinweis, dass es ein Studienprojekt ist.

Bau zum Testen eine temporäre Seite oder nutze `NotFoundPage`, um alle Komponenten einmal in beiden Farbschemata zu sehen. Vor dem Merge wieder entfernen.

## Schritt 2: Landing Page

Branch `p1/landing`. Die Seite soll in den ersten Sekunden der Prüfung zeigen, was die App kann.

1. Kopfbereich: Name der App, ein Satz zum Zweck („Altklausuren, Lernzettel und Kursbewertungen für WI an der DHBW Lörrach“), Buttons „Kurse ansehen“ und „Inhalt hochladen“. Kein Bild über die ganze Bildschirmhöhe.
2. Live-Statistik aus `GET /api/stats`: Kurse, Inhalte, Altklausuren, Bewertungen. Die Zahlen zählen beim Laden hoch (`requestAnimationFrame`, unter einer Sekunde, ohne Animation bei `prefers-reduced-motion`). Während des Ladens `Spinner`. Scheitert die Anfrage, wird der Bereich ausgeblendet, die Seite funktioniert weiter.
3. Interaktive Funktions-Vorschau: vier Reiter „Finden“, „Bewerten“, „Teilen“, „Üben“. Der Wechsel ist animiert (CSS-Transition). Jeder Reiter hat einen Satz Erklärung und eine kleine Mini-Demo mit festen Beispieldaten im Frontend, ohne Server:
    - Finden: Suchfeld, das eine Liste aus fünf Kursnamen beim Tippen filtert
    - Bewerten: fünf anklickbare Sterne
    - Teilen: die fünf `TypeBadge`s mit je einem Satz
    - Üben: eine Beispiel-Quizfrage mit vier Antworten und Rückmeldung beim Klick
4. „Gerade am hilfreichsten“: die drei Inhalte mit den meisten Daumen hoch aus `GET /api/contents/ranking`, angezeigt mit `ContentCard` von Person 3. Solange die Komponente fehlt, reicht eine einfache Liste.
5. Kurzfassung der Regeln mit Link auf `/regeln`.

## Schritt 3: Regeln und 404

Branch `p1/regeln`.

- `RulesPage`: Nutzungsregeln (keine Namen von Studierenden oder Dozierenden, keine Beleidigungen, nur Inhalte, die man teilen darf), welche Daten gespeichert werden (Benutzername, Passwort-Hash, Rolle, ab Stufe 3 die Mail-Domain), wie Melden funktioniert und was der Admin dann tut, dass an Gemini nur Lerntexte gehen.
- `NotFoundPage`: kurze Meldung und Button zur Startseite.

## Schritt 4: Dashboard (Stufe 2)

Branch `p1/dashboard`, sobald Person 3 die Favoriten-Routen hat.

- Route über `ProtectedRoute`.
- Drei Bereiche: gemerkte Kurse (`CourseCard`), gemerkte Inhalte (`ContentCard`), eigene Uploads (`ContentCard`). Daten aus `GET /api/me/favorites` und `GET /api/me/uploads`, beide parallel mit `Promise.all`.
- Leere Bereiche zeigen `EmptyState` mit einem passenden Link.
- Entfernt jemand einen Favoriten, verschwindet die Karte ohne Neuladen.

## Schritt 5: Responsive- und Dark-Mode-Durchgang

Branch `p1/feinschliff`, vor der Abgabe.

- Jede Seite bei 375 px, 768 px und 1280 px Breite prüfen, hell und dunkel.
- Kein waagrechtes Scrollen der ganzen Seite, Tabellen scrollen in einem eigenen Container.
- Gefundene Probleme in Dateien anderer Personen meldest du per Kommentar im Pull Request oder behebst sie nach Absprache.

## Abhängigkeiten

| Du brauchst | Von | Bis dahin |
| --- | --- | --- |
| `useAuth()` | Person 3 | Platzhalter aus Schritt 0 |
| `GET /api/stats`, `GET /api/contents/ranking` | Person 3 | Bereiche zeigen `Spinner` bzw. werden ausgeblendet |
| `ContentCard`, `CourseCard` | Person 3 | einfache Liste mit Titeln |
| `TYPE_LABELS` | Person 4 (`shared/constants.js`) | Werte aus `CLAUDE.md` übernehmen |

## Fertig, wenn

- [ ] Frischer Klon startet mit `npm install` und `npm run dev`, `npm run build` läuft fehlerfrei
- [ ] GitHub Action ist bei jedem Push grün
- [ ] Alle Routen aus `CLAUDE.md` existieren, unbekannte Pfade zeigen die 404-Seite
- [ ] Geschützte Seiten leiten auf `/login` und nach dem Login zurück
- [ ] Alle Basis-Komponenten haben die Props aus der Tabelle und funktionieren hell und dunkel
- [ ] Dark Mode bleibt nach Neuladen erhalten und blitzt nicht auf
- [ ] Navbar funktioniert auf dem Handy mit Menü-Button
- [ ] Landing Page zeigt Live-Statistik, Funktions-Vorschau und die drei besten Inhalte
- [ ] Ohne Server-Antwort bleibt die Landing Page benutzbar

## Für die Prüfung erklären können

- Was ist eine Single-Page-Application, und wie wechselt react-router die Seite ohne Neuladen?
- Was macht der Proxy in `vite.config.js`, und warum braucht die App deshalb kein CORS?
- Was passiert bei `npm run build`, und was liegt danach in `dist/`?
- Wie funktioniert `ProtectedRoute`, und warum ist sie allein kein Schutz? (Das Backend prüft trotzdem jede Anfrage.)
- Was sind Props und `children`? Zeig an `Button` oder `Modal`, warum die Komponente wiederverwendbar ist.
- Wie funktioniert der Dark Mode: Klasse auf `<html>`, `dark:`-Variante, `localStorage`, `prefers-color-scheme`?
- Was sind Media Queries, und wie hängen sie mit Tailwind-Präfixen wie `md:` zusammen?
- Wie lädt die Landing Page die Statistik (`useEffect`, `async/await`, Lade- und Fehlerzustand)?

## Start-Prompt für Claude Code

```
Ich bin Person 1 (Design-System, Landing Page, Routing, Build).
Lies CLAUDE.md und docs/aufgaben/person-1.md.
Wir beginnen mit Schritt 0. Lege zuerst einen Plan vor: welche Dateien du anlegst
und was in jeder steht. Warte auf meine Freigabe, bevor du Dateien änderst.
```

Für jeden weiteren Schritt: „Weiter mit Schritt N aus docs/aufgaben/person-1.md. Erst Plan, dann Freigabe.“
