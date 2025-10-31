import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import SidebarPbf from '../../../components/SidebarPbf';
import NavbarPbf from '../../../components/NavbarPbf';
import {
  Loader2,
  ArrowLeft,
  AlertCircle,
  FileText,
  Clock,
  CheckCircle,
  XCircle,
  DollarSign,
  User,
  MessageSquare
} from 'lucide-react';
import axios from 'axios';
import { toast } from 'react-hot-toast';

// ... (Komponen StatusTimeline dan InfoCard tidak berubah) ...
// Komponen untuk timeline status
const StatusTimeline = ({ pesanan, alasanPenolakan }) => {
  const { status } = pesanan; // Ambil status dari objek pesanan
  const steps = [
    { name: 'Pengajuan Dibuat', status: 'completed' },
    { name: 'Menunggu Konfirmasi Produsen', status: 'pending' },
    { name: 'Selesai', status: 'pending' }
  ];

  if (status === 'Pembatalan Diajukan') {
    steps[1].status = 'current';
  } else if (status === 'Dibatalkan') {
    steps[1].name = 'Dikonfirmasi Produsen';
    steps[1].status = 'completed';
    steps[2].name = 'Pembatalan Berhasil';
    steps[2].status = 'completed';
  } else if (status === 'Perlu Dikirim' && pesanan.alasan_penolakan && pesanan.alasan_penolakan !== '-') { 
    // MODIFIKASI: Cek status 'Perlu Dikirim' DAN adanya alasan penolakan
    steps[1].name = 'Ditolak Produsen';
    steps[1].status = 'rejected';
    steps[2].name = 'Pembatalan Gagal';
    steps[2].status = 'rejected';
  }

  return (
    <nav aria-label="Progress" className="mt-6 mb-8">
      <ol role="list" className="flex items-center justify-center space-x-4">
        {steps.map((step, index) => (
          <li key={step.name} className="flex-1 relative"> {/* Tambahkan relative */}
            {step.status === 'completed' ? (
              <div className="group flex flex-col items-center text-center">
                <span className="flex items-center">
                  <span className="relative flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-emerald-600">
                    <CheckCircle className="h-6 w-6 text-white" aria-hidden="true" />
                  </span>
                </span>
                <span className="mt-2 text-sm font-medium text-emerald-700">{step.name}</span>
              </div>
            ) : step.status === 'current' ? (
              <div className="group flex flex-col items-center text-center" aria-current="step">
                <span className="flex items-center">
                  <span className="relative flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full border-2 border-emerald-600 bg-emerald-50">
                    <Clock className="h-6 w-6 text-emerald-600 animate-pulse" aria-hidden="true" />
                  </span>
                </span>
                <span className="mt-2 text-sm font-medium text-emerald-700">{step.name}</span>
              </div>
            ) : step.status === 'rejected' ? (
              <div className="group flex flex-col items-center text-center">
                <span className="flex items-center">
                  <span className="relative flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-red-600">
                    <XCircle className="h-6 w-6 text-white" aria-hidden="true" />
                  </span>
                </span>
                <span className="mt-2 text-sm font-medium text-red-700">{step.name}</span>
              </div>
            ) : (
              <div className="group flex flex-col items-center text-center">
                <span className="flex items-center">
                  <span className="relative flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full border-2 border-gray-300">
                    <span className="h-2.5 w-2.5 rounded-full bg-gray-300" aria-hidden="true" />
                  </span>
                </span>
                <span className="mt-2 text-sm font-medium text-gray-500">{step.name}</span>
              </div>
            )}

            {/* Garis penghubung, tidak ditampilkan setelah step terakhir */}
            {index < steps.length - 1 && (
              <div className={`absolute top-5 left-1/2 w-full -ml-px ${
                step.status === 'completed' ? 'bg-emerald-600' : 'bg-gray-300'
              }`} style={{ height: '2px', transform: 'translateX(50%)', zIndex: -1, maxWidth: 'calc(100% - 2.5rem)' }} />
            )}
          </li>
        ))}
      </ol>
       {/* Menampilkan Alasan Penolakan jika ada */}
       {status === 'Perlu Dikirim' && alasanPenolakan && alasanPenolakan !== '-' && ( // Cek status 'Perlu Dikirim'
        <div className="mt-8 p-4 bg-red-50 border border-red-200 rounded-lg text-center">
          <h4 className="font-semibold text-red-800">Alasan Penolakan dari Produsen:</h4>
          <p className="text-red-700 mt-1 italic">"{alasanPenolakan}"</p>
        </div>
      )}
    </nav>
  );
};

