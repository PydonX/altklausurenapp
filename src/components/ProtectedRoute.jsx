import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import Spinner from './Spinner.jsx';

// Lässt nur angemeldete Nutzer (bzw. mit adminOnly nur Admins) auf eine Seite.
// Das ist nur Komfort in der Oberfläche: Den echten Schutz macht das Backend,
// das jede Anfrage selbst prüft.
export default function ProtectedRoute({ adminOnly = false, children }) {
  const { user, loading } = useAuth();
  const location = useLocation();

  // Solange noch geprüft wird, ob jemand angemeldet ist
  if (loading) {
    return (
      <div className="flex justify-center py-16 text-ink">
        <Spinner size="lg" />
      </div>
    );
  }

  // Nicht angemeldet: zum Login, die ursprüngliche Seite in state.from merken
  if (!user) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  // Angemeldet, aber kein Admin
  if (adminOnly && user.role !== 'admin') {
    return <Navigate to="/" replace />;
  }

  return children;
}
