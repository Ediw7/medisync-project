import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import SidebarPbf from '../../../components/SidebarPbf';
import NavbarPbf from '../../../components/NavbarPbf';
import {
  Loader2,
  ArrowLeft,
  AlertCircle,
  FileText,
  Package,
  Truck,
  CheckCircle,
  XCircle,
  HelpCircle,
  Image as ImageIcon
} from 'lucide-react';
import axios from 'axios';
import { toast } from 'react-hot-toast';

// Komponen Timeline untuk Pengembalian
const ReturnStatusTimeline = ({ status, alasanPenolakan }) => {
  const steps = [
    { name: 'Pengajuan Dibuat', status: 'completed', icon: FileText },
    { name: 'Menunggu Konfirmasi Produsen', status: 'pending', icon: HelpCircle },
    { name: 'Pengembalian Disetujui', status: 'pending', icon: CheckCircle },
    { name: 'Barang Dikirim Balik', status: 'pending', icon: Truck },
    { name: 'Selesai & Dana Kembali', status: 'pending', icon: Package }
  ];

  // Logika untuk Timeline
  if (status === 'Pengembalian Diajukan') {
    steps[1].status = 'current';
  } else if (status === 'Dikembalikan' || status === 'Pengembalian Disetujui') {
    steps[1].status = 'completed';
    steps[2].status = 'completed';
    steps[3].status = 'current';
  } else if (status === 'Pengembalian Selesai') {
    steps.forEach(step => step.status = 'completed');
  } else if (status === 'Pengembalian Ditolak') {
    steps[1].name = 'Pengajuan Ditolak';
    steps[1].status = 'rejected';
    steps[2].status = 'hidden'; // Sembunyikan langkah selanjutnya
    steps[3].status = 'hidden';
    steps[4].status = 'hidden';
  }

  return (
    <nav aria-label="Progress" className="my-8">
      <ol role="list" className="flex items-center justify-center space-x-4">
        {steps.map((step, index) => (
          step.status !== 'hidden' && (
            <li key={step.name} className="flex-1 relative">
              <div className="group flex flex-col items-center text-center">
                <span className="flex items-center">
                  <span className={`relative flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full border-2 ${
                    step.status === 'completed' ? 'bg-emerald-600 border-emerald-600' :
                    step.status === 'current' ? 'bg-emerald-100 border-emerald-600' :
                    step.status === 'rejected' ? 'bg-red-600 border-red-600' :
                    'border-gray-300'
                  }`}>
                    <step.icon className={`h-6 w-6 ${
                      step.status === 'completed' ? 'text-white' :
                      step.status === 'current' ? 'text-emerald-600' :
                      step.status === 'rejected' ? 'text-white' :
                      'text-gray-400'
                    }`} aria-hidden="true" />
                  </span>
                </span>
                <span className={`mt-2 text-sm font-medium ${
                  step.status === 'rejected' ? 'text-red-700' : 'text-gray-700'
                }`}>{step.name}</span>
              </div>
              {index < steps.length - 1 && steps[index + 1].status !== 'hidden' && (
                <div className={`absolute top-5 left-1/2 w-full -ml-px ${
                  step.status === 'completed' ? 'bg-emerald-600' : 'bg-gray-300'
                }`} style={{ height: '2px', transform: 'translateX(50%)', zIndex: -1, maxWidth: 'calc(100% - 2.5rem)' }} />
              )}
            </li>
          )
        ))}
      </ol>
      
      {/* INI YANG ANDA MINTA: MENAMPILKAN ALASAN PENOLAKAN */}
      {status === 'Pengembalian Ditolak' && alasanPenolakan && alasanPenolakan !== '-' && (
        <div className="mt-8 p-4 bg-red-50 border border-red-200 rounded-lg text-center max-w-2xl mx-auto">
          <h4 className="font-semibold text-red-800">Alasan Penolakan dari Produsen:</h4>
          <p className="text-red-700 mt-1 italic">"{alasanPenolakan}"</p>
        </div>
      )}
    </nav>
  );
};