// Komponen untuk Card Info
const InfoCard = ({ status, pesanan }) => {
  const formatDate = (dateString) => {
    if (!dateString) return '-';
    try {
        const date = new Date(dateString);
        if(isNaN(date.getTime())) return '-';
        return date.toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric', timeZone: 'UTC' });
    } catch(e) { return '-'; }
  };

  const getCardStyle = () => {
    switch (status) {
      case 'Pembatalan Diajukan':
        return {
          icon: <Clock size={24} />,
          title: "Menunggu Konfirmasi",
          color: "yellow",
          message: "Pengajuan pembatalan Anda sedang ditinjau oleh Produsen. Mohon tunggu konfirmasi."
        };
      case 'Dibatalkan':
        return {
          icon: <CheckCircle size={24} />,
          title: "Pembatalan Berhasil",
          color: "emerald",
          message: "Produsen telah menyetujui pembatalan. Dana akan dikembalikan sesuai kebijakan."
        };
      case 'Perlu Dikirim':
        // Cek apakah ini penolakan atau pesanan baru
        if (pesanan.alasan_penolakan && pesanan.alasan_penolakan !== '-') {
          return {
            icon: <XCircle size={24} />,
            title: "Pengajuan Ditolak",
            color: "red",
            message: "Produsen menolak pengajuan pembatalan Anda. Pesanan akan kembali ke status 'Perlu Dikirim'."
          };
        }
        // Fallback jika statusnya 'Perlu Dikirim' tapi BUKAN penolakan
        return {
          icon: <AlertCircle size={24} />,
          title: "Status Pesanan Aktif",
          color: "gray",
          message: "Pesanan ini berstatus 'Perlu Dikirim' dan tidak sedang dalam proses pembatalan."
        };
      default:
        return {
          icon: <AlertCircle size={24} />,
          title: "Status Tidak Dikenali",
          color: "gray",
          message: "Status pesanan ini tidak dapat diproses di halaman ini."
        };
    }
  };
  
  const card = getCardStyle();
  const colors = {
    yellow: { bg: 'bg-yellow-50', text: 'text-yellow-800', border: 'border-yellow-200', icon: 'text-yellow-600' },
    emerald: { bg: 'bg-emerald-50', text: 'text-emerald-800', border: 'border-emerald-200', icon: 'text-emerald-600' },
    red: { bg: 'bg-red-50', text: 'text-red-800', border: 'border-red-200', icon: 'text-red-600' },
    gray: { bg: 'bg-slate-50', text: 'text-slate-800', border: 'border-slate-200', icon: 'text-slate-600' },
  };
  const c = colors[card.color];

  return (
    <div className={`p-6 rounded-2xl shadow-sm border ${c.bg} ${c.border}`}>
      <div className="flex items-center gap-4">
        <div className={`flex-shrink-0 w-12 h-12 flex items-center justify-center rounded-full ${c.bg} border-4 ${c.border} ${c.icon}`}>
          {card.icon}
        </div>
        <div>
          <h2 className={`text-2xl font-bold ${c.text}`}>{card.title}</h2>
          <p className={`mt-1 text-base ${c.text}`}>{card.message}</p>
        </div>
      </div>

      <div className="mt-6 border-t border-slate-200 pt-6 grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4">
        {/* Alasan Pembatalan */}
        <div className="flex items-start gap-3">
          <MessageSquare className="w-5 h-5 text-slate-500 mt-0.5 flex-shrink-0" />
          <div>
            <span className="text-sm font-medium text-slate-500">Alasan Pengajuan Anda</span>
            <p className="text-sm font-semibold text-slate-900">{pesanan.alasan_pembatalan || '-'}</p>
          </div>
        </div>
        {/* Status Pengembalian Dana */}
        {status === 'Dibatalkan' && (
          <div className="flex items-start gap-3">
            <DollarSign className="w-5 h-5 text-emerald-600 mt-0.5 flex-shrink-0" />
            <div>
              <span className="text-sm font-medium text-slate-500">Pengembalian Dana</span>
              <p className="text-sm font-semibold text-emerald-700">Rp {(pesanan.total_harga || 0).toLocaleString('id-ID')}</p>
            </div>
          </div>
        )}
        {/* Produsen */}
        <div className="flex items-start gap-3">
          <User className="w-5 h-5 text-slate-500 mt-0.5 flex-shrink-0" />
          <div>
            <span className="text-sm font-medium text-slate-500">Produsen</span>
            <p className="text-sm font-semibold text-slate-900">{pesanan.nama_produsen || '-'}</p>
          </div>
        </div>
        {/* Nomor PO */}
        <div className="flex items-start gap-3">
          <FileText className="w-5 h-5 text-slate-500 mt-0.5 flex-shrink-0" />
          <div>
            <span className="text-sm font-medium text-slate-500">Nomor PO</span>
            <p className="text-sm font-semibold text-slate-900 font-mono">{pesanan.nomor_po || '-'}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

// --- Komponen Utama Halaman ---
const DetailPembatalan = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [data, setData] = useState(null);
  const username = localStorage.getItem('username');

  useEffect(() => {
    const fetchPesananData = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const token = localStorage.getItem('token');
        if (!token) throw new Error('Silakan login terlebih dahulu');
        
        const response = await axios.get(`http://localhost:5000/api/pbf/pesanan/${id}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (response.data.success && response.data.data) {
          const { status, catatan_khusus } = response.data.data.pesanan;
          const isRejectedCancellation = status === 'Perlu Dikirim' && catatan_khusus && catatan_khusus.includes('[PENOLAKAN]:');
          if (status !== 'Pembatalan Diajukan' && status !== 'Dibatalkan' && !isRejectedCancellation) {
             toast.warn(`Membuka detail pembatalan untuk pesanan yang berstatus "${status}".`);
          }
          setData(response.data.data);
        } else {
          throw new Error(response.data.message || 'Data pesanan tidak ditemukan.');
        }
      } catch (err) {
        const errorMsg = err.response?.data?.message || err.message || 'Gagal memuat data.';
        setError(errorMsg);
        toast.error(errorMsg);
        if ((err.message.includes('401') || err.message.includes('403') || err.message.includes('login'))) {
            navigate('/login/pbf');
        }
      } finally {
        setIsLoading(false);
      }
    };
    fetchPesananData();
  }, [id, navigate]);

  const handleLogout = () => {
    localStorage.clear();
    navigate('/');
  };

  // --- RENDER LOADING (UTAMAKAN INI) ---
  if (isLoading) {
     return (
       <div className="flex flex-col justify-center items-center h-screen bg-gradient-to-br from-slate-50 via-white to-emerald-50">
          <Loader2 className="animate-spin h-12 w-12 text-emerald-600" />
          <p className="mt-4 text-slate-700 font-medium">Memuat Detail Pembatalan...</p>
      </div>
    );
  }

  // --- RENDER ERROR (KEDUA) ---
  if (error) {
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
                 onClick={() => navigate('/pbf/pesan-obat')}
                 className="flex items-center gap-2 px-4 py-2.5 border border-slate-300 text-slate-700 font-medium rounded-lg hover:bg-slate-100 transition mx-auto"
               >
                 <ArrowLeft size={18} />
                 Kembali ke Daftar Pesanan
               </button>
            </div>
          </main>
        </div>
      </div>
    );
  }

  // --- RENDER DATA TIDAK DITEMUKAN (KETIGA) ---
  if (!data || !data.pesanan) {
    return (
       <div className="flex min-h-screen bg-gradient-to-br from-slate-50 via-white to-emerald-50">
        <SidebarPbf isCollapsed={isCollapsed} setIsCollapsed={setIsCollapsed} />
        <div className={`flex-1 flex flex-col transition-all duration-300 ${isCollapsed ? 'ml-16' : 'ml-64'}`}>
          <NavbarPbf onLogout={handleLogout} username={username} />
          <main className="flex-1 flex items-center justify-center p-6 pt-[72px]">
            <div className="bg-white p-8 rounded-2xl shadow-lg border border-slate-200 text-center max-w-md">
              <FileText className="mx-auto h-12 w-12 text-yellow-500 mb-4" />
              <h2 className="text-xl font-bold text-slate-800 mb-2">Data Tidak Ditemukan</h2>
              <p className="text-slate-600 mb-6">Tidak dapat menemukan detail pesanan untuk ID ini.</p>
               <button
                 onClick={() => navigate('/pbf/pesan-obat')}
                 className="flex items-center gap-2 px-4 py-2.5 border border-slate-300 text-slate-700 font-medium rounded-lg hover:bg-slate-100 transition mx-auto"
               >
                 <ArrowLeft size={18} />
                 Kembali ke Daftar Pesanan
               </button>
            </div>
          </main>
        </div>
      </div>
     );
  }
  
  // --- AMAN UNTUK RENDER ---
  const { pesanan, detail_pesanan } = data;

  return (
    <div className="flex min-h-screen bg-slate-50">
      <SidebarPbf isCollapsed={isCollapsed} setIsCollapsed={setIsCollapsed} />
      <div className={`flex-1 flex flex-col transition-all duration-300 ${isCollapsed ? 'ml-16' : 'ml-64'}`}>
        <NavbarPbf onLogout={handleLogout} username={username} />

        <main className="flex-1 overflow-auto pt-[72px] px-12 py-8">
          <div className="max-w-4xl mx-auto">
            <button
              onClick={() => navigate('/pbf/pesan-obat')}
              className="mb-6 inline-flex items-center text-emerald-600 hover:text-emerald-700 transition-colors text-sm font-medium"
            >
              <ArrowLeft size={16} className="mr-1" /> Kembali ke Daftar Pesanan
            </button>
            
            {/* 1. Info Card Utama */}
            <InfoCard status={pesanan.status} pesanan={pesanan} />

            {/* 2. Timeline Status */}
            <StatusTimeline 
              pesanan={pesanan}
              alasanPenolakan={pesanan.alasan_penolakan} 
            />
            
            {/* 3. Detail Item yang Dibatalkan */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden mt-8">
               <div className="p-6 border-b border-slate-200">
                  <h3 className="text-lg font-bold text-slate-900">
                    Detail Item dalam Pengajuan
                  </h3>
               </div>
               <div className="overflow-x-auto">
                  <table className="min-w-full">
                    <thead className="bg-slate-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Obat</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Batch ID</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Jumlah</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Subtotal</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-slate-100">
                      {detail_pesanan.length > 0 ? detail_pesanan.map((item) => (
                        <tr key={item.id}>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-900">{item.nama_obat}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600 font-mono">{item.batch_id || 'N/A'}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">{item.jumlah_pesanan}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-emerald-700">
                            Rp. {item.total_harga.toLocaleString('id-ID')}
                          </td>
                        </tr>
                      )) : (
                        <tr>
                          <td colSpan="4" className="text-center py-10 text-slate-500">
                             Tidak ada detail item.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
               </div>
            </div>
            
          </div>
        </main>
      </div>
    </div>
  );
};

export default DetailPembatalan;