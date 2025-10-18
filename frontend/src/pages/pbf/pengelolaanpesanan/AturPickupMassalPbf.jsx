import React, { useState, useEffect, useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import SidebarPbf from '../../../components/SidebarPbf';
import NavbarPbf from '../../../components/NavbarPbf';

// Daftar semua slot waktu kita definisikan di sini
const allTimeSlots = [
    { value: '09:00-12:00', label: 'Pagi (09:00 - 12:00)', endHour: 12 },
    { value: '13:00-16:00', label: 'Siang (13:00 - 16:00)', endHour: 16 },
];

const AturPickupMassalPbf = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { selectedIds } = location.state || { selectedIds: [] };

  const [isCollapsed, setIsCollapsed] = useState(false);
  const [waktuPengiriman, setWaktuPengiriman] = useState('');
  const [opsiPengiriman, setOpsiPengiriman] = useState('standar');
  const [catatan, setCatatan] = useState('');
  const [error, setError] = useState('');

  // --- LOGIKA BARU UNTUK DESAIN TANGGAL ---
  const calculateShippingDates = () => {
    const dates = [];
    const today = new Date();
    // Tambahkan hari ini ke dalam pilihan
    dates.push({
      day: 'Hari Ini',
      date: today.toISOString().split('T')[0],
      display: `${today.getDate()} ${today.toLocaleString('id-ID', { month: 'short' })}`
    });
    for (let i = 1; i <= 5; i++) { // Tampilkan 5 hari ke depan
      const date = new Date(today);
      date.setDate(today.getDate() + i);
      dates.push({
        day: date.toLocaleDateString('id-ID', { weekday: 'long' }),
        date: date.toISOString().split('T')[0],
        display: `${date.getDate()} ${date.toLocaleString('id-ID', { month: 'short' })}`
      });
    }
    return dates;
  };

  const [shippingDates] = useState(calculateShippingDates());
  const [selectedDate, setSelectedDate] = useState(shippingDates[0]?.date || '');
  
  // --- LOGIKA VALIDASI WAKTU (TIDAK BERUBAH) ---
  const availableTimeSlots = useMemo(() => {
    const today = new Date().toISOString().split('T')[0];
    if (selectedDate > today) return allTimeSlots;
    if (selectedDate === today) {
      const currentHour = new Date().getHours();
      return allTimeSlots.filter(slot => currentHour < slot.endHour);
    }
    return [];
  }, [selectedDate]);

  useEffect(() => {
    const isCurrentTimeValid = availableTimeSlots.some(slot => slot.value === waktuPengiriman);
    if (!isCurrentTimeValid) {
      setWaktuPengiriman(availableTimeSlots[0]?.value || '');
    }
  }, [availableTimeSlots, waktuPengiriman]);

  useEffect(() => {
    if (selectedIds.length === 0) {
      alert('Tidak ada pesanan yang dipilih. Anda akan dikembalikan.');
      navigate('/pbf/pengelolaan-pesanan/pengiriman-massal');
    }
  }, [selectedIds, navigate]);

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');

    if (!selectedDate || !waktuPengiriman) {
      setError('Tanggal dan Waktu pengiriman yang valid wajib diisi.');
      return;
    }

    navigate('/pbf/pengelolaan-pesanan/konfirmasi-pengiriman-massal', {
      state: {
        selectedIds,
        tanggalPengiriman: selectedDate,
        waktuPengiriman,
        opsiPengiriman,
        catatan
      },
    });
  };

  return (
    <div className="flex min-h-screen bg-gray-50">
      <SidebarPbf isCollapsed={isCollapsed} setIsCollapsed={setIsCollapsed} />
      <div className={`flex-1 flex flex-col transition-all duration-300 ${isCollapsed ? 'ml-16' : 'ml-64'}`}>
        <NavbarPbf onLogout={() => { localStorage.clear(); navigate('/'); }} />
        <main className="flex-1 p-6 lg:p-8">
          <div className="max-w-4xl mx-auto">
            <div className="mb-6 pt-10">
              <h1 className="text-3xl font-bold text-gray-800">Atur Pengiriman Massal ke Apotek</h1>
              <p className="text-gray-500 mt-1">Lengkapi detail pengiriman untuk {selectedIds.length} pesanan terpilih.</p>
            </div>

            <div className="bg-white rounded-xl shadow-md p-8">
              <div className="flex items-center gap-4 mb-8 pb-6 border-b border-gray-200">
                  <div className="bg-emerald-100 p-3 rounded-lg">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                  </div>
                  <div>
                      <h2 className="text-xl font-semibold text-gray-800">Kami akan mengirimkan {selectedIds.length} Pesanan</h2>
                      <p className="text-gray-500">Mohon lengkapi informasi dan konfirmasi</p>
                  </div>
              </div>
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* --- DESAIN TANGGAL BARU --- */}
                <div>
                  <label className="block text-base font-semibold text-gray-800 mb-3">Tanggal Pengiriman</label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
                    {shippingDates.map((date, index) => (
                      <button
                        key={index}
                        type="button"
                        onClick={() => setSelectedDate(date.date)}
                        className={`text-center px-4 py-2 rounded-lg border transition-colors duration-200 ${selectedDate === date.date ? 'bg-emerald-600 text-white border-emerald-600' : 'bg-gray-100 text-gray-700 border-gray-300 hover:bg-gray-200'}`}
                      >
                        <span className="font-semibold">{date.day}</span><br />
                        <span className="text-xs">{date.display}</span>
                      </button>
                    ))}
                  </div>
                </div>
                
                <div>
                  <label htmlFor="waktu-pengiriman" className="block text-base font-semibold text-gray-800 mb-3">Waktu Pengiriman</label>
                  <select
                    id="waktu-pengiriman"
                    value={waktuPengiriman}
                    onChange={(e) => setWaktuPengiriman(e.target.value)}
                    className="w-full sm:w-1/2 appearance-none bg-white border border-gray-300 rounded-lg p-3 pr-10 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    disabled={availableTimeSlots.length === 0}
                  >
                    {availableTimeSlots.length > 0 ? (
                      availableTimeSlots.map(slot => (
                        <option key={slot.value} value={slot.value}>{slot.label}</option>
                      ))
                    ) : (
                      <option>Tidak ada slot waktu tersedia</option>
                    )}
                  </select>
                </div>

                <div>
                  <label htmlFor="opsi-pengiriman" className="block text-base font-semibold text-gray-800 mb-3">Opsi Pengiriman</label>
                  <select
                    id="opsi-pengiriman"
                    value={opsiPengiriman}
                    onChange={(e) => setOpsiPengiriman(e.target.value)}
                    className="w-full sm:w-1/2 appearance-none bg-white border border-gray-300 rounded-lg p-3 pr-10 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="standar">Standar (2-3 hari)</option>
                    <option value="ekspres">Ekspres (1 hari)</option>
                  </select>
                </div>

                <div>
                    <label htmlFor="catatan" className="block text-base font-semibold text-gray-800 mb-3">Catatan (Opsional)</label>
                    <textarea
                      id="catatan"
                      value={catatan}
                      onChange={(e) => setCatatan(e.target.value)}
                      className="w-full bg-gray-50 border border-gray-300 rounded-lg p-3 h-28 resize-none focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      placeholder="Contoh: Barang mudah pecah, harap ditangani dengan hati-hati."
                    />
                </div>

                {error && <div className="p-3 bg-red-100 text-red-700 rounded-lg text-sm">{error}</div>}

                <div className="flex justify-end gap-4 pt-4 border-t mt-8">
                  <button
                    type="button"
                    onClick={() => navigate(-1)}
                    className="py-2 px-6 bg-gray-200 text-gray-800 font-semibold rounded-lg hover:bg-gray-300"
                  >
                    Kembali
                  </button>
                  <button
                    type="submit"
                    className="py-2 px-6 bg-emerald-600 text-white font-semibold rounded-lg hover:bg-emerald-700"
                  >
                    Lanjutkan ke Konfirmasi
                  </button>
                </div>
              </form>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default AturPickupMassalPbf;