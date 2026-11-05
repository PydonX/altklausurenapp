// Namen der vier Kategorien in der Oberfläche
const ROWS = [
  ['vorlesung', 'Vorlesung'],
  ['uebungen', 'Übungen'],
  ['schwierigkeit', 'Klausurschwierigkeit'],
  ['aufwand', 'Aufwand']
];

// Durchschnittswerte als Balken. avg ist { vorlesung, uebungen, schwierigkeit, aufwand } oder null.
export default function RatingSummary({ avg, count }) {
  if (!avg || count === 0) {
    return <p className="text-sm text-muted">Noch keine Bewertung</p>;
  }

  return (
    <div className="space-y-3">
      {ROWS.map(([key, name]) => (
        <div key={key}>
          <div className="mb-1 flex justify-between text-sm">
            <span>{name}</span>
            <span className="font-bold">{avg[key].toFixed(1).replace('.', ',')}</span>
          </div>
          {/* Der Balken ist reine Optik, der Wert steht als Zahl daneben */}
          <div className="h-2 overflow-hidden rounded-full bg-ink-soft" aria-hidden="true">
            <div className="h-full rounded-full bg-ink" style={{ width: `${(avg[key] / 5) * 100}%` }} />
          </div>
        </div>
      ))}
      <p className="text-sm text-muted">
        {count} {count === 1 ? 'Bewertung' : 'Bewertungen'}
      </p>
    </div>
  );
}
