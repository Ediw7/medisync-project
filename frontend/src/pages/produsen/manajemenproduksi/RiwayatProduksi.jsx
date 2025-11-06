import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import {
  History,
  AlertTriangle,
  Package,
  Loader2,
  Calendar,
  Search,
  ArrowUpDown,
  FileText,
} from 'lucide-react';
import SidebarProdusen from '../../../components/SidebarProdusen';
import NavbarProdusen from '../../../components/NavbarProdusen';
import { toast } from 'react-hot-toast';

const NavItem = ({ to, children }) => {
  const location = useLocation();
  const isActive = location.pathname === to;

  const baseClass =
    'py-2 px-4 rounded-lg text-sm font-medium transition-all duration-200 whitespace-nowrap block text-center sm:inline-block';
  const activeClass = 'bg-emerald-600 text-white shadow-md';
  const inactiveClass = 'text-slate-500 hover:text-emerald-800 hover:bg-gray-300';

  if (isActive) {
    return <span className={`${baseClass} ${activeClass}`}>{children}</span>;
  }

  return (
    <Link to={to} className={`${baseClass} ${inactiveClass}`}>
      {children}
    </Link>
  );
};

const RiwayatProduksi = () => {
  const navigate = useNavigate();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [produksiData, setProduksiData] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortConfig, setSortConfig] = useState({
    key: 'tanggal_produksi',
    direction: 'descending',
  });
  const username = localStorage.getItem('username');

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    let token;
    try {
      token = localStorage.getItem('token');
      if (!token) throw new Error('Silakan login terlebih dahulu');

      const response = await fetch('http://localhost:5000/api/produksi/jadwal', {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) {
        const errorData = await response.text();
        throw new Error(`Gagal mengambil data: Status ${response.status} - ${errorData}`);
      }

      const result = await response.json();
      if (!result.success) throw new Error(result.message || 'Gagal mengambil data');
      setProduksiData(result.data || []);
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
  }, [navigate]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleLogout = () => {
    localStorage.clear();
    navigate('/');
  };

  const riwayatProduksi = useMemo(() => {
    let data = produksiData.filter((item) => item.status === 'Tercatat di Blockchain');

    if (searchTerm) {
      data = data.filter(
        (item) =>
          (item.batch_id?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
          (item.nama_obat?.toLowerCase() || '').includes(searchTerm.toLowerCase())
      );
    }

    if (sortConfig.key) {
      data.sort((a, b) => {
        let aValue = a[sortConfig.key];
        let bValue = b[sortConfig.key];

        if (aValue < bValue) {
          return sortConfig.direction === 'ascending' ? -1 : 1;
        }
        if (aValue > bValue) {
          return sortConfig.direction === 'ascending' ? 1 : -1;
        }
        return 0;
      });
    }
    return data;
  }, [produksiData, searchTerm, sortConfig]);

  const requestSort = (key) => {
    let direction = 'ascending';
    if (sortConfig.key === key && sortConfig.direction === 'ascending') {
      direction = 'descending';
    }
    setSortConfig({ key, direction });
  };

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return '-';
      return date.toLocaleDateString('id-ID', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        timeZone: 'UTC',
      });
    } catch (e) {
      return '-';
    }
  };

  if (isLoading && produksiData.length === 0) {
    return (
      <div className="flex flex-col justify-center items-center h-screen bg-gradient-to-br from-slate-50 via-white to-emerald-50">
        <div className="relative">
          <Loader2 className="animate-spin h-12 w-12 text-emerald-600" />
          <div className="absolute inset-0 h-12 w-12 rounded-full border-4 border-emerald-200 animate-ping opacity-20"></div>
        </div>
        <p className="mt-4 text-slate-700 font-medium">Memuat riwayat produksi...</p>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-slate-50">
      <SidebarProdusen isCollapsed={isCollapsed} setIsCollapsed={setIsCollapsed} />
      <div
        className={`flex-1 flex flex-col transition-all duration-300 ${isCollapsed ? 'ml-16' : 'ml-64'}`}
      >
        <NavbarProdusen onLogout={handleLogout} username={username} />

        <main className="flex-1 overflow-auto pt-[72px] px-12 py-8">
          <div className="max-w-7xl mx-auto">
            <div className="mb-10 relative">
              <div className="absolute -top-20 -left-20 w-72 h-72 bg-emerald-200 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob"></div>
              <div className="absolute -top-20 -right-20 w-72 h-72 bg-teal-200 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000"></div>

              <div className="relative flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div className="flex items-center gap-3">
                  <div className="flex items-center justify-center w-12 h-12 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl shadow-lg">
                    <History className="text-white" size={24} />
                  </div>
                  <div>
                    <h1 className="text-4xl font-bold bg-gradient-to-r from-slate-900 via-emerald-900 to-teal-900 bg-clip-text text-transparent">
                      Riwayat Produksi
                    </h1>
                    <p className="text-slate-600 text-lg mt-1">
                      Daftar produksi yang telah dicatat di blockchain.
                    </p>
                  </div>
                </div>
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
                  </div>
                </div>
              </div>

              <div className="overflow-x-auto">
                {isLoading && produksiData.length > 0 ? (
                  <div className="p-10 text-center text-slate-500">
                    <Loader2 className="animate-spin h-8 w-8 mx-auto text-emerald-600" />
                    <p className="mt-2">Memuat riwayat produksi...</p>
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
                                <ArrowUpDown size={14} className="text-emerald-600" />
                              ) : (
                                <ArrowUpDown size={14} className="text-slate-300" />
                              )}
                            </button>
                          </th>
                        ))}
                        <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                          QR Code
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                          Aksi
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-slate-100">
                      {riwayatProduksi.length > 0 ? (
                        riwayatProduksi.map((item) => (
                          <tr
                            key={item.id}
                            className="hover:bg-gray-50 transition-colors duration-150"
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
                              <span className="px-2.5 py-0.5 inline-flex text-xs leading-5 font-semibold rounded-full border bg-emerald-100 text-emerald-800 border-emerald-200">
                                {item.status}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm">
                              {item.qr_code_url ? (
                                <img
                                  src={item.qr_code_url}
                                  alt="QR Code"
                                  className="w-16 h-16 rounded-md border border-slate-200 p-1 bg-white"
                                />
                              ) : (
                                <span className="text-xs text-slate-400 italic">T/A</span>
                              )}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                              <button
                                onClick={() => navigate(`/produsen/produksi/detail/${item.id}`)}
                                className="text-blue-600 hover:text-blue-800 font-semibold"
                                title="Lihat Detail"
                              >
                                Detail
                              </button>
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan="7" className="px-6 py-10 text-center text-slate-500">
                            <Package size={32} className="mx-auto mb-2 opacity-50" />
                            {searchTerm
                              ? 'Tidak ada riwayat yang sesuai pencarian.'
                              : 'Belum ada produksi yang dicatat di blockchain.'}
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

export default RiwayatProduksi;
