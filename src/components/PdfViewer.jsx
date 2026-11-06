// Dateigröße lesbar machen: 1.234.567 Byte -> "1,2 MB"
function formatSize(bytes) {
  if (!bytes) return '';
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1).replace('.', ',')} MB`;
}

// Zeigt eine PDF mit dem eingebauten Viewer des Browsers (<iframe>).
// Auf dem Handy zeigen Browser PDFs im iframe oft unvollständig, deshalb gibt es dort nur den Button.
export default function PdfViewer({ src, title, fileName, fileSize }) {
  const size = formatSize(fileSize);

  return (
    <div className="space-y-3">
      {/* Nur ab md sichtbar. Der Server liefert die Datei mit Content-Disposition: inline, daher zeigt der Browser sie an. */}
      <iframe
        src={src}
        title={title}
        className="hidden h-[75vh] w-full rounded-lg border border-line bg-surface md:block"
      />
      <a
        href={src}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-2 rounded-md border border-line-strong bg-surface px-4 py-2.5 text-[0.95rem] font-bold leading-tight text-fg transition-colors hover:border-ink hover:text-ink"
      >
        PDF in neuem Tab öffnen
        {(fileName || size) && (
          <span className="font-normal text-muted">
            ({[fileName, size].filter(Boolean).join(', ')})
          </span>
        )}
      </a>
    </div>
  );
}
