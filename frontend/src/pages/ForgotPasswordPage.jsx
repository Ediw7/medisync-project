'use client';

import { useState } from 'react';
import { ArrowLeft, Mail, ShieldCheck, GitBranch, PackageSearch } from 'lucide-react';
import { Link, useParams } from 'react-router-dom';
import axios from 'axios';
import { AnimatedBackground } from '../components/AnimatedBackground';

export default function ForgotPasswordPage() {
  const { role } = useParams();
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const lastRole = localStorage.getItem('lastRole') || 'produsen';

  const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!email.trim()) {
      setError('Email wajib diisi.');
      return;
    }

    if (!validateEmail(email)) {
      setError('Silakan masukkan alamat email yang valid.');
      return;
    }

    setIsSubmitting(true);

    try {
      await axios.post('http://localhost:5000/api/auth/forgot-password', {
        email: email.trim(),
      });

      setSuccess('Jika ada akun dengan email tersebut, tautan reset telah dikirim.');
      setEmail(''); // Kosongkan form jika berhasil
    } catch (err) {
      const errorMessage =
        err.response?.data?.message || 'Terjadi kesalahan saat mencoba mengirim tautan reset.';
      setError(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-200 flex items-center justify-center p-4 relative overflow-hidden">
      <AnimatedBackground />

      {/* Kartu Utama */}
      <div className="relative z-10 w-full max-w-4xl rounded-3xl shadow-2xl grid md:grid-cols-2 overflow-hidden border border-gray-200">
        {/* Kolom branding kiri */}
        <div className="hidden md:block p-10 bg-gradient-to-br from-emerald-600/90 to-[#047857] text-white">
          <div className="h-full flex flex-col justify-center">
            <h2 className="text-3xl font-bold mb-4">Selamat Datang Kembali</h2>
            <p className="text-[#F9FDFE] mb-8">
              Akses dasbor aman Anda dengan fitur sekelas perusahaan.
            </p>

            <div className="space-y-6">
              <div className="flex items-start gap-4">
                <div className="p-2 bg-white/20 rounded-xl flex items-center justify-center">
                  <ShieldCheck className="h-8 w-8 text-white flex-shrink-0" />
                </div>
                <div>
                  <h3 className="font-semibold">Keamanan Terjamin</h3>
                  <p className="text-sm text-[#F9FDFE]">Enkripsi dan kepatuhan tingkat lanjut.</p>
                </div>
              </div>

              <div className="flex items-center space-x-3">
                <div className="p-2 bg-white/20 rounded-xl flex items-center justify-center">
                  <GitBranch className="h-8 w-8 text-white flex-shrink-" />
                </div>
                <div>
                  <h3 className="font-semibold">Sistem Terintegrasi</h3>
                  <p className="text-sm text-[#F9FDFE]">
                    Lacak perubahan dan berkolaborasi dengan mudah.
                  </p>
                </div>
              </div>

              <div className="flex items-center space-x-3">
                <div className="p-2 bg-white/20 rounded-xl flex items-center justify-center">
                  <PackageSearch className="h-8 w-8 text-white flex-shrink-" />
                </div>
                <div>
                  <h3 className="font-semibold">Pencarian Cerdas</h3>
                  <p className="text-sm text-[#F9FDFE]">Temukan apa pun secara instan.</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Kolom form kanan dengan efek glassmorphism */}
        <div className="p-8 bg-gradient-to-br from-white/20 to-white/10 bg-white/20 backdrop-blur-lg border border-white/20 rounded-2xl shadow-lg">
          <div className="h-full flex flex-col justify-center">
            {/* Tautan kembali */}
            <div className="mb-6">
              <Link
                to="/roles"
                className="inline-flex items-center text-emerald-600 hover:text-emerald-700 hover:underline transition-colors duration-200"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Kembali ke Pilih Peran
              </Link>
            </div>

            {/* Ikon dan judul */}
            <div className="text-center mb-8">
              <div className="w-16 h-16 bg-[#047857]/90 rounded-full flex items-center justify-center mx-auto mb-4">
                <Mail className="w-8 h-8 text-gray-100/90" />
              </div>
              <h1 className="text-2xl font-bold text-gray-900 mb-2">Atur Ulang Kata Sandi</h1>
              <p className="text-gray-600">
                Masukkan email akun Anda dan kami akan mengirimkan tautan reset.
              </p>
            </div>

            {/* Pesan Peringatan */}
            <div aria-live="polite">
              {error && (
                <div className="p-3 bg-red-50 text-red-700 rounded-lg text-sm mb-6 border border-red-200">
                  {error}
                </div>
              )}

              {success && (
                <div className="p-3 bg-emerald-50 text-emerald-700 rounded-lg text-sm mb-6 border border-emerald-200">
                  {success}
                </div>
              )}
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                  Alamat Email
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Masukkan email Anda"
                    disabled={isSubmitting}
                    className="w-full pl-10 pr-4 py-3 bg-white/40 backdrop-blur-xl rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 border border-gray-200/80 disabled:bg-gray-100 disabled:cursor-not-allowed"
                    required
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-emerald-600 text-white py-3 rounded-lg hover:bg-emerald-700 font-semibold transition-colors duration-200 disabled:bg-gray-400 disabled:cursor-not-allowed"
              >
                {isSubmitting ? 'Mengirim...' : 'Kirim Tautan Reset'}
              </button>
            </form>

            {/* Tautan Login */}
            <div className="text-center mt-6">
              <p className="text-gray-600">
                Ingat kata sandi Anda?{' '}
                <Link
                  to={`/login/${lastRole}`}
                  className="text-emerald-600 hover:text-emerald-700 hover:underline font-medium transition-colors duration-200"
                >
                  Masuk
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
