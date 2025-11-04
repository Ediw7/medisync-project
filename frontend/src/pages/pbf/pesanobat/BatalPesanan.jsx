import React, { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import SidebarPbf from '../../../components/SidebarPbf';
import NavbarPbf from '../../../components/NavbarPbf';
import { 
    AlertCircle, 
    Loader2, 
    XCircle, // Untuk header
    ArrowLeft, // Untuk tombol kembali
    CheckCircle // Untuk checkbox
} from 'lucide-react';
import axios from 'axios';
import { toast } from 'react-hot-toast'; // Mengganti alert

const BatalPesanan = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const username = localStorage.getItem('username');

  const reasonsList = [
    'Ingin mengubah alamat pengiriman',
    'Ingin memesan ulang dengan detail yang berbeda',
    'Produk atau layanan tidak sesuai dengan yang diharapkan',
    'Lainnya', // Tetap string sederhana
  ];
  
  const [selectedReason, setSelectedReason] = useState(null); // Diubah dari array ke string/null
  const [catatanLainnya, setCatatanLainnya] = useState(''); // <-- STATE BARU
  const [error, setError] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // --- PERBAIKAN: Menggunakan Radio Button Logic ---
  const handleReasonChange = (reason) => {
    setSelectedReason(reason);
  };
  // --- AKHIR PERBAIKAN ---

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);
    toast.dismiss();

    if (!selectedReason) {
      const errorMsg = 'Anda harus memilih setidaknya satu alasan pembatalan.';
      setError(errorMsg);
      toast.error(errorMsg);
      setIsSubmitting(false);
      return;
    }

    // --- PERBAIKAN: Logika Alasan ---
    let alasanFinal = selectedReason;
    if (selectedReason === 'Lainnya') {
      if (!catatanLainnya.trim()) {
        const errorMsg = 'Silakan isi alasan spesifik Anda di kotak catatan.';
        setError(errorMsg);
        toast.error(errorMsg);
        setIsSubmitting(false);
        return;
      }
      alasanFinal = `Lainnya: ${catatanLainnya}`; // Gabungkan
    }
    // --- AKHIR PERBAIKAN ---

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        toast.error('Sesi berakhir, silakan login kembali.');
        navigate('/login/pbf');
        return;
      }

      const response = await axios.put(`http://localhost:5000/api/pbf/pesanan/${id}/request-batalkan`, {
        alasan: alasanFinal, // Kirim alasan final
      }, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.data.success) {
        throw new Error(response.data.message || 'Gagal terhubung ke server.');
      }

      toast.success('Pengajuan pembatalan berhasil dikirim.');
      navigate('/pbf/pesan-obat');
    } catch (err) {
      const errorMsg = err.response?.data?.message || err.message;
      setError(errorMsg);
      toast.error(errorMsg);
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const handleLogout = () => {
    localStorage.clear();
    navigate('/');
  };

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-slate-50 via-white to-emerald-50">
      <SidebarPbf isCollapsed={isCollapsed} setIsCollapsed={setIsCollapsed} />
      <div className={`flex-1 flex flex-col transition-all duration-300 ${isCollapsed ? 'ml-16' : 'ml-64'}`}>
        <NavbarPbf onLogout={handleLogout} username={username} />
        
        <main className="flex-1 overflow-auto pt-[72px] px-12 py-8">
          <div className="max-w-4xl mx-auto">
            
           <button
                onClick={() => navigate(-1)} // Tombol kembali
                className="mb-6 inline-flex items-center text-emerald-600 hover:text-emerald-700 transition-colors text-sm font-medium relative z-20"
              >
              <ArrowLeft size={16} className="mr-1" />
              Kembali
            </button>

            {/* Header Halaman */}
            <div className="mb-10 relative">
              <div className="absolute -top-20 -left-20 w-72 h-72 bg-red-200 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob"></div>
              <div className="absolute -top-20 -right-20 w-72 h-72 bg-pink-200 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000"></div>

              <div className="relative flex items-center gap-3">
                <div className="flex items-center justify-center w-12 h-12 bg-gradient-to-br from-red-500 to-pink-600 rounded-xl shadow-lg">
                  <XCircle className="text-white" size={24} />
                </div>
                <div>
                  <h1 className="text-4xl font-bold bg-gradient-to-r from-slate-900 via-red-900 to-pink-900 bg-clip-text text-transparent">
                    Ajukan Pembatalan Pesanan
                  </h1>
                  <p className="text-slate-600 text-lg mt-1">Pesanan ID: <span className="font-mono font-medium text-slate-700">#{String(id).padStart(6, '0')}</span></p>
                </div>
              </div>
            </div>
            
            {/* Kartu Form */}
            <div className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden">
              <form onSubmit={handleSubmit}>
                {/* Header Kartu */}
                <div className="bg-slate-50 px-8 py-5 border-b border-slate-200">
                    <h2 className="text-lg font-semibold text-slate-800">Pilih Alasan Pembatalan</h2>
                    <p className="text-sm text-slate-500 mt-1">Pilih salah satu alasan. Pengajuan ini akan ditinjau oleh Produsen.</p>
                </div>
                
                {/* Konten Form (Checkbox yang didesain ulang) */}
                <div className="p-8">
                  {error && (
                    <div className="mb-6 p-4 bg-red-50 text-red-700 rounded-lg border border-red-200 flex items-center gap-3 text-sm">
                      <AlertCircle className="h-5 w-5 flex-shrink-0" />
                      <span>{error}</span>
                    </div>
                  )}
                
                  <div className="space-y-4">
                    {reasonsList.map((reason) => {
                      const isSelected = selectedReason === reason;
                      return (
                        <label 
                          key={reason} 
                          htmlFor={reason} 
                          className={`flex items-center gap-4 p-4 rounded-lg border-2 cursor-pointer transition-all ${
                            isSelected 
                              ? 'bg-emerald-50 border-emerald-500 shadow-sm' 
                              : 'bg-white border-slate-300 hover:bg-slate-50'
                          }`}
                        >
                          <input
                            type="radio" // --- Ganti ke Radio ---
                            id={reason}
                            name="alasan_pembatalan"
                            value={reason}
                            checked={isSelected}
                            onChange={() => handleReasonChange(reason)}
                            className="hidden" // Sembunyikan radio asli
                          />
                          {/* Radio Kustom */}
                          <div className={`w-5 h-5 rounded-full border-2 flex-shrink-0 transition-all ${isSelected ? 'border-emerald-600 bg-white' : 'border-slate-400 bg-white'}`}>
                            {isSelected && <div className="w-full h-full p-0.5"><div className="w-full h-full rounded-full bg-emerald-600"></div></div>}
                          </div>
                          
                          <span className={`text-base ${isSelected ? 'font-semibold text-emerald-900' : 'text-slate-700'}`}>
                            {reason}
                          </span>
                        </label>
                      );
                    })}
                    
                    {/* --- TAMBAHAN: Textarea untuk 'Lainnya' --- */}
                    {selectedReason === 'Lainnya' && (
                        <div className="ml-11 pl-0.5 animate-in fade-in duration-300">
                           <label htmlFor="catatanLainnya" className="block text-sm font-medium text-slate-700 mb-2">
                             Silakan tulis alasan Anda:
                           </label>
                           <textarea
                              id="catatanLainnya"
                              value={catatanLainnya}
                              onChange={(e) => setCatatanLainnya(e.target.value)}
                              className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition"
                              placeholder="Tulis alasan spesifik Anda di sini..."
                              rows={3}
                            />
                        </div>
                    )}
                    {/* --- AKHIR TAMBAHAN --- */}
                  </div>
                </div>

                {/* Footer Tombol Aksi */}
                <div className="flex justify-end items-center gap-3 p-6 bg-slate-50 border-t border-slate-200">
                  <button
                    type="button"
                    onClick={() => navigate(-1)}
                    className="py-2 px-5 bg-slate-100 text-slate-700 font-medium rounded-lg hover:bg-slate-200 transition text-sm"
                    disabled={isSubmitting}
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    className="py-2 px-5 bg-emerald-600 text-white font-medium rounded-lg hover:bg-emerald-700 transition flex items-center gap-2 text-sm disabled:bg-slate-400 disabled:cursor-not-allowed"
                    disabled={isSubmitting || !selectedReason} // Disable jika loading atau tidak ada alasan
                  >
                    {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
                    {isSubmitting ? 'Memproses...' : 'Kirim Pengajuan'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </main>
      </div>
      
      {/* Animasi Blob */}
      <style jsx>{`
        @keyframes blob {
          0%, 100% { transform: translate(0, 0) scale(1); }
          33% { transform: translate(30px, -50px) scale(1.1); }
          66% { transform: translate(-20px, 20px) scale(0.9); }
        }
        .animate-blob {
          animation: blob 7s infinite;
        }
        .animation-delay-2000 {
          animation-delay: 2s;
        }
      `}</style>
    </div>
  );
};

export default BatalPesanan;