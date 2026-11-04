// Prüffunktionen für Frontend und Backend (reines JavaScript, läuft im Browser und in Node).
// Jede Funktion gibt ein Objekt { feldname: 'Meldung' } zurück. Ein leeres Objekt heißt: alles in Ordnung.
import {
  CONTENT_TYPES,
  RATING_CATEGORIES,
  REPORT_REASONS,
  ALLOWED_EMAIL_DOMAINS,
  LIMITS
} from './constants.js';

// Hilfsfunktionen -------------------------------------------------------

// Text bereinigen: nur Strings zählen, Leerzeichen am Rand werden ignoriert
function clean(value) {
  return typeof value === 'string' ? value.trim() : '';
}

// Checkboxen kommen im Frontend als true/false, im Backend (multipart) als "true"/"false"
function isChecked(value) {
  return value === true || value === 'true';
}

// Zahlen kommen im Backend (multipart) als Strings an, deshalb hier umwandeln.
// Gibt NaN zurück, wenn es keine ganze Zahl ist.
function toInteger(value) {
  if (typeof value === 'number') return Number.isInteger(value) ? value : NaN;
  if (typeof value === 'string' && /^-?\d+$/.test(value.trim())) return Number(value.trim());
  return NaN;
}

// Anmeldung ---------------------------------------------------------------

export function validateLogin({ username, password } = {}) {
  const errors = {};
  if (!clean(username)) errors.username = 'Bitte gib deinen Benutzernamen ein.';
  if (!password) errors.password = 'Bitte gib dein Passwort ein.';
  return errors;
}

export function validateRegister({ username, password, passwordRepeat, acceptedRules, email } = {}) {
  const errors = {};

  // Benutzernamen speichern wir kleingeschrieben, deshalb prüfen wir auch so
  const name = clean(username).toLowerCase();
  if (name.length < LIMITS.usernameMin || name.length > LIMITS.usernameMax) {
    errors.username = `Der Benutzername braucht ${LIMITS.usernameMin} bis ${LIMITS.usernameMax} Zeichen.`;
  } else if (!/^[a-z0-9._-]+$/.test(name)) {
    errors.username = 'Im Benutzernamen sind nur Buchstaben a-z, Ziffern, Punkt, Unterstrich und Bindestrich erlaubt.';
  }

  if (typeof password !== 'string' || password.length < LIMITS.passwordMin) {
    errors.password = `Das Passwort braucht mindestens ${LIMITS.passwordMin} Zeichen.`;
  }
  if (!errors.password && password !== passwordRepeat) {
    errors.passwordRepeat = 'Die beiden Passwörter stimmen nicht überein. Bitte gib sie noch einmal ein.';
  }

  if (!isChecked(acceptedRules)) {
    errors.acceptedRules = 'Bitte bestätige, dass du die Regeln gelesen hast und dich daran hältst.';
  }

  // E-Mail nur prüfen, wenn das Feld mitgeschickt wird (Stufe 3)
  if (email !== undefined) {
    const mail = clean(email).toLowerCase();
    if (!mail) {
      errors.email = 'Bitte gib deine E-Mail-Adresse ein.';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(mail)) {
      errors.email = 'Bitte gib eine gültige E-Mail-Adresse ein, z. B. name@sick.de.';
    } else {
      const domain = mail.split('@')[1];
      if (!ALLOWED_EMAIL_DOMAINS.includes(domain)) {
        errors.email = `Nur Adressen mit ${ALLOWED_EMAIL_DOMAINS.map((d) => '@' + d).join(' oder ')} sind erlaubt.`;
      }
    }
  }

  return errors;
}

// Inhalte -------------------------------------------------------------------

