import { Link } from 'react-router-dom';

export default function Footer() {
  return (
    <footer className="mx-auto w-full max-w-270 px-4 pb-9 pt-6 text-[0.82rem] text-muted">
      <div className="flex flex-wrap items-center justify-between gap-2 border-t border-line pt-4">
        <p>Studienprojekt im Fach Web-Programmierung, DHBW Lörrach.</p>
        <Link to="/regeln" className="font-bold text-ink underline-offset-4 hover:underline">
          Regeln und Datenschutz
        </Link>
      </div>
    </footer>
  );
}
