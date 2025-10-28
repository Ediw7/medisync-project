import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import SidebarProdusen from '../../../components/SidebarProdusen';
import NavbarProdusen from '../../../components/NavbarProdusen';
import {
  Search,
  CalendarPlus,
  Loader2,
  Package,
  AlertTriangle,
  Truck,
  Plus 
} from 'lucide-react';
import { toast } from 'react-hot-toast';


const NavItem = ({ to, children }) => {
  const location = useLocation();
  

  const isActive = location.pathname === to || 
                   (location.pathname.startsWith(to) && to !== '/produsen/pengelolaan-pengiriman');

  const isSemuaActive = location.pathname === '/produsen/pengelolaan-pengiriman';

  let effectiveIsActive = isActive;
  if (to === '/produsen/pengelolaan-pengiriman') {
    effectiveIsActive = isSemuaActive;
  }

  const baseClass = "py-2 px-4 rounded-lg text-sm font-medium transition-all duration-200 whitespace-nowrap block text-center sm:inline-block";
  const activeClass = "bg-emerald-600 text-white shadow-md";
  const inactiveClass = "text-slate-500 hover:text-emerald-800 hover:bg-gray-300"; 

  return effectiveIsActive ? (
    <span className={`${baseClass} ${activeClass}`}>
      {children}
    </span>
  ) : (
    <Link to={to} className={`${baseClass} ${inactiveClass}`}>
      {children}
    </Link>
  );
};



