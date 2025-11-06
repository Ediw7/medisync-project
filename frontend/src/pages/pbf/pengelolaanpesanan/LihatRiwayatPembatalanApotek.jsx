import React, { useState, useEffect, useRef } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import SidebarPbf from '../../../components/SidebarPbf';
import NavbarPbf from '../../../components/NavbarPbf';
import {
  Loader2,
  ArrowLeft,
  FileText,
  AlertTriangle,
  XCircle, // Untuk header
  Calendar,
  Hash, // Untuk No Pesanan
  User, // Untuk Apotek
  Info,
  ExternalLink,
} from 'lucide-react';
import axios from 'axios';
import { toast } from 'react-hot-toast'; // Import toast

const LihatRiwayatPembatalanApotek = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [data, setData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const username = localStorage.getItem('username'); // Ambil username

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      setError(null);
      let token;
      try {
        token = localStorage.getItem('token');
        if (!token) throw new Error('Silakan login terlebih dahulu');

        // Panggil endpoint yang benar
        const response = await axios.get(`http://localhost:5000/api/pbf/pesanan-apotek/${id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (response.data.success && response.data.data) {
          setData(response.data.data);
        } else {
          throw new Error(response.data.message || 'Data pembatalan tidak ditemukan.');
        }
      } catch (err) {
        const errorMsg = err.response?.data?.message || err.message || 'Gagal memuat data.';
        setError(errorMsg);
        toast.error(errorMsg); // Tampilkan error di toast
        if (
          (err.message.includes('401') ||
            err.message.includes('403') ||
            err.message.includes('login')) &&
          token
        ) {
          navigate('/login/pbf');
        } else if (!token) {
          navigate('/login/pbf');
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
    } catch {
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

  if (error || !data || !data.pesanan) {
    return (
      <div className="flex min-h-screen bg-slate-50">
        <SidebarPbf isCollapsed={isCollapsed} setIsCollapsed={setIsCollapsed} />
        <div
          className={`flex-1 flex flex-col transition-all duration-300 ${isCollapsed ? 'ml-16' : 'ml-64'}`}
        >
          <NavbarPbf onLogout={handleLogout} username={username} />
          <main className="flex-1 flex items-center justify-center p-6 pt-[72px]">
            <div className="bg-white p-8 rounded-2xl shadow-lg border border-red-200 text-center max-w-md">
              <AlertTriangle className="mx-auto h-12 w-12 text-red-500 mb-4" />
              <h2 className="text-xl font-bold text-red-800 mb-2">Gagal Memuat Data</h2>
              <p className="text-red-600 mb-6">{error || 'Data tidak ditemukan.'}</p>
              <button
                onClick={() => navigate('/pbf/pengelolaan-pesanan')}
                className="flex items-center gap-2 px-4 py-2.5 border border-slate-300 text-slate-700 font-medium rounded-lg hover:bg-slate-100 transition mx-auto"
              >
                <ArrowLeft size={18} />
                Kembali ke Pesanan
              </button>
            </div>
          </main>
        </div>
      </div>
    );
  }

  const { pesanan, detail_pesanan } = data;
  const alasanPembatalan =
    pesanan.alasan_pembatalan ||
    (pesanan.catatan_khusus ? pesanan.catatan_khusus.split('Alasan:')[1]?.trim() : '-') ||
    'Tidak ada alasan.';

  return (
    <div className="flex min-h-screen bg-slate-50">
      <SidebarPbf isCollapsed={isCollapsed} setIsCollapsed={setIsCollapsed} />
      <div
        className={`flex-1 flex flex-col transition-all duration-300 ${isCollapsed ? 'ml-16' : 'ml-64'}`}
      >
        <NavbarPbf onLogout={handleLogout} username={username} />

        <main className="flex-1 overflow-auto pt-[72px] px-12 py-8">
          <div className="max-w-4xl mx-auto">
            {/* --- HEADER BARU --- */}
            <div className="mb-10 relative">
              <div className="absolute -top-20 -left-20 w-72 h-72 bg-red-200 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob"></div>
              <div className="absolute -top-20 -right-20 w-72 h-72 bg-yellow-200 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000"></div>

              <div className="relative">
                <button
                  onClick={() => navigate(-1)} // Kembali ke halaman sebelumnya
                  className="mb-4 inline-flex items-center text-emerald-600 hover:text-emerald-700 transition-colors text-sm font-medium"
                >
                  <ArrowLeft size={16} className="mr-1" /> Kembali
                </button>
                <div className="flex items-center gap-3">
                  <div className="flex items-center justify-center w-12 h-12 bg-gradient-to-br from-red-500 to-orange-600 rounded-xl shadow-lg">
                    <XCircle className="text-white" size={24} />
                  </div>
                  <div>
                    <h1 className="text-4xl font-bold bg-gradient-to-r from-slate-900 via-red-900 to-orange-900 bg-clip-text text-transparent">
                      Riwayat Pembatalan
                    </h1>
                    <p className="text-slate-600 text-lg mt-1">
                      Detail pesanan yang dibatalkan oleh Apotek.
                    </p>
                  </div>
                </div>
              </div>
            </div>
            {/* --- AKHIR HEADER BARU --- */}

            <div className="space-y-6 relative z-10">
              {/* KARTU STATUS DAN ALASAN */}
              <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
                <div className="bg-gradient-to-r from-slate-50 to-slate-100 px-6 py-4 border-b border-slate-200">
                  <h2 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
                    <Info size={20} /> Informasi Pembatalan
                  </h2>
                </div>
                <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Status */}
                  <div className="space-y-1">
                    <span className="text-sm font-medium text-slate-500">Status Saat Ini</span>
                    <div className="flex">
                      <span
                        className={`px-3 py-1 inline-flex text-sm leading-5 font-semibold rounded-full border ${
                          pesanan.status === 'Dibatalkan'
                            ? 'bg-red-100 text-red-800 border-red-200'
                            : 'bg-yellow-100 text-yellow-800 border-yellow-200'
                        }`}
                      >
                        {pesanan.status}
                      </span>
                    </div>
                  </div>

                  {/* Alasan */}
                  <div className="space-y-1 md:col-span-2">
                    <span className="text-sm font-medium text-slate-500">
                      Alasan Pembatalan dari Apotek
                    </span>
                    <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
                      <p className="text-sm font-semibold text-slate-900 italic">
                        "{alasanPembatalan}"
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* KARTU INFO PESANAN */}
              <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
                <div className="bg-slate-50 px-6 py-4 border-b border-slate-200">
                  <h2 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
                    <FileText size={20} /> Ringkasan Pesanan
                  </h2>
                </div>
                <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-6">
                  <InfoItem icon={User} label="Apotek Pemesan" value={pesanan.nama_apotek} />
                  <InfoItem icon={Hash} label="Nomor Pesanan" value={pesanan.nomor_pesanan} />
                  <InfoItem
                    icon={Calendar}
                    label="Tanggal Pesan"
                    value={formatDate(pesanan.tanggal_pesanan)}
                  />
                </div>
                <div className="p-6 border-t border-slate-100 flex flex-col sm:flex-row justify-between items-center gap-4 bg-slate-50">
                  <div>
                    <Link
                      to={`/pbf/pengelolaan-pesanan/surat/${pesanan.id}`}
                      className="text-sm font-medium text-emerald-600 hover:underline inline-flex items-center gap-1"
                    >
                      Lihat Surat Pesanan Asli <ExternalLink size={14} />
                    </Link>
                  </div>
                  <div className="text-left sm:text-right">
                    <p className="text-xs font-medium text-slate-500 mb-1">Total Harga</p>
                    <p className="text-xl font-bold text-red-600">
                      Rp {(pesanan.total_harga || 0).toLocaleString('id-ID')}
                    </p>
                  </div>
                </div>
              </div>

              {/* Tombol Aksi */}
              <div className="flex justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => navigate('/pbf/pengelolaan-pesanan')}
                  className="px-6 py-2.5 border border-slate-300 text-slate-700 font-medium rounded-lg hover:bg-slate-100 transition"
                >
                  Kembali
                </button>
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

// Helper komponen
const InfoItem = ({ icon: Icon, label, value }) => (
  <div className="space-y-1">
    <span className="text-xs font-medium text-slate-500 flex items-center gap-1.5">
      <Icon size={14} /> {label}
    </span>
    <p className="font-semibold text-slate-700 text-base">{value || '-'}</p>
  </div>
);

export default LihatRiwayatPembatalanApotek;
