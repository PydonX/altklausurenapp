import axios from 'axios';

// Eine gemeinsame axios-Instanz für alle Anfragen ans Backend.
// Vite leitet /api im Dev-Betrieb an Express weiter, deshalb reicht der relative Pfad.
const api = axios.create({ baseURL: '/api' });

export default api;

// Holt aus einem axios-Fehler den Text für die Oberfläche.
// Hat der Server geantwortet, steht der Text in error.response.data.error,
// sonst gab es keine Verbindung.
export function getErrorMessage(error) {
  return error?.response?.data?.error || 'Keine Verbindung zum Server.';
}
