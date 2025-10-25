import React from 'react';
import { FaUserCircle, FaSignOutAlt } from 'react-icons/fa';
import logo from '../assets/logo.png'; 

const NavbarProdusen = ({ username, onLogout }) => {
  return (
    <nav className="fixed top-0 left-0 w-full bg-white shadow-md z-10 flex justify-between items-center px-6 py-3">

      <div className="flex items-center">
        {/* Mengganti span dengan img */}
        <img src={logo} alt="MediSync Logo" className="h-10 w-auto" /> 
      </div>

      {/* Profil dan Logout */}
      <div className="flex items-center space-x-4">
        <FaUserCircle className="text-gray-600 text-2xl cursor-pointer" />
        <span className="text-gray-600 text-sm">{username || 'Produsen'}</span>
        <button
          onClick={onLogout}
          className="flex items-center text-red-500 hover:text-red-700 transition-colors"
        >
          <FaSignOutAlt className="mr-1" /> Logout
        </button>
      </div>
    </nav>
  );
};

export default NavbarProdusen;