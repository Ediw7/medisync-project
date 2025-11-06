import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import NavbarApotek from '../../../components/NavbarApotek';
import {
  Search,
  Plus,
  History,
  Loader2,
  AlertTriangle,
  Calendar,
  FileText,
  Info,
} from 'lucide-react';
import axios from 'axios';
import { toast } from 'react-hot-toast';

const OrderCard = ({ item, getStatusBadge, formatDate, renderAction }) => {
  return (
    <div className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden transition-all duration-300 hover:shadow-md">
      {/* Card Header: PO Num + Status */}
      <div className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50 border-b border-slate-200">
        <div>
          <span className="text-xs text-slate-500">Nomor Pesanan</span>
          <p className="text-sm font-semibold font-mono text-slate-900">{item.nomor_pesanan}</p>
        </div>
        <span
          className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full border ${getStatusBadge(item.status)}`}
        >
          {item.status}
        </span>
      </div>

      {/* Card Body: PBF, Date, Price */}
      <div className="p-4 grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div>
          <p className="text-xs text-slate-500">PBF (Pengirim)</p>
          <p className="text-sm font-medium text-slate-800">{item.nama_pbf || 'N/A'}</p>
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

      {/* Card Footer: Actions */}
      <div className="p-4 flex justify-end bg-slate-50/50 border-t border-slate-100">
        {renderAction(item)}
      </div>
    </div>
  );
};
// --- AKHIR KOMPONEN CARD ---

const RiwayatPembelian = () => {
  const navigate = useNavigate();
  const [riwayatData, setRiwayatData] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('Semua');
  const [sortConfig, setSortConfig] = useState({ key: 'tanggal_pesanan', direction: 'descending' });
  const username = localStorage.getItem('username');

  // HAPUS BARIS YANG ERROR:
  // const assetId = item.id_aset_blockchain;

  useEffect(() => {
    const fetchRiwayat = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          toast.error('Sesi tidak valid, silakan login kembali.');
          navigate('/login/apotek');
          return;
        }
        const response = await axios.get('http://localhost:5000/api/apotek/pesanan', {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (response.data.success) {
          setRiwayatData(response.data.data || []);
        } else {
          throw new Error(response.data.message || 'Gagal mengambil data riwayat.');
        }
      } catch (err) {
        const errorMsg = err.response?.data?.message || err.message;
        setError(errorMsg);
        toast.error(errorMsg);
        if (err.response?.status === 401 || err.response?.status === 403) {
          navigate('/login/apotek');
        }
      } finally {
        setIsLoading(false);
      }
    };
    fetchRiwayat();
  }, [navigate]);

  const filteredData = useMemo(() => {
    // Ini adalah status final yang masuk ke riwayat
    const relevantStatuses = [
      'Selesai',
      'Dibatalkan',
      'Pengembalian Selesai',
      'Pengembalian Ditolak',
    ];

    return riwayatData
      .filter((item) => {
        if (statusFilter !== 'Semua') {
          return item.status === statusFilter;
        }
        return relevantStatuses.includes(item.status);
      })
      .filter(
        (item) =>
          (item.nomor_pesanan?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
          (item.nama_pbf?.toLowerCase() || '').includes(searchTerm.toLowerCase())
      );
  }, [riwayatData, searchTerm, statusFilter]);

  // --- LOGIKA SORTING (TETAP DIPAKAI) ---
  const sortedData = useMemo(() => {
    let sortableData = [...filteredData];
    if (sortConfig.key) {
      sortableData.sort((a, b) => {
        let aValue = a[sortConfig.key];
        let bValue = b[sortConfig.key];

        if (aValue == null) aValue = '';
        if (bValue == null) bValue = '';

        if (sortConfig.key === 'tanggal_pesanan') {
          aValue = new Date(aValue);
          bValue = new Date(bValue);
        }

        if (aValue < bValue) return sortConfig.direction === 'ascending' ? -1 : 1;
        if (aValue > bValue) return sortConfig.direction === 'ascending' ? 1 : -1;
        return 0;
      });
    }
    return sortableData;
  }, [filteredData, sortConfig]);

  const requestSort = (key) => {
    let direction = 'ascending';
    if (sortConfig.key === key && sortConfig.direction === 'ascending') {
      direction = 'descending';
    }
    setSortConfig({ key, direction });
  };
  // --- AKHIR LOGIKA SORTING ---

  const getStatusBadge = (status) => {
    switch (status) {
      case 'Selesai':
        return 'bg-emerald-100 text-emerald-800 border border-emerald-200';
      case 'Dibatalkan':
        return 'bg-red-100 text-red-800 border border-red-200';
      case 'Pengembalian Selesai':
        return 'bg-teal-100 text-teal-800 border border-teal-200';
      case 'Pengembalian Ditolak':
        return 'bg-pink-100 text-pink-800 border border-pink-200';
      default:
        return 'bg-slate-100 text-slate-700 border border-slate-200';
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('id-ID', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
      timeZone: 'UTC',
    });
  };

  // --- RENDER AKSI (DIPERBAIKI) ---
  const renderAction = (item) => {
    const baseClasses =
      'text-sm font-semibold hover:underline transition-colors duration-150 inline-flex items-center gap-1.5 py-1 px-2 rounded-md';
    const historyClasses = 'text-purple-600 hover:text-purple-800 hover:bg-purple-50';
    const detailClasses = 'text-slate-600 hover:text-slate-800 hover:bg-slate-100';

    // AMBIL ASSET ID DI DALAM FUNGSI INI
    const assetId = item.detail_pesanan?.[0]?.blockchain_asset_id;

    // Jika Selesai dan ADA assetId, tampilkan link riwayat
    if (item.status === 'Selesai' && assetId) {
      return (
        <Link
          to={`/apotek/pesanan/riwayat/${assetId}`}
          className={`${baseClasses} ${historyClasses}`}
        >
          <FileText size={14} /> Lihat Riwayat
        </Link>
      );
    }

    // Jika Pengembalian, tampilkan link lacak retur
    if (item.status.includes('Pengembalian')) {
      return (
        <Link
          to={`/apotek/pesanan/${item.id}/lacak-pengembalian`}
          className={`${baseClasses} ${historyClasses}`}
        >
          Lacak Retur
        </Link>
      );
    }

    // Untuk status lain (Dibatalkan, Selesai tapi tidak ada assetId)
    return (
      <Link to={`/apotek/pesanan/${item.id}/detail`} className={`${baseClasses} ${detailClasses}`}>
        <Info size={14} /> Lihat Detail
      </Link>
    );
  };
  // --- AKHIR RENDER AKSI ---

  const handleLogout = () => {
    localStorage.clear();
    navigate('/');
  };

  if (isLoading && riwayatData.length === 0) {
    return (
      <div className="flex flex-col justify-center items-center h-screen bg-gradient-to-br from-slate-50 via-white to-emerald-50">
        <div className="relative">
          <Loader2 className="animate-spin h-12 w-12 text-emerald-600" />
          <div className="absolute inset-0 h-12 w-12 rounded-full border-4 border-emerald-200 animate-ping opacity-20"></div>
        </div>
        <p className="mt-4 text-slate-700 font-medium">Memuat riwayat pembelian...</p>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-slate-50">
      <div className="flex-1 flex flex-col">
        <NavbarApotek onLogout={handleLogout} username={username} />

        <main className="flex-1 overflow-auto pt-[72px] px-4 sm:px-6 lg:px-8 py-8">
          <div className="max-w-7xl mx-auto">
            {/* Header */}
            <div className="mb-10 relative">
              <div className="absolute -top-20 -left-20 w-72 h-72 bg-purple-200 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob"></div>
              <div className="absolute -top-20 -right-20 w-72 h-72 bg-teal-200 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000"></div>

              <div className="relative flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div className="flex items-center gap-3">
                  <div className="flex items-center justify-center w-12 h-12 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-xl shadow-lg">
                    <History className="text-white" size={24} />
                  </div>
                  <div>
                    <h1 className="text-4xl font-bold bg-gradient-to-r from-slate-900 via-purple-900 to-indigo-900 bg-clip-text text-transparent">
                      Riwayat Pembelian
                    </h1>
                    <p className="text-slate-600 text-lg mt-1">
                      Melihat riwayat pesanan yang telah selesai atau dibatalkan.
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => navigate('/apotek/pesan-obat')}
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

            {/* Main Card */}
            <div className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden relative z-10 mb-6">
              {/* Filters */}
              <div className="p-4 border-b border-slate-200">
                <div className="flex flex-col md:flex-row gap-4">
                  <div className="relative flex-grow">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <input
                      type="text"
                      placeholder="Cari No. Pesanan atau Nama PBF..."
                      className="w-full pl-9 pr-4 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </div>
                  <div className="w-full md:w-auto">
                    <select
                      className="w-full md:w-48 px-4 py-2 border border-slate-300 rounded-lg text-slate-700 bg-white hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all cursor-pointer"
                      value={statusFilter}
                      onChange={(e) => setStatusFilter(e.target.value)}
                    >
                      <option value="Semua">Semua Status Riwayat</option>
                      <option value="Selesai">Selesai</option>
                      <option value="Dibatalkan">Dibatalkan</option>
                      <option value="Pengembalian Selesai">Pengembalian Selesai</option>
                      <option value="Pengembalian Ditolak">Pengembalian Ditolak</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>

            {/* Daftar Kartu (Pengganti Tabel) */}
            <div className="overflow-x-auto">
              {isLoading && riwayatData.length > 0 ? (
                <div className="p-10 text-center text-slate-500">
                  <Loader2 className="animate-spin h-8 w-8 mx-auto text-emerald-600" />
                </div>
              ) : sortedData.length > 0 ? (
                <div className="space-y-4">
                  {sortedData.map((item) => (
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
                  <History size={48} className="mx-auto mb-3 text-slate-300" />
                  <p className="text-slate-500 font-medium">
                    {searchTerm || statusFilter !== 'Semua'
                      ? 'Tidak ada riwayat yang sesuai dengan filter.'
                      : 'Belum ada riwayat pembelian.'}
                  </p>
                </div>
              )}
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

export default RiwayatPembelian;
