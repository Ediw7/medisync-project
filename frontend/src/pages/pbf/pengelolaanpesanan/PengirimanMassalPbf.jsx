import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import SidebarPbf from '../../../components/SidebarPbf';
import NavbarPbf from '../../../components/NavbarPbf';
import { 
  Search, CalendarPlus, ChevronDown, Truck, Package, 
  ArrowLeft, AlertTriangle, Loader2 
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import axios from 'axios';

const PengirimanMassalPbf = () => {
  const navigate = useNavigate();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [pesananData, setPesananData] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortOrder, setSortOrder] = useState('terbaru');
  const [isSortDropdownOpen, setIsSortDropdownOpen] = useState(false);
  const [selectedPesanan, setSelectedPesanan] = useState([]);
  const username = localStorage.getItem('username');

  // --- FETCH DATA ---
  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const token = localStorage.getItem('token');
        if (!token) throw new Error('Silakan login terlebih dahulu');

        const response = await axios.get('http://localhost:5000/api/pbf/pesanan-apotek', {
          headers: { Authorization: `Bearer ${token}` }
        });

        if (response.data.success) {
          const filtered = response.data.data.filter(p => p.status === 'Perlu Dikirim');
          setPesananData(filtered);
        } else {
          throw new Error(response.data.message || 'Gagal memuat data');
        }
      } catch (err) {
        const errorMsg = err.response?.data?.message || err.message;
        setError(errorMsg);
        toast.error(errorMsg);
        if (err.response?.status === 401) navigate('/login/pbf');
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, [navigate]);

  // --- FILTER & SORT ---
  const processedData = useMemo(() => {
    let data = pesananData.filter(item => {
      const query = searchQuery.toLowerCase();
      return (
        item.nama_apotek.toLowerCase().includes(query) ||
        item.nomor_pesanan.toLowerCase().includes(query)
      );
    });

    data.sort((a, b) => {
      const dateA = new Date(a.tanggal_pesanan);
      const dateB = new Date(b.tanggal_pesanan);
      return sortOrder === 'terbaru' ? dateB - dateA : dateA - dateB;
    });

    return data;
  }, [pesananData, searchQuery, sortOrder]);

  // --- CHECKBOX LOGIC ---
  const handleSelectAll = (e) => {
    if (e.target.checked) {
      setSelectedPesanan(processedData.map(item => item.id));
    } else {
      setSelectedPesanan([]);
    }
  };

  const handleSelectOne = (id) => {
    setSelectedPesanan(prev =>
      prev.includes(id) ? prev.filter(pId => pId !== id) : [...prev, id]
    );
  };

  const handleAturPickup = () => {
    if (selectedPesanan.length === 0) {
      toast.error('Pilih setidaknya satu pesanan untuk diatur pengirimannya.');
      return;
    }
    navigate('/pbf/pengelolaan-pesanan/atur-pickup-massal', {
      state: { selectedIds: selectedPesanan }
    });
  };

  const handleLogout = () => { localStorage.clear(); navigate('/'); };

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return '-';
      return date.toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' });
    } catch (e) {
      return '-';
    }
  };

  // --- LOADING ---
  if (isLoading && pesananData.length === 0) {
    return (
      <div className="flex flex-col justify-center items-center h-screen bg-gradient-to-br from-slate-50 via-white to-emerald-50">
        <div className="relative">
          <Loader2 className="animate-spin h-12 w-12 text-emerald-600" />
          <div className="absolute inset-0 h-12 w-12 rounded-full border-4 border-emerald-200 animate-ping opacity-20"></div>
        </div>
        <p className="mt-4 text-slate-700 font-medium">Memuat Pesanan Perlu Dikirim...</p>
      </div>
    );
  }

  // --- ERROR ---
  if (error && pesananData.length === 0) {
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
                onClick={() => navigate('/pbf/pengelolaan-pesanan')}
                className="flex items-center gap-2 px-4 py-2.5 border border-slate-300 text-slate-700 font-medium rounded-lg hover:bg-slate-100 transition mx-auto"
              >
                <ArrowLeft size={18} /> Kembali ke Pengelolaan Pesanan
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
            
            {/* --- PERBAIKAN DIMULAI DI SINI --- */}
            {/* HEADER */}
            <div className="mb-10 relative">
              <div className="absolute -top-20 -left-20 w-72 h-72 bg-emerald-200 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob"></div>
              <div className="absolute -top-20 -right-20 w-72 h-72 bg-teal-200 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000"></div>

              <div className="relative flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                {/* Judul Halaman */}
                <div className="flex items-center gap-3">
                  <div className="flex items-center justify-center w-12 h-12 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl shadow-lg">
                    <Truck className="text-white" size={24} />
                  </div>
                  <div>
                    <h1 className="text-4xl font-bold bg-gradient-to-r from-slate-900 via-emerald-900 to-teal-900 bg-clip-text text-transparent">
                      Pengiriman Massal
                    </h1>
                    <p className="text-slate-600 text-lg mt-1">Atur pengiriman untuk beberapa pesanan sekaligus</p>
                  </div>
                </div>

                {/* Tombol Aksi (Dipindah ke sini) */}
                <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
                  <span className="text-sm text-slate-500 font-medium">{selectedPesanan.length} Pesanan Dipilih</span>
                  <button
                    onClick={handleAturPickup}
                    disabled={selectedPesanan.length === 0}
                    className="bg-emerald-600 text-white font-medium py-2.5 px-5 rounded-lg hover:bg-emerald-700 transition flex items-center gap-2 shadow-sm disabled:bg-slate-300 disabled:cursor-not-allowed"
                  >
                    <CalendarPlus size={18} />
                    Atur Pickup
                  </button>
                </div>
              </div>
            </div>
            {/* --- AKHIR PERBAIKAN --- */}


            {/* ERROR INLINE */}
            {error && pesananData.length > 0 && (
              <div className="p-4 mb-6 bg-red-50 text-red-700 rounded-lg border border-red-200 flex items-center gap-2 text-sm">
                <AlertTriangle size={18} /> {error}
              </div>
            )}

            {/* TABEL */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
              
              {/* Filter Bar (Tombol Aksi Dihapus dari sini) */}
              <div className="p-6 border-b border-slate-200 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 w-full lg:w-auto">
                  <div className="relative w-full sm:w-64">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <input
                      type="text"
                      placeholder="Cari Apotek atau No. Pesanan..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full pl-9 pr-4 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                  <div className="relative">
                    <button
                      onClick={() => setIsSortDropdownOpen(!isSortDropdownOpen)}
                      className="flex items-center gap-1.5 px-3 py-2 border border-slate-300 rounded-lg text-sm text-slate-600 hover:bg-slate-50 transition"
                    >
                      {sortOrder === 'terbaru' ? 'Terbaru' : 'Terlama'}
                      <ChevronDown size={14} className={`transition-transform ${isSortDropdownOpen ? 'rotate-180' : ''}`} />
                    </button>
                    {isSortDropdownOpen && (
                      <div className="absolute left-0 mt-2 w-40 bg-white rounded-lg shadow-lg border border-slate-200 z-10">
                        <button
                          onClick={() => { setSortOrder('terbaru'); setIsSortDropdownOpen(false); }}
                          className={`block w-full text-left px-4 py-2 text-sm ${sortOrder === 'terbaru' ? 'bg-emerald-50 text-emerald-700 font-medium' : 'text-slate-700 hover:bg-slate-50'}`}
                        >
                          Pesanan Terbaru
                        </button>
                        <button
                          onClick={() => { setSortOrder('terlama'); setIsSortDropdownOpen(false); }}
                          className={`block w-full text-left px-4 py-2 text-sm ${sortOrder === 'terlama' ? 'bg-emerald-50 text-emerald-700 font-medium' : 'text-slate-700 hover:bg-slate-50'}`}
                        >
                          Pesanan Terlama
                        </button>
                      </div>
                    )}
                  </div>
                </div>
                {/* Tombol aksi sudah dipindah dari sini */}
              </div>

              {/* Tabel */}
              <div className="overflow-x-auto">
                {isLoading && pesananData.length > 0 ? (
                  <div className="p-10 text-center text-slate-500">
                    <Loader2 className="animate-spin h-8 w-8 mx-auto text-emerald-600" />
                    <p className="mt-2">Memperbarui data...</p>
                  </div>
                ) : (
                  <table className="min-w-full">
                    <thead className="bg-slate-50 border-b border-slate-200">
                      <tr>
                        <th className="px-4 py-3 text-left">
                          <input
                            type="checkbox"
                            className="h-4 w-4 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
                            onChange={handleSelectAll}
                            checked={processedData.length > 0 && selectedPesanan.length === processedData.length}
                            disabled={processedData.length === 0}
                          />
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Apotek & No. Pesanan</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Total Harga</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Tgl. Pesanan</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-slate-100">
                      {processedData.length > 0 ? processedData.map(order => (
                        <tr key={order.id} className={`hover:bg-emerald-50 transition-colors ${selectedPesanan.includes(order.id) ? 'bg-emerald-50' : ''}`}>
                          <td className="px-4 py-4">
                            <input
                              type="checkbox"
                              className="h-4 w-4 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
                              checked={selectedPesanan.includes(order.id)}
                              onChange={() => handleSelectOne(order.id)}
                            />
                          </td>
                          <td className="px-4 py-4">
                            <div className="text-sm font-medium text-slate-900">{order.nama_apotek}</div>
                            <div className="text-xs text-slate-500 font-mono">#{order.nomor_pesanan}</div>
                          </td>
                          <td className="px-4 py-4 text-sm font-semibold text-emerald-700">
                            Rp {Number(order.total_harga || 0).toLocaleString('id-ID', { minimumFractionDigits: 2 })}
                          </td>
                          <td className="px-4 py-4">
                            <span className="px-2.5 py-0.5 inline-flex text-xs leading-5 font-semibold rounded-full bg-orange-100 text-orange-800 border border-orange-200">
                              {order.status}
                            </span>
                            <p className="text-xs text-slate-500 mt-1">{formatDate(order.tanggal_pesanan)}</p>
                          </td>
                        </tr>
                      )) : (
                        <tr>
                          <td colSpan="4" className="text-center py-12 text-slate-500">
                            <Package size={32} className="mx-auto mb-2 opacity-50" />
                            {searchQuery ? 'Tidak ada pesanan yang cocok.' : 'Tidak ada pesanan yang perlu dikirim saat ini.'}
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

      {/* BLOB ANIMATION */}
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

export default PengirimanMassalPbf;