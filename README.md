# Altklausuren-App

Web-App für Studierende der Wirtschaftsinformatik an der DHBW Lörrach: Altklausuren, Lernzettel und Kursbewertungen teilen. Gruppenprojekt für die Portfolioprüfung in der Vorlesung „Web-Programmierung“ bei Felix Leber.

## Starten

Voraussetzung: Node.js ab Version 24.

```bash
npm install
npm run dev
```

Danach läuft die App unter http://localhost:5173 (die API unter http://localhost:3001).

Produktions-Build erzeugen und über Express ausliefern:

```bash
npm run build
npm start
```

## Gemini-Key (optional)

Für das Quiz `.env.example` nach `.env` kopieren und `GEMINI_API_KEY` eintragen. Ohne Key läuft die App normal, nur das Quiz ist deaktiviert.
