import { useState } from 'react';
import { getInitialTheme, toggleTheme } from '../theme.js';

// Schalter zwischen hellem und dunklem Farbschema
export default function ThemeToggle() {
  const [theme, setTheme] = useState(getInitialTheme);
  const isDark = theme === 'dark';

  return (
    <button
      type="button"
      onClick={() => setTheme(toggleTheme())}
      aria-label={isDark ? 'Helles Farbschema einschalten' : 'Dunkles Farbschema einschalten'}
      title={isDark ? 'Hell' : 'Dunkel'}
      className="cursor-pointer rounded-md p-2 text-muted hover:bg-ink-soft hover:text-fg"
    >
      {isDark ? (
        // Sonne
        <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
          <circle cx="12" cy="12" r="4" />
          <path
            d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"
            strokeLinecap="round"
          />
        </svg>
      ) : (
        // Mond
        <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
          <path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z" strokeLinejoin="round" />
        </svg>
      )}
    </button>
  );
}
