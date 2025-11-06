import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import SidebarProdusen from '../../../components/SidebarProdusen';
import NavbarProdusen from '../../../components/NavbarProdusen';
import {
  Search,
  Package,
  Truck,
  Box,
  AlertTriangle,
  Loader2,
  TrendingUp,
  ArrowUpRight,
  Calendar,
} from 'lucide-react';
import { FaChartLine } from 'react-icons/fa';

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

const MonitoringStok = () => {
  const navigate = useNavigate();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [stokData, setStokData] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('Semua');
  const [namaProdusen, setNamaProdusen] = useState('');
  const [stats, setStats] = useState({
    totalStok: 0,
    distribusiBulanIni: 0,
    stokMenipis: 0,
  });
  const username = localStorage.getItem('username');

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    let token;
    try {
      token = localStorage.getItem('token');
      if (!token) throw new Error('Silakan login terlebih dahulu');

      const storedNamaProdusen = localStorage.getItem('namaResmi');
      if (storedNamaProdusen) {
        setNamaProdusen(storedNamaProdusen);
      }

      const [stokResponse, distribusiResponse] = await Promise.all([
        fetch('http://localhost:5000/api/produksi/jadwal', {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch('http://localhost:5000/api/produsen/riwayat-distribusi', {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ]);

      if (!stokResponse.ok) {
        const errorData = await stokResponse.text();
        throw new Error(`Gagal mengambil data stok: ${stokResponse.status} - ${errorData}`);
      }
      if (!distribusiResponse.ok) {
        console.warn(`Gagal mengambil data distribusi: ${distribusiResponse.status}`);
      }

      const stokResult = await stokResponse.json();
      if (!stokResult.success) throw new Error(stokResult.message || 'Gagal memuat data stok.');

      const distribusiResult = await distribusiResponse
        .json()
        .catch(() => ({ success: false, data: [] }));
      const data = stokResult.data || [];
      let total = 0;
      let totalMenipisQuantity = 0;

      const dataWithStockStatus = data.map((item) => {
        const currentStock = item.jumlah || 0;
        total += currentStock;
        let status_stok = 'Tersedia';
        if (currentStock === 0) {
          status_stok = 'Habis';
        } else if (currentStock < 2000) {
          status_stok = 'Menipis';
          totalMenipisQuantity += currentStock;
        }
        return { ...item, status_stok };
      });

      const distribusiBulanIni = (distribusiResult.data || [])
        .filter((item) => {
          if (!item.tanggal_pengiriman) return false;
          const bulanIni = new Date().getMonth();
          const tahunIni = new Date().getFullYear();
          const tanggalData = new Date(item.tanggal_pengiriman);
          return tanggalData.getMonth() === bulanIni && tanggalData.getFullYear() === tahunIni;
        })
        .reduce((sum, item) => sum + Number(item.jumlah_total_obat || 0), 0);

      setStokData(dataWithStockStatus);
      setStats({
        totalStok: total,
        distribusiBulanIni: distribusiBulanIni,
        stokMenipis: totalMenipisQuantity,
      });
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

  const filteredData = useMemo(() => {
    return stokData
      .filter((item) => {
        if (statusFilter === 'Semua') return true;
        return item.status_stok === statusFilter;
      })
      .filter(
        (item) =>
          item.batch_id?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          item.nama_obat?.toLowerCase().includes(searchTerm.toLowerCase())
      );
  }, [stokData, searchTerm, statusFilter]);

  const StatCard = ({ icon, value, label, unit, trend, color = 'emerald', isCurrency = false }) => {
    const colorClasses = {
      emerald: {
        bg: 'bg-gradient-to-br from-emerald-400 to-emerald-600',
        text: 'text-emerald-600',
        bgLight: 'bg-emerald-50',
      },
      blue: {
        bg: 'bg-gradient-to-br from-blue-400 to-blue-600',
        text: 'text-blue-600',
        bgLight: 'bg-blue-50',
      },
      purple: {
        bg: 'bg-gradient-to-br from-purple-400 to-purple-600',
        text: 'text-purple-600',
        bgLight: 'bg-purple-50',
      },
      orange: {
        bg: 'bg-gradient-to-br from-orange-400 to-orange-600',
        text: 'text-orange-600',
        bgLight: 'bg-orange-50',
      },
      red: {
        bg: 'bg-gradient-to-br from-red-400 to-red-600',
        text: 'text-red-600',
        bgLight: 'bg-red-50',
      },
    };
    const selectedColor = colorClasses[color] || colorClasses.emerald;

    return (
      <div className="group relative bg-white p-5 rounded-xl shadow-sm border border-slate-200 hover:shadow-lg hover:border-slate-300 transition-all duration-300 overflow-hidden">
        <div
          className={`absolute -top-4 -right-4 w-24 h-24 ${selectedColor.bgLight} rounded-full opacity-50 blur-lg group-hover:scale-125 transition-transform duration-500`}
        ></div>
        <ArrowUpRight
          className="absolute top-4 right-4 text-slate-300 group-hover:text-slate-400 transition-colors"
          size={18}
        />

        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-3">
            <div className={`p-2.5 rounded-lg ${selectedColor.bg} shadow-md`}>
              {React.cloneElement(icon, { className: 'text-white', size: 20 })}
            </div>
            {trend && (
              <span
                className={`flex items-center text-xs font-semibold ${selectedColor.text} ${selectedColor.bgLight} px-2 py-1 rounded-full`}
              >
                <TrendingUp size={12} className="mr-1" />
                {trend}
              </span>
            )}
          </div>

          <p className="text-3xl font-bold text-slate-900 mb-0.5">
            {isCurrency ? `Rp ${value.toLocaleString('id-ID')}` : value.toLocaleString('id-ID')}
            {unit && <span className="text-lg font-medium text-slate-500 ml-1">{unit}</span>}
          </p>
          <p className="text-sm text-slate-600 font-medium">{label}</p>
        </div>
      </div>
    );
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'Tersedia':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'Menipis':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'Habis':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-slate-100 text-slate-800 border-slate-200';
    }
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

  if (isLoading && stokData.length === 0) {
    return (
      <div className="flex flex-col justify-center items-center h-screen bg-gradient-to-br from-slate-50 via-white to-emerald-50">
        <div className="relative">
          <Loader2 className="animate-spin h-12 w-12 text-emerald-600" />
          <div className="absolute inset-0 h-12 w-12 rounded-full border-4 border-emerald-200 animate-ping opacity-20"></div>
        </div>
        <p className="mt-4 text-slate-700 font-medium">Memuat Monitoring Stok...</p>
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

              <div className="relative">
                <div className="flex items-center gap-3 mb-3">
                  <div className="flex items-center justify-center w-12 h-12 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl shadow-lg">
                    <FaChartLine className="text-white" size={24} />
                  </div>
                  <div>
                    <h1 className="text-4xl font-bold bg-gradient-to-r from-slate-900 via-emerald-900 to-teal-900 bg-clip-text text-transparent">
                      Monitoring Stok
                    </h1>
                    <p className="text-slate-600 text-lg mt-1">
                      Pantau ketersediaan stok obat di gudang Anda.
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 mt-2 text-sm text-slate-500">
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
            </div>

            {error && (
              <div className="p-4 mb-6 bg-red-50 text-red-700 rounded-lg border border-red-200 flex items-center gap-2">
                <AlertTriangle size={18} /> Error: {error}
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
              <StatCard
                icon={<Box />}
                value={stats.totalStok}
                label="Total Stok Gudang"
                unit="Pcs"
                color="emerald"
              />
              <StatCard
                icon={<Truck />}
                value={stats.distribusiBulanIni}
                label="Distribusi Bulan Ini"
                unit="Pcs"
                color="blue"
              />
              <StatCard
                icon={<AlertTriangle />}
                value={stats.stokMenipis}
                label="Total Stok Menipis"
                unit="Pcs"
                color="orange"
              />
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden relative z-10">
              <div className="p-4 border-b border-slate-200 flex flex-col sm:flex-row justify-between items-center gap-4">
                <div className="flex overflow-x-auto sm:overflow-visible w-full sm:w-auto">
                  <div className="flex space-x-2 bg-slate-100 p-1.5 rounded-lg">
                    <NavItem to="/produsen/monitoring-stok">Stok Gudang</NavItem>
                    <NavItem to="/produsen/riwayat-distribusi">Riwayat Distribusi</NavItem>
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
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="p-2 border border-slate-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 appearance-none"
                  >
                    <option value="Semua">Semua Status</option>
                    <option value="Tersedia">Tersedia</option>
                    <option value="Menipis">Menipis</option>
                    <option value="Habis">Habis</option>
                  </select>
                </div>
              </div>

              <div className="overflow-x-auto">
                {isLoading && stokData.length > 0 ? (
                  <div className="p-10 text-center text-slate-500">Memperbarui data tabel...</div>
                ) : (
                  <table className="min-w-full">
                    <thead className="bg-slate-50 border-b border-slate-200">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                          Batch ID
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                          Nama Obat
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                          Stok
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                          Exp. Date
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                          Status
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                          Produsen
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                          Aksi
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-slate-100">
                      {filteredData.length > 0 ? (
                        filteredData.map((item) => (
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
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-emerald-700">
                              {item.jumlah?.toLocaleString('id-ID') || '0'} Pcs
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">
                              {formatDate(item.tanggal_kadaluarsa)}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span
                                className={`px-2.5 py-0.5 inline-flex text-xs leading-5 font-semibold rounded-full border ${getStatusBadge(item.status_stok)}`}
                              >
                                {item.status_stok || 'N/A'}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">
                              {namaProdusen || '-'}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                              <button
                                onClick={() => navigate(`/produsen/produksi/detailstok/${item.id}`)}
                                className="text-emerald-600 hover:text-emerald-800 p-1 hover:bg-emerald-100 rounded-md transition-colors"
                              >
                                Lihat Detail
                              </button>
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan="7" className="px-6 py-10 text-center text-slate-500">
                            <Package size={32} className="mx-auto mb-2 opacity-50" />
                            {searchTerm
                              ? 'Tidak ada data stok yang sesuai.'
                              : 'Tidak ada data stok tersedia.'}
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
export default MonitoringStok;
