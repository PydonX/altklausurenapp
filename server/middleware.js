import { findUserById } from './queries/users.js';

// Middleware = Funktion (req, res, next), die vor dem eigentlichen Handler läuft.
// Sie antwortet selbst (Anfrage endet hier) oder ruft next() auf (Anfrage geht weiter).

// Lässt nur angemeldete Nutzer durch. Die Anmeldung steht in der Session (Cookie).
export function requireLogin(req, res, next) {
  if (!req.session.userId) {
    return res.status(401).json({ error: 'Bitte melde dich an.' });
  }
  next();
}

// Prüft die ID in der URL (:id). Wird mit router.param('id', checkId) eingehängt und läuft
// dann automatisch vor jeder Route, die :id enthält. Erlaubt sind nur positive ganze Zahlen,
// alles andere ("abc", "-1", "1.5") ist ein Fehler des Aufrufers: 400.
export function checkId(req, res, next, value) {
  if (!/^[1-9]\d*$/.test(value)) {
    return res.status(400).json({ error: 'Die Adresse enthält eine ungültige ID.' });
  }
  next();
}

// Lässt nur Admins durch. Die Rolle kommt immer aus der Datenbank,
// nie aus dem Frontend, denn Anfragen aus dem Browser lassen sich fälschen.
export function requireAdmin(req, res, next) {
  if (!req.session.userId) {
    return res.status(401).json({ error: 'Bitte melde dich an.' });
  }
  const user = findUserById(req.session.userId);
  if (!user || user.role !== 'admin') {
    return res.status(403).json({ error: 'Dafür brauchst du Admin-Rechte.' });
  }
  next();
}
