import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import SidebarPbf from '../../../components/SidebarPbf';
import NavbarPbf from '../../../components/NavbarPbf';
import {
  Loader2,
  ArrowLeft,
  AlertCircle,
  FileText,
  Package,
  Truck,
  CheckCircle2,
  XCircle,
  HelpCircle,
  Image as ImageIcon,
  X
} from 'lucide-react';
import axios from 'axios';
import { toast } from 'react-hot-toast';

// --- MODAL BUKTI FOTO ---
const BuktiFotoModal = ({ isOpen, onClose, imageUrl }) => {
  if (!isOpen) return null;
  const fullImageUrl = imageUrl
    ? (imageUrl.startsWith('http') ? imageUrl : `http://localhost:5000/${imageUrl.replace(/\\/g, '/')}`)
    : null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-white p-4 rounded-lg shadow-2xl relative w-full max-w-lg overflow-hidden" onClick={(e) => e.stopPropagation()}>
        <div className="flex justify-between items-center pb-3 mb-4 border-b border-slate-200">
          <h3 className="text-lg font-semibold text-slate-800">Bukti Foto Pengembalian</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-colors p-1 rounded-full">
            <X size={20} />
          </button>
        </div>
        {fullImageUrl ? (
          <div className="bg-slate-100 p-2 rounded">
            <img src={fullImageUrl} alt="Bukti Foto" className="w-full h-auto max-h-[70vh] object-contain rounded" />
          </div>
        ) : (
          <div className="text-center py-10 text-slate-500">
            <ImageIcon size={48} className="mx-auto mb-2 opacity-50" />
            Gambar tidak tersedia.
          </div>
        )}
      </div>
    </div>
  );
};

