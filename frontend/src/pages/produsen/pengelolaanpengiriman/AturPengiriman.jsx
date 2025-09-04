import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import SidebarProdusen from '../../../components/SidebarProdusen';
import NavbarProdusen from '../../../components/NavbarProdusen';

// Helper function to generate next 6 days for shipping options
const generateShippingDates = () => {
  const dates = [];
  const today = new new Date();
  const dayNames = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];

  for (let i = 0; i < 6; i++) {
    const currentDate = new new Date(today);
    currentDate.setDate(today.getDate() + i);
    
    const day = String(currentDate.getDate()).padStart(2, '0');
    const month = String(currentDate.getMonth() + 1).padStart(2, '0');
    const year = currentDate.getFullYear();
    
    dates.push({
      dayName: dayNames[currentDate.getDay()],
      fullDate: `${day}-${month}-${year}`, // Format DD-MM-YYYY for display
      value: `${year}-${month}-${day}`, // Format YYYY-MM-DD for input/state
    });
  }
  return dates;
};

const AturPengiriman = () => {
  const { id } = useParams(); // ID pesanan dari URL
  const navigate = useNavigate();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isLoading, setIsLoading] = useState(true); // Mulai dengan loading true untuk fetch data
  const [error, setError] = useState(null);
  
  // State untuk menyimpan data pesanan dari backend
  const [pesanan, setPesanan] = useState(null);

  // State for the form
  const [tanggalPengiriman, setTanggalPengiriman] = useState('');
  const [waktuPengiriman, setWaktuPengiriman] = useState('13:00'); // Default to 01:00 PM
  const [catatan, setCatatan] = useState('');

  const shippingDates = generateShippingDates();

  // useEffect untuk mengambil data pesanan saat komponen pertama kali dimuat
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
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (!response.ok) {
          throw new Error('Gagal mengambil data pesanan.');
        }

        const result = await response.json();
        if (result.success) {
          setPesanan(result.data.pesanan); // Simpan detail pesanan ke state
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

    // Set tanggal pengiriman default
    if (shippingDates.length > 0) {
      setTanggalPengiriman(shippingDates[0].value);
    }
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

    // Arahkan ke halaman rincian dengan membawa data yang sudah diisi
    // dan juga data pesanan yang sudah diambil dari backend.
    navigate(`/produsen/pengelolaanpengiriman/rincian-pengiriman/${id}`, {
      state: {
        pesanan, // Teruskan data pesanan lengkap
        tanggalPengiriman,
        waktuPengiriman,
        catatan,
      },
    });
  };

  const handleLogout = () => {
    localStorage.clear();
    navigate('/');
  };

  // Tampilan loading saat mengambil data
  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <p>Loading data pesanan...</p>
      </div>
    );
  }
  
  // Tampilan jika terjadi error saat fetch data
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
        <NavbarProdusen onLogout={handleLogout} />
        <main className="flex-1 p-6 lg:p-8">
          <div className="max-w-4xl mx-auto">
            <div className="mb-6">
              <h1 className="text-3xl font-bold text-gray-800">Atur Pengiriman</h1>
              <p className="text-gray-500 mt-1">
                Untuk Pesanan: <span className='font-semibold'>{pesanan?.nomor_po || `ID ${id}`}</span>
              </p>
            </div>

            <div className="bg-white rounded-xl shadow-md p-8">
              <div className="flex items-center gap-4 mb-8 pb-6 border-b border-gray-200">
                <div className="bg-emerald-100 p-3 rounded-lg">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-gray-800">Kami akan mengirimkan 1 Pesanan</h2>
                  <p className="text-gray-500">
                    Kepada: <span className="font-medium">{pesanan?.nama_pbf || '...'}</span>
                  </p>
                </div>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Tanggal Pengiriman */}
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

                {/* Waktu Pengiriman */}
                <div>
                  <label htmlFor="waktu-pengiriman" className="block text-base font-semibold text-gray-800 mb-3">Waktu Pengiriman</label>
                  <div className="relative">
                    <select
                      id="waktu-pengiriman"
                      value={waktuPengiriman}
                      onChange={(e) => setWaktuPengiriman(e.target.value)}
                      className="w-full sm:w-1/2 md:w-1/3 appearance-none bg-white border border-gray-300 rounded-lg p-3 pr-8 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                    >
                      <option value="09:00">09.00 AM</option>
                      <option value="10:00">10.00 AM</option>
                      <option value="11:00">11.00 AM</option>
                      <option value="12:00">12.00 PM</option>
                      <option value="13:00">01.00 PM</option>
                      <option value="14:00">02.00 PM</option>
                      <option value="15:00">03.00 PM</option>
                    </select>
                    <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700" style={{ right: 'calc(66.66% - 2rem)' }}>
                       <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/></svg>
                    </div>
                  </div>
                </div>

                {/* Catatan */}
                <div>
                  <label htmlFor="catatan" className="block text-base font-semibold text-gray-800 mb-3">Catatan</label>
                  <textarea
                    id="catatan"
                    value={catatan}
                    onChange={(e) => setCatatan(e.target.value)}
                    className="w-full border-gray-300 rounded-lg shadow-sm focus:ring-emerald-500 focus:border-emerald-500 p-3 h-28 resize-none"
                    placeholder="Mohon masukan catatan ..."
                  />
                </div>

                {/* Error Message */}
                {error && (
                    <div className="p-3 bg-red-100 text-red-700 rounded-lg text-sm">
                        {error}
                    </div>
                )}

                {/* Action Buttons */}
                <div className="flex justify-end items-center gap-4 pt-4">
                  <button
                    type="button"
                    onClick={() => navigate(-1)}
                    className="py-2 px-6 bg-gray-200 text-gray-800 font-semibold rounded-lg hover:bg-gray-300 transition-colors"
                  >
                    Kembali
                  </button>
                  <button
                    type="submit"
                    className="py-2 px-6 bg-emerald-600 text-white font-semibold rounded-lg hover:bg-emerald-700 transition-colors disabled:bg-gray-400"
                    disabled={isLoading}
                  >
                    Lanjut ke Rincian
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