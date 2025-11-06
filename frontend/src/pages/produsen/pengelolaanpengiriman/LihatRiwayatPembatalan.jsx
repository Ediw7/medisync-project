import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import SidebarProdusen from '../../../components/SidebarProdusen';
import NavbarProdusen from '../../../components/NavbarProdusen';
import {
  Loader2,
  ArrowLeft,
  AlertCircle,
  FileText,
  DollarSign,
  User,
  Calendar,
  ExternalLink,
  ArchiveX, // Icon untuk Dibatalkan
  Info,
} from 'lucide-react';
import axios from 'axios';
import { toast } from 'react-hot-toast';

const LihatRiwayatPembatalan = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [data, setData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const username = localStorage.getItem('username');

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      setError(null);
      let token;
      try {
        token = localStorage.getItem('token');
        if (!token) throw new Error('Silakan login terlebih dahulu');

        const cleanedId = id.replace(':', '');
        console.log('Fetching pesanan with ID:', cleanedId);

        const response = await axios.get(
          `http://localhost:5000/api/produsen/pesanan-masuk/${cleanedId}`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );

        if (!response.data.success || !response.data.data) {
          throw new Error(
            response.data.message || 'Gagal mengambil data pesanan atau format data salah'
          );
        }

        setData(response.data.data);

        if (response.data.data.pesanan?.status !== 'Dibatalkan') {
          console.warn(
            `Status pesanan saat ini "${response.data.data.pesanan?.status || 'Tidak Diketahui'}", bukan "Dibatalkan". Halaman ini mungkin tidak relevan.`
          );
        }
      } catch (err) {
        console.error('Error fetching pesanan:', err);
        const errorMsg =
          err.response?.data?.message || err.message || 'Gagal memuat data riwayat pembatalan.';
        setError(errorMsg);
        toast.error(errorMsg);
        if (
          (err.message.includes('401') ||
            err.message.includes('403') ||
            err.message.includes('login')) &&
          token
        ) {
          navigate('/login/produsen');
        } else if (!token) {
          navigate('/login/produsen');
        }
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, [id, navigate]);

  const handleLogout = () => {
    localStorage.clear();
    navigate('/');
  };

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return '-';
      return date.toLocaleDateString('id-ID', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
        timeZone: 'UTC',
      });
    } catch (e) {
      console.error('Error formatting date:', e);
      return '-';
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col justify-center items-center h-screen bg-gradient-to-br from-slate-50 via-white to-emerald-50">
        <div className="relative">
          <Loader2 className="animate-spin h-12 w-12 text-emerald-600" />
          <div className="absolute inset-0 h-12 w-12 rounded-full border-4 border-emerald-200 animate-ping opacity-20"></div>
        </div>
        <p className="mt-4 text-slate-700 font-medium">Memuat Riwayat Pembatalan...</p>
      </div>
    );
  }

  if (error && !data) {
    return (
      <div className="flex min-h-screen bg-gradient-to-br from-slate-50 via-white to-emerald-50">
        <SidebarProdusen isCollapsed={isCollapsed} setIsCollapsed={setIsCollapsed} />
        <div
          className={`flex-1 flex flex-col transition-all duration-300 ${isCollapsed ? 'ml-16' : 'ml-64'}`}
        >
          <NavbarProdusen onLogout={handleLogout} username={username} />
          <main className="flex-1 flex items-center justify-center p-6 pt-[72px]">
            <div className="bg-white p-8 rounded-2xl shadow-lg border border-red-200 text-center max-w-md">
              <AlertCircle className="mx-auto h-12 w-12 text-red-500 mb-4" />
              <h2 className="text-xl font-bold text-red-800 mb-2">Gagal Memuat Data</h2>
              <p className="text-red-600 mb-6">{error}</p>
              <button
                onClick={() => navigate('/produsen/pengelolaan-pengiriman')}
                className="flex items-center gap-2 px-4 py-2.5 border border-slate-300 text-slate-700 font-medium rounded-lg hover:bg-slate-100 transition mx-auto"
              >
                <ArrowLeft size={18} />
                Kembali ke Pengiriman
              </button>
            </div>
          </main>
        </div>
      </div>
    );
  }

  if (!data || !data.pesanan) {
    return (
      <div className="flex min-h-screen bg-gradient-to-br from-slate-50 via-white to-emerald-50">
        <SidebarProdusen isCollapsed={isCollapsed} setIsCollapsed={setIsCollapsed} />
        <div
          className={`flex-1 flex flex-col transition-all duration-300 ${isCollapsed ? 'ml-16' : 'ml-64'}`}
        >
          <NavbarProdusen onLogout={handleLogout} username={username} />
          <main className="flex-1 flex items-center justify-center p-6 pt-[72px]">
            <div className="bg-white p-8 rounded-2xl shadow-lg border border-slate-200 text-center max-w-md">
              <FileText className="mx-auto h-12 w-12 text-yellow-500 mb-4" />
              <h2 className="text-xl font-bold text-slate-800 mb-2">
                Data Pesanan Tidak Ditemukan
              </h2>
              <p className="text-slate-600 mb-6">
                Tidak dapat menemukan detail riwayat pembatalan untuk pesanan ini.
              </p>
              <button
                onClick={() => navigate('/produsen/pengelolaan-pengiriman')}
                className="flex items-center gap-2 px-4 py-2.5 border border-slate-300 text-slate-700 font-medium rounded-lg hover:bg-slate-100 transition mx-auto"
              >
                <ArrowLeft size={18} />
                Kembali ke Pengiriman
              </button>
            </div>
          </main>
        </div>
      </div>
    );
  }

  const { pesanan: info, detail_pesanan: detail } = data;
  const totalHargaKeseluruhan = detail
    ? detail.reduce((acc, item) => acc + (Number(item.total_harga) || 0), 0)
    : info.total_harga || 0;

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-slate-50 via-white to-emerald-50">
      <SidebarProdusen isCollapsed={isCollapsed} setIsCollapsed={setIsCollapsed} />
      <div
        className={`flex-1 flex flex-col transition-all duration-300 ${isCollapsed ? 'ml-16' : 'ml-64'}`}
      >
        <NavbarProdusen onLogout={handleLogout} username={username} />

        <main className="flex-1 overflow-auto pt-[72px] px-12 py-8">
          <div className="max-w-5xl mx-auto">
            <button
              onClick={() => navigate('/produsen/pengelolaan-pengiriman')}
              className="mb-6 inline-flex items-center text-emerald-600 hover:text-emerald-700 transition-colors text-sm font-medium"
            >
              <ArrowLeft size={16} className="mr-1" /> Kembali ke Pengelolaan Pengiriman
            </button>

            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
              <div className="bg-gradient-to-r from-emerald-500 to-teal-600 px-6 py-5 border-b border-slate-200 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                <div>
                  <h1 className="text-2xl font-bold text-white flex items-center gap-2">
                    <ArchiveX size={24} />
                    Riwayat Pembatalan Pesanan
                  </h1>
                  <p className="text-sm text-emerald-50 mt-1">
                    Pesanan ID:{' '}
                    <span className="font-mono">#{String(info.id).padStart(6, '0')}</span>
                  </p>
                </div>

                <div
                  className={`px-4 py-2 rounded-full border-2 text-sm font-semibold flex items-center gap-2 bg-white text-red-700 border-red-200`}
                >
                  <ArchiveX size={16} />
                  Status: Dibatalkan
                </div>
              </div>

              {error && !isLoading && (
                <div className="m-6 p-4 bg-red-50 border border-red-200 text-red-700 rounded-xl flex items-center gap-3">
                  <AlertCircle size={20} />
                  <span>{error}</span>
                </div>
              )}

              <div className="p-8 border-b border-slate-200">
                <h3 className="text-lg font-bold text-slate-900 mb-6 flex items-center gap-2">
                  <FileText size={20} className="text-emerald-600" />
                  Detail Pembatalan
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-1">
                    <span className="text-sm font-medium text-slate-500">Dana Dikembalikan</span>
                    <div className="bg-red-50 p-3 rounded-lg border border-red-200">
                      <span className="font-bold text-red-700 text-base">
                        Rp. {(info.total_harga || 0).toLocaleString('id-ID')}
                      </span>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <span className="text-sm font-medium text-slate-500">Diajukan oleh (PBF)</span>
                    <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
                      <span className="font-semibold text-slate-900 text-base">
                        {info.nama_pbf}
                      </span>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <span className="text-sm font-medium text-slate-500">
                      Tanggal Pengajuan Pembatalan
                    </span>
                    <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
                      <span className="font-semibold text-slate-900 text-base">
                        {formatDate(info.updated_at)}
                      </span>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <span className="text-sm font-medium text-slate-500">Tanggal Pesanan Awal</span>
                    <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
                      <span className="font-semibold text-slate-900 text-base">
                        {formatDate(info.tanggal_pesanan)}
                      </span>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <span className="text-sm font-medium text-slate-500">Surat Pesanan Awal</span>
                    <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 flex items-center justify-between">
                      <span className="font-semibold text-slate-900 text-base">
                        {info.nomor_po || `Pesanan #${String(info.id).padStart(6, '0')}`}
                      </span>
                      <Link
                        to={`/produsen/pengelolaan-pengiriman/detail/${info.id}/surat`}
                        className="text-sm font-medium text-emerald-600 hover:underline inline-flex items-center gap-1"
                      >
                        Lihat Dokumen <ExternalLink size={14} />
                      </Link>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <span className="text-sm font-medium text-slate-500">Total Harga Awal</span>
                    <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
                      <span className="font-semibold text-slate-900 text-base">
                        Rp. {(totalHargaKeseluruhan || 0).toLocaleString('id-ID')}
                      </span>
                    </div>
                  </div>

                  <div className="space-y-1 md:col-span-2">
                    <span className="text-sm font-medium text-slate-500">
                      Alasan Pembatalan dari PBF
                    </span>
                    <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
                      <p className="text-slate-900 text-base whitespace-pre-wrap">
                        {info.alasan_pembatalan || '-'}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="px-8 pb-8 pt-6">
                <div className="bg-blue-50 border border-blue-200 text-blue-800 rounded-xl p-4 text-sm flex items-start gap-3">
                  <Info size={18} className="flex-shrink-0 mt-0.5" />
                  <span>
                    Pesanan ini telah dibatalkan. Dana sejumlah yang tertera telah atau akan
                    dikembalikan ke PBF.
                  </span>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>

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

export default LihatRiwayatPembatalan;
