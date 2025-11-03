import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import SidebarPbf from '../../../components/SidebarPbf';
import NavbarPbf from '../../../components/NavbarPbf';
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
  Image as ImageIcon,
  Package,
  Info,
  Truck // Ditambahkan
} from 'lucide-react';
import axios from 'axios';
import { toast } from 'react-hot-toast';

// --- MODAL TOLAK (REJECT) ---
const RejectReturnModal = ({ show, onClose, onConfirm, isSubmitting }) => {
  const [alasan, setAlasan] = useState('');
  if (!show) return null;

  const handleSubmit = () => {
    if (!alasan.trim()) {
      toast.error('Alasan penolakan pengembalian wajib diisi.');
      return;
    }
    onConfirm(false, alasan); // Kirim 'false' (tidak setuju) dan alasannya
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-white rounded-lg shadow-xl p-8 max-w-md w-full" onClick={e => e.stopPropagation()}>
        <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-red-100 mb-4">
          <XCircle className="h-10 w-10 text-red-600" />
        </div>
        <h3 className="text-xl font-bold text-gray-900 text-center">Tolak Pengajuan Pengembalian?</h3>
        <p className="text-gray-500 mt-2 text-sm text-center">
          Pesanan akan ditandai sebagai 'Pengembalian Ditolak'. Masukkan alasan penolakan Anda.
        </p>
        <div className="mt-6">
          <label htmlFor="alasan_penolakan_retur" className="block text-sm font-medium text-gray-700 mb-1">
            Alasan Penolakan (Wajib)
          </label>
          <textarea
            id="alasan_penolakan_retur"
            rows={3}
            value={alasan}
            onChange={(e) => setAlasan(e.target.value)}
            className="w-full p-2 border border-gray-300 rounded-md focus:ring-emerald-500 focus:border-emerald-500"
            placeholder="Contoh: Bukti foto tidak jelas, barang masih dalam kondisi baik."
          />
        </div>
        <div className="mt-8 flex justify-center gap-4">
          <button
            onClick={onClose}
            disabled={isSubmitting}
            className="py-2.5 px-6 bg-gray-100 text-gray-700 font-semibold rounded-lg hover:bg-gray-200 disabled:opacity-50"
          >
            Batal
          </button>
          <button
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="py-2.5 px-6 bg-red-600 text-white font-semibold rounded-lg hover:bg-red-700 flex items-center justify-center disabled:bg-red-300"
          >
            {isSubmitting ? <Loader2 className="animate-spin h-5 w-5 mr-2"/> : <XCircle size={18} className="mr-2"/>}
            {isSubmitting ? 'Memproses...' : 'Ya, Tolak Pengajuan'}
          </button>
        </div>
      </div>
    </div>
  );
};
// --- AKHIR MODAL TOLAK ---

// --- MODAL SETUJU ---
const ApproveModal = ({ show, onClose, onConfirm, isLoading }) => {
    if (!show) return null;
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={onClose}>
          <div className="bg-white rounded-lg shadow-xl p-8 max-w-md w-full text-center" onClick={e => e.stopPropagation()}>
            <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-emerald-100 mb-4">
              <HelpCircle className="h-10 w-10 text-emerald-600" />
            </div>
            <h3 className="text-xl font-bold text-gray-900">Setujui Pengajuan Pengembalian?</h3>
            <p className="text-gray-500 mt-2 text-sm">
              Anda akan menyetujui pengajuan pengembalian. Apotek akan diminta mengirimkan barang kembali.
            </p>
            <div className="mt-8 flex justify-center gap-4">
              <button
                onClick={onClose}
                disabled={isLoading}
                className="py-2.5 px-6 bg-gray-100 text-gray-700 font-semibold rounded-lg hover:bg-gray-200 disabled:opacity-50"
              >
                Batal
              </button>
              <button
                onClick={() => onConfirm(true)} // Kirim 'true' (setuju)
                disabled={isLoading}
                className="py-2.5 px-6 bg-emerald-600 text-white font-semibold rounded-lg hover:bg-emerald-700 flex items-center justify-center disabled:bg-emerald-300"
              >
                {isLoading ? <Loader2 className="animate-spin h-5 w-5 mr-2"/> : <CheckCircle size={18} className="mr-2"/>}
                {isLoading ? 'Memproses...' : 'Ya, Setujui'}
              </button>
            </div>
          </div>
        </div>
    )
}
// --- AKHIR MODAL SETUJU ---


