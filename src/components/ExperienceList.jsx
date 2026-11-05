import ReportButton from './ReportButton.jsx';

// Datum aus der Datenbank (UTC, "2024-05-03 10:15:00") in deutscher Schreibweise
function formatDate(value) {
  const date = new Date(String(value).replace(' ', 'T') + 'Z');
  return Number.isNaN(date.getTime()) ? '' : date.toLocaleDateString('de-DE');
}

// Erfahrungsberichte zu einem Kurs, bewusst ohne Namen
export default function ExperienceList({ ratings }) {
  if (!ratings || ratings.length === 0) {
    return <p className="text-sm text-muted">Noch keine Erfahrungsberichte.</p>;
  }

  return (
    <ul className="space-y-4">
      {ratings.map((rating) => (
        <li key={rating.id} className="rounded-lg border border-line bg-surface p-4">
          <div className="mb-2 flex flex-wrap items-center justify-between gap-2 text-xs text-muted">
            <span>{formatDate(rating.createdAt)}</span>
            <span>
              Vorlesung {rating.vorlesung} · Übungen {rating.uebungen} · Schwierigkeit {rating.schwierigkeit} ·
              Aufwand {rating.aufwand}
            </span>
          </div>
          {/* React maskiert den Text, es wird kein HTML ausgeführt */}
          <p className="whitespace-pre-line text-sm">{rating.comment}</p>
          <div className="mt-2 flex justify-end">
            <ReportButton ratingId={rating.id} />
          </div>
        </li>
      ))}
    </ul>
  );
}
