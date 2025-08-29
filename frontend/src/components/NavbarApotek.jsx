import React from 'react';
import { FaUserCircle, FaSignOutAlt } from 'react-icons/fa';

const NavbarApotek = ({ onLogout }) => {
  const username = localStorage.getItem('username');

  return (
    <nav className="fixed top-0 left-0 w-full bg-white shadow-md z-10 flex justify-between items-center px-6 py-3">
      <div className="flex items-center">
        <span className="text-green-600 font-bold text-xl">MediSync</span>
      </div>

      <div className="flex items-center space-x-4">
        <FaUserCircle className="text-gray-600 text-2xl" />
        <span className="text-gray-600 text-sm">{username || 'Apotek'}</span>
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

export default NavbarApotek;
