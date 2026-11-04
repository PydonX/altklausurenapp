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
