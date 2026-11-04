// Hinweis für leere Listen, z. B. "Noch keine Inhalte". action ist meist ein Button.
export default function EmptyState({ title, text, action }) {
  return (
    <div className="flex flex-col items-center gap-2 rounded-lg border border-dashed border-line-strong px-6 py-8 text-center">
      <h3 className="text-base font-semibold text-fg">{title}</h3>
      {text && <p className="max-w-prose text-sm text-muted">{text}</p>}
      {action && <div className="mt-2">{action}</div>}
    </div>
  );
}
