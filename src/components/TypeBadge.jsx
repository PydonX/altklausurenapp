// Vorläufige Kopie aus CLAUDE.md. Sobald Person 4 shared/constants.js liefert, ersetzen durch:
// import { TYPE_LABELS } from '../../shared/constants.js';
const TYPE_LABELS = {
  altklausur: 'Altklausur',
  cheatsheet: 'Cheatsheet',
  aufschrieb: 'Aufschrieb',
  zusammenfassung: 'Zusammenfassung',
  tipp: 'Tipp'
};

// Eine Farbe pro Typ. Die Farben haben eigene Dark-Mode-Werte in index.css.
const COLORS = {
  altklausur: 'text-danger',
  cheatsheet: 'text-ink',
  aufschrieb: 'text-success',
  zusammenfassung: 'text-amber',
  tipp: 'text-muted'
};

// Kleines Etikett mit dem Typ eines Inhalts
export default function TypeBadge({ type }) {
  return (
    <span
      className={`inline-block whitespace-nowrap rounded-sm border-[1.5px] border-current px-1.5 py-0.5 font-mono text-[0.7rem] font-semibold uppercase tracking-wider ${COLORS[type] ?? 'text-muted'}`}
    >
      {TYPE_LABELS[type] ?? type}
    </span>
  );
}
