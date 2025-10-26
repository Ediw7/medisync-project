import React, { useState, useEffect, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Search, CalendarPlus } from 'lucide-react';
import SidebarPbf from '../../../components/SidebarPbf';
import NavbarPbf from '../../../components/NavbarPbf';
import axios from 'axios';

// --- DESAIN NAVITEM DISESUAIKAN ---
const NavItem = ({ label, filter, currentFilter, setFilter }) => {
  const isActive = filter === currentFilter;
  // Kelas CSS disamakan dengan halaman TrackingPengiriman
  const baseClass = "whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm";
  const activeClass = "border-emerald-500 text-emerald-600";
  const inactiveClass = "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300";

  return (
    <button
      onClick={() => setFilter(filter)}
      className={`${baseClass} ${isActive ? activeClass : inactiveClass}`}
    >
      {label}
    </button>
  );
};

const PengelolaanPesanan = () => {
  const navigate = useNavigate();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [pesananList, setPesananList] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('Semua');
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'ascending' });

  const fetchPesananMasuk = async () => {
      setIsLoading(true);
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          navigate('/login/pbf');
          return;
        }
        const response = await axios.get('http://localhost:5000/api/pbf/pesanan-apotek', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (response.data.success) {
         const relevantStatuses = ['Menunggu Konfirmasi', 'Perlu Dikirim', 'Pembatalan Diajukan', 'Dibatalkan'];
          const filteredList = response.data.data.filter(item => relevantStatuses.includes(item.status));
          setPesananList(filteredList);
        } else {
          throw new Error(response.data.message || 'Gagal memuat daftar pesanan.');
        }
      } catch (err) {
        setError(err.response?.data?.message || err.message);
      } finally {
        setIsLoading(false);
      }
    };

  useEffect(() => {
    fetchPesananMasuk();
  }, [navigate]);
    
  const handleProsesPesanan = async (pesananId) => {
    if (!window.confirm('Apakah Anda yakin ingin memproses pesanan ini? Status akan diubah menjadi "Perlu Dikirim".')) {
      return;
    }
    try {
      const token = localStorage.getItem('token');
      const response = await axios.put(`http://localhost:5000/api/pbf/pesanan-apotek/${pesananId}/proses`, {}, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.data.success) {
        alert('Pesanan berhasil diproses!');
        fetchPesananMasuk();
      }
    } catch (err) {
      alert('Gagal memproses pesanan: ' + (err.response?.data?.message || err.message));
    }
  };

  const sortData = (key) => {
    let direction = 'ascending';
    if (sortConfig.key === key && sortConfig.direction === 'ascending') {
      direction = 'descending';
    }
    setSortConfig({ key, direction });
  };

  const filteredAndSortedData = useMemo(() => {
    let filtered = [...pesananList]
      .filter(item => {
        if (statusFilter === 'Semua') {
          return true;
        }
        if (statusFilter === 'Dibatalkan') {
          return ['Dibatalkan', 'Pembatalan Diajukan'].includes(item.status);
        }
        return item.status === statusFilter;
      })
      .filter(item =>
        (item.nama_apotek?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
        (item.nomor_pesanan?.toLowerCase() || '').includes(searchTerm.toLowerCase())
      );

    if (sortConfig.key) {
      filtered.sort((a, b) => {
        if (a[sortConfig.key] < b[sortConfig.key]) {
          return sortConfig.direction === 'ascending' ? -1 : 1;
        }
        if (a[sortConfig.key] > b[sortConfig.key]) {
          return sortConfig.direction === 'ascending' ? 1 : -1;
        }
        return 0;
      });
    }
    return filtered;
  }, [pesananList, searchTerm, statusFilter, sortConfig]);

  const handleLogout = () => {
    localStorage.clear();
    navigate('/');
  };
    
  const getStatusClass = (status) => {
    switch (status) {
     case 'Menunggu Konfirmasi': return 'bg-yellow-100 text-yellow-800';
      case 'Perlu Dikirim': return 'bg-orange-100 text-orange-800';
      case 'Pembatalan Diajukan': return 'bg-pink-100 text-pink-800';
      case 'Dibatalkan': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('id-ID', {
      day: '2-digit', month: 'long', year: 'numeric', timeZone: 'UTC'
    });
  };

  const getSortIndicator = (key) => {
    if (sortConfig.key !== key) return null;
    return sortConfig.direction === 'ascending' ? '↑' : '↓';
  };

  return (
    <div className="flex min-h-screen bg-gray-50">
      <SidebarPbf isCollapsed={isCollapsed} setIsCollapsed={setIsCollapsed} />
      <div className={`flex-1 flex flex-col transition-all duration-300 ${isCollapsed ? 'ml-16' : 'ml-64'}`}>
        <NavbarPbf onLogout={handleLogout} />
        <main className="flex-1 pt-16 p-6 mt-8 ml-8">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
            <div>
              <h1 className="text-2xl font-bold">Pengelolaan Pesanan Apotek</h1>
              <p className="text-gray-500">Kelola pesanan yang membutuhkan tindakan</p>
            </div>
            <div className="flex items-center">
              <button 
                onClick={() => navigate('/pbf/pengelolaan-pesanan/pengiriman-massal')}
                className="bg-emerald-600 text-white font-medium py-2 px-4 rounded-lg hover:bg-emerald-700 transition flex items-center gap-2"
              >
                <CalendarPlus size={18} />
                <span>Pengiriman Massal</span>
              </button>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="p-4 border-b flex flex-col sm:flex-row items-center gap-4">
              {/* --- CONTAINER NAVIGASI DISESUAIKAN --- */}
             <nav className="-mb-5 sm:-mb-4 flex-grow sm:flex-grow-0 space-x-8 overflow-x-auto" aria-label="Tabs">
                <NavItem label="Semua" filter="Semua" currentFilter={statusFilter} setFilter={setStatusFilter} />
                <NavItem label="Menunggu Konfirmasi" filter="Menunggu Konfirmasi" currentFilter={statusFilter} setFilter={setStatusFilter} />
                <NavItem label="Perlu Dikirim" filter="Perlu Dikirim" currentFilter={statusFilter} setFilter={setStatusFilter} />
                <NavItem label="Dibatalkan" filter="Dibatalkan" currentFilter={statusFilter} setFilter={setStatusFilter} />
              </nav>
               <div className="relative w-full sm:w-auto sm:ml-auto mt-4 sm:mt-0">
                <input
                  type="text"
                  placeholder="Cari Apotek atau No. Pesanan..."
                  className="pl-10 pr-4 py-2 border rounded-lg w-full sm:w-64 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
                <Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              </div>
            </div>
            <div className="overflow-x-auto">
              {isLoading ? ( <p className="text-center py-10 text-gray-500">Memuat data pesanan...</p>
              ) : error ? ( <p className="text-center py-10 text-red-500">{error}</p>
              ) : (
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Apotek Pemesan
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Nomor Pesanan
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Pesanan (Surat Pesanan)</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Total Harga
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Status
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Aksi</th>
                      </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredAndSortedData.length > 0 ? filteredAndSortedData.map((order) => (
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
                        
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          {order.status === 'Pembatalan Diajukan' && (
                              <Link to={`/pbf/pengelolaan-pesanan/konfirmasi-pembatalan/${order.id}`} className="text-pink-600 hover:text-pink-800">
                                  Konfirmasi Pembatalan
                              </Link>
                          )}
                          {order.status === 'Menunggu Konfirmasi' && (
                            <button 
                              onClick={() => handleProsesPesanan(order.id)}
                              className="text-emerald-600 hover:text-emerald-800"
                            >
                              Proses Pesanan
                            </button>
                          )}
                          {order.status === 'Perlu Dikirim' && (
                            <Link to={`/pbf/pengelolaan-pesanan/atur-pengiriman/${order.id}`} className="text-orange-600 hover:text-orange-800">Atur Pengiriman</Link>
                          )}

                           {order.status === 'Dibatalkan' && (
                            <Link to={`/pbf/pengelolaan-pesanan/riwayat-pembatalan/${order.id}`} className="text-gray-600 hover:text-gray-800">
                              Lihat Riwayat
                            </Link>
                          )}
                        </td>
                      </tr>
                    )) : (
                      <tr>
                        <td colSpan="6" className="text-center py-10 text-gray-500">
                          Tidak ada pesanan yang sesuai dengan filter.
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

export default PengelolaanPesanan;