import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import SidebarApotek from '../../../components/SidebarApotek';
import NavbarApotek from '../../../components/NavbarApotek';
import { Search, Loader2, Box, Truck, Package } from 'lucide-react';
import axios from 'axios';

// Komponen untuk kartu statistik
const StatCard = ({ icon, value, label, unit }) => (
    <div className="bg-white p-6 rounded-xl shadow-lg flex items-center gap-6">
        <div className="bg-emerald-100 p-4 rounded-full">
            {icon}
        </div>
        <div>
            <p className="text-3xl font-bold text-gray-800">{value.toLocaleString('id-ID')} <span className="text-xl font-medium text-gray-500">{unit}</span></p>
            <p className="text-gray-500">{label}</p>
        </div>
    </div>
);

const StokObat = () => {
  const navigate = useNavigate();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [stokData, setStokData] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('Semua');

  // State untuk menampung data statistik
  const [stats, setStats] = useState({
    totalStok: 0,
    distribusiBulanIni: 0, // Placeholder
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
          headers: { 'Authorization': `Bearer ${token}` },
        });

        if (response.data.success) {
          const formattedData = response.data.data.map(item => {
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

          // Kalkulasi statistik dari data yang sudah diformat
          const total = formattedData.reduce((sum, item) => sum + item.jumlah, 0);
          const menipis = formattedData.filter(item => item.status_stok === 'Menipis').length;

          setStats({
            totalStok: total,
            distribusiBulanIni: 0, // Nilai placeholder
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
      .filter(item => {
        if (statusFilter === 'Semua') return true;
        return item.status_stok === statusFilter;
      })
      .filter(item =>
        item.batch_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.nama_obat.toLowerCase().includes(searchTerm.toLowerCase())
      );
  }, [stokData, searchTerm, statusFilter]);

  const getStatusBadge = (status) => {
    switch (status) {
      case 'Tersedia': return 'bg-green-100 text-green-800';
      case 'Menipis': return 'bg-yellow-100 text-yellow-800';
      case 'Habis': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };
  
  const formatDate = (tanggal) => {
    if (!tanggal || isNaN(new Date(tanggal))) return 'N/A';
    return new Date(tanggal).toLocaleDateString('id-ID', {
      day: '2-digit', month: 'long', year: 'numeric'
    });
  };

  return (
    <div className="flex min-h-screen bg-gray-50">
      <SidebarApotek isCollapsed={isCollapsed} setIsCollapsed={setIsCollapsed} />
      <div className={`flex-1 flex flex-col transition-all duration-300 ${isCollapsed ? 'ml-16' : 'ml-64'}`}>
        <NavbarApotek onLogout={handleLogout} />
        <main className="pt-16 p-6 mt-8 ml-8">
          <h1 className="text-2xl font-bold mb-6">Mengelola Stok Obat</h1>

          {/* Bagian Kartu Statistik (Tidak Dihapus) */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <StatCard icon={<Package size={32} className="text-emerald-600"/>} value={stats.totalStok} label="Total Stok" unit="box" />
            <StatCard icon={<Truck size={32} className="text-emerald-600"/>} value={stats.distribusiBulanIni} label="Distribusi Bulan Ini" unit="unit" />
            <StatCard icon={<Box size={32} className="text-emerald-600"/>} value={stats.stokMenipis} label="Item Stok Menipis" unit="jenis" />
          </div>

          {error && <div className="mb-4 p-4 bg-red-100 text-red-700 rounded">{error}</div>}

          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="p-4 border-b flex justify-between items-center gap-4">
                <div className="relative flex-grow">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <input type="text" className="w-full max-w-xs pl-10 pr-4 py-2 border rounded-lg" placeholder="Cari batch atau nama obat..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
                </div>
                <div className="flex items-center">
                    <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="p-2 border rounded-lg text-gray-600 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-emerald-500">
                        <option value="Semua">Semua Status</option>
                        <option value="Tersedia">Tersedia</option>
                        <option value="Menipis">Menipis</option>
                        <option value="Habis">Habis</option>
                    </select>
                </div>
            </div>

            <div className="overflow-x-auto">
              {isLoading ? (
                <div className="flex justify-center items-center py-10">
                  <Loader2 className="animate-spin h-6 w-6 text-emerald-600" />
                  <p className="ml-2 text-gray-600">Memuat data stok dari blockchain...</p>
                </div>
              ) : (
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Batch ID</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Nama Obat</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Manufaktur</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Stok</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tanggal Kadaluwarsa</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredData.length > 0 ? filteredData.map((item) => (
                      <tr key={item.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{item.batch_id}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item.nama_obat}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item.manufaktur}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item.jumlah} box</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{formatDate(item.tanggal_kadaluarsa)}</td>
                        <td className="px-6 py-4 whitespace-nowrap">
                           <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusBadge(item.status_stok)}`}>
                            {item.status_stok}
                           </span>
                        </td>
                      </tr>
                    )) : (
                        <tr>
                            <td colSpan="6" className="text-center py-10 text-gray-500">
                                {searchTerm || statusFilter !== 'Semua' ? "Tidak ada stok yang sesuai dengan filter." : "Belum ada stok obat."}
                            </td>
                        </tr>
                    )}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};
export default StokObat;