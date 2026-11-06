import { useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import api from '../api.js';
import { useAuth } from '../context/AuthContext.jsx';

// Daumen hoch mit optimistischem Update: Die Anzeige ändert sich sofort,
// der Server wird danach gefragt. Meldet er einen Fehler, wird die Änderung zurückgenommen.
export default function UpvoteButton({ contentId, count, active }) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [state, setState] = useState({ count, active });
  // Ein Ref statt State: Er ändert sich sofort, ohne auf das nächste Rendern zu warten,
  // so werden schnelle Doppelklicks sicher ignoriert.
  const busy = useRef(false);

  // Kommen neue Werte von außen (z. B. anderer Inhalt), diese übernehmen
  useEffect(() => {
    setState({ count, active });
  }, [contentId, count, active]);

  async function handleClick() {
    // Ohne Anmeldung zum Login, danach zurück auf diese Seite
    if (!user) {
      navigate('/login', { state: { from: location } });
      return;
    }
    if (busy.current) return;
    busy.current = true;

    const before = state;
    const nowActive = !before.active;
    // Sofort anzeigen
    setState({ active: nowActive, count: before.count + (nowActive ? 1 : -1) });

    try {
      if (nowActive) await api.post(`/contents/${contentId}/upvote`);
      else await api.delete(`/contents/${contentId}/upvote`);
    } catch {
      // Server hat abgelehnt: alten Zustand wiederherstellen
      setState(before);
    } finally {
      busy.current = false;
    }
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      aria-pressed={state.active}
      aria-label={state.active ? 'Daumen hoch zurücknehmen' : 'Daumen hoch geben'}
      className={`inline-flex cursor-pointer items-center gap-1.5 rounded-md border px-3 py-1.5 text-sm font-bold transition-colors ${
        state.active
          ? 'border-ink bg-ink text-on-ink'
          : 'border-line-strong bg-surface text-fg hover:border-ink hover:text-ink'
      }`}
    >
      <span aria-hidden="true">👍</span>
      <span>{state.count}</span>
    </button>
  );
}
