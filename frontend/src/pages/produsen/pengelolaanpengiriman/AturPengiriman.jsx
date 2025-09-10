import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import SidebarProdusen from '../../../components/SidebarProdusen';
import NavbarProdusen from '../../../components/NavbarProdusen';

const generateShippingDates = () => {
  const dates = [];
  const today = new Date('2025-09-04T11:32:00+07:00'); // Set to current date and time: Thursday, September 04, 2025, 11:32 AM WIB
  const dayNames = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];

  for (let i = 0; i < 6; i++) {
    const currentDate = new Date(today);
    currentDate.setDate(today.getDate() + i);
    
    const day = String(currentDate.getDate()).padStart(2, '0');
    const month = String(currentDate.getMonth() + 1).padStart(2, '0');
    const year = currentDate.getFullYear();
    
    dates.push({
      dayName: dayNames[currentDate.getDay()],
      fullDate: `${day}-${month}-${year}`,
      value: `${year}-${month}-${day}`,
    });
  }
  return dates;
};

const AturPengiriman = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [pesanan, setPesanan] = useState(null);
  const [tanggalPengiriman, setTanggalPengiriman] = useState('');
  const [waktuPengiriman, setWaktuPengiriman] = useState('01:00 PM');
  const [catatan, setCatatan] = useState('');

  const shippingDates = generateShippingDates();

  useEffect(() => {
    const fetchPesananData = async () => {
      setIsLoading(true);
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          navigate('/login');
          return;
        }

        const response = await fetch(`http://localhost:5000/api/produsen/pesanan-masuk/${id}`, {
          headers: { 'Authorization': `Bearer ${token}` },
        });

        if (!response.ok) throw new Error('Gagal mengambil data pesanan.');
        const result = await response.json();
        if (result.success) {
          setPesanan(result.data.pesanan);
          // Set default alamat tujuan from pesanan data if available
          if (result.data.pesanan.tujuan_distribusi) {
            setPesanan(prev => ({ ...prev, alamat_pbf: result.data.pesanan.tujuan_distribusi }));
          }
        } else {
          throw new Error(result.message || 'Data pesanan tidak ditemukan.');
        }
      } catch (err) {
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };

    fetchPesananData();
    if (shippingDates.length > 0) setTanggalPengiriman(shippingDates[0].value);
  }, [id, navigate]);

  const handleSubmit = (e) => {
    e.preventDefault();
    setError(null);

    if (!tanggalPengiriman || !waktuPengiriman) {
      setError('Tanggal dan Waktu pengiriman wajib diisi.');
      return;
    }
    
    if (!pesanan) {
      setError('Data pesanan belum dimuat, tidak bisa melanjutkan.');
      return;
    }
    

    navigate(`/produsen/pengelolaan-pengiriman/rincian-pengiriman/${id}`, {
      state: { pesanan, tanggalPengiriman, waktuPengiriman, catatan },
    });
  };

  if (isLoading) return <div className="flex justify-center items-center h-screen"><p>Loading data pesanan...</p></div>;
  if (error && !pesanan) return <div className="flex justify-center items-center h-screen"><p className="text-red-500">Error: {error}</p></div>;

  return (
    <div className="flex min-h-screen bg-gray-50">
      <SidebarProdusen isCollapsed={isCollapsed} setIsCollapsed={setIsCollapsed} />
      <div className={`flex-1 flex flex-col transition-all duration-300 ${isCollapsed ? 'ml-16' : 'ml-64'}`}>
        <NavbarProdusen onLogout={() => { localStorage.clear(); navigate('/'); }} />
        <main className="flex-1 p-6 lg:p-8">
          <div className="max-w-4xl mx-auto">
            <div className="mb-6 pt-10">
              <h1 className="text-3xl font-bold text-gray-800">Atur Pengiriman</h1>
              <p className="text-gray-500 mt-1">Opsi Pengiriman: Kargo</p>
            </div>

            <div className="bg-white rounded-xl shadow-md p-8">
              <div className="flex items-center gap-4 mb-8 pb-6 border-b border-gray-200">
                <div className="bg-emerald-100 p-3 rounded-lg">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-gray-800">Atur Pengiriman</h2>
                  <p className="text-gray-500">Opsi Pengiriman: Kargo</p>
                </div>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label className="block text-base font-semibold text-gray-800 mb-3">Tanggal Pengiriman</label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
                    {shippingDates.map((date) => (
                      <button
                        key={date.value}
                        type="button"
                        onClick={() => setTanggalPengiriman(date.value)}
                        className={`p-3 rounded-lg border text-center transition-all duration-200 ${
                          tanggalPengiriman === date.value
                            ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
                            : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-100 hover:border-gray-400'
                        }`}
                      >
                        <span className="font-semibold block">{date.dayName}</span>
                        <span className="text-sm">{date.fullDate}</span>
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
                    className="w-full sm:w-1/3 appearance-none bg-white border border-gray-300 rounded-lg p-3 pr-10 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="01:00 PM">01:00 PM</option>
                    <option value="09:00 AM">09:00 AM</option>
                    <option value="10:00 AM">10:00 AM</option>
                    <option value="11:00 AM">11:00 AM</option>
                    <option value="12:00 PM">12:00 PM</option>
                    <option value="02:00 PM">02:00 PM</option>
                    <option value="03:00 PM">03:00 PM</option>
                  </select>
                </div>

                <div>
                  <label htmlFor="alamat-tujuan" className="block text-base font-semibold text-gray-800 mb-3">Alamat Tujuan</label>
                  <div className="bg-gray-50 p-4 rounded-lg border border-gray-300">
                    <p><strong>{pesanan?.nama_pbf || 'Loading...'}</strong></p>
                    <p>{pesanan?.alamat_pbf || 'Loading...'}</p>
                    <p>{pesanan?.kontak_telepon || 'Loading...'}</p>
                    <p>{pesanan?.tujuan_distribusi || 'Loading...'}</p>
                  </div>
                </div>

                <div>
                  <label htmlFor="catatan" className="block text-base font-semibold text-gray-800 mb-3">Catatan</label>
                  <textarea
                    id="catatan"
                    value={catatan}
                    onChange={(e) => setCatatan(e.target.value)}
                    className="w-full bg-gray-50 border border-gray-300 rounded-lg p-3 h-28 resize-none"
                    placeholder="Mohon masukan catatan ..."
                  />
                </div>

                <div>
                  <label className="block text-base font-semibold text-gray-800 mb-3">Detail Pesanan</label>
                  <div className="bg-gray-50 p-4 rounded-lg border border-gray-300">
                    <div className="flex justify-between">
                      <div>
                        <p><strong>ID Pesanan</strong></p>
                        <p>{pesanan?.id || 'Loading...'}</p>
                      </div>
                      <div>
                        <p><strong>Pesanan Produk</strong></p>
                        <p><a href="#" className="text-emerald-600 hover:underline">Lihat Surat Pesanan</a></p>
                      </div>
                      <div>
                        <p><strong>Total Harga</strong></p>
                        <p>Rp. {pesanan?.total_harga?.toLocaleString() || 'Loading...'} <span className="text-gray-500">Via Transfer Bank</span></p>
                      </div>
                    </div>
                  </div>
                </div>

                {error && <div className="p-3 bg-red-100 text-red-700 rounded-lg text-sm">{error}</div>}

                <div className="flex justify-end gap-4">
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
                    Konfirmasi
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

export default AturPengiriman;