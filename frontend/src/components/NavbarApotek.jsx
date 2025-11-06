import React, { useState } from 'react';
import { NavLink, Link } from 'react-router-dom';
import {
  FaUserCircle,
  FaSignOutAlt,
  FaUser,
  FaBars,
  FaTimes,
  FaHome,
  FaBoxOpen,
  FaShoppingCart,
  FaHistory,
  FaCashRegister,
  FaChartBar,
} from 'react-icons/fa';
import logo from '../assets/logoPutih.png';

const menuItems = [
  { path: "/apotek/dashboard", icon: <FaHome />, label: "Dashboard" },
  { path: "/apotek/stok-obat", icon: <FaBoxOpen />, label: "Stok Obat" },
  { path: "/apotek/pesan-obat", icon: <FaShoppingCart />, label: "Pesan Obat" },
  { path: "/apotek/riwayat-pembelian", icon: <FaHistory />, label: "Riwayat" },
  { path: "/apotek/penjualan", icon: <FaCashRegister />, label: "Penjualan" },
  { path: "/apotek/laporan-analitik", icon: <FaChartBar />, label: "Laporan" },
];

const NavbarApotek = ({ onLogout }) => {
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const username = localStorage.getItem('username');
  const email = localStorage.getItem('email');

  const closeAllMenus = () => {
    setShowProfileMenu(false);
    setIsMobileMenuOpen(false);
  };

  return (
    <nav className="fixed top-0 left-0 w-full bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-lg z-50">
      <div className="max-w-7xl mx-auto px-4 lg:px-6 py-3">
        <div className="flex justify-between items-center">
          
          {/* Left Section - Logo & Menu */}
          <div className="flex items-center space-x-8">
            <div className="flex items-center space-x-3">
              <button
                onClick={() => {
                  setIsMobileMenuOpen(!isMobileMenuOpen);
                  setShowProfileMenu(false);
                }}
                className="lg:hidden p-2 rounded-lg hover:bg-white/10 transition-colors"
                aria-label="Toggle navigation"
              >
                {isMobileMenuOpen ? <FaTimes className="text-xl" /> : <FaBars className="text-xl" />}
              </button>
              <img src={logo} alt="MediSync Logo" className="h-10 w-auto" />
            </div>

            {/* Desktop Menu */}
            <div className="hidden lg:flex items-center space-x-1">
              {menuItems.map((item) => (
                <NavLink
                  key={item.path}
                  to={item.path}
                  className={({ isActive }) =>
                    `flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                      isActive
                        ? "bg-white/20 text-white"
                        : "text-white/80 hover:text-white hover:bg-white/10"
                    }`
                  }
                >
                  <span>{item.icon}</span>
                  <span>{item.label}</span>
                </NavLink>
              ))}
            </div>
          </div>

          {/* Right Section - Logout & Profile */}
          <div className="flex items-center space-x-3">
            
            {/* Logout Button */}
            <button
              onClick={onLogout}
              className="flex items-center space-x-2 px-4 py-2 rounded-lg hover:bg-white/10 transition-colors group"
            >
              <FaSignOutAlt className="text-white/80 group-hover:text-white" />
              <span className="hidden lg:inline text-sm font-medium">Logout</span>
            </button>

            <div className="hidden lg:block h-6 w-px bg-white/20" />

            {/* Profile Button */}
            <div className="relative">
              <button
                onClick={() => {
                  setShowProfileMenu(!showProfileMenu);
                  setIsMobileMenuOpen(false);
                }}
                className="flex items-center space-x-3 px-3 py-2 rounded-lg hover:bg-white/10 transition-colors"
              >
                <FaUserCircle className="text-2xl" />
                <div className="hidden lg:block text-left">
                  <p className="text-sm font-medium">{username || 'Apotek'}</p>
                  <p className="text-xs text-white/70">Pengelola Apotek</p>
                </div>
              </button>

              {/* Profile Dropdown */}
              {showProfileMenu && (
                <>
                  <div className="fixed inset-0 z-40" onClick={closeAllMenus} />
                  <div className="absolute right-0 mt-2 w-64 bg-white rounded-lg shadow-xl z-50 overflow-hidden">
                    
                    {/* Header */}
                    <div className="p-4 bg-gradient-to-br from-emerald-50 to-teal-50 border-b">
                      <p className="font-semibold text-gray-800">{username || 'Apotek'}</p>
                      <p className="text-xs text-gray-600">{email || 'apotek@medisync.com'}</p>
                    </div>

                    {/* Menu */}
                    <div className="py-2">
                      <Link
                        to="/apotek/profil"
                        onClick={closeAllMenus}
                        className="flex items-center space-x-3 px-4 py-3 hover:bg-gray-50 transition-colors"
                      >
                        <FaUser className="text-gray-600" />
                        <span className="text-sm text-gray-700 font-medium">Profil Saya</span>
                      </Link>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {isMobileMenuOpen && (
        <div className="lg:hidden border-t border-white/20 bg-white/5">
          <div className="px-4 py-3 space-y-1">
            {menuItems.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                onClick={closeAllMenus}
                className={({ isActive }) =>
                  `flex items-center space-x-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
                    isActive
                      ? "bg-white/20 text-white"
                      : "text-white/80 hover:text-white hover:bg-white/10"
                  }`
                }
              >
                <span className="text-lg">{item.icon}</span>
                <span>{item.label}</span>
              </NavLink>
            ))}
          </div>
        </div>
      )}
    </nav>
  );
};

export default NavbarApotek;