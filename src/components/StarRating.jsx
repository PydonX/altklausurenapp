import { useId } from 'react';

const STARS = [1, 2, 3, 4, 5];
const STAR_PATH = 'M12 2.5l2.9 6.1 6.6.8-4.9 4.6 1.3 6.6L12 17.3l-5.9 3.3 1.3-6.6L2.5 9.4l6.6-.8z';

// Ein einzelner Stern. fill (0 bis 1) bestimmt, wie weit er gefüllt ist, damit auch halbe Werte gehen.
function Star({ fill }) {
  return (
    <span className="relative inline-block size-6">
      <svg viewBox="0 0 24 24" className="absolute inset-0 size-6 text-line-strong" fill="currentColor" aria-hidden="true">
        <path d={STAR_PATH} />
      </svg>
      <span className="absolute inset-y-0 left-0 overflow-hidden text-amber" style={{ width: `${fill * 100}%` }}>
        <svg viewBox="0 0 24 24" className="size-6 max-w-none" fill="currentColor" aria-hidden="true">
          <path d={STAR_PATH} />
        </svg>
      </span>
    </span>
  );
}

// Fünf Sterne. Mit onChange klickbar und per Pfeiltasten bedienbar, mit readOnly nur Anzeige.
export default function StarRating({ value = 0, onChange, label, readOnly = false }) {
  const labelId = useId();

  if (readOnly) {
    // Nur Anzeige: auch halbe Werte, für Screenreader als Text
    return (
      <span className="inline-flex" role="img" aria-label={`${label ? label + ': ' : ''}${value} von 5 Sternen`}>
        {STARS.map((n) => (
          <Star key={n} fill={Math.min(1, Math.max(0, value - (n - 1)))} />
        ))}
      </span>
    );
  }

  // Pfeiltasten ändern den Wert um 1, Pos1 und Ende springen an die Enden
  function handleKeyDown(event) {
    let next = null;
    if (event.key === 'ArrowRight' || event.key === 'ArrowUp') next = Math.min(5, (value || 0) + 1);
    if (event.key === 'ArrowLeft' || event.key === 'ArrowDown') next = Math.max(1, (value || 2) - 1);
    if (event.key === 'Home') next = 1;
    if (event.key === 'End') next = 5;
    if (next === null) return;
    event.preventDefault();
    onChange(next);
    // Fokus auf den neu gewählten Stern setzen
    event.currentTarget.parentElement.querySelector(`[data-star="${next}"]`)?.focus();
  }

  return (
    <div className="space-y-1">
      {label && (
        <span id={labelId} className="block text-sm font-bold text-fg">
          {label}
        </span>
      )}
      <div role="radiogroup" aria-labelledby={label ? labelId : undefined} className="inline-flex">
        {STARS.map((n) => (
          <button
            key={n}
            type="button"
            role="radio"
            data-star={n}
            aria-checked={value === n}
            aria-label={`${n} von 5 Sternen`}
            // Nur ein Stern ist per Tab erreichbar, die Pfeiltasten wechseln dann
            tabIndex={value === n || (!value && n === 1) ? 0 : -1}
            onClick={() => onChange(n)}
            onKeyDown={handleKeyDown}
            className="cursor-pointer rounded-md p-0.5 focus-visible:outline-2 focus-visible:outline-ink"
          >
            <Star fill={n <= value ? 1 : 0} />
          </button>
        ))}
      </div>
    </div>
  );
}
