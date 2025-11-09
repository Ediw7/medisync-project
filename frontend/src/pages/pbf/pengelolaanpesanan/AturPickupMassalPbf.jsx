import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import SidebarPbf from '../../../components/SidebarPbf';
import NavbarPbf from '../../../components/NavbarPbf';
import {
  Loader2,
  ArrowLeft,
  CalendarDays,
  Clock,
  Truck,
  FileText,
  AlertTriangle,
  Check,
  ChevronRight,
  Calendar,
  ChevronDown, // Ditambahkan
} from 'lucide-react';
import { toast } from 'react-hot-toast';

// --- (PERUBAHAN 1) ---
// Konfigurasi slot waktu, disamakan dengan AturPengiriman.jsx
const SHIPPING_TIMES_CONFIG = [
  { value: '09:00-12:00', label: 'Pagi (09:00 - 12:00)', startHour: 9 },
  { value: '13:00-16:00', label: 'Siang (13:00 - 16:00)', startHour: 13 },
  { value: '16:00-19:00', label: 'Sore (16:00 - 19:00)', startHour: 16 },
];

// --- (PERUBAHAN 2) ---
// Helper untuk format tanggal YYYY-MM-DD
const getLocalDateString = (date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

// --- (PERUBAHAN 3) ---
// Helper untuk mendapatkan waktu yang tersedia berdasarkan tanggal
const getAvailableTimesForDate = (dateString) => {
  const today = new Date();
  const todayString = getLocalDateString(today);

  if (dateString !== todayString) {
    return SHIPPING_TIMES_CONFIG; // Jika bukan hari ini, semua waktu tersedia
  }

  // Jika hari ini, filter waktu yang sudah lewat
  const currentHour = today.getHours();
  return SHIPPING_TIMES_CONFIG.filter((time) => time.startHour > currentHour);
};

// --- (PERUBAHAN 4) ---
// Helper untuk menghitung tanggal yang valid (Logika BARU)
const calculateShippingDates = () => {
  const dates = [];
  const now = new Date();
  let currentDate = new Date(now); // Mulai dari hari ini
  let addedDays = 0;

  while (addedDays < 6) {
    const dayOfWeek = currentDate.getDay();
    const dateString = getLocalDateString(currentDate);

    if (dayOfWeek !== 0 && dayOfWeek !== 6) { // Jika bukan weekend
      // Cek ketersediaan waktu
      const availableTimes = getAvailableTimesForDate(dateString);

      if (availableTimes.length > 0) { // Jika ada waktu tersedia di hari ini
        const day = currentDate.toLocaleDateString('id-ID', { weekday: 'long' });
        const dateNum = currentDate.getDate();
        const month = currentDate.toLocaleDateString('id-ID', { month: 'short' });
        dates.push({ day, dateNum, month, date: dateString });
        addedDays++;
      }
    }
    // Selalu maju ke hari berikutnya untuk iterasi selanjutnya
    currentDate.setDate(currentDate.getDate() + 1);
  }
  return dates;
};
// --- (AKHIR PERUBAHAN 4) ---


const AturPickupMassalPbf = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { selectedIds } = location.state || { selectedIds: [] };

  const [isCollapsed, setIsCollapsed] = useState(false);

  // --- (PERUBAHAN 5) ---
  // Ubah state default menjadi kosong, akan diisi oleh useEffect
  const [shippingDates, setShippingDates] = useState([]);
  const [selectedDate, setSelectedDate] = useState('');
  const [availableTimes, setAvailableTimes] = useState(SHIPPING_TIMES_CONFIG);
  const [waktuPengiriman, setWaktuPengiriman] = useState('');
  // --- (AKHIR PERUBAHAN 5) ---

  const [opsiPengiriman, setOpsiPengiriman] = useState('standar');
  const [catatanKurir, setCatatanKurir] = useState('');
  const [catatanPenerima, setCatatanPenerima] = useState('');
  const [error, setError] = useState('');
  const username = localStorage.getItem('username');

  // --- (PERUBAHAN 6) ---
  // useEffect untuk inisialisasi tanggal dan waktu saat komponen dimuat
  useEffect(() => {
    if (!selectedIds || selectedIds.length === 0) {
      toast.error('Tidak ada pesanan yang dipilih. Kembali ke halaman sebelumnya.');
      navigate(-1);
      return; // Hentikan eksekusi jika tidak ada ID
    }

    // Hitung tanggal yang valid
    const initialDates = calculateShippingDates();
    setShippingDates(initialDates);

    if (initialDates.length > 0) {
      // Set tanggal pertama sebagai default
      const firstDate = initialDates[0].date;
      setSelectedDate(firstDate);

      // Set waktu yang tersedia untuk tanggal pertama
      const firstDateTimes = getAvailableTimesForDate(firstDate);
      setAvailableTimes(firstDateTimes);

      // Set waktu pertama sebagai default
      setWaktuPengiriman(firstDateTimes[0]?.value || '');
    }
  }, [selectedIds, navigate]);
  // --- (AKHIR PERUBAHAN 6) ---

  // --- (PERUBAHAN 7) ---
  // useEffect baru untuk memantau perubahan selectedDate
  useEffect(() => {
    if (!selectedDate) return; // Jangan lakukan apa-apa jika selectedDate kosong

    // Dapatkan waktu baru yang tersedia
    const newTimes = getAvailableTimesForDate(selectedDate);
    setAvailableTimes(newTimes);

    // Cek apakah waktuPengiriman saat ini masih valid di tanggal baru
    const isCurrentTimeValid = newTimes.some(
      (time) => time.value === waktuPengiriman
    );

    // Jika tidak valid (misal pindah dari besok 09:00 ke hari ini jam 14:00),
    // set ke waktu pertama yang tersedia
    if (!isCurrentTimeValid) {
      setWaktuPengiriman(newTimes[0]?.value || '');
    }
  }, [selectedDate]);
  // --- (AKHIR PERUBAHAN 7) ---


  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');

    if (!selectedDate || !waktuPengiriman) {
      const msg = 'Tanggal dan Waktu pengiriman wajib diisi.';
      setError(msg);
      toast.error(msg);
      return;
    }

    navigate('/pbf/pengelolaan-pesanan/konfirmasi-pengiriman-massal', {
      state: {
        selectedIds,
        tanggalPengiriman: selectedDate,
        waktuPengiriman,
        catatanKurir,
        catatanPenerima,
        opsiPengiriman,
      },
    });
  };

  const handleLogout = () => {
    localStorage.clear();
    navigate('/');
  };

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-slate-50 via-white to-emerald-50">
      <SidebarPbf isCollapsed={isCollapsed} setIsCollapsed={setIsCollapsed} />
      <div
        className={`flex-1 flex flex-col transition-all duration-300 ${isCollapsed ? 'ml-16' : 'ml-64'}`}
      >
        <NavbarPbf onLogout={handleLogout} username={username} />

        <main className="flex-1 overflow-auto pt-[72px] px-12 py-8">
          <div className="max-w-4xl mx-auto">
            {/* --- HEADER --- */}
            <div className="mb-10 relative">
              <div className="absolute -top-20 -left-20 w-72 h-72 bg-emerald-200 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob"></div>
              <div className="absolute -top-20 -right-20 w-72 h-72 bg-teal-200 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000"></div>

              <div className="relative">
                <button
                  onClick={() => navigate(-1)}
                  className="mb-4 inline-flex items-center text-emerald-600 hover:text-emerald-700 transition-colors text-sm font-medium"
                >
                  <ArrowLeft size={16} className="mr-1" /> Kembali ke Pilih Pesanan
                </button>
                <div className="flex items-center gap-3 mb-3">
                  <div className="flex items-center justify-center w-12 h-12 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl shadow-lg">
                    <CalendarDays className="text-white" size={24} />
                  </div>
                  <div>
                    <h1 className="text-4xl font-bold bg-gradient-to-r from-slate-900 via-emerald-900 to-teal-900 bg-clip-text text-transparent">
                      Atur Jadwal Pengiriman
                    </h1>
                  </div>
                </div>
                <p className="text-slate-600 text-lg mt-1">
                  Pilih tanggal dan waktu untuk{' '}
                  <span className="font-bold text-emerald-700">{selectedIds.length}</span> pesanan
                  terpilih.
                </p>
                <div className="flex items-center gap-2 mt-2 text-sm text-slate-500">
                  <Calendar size={16} />
                  <span>
                    {new Date().toLocaleDateString('id-ID', {
                      weekday: 'long',
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })}
                  </span>
                </div>
              </div>
            </div>

            {/* --- KARTU KONTEN --- */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden relative z-10">
              <div className="bg-slate-50 px-8 py-5 border-b border-slate-200 flex items-center gap-3">
                <FileText size={20} className="text-emerald-600 flex-shrink-0" />
                <div>
                  <h2 className="text-base font-semibold text-slate-800">
                    Detail Pengiriman Kargo
                  </h2>
                  <p className="text-sm text-slate-500">
                    Anda mengatur pengiriman untuk{' '}
                    <span className="font-bold">{selectedIds.length}</span> pesanan.
                  </p>
                </div>
              </div>

              <form onSubmit={handleSubmit} className="p-8 space-y-6">
                {/* TANGGAL */}
                <div>
                  <label className="block text-base font-semibold text-gray-800 mb-3">
                    Tanggal Pengiriman
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
                    {shippingDates.map((date, index) => (
                      <button
                        key={index}
                        type="button"
                        onClick={() => setSelectedDate(date.date)}
                        className={`text-center px-4 py-2 rounded-lg border transition-all duration-150 ${
                          selectedDate === date.date
                            ? 'bg-emerald-600 text-white border-emerald-600 shadow-md scale-105'
                            : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100 hover:border-slate-300'
                        }`}
                      >
                        <span className="font-semibold text-sm">{date.day}</span>
                        <br />
                        <span className="text-sm">
                          {date.dateNum} {date.month}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
                
                {/* WAKTU & OPSI */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-1">
                    <label
                      htmlFor="waktu-pengiriman"
                      className="block text-sm font-medium text-slate-700"
                    >
                      Pilih Waktu Pengiriman*
                    </label>
                    {/* --- (PERUBAHAN 8) --- */}
                    {/* Ganti <select> statis menjadi dinamis */}
                    <div className="relative">
                      <select
                        id="waktu-pengiriman"
                        value={waktuPengiriman}
                        onChange={(e) => setWaktuPengiriman(e.target.value)}
                        className="w-full appearance-none bg-white border border-slate-300 rounded-lg p-3 pr-10 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 disabled:bg-slate-100"
                        disabled={availableTimes.length === 0}
                      >
                        {availableTimes.length > 0 ? (
                          availableTimes.map((time) => (
                            <option key={time.value} value={time.value}>
                              {time.label}
                            </option>
                          ))
                        ) : (
                          <option value="" disabled>
                            Tidak ada waktu tersedia
                          </option>
                        )}
                      </select>
                      <ChevronDown
                        size={18}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
                      />
                    </div>
                    {/* --- (AKHIR PERUBAHAN 8) --- */}
                  </div>

                  <div className="space-y-1">
                    <label
                      htmlFor="opsi-pengiriman"
                      className="block text-sm font-medium text-slate-700"
                    >
                      Opsi Pengiriman*
                    </label>
                    {/* --- (PERUBAHAN 9) --- */}
                    {/* Tambahkan styling konsisten (Chevron) */}
                    <div className="relative">
                      <select
                        id="opsi-pengiriman"
                        value={opsiPengiriman}
                        onChange={(e) => setOpsiPengiriman(e.target.value)}
                        className="w-full appearance-none bg-white border border-slate-300 rounded-lg p-3 pr-10 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                      >
                        <option value="standar">Standar (Estimasi 2-3 hari)</option>
                        <option value="ekspres">Ekspres (Estimasi 1 hari)</option>
                      </select>
                      <ChevronDown
                        size={18}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
                      />
                    </div>
                    {/* --- (AKHIR PERUBAHAN 9) --- */}
                  </div>
                </div>

                {/* CATATAN (Sudah benar) */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-1">
                    <label htmlFor="catatan_kurir" className="block text-sm font-medium text-slate-700">
                      Catatan untuk Kurir (Opsional)
                    </label>
                    <textarea
                      id="catatan_kurir"
                      value={catatanKurir}
                      onChange={(e) => setCatatanKurir(e.target.value)}
                      className="w-full bg-white border border-slate-300 rounded-lg p-3 h-24 resize-none text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                      placeholder="Instruksi khusus untuk kurir..."
                    />
                  </div>
                  <div className="space-y-1">
                    <label htmlFor="catatan_penerima" className="block text-sm font-medium text-slate-700">
                      Catatan untuk Penerima (Opsional)
                    </label>
                    <textarea
                      id="catatan_penerima"
                      value={catatanPenerima}
                      onChange={(e) => setCatatanPenerima(e.target.value)}
                      className="w-full bg-white border border-slate-300 rounded-lg p-3 h-24 resize-none text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                      placeholder="Catatan internal untuk Apotek..."
                    />
                  </div>
                </div>

                {error && (
                  <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm flex items-center gap-2">
                    <AlertTriangle size={16} /> {error}
                  </div>
                )}

                {/* TOMBOL */}
                <div className="flex justify-end items-center gap-3 pt-4 border-t border-slate-200">
                  <button
                    type="button"
                    onClick={() => navigate(-1)}
                    className="py-2 px-5 bg-slate-100 text-slate-700 font-medium rounded-lg hover:bg-slate-200 transition text-sm"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    className="py-2 px-5 bg-emerald-600 text-white font-medium rounded-lg hover:bg-emerald-700 transition flex items-center gap-1.5 text-sm"
                  >
                    Lanjutkan <ChevronRight size={16} />
                  </button>
                </div>
              </form>
            </div>
          </div>
        </main>
      </div>

      {/* STYLE BLOB */}
      <style jsx>{`
        @keyframes blob {
          0%,
          100% {
            transform: translate(0, 0) scale(1);
          }
          33% {
            transform: translate(30px, -50px) scale(1.1);
          }
          66% {
            transform: translate(-20px, 20px) scale(0.9);
          }
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

export default AturPickupMassalPbf;