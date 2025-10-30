import React, { useState, useEffect, useRef } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import SidebarProdusen from '../../../components/SidebarProdusen';
import NavbarProdusen from '../../../components/NavbarProdusen';
import {
  Loader2,
  ArrowLeft,
  ClipboardCopy,
  Package,
  Truck,
  CheckCircle, 
  CheckCircle2, 
  AlertTriangle,
  Info,
  Calendar,
  Clock,
  Camera,
  X,
  Image as ImageIcon,
  Download,
  FileText // Ditambahkan untuk konsistensi
} from 'lucide-react';
import axios from 'axios';
import html2pdf from 'html2pdf.js';
import { toast } from 'react-hot-toast';

// --- Modal Konfirmasi Penerimaan ---
const ConfirmationModal = ({ show, onClose, onConfirm, isSubmitting, orderId, onFileChange, buktiFoto }) => {
  if (!show) return null;
  return (
    <div
      className="fixed inset-0 z-[100] flex justify-center items-center p-4
                 bg-slate-900/40 backdrop-blur-sm animate-in fade-in-0"
    >
      <div
        className="bg-white p-6 rounded-2xl shadow-xl max-w-sm w-full border border-slate-200
                   animate-in fade-in-0 zoom-in-95 duration-300"
      >
        <div className="flex justify-between items-center pb-3 border-b border-slate-200">
          <h3 className="text-lg font-semibold text-slate-800">Konfirmasi Penerimaan Pengembalian</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-colors rounded-full p-1">
            <X size={20} />
          </button>
        </div>
        <div className="text-center pt-5">
          <CheckCircle2 size={48} className="text-emerald-500 mx-auto mb-4" />
          <p className="text-slate-600 mb-5 text-sm">
            Unggah bukti foto untuk konfirmasi penerimaan barang retur dari pesanan ID: <br />
            <strong className="text-base text-slate-800">#{String(orderId).padStart(6, '0')}</strong>
          </p>

          <div className="mb-6">
            <label
              htmlFor="buktiFoto"
              className="relative flex flex-col items-center justify-center w-full h-32 bg-slate-50 border-2
                         border-dashed border-slate-300 rounded-lg cursor-pointer
                         hover:border-emerald-500 transition-colors group p-4"
            >
              {buktiFoto ? (
                <img src={URL.createObjectURL(buktiFoto)} alt="Preview Bukti Foto" className="w-full h-full object-contain rounded-lg" />
              ) : (
                <div className="text-center text-slate-500 group-hover:text-emerald-600 transition-colors">
                  <Camera size={24} className="mx-auto" />
                  <p className="text-xs mt-2 font-medium">Unggah Bukti Foto Penerimaan*</p>
                  <p className="text-xs text-slate-400 mt-1">JPG/PNG, Max 5MB</p>
                </div>
              )}
              <input id="buktiFoto" type="file" accept="image/jpeg,image/png" onChange={onFileChange} className="hidden" required />
            </label>
            {buktiFoto && <p className="text-xs text-slate-500 mt-2 truncate">{buktiFoto.name}</p>}
            {!buktiFoto && <p className="text-xs text-red-500 mt-1">*Bukti foto wajib diunggah.</p>}
          </div>

          <div className="flex justify-end gap-3">
            <button
              onClick={onClose}
              className="py-2.5 px-5 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 transition-colors font-semibold disabled:opacity-50"
              disabled={isSubmitting}
            >
              Batal
            </button>
            <button
              onClick={onConfirm}
              className="py-2.5 px-5 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 flex
                         items-center gap-2 transition-colors font-semibold disabled:bg-emerald-300 disabled:cursor-not-allowed"
              disabled={isSubmitting || !buktiFoto}
            >
              {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
              {isSubmitting ? 'Memproses...' : 'Ya, Konfirmasi'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// --- Modal Lihat Bukti ---
const ProofModal = ({ show, onClose, imageUrl }) => {
    if (!show) return null;
    const fullImageUrl = imageUrl ? (imageUrl.startsWith('http') ? imageUrl : `http://localhost:5000/${imageUrl.replace(/\\/g, '/').toLowerCase()}`) : null;
    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={onClose}>
            <div className="bg-white p-4 rounded-lg shadow-2xl relative w-full max-w-lg overflow-hidden" onClick={(e) => e.stopPropagation()}>
                <div className="flex justify-between items-center pb-3 mb-4 border-b border-slate-200">
                    <h3 className="text-lg font-semibold text-slate-800">Bukti Penerimaan Pengembalian</h3>
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

// --- StatusStep (Horizontal) ---
const StatusStep = ({ icon: Icon, label, timestamp, isCompleted, isCurrent, children }) => (
    <div className="relative flex flex-col items-center justify-start text-center w-40">
      <div className={`w-14 h-14 rounded-full flex items-center justify-center border-2 ${
         isCurrent ? 'bg-emerald-100 border-emerald-500 animate-pulse' :
         isCompleted ? 'bg-emerald-500 border-emerald-600 text-white' :
         'bg-slate-100 border-slate-300 text-slate-400'
      } transition-colors duration-300 z-10`}>
        <Icon size={26} />
      </div>
      <div className="mt-3">
        <p className={`font-semibold text-sm ${
          isCurrent ? 'text-emerald-700' :
          isCompleted ? 'text-slate-800' :
          'text-slate-500'
        }`}>{label}</p>
        {timestamp && <p className="text-xs text-slate-500 mt-1">{timestamp}</p>}
        {children && <div className="mt-1">{children}</div>} 
      </div>
    </div>
  );

// --- Komponen Utama ---
const LacakPengembalian = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [trackingData, setTrackingData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showProofModal, setShowProofModal] = useState(false);
  const [buktiFoto, setBuktiFoto] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [copiedResi, setCopiedResi] = useState(false);
  const contentRef = useRef(null);
  const username = localStorage.getItem('username');

  const fetchTrackingData = async () => {
    // Reset state untuk loading
    setIsLoading(true);
    setError(null);
    let token;
    try {
      token = localStorage.getItem('token');
      if (!token) throw new Error('Silakan login terlebih dahulu');

      const response = await axios.get(`http://localhost:5000/api/produsen/pesanan-masuk/lacak-pengembalian/${id}`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });

      if (!response.data.success || !response.data.data) throw new Error(response.data.message || 'Data pelacakan tidak tersedia');

      const data = response.data.data;
      
      const waktuPengembalian = data.tanggal_pengiriman_pengembalian ? new Date(data.tanggal_pengiriman_pengembalian) : (data.tanggal_pengajuan_pengembalian ? new Date(data.tanggal_pengajuan_pengembalian) : new Date());
      const estimasiSampai = new Date(waktuPengembalian);
      estimasiSampai.setDate(waktuPengembalian.getDate() + 2); // Asumsi 2 hari

      setTrackingData({
        noResi: data.nomor_resi_pengembalian,
        noSuratJalanBerangkat: data.nomor_surat_jalan,
        noSuratJalanPulang: data.nomor_surat_jalan_pengembalian || `SJPR-${String(data.id).padStart(3,'0')}`,
        pengirim: data.nama_pbf,
        tujuan: data.nama_produsen,
        idPesanan: String(data.id).padStart(6, '0'),
        waktuPengembalianDisetujui: data.tanggal_pengajuan_pengembalian, // Asumsi ini tanggal disetujui
        waktuPengirimanKembali: data.tanggal_pengiriman_pengembalian, // Tanggal PBF kirim
        waktuPenerimaanProdusen: data.tanggal_penerimaan_produsen, // Tanggal Produsen konfirmasi
        estimasiSampai: estimasiSampai,
        status: data.status,
        buktiFotoPengembalian: data.bukti_foto, // Bukti dari PBF (awal)
        buktiPenerimaanProdusen: data.bukti_foto_pengembalian // Bukti dari Produsen (akhir)
      });

    } catch (err) {
      setError(err.message);
       if ((err.message.includes('401') || err.message.includes('403') || err.message.includes('login')) && token) {
            navigate('/login/produsen');
        } else if (!token) {
             navigate('/login/produsen');
        }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTrackingData();
  }, [id, navigate]);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
     if (file) {
        if (file.size > 5 * 1024 * 1024) {
          toast.error('Ukuran file tidak boleh melebihi 5MB.');
          e.target.value = null;
          return;
        }
        if (!['image/jpeg', 'image/png'].includes(file.type)) {
          toast.error('Hanya file JPG atau PNG yang diizinkan.');
          e.target.value = null;
          return;
        }
        setBuktiFoto(file);
    }
  };

  const handleConfirmReceipt = async () => {
    if (!buktiFoto) {
      toast.error('Bukti foto penerimaan wajib diunggah.');
      return;
    }
    setIsSubmitting(true);
    setError(null);
    toast.dismiss();

    const formData = new FormData();
    formData.append('buktiFoto', buktiFoto);

    try {
      const token = localStorage.getItem('token');
      if (!token) throw new Error('Sesi tidak valid.');

      const response = await axios.put(`http://localhost:5000/api/produsen/pesanan-masuk/lacak-pengembalian/${id}/konfirmasi`, formData, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data.success) {
        toast.success('Penerimaan pengembalian berhasil dikonfirmasi!');
        setShowConfirmModal(false);
        setBuktiFoto(null);
        fetchTrackingData();
      } else {
        throw new Error(response.data.message || 'Gagal konfirmasi penerimaan.');
      }
    } catch (err) {
       const errorMsg = err.response?.data?.message || err.message || 'Gagal konfirmasi penerimaan.';
      setError(errorMsg);
      toast.error(errorMsg);
    } finally {
      setIsSubmitting(false);
    }
  };

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

  const handleDownloadPDF = () => {
    const element = contentRef.current;
     if (!element || !trackingData?.noSuratJalanPulang) {
        toast.error("Data belum siap untuk diunduh.");
        return;
    }
    const opt = {
        margin:       [10, 5, 10, 5],
        filename:     `lacak_pengembalian_${trackingData.noSuratJalanPulang}.pdf`,
        image:        { type: 'jpeg', quality: 0.98 },
        html2canvas:  { scale: 2, useCORS: true, logging: true, dpi: 192, letterRendering: true },
        jsPDF:        { unit: 'mm', format: 'a4', orientation: 'portrait' }
    };
    html2pdf().from(element).set(opt).save();
  };
  
  const formatTimestamp = (dateString) => {
      if (!dateString) return null;
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return null;
      return date.toLocaleString('id-ID', {
          day:'numeric', month:'short', year: 'numeric',
          hour: '2-digit', minute: '2-digit'
      });
  };

  const formatDate = (dateString) => {
      if (!dateString) return 'N/A';
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return 'N/A';
      return date.toLocaleDateString('id-ID', {
          day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC'
      });
  };


  if (isLoading) {
     return (
       <div className="flex flex-col justify-center items-center h-screen bg-gradient-to-br from-slate-50 via-white to-emerald-50">
          <div className="relative">
            <Loader2 className="animate-spin h-12 w-12 text-emerald-600" />
            <div className="absolute inset-0 h-12 w-12 rounded-full border-4 border-emerald-200 animate-ping opacity-20"></div>
          </div>
          <p className="mt-4 text-slate-700 font-medium">Memuat Lacak Pengembalian...</p>
      </div>
    );
  }

  if (error && !trackingData) {
     return (
       <div className="flex min-h-screen bg-gradient-to-br from-slate-50 via-white to-emerald-50">
        <SidebarProdusen isCollapsed={isCollapsed} setIsCollapsed={setIsCollapsed} />
        <div className={`flex-1 flex flex-col transition-all duration-300 ${isCollapsed ? 'ml-16' : 'ml-64'}`}>
          <NavbarProdusen onLogout={() => { localStorage.clear(); navigate('/'); }} username={username} />
          <main className="flex-1 flex items-center justify-center p-6 pt-[72px]">
            <div className="bg-white p-8 rounded-2xl shadow-lg border border-red-200 text-center max-w-md">
              <AlertTriangle className="mx-auto h-12 w-12 text-red-500 mb-4" />
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


  if (!trackingData) return (
       <div className="flex min-h-screen bg-gradient-to-br from-slate-50 via-white to-emerald-50">
        <SidebarProdusen isCollapsed={isCollapsed} setIsCollapsed={setIsCollapsed} />
        <div className={`flex-1 flex flex-col transition-all duration-300 ${isCollapsed ? 'ml-16' : 'ml-64'}`}>
          <NavbarProdusen onLogout={() => { localStorage.clear(); navigate('/'); }} username={username} />
          <main className="flex-1 flex items-center justify-center p-6 pt-[72px]">
            <div className="bg-white p-8 rounded-2xl shadow-lg border border-slate-200 text-center max-w-md">
              <FileText className="mx-auto h-12 w-12 text-yellow-500 mb-4" />
              <h2 className="text-xl font-bold text-slate-800 mb-2">Data Pelacakan Tidak Ditemukan</h2>
              <p className="text-slate-600 mb-6">Tidak dapat menemukan detail pelacakan untuk pengembalian ini.</p>
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

  const isDisetujui = trackingData.status === 'Pengembalian Disetujui' || trackingData.status === 'Dikembalikan' || trackingData.status === 'Pengembalian Selesai';
  const isDikirimkanKembali = trackingData.status === 'Dikembalikan' || trackingData.status === 'Pengembalian Selesai';
  const isSelesai = trackingData.status === 'Pengembalian Selesai';
  const currentStatusStep = isSelesai ? 'Selesai' : (isDikirimkanKembali ? 'Dikirim' : 'Disetujui');


  return (
    <div className="flex min-h-screen bg-gradient-to-br from-slate-50 via-white to-emerald-50">
      <SidebarProdusen isCollapsed={isCollapsed} setIsCollapsed={setIsCollapsed} />
      <div className={`flex-1 flex flex-col transition-all duration-300 ${isCollapsed ? 'ml-16' : 'ml-64'}`}>
        <NavbarProdusen onLogout={() => { localStorage.clear(); navigate('/'); }} username={username} />

        <main className="flex-1 overflow-auto pt-[72px] px-12 py-8">
          <div className="max-w-5xl mx-auto">
            <div className="print:hidden flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
                <button
                   onClick={() => navigate('/produsen/pengelolaan-pengiriman/pengembalian')}
                   className="inline-flex items-center text-emerald-600 hover:text-emerald-700 transition-colors text-sm font-medium"
                 >
                   <ArrowLeft size={16} className="mr-1" /> Kembali ke Daftar Pengembalian
                 </button>
                <div className="flex flex-wrap items-center gap-3">
                   <button onClick={handleDownloadPDF} className="inline-flex items-center px-4 py-2.5 bg-slate-700 text-white font-medium rounded-lg hover:bg-slate-800 transition">
                     <Download className="w-4 h-4 mr-2" /> Unduh PDF
                   </button>
                 </div>
            </div>

            {error && !isLoading && (
              <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 rounded-xl flex items-center gap-3 print:hidden">
                <AlertTriangle size={20} />
                <span>{error}</span>
              </div>
            )}

            <div ref={contentRef} className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden print:shadow-none print:border-0 print:p-4">
              <div className="bg-gradient-to-r from-emerald-500 to-teal-600 px-6 py-5 border-b border-slate-200 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                 <div>
                    <h1 className="text-2xl font-bold text-white">Lacak Pengembalian</h1>
                    <p className="text-sm text-emerald-50 mt-1">Status pengembalian untuk Pesanan #{trackingData.idPesanan}</p>
                 </div>
                  <span className={`px-4 py-2 rounded-full border-2 text-sm font-semibold flex items-center gap-2 bg-white ${
                     isSelesai ? 'text-emerald-700 border-emerald-200' :
                     isDikirimkanKembali ? 'text-blue-700 border-blue-200' :
                     'text-amber-700 border-amber-200'
                 }`}>
                     {isSelesai ? <CheckCircle2 size={16} /> :
                      isDikirimkanKembali ? <Truck size={16} /> :
                      <Package size={16} />}
                     Status: {trackingData.status.replace(/_/g, ' ')}
                 </span>
              </div>

               <div className="p-8 border-b border-slate-200">
                  <h3 className="text-lg font-bold text-slate-900 mb-6 flex items-center gap-2">
                    <Package size={20} className="text-emerald-600" />
                    Detail Pengembalian
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                       <div className="space-y-1">
                          <span className="text-sm font-medium text-slate-500">Nomor Resi Retur</span>
                          <div className="flex items-center gap-2 bg-slate-50 p-3 rounded-lg border border-slate-200">
                              <span className="font-bold text-slate-900 font-mono text-base flex-1">{trackingData.noResi || '-'}</span>
                              {trackingData.noResi && (
                                <button onClick={() => copyToClipboard(trackingData.noResi, 'resi')} className="text-slate-400 hover:text-emerald-600 transition-colors p-1" title="Salin No Resi">
                                  <ClipboardCopy size={18} />
                                </button>
                              )}
                              {copiedResi && <CheckCircle2 size={18} className="text-emerald-500" />}
                          </div>
                      </div>
                       <div className="space-y-1">
                           <span className="text-sm font-medium text-slate-500">No Surat Jalan Retur</span>
                           <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
                             <span className="font-bold text-slate-900 font-mono text-base">{trackingData.noSuratJalanPulang || '-'}</span>
                           </div>
                       </div>
                       <div className="space-y-1">
                           <span className="text-sm font-medium text-slate-500">ID Pesanan Asal</span>
                           <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
                             <span className="font-bold text-slate-900 text-base">#{trackingData.idPesanan}</span>
                           </div>
                       </div>
                       <div className="space-y-1">
                           <span className="text-sm font-medium text-slate-500">No Surat Jalan Asal</span>
                           <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
                             <span className="font-bold text-slate-900 font-mono text-base">{trackingData.noSuratJalanBerangkat || '-'}</span>
                           </div>
                       </div>
                       <div className="space-y-1">
                           <span className="text-sm font-medium text-slate-500">Pengirim (PBF)</span>
                           <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
                             <span className="font-semibold text-slate-900 text-base">{trackingData.pengirim}</span>
                           </div>
                       </div>
                       <div className="space-y-1">
                           <span className="text-sm font-medium text-slate-500">Tujuan (Produsen)</span>
                           <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
                             <span className="font-semibold text-slate-900 text-base">{trackingData.tujuan}</span>
                           </div>
                       </div>
                       <div className="space-y-1">
                           <span className="text-sm font-medium text-slate-500">Tanggal Pengiriman Retur</span>
                           <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
                             <span className="font-semibold text-slate-900 text-base">{formatDate(trackingData.waktuPengirimanKembali) || 'Belum Dikirim'}</span>
                           </div>
                       </div>
                       <div className="space-y-1">
                           <span className="text-sm font-medium text-slate-500">Estimasi Tiba</span>
                           <div className="bg-emerald-50 p-3 rounded-lg border border-emerald-200">
                             <span className="font-semibold text-emerald-700 text-base">{formatDate(trackingData.estimasiSampai)}</span>
                           </div>
                       </div>
                  </div>
              </div>

              <div className="p-8 py-12">
                <h3 className="text-lg font-bold text-slate-900 mb-8 text-center">Status Pengembalian</h3>
                <div className="flex items-start justify-center gap-0">
                  <StatusStep
                    icon={Package}
                    label="Disetujui"
                    timestamp={formatTimestamp(trackingData.waktuPengembalianDisetujui)}
                    isCompleted={isDisetujui}
                    isCurrent={currentStatusStep === 'Disetujui'}
                  />
                  <div className="relative flex items-center h-14 w-24">
                      <div className={`w-full h-1.5 rounded-full ${isDikirimkanKembali ? 'bg-emerald-500' : 'bg-slate-300'}`} />
                  </div>
                  <StatusStep
                    icon={Truck}
                    label="Dikirim Kembali"
                    timestamp={formatTimestamp(trackingData.waktuPengirimanKembali)}
                    isCompleted={isDikirimkanKembali}
                    isCurrent={currentStatusStep === 'Dikirim'}
                  />
                  <div className="relative flex items-center h-14 w-24">
                      <div className={`w-full h-1.5 rounded-full ${isSelesai ? 'bg-emerald-500' : 'bg-slate-300'}`} />
                  </div>
                  <StatusStep
                    icon={CheckCircle2}
                    label="Selesai Diterima"
                    timestamp={isSelesai ? formatTimestamp(trackingData.waktuPenerimaanProdusen) : `Estimasi: ${formatDate(trackingData.estimasiSampai)}`}
                    isCompleted={isSelesai}
                    isCurrent={currentStatusStep === 'Selesai'}
                  >
                    {isSelesai && trackingData.buktiPenerimaanProdusen && (
                        <button onClick={() => setShowProofModal(true)} className="text-xs text-emerald-600 hover:underline mt-1 font-semibold block w-full text-center">
                          Lihat Bukti
                        </button>
                    )}
                  </StatusStep>
                </div>
              </div>

               <div className="p-6 flex flex-col sm:flex-row justify-between items-center gap-4 border-t border-slate-200 print:hidden">
                  <div className="flex-1">
                      {trackingData.status === 'Pengembalian Selesai' && (
                          <div className="bg-green-50 border border-green-200 text-green-800 rounded-lg p-3 text-sm flex items-center gap-3">
                            <Info size={18} className="flex-shrink-0"/>
                            <span>Proses pengembalian ini telah selesai dan dikonfirmasi.</span>
                          </div>
                      )}
                      {trackingData.status === 'Pengembalian Disetujui' && (
                          <div className="bg-blue-50 border border-blue-200 text-blue-800 rounded-lg p-3 text-sm flex items-center gap-3">
                            <Info size={18} className="flex-shrink-0"/>
                            <span>Menunggu PBF mengirimkan barang retur. Status akan diperbarui.</span>
                          </div>
                      )}
                       {trackingData.status === 'Dikembalikan' && (
                          <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 rounded-lg p-3 text-sm flex items-center gap-3">
                            <Info size={18} className="flex-shrink-0"/>
                            <span>Barang sedang dalam perjalanan. Silakan konfirmasi setelah Anda menerimanya.</span>
                          </div>
                      )}
                  </div>
                  
                  <div className="flex-shrink-0 w-full sm:w-auto">
                      {trackingData.status === 'Dikembalikan' && (
                          <button
                              onClick={() => setShowConfirmModal(true)}
                              className="w-full sm:w-auto px-6 py-2.5 bg-emerald-600 text-white font-medium rounded-lg hover:bg-emerald-700 transition flex items-center justify-center gap-2 shadow-md"
                          >
                              <CheckCircle size={18} />
                              Konfirmasi Penerimaan Barang
                          </button>
                      )}
                  </div>
              </div>

            </div>
          </div>
        </main>
      </div>

      <ConfirmationModal
          show={showConfirmModal}
          onClose={() => setShowConfirmModal(false)}
          onConfirm={handleConfirmReceipt}
          isSubmitting={isSubmitting}
          orderId={trackingData.idPesanan}
          onFileChange={handleFileChange}
          buktiFoto={buktiFoto}
      />

      <ProofModal
        show={showProofModal}
        onClose={() => setShowProofModal(false)}
        imageUrl={trackingData.buktiPenerimaanProdusen}
      />
       <style jsx global>{`
        @media print {
          body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          .print\\:hidden { display: none !important; }
          .print\\:shadow-none { box-shadow: none !important; }
          .print\\:border-0 { border: 0 !important; }
          .print\\:p-4 { padding: 1rem !important; }
          .print\\:block { display: block !important; }
        }
      `}</style>

    </div>
  );
};

export default LacakPengembalian;

