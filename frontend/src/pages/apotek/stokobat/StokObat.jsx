import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import NavbarApotek from '../../../components/NavbarApotek';
import { Search, Loader2, Box, Truck, Package, TrendingUp, ArrowUpRight } from 'lucide-react';
import axios from 'axios';

const StatCard = ({ icon, value, label, unit }) => (
  <div className="group relative bg-white p-6 rounded-2xl shadow-sm border border-slate-200 hover:shadow-lg hover:border-slate-300 transition-all duration-300 overflow-hidden">
    <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-emerald-500 to-teal-600 opacity-5 rounded-full -mr-16 -mt-16 group-hover:scale-150 transition-transform duration-500"></div>

    <div className="relative flex items-start justify-between">
      <div className="flex-1">
        <div className="flex items-center gap-2 mb-3">
          <div className="p-2.5 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 shadow-lg">
            {React.cloneElement(icon, { className: 'text-white', size: 24 })}
          </div>
        </div>

        <p className="text-3xl font-bold text-slate-900 mb-1">
          {value.toLocaleString('id-ID')}
          <span className="text-lg font-medium text-slate-500 ml-1">{unit}</span>
        </p>
        <p className="text-sm text-slate-600 font-medium">{label}</p>
      </div>

      <ArrowUpRight
        className="text-slate-300 group-hover:text-slate-400 transition-colors"
        size={20}
      />
    </div>
  </div>
);

