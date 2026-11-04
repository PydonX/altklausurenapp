import { Routes, Route } from 'react-router-dom';
import Layout from './components/Layout.jsx';
import ProtectedRoute from './components/ProtectedRoute.jsx';
import LandingPage from './pages/LandingPage.jsx';
import RulesPage from './pages/RulesPage.jsx';
import DashboardPage from './pages/DashboardPage.jsx';
import CoursesPage from './pages/CoursesPage.jsx';
import RankingPage from './pages/RankingPage.jsx';
import CoursePage from './pages/CoursePage.jsx';
import ContentPage from './pages/ContentPage.jsx';
import UploadPage from './pages/UploadPage.jsx';
import LoginPage from './pages/LoginPage.jsx';
import RegisterPage from './pages/RegisterPage.jsx';
import AdminPage from './pages/AdminPage.jsx';
import NotFoundPage from './pages/NotFoundPage.jsx';

// Alle Frontend-Routen aus CLAUDE.md.
// Die äußere Route rendert das Layout, die inneren Seiten erscheinen in dessen <Outlet />.
export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<LandingPage />} />
        <Route path="/regeln" element={<RulesPage />} />
        <Route path="/kurse" element={<CoursesPage />} />
        <Route path="/kurse/:id" element={<CoursePage />} />
        <Route path="/rangliste" element={<RankingPage />} />
        <Route path="/inhalte/:id" element={<ContentPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/registrieren" element={<RegisterPage />} />

        {/* Nur für angemeldete Nutzer */}
        <Route path="/dashboard" element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />
        <Route path="/hochladen" element={<ProtectedRoute><UploadPage /></ProtectedRoute>} />

        {/* Nur für Admins */}
        <Route path="/admin" element={<ProtectedRoute adminOnly><AdminPage /></ProtectedRoute>} />

        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  );
}
