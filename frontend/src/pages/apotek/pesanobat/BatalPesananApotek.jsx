import React, { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom'; // Import Link (walaupun tidak terpakai, tapi ada di file Anda)
import NavbarApotek from '../../../components/NavbarApotek';
import { AlertCircle, Loader2, ArrowLeft, XCircle, Check, Package ,Edit, Info } from 'lucide-react'; // Import Edit dan Info
import axios from 'axios';
import { toast } from 'react-hot-toast';

const BatalPesananApotek = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const username = localStorage.getItem('username');

  // Daftar alasan pembatalan
  const reasonsList = [
    { id: 'ubah_detail', label: 'Ingin mengubah detail pesanan', icon: <Edit /> },
    { id: 'salah_pbf', label: 'Salah memilih PBF (Pedagang Besar Farmasi)', icon: <Package /> },
    { id: 'berubah_pikiran', label: 'Tidak jadi memesan / berubah pikiran', icon: <XCircle /> },
    { id: 'lainnya', label: 'Lainnya', icon: <Info /> },
  ];

  const [selectedReason, setSelectedReason] = useState(null);
  const [error, setError] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    toast.dismiss();

    if (!selectedReason) {
      const msg = 'Anda harus memilih setidaknya satu alasan pembatalan.';
      setError(msg);
      toast.error(msg);
      return;
    }

    setIsSubmitting(true);
    const toastId = toast.loading('Mengajukan pembatalan...');

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Sesi tidak valid. Silakan login ulang.');
      }

      // --- PERBAIKAN ENDPOINT DI SINI ---
      // URL LAMA: `http://localhost:5000/api/apotek/pesanan/${id}/batalkan`
      // URL BARU:
      const response = await axios.put(`http://localhost:5000/api/apotek/batalkan/${id}`, {
        alasan: selectedReason, // Kirim alasan yang dipilih
      }, {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      // --- AKHIR PERBAIKAN ---

      if (!response.data.success) {
        throw new Error(response.data.message || 'Gagal terhubung ke server.');
      }

      toast.success('Pengajuan pembatalan berhasil dikirim.', { id: toastId });
      navigate('/apotek/pesan-obat'); // Arahkan kembali ke daftar pesanan

    } catch (err) {
      const errorMsg = err.response?.data?.message || err.message;
      setError(errorMsg);
      toast.error(errorMsg, { id: toastId });
      if (err.response?.status === 401) {
        navigate('/login/apotek');
      }
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const handleLogout = () => {
    localStorage.clear();
    navigate('/');
  };

  return (
    <div className="flex min-h-screen bg-slate-50">
      <div className="flex-1 flex flex-col">
        <NavbarApotek onLogout={handleLogout} username={username} />
        
        <main className="flex-1 overflow-auto pt-[72px] px-4 sm:px-12 py-8">
          <div className="max-w-3xl mx-auto">
            
            {/* Header Halaman */}
            <div className="mb-10 relative">
              <div className="absolute -top-20 -left-20 w-72 h-72 bg-red-200 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob"></div>
              <div className="absolute -top-20 -right-20 w-72 h-72 bg-yellow-200 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000"></div>

              <div className="relative">
                <button
                  onClick={() => navigate(-1)}
                  className="mb-4 inline-flex items-center text-emerald-600 hover:text-emerald-700 transition-colors text-sm font-medium"
                >
                  <ArrowLeft size={16} className="mr-1" /> Kembali
                </button>
                <div className="flex items-center gap-3">
                  <div className="flex items-center justify-center w-12 h-12 bg-gradient-to-br from-red-500 to-orange-600 rounded-xl shadow-lg">
                    <XCircle className="text-white" size={24} />
                  </div>
                  <div>
                    <h1 className="text-4xl font-bold bg-gradient-to-r from-slate-900 via-red-900 to-orange-900 bg-clip-text text-transparent">
                      Batalkan Pesanan
                    </h1>
                    <p className="text-slate-600 text-lg mt-1">Pesanan ID: <span className="font-medium text-slate-700 font-mono">#{String(id).padStart(6, '0')}</span></p>
                  </div>
                </div>
              </div>
            </div>

            {error && (
              <div className="mb-6 p-4 bg-red-50 text-red-700 rounded-lg border border-red-200 flex items-center gap-3 text-sm">
                <AlertCircle className="h-5 w-5 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6 sm:p-8">
              <form onSubmit={handleSubmit}>
                <h3 className="text-lg font-semibold text-slate-800 mb-4">Pilih Alasan Pembatalan</h3>
                <div className="space-y-3">
                  {reasonsList.map((reason) => (
                    <label 
                      key={reason.id} 
                      htmlFor={reason.id} 
                      className={`flex items-center gap-4 p-4 rounded-lg border-2 cursor-pointer transition-all duration-200 ${
                        selectedReason === reason.label
                          ? 'bg-emerald-50 border-emerald-500 ring-2 ring-emerald-300'
                          : 'bg-white border-slate-200 hover:bg-slate-50 hover:border-slate-300'
                      }`}
                    >
                      <input
                        type="radio"
                        id={reason.id}
                        name="alasan_pembatalan"
                        value={reason.label}
                        checked={selectedReason === reason.label}
                        onChange={() => setSelectedReason(reason.label)}
                        className="h-4 w-4 text-emerald-600 border-slate-300 focus:ring-emerald-500"
                      />
                      {/* Menambahkan ikon di sini */}
                      <span className={`text-slate-500 ${selectedReason === reason.label ? 'text-emerald-600' : ''}`}>
                        {React.cloneElement(reason.icon, { size: 20 })}
                      </span>
                      <span className="text-sm font-medium text-slate-700">{reason.label}</span>
                    </label>
                  ))}
                </div>

                <div className="flex flex-col-reverse sm:flex-row justify-end gap-3 mt-10 pt-6 border-t border-slate-200">
                  <button
                    type="button"
                    onClick={() => navigate(-1)}
                    className="w-full sm:w-auto py-2.5 px-6 bg-slate-100 text-slate-700 font-semibold rounded-lg hover:bg-slate-200 transition"
                    disabled={isSubmitting}
                  >
                    Kembali
                  </button>
                  <button
                    type="submit"
                    className="w-full sm:w-auto py-2.5 px-6 bg-red-600 text-white font-semibold rounded-lg hover:bg-red-700 transition flex items-center justify-center gap-2 disabled:bg-red-300"
                    disabled={isSubmitting || !selectedReason}
                  >
                    {isSubmitting ? <Loader2 className="h-5 w-5 animate-spin" /> : <XCircle size={18} />}
                    {isSubmitting ? 'Memproses...' : 'Ajukan Pembatalan'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </main>
      </div>
      
      <style jsx global>{`
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

export default BatalPesananApotek;