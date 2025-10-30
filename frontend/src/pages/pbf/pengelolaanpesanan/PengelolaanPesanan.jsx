import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import SidebarPbf from '../../../components/SidebarPbf';
import NavbarPbf from '../../../components/NavbarPbf';
import {
  Search,
  CalendarPlus,
  Box,
  Loader2,
  AlertTriangle,
  FileText,
  Package,
  ChevronUp,
  ChevronDown
} from 'lucide-react';
import axios from 'axios';
import { toast } from 'react-hot-toast'; 


const NavItem = ({ label, filter, currentFilter, setFilter }) => {
  const isActive = filter === currentFilter;
  const baseClass = "py-2 px-4 rounded-lg text-sm font-medium transition-all duration-200 whitespace-nowrap block text-center sm:inline-block";
  const activeClass = "bg-emerald-600 text-white shadow-md";
  const inactiveClass = "text-slate-500 hover:text-emerald-800 hover:bg-gray-300";

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
  const [sortConfig, setSortConfig] = useState({ key: 'id', direction: 'descending' });
  const username = localStorage.getItem('username');

  const fetchPesananMasuk = async () => {
    
      if (pesananList.length === 0) setIsLoading(true);
      setError(''); 
      
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          toast.error('Sesi berakhir, silakan login kembali.');
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

  useEffect(() => {
    fetchPesananMasuk();
  }, [navigate]); 

  const handleProsesPesanan = async (pesananId) => {
    const token = localStorage.getItem('token');
    if (!token) {
        toast.error('Sesi tidak valid.');
        return;
    }

    const promise = axios.put(`http://localhost:5000/api/pbf/pesanan-apotek/${pesananId}/proses`, {}, {
        headers: { 'Authorization': `Bearer ${token}` }
    });

    toast.promise(promise, {
        loading: 'Memproses pesanan...',
        success: (response) => {
            fetchPesananMasuk();
            return response.data.message || 'Pesanan berhasil diproses!';
        },
        error: (err) => {
            return err.response?.data?.message || err.message || 'Gagal memproses pesanan.';
        }
    });
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
        let aValue = a[sortConfig.key];
        let bValue = b[sortConfig.key];

        if (aValue == null) aValue = '';
        if (bValue == null) bValue = '';
        
        // Sorting untuk tanggal
        if (sortConfig.key === 'tanggal_pesanan') {
             aValue = new Date(aValue);
             bValue = new Date(bValue);
        }

        if (aValue < bValue) {
          return sortConfig.direction === 'ascending' ? -1 : 1;
        }
        if (aValue > bValue) {
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
     case 'Menunggu Konfirmasi': return 'bg-yellow-100 text-yellow-800 border border-yellow-200';
      case 'Perlu Dikirim': return 'bg-orange-100 text-orange-800 border border-orange-200';
      case 'Pembatalan Diajukan': return 'bg-pink-100 text-pink-800 border border-pink-200';
      case 'Dibatalkan': return 'bg-red-100 text-red-800 border border-red-200';
      default: return 'bg-gray-100 text-gray-800 border border-gray-200';
    }
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

  
  if (isLoading && pesananList.length === 0) {
     return (
       <div className="flex flex-col justify-center items-center h-screen bg-gradient-to-br from-slate-50 via-white to-emerald-50">
          <div className="relative">
            <Loader2 className="animate-spin h-12 w-12 text-emerald-600" />
            <div className="absolute inset-0 h-12 w-12 rounded-full border-4 border-emerald-200 animate-ping opacity-20"></div>
          </div>
          <p className="mt-4 text-slate-700 font-medium">Memuat Pengelolaan Pesanan...</p>
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
                 onClick={fetchPesananMasuk} 
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

              <div className="relative flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div className="flex items-center gap-3">
                  <div className="flex items-center justify-center w-12 h-12 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl shadow-lg">
                    <Box className="text-white" size={24} />
                  </div>
                  <div>
                    <h1 className="text-4xl font-bold bg-gradient-to-r from-slate-900 via-emerald-900 to-teal-900 bg-clip-text text-transparent">
                      Pengelolaan Pesanan Apotek
                    </h1>
                    <p className="text-slate-600 text-lg mt-1">Kelola pesanan masuk yang membutuhkan tindakan</p>
                  </div>
                </div>
                <button 
                  onClick={() => navigate('/pbf/pengelolaan-pesanan/pengiriman-massal')}
                  className="bg-emerald-600 text-white font-medium py-2.5 px-5 rounded-lg hover:bg-emerald-700 transition flex items-center gap-2 shadow-sm whitespace-nowrap w-full sm:w-auto justify-center"
                >
                  <CalendarPlus size={18} />
                  <span>Pengiriman Massal</span>
                </button>
              </div>
            </div>

       
            <div className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden">
              <div className="p-4 border-b border-slate-200 flex flex-col sm:flex-row justify-between items-center gap-4">
            
                <div className="flex overflow-x-auto sm:overflow-visible w-full sm:w-auto">
                  <div className="flex space-x-2 bg-slate-100 p-1.5 rounded-lg">
                    <NavItem label="Semua" filter="Semua" currentFilter={statusFilter} setFilter={setStatusFilter} />
                    <NavItem label="Menunggu Konfirmasi" filter="Menunggu Konfirmasi" currentFilter={statusFilter} setFilter={setStatusFilter} />
                    <NavItem label="Perlu Dikirim" filter="Perlu Dikirim" currentFilter={statusFilter} setFilter={setStatusFilter} />
                    <NavItem label="Dibatalkan" filter="Dibatalkan" currentFilter={statusFilter} setFilter={setStatusFilter} />
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
                            <div className="flex items-center gap-1">Apotek Pemesan {getSortIndicator('nama_apotek')}</div>
                          </th>
                          <th 
                            className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider cursor-pointer hover:bg-slate-100"
                            onClick={() => sortData('nomor_pesanan')}
                          >
                            <div className="flex items-center gap-1">Nomor Pesanan {getSortIndicator('nomor_pesanan')}</div>
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                            Surat Pesanan
                          </th>
                          <th 
                            className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider cursor-pointer hover:bg-slate-100"
                            onClick={() => sortData('total_harga')}
                          >
                            <div className="flex items-center gap-1">Total Harga {getSortIndicator('total_harga')}</div>
                          </th>
                           <th 
                            className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider cursor-pointer hover:bg-slate-100"
                            onClick={() => sortData('tanggal_pesanan')}
                          >
                            <div className="flex items-center gap-1">Tgl. Pesan {getSortIndicator('tanggal_pesanan')}</div>
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
                          <td className="px-6 py-4 whitespace-nowrap text-sm">
                            <Link to={`/pbf/pengelolaan-pesanan/surat/${order.id}`} className="text-emerald-600 hover:underline font-medium">Lihat Surat</Link>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-emerald-700">
                            {new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(order.total_harga)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">
                            {formatDate(order.tanggal_pesanan)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`px-2.5 py-0.5 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusClass(order.status)}`}>
                              {order.status}
                            </span>
                          </td>
                          
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            {order.status === 'Pembatalan Diajukan' && (
                                <Link to={`/pbf/pengelolaan-pesanan/konfirmasi-pembatalan/${order.id}`} className="text-pink-600 hover:text-pink-800 font-semibold">
                                    Konfirmasi Pembatalan
                                </Link>
                            )}
                            {order.status === 'Menunggu Konfirmasi' && (
                              <button 
                                onClick={() => handleProsesPesanan(order.id)}
                                className="text-emerald-600 hover:text-emerald-800 font-semibold"
                                disabled={isSubmitting} // Disable saat aksi berjalan
                              >
                                Proses Pesanan
                              </button>
                            )}
                            {order.status === 'Perlu Dikirim' && (
                              <Link to={`/pbf/pengelolaan-pesanan/atur-pengiriman/${order.id}`} className="text-orange-600 hover:text-orange-800 font-semibold">Atur Pengiriman</Link>
                            )}
                             {order.status === 'Dibatalkan' && (
                              <Link to={`/pbf/pengelolaan-pesanan/riwayat-pembatalan/${order.id}`} className="text-gray-600 hover:text-gray-800 font-semibold">
                                Lihat Riwayat
                              </Link>
                            )}
                          </td>
                        </tr>
                      )) : (
                        <tr>
                          <td colSpan="7" className="text-center py-10 text-slate-500">
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

export default PengelolaanPesanan;