import React, { useState } from 'react';
import { FaUserCircle, FaSignOutAlt, FaCog, FaUser, FaBars } from 'react-icons/fa';
import logo from '../assets/logo.png'; // Pastikan path logo ini benar
import { Link } from 'react-router-dom'; // <-- 1. Import Link

const NavbarPbf = ({ onLogout, onToggleSidebar }) => {
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const username = localStorage.getItem('username');
  const email = localStorage.getItem('email'); // <-- 2. Ambil email dari localStorage

  return (
    <nav className="fixed top-0 left-0 w-full bg-white border-b border-gray-200 z-50 shadow-sm">
      <div className="flex justify-between items-center px-4 lg:px-6 py-1">

        {/* Left Section (Tidak Berubah) */}
        <div className="flex items-center space-x-4">
          <button
            onClick={onToggleSidebar}
            className="lg:hidden p-2 rounded-lg hover:bg-gray-100 transition-colors"
            aria-label="Toggle sidebar"
          >
            <FaBars className="text-gray-600 text-xl" />
          </button>
          <img src={logo} alt="MediSync Logo" className="h-10 w-auto" />
        </div>

        {/* Right Section (Tidak Berubah) */}
        <div className="flex items-center space-x-2 lg:space-x-4">
          <div className="border-gray-200 py-2">
            <button
              onClick={onLogout}
              className="w-full flex items-center space-x-3 px-4 py-2.5 hover:bg-red-50 transition-colors text-left group"
            >
              <FaSignOutAlt className="text-red-500 group-hover:text-red-600" />
              <span className="text-sm text-red-500 group-hover:text-red-600 font-medium">Logout</span>
            </button>
          </div>

          <div className="hidden lg:block h-8 w-px bg-gray-300" />

          <div className="relative">
            <button
              onClick={() => {
                setShowProfileMenu(!showProfileMenu);
              }}
              className="flex items-center space-x-3 p-2 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <FaUserCircle className="text-gray-600 text-2xl" />
              <div className="hidden lg:block text-left">
                <p className="text-sm font-medium text-gray-800">{username || 'PBF'}</p>
                <p className="text-xs text-gray-500">Administrator</p>
              </div>
            </button>

            {/* Profile Dropdown */}
            {showProfileMenu && (
              <>
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setShowProfileMenu(false)}
                />
                <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-lg border border-gray-200 z-50 overflow-hidden">
                  <div className="p-4 border-b border-gray-200 bg-gray-50">
                    <p className="font-semibold text-gray-800">{username || 'PBF'}</p>
                    {/* 3. Tampilkan email dinamis */}
                    <p className="text-xs text-gray-500">{email || 'pbf@medisync.com'}</p>
                  </div>
                  <div className="py-2">
                    {/* --- PERBAIKAN DI SINI --- */}
                    <Link
                      to="/pbf/profil" // 4. Arahkan ke halaman profil
                      onClick={() => setShowProfileMenu(false)} // 5. Tutup menu saat diklik
                      className="w-full flex items-center space-x-3 px-4 py-2.5 hover:bg-gray-50 transition-colors text-left"
                    >
                      <FaUser className="text-gray-600" />
                      <span className="text-sm text-gray-700">Profil Saya</span>
                    </Link>
                    {/* --- AKHIR PERBAIKAN --- */}
                    
                   
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default NavbarPbf;