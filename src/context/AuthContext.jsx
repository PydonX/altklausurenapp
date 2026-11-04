import { createContext, useContext } from 'react';

// Platzhalter aus Schritt 0. Person 3 ersetzt diese Datei durch die echte Anmeldung.
const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const value = {
    user: null,
    loading: false,
    login: async () => {},
    register: async () => {},
    logout: async () => {}
  };
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}
