import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import SidebarProdusen from '../../../components/SidebarProdusen';
import NavbarProdusen from '../../../components/NavbarProdusen';
import {
  Loader2,
  ArrowLeft,
  ClipboardCopy,
  Package,
  Truck,
  CheckCircle2, // Use consistent icon
  AlertTriangle,
  FileText, // For error state
  Info,
  Calendar,
  Clock,
  X,
  ImageIcon // For image placeholder
} from 'lucide-react';
import axios from 'axios'; // Assuming axios might be preferred, revert to fetch if needed
import { toast } from 'react-hot-toast';

// --- Modal Component (Keep as is) ---
const BuktiPenerimaanModal = ({ isOpen, onClose, imageUrl }) => {
  if (!isOpen) return null;
  const fullImageUrl = imageUrl ? (imageUrl.startsWith('http') ? imageUrl : `http://localhost:5000/${imageUrl.replace(/\\/g, '/').toLowerCase()}`) : null;
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-white p-4 rounded-lg shadow-2xl relative w-full max-w-lg overflow-hidden" onClick={(e) => e.stopPropagation()}>
        <div className="flex justify-between items-center pb-3 mb-4 border-b border-slate-200">
          <h3 className="text-lg font-semibold text-slate-800">Bukti Penerimaan PBF</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-colors p-1 rounded-full"><X size={20} /></button>
        </div>
        {fullImageUrl ? (
          <div className="bg-slate-100 p-2 rounded"><img src={fullImageUrl} alt="Bukti Penerimaan Barang" className="w-full h-auto max-h-[70vh] object-contain rounded"/></div>
        ) : (
           <div className="text-center py-10 text-slate-500">
               <ImageIcon size={48} className="mx-auto mb-2 opacity-50"/>
               Gambar tidak tersedia.
           </div>
        )}
      </div>
    </div>
  );
};

// --- StatusStep Component (Keep as is) ---
const StatusStep = ({ icon: Icon, label, timestamp, isCompleted, isCurrent, isLast = false, children }) => (
    <div className={`flex items-start ${isLast ? '' : 'flex-1'}`}>
      <div className="flex flex-col items-center mr-4">
        <div className={`w-12 h-12 rounded-full flex items-center justify-center border-2 ${
           isCurrent ? 'bg-emerald-100 border-emerald-500 animate-pulse' :
           isCompleted ? 'bg-emerald-500 border-emerald-600 text-white' :
           'bg-slate-100 border-slate-300 text-slate-400'
        } transition-colors duration-300`}>
          <Icon size={24} />
        </div>
        {!isLast && (
           <div className={`w-0.5 h-16 mt-2 ${isCompleted ? 'bg-emerald-500' : 'bg-slate-300'}`} />
        )}
      </div>
      <div className="pt-2.5 w-28 text-center sm:text-left sm:w-auto">
        <p className={`font-semibold text-sm ${
          isCurrent ? 'text-emerald-700' :
          isCompleted ? 'text-slate-800' :
          'text-slate-500'
        }`}>{label}</p>
        {timestamp && <p className="text-xs text-slate-500 mt-1 flex items-center gap-1 justify-center sm:justify-start"><Clock size={12}/> {timestamp}</p>}
        <div className="mt-2">{children}</div>
      </div>
    </div>
  );

