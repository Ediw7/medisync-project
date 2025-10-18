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
  const [tanggalPengiriman, setTanggalPengiriman] = useState(new Date().toISOString().split('T')[0]);
  const [waktuPengiriman, setWaktuPengiriman] = useState('');
  const [opsiPengiriman, setOpsiPengiriman] = useState('standar');
  const [catatan, setCatatan] = useState('');
  const [error, setError] = useState('');

  // --- PERBAIKAN: useMemo didefinisikan DI SINI, sebelum digunakan ---
  const availableTimeSlots = useMemo(() => {
    const today = new Date().toISOString().split('T')[0];
    if (tanggalPengiriman > today) {
      return allTimeSlots;
    }
    if (tanggalPengiriman === today) {
      const currentHour = new Date().getHours();
      return allTimeSlots.filter(slot => currentHour < slot.endHour);
    }
    return [];
  }, [tanggalPengiriman]);

  // useEffect untuk mereset waktu pengiriman
  useEffect(() => {
    const isCurrentTimeValid = availableTimeSlots.some(slot => slot.value === waktuPengiriman);
    if (!isCurrentTimeValid) {
      setWaktuPengiriman(availableTimeSlots[0]?.value || '');
    }
  }, [availableTimeSlots, waktuPengiriman]); // Dependency sudah benar

  // useEffect untuk validasi ID yang dipilih
  useEffect(() => {
    if (selectedIds.length === 0) {
      alert('Tidak ada pesanan yang dipilih. Anda akan dikembalikan.');
      navigate('/pbf/pengelolaan-pesanan/pengiriman-massal');
    }
  }, [selectedIds, navigate]);

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');

    if (!tanggalPengiriman || !waktuPengiriman) {
      setError('Tanggal dan Waktu pengiriman wajib diisi.');
      return;
    }

    navigate('/pbf/pengelolaan-pesanan/konfirmasi-pengiriman-massal', {
      state: {
        selectedIds,
        tanggalPengiriman,
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
              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label htmlFor="tanggal-pengiriman" className="block text-base font-semibold text-gray-800 mb-3">Tanggal Pengiriman</label>
                  <input
                    type="date"
                    id="tanggal-pengiriman"
                    value={tanggalPengiriman}
                    onChange={(e) => setTanggalPengiriman(e.target.value)}
                    className="w-full sm:w-1/2 bg-white border border-gray-300 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    min={new Date().toISOString().split('T')[0]}
                  />
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