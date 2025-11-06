import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import SidebarProdusen from '../../../components/SidebarProdusen';
import NavbarProdusen from '../../../components/NavbarProdusen';
import {
  Search,
  ArrowUpDown,
  Filter,
  X,
  Loader2,
  Package,
  AlertTriangle,
  Calendar,
  Plus,
} from 'lucide-react';
import { FaCogs } from 'react-icons/fa';
import { toast } from 'react-hot-toast';

const NavItem = ({ to, children }) => {
  const location = useLocation();
  const isActive = location.pathname === to;

  const baseClass =
    'py-2 px-4 rounded-lg text-sm font-medium transition-all duration-200 whitespace-nowrap block text-center sm:inline-block';
  const activeClass = 'bg-emerald-600 text-white shadow-md';
  const inactiveClass = 'text-slate-500 hover:text-emerald-800 hover:bg-gray-300';

  return isActive ? (
    <span className={`${baseClass} ${activeClass}`}>{children}</span>
  ) : (
    <Link to={to} className={`${baseClass} ${inactiveClass}`}>
      {children}
    </Link>
  );
};

const ManajemenProduksi = () => {
  const navigate = useNavigate();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [produksiData, setProduksiData] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const [showFilters, setShowFilters] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({
    month: '',
    year: new Date().getFullYear(),
    minJumlah: '',
    maxJumlah: '',
    status: '',
  });
  const [sortConfig, setSortConfig] = useState({ key: 'tanggal_produksi', direction: 'desc' });
  const username = localStorage.getItem('username');

  // Fungsi parse yang sama seperti di EditProduksi dan Detail: Parse full ISO sebagai UTC, ambil local components, buat local date-only
  const parseDateAsLocal = (dateString) => {
    if (!dateString) return null;
    try {
      const utcDate = new Date(dateString);
      if (isNaN(utcDate.getTime())) {
        console.warn('Invalid date string:', dateString);
        return null;
      }
      // Ambil local year, month, date dari UTC parsed (otomatis adjust timezone)
      const localYear = utcDate.getFullYear();
      const localMonth = utcDate.getMonth();
      const localDay = utcDate.getDate();

      const localDate = new Date(localYear, localMonth, localDay);

      // Debug log (hapus setelah test sukses)
      console.log(
        'Parsing in Table:',
        dateString,
        '-> Local date:',
        localDate.toLocaleDateString('id-ID')
      );

      return localDate;
    } catch (error) {
      console.error('Error parsing date in Table:', dateString, error);
      return null;
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    try {
      const localDate = parseDateAsLocal(dateString);
      if (!localDate || isNaN(localDate.getTime())) return '-';
      // Gunakan local date tanpa timeZone: 'UTC' untuk tampil local time
      return localDate.toLocaleDateString('id-ID', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      });
    } catch (e) {
      return '-';
    }
  };

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    let token;
    try {
      token = localStorage.getItem('token');
      if (!token) throw new Error('Silakan login terlebih dahulu');

      const params = new URLSearchParams();
      if (filters.month) params.append('month', filters.month);
      if (filters.year) params.append('year', String(filters.year));
      if (filters.minJumlah) params.append('minJumlah', String(filters.minJumlah));
      if (filters.maxJumlah) params.append('maxJumlah', String(filters.maxJumlah));
      if (filters.status) params.append('status', filters.status);
      if (sortConfig.key) {
        params.append('sortBy', sortConfig.key);
        params.append('sortOrder', sortConfig.direction);
      }

      const response = await fetch(
        `http://localhost:5000/api/produksi/jadwal?${params.toString()}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (!response.ok) {
        const errorData = await response.text();
        throw new Error(`Gagal mengambil data dari server: ${response.status} - ${errorData}`);
      }

      const result = await response.json();
      if (!result.success) throw new Error(result.message || 'Gagal mengambil data');

      let data = (result.data || []).filter((item) => item.status !== 'Tercatat di Blockchain');

      // Debug log untuk tanggal (hapus setelah test)
      if (data.length > 0) {
        console.log(
          'Raw API dates in Table:',
          data.slice(0, 3).map((item) => ({
            batch_id: item.batch_id,
            produksi: item.tanggal_produksi,
            kadaluarsa: item.tanggal_kadaluarsa,
          }))
        );
      }

      if (searchTerm) {
        data = data.filter(
          (item) =>
            (item.batch_id?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
            (item.nama_obat?.toLowerCase() || '').includes(searchTerm.toLowerCase())
        );
      }
      setProduksiData(data);
    } catch (error) {
      setError(error.message);
      toast.error(error.message || 'Gagal memuat data.');
      if (
        (error.message.includes('401') ||
          error.message.includes('403') ||
          error.message.includes('login')) &&
        token
      ) {
        navigate('/login/produsen');
      } else if (!token) {
        navigate('/login/produsen');
      }
    } finally {
      setIsLoading(false);
    }
  }, [filters, sortConfig, searchTerm, navigate]);

  useEffect(() => {
    const handler = setTimeout(() => {
      fetchData();
    }, 500);
    return () => clearTimeout(handler);
  }, [fetchData]);

  const handleFilterChange = (e) => {
    setFilters({ ...filters, [e.target.name]: e.target.value });
  };

  const resetFilters = () => {
    setFilters({
      month: '',
      year: new Date().getFullYear(),
      minJumlah: '',
      maxJumlah: '',
      status: '',
    });
    setSearchTerm('');
    setSortConfig({ key: 'tanggal_produksi', direction: 'desc' });
  };

  const requestSort = (key) => {
    let direction = 'ascending';
    if (sortConfig.key === key && sortConfig.direction === 'ascending') {
      direction = 'descending';
    }
    setSortConfig({ key, direction });
  };

  const handleDelete = async (id) => {
    if (
      !window.confirm(
        'Apakah Anda yakin ingin menghapus jadwal produksi ini? Ini tidak dapat dibatalkan.'
      )
    )
      return;

    setError(null);

    try {
      const token = localStorage.getItem('token');
      if (!token) throw new Error('Sesi tidak valid.');

      const response = await fetch(`http://localhost:5000/api/produksi/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || 'Gagal menghapus data');
      }

      setProduksiData(produksiData.filter((item) => item.id !== id));
      toast.success('Jadwal produksi berhasil dihapus.');
    } catch (error) {
      setError(error.message);
      toast.error(error.message || 'Gagal menghapus data.');
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'Terjadwal':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'Dalam Produksi':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'Selesai':
        return 'bg-green-100 text-green-800 border-green-200';
      default:
        return 'bg-slate-100 text-slate-800 border-slate-200';
    }
  };

  if (isLoading && produksiData.length === 0) {
    return (
      <div className="flex flex-col justify-center items-center h-screen bg-gradient-to-br from-slate-50 via-white to-emerald-50">
        <div className="relative">
          <Loader2 className="animate-spin h-12 w-12 text-emerald-600" />
          <div className="absolute inset-0 h-12 w-12 rounded-full border-4 border-emerald-200 animate-ping opacity-20"></div>
        </div>
        <p className="mt-4 text-slate-700 font-medium">Memuat data produksi...</p>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-slate-50">
      <SidebarProdusen isCollapsed={isCollapsed} setIsCollapsed={setIsCollapsed} />
      <div
        className={`flex-1 flex flex-col transition-all duration-300 ${isCollapsed ? 'ml-16' : 'ml-64'}`}
      >
        <NavbarProdusen
          onLogout={() => {
            localStorage.clear();
            navigate('/');
          }}
          username={username}
        />

        <main className="flex-1 overflow-auto pt-[72px] px-12 py-8">
          <div className="max-w-7xl mx-auto">
            <div className="mb-10 relative">
              <div className="absolute -top-20 -left-20 w-72 h-72 bg-emerald-200 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob"></div>
              <div className="absolute -top-20 -right-20 w-72 h-72 bg-teal-200 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000"></div>

              <div className="relative flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div className="flex items-center gap-3">
                  <div className="flex items-center justify-center w-12 h-12 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl shadow-lg">
                    <FaCogs className="text-white" size={24} />
                  </div>
                  <div>
                    <h1 className="text-4xl font-bold bg-gradient-to-r from-slate-900 via-emerald-900 to-teal-900 bg-clip-text text-transparent">
                      Manajemen Produksi
                    </h1>
                    <p className="text-slate-600 text-lg mt-1">
                      Kelola jadwal dan status produksi obat Anda.
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => navigate('/produsen/produksi/tambah')}
                  className="bg-emerald-600 text-white font-medium py-2.5 px-5 rounded-lg hover:bg-emerald-700 transition flex items-center gap-2 shadow-sm whitespace-nowrap w-full sm:w-auto justify-center"
                >
                  <Plus size={18} />
                  Jadwalkan Produksi
                </button>
              </div>
            </div>

            {error && (
              <div className="p-4 mb-6 bg-red-50 text-red-700 rounded-lg border border-red-200 flex items-center gap-2 text-sm">
                <AlertTriangle size={18} /> {error}
              </div>
            )}

            <div className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden relative z-10">
              <div className="p-4 border-b border-slate-200">
                <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
                  <div className="flex overflow-x-auto sm:overflow-visible w-full sm:w-auto">
                    <div className="flex space-x-2 bg-slate-100 p-1.5 rounded-lg">
                      <NavItem to="/produsen/manajemen-produksi">Jadwal Produksi</NavItem>
                      <NavItem to="/produsen/riwayat-produksi">Riwayat Produksi</NavItem>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 w-full sm:w-auto">
                    <div className="relative flex-1 sm:flex-none">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                      <input
                        type="text"
                        className="w-full sm:w-60 pl-9 pr-4 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                        placeholder="Cari batch / nama obat..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                      />
                    </div>
                    <button
                      onClick={() => setShowFilters(!showFilters)}
                      className={`p-2 border rounded-lg flex items-center gap-2 text-sm ${showFilters ? 'bg-emerald-50 text-emerald-700 border-emerald-300' : 'bg-white text-slate-600 border-slate-300 hover:bg-slate-50'}`}
                    >
                      <Filter size={16} /> Filter
                    </button>
                  </div>
                </div>

                {showFilters && (
                  <div className="p-4 bg-slate-50 mt-4 rounded-lg grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 items-end border border-slate-200">
                    <select
                      name="status"
                      value={filters.status}
                      onChange={handleFilterChange}
                      className="p-2 border border-slate-300 rounded-lg w-full text-sm"
                    >
                      <option value="">Semua Status</option>
                      <option value="Terjadwal">Terjadwal</option>
                      <option value="Dalam Produksi">Dalam Produksi</option>
                      <option value="Selesai">Selesai</option>
                    </select>
                    <select
                      name="month"
                      value={filters.month}
                      onChange={handleFilterChange}
                      className="p-2 border border-slate-300 rounded-lg w-full text-sm"
                    >
                      <option value="">Semua Bulan</option>
                      {[...Array(12).keys()].map((i) => (
                        <option key={i + 1} value={i + 1}>
                          {new Date(0, i).toLocaleString('id-ID', { month: 'long' })}
                        </option>
                      ))}
                    </select>
                    <input
                      type="number"
                      name="year"
                      value={filters.year}
                      onChange={handleFilterChange}
                      placeholder="Tahun"
                      className="p-2 border border-slate-300 rounded-lg w-full text-sm"
                    />
                    <input
                      type="number"
                      name="minJumlah"
                      value={filters.minJumlah}
                      onChange={handleFilterChange}
                      placeholder="Jumlah Min"
                      className="p-2 border border-slate-300 rounded-lg w-full text-sm"
                    />
                    <input
                      type="number"
                      name="maxJumlah"
                      value={filters.maxJumlah}
                      onChange={handleFilterChange}
                      placeholder="Jumlah Max"
                      className="p-2 border border-slate-300 rounded-lg w-full text-sm"
                    />
                    <button
                      onClick={resetFilters}
                      className="p-2 border border-red-300 rounded-lg flex items-center gap-2 text-red-600 hover:bg-red-50 justify-center text-sm"
                    >
                      <X size={16} /> Reset
                    </button>
                  </div>
                )}
              </div>

              <div className="overflow-x-auto">
                {isLoading && produksiData.length > 0 ? (
                  <div className="p-10 text-center text-slate-500">
                    <Loader2 className="animate-spin h-8 w-8 mx-auto text-emerald-600" />
                    <p className="mt-2">Memuat data produksi...</p>
                  </div>
                ) : (
                  <table className="min-w-full">
                    <thead className="bg-slate-50 border-b border-slate-200">
                      <tr>
                        {[
                          { label: 'Batch ID', key: 'batch_id' },
                          { label: 'Nama Obat', key: 'nama_obat' },
                          { label: 'Tgl. Produksi', key: 'tanggal_produksi' },
                          { label: 'Jumlah', key: 'jumlah' },
                          { label: 'Status', key: 'status' },
                        ].map((header) => (
                          <th
                            key={header.key}
                            className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider"
                          >
                            <button
                              onClick={() => requestSort(header.key)}
                              className="flex items-center gap-1 hover:text-slate-800"
                            >
                              {header.label}
                              {sortConfig.key === header.key ? (
                                sortConfig.direction === 'ascending' ? (
                                  <ArrowUpDown size={14} className="text-emerald-600" />
                                ) : (
                                  <ArrowUpDown size={14} className="text-emerald-600" />
                                )
                              ) : (
                                <ArrowUpDown size={14} className="text-slate-300" />
                              )}
                            </button>
                          </th>
                        ))}
                        <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                          Aksi
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-slate-100">
                      {produksiData.length > 0 ? (
                        produksiData.map((item) => (
                          <tr
                            key={item.id}
                            className="hover:bg-gray-50  transition-colors duration-150"
                          >
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-900 font-mono">
                              {item.batch_id}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-700">
                              {item.nama_obat}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">
                              {formatDate(item.tanggal_produksi)}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-emerald-700">
                              {item.jumlah.toLocaleString('id-ID')} Pcs
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm">
                              <span
                                className={`px-2.5 py-0.5 inline-flex text-xs leading-5 font-semibold rounded-full border ${getStatusBadge(item.status)}`}
                              >
                                {item.status}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-4">
                              <button
                                onClick={() => navigate(`/produsen/produksi/detail/${item.id}`)}
                                className="text-blue-600 hover:text-blue-800"
                                title="Lihat Detail"
                              >
                                Detail
                              </button>
                              <button
                                onClick={() => navigate(`/produsen/produksi/edit/${item.id}`)}
                                className="text-amber-600 hover:text-amber-800"
                                title="Edit"
                              >
                                Edit
                              </button>
                              <button
                                onClick={() => handleDelete(item.id)}
                                className="text-red-600 hover:text-red-800"
                                title="Hapus"
                              >
                                Hapus
                              </button>
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan="6" className="px-6 py-10 text-center text-slate-500">
                            <Package size={32} className="mx-auto mb-2 opacity-50" />
                            {searchTerm
                              ? 'Tidak ada data produksi yang sesuai.'
                              : 'Tidak ada jadwal produksi.'}
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                )}
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
export default ManajemenProduksi;
