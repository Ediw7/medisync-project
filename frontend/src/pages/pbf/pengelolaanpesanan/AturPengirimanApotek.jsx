import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import SidebarPbf from '../../../components/SidebarPbf';      // Ganti
import NavbarPbf from '../../../components/NavbarPbf';        // Ganti
import { Loader2 } from 'lucide-react';
import axios from 'axios'; // Ganti ke axios

const AturPengirimanApotek = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [pesanan, setPesanan] = useState(null);
  const [waktuPengiriman, setWaktuPengiriman] = useState('09:00-12:00');
  const [opsiPengiriman, setOpsiPengiriman] = useState('kurir_internal'); 
  const [catatan, setCatatan] = useState('');

  const calculateShippingDates = (orderDate) => {
    const dates = [];
    const startDate = new Date(orderDate);
    for (let i = 1; i <= 5; i++) {
      const date = new Date(orderDate);
      date.setDate(startDate.getDate() + i);
      const day = date.toLocaleDateString('id-ID', { weekday: 'long' });
      const formattedDate = date.toISOString().split('T')[0];
      dates.push({ day, date: formattedDate });
    }
    return dates;
  };

  const [shippingDates, setShippingDates] = useState([]);
  const [selectedDate, setSelectedDate] = useState('');

  useEffect(() => {
    const fetchPesananData = async () => {
      setIsLoading(true);
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          navigate('/login/pbf'); // Ganti
          return;
        }

        // Ganti endpoint ke API PBF
        const response = await axios.get(`http://localhost:5000/api/pbf/pesanan-apotek/${id}`, {
          headers: { 'Authorization': `Bearer ${token}` },
        });

        if (response.data.success) {
          setPesanan(response.data.data.pesanan);
          const dates = calculateShippingDates(response.data.data.pesanan.tanggal_pesanan);
          setShippingDates(dates);
          setSelectedDate(dates[0].date);
        } else {
          throw new Error(response.data.message || 'Data pesanan tidak ditemukan.');
        }
      } catch (err) {
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };

    fetchPesananData();
  }, [id, navigate]);

  const handleSubmit = (e) => {
    e.preventDefault();
    // Logika submit untuk PBF (bisa diarahkan ke halaman rincian pengiriman PBF)
    navigate(`/pbf/pengelolaan-pesanan/rincian-pengiriman/${id}`, {
      state: { 
        pesanan, 
        tanggalPengiriman: selectedDate, 
        waktuPengiriman, 
        catatan,
        opsiPengiriman
      },
    });
  };
  
    if (isLoading) return <div className="flex justify-center items-center h-screen"><Loader2 className="animate-spin h-8 w-8 text-emerald-600" /></div>;
    if (error) return <div className="flex justify-center items-center h-screen"><p className="text-red-500">Error: {error}</p></div>;

  return (
    <div className="flex min-h-screen bg-gray-50">
      <SidebarPbf isCollapsed={isCollapsed} setIsCollapsed={setIsCollapsed} />
      <div className={`flex-1 flex flex-col transition-all duration-300 ${isCollapsed ? 'ml-16' : 'ml-64'}`}>
        <NavbarPbf onLogout={() => { localStorage.clear(); navigate('/'); }} />
        <main className="flex-1 p-6 lg:p-8">
          <div className="max-w-4xl mx-auto">
            <div className="mb-6 pt-10">
              <h1 className="text-3xl font-bold text-gray-800">Atur Pengiriman ke Apotek</h1>
              <p className="text-gray-500 mt-1">Pilih tanggal dan waktu pengiriman pesanan.</p>
            </div>

            <div className="bg-white rounded-xl shadow-md p-8">
               <div className="flex items-center gap-4 mb-8 pb-6 border-b border-gray-200">
                {/* Header Disesuaikan */}
                <h2 className="text-xl font-semibold text-gray-800">Detail Pengiriman</h2>
              </div>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label className="block text-base font-semibold text-gray-800 mb-3">Tanggal Pengiriman</label>
                  <div className="flex space-x-2">
                    {shippingDates.map((date, index) => (
                      <button
                        key={index}
                        type="button"
                        onClick={() => setSelectedDate(date.date)}
                        className={`px-4 py-2 rounded-lg border ${selectedDate === date.date ? 'bg-emerald-600 text-white border-emerald-600' : 'bg-gray-100 text-gray-700 border-gray-300 hover:bg-gray-200'}`}
                      >
                        {date.day.slice(0, 3)}<br />{date.date.split('-').reverse().join('-')}
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
                    <option value="09:00-12:00">09:00 AM - 12:00 PM</option>
                    <option value="13:00-16:00">01:00 PM - 04:00 PM</option>
                    <option value="16:00-19:00">04:00 PM - 07:00 PM</option>
                  </select>
                </div>

                <div className="flex flex-col sm:flex-row gap-6">
                  <div className="sm:w-1/2">
                    <label htmlFor="alamat-tujuan" className="block text-base font-semibold text-gray-800 mb-3">Alamat Tujuan</label>
                    <div className="bg-gray-50 p-4 rounded-lg border border-gray-300 h-full flex flex-col justify-center">
                      {/* --- Ganti Field Data --- */}
                      <p><strong>{pesanan?.nama_apotek || 'Loading...'}</strong></p>
                      <p>{pesanan?.alamat_apotek || 'Loading...'}</p>
                      <p>{pesanan?.telepon || 'Loading...'}</p>
                    </div>
                  </div>
                   <div className="sm:w-1/2">
                    <label htmlFor="catatan" className="block text-base font-semibold text-gray-800 mb-3">Catatan</label>
                    <textarea
                      id="catatan"
                      value={catatan}
                      onChange={(e) => setCatatan(e.target.value)}
                      className="w-full bg-gray-50 border border-gray-300 rounded-lg p-3 h-full resize-none"
                      placeholder="Mohon masukan catatan untuk kurir..."
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-base font-semibold text-gray-800 mb-3">Detail Pesanan</label>
                  <div className="bg-gray-50 p-4 rounded-lg border border-gray-300">
                    <div className="flex justify-between items-center flex-wrap gap-4">
                      <div>
                        <p className="text-sm"><strong>Nomor Pesanan</strong></p>
                        <p className="text-lg font-bold">{pesanan?.nomor_pesanan || 'Loading...'}</p>
                      </div>
                      <div>
                        <p className="text-sm"><strong>Pesanan Produk</strong></p>
                        {/* Ganti Link ke Surat Pesanan Apotek */}
                        <Link to={`/pbf/pengelolaan-pesanan/surat/${pesanan?.id}`} className="text-emerald-600 hover:underline">
                          Lihat Surat Pesanan
                        </Link>
                      </div>
                       <div>
                        <p className="text-sm"><strong>Total Harga</strong></p>
                        <p className="text-lg font-bold">Rp. {pesanan?.total_harga?.toLocaleString('id-ID') || 'Loading...'}</p>
                      </div>
                    </div>
                  </div>
                </div>

                {error && <div className="p-3 bg-red-100 text-red-700 rounded-lg text-sm">{error}</div>}

                <div className="flex justify-end gap-4">
                  <button type="button" onClick={() => navigate(-1)} className="py-2 px-6 bg-gray-200 text-gray-800 font-semibold rounded-lg hover:bg-gray-300">
                    Kembali
                  </button>
                  <button type="submit" className="py-2 px-6 bg-emerald-600 text-white font-semibold rounded-lg hover:bg-emerald-700">
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

export default AturPengirimanApotek;