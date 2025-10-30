import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import SidebarProdusen from '../../../components/SidebarProdusen';
import NavbarProdusen from '../../../components/NavbarProdusen';
import {
  Loader2,
  ArrowLeft,
  AlertCircle,
  HelpCircle,
  FileText,
  DollarSign,
  User,
  Calendar,
  XCircle,
  CheckCircle,
  ExternalLink,
  Info
} from 'lucide-react';
import axios from 'axios';
import { toast } from 'react-hot-toast'; // Menggunakan toast untuk notifikasi

// --- Modal Konfirmasi ---
const ConfirmationModal = ({ show, onClose, onConfirm, isSubmitting }) => {
  if (!show) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-white rounded-lg shadow-xl p-8 max-w-md w-full text-center">
        <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-yellow-100 mb-4">
          <HelpCircle className="h-10 w-10 text-yellow-600" />
        </div>
        <h3 className="text-xl font-bold text-gray-900">Setujui Pengajuan Pembatalan?</h3>
        <p className="text-gray-500 mt-2 text-sm">
          Anda akan menyetujui pembatalan pesanan ini. Dana akan dikembalikan ke PBF. Tindakan ini tidak dapat diurungkan.
        </p>
        <div className="mt-8 flex justify-center gap-4">
          <button
            onClick={onClose}
            disabled={isSubmitting}
            className="py-2.5 px-6 bg-gray-100 text-gray-700 font-semibold rounded-lg hover:bg-gray-200 disabled:opacity-50"
          >
            Batal
          </button>
          <button
            onClick={() => onConfirm('Dibatalkan')} // Pass 'Dibatalkan' status
            disabled={isSubmitting}
            className="py-2.5 px-6 bg-emerald-600 text-white font-semibold rounded-lg hover:bg-emerald-700 flex items-center justify-center disabled:bg-emerald-300"
          >
            {isSubmitting ? <Loader2 className="animate-spin h-5 w-5 mr-2"/> : <CheckCircle size={18} className="mr-2"/>}
            {isSubmitting ? 'Memproses...' : 'Ya, Batalkan Pesanan'}
          </button>
        </div>
      </div>
    </div>
  );
};


