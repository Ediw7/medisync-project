import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import SidebarProdusen from '../../../components/SidebarProdusen';
import NavbarProdusen from '../../../components/NavbarProdusen';
import { 
    Search, 
    CalendarPlus, 
    ChevronDown, 
    Truck, // Icon header
    Package, // Icon No Data
    ArrowLeft, // Icon Error
    AlertTriangle, // Icon Error
    Loader2 // Icon Loading
} from 'lucide-react';
import { toast } from 'react-hot-toast'; // Import toast

const PengirimanMassal = () => {
  const navigate = useNavigate();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [pesananData, setPesananData] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortOrder, setSortOrder] = useState('terbaru');
  const [isSortDropdownOpen, setIsSortDropdownOpen] = useState(false);
  const [selectedPesanan, setSelectedPesanan] = useState([]);
  const username = localStorage.getItem('username'); // Ambil username

  // --- LOGIKA FETCH DATA (Sedikit modifikasi pada error handling) ---
  useEffect(() => {
    const fetchData = async () => {
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
            throw new Error(`Gagal mengambil data: ${response.status} - ${errorData}`);
        }
        const result = await response.json();
        if (!result.success) throw new Error(result.message || 'Data pesanan tidak tersedia');

        const filteredData = (result.data || []).filter(item => item.status === 'Perlu Dikirim');
        setPesananData(filteredData);
      } catch (error) {
        setError(error.message);
        toast.error(error.message || 'Gagal memuat data.'); // Tampilkan toast error
        if ((error.message.includes('401') || error.message.includes('403') || error.message.includes('login')) && token) {
            navigate('/login/produsen');
        } else if (!token) {
             navigate('/login/produsen');
        }
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, [navigate]);

  // --- LOGIKA FILTER & SORT (Sama) ---
  const processedData = useMemo(() => {
    let data = pesananData.filter(item => {
      const query = searchQuery.toLowerCase();
      const matchPbf = item.nama_pbf.toLowerCase().includes(query);
      const matchId = String(item.id).includes(query);
      const matchObat = item.detail_pesanan?.some(detail =>
        detail.nama_obat.toLowerCase().includes(query)
      );
      return matchPbf || matchId || matchObat;
    });

    data.sort((a, b) => {
      const dateA = new Date(a.tanggal_pesanan);
      const dateB = new Date(b.tanggal_pesanan);
      if (sortOrder === 'terbaru') {
        return dateB - dateA; // Tanggal terbaru di atas
      } else {
        return dateA - dateB; // Tanggal terlama di atas
      }
    });

    return data;
}, [pesananData, searchQuery, sortOrder]);

  // --- LOGIKA CHECKBOX (Sama) ---
  const handleSelectAll = (e) => {
    if (e.target.checked) {
      const allIds = processedData.map(item => item.id);
      setSelectedPesanan(allIds);
    } else {
      setSelectedPesanan([]);
    }
  };

  const handleSelectOne = (id) => {
    setSelectedPesanan(prevSelected =>
      prevSelected.includes(id)
        ? prevSelected.filter(item => item !== id)
        : [...prevSelected, id]
    );
  };

  // --- LOGIKA NAVIGASI (Sama, tapi toast jika tidak ada yg dipilih) ---
  const handleAturPickupMassal = () => {
    if (selectedPesanan.length === 0) {
      toast.error('Pilih setidaknya satu pesanan untuk diatur pengirimannya.');
      return;
    }
    navigate('/produsen/pengelolaan-pengiriman/atur-pickup-massal', {
      state: { selectedIds: selectedPesanan }
    });
  };

   const handleLogout = () => { // Logout Handler
    localStorage.clear();
    navigate('/');
  };

  // --- FORMAT TANGGAL ---
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


  // --- RENDER LOADING (Desain Baru) ---
  if (isLoading && pesananData.length === 0) { // Hanya tampil jika data awal belum ada
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

  // --- RENDER ERROR UTAMA (Desain Baru) ---
  if (error && pesananData.length === 0) { // Hanya tampil jika data awal gagal load
     return (
       <div className="flex min-h-screen bg-gradient-to-br from-slate-50 via-white to-emerald-50">
        <SidebarProdusen isCollapsed={isCollapsed} setIsCollapsed={setIsCollapsed} />
        <div className={`flex-1 flex flex-col transition-all duration-300 ${isCollapsed ? 'ml-16' : 'ml-64'}`}>
          <NavbarProdusen onLogout={handleLogout} username={username} />
          <main className="flex-1 flex items-center justify-center p-6 pt-[72px]">
            <div className="bg-white p-8 rounded-2xl shadow-lg border border-red-200 text-center max-w-md">
              <AlertTriangle className="mx-auto h-12 w-12 text-red-500 mb-4" />
              <h2 className="text-xl font-bold text-red-800 mb-2">Gagal Memuat Data</h2>
              <p className="text-red-600 mb-6">{error}</p>
              <button
                 onClick={() => navigate('/produsen/pengelolaan-pengiriman')} // Kembali ke halaman utama
                 className="flex items-center gap-2 px-4 py-2.5 border border-slate-300 text-slate-700 font-medium rounded-lg hover:bg-slate-100 transition mx-auto"
               >
                 <ArrowLeft size={18} />
                 Kembali ke Pengiriman
               </button>
            </div>
          </main>
        </div>
      </div>
    );
  }

  // --- RENDER UTAMA ---
  return (
    <div className="flex min-h-screen bg-slate-50">
      <SidebarProdusen isCollapsed={isCollapsed} setIsCollapsed={setIsCollapsed} />
      <div className={`flex-1 flex flex-col transition-all duration-300 ${isCollapsed ? 'ml-16' : 'ml-64'}`}>
        <NavbarProdusen onLogout={handleLogout} username={username} />
        
        <main className="flex-1 overflow-auto pt-[72px] px-12 py-8">
          <div className="max-w-7xl mx-auto">
            
            {/* Header Halaman Baru */}
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
                      Pengiriman Massal
                    </h1>
                    <p className="text-slate-600 text-lg mt-1">Atur pengiriman untuk beberapa pesanan sekaligus</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Tampilkan error inline jika terjadi saat refresh data */}
            {error && pesananData.length > 0 && (
              <div className="p-4 mb-6 bg-red-50 text-red-700 rounded-lg border border-red-200 flex items-center gap-2 text-sm">
                <AlertTriangle size={18} /> {error}
              </div>
            )}

            {/* Kartu Tabel */}
            <div className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden">
              {/* Header Tabel (Filter & Aksi) */}
              <div className="p-4 border-b border-slate-200 flex flex-col sm:flex-row justify-between items-center gap-4">
                  {/* Kiri: Search & Urutkan */}
                  <div className="flex items-center gap-3 w-full sm:w-auto">
                      <div className="relative flex-1 sm:flex-none">
                          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                          <input
                            type="text"
                            placeholder="Cari PBF, ID, atau Obat..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full sm:w-60 pl-9 pr-4 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                          />
                      </div>
                      <div className="relative">
                          <button
                            onClick={() => setIsSortDropdownOpen(!isSortDropdownOpen)}
                            className="border border-slate-300 rounded-lg py-2 px-3 flex items-center gap-1.5 text-sm text-slate-600 hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                          >
                            {sortOrder === 'terbaru' ? 'Terbaru' : 'Terlama'}
                            <ChevronDown size={14} className={`transition-transform ${isSortDropdownOpen ? 'rotate-180' : ''}`}/>
                          </button>
                          {isSortDropdownOpen && (
                            <div className="absolute left-0 sm:right-0 mt-2 w-40 bg-white rounded-md shadow-lg z-10 border border-slate-200">
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
                  {/* Kanan: Info Terpilih & Tombol Aksi */}
                  <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
                      <span className="text-sm text-slate-500 font-medium">{selectedPesanan.length} dipilih</span>
                      <button
                        onClick={handleAturPickupMassal}
                        className="relative z-20 bg-emerald-600 text-white font-medium py-2 px-4 rounded-lg hover:bg-emerald-700 transition flex items-center gap-1.5 text-sm disabled:bg-slate-300 disabled:cursor-not-allowed whitespace-nowrap" // Ditambahkan relative z-20
                        disabled={selectedPesanan.length === 0}
                      >
                        <CalendarPlus size={16} />
                        Atur Pickup ({selectedPesanan.length})
                      </button>
                  </div>
              </div>

              {/* Tabel */}
              <div className="overflow-x-auto">
                {isLoading && pesananData.length > 0 ? ( // Loading saat refresh
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
                            disabled={processedData.length === 0} // Disable jika tidak ada data
                          />
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">PBF & ID Pesanan</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Pesanan Produk</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Qty</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Total Harga</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Status & Tgl</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-slate-100">
                      {processedData.length > 0 ? processedData.map((item) => (
                        <tr key={item.id} className={`hover:bg-gray-50 transition-colors duration-150 ${selectedPesanan.includes(item.id) ? 'bg-emerald-50' : ''}`}>
                          <td className="px-4 py-4 whitespace-nowrap">
                            <input
                              type="checkbox"
                              className="h-4 w-4 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
                              onChange={() => handleSelectOne(item.id)}
                              checked={selectedPesanan.includes(item.id)}
                            />
                          </td>
                          <td className="px-4 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-slate-900">{item.nama_pbf}</div>
                            <div className="text-xs text-slate-500 font-mono">#{String(item.id).padStart(6, '0')}</div>
                          </td>
                          <td className="px-4 py-4 whitespace-nowrap text-sm text-slate-600">
                            {(item.detail_pesanan || []).map(detail => (
                                <p key={detail.id} className="truncate max-w-xs" title={`${detail.nama_obat} (Batch: ${detail.batch_id || 'N/A'})`}>
                                {detail.nama_obat} <span className='text-xs text-slate-400'>(Batch: {detail.batch_id || 'N/A'})</span>
                                </p>
                            ))}
                            {(item.detail_pesanan || []).length === 0 && <span className='text-xs text-slate-400'>Detail tidak tersedia</span>}
                          </td>
                          <td className="px-4 py-4 whitespace-nowrap text-sm text-slate-600">
                            {(item.detail_pesanan || []).map(detail => (
                                <p key={detail.id}>
                                {detail.jumlah_pesanan.toLocaleString('id-ID')} box
                                </p>
                            ))}
                           {(item.detail_pesanan || []).length === 0 && '-'}
                          </td>
                          <td className="px-4 py-4 whitespace-nowrap text-sm font-semibold text-emerald-700">Rp. {(item.total_harga || 0).toLocaleString('id-ID')}</td>
                          <td className="px-4 py-4 whitespace-nowrap">
                            <span className="px-2.5 py-0.5 inline-flex text-xs leading-5 font-semibold rounded-full bg-orange-100 text-orange-800 border border-orange-200">
                                {item.status}
                            </span>
                            <p className="text-xs text-slate-500 mt-1">
                                {formatDate(item.tanggal_pesanan)}
                            </p>
                          </td>
                        </tr>
                      )) : (
                        <tr>
                          <td colSpan="6" className="text-center py-10 text-slate-500">
                             <Package size={32} className="mx-auto mb-2 opacity-50"/>
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
       {/* STYLE BLOB */}
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

export default PengirimanMassal;