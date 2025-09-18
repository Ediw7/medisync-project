import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import SidebarProdusen from '../../../components/SidebarProdusen';
import NavbarProdusen from '../../../components/NavbarProdusen';
import { Search, ArrowUpDown } from 'lucide-react';

const RiwayatProduksi = () => {
  const navigate = useNavigate();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [produksiData, setProduksiData] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortConfig, setSortConfig] = useState({ key: 'tanggal_produksi', direction: 'descending' });

  useEffect(() => {
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
        setProduksiData(result.data || []);
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

  const riwayatProduksi = useMemo(() => {
    let data = produksiData.filter(item => item.status === 'Tercatat di Blockchain');

    if (searchTerm) {
      data = data.filter(item =>
        item.batch_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.nama_obat.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (sortConfig.key) {
      data.sort((a, b) => {
        if (a[sortConfig.key] < b[sortConfig.key]) {
          return sortConfig.direction === 'ascending' ? -1 : 1;
        }
        if (a[sortConfig.key] > b[sortConfig.key]) {
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

  return (
    <div className="flex min-h-screen bg-gray-50">
      <SidebarProdusen isCollapsed={isCollapsed} setIsCollapsed={setIsCollapsed} />
      <div className={`flex-1 flex flex-col transition-all duration-300 ${isCollapsed ? 'ml-16' : 'ml-64'}`}>
        <NavbarProdusen onLogout={handleLogout} />
        <main className="pt-16 p-6">
          <h1 className="text-2xl font-bold mb-6">Riwayat Produksi (On-Chain)</h1>

          {error && <div className="mb-4 p-4 bg-red-100 text-red-700 rounded">{error}</div>}

          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="flex justify-between items-center p-4 border-b">
              {/* Tabs */}
              <div className="flex">
                <Link to="/produsen/manajemen-produksi" className="py-2 px-4 text-center text-gray-500 hover:text-[#18A375] font-medium">Jadwal Produksi</Link>
                <button className="py-2 px-4 text-center border-b-2 border-[#18A375] text-[#18A375] font-medium">Riwayat Produksi</button>
              </div>

              {/* Search Bar */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  className="w-full pl-10 pr-4 py-2 border rounded-lg"
                  placeholder="Cari batch atau nama obat..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>

            <div className="overflow-x-auto">
              {isLoading ? (
                <p className="p-4 text-center">Loading...</p>
              ) : (
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      {['batch_id', 'nama_obat', 'tanggal_produksi', 'jumlah', 'status', 'qr_code'].map(key => (
                        <th key={key} className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          <button onClick={() => requestSort(key)} className="flex items-center gap-1 hover:text-gray-800">
                            {key.replace('_', ' ')} <ArrowUpDown size={14} />
                          </button>
                        </th>
                      ))}
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {riwayatProduksi.map((item) => (
                      <tr key={item.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{item.batch_id}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item.nama_obat}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{new Date(item.tanggal_produksi).toLocaleDateString('id-ID')}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item.jumlah}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                            {item.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          {item.qr_code_url ? (
                            <img src={item.qr_code_url} alt="QR Code" className="w-16 h-16" />
                          ) : (
                            'N/A'
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <button onClick={() => navigate(`/produsen/produksi/detail/${item.id}`)} className="text-indigo-600 hover:text-indigo-900">Detail</button>
                        </td>
                      </tr>
                    ))}
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

export default RiwayatProduksi;