import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, Link, useLocation } from 'react-router-dom';
import SidebarProdusen from '../../../components/SidebarProdusen';
import NavbarProdusen from '../../../components/NavbarProdusen';
import { 
    Loader2, 
    Calendar, 
    Clock, 
    MapPin, 
    FileText, 
    ArrowLeft, 
    ExternalLink, 
    AlertTriangle, 
    Truck,
    ChevronDown
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import axios from 'axios';

const AturPengiriman = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [pesanan, setPesanan] = useState(null);
  
  const [waktuPengiriman, setWaktuPengiriman] = useState(location.state?.waktuPengiriman || '09:00-12:00');
  const [opsiPengiriman, setOpsiPengiriman] = useState(location.state?.opsiPengiriman || 'kargo');
  const [catatan, setCatatan] = useState(location.state?.catatan || '');
  const username = localStorage.getItem('username');

  // === FUNGSI TANGGAL LOKAL (WIB) — AMAN DARI TIMEZONE ===
  const getLocalDateString = (date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  // === GENERATE 5 HARI KERJA BERIKUTNYA (LOKAL WIB) ===
  const calculateShippingDates = (orderDate) => {
    const dates = [];
    const startDate = new Date(orderDate);
    
    if (isNaN(startDate.getTime())) {
      console.error("Invalid orderDate, fallback to today");
      startDate.setTime(new Date().getTime());
    }
    
    let currentDate = new Date(startDate);

    while (dates.length < 5) {
      currentDate.setDate(currentDate.getDate() + 1);
      const dayOfWeek = currentDate.getDay();

      if (dayOfWeek !== 0 && dayOfWeek !== 6) {
        const formattedDate = getLocalDateString(currentDate); // LOKAL
        const dayName = currentDate.toLocaleDateString('id-ID', { weekday: 'short' });
        const displayDate = `${String(currentDate.getDate()).padStart(2, '0')}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-${currentDate.getFullYear()}`;

        dates.push({ day: dayName, date: formattedDate, displayDate });
      }
    }
    return dates;
  };

  const [shippingDates, setShippingDates] = useState([]);
  const [selectedDate, setSelectedDate] = useState(location.state?.tanggalPengiriman || '');

  // === FETCH DATA ===
  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    let token;
    try {
      token = localStorage.getItem('token');
      if (!token) {
        navigate('/login/produsen');
        toast.error('Silakan login terlebih dahulu.');
        return;
      }

      const response = await axios.get(`http://localhost:5000/api/produsen/pesanan-masuk/${id}`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });

      if (response.data.success && response.data.data?.pesanan) {
        const orderDate = response.data.data.pesanan.tanggal_pesanan;
        setPesanan(response.data.data.pesanan);
        const dates = calculateShippingDates(orderDate);
        setShippingDates(dates);
        if (dates.length > 0 && !selectedDate) {
          setSelectedDate(dates[0].date);
        }
      } else {
        throw new Error(response.data.message || 'Data pesanan tidak valid.');
      }

    } catch (err) {
      const errorMsg = err.response?.data?.message || err.message || 'Gagal memuat data.';
      setError(errorMsg);
      toast.error(errorMsg);
      if (errorMsg.includes('401') || errorMsg.includes('403') || errorMsg.includes('login')) {
        navigate('/login/produsen');
      }
    } finally {
      setIsLoading(false);
    }
  }, [id, navigate, selectedDate]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleLogout = () => {
    localStorage.clear();
    navigate('/');
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setError(null);
    toast.dismiss();

    if (!selectedDate || !waktuPengiriman) {
      const msg = 'Tanggal dan Waktu pengiriman wajib dipilih.';
      setError(msg);
      toast.error(msg);
      return;
    }

    if (!pesanan) {
      const msg = 'Data pesanan belum dimuat.';
      setError(msg);
      toast.error(msg);
      return;
    }

    navigate(`/produsen/pengelolaan-pengiriman/rincian-pengiriman/${id}`, {
      state: {
        pesanan,
        tanggalPengiriman: selectedDate, // STRING LOKAL: "2025-11-07"
        waktuPengiriman,
        catatan,
        opsiPengiriman
      },
    });
  };

  // === RENDER LOADING ===
  if (isLoading) {
    return (
      <div className="flex flex-col justify-center items-center h-screen bg-gradient-to-br from-slate-50 via-white to-emerald-50">
        <div className="relative">
          <Loader2 className="animate-spin h-12 w-12 text-emerald-600" />
          <div className="absolute inset-0 h-12 w-12 rounded-full border-4 border-emerald-200 animate-ping opacity-20"></div>
        </div>
        <p className="mt-4 text-slate-700 font-medium">Memuat data pesanan...</p>
      </div>
    );
  }

  // === RENDER ERROR ===
  if (error && !pesanan) {
    return (
      <div className="flex min-h-screen bg-slate-50">
        <SidebarProdusen isCollapsed={isCollapsed} setIsCollapsed={setIsCollapsed} />
        <div className={`flex-1 flex flex-col transition-all duration-300 ${isCollapsed ? 'ml-16' : 'ml-64'}`}>
          <NavbarProdusen onLogout={handleLogout} username={username} />
          <main className="flex-1 flex items-center justify-center p-6 pt-[72px]">
            <div className="bg-white p-8 rounded-xl shadow-lg border border-red-200 text-center max-w-md">
              <AlertTriangle className="mx-auto h-12 w-12 text-red-500 mb-4" />
              <h2 className="text-xl font-bold text-red-800 mb-2">Gagal Memuat Data</h2>
              <p className="text-red-600 mb-6">{error}</p>
              <button
                onClick={() => navigate('/produsen/pengelolaan-pengiriman')}
                className="flex items-center gap-2 px-4 py-2.5 border border-slate-300 text-slate-700 font-medium rounded-lg hover:bg-slate-100 transition mx-auto"
              >
                <ArrowLeft size={18} />
                Kembali
              </button>
            </div>
          </main>
        </div>
      </div>
    );
  }

  // === RENDER UTAMA ===
  return (
    <div className="flex min-h-screen bg-slate-50">
      <SidebarProdusen isCollapsed={isCollapsed} setIsCollapsed={setIsCollapsed} />
      <div className={`flex-1 flex flex-col transition-all duration-300 ${isCollapsed ? "ml-16" : "ml-64"}`}>
        <NavbarProdusen onLogout={handleLogout} username={username} />

        <main className="flex-1 overflow-auto pt-[72px] px-12 py-8">
          <div className="max-w-4xl mx-auto">

            {/* HEADER */}
            <div className="mb-8">
              <button
                onClick={() => navigate(-1)}
                className="mb-4 inline-flex items-center text-emerald-600 hover:text-emerald-700 transition-colors text-sm font-medium"
              >
                <ArrowLeft size={16} className="mr-1" /> Kembali
              </button>
              
              <div className="flex items-center gap-3 mb-3">
                <div className="flex items-center justify-center w-12 h-12 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl shadow-lg">
                  <Truck className="text-white" size={24} />
                </div>
                <div>
                  <h1 className="text-4xl font-bold bg-gradient-to-r from-slate-900 via-emerald-900 to-teal-900 bg-clip-text text-transparent">
                    Atur Pengiriman
                  </h1>
                  <p className="text-slate-600 text-lg flex items-center gap-2">
                    Pilih jadwal pengiriman untuk pesanan <span className="font-semibold">#{String(pesanan?.id).padStart(6, '0')}</span>
                  </p>
                </div>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">

              {/* JADWAL PENGIRIMAN */}
              <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
                <div className="bg-gradient-to-r from-emerald-50 to-emerald-100 px-6 py-4 border-b border-slate-200">
                  <h2 className="text-lg font-semibold text-emerald-900 flex items-center gap-2">
                    <Calendar size={20} /> Jadwal Pengiriman
                  </h2>
          
                </div>

                <div className="p-6 space-y-6">
                  <div>
                    <label className="block text-base font-semibold text-gray-800 mb-3">Tanggal Pengiriman</label>
                    <div className="flex space-x-2">
                      {shippingDates.map(({ day, date, displayDate }, index) => (
                        <button
                          key={index}
                          type="button"
                          onClick={() => setSelectedDate(date)}
                          className={`px-4 py-2 rounded-lg border ${
                            selectedDate === date
                              ? 'bg-emerald-600 text-white border-emerald-600'
                              : 'bg-gray-100 text-gray-700 border-gray-300 hover:bg-gray-200'
                          }`}
                        >
                          <span className="font-semibold block text-sm">{day}</span>
                          <span className="block text-x">{displayDate}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label htmlFor="waktu-pengiriman" className="block text-sm font-semibold text-slate-700 mb-2">Waktu Pengiriman*</label>
                    <div className="relative w-full md:w-2/3">
                      <select
                        id="waktu-pengiriman"
                        value={waktuPengiriman}
                        onChange={(e) => setWaktuPengiriman(e.target.value)}
                        className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent bg-white appearance-none pr-10"
                        required
                      >
                        <option value="09:00-12:00">Pagi (09:00 - 12:00)</option>
                        <option value="13:00-16:00">Siang (13:00 - 16:00)</option>
                        <option value="16:00-19:00">Sore (16:00 - 19:00)</option>
                      </select>
                      <ChevronDown size={20} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                    </div>
                  </div>
                </div>
              </div>

              {/* ALAMAT & CATATAN */}
              <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
                <div className="bg-gradient-to-r from-slate-50 to-slate-100 px-6 py-4 border-b border-slate-200">
                  <h2 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
                    <MapPin size={20} /> Informasi Tujuan & Catatan
                  </h2>
                </div>
                <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">Alamat Tujuan (PBF)</label>
                    <div className="bg-slate-50 p-4 rounded-lg border border-slate-200 space-y-1 text-sm text-slate-700 h-full">
                      <p className="font-semibold text-slate-800">{pesanan?.nama_pbf || 'Memuat...'}</p>
                      <p>{pesanan?.alamat_pbf || '...'}</p>
                      <p>Kontak: {pesanan?.kontak_telepon || '...'}</p>
                      <p>Distribusi ke: {pesanan?.tujuan_distribusi || '...'}</p>
                    </div>
                  </div>
                  <div>
                    <label htmlFor="catatan" className="block text-sm font-semibold text-slate-700 mb-2">Catatan Pengiriman (Opsional)</label>
                    <textarea
                      id="catatan"
                      value={catatan}
                      onChange={(e) => setCatatan(e.target.value)}
                      rows={5}
                      className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent resize-none"
                      placeholder="Instruksi khusus untuk kurir..."
                    />
                  </div>
                </div>
              </div>

              {/* RINGKASAN */}
              <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
                <div className="bg-slate-50 px-6 py-4 border-b border-slate-200">
                  <h2 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
                    <FileText size={20} /> Ringkasan Pesanan
                  </h2>
                </div>
                <div className="p-6 bg-slate-50 rounded-b-lg">
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div>
                      <p className="text-xs font-medium text-slate-500 mb-1">ID Pesanan</p>
                      <p className="text-lg font-bold text-slate-800">#{String(pesanan?.id).padStart(6, '0')}</p>
                    </div>
                    <div>
                      <p className="text-xs font-medium text-slate-500 mb-1">Surat Pesanan</p>
                      <Link
                        to={`/produsen/pengelolaan-pengiriman/detail/${pesanan?.id}/surat`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm font-medium text-emerald-600 hover:underline inline-flex items-center gap-1"
                      >
                        Lihat Dokumen <ExternalLink size={14} />
                      </Link>
                    </div>
                    <div className="text-left sm:text-right">
                      <p className="text-xs font-medium text-slate-500 mb-1">Total Pembayaran</p>
                      <p className="text-lg font-bold text-emerald-700 flex items-center gap-1">
                        Rp. {pesanan?.total_harga?.toLocaleString('id-ID', { minimumFractionDigits: 0 }) || '...'}
                      </p>
                      <p className="text-xs text-slate-500 mt-0.5">Metode: Transfer Bank</p>
                    </div>
                  </div>
                </div>
              </div>

              {error && (
                <div className="p-4 bg-red-50 text-red-700 rounded-lg border border-red-200 text-sm font-medium flex items-center gap-2">
                  <AlertTriangle size={18} /> {error}
                </div>
              )}

              <div className="flex justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => navigate(-1)}
                  className="px-6 py-2.5 border border-slate-300 text-slate-700 font-medium rounded-lg hover:bg-slate-100 transition"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 bg-emerald-600 text-white font-medium rounded-lg hover:bg-emerald-700 transition disabled:bg-slate-400 disabled:cursor-not-allowed flex items-center gap-2"
                  disabled={isLoading || !pesanan}
                >
                  Lanjut ke Rincian
                </button>
              </div>
            </form>
          </div>
        </main>
      </div>

      <style jsx global>{`
        select.appearance-none {
          -webkit-appearance: none;
          -moz-appearance: none;
          appearance: none;
        }
      `}</style>
    </div>
  );
};

export default AturPengiriman;