import React from 'react';
import { Link, useLocation } from 'react-router-dom';

const NavItemApotek = ({ to, children }) => {
  const location = useLocation();

  // Logika untuk menentukan tab aktif
  // 1. Cek apakah path SEKARANG (location.pathname) SAMA PERSIS dengan target (to)
  const isActiveExact = location.pathname === to;

  // 2. Kasus khusus untuk "Semua":
  // Tab "Semua" aktif HANYA jika path-nya persis /apotek/pesan-obat
  if (to === '/apotek/pesan-obat') {
    const isActive = isActiveExact;
    const baseClass =
      'py-2 px-4 rounded-lg text-sm font-medium transition-all duration-200 whitespace-nowrap block text-center sm:inline-block';
    const activeClass = 'bg-emerald-600 text-white shadow-md';
    const inactiveClass = 'text-slate-500 hover:text-emerald-800 hover:bg-emerald-100';

    return isActive ? (
      <span className={`${baseClass} ${activeClass}`}>{children}</span>
    ) : (
      <Link to={to} className={`${baseClass} ${inactiveClass}`}>
        {children}
      </Link>
    );
  }

  // 3. Untuk tab lain (e.g., /apotek/pesan-obat/dikirim):
  // Aktif jika path SEKARANG *dimulai dengan* path target
  const isActive = location.pathname.startsWith(to);

  const baseClass =
    'py-2 px-4 rounded-lg text-sm font-medium transition-all duration-200 whitespace-nowrap block text-center sm:inline-block';
  const activeClass = 'bg-emerald-600 text-white shadow-md';
  const inactiveClass = 'text-slate-500 hover:text-emerald-800 hover:bg-emerald-100';

  return isActive ? (
    <span className={`${baseClass} ${activeClass}`}>{children}</span>
  ) : (
    <Link to={to} className={`${baseClass} ${inactiveClass}`}>
      {children}
    </Link>
  );
};

export default NavItemApotek;
