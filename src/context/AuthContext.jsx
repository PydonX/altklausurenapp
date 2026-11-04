import { createContext, useContext, useEffect, useState } from 'react';
import api from '../api.js';

// Der Context hält den angemeldeten Nutzer, damit jede Seite darauf zugreifen kann,
// ohne dass er durch alle Komponenten gereicht werden muss.
const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  // true, solange noch geprüft wird, ob schon eine Session besteht
  const [loading, setLoading] = useState(true);

  // Beim Start einmal fragen, wer angemeldet ist (die Session überlebt das Neuladen)
  useEffect(() => {
    let cancelled = false;
    api
      .get('/auth/me')
      .then((res) => {
        if (!cancelled) setUser(res.data);
      })
      .catch(() => {
        if (!cancelled) setUser(null);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  // login und register werfen bei Fehlern den axios-Fehler weiter,
  // damit die Formulare error.response.data.fields am passenden Feld anzeigen können.
  async function login(username, password) {
    const res = await api.post('/auth/login', { username, password });
    setUser(res.data);
    return res.data;
  }

  async function register(data) {
    const res = await api.post('/auth/register', data);
    setUser(res.data);
    return res.data;
  }

  async function logout() {
    await api.post('/auth/logout');
    setUser(null);
  }

  const value = { user, loading, login, register, logout };
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}
