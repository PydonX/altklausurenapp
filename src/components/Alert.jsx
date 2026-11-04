const STYLES = {
  error: 'border-danger/30 bg-danger-soft text-danger',
  success: 'border-success/30 bg-success-soft text-success',
  info: 'border-ink/30 bg-ink-soft text-ink'
};

// Meldung für Fehler, Erfolg oder Hinweise. Mit onClose erscheint ein ×.
export default function Alert({ type = 'info', children, onClose }) {
  return (
    // role="alert" lässt Screenreader Fehler sofort vorlesen, "status" ist die höfliche Variante
    <div
      role={type === 'error' ? 'alert' : 'status'}
      className={`flex items-start gap-3 rounded-md border px-4 py-3 text-sm ${STYLES[type]}`}
    >
      <div className="min-w-0 flex-1">{children}</div>
      {onClose && (
        <button
          type="button"
          onClick={onClose}
          aria-label="Meldung schließen"
          className="-my-1 -mr-2 cursor-pointer rounded-md p-1 opacity-70 hover:opacity-100"
        >
          <svg viewBox="0 0 24 24" className="size-4" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
            <path d="M6 6l12 12M18 6L6 18" strokeLinecap="round" />
          </svg>
        </button>
      )}
    </div>
  );
}
