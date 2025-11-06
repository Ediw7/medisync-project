import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate, useLocation } from 'react-router-dom';
import SidebarPbf from '../../../components/SidebarPbf';
import NavbarPbf from '../../../components/NavbarPbf';
import {
  Loader2,
  ArrowLeft,
  FileText,
  Hash,
  Calendar,
  Clock,
  MapPin,
  Edit3,
  Check,
  AlertCircle,
  ExternalLink,
  DollarSign,
  Truck,
  Shield,
  XCircle,
  ChevronDown,
  AlertTriangle
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import axios from 'axios';

// ... (Komponen ConfirmModal, generateProNumber, generateSuratJalanNumber - TIDAK BERUBAH) ...
const ConfirmModal = ({ show, onClose, onConfirm, isLoading, pesanan }) => {
  if (!show) return null;
  return (
    <div
      className="fixed inset-0 bg-black/20 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div
        className="bg-white p-8 rounded-xl shadow-2xl max-w-sm w-full mx-auto animate-in fade-in zoom-in-95 duration-200 border border-slate-200"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-3 mb-4 text-emerald-600">
          <Truck size={28} className="flex-shrink-0" />
          <h3 className="font-bold text-lg text-slate-800">Konfirmasi Pengiriman</h3>
        </div>
        <p className="text-slate-700 mb-6 leading-relaxed">
          Anda yakin ingin mengirim pesanan <strong>#{String(pesanan?.id).padStart(6, '0')}</strong> ke <strong>{pesanan?.nama_apotek}</strong>?
          <br/><br/>
          Tindakan ini akan mengubah status menjadi "Dikirim" dan mencatatnya ke blockchain.
        </p>
        <div className="flex justify-end gap-3">
          <button
            onClick={onClose}
            disabled={isLoading}
            className="px-6 py-2.5 font-medium rounded-lg transition bg-slate-100 text-slate-700 hover:bg-slate-200 disabled:opacity-50"
          >
            Batal
          </button>
          <button
            onClick={onConfirm}
            disabled={isLoading}
            className={`px-6 py-2.5 font-medium rounded-lg transition flex items-center gap-2 ${
              isLoading
                ? "bg-slate-400 cursor-not-allowed text-white"
                : "bg-emerald-600 text-white hover:bg-emerald-700 active:bg-emerald-800"
            }`}
          >
            {isLoading ? <Loader2 size={18} className="animate-spin" /> : <Check size={18} />}
            {isLoading ? 'Memproses...' : 'Ya, Kirim'}
          </button>
        </div>
      </div>
    </div>
  );
};
const generateProNumber = (prefix, orderId) => {
  const date = new Date();
  const year = date.getFullYear().toString().slice(-2);
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const day = date.getDate().toString().padStart(2, '0');
  const timestamp = date.getTime().toString().slice(-4);
  const paddedOrderId = String(orderId).padStart(3, '0');
  return `${prefix}-${year}${month}${day}-${paddedOrderId}-${timestamp}`;
};
const generateSuratJalanNumber = (orderId) => {
  // --- PERBAIKAN: Gunakan 'nomor_izin' dari localStorage ---
  const nomorIzin = localStorage.getItem('nomorIzin') || 'NO-IZIN'; // Ambil nomor izin PBF
  const date = new Date();
  const year = date.getFullYear().toString().slice(-2);
  const month = date.getMonth() + 1;
  const monthRoman = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI', 'XII'][month - 1];
  const paddedOrderId = String(orderId).padStart(6, '0');
  return `SJ/${paddedOrderId}/${nomorIzin}/${monthRoman}/${year}`;
};


// --- KOMPONEN UTAMA ---
const RincianPengirimanApotek = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();

  const [isCollapsed, setIsCollapsed] = useState(false);
  const [pesanan, setPesanan] = useState(null);
  const [detailPesanan, setDetailPesanan] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const username = localStorage.getItem('username');

  const [nomorResi] = useState(() => id ? generateProNumber('RESPBF', id) : 'INVALID-ID');
  const [nomorSuratJalan] = useState(() => id ? generateSuratJalanNumber(id) : 'INVALID-ID');

  // --- PERBAIKAN 1: Ambil catatanKurir & catatanPenerima ---
  const {
    pesanan: pesananFromState,
    tanggalPengiriman: tanggalFromState,
    waktuPengiriman: waktuFromState,
    catatanKurir: catatanKurirFromState,
    catatanPenerima: catatanPenerimaFromState,
    opsiPengiriman: opsiFromState
  } = location.state || {};

  const [opsiPengiriman, setOpsiPengiriman] = useState(opsiFromState || 'standar');
  const [catatanKurir, setCatatanKurir] = useState(catatanKurirFromState || '');
  const [catatanPenerima, setCatatanPenerima] = useState(catatanPenerimaFromState || '');
  const [tanggalPengiriman, setTanggalPengiriman] = useState(tanggalFromState || '');
  const [waktuPengiriman, setWaktuPengiriman] = useState(waktuFromState || '09:00-12:00');
  // --- AKHIR PERBAIKAN 1 ---
  
  const [alamatTujuan, setAlamatTujuan] = useState('');

  const currentDate = new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });

  useEffect(() => {
    // Cek nomor izin PBF di localStorage
    if (!localStorage.getItem('nomorIzin')) {
       setError("Nomor Izin PBF tidak ditemukan di localStorage. Silakan logout dan login kembali.");
       toast.error("Nomor Izin PBF tidak ditemukan.");
    }
    
    if (pesananFromState) {
      setPesanan(pesananFromState);
      setAlamatTujuan(pesananFromState.alamat_apotek || 'Alamat tidak tersedia');
      setIsLoading(false);

      if (nomorSuratJalan.includes('NO-IZIN')) {
        setError("Nomor Izin PBF tidak ditemukan. Silakan logout dan login kembali.");
        toast.error("Nomor Izin PBF tidak ditemukan.");
      }
    } else {
      // (Logika fetchData tidak berubah, sudah benar)
      const fetchData = async () => {
        setIsLoading(true);
        setError(null);
        let token;
        try {
          token = localStorage.getItem('token');
          if (!token) throw new Error('Silakan login terlebih dahulu');

          const response = await axios.get(`http://localhost:5000/api/pbf/pesanan-apotek/${id}`, {
            headers: { 'Authorization': `Bearer ${token}` },
          });

          if (!response.data.success || !response.data.data) {
            throw new Error(response.data.message || 'Data pesanan tidak tersedia');
          }

          const { pesanan, detail_pesanan } = response.data.data;
          setPesanan(pesanan);
          setDetailPesanan(detail_pesanan || []);
          setAlamatTujuan(pesanan.alamat_apotek || 'Alamat tidak tersedia');

          if (!detail_pesanan || detail_pesanan.length === 0 || detail_pesanan.some(item => !item.id_aset_blockchain)) {
            setError("Data pesanan tidak lengkap. ID Aset Blockchain untuk satu atau lebih item tidak ditemukan.");
            toast.error("ID Aset Blockchain tidak lengkap.");
          }
          
          if (!tanggalFromState) {
            setTanggalPengiriman(new Date().toISOString().split('T')[0]); // Set default ke hari ini
          }

        } catch (error) {
          const errorMsg = error.response?.data?.message || error.message || 'Gagal memuat data pesanan.';
          setError(errorMsg);
          toast.error(errorMsg);
          if (errorMsg.includes('login') || error.response?.status === 401) {
            navigate('/login/pbf');
          }
        } finally {
          setIsLoading(false);
        }
      };
      fetchData();
    }
  }, [id, navigate, pesananFromState, nomorSuratJalan, tanggalFromState]);

  const handleSubmit = (e) => {
    e.preventDefault();
    setError(null);
    toast.dismiss();

    const tanggalPengirimanDate = new Date(tanggalPengiriman);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (!tanggalPengiriman || isNaN(tanggalPengirimanDate.getTime()) || tanggalPengirimanDate < today) {
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
    if (detailPesanan.some(item => !item.id_aset_blockchain)) {
      const msg = 'ID Aset Blockchain tidak lengkap.';
      setError(msg);
      toast.error(msg);
      return;
    }
    if (nomorSuratJalan.includes('NO-IZIN')) {
      const msg = 'Nomor Izin PBF tidak ditemukan.';
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

      const hashSuratJalan = `HASH_SJPBF_${nomorSuratJalan}_${Date.now()}`;

      // --- PERBAIKAN 2: Kirim dua catatan ke payload ---
      const payload = {
        status: 'Dikirim',
        nomorResi,
        nomorSuratJalan,
        tanggalPengiriman,
        alamatTujuan,
        waktuPengiriman,
        catatanKurir,
        catatanPenerima,
        hashSuratJalan,
        opsiPengiriman
      };
      // --- AKHIR PERBAIKAN 2 ---

      const response = await axios.put(`http://localhost:5000/api/pbf/pesanan-apotek/${id}/atur-pengiriman`, payload, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.data.success) {
        toast.success('Surat jalan berhasil dibuat dan data disimpan ke blockchain.', { id: toastId });
        // --- PERBAIKAN 3: Kirim dua catatan ke state navigasi ---
        navigate(`/pbf/pengelolaan-pesanan/surat-jalan/${id}`, {
          state: {
            nomorResi,
            nomorSuratJalan,
            pesanan,
            tanggalPengiriman,
            alamatTujuan,
            waktuPengiriman,
            catatanKurir,
            catatanPenerima,
            hashSuratJalan,
            opsiPengiriman,
            currentDate: new Date().toISOString()
          },
        });
        // --- AKHIR PERBAIKAN 3 ---
      } else {
        throw new Error(response.data.message || 'Gagal mengatur pengiriman.');
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

  // ... (Render Loading, Error, Kosong - TIDAK BERUBAH) ...
  if (isLoading) {
    return (
      <div className="flex flex-col justify-center items-center h-screen bg-gradient-to-br from-slate-50 via-white to-emerald-50">
        <div className="relative">
          <Loader2 className="animate-spin h-12 w-12 text-emerald-600" />
          <div className="absolute inset-0 h-12 w-12 rounded-full border-4 border-emerald-200 animate-ping opacity-20"></div>
        </div>
        <p className="mt-4 text-slate-700 font-medium">Memuat Rincian Pengiriman...</p>
      </div>
    );
  }
  if (error && !pesanan) {
    return (
      <div className="flex min-h-screen bg-gradient-to-br from-slate-50 via-white to-emerald-50">
        <SidebarPbf isCollapsed={isCollapsed} setIsCollapsed={setIsCollapsed} />
        <div className={`flex-1 flex flex-col transition-all duration-300 ${isCollapsed ? 'ml-16' : 'ml-64'}`}>
          <NavbarPbf onLogout={handleLogout} username={username} />
          <main className="flex-1 overflow-auto pt-[72px] px-12 py-8 flex items-center justify-center p-6">
            <div className="bg-white p-8 rounded-xl shadow-lg border border-red-200 text-center">
              <AlertCircle className="mx-auto h-12 w-12 text-red-500 mb-4" />
              <h2 className="text-xl font-bold text-red-800 mb-2">Gagal Memuat Data</h2>
              <p className="text-red-600 mb-6">{error}</p>
              <button
                onClick={() => navigate('/pbf/pengelolaan-pesanan')}
                className="flex items-center gap-2 px-4 py-2.5 border border-slate-300 text-slate-700 font-medium rounded-lg hover:bg-slate-100 transition mx-auto"
              >
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
        <SidebarPbf isCollapsed={isCollapsed} setIsCollapsed={setIsCollapsed} />
        <div className={`flex-1 flex flex-col transition-all duration-300 ${isCollapsed ? 'ml-16' : 'ml-64'}`}>
          <NavbarPbf onLogout={handleLogout} username={username} />
          <main className="flex-1 overflow-auto pt-[72px] px-12 py-8 flex items-center justify-center p-6">
            <div className="bg-white p-8 rounded-xl shadow-lg border border-slate-200 text-center">
              <FileText className="mx-auto h-12 w-12 text-yellow-500 mb-4" />
              <h2 className="text-xl font-bold text-slate-800 mb-2">Data Pesanan Tidak Ditemukan</h2>
              <p className="text-slate-600 mb-6">Data pesanan mungkin hilang atau halaman di-refresh.</p>
              <button
                onClick={() => navigate('/pbf/pengelolaan-pesanan')}
                className="flex items-center gap-2 px-4 py-2.5 border border-slate-300 text-slate-700 font-medium rounded-lg hover:bg-slate-100 transition mx-auto"
              >
                <ArrowLeft size={18} /> Kembali
              </button>
            </div>
          </main>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-slate-50 via-white to-emerald-50">
      <ConfirmModal
        show={showConfirmModal}
        onClose={() => setShowConfirmModal(false)}
        onConfirm={handleConfirmSubmit}
        isLoading={isSubmitting}
        pesanan={pesanan}
      />
      <SidebarPbf isCollapsed={isCollapsed} setIsCollapsed={setIsCollapsed} />
      <div className={`flex-1 flex flex-col transition-all duration-300 ${isCollapsed ? 'ml-16' : 'ml-64'}`}>
        <NavbarPbf onLogout={handleLogout} username={username} />

        <main className="flex-1 overflow-auto pt-[72px] px-12 py-8">
          <div className="max-w-4xl mx-auto">

            {/* HEADER DENGAN BLOB */}
            <div className="mb-10 relative">
              <div className="absolute -top-20 -left-20 w-72 h-72 bg-emerald-200 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob"></div>
              <div className="absolute -top-20 -right-20 w-72 h-72 bg-teal-200 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000"></div>

              <div className="relative">
                <button
                  onClick={() => navigate(-1)}
                  className="mb-4 inline-flex items-center text-emerald-600 hover:text-emerald-700 transition-colors text-sm font-medium"
                >
                  <ArrowLeft size={16} className="mr-1" /> Kembali ke Atur Jadwal
                </button>
                <div className="flex items-center gap-3">
                  <div className="flex items-center justify-center w-12 h-12 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl shadow-lg">
                    <Truck className="text-white" size={24} />
                  </div>
                  <div>
                    <h1 className="text-4xl font-bold bg-gradient-to-r from-slate-900 via-emerald-900 to-teal-900 bg-clip-text text-transparent">
                      Rincian Pengiriman ke Apotek
                    </h1>
                  </div>
                </div>
                <p className="text-slate-600 text-lg mt-2">
                  Konfirmasi detail akhir sebelum mencetak Surat Jalan.
                </p>
                <div className="flex items-center gap-2 mt-2 text-sm text-slate-500">
                  <Calendar size={16} />
                  <span>{currentDate}</span>
                </div>
              </div>
            </div>

            {/* ERROR INLINE */}
            {error && (
              <div className="p-4 mb-6 bg-red-50 text-red-700 rounded-lg border border-red-200 text-sm font-medium flex items-center gap-2">
                <AlertTriangle size={18} /> {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6 relative z-10">

              {/* RINCIAN DOKUMEN */}
              <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
                <div className="bg-gradient-to-r from-slate-50 to-slate-100 px-6 py-4 border-b border-slate-200">
                  <h2 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
                    <Hash size={20} /> Rincian Dokumen
                  </h2>
                </div>
                <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                  <InputField label="Nomor Resi (Otomatis)" value={nomorResi} readOnly disabled />
                  <InputField label="Nomor Surat Jalan (Otomatis)" value={nomorSuratJalan} readOnly disabled />
                </div>
              </div>

              {/* DETAIL PENGIRIMAN */}
              <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
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
                      min={new Date().toISOString().split('T')[0]}
                      className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">Waktu Pengiriman*</label>
                    <div className="relative">
                      <select
                        value={waktuPengiriman}
                        onChange={(e) => setWaktuPengiriman(e.target.value)}
                        className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition bg-white appearance-none pr-10"
                      >
                        <option value="09:00-12:00">Pagi (09:00 - 12:00)</option>
                        <option value="13:00-16:00">Siang (13:00 - 16:00)</option>
                        <option value="16:00-19:00">Sore (16:00 - 19:00)</option>
                      </select>
                      <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-slate-400">
                        <ChevronDown size={20} />
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">Opsi Pengiriman*</label>
                    <div className="relative">
                      <select
                        value={opsiPengiriman}
                        onChange={(e) => setOpsiPengiriman(e.target.value)}
                        className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition bg-white appearance-none pr-10"
                      >
                        <option value="standar">Standar (2-3 hari)</option>
                        <option value="ekspres">Ekspres (1 hari)</option>
                      </select>
                      <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-slate-400">
                        <ChevronDown size={20} />
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">Alamat Tujuan*</label>
                    <input
                      type="text"
                      value={alamatTujuan}
                      onChange={(e) => setAlamatTujuan(e.target.value)}
                      className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition"
                      placeholder="Masukkan alamat tujuan"
                      required
                      disabled={alamatTujuan === 'Alamat tidak tersedia'}
                    />
                  </div>
                  
                  {/* --- PERBAIKAN 4: Ganti 1 textarea menjadi 2 --- */}
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
                        className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition resize-none"
                        placeholder="Instruksi khusus untuk kurir, misal: 'Barang mudah pecah'"
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
                        className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition resize-none"
                        placeholder="Catatan internal untuk Apotek, misal: 'Faktur terpisah'"
                      />
                    </div>
                  </div>
                  {/* --- AKHIR PERBAIKAN 4 --- */}
                  
                </div>
              </div>

              {/* TOMBOL AKSI */}
              <div className="flex justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => navigate(-1)}
                  className="px-6 py-2.5 border border-slate-300 text-slate-700 font-medium rounded-lg hover:bg-slate-100 transition"
                >
                  Kembali
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 bg-emerald-600 text-white font-medium rounded-lg hover:bg-emerald-700 transition disabled:bg-slate-400 disabled:cursor-not-allowed flex items-center gap-2"
                  disabled={isSubmitting || !tanggalPengiriman || !alamatTujuan || alamatTujuan === 'Alamat tidak tersedia' || nomorSuratJalan.includes('NO-IZIN')}
                >
                  {isSubmitting ? (
                    <Loader2 className="animate-spin" size={18} />
                  ) : (
                    <Check size={18} />
                  )}
                  {isSubmitting ? 'Menyimpan...' : 'Cetak Surat Jalan'}
                </button>
              </div>
            </form>
          </div>
        </main>
      </div>

      {/* ANIMASI BLOB */}
      <style jsx>{`
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

// --- REUSABLE INPUT ---
const InputField = ({ label, readOnly = false, ...props }) => (
  <div>
    <label className="block text-sm font-semibold text-slate-700 mb-2">{label}</label>
    <input
      {...props}
      readOnly={readOnly}
      className={`w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition ${readOnly ? 'bg-slate-100 text-slate-500 cursor-not-allowed' : 'bg-white'}`}
    />
  </div>
);

export default RincianPengirimanApotek;