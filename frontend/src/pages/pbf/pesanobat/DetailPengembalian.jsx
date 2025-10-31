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
  CheckCircle,
  XCircle,
  MessageSquare,
  Image as ImageIcon,
  ExternalLink,
  Truck // <-- DITAMBAHKAN DI SINI
} from 'lucide-react';
import axios from 'axios';
import { toast } from 'react-hot-toast';

// Komponen Utama Halaman
const DetailPengembalian = () => {
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
          setData(response.data.data);
        } else {
          throw new Error(response.data.message || 'Data pengajuan tidak ditemukan.');
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
          <p className="mt-4 text-slate-700 font-medium">Memuat Detail Pengajuan...</p>
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
            
            {/* Kartu Detail Pengajuan */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
               <div className="p-6 border-b border-slate-200">
                  <h1 className="text-2xl font-bold text-slate-800">Detail Pengajuan Pengembalian</h1>
                  <p className="text-slate-500 mt-1">Status saat ini: <span className="font-semibold text-purple-700">{pesanan.status}</span></p>
               </div>
               
               <div className="p-8 space-y-8">
                    {/* Alasan Pengajuan */}
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-slate-500 flex items-center gap-2">
                            <MessageSquare size={16} />
                            Alasan Pengajuan Anda
                        </label>
                        <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
                            <p className="text-slate-800 whitespace-pre-wrap">{pesanan.alasan_pengembalian || 'Tidak ada alasan tercatat.'}</p>
                        </div>
                    </div>

                    {/* Bukti Foto */}
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-slate-500 flex items-center gap-2">
                            <ImageIcon size={16} />
                            Bukti Foto Anda
                        </label>
                        {pesanan.bukti_foto ? (
                            <div className="bg-slate-50 p-2 rounded-lg border border-slate-200 w-full max-w-sm">
                            <img
                                src={`http://localhost:5000/${pesanan.bukti_foto.replace(/\\/g, '/')}`}
                                alt="Bukti Pengembalian"
                                className="w-full h-auto object-contain rounded-md"
                            />
                            </div>
                        ) : (
                            <div className="bg-slate-50 p-4 rounded-lg border border-slate-200 text-slate-500 text-sm">
                            Tidak ada bukti foto yang diunggah.
                            </div>
                        )}
                    </div>

                    {/* Rincian Pesanan */}
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-slate-500 flex items-center gap-2">
                            <Package size={16} />
                            Item dalam Pesanan Ini
                        </label>
                        <div className="overflow-x-auto border border-slate-200 rounded-lg">
                            <table className="min-w-full">
                                <thead className="bg-slate-50">
                                <tr>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">Obat</th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">Batch ID</th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">Jumlah</th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">Subtotal</th>
                                </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-slate-100">
                                {detail_pesanan.length > 0 ? detail_pesanan.map((item) => (
                                    <tr key={item.id}>
                                    <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-slate-900">{item.nama_obat}</td>
                                    <td className="px-4 py-3 whitespace-nowrap text-sm text-slate-600 font-mono">{item.batch_id || 'N/A'}</td>
                                    <td className="px-4 py-3 whitespace-nowrap text-sm text-slate-600">{item.jumlah_pesanan}</td>
                                    <td className="px-4 py-3 whitespace-nowrap text-sm font-semibold text-emerald-700">
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
               
               <div className="p-6 bg-slate-50 border-t border-slate-200 flex justify-end">
                    <Link 
                        to={`/pbf/pesanan/${id}/lacak-pengembalian-pbf`}
                        className="w-full sm:w-auto px-6 py-2.5 bg-emerald-600 text-white font-medium rounded-lg hover:bg-emerald-700 transition flex items-center justify-center gap-2"
                    >
                        <Truck size={16} />
                        Lacak Status Pengembalian
                    </Link>
               </div>
            </div>
            
          </div>
        </main>
      </div>
    </div>
  );
};

export default DetailPengembalian;

