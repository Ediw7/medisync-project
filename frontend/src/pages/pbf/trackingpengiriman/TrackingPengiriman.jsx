import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import SidebarPbf from '../../../components/SidebarPbf';
import NavbarPbf from '../../../components/NavbarPbf';
import { Search, Calendar } from 'lucide-react';
import axios from 'axios';

const TrackingPengiriman = () => {
  const navigate = useNavigate();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [activeTab, setActiveTab] = useState('Semua');
  const [pesananList, setPesananList] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  // --- MAPPING STATUS BARU ---
  const statusMapping = {
    'Semua': ['Dikirim', 'Selesai', 'Pengembalian Diajukan', 'Dikembalikan'],
    'Dikirim': ['Dikirim'],
    'Selesai': ['Selesai'],
    'Pengembalian': ['Pengembalian Diajukan', 'Dikembalikan'],
  };
  
  // --- NAVIGASI TAB BARU ---
  const tabs = ['Semua', 'Dikirim', 'Selesai', 'Pengembalian'];

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const token = localStorage.getItem('token');
        if (!token) {
            navigate('/login/pbf');
            return;
        }
        const response = await axios.get('http://localhost:5000/api/pbf/pesanan-apotek', {
            headers: { Authorization: `Bearer ${token}` }
        });
        if (response.data.success) {
            // Hanya ambil data yang relevan untuk halaman tracking
            const relevantStatuses = statusMapping['Semua'];
            setPesananList(response.data.data.filter(p => 
                relevantStatuses.includes(p.status)
            ));
        } else {
            throw new Error(response.data.message);
        }
      } catch (err) {
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, [navigate]);
  
  const filteredData = useMemo(() => {
    return pesananList.filter(item => {
        const tabStatuses = statusMapping[activeTab];
        const searchMatch = (item.nama_apotek?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
                            (item.nomor_pesanan?.toLowerCase() || '').includes(searchTerm.toLowerCase());
        
        return tabStatuses.includes(item.status) && searchMatch;
    });
  }, [pesananList, activeTab, searchTerm]);

  const getStatusClass = (status) => {
    switch (status) {
      case 'Dikirim': return 'bg-cyan-100 text-cyan-800';
      case 'Selesai': return 'bg-emerald-100 text-emerald-800';
      case 'Pengembalian Diajukan': return 'bg-indigo-100 text-indigo-800';
      case 'Dikembalikan': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const renderAction = (order) => {
    switch (order.status) {
        case 'Dikirim':
            return <Link to={`/pbf/tracking-pengiriman/lacak/${order.id}`} className="text-emerald-600 hover:text-emerald-800 font-medium">Lacak Pengiriman</Link>;
        case 'Selesai':
            return <Link to={`/pbf/tracking-pengiriman/riwayat/${order.id_aset_blockchain}`} className="text-purple-600 hover:text-purple-800 font-medium">Lihat Riwayat</Link>;
        case 'Pengembalian Diajukan':
            return <Link to={`/pbf/tracking-pengiriman/konfirmasi-pengembalian/${order.id}`} className="text-indigo-600 hover:text-indigo-800 font-medium">Proses Pengembalian</Link>;
        case 'Dikembalikan':
            return <Link to={`/pbf/tracking-pengiriman/lacak-pengembalian/${order.id}`} className="text-indigo-600 hover:text-indigo-800 font-medium">Lacak Pengembalian</Link>;
        default:
            return null;
    }
  }

  return (
    <div className="flex min-h-screen bg-gray-50">
      <SidebarPbf isCollapsed={isCollapsed} setIsCollapsed={setIsCollapsed} />
      <div className={`flex-1 flex flex-col transition-all duration-300 ${isCollapsed ? 'ml-16' : 'ml-64'}`}>
        <NavbarPbf onLogout={() => { localStorage.clear(); navigate('/'); }} />
        <main className="flex-1 pt-16 p-6 mt-8 ml-8">
          <div className="max-w-7xl mx-auto">
            <div className="mb-6">
              <h1 className="text-3xl font-bold text-gray-800">Pantau Pengiriman ke Apotek</h1>
              <p className="text-gray-500 mt-1">Lacak Pengiriman obat ke Apotek</p>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
              <div className="border-b border-gray-200 mb-6">
                <nav className="-mb-px flex space-x-8 overflow-x-auto" aria-label="Tabs">
                  {tabs.map((tab) => (
                    <button
                      key={tab}
                      onClick={() => setActiveTab(tab)}
                      className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${
                        activeTab === tab
                          ? 'border-emerald-500 text-emerald-600'
                          : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                      }`}
                    >
                      {tab}
                    </button>
                  ))}
                </nav>
              </div>
              {/* Sisanya tidak berubah */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                  <input
                    type="text"
                    placeholder="Cari ID Pesanan atau nama apotek..."
                    className="w-full p-2 pl-10 border border-gray-300 rounded-lg focus:ring-emerald-500 focus:border-emerald-500"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
                 <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                  <input
                    type="text"
                    placeholder="Filter tanggal belum aktif"
                    disabled
                    className="w-full p-2 pl-10 border border-gray-300 rounded-lg bg-gray-100"
                  />
                </div>
              </div>
              <div className="overflow-x-auto">
                {isLoading ? (<p className="text-center py-10">Memuat data...</p>) : 
                 error ? (<p className="text-center py-10 text-red-500">{error}</p>) :
                 (
                    <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Apotek Pemesan</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nomor Pesanan</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Pesanan</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total Harga</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Aksi</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {filteredData.length > 0 ? filteredData.map((order) => (
                            <tr key={order.id} className="hover:bg-gray-50">
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{order.nama_apotek}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{order.nomor_pesanan}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-blue-600 hover:underline">
                                    <Link to={`/pbf/pengelolaan-pesanan/surat/${order.id}`}>Lihat Surat</Link>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                    {new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(order.total_harga)}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusClass(order.status)}`}>
                                        {order.status}
                                    </span>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm">{renderAction(order)}</td>
                            </tr>
                        )) : (
                            <tr><td colSpan="6" className="text-center py-10 text-gray-500">Tidak ada data untuk tab ini.</td></tr>
                        )}
                    </tbody>
                    </table>
                 )}
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default TrackingPengiriman;