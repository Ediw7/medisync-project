import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import SidebarProdusen from '../../../components/SidebarProdusen';
import NavbarProdusen from '../../../components/NavbarProdusen';
import {
  Loader2, ArrowLeft, FileText, Hash, Calendar, Clock, MapPin,
  Check, AlertCircle, Truck, ChevronDown
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import axios from 'axios';

// === MODAL KONFIRMASI (Tidak Berubah) ===
const ConfirmModal = ({ show, onClose, onConfirm, isLoading, pesanan }) => {
  if (!show) return null;
  return (
    <div className="fixed inset-0 bg-black/20 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-white p-8 rounded-xl shadow-2xl max-w-sm w-full mx-auto border border-slate-200" onClick={e => e.stopPropagation()}>
        <div className="flex items-center gap-3 mb-4 text-emerald-600">
          <Truck size={28} />
          <h3 className="font-bold text-lg text-slate-800">Konfirmasi Pengiriman</h3>
        </div>
        <p className="text-slate-700 mb-6 leading-relaxed">
          Anda yakin ingin mengirim pesanan <strong>#{String(pesanan?.id).padStart(6, '0')}</strong> ke <strong>{pesanan?.nama_pbf}</strong>?
          <br/><br/>
          Tindakan ini akan mengubah status menjadi "Dikirim" dan mencatatnya ke blockchain.
        </p>
        <div className="flex justify-end gap-3">
          <button onClick={onClose} disabled={isLoading} className="px-6 py-2.5 font-medium rounded-lg bg-slate-100 text-slate-700 hover:bg-slate-200 disabled:opacity-50">
            Batal
          </button>
          <button onClick={onConfirm} disabled={isLoading} className={`px-6 py-2.5 font-medium rounded-lg flex items-center gap-2 ${isLoading ? "bg-slate-400 text-white" : "bg-emerald-600 text-white hover:bg-emerald-700"}`}>
            {isLoading ? <Loader2 size={18} className="animate-spin" /> : <Check size={18} />}
            {isLoading ? 'Memproses...' : 'Ya, Kirim'}
          </button>
        </div>
      </div>
    </div>
  );
};

// ... (Fungsi generateProNumber, toRoman, getTodayLocal tidak berubah) ...
const generateProNumber = (prefix, orderId) => {
  const date = new Date();
  const year = date.getFullYear().toString().slice(-2);
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const day = date.getDate().toString().padStart(2, '0');
  const timestamp = date.getTime().toString().slice(-4);
  const paddedOrderId = String(orderId).padStart(3, '0');
  return `${prefix}-${year}${month}${day}-${paddedOrderId}-${timestamp}`;
};

const toRoman = (num) => {
  const map = { M:1000, CM:900, D:500, CD:400, C:100, XC:90, L:50, XL:40, X:10, IX:9, V:5, IV:4, I:1 };
  let result = '';
  for (let key in map) while (num >= map[key]) { result += key; num -= map[key]; }
  return result;
};

const generateSuratJalanNumber = (orderId) => {
  const nomorIzin = localStorage.getItem('nomorIzin');
  if (!nomorIzin) return 'ERROR-NO-IZIN';
  const date = new Date();
  const year = date.getFullYear().toString().slice(-2);
  const month = date.getMonth() + 1;
  const paddedOrderId = String(orderId).padStart(6, '0');
  return `SJ/${paddedOrderId}/${nomorIzin}/${toRoman(month)}/${year}`;
};

const getTodayLocal = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};


