import React, { useState, useEffect, useRef } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import SidebarPbf from '../../../components/SidebarPbf';
import NavbarPbf from '../../../components/NavbarPbf';
import {
  ArrowLeft,
  Camera,
  CheckCircle,
  Package,
  Truck,
  Loader2,
  Download,
  X,
  FileText,
  AlertTriangle,
  CheckCircle2, // Ensure CheckCircle2 is imported
  Info,
  Calendar,
  Clock,
  ClipboardCopy
} from 'lucide-react';
import html2pdf from 'html2pdf.js';
import axios from 'axios';
import { toast } from 'react-hot-toast';

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
          <h3 className="text-lg font-semibold text-slate-800">Konfirmasi Penerimaan</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-colors rounded-full p-1">
            <X size={20} />
          </button>
        </div>
        <div className="text-center pt-5">
          <CheckCircle2 size={48} className="text-emerald-500 mx-auto mb-4" />
          <p className="text-slate-600 mb-5 text-sm">
            Anda akan mengkonfirmasi penerimaan pesanan ID: <br />
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

const StatusStep = ({ icon: Icon, label, timestamp, isCompleted, isCurrent, isLast = false }) => (
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
      <div className="pt-2.5">
        <p className={`font-semibold ${
          isCurrent ? 'text-emerald-700' :
          isCompleted ? 'text-slate-800' :
          'text-slate-500'
        }`}>{label}</p>
        {timestamp && <p className="text-sm text-slate-500 mt-0.5">{timestamp}</p>}
      </div>
    </div>
  );

