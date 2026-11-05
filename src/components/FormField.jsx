import { cloneElement, isValidElement } from 'react';

// Gemeinsame Klassen für Textfelder, damit alle Formulare gleich aussehen.
// Bei einem Fehler wird der Rand rot.
export function inputClass(hasError) {
  return (
    'block w-full rounded-md border bg-surface px-3 py-2 text-fg placeholder:text-muted ' +
    'focus:outline-2 focus:outline-offset-1 focus:outline-ink ' +
    (hasError ? 'border-danger' : 'border-line-strong')
  );
}

// Label, Eingabeelement und darunter Hinweis oder Fehler.
// Das Eingabeelement (children) bekommt id, aria-invalid und aria-describedby automatisch,
// damit Screenreader das Label und die Fehlermeldung dem Feld zuordnen können.
export default function FormField({ id, label, error, hint, required = false, children }) {
  const messageId = `${id}-message`;
  const hasMessage = Boolean(error || hint);

  const field = isValidElement(children)
    ? cloneElement(children, {
        id,
        'aria-invalid': error ? 'true' : undefined,
        'aria-describedby': hasMessage ? messageId : undefined,
        'aria-required': required ? 'true' : undefined
      })
    : children;

  return (
    <div className="space-y-1.5">
      <label htmlFor={id} className="block text-sm font-bold text-fg">
        {label}
        {required && <span className="text-danger" aria-hidden="true"> *</span>}
      </label>
      {field}
      {hasMessage && (
        <p id={messageId} className={`text-sm ${error ? 'text-danger' : 'text-muted'}`}>
          {error || hint}
        </p>
      )}
    </div>
  );
}