const PengelolaanPengiriman = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [pesananData, setPesananData] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [sortConfig, setSortConfig] = useState({ key: 'id', direction: 'descending' });
  const [searchQuery, setSearchQuery] = useState('');
  const username = localStorage.getItem('username');

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    let token;
    try {
      token = localStorage.getItem('token');
      if (!token) throw new Error('Silakan login terlebih dahulu');

      const response = await fetch('http://localhost:5000/api/produsen/pesanan-masuk', {
        headers: { 'Authorization': `Bearer ${token}` },
      });

      if (!response.ok) {
           const errorData = await response.text();
           throw new Error(`Gagal mengambil data pesanan: ${response.status} - ${errorData}`);
      }
      
      const result = await response.json();
      if (!result.success) throw new Error(result.message || 'Data pesanan tidak tersedia');
      setPesananData(result.data || []);
    } catch (error) {
      setError(error.message);
      toast.error(error.message || 'Gagal memuat data.');
      if ((error.message.includes('401') || error.message.includes('403') || error.message.includes('login')) && token) {
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

  const activeStatusFilter = useMemo(() => {
    const path = location.pathname;
    if (path.endsWith('/perlu-dikirim')) return 'Perlu Dikirim';
    if (path.endsWith('/dikirim')) return 'Dikirim';
    if (path.endsWith('/selesai')) return 'Selesai';
    if (path.endsWith('/pembatalan')) return ['Pembatalan Diajukan', 'Dibatalkan'];
    if (path.endsWith('/pengembalian')) return ['Pengembalian Diajukan', 'Dikembalikan', 'Pengembalian Selesai', 'Pengembalian Ditolak', 'Pengembalian Disetujui'];
    return 'Semua';
  }, [location.pathname]);

  const filteredAndSortedData = useMemo(() => {
    let filtered = [...pesananData];

    if (activeStatusFilter !== 'Semua') {
      if (Array.isArray(activeStatusFilter)) {
        filtered = filtered.filter(item => activeStatusFilter.includes(item.status));
      } else {
        filtered = filtered.filter(item => item.status === activeStatusFilter);
      }
    }

    if (searchQuery) {
        filtered = filtered.filter(item =>
            (item.nama_pbf?.toLowerCase() || '').includes(searchQuery.toLowerCase()) ||
            (String(item.id) || '').includes(searchQuery) ||
            (item.nomor_po?.toLowerCase() || '').includes(searchQuery.toLowerCase())
        );
    }

    if (sortConfig.key) {
      filtered.sort((a, b) => {
        let aValue = a[sortConfig.key];
        let bValue = b[sortConfig.key];

        if (aValue == null) aValue = '';
        if (bValue == null) bValue = '';

        if (typeof aValue === 'string') {
           return sortConfig.direction === 'ascending'
            ? aValue.localeCompare(bValue)
            : bValue.localeCompare(aValue);
        } else {
           return sortConfig.direction === 'ascending'
            ? aValue - bValue
            : bValue - aValue;
        }
      });
    }
    return filtered;
  }, [pesananData, searchQuery, sortConfig, activeStatusFilter]);


  const requestSort = (key) => {
    let direction = 'ascending';
    if (sortConfig.key === key && sortConfig.direction === 'ascending') {
      direction = 'descending';
    }
    setSortConfig({ key, direction });
  };

  const handleLogout = () => {
    localStorage.clear();
    navigate('/');
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'Perlu Dikirim': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'Dikirim': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'Selesai': return 'bg-emerald-100 text-emerald-800 border-emerald-200';
      case 'Ditolak': return 'bg-red-100 text-red-800 border-red-200';
      case 'Pembatalan Diajukan': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'Dibatalkan': return 'bg-red-100 text-red-800 border-red-200';
      case 'Pengembalian Diajukan': return 'bg-indigo-100 text-indigo-800 border-indigo-200';
      case 'Pengembalian Disetujui': return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'Dikembalikan': return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'Pengembalian Ditolak': return 'bg-pink-100 text-pink-800 border-pink-200';
      case 'Pengembalian Selesai': return 'bg-teal-100 text-teal-800 border-teal-200';
      default: return 'bg-slate-100 text-slate-800 border-slate-200';
    }
  };
  
   const formatDate = (dateString) => {
     if (!dateString) return '-';
     try {
        const date = new Date(dateString);
         if (isNaN(date.getTime())) return '-';
         return date.toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric', timeZone: 'UTC' });
     } catch (e) {
         return '-';
     }
  };

  if (isLoading && pesananData.length === 0) {
     return (
       <div className="flex flex-col justify-center items-center h-screen bg-gradient-to-br from-slate-50 via-white to-emerald-50">
          <div className="relative">
            <Loader2 className="animate-spin h-12 w-12 text-emerald-600" />
            <div className="absolute inset-0 h-12 w-12 rounded-full border-4 border-emerald-200 animate-ping opacity-20"></div>
          </div>
          <p className="mt-4 text-slate-700 font-medium">Memuat Pengelolaan Pengiriman...</p>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-slate-50">
      <SidebarProdusen isCollapsed={isCollapsed} setIsCollapsed={setIsCollapsed} />
      <div className={`flex-1 flex flex-col transition-all duration-300 ${isCollapsed ? 'ml-16' : 'ml-64'}`}>
        <NavbarProdusen onLogout={handleLogout} username={username} />
        
        <main className="flex-1 overflow-auto pt-[72px] px-12 py-8">
          <div className="max-w-7xl mx-auto">
            
            <div className="mb-10 relative">
              <div className="absolute -top-20 -left-20 w-72 h-72 bg-emerald-200 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob"></div>
              <div className="absolute -top-20 -right-20 w-72 h-72 bg-teal-200 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000"></div>

              <div className="relative flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div className="flex items-center gap-3">
                  <div className="flex items-center justify-center w-12 h-12 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl shadow-lg">
                    <Truck className="text-white" size={24} />
                  </div>
                  <div>
                    <h1 className="text-4xl font-bold bg-gradient-to-r from-slate-900 via-emerald-900 to-teal-900 bg-clip-text text-transparent">
                      Pengelolaan Pengiriman
                    </h1>
                    <p className="text-slate-600 text-lg mt-1">Kelola pesanan dan pengiriman ke PBF</p>
                  </div>
                </div>
                
                <button 
                  onClick={() => navigate('/produsen/pengelolaan-pengiriman/pengiriman-massal')}
                  className="bg-emerald-600 text-white font-medium py-2.5 px-5 rounded-lg hover:bg-emerald-700 transition flex items-center gap-2 shadow-sm whitespace-nowrap w-full sm:w-auto justify-center"
                >
                  <CalendarPlus size={18} />
                  <span>Pengiriman Massal</span>
                </button>
              </div>
            </div>

            {error && (
              <div className="p-4 mb-6 bg-red-50 text-red-700 rounded-lg border border-red-200 flex items-center gap-2 text-sm">
                <AlertTriangle size={18} /> {error}
              </div>
            )}

            <div className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden">

              <div className="p-4 border-b border-slate-200">
                  <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
                      <div className="flex overflow-x-auto sm:overflow-visible w-full sm:w-auto">

                        <div className="flex space-x-2 bg-slate-100 p-1.5 rounded-lg">
                          <NavItem to="/produsen/pengelolaan-pengiriman">Semua</NavItem>
                          <NavItem to="/produsen/pengelolaan-pengiriman/perlu-dikirim">Perlu dikirim</NavItem>
                          <NavItem to="/produsen/pengelolaan-pengiriman/dikirim">Dikirim</NavItem>
                          <NavItem to="/produsen/pengelolaan-pengiriman/selesai">Selesai</NavItem>
                          <NavItem to="/produsen/pengelolaan-pengiriman/pembatalan">Pembatalan</NavItem>
                          <NavItem to="/produsen/pengelolaan-pengiriman/pengembalian">Pengembalian</NavItem>
                        </div>
                      </div>
   
                      <div className="flex items-center gap-2 w-full sm:w-auto flex-shrink-0">
                          <div className="relative flex-1 sm:flex-none">
                              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                              <input 
                                type="text" 
                                className="w-full sm:w-60 pl-9 pr-4 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" 
                                placeholder="Cari PBF atau ID Pesanan..." 
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                              />
                          </div>
                      </div>
                  </div>
              </div>



              <div className="overflow-x-auto">
                {isLoading && pesananData.length > 0 ? (
                   <div className="p-10 text-center text-slate-500">
                       <Loader2 className="animate-spin h-8 w-8 mx-auto text-emerald-600" />
                       <p className="mt-2">Memperbarui data pesanan...</p>
                   </div>
                 ) : (
                  <table className="min-w-full">
                    <thead className="bg-slate-50 border-b border-slate-200">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider cursor-pointer hover:bg-slate-100" onClick={() => requestSort('nama_pbf')}>
                          PBF {sortConfig.key === 'nama_pbf' && (sortConfig.direction === 'ascending' ? '▲' : '▼')}
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider cursor-pointer hover:bg-slate-100" onClick={() => requestSort('id')}>
                          ID Pesanan {sortConfig.key === 'id' && (sortConfig.direction === 'ascending' ? '▲' : '▼')}
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Nomor PO</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Surat Pesanan</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider cursor-pointer hover:bg-slate-100" onClick={() => requestSort('total_harga')}>
                          Total Harga {sortConfig.key === 'total_harga' && (sortConfig.direction === 'ascending' ? '▲' : '▼')}
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider cursor-pointer hover:bg-slate-100" onClick={() => requestSort('status')}>
                          Status {sortConfig.key === 'status' && (sortConfig.direction === 'ascending' ? '▲' : '▼')}
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Aksi</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-slate-100">
                      {filteredAndSortedData.length > 0 ? filteredAndSortedData.map((item) => (
                        <tr key={item.id} className="hover:bg-gray-50 transition-colors duration-150">
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-900">{item.nama_pbf}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600 font-mono">#{String(item.id).padStart(6, '0')}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600 font-mono">{item.nomor_po || '-'}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm">
                            <Link to={`/produsen/pesanan/detail/${item.id}/surat`} target="_blank" rel="noopener noreferrer" className="text-emerald-600 hover:underline">Lihat Surat</Link>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-emerald-700">Rp. {item.total_harga.toLocaleString('id-ID')}</td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`px-2.5 py-0.5 inline-flex text-xs leading-5 font-semibold rounded-full border ${getStatusBadge(item.status)}`}>
                              {item.status}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            {item.status === 'Perlu Dikirim' && (
                              <Link to={`/produsen/pengelolaan-pengiriman/atur-pengiriman/${item.id}`} className="text-emerald-600 hover:text-emerald-800 font-semibold">
                                Atur Pengiriman
                              </Link>
                            )}
                            {item.status === 'Dikirim' && (
                              <Link to={`/produsen/pengelolaan-pengiriman/lihat-status/${item.id}`} className="text-blue-600 hover:text-blue-800 font-semibold">
                                Lihat Status
                              </Link>
                            )}
                            {item.status === 'Selesai' && item.detail_pesanan?.[0]?.blockchain_asset_id && (
                              <Link to={`/produsen/riwayat-distribusi/lacak/${item.detail_pesanan[0].blockchain_asset_id}`} className="text-purple-600 hover:text-purple-800 font-semibold">
                                Lacak Riwayat
                              </Link>
                            )}
                            {item.status === 'Pembatalan Diajukan' && (
                              <Link to={`/produsen/pengelolaan-pengiriman/konfirmasi-pembatalan/${item.id}`} className="text-yellow-700 hover:text-yellow-800 font-semibold">
                                Konfirmasi Pembatalan
                              </Link>
                            )}
                            {item.status === 'Dibatalkan' && (
                              <Link to={`/produsen/pengelolaan-pengiriman/riwayat-pembatalan/${item.id}`} className="text-red-600 hover:text-red-800 font-semibold">
                                Lihat Riwayat Batal
                              </Link>
                            )}
                            {item.status === 'Pengembalian Diajukan' && (
                              <Link to={`/produsen/pengelolaan-pengiriman/konfirmasi-pengembalian/${item.id}`} className="text-indigo-600 hover:text-indigo-800 font-semibold">
                                Konfirmasi Pengembalian
                              </Link>
                            )}
                            {(item.status === 'Dikembalikan' || item.status === 'Pengembalian Disetujui' || item.status === 'Pengembalian Selesai') && (
                              <Link to={`/produsen/pengelolaan-pengiriman/lacak-pengembalian/${item.id}`} className="text-purple-600 hover:text-purple-800 font-semibold">
                                Lacak Pengembalian
                              </Link>
                            )}
                          </td>
                        </tr>
                      )) : (
                        <tr>
                          <td colSpan="7" className="text-center py-10 text-slate-500">
                             <Package size={32} className="mx-auto mb-2 opacity-50"/>
                             {searchQuery ? 'Tidak ada pesanan yang sesuai pencarian.' : 'Tidak ada pesanan dalam kategori ini.'}
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

export default PengelolaanPengiriman;