// === KOMPONEN UTAMA ===
const RincianPengiriman = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();

  const [isCollapsed, setIsCollapsed] = useState(false);
  const [pesanan, setPesanan] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const username = localStorage.getItem('username');

  const [nomorResi] = useState(() => id ? generateProNumber('RES', id) : 'INVALID-ID');
  const [nomorSuratJalan] = useState(() => id ? generateSuratJalanNumber(id) : 'INVALID-ID');

  // --- PERBAIKAN 1: Ambil catatanKurir & catatanPenerima dari state ---
  const {
    pesanan: pesananFromState,
    tanggalPengiriman: tanggalFromState,
    waktuPengiriman: waktuFromState,
    catatanKurir: catatanKurirFromState,       // <-- Diubah
    catatanPenerima: catatanPenerimaFromState, // <-- Diubah
    opsiPengiriman: opsiFromState
  } = location.state || {};
  
  const [tanggalPengiriman, setTanggalPengiriman] = useState(tanggalFromState || '');
  const [waktuPengiriman, setWaktuPengiriman] = useState(waktuFromState || '09:00-12:00');
  const [opsiPengiriman, setOpsiPengiriman] = useState(opsiFromState || 'standar');
  const [catatanKurir, setCatatanKurir] = useState(catatanKurirFromState || '');           // <-- Diubah
  const [catatanPenerima, setCatatanPenerima] = useState(catatanPenerimaFromState || '');   // <-- Diubah
  const [alamatTujuan, setAlamatTujuan] = useState('');
  // --- AKHIR PERBAIKAN 1 ---

  const today = getTodayLocal();
  const currentDate = new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });

  // === USE EFFECT (Tidak berubah signifikan) ===
  useEffect(() => {
    if (pesananFromState) {
      setPesanan(pesananFromState);
      setAlamatTujuan(pesananFromState.alamat_pbf || 'Alamat tidak tersedia');
      setIsLoading(false);

      if (nomorSuratJalan === 'ERROR-NO-IZIN') {
        setError("Nomor Izin produsen tidak ditemukan.");
        toast.error("Nomor Izin produsen tidak ditemukan.");
      }
    } else {
      const fetchData = async () => {
        setIsLoading(true);
        setError(null);
        try {
          const token = localStorage.getItem('token');
          if (!token) throw new Error('Silakan login terlebih dahulu');

          if (!localStorage.getItem('nomorIzin') || nomorSuratJalan === 'ERROR-NO-IZIN') {
            throw new Error("Nomor Izin tidak ditemukan.");
          }

          const response = await axios.get(`http://localhost:5000/api/produsen/pesanan-masuk/${id}`, {
            headers: { 'Authorization': `Bearer ${token}` },
          });

          if (!response.data.success || !response.data.data) {
            throw new Error(response.data.message || 'Data tidak tersedia');
          }

          const data = response.data.data.pesanan;
          setPesanan(data);
          setAlamatTujuan(data.alamat_pbf || 'Alamat tidak tersedia');

          if (!tanggalFromState) {
            setTanggalPengiriman(today);
          }

        } catch (error) {
          const errorMsg = error.response?.data?.message || error.message || 'Gagal memuat data.';
          setError(errorMsg);
          toast.error(errorMsg);
          if (errorMsg.includes('401') || errorMsg.includes('403') || errorMsg.includes('login')) {
            navigate('/login/produsen');
          }
        } finally {
          setIsLoading(false);
        }
      };
      fetchData();
    }
  }, [id, navigate, pesananFromState, tanggalFromState, nomorSuratJalan, today]);

  // === VALIDASI & SUBMIT ===
  const handleSubmit = (e) => {
    e.preventDefault();
    setError(null);
    toast.dismiss();

    if (!tanggalPengiriman || tanggalPengiriman < today) {
      const msg = 'Tanggal pengiriman harus valid dan tidak boleh sebelum hari ini.';
      setError(msg);
      toast.error(msg);
      return;
    }
    if (!alamatTujuan || alamatTujuan === 'Alamat tidak tersedia') {
      const msg = 'Alamat tujuan tidak tersedia.';
      setError(msg);
      toast.error(msg);
      return;
    }
    if (nomorSuratJalan === 'ERROR-NO-IZIN') {
      const msg = 'Nomor Izin Produsen tidak ditemukan.';
      setError(msg);
      toast.error(msg);
      return;
    }

    setShowConfirmModal(true);
  };

  const handleConfirmSubmit = async () => {
    setShowConfirmModal(false);
    setIsSubmitting(true);
    const toastId = toast.loading('Memproses pengiriman...');

    try {
      const token = localStorage.getItem('token');
      if (!token) throw new Error('Sesi tidak valid.');

      const hashSuratJalan = `HASH_SJ_${nomorSuratJalan}_${Date.now()}`;

      // --- PERBAIKAN 2: Kirim catatanKurir & catatanPenerima ---
      const response = await axios.put(`http://localhost:5000/api/produsen/pesanan-masuk/${id}/status`, {
        status: 'Dikirim',
        nomorResi,
        nomorSuratJalan,
        tanggalPengiriman,
        alamatTujuan,
        waktuPengiriman,
        catatanKurir,     // <-- Diubah
        catatanPenerima,  // <-- Diubah
        hashSuratJalan,
        opsiPengiriman,
      }, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      // --- AKHIR PERBAIKAN 2 ---

      if (response.data.success) {
        toast.success('Berhasil!', { id: toastId });
        // Kirim juga catatan-catatan itu ke halaman Surat Jalan
        navigate(`/produsen/pengelolaan-pengiriman/surat-jalan/${id}`, {
          state: {
            nomorResi, nomorSuratJalan, pesanan, tanggalPengiriman,
            alamatTujuan, waktuPengiriman, 
            catatanKurir, catatanPenerima, // <-- Diubah
            hashSuratJalan,
            opsiPengiriman, currentDate: new Date().toISOString()
          },
        });
      } else {
        throw new Error(response.data.message || 'Gagal.');
      }
    } catch (err) {
      const errorMsg = err.response?.data?.message || err.message || 'Gagal mengatur pengiriman.';
      setError(errorMsg);
      toast.error(errorMsg, { id: toastId });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleLogout = () => {
    localStorage.clear();
    navigate('/');
  };

  // ... (Render Loading / Error / Kosong tidak berubah) ...
  if (isLoading) {
    return (
      <div className="flex flex-col justify-center items-center h-screen bg-gradient-to-br from-slate-50 via-white to-emerald-50">
        <div className="relative">
          <Loader2 className="animate-spin h-12 w-12 text-emerald-600" />
          <div className="absolute inset-0 h-12 w-12 rounded-full border-4 border-emerald-200 animate-ping opacity-20"></div>
        </div>
        <p className="mt-4 text-slate-700 font-medium">Memuat...</p>
      </div>
    );
  }

  if (error && !pesanan) {
    return (
      <div className="flex min-h-screen bg-gradient-to-br from-slate-50 via-white to-emerald-50">
        <SidebarProdusen isCollapsed={isCollapsed} setIsCollapsed={setIsCollapsed} />
        <div className={`flex-1 flex flex-col transition-all duration-300 ${isCollapsed ? 'ml-16' : 'ml-64'}`}>
          <NavbarProdusen onLogout={handleLogout} username={username} />
          <main className="flex-1 p-8 flex items-center justify-center">
            <div className="bg-white p-8 rounded-xl shadow-lg border border-red-200 text-center">
              <AlertCircle className="mx-auto h-12 w-12 text-red-500 mb-4" />
              <h2 className="text-xl font-bold text-red-800 mb-2">Gagal</h2>
              <p className="text-red-600 mb-6">{error}</p>
              <button onClick={() => navigate('/produsen/pengelolaan-pengiriman')} className="flex items-center gap-2 px-4 py-2.5 border border-slate-300 text-slate-700 font-medium rounded-lg hover:bg-slate-100 mx-auto">
                <ArrowLeft size={18} /> Kembali
              </button>
            </div>
          </main>
        </div>
      </div>
    );
  }

  if (!pesanan) {
    return (
      <div className="flex min-h-screen bg-gradient-to-br from-slate-50 via-white to-emerald-50">
        <SidebarProdusen isCollapsed={isCollapsed} setIsCollapsed={setIsCollapsed} />
        <div className={`flex-1 flex flex-col transition-all duration-300 ${isCollapsed ? 'ml-16' : 'ml-64'}`}>
          <NavbarProdusen onLogout={handleLogout} username={username} />
          <main className="flex-1 p-8 flex items-center justify-center">
            <div className="bg-white p-8 rounded-xl shadow-lg border border-slate-200 text-center">
              <FileText className="mx-auto h-12 w-12 text-yellow-500 mb-4" />
              <h2 className="text-xl font-bold text-slate-800 mb-2">Tidak Ditemukan</h2>
              <p className="text-slate-600 mb-6">Data hilang. Silakan refresh atau kembali.</p>
              <button onClick={() => navigate('/produsen/pengelolaan-pengiriman')} className="flex items-center gap-2 px-4 py-2.5 border border-slate-300 text-slate-700 font-medium rounded-lg hover:bg-slate-100 mx-auto">
                <ArrowLeft size={18} /> Kembali
              </button>
            </div>
          </main>
        </div>
      </div>
    );
  }

  // === RENDER UTAMA ===
  return (
    <div className="flex min-h-screen bg-gradient-to-br from-slate-50 via-white to-emerald-50">
      <ConfirmModal show={showConfirmModal} onClose={() => setShowConfirmModal(false)} onConfirm={handleConfirmSubmit} isLoading={isSubmitting} pesanan={pesanan} />
      <SidebarProdusen isCollapsed={isCollapsed} setIsCollapsed={setIsCollapsed} />
      <div className={`flex-1 flex flex-col transition-all duration-300 ${isCollapsed ? 'ml-16' : 'ml-64'}`}>
        <NavbarProdusen onLogout={handleLogout} username={username} />
        <main className="flex-1 overflow-auto pt-[72px] px-12 py-8">
          <div className="max-w-4xl mx-auto">

            {/* HEADER */}
            <div className="mb-10 relative">
              <div className="absolute -top-20 -left-20 w-72 h-72 bg-emerald-200 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob"></div>
              <div className="absolute -top-20 -right-20 w-72 h-72 bg-teal-200 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000"></div>
              <div className="relative">
                <button onClick={() => navigate(-1)} className="mb-4 inline-flex items-center text-emerald-600 hover:text-emerald-700 text-sm font-medium">
                  <ArrowLeft size={16} className="mr-1" /> Kembali
                </button>
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl shadow-lg flex items-center justify-center">
                    <Truck className="text-white" size={24} />
                  </div>
                  <h1 className="text-4xl font-bold bg-gradient-to-r from-slate-900 via-emerald-900 to-teal-900 bg-clip-text text-transparent">
                    Rincian Pengiriman
                  </h1>
                </div>
                <p className="text-slate-600 text-lg mt-2">Konfirmasi sebelum cetak Surat Jalan.</p>
                <div className="flex items-center gap-2 mt-2 text-sm text-slate-500">
                  <Calendar size={16} />
                  <span>{currentDate}</span>
                </div>
              </div>
            </div>

            {error && (
              <div className="p-4 mb-6 bg-red-50 text-red-700 rounded-lg border border-red-200 text-sm font-medium flex items-center gap-2">
                <AlertCircle size={18} /> {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">

              {/* DOKUMEN */}
              <div className="bg-white rounded-lg border border-slate-200 shadow-sm">
                <div className="bg-gradient-to-r from-slate-50 to-slate-100 px-6 py-4 border-b border-slate-200">
                  <h2 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
                    <Hash size={20} /> Rincian Dokumen
                  </h2>
                </div>
                <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                  <InputField label="Nomor Resi" value={nomorResi} readOnly />
                  <InputField label="Nomor Surat Jalan" value={nomorSuratJalan} readOnly />
                </div>
              </div>

              {/* DETAIL */}
              <div className="bg-white rounded-lg border border-slate-200 shadow-sm">
                <div className="bg-gradient-to-r from-emerald-50 to-emerald-100 px-6 py-4 border-b border-slate-200">
                  <h2 className="text-lg font-semibold text-emerald-900 flex items-center gap-2">
                    <Truck size={20} /> Detail Pengiriman
                  </h2>
                </div>
                <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">Tanggal Pengiriman*</label>
                    <input
                      type="date"
                      value={tanggalPengiriman}
                      onChange={(e) => setTanggalPengiriman(e.target.value)}
                      min={today}
                      className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">Waktu Pengiriman*</label>
                    <div className="relative">
                      <select value={waktuPengiriman} onChange={e => setWaktuPengiriman(e.target.value)} className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent bg-white appearance-none pr-10">
                        <option value="09:00-12:00">Pagi (09:00 - 12:00)</option>
                        <option value="13:00-16:00">Siang (13:00 - 16:00)</option>
                        <option value="16:00-19:00">Sore (16:00 - 19:00)</option>
                      </select>
                      <ChevronDown size={20} className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 pointer-events-none" />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">Opsi Pengiriman*</label>
                    <div className="relative">
                      <select value={opsiPengiriman} onChange={e => setOpsiPengiriman(e.target.value)} className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent bg-white appearance-none pr-10">
                        <option value="standar">Standar (2-3 hari)</option>
                        <option value="ekspres">Ekspres (1 hari)</option>
                      </select>
                      <ChevronDown size={20} className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 pointer-events-none" />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">Alamat Tujuan*</label>
                    <input
                      type="text"
                      value={alamatTujuan}
                      onChange={e => setAlamatTujuan(e.target.value)}
                      className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                      required
                      disabled={alamatTujuan === 'Alamat tidak tersedia'}
                    />
                  </div>
                  
                  {/* --- PERBAIKAN 3: Ganti 1 textarea menjadi 2 --- */}
                  <div className="md:col-span-2 space-y-4">
                    <div>
                      <label htmlFor="catatan_kurir" className="block text-sm font-semibold text-slate-700 mb-2">
                        Catatan untuk Kurir (Opsional)
                      </label>
                      <textarea
                        id="catatan_kurir"
                        value={catatanKurir}
                        onChange={(e) => setCatatanKurir(e.target.value)}
                        rows={3}
                        className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent resize-none"
                        placeholder="Instruksi khusus untuk kurir, misal: 'Barang mudah pecah', 'Simpan di pendingin'"
                      />
                    </div>
                    <div>
                      <label htmlFor="catatan_penerima" className="block text-sm font-semibold text-slate-700 mb-2">
                        Catatan untuk Penerima (Opsional)
                      </label>
                      <textarea
                        id="catatan_penerima"
                        value={catatanPenerima}
                        onChange={(e) => setCatatanPenerima(e.target.value)}
                        rows={3}
                        className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent resize-none"
                        placeholder="Catatan internal untuk PBF, misal: 'Pengiriman parsial', 'Faktur terpisah'"
                      />
                    </div>
                  </div>
                  {/* --- AKHIR PERBAIKAN 3 --- */}
                  
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <button type="button" onClick={() => navigate(-1)} className="px-6 py-2.5 border border-slate-300 text-slate-700 font-medium rounded-lg hover:bg-slate-100">
                  Kembali
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || !tanggalPengiriman || !alamatTujuan || alamatTujuan === 'Alamat tidak tersedia' || nomorSuratJalan === 'ERROR-NO-IZIN'}
                  className="px-6 py-2.5 bg-emerald-600 text-white font-medium rounded-lg hover:bg-emerald-700 disabled:bg-slate-400 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {isSubmitting ? <Loader2 className="animate-spin" size={18} /> : <Check size={18} />}
                  {isSubmitting ? 'Menyimpan...' : 'Cetak Surat Jalan'}
                </button>
              </div>
            </form>
          </div>
        </main>
      </div>

      <style jsx>{`
        @keyframes blob { 0%, 100% { transform: translate(0,0) scale(1); } 33% { transform: translate(30px,-50px) scale(1.1); } 66% { transform: translate(-20px,20px) scale(0.9); } }
        .animate-blob { animation: blob 7s infinite; }
        .animation-delay-2000 { animation-delay: 2s; }
      `}</style>
    </div>
  );
};

const InputField = ({ label, readOnly = false, ...props }) => (
  <div>
    <label className="block text-sm font-semibold text-slate-700 mb-2">{label}</label>
    <input
      {...props}
      readOnly={readOnly}
      className={`w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent ${readOnly ? 'bg-slate-100 text-slate-500 cursor-not-allowed' : 'bg-white'}`}
    />
  </div>
);

export default RincianPengiriman;