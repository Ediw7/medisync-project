import React from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertTriangle, Home } from 'lucide-react';

const NotFound = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4 text-center">
      <div className="bg-white p-8 rounded-2xl shadow-xl border border-slate-200 max-w-md w-full">
        <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <AlertTriangle className="text-red-500" size={32} />
        </div>
        
        <h1 className="text-2xl font-bold text-slate-800 mb-2">Data Tidak Ditemukan</h1>
        <p className="text-slate-600 mb-6">
          Maaf, data untuk QR Code/Batch ID ini tidak ditemukan di dalam Blockchain. 
          Mungkin ID salah atau produk belum terdaftar.
        </p>

        <button 
          onClick={() => navigate('/')}
          className="w-full bg-emerald-600 text-white py-3 rounded-xl font-semibold hover:bg-emerald-700 transition flex items-center justify-center gap-2"
        >
          <Home size={20} /> Kembali ke Beranda
        </button>
      </div>
    </div>
  );
};

export default NotFound;