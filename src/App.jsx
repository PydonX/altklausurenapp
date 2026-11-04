import { Routes, Route } from 'react-router-dom';
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
// Layout und ProtectedRoute kommen in Schritt 1 dazu.
export default function App() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/regeln" element={<RulesPage />} />
      <Route path="/dashboard" element={<DashboardPage />} />
      <Route path="/kurse" element={<CoursesPage />} />
      <Route path="/kurse/:id" element={<CoursePage />} />
      <Route path="/rangliste" element={<RankingPage />} />
      <Route path="/inhalte/:id" element={<ContentPage />} />
      <Route path="/hochladen" element={<UploadPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/registrieren" element={<RegisterPage />} />
      <Route path="/admin" element={<AdminPage />} />
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}
