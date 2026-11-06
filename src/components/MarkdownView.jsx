import ReactMarkdown from 'react-markdown';

// Gestaltung der Markdown-Elemente mit Tailwind. Alle Farben haben Dark-Mode-Werte über die Tokens.
// Es gibt bewusst kein rehype-raw: HTML im Text wird als Text angezeigt, nie ausgeführt.
const components = {
  h1: ({ children }) => <h1 className="mb-3 mt-6 text-2xl font-bold first:mt-0">{children}</h1>,
  h2: ({ children }) => <h2 className="mb-2 mt-5 text-xl font-bold first:mt-0">{children}</h2>,
  h3: ({ children }) => <h3 className="mb-2 mt-4 text-lg font-bold first:mt-0">{children}</h3>,
  p: ({ children }) => <p className="mb-3 leading-relaxed">{children}</p>,
  ul: ({ children }) => <ul className="mb-3 list-disc space-y-1 pl-6">{children}</ul>,
  ol: ({ children }) => <ol className="mb-3 list-decimal space-y-1 pl-6">{children}</ol>,
  a: ({ href, children }) => (
    <a href={href} target="_blank" rel="noopener noreferrer" className="font-bold text-ink underline">
      {children}
    </a>
  ),
  blockquote: ({ children }) => (
    <blockquote className="mb-3 border-l-4 border-line-strong pl-4 text-muted">{children}</blockquote>
  ),
  hr: () => <hr className="my-5 border-line" />,
  // Tabellen können breit sein: auf dem Handy seitlich scrollen statt die Seite zu sprengen
  table: ({ children }) => (
    <div className="mb-3 overflow-x-auto">
      <table className="w-full border-collapse text-sm">{children}</table>
    </div>
  ),
  th: ({ children }) => (
    <th className="border border-line-strong bg-ink-soft px-3 py-1.5 text-left font-bold">{children}</th>
  ),
  td: ({ children }) => <td className="border border-line px-3 py-1.5">{children}</td>,
  // Codeblock: pre liefert den Kasten, code darin bleibt ohne eigenen Hintergrund
  pre: ({ children }) => (
    <pre className="mb-3 overflow-x-auto rounded-md border border-line bg-ink-soft p-3 text-sm [&>code]:bg-transparent [&>code]:p-0">
      {children}
    </pre>
  ),
  code: ({ children }) => (
    <code className="rounded-sm bg-ink-soft px-1 py-0.5 font-mono text-[0.9em]">{children}</code>
  )
};

// Zeigt einen Text-Inhalt als Markdown an
export default function MarkdownView({ text }) {
  return (
    <div className="min-w-0 break-words">
      <ReactMarkdown components={components}>{text || ''}</ReactMarkdown>
    </div>
  );
}
