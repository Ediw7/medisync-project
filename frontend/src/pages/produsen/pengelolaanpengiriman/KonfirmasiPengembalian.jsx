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
  Image as ImageIcon,
  Package,
  Info
} from 'lucide-react';
import axios from 'axios';
import { toast } from 'react-hot-toast';

const KonfirmasiPengembalian = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [data, setData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showModal, setShowModal] = useState(false);
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

        console.log('Fetching return request for ID:', cleanedId);

        const response = await axios.get(`http://localhost:5000/api/produsen/pesanan-masuk/pengembalian/${cleanedId}`, {
          headers: { Authorization: `Bearer ${token}` }
        });

        if (!response.data.success || !response.data.data) {
             throw new Error(response.data.message || 'Gagal mengambil data pengembalian atau format data salah');
        }

        if (response.data.data.status !== 'Pengembalian Diajukan') {
              console.warn(`Status pesanan saat ini "${response.data.data.status || 'Tidak Diketahui'}".`);
        }
        
        const responseData = response.data.data;
        
        const totalHargaKeseluruhan = (responseData.detail_pesanan || []).reduce((acc, item) => acc + (Number(item.total_harga) || 0), 0);

        setData({
            ...responseData,
            total_harga_awal_calculasi: totalHargaKeseluruhan || responseData.total_harga || 0
        });

      } catch (err) {
        console.error('Error fetching return request:', err);
        setError(err.response?.data?.message || err.message);
        toast.error(err.response?.data?.message || err.message || 'Gagal memuat data pengembalian.');
        if ((err.message.includes('401') || err.message.includes('403') || err.message.includes('login')) && token) {
            navigate('/login/produsen');
        } else if (!token) {
             navigate('/login/produsen');
        }
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, [cleanedId, navigate]);

   const handleAction = async (approve = true) => {
    const action = approve ? 'menyetujui' : 'menolak';
    setIsActionLoading(true);
    setError(null);
    toast.dismiss();

    try {
      const token = localStorage.getItem('token');
      if (!token) throw new Error('Sesi tidak valid.');

      const endpoint = `http://localhost:5000/api/produsen/pesanan-masuk/pengembalian/${cleanedId}/${approve ? 'approve' : 'reject'}`;

      const response = await axios.put(endpoint,
        approve ? {} : { alasan_penolakan: 'Ditolak oleh produsen' },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (response.data.success) {
        toast.success(`Pengajuan pengembalian berhasil ${action}.`);
        if (approve) {
            navigate(`/produsen/pengelolaan-pengiriman`);
        } else {
             navigate('/produsen/pengelolaan-pengiriman/pengembalian');
        }
      } else {
        throw new Error(response.data.message || `Gagal ${action} pengembalian.`);
      }
    } catch (err) {
      const errorMsg = err.response?.data?.message || err.message || `Gagal ${action} pengembalian.`;
      setError(errorMsg);
      toast.error(errorMsg);
    } finally {
      setIsActionLoading(false);
      setShowModal(false);
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
        <SidebarProdusen isCollapsed={isCollapsed} setIsCollapsed={setIsCollapsed} />
        <div className={`flex-1 flex flex-col transition-all duration-300 ${isCollapsed ? 'ml-16' : 'ml-64'}`}>
          <NavbarProdusen onLogout={handleLogout} username={username} />
          <main className="flex-1 flex items-center justify-center p-6 pt-[72px]">
            <div className="bg-white p-8 rounded-2xl shadow-lg border border-red-200 text-center max-w-md">
              <AlertCircle className="mx-auto h-12 w-12 text-red-500 mb-4" />
              <h2 className="text-xl font-bold text-red-800 mb-2">Gagal Memuat Data</h2>
              <p className="text-red-600 mb-6">{error}</p>
              <button
                 onClick={() => navigate('/produsen/pengelolaan-pengiriman/pengembalian')}
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
        <SidebarProdusen isCollapsed={isCollapsed} setIsCollapsed={setIsCollapsed} />
        <div className={`flex-1 flex flex-col transition-all duration-300 ${isCollapsed ? 'ml-16' : 'ml-64'}`}>
          <NavbarProdusen onLogout={handleLogout} username={username} />
          <main className="flex-1 flex items-center justify-center p-6 pt-[72px]">
            <div className="bg-white p-8 rounded-2xl shadow-lg border border-slate-200 text-center max-w-md">
              <FileText className="mx-auto h-12 w-12 text-yellow-500 mb-4" />
              <h2 className="text-xl font-bold text-slate-800 mb-2">Data Pengembalian Tidak Ditemukan</h2>
              <p className="text-slate-600 mb-6">Tidak dapat menemukan detail pengembalian untuk pesanan ini.</p>
               <button
                 onClick={() => navigate('/produsen/pengelolaan-pengiriman/pengembalian')}
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


  return (
    <div className="flex min-h-screen bg-gradient-to-br from-slate-50 via-white to-emerald-50">
      <SidebarProdusen isCollapsed={isCollapsed} setIsCollapsed={setIsCollapsed} />
      <div className={`flex-1 flex flex-col transition-all duration-300 ${isCollapsed ? 'ml-16' : 'ml-64'}`}>
        <NavbarProdusen onLogout={handleLogout} username={username} />

        <main className="flex-1 overflow-auto pt-[72px] px-12 py-8">
          <div className="max-w-5xl mx-auto">
            <button
              onClick={() => navigate('/produsen/pengelolaan-pengiriman/pengembalian')}
              className="mb-6 inline-flex items-center text-emerald-600 hover:text-emerald-700 transition-colors text-sm font-medium"
            >
              <ArrowLeft size={16} className="mr-1" /> Kembali ke Daftar Pengembalian
            </button>

            {error && !isLoading && (
              <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 rounded-xl flex items-center gap-3">
                <AlertCircle size={20} />
                <span>{error}</span>
              </div>
            )}

            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
               <div className="bg-gradient-to-r from-emerald-500 to-teal-600 px-6 py-5 border-b border-slate-200 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                  <div>
                    <h1 className="text-2xl font-bold text-white flex items-center gap-2">
                       <AlertCircle size={24} />
                       Konfirmasi Pengajuan Pengembalian
                    </h1>
                    <p className="text-sm text-emerald-50 mt-1">Pesanan ID: <span className="font-mono">#{String(info.id).padStart(6, '0')}</span></p>
                  </div>
                   {!canTakeAction && (
                        <div className={`px-4 py-2 rounded-full border-2 text-sm font-semibold flex items-center gap-2 bg-white ${
                             info.status === 'Pengembalian Disetujui' || info.status === 'Dikembalikan' ? 'text-emerald-700 border-emerald-200' :
                             info.status === 'Pengembalian Ditolak' ? 'text-red-700 border-red-200' :
                             'text-slate-700 border-slate-200'
                         }`}>
                           {info.status === 'Pengembalian Disetujui' || info.status === 'Dikembalikan' ? <CheckCircle size={16} /> :
                            info.status === 'Pengembalian Ditolak' ? <XCircle size={16} /> : null}
                           Status: {info.status}
                        </div>
                   )}
               </div>

               <div className="p-8 border-b border-slate-200">
                  <h3 className="text-lg font-bold text-slate-900 mb-6 flex items-center gap-2">
                    <FileText size={20} className="text-emerald-600" />
                    Detail Pengajuan
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
                           <span className="text-sm font-medium text-slate-500">Diajukan oleh (PBF)</span>
                           <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
                             <span className="font-semibold text-slate-900 text-base">{info.nama_pbf}</span>
                           </div>
                       </div>
                       
                       <div className="space-y-1">
                           <span className="text-sm font-medium text-slate-500">Tanggal Pengajuan</span>
                           <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
                             <span className="font-semibold text-slate-900 text-base">{formatDate(info.tanggal_pengajuan_pengembalian || info.tanggal_pesanan)}</span>
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
                             <span className="font-semibold text-slate-900 text-base">{info.nomor_po || `Pesanan #${String(info.id).padStart(6, '0')}`}</span>
                             <Link
                                to={`/produsen/pengelolaan-pengiriman/detail/${info.id}/surat`}
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
                             <p className="text-slate-900 text-base whitespace-pre-wrap">{info.alasan_pengembalian || '-'}</p>
                          </div>
                       </div>

                       <div className="space-y-1 md:col-span-2">
                           <span className="text-sm font-medium text-slate-500">Bukti Foto dari PBF</span>
                           {info.bukti_foto ? (
                             <div className="bg-slate-50 p-2 rounded-lg border border-slate-200 w-full max-w-sm">
                               <img
                                  src={`http://localhost:5000/${info.bukti_foto.replace(/\\/g, '/')}`}
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
                       onClick={() => handleAction(false)}
                       className="w-full sm:w-auto px-6 py-2.5 border border-slate-300 text-slate-700 font-medium rounded-lg hover:bg-slate-100 transition flex items-center justify-center gap-2"
                       disabled={isActionLoading}
                     >
                       {isActionLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <XCircle size={18} />}
                       Tolak Pengajuan
                     </button>
                     <button
                       onClick={() => setShowModal(true)}
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

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white rounded-lg shadow-xl p-8 max-w-md w-full text-center">
            <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-emerald-100 mb-4">
              <HelpCircle className="h-10 w-10 text-emerald-600" />
            </div>
            <h3 className="text-xl font-bold text-gray-900">Setujui Pengajuan Pengembalian?</h3>
            <p className="text-gray-500 mt-2 text-sm">
              Anda akan menyetujui pengajuan pengembalian untuk pesanan ini. Pengiriman retur akan dijadwalkwkan. Dana akan dikembalikan setelah barang diterima.
            </p>
            <div className="mt-8 flex justify-center gap-4">
              <button
                onClick={() => setShowModal(false)}
                disabled={isActionLoading}
                className="py-2.5 px-6 bg-gray-100 text-gray-700 font-semibold rounded-lg hover:bg-gray-200 disabled:opacity-50"
              >
                Batal
              </button>
              <button
                onClick={() => handleAction(true)}
                disabled={isActionLoading}
                className="py-2.5 px-6 bg-emerald-600 text-white font-semibold rounded-lg hover:bg-emerald-700 flex items-center justify-center disabled:bg-emerald-300"
              >
                {isActionLoading ? <Loader2 className="animate-spin h-5 w-5 mr-2"/> : <CheckCircle size={18} className="mr-2"/>}
                {isActionLoading ? 'Memproses...' : 'Ya, Setujui'}
              </button>
            </div>
          </div>
        </div>
      )}

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

export default KonfirmasiPengembalian;