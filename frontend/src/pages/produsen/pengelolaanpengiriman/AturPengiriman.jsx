import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import SidebarProdusen from '../../../components/SidebarProdusen';
import NavbarProdusen from '../../../components/NavbarProdusen';
import DatePicker from 'react-datepicker'; // Keep import if logic might use it
import "react-datepicker/dist/react-datepicker.css";
import { Loader2, Calendar, Clock, MapPin, FileText, DollarSign, ArrowLeft, ExternalLink, AlertCircle } from 'lucide-react'; // Added icons

const AturPengiriman = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [pesanan, setPesanan] = useState(null);
  // Default waktu ke opsi pertama
  const [waktuPengiriman, setWaktuPengiriman] = useState('09:00-12:00');
  const [opsiPengiriman] = useState('kargo'); // Tetap kargo
  const [catatan, setCatatan] = useState('');

  const calculateShippingDates = (orderDate) => {
    const dates = [];
    const startDate = new Date(orderDate);
    if (isNaN(startDate.getTime())) {
        console.error("Invalid orderDate received:", orderDate);
        const today = new Date();
         for (let i = 1; i <= 5; i++) {
            const date = new Date();
            date.setDate(today.getDate() + i);
            // Gunakan format yang sama seperti di desain target
            const day = date.toLocaleDateString('id-ID', { weekday: 'short' });
            const dateNum = date.getDate();
            const month = date.toLocaleDateString('id-ID', { month: 'short' });
            const formattedDate = date.toISOString().split('T')[0];
            dates.push({ day, dateNum, month, date: formattedDate });
        }
        return dates;
    }

    for (let i = 1; i <= 5; i++) {
      const date = new Date(startDate);
      date.setDate(startDate.getDate() + i);
      const day = date.toLocaleDateString('id-ID', { weekday: 'short' });
      const dateNum = date.getDate();
      const month = date.toLocaleDateString('id-ID', { month: 'short' }); // Tambah bulan
      const formattedDate = date.toISOString().split('T')[0];
      dates.push({ day, dateNum, month, date: formattedDate }); // Sertakan bulan
    }
    return dates;
  };

  const [shippingDates, setShippingDates] = useState([]);
  const [selectedDate, setSelectedDate] = useState('');

  useEffect(() => {
    const fetchPesananData = async () => {
      setIsLoading(true);
      setError(null);
      let token;
      try {
        token = localStorage.getItem('token');
        if (!token) {
          navigate('/login/produsen');
          return;
        }

        const response = await fetch(`http://localhost:5000/api/produsen/pesanan-masuk/${id}`, {
          headers: { 'Authorization': `Bearer ${token}` },
        });

        const contentType = response.headers.get("content-type");
        if (!response.ok) {
            let errorMsg = `Gagal mengambil data pesanan: Status ${response.status}`;
            if (contentType && contentType.indexOf("application/json") !== -1) {
                const errData = await response.json();
                errorMsg = errData.message || errorMsg;
            } else {
                 errorMsg = await response.text() || errorMsg;
            }
            throw new Error(errorMsg);
        }

        if (contentType && contentType.indexOf("application/json") !== -1) {
             const result = await response.json();
             if (result.success && result.data?.pesanan) {
                const orderDate = result.data.pesanan.tanggal_pesanan;
                setPesanan(result.data.pesanan);
                const dates = calculateShippingDates(orderDate);
                setShippingDates(dates);
                if (dates.length > 0) {
                   setSelectedDate(dates[0].date);
                }
             } else {
               throw new Error(result.message || 'Data pesanan tidak valid atau tidak ditemukan.');
             }
        } else {
             const resultText = await response.text();
             console.warn("Received non-JSON response:", resultText);
             throw new Error('Menerima format data tidak terduga dari server.');
        }

      } catch (err) {
        setError(err.message);
        if ((err.message.includes('401') || err.message.includes('403') || err.message.includes('login')) && token) {
            navigate('/login/produsen');
        } else if (!token){
             navigate('/login/produsen');
        }
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
      setError('Tanggal dan Waktu pengiriman wajib dipilih.');
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
       <div className="flex flex-col justify-center items-center h-screen bg-gradient-to-br from-slate-50 via-white to-emerald-50">
          <div className="relative">
            <Loader2 className="animate-spin h-12 w-12 text-emerald-600" />
            <div className="absolute inset-0 h-12 w-12 rounded-full border-4 border-emerald-200 animate-ping opacity-20"></div>
          </div>
          <p className="mt-4 text-slate-700 font-medium">Memuat data pesanan...</p>
      </div>
    );
  }

  if (error && !pesanan) {
    return (
       <div className="flex flex-col justify-center items-center h-screen bg-gradient-to-br from-slate-50 via-white to-red-50 p-6">
          <div className="bg-white p-8 rounded-xl shadow-lg border border-red-200 text-center">
            <AlertCircle className="mx-auto h-12 w-12 text-red-500 mb-4" />
            <h2 className="text-xl font-bold text-red-800 mb-2">Gagal Memuat Data</h2>
            <p className="text-red-600 mb-6">{error}</p>
            <button
               onClick={() => navigate('/produsen/pengelolaan-pengiriman')}
               className="flex items-center gap-2 px-4 py-2.5 border border-slate-300 text-slate-700 font-medium rounded-lg hover:bg-slate-100 transition mx-auto" // Tambahkan mx-auto
             >
               <ArrowLeft size={18} />
               Kembali
             </button>
          </div>
       </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-slate-50">
      <SidebarProdusen isCollapsed={isCollapsed} setIsCollapsed={setIsCollapsed} />
      <div className={`flex-1 flex flex-col transition-all duration-300 ${isCollapsed ? "ml-16" : "ml-64"}`}>
        <NavbarProdusen onLogout={() => { localStorage.clear(); navigate('/'); }} username={localStorage.getItem('username')} />

        <main className="flex-1 overflow-auto pt-[72px]">
          <div className="max-w-4xl mx-auto px-6 py-8">

            <div className="mb-8">
               <button
                  onClick={() => navigate(-1)}
                  className="mb-4 inline-flex items-center text-emerald-600 hover:text-emerald-700 transition-colors text-sm font-medium"
                >
                  <ArrowLeft size={16} className="mr-1" /> Kembali
                </button>
              <h1 className="text-4xl font-bold text-slate-900 mb-2">Atur Pengiriman</h1>
              <p className="text-slate-600">Pilih tanggal dan waktu pengiriman untuk pesanan <span className="font-semibold">#{String(pesanan?.id).padStart(6, '0')}</span></p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">

              <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
                <div className="bg-gradient-to-r from-emerald-50 to-emerald-100 px-6 py-4 border-b border-slate-200">
                  <h2 className="text-lg font-semibold text-emerald-900 flex items-center gap-2">
                    <Calendar size={20} /> Jadwal Pengiriman
                  </h2>
                   <p className="text-sm text-emerald-700 mt-1">Metode: Kargo (Default)</p>
                </div>

                <div className="p-6 space-y-6">
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
                    <label htmlFor="waktu-pengiriman" className="block text-sm font-semibold text-slate-700 mb-2">Waktu Pengiriman*</label>
                    <select
                      id="waktu-pengiriman"
                      value={waktuPengiriman}
                      onChange={(e) => setWaktuPengiriman(e.target.value)}
                      className="w-full md:w-2/3 px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition bg-white appearance-none"
                      required
                    >
                      <option value="09:00-12:00">Pagi (09:00 - 12:00)</option>
                      <option value="13:00-16:00">Siang (13:00 - 16:00)</option>
                      <option value="16:00-19:00">Sore (16:00 - 19:00)</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
                 <div className="bg-gradient-to-r from-slate-50 to-slate-100 px-6 py-4 border-b border-slate-200">
                    <h2 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
                       <MapPin size={20} /> Informasi Tujuan & Catatan
                    </h2>
                 </div>
                 <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                     <div>
                       <label className="block text-sm font-semibold text-slate-700 mb-2">Alamat Tujuan</label>
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
                         rows={5} // Sesuaikan tinggi jika perlu
                         className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition resize-none"
                         placeholder="Instruksi khusus untuk kurir..."
                       />
                     </div>
                  </div>
              </div>

              <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
                 <div className="bg-gradient-to-r from-slate-50 to-slate-100 px-6 py-4 border-b border-slate-200">
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
                            to={`/produsen/pesanan/detail/${pesanan?.id}/surat`} // Pastikan link benar
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
                            {/* Pastikan format Rupiah benar */}
                            Rp. {pesanan?.total_harga?.toLocaleString('id-ID', { minimumFractionDigits: 0 }) || '...'}
                          </p>
                           <p className="text-xs text-slate-500 mt-0.5">Metode: Transfer Bank</p>
                        </div>
                    </div>
                 </div>
              </div>

              {error && (
                <div className="p-4 bg-red-50 text-red-700 rounded-lg border border-red-200 text-sm font-medium flex items-center gap-2">
                  <AlertCircle size={18} /> {error}
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
    </div>
  );
};

export default AturPengiriman;