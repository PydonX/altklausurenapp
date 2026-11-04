import { useEffect, useId, useRef } from 'react';

// Dialogfenster über der Seite. Schließt mit Esc, mit dem × und mit Klick auf den Hintergrund.
export default function Modal({ open, onClose, title, children, footer }) {
  const dialogRef = useRef(null);
  const onCloseRef = useRef(onClose);
  const titleId = useId();

  // Immer die aktuelle onClose-Funktion merken. So muss der Effekt unten nicht bei
  // jedem Rendern neu laufen (sonst würde der Fokus beim Tippen ins Fenster zurückspringen).
  useEffect(() => {
    onCloseRef.current = onClose;
  });

  useEffect(() => {
    if (!open) return;

    const previousFocus = document.activeElement;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden'; // Seite dahinter scrollt nicht
    dialogRef.current?.focus(); // Fokus springt ins Fenster

    function handleKeyDown(event) {
      if (event.key === 'Escape') onCloseRef.current();
    }
    document.addEventListener('keydown', handleKeyDown);

    // Aufräumen, wenn das Fenster schließt
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = previousOverflow;
      previousFocus?.focus?.();
    };
  }, [open]);

  if (!open) return null;

  // Nur ein Klick direkt auf den Hintergrund schließt, nicht ein Klick im Fenster
  function handleBackdropClick(event) {
    if (event.target === event.currentTarget) onClose();
  }

  return (
    <div
      onClick={handleBackdropClick}
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 sm:items-center sm:p-4"
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        className="flex max-h-[90dvh] w-full flex-col rounded-t-lg border border-line bg-surface shadow-xl sm:max-w-lg sm:rounded-lg"
      >
        <div className="flex items-start justify-between gap-4 border-b border-line px-5 py-4">
          <h2 id={titleId} className="text-lg font-bold">
            {title}
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Fenster schließen"
            className="-mr-2 -mt-1 cursor-pointer rounded-md p-1.5 text-muted hover:bg-ink-soft hover:text-fg"
          >
            <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
              <path d="M6 6l12 12M18 6L6 18" strokeLinecap="round" />
            </svg>
          </button>
        </div>
        <div className="overflow-y-auto px-5 py-4">{children}</div>
        {footer && <div className="flex flex-wrap justify-end gap-2 border-t border-line px-5 py-4">{footer}</div>}
      </div>
    </div>
  );
}
