import React, { useState, useEffect, useRef } from 'react';
import { NavLink, Link, useLocation } from 'react-router-dom';
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
  FaChevronDown,
} from 'react-icons/fa';
import logo from '../assets/logoPutih.png';

const menuItems = [
  { path: '/apotek/dashboard', icon: <FaHome />, label: 'Dashboard' },
  { path: '/apotek/stok-obat', icon: <FaBoxOpen />, label: 'Stok' },
  { path: '/apotek/pesan-obat', icon: <FaShoppingCart />, label: 'Pesan' },
  { path: '/apotek/riwayat-pembelian', icon: <FaHistory />, label: 'Riwayat' },
  { path: '/apotek/penjualan', icon: <FaCashRegister />, label: 'Kasir' },
  { path: '/apotek/laporan-analitik', icon: <FaChartBar />, label: 'Laporan' },
];

const NavbarApotek = ({ onLogout }) => {
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const profileRef = useRef(null);
  const location = useLocation();

  const username = localStorage.getItem('username');
  const email = localStorage.getItem('email');

  // Handle scroll effect
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Close menus when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (profileRef.current && !profileRef.current.contains(event.target)) {
        setShowProfileMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Close mobile menu on route change
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [location]);

  return (
    <nav
      className={`fixed top-0 left-0 w-full z-50 transition-all duration-300 ${
        scrolled
          ? 'bg-emerald-600/90 backdrop-blur-md shadow-lg py-2'
          : 'bg-gradient-to-r from-emerald-600 to-teal-600 py-3'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center">
          {/* --- Logo Section --- */}
          <div className="flex items-center gap-4">
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="lg:hidden p-2 text-white/90 hover:text-white hover:bg-white/10 rounded-full transition-colors"
            >
              {isMobileMenuOpen ? <FaTimes size={20} /> : <FaBars size={20} />}
            </button>
            
            <Link to="/apotek/dashboard" className="flex items-center gap-2 group">
              <div className="relative">
                <div className="absolute -inset-1 bg-white/30 rounded-full blur opacity-0 group-hover:opacity-100 transition duration-500"></div>
                <img src={logo} alt="MediSync" className="h-9 w-auto relative" />
              </div>
             
            </Link>
          </div>

          {/* --- Desktop Menu --- */}
          <div className="hidden lg:flex items-center gap-1 bg-white/10 px-2 py-1 rounded-full border border-white/10 backdrop-blur-sm">
            {menuItems.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                className={({ isActive }) =>
                  `flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all duration-300 relative overflow-hidden ${
                    isActive
                      ? 'text-emerald-700 bg-white shadow-sm scale-105'
                      : 'text-white hover:bg-white/10 hover:text-white'
                  }`
                }
              >
                <span className="text-lg">{item.icon}</span>
                <span>{item.label}</span>
              </NavLink>
            ))}
          </div>

          {/* --- Right Section (Profile) --- */}
          <div className="flex items-center gap-3" ref={profileRef}>
            {/* Profile Dropdown Trigger */}
            <button
              onClick={() => setShowProfileMenu(!showProfileMenu)}
              className={`flex items-center gap-3 pl-1 pr-3 py-1 rounded-full transition-all duration-300 border ${
                showProfileMenu 
                  ? 'bg-white text-emerald-700 border-white shadow-lg' 
                  : 'bg-black/10 text-white border-white/10 hover:bg-black/20'
              }`}
            >
              <div className="h-8 w-8 rounded-full bg-gradient-to-br from-emerald-100 to-white flex items-center justify-center text-emerald-600 shadow-inner">
                <FaUserCircle size={24} />
              </div>
              <div className="hidden md:block text-left leading-tight">
                <p className="text-xs font-bold">{username || 'Admin'}</p>
                <p className={`text-[10px] ${showProfileMenu ? 'text-emerald-600' : 'text-emerald-100'}`}>
                  Apoteker
                </p>
              </div>
              <FaChevronDown size={10} className={`ml-1 transition-transform duration-300 ${showProfileMenu ? 'rotate-180' : ''}`} />
            </button>

            {/* Profile Dropdown Menu */}
            <div
              className={`absolute top-full right-4 mt-2 w-64 bg-white rounded-2xl shadow-2xl border border-slate-100 overflow-hidden transform transition-all duration-200 origin-top-right ${
                showProfileMenu ? 'scale-100 opacity-100 visible' : 'scale-95 opacity-0 invisible'
              }`}
            >
              {/* Header */}
              <div className="p-4 bg-gradient-to-r from-emerald-50 to-teal-50 border-b border-slate-100">
                <div className="flex items-center gap-3 mb-2">
                  <div className="h-10 w-10 rounded-full bg-white shadow-sm flex items-center justify-center text-emerald-500">
                    <FaUserCircle size={28} />
                  </div>
                  <div>
                    <p className="font-bold text-slate-800 text-sm">{username || 'Apotek'}</p>
                    <p className="text-xs text-slate-500">{email || 'admin@medisync.id'}</p>
                  </div>
                </div>
                <span className="inline-block px-2 py-0.5 bg-emerald-100 text-emerald-700 text-[10px] font-bold rounded-md border border-emerald-200">
                  PRO ACCOUNT
                </span>
              </div>

              {/* Menu Items */}
              <div className="p-2 space-y-1">
                <Link
                  to="/apotek/profil"
                  onClick={() => setShowProfileMenu(false)}
                  className="flex items-center gap-3 px-3 py-2.5 text-sm font-medium text-slate-600 hover:text-emerald-600 hover:bg-emerald-50 rounded-xl transition-colors group"
                >
                  <div className="w-8 h-8 rounded-lg bg-slate-50 group-hover:bg-white group-hover:shadow-sm flex items-center justify-center transition-all">
                    <FaUser size={14} />
                  </div>
                  Profil Saya
                </Link>
                
                <div className="h-px bg-slate-100 my-1 mx-2"></div>

                <button
                  onClick={onLogout}
                  className="w-full flex items-center gap-3 px-3 py-2.5 text-sm font-medium text-red-600 hover:bg-red-50 rounded-xl transition-colors group"
                >
                  <div className="w-8 h-8 rounded-lg bg-red-50 group-hover:bg-white group-hover:shadow-sm flex items-center justify-center transition-all">
                    <FaSignOutAlt size={14} />
                  </div>
                  Keluar
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* --- Mobile Menu Overlay --- */}
      <div 
        className={`fixed inset-0 z-40 bg-black/20 backdrop-blur-sm lg:hidden transition-opacity duration-300 ${
          isMobileMenuOpen ? 'opacity-100 visible' : 'opacity-0 invisible'
        }`}
        onClick={() => setIsMobileMenuOpen(false)}
      />

      {/* --- Mobile Menu Drawer --- */}
      <div
        className={`fixed top-[60px] left-0 w-full bg-white shadow-xl lg:hidden transform transition-transform duration-300 ease-in-out z-40 rounded-b-3xl overflow-hidden ${
          isMobileMenuOpen ? 'translate-y-0' : '-translate-y-[150%]'
        }`}
      >
        <div className="p-4 grid grid-cols-2 gap-3">
          {/* PERBAIKAN: Menggunakan Render Props untuk mengakses isActive */}
          {menuItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `flex flex-col items-center justify-center p-4 rounded-2xl transition-all duration-200 border ${
                  isActive
                    ? 'bg-emerald-50 border-emerald-200 text-emerald-700 shadow-sm'
                    : 'bg-slate-50 border-transparent text-slate-500 hover:bg-slate-100'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <span className={`text-2xl mb-2 ${isActive ? 'text-emerald-600' : 'text-slate-400'}`}>
                    {item.icon}
                  </span>
                  <span className="text-xs font-medium">{item.label}</span>
                </>
              )}
            </NavLink>
          ))}
        </div>
        <div className="p-4 border-t border-slate-100 bg-slate-50">
            <p className="text-center text-xs text-slate-400 font-medium">© 2025 MediSync Apotek Panel</p>
        </div>
      </div>
    </nav>
  );
};

export default NavbarApotek;