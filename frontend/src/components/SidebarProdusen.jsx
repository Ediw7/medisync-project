import React from 'react';
import {
  FaHome,
  FaCogs,
  FaTruck,
  FaChartLine,
  FaClipboardList,
  FaAngleLeft,
  FaAngleRight,
  FaTimes,
} from 'react-icons/fa';
import { NavLink } from 'react-router-dom';

const SidebarProdusen = ({ isCollapsed, setIsCollapsed, isMobileOpen = false, onMobileClose }) => {
  const toggleSidebar = () => {
    setIsCollapsed(!isCollapsed);
  };

  const menuItems = [
    {
      path: '/produsen/dashboard',
      icon: <FaHome />,
      label: 'Dashboard',
      description: 'Ringkasan dan overview',
    },
    {
      path: '/produsen/manajemen-produksi',
      icon: <FaCogs />,
      label: 'Manajemen Produksi',
      description: 'Kelola produksi obat',
    },
    {
      path: '/produsen/pengelolaan-pengiriman',
      icon: <FaTruck />,
      label: 'Pengelolaan Pengiriman',
      description: 'Tracking pengiriman',
    },
    {
      path: '/produsen/monitoring-stok',
      icon: <FaChartLine />,
      label: 'Monitoring Stok',
      description: 'Pantau ketersediaan stok',
    },
    {
      path: '/produsen/laporan-analitik',
      icon: <FaClipboardList />,
      label: 'Laporan Analitik',
      description: 'Laporan dan statistik',
    },
  ];

  const handleNavClick = () => {
    if (onMobileClose) {
      onMobileClose();
    }
  };

  return (
    <>
      {/* Mobile Overlay */}
      {isMobileOpen && (
        <div className="fixed inset-0 bg-black/50 z-40 lg:hidden" onClick={onMobileClose} />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed top-0 left-0 h-screen text-white transition-all duration-300 shadow-2xl z-50 mt-4
          ${isCollapsed ? 'w-20' : 'w-72'}
          ${isMobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
          bg-gradient-to-b from-[#18A375] via-[#16956D] to-[#129967]`}
      >
        {/* Header Section */}
        <div className="relative border-b border-white/10">
          <div
            className={`flex items-center ${isCollapsed ? 'justify-center' : 'justify-between'} ${isCollapsed ? 'p-4' : 'px-6 py-5'} pt-16 transition-all duration-300`}
          >
            {!isCollapsed && (
              <div>
                <h3 className="text-xl font-bold tracking-wide">Produsen</h3>
                <p className="text-xs text-white/70 mt-1">Panel Administrator</p>
              </div>
            )}

            {/* Close button for mobile */}
            <button
              onClick={onMobileClose}
              className="lg:hidden p-2 bg-white/10 hover:bg-white/20 rounded-lg transition-all duration-200"
            >
              <FaTimes className="text-lg" />
            </button>

            {/* Toggle Button for desktop */}
            <button
              onClick={toggleSidebar}
              className="hidden lg:block p-2 bg-white/10 hover:bg-white/20 rounded-lg transition-all duration-200 hover:scale-110"
              aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            >
              {isCollapsed ? (
                <FaAngleRight className="text-lg" />
              ) : (
                <FaAngleLeft className="text-lg" />
              )}
            </button>
          </div>
        </div>

        {/* Navigation Menu */}
        <nav className="mt-6 px-3 overflow-y-auto h-[calc(100vh-180px)]">
          <ul className="space-y-2">
            {menuItems.map((item) => (
              <li key={item.path}>
                <NavLink
                  to={item.path}
                  onClick={handleNavClick}
                  className={({ isActive }) =>
                    `group relative flex items-center px-4 py-3.5 rounded-xl transition-all duration-200 ${
                      isCollapsed ? 'justify-center' : ''
                    } ${
                      isActive
                        ? 'bg-white/20 shadow-lg backdrop-blur-md border border-white/20 scale-[1.02]'
                        : 'hover:bg-white/10 hover:translate-x-1 hover:scale-[1.01]'
                    }`
                  }
                >
                  {({ isActive }) => (
                    <>
                      {/* Active Indicator Bar */}
                      {isActive && !isCollapsed && (
                        <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-white rounded-r-full" />
                      )}

                      {/* Active Indicator Dot (collapsed) */}
                      {isActive && isCollapsed && (
                        <div className="absolute top-2 right-2 w-2 h-2 bg-white rounded-full" />
                      )}

                      <div className={`flex items-center ${isCollapsed ? '' : 'w-full'}`}>
                        <div
                          className={`text-xl flex-shrink-0 ${isCollapsed ? '' : 'mr-4'} ${isActive ? 'scale-110' : 'group-hover:scale-110'} transition-transform duration-200`}
                        >
                          {item.icon}
                        </div>

                        {!isCollapsed && (
                          <div className="flex-1">
                            <span
                              className={`font-medium text-sm tracking-wide block ${isActive ? 'font-semibold' : ''}`}
                            >
                              {item.label}
                            </span>
                            <span className="text-xs text-white/60 mt-0.5 block">
                              {item.description}
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Tooltip for collapsed state */}
                      {isCollapsed && (
                        <div className="absolute left-full ml-4 px-3 py-2 bg-gray-900 text-white text-sm rounded-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 whitespace-nowrap z-50 shadow-xl">
                          <div className="font-medium">{item.label}</div>
                          <div className="text-xs text-gray-300 mt-0.5">{item.description}</div>
                          {/* Arrow */}
                          <div className="absolute top-1/2 right-full -translate-y-1/2 border-8 border-transparent border-r-gray-900" />
                        </div>
                      )}
                    </>
                  )}
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>

        {/* Bottom Section */}
        <div className="absolute bottom-0 left-0 right-0 border-t border-white/10 p-4">
          {!isCollapsed ? (
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-3 mb-3">
              <p className="text-xs font-semibold text-white">MediSync</p>
              <p className="text-xs text-white/60 mt-1">© 2025 All rights reserved</p>
            </div>
          ) : (
            <div className="flex justify-center">
              <div className="w-8 h-8 bg-white/10 rounded-lg flex items-center justify-center mb-3">
                <span className="text-xs font-bold">MS</span>
              </div>
            </div>
          )}
        </div>

        {/* Decorative Background Pattern */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden opacity-5">
          <svg className="absolute top-0 right-0 w-48 h-48" viewBox="0 0 200 200">
            <circle cx="100" cy="100" r="80" fill="currentColor" />
          </svg>
          <svg className="absolute bottom-0 left-0 w-64 h-32" viewBox="0 0 200 100">
            <path
              d="M0,50 L20,40 L40,60 L60,30 L80,50 L100,35 L120,55 L140,45 L160,65 L180,40 L200,50 L200,100 L0,100 Z"
              fill="currentColor"
            />
          </svg>
        </div>
      </aside>
    </>
  );
};

export default SidebarProdusen;
