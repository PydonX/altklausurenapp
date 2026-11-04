import { useId } from 'react';

// Schieberegler von 1 bis 5 mit Beschriftung der Enden und dem aktuellen Wert als Text.
export default function DifficultySlider({ value, onChange, label, minLabel, maxLabel }) {
  const id = useId();

  return (
    <div className="space-y-1">
      <div className="flex items-baseline justify-between">
        <label htmlFor={id} className="text-sm font-bold text-fg">
          {label}
        </label>
        <span className="text-sm text-muted" aria-hidden="true">
          {value} von 5
        </span>
      </div>
      <input
        id={id}
        type="range"
        min="1"
        max="5"
        step="1"
        value={value}
        onChange={(event) => onChange(Number(event.target.value))}
        aria-valuetext={`${value} von 5`}
        className="block w-full cursor-pointer accent-ink"
      />
      <div className="flex justify-between text-xs text-muted">
        <span>{minLabel}</span>
        <span>{maxLabel}</span>
      </div>
    </div>
  );
}
