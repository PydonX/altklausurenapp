import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { findUserByUsername, findUserById, createUser } from '../queries/users.js';
import { validateRegister, validateLogin } from '../../shared/validation.js';
import { requireLogin } from '../middleware.js';

const router = Router();

// Neue Session anlegen und den Nutzer darin merken.
// regenerate vergibt eine neue Session-ID, damit keine alte ID weiterverwendet werden kann
// (Schutz vor "Session Fixation").
function startSession(req, userId) {
  return new Promise((resolve, reject) => {
    req.session.regenerate((err) => {
      if (err) return reject(err);
      req.session.userId = userId;
      resolve();
    });
  });
}

const USERNAME_TAKEN = {
  error: 'Dieser Benutzername ist schon vergeben.',
  fields: { username: 'Dieser Benutzername ist schon vergeben. Bitte wähle einen anderen.' }
};

// Konto anlegen und direkt anmelden
router.post('/register', async (req, res) => {
  const fields = validateRegister(req.body);
  if (Object.keys(fields).length > 0) {
    return res.status(400).json({ error: 'Bitte prüfe die markierten Felder.', fields });
  }

  const username = req.body.username.trim().toLowerCase();
  if (findUserByUsername(username)) {
    return res.status(409).json(USERNAME_TAKEN);
  }

  // Nur der Hash wird gespeichert, nie das Passwort. Kostenfaktor 10.
  const passwordHash = await bcrypt.hash(req.body.password, 10);

  let id;
  try {
    id = createUser({ username, passwordHash, role: 'user' });
  } catch (err) {
    // Zwei Anfragen mit demselben Namen gleichzeitig: die Datenbank lehnt die zweite ab
    if (String(err.message).includes('UNIQUE')) {
      return res.status(409).json(USERNAME_TAKEN);
    }
    throw err;
  }

  await startSession(req, id);
  res.status(201).json({ id, username, role: 'user' });
});

// Anmelden
router.post('/login', async (req, res) => {
  const fields = validateLogin(req.body);
  if (Object.keys(fields).length > 0) {
    return res.status(400).json({ error: 'Bitte prüfe die markierten Felder.', fields });
  }

  const username = req.body.username.trim().toLowerCase();
  const user = findUserByUsername(username);
  const passwordOk = user ? await bcrypt.compare(req.body.password, user.passwordHash) : false;

  // Bei falschem Namen und falschem Passwort dieselbe Meldung,
  // damit niemand herausfinden kann, welche Benutzernamen es gibt.
  if (!passwordOk) {
    return res.status(401).json({ error: 'Benutzername oder Passwort stimmt nicht.' });
  }

  await startSession(req, user.id);
  res.json({ id: user.id, username: user.username, role: user.role });
});

// Abmelden: Session auf dem Server löschen
router.post('/logout', requireLogin, (req, res, next) => {
  req.session.destroy((err) => {
    if (err) return next(err);
    res.clearCookie('connect.sid');
    res.status(204).end();
  });
});

// Wer bin ich? Nutzer oder null (nie der Passwort-Hash)
router.get('/me', (req, res) => {
  const user = req.session.userId ? findUserById(req.session.userId) : null;
  res.json(user || null);
});

export default router;
