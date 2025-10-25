import React, { useState } from 'react';
import { FaUserCircle, FaSignOutAlt, FaBell, FaSearch, FaCog, FaUser, FaBars, FaTimes } from 'react-icons/fa';
import logo from '../assets/logo.png';

const NavbarProdusen = ({ username, onLogout, onToggleSidebar }) => {
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Mock notifications data
  const notifications = [
    { id: 1, message: 'Produksi batch #12345 selesai', time: '5 menit lalu', unread: true },
    { id: 2, message: 'Pengiriman #98765 telah dikirim', time: '1 jam lalu', unread: true },
    { id: 3, message: 'Stok obat Paracetamol menipis', time: '2 jam lalu', unread: false },
  ];

  const unreadCount = notifications.filter(n => n.unread).length;

  return (
    <nav className="fixed top-0 left-0 w-full bg-white border-b border-gray-200 z-50 shadow-sm">
      <div className="flex justify-between items-center px-4 lg:px-6 py-3">

        {/* Left Section: Logo + Mobile Menu Toggle */}
        <div className="flex items-center space-x-4">
          {/* Mobile Hamburger Menu */}
          <button
            onClick={onToggleSidebar}
            className="lg:hidden p-2 rounded-lg hover:bg-gray-100 transition-colors"
            aria-label="Toggle sidebar"
          >
            <FaBars className="text-gray-600 text-xl" />
          </button>

          {/* Logo */}
          <img src={logo} alt="MediSync Logo" className="h-12 w-auto" />
        </div>

        {/* Center Section: Search Bar (Hidden on mobile) */}
        <div className="hidden md:flex flex-1 max-w-xl mx-8">
          <div className="relative w-full">
            <FaSearch className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 text-sm" />
            <input
              type="text"
              placeholder="Cari produk, batch ID, atau dokumen..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-11 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#18A375] focus:border-transparent transition-all"
            />
          </div>
        </div>

        {/* Right Section: Actions + Profile */}
        <div className="flex items-center space-x-2 lg:space-x-4">

          {/* Mobile Search Icon */}
          <button className="md:hidden p-2 rounded-lg hover:bg-gray-100 transition-colors">
            <FaSearch className="text-gray-600 text-lg" />
          </button>

          {/* Notifications */}
          <div className="relative">
            <button
              onClick={() => {
                setShowNotifications(!showNotifications);
                setShowProfileMenu(false);
              }}
              className="relative p-2 rounded-lg hover:bg-gray-100 transition-colors"
              aria-label="Notifications"
            >
              <FaBell className="text-gray-600 text-xl" />
              {unreadCount > 0 && (
                <span className="absolute top-1 right-1 bg-red-500 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center border-2 border-white">
                  {unreadCount}
                </span>
              )}
            </button>

            {/* Notifications Dropdown */}
            {showNotifications && (
              <>
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setShowNotifications(false)}
                />
                <div className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-lg border border-gray-200 z-50 overflow-hidden">
                  <div className="p-4 border-b border-gray-200 bg-gray-50">
                    <h3 className="font-semibold text-gray-800">Notifikasi</h3>
                  </div>
                  <div className="max-h-96 overflow-y-auto">
                    {notifications.map((notif) => (
                      <div
                        key={notif.id}
                        className={`p-4 border-b border-gray-100 hover:bg-gray-50 transition-colors cursor-pointer ${
                          notif.unread ? 'bg-blue-50' : ''
                        }`}
                      >
                        <p className="text-sm text-gray-800">{notif.message}</p>
                        <p className="text-xs text-gray-500 mt-1">{notif.time}</p>
                      </div>
                    ))}
                  </div>
                  <div className="p-3 text-center border-t border-gray-200">
                    <button className="text-sm text-[#18A375] hover:text-[#16956D] font-medium">
                      Lihat Semua Notifikasi
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Divider */}
          <div className="hidden lg:block h-8 w-px bg-gray-300" />

          {/* Profile */}
          <div className="relative">
            <button
              onClick={() => {
                setShowProfileMenu(!showProfileMenu);
                setShowNotifications(false);
              }}
              className="flex items-center space-x-3 p-2 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <FaUserCircle className="text-gray-600 text-2xl" />
              <div className="hidden lg:block text-left">
                <p className="text-sm font-medium text-gray-800">{username || 'Produsen'}</p>
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
                    <p className="font-semibold text-gray-800">{username || 'Produsen'}</p>
                    <p className="text-xs text-gray-500">produsen@medisync.com</p>
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
                  <div className="border-t border-gray-200 py-2">
                    <button
                      onClick={onLogout}
                      className="w-full flex items-center space-x-3 px-4 py-2.5 hover:bg-red-50 transition-colors text-left group"
                    >
                      <FaSignOutAlt className="text-red-500 group-hover:text-red-600" />
                      <span className="text-sm text-red-500 group-hover:text-red-600 font-medium">Logout</span>
                    </button>
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

export default NavbarProdusen;
