import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import SidebarProdusen from '../../../components/SidebarProdusen';
import NavbarProdusen from '../../../components/NavbarProdusen';
import { Search, Eye, Package, Truck, Box } from 'lucide-react';

const MonitoringStok = () => {
  const navigate = useNavigate();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [stokData, setStokData] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('Semua');

  // State for nama produsen and stats
  const [namaProdusen, setNamaProdusen] = useState('');
  const [stats, setStats] = useState({
    totalStok: 0,
    distribusiBulanIni: 0,
    stokMenipis: 0,
  });

  useEffect(() => {
    // Ambil nama resmi saat komponen dimuat
    const storedNamaProdusen = localStorage.getItem('namaResmi');
    if (storedNamaProdusen) {
      setNamaProdusen(storedNamaProdusen);
    }

    const fetchData = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const token = localStorage.getItem('token');
        if (!token) throw new Error('Silakan login terlebih dahulu');

        const response = await fetch('http://localhost:5000/api/produksi/jadwal', {
          headers: { 'Authorization': `Bearer ${token}` },
        });

        if (!response.ok) throw new Error('Gagal mengambil data');

        const result = await response.json();
        if (!result.success) throw new Error(result.message);

        const data = result.data || [];

        let total = 0;
        let menipis = 0;
        const dataWithStockStatus = data.map(item => {
          total += item.jumlah || 0; // Handle potential undefined jumlah
          let status_stok = 'Tersedia';
          if ((item.jumlah || 0) === 0) {
            status_stok = 'Habis';
          } else if ((item.jumlah || 0) < 2000) {
            status_stok = 'Menipis';
            menipis += item.jumlah || 0;
          }
          return { ...item, status_stok };
        });

        setStokData(dataWithStockStatus);
        setStats({
          totalStok: total,
          distribusiBulanIni: 0, // This could be calculated if API provides distribution data
          stokMenipis: menipis,
        });

        console.log('Fetched stokData:', dataWithStockStatus); // Debug log
      } catch (error) {
        setError(error.message);
        if (error.message.includes('login')) navigate('/login/produsen');
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, [navigate]);

  const handleLogout = () => {
    localStorage.clear();
    navigate('/');
  };

  const filteredData = useMemo(() => {
    console.log('Current statusFilter:', statusFilter); // Debug log
    console.log('All stokData:', stokData); // Debug log
    return stokData
      .filter(item => {
        if (statusFilter === 'Semua') return true; // Show all items when "Semua" is selected
        return item.status_stok === statusFilter;
      })
      .filter(item =>
        item.batch_id?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.nama_obat?.toLowerCase().includes(searchTerm.toLowerCase())
      );
  }, [stokData, searchTerm, statusFilter]);

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

  return (
    <div className="flex min-h-screen bg-gray-50">
      <SidebarProdusen isCollapsed={isCollapsed} setIsCollapsed={setIsCollapsed} />
      <div className={`flex-1 flex flex-col transition-all duration-300 ${isCollapsed ? 'ml-16' : 'ml-64'}`}>
        <NavbarProdusen onLogout={handleLogout} />
        <main className="pt-16 pl-10 p-6">
          <h1 className="text-2xl font-bold mb-6">Monitoring Stok</h1>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <StatCard icon={<Package size={32} className="text-emerald-600"/>} value={stats.totalStok} label="Total Stok" unit="box" />
            <StatCard icon={<Truck size={32} className="text-emerald-600"/>} value={stats.distribusiBulanIni} label="Distribusi Bulan Ini" unit="unit" />
            <StatCard icon={<Box size={32} className="text-emerald-600"/>} value={stats.stokMenipis} label="Stok Menipis" unit="box" />
          </div>
          {error && <div className="mb-4 p-4 bg-red-100 text-red-700 rounded">{error}</div>}
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="flex justify-between items-center p-4 border-b">
              <div className="flex">
                <button className="py-2 px-4 text-center border-b-2 border-emerald-600 text-emerald-600 font-medium">Stok Gudang</button>
                <Link to="/produsen/riwayat-distribusi" className="py-2 px-4 text-center text-gray-500 hover:text-emerald-600">Riwayat Distribusi</Link>
              </div>
              <div className="flex items-center gap-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <input type="text" className="w-full pl-10 pr-4 py-2 border rounded-lg" placeholder="Cari stok..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
                </div>
                <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="p-2 border rounded-lg">
                  <option value="Semua">Semua status</option>
                  <option value="Tersedia">Tersedia</option>
                  <option value="Menipis">Menipis</option>
                  <option value="Habis">Habis</option>
                </select>
              </div>
            </div>
            <div className="overflow-x-auto">
              {isLoading ? <p className="p-4 text-center">Loading...</p> : (
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Batch ID</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Nama Obat</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Stok</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Exp. Date</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Nama Produsen</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredData.length > 0 ? (
                      filteredData.map((item) => (
                        <tr key={item.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{item.batch_id}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item.nama_obat}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item.jumlah?.toLocaleString('id-ID') || '0'} box</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {item.tanggal_kadaluarsa ? new Date(item.tanggal_kadaluarsa).toLocaleDateString('id-ID') : '-'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                              ${item.status_stok === 'Tersedia' ? 'bg-green-100 text-green-800' : 
                                item.status_stok === 'Menipis' ? 'bg-yellow-100 text-yellow-800' : 'bg-red-100 text-red-800'}`}>
                              {item.status_stok || 'Tidak Diketahui'}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{namaProdusen}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            <button onClick={() => navigate(`/produsen/produksi/detailstok/${item.id}`)} className="text-emerald-600 hover:text-emerald-900">
                              <Eye size={20} />
                            </button>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="7" className="px-6 py-4 text-center text-gray-500">Tidak ada data yang sesuai.</td>
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
export default MonitoringStok;