// --- Main Page Component ---
const LihatRiwayat = () => {
  const navigate = useNavigate();
  const { assetId } = useParams(); // assetId is batch_id here
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [riwayatData, setRiwayatData] = useState(null);
  const [copiedResi, setCopiedResi] = useState(false);
  const username = localStorage.getItem('username');

  useEffect(() => {
    const fetchData = async () => {
      if (!assetId) {
        setError("ID Aset (Batch ID) tidak ditemukan di URL.");
        setIsLoading(false);
        return;
      }
      setIsLoading(true);
      setError(null);
      let token;
      try {
        token = localStorage.getItem('token');
        if (!token) throw new Error('Silakan login terlebih dahulu');

        // Use axios consistent with other components
        const response = await axios.get(`http://localhost:5000/api/produsen/riwayat-distribusi/${assetId}`, {
          headers: { Authorization: `Bearer ${token}` }
        });

        if (!response.data.success || !response.data.data) {
           throw new Error(response.data.message || 'Gagal mengambil data riwayat atau format salah');
        }
        setRiwayatData(response.data.data);
      } catch (err) {
         const errorMsg = err.response?.data?.message || err.message || 'Terjadi kesalahan saat memuat data.';
        setError(errorMsg);
        toast.error(errorMsg);
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
  }, [assetId, navigate]);

  const handleLogout = () => { localStorage.clear(); navigate('/'); };

  const copyToClipboard = async (text, type = 'default') => {
    try {
        await navigator.clipboard.writeText(text);
        if (type === 'resi') {
            setCopiedResi(true);
            toast.success('Nomor Resi disalin!');
            setTimeout(() => setCopiedResi(false), 2000);
        } else {
             toast.success('Teks disalin!');
        }
    } catch (err) {
        toast.error('Gagal menyalin teks.');
        console.error('Failed to copy text: ', err);
    }
  };

  const formatDate = (dateString, includeTime = false) => {
      if (!dateString) return '-';
      try {
          const date = new Date(dateString);
          if (isNaN(date.getTime())) return '-';
          const options = { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' };
          if (includeTime) {
              options.hour = '2-digit';
              options.minute = '2-digit';
          }
          return date.toLocaleDateString('id-ID', options);
      } catch(e) {
          console.error("Error formatting date:", e);
          return '-';
      }
  };

  const formatTimestamp = (isoString) => {
       if (!isoString) return '-';
       try {
            const date = new Date(isoString);
             if (isNaN(date.getTime())) return '-';
            return date.toLocaleString('id-ID', {
                 day:'numeric', month:'short', year: 'numeric',
                 hour: '2-digit', minute: '2-digit'
             });
       } catch(e) {
            console.error("Error formatting timestamp:", e);
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
          <p className="mt-4 text-slate-700 font-medium">Memuat Riwayat Pengiriman...</p>
      </div>
    );
  }

  if (error && !riwayatData) {
     return (
       <div className="flex flex-col justify-center items-center h-screen bg-gradient-to-br from-slate-50 via-white to-red-50 p-6">
          <div className="bg-white p-8 rounded-xl shadow-lg border border-red-200 text-center max-w-lg">
            <AlertTriangle className="mx-auto h-12 w-12 text-red-500 mb-4" />
            <h2 className="text-xl font-bold text-red-800 mb-2">Gagal Memuat Data</h2>
            <p className="text-red-600 mb-6">{error}</p>
            <button
               onClick={() => navigate('/produsen/pengelolaan-pengiriman')} // Navigate back to list
               className="flex items-center gap-2 px-4 py-2.5 border border-slate-300 text-slate-700 font-medium rounded-lg hover:bg-slate-100 transition mx-auto"
             >
               <ArrowLeft size={18} />
               Kembali ke Pengiriman
             </button>
          </div>
       </div>
    );
  }

  if (!riwayatData || !riwayatData.onChain || !riwayatData.offChain) {
     return (
       <div className="flex flex-col justify-center items-center h-screen bg-slate-50 p-6">
        <div className="bg-white p-8 rounded-xl shadow-lg border border-slate-200 text-center max-w-lg">
          <FileText className="mx-auto h-12 w-12 text-yellow-500 mb-4" />
          <h2 className="text-xl font-bold text-slate-800 mb-2">Data Riwayat Tidak Ditemukan</h2>
          <p className="text-slate-600 mb-6">Tidak dapat menemukan detail riwayat untuk Batch ID ini.</p>
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


  const { onChain, offChain } = riwayatData;
  const dataKirim = onChain.riwayat.find(item => item.status === 'DIKIRIM_KE_PBF');
  const dataTerima = onChain.riwayat.find(item => item.status === 'DITERIMA_PBF');

  const isDipersiapkanCompleted = true;
  const isDikirimCompleted = !!dataKirim;
  const isSelesaiCompleted = !!dataTerima;

  const tanggalPengiriman = offChain.tanggal_pengiriman ? new Date(offChain.tanggal_pengiriman) : null;
  const estimasiSampai = new Date(tanggalPengiriman || Date.now());
  const hariTambah = offChain.opsi_pengiriman === 'ekspres' ? 1 : 3;
  estimasiSampai.setDate((tanggalPengiriman || new Date()).getDate() + hariTambah);

  const getCurrentStatus = () => {
    if (dataTerima) return 'Selesai';
    if (dataKirim) return 'Dikirim';
    return 'Dipersiapkan';
  };
  const currentStatus = getCurrentStatus();

  return (
    <div className="flex min-h-screen bg-slate-50">
      <SidebarProdusen isCollapsed={isCollapsed} setIsCollapsed={setIsCollapsed} />
      <div className={`flex-1 flex flex-col transition-all duration-300 ${isCollapsed ? 'ml-16' : 'ml-64'}`}>
        <NavbarProdusen onLogout={handleLogout} username={username} />

        <main className="flex-1 overflow-auto pt-[72px]">
          <div className="max-w-5xl mx-auto px-6 py-8">
            <button
              onClick={() => navigate(-1)}
              className="mb-6 inline-flex items-center text-emerald-600 hover:text-emerald-700 transition-colors text-sm font-medium"
            >
              <ArrowLeft size={16} className="mr-1" /> Kembali
            </button>

            <div className="bg-white rounded-xl shadow-lg border border-slate-200 overflow-hidden">
              <div className="bg-gradient-to-r from-emerald-50 to-emerald-100 px-6 py-5 border-b border-slate-200 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                 <div>
                    <h1 className="text-2xl font-bold text-emerald-900">Lacak Pengiriman</h1>
                    <p className="text-sm text-emerald-700 mt-1">Status pengiriman untuk Batch ID: <span className="font-mono">{assetId}</span></p>
                 </div>
                 <div className={`px-4 py-2 rounded-full border text-sm font-semibold flex items-center gap-2 ${
                     currentStatus === 'Selesai' ? 'bg-green-100 text-green-800 border-green-200' :
                     currentStatus === 'Dikirim' ? 'bg-blue-100 text-blue-800 border-blue-200' :
                     'bg-yellow-100 text-yellow-800 border-yellow-200'
                 }`}>
                     {currentStatus === 'Selesai' ? <CheckCircle2 size={16} /> :
                      currentStatus === 'Dikirim' ? <Truck size={16} /> :
                      <Package size={16} />}
                     Status: {currentStatus}
                 </div>
              </div>

              <div className="p-6 border-b border-slate-200">
                  <h3 className="text-lg font-semibold text-slate-800 mb-4">Detail Pengiriman</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-4 text-sm">
                      <div className="flex items-center justify-between sm:block">
                          <span className="text-slate-500">Nomor Resi:</span>
                          <div className="flex items-center gap-1">
                              <span className="font-semibold text-slate-700 font-mono">{offChain.nomor_resi || '-'}</span>
                              {offChain.nomor_resi && (
                                <button onClick={() => copyToClipboard(offChain.nomor_resi, 'resi')} className="text-slate-400 hover:text-emerald-600 transition-colors" title="Salin No Resi">
                                  <ClipboardCopy size={14} />
                                </button>
                              )}
                              {copiedResi && <CheckCircle2 size={14} className="text-green-500" />}
                          </div>
                      </div>
                       <div className="flex items-center justify-between sm:block">
                           <span className="text-slate-500">No Surat Jalan:</span>
                           <span className="font-semibold text-slate-700 font-mono">{offChain.nomor_surat_jalan || '-'}</span>
                       </div>
                       <div className="flex items-center justify-between sm:block">
                           <span className="text-slate-500">ID Pesanan Terkait:</span>
                           <span className="font-semibold text-slate-700">#{String(offChain.id).padStart(6, '0')}</span>
                       </div>
                       <div className="flex items-center justify-between sm:block">
                           <span className="text-slate-500">Pengirim (Produsen):</span>
                           <span className="font-semibold text-slate-700">{offChain.nama_produsen}</span>
                       </div>
                       <div className="flex items-center justify-between sm:block">
                           <span className="text-slate-500">Penerima (PBF):</span>
                           <span className="font-semibold text-slate-700">{offChain.nama_pbf}</span>
                       </div>
                       <div className="flex items-center justify-between sm:block">
                           <span className="text-slate-500">Opsi Pengiriman:</span>
                           <span className="font-semibold text-slate-700 capitalize">{offChain.opsi_pengiriman || 'standar'}</span>
                       </div>
                       <div className="flex items-center justify-between sm:block">
                          <span className="text-slate-500">Tanggal Pesan:</span>
                          <span className="font-semibold text-slate-700">{formatDate(offChain.tanggal_pesanan)}</span>
                       </div>
                       <div className="flex items-center justify-between sm:block">
                           <span className="text-slate-500">Tanggal Pengiriman:</span>
                           <span className="font-semibold text-slate-700">{formatDate(offChain.tanggal_pengiriman)} {offChain.waktu_pengiriman || ''}</span>
                       </div>
                       <div className="flex items-center justify-between sm:block">
                           <span className="text-slate-500">Estimasi Sampai:</span>
                           <span className="font-semibold text-slate-700">{formatDate(estimasiSampai)}</span>
                       </div>
                  </div>
              </div>

              <div className="p-6 py-10 flex flex-col sm:flex-row justify-around items-start sm:items-stretch">
                <StatusStep
                  icon={Package}
                  label="Dipersiapkan"
                  timestamp={formatDate(offChain.tanggal_pesanan, true)}
                  isCompleted={isDipersiapkanCompleted}
                  isCurrent={currentStatus === 'Dipersiapkan'}
                />
                <StatusStep
                  icon={Truck}
                  label="Dikirim"
                  timestamp={isDikirimCompleted ? formatTimestamp(dataKirim?.timestamp) : null}
                  isCompleted={isDikirimCompleted}
                  isCurrent={currentStatus === 'Dikirim'}
                />
                <StatusStep
                  icon={CheckCircle2}
                  label="Selesai Diterima"
                  timestamp={isSelesaiCompleted ? formatTimestamp(dataTerima?.timestamp) : null}
                  isCompleted={isSelesaiCompleted}
                  isCurrent={currentStatus === 'Selesai'}
                  isLast={true}
                >
                  {isSelesaiCompleted && offChain.buktiPenerimaUrl && (
                    <button onClick={() => setIsModalOpen(true)} className="text-xs text-emerald-600 hover:underline mt-1 font-semibold block text-center sm:text-left">
                      Lihat Bukti
                    </button>
                  )}
                 </StatusStep>
              </div>

              <div className="px-6 pb-6">
                 <div className="bg-blue-50 border border-blue-200 text-blue-800 rounded-lg p-4 text-sm flex items-start gap-3">
                   <Info size={18} className="flex-shrink-0 mt-0.5"/>
                   <span>
                     Status pengiriman ini diverifikasi berdasarkan data yang tercatat di blockchain untuk memastikan transparansi dan keaslian.
                   </span>
                 </div>
              </div>

            </div>
          </div>
        </main>
      </div>
      <BuktiPenerimaanModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        imageUrl={offChain.buktiPenerimaUrl}
      />
       <style jsx global>{`
        @media print {
          body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          .print\\:hidden { display: none !important; }
        }
      `}</style>
    </div>
  );
};

export default LihatRiwayat;