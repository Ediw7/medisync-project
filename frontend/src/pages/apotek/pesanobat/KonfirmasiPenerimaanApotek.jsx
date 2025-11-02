import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import NavbarApotek from '../../../components/NavbarApotek';

import {
  ArrowLeft,
  Camera,
  CheckCircle2,
  Package,
  Truck,
  Loader2,
  Download,
  X,
  AlertTriangle,
  Info,
  Clock,
} from 'lucide-react';
import axios from 'axios';
import html2pdf from 'html2pdf.js';
import { toast } from 'react-hot-toast';

const ConfirmationModal = ({ show, onClose, onConfirm, isSubmitting, orderId, onFileChange, buktiFoto }) => {
  if (!show) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-center items-center p-4 bg-slate-900/20 backdrop-blur-sm">
      <div className="bg-white p-6 rounded-2xl shadow-xl max-w-sm w-full border border-slate-200">
        <div className="flex justify-between items-center pb-3 border-b border-slate-200">
          <h3 className="text-lg font-semibold text-slate-800">Konfirmasi Penerimaan</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 rounded-full p-1 transition-colors">
            <X size={20} />
          </button>
        </div>
        <div className="text-center pt-5">
          <CheckCircle2 size={48} className="text-emerald-500 mx-auto mb-4" />
          <p className="text-slate-600 mb-5 text-sm">
            Anda akan mengkonfirmasi penerimaan pesanan:<br />
            <strong className="text-base text-slate-800">{orderId}</strong>
          </p>
          <div className="mb-6">
            <label
              htmlFor="buktiFoto"
              className="relative flex items-center justify-center w-32 h-32 bg-slate-100 border-2 border-dashed border-slate-300 rounded-lg cursor-pointer hover:border-emerald-500 transition-colors mx-auto group"
            >
              {buktiFoto ? (
                <img src={URL.createObjectURL(buktiFoto)} alt="Preview" className="w-full h-full object-cover rounded-lg" />
              ) : (
                <div className="text-center text-slate-500 group-hover:text-emerald-600 transition-colors">
                  <Camera size={24} className="mx-auto" />
                  <p className="text-xs mt-2">Unggah Bukti Foto</p>
                </div>
              )}
              <input id="buktiFoto" type="file" accept="image/jpeg,image/png" onChange={onFileChange} className="hidden" />
            </label>
            {buktiFoto && <p className="text-xs text-slate-500 mt-2">{buktiFoto.name}</p>}
          </div>
          <div className="flex justify-end gap-3">
            <button
              onClick={onClose}
              className="py-2 px-4 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 font-semibold transition-colors"
              disabled={isSubmitting}
            >
              Batal
            </button>
            <button
              onClick={onConfirm}
              className="py-2 px-4 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 flex items-center gap-2 font-semibold disabled:bg-emerald-300 transition-colors"
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

const StatusStep = ({ icon: Icon, label, timestamp, isCompleted, isCurrent }) => (
  <div className="relative flex flex-col items-center justify-start text-center w-40">
    <div
      className={`w-14 h-14 rounded-full flex items-center justify-center border-2 transition-colors duration-300 z-10 ${
        isCurrent
          ? 'bg-emerald-100 border-emerald-500 animate-pulse'
          : isCompleted
          ? 'bg-emerald-500 border-emerald-600 text-white'
          : 'bg-slate-100 border-slate-300 text-slate-400'
      }`}
    >
      <Icon size={26} />
    </div>
    <div className="mt-3">
      <p
        className={`font-semibold text-sm ${
          isCurrent ? 'text-emerald-700' : isCompleted ? 'text-slate-800' : 'text-slate-500'
        }`}
      >
        {label}
      </p>
      {timestamp && <p className="text-xs text-slate-500 mt-1">{timestamp}</p>}
    </div>
  </div>
);

const KonfirmasiPenerimaanApotek = () => {
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

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const token = localStorage.getItem('token');
        if (!token) throw new Error('Silakan login terlebih dahulu');

        const response = await axios.get(`http://localhost:5000/api/apotek/pesanan/${id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (!response.data.success || !response.data.data) {
          throw new Error(response.data.message || 'Data pesanan tidak ditemukan');
        }

        setPesanan(response.data.data);
      } catch (err) {
        setError(err.message);
        if (err.message.includes('401') || err.message.includes('403')) {
          navigate('/login/apotek');
        }
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, [id, navigate]);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file && file.size > 5 * 1024 * 1024) {
      toast.error('Ukuran file maksimal 5MB.');
      return;
    }
    setBuktiFoto(file);
  };

  const handleConfirm = async () => {
    if (!buktiFoto) return;
    setIsSubmitting(true);
    toast.dismiss();

    const formData = new FormData();
    formData.append('buktiFoto', buktiFoto);

    try {
      const token = localStorage.getItem('token');
      const response = await axios.put(
        `http://localhost:5000/api/apotek/penerimaan/konfirmasi/${id}`,
        formData,
        {
          headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'multipart/form-data' },
        }
      );

      if (response.data.success) {
        toast.success('Penerimaan berhasil dikonfirmasi!');
        navigate('/apotek/pesan-obat');
      } else {
        throw new Error(response.data.message || 'Gagal konfirmasi');
      }
    } catch (err) {
      toast.error('Gagal konfirmasi: ' + (err.response?.data?.message || err.message));
    } finally {
      setIsSubmitting(false);
      setShowConfirmModal(false);
    }
  };

  const handleDownloadPDF = () => {
    const element = contentRef.current;
    const opt = {
      margin: [10, 5, 10, 5],
      filename: `konfirmasi_penerimaan_apotek_${pesanan?.pesanan?.nomor_pesanan || id}.pdf`,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2, useCORS: true },
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
    };
    html2pdf().from(element).set(opt).save();
  };

  // Format tanggal WIB
  const formatDate = (dateString, includeTime = false) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    const options = {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      timeZone: 'Asia/Jakarta',
    };
    if (includeTime) {
      options.hour = '2-digit';
      options.minute = '2-digit';
    }
    return date.toLocaleString('id-ID', options) + (includeTime ? ' WIB' : '');
  };

  // === LOADING STATE ===
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

  // === ERROR STATE ===
  if (error) {
    return (
      <div className="flex min-h-screen bg-gradient-to-br from-slate-50 via-white to-emerald-50">
        {/* SidebarApotek jika ada */}
        {/* <SidebarApotek isCollapsed={isCollapsed} setIsCollapsed={setIsCollapsed} /> */}
        <div className="flex-1 flex flex-col">
          <NavbarApotek onLogout={() => { localStorage.clear(); navigate('/'); }} username={localStorage.getItem('username')} />
          <main className="flex-1 flex items-center justify-center p-6 pt-[72px]">
            <div className="bg-white p-8 rounded-2xl shadow-lg border border-red-200 text-center max-w-md">
              <AlertTriangle className="mx-auto h-12 w-12 text-red-500 mb-4" />
              <h2 className="text-xl font-bold text-red-800 mb-2">Gagal Memuat Data</h2>
              <p className="text-red-600 mb-6">{error}</p>
              <button
                onClick={() => navigate('/apotek/pesan-obat')}
                className="flex items-center gap-2 px-4 py-2.5 border border-slate-300 text-slate-700 font-medium rounded-lg hover:bg-slate-100 transition mx-auto"
              >
                <ArrowLeft size={18} />
                Kembali ke Pesanan
              </button>
            </div>
          </main>
        </div>
      </div>
    );
  }

  if (!pesanan) return <div className="p-6 text-center text-slate-500">Data tidak ditemukan.</div>;

  const { pesanan: info, detail_pesanan: detail } = pesanan;

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-slate-50 via-white to-emerald-50">
      {/* SidebarApotek jika ada */}
      {/* <SidebarApotek isCollapsed={isCollapsed} setIsCollapsed={setIsCollapsed} /> */}
      <div className="flex-1 flex flex-col">
        <NavbarApotek onLogout={() => { localStorage.clear(); navigate('/'); }} username={localStorage.getItem('username')} />

        <main className="flex-1 overflow-auto pt-[72px] px-12 py-8">
          <div className="max-w-5xl mx-auto">
            <div className="flex justify-between items-center mb-6">
              <button
                onClick={() => navigate('/apotek/pesan-obat')}
                className="inline-flex items-center text-emerald-600 hover:text-emerald-700 transition-colors text-sm font-medium"
              >
                <ArrowLeft size={16} className="mr-1" /> Kembali ke Pesanan
              </button>
              <button
                onClick={handleDownloadPDF}
                className="inline-flex items-center px-4 py-2.5 bg-slate-700 text-white font-medium rounded-lg hover:bg-slate-800 transition"
              >
                <Download size={18} className="mr-2" /> Unduh PDF
              </button>
            </div>

            <div ref={contentRef} className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
              {/* Header */}
              <div className="bg-gradient-to-r from-emerald-500 to-teal-600 px-6 py-5 border-b border-slate-200">
                <h1 className="text-2xl font-bold text-white">Konfirmasi Penerimaan</h1>
                <p className="text-sm text-emerald-50 mt-1">Nomor Pesanan: {info.nomor_pesanan}</p>
              </div>

              {/* Pengirim & Penerima */}
              <div className="p-8 border-b border-slate-200">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
                    <h3 className="font-bold text-slate-800 mb-2 uppercase text-xs tracking-wider">Dikirim Dari (PBF)</h3>
                    <p className="font-semibold text-slate-700">{info.nama_pbf}</p>
                    <p className="text-slate-600 text-sm">{info.alamat_pbf}</p>
                  </div>
                  <div className="bg-slate-50 p-4 rounded-lg border border-slate-200 text-right">
                    <h3 className="font-bold text-slate-800 mb-2 uppercase text-xs tracking-wider">Diterima Oleh (Apotek)</h3>
                    <p className="font-semibold text-slate-700">{info.nama_apotek}</p>
                    <p className="text-slate-600 text-sm">Tanggal Pesan: {formatDate(info.tanggal_pesanan)}</p>
                  </div>
                </div>
              </div>

              {/* Daftar Produk */}
              <div className="p-8 border-b border-slate-200">
                <h3 className="text-lg font-bold text-slate-900 mb-6 flex items-center gap-2">
                  <Package size={20} className="text-emerald-600" />
                  Daftar Produk
                </h3>
                <div className="overflow-x-auto border border-slate-200 rounded-lg">
                  <table className="w-full text-sm">
                    <thead className="bg-slate-100 text-slate-700">
                      <tr>
                        <th className="px-4 py-3 text-left font-semibold border-b border-slate-200">No.</th>
                        <th className="px-4 py-3 text-left font-semibold border-b border-slate-200">Nama Obat</th>
                        <th className="px-4 py-3 text-right font-semibold border-b border-slate-200">Jumlah</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {detail && detail.length > 0 ? (
                        detail.map((item, index) => (
                          <tr key={item.id} className="hover:bg-slate-50">
                            <td className="px-4 py-3">{index + 1}</td>
                            <td className="px-4 py-3 font-medium text-slate-800">{item.nama_obat}</td>
                            <td className="px-4 py-3 text-right">{item.jumlah} {item.satuan}</td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan="3" className="text-center py-6 text-slate-500">Tidak ada item.</td>
                        </tr>
                      )}
                    </tbody>
                    {detail && detail.length > 0 && (
                      <tfoot className="bg-slate-100 font-semibold text-slate-800">
                        <tr>
                          <td colSpan="2" className="px-4 py-3 text-right border-t-2 border-slate-300">TOTAL HARGA</td>
                          <td className="px-4 py-3 text-right border-t-2 border-slate-300">
                            {new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(info.total_harga)}
                          </td>
                        </tr>
                      </tfoot>
                    )}
                  </table>
                </div>
              </div>

              {/* Timeline Status */}
              <div className="p-8 py-12">
                <h3 className="text-lg font-bold text-slate-900 mb-8 text-center">Status Pengiriman</h3>
                <div className="flex items-center justify-center gap-0">
                  <StatusStep
                    icon={Package}
                    label="Dipersiapkan"
                    timestamp={formatDate(info.tanggal_pesanan, true)}
                    isCompleted={true}
                    isCurrent={false}
                  />
                  <div className="relative flex items-center h-14 w-24">
                    <div className="w-full h-1.5 rounded-full bg-emerald-500" />
                  </div>
                  <StatusStep
                    icon={Truck}
                    label="Dikirim"
                    timestamp={`${formatDate(info.tanggal_pengiriman)} ${info.waktu_pengiriman || ''}`}
                    isCompleted={true}
                    isCurrent={false}
                  />
                  <div className="relative flex items-center h-14 w-24">
                    <div className="w-full h-1.5 rounded-full bg-slate-300" />
                  </div>
                  <StatusStep
                    icon={CheckCircle2}
                    label="Diterima"
                    timestamp={null}
                    isCompleted={false}
                    isCurrent={true}
                  />
                </div>
              </div>

              {/* Tombol Konfirmasi */}
              <div className="px-8 pb-8">
                <div className="flex justify-end">
                  <button
                    onClick={() => setShowConfirmModal(true)}
                    className="inline-flex items-center px-6 py-3 bg-emerald-600 text-white font-semibold rounded-lg hover:bg-emerald-700 transition shadow-md"
                  >
                    <CheckCircle2 size={20} className="mr-2" />
                    Konfirmasi Penerimaan
                  </button>
                </div>
              </div>

              {/* Info Box */}
              <div className="px-8 pb-8">
                <div className="bg-blue-50 border border-blue-200 text-blue-800 rounded-xl p-4 text-sm flex items-start gap-3">
                  <Info size={18} className="flex-shrink-0 mt-0.5" />
                  <span>
                    Pastikan barang telah diterima dalam kondisi baik sebelum mengonfirmasi. Upload foto sebagai bukti penerimaan.
                  </span>
                </div>
              </div>
            </div>
          </div>
        </main>

        {/* Modal Konfirmasi */}
        <ConfirmationModal
          show={showConfirmModal}
          onClose={() => setShowConfirmModal(false)}
          onConfirm={handleConfirm}
          isSubmitting={isSubmitting}
          orderId={info.nomor_pesanan}
          onFileChange={handleFileChange}
          buktiFoto={buktiFoto}
        />
      </div>
    </div>
  );
};

export default KonfirmasiPenerimaanApotek;