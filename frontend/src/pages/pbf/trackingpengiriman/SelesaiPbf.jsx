import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import SidebarPbf from '../../../components/SidebarPbf';
import NavbarPbf from '../../../components/NavbarPbf';
import {
  Search,
  Truck,
  Loader2,
  AlertTriangle,
  Package,
  ChevronUp,
  ChevronDown
} from 'lucide-react';
import axios from 'axios';
import { toast } from 'react-hot-toast'; 

const NavItem = ({ label, to }) => {
  const location = useLocation();
  const isActive = location.pathname === to;
  const baseClass = "py-2 px-4 rounded-lg text-sm font-medium transition-all duration-200 whitespace-nowrap block text-center sm:inline-block";
  const activeClass = "bg-emerald-600 text-white shadow-md";
  const inactiveClass = "text-slate-500 hover:text-emerald-800 hover:bg-gray-300";

  return (
    <Link
      to={to}
      className={`${baseClass} ${isActive ? activeClass : inactiveClass}`}
    >
      {label}
    </Link>
  );
};

const SelesaiPbf = () => {
  const navigate = useNavigate();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [pesananList, setPesananList] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortConfig, setSortConfig] = useState({ key: 'id', direction: 'descending' });
  const username = localStorage.getItem('username');

  const statusFilter = ['Selesai']; // Filter di-hardcode

  useEffect(() => {
    const fetchData = async () => {
      if (pesananList.length === 0) setIsLoading(true);
      setError(null);
      try {
        const token = localStorage.getItem('token');
        if (!token) {
            toast.error('Sesi berakhir, silakan login kembali.');
            navigate('/login/pbf');
            return;
        }
        const response = await axios.get('http://localhost:5000/api/pbf/pesanan-apotek', {
            headers: { Authorization: `Bearer ${token}` }
        });
        if (response.data.success) {
            const relevantStatuses = ['Dikirim', 'Selesai', 'Pengembalian Diajukan', 'Dikembalikan', 'Pengembalian Selesai', 'Pengembalian Ditolak'];
            setPesananList(response.data.data.filter(p => 
                relevantStatuses.includes(p.status)
            ));
        } else {
            throw new Error(response.data.message || 'Gagal memuat data pesanan.');
        }
      } catch (err) {
        const errorMsg = err.response?.data?.message || err.message;
        setError(errorMsg);
        if (pesananList.length === 0) toast.error(errorMsg);
        if (err.response?.status === 401 || err.response?.status === 403) {
            navigate('/login/pbf');
        }
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, [navigate]);
  
  const filteredAndSortedData = useMemo(() => {
    let filtered = [...pesananList].filter(item => {
        return statusFilter.includes(item.status) &&
               ((item.nama_apotek?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
               (item.nomor_pesanan?.toLowerCase() || '').includes(searchTerm.toLowerCase()));
    });
    
    if (sortConfig.key) {
      filtered.sort((a, b) => {
        let aValue = a[sortConfig.key];
        let bValue = b[sortConfig.key];
        if (aValue == null) aValue = '';
        if (bValue == null) bValue = '';
        if (sortConfig.key === 'tanggal_pesanan' || sortConfig.key === 'tanggal_pengiriman') {
             aValue = new Date(aValue);
             bValue = new Date(bValue);
        }
        if (aValue < bValue) return sortConfig.direction === 'ascending' ? -1 : 1;
        if (aValue > bValue) return sortConfig.direction === 'ascending' ? 1 : -1;
        return 0;
      });
    }
    return filtered;

  }, [pesananList, searchTerm, sortConfig, statusFilter]);

  const getStatusClass = (status) => {
    return 'bg-emerald-100 text-emerald-800 border border-emerald-200';
  };

  const renderAction = (order) => {
    return <Link to={`/pbf/tracking-pengiriman/riwayat/${order.id_aset_blockchain}`} className="text-purple-600 hover:text-purple-800 font-semibold">Lihat Riwayat</Link>;
  }
  
  const handleLogout = () => {
    localStorage.clear();
    navigate('/');
  };
  
  const formatDate = (dateString) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('id-ID', {
      day: '2-digit', month: 'short', year: 'numeric', timeZone: 'UTC'
    });
  };

  const getSortIndicator = (key) => {
    if (sortConfig.key !== key) return null;
    return sortConfig.direction === 'ascending' ? <ChevronUp size={14} /> : <ChevronDown size={14} />;
  };
  
  const sortData = (key) => {
    let direction = 'ascending';
    if (sortConfig.key === key && sortConfig.direction === 'ascending') {
      direction = 'descending';
    }
    setSortConfig({ key, direction });
  };

  if (isLoading && pesananList.length === 0) {
     return (
       <div className="flex flex-col justify-center items-center h-screen bg-gradient-to-br from-slate-50 via-white to-emerald-50">
          <div className="relative">
            <Loader2 className="animate-spin h-12 w-12 text-emerald-600" />
            <div className="absolute inset-0 h-12 w-12 rounded-full border-4 border-emerald-200 animate-ping opacity-20"></div>
          </div>
          <p className="mt-4 text-slate-700 font-medium">Memuat Pesanan Selesai...</p>
      </div>
    );
  }

  if (error && pesananList.length === 0) {
     return (
       <div className="flex min-h-screen bg-gradient-to-br from-slate-50 via-white to-emerald-50">
        <SidebarPbf isCollapsed={isCollapsed} setIsCollapsed={setIsCollapsed} />
        <div className={`flex-1 flex flex-col transition-all duration-300 ${isCollapsed ? 'ml-16' : 'ml-64'}`}>
          <NavbarPbf onLogout={handleLogout} username={username} />
          <main className="flex-1 flex items-center justify-center p-6 pt-[72px]">
            <div className="bg-white p-8 rounded-2xl shadow-lg border border-red-200 text-center max-w-md">
              <AlertTriangle className="mx-auto h-12 w-12 text-red-500 mb-4" />
              <h2 className="text-xl font-bold text-red-800 mb-2">Gagal Memuat Data</h2>
              <p className="text-red-600 mb-6">{error}</p>
              <button
                 onClick={fetchData} 
                 className="flex items-center gap-2 px-4 py-2.5 border border-slate-300 text-slate-700 font-medium rounded-lg hover:bg-slate-100 transition mx-auto"
               >
                 <Loader2 size={18} className="mr-1" />
                 Coba Lagi
               </button>
            </div>
          </main>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-slate-50 via-white to-emerald-50">
      <SidebarPbf isCollapsed={isCollapsed} setIsCollapsed={setIsCollapsed} />
      <div className={`flex-1 flex flex-col transition-all duration-300 ${isCollapsed ? 'ml-16' : 'ml-64'}`}>
        <NavbarPbf onLogout={handleLogout} username={username} />
        
        <main className="flex-1 overflow-auto pt-[72px] px-12 py-8">
          <div className="max-w-7xl mx-auto">
            
            <div className="mb-10 relative">
              <div className="absolute -top-20 -left-20 w-72 h-72 bg-emerald-200 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob"></div>
              <div className="absolute -top-20 -right-20 w-72 h-72 bg-teal-200 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000"></div>

              <div className="relative flex items-center gap-3">
                <div className="flex items-center justify-center w-12 h-12 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl shadow-lg">
                  <Truck className="text-white" size={24} />
                </div>
                <div>
                  <h1 className="text-4xl font-bold bg-gradient-to-r from-slate-900 via-emerald-900 to-teal-900 bg-clip-text text-transparent">
                    Pantau Pengiriman
                  </h1>
                  <p className="text-slate-600 text-lg mt-1">Lacak semua pengiriman keluar ke apotek.</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden relative z-10">
              <div className="p-4 border-b border-slate-200 flex flex-col sm:flex-row justify-between items-center gap-4">
            
                <div className="flex overflow-x-auto sm:overflow-visible w-full sm:w-auto">
                  <div className="flex space-x-2 bg-slate-100 p-1.5 rounded-lg">
                    <NavItem label="Semua" to="/pbf/tracking-pengiriman" />
                    <NavItem label="Dikirim" to="/pbf/tracking-pengiriman/dikirim" />
                    <NavItem label="Selesai" to="/pbf/tracking-pengiriman/selesai" />
                    <NavItem label="Pengembalian" to="/pbf/tracking-pengiriman/pengembalian" />
                  </div>
                </div>
            
                <div className="relative w-full sm:w-auto">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Cari Apotek atau No. Pesanan..."
                    className="pl-9 pr-4 py-2 border border-slate-300 rounded-lg w-full sm:w-64 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
              </div>
              
            
              <div className="overflow-x-auto">
                {isLoading && pesananList.length > 0 ? ( 
                    <div className="p-10 text-center text-slate-500">
                       <Loader2 className="animate-spin h-8 w-8 mx-auto text-emerald-600" />
                       <p className="mt-2">Memperbarui data...</p>
                   </div>
                ) : (
                  <table className="min-w-full">
                    <thead className="bg-slate-50 border-b border-slate-200">
                        <tr>
                          <th 
                            className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider cursor-pointer hover:bg-slate-100"
                            onClick={() => sortData('nama_apotek')}
                          >
                            <div className="flex items-center gap-1">Apotek Tujuan {getSortIndicator('nama_apotek')}</div>
                          </th>
                          <th 
                            className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider cursor-pointer hover:bg-slate-100"
                            onClick={() => sortData('nomor_pesanan')}
                          >
                            <div className="flex items-center gap-1">Nomor Pesanan {getSortIndicator('nomor_pesanan')}</div>
                          </th>
                          <th 
                            className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider cursor-pointer hover:bg-slate-100"
                            onClick={() => sortData('tanggal_pesanan')}
                          >
                            <div className="flex items-center gap-1">Tgl. Pesan {getSortIndicator('tanggal_pesanan')}</div>
                          </th>
                          <th 
                            className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider cursor-pointer hover:bg-slate-100"
                            onClick={() => sortData('total_harga')}
                          >
                            <div className="flex items-center gap-1">Total Harga {getSortIndicator('total_harga')}</div>
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                            Status
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Aksi</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-slate-100">
                      {filteredAndSortedData.length > 0 ? filteredAndSortedData.map((order) => (
                        <tr key={order.id} className="hover:bg-gray-50">
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-900">{order.nama_apotek}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600 font-mono">{order.nomor_pesanan}</td>
                           <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600 font-mono">{order.nomor_pesanan}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">
                            {formatDate(order.tanggal_pesanan)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-emerald-700">
                            {new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 2 }).format(order.total_harga)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`px-2.5 py-0.5 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusClass(order.status)}`}>
                              {order.status}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            {renderAction(order)}
                          </td>
                        </tr>
                      )) : (
                        <tr>
                          <td colSpan="6" className="text-center py-10 text-slate-500">
                            <Package size={32} className="mx-auto mb-2 opacity-50"/>
                            {searchTerm ? 'Tidak ada pesanan yang cocok.' : 'Tidak ada pesanan dalam kategori ini.'}
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
          0%, 100% { transform: translate(0, 0) scale(1); }
          33% { transform: translate(30px, -50px) scale(1.1); }
          66% { transform: translate(-20px, 20px) scale(0.9); }
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

export default SelesaiPbf;