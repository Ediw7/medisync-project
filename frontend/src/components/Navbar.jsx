'use client';

import React from 'react';
import { Link } from 'react-router-dom';
import { Menu, X, ArrowRight } from 'lucide-react';
import Logo from '../assets/logo.png';

const Navbar = () => {
  const [isOpen, setIsOpen] = React.useState(false);

  // Fungsi helper untuk smooth scroll
  const handleScroll = (e, targetId) => {
    e.preventDefault();
    const targetElement = document.getElementById(targetId);
    if (targetElement) {
      targetElement.scrollIntoView({
        behavior: 'smooth',
        block: 'start',
      });
    }
    setIsOpen(false); // Tutup menu mobile jika diklik
  };

  return (
    <nav className="sticky top-0 z-50 pt-4 bg-gray-200/0">
      <div className="container mx-auto max-w-4xl ">
        <div
          className="flex h-14 items-center justify-between px-6 
                        bg-gradient-to-r from-white/10 via-white/5 to-white/10 
                        backdrop-blur-xl
                        rounded-3xl shadow-2xl shadow-black/20
                        before:absolute before:inset-0 before:rounded-3xl 
                        before:bg-gradient-to-r before:from-purple-500/10 before:via-transparent before:to-lime-400/10
                        before:blur-xl before:-z-10
                        hover:shadow-purple-500/20 hover:border-white/30
                        transition-all duration-500 ease-out
                        relative overflow-hidden"
        >
          <div className="absolute inset-0 rounded-3xl bg-gradient-to-r from-[#22C55E] via-transparent to-[#047857] opacity-10"></div>

          <div className="flex items-center relative z-10">
            <Link to="/">
              <img src={Logo} alt="MediSync Logo" className="h-10 w-auto" />
            </Link>
          </div>

          <div className="hidden md:flex items-center gap-6 text-base text-[#121212] relative z-10 font-semibold">
            {/* --- PERBAIKAN 2 --- */}
            <a
              href="#fitur" // Ganti 'to' menjadi 'href' dan sesuaikan ID
              onClick={(e) => handleScroll(e, 'fitur')} // Tambahkan onClick handler
              className="hover:[#047857] hover:scale-105 transition-all duration-300 ease-out
                                        relative px-3 py-1.5 group overflow-hidden"
            >
              <div
                className="absolute inset-0 bg-gradient-to-r from-white/50 via-white/30 to-white/50 
                             backdrop-blur-md border border-white/30 rounded-2xl
                             scale-0 group-hover:scale-100 opacity-0 group-hover:opacity-100
                             transition-all duration-500 ease-out"
              ></div>
              <div
                className="absolute inset-0 bg-gradient-to-r from-teal-500/5 to-emerald-500/5 
                             rounded-2xl blur-sm scale-0 group-hover:scale-110 
                             transition-all duration-700 ease-out"
              ></div>
              <span className="relative z-10">FITUR</span>
            </a>
            {/* --- PERBAIKAN 1 --- */}
            <a
              href="#tentang" // Ganti 'to' menjadi 'href'
              onClick={(e) => handleScroll(e, 'tentang')} // Tambahkan onClick handler
              className="hover:[#047857] hover:scale-105 transition-all duration-300 ease-out
                                        relative px-3 py-1.5 group overflow-hidden"
            >
              <div
                className="absolute inset-0 bg-gradient-to-r from-white/50 via-white/30 to-white/50 
                             backdrop-blur-md border border-white/30 rounded-2xl
                             scale-0 group-hover:scale-100 opacity-0 group-hover:opacity-100
                             transition-all duration-500 ease-out"
              ></div>
              <div
                className="absolute inset-0 bg-gradient-to-r from-teal-500/5 to-emerald-500/5 
                             rounded-2xl blur-sm scale-0 group-hover:scale-110 
                             transition-all duration-700 ease-out"
              ></div>
              <span className="relative z-10">TENTANG</span>
            </a>

            {/* --- PERBAIKAN 3 --- */}
            <a
              href="#kontak" // Ganti 'to' menjadi 'href'
              onClick={(e) => handleScroll(e, 'kontak')} // Tambahkan onClick handler
              className="hover:[#047857] hover:scale-105 transition-all duration-300 ease-out
                                        relative px-3 py-1.5 group overflow-hidden"
            >
              <div
                className="absolute inset-0 bg-gradient-to-r from-white/50 via-white/30 to-white/50 
                             backdrop-blur-md border border-white/30 rounded-2xl
                             scale-0 group-hover:scale-100 opacity-0 group-hover:opacity-100
                             transition-all duration-500 ease-out"
              ></div>
              <div
                className="absolute inset-0 bg-gradient-to-r from-teal-500/5 to-emerald-500/5 
                             rounded-2xl blur-sm scale-0 group-hover:scale-110 
                             transition-all duration-700 ease-out"
              ></div>
              <span className="relative z-10">KONTAK</span>
            </a>
          </div>

          <div className="hidden md:flex relative z-10">
            <Link
              to="/roles"
              className="group inline-flex items-center justify-center px-5 py-2 bg-gradient-to-r from-[#16A34A] to-[#047857] text-white rounded-2xl hover:from-emerald-700 hover:to-emerald-800 transition-all duration-500 font-semibold shadow-2xl hover:shadow-emerald-500/25 hover:scale-110 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 relative overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
              <span className="relative z-10 flex items-center">
                LOGIN
                <ArrowRight
                  size={16}
                  className="transition-all duration-300 w-0 group-hover:w-4 ml-0 group-hover:ml-2 opacity-0 group-hover:opacity-100"
                />
              </span>
            </Link>
          </div>

          <div className="md:hidden relative z-10">
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="border border-white/20 bg-white/10 text-gray-200 hover:bg-white/20
                         backdrop-blur-md rounded-xl p-2 transition-all duration-300
                         hover:scale-105 active:scale-95"
            >
              {isOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
              <span className="sr-only">Open menu</span>
            </button>
          </div>
        </div>

        {/* --- PERBAIKAN MENU MOBILE --- */}
        {isOpen && (
          <div
            className="md:hidden absolute left-4 right-4 mt-2 
                          bg-gradient-to-b from-white/10 to-white/5 
                          backdrop-blur-xl border border-white/20 
                          rounded-2xl shadow-2xl shadow-black/20
                          animate-in slide-in-from-top-2 duration-300
                          relative overflow-hidden"
          >
            <div className="absolute inset-0 rounded-2xl bg-gradient-to-b from-purple-500/5 to-lime-400/5 opacity-50"></div>

            <div className="flex flex-col gap-1 p-2 text-gray-200 relative z-10">
              <a
                href="#tentang" // Ganti 'to' menjadi 'href'
                onClick={(e) => handleScroll(e, 'tentang')} // Tambahkan onClick
                className="flex items-center px-4 py-3 hover:bg-white/10 hover:text-white 
                          rounded-xl transition-all duration-300 hover:scale-[1.02]
                          relative overflow-hidden group"
              >
                <div
                  className="absolute inset-0 bg-gradient-to-r from-purple-500/10 to-transparent 
                               scale-0 group-hover:scale-100 transition-transform duration-300 rounded-xl"
                ></div>
                <span className="text-sm relative z-10">Tentang</span>
              </a>
              <a
                href="#fitur" // Ganti 'to' menjadi 'href' dan sesuaikan ID
                onClick={(e) => handleScroll(e, 'fitur')} // Tambahkan onClick
                className="flex items-center px-4 py-3 hover:bg-white/10 hover:text-white 
                          rounded-xl transition-all duration-300 hover:scale-[1.02]
                          relative overflow-hidden group"
              >
                <div
                  className="absolute inset-0 bg-gradient-to-r from-purple-500/10 to-transparent 
                               scale-0 group-hover:scale-100 transition-transform duration-300 rounded-xl"
                ></div>
                <span className="text-sm relative z-10">Fitur</span>
              </a>
              <a
                href="#kontak" // Ganti 'to' menjadi 'href'
                onClick={(e) => handleScroll(e, 'kontak')} // Tambahkan onClick
                className="flex items-center px-4 py-3 hover:bg-white/10 hover:text-white 
                          rounded-xl transition-all duration-300 hover:scale-[1.02]
                          relative overflow-hidden group"
              >
                <div
                  className="absolute inset-0 bg-gradient-to-r from-purple-500/10 to-transparent 
                               scale-0 group-hover:scale-100 transition-transform duration-300 rounded-xl"
                ></div>
                <span className="text-sm relative z-10">Kontak</span>
              </a>
              <div className="border-t border-white/20 mt-2 pt-2">
                <Link
                  to="/roles"
                  className="block w-full bg-gradient-to-r from-[#22C55E] to-[#16A34A] font-medium 
                            rounded-xl px-6 py-2.5 hover:from-teal-300 hover:to-emerald-300 
                            hover:shadow-xl hover:shadow-teal-400/30 hover:scale-[1.02] active:scale-95
                            transition-all duration-300 text-center
                            relative overflow-hidden
                            before:absolute before:inset-0 before:bg-white/20 before:rounded-xl 
                            before:scale-0 hover:before:scale-100 before:transition-transform before:duration-300"
                >
                  <span className="relative z-10">Login</span>
                </Link>
              </div>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
