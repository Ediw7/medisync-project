// File: frontend/src/pages/produsen/pengelolaanpengiriman/LacakPengembalian.jsx

import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import SidebarProdusen from '../../../components/SidebarProdusen';
import NavbarProdusen from '../../../components/NavbarProdusen';
import { ArrowLeft, ClipboardCopy, Package, Truck, CheckCircle, Loader2, Camera, X } from 'lucide-react';
import axios from 'axios';

// --- Komponen Modal Konfirmasi ---
const ConfirmationModal = ({ show, onClose, onConfirm, isSubmitting, orderId, onFileChange, buktiFoto }) => {
  if (!show) return null;
  return (
    <div className="fixed inset-0 z-50 flex justify-center items-center p-4 bg-black/30 backdrop-blur-sm">
      <div className="bg-white p-6 rounded-lg shadow-xl max-w-sm w-full border">
        <h3 className="text-lg font-semibold text-slate-800 text-center">Konfirmasi Penerimaan Barang</h3>
        <p className="text-slate-600 my-4 text-sm text-center">
            Unggah bukti foto untuk mengonfirmasi bahwa Anda telah menerima barang yang dikembalikan untuk pesanan ID: <strong>{orderId}</strong>.
        </p>
        <div className="mb-6">
          <label htmlFor="buktiFoto" className="relative flex items-center justify-center w-32 h-32 bg-slate-100 border-2 border-dashed border-slate-300 rounded-lg cursor-pointer hover:border-emerald-500 transition-colors mx-auto group">
            {buktiFoto ? (
              <img src={URL.createObjectURL(buktiFoto)} alt="Preview Bukti" className="w-full h-full object-cover rounded-lg" />
            ) : (
              <div className="text-center text-slate-500">
                <Camera size={24} className="mx-auto" />
                <p className="text-xs mt-2">Unggah Bukti Foto</p>
              </div>
            )}
            <input id="buktiFoto" type="file" accept="image/jpeg,image/png" onChange={onFileChange} className="hidden" />
          </label>
          {buktiFoto && <p className="text-xs text-slate-500 mt-2 text-center">{buktiFoto.name}</p>}
        </div>
        <div className="flex justify-end gap-3">
          <button onClick={onClose} className="py-2 px-4 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 font-semibold" disabled={isSubmitting}>Batal</button>
          <button onClick={onConfirm} className="py-2 px-4 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 flex items-center gap-2 font-semibold disabled:bg-emerald-300" disabled={isSubmitting || !buktiFoto}>
            {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
            {isSubmitting ? 'Memproses...' : 'Ya, Konfirmasi'}
          </button>
        </div>
      </div>
    </div>
  );
};

// --- Komponen Modal Lihat Bukti Foto ---
const ProofModal = ({ show, onClose, imageUrl }) => {
    if (!show) return null;
    return (
        <div className="fixed inset-0 z-50 flex justify-center items-center p-4 bg-black/50 backdrop-blur-sm" onClick={onClose}>
            <div className="bg-white p-4 rounded-lg shadow-xl max-w-lg w-full relative" onClick={e => e.stopPropagation()}>
                <h3 className="text-lg font-semibold mb-4">Bukti Penerimaan Pengembalian</h3>
                <img src={imageUrl} alt="Bukti Penerimaan" className="w-full h-auto max-h-[80vh] object-contain rounded" />
                <button onClick={onClose} className="absolute top-2 right-2 text-gray-500 hover:text-gray-800 bg-white/50 rounded-full p-1">
                    <X size={24} />
                </button>
            </div>
        </div>
    );
};


const LacakPengembalian = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [trackingData, setTrackingData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // State untuk modal
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showProofModal, setShowProofModal] = useState(false);
  const [buktiFoto, setBuktiFoto] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  

  const fetchTrackingData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem('token');
      if (!token) throw new Error('Silakan login terlebih dahulu');

      const response = await axios.get(`http://localhost:5000/api/produsen/pesanan-masuk/lacak-pengembalian/${id}`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      
      if (!response.data.success) throw new Error(response.data.message || 'Data pelacakan tidak tersedia');
      
      const data = response.data.data;
      const waktuPengembalian = new Date(data.tanggal_pengiriman || data.tanggal_pesanan);
      const estimasiSampai = new Date(waktuPengembalian);
      estimasiSampai.setDate(waktuPengembalian.getDate() + 2); // Estimasi 2 hari

      setTrackingData({
        noResi: data.nomor_resi,
        noSuratJalanBerangkat: data.nomor_surat_jalan,
        noSuratJalanPulang: `SJPULANG-${data.id}-${new Date().getTime().toString().slice(-4)}`,
        pengirim: data.nama_pbf,
        tujuan: data.nama_produsen,
        idPesanan: String(data.id).padStart(6, '0'),
        waktuPengembalian: waktuPengembalian,
        estimasiSampai: estimasiSampai,
        status: data.status,
        buktiFotoPengembalian: data.bukti_foto_pengembalian,
      });

    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTrackingData();
  }, [id]);

  const handleFileChange = (e) => {
    setBuktiFoto(e.target.files[0]);
  };
  
  const handleConfirmReceipt = async () => {
    if (!buktiFoto) {
      alert('Bukti foto wajib diunggah.');
      return;
    }
    setIsSubmitting(true);
    const formData = new FormData();
    formData.append('buktiFoto', buktiFoto);

    try {
      const token = localStorage.getItem('token');
      await axios.put(`http://localhost:5000/api/produsen/pesanan-masuk/lacak-pengembalian/${id}/konfirmasi`, formData, {
        headers: { Authorization: `Bearer ${token}` }
      });
      alert('Penerimaan berhasil dikonfirmasi!');
      setShowConfirmModal(false);
      setBuktiFoto(null);
      fetchTrackingData(); // Muat ulang data untuk perbarui status
    } catch (err) {
      setError(err.response?.data?.message || 'Gagal konfirmasi penerimaan.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    alert(`Teks "${text}" telah disalin.`);
  };

  const StatusStep = ({ icon, label, timestamp, isCompleted, isLast = false }) => (
    <div className="flex items-center">
      <div className={`flex flex-col items-center ${isLast ? '' : 'flex-1'}`}>
        <div className={`w-12 h-12 rounded-full flex items-center justify-center ${isCompleted ? 'bg-emerald-500 text-white' : 'bg-gray-200 text-gray-500'}`}>
          {icon}
        </div>
        <div className="text-center mt-2">
          <p className={`font-semibold ${isCompleted ? 'text-gray-800' : 'text-gray-500'}`}>{label}</p>
          {timestamp && <p className="text-sm text-gray-500">{timestamp}</p>}
        </div>
      </div>
      {!isLast && (
        <div className={`flex-1 h-1 mx-4 ${isCompleted ? 'bg-emerald-500' : 'bg-gray-200'}`} />
      )}
    </div>
  );

  if (isLoading) {
    return <div className="flex justify-center items-center h-screen"><Loader2 className="animate-spin h-8 w-8 text-emerald-600" /></div>;
  }
  
  if (error) {
    return <div className="p-6 text-center text-red-500">{error}</div>;
  }

  if (!trackingData) return <div className="p-6 text-center">Data pelacakan tidak ditemukan.</div>;

  const formatDate = (date) => date.toLocaleDateString('id-ID', { day: '2-digit', month: '2-digit', year: 'numeric' }).replace(/\//g, '-');
  const formatTime = (date) => date.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit'});

  const isSelesai = trackingData.status === 'Pengembalian Selesai';

  return (
    <div className="flex min-h-screen bg-gray-50">
      <SidebarProdusen isCollapsed={isCollapsed} setIsCollapsed={setIsCollapsed} />
      <div className={`flex-1 flex flex-col transition-all duration-300 ${isCollapsed ? 'ml-16' : 'ml-64'}`}>
        <NavbarProdusen onLogout={() => { localStorage.clear(); navigate('/'); }} />
        <main className="pt-18 pl-12 p-6 mt-8 ml-8">
          <div className="max-w-4xl mx-auto">
            {/* ... Header dan Detail Lacak ... */}
            <div className="bg-white p-8 rounded-lg shadow-lg border border-gray-200">
                <header className="mb-8">
                  <h1 className="text-2xl font-bold text-gray-800">Lacak Pengembalian Produk</h1>
                  <p className="text-gray-500">Lihat Proses Pengembalian Produk</p>
                </header>
                <section className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-12">
                  <div>
                    <p className="text-sm text-gray-500">No Resi</p>
                    <div className="flex items-center gap-2"><p className="font-semibold text-lg">{trackingData.noResi}</p><button onClick={() => copyToClipboard(trackingData.noResi)} className="text-gray-400 hover:text-emerald-600"><ClipboardCopy size={16} /></button></div>
                  </div>
                  <div><p className="text-sm text-gray-500">Pengirim</p><p className="font-semibold text-lg">{trackingData.pengirim}</p></div>
                  <div><p className="text-sm text-gray-500">No Surat Jalan Berangkat</p><p className="font-semibold text-lg">{trackingData.noSuratJalanBerangkat}</p></div>
                  <div><p className="text-sm text-gray-500">Waktu Pengembalian</p><p className="font-semibold text-lg">{formatDate(trackingData.waktuPengembalian)}</p></div>

                  <div><p className="text-sm text-gray-500">ID Pesanan</p><p className="font-semibold text-lg">{trackingData.idPesanan}</p></div>
                  <div><p className="text-sm text-gray-500">Tujuan</p><p className="font-semibold text-lg">{trackingData.tujuan}</p></div>
                  <div><p className="text-sm text-gray-500">No Surat Jalan Pulang</p><p className="font-semibold text-lg">{trackingData.noSuratJalanPulang}</p></div>
                  <div><p className="text-sm text-gray-500">Estimasi Sampai</p><p className="font-semibold text-lg">{formatDate(trackingData.estimasiSampai)}</p></div>
                </section>

                <section className="flex justify-center py-6">
                    <StatusStep icon={<Package size={24}/>} label="Dipersiapkan" timestamp={`${formatDate(trackingData.waktuPengembalian)}`} isCompleted={true} />
                    <StatusStep icon={<Truck size={24}/>} label="Dikirim" timestamp={`${formatDate(trackingData.waktuPengembalian)}`} isCompleted={true} />
                    <StatusStep icon={<CheckCircle size={24}/>} label="Selesai" timestamp={isSelesai ? formatDate(new Date()) : null} isCompleted={isSelesai} isLast={true} />
                </section>
                
                {/* --- Tombol Aksi Baru --- */}
                <div className="flex justify-end items-center gap-4 pt-6 border-t mt-8">
                    {trackingData.status === 'Dikembalikan' && (
                        <button onClick={() => setShowConfirmModal(true)} className="py-2.5 px-6 bg-emerald-600 text-white font-semibold rounded-lg hover:bg-emerald-700 flex items-center gap-2">
                            <CheckCircle size={18} />
                            Konfirmasi Penerimaan
                        </button>
                    )}
                    {trackingData.status === 'Pengembalian Selesai' && trackingData.buktiFotoPengembalian && (
                        <button onClick={() => setShowProofModal(true)} className="py-2.5 px-6 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700">
                            Lihat Bukti Penerimaan
                        </button>
                    )}
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
        imageUrl={trackingData.buktiFotoPengembalian ? `http://localhost:5000/${trackingData.buktiFotoPengembalian}` : ''}
      />

    </div>
  );
};

export default LacakPengembalian;