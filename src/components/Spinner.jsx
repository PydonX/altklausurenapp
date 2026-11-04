const SIZES = {
  sm: 'size-4',
  md: 'size-6',
  lg: 'size-10'
};

// Ladeanzeige. Die Farbe kommt vom umgebenden Text (border-current),
// deshalb passt der Spinner auf jeden Hintergrund, auch in einem Button.
export default function Spinner({ size = 'md', label = 'Lädt …' }) {
  return (
    <span role="status" className="inline-flex items-center">
      <span
        aria-hidden="true"
        className={`${SIZES[size]} rounded-full border-2 border-current/25 border-t-current motion-safe:animate-spin`}
      />
      {/* Nur für Screenreader sichtbar */}
      <span className="sr-only">{label}</span>
    </span>
  );
}
