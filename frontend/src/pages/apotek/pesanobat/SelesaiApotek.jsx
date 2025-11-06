import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import NavbarApotek from '../../../components/NavbarApotek';
import {
  Search,
  Plus,
  ShoppingCart,
  Loader2,
  AlertTriangle,
  Calendar,
  FileText,
  CheckCircle2,
} from 'lucide-react';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import NavItemApotek from '../../../components/NavItemApotek';

// --- KOMPONEN CARD PESANAN (Salin dari file utama) ---
const OrderCard = ({ item, getStatusBadge, formatDate, renderAction }) => {
  return (
    <div className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden transition-all duration-300 hover:shadow-md">
      <div className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50 border-b border-slate-200">
        <div>
          <span className="text-xs text-slate-500">Nomor Pesanan</span>
          <p className="text-sm font-semibold font-mono text-slate-900">{item.nomor_po}</p>
        </div>
        <span
          className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full border ${getStatusBadge(item.status)}`}
        >
          {item.status}
        </span>
      </div>
      <div className="p-4 grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div>
          <p className="text-xs text-slate-500">Tujuan PBF</p>
          <p className="text-sm font-medium text-slate-800">{item.nama_produsen}</p>
        </div>
        <div>
          <p className="text-xs text-slate-500">Tanggal Pesan</p>
          <p className="text-sm font-medium text-slate-600">{formatDate(item.tanggal_pesanan)}</p>
        </div>
        <div className="sm:text-right">
          <p className="text-xs text-slate-500">Total</p>
          <p className="text-sm font-semibold text-emerald-700">
            Rp {Number(item.total_harga || 0).toLocaleString('id-ID', { minimumFractionDigits: 2 })}
          </p>
        </div>
      </div>
      <div className="p-4 flex justify-end bg-slate-50/50 border-t border-slate-100">
        {renderAction(item)}
      </div>
    </div>
  );
};
// --- AKHIR KOMPONEN CARD ---

const SelesaiApotek = () => {
  const navigate = useNavigate();
  const [pesananData, setPesananData] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [dateRange, setDateRange] = useState({ startDate: null, endDate: null });
  const [isDateFilterOpen, setIsDateFilterOpen] = useState(false);
  const username = localStorage.getItem('username');

  // (Logika helper disalin dari PesanObatApotek.jsx)
  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    let token;
    try {
      token = localStorage.getItem('token');
      if (!token) {
        navigate('/login/apotek');
        return;
      }
      const response = await axios.get('http://localhost:5000/api/apotek/pesanan', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.data.success) {
        setPesananData(response.data.data || []);
      } else {
        throw new Error(response.data.message || 'Gagal mengambil data pesanan.');
      }
    } catch (err) {
      const errorMsg = err.response?.data?.message || err.message || 'Gagal memuat data pesanan.';
      setError(errorMsg);
      toast.error(errorMsg);
      if (
        (err.message.includes('401') ||
          err.message.includes('403') ||
          err.message.includes('login')) &&
        token
      ) {
        navigate('/login/apotek');
      } else if (!token) {
        navigate('/login/apotek');
      }
    } finally {
      setIsLoading(false);
    }
  }, [navigate]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleLogout = () => {
    localStorage.clear();
    navigate('/');
  };

  const filteredData = useMemo(() => {
    return pesananData
      .filter((item) => item.status === 'Selesai') // <-- FILTER HALAMAN INI
      .filter(
        (item) =>
          (item.nama_produsen?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
          (item.nomor_po?.toLowerCase() || '').includes(searchTerm.toLowerCase())
      )
      .filter((item) => {
        if (!dateRange.startDate || !dateRange.endDate) return true;
        try {
          const itemDate = new Date(item.tanggal_pesanan);
          const startDate = new Date(dateRange.startDate);
          const endDate = new Date(dateRange.endDate);
          if (isNaN(itemDate.getTime()) || isNaN(startDate.getTime()) || isNaN(endDate.getTime()))
            return false;
          startDate.setHours(0, 0, 0, 0);
          endDate.setHours(23, 59, 59, 999);
          return itemDate >= startDate && itemDate <= endDate;
        } catch (e) {
          return false;
        }
      });
  }, [pesananData, searchTerm, dateRange]);

  const getStatusBadge = (status) => {
    switch (status) {
      case 'Selesai':
        return 'bg-emerald-100 text-emerald-800 border border-emerald-200';
      default:
        return 'bg-slate-100 text-slate-700 border border-slate-200';
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return '-';
      return date.toLocaleDateString('id-ID', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        timeZone: 'UTC',
      });
    } catch {
      return '-';
    }
  };

  const renderAction = (item) => {
    const baseClasses =
      'text-sm font-semibold hover:underline transition-colors duration-150 inline-flex items-center gap-1.5 py-1 px-2 rounded-md';
    const historyClasses = 'text-purple-600 hover:text-purple-800 hover:bg-purple-50';
    const assetId = item.id_aset_blockchain;
    return assetId ? (
      <Link
        to={`/apotek/pesanan/riwayat/${assetId}`}
        className={`${baseClasses} ${historyClasses}`}
      >
        <FileText size={14} /> Lihat Riwayat
      </Link>
    ) : (
      <span className="text-slate-400 text-xs italic">(Riwayat T/A)</span>
    );
  };

  if (isLoading && pesananData.length === 0) {
    return (
      <div className="flex flex-col justify-center items-center h-screen bg-gradient-to-br from-slate-50 via-white to-emerald-50">
        <Loader2 className="animate-spin h-12 w-12 text-emerald-600" />
        <p className="mt-4 text-slate-700 font-medium">Memuat data pesanan...</p>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-slate-50">
      <div className="flex-1 flex flex-col">
        <NavbarApotek onLogout={handleLogout} username={username} />

        <main className="flex-1 overflow-auto pt-[72px] px-4 sm:px-6 lg:px-8 py-8">
          <div className="max-w-7xl mx-auto">
            <div className="mb-10 relative">
              <div className="absolute -top-20 -left-20 w-72 h-72 bg-emerald-200 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob"></div>
              <div className="absolute -top-20 -right-20 w-72 h-72 bg-teal-200 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000"></div>
              <div className="relative flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div className="flex items-center gap-3">
                  <div className="flex items-center justify-center w-12 h-12 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl shadow-lg">
                    <CheckCircle2 className="text-white" size={24} />
                  </div>
                  <div>
                    <h1 className="text-4xl font-bold bg-gradient-to-r from-slate-900 via-emerald-900 to-teal-900 bg-clip-text text-transparent">
                      Pesanan Selesai
                    </h1>
                    <p className="text-slate-600 text-lg mt-1">
                      Pesanan yang telah Anda konfirmasi.
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => navigate('/apotek/pesan-obat/tambah')}
                  className="w-full sm:w-auto flex items-center justify-center gap-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white py-2.5 px-5 rounded-lg font-medium shadow-md hover:shadow-lg transition-all duration-200 whitespace-nowrap"
                >
                  <Plus size={18} />
                  Pesan Obat Baru
                </button>
              </div>
              <div className="relative flex items-center gap-2 mt-4 text-sm text-slate-500">
                <Calendar size={16} />
                <span>
                  {new Date().toLocaleDateString('id-ID', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}
                </span>
              </div>
            </div>

            {error && (
              <div className="p-4 mb-6 bg-red-50 text-red-700 rounded-lg border border-red-200 flex items-center gap-2 text-sm">
                <AlertTriangle size={18} /> {error}
              </div>
            )}

            <div className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden relative z-10 mb-6">
              <div className="p-4 border-b border-slate-200">
                <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
                  <div className="flex overflow-x-auto sm:overflow-visible w-full sm:w-auto">
                    <div className="flex space-x-2 bg-slate-100 p-1.5 rounded-lg">
                      <NavItemApotek to="/apotek/pesan-obat">Semua</NavItemApotek>
                      <NavItemApotek to="/apotek/pesan-obat/perlu-dikirim">
                        Perlu Dikirim
                      </NavItemApotek>
                      <NavItemApotek to="/apotek/pesan-obat/dikirim">Dikirim</NavItemApotek>
                      <NavItemApotek to="/apotek/pesan-obat/selesai">Selesai</NavItemApotek>
                      <NavItemApotek to="/apotek/pesan-obat/dibatalkan">Dibatalkan</NavItemApotek>
                      <NavItemApotek to="/apotek/pesan-obat/pengembalian">
                        Pengembalian
                      </NavItemApotek>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 w-full sm:w-auto flex-shrink-0">
                    <div className="relative flex-1 sm:flex-none">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
                      <input
                        type="text"
                        placeholder="Cari No. Pesanan / Produsen..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-9 pr-4 py-2 border border-slate-300 rounded-lg w-full sm:w-64 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
                      />
                    </div>
                    {/* Filter Tanggal Opsional */}
                  </div>
                </div>
              </div>
            </div>

            <div className="overflow-x-auto">
              {isLoading && pesananData.length > 0 ? (
                <div className="p-10 text-center text-slate-500">
                  <Loader2 className="animate-spin h-8 w-8 mx-auto text-emerald-600" />
                </div>
              ) : filteredData.length > 0 ? (
                <div className="space-y-4">
                  {filteredData.map((item) => (
                    <OrderCard
                      key={item.id}
                      item={item}
                      getStatusBadge={getStatusBadge}
                      formatDate={formatDate}
                      renderAction={renderAction}
                    />
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 bg-white rounded-lg border border-dashed border-slate-300">
                  <ShoppingCart size={48} className="mx-auto mb-3 text-slate-300" />
                  <p className="text-slate-500 font-medium">
                    {searchTerm
                      ? 'Tidak ada pesanan yang sesuai.'
                      : 'Belum ada pesanan yang selesai.'}
                  </p>
                </div>
              )}
            </div>
          </div>
        </main>
      </div>
      <style jsx global>{`
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

export default SelesaiApotek;