const StokObat = () => {
  const navigate = useNavigate();
  const [stokData, setStokData] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('Semua');

  const [stats, setStats] = useState({
    totalStok: 0,
    distribusiBulanIni: 0,
    stokMenipis: 0,
  });

  useEffect(() => {
    const fetchStokApotek = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          navigate('/login/apotek');
          return;
        }

        const response = await axios.get('http://localhost:5000/api/apotek/stok', {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (response.data.success) {
          const formattedData = response.data.data.map((item) => {
            let status_stok;
            if (item.jumlah === 0) {
              status_stok = 'Habis';
            } else if (item.jumlah < 2000) {
              status_stok = 'Menipis';
            } else {
              status_stok = 'Tersedia';
            }

            return {
              id: item.id,
              batch_id: item.id,
              nama_obat: item.namaObat,
              jumlah: item.jumlah,
              tanggal_kadaluarsa: item.tanggalKadaluarsa,
              manufaktur: item.namaPerusahaan || 'N/A',
              status_stok: status_stok,
            };
          });
          setStokData(formattedData);

          const total = formattedData.reduce((sum, item) => sum + item.jumlah, 0);
          const menipis = formattedData.filter((item) => item.status_stok === 'Menipis').length;

          setStats({
            totalStok: total,
            distribusiBulanIni: 0,
            stokMenipis: menipis,
          });
        } else {
          throw new Error(response.data.message || 'Gagal memuat data stok.');
        }
      } catch (err) {
        setError(err.response?.data?.message || 'Terjadi kesalahan saat mengambil data.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchStokApotek();
  }, [navigate]);

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
          item.batch_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
          item.nama_obat.toLowerCase().includes(searchTerm.toLowerCase())
      );
  }, [stokData, searchTerm, statusFilter]);

  const getStatusBadge = (status) => {
    switch (status) {
      case 'Tersedia':
        return 'bg-emerald-50 text-emerald-700 border border-emerald-200';
      case 'Menipis':
        return 'bg-amber-50 text-amber-700 border border-amber-200';
      case 'Habis':
        return 'bg-red-50 text-red-700 border border-red-200';
      default:
        return 'bg-slate-50 text-slate-700 border border-slate-200';
    }
  };

  const formatDate = (tanggal) => {
    if (!tanggal || isNaN(new Date(tanggal))) return 'N/A';
    return new Date(tanggal).toLocaleDateString('id-ID', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    });
  };

  if (isLoading) {
    return (
      <div className="flex flex-col justify-center items-center h-screen bg-gradient-to-br from-slate-50 via-white to-emerald-50">
        <div className="relative">
          <Loader2 className="animate-spin h-12 w-12 text-emerald-600" />
          <div className="absolute inset-0 h-12 w-12 rounded-full border-4 border-emerald-200 animate-ping opacity-20"></div>
        </div>
        <p className="mt-4 text-slate-700 font-medium">Memuat data stok...</p>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-slate-50 via-white to-emerald-50">
      <div className="flex-1 flex flex-col">
        <NavbarApotek onLogout={handleLogout} />

        <main className="flex-1 overflow-auto pt-[72px]">
          <div className="max-w-7xl mx-auto px-6 py-8">
            {/* Header */}
            <div className="mb-8">
              <h1 className="text-3xl font-bold text-slate-900 mb-2">Mengelola Stok Obat</h1>
              <p className="text-slate-600">Pantau dan kelola inventori obat Anda</p>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <StatCard icon={<Package />} value={stats.totalStok} label="Total Stok" unit="box" />
              <StatCard
                icon={<Truck />}
                value={stats.distribusiBulanIni}
                label="Distribusi Bulan Ini"
                unit="unit"
              />
              <StatCard
                icon={<Box />}
                value={stats.stokMenipis}
                label="Item Stok Menipis"
                unit="jenis"
              />
            </div>

            {error && (
              <div className="p-4 mb-6 bg-red-50 text-red-700 rounded-2xl border border-red-200 flex items-center gap-3 shadow-sm">
                <span className="font-medium">{error}</span>
              </div>
            )}

            {/* Table Card */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
              <div className="p-6 border-b border-slate-200 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div className="relative flex-grow w-full sm:w-auto">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                  <input
                    type="text"
                    className="w-full sm:w-80 pl-10 pr-4 py-2.5 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
                    placeholder="Cari batch atau nama obat..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
                <div className="w-full sm:w-auto">
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="w-full sm:w-auto px-4 py-2.5 border border-slate-300 rounded-xl text-slate-700 bg-white hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all cursor-pointer"
                  >
                    <option value="Semua">Semua Status</option>
                    <option value="Tersedia">Tersedia</option>
                    <option value="Menipis">Menipis</option>
                    <option value="Habis">Habis</option>
                  </select>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="min-w-full">
                  <thead>
                    <tr className="border-b-2 border-slate-200 bg-slate-50">
                      <th className="px-6 py-4 text-left text-xs font-bold text-slate-600 uppercase tracking-wider">
                        Batch ID
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-bold text-slate-600 uppercase tracking-wider">
                        Nama Obat
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-bold text-slate-600 uppercase tracking-wider">
                        Manufaktur
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-bold text-slate-600 uppercase tracking-wider">
                        Stok
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-bold text-slate-600 uppercase tracking-wider">
                        Tanggal Kadaluarsa
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-bold text-slate-600 uppercase tracking-wider">
                        Status
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredData.length > 0 ? (
                      filteredData.map((item) => (
                        <tr key={item.id} className="hover:bg-slate-50 transition-colors">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className="text-sm font-mono text-slate-900 bg-slate-100 px-2 py-1 rounded">
                              {item.batch_id}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-slate-900">
                            {item.nama_obat}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">
                            {item.manufaktur}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-emerald-700">
                            {item.jumlah} box
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">
                            {formatDate(item.tanggal_kadaluarsa)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span
                              className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusBadge(item.status_stok)}`}
                            >
                              {item.status_stok}
                            </span>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="6" className="text-center py-12">
                          <Package size={48} className="mx-auto mb-3 text-slate-300" />
                          <p className="text-slate-500 font-medium">
                            {searchTerm || statusFilter !== 'Semua'
                              ? 'Tidak ada stok yang sesuai dengan filter.'
                              : 'Belum ada stok obat.'}
                          </p>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default StokObat;
