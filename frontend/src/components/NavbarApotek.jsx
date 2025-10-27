import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import {
  FaUserCircle,
  FaSignOutAlt,
  FaCog,
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
  { path: "/apotek/pesan-obat", icon: <FaShoppingCart />, label: "Pesan obat" },
  { path: "/apotek/riwayat-pembelian", icon: <FaHistory />, label: "Riwayat" },
  { path: "/apotek/penjualan", icon: <FaCashRegister />, label: "Penjualan" },
  { path: "/apotek/laporan-analitik", icon: <FaChartBar />, label: "Laporan" },
];

const NavbarApotek = ({ onLogout }) => {
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const username = localStorage.getItem('username');

  const closeAllMenus = () => {
    setShowProfileMenu(false);
    setIsMobileMenuOpen(false);
  };

  return (
    <nav className="fixed top-0 left-0 w-full bg-gradient-to-b from-[#18A375] via-[#16956D] to-[#129967] text-white shadow-lg z-50">
      <div className="flex justify-between items-center px-4 lg:px-6 py-3 relative">

        <div className="flex items-center space-x-3">
          <button
            onClick={() => {
              setIsMobileMenuOpen(!isMobileMenuOpen);
              setShowProfileMenu(false);
            }}
            className="lg:hidden p-2 rounded-lg hover:bg-white/10 transition-colors"
            aria-label="Toggle navigation"
          >
            {isMobileMenuOpen ? (
              <FaTimes className="text-white text-xl" />
            ) : (
              <FaBars className="text-white text-xl" />
            )}
          </button>


          <img src={logo} alt="MediSync Logo" className="h-12 w-auto" />
        </div>


        <div className="hidden lg:flex items-center space-x-1">
          {menuItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `flex items-center space-x-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? "bg-white/20"
                    : "text-white/80 hover:text-white hover:bg-white/10"
                }`
              }
            >
              <span>{item.icon}</span>
              <span>{item.label}</span>
            </NavLink>
          ))}
        </div>

        <div className="flex items-center space-x-2 lg:space-x-4">
          <div className="py-2">
            <button
              onClick={onLogout}
              className="w-full flex items-center space-x-3 px-3 py-2.5 rounded-lg hover:bg-white/10 transition-colors text-left group"
            >
              <FaSignOutAlt className="text-white/80 group-hover:text-white" />
              <span className="hidden lg:inline text-sm text-white/80 group-hover:text-white font-medium">
                Logout
              </span>
            </button>
          </div>

          <div className="hidden lg:block h-8 w-px bg-white/20" />


          <div className="relative">
            <button
              onClick={() => {
                setShowProfileMenu(!showProfileMenu);
                setIsMobileMenuOpen(false);
              }}
              className="flex items-center space-x-3 p-2 rounded-lg hover:bg-white/10 transition-colors"
            >
              <FaUserCircle className="text-white text-2xl" />
              <div className="hidden lg:block text-left">
                <p className="text-sm font-medium text-white">{username || 'Apotek'}</p>
                <p className="text-xs text-white/70">Pengelola Apotek</p>
              </div>
            </button>

            {showProfileMenu && (
              <>
                <div
                  className="fixed inset-0 z-40"
                  onClick={closeAllMenus}
                />
                <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-lg border border-gray-200 z-50 overflow-hidden">
                  <div className="p-4 border-b border-gray-200 bg-gray-50">
                    <p className="font-semibold text-gray-800">{username || 'Apotek'}</p>
                    <p className="text-xs text-gray-500">apotek@medisync.com</p>
                  </div>
                  <div className="py-2">
                    <button className="w-full flex items-center space-x-3 px-4 py-2.5 hover:bg-gray-50 transition-colors text-left">
                      <FaUser className="text-gray-600" />
                      <span className="text-sm text-gray-700">Profil Saya</span>
                    </button>
                    <button className="w-full flex items-center space-x-3 px-4 py-2.5 hover:bg-gray-50 transition-colors text-left">
                      <FaCog className="text-gray-600" />
                      <span className="text-sm text-gray-700">Pengaturan</span>
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>


      {isMobileMenuOpen && (
        <div className="absolute top-full left-0 w-full lg:hidden bg-[#16956D] shadow-lg py-3 px-3 space-y-1">
          {menuItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              onClick={closeAllMenus} 
              className={({ isActive }) =>
                `flex items-center space-x-3 px-4 py-3 rounded-lg text-base font-medium transition-colors ${
                  isActive
                    ? "bg-white/20"
                    : "text-white/80 hover:text-white hover:bg-white/10"
                }`
              }
            >
              <span className="w-6 text-lg">{item.icon}</span>
              <span>{item.label}</span>
            </NavLink>
          ))}
        </div>
      )}
    </nav>
  );
};

export default NavbarApotek;