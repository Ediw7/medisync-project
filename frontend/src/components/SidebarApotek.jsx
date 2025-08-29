import React from "react";
import { NavLink } from "react-router-dom";
import {
  FaHome,
  FaBoxOpen,
  FaShoppingCart,
  FaHistory,
  FaCashRegister,
  FaChartBar,
  FaAngleLeft,
  FaAngleRight,
} from "react-icons/fa";

const SidebarApotek = ({ isCollapsed, setIsCollapsed }) => {
  const toggleSidebar = () => {
    setIsCollapsed(!isCollapsed);
  };

  const menuItems = [
    { path: "/apotek/dashboard", icon: <FaHome />, label: "Dashboard" },
    { path: "/apotek/stok-obat", icon: <FaBoxOpen />, label: "Stok Obat" },
    { path: "/apotek/pesan-obat", icon: <FaShoppingCart />, label: "Pesan obat" },
    { path: "/apotek/riwayat-pembelian", icon: <FaHistory />, label: "Riwayat Pembelian" },
    { path: "/apotek/penjualan", icon: <FaCashRegister />, label: "Penjualan" },
    { path: "/apotek/laporan-analitik", icon: <FaChartBar />, label: "Laporan & Analitik" },
  ];

  return (
    <div
      style={{ backgroundColor: "#18A375" }}
      className={`fixed top-0 left-0 h-screen text-white transition-all duration-300 ${
        isCollapsed ? "w-16" : "w-64"
      }`}
    >
      <div className="flex justify-between items-center p-4 pt-16">
        <h3 className={`text-lg font-semibold ${isCollapsed ? "hidden" : "block"}`}>
          Dashboard Apotek
        </h3>
        <button onClick={toggleSidebar} className="text-white text-xl focus:outline-none">
          {isCollapsed ? <FaAngleRight /> : <FaAngleLeft />}
        </button>
      </div>

      <ul className="mt-4 space-y-2">
        {menuItems.map((item) => (
          <li key={item.path}>
            <NavLink
              to={item.path}
              className={({ isActive }) =>
                `flex items-center p-3 transition-colors ${
                  isCollapsed ? "justify-center" : ""
                } ${isActive ? "bg-[#46B591]" : "hover:bg-[#46B591]"}`
              }
            >
              <span className="text-xl">{item.icon}</span>
              {!isCollapsed && <span className="ml-3">{item.label}</span>}
            </NavLink>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default SidebarApotek;
