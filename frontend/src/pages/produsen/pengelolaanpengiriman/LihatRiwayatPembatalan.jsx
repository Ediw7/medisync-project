import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import SidebarProdusen from '../../../components/SidebarProdusen';
import NavbarProdusen from '../../../components/NavbarProdusen';
import { Loader2, ArrowLeft, AlertCircle, FileText, DollarSign, User, Calendar, ExternalLink, ArchiveX, CheckCircle2 } from 'lucide-react'; // Added icons
import axios from 'axios';
import { toast } from 'react-hot-toast';

const LihatRiwayatPembatalan = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [data, setData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const username = localStorage.getItem('username');

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      setError(null);
      let token;
      try {
        token = localStorage.getItem('token');
        if (!token) throw new Error('Silakan login terlebih dahulu');

        const cleanedId = id.replace(':', '');
        console.log('Fetching pesanan with ID:', cleanedId);

        const response = await axios.get(`http://localhost:5000/api/produsen/pesanan-masuk/${cleanedId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (!response.data.success || !response.data.data) {
             throw new Error(response.data.message || 'Gagal mengambil data pesanan atau format data salah');
        }

        // Validate status - ensure it is 'Dibatalkan'
        if (response.data.data.pesanan?.status !== 'Dibatalkan') {
             console.warn(`Status pesanan saat ini "${response.data.data.pesanan?.status || 'Tidak Diketahui'}", bukan "Dibatalkan".`);
             // Optionally, throw an error or handle differently if strictly showing only 'Dibatalkan'
             // throw new Error(`Status pesanan saat ini "${response.data.data.pesanan?.status || 'Tidak Diketahui'}", bukan "Dibatalkan".`);
        }

        setData(response.data.data);
      } catch (err) {
        console.error('Error fetching pesanan:', err);
        setError(err.message);
        toast.error(err.message || 'Gagal memuat data riwayat pembatalan.');
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
  }, [id, navigate]);

  const handleLogout = () => {
    localStorage.clear();
    navigate('/');
  };

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    try {
        const date = new Date(dateString);
        if (isNaN(date.getTime())) return '-';
        // Consistent date format
        return date.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' });
    } catch (e) {
        console.error("Error formatting date:", e);
        return '-';
    }
  };


 if (isLoading) {
     return (
       <div className="flex flex-col justify-center items-center h-screen bg-gradient-to-br from-slate-50 via-white to-emerald-50">
          <div className="relative">
            <Loader2 className="animate-spin h-12 w-12 text-emerald-600" />
            <div className="absolute inset-0 h-12 w-12 rounded-full border-4 border-emerald-200 animate-ping opacity-20"></div>
          </div>
          <p className="mt-4 text-slate-700 font-medium">Memuat Riwayat Pembatalan...</p>
      </div>
    );
  }

  if (error && !data) {
     return (
       <div className="flex flex-col justify-center items-center h-screen bg-gradient-to-br from-slate-50 via-white to-red-50 p-6">
          <div className="bg-white p-8 rounded-xl shadow-lg border border-red-200 text-center max-w-lg">
            <AlertCircle className="mx-auto h-12 w-12 text-red-500 mb-4" />
            <h2 className="text-xl font-bold text-red-800 mb-2">Gagal Memuat Data</h2>
            <p className="text-red-600 mb-6">{error}</p>
            <button
               onClick={() => navigate('/produsen/pengelolaan-pengiriman')}
               className="flex items-center gap-2 px-4 py-2.5 border border-slate-300 text-slate-700 font-medium rounded-lg hover:bg-slate-100 transition mx-auto"
             >
               <ArrowLeft size={18} />
               Kembali ke Pengiriman
             </button>
          </div>
       </div>
    );
  }

  if (!data || !data.pesanan) {
     return (
       <div className="flex flex-col justify-center items-center h-screen bg-slate-50 p-6">
        <div className="bg-white p-8 rounded-xl shadow-lg border border-slate-200 text-center max-w-lg">
          <FileText className="mx-auto h-12 w-12 text-yellow-500 mb-4" />
          <h2 className="text-xl font-bold text-slate-800 mb-2">Data Pesanan Tidak Ditemukan</h2>
          <p className="text-slate-600 mb-6">Tidak dapat menemukan detail riwayat pembatalan untuk pesanan ini.</p>
           <button
             onClick={() => navigate('/produsen/pengelolaan-pengiriman')}
             className="flex items-center gap-2 px-4 py-2.5 border border-slate-300 text-slate-700 font-medium rounded-lg hover:bg-slate-100 transition mx-auto"
           >
             <ArrowLeft size={18} />
             Kembali ke Pengiriman
           </button>
        </div>
      </div>
    );
  }

  const { pesanan: info, detail_pesanan: detail } = data;
  const totalHargaKeseluruhan = detail ? detail.reduce((acc, item) => acc + (Number(item.total_harga) || 0), 0) : (info.total_harga || 0);

  // Status Badge for 'Dibatalkan'
  const statusConfig = {
      icon: ArchiveX, color: 'bg-red-100 text-red-800 border-red-200', label: 'Dibatalkan'
  };
  const StatusIcon = statusConfig.icon;


  return (
    <div className="flex min-h-screen bg-slate-50">
      <SidebarProdusen isCollapsed={isCollapsed} setIsCollapsed={setIsCollapsed} />
      <div className={`flex-1 flex flex-col transition-all duration-300 ${isCollapsed ? 'ml-16' : 'ml-64'}`}>
        <NavbarProdusen onLogout={handleLogout} username={username} />

        <main className="flex-1 overflow-auto pt-[72px]">
          <div className="max-w-4xl mx-auto px-6 py-8">
            <button
               onClick={() => navigate('/produsen/pengelolaan-pengiriman')}
               className="mb-6 inline-flex items-center text-emerald-600 hover:text-emerald-700 transition-colors text-sm font-medium"
             >
               <ArrowLeft size={16} className="mr-1" /> Kembali ke Pengelolaan Pengiriman
             </button>

            <div className="bg-white rounded-xl shadow-lg border border-slate-200 overflow-hidden">
               <div className="bg-gradient-to-r from-slate-50 to-slate-100 px-6 py-5 border-b border-slate-200 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                  <div>
                    <h1 className="text-2xl font-bold text-slate-900">Riwayat Pembatalan</h1>
                    <p className="text-sm text-slate-600 mt-1">Detail pembatalan untuk Pesanan #{String(info.id).padStart(6, '0')}</p>
                  </div>
                  <div className={`px-4 py-2 rounded-full border text-sm font-semibold flex items-center gap-2 ${statusConfig.color}`}>
                     <StatusIcon size={16} />
                     Status: {statusConfig.label}
                  </div>
               </div>

               {error && !isLoading && (
                  <div className="m-6 p-4 bg-red-50 border border-red-200 text-red-700 rounded-xl flex items-center gap-3">
                    <AlertCircle size={20} />
                    <span>{error}</span>
                  </div>
                )}

               <div className="p-6 border-b border-slate-200">
                  <h3 className="text-lg font-semibold text-slate-800 mb-4">Detail Pembatalan</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-5 text-sm">
                      <InfoItem label="Dana Dikembalikan" value={`Rp. ${(info.total_harga || 0).toLocaleString('id-ID')}`} highlight highlightColor="text-red-700"/>
                      <InfoItem label="Diajukan oleh" value={info.nama_pbf} />
                      <InfoItem label="Tanggal Pengajuan" value={formatDate(info.tanggal_pengajuan_pembatalan)} />
                      <div className="sm:col-span-2 lg:col-span-3">
                         <InfoItem label="Alasan Pembeli" value={info.alasan_pembatalan || '-'} />
                      </div>
                      <InfoItem label="Nomor Surat Jalan" value={info.nomor_surat_jalan || 'Tidak Dibuat'} />
                      {/* Add confirmation date if available and relevant */}
                      {/* <InfoItem label="Dikonfirmasi Pada" value={formatDate(info.tanggal_konfirmasi_pembatalan)} /> */}
                  </div>
               </div>

               <div className="p-6 border-b border-slate-200">
                    <h3 className="text-lg font-semibold text-slate-800 mb-4">Ringkasan Pesanan Awal</h3>
                    <div className="bg-slate-50 p-4 rounded-lg border border-slate-200 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                        <div>
                          <p className="text-xs font-medium text-slate-500 mb-1">ID Pesanan</p>
                          <p className="text-base font-bold text-slate-800">#{String(info.id).padStart(6, '0')}</p>
                        </div>
                        <div>
                          <p className="text-xs font-medium text-slate-500 mb-1">Surat Pesanan</p>
                          <Link
                            to={`/produsen/pesanan/detail/${info.id}/surat`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-sm font-medium text-emerald-600 hover:underline inline-flex items-center gap-1"
                          >
                            Lihat Dokumen <ExternalLink size={14} />
                          </Link>
                        </div>
                        <div className="text-left sm:text-right">
                          <p className="text-xs font-medium text-slate-500 mb-1">Total Harga Awal</p>
                          <p className="text-base font-bold text-emerald-700">
                            Rp. {(totalHargaKeseluruhan || 0).toLocaleString('id-ID')}
                          </p>
                        </div>
                   </div>
               </div>

                <div className="p-6 flex justify-end">
                  {/* Back button is already outside the card */}
                </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

const InfoItem = ({ label, value, highlight = false, highlightColor = 'text-emerald-700' }) => (
  <div>
    <p className="text-xs font-medium text-slate-500 mb-1 uppercase tracking-wider">{label}</p>
    <p className={`text-base font-semibold ${highlight ? highlightColor : 'text-slate-800'}`}>{value || '-'}</p>
  </div>
);

export default LihatRiwayatPembatalan;