const KonfirmasiPenerimaan = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [pesanan, setPesanan] = useState(null);
  const [buktiFoto, setBuktiFoto] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const contentRef = useRef(null);
  const username = localStorage.getItem('username');

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      setError(null);
      let token;
      try {
        token = localStorage.getItem('token');
        if (!token) throw new Error('Silakan login terlebih dahulu');

        const response = await axios.get(`http://localhost:5000/api/pbf/pesanan/${id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (response.data.success && response.data.data) {
           if (response.data.data.pesanan?.status !== 'Dikirim') {
                setError(`Pesanan ini berstatus "${response.data.data.pesanan?.status || 'Tidak Diketahui'}". Hanya pesanan berstatus "Dikirim" yang dapat dikonfirmasi penerimaannya.`);
           }
          setPesanan(response.data.data);
        } else {
          throw new Error(response.data.message || 'Data pesanan tidak ditemukan atau format salah.');
        }
      } catch (err) {
        setError(err.response?.data?.message || err.message);
        toast.error(err.response?.data?.message || err.message || 'Gagal memuat data.');
        if ((err.message.includes('401') || err.message.includes('403') || err.message.includes('login')) && token) {
            navigate('/login/pbf');
        } else if (!token) {
             navigate('/login/pbf');
        }
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
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

  const handleOpenConfirmModal = () => setShowConfirmModal(true);
  const handleCloseConfirmModal = () => {
    setShowConfirmModal(false);
    setBuktiFoto(null);
  };

  const handleConfirm = async () => {
    if (!buktiFoto) {
      toast.error('Bukti foto wajib diunggah sebelum konfirmasi.');
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

      const response = await axios.put(
        `http://localhost:5000/api/pbf/penerimaan/${id}/konfirmasi`,
        formData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'multipart/form-data',
          },
        }
      );

      if (response.data.success) {
        toast.success('Pesanan berhasil dikonfirmasi dan diarsipkan.');
        navigate('/pbf/pesan-obat');
      } else {
        throw new Error(response.data.message || 'Gagal mengkonfirmasi pesanan.');
      }
    } catch (err) {
      console.error('Error in handleConfirm:', err);
      const errorMsg = err.response?.data?.message || err.message || 'Gagal mengkonfirmasi pesanan.';
      setError(errorMsg);
      toast.error(errorMsg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDownloadPDF = () => {
    const element = contentRef.current;
     if (!element || !pesanan?.pesanan?.nomor_po) {
        toast.error("Data belum siap untuk diunduh.");
        return;
    }
    const opt = {
        margin:       [10, 5, 10, 5],
        filename:     `konfirmasi_penerimaan_${pesanan.pesanan.nomor_po}.pdf`,
        image:        { type: 'jpeg', quality: 0.98 },
        html2canvas:  { scale: 2, useCORS: true, logging: true, dpi: 192, letterRendering: true },
        jsPDF:        { unit: 'mm', format: 'a4', orientation: 'portrait' }
    };
    html2pdf().from(element).set(opt).save();
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
          <p className="mt-4 text-slate-700 font-medium">Memuat Konfirmasi Penerimaan...</p>
      </div>
    );
  }

  if (error && !pesanan) {
     return (
       <div className="flex flex-col justify-center items-center h-screen bg-gradient-to-br from-slate-50 via-white to-red-50 p-6">
          <div className="bg-white p-8 rounded-xl shadow-lg border border-red-200 text-center max-w-lg">
            <AlertTriangle className="mx-auto h-12 w-12 text-red-500 mb-4" />
            <h2 className="text-xl font-bold text-red-800 mb-2">Gagal Memuat Data</h2>
            <p className="text-red-600 mb-6">{error}</p>
            <button
               onClick={() => navigate('/pbf/pesan-obat')}
               className="flex items-center gap-2 px-4 py-2.5 border border-slate-300 text-slate-700 font-medium rounded-lg hover:bg-slate-100 transition mx-auto"
             >
               <ArrowLeft size={18} />
               Kembali ke Pesanan
             </button>
          </div>
       </div>
    );
  }

  if (!pesanan || !pesanan.pesanan) {
     return (
       <div className="flex flex-col justify-center items-center h-screen bg-slate-50 p-6">
        <div className="bg-white p-8 rounded-xl shadow-lg border border-slate-200 text-center max-w-lg">
          <FileText className="mx-auto h-12 w-12 text-yellow-500 mb-4" />
          <h2 className="text-xl font-bold text-slate-800 mb-2">Data Pesanan Tidak Ditemukan</h2>
          <p className="text-slate-600 mb-6">Tidak dapat menemukan detail untuk konfirmasi penerimaan ini.</p>
           <button
             onClick={() => navigate('/pbf/pesan-obat')}
             className="flex items-center gap-2 px-4 py-2.5 border border-slate-300 text-slate-700 font-medium rounded-lg hover:bg-slate-100 transition mx-auto"
           >
             <ArrowLeft size={18} />
             Kembali ke Pesanan
           </button>
        </div>
      </div>
    );
  }

  const { pesanan: info, detail_pesanan: detail } = pesanan;
  const totalHargaKeseluruhan = detail ? detail.reduce((acc, item) => acc + (Number(item.total_harga) || 0), 0) : (info.total_harga || 0);

  const isDipersiapkanCompleted = info.status !== 'Menunggu Konfirmasi';
  const isDikirimCompleted = info.status === 'Dikirim' || info.status === 'Selesai';
  const isSelesaiCompleted = info.status === 'Selesai';
  const currentStatusStep = isSelesaiCompleted ? 'Selesai' : (isDikirimCompleted ? 'Dikirim' : 'Dipersiapkan');
  const tanggalPengiriman = info.tanggal_pengiriman ? new Date(info.tanggal_pengiriman) : null;
  const estimasiSampai = isSelesaiCompleted ? (info.updated_at ? new Date(info.updated_at) : null) : null;

   const getTimestamp = (status) => {
      if (status === 'Dipersiapkan' && info.tanggal_pesanan) return formatDate(info.tanggal_pesanan, true);
      if (status === 'Dikirim' && tanggalPengiriman) return formatDate(tanggalPengiriman, true);
      if (status === 'Selesai' && estimasiSampai) return formatDate(estimasiSampai, true);
      return null;
  };


  return (
    <div className="flex min-h-screen bg-slate-50">
      <SidebarPbf isCollapsed={isCollapsed} setIsCollapsed={setIsCollapsed} />
      <div className={`flex-1 flex flex-col transition-all duration-300 ${isCollapsed ? 'ml-16' : 'ml-64'}`}>
        <NavbarPbf onLogout={() => { localStorage.clear(); navigate('/'); }} username={username} />

        <main className="flex-1 overflow-auto pt-[72px]">
          <div className="max-w-4xl mx-auto px-6 py-8">
            <div className="print:hidden flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
              <button
                 onClick={() => navigate('/pbf/pesan-obat')}
                 className="inline-flex items-center text-emerald-600 hover:text-emerald-700 transition-colors text-sm font-medium"
               >
                 <ArrowLeft size={16} className="mr-1" /> Kembali ke Daftar Pesanan
               </button>
              <div className="flex flex-wrap items-center gap-3">
                 <button onClick={handleDownloadPDF} className="inline-flex items-center px-4 py-2.5 bg-slate-700 text-white font-medium rounded-lg hover:bg-slate-800 transition">
                   <Download className="w-4 h-4 mr-2" /> Unduh PDF
                 </button>
               </div>
            </div>

            {error && !isLoading && ( // Show inline error if fetch succeeded but there's a status issue etc.
              <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 rounded-xl flex items-center gap-3">
                <AlertTriangle size={20} />
                <span>{error}</span>
              </div>
            )}

            <div ref={contentRef} className="bg-white rounded-xl shadow-lg border border-slate-200 p-8 md:p-10 print:shadow-none print:border-0 print:p-4">
              <header className="text-center mb-10 pb-6 border-b border-slate-200">
                <h1 className="text-3xl font-bold text-slate-800">Konfirmasi Penerimaan Barang</h1>
                <p className="text-slate-500 mt-1">Nomor PO: {info.nomor_po}</p>
              </header>

              <section className="grid grid-cols-1 sm:grid-cols-2 gap-8 mb-10 text-sm">
                  <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
                      <h3 className="font-bold text-slate-800 mb-2 uppercase text-xs tracking-wider">Dikirim Dari</h3>
                      <p className="font-semibold text-slate-700">{info.nama_produsen || 'Produsen Medisync'}</p>
                      <p className="text-slate-600">{info.alamat_produsen || '-'}</p>
                  </div>
                  <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
                      <h3 className="font-bold text-slate-800 mb-2 uppercase text-xs tracking-wider">Diterima Oleh</h3>
                      <p className="font-semibold text-slate-700">{info.nama_pbf}</p>
                      <p className="text-slate-600">{info.alamat_pbf}</p>
                  </div>
                   <div className="sm:col-span-2 bg-slate-50 p-4 rounded-lg border border-slate-200 grid grid-cols-2 sm:grid-cols-4 gap-4">
                       <div>
                           <p className="text-xs text-slate-500">Tanggal Pesan</p>
                           <p className="font-medium text-slate-700">{formatDate(info.tanggal_pesanan)}</p>
                       </div>
                       <div>
                           <p className="text-xs text-slate-500">Tanggal Kirim</p>
                           <p className="font-medium text-slate-700">{formatDate(info.tanggal_pengiriman)}</p>
                       </div>
                       <div>
                           <p className="text-xs text-slate-500">No. Surat Jalan</p>
                           <p className="font-medium text-slate-700 font-mono">{info.nomor_surat_jalan || '-'}</p>
                       </div>
                       <div>
                           <p className="text-xs text-slate-500">No. Resi</p>
                           <p className="font-medium text-slate-700 font-mono">{info.nomor_resi || '-'}</p>
                       </div>
                  </div>
              </section>

              <section className="mb-10">
                <h3 className="font-bold text-slate-800 mb-4 uppercase text-sm tracking-wider">Detail Barang Diterima</h3>
                <div className="overflow-x-auto border border-slate-200 rounded-lg">
                  <table className="w-full text-sm">
                    <thead className="bg-slate-100 text-slate-700">
                      <tr>
                        <th className="px-4 py-3 text-left font-semibold border-b border-slate-200">No.</th>
                        <th className="px-4 py-3 text-left font-semibold border-b border-slate-200">Nama Obat</th>
                        <th className="px-4 py-3 text-left font-semibold border-b border-slate-200">Batch ID</th>
                        <th className="px-4 py-3 text-center font-semibold border-b border-slate-200">Jumlah Diterima</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {detail && detail.length > 0 ? (
                         detail.map((item, index) => (
                          <tr key={item.id || index} className="hover:bg-slate-50">
                            <td className="px-4 py-3 border-r border-slate-200">{index + 1}</td>
                            <td className="px-4 py-3 border-r border-slate-200 font-medium text-slate-800">{item.nama_obat}</td>
                             <td className="px-4 py-3 border-r border-slate-200 font-mono text-slate-600">{item.batch_id}</td>
                            <td className="px-4 py-3 text-center font-medium text-emerald-700">{item.jumlah_pesanan.toLocaleString('id-ID')} Box</td>
                          </tr>
                         ))
                       ) : (
                         <tr>
                           <td colSpan="4" className="text-center py-6 text-slate-500 border-t border-slate-200">
                             Tidak ada detail barang.
                           </td>
                         </tr>
                       )}
                    </tbody>
                  </table>
                </div>
                 <div className="flex justify-end mt-4">
                  <div className="text-right">
                    <p className="text-sm text-slate-500">Total Harga</p>
                    <p className="text-xl font-bold text-slate-800">
                      Rp {totalHargaKeseluruhan.toLocaleString('id-ID')}
                    </p>
                  </div>
                </div>
              </section>

              <section className="mb-10">
                <h3 className="font-bold text-slate-800 mb-6 uppercase text-sm tracking-wider text-center">Status Pengiriman</h3>
                <div className="flex flex-col sm:flex-row justify-center items-start sm:items-stretch">
                    <StatusStep
                      icon={Package}
                      label="Dipersiapkan"
                      timestamp={getTimestamp('Dipersiapkan')}
                      isCompleted={isDipersiapkanCompleted}
                      isCurrent={currentStatusStep === 'Dipersiapkan'}
                    />
                    <StatusStep
                      icon={Truck}
                      label="Dikirim"
                      timestamp={getTimestamp('Dikirim')}
                      isCompleted={isDikirimCompleted}
                      isCurrent={currentStatusStep === 'Dikirim'}
                    />
                    <StatusStep
                      icon={CheckCircle2}
                      label="Diterima"
                      timestamp={getTimestamp('Selesai')}
                      isCompleted={isSelesaiCompleted}
                      isCurrent={currentStatusStep === 'Selesai'}
                      isLast={true}
                    />
                </div>
              </section>

              <footer className="flex flex-col sm:flex-row justify-end items-center gap-4 pt-6 border-t border-slate-200 mt-8 print:hidden">
                    {info.status === 'Dikirim' && !error && (
                       <>
                         <Link
                           to={`/pbf/pesanan/${id}/ajukan-pengembalian`}
                           className="w-full sm:w-auto py-2.5 px-6 bg-red-100 text-red-700 font-semibold rounded-lg hover:bg-red-200 border border-red-200 transition active:scale-95 text-center"
                         >
                           Ajukan Pengembalian
                         </Link>
                         <button
                           onClick={handleOpenConfirmModal}
                           className="w-full sm:w-auto py-2.5 px-6 bg-emerald-600 text-white font-semibold rounded-lg hover:bg-emerald-700 flex items-center justify-center gap-2 transition active:scale-95 disabled:bg-emerald-300"
                           disabled={isSubmitting}
                         >
                           <CheckCircle2 size={18} />
                           Konfirmasi Penerimaan
                         </button>
                       </>
                     )}
                     {info.status === 'Selesai' && (
                       <span className="inline-flex items-center px-4 py-2 bg-emerald-100 text-emerald-800 text-sm font-semibold rounded-full border border-emerald-200">
                         <CheckCircle2 size={16} className="mr-1.5"/>
                         Pesanan Telah Dikonfirmasi
                       </span>
                     )}
                      {(info.status !== 'Dikirim' && info.status !== 'Selesai') && (
                          <span className="inline-flex items-center px-4 py-2 bg-slate-100 text-slate-500 text-sm font-semibold rounded-full border border-slate-200">
                             Status Saat Ini: {info.status}
                          </span>
                     )}
              </footer>
            </div>
          </div>
        </main>

        <ConfirmationModal
          show={showConfirmModal}
          onClose={handleCloseConfirmModal}
          onConfirm={handleConfirm}
          isSubmitting={isSubmitting}
          orderId={id}
          onFileChange={handleFileChange}
          buktiFoto={buktiFoto}
        />
      </div>
    </div>
  );
};

export default KonfirmasiPenerimaan;