// --- TIMELINE PENGEMBALIAN (DESAIN BARU) ---
const ReturnStatusTimeline = ({ status, alasanPenolakan }) => {
  const steps = [
    { name: 'Pengajuan Dibuat', icon: FileText },
    { name: 'Menunggu Konfirmasi', icon: HelpCircle },
    { name: 'Disetujui Produsen', icon: CheckCircle2 },
    { name: 'Barang Dikirim Balik', icon: Truck },
    { name: 'Selesai & Dana Kembali', icon: Package }
  ];

  let currentIndex = -1;
  if (status === 'Pengembalian Diajukan') currentIndex = 1;
  else if (status === 'Pengembalian Disetujui') currentIndex = 2;
  else if (status === 'Dikembalikan') currentIndex = 3;
  else if (status === 'Pengembalian Selesai') currentIndex = 4;
  else if (status === 'Pengembalian Ditolak') currentIndex = 1;

  return (
    <div className="relative">
      <div className="flex items-center justify-between">
        {steps.map((step, index) => {
          const isCompleted = index < currentIndex;
          const isCurrent = index === currentIndex;
          const isRejected = status === 'Pengembalian Ditolak' && index === 1;
          const isHidden = status === 'Pengembalian Ditolak' && index > 1;

          if (isHidden) return null;

          return (
            <div key={index} className="flex flex-col items-center flex-1 relative">
              <div className={`w-14 h-14 rounded-full flex items-center justify-center border-2 transition-all duration-300 z-10 ${
                isCurrent ? 'bg-emerald-100 border-emerald-500 animate-pulse' :
                isCompleted ? 'bg-emerald-500 border-emerald-600 text-white' :
                isRejected ? 'bg-red-500 border-red-600 text-white' :
                'bg-slate-100 border-slate-300 text-slate-400'
              }`}>
                <step.icon size={26} />
              </div>
              <p className={`mt-3 text-sm font-semibold text-center w-32 ${
                isCurrent ? 'text-emerald-700' :
                isCompleted ? 'text-slate-800' :
                isRejected ? 'text-red-700' :
                'text-slate-500'
              }`}>
                {isRejected ? 'Pengajuan Ditolak' : step.name}
              </p>
              {index < steps.length - 1 && !isHidden && (
                <div className="absolute top-7 left-1/2 w-full h-1.5 -translate-x-1/2 z-0">
                  <div className={`h-full rounded-full transition-all ${isCompleted ? 'bg-emerald-500' : 'bg-slate-300'}`} />
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* ALASAN PENOLAKAN */}
      {status === 'Pengembalian Ditolak' && alasanPenolakan && alasanPenolakan !== '-' && (
        <div className="mt-8 p-5 bg-red-50 border border-red-200 rounded-xl text-center max-w-3xl mx-auto">
          <h4 className="font-bold text-red-800 flex items-center justify-center gap-2">
            <XCircle size={20} /> Alasan Penolakan dari Produsen
          </h4>
          <p className="text-red-700 mt-2 italic text-sm">"{alasanPenolakan}"</p>
        </div>
      )}
    </div>
  );
};

// --- HALAMAN UTAMA ---
const LacakPengembalianPbf = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [data, setData] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const username = localStorage.getItem('username');

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const token = localStorage.getItem('token');
        if (!token) throw new Error('Silakan login terlebih dahulu');

        const response = await axios.get(`http://localhost:5000/api/pbf/pesanan/${id}`, {
          headers: { Authorization: `Bearer ${token}` }
        });

        if (!response.data.success || !response.data.data) {
          throw new Error(response.data.message || 'Data tidak ditemukan');
        }
        setData(response.data.data);
      } catch (err) {
        const errorMsg = err.response?.data?.message || err.message || 'Gagal memuat data.';
        setError(errorMsg);
        toast.error(errorMsg);
        if (err.message.includes('login')) navigate('/login/pbf');
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, [id, navigate]);

  const handleLogout = () => { localStorage.clear(); navigate('/'); };

  // --- LOADING ---
  if (isLoading) {
    return (
      <div className="flex flex-col justify-center items-center h-screen bg-gradient-to-br from-slate-50 via-white to-emerald-50">
        <div className="relative">
          <Loader2 className="animate-spin h-12 w-12 text-emerald-600" />
          <div className="absolute inset-0 h-12 w-12 rounded-full border-4 border-emerald-200 animate-ping opacity-20"></div>
        </div>
        <p className="mt-4 text-slate-714 font-medium">Memuat Pelacakan Pengembalian...</p>
      </div>
    );
  }

  // --- ERROR ---
  if (error || !data || !data.pesanan) {
    return (
      <div className="flex min-h-screen bg-gradient-to-br from-slate-50 via-white to-emerald-50">
        <SidebarPbf isCollapsed={isCollapsed} setIsCollapsed={setIsCollapsed} />
        <div className={`flex-1 flex flex-col transition-all duration-300 ${isCollapsed ? 'ml-16' : 'ml-64'}`}>
          <NavbarPbf onLogout={handleLogout} username={username} />
          <main className="flex-1 flex items-center justify-center p-6 pt-[72px]">
            <div className="bg-white p-8 rounded-2xl shadow-lg border border-red-200 text-center max-w-md">
              <AlertCircle className="mx-auto h-12 w-12 text-red-500 mb-4" />
              <h2 className="text-xl font-bold text-red-800 mb-2">Gagal Memuat Data</h2>
              <p className="text-red-600 mb-6">{error || 'Data tidak ditemukan.'}</p>
              <button onClick={() => navigate('/pbf/pesan-obat')} className="flex items-center gap-2 px-4 py-2.5 border border-slate-300 text-slate-700 font-medium rounded-lg hover:bg-slate-100 transition mx-auto">
                <ArrowLeft size={18} /> Kembali ke Daftar Pesanan
              </button>
            </div>
          </main>
        </div>
      </div>
    );
  }

  const { pesanan } = data;
  const alasanPengajuan = pesanan.catatan_khusus?.split('Alasan:')[1]?.split('\n')[0]?.trim() || 'Tidak ada alasan';
  const alasanPenolakan = pesanan.catatan_khusus?.split('[PENOLAKAN PENGEMBALIAN]:')[1]?.trim() || '-';

  const getStatusBadge = () => {
    const status = pesanan.status;
    if (status.includes('Selesai')) return { text: 'Selesai', color: 'emerald', icon: CheckCircle2 };
    if (status.includes('Ditolak')) return { text: 'Ditolak', color: 'red', icon: XCircle };
    if (status.includes('Diajukan')) return { text: 'Menunggu', color: 'amber', icon: HelpCircle };
    if (status.includes('Disetujui') || status.includes('Dikembalikan')) return { text: 'Diproses', color: 'blue', icon: Truck };
    return { text: 'Unknown', color: 'slate', icon: HelpCircle };
  };
  const badge = getStatusBadge();

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-slate-50 via-white to-emerald-50">
      <SidebarPbf isCollapsed={isCollapsed} setIsCollapsed={setIsCollapsed} />
      <div className={`flex-1 flex flex-col transition-all duration-300 ${isCollapsed ? 'ml-16' : 'ml-64'}`}>
        <NavbarPbf onLogout={handleLogout} username={username} />

        <main className="flex-1 overflow-auto pt-[72px] px-12 py-8">
          <div className="max-w-5xl mx-auto">
            <button onClick={() => navigate('/pbf/pesan-obat')} className="mb-6 inline-flex items-center text-emerald-600 hover:text-emerald-700 transition-colors text-sm font-medium">
              <ArrowLeft size={16} className="mr-1" /> Kembali ke Daftar Pesanan
            </button>

            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
              {/* HEADER */}
              <div className="bg-gradient-to-r from-emerald-500 to-teal-600 px-6 py-5 border-b border-slate-200 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                <div>
                  <h1 className="text-2xl font-bold text-white">Pelacakan Pengembalian</h1>
                  <p className="text-sm text-emerald-50 mt-1">Nomor PO: <span className="font-mono">{pesanan.nomor_po}</span></p>
                </div>
                <div className={`px-4 py-2 rounded-full border-2 text-sm font-semibold flex items-center gap-2 bg-white text-${badge.color}-700 border-${badge.color}-200`}>
                  <badge.icon size={16} />
                  Status: {badge.text}
                </div>
              </div>

              {/* TIMELINE */}
              <div className="p-8 py-12 border-b border-slate-200">
                <h3 className="text-lg font-bold text-slate-900 mb-8 text-center">Riwayat Status Pengembalian</h3>
                <ReturnStatusTimeline status={pesanan.status} alasanPenolakan={alasanPenolakan} />
              </div>

              {/* DETAIL PENGAJUAN */}
              <div className="p-8">
                <h3 className="text-lg font-bold text-slate-900 mb-6 flex items-center gap-2">
                  <FileText size={20} className="text-emerald-600" /> Detail Pengajuan Anda
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-1">
                    <span className="text-sm font-medium text-slate-500">Alasan Pengajuan</span>
                    <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
                      <p className="text-sm font-semibold text-slate-900 whitespace-pre-wrap leading-relaxed">{alasanPengajuan}</p>
                    </div>
                  </div>
                  <div className="space-y-1">
                    <span className="text-sm font-medium text-slate-500">Bukti Foto</span>
                    {pesanan.bukti_foto ? (
                      <button onClick={() => setIsModalOpen(true)} className="block w-full">
                        <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 hover:border-emerald-300 transition-all">
                          <img
                            src={`http://localhost:5000/${pesanan.bukti_foto.replace(/\\/g, '/')}`}
                            alt="Bukti"
                            className="w-full h-48 object-cover rounded-md"
                          />
                          <p className="text-xs text-emerald-600 mt-2 text-center">Klik untuk memperbesar</p>
                        </div>
                      </button>
                    ) : (
                      <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 text-slate-500 flex items-center gap-2 text-sm">
                        <ImageIcon size={18} /> Tidak ada bukti foto.
                      </div>
                    )}
                  </div>
                </div>

                {/* INFO DITOLAK */}
                {pesanan.status === 'Pengembalian Ditolak' && (
                  <div className="mt-8 p-6 bg-red-50 rounded-xl border border-red-200 flex flex-col sm:flex-row items-center justify-between gap-4">
                    <p className="text-sm text-red-700 text-center sm:text-left">
                      Pengajuan Anda <strong>ditolak</strong>. Pesanan dianggap selesai. <br />
                      Silakan hubungi Produsen jika ada pertanyaan.
                    </p>
                    <button onClick={() => navigate('/pbf/pesan-obat')} className="w-full sm:w-auto px-6 py-2.5 bg-red-600 text-white font-medium rounded-lg hover:bg-red-700 transition">
                      Kembali ke Daftar
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </main>
      </div>

      <BuktiFotoModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} imageUrl={pesanan.bukti_foto} />
    </div>
  );
};

export default LacakPengembalianPbf;