const KonfirmasiPengembalianPbf = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [data, setData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showApproveModal, setShowApproveModal] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [isActionLoading, setIsActionLoading] = useState(false);
  const username = localStorage.getItem('username');

  const cleanedId = id.replace(':', '');

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      setError(null);
      let token;
      try {
        token = localStorage.getItem('token');
        if (!token) throw new Error('Silakan login terlebih dahulu');
        
        // Panggil endpoint PBF untuk detail pesanan apotek
        const response = await axios.get(`http://localhost:5000/api/pbf/pesanan-apotek/${cleanedId}`, {
          headers: { Authorization: `Bearer ${token}` }
        });

        if (!response.data.success || !response.data.data) {
             throw new Error(response.data.message || 'Gagal mengambil data pengembalian atau format data salah');
        }
        if (response.data.data.pesanan.status !== 'Pengembalian Diajukan') {
              console.warn(`Status pesanan saat ini "${response.data.data.pesanan.status || 'Tidak Diketahui'}".`);
        }
        
        setData(response.data.data.pesanan); // Set hanya data pesanan

      } catch (err) {
        console.error('Error fetching return request:', err);
        setError(err.response?.data?.message || err.message);
        toast.error(err.response?.data?.message || err.message || 'Gagal memuat data pengembalian.');
        if ((err.message.includes('401') || err.message.includes('403') || err.message.includes('login')) && token) {
            navigate('/login/pbf');
        } else if (!token) {
             navigate('/login/pbf');
        }
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, [cleanedId, navigate]);

  const handleAction = async (approve = true, alasan_penolakan = null) => {
    const action = approve ? 'menyetujui' : 'menolak';
    setIsActionLoading(true);
    setError(null);
    toast.dismiss();

    try {
      const token = localStorage.getItem('token');
      if (!token) throw new Error('Sesi tidak valid.');

      // Endpoint PBF yang baru
      const endpoint = `http://localhost:5000/api/pbf/pesanan-apotek/pengembalian/${cleanedId}/${approve ? 'approve' : 'reject'}`;
      
      const payload = approve ? {} : { alasan_penolakan: alasan_penolakan };

      const response = await axios.put(endpoint,
        payload,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (response.data.success) {
        toast.success(`Pengajuan pengembalian berhasil ${action}.`);
        navigate('/pbf/tracking-pengiriman/pengembalian'); // Arahkan ke daftar pengembalian
      } else {
        throw new Error(response.data.message || `Gagal ${action} pengembalian.`);
      }
    } catch (err) {
      const errorMsg = err.response?.data?.message || err.message || `Gagal ${action} pengembalian.`;
      setError(errorMsg);
      toast.error(errorMsg);
    } finally {
      setIsActionLoading(false);
      setShowApproveModal(false);
      setShowRejectModal(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    try {
        const date = new Date(dateString);
        if (isNaN(date.getTime())) return '-';
        return date.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' });
    } catch (e) {
        console.error("Error formatting date:", e);
        return '-';
    }
  };

  const handleLogout = () => {
    localStorage.clear();
    navigate('/');
  };

 if (isLoading) {
     return (
       <div className="flex flex-col justify-center items-center h-screen bg-gradient-to-br from-slate-50 via-white to-emerald-50">
          <div className="relative">
            <Loader2 className="animate-spin h-12 w-12 text-emerald-600" />
            <div className="absolute inset-0 h-12 w-12 rounded-full border-4 border-emerald-200 animate-ping opacity-20"></div>
          </div>
          <p className="mt-4 text-slate-700 font-medium">Memuat Konfirmasi Pengembalian...</p>
      </div>
    );
  }

  if (error && !data) {
     return (
       <div className="flex min-h-screen bg-gradient-to-br from-slate-50 via-white to-emerald-50">
        <SidebarPbf isCollapsed={isCollapsed} setIsCollapsed={setIsCollapsed} />
        <div className={`flex-1 flex flex-col transition-all duration-300 ${isCollapsed ? 'ml-16' : 'ml-64'}`}>
          <NavbarPbf onLogout={handleLogout} username={username} />
          <main className="flex-1 flex items-center justify-center p-6 pt-[72px]">
            <div className="bg-white p-8 rounded-2xl shadow-lg border border-red-200 text-center max-w-md">
              <AlertCircle className="mx-auto h-12 w-12 text-red-500 mb-4" />
              <h2 className="text-xl font-bold text-red-800 mb-2">Gagal Memuat Data</h2>
              <p className="text-red-600 mb-6">{error}</p>
              <button
                 onClick={() => navigate('/pbf/tracking-pengiriman/pengembalian')}
                 className="flex items-center gap-2 px-4 py-2.5 border border-slate-300 text-slate-700 font-medium rounded-lg hover:bg-slate-100 transition mx-auto"
               >
                 <ArrowLeft size={18} />
                 Kembali ke Daftar Pengembalian
               </button>
            </div>
          </main>
        </div>
      </div>
    );
  }

  if (!data) {
     return (
       <div className="flex min-h-screen bg-gradient-to-br from-slate-50 via-white to-emerald-50">
        <SidebarPbf isCollapsed={isCollapsed} setIsCollapsed={setIsCollapsed} />
        <div className={`flex-1 flex flex-col transition-all duration-300 ${isCollapsed ? 'ml-16' : 'ml-64'}`}>
          <NavbarPbf onLogout={handleLogout} username={username} />
          <main className="flex-1 flex items-center justify-center p-6 pt-[72px]">
            <div className="bg-white p-8 rounded-2xl shadow-lg border border-slate-200 text-center max-w-md">
              <FileText className="mx-auto h-12 w-12 text-yellow-500 mb-4" />
              <h2 className="text-xl font-bold text-slate-800 mb-2">Data Pengembalian Tidak Ditemukan</h2>
              <p className="text-slate-600 mb-6">Tidak dapat menemukan detail pengembalian untuk pesanan ini.</p>
               <button
                 onClick={() => navigate('/pbf/tracking-pengiriman/pengembalian')}
                 className="flex items-center gap-2 px-4 py-2.5 border border-slate-300 text-slate-700 font-medium rounded-lg hover:bg-slate-100 transition mx-auto"
               >
                 <ArrowLeft size={18} />
                 Kembali ke Daftar Pengembalian
               </button>
            </div>
          </main>
        </div>
      </div>
    );
  }

  const info = data;
  const canTakeAction = info.status === 'Pengembalian Diajukan';
  const alasanPengajuan = info.alasan_pengembalian || (info.catatan_khusus ? info.catatan_khusus.split('[PENGEMBALIAN DIAJUKAN]:')[1]?.trim() : '-') || 'Tidak ada alasan.';

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-slate-50 via-white to-emerald-50">
      <SidebarPbf isCollapsed={isCollapsed} setIsCollapsed={setIsCollapsed} />
      <div className={`flex-1 flex flex-col transition-all duration-300 ${isCollapsed ? 'ml-16' : 'ml-64'}`}>
        <NavbarPbf onLogout={handleLogout} username={username} />

        <main className="flex-1 overflow-auto pt-[72px] px-12 py-8">
          <div className="max-w-5xl mx-auto">
            
            {/* --- HEADER BARU --- */}
            <div className="mb-10 relative">
              <div className="absolute -top-20 -left-20 w-72 h-72 bg-indigo-200 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob"></div>
              <div className="absolute -top-20 -right-20 w-72 h-72 bg-purple-200 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000"></div>

              <div className="relative">
                 <button
                    onClick={() => navigate('/pbf/tracking-pengiriman/pengembalian')}
                    className="mb-4 inline-flex items-center text-emerald-600 hover:text-emerald-700 transition-colors text-sm font-medium"
                  >
                    <ArrowLeft size={16} className="mr-1" /> Kembali
                  </button>
                <div className="flex items-center gap-3">
                  <div className="flex items-center justify-center w-12 h-12 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl shadow-lg">
                    <AlertCircle className="text-white" size={24} />
                  </div>
                  <div>
                    <h1 className="text-4xl font-bold bg-gradient-to-r from-slate-900 via-indigo-900 to-purple-900 bg-clip-text text-transparent">
                      Konfirmasi Pengembalian
                    </h1>
                    <p className="text-slate-600 text-lg mt-1">Pesanan ID: <span className="font-medium text-slate-700 font-mono">#{String(info.id).padStart(6, '0')}</span></p>
                  </div>
                </div>
              </div>
            </div>
            {/* --- AKHIR HEADER BARU --- */}

            {error && !isLoading && (
              <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 rounded-xl flex items-center gap-3">
                <AlertCircle size={20} />
                <span>{error}</span>
              </div>
            )}

            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden relative z-10">
               <div className="p-8 border-b border-slate-200">
                  <h3 className="text-lg font-bold text-slate-900 mb-6 flex items-center gap-2">
                    <FileText size={20} className="text-emerald-600" />
                    Detail Pengajuan dari Apotek
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      
                      <div className="space-y-1">
                          <span className="text-sm font-medium text-slate-500">Status Saat Ini</span>
                          <div className="bg-indigo-50 p-3 rounded-lg border border-indigo-200">
                              <span className="font-bold text-indigo-700 text-base">{info.status || '-'}</span>
                          </div>
                      </div>
                      
                       <div className="space-y-1">
                           <span className="text-sm font-medium text-slate-500">Dana Pengembalian</span>
                           <div className="bg-emerald-50 p-3 rounded-lg border border-emerald-200">
                             <span className="font-bold text-emerald-700 text-base">Rp. {(info.total_harga || 0).toLocaleString('id-ID')}</span>
                           </div>
                       </div>
                       
                       <div className="space-y-1">
                           <span className="text-sm font-medium text-slate-500">Diajukan oleh (Apotek)</span>
                           <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
                             <span className="font-semibold text-slate-900 text-base">{info.nama_apotek}</span>
                           </div>
                       </div>
                       
                       <div className="space-y-1">
                           <span className="text-sm font-medium text-slate-500">Tanggal Pengajuan</span>
                           <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
                             <span className="font-semibold text-slate-900 text-base">{formatDate(info.updated_at)}</span>
                           </div>
                       </div>
                       
                       <div className="space-y-1">
                           <span className="text-sm font-medium text-slate-500">ID Pesanan Awal</span>
                           <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
                             <span className="font-bold text-slate-900 font-mono text-base">#{String(info.id).padStart(6, '0')}</span>
                           </div>
                       </div>
                       
                       <div className="space-y-1">
                           <span className="text-sm font-medium text-slate-500">Surat Pesanan Awal</span>
                           <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 flex items-center justify-between">
                             <span className="font-semibold text-slate-900 text-base">{info.nomor_pesanan || `Pesanan #${String(info.id).padStart(6, '0')}`}</span>
                             <Link
                                to={`/pbf/pengelolaan-pesanan/surat/${info.id}`} // Link ke surat pesanan apotek
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-sm font-medium text-emerald-600 hover:underline inline-flex items-center gap-1"
                              >
                                Lihat Dokumen <ExternalLink size={14} />
                              </Link>
                           </div>
                       </div>

                       <div className="space-y-1 md:col-span-2">
                          <span className="text-sm font-medium text-slate-500">Alasan Pengembalian</span>
                          <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
                             <p className="text-slate-900 text-base whitespace-pre-wrap">{alasanPengajuan}</p>
                          </div>
                       </div>

                       <div className="space-y-1 md:col-span-2">
                           <span className="text-sm font-medium text-slate-500">Bukti Foto dari Apotek</span>
                           {info.bukti_foto_pengembalian ? ( // <-- Gunakan field yang benar
                             <div className="bg-slate-50 p-2 rounded-lg border border-slate-200 w-full max-w-sm">
                               <img
                                  src={`http://localhost:5000/${info.bukti_foto_pengembalian.replace(/\\/g, '/')}`}
                                  alt="Bukti Pengembalian"
                                  className="w-full h-auto object-contain rounded-md"
                               />
                             </div>
                           ) : (
                             <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 text-slate-500 flex items-center gap-2 text-sm">
                                <ImageIcon size={18} className="flex-shrink-0"/>
                                <span>Tidak ada bukti foto yang diunggah.</span>
                             </div>
                          )}
                       </div>
                  </div>
               </div>

               <div className="p-6 flex flex-col sm:flex-row justify-end items-center gap-3 border-t border-slate-200">
                 {canTakeAction ? (
                   <>
                     <p className="text-sm text-slate-600 mr-auto">Tindakan Anda bersifat final.</p>
                     <button
                       onClick={() => setShowRejectModal(true)}
                       className="w-full sm:w-auto px-6 py-2.5 border border-slate-300 text-slate-700 font-medium rounded-lg hover:bg-slate-100 transition flex items-center justify-center gap-2"
                       disabled={isActionLoading}
                     >
                       {isActionLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <XCircle size={18} />}
                       Tolak Pengajuan
                     </button>
                     <button
                       onClick={() => setShowApproveModal(true)} // Ganti ke setShowApproveModal
                       className="w-full sm:w-auto px-6 py-2.5 bg-emerald-600 text-white font-medium rounded-lg hover:bg-emerald-700 transition disabled:bg-slate-400 flex items-center justify-center gap-2"
                       disabled={isActionLoading}
                     >
                       {isActionLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle size={18} />}
                       Setujui Pengembalian
                     </button>
                   </>
                 ) : (
                    <p className="text-sm text-slate-600 mr-auto">Tindakan telah diambil untuk pengajuan ini.</p>
                 )}
               </div>
            </div>
          </div>
        </main>
      </div>

      {/* Modal Setuju */}
      <ApproveModal
        show={showApproveModal}
        onClose={() => setShowApproveModal(false)}
        onConfirm={handleAction}
        isLoading={isActionLoading}
      />

      {/* Modal Tolak */}
      <RejectReturnModal
        show={showRejectModal}
        onClose={() => setShowRejectModal(false)}
        onConfirm={handleAction}
        isSubmitting={isActionLoading}
      />

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

export default KonfirmasiPengembalianPbf;