// Komponen Utama Halaman
const LacakPengembalianPbf = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [data, setData] = useState(null);
  const username = localStorage.getItem('username');

  // Backend PBF harus dimodifikasi untuk mengambil alasan penolakan
  useEffect(() => {
    const fetchPesananData = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const token = localStorage.getItem('token');
        if (!token) throw new Error('Silakan login terlebih dahulu');
        
        // Panggil endpoint yang benar (ini mungkin /lacak-pengembalian atau /pesanan/:id)
        // Saya asumsikan /pesanan/:id sudah mengambil semua data yang kita perbaiki di backend
        const response = await axios.get(`http://localhost:5000/api/pbf/pesanan/${id}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (response.data.success && response.data.data) {
          setData(response.data.data);
        } else {
          throw new Error(response.data.message || 'Data pelacakan tidak ditemukan.');
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

  // --- RENDER LOADING ---
  if (isLoading) {
     return (
       <div className="flex flex-col justify-center items-center h-screen bg-gradient-to-br from-slate-50 via-white to-emerald-50">
          <Loader2 className="animate-spin h-12 w-12 text-emerald-600" />
          <p className="mt-4 text-slate-700 font-medium">Memuat Pelacakan Pengembalian...</p>
      </div>
    );
  }

  // --- RENDER ERROR ---
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

  const { pesanan, detail_pesanan } = data;
  
  // Ambil alasan dari backend
  // Pastikan backend controller 'pbf/pesananController.js' Anda mengambil data ini
  const alasanPengajuan = pesanan.catatan_khusus?.split('Alasan:')[1]?.split('\n')[0]?.trim() || 'Tidak ada alasan';
  const alasanPenolakan = pesanan.catatan_khusus?.split('[PENOLAKAN PENGEMBALIAN]:')[1]?.trim() || '-';
  
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
            
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="p-6 border-b border-slate-200">
                  <h1 className="text-2xl font-bold text-slate-800">Pelacakan Pengembalian</h1>
                  <p className="text-slate-500 mt-1">Status untuk Pesanan PO: {pesanan.nomor_po}</p>
                </div>
                
                <div className="p-8">
                  {/* 1. Timeline Status */}
                  <ReturnStatusTimeline 
                    status={pesanan.status}
                    alasanPenolakan={alasanPenolakan} 
                  />
                  
                  {/* 2. Detail Pengajuan Anda */}
                  <div className="mt-10 pt-6 border-t border-slate-200">
                     <h3 className="text-lg font-bold text-slate-900 mb-4">
                        Detail Pengajuan Anda
                     </h3>
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-1">
                           <span className="text-sm font-medium text-slate-500">Alasan Pengajuan</span>
                           <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
                             <p className="text-sm font-semibold text-slate-900 whitespace-pre-wrap">{alasanPengajuan}</p>
                           </div>
                        </div>
                        <div className="space-y-1">
                           <span className="text-sm font-medium text-slate-500">Bukti Foto Anda</span>
                           {pesanan.bukti_foto ? (
                             <div className="bg-slate-50 p-2 rounded-lg border border-slate-200 w-full max-w-xs">
                               <img
                                  src={`http://localhost:5000/${pesanan.bukti_foto.replace(/\\/g, '/')}`}
                                  alt="Bukti Pengembalian"
                                  className="w-full h-auto object-contain rounded-md"
                               />
                             </div>
                           ) : (
                             <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 text-slate-500 flex items-center gap-2 text-sm">
                                <ImageIcon size={18} className="flex-shrink-0"/>
                                <span>Tidak ada bukti foto.</span>
                             </div>
                          )}
                        </div>
                     </div>
                  </div>

                  {/* 3. Tombol Aksi (Hanya jika Ditolak) */}
                  {pesanan.status === 'Pengembalian Ditolak' && (
                     <div className="mt-8 p-6 bg-slate-50 rounded-2xl border border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-4">
                        <p className="text-sm text-slate-600">
                          Pengajuan pengembalian Anda ditolak. Pesanan ini dianggap selesai. <br/> Hubungi Produsen jika ada pertanyaan lebih lanjut.
                        </p>
                        <button
                          onClick={() => navigate('/pbf/pesan-obat')}
                          className="w-full sm:w-auto px-6 py-2.5 bg-emerald-600 text-white font-medium rounded-lg hover:bg-emerald-700 transition"
                        >
                          Mengerti & Kembali
                        </button>
                      </div>
                  )}
                </div>
            </div>
            
          </div>
        </main>
      </div>
    </div>
  );
};

export default LacakPengembalianPbf;