import React, { useState, useEffect, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import SidebarPbf from '../../../components/SidebarPbf';
import NavbarPbf from '../../../components/NavbarPbf';
import { Search } from 'lucide-react';
import axios from 'axios';

// Komponen untuk navigasi tab status
const NavItem = ({ label, filter, currentFilter, setFilter }) => {
  const isActive = filter === currentFilter;
  const baseClass = "py-3 px-1 text-center font-medium transition whitespace-nowrap";
  const activeClass = "text-emerald-600 border-b-2 border-emerald-600";
  const inactiveClass = "text-gray-600 hover:text-emerald-600";

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

  // Fungsi untuk mengambil data pesanan dari server
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
          setPesananList(response.data.data);
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
    
  // Fungsi untuk menangani aksi "Proses Pesanan"
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
        fetchPesananMasuk(); // Muat ulang data untuk melihat status terbaru
      }
    } catch (err) {
      alert('Gagal memproses pesanan: ' + (err.response?.data?.message || err.message));
    }
  };

  // Fungsi untuk sorting data di tabel
  const sortData = (key) => {
    let direction = 'ascending';
    if (sortConfig.key === key && sortConfig.direction === 'ascending') {
      direction = 'descending';
    }
    setSortConfig({ key, direction });
  };

  // Memoized value untuk data yang sudah difilter dan di-sort
  const filteredAndSortedData = useMemo(() => {
    let filtered = [...pesananList]
      .filter(item => {
        if (statusFilter === 'Semua') return true;
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
      // --- TAMBAHAN BARU ---
      case 'Pembatalan Diajukan': return 'bg-red-100 text-red-800';
      case 'Dikirim': return 'bg-cyan-100 text-cyan-800';
      case 'Selesai': return 'bg-emerald-100 text-emerald-800';
      case 'Dibatalkan': return 'bg-gray-100 text-gray-800'; // Dibuat abu-abu
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
        <main className="flex-1 pt-16 p-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
            <div>
              <h1 className="text-2xl font-bold">Pengelolaan Pesanan Apotek</h1>
              <p className="text-gray-500">Kelola pesanan masuk dari apotek</p>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="p-4 border-b flex flex-wrap items-center gap-x-4 gap-y-3">
              <div className="flex items-center gap-x-2 overflow-x-auto">
                <NavItem label="Semua" filter="Semua" currentFilter={statusFilter} setFilter={setStatusFilter} />
                <NavItem label="Menunggu Konfirmasi" filter="Menunggu Konfirmasi" currentFilter={statusFilter} setFilter={setStatusFilter} />
                <NavItem label="Pembatalan Diajukan" filter="Pembatalan Diajukan" currentFilter={statusFilter} setFilter={setStatusFilter} />
                <NavItem label="Perlu Dikirim" filter="Perlu Dikirim" currentFilter={statusFilter} setFilter={setStatusFilter} />
                <NavItem label="Dikirim" filter="Dikirim" currentFilter={statusFilter} setFilter={setStatusFilter} />
                <NavItem label="Selesai" filter="Selesai" currentFilter={statusFilter} setFilter={setStatusFilter} />
                <NavItem label="Dibatalkan" filter="Dibatalkan" currentFilter={statusFilter} setFilter={setStatusFilter} />
              </div>
               <div className="relative w-full sm:w-auto sm:ml-auto">
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
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase cursor-pointer" onClick={() => sortData('nama_apotek')}>
                          Apotek Pemesan {getSortIndicator('nama_apotek')}
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase cursor-pointer" onClick={() => sortData('nomor_pesanan')}>
                          Nomor Pesanan {getSortIndicator('nomor_pesanan')}
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Pesanan (Surat Pesanan)</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase cursor-pointer" onClick={() => sortData('total_harga')}>
                          Total Harga {getSortIndicator('total_harga')}
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase cursor-pointer" onClick={() => sortData('status')}>
                          Status {getSortIndicator('status')}
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Aksi</th>
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
                              <Link to={`/pbf/pengelolaan-pesanan/konfirmasi-pembatalan/${order.id}`} className="text-red-600 hover:text-red-800">
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
                            <Link to={`/pbf/pengelolaan-pesanan/atur-pengiriman/${order.id}`} className="text-orange-600 hover:text-orange-800">
                              Atur Pengiriman
                            </Link>
                          )}
                          {order.status === 'Dikirim' && (
                            <Link to={`/pbf/pengelolaan-pesanan/lacak/${order.id}`} className="text-blue-600 hover:text-blue-800">
                              Lihat Status
                            </Link>
                          )}
                            {order.status === 'Selesai' && (
                               <Link to={`/pbf/pengelolaan-pesanan/riwayat/${order.id_aset_blockchain}`} className="text-purple-600 hover:text-purple-800">Lihat Riwayat</Link>
                            
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