import React, { useState, useEffect, useRef } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import NavbarApotek from '../../../components/NavbarApotek';
import {
  ArrowLeft,
  Camera,
  Package,
  Truck,
  Loader2,
  Download,
  X,
  FileText,
  AlertTriangle,
  CheckCircle2,
  Info,
} from 'lucide-react';
import axios from 'axios';
import html2pdf from 'html2pdf.js';
import { toast } from 'react-hot-toast';

// --- MODAL KONFIRMASI (Desain disesuaikan) ---
const ConfirmationModal = ({ show, onClose, onConfirm, isSubmitting, orderId, onFileChange, buktiFoto }) => {
  if (!show) return null;

  return (
    <div className="fixed inset-0 z-[100] flex justify-center items-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in-0" onClick={onClose}>
      <div 
        className="bg-white p-6 rounded-2xl shadow-xl max-w-sm w-full border border-slate-200 animate-in fade-in-0 zoom-in-95 duration-300"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center pb-3 border-b border-slate-200">
          <h3 className="text-lg font-semibold text-slate-800">Konfirmasi Penerimaan</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-colors rounded-full p-1">
            <X size={20} />
          </button>
        </div>
        <div className="text-center pt-5">
          <CheckCircle2 size={48} className="text-emerald-500 mx-auto mb-4" />
          <p className="text-slate-600 mb-5 text-sm">
            Anda akan mengkonfirmasi penerimaan pesanan:<br />
            <strong className="text-base text-slate-800 font-mono">{orderId}</strong>
          </p>

          <div className="mb-6">
            <label htmlFor="buktiFoto" className="relative flex flex-col items-center justify-center w-full h-32 bg-slate-50 border-2 border-dashed border-slate-300 rounded-lg cursor-pointer hover:border-emerald-500 transition-colors group p-4">
              {buktiFoto ? (
                <img src={URL.createObjectURL(buktiFoto)} alt="Preview" className="w-full h-full object-contain rounded-lg" />
              ) : (
                <div className="text-center text-slate-500 group-hover:text-emerald-600 transition-colors">
                  <Camera size={24} className="mx-auto" />
                  <p className="text-xs mt-2 font-medium">Unggah Bukti Foto Penerimaan*</p>
                  <p className="text-xs text-slate-400 mt-1">JPG/PNG, Max 5MB</p>
                </div>
              )}
              <input id="buktiFoto" type="file" accept="image/jpeg,image/png" onChange={onFileChange} className="hidden" />
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
              {isSubmitting ? 'Memproses...' : 'Ya, Konfirmasi'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// --- STATUS STEP (Desain Horizontal) ---
const StatusStep = ({ icon: Icon, label, timestamp, isCompleted, isCurrent }) => (
  <div className="relative flex flex-col items-center justify-start text-center w-32 md:w-40">
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
    </div>
  </div>
);

const StatusLine = ({ isCompleted }) => (
  <div className="relative flex items-center h-14 w-16 md:w-24">
    <div className={`w-full h-1.5 rounded-full ${isCompleted ? 'bg-emerald-500' : 'bg-slate-300'}`} />
  </div>
);
// --- AKHIR STATUS STEP ---

const KonfirmasiPenerimaanApotek = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [pesanan, setPesanan] = useState(null);
  const [buktiFoto, setBuktiFoto] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const contentRef = useRef(null);
  const username = localStorage.getItem('username');

  // --- FETCH DATA ---
  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      setError(null);
      let token;
      try {
        token = localStorage.getItem('token');
        if (!token) throw new Error('Silakan login terlebih dahulu');

        const response = await axios.get(`http://localhost:5000/api/apotek/pesanan/${id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (response.data.success && response.data.data) {
          if (response.data.data.pesanan?.status !== 'Dikirim') {
            setError(`Pesanan ini berstatus "${response.data.data.pesanan?.status || 'Tidak Diketahui'}". Hanya pesanan "Dikirim" yang dapat dikonfirmasi.`);
            toast.error(`Pesanan ini berstatus "${response.data.data.pesanan?.status}".`, { duration: 4000 });
          }
          setPesanan(response.data.data);
        } else {
          throw new Error(response.data.message || 'Data pesanan tidak ditemukan.');
        }
      } catch (err) {
        const errorMsg = err.response?.data?.message || err.message;
        setError(errorMsg); 
        toast.error(errorMsg || 'Gagal memuat data.');
        if (err.message.includes('login') || err.response?.status === 401) navigate('/login/apotek');
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, [id, navigate]);

  // --- HANDLER ---
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

  const handleOpenConfirmModal = () => {
     if (pesanan?.pesanan?.status !== 'Dikirim') {
         toast.error("Tidak dapat mengkonfirmasi pesanan yang belum dikirim.");
         return;
     }
     setShowConfirmModal(true);
  };
  
  const handleCloseConfirmModal = () => {
    setShowConfirmModal(false);
    if(!isSubmitting) setBuktiFoto(null); 
  };

  const handleConfirm = async () => {
    if (!buktiFoto) {
      toast.error('Bukti foto wajib diunggah.');
      return;
    }
    setIsSubmitting(true);
    setError(null);
    const toastId = toast.loading('Memproses konfirmasi...');

    const formData = new FormData();
    formData.append('buktiFoto', buktiFoto);

    try {
      const token = localStorage.getItem('token');
      const response = await axios.put(
        `http://localhost:5000/api/apotek/penerimaan/konfirmasi/${id}`,
        formData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'multipart/form-data',
          },
        }
      );

      if (response.data.success) {
        toast.success('Penerimaan berhasil dikonfirmasi!', { id: toastId });
        navigate('/apotek/pesan-obat/selesai'); 
      } else {
        throw new Error(response.data.message || 'Gagal konfirmasi');
      }
    } catch (err) {
      const errorMsg = err.response?.data?.message || err.message;
      setError(errorMsg);
      toast.error(`Gagal konfirmasi: ${errorMsg}`, { id: toastId });
      if (err.response?.status === 401) {
        toast.error('Sesi Anda telah berakhir. Mengarahkan ke login...');
        setTimeout(() => navigate('/login/apotek'), 2000);
      }
    } finally {
      setIsSubmitting(false);
      setShowConfirmModal(false); 
    }
  };
  
  const handleDownloadPDF = () => {
    const element = contentRef.current;
    if (!element || !pesanan?.pesanan?.nomor_pesanan) {
        toast.error("Data belum siap untuk diunduh.");
        return;
    }
    const opt = {
        margin: [10, 5, 10, 5],
        filename: `bukti_penerimaan_${pesanan.pesanan.nomor_pesanan}.pdf`,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2, useCORS: true, logging: false, dpi: 192, letterRendering: true },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
    };
    
    toast.promise(
        html2pdf().from(element).set(opt).save(),
        {
           loading: 'Membuat PDF...',
           success: 'PDF berhasil diunduh!',
           error: 'Gagal membuat PDF.'
        }
    );
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return 'N/A';
      return date.toLocaleDateString('id-ID', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
        timeZone: 'UTC'
      });
    } catch (e) {
      return 'N/A';
    }
  };

  const formatTimestamp = (dateString) => {
    if (!dateString) return null;
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return null;
      return date.toLocaleString('id-ID', {
        day: 'numeric', month: 'short', year: 'numeric',
        hour: '2-digit', minute: '2-digit',
        timeZone: 'Asia/Jakarta'
      });
    } catch (e) {
      return null;
    }
  };

  const handleLogout = () => {
    localStorage.clear();
    navigate('/');
  };

  // --- LOADING STATE ---
  if (isLoading) {
    return (
      <div className="flex flex-col justify-center items-center h-screen bg-gradient-to-br from-slate-50 via-white to-emerald-50">
        <div className="relative">
          <Loader2 className="animate-spin h-12 w-12 text-emerald-600" />
          <div className="absolute inset-0 h-12 w-12 rounded-full border-4 border-emerald-200 animate-ping opacity-20"></div>
        </div>
        <p className="mt-4 text-slate-700 font-medium">Memuat Konfirmasi Penerimaan...</p>
      </div>
    );
  }

  // --- ERROR STATE (JIKA PESANAN GAGAL LOAD) ---
  if (error && !pesanan) {
    return (
      <div className="flex min-h-screen bg-slate-50">
        <div className="flex-1 flex flex-col">
          <NavbarApotek onLogout={handleLogout} username={username} />
          <main className="flex-1 flex items-center justify-center p-6 pt-[72px]">
            <div className="bg-white p-8 rounded-2xl shadow-lg border border-red-200 text-center max-w-lg">
              <AlertTriangle className="mx-auto h-12 w-12 text-red-500 mb-4" />
              <h2 className="text-xl font-bold text-red-800 mb-2">Gagal Memuat Data</h2>
              <p className="text-red-600 mb-6">{error}</p>
              <button onClick={() => navigate('/apotek/pesan-obat')} className="flex items-center gap-2 px-4 py-2.5 border border-slate-300 text-slate-700 font-medium rounded-lg hover:bg-slate-100 transition mx-auto">
                <ArrowLeft size={18} /> Kembali ke Pesanan
              </button>
            </div>
          </main>
        </div>
      </div>
    );
  }
  
  if (!pesanan || !pesanan.pesanan) {
       return (
          <div className="flex min-h-screen bg-slate-50">
            <div className="flex-1 flex flex-col">
              <NavbarApotek onLogout={handleLogout} username={username} />
              <main className="flex-1 flex items-center justify-center p-6 pt-[72px]">
                <div className="bg-white p-8 rounded-2xl shadow-lg border border-slate-200 text-center max-w-lg">
                  <FileText className="mx-auto h-12 w-12 text-yellow-500 mb-4" />
                  <h2 className="text-xl font-bold text-slate-800 mb-2">Data Tidak Ditemukan</h2>
                  <p className="text-slate-600 mb-6">Tidak dapat menemukan detail pesanan.</p>
                  <button onClick={() => navigate('/apotek/pesan-obat')} className="flex items-center gap-2 px-4 py-2.5 border border-slate-300 text-slate-700 font-medium rounded-lg hover:bg-slate-100 transition mx-auto">
                    <ArrowLeft size={18} /> Kembali ke Pesanan
                  </button>
                </div>
              </main>
            </div>
          </div>
        );
  }

  const { pesanan: info, detail_pesanan: detail } = pesanan;
  
  // --- PERBAIKAN: Ambil total harga dari 'info' (objek pesanan utama) ---
  const totalHargaKeseluruhan = info.total_harga || 0;
  // --- AKHIR PERBAIKAN ---

  const isDipersiapkanCompleted = true;
  const isDikirimCompleted = ['Dikirim', 'Selesai'].includes(info.status);
  const isSelesaiCompleted = info.status === 'Selesai';
  const currentStatusStep = isSelesaiCompleted ? 'Selesai' : (isDikirimCompleted ? 'Dikirim' : 'Dipersiapkan');

  const getTimestamp = (status) => {
    if (status === 'Dipersiapkan' && info.tanggal_pesanan) return formatTimestamp(info.tanggal_pesanan);
    if (status === 'Dikirim' && info.tanggal_pengiriman) return formatTimestamp(info.tanggal_pengiriman);
    if (status === 'Selesai' && info.updated_at) return formatTimestamp(info.updated_at);
    return null;
  };

  return (
    <div className="flex min-h-screen bg-slate-50">
      <div className="flex-1 flex flex-col">
        <NavbarApotek onLogout={handleLogout} username={username} />

        <main className="flex-1 overflow-auto pt-[72px] px-4 sm:px-6 lg:px-8 py-8">
          <div className="max-w-5xl mx-auto">
            <div className="print:hidden flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
              <button onClick={() => navigate('/apotek/pesan-obat')} className="inline-flex items-center text-emerald-600 hover:text-emerald-700 transition-colors text-sm font-medium">
                <ArrowLeft size={16} className="mr-1" /> Kembali ke Daftar Pesanan
              </button>
              <button onClick={handleDownloadPDF} className="inline-flex items-center px-4 py-2 bg-slate-700 text-white font-medium rounded-lg hover:bg-slate-800 transition text-sm">
                <Download className="w-4 h-4 mr-2" /> Unduh PDF
              </button>
            </div>

            <div className="mb-10 relative">
              <div className="absolute -top-20 -left-20 w-72 h-72 bg-emerald-200 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob"></div>
              <div className="absolute -top-20 -right-20 w-72 h-72 bg-teal-200 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000"></div>
              <div className="relative flex items-center gap-3">
                <div className="flex items-center justify-center w-12 h-12 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl shadow-lg">
                  <CheckCircle2 className="text-white" size={24} />
                </div>
                <div>
                  <h1 className="text-4xl font-bold bg-gradient-to-r from-slate-900 via-emerald-900 to-teal-900 bg-clip-text text-transparent">
                    Konfirmasi Penerimaan
                  </h1>
                  <p className="text-slate-600 text-lg mt-1">Nomor Pesanan: <span className="font-medium text-slate-700 font-mono">{info.nomor_pesanan}</span></p>
                </div>
              </div>
            </div>

            {error && (
              <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg flex items-center gap-2 text-sm">
                <AlertTriangle size={20} />
                <span>{error}</span>
              </div>
            )}

            {/* --- Layout Vertikal (space-y-6) --- */}
            <div className="space-y-6">
              
              {/* Kartu Detail */}
              <div ref={contentRef} className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden">
                <section className="p-6">
                  <h3 className="text-lg font-bold text-slate-900 mb-6 flex items-center gap-2">
                    <Package size={20} className="text-emerald-600" />
                    Detail Pengiriman
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-1">
                      <span className="text-sm font-medium text-slate-500">Dikirim Dari (PBF)</span>
                      <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
                        <span className="font-semibold text-slate-900 text-base">{info.nama_pbf}</span>
                        <p className="text-sm text-slate-600">{info.alamat_pbf}</p>
                      </div>
                    </div>
                    <div className="space-y-1">
                      <span className="text-sm font-medium text-slate-500">Diterima Oleh (Apotek)</span>
                      <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
                        <span className="font-semibold text-slate-900 text-base">{info.nama_apotek}</span>
                        <p className="text-sm text-slate-600">{info.alamat_apotek}</p>
                      </div>
                    </div>
                    <div className="space-y-1">
                      <span className="text-sm font-medium text-slate-500">Tanggal Pesan</span>
                      <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
                        <span className="font-medium text-slate-700">{formatDate(info.tanggal_pesanan)}</span>
                      </div>
                    </div>
                    
                    {/* --- PERBAIKAN DATA: Tampilkan data dari 'info' --- */}
                    <div className="space-y-1">
                      <span className="text-sm font-medium text-slate-500">Tanggal Kirim</span>
                      <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
                        <span className="font-medium text-slate-700">{formatDate(info.tanggal_pengiriman) || 'Belum dikirim'}</span>
                      </div>
                    </div>
                    <div className="space-y-1">
                      <span className="text-sm font-medium text-slate-500">No. Surat Jalan</span>
                      <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
                        <span className="font-medium text-slate-700 font-mono">{info.nomor_surat_jalan || '-'}</span>
                      </div>
                    </div>
                    <div className="space-y-1">
                      <span className="text-sm font-medium text-slate-500">No. Resi</span>
                      <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
                        <span className="font-medium text-slate-700 font-mono">{info.nomor_resi || '-'}</span>
                      </div>
                    </div>
                    {/* --- AKHIR PERBAIKAN DATA --- */}
                  </div>
                </section>

                <section className="p-6 border-t border-slate-200">
                  <h3 className="text-lg font-bold text-slate-900 mb-6 flex items-center gap-2">
                    <FileText size={20} className="text-emerald-600" />
                    Detail Barang Diterima
                  </h3>
                  <div className="overflow-x-auto border border-slate-200 rounded-lg">
                    <table className="w-full text-sm">
                      <thead className="bg-slate-50 text-slate-700">
                        <tr>
                          <th className="px-4 py-3 text-left font-semibold border-b border-slate-200">No.</th>
                          <th className="px-4 py-3 text-left font-semibold border-b border-slate-200">Nama Obat</th>
                          <th className="px-4 py-3 text-left font-semibold border-b border-slate-200">Batch ID</th>
                          <th className="px-4 py-3 text-center font-semibold border-b border-slate-200">Jumlah</th>
                          <th className="px-4 py-3 text-right font-semibold border-b border-slate-200">Total Harga</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {detail && detail.length > 0 ? (
                          detail.map((item, index) => (
                            <tr key={item.id || index} className="hover:bg-slate-50">
                              <td className="px-4 py-3">{index + 1}</td>
                              <td className="px-4 py-3 font-medium text-slate-800">{item.nama_obat}</td>
                              <td className="px-4 py-3 font-mono text-slate-600">{item.id_aset_blockchain || item.batch_id || '-'}</td>
                              {/* --- PERBAIKAN: Gunakan 'item.jumlah_pesanan' --- */}
                              <td className="px-4 py-3 text-center font-medium text-emerald-700">{(item.jumlah_pesanan || 0).toLocaleString('id-ID')} {item.satuan || 'Box'}</td>
                             <td className="px-4 py-3 text-right font-semibold text-slate-800">
                                Rp {Number(item.total_harga || 0).toLocaleString('id-ID', { minimumFractionDigits: 2 })}
                              </td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td colSpan="5" className="text-center py-6 text-slate-500 border-t border-slate-200">
                              Tidak ada detail barang.
                            </td>
                          </tr>
                        )}
                      </tbody>
                      <tfoot className="bg-slate-50 font-semibold">
                        <tr>
                          <td colSpan="4" className="px-4 py-3 text-right text-slate-800">Total Keseluruhan</td>
                    
                         <td className="px-4 py-3 text-right text-xl text-emerald-700">
                            Rp {Number(info.total_harga || 0).toLocaleString('id-ID', { minimumFractionDigits: 2 })}
                          </td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                </section>
              </div>

              {/* Kartu Status */}
              <div className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden">
                <div className="p-8 py-12">
                  <h3 className="text-lg font-bold text-slate-900 mb-8 text-center">Status Pengiriman</h3>
                  <div className="flex items-start justify-center gap-0">
                    <StatusStep icon={Package} label="Dipersiapkan" timestamp={getTimestamp('Dipersiapkan')} isCompleted={isDipersiapkanCompleted} isCurrent={currentStatusStep === 'Dipersiapkan'} />
                    <StatusLine isCompleted={isDikirimCompleted} />
                    <StatusStep icon={Truck} label="Dikirim" timestamp={getTimestamp('Dikirim')} isCompleted={isDikirimCompleted} isCurrent={currentStatusStep === 'Dikirim'} />
                    <StatusLine isCompleted={isSelesaiCompleted} />
                    <StatusStep icon={CheckCircle2} label="Diterima" timestamp={getTimestamp('Selesai')} isCompleted={isSelesaiCompleted} isCurrent={currentStatusStep === 'Selesai'} />
                  </div>
                </div>
              </div>
            
              {/* Kartu Aksi */}
              <div className="space-y-6">
                <div className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden">
                  <div className="p-6">
                    <h3 className="text-lg font-semibold text-slate-900 mb-4">Aksi Penerimaan</h3>
                    {info.status === 'Dikirim' && !error && (
                      <>
                        <p className="text-sm text-slate-600 mb-4">
                          Pastikan Anda telah menerima barang sesuai pesanan sebelum mengkonfirmasi.
                        </p>
                        <button 
                          onClick={handleOpenConfirmModal} 
                          className="w-full py-3 px-6 bg-emerald-600 text-white font-medium rounded-lg hover:bg-emerald-700 flex items-center justify-center gap-2 transition shadow-md" 
                          disabled={isSubmitting}
                        >
                          <CheckCircle2 size={18} /> Konfirmasi Penerimaan
                        </button>
                        {/* --- PERBAIKAN: Tombol 'Ajukan Pengembalian' ditambahkan --- */}
                        <Link to={`/apotek/pesanan/${id}/ajukan-pengembalian`} className="mt-3 w-full py-3 px-6 bg-red-100 text-red-700 font-medium rounded-lg hover:bg-red-200 border border-red-200 transition text-center text-sm flex items-center justify-center gap-2">
                          <AlertTriangle size={18} /> Ajukan Pengembalian
                        </Link>
                      </>
                    )}
                    
                    {info.status === 'Selesai' && (
                      <div className="inline-flex w-full items-center justify-center px-4 py-2 bg-emerald-100 text-emerald-800 text-sm font-semibold rounded-full border border-emerald-200">
                        <CheckCircle2 size={16} className="mr-1.5"/> Pesanan Telah Dikonfirmasi
                      </div>
                    )}
                    
                    {info.status !== 'Dikirim' && info.status !== 'Selesai' && (
                      <div className="inline-flex w-full items-center justify-center px-4 py-2 bg-slate-100 text-slate-500 text-sm font-semibold rounded-full border border-slate-200">
                        Status Saat Ini: {info.status}
                      </div>
                    )}
                  </div>
                </div>

                <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6">
                   <h3 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
                     <Info size={18} className="text-blue-600" />
                     Informasi
                   </h3>
                   <p className="text-sm text-slate-600">
                     Mengkonfirmasi penerimaan akan memperbarui status aset di blockchain dan memindahkan stok ke inventaris Anda.
                   </p>
                </div>
              </div>
            </div>
          </div>
        </main>

        <ConfirmationModal 
          show={showConfirmModal} 
          onClose={handleCloseConfirmModal} 
          onConfirm={handleConfirm} 
          isSubmitting={isSubmitting} 
          orderId={info.nomor_pesanan} 
          onFileChange={handleFileChange} 
          buktiFoto={buktiFoto} 
        />
      </div>
      
       <style jsx global>{`
        /* Style untuk menyembunyikan panah default dropdown */
        select.appearance-none {
          -webkit-appearance: none;
          -moz-appearance: none;
          appearance: none;
        }
        
        .react-datepicker-wrapper {
          width: 100%;
        }
        .react-datepicker__input-container input {
          width: 100%;
          padding: 0.625rem 1rem;
          border: 1px solid #cbd5e1;
          border-radius: 0.5rem;
          transition: all 0.2s;
        }
        .react-datepicker__input-container input:focus {
          outline: none;
          border-color: transparent;
          box-shadow: 0 0 0 2px #34d399;
        }

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

export default KonfirmasiPenerimaanApotek;