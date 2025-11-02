import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import SidebarPbf from '../../../components/SidebarPbf';
import NavbarPbf from '../../../components/NavbarPbf';
import { Loader2, Calendar, Clock, MapPin, FileText, DollarSign, ArrowLeft, ExternalLink, AlertCircle } from 'lucide-react';
import axios from 'axios';

const AturPengirimanApotek = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [pesanan, setPesanan] = useState(null);
  const [waktuPengiriman, setWaktuPengiriman] = useState('09:00-12:00');
  const [opsiPengiriman] = useState('kurir_internal');
  const [catatan, setCatatan] = useState('');

  const calculateShippingDates = (orderDate) => {
    const dates = [];
    const startDate = new Date(orderDate);
    if (isNaN(startDate.getTime())) {
      console.error("Invalid orderDate:", orderDate);
      const today = new Date();
      for (let i = 1; i <= 5; i++) {
        const date = new Date();
        date.setDate(today.getDate() + i);
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
      const month = date.toLocaleDateString('id-ID', { month: 'short' });
      const formattedDate = date.toISOString().split('T')[0];
      dates.push({ day, dateNum, month, date: formattedDate });
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
          navigate('/login/pbf');
          return;
        }

        const response = await axios.get(`http://localhost:5000/api/pbf/pesanan-apotek/${id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (response.data.success && response.data.data?.pesanan) {
          const pesananData = response.data.data.pesanan;
          setPesanan(pesananData);
          const dates = calculateShippingDates(pesananData.tanggal_pesanan);
          setShippingDates(dates);
          if (dates.length > 0) {
            setSelectedDate(dates[0].date);
          }
        } else {
          throw new Error(response.data.message || 'Data pesanan tidak ditemukan.');
        }
      } catch (err) {
        const errorMsg = err.response?.data?.message || err.message || 'Gagal memuat data pesanan';
        setError(errorMsg);
        if (err.response?.status === 401 || err.response?.status === 403 || errorMsg.includes('login')) {
          setTimeout(() => navigate('/login/pbf'), 1500);
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
      setError('Tanggal dan waktu pengiriman wajib dipilih.');
      return;
    }

    if (!pesanan) {
      setError('Data pesanan belum dimuat.');
      return;
    }

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

  // --- LOADING STATE ---
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

  // --- ERROR STATE ---
  if (error && !pesanan) {
    return (
      <div className="flex flex-col justify-center items-center h-screen bg-gradient-to-br from-slate-50 via-white to-red-50 p-6">
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
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-slate-50">
      <SidebarPbf isCollapsed={isCollapsed} setIsCollapsed={setIsCollapsed} />
      <div className={`flex-1 flex flex-col transition-all duration-300 ${isCollapsed ? 'ml-16' : 'ml-64'}`}>
        <NavbarPbf onLogout={() => { localStorage.clear(); navigate('/'); }} username={localStorage.getItem('username')} />

        <main className="flex-1 overflow-auto pt-[72px] px-12 py-8">
          <div className="max-w-4xl mx-auto">

            {/* HEADER DENGAN ANIMASI BLOB */}
            <div className="mb-10 relative">
              <div className="absolute -top-20 -left-20 w-72 h-72 bg-emerald-200 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob"></div>
              <div className="absolute -top-20 -right-20 w-72 h-72 bg-teal-200 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000"></div>

              <div className="relative">
                <button
                  onClick={() => navigate(-1)}
                  className="mb-4 inline-flex items-center text-emerald-600 hover:text-emerald-700 transition-colors text-sm font-medium"
                >
                  <ArrowLeft size={16} className="mr-1" /> Kembali
                </button>

                <div className="flex items-center gap-3 mb-3">
                  <div className="flex items-center justify-center w-12 h-12 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl shadow-lg">
                    <Calendar className="text-white" size={24} />
                  </div>
                  <div>
                    <h1 className="text-4xl font-bold bg-gradient-to-r from-slate-900 via-emerald-900 to-teal-900 bg-clip-text text-transparent">
                      Atur Pengiriman ke Apotek
                    </h1>
                  </div>
                </div>
                <p className="text-slate-600 text-lg flex items-center gap-2">
                  Pilih jadwal pengiriman untuk pesanan <span className="font-semibold">#{String(pesanan?.id).padStart(6, '0')}</span>
                </p>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">

              {/* JADWAL PENGIRIMAN */}
              <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
                <div className="bg-gradient-to-r from-emerald-50 to-emerald-100 px-6 py-4 border-b border-slate-200">
                  <h2 className="text-lg font-semibold text-emerald-900 flex items-center gap-2">
                    <Calendar size={20} /> Jadwal Pengiriman
                  </h2>
                  <p className="text-sm text-emerald-700 mt-1">Metode: Kurir Internal</p>
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

              {/* ALAMAT & CATATAN */}
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
                      <p className="font-semibold text-slate-800">{pesanan?.nama_apotek || 'Memuat...'}</p>
                      <p>{pesanan?.alamat_apotek || '...'}</p>
                      <p>Kontak: {pesanan?.telepon || '...'}</p>
                      <p>SIPA: {pesanan?.nomor_sipa || '...'}</p>
                    </div>
                  </div>
                  <div>
                    <label htmlFor="catatan" className="block text-sm font-semibold text-slate-700 mb-2">Catatan Pengiriman (Opsional)</label>
                    <textarea
                      id="catatan"
                      value={catatan}
                      onChange={(e) => setCatatan(e.target.value)}
                      rows={5}
                      className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition resize-none"
                      placeholder="Instruksi khusus untuk kurir..."
                    />
                  </div>
                </div>
              </div>

              {/* RINGKASAN PESANAN */}
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
                        to={`/pbf/pengelolaan-pesanan/surat/${pesanan?.id}`}
                        className="text-sm font-medium text-emerald-600 hover:underline inline-flex items-center gap-1"
                      >
                        Lihat Dokumen <ExternalLink size={14} />
                      </Link>
                    </div>
                    <div className="text-left sm:text-right">
                      <p className="text-xs font-medium text-slate-500 mb-1">Total Harga</p>
                      <p className="text-lg font-bold text-emerald-700 flex items-center gap-1">
                        Rp. {pesanan?.total_harga?.toLocaleString('id-ID', { minimumFractionDigits: 0 }) || '...'}
                      </p>
                      <p className="text-xs text-slate-500 mt-0.5">Pembayaran via Apotek</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* ERROR INLINE */}
              {error && (
                <div className="p-4 bg-red-50 text-red-700 rounded-lg border border-red-200 text-sm font-medium flex items-center gap-2">
                  <AlertCircle size={18} /> {error}
                </div>
              )}

              {/* TOMBOL AKSI */}
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

      {/* ANIMASI BLOB CSS */}
      <style jsx>{`
        @keyframes blob {
          0% { transform: translate(0px, 0px) scale(1); }
          33% { transform: translate(30px, -50px) scale(1.1); }
          66% { transform: translate(-20px, 20px) scale(0.9); }
          100% { transform: translate(0px, 0px) scale(1); }
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

export default AturPengirimanApotek;






               