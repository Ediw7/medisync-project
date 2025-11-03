import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import SidebarPbf from '../../../components/SidebarPbf';
import NavbarPbf from '../../../components/NavbarPbf';
import {
  Loader2,
  ArrowLeft,
  AlertTriangle,
  FileText,
  Package,
  Truck,
  CheckCircle2,
  XCircle,
  HelpCircle,
  Info,
  Calendar,
  Undo2, // Ikon Header
  ImageIcon,
  X, // Untuk Modal
  Camera, // Untuk Upload
  CheckCircle // Untuk Modal
} from 'lucide-react';
import axios from 'axios';
import { toast } from 'react-hot-toast';

// --- MODAL BUKTI FOTO ---
const ProofModal = ({ isOpen, onClose, imageUrl, title }) => {
  if (!isOpen) return null;
  const fullImageUrl = imageUrl
    ? (imageUrl.startsWith('http') ? imageUrl : `http://localhost:5000/${imageUrl.replace(/\\/g, '/')}`)
    : null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-white p-4 rounded-lg shadow-2xl relative w-full max-w-lg overflow-hidden" onClick={(e) => e.stopPropagation()}>
        <div className="flex justify-between items-center pb-3 mb-4 border-b border-slate-200">
          <h3 className="text-lg font-semibold text-slate-800">{title}</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-colors p-1 rounded-full"><X size={20} /></button>
        </div>
        {fullImageUrl ? (
          <div className="bg-slate-100 p-2 rounded">
            <img src={fullImageUrl} alt={title} className="w-full h-auto max-h-[70vh] object-contain rounded" />
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

// --- MODAL KONFIRMASI SELESAI (BARU) ---
const SelesaiModal = ({ show, onClose, onConfirm, isSubmitting, orderId, onFileChange, buktiFoto }) => {
  if (!show) return null;

  return (
    <div className="fixed inset-0 z-[100] flex justify-center items-center p-4 bg-slate-900/40 backdrop-blur-sm" onClick={onClose}>
      <div 
        className="bg-white p-6 rounded-2xl shadow-xl max-w-sm w-full border border-slate-200 animate-in fade-in-0 zoom-in-95 duration-300"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center pb-3 border-b border-slate-200">
          <h3 className="text-lg font-semibold text-slate-800">Konfirmasi Penerimaan Retur</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-colors rounded-full p-1">
            <X size={20} />
          </button>
        </div>
        <div className="text-center pt-5">
          <CheckCircle2 size={48} className="text-emerald-500 mx-auto mb-4" />
          <p className="text-slate-600 mb-5 text-sm">
            Anda akan menyelesaikan proses pengembalian untuk pesanan: <br />
            <strong className="text-base text-slate-800 font-mono">#{String(orderId).padStart(6, '0')}</strong>
          </p>

          <div className="mb-6">
            <label htmlFor="buktiFotoPbf" className="relative flex flex-col items-center justify-center w-full h-32 bg-slate-50 border-2 border-dashed border-slate-300 rounded-lg cursor-pointer hover:border-emerald-500 transition-colors group p-4">
              {buktiFoto ? (
                <img src={URL.createObjectURL(buktiFoto)} alt="Preview" className="w-full h-full object-contain rounded-lg" />
              ) : (
                <div className="text-center text-slate-500 group-hover:text-emerald-600 transition-colors">
                  <Camera size={24} className="mx-auto" />
                  <p className="text-xs mt-2 font-medium">Unggah Bukti Foto Penerimaan (PBF)*</p>
                  <p className="text-xs text-slate-400 mt-1">JPG/PNG, Max 5MB</p>
                </div>
              )}
              <input id="buktiFotoPbf" type="file" accept="image/jpeg,image/png" onChange={onFileChange} className="hidden" required />
            </label>
            {buktiFoto && <p className="text-xs text-slate-500 mt-2 truncate">{buktiFoto.name}</p>}
            {!buktiFoto && <p className="text-xs text-red-500 mt-1">*Bukti foto wajib diunggah.</p>}
          </div>

          <div className="flex justify-end gap-3">
            <button onClick={onClose} className="py-2.5 px-5 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 transition-colors font-semibold disabled:opacity-50" disabled={isSubmitting}>
              Batal
            </button>
            <button
              onClick={onConfirm}
              className="py-2.5 px-5 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 flex items-center gap-2 transition-colors font-semibold disabled:bg-emerald-300 disabled:cursor-not-allowed"
              disabled={isSubmitting || !buktiFoto}
            >
              {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
              {isSubmitting ? 'Memproses...' : 'Ya, Selesaikan'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// --- STATUS STEP (Desain Horizontal) ---
const StatusStep = ({ icon: Icon, label, timestamp, isCompleted, isCurrent, isRejected }) => (
  <div className="relative flex flex-col items-center justify-start text-center w-32 md:w-40">
    <div className={`w-14 h-14 rounded-full flex items-center justify-center border-2 ${
       isCurrent ? 'bg-emerald-100 border-emerald-500 animate-pulse' :
       isCompleted ? 'bg-emerald-500 border-emerald-600 text-white' :
       isRejected ? 'bg-red-100 border-red-500 text-red-500' :
       'bg-slate-100 border-slate-300 text-slate-400'
    } transition-colors duration-300 z-10`}>
      <Icon size={26} />
    </div>
    <div className="mt-3">
      <p className={`font-semibold text-sm ${
        isCurrent ? 'text-emerald-700' :
        isCompleted ? 'text-slate-800' :
        isRejected ? 'text-red-700' :
        'text-slate-500'
      }`}>{label}</p>
      {timestamp && <p className="text-xs text-slate-500 mt-1">{timestamp}</p>}
    </div>
  </div>
);

const StatusLine = ({ isCompleted }) => (
  <div className="relative flex items-center h-14 w-16 md:w-24">
    <div className={`w-full h-1.5 rounded-full ${isCompleted ? 'bg-emerald-500' : 'bg-slate-300'}`} />
  </div>
);
// --- AKHIR STATUS STEP ---

const formatDate = (dateString) => {
  if (!dateString) return '-';
  try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return '-';
      return new Date(dateString).toLocaleDateString('id-ID', {
          day: '2-digit', month: 'long', year: 'numeric', timeZone: 'UTC'
      });
  } catch(e) { return '-' }
};

const formatTimestamp = (isoString) => {
  if (!isoString) return '-';
  try {
    const date = new Date(isoString);
    if (isNaN(date.getTime())) return '-';
    return date.toLocaleString('id-ID', {
      day: 'numeric', month: 'short', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
      timeZone: 'Asia/Jakarta'
    });
  } catch (e) {
    return '-';
  }
};
// ---

const LacakPengembalianPbf = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [data, setData] = useState(null);
  const [showProofModal, setShowProofModal] = useState(false);
  const [showSelesaiModal, setShowSelesaiModal] = useState(false); // Modal baru
  const [buktiFotoPbf, setBuktiFotoPbf] = useState(null); // File upload PBF
  const [isSubmitting, setIsSubmitting] = useState(false);
  const username = localStorage.getItem('username');

  useEffect(() => {
    const fetchPesananData = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const token = localStorage.getItem('token');
        if (!token) throw new Error('Silakan login terlebih dahulu');
        
        const response = await axios.get(`http://localhost:5000/api/pbf/pesanan-apotek/${id}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (response.data.success && response.data.data) {
          setData(response.data.data.pesanan); // Set hanya pesanan
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
  
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        toast.error('Ukuran file tidak boleh melebihi 5MB.');
        e.target.value = null;
        return;
      }
      if (!['image/jpeg', 'image/png'].includes(file.type)) {
        toast.error('Hanya file JPG atau PNG yang diizinkan.');
        e.target.value = null;
        return;
      }
      setBuktiFotoPbf(file);
    }
  };

  // --- FUNGSI BARU: Konfirmasi Selesai (PBF menerima barang retur) ---
  const handleConfirmSelesai = async () => {
    if (!buktiFotoPbf) {
      toast.error('Bukti foto penerimaan (oleh PBF) wajib diunggah.');
      return;
    }
    
    setIsSubmitting(true);
    toast.dismiss();
    const toastId = toast.loading('Menyelesaikan proses pengembalian...');
    
    const formData = new FormData();
    formData.append('buktiPenerimaanPbf', buktiFotoPbf); // Sesuaikan dengan nama field di backend

    try {
      const token = localStorage.getItem('token');
      if (!token) throw new Error('Sesi tidak valid.');

      // Panggil endpoint BARU
      const response = await axios.put(`http://localhost:5000/api/pbf/pengembalian/${id}/selesaikan`, formData, {
        headers: { 
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'multipart/form-data'
        },
      });

      if (!response.data.success) {
        throw new Error(response.data.message || 'Gagal menyelesaikan pengembalian.');
      }

      toast.success('Pengembalian berhasil diselesaikan.', { id: toastId });
      setShowSelesaiModal(false);
      // Refresh data
      setData(prev => ({...prev, status: 'Pengembalian Selesai'})); 
    
    } catch (err) {
      const errorMsg = err.response?.data?.message || err.message;
      setError(errorMsg);
      toast.error(errorMsg, { id: toastId });
      if (err.response?.status === 401) {
        navigate('/login/pbf');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleLogout = () => {
    localStorage.clear();
    navigate('/');
  };

  if (isLoading) {
     return (
       <div className="flex flex-col justify-center items-center h-screen bg-gradient-to-br from-slate-50 via-white to-emerald-50">
          <Loader2 className="animate-spin h-12 w-12 text-emerald-600" />
          <p className="mt-4 text-slate-700 font-medium">Memuat Pelacakan Pengembalian...</p>
      </div>
    );
  }

  if (error || !data) {
     return (
       <div className="flex min-h-screen bg-slate-50">
        <SidebarPbf isCollapsed={isCollapsed} setIsCollapsed={setIsCollapsed} />
        <div className={`flex-1 flex flex-col transition-all duration-300 ${isCollapsed ? 'ml-16' : 'ml-64'}`}>
          <NavbarPbf onLogout={handleLogout} username={username} />
          <main className="flex-1 flex items-center justify-center p-6 pt-[72px]">
            <div className="bg-white p-8 rounded-2xl shadow-lg border border-red-200 text-center max-w-md">
              <AlertTriangle className="mx-auto h-12 w-12 text-red-500 mb-4" />
              <h2 className="text-xl font-bold text-red-800 mb-2">Gagal Memuat Data</h2>
              <p className="text-red-600 mb-6">{error || 'Data tidak ditemukan.'}</p>
              <button
                 onClick={() => navigate('/pbf/tracking-pengiriman')}
                 className="flex items-center gap-2 px-4 py-2.5 border border-slate-300 text-slate-700 font-medium rounded-lg hover:bg-slate-100 transition mx-auto"
               >
                 <ArrowLeft size={18} />
                 Kembali ke Tracking
               </button>
            </div>
          </main>
        </div>
      </div>
    );
  }

  const pesanan = data; // Data sekarang langsung di 'data'
  
  const alasanPengajuan = pesanan.alasan_pengembalian || (pesanan.catatan_khusus ? pesanan.catatan_khusus.split('[PENGEMBALIAN DIAJUKAN]:')[1]?.split('[')[0]?.trim() : null) || 'Tidak ada alasan.';
  const alasanPenolakan = pesanan.alasan_penolakan_pengembalian || (pesanan.catatan_khusus ? pesanan.catatan_khusus.split('[PENOLAKAN PENGEMBALIAN]:')[1]?.trim() : null);

  // --- LOGIKA TIMELINE ---
  const steps = [
    { name: 'Pengajuan Dibuat', status: 'completed', icon: FileText, time: formatTimestamp(pesanan.updated_at) }, 
    { name: 'Dikonfirmasi PBF', status: 'pending', icon: HelpCircle, time: null },
    { name: 'Dikirim Balik Apotek', status: 'pending', icon: Truck, time: null },
    { name: 'Diterima PBF', status: 'pending', icon: Package, time: null }
  ];
  
  if (pesanan.status === 'Pengembalian Diajukan') {
    steps[1].status = 'current';
    steps[1].name = 'Menunggu Konfirmasi';
  } else if (pesanan.status === 'Pengembalian Disetujui') {
    steps[1].status = 'completed';
    steps[1].name = 'Disetujui PBF';
    steps[2].status = 'current';
    steps[2].name = 'Menunggu Apotek Kirim';
  } else if (pesanan.status === 'Dikembalikan') {
    steps[1].status = 'completed';
    steps[1].name = 'Disetujui PBF';
    steps[2].status = 'completed';
    steps[3].status = 'current';
    steps[3].name = 'Menunggu Penerimaan PBF';
  } else if (pesanan.status === 'Pengembalian Selesai') {
    steps.forEach(step => step.status = 'completed');
    steps[1].name = 'Disetujui PBF';
    steps[2].name = 'Barang Diterima PBF';
    steps[3].name = 'Pengembalian Selesai';
  } else if (pesanan.status === 'Pengembalian Ditolak') {
    steps[1].name = 'Pengajuan Ditolak';
    steps[1].status = 'rejected';
    steps[1].icon = XCircle;
    steps[2].status = 'hidden';
    steps[3].status = 'hidden';
  }
  // --- AKHIR LOGIKA TIMELINE ---

  return (
    <div className="flex min-h-screen bg-slate-50">
      <SidebarPbf isCollapsed={isCollapsed} setIsCollapsed={setIsCollapsed} />
      <div className={`flex-1 flex flex-col transition-all duration-300 ${isCollapsed ? 'ml-16' : 'ml-64'}`}>
        <NavbarPbf onLogout={handleLogout} username={username} />

        <main className="flex-1 overflow-auto pt-[72px] px-4 sm:px-6 lg:px-8 py-8">
          <div className="max-w-4xl mx-auto">
            
            <div className="mb-10 relative">
              <div className="absolute -top-20 -left-20 w-72 h-72 bg-indigo-200 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob"></div>
              <div className="absolute -top-20 -right-20 w-72 h-72 bg-purple-200 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000"></div>

              <div className="relative">
                <button
                  onClick={() => navigate('/pbf/tracking-pengiriman/pengembalian')}
                  className="mb-4 inline-flex items-center text-emerald-600 hover:text-emerald-700 transition-colors text-sm font-medium"
                >
                  <ArrowLeft size={16} className="mr-1" /> Kembali ke Daftar Pengembalian
                </button>
                <div className="flex items-center gap-3">
                  <div className="flex items-center justify-center w-12 h-12 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl shadow-lg">
                    <Undo2 className="text-white" size={24} />
                  </div>
                  <div>
                    <h1 className="text-4xl font-bold bg-gradient-to-r from-slate-900 via-indigo-900 to-purple-900 bg-clip-text text-transparent">
                      Lacak Pengembalian
                    </h1>
                    <p className="text-slate-600 text-lg mt-1">Pesanan ID: <span className="font-medium text-slate-700 font-mono">#{String(id).padStart(6, '0')}</span></p>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="space-y-6 relative z-10">
            
              <div className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden">
                <div className="bg-slate-50 px-6 py-4 border-b border-slate-200">
                  <h2 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
                    <Truck size={20} /> Status Pengembalian
                  </h2>
                </div>
                <div className="p-8 py-12">
                  <div className="flex items-start justify-center gap-0">
                    {steps.map((step, index) => (
                      step.status !== 'hidden' && (
                        <React.Fragment key={step.name}>
                          {index > 0 && <StatusLine isCompleted={step.status === 'completed' || step.status === 'current' || step.status === 'rejected'} />}
                          <StatusStep
                            icon={step.icon}
                            label={step.name}
                            timestamp={step.time}
                            isCompleted={step.status === 'completed'}
                            isCurrent={step.status === 'current'}
                            isRejected={step.status === 'rejected'}
                          />
                        </React.Fragment>
                      )
                    ))}
                  </div>
                </div>
              </div>

              {pesanan.status === 'Pengembalian Ditolak' && alasanPenolakan && (
                <div className="bg-white rounded-lg shadow-sm border border-red-200 overflow-hidden">
                   <div className="bg-red-50 px-6 py-4 border-b border-red-200">
                    <h2 className="text-lg font-semibold text-red-800 flex items-center gap-2">
                      <XCircle size={20} /> Alasan Penolakan
                    </h2>
                  </div>
                  <div className="p-6">
                    <p className="text-slate-700 italic">"{alasanPenolakan}"</p>
                  </div>
                </div>
              )}

              <div className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden">
                <div className="bg-slate-50 px-6 py-4 border-b border-slate-200">
                  <h2 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
                    <Info size={20} /> Detail Pengajuan dari Apotek
                  </h2>
                </div>
                <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-1">
                     <span className="text-sm font-medium text-slate-500">Alasan Pengajuan</span>
                     <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 min-h-[100px]">
                       <p className="text-sm font-semibold text-slate-900 whitespace-pre-wrap">{alasanPengajuan}</p>
                     </div>
                  </div>
                  <div className="space-y-1">
                     <span className="text-sm font-medium text-slate-500">Bukti Foto Apotek</span>
                     {pesanan.bukti_foto_pengembalian ? (
                       <button 
                         onClick={() => setShowProofModal(true)}
                         className="bg-slate-50 p-2 rounded-lg border border-slate-200 w-full max-w-xs hover:border-emerald-400 transition-colors"
                       >
                         <img
                            src={`http://localhost:5000/${pesanan.bukti_foto_pengembalian.replace(/\\/g, '/')}`}
                            alt="Bukti Pengembalian"
                            className="w-full h-auto object-contain rounded-md max-h-40"
                         />
                       </button>
                     ) : (
                       <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 text-slate-500 flex items-center justify-center gap-2 text-sm h-[100px]">
                          <ImageIcon size={18} className="flex-shrink-0"/>
                          <span>Tidak ada bukti foto.</span>
                       </div>
                    )}
                  </div>
                </div>
              </div>

              {/* --- KARTU AKSI BARU UNTUK PBF --- */}
              {pesanan.status === 'Dikembalikan' && (
                 <div className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden">
                   <div className="bg-slate-50 px-6 py-4 border-b border-slate-200">
                      <h2 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
                        <CheckCircle size={20} /> Konfirmasi Penerimaan Barang Retur
                      </h2>
                    </div>
                    <div className="p-6 space-y-4">
                      <p className="text-sm text-slate-600">
                        Apotek telah mengirimkan barang retur. Harap konfirmasi jika Anda sudah menerimanya dalam kondisi baik.
                      </p>
                      
                      {/* Form Upload Bukti PBF */}
                      <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-2">Unggah Bukti Penerimaan (PBF)*</label>
                        <label htmlFor="buktiFotoPbf" className="relative flex flex-col items-center justify-center w-full min-h-[150px] bg-slate-50 border-2 border-dashed border-slate-300 rounded-lg cursor-pointer hover:border-emerald-500 transition-colors group p-4">
                          {previewUrl ? (
                            <img src={previewUrl} alt="Preview" className="w-auto h-auto max-h-48 object-contain rounded-lg" />
                          ) : (
                            <div className="text-center text-slate-500 group-hover:text-emerald-600 transition-colors">
                              <Upload size={32} className="mx-auto" />
                              <p className="text-sm mt-2 font-medium">Klik untuk mengunggah gambar</p>
                              <p className="text-xs text-slate-400 mt-1">JPG/PNG, Max 5MB</p>
                            </div>
                          )}
                          <input id="buktiFotoPbf" type="file" accept="image/jpeg,image/png" onChange={handleFileChange} className="hidden" />
                        </label>
                        {buktiFotoPbf && <p className="text-xs text-slate-500 mt-2 truncate">File terpilih: {buktiFotoPbf.name}</p>}
                      </div>
                      
                      <div className="flex justify-end pt-4">
                        <button
                          onClick={() => setShowSelesaiModal(true)}
                          disabled={!buktiFotoPbf || isSubmitting}
                          className="w-full sm:w-auto px-6 py-2.5 bg-emerald-600 text-white font-medium rounded-lg hover:bg-emerald-700 transition disabled:bg-slate-400 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                        >
                          {isSubmitting ? <Loader2 className="animate-spin" size={18} /> : <CheckCircle2 size={18} />}
                          Selesaikan Pengembalian
                        </button>
                      </div>
                    </div>
                 </div>
              )}
              
            </div>
          </div>
        </main>
      </div>

      <ProofModal 
        isOpen={showProofModal} 
        onClose={() => setShowProofModal(false)} 
        imageUrl={pesanan.bukti_foto_pengembalian}
        title="Bukti Pengajuan dari Apotek"
      />
      
      <SelesaiModal
        show={showSelesaiModal}
        onClose={() => setShowSelesaiModal(false)}
        onConfirm={handleConfirmSelesai}
        isSubmitting={isSubmitting}
        orderId={pesanan.nomor_pesanan}
        onFileChange={handleFileChange}
        buktiFoto={buktiFotoPbf}
      />
      
       <style jsx global>{`
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

export default LacakPengembalianPbf;