// courseTopicIds: Ids der Themenfelder, die zum gewählten Kurs gehören
export function validateContent(data = {}, courseTopicIds = []) {
  const { courseId, type, title, topicIds, format, text, file, examYear, source, noNames } = data;
  const errors = {};

  if (!Number.isInteger(toInteger(courseId)) || toInteger(courseId) < 1) {
    errors.courseId = 'Bitte wähle einen Kurs aus.';
  }

  if (!CONTENT_TYPES.includes(type)) {
    errors.type = 'Bitte wähle aus, was du hochladen möchtest (z. B. Altklausur oder Cheatsheet).';
  }

  const titleLength = clean(title).length;
  if (titleLength < LIMITS.titleMin || titleLength > LIMITS.titleMax) {
    errors.title = `Der Titel braucht ${LIMITS.titleMin} bis ${LIMITS.titleMax} Zeichen.`;
  }

  // Themenfelder: mindestens eins, alle müssen zum Kurs gehören
  const topics = Array.isArray(topicIds) ? topicIds.map(toInteger) : [];
  if (topics.length === 0) {
    errors.topicIds = 'Bitte wähle mindestens ein Themenfeld aus.';
  } else if (topics.some((id) => !courseTopicIds.includes(id))) {
    errors.topicIds = 'Mindestens ein Themenfeld gehört nicht zu diesem Kurs. Bitte wähle die Themenfelder neu aus.';
  }

  // Ein Tipp ist immer ein Text
  if (format !== 'text' && format !== 'pdf') {
    errors.format = 'Bitte wähle, ob du Text eingeben oder eine PDF hochladen möchtest.';
  } else if (type === 'tipp' && format === 'pdf') {
    errors.format = 'Ein Tipp kann nur als Text angelegt werden, nicht als PDF.';
  } else if (format === 'text') {
    const textLength = clean(text).length;
    if (textLength < LIMITS.textMin || textLength > LIMITS.textMax) {
      errors.text = `Der Text braucht ${LIMITS.textMin} bis ${LIMITS.textMax.toLocaleString('de-DE')} Zeichen.`;
    }
  } else if (!file || !file.name) {
    errors.file = 'Bitte wähle eine PDF-Datei aus.';
  } else if (!file.name.toLowerCase().endsWith('.pdf')) {
    errors.file = 'Die Datei muss die Endung .pdf haben. Bitte wähle eine PDF-Datei.';
  } else if (file.size > LIMITS.pdfMaxBytes) {
    errors.file = `Die Datei ist zu groß. Erlaubt sind höchstens ${LIMITS.pdfMaxBytes / 1024 / 1024} MB.`;
  } else if (!(file.size > 0)) {
    errors.file = 'Die Datei ist leer. Bitte wähle eine andere PDF-Datei.';
  }

  if (clean(source).length > LIMITS.sourceMax) {
    errors.source = `Die Quelle darf höchstens ${LIMITS.sourceMax} Zeichen lang sein.`;
  }

  // Jahr nur bei Altklausuren, Maximum ist das aktuelle Jahr
  if (type === 'altklausur') {
    const year = toInteger(examYear);
    const maxYear = new Date().getFullYear();
    if (Number.isNaN(year) || year < LIMITS.examYearMin || year > maxYear) {
      errors.examYear = `Bitte gib das Jahr der Klausur an (${LIMITS.examYearMin} bis ${maxYear}).`;
    }
  }

  if (!isChecked(noNames)) {
    errors.noNames = 'Bitte bestätige, dass der Inhalt keine Namen von Studierenden oder Dozierenden enthält.';
  }

  return errors;
}

// Bewertung -------------------------------------------------------------------

const RATING_LABELS = {
  vorlesung: 'Vorlesung',
  uebungen: 'Übungen',
  schwierigkeit: 'Klausurschwierigkeit',
  aufwand: 'Aufwand'
};

export function validateRating(data = {}) {
  const errors = {};

  for (const category of RATING_CATEGORIES) {
    const value = toInteger(data[category]);
    if (Number.isNaN(value) || value < 1 || value > 5) {
      errors[category] = `Bitte bewerte "${RATING_LABELS[category]}" mit 1 bis 5.`;
    }
  }

  // Erfahrungsbericht ist optional
  if (data.comment != null && typeof data.comment !== 'string') {
    errors.comment = 'Der Erfahrungsbericht muss ein Text sein.';
  } else if (clean(data.comment).length > LIMITS.commentMax) {
    errors.comment = `Der Erfahrungsbericht darf höchstens ${LIMITS.commentMax.toLocaleString('de-DE')} Zeichen lang sein.`;
  }

  return errors;
}

// Meldung ---------------------------------------------------------------------

export function validateReport({ reason } = {}) {
  const errors = {};
  if (!REPORT_REASONS.includes(reason)) {
    errors.reason = 'Bitte wähle einen Grund für die Meldung aus.';
  }
  return errors;
}
