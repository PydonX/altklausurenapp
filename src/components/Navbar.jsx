import { useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import Button from './Button.jsx';
import ThemeToggle from './ThemeToggle.jsx';

// Aktiver Link bekommt eine helle Fläche, die anderen sind gedämpft
function linkClass({ isActive }) {
  return `block rounded-md px-3 py-2 text-[0.92rem] font-bold ${
    isActive ? 'bg-ink-soft text-fg' : 'text-muted hover:text-fg'
  }`;
}

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);

  // Links je nach Anmeldung und Rolle
  const links = [
    { to: '/kurse', label: 'Kurse' },
    { to: '/rangliste', label: 'Rangliste' },
    { to: '/hochladen', label: 'Hochladen' }
  ];
  if (user) links.push({ to: '/dashboard', label: 'Dashboard' });
  if (user?.role === 'admin') links.push({ to: '/admin', label: 'Admin' });

  function closeMenu() {
    setMenuOpen(false);
  }

  async function handleLogout() {
    closeMenu();
    await logout();
    navigate('/');
  }

  // Anmelden bzw. Benutzername und Abmelden, wird auf PC und Handy verwendet
  const account = user ? (
    <>
      <span className="font-mono text-sm text-muted">{user.username}</span>
      <Button variant="secondary" size="sm" onClick={handleLogout}>
        Abmelden
      </Button>
    </>
  ) : (
    <Button size="sm" to="/login" onClick={closeMenu}>
      Anmelden
    </Button>
  );

  return (
    <header className="sticky top-0 z-40 border-b border-line bg-surface">
      <div className="mx-auto flex w-full max-w-270 items-center gap-4 px-4 py-2.5">
        <Link to="/" onClick={closeMenu} className="flex items-center gap-2.5 font-display text-[1.08rem] font-bold">
          {/* Logo als leicht gedrehter Stempel */}
          <span
            aria-hidden="true"
            className="grid size-[34px] -rotate-6 place-items-center rounded-sm border-2 border-danger font-mono text-xs font-semibold text-danger"
          >
            AK
          </span>
          Altklausuren
        </Link>

        {/* Links auf dem PC (ab md = 768 px) */}
        <nav aria-label="Hauptmenü" className="hidden flex-1 gap-0.5 md:flex">
          {links.map((link) => (
            <NavLink key={link.to} to={link.to} className={linkClass}>
              {link.label}
            </NavLink>
          ))}
        </nav>

        <div className="ml-auto flex items-center gap-2 md:ml-0">
          <ThemeToggle />
          <div className="hidden items-center gap-3 md:flex">{account}</div>

          {/* Menü-Button auf dem Handy (unter md) */}
          <button
            type="button"
            onClick={() => setMenuOpen(!menuOpen)}
            aria-expanded={menuOpen}
            aria-controls="mobile-menu"
            aria-label={menuOpen ? 'Menü schließen' : 'Menü öffnen'}
            className="cursor-pointer rounded-md p-2 text-fg hover:bg-ink-soft md:hidden"
          >
            <svg viewBox="0 0 24 24" className="size-6" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
              {menuOpen ? (
                <path d="M6 6l12 12M18 6L6 18" strokeLinecap="round" />
              ) : (
                <path d="M4 7h16M4 12h16M4 17h16" strokeLinecap="round" />
              )}
            </svg>
          </button>
        </div>
      </div>

      {/* Aufgeklapptes Menü auf dem Handy. Nach einem Klick auf einen Link schließt es. */}
      {menuOpen && (
        <nav id="mobile-menu" aria-label="Hauptmenü" className="border-t border-line px-4 pb-4 pt-2 md:hidden">
          <div className="flex flex-col gap-1">
            {links.map((link) => (
              <NavLink key={link.to} to={link.to} onClick={closeMenu} className={linkClass}>
                {link.label}
              </NavLink>
            ))}
          </div>
          <div className="mt-3 flex items-center gap-3 border-t border-line pt-3">{account}</div>
        </nav>
      )}
    </header>
  );
}
