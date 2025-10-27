import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import SidebarProdusen from '../../../components/SidebarProdusen';
import NavbarProdusen from '../../../components/NavbarProdusen';
import { Loader2, ArrowLeft, AlertCircle, HelpCircle, FileText, DollarSign, User, Calendar, XCircle, CheckCircle, ExternalLink, Image as ImageIcon } from 'lucide-react';
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

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      setError(null);
      let token;
      try {
        token = localStorage.getItem('token');
        if (!token) throw new Error('Silakan login terlebih dahulu');

        const cleanedId = id.replace(':', '');
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

        setData(response.data.data);
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
  }, [id, navigate]);

   const handleAction = async (approve = true) => {
    const action = approve ? 'menyetujui' : 'menolak';
    const newStatus = approve ? 'Pengembalian Disetujui' : 'Pengembalian Ditolak';
    setIsActionLoading(true);
    setError(null);
    toast.dismiss();

    try {
      const token = localStorage.getItem('token');
      if (!token) throw new Error('Sesi tidak valid.');

      const endpoint = `http://localhost:5000/api/produsen/pesanan-masuk/pengembalian/${id}/${approve ? 'approve' : 'reject'}`;

      const response = await axios.put(endpoint,
        approve ? {} : { alasan_penolakan: 'Contoh alasan penolakan' },
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
       <div className="flex flex-col justify-center items-center h-screen bg-gradient-to-br from-slate-50 via-white to-red-50 p-6">
          <div className="bg-white p-8 rounded-xl shadow-lg border border-red-200 text-center max-w-lg">
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
       </div>
    );
  }

  if (!data) {
     return (
       <div className="flex flex-col justify-center items-center h-screen bg-slate-50 p-6">
        <div className="bg-white p-8 rounded-xl shadow-lg border border-slate-200 text-center max-w-lg">
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
      </div>
    );
  }

  const info = data;
  const detail = data.detail_pesanan || [];
  const totalHargaKeseluruhan = detail.reduce((acc, item) => acc + (Number(item.total_harga) || 0), 0);
  const canTakeAction = info.status === 'Pengembalian Diajukan';


  return (
    <div className="flex min-h-screen bg-slate-50">
      <SidebarProdusen isCollapsed={isCollapsed} setIsCollapsed={setIsCollapsed} />
      <div className={`flex-1 flex flex-col transition-all duration-300 ${isCollapsed ? 'ml-16' : 'ml-64'}`}>
        <NavbarProdusen onLogout={handleLogout} username={username} />

        <main className="flex-1 overflow-auto pt-[72px]">
          <div className="max-w-4xl mx-auto px-6 py-8">
            <div className="mb-2">
               <button
                  onClick={() => navigate('/produsen/pengelolaan-pengiriman/pengembalian')}
                  className="mb-4 inline-flex items-center text-emerald-600 hover:text-emerald-700 transition-colors text-sm font-medium"
               >
                 <ArrowLeft size={16} className="mr-1" /> Kembali ke Daftar Pengembalian
               </button>
              
            </div>

            {error && !isLoading && (
              <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 rounded-xl flex items-center gap-3">
                <AlertCircle size={20} />
                <span>{error}</span>
              </div>
            )}

            <div className="bg-white rounded-xl shadow-lg border border-slate-200 overflow-hidden">
               <div className="bg-gradient-to-r from-indigo-50 to-purple-100 px-6 py-5 border-b border-indigo-200">
                  <h2 className="text-lg font-semibold text-indigo-900 flex items-center gap-2">
                     <AlertCircle size={20} /> Detail Pengajuan Pengembalian
                  </h2>
               </div>

               <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-x-6 gap-y-5 text-sm">
                   <InfoItem label="Status Saat Ini" value={info.status || '-'} highlightColor="text-indigo-700" highlight/>
                   <InfoItem label="Dana Pengembalian" value={`Rp. ${(info.total_harga || 0).toLocaleString('id-ID')}`} highlight />
                   <InfoItem label="Diajukan oleh" value={info.nama_pbf} />
                   <InfoItem label="Tanggal Pengajuan" value={formatDate(info.tanggal_pengajuan_pengembalian)} />
                   <div className="md:col-span-3">
                      <InfoItem label="Alasan Pengembalian" value={info.alasan_pengembalian || '-'} />
                   </div>
                   <div className="md:col-span-3">
                       <dt className="text-xs font-medium text-slate-500 mb-2 uppercase tracking-wider">Bukti Foto dari PBF</dt>
                       <dd className="mt-1">
                          {info.bukti_foto ? (
                             <img
                                src={`http://localhost:5000/${info.bukti_foto.replace(/\\/g, '/')}`}
                                alt="Bukti Pengembalian"
                                className="w-full max-w-sm h-auto object-contain rounded-lg border border-slate-200 bg-slate-50 p-2"
                             />
                          ) : (
                             <div className="p-4 bg-slate-100 text-slate-500 rounded-lg border border-slate-200 text-center">
                                <ImageIcon size={24} className="mx-auto mb-2 opacity-50"/>
                                <span>Tidak ada bukti foto yang diunggah.</span>
                             </div>
                          )}
                       </dd>
                   </div>

               </div>

               <div className="border-t border-slate-200 px-6 pt-6 pb-2">
                   <h3 className="text-lg font-semibold text-slate-800 mb-4 flex items-center gap-2">
                      <FileText size={20} /> Ringkasan Pesanan Awal
                   </h3>
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

               <div className="p-6 flex flex-col sm:flex-row justify-end items-center gap-3 border-t border-slate-200 mt-6">
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
                       <CheckCircle size={18} />
                       Setujui Pengembalian
                     </button>
                   </>
                 ) : (
                    <span className={`px-4 py-2 rounded-full border text-sm font-semibold flex items-center gap-2 ${
                         info.status === 'Pengembalian Disetujui' ? 'bg-green-100 text-green-800 border-green-200' :
                         info.status === 'Pengembalian Ditolak' ? 'bg-red-100 text-red-800 border-red-200' :
                         'bg-slate-100 text-slate-800 border-slate-200'
                     }`}>
                       {info.status === 'Pengembalian Disetujui' ? <CheckCircle size={16} /> :
                        info.status === 'Pengembalian Ditolak' ? <XCircle size={16} /> : null}
                       Status: {info.status}
                    </span>
                 )}
               </div>
            </div>
          </div>
        </main>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl p-8 max-w-md w-full text-center">
            <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-emerald-100 mb-4">
              <HelpCircle className="h-10 w-10 text-emerald-600" />
            </div>
            <h3 className="text-xl font-bold text-gray-900">Setujui Pengajuan Pengembalian?</h3>
            <p className="text-gray-500 mt-2 text-sm">
              Anda akan menyetujui pengajuan pengembalian untuk pesanan ini. Pengiriman retur akan dijadwalkan. Dana akan dikembalikan setelah barang diterima.
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
    </div>
  );
};

const InfoItem = ({ label, value, highlight = false, highlightColor = 'text-emerald-700' }) => (
  <div>
    <p className="text-xs font-medium text-slate-500 mb-1 uppercase tracking-wider">{label}</p>
    <p className={`text-base font-semibold ${highlight ? highlightColor : 'text-slate-800'}`}>{value || '-'}</p>
  </div>
);

export default KonfirmasiPengembalian;