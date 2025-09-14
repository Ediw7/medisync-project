import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import SidebarProdusen from '../../../components/SidebarProdusen';
import NavbarProdusen from '../../../components/NavbarProdusen';
import { Loader2 } from 'lucide-react';

const AturPengiriman = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [pesanan, setPesanan] = useState(null);
  const [waktuPengiriman, setWaktuPengiriman] = useState('01:00 PM');
  const [opsiPengiriman, setOpsiPengiriman] = useState('kargo'); 
  const [catatan, setCatatan] = useState('');
  
  // Fungsi untuk menghitung tanggal pengiriman
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
          navigate('/login/produsen');
          return;
        }

        const response = await fetch(`http://localhost:5000/api/produsen/pesanan-masuk/${id}`, {
          headers: { 'Authorization': `Bearer ${token}` },
        });

        if (!response.ok) throw new Error('Gagal mengambil data pesanan.');
        const result = await response.json();
        if (result.success) {
          setPesanan(result.data.pesanan);
          const dates = calculateShippingDates(result.data.pesanan.tanggal_pesanan);
          setShippingDates(dates);
          setSelectedDate(dates[0].date); // Set default ke tanggal pertama
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
  }, [id, navigate]);

  const handleSubmit = (e) => {
    e.preventDefault();
    setError(null);

    if (!selectedDate || !waktuPengiriman) {
      setError('Tanggal dan Waktu pengiriman wajib diisi.');
      return;
    }
    
    if (!pesanan) {
      setError('Data pesanan belum dimuat, tidak bisa melanjutkan.');
      return;
    }
    
    navigate(`/produsen/pengelolaan-pengiriman/rincian-pengiriman/${id}`, {
      state: { 
        pesanan, 
        tanggalPengiriman: selectedDate, 
        waktuPengiriman, 
        catatan,
        opsiPengiriman
      },
    });
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <Loader2 className="animate-spin h-8 w-8 text-emerald-600" />
      </div>
    );
  }
  if (error && !pesanan) {
    return (
      <div className="flex justify-center items-center h-screen">
        <p className="text-red-500">Error: {error}</p>
      </div>
    );
  }

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
                      <p><strong>{pesanan?.nama_pbf || 'Loading...'}</strong></p>
                      <p>{pesanan?.alamat_pbf || 'Loading...'}</p>
                      <p>{pesanan?.kontak_telepon || 'Loading...'}</p>
                      <p>{pesanan?.tujuan_distribusi || 'Loading...'}</p>
                    </div>
                  </div>
                  <div className="sm:w-1/2">
                    <label htmlFor="catatan" className="block text-base font-semibold text-gray-800 mb-3">Catatan</label>
                    <textarea
                      id="catatan"
                      value={catatan}
                      onChange={(e) => setCatatan(e.target.value)}
                      className="w-full bg-gray-50 border border-gray-300 rounded-lg p-3 h-full resize-none"
                      placeholder="Mohon masukan catatan ..."
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-base font-semibold text-gray-800 mb-3">Detail Pesanan</label>
                  <div className="bg-gray-50 p-4 rounded-lg border border-gray-300">
                    <div className="flex justify-between items-center flex-wrap gap-4">
                      <div>
                        <p className="text-sm"><strong>ID Pesanan</strong></p>
                        <p className="text-lg font-bold">{String(pesanan?.id).padStart(6, '0') || 'Loading...'}</p>
                      </div>
                      <div>
                        <p className="text-sm"><strong>Pesanan Produk</strong></p>
                        <Link to={`/produsen/pengelolaan-pengiriman/detail/${pesanan?.id}/surat`} className="text-emerald-600 hover:underline">
                          Lihat Surat Pesanan
                        </Link>
                      </div>
                      <div>
                        <p className="text-sm"><strong>Total Harga</strong></p>
                        <p className="text-lg font-bold">Rp. {pesanan?.total_harga?.toLocaleString('id-ID') || 'Loading...'} <span className="text-gray-500 text-sm">Via Transfer Bank</span></p>
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