const KonfirmasiPembatalan = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [pesanan, setPesanan] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const username = localStorage.getItem('username');

  // --- LOGIKA FETCH DATA (TIDAK DIUBAH) ---
  useEffect(() => {
    const fetchPesananData = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const token = localStorage.getItem('token');
        if (!token) throw new Error('Silakan login terlebih dahulu');

        const cleanedId = id.replace(':', ''); // Membersihkan ID jika perlu
        
        const response = await axios.get(`http://localhost:5000/api/produsen/pesanan-masuk/${cleanedId}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (response.data.success && response.data.data?.pesanan) {
          if(response.data.data.pesanan.status !== 'Pembatalan Diajukan') {
              console.warn(`Mengakses halaman konfirmasi pembatalan untuk pesanan dengan status: ${response.data.data.pesanan.status}`);
              toast.warn(`Status pesanan saat ini adalah "${response.data.data.pesanan.status}", bukan "Pembatalan Diajukan".`);
          }
          setPesanan(response.data.data.pesanan);
        } else {
          throw new Error(response.data.message || 'Data pesanan tidak ditemukan.');
        }
      } catch (err) {
        const errorMsg = err.response?.data?.message || err.message || 'Gagal memuat data.';
        setError(errorMsg);
        toast.error(errorMsg); // Gunakan toast untuk error
        // Redirect logic
        if ((err.message.includes('401') || err.message.includes('403') || err.message.includes('login')) && localStorage.getItem('token')) {
            navigate('/login/produsen');
        } else if (!localStorage.getItem('token')) {
             navigate('/login/produsen');
        }
      } finally {
        setIsLoading(false);
      }
    };
    fetchPesananData();
  }, [id, navigate]); // Dependensi tetap

  // --- LOGIKA AKSI (TIDAK DIUBAH, HANYA ALERT -> TOAST) ---
  const handleAction = async (newStatus) => {
    setIsSubmitting(true);
    setError(null);
    toast.dismiss(); // Hapus toast sebelumnya

    const actionText = newStatus === 'Dibatalkan' ? 'membatalkan' : 'menolak pembatalan';
    const cleanedId = id.replace(':', '');

    try {
      const token = localStorage.getItem('token');
      if (!token) throw new Error('Sesi tidak valid.');

      const response = await axios.put(`http://localhost:5000/api/produsen/pembatalan/${cleanedId}/konfirmasi-pembatalan`,
        { status: newStatus },
        { headers: { 'Authorization': `Bearer ${token}` } }
      );

      if (response.data.success) {
        toast.success(`Pesanan berhasil ${actionText}.`); // Gunakan toast success
        navigate('/produsen/pengelolaan-pengiriman/pembatalan'); // Arahkan ke daftar pembatalan
      } else {
        throw new Error(response.data.message || `Gagal ${actionText} pesanan.`);
      }
    } catch (err) {
      const errorMsg = err.response?.data?.message || err.message || `Gagal ${actionText} pesanan.`;
      setError(errorMsg);
      toast.error(errorMsg); // Gunakan toast error
    } finally {
      setIsSubmitting(false);
      setShowConfirmModal(false); // Selalu tutup modal
    }
  };

  // --- FORMAT TANGGAL (TIDAK DIUBAH) ---
  const formatDate = (dateString) => {
    if (!dateString) return '-';
    try {
        const date = new Date(dateString);
        if(isNaN(date.getTime())) return '-';
        return date.toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric', timeZone: 'UTC' });
    } catch(e) {
        return '-'; // Return '-' jika error format
    }
  };
  
  const handleLogout = () => {
    localStorage.clear();
    navigate('/');
  };

  // --- RENDER LOADING (DESAIN BARU) ---
  if (isLoading) {
     return (
       <div className="flex flex-col justify-center items-center h-screen bg-gradient-to-br from-slate-50 via-white to-emerald-50">
          <div className="relative">
            <Loader2 className="animate-spin h-12 w-12 text-emerald-600" />
            <div className="absolute inset-0 h-12 w-12 rounded-full border-4 border-emerald-200 animate-ping opacity-20"></div>
          </div>
          <p className="mt-4 text-slate-700 font-medium">Memuat Konfirmasi Pembatalan...</p>
      </div>
    );
  }

  // --- RENDER ERROR UTAMA (DESAIN BARU) ---
  if (error && !pesanan) {
     return (
       <div className="flex min-h-screen bg-gradient-to-br from-slate-50 via-white to-emerald-50">
        <SidebarProdusen isCollapsed={isCollapsed} setIsCollapsed={setIsCollapsed} />
        <div className={`flex-1 flex flex-col transition-all duration-300 ${isCollapsed ? 'ml-16' : 'ml-64'}`}>
          <NavbarProdusen onLogout={handleLogout} username={username} />
          <main className="flex-1 flex items-center justify-center p-6 pt-[72px]">
            <div className="bg-white p-8 rounded-2xl shadow-lg border border-red-200 text-center max-w-md">
              <AlertCircle className="mx-auto h-12 w-12 text-red-500 mb-4" />
              <h2 className="text-xl font-bold text-red-800 mb-2">Gagal Memuat Data</h2>
              <p className="text-red-600 mb-6">{error}</p>
              <button
                 onClick={() => navigate('/produsen/pengelolaan-pengiriman/pembatalan')}
                 className="flex items-center gap-2 px-4 py-2.5 border border-slate-300 text-slate-700 font-medium rounded-lg hover:bg-slate-100 transition mx-auto"
               >
                 <ArrowLeft size={18} />
                 Kembali ke Daftar Pembatalan
               </button>
            </div>
          </main>
        </div>
      </div>
    );
  }

  // --- RENDER DATA TIDAK DITEMUKAN (DESAIN BARU) ---
  if (!pesanan) {
     return (
        <div className="flex min-h-screen bg-gradient-to-br from-slate-50 via-white to-emerald-50">
          <SidebarProdusen isCollapsed={isCollapsed} setIsCollapsed={setIsCollapsed} />
          <div className={`flex-1 flex flex-col transition-all duration-300 ${isCollapsed ? 'ml-16' : 'ml-64'}`}>
            <NavbarProdusen onLogout={handleLogout} username={username} />
            <main className="flex-1 flex items-center justify-center p-6 pt-[72px]">
              <div className="bg-white p-8 rounded-2xl shadow-lg border border-slate-200 text-center max-w-md">
                <FileText className="mx-auto h-12 w-12 text-yellow-500 mb-4" />
                <h2 className="text-xl font-bold text-slate-800 mb-2">Data Pesanan Tidak Ditemukan</h2>
                <p className="text-slate-600 mb-6">Tidak dapat menemukan detail pesanan untuk ID ini.</p>
                 <button
                   onClick={() => navigate('/produsen/pengelolaan-pengiriman/pembatalan')}
                   className="flex items-center gap-2 px-4 py-2.5 border border-slate-300 text-slate-700 font-medium rounded-lg hover:bg-slate-100 transition mx-auto"
                 >
                   <ArrowLeft size={18} />
                   Kembali ke Daftar Pembatalan
                 </button>
              </div>
            </main>
          </div>
        </div>
     );
  }
  
  // --- HITUNG DEADLINE & STATUS (TIDAK DIUBAH) ---
  const deadlineDate = pesanan.tanggal_pengajuan_pembatalan
    ? new Date(new Date(pesanan.tanggal_pengajuan_pembatalan).getTime() + 2 * 24 * 60 * 60 * 1000)
    : null;
  const deadlineFormatted = deadlineDate ? formatDate(deadlineDate) : 'N/A';
  const canTakeAction = pesanan.status === 'Pembatalan Diajukan';

  // --- RENDER UTAMA (DESAIN BARU) ---
  return (
    <div className="flex min-h-screen bg-gradient-to-br from-slate-50 via-white to-emerald-50">
      <SidebarProdusen isCollapsed={isCollapsed} setIsCollapsed={setIsCollapsed} />
      <div className={`flex-1 flex flex-col transition-all duration-300 ${isCollapsed ? 'ml-16' : 'ml-64'}`}>
        <NavbarProdusen onLogout={handleLogout} username={username} />

        <main className="flex-1 overflow-auto pt-[72px] px-12 py-8">
          <div className="max-w-5xl mx-auto">
            <button
              onClick={() => navigate('/produsen/pengelolaan-pengiriman/pembatalan')}
              className="mb-6 inline-flex items-center text-emerald-600 hover:text-emerald-700 transition-colors text-sm font-medium"
            >
              <ArrowLeft size={16} className="mr-1" /> Kembali ke Daftar Pembatalan
            </button>
            
            {error && !isLoading && !isSubmitting && ( // Tampilkan error aksi jika ada
              <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 rounded-xl flex items-center gap-3">
                <AlertCircle size={20} />
                <span>Terjadi kesalahan saat memproses: {error}</span>
              </div>
            )}

            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
               {/* HEADER KARTU */}
               <div className="bg-gradient-to-r from-emerald-500 to-teal-600 px-6 py-5 border-b border-slate-200 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                  <div>
                    <h1 className="text-2xl font-bold text-white flex items-center gap-2">
                       <AlertCircle size={24} />
                       Konfirmasi Pengajuan Pembatalan
                    </h1>
                    <p className="text-sm text-emerald-50 mt-1">Pesanan ID: <span className="font-mono">#{String(pesanan.id).padStart(6, '0')}</span></p>
                  </div>
                   {/* BADGE STATUS JIKA SUDAH TIDAK BISA AKSI */}
                   {!canTakeAction && (
                        <div className={`px-4 py-2 rounded-full border-2 text-sm font-semibold flex items-center gap-2 bg-white ${
                             pesanan.status === 'Dibatalkan' ? 'text-red-700 border-red-200' :
                             'text-slate-700 border-slate-200'
                         }`}>
                           {pesanan.status === 'Dibatalkan' ? <XCircle size={16} /> : null}
                           Status: {pesanan.status}
                        </div>
                   )}
               </div>

               {/* DETAIL GRID */}
               <div className="p-8 border-b border-slate-200">
                  <h3 className="text-lg font-bold text-slate-900 mb-6 flex items-center gap-2">
                    <FileText size={20} className="text-emerald-600" />
                    Detail Pengajuan Pembatalan
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      
                      <div className="space-y-1">
                          <span className="text-sm font-medium text-slate-500">Status Saat Ini</span>
                          <div className="bg-yellow-50 p-3 rounded-lg border border-yellow-200">
                              <span className="font-bold text-yellow-700 text-base">{pesanan.status || '-'}</span>
                          </div>
                      </div>
                      
                      <div className="space-y-1">
                           <span className="text-sm font-medium text-slate-500">Dana Pengembalian</span>
                           <div className="bg-emerald-50 p-3 rounded-lg border border-emerald-200">
                             <span className="font-bold text-emerald-700 text-base">Rp. {(pesanan.total_harga || 0).toLocaleString('id-ID')}</span>
                           </div>
                       </div>
                       
                       <div className="space-y-1">
                           <span className="text-sm font-medium text-slate-500">Diajukan oleh (PBF)</span>
                           <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
                             <span className="font-semibold text-slate-900 text-base">{pesanan.nama_pbf}</span>
                           </div>
                       </div>
                       
                       <div className="space-y-1">
                           <span className="text-sm font-medium text-slate-500">Tanggal Pengajuan</span>
                           <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
                             <span className="font-semibold text-slate-900 text-base">{formatDate(pesanan.tanggal_pengajuan_pembatalan)}</span>
                           </div>
                       </div>
                       
                       <div className="space-y-1">
                           <span className="text-sm font-medium text-slate-500">Batas Waktu Konfirmasi</span>
                           <div className="bg-red-50 p-3 rounded-lg border border-red-200">
                             <span className="font-bold text-red-700 text-base">{deadlineFormatted}</span>
                           </div>
                       </div>

                       <div className="space-y-1">
                           <span className="text-sm font-medium text-slate-500">Surat Pesanan Awal</span>
                           <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 flex items-center justify-between">
                             <span className="font-semibold text-slate-900 text-base">{pesanan.nomor_po || `Pesanan #${String(pesanan.id).padStart(6, '0')}`}</span>
                             <Link
                                to={`/produsen/pengelolaan-pengiriman/detail/${pesanan.id}/surat`}
                                className="text-sm font-medium text-emerald-600 hover:underline inline-flex items-center gap-1"
                              >
                                Lihat Dokumen <ExternalLink size={14} />
                              </Link>
                           </div>
                       </div>

                       <div className="space-y-1 md:col-span-2">
                          <span className="text-sm font-medium text-slate-500">Alasan Pembatalan dari PBF</span>
                          <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
                             <p className="text-slate-900 text-base whitespace-pre-wrap">{pesanan.alasan_pembatalan || '-'}</p>
                          </div>
                       </div>
                  </div>
               </div>

               {/* FOOTER AKSI */}
               <div className="p-6 flex flex-col sm:flex-row justify-end items-center gap-3 border-t border-slate-200">
                 {canTakeAction ? (
                   <>
                     <p className="text-sm text-slate-600 mr-auto">Mohon konfirmasi sebelum batas waktu.</p>
                     <button
                       onClick={() => handleAction('Perlu Dikirim')} // Kembalikan ke status awal jika ditolak
                       className="w-full sm:w-auto px-6 py-2.5 border border-slate-300 text-slate-700 font-medium rounded-lg hover:bg-slate-100 transition flex items-center justify-center gap-2"
                       disabled={isSubmitting}
                     >
                       {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <XCircle size={18} />}
                       Tolak Pengajuan
                     </button>
                     <button
                       onClick={() => setShowConfirmModal(true)} // Tampilkan modal konfirmasi
                       className="w-full sm:w-auto px-6 py-2.5 bg-emerald-600 text-white font-medium rounded-lg hover:bg-emerald-700 transition disabled:bg-slate-400 flex items-center justify-center gap-2"
                       disabled={isSubmitting}
                     >
                       {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle size={18} />}
                       Terima Pengajuan
                     </button>
                   </>
                 ) : (
                    <p className="text-sm text-slate-600 mr-auto">Tindakan telah diambil untuk pengajuan pembatalan ini.</p>
                 )}
               </div>
            </div>
          </div>
        </main>
      </div>

      {/* MODAL */}
      <ConfirmationModal
        show={showConfirmModal}
        onClose={() => setShowConfirmModal(false)}
        onConfirm={handleAction} // handleAction akan dipanggil dgn 'Dibatalkan'
        isSubmitting={isSubmitting}
      />

      {/* STYLE BLOB (JIKA DIPERLUKAN) */}
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

export default KonfirmasiPembatalan;