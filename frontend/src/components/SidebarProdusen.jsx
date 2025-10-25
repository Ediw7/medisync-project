import React from "react";
import {
  FaHome,
  FaCogs,
  FaTruck,
  FaChartLine,
  FaClipboardList,
  FaAngleLeft,
  FaAngleRight,
  FaCube,
  FaShieldAlt,
} from "react-icons/fa";
import { NavLink } from "react-router-dom";

const SidebarProdusen = ({ isCollapsed, setIsCollapsed }) => {
  const toggleSidebar = () => {
    setIsCollapsed(!isCollapsed);
  };

  const menuItems = [
    { path: "/produsen/dashboard", icon: <FaHome />, label: "Dashboard" },
    { 
      path: "/produsen/manajemen-produksi", 
      icon: <FaCogs />, 
      label: "Manajemen Produksi" 
    },
    { 
      path: "/produsen/pengelolaan-pengiriman", 
      icon: <FaTruck />, 
      label: "Pengelolaan Pengiriman" 
    },
    { 
      path: "/produsen/monitoring-stok", 
      icon: <FaChartLine />, 
      label: "Monitoring Stok" 
    },
    { 
      path: "/produsen/laporan-analitik", 
      icon: <FaClipboardList />, 
      label: "Laporan Analitik" 
    },
  ];

  return (
    <div
      className={`fixed top-0 left-0 h-screen text-white transition-all duration-300 shadow-2xl ${
        isCollapsed ? "w-16" : "w-70" // Lebar diperkecil
      } bg-gradient-to-b from-[#18A375] via-[#16956D] to-[#129967]`}
    >
      {/* Header Section */}
      <div className="relative border-b border-white/10">
        <div className={`flex items-center ${isCollapsed ? 'justify-center' : 'justify-between'} ${isCollapsed ? 'p-4' : 'p-6'} pt-20 transition-all duration-300`}>
          {!isCollapsed && (
            <h3 className="text-lg font-bold tracking-wide">
              Produsen
            </h3>
          )}
          
          {/* Toggle Button */}
          <button
            onClick={toggleSidebar}
            className="p-2 bg-white/10 hover:bg-white/20 rounded-lg transition-all duration-200"
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
      <nav className="mt-6 px-3">
        <ul className="space-y-2">
          {menuItems.map((item, index) => (
            <li key={item.path}>
              <NavLink
                to={item.path}
                className={({ isActive }) =>
                  `group flex items-center px-4 py-3.5 rounded-xl transition-all duration-200 ${
                    isCollapsed ? "justify-center" : ""
                  } ${
                    isActive
                      ? "bg-white/20 shadow-lg backdrop-blur-md border border-white/10"
                      : "hover:bg-white/10 hover:translate-x-1"
                  }`
                }
                title={isCollapsed ? item.label : undefined}
              >
                <div className={`flex items-center ${isCollapsed ? "" : "w-full"}`}>
                  <div className={`text-xl ${isCollapsed ? "" : "mr-4"}`}>
                    {item.icon}
                  </div>
                  
                  {!isCollapsed && (
                    <span className="font-medium text-sm tracking-wide">
                      {item.label}
                    </span>
                  )}
                </div>
                
                {/* Indikator titik telah dihapus dari sini */}

              </NavLink>
            </li>
          ))}
        </ul>
      </nav>

      {/* Bottom Decoration */}
      <div className="absolute bottom-0 left-0 right-0 h-24 pointer-events-none overflow-hidden opacity-5">
        <svg
          className="absolute bottom-0 w-full"
          viewBox="0 0 200 100"
          preserveAspectRatio="none"
        >
          <path
            d="M0,50 L20,40 L40,60 L60,30 L80,50 L100,35 L120,55 L140,45 L160,65 L180,40 L200,50 L200,100 L0,100 Z"
            fill="currentColor"
          />
        </svg>
      </div>
    </div>
  );
};

export default SidebarProdusen;