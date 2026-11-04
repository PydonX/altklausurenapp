// Farbschema (hell oder dunkel) lesen, setzen und speichern.
const STORAGE_KEY = 'theme';

// Gespeicherter Wert aus localStorage, sonst die Einstellung des Betriebssystems.
export function getInitialTheme() {
  let saved = null;
  try {
    saved = localStorage.getItem(STORAGE_KEY);
  } catch {
    // localStorage kann gesperrt sein (z. B. im privaten Modus), dann einfach weiter
  }
  if (saved === 'light' || saved === 'dark') return saved;
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

// Klasse "dark" auf <html> setzen bzw. entfernen und die Wahl speichern.
export function applyTheme(theme) {
  document.documentElement.classList.toggle('dark', theme === 'dark');
  try {
    localStorage.setItem(STORAGE_KEY, theme);
  } catch {
    // Speichern geht nicht, das Schema gilt dann nur bis zum Neuladen
  }
}

// Zwischen hell und dunkel wechseln, gibt das neue Schema zurück.
export function toggleTheme() {
  const isDark = document.documentElement.classList.contains('dark');
  const next = isDark ? 'light' : 'dark';
  applyTheme(next);
  return next;
}
