import { Outlet } from 'react-router-dom';
import Navbar from './Navbar.jsx';
import Footer from './Footer.jsx';

// Gemeinsamer Rahmen für alle Seiten. <Outlet /> ist die Stelle,
// an der react-router die jeweils aktive Seite einsetzt.
export default function Layout() {
  return (
    <div className="flex min-h-dvh flex-col">
      <Navbar />
      <main className="mx-auto w-full max-w-270 flex-1 px-4 pb-14 pt-7">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
}
