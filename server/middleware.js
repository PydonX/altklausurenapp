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
