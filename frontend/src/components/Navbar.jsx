import React from 'react';
import { Link } from 'react-router-dom';
import { Menu, X, Pill } from 'lucide-react';

const Navbar = () => {
  const [isOpen, setIsOpen] = React.useState(false);

  return (
    <nav className="bg-white/80 backdrop-blur-md fixed w-full z-50 top-0 left-0">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-20">
          <div className="flex items-center">
            <Link to="/" className="flex items-center space-x-2">
              <Pill className="text-emerald-600" size={28} />
              <span className="text-xl font-bold bg-gradient-to-r from-gray-900 to-brand-700 bg-clip-text">MediSync</span>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            <Link to="/about" className="text-gray-600 hover:text-emerald-600 transition-colors">About</Link>
            <Link to="/services" className="text-gray-600 hover:text-emerald-600 transition-colors">Services</Link>
            <Link to="/contact" className="text-gray-600 hover:text-emerald-600 transition-colors">Contact</Link>
            <Link to="/roles" 
              className="px-6 py-2.5 bg-emerald-600 text-white rounded-full hover:bg-emerald-700 
                       transition-all duration-300 shadow-lg hover:shadow-emerald-200">
              Login
            </Link>
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden flex items-center">
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="inline-flex items-center justify-center p-2 rounded-full text-gray-400 
                       hover:text-emerald-600 hover:bg-emerald-50 transition-colors"
            >
              {isOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isOpen && (
          <div className="md:hidden absolute left-0 right-0 bg-white/95 backdrop-blur-md shadow-lg">
            <div className="px-4 pt-2 pb-3 space-y-2">
              <Link to="/about" className="block px-4 py-3 text-gray-600 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors">
                About
              </Link>
              <Link to="/services" className="block px-4 py-3 text-gray-600 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors">
                Services
              </Link>
              <Link to="/contact" className="block px-4 py-3 text-gray-600 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors">
                Contact
              </Link>
              <Link to="/roles" className="block px-4 py-3 text-emerald-600 font-medium hover:bg-emerald-50 rounded-lg transition-colors">
                Login
              </Link>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;