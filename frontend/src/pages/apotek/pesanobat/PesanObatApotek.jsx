import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import NavbarApotek from '../../../components/NavbarApotek'; // Only Navbar is needed
import {
  Search,
  Plus,
  ShoppingCart,
  Loader2,
  AlertTriangle, // Added for error
  ArrowLeft, // Added for consistency
  Package, // Added for empty state
  FileText, // Added for action link consistency
  CheckCircle, // Added for action link consistency
  XCircle, // Added for action link consistency
  Info // Added for action link consistency
} from 'lucide-react';
import axios from 'axios';
import { toast } from 'react-hot-toast'; // Assuming toast is used

// Tab Button Component - Optimized for smaller screens
const TabButton = ({ label, filterValue, currentFilter, setFilter }) => {
  const isActive = currentFilter === filterValue;
  return (
    <button
        onClick={() => setFilter(filterValue)}
        className={`py-3 px-4 text-sm font-medium transition-all duration-200 whitespace-nowrap border-b-2 ${
          isActive
            ? 'border-emerald-600 text-emerald-600'
            : 'border-transparent text-slate-500 hover:text-emerald-600 hover:border-emerald-300'
        }`}
    >
        {label}
    </button>
  );
};

const PesanObatApotek = () => {
  const navigate = useNavigate();
  const [pesananData, setPesananData] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('Semua'); // Default to 'Semua'
  const username = localStorage.getItem('username'); // Get username for Navbar

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      setError(null);
      let token;
      try {
        token = localStorage.getItem('token');
        if (!token) {
          navigate('/login/apotek'); // Redirect immediately if no token
          return;
        }
        const response = await axios.get('http://localhost:5000/api/apotek/pesanan', {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (response.data.success) {
          setPesananData(response.data.data || []);
        } else {
          throw new Error(response.data.message || 'Gagal mengambil data pesanan.');
        }
      } catch (err) {
         const errorMsg = err.response?.data?.message || err.message || 'Gagal memuat data pesanan.';
        setError(errorMsg);
        toast.error(errorMsg);
        if ((err.message.includes('401') || err.message.includes('403') || err.message.includes('login')) && token) {
            navigate('/login/apotek');
        } else if (!token){
             navigate('/login/apotek');
        }
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
    return pesananData
      .filter(item => {
        if (statusFilter === 'Semua') return true;
        return item.status === statusFilter;
      })
      .filter(item =>
        (item.nama_pbf?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
        (item.nomor_pesanan?.toLowerCase() || '').includes(searchTerm.toLowerCase())
      );
  }, [pesananData, searchTerm, statusFilter]);

  // Consistent status badges
  const getStatusBadge = (status) => {
    switch (status) {
      case 'Menunggu Konfirmasi': return 'bg-amber-100 text-amber-800 border border-amber-200';
      case 'Perlu Dikirim': return 'bg-orange-100 text-orange-800 border border-orange-200';
      case 'Dikirim': return 'bg-blue-100 text-blue-800 border border-blue-200';
      case 'Selesai': return 'bg-emerald-100 text-emerald-800 border border-emerald-200';
      case 'Pembatalan Diajukan': return 'bg-yellow-100 text-yellow-800 border border-yellow-200';
      case 'Dibatalkan': return 'bg-red-100 text-red-800 border border-red-200';
      default: return 'bg-slate-100 text-slate-800 border border-slate-200';
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    try {
        const date = new Date(dateString);
        if (isNaN(date.getTime())) return '-';
        return date.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
    } catch {
        return '-';
    }
  };

  // Consistent action rendering
  const renderAction = (item) => {
    const baseClasses = "text-sm font-semibold hover:underline transition-colors duration-150 inline-flex items-center gap-1.5 py-1 px-2 rounded-md";
    const detailClasses = "text-slate-600 hover:text-slate-800 hover:bg-slate-100";
    const cancelClasses = "text-red-600 hover:text-red-800 hover:bg-red-50";
    const confirmClasses = "text-emerald-600 hover:text-emerald-800 hover:bg-emerald-50";
    const historyClasses = "text-purple-600 hover:text-purple-800 hover:bg-purple-50";

    switch (item.status) {
      case 'Menunggu Konfirmasi':
        return (
          <Link to={`/apotek/pesanan/${item.id}/batalkan`} className={`${baseClasses} ${cancelClasses}`}>
            <XCircle size={14}/> Batalkan
          </Link>
        );
      case 'Dikirim':
        return (
          <Link to={`/apotek/pesanan/${item.id}/konfirmasi-penerimaan`} className={`${baseClasses} ${confirmClasses}`}>
            <CheckCircle size={14}/> Konfirmasi
          </Link>
        );
      case 'Selesai':
        // Check if blockchain asset ID exists *within the detail*, assuming first item has it
        const assetId = item.detail_pesanan?.[0]?.blockchain_asset_id;
        return assetId ? (
          <Link to={`/apotek/pesanan/riwayat/${assetId}`} className={`${baseClasses} ${historyClasses}`}>
            <FileText size={14}/> Riwayat
          </Link>
        ) : (
          <span className="text-slate-400 text-xs italic">(Riwayat T/A)</span>
        );
      // For cancelled statuses or others, show detail link
      case 'Dibatalkan':
      case 'Pembatalan Diajukan':
      default:
        return (
          <Link to={`/apotek/pesanan/${item.id}/detail`} className={`${baseClasses} ${detailClasses}`}>
            <Info size={14}/> Detail
          </Link>
        );
    }
  };


   if (isLoading && pesananData.length === 0) {
     return (
       <div className="flex flex-col justify-center items-center h-screen bg-gradient-to-br from-slate-50 via-white to-emerald-50">
          <div className="relative">
            <Loader2 className="animate-spin h-12 w-12 text-emerald-600" />
            <div className="absolute inset-0 h-12 w-12 rounded-full border-4 border-emerald-200 animate-ping opacity-20"></div>
          </div>
          <p className="mt-4 text-slate-700 font-medium">Memuat Data Pesanan Obat...</p>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-slate-50">
      <div className="flex-1 flex flex-col">
        <NavbarApotek onLogout={handleLogout} />

        <main className="flex-1 overflow-auto pt-[72px]">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
              <div>
                <h1 className="text-3xl font-bold text-slate-900 mb-1">Pesanan Obat</h1>
                <p className="text-slate-600">Kelola riwayat pesanan Anda ke PBF.</p>
              </div>
              <button
                onClick={() => navigate('/apotek/pesan-obat/tambah')}
                className="w-full sm:w-auto flex items-center justify-center gap-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white py-2.5 px-5 rounded-lg font-medium shadow-md hover:shadow-lg transition-all duration-200 whitespace-nowrap"
              >
                <Plus size={18} />
                Pesan Obat Baru
              </button>
            </div>

            {error && (
              <div className="p-4 mb-6 bg-red-50 text-red-700 rounded-lg border border-red-200 flex items-center gap-2 text-sm">
                <AlertTriangle size={18} /> {error}
              </div>
            )}

            <div className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden">
              <div className="border-b border-slate-200 overflow-x-auto">
                <div className="flex min-w-max px-2">
                  {[
                    { label: 'Semua', value: 'Semua' },
                    { label: 'Menunggu Konfirmasi', value: 'Menunggu Konfirmasi' },
                    { label: 'Perlu Dikirim', value: 'Perlu Dikirim' },
                    { label: 'Dikirim', value: 'Dikirim' },
                    { label: 'Selesai', value: 'Selesai' },
                    { label: 'Dibatalkan', value: 'Dibatalkan' } // Combined cancelled statuses
                  ].map(tab =>
                    <TabButton key={tab.value} label={tab.label} filterValue={tab.value} currentFilter={statusFilter} setFilter={setStatusFilter}/>
                  )}
                </div>
              </div>

              <div className="p-4 border-b border-slate-200">
                <div className="relative w-full max-w-sm">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
                  <input
                    type="text"
                    placeholder="Cari No. Pesanan atau Nama PBF..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-9 pr-4 py-2 border border-slate-300 rounded-lg w-full text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
                  />
                </div>
              </div>

              <div className="overflow-x-auto">
                 {isLoading && pesananData.length > 0 ? (
                     <div className="p-10 text-center text-slate-500">Memperbarui data tabel...</div>
                   ) : (
                    <table className="min-w-full">
                      <thead className="bg-slate-50 border-b border-slate-200">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Nomor Pesanan</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Tujuan PBF</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Tanggal Pesan</th>
                          <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">Total Harga</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Status</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Aksi</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-slate-100">
                        {filteredData.length > 0 ? filteredData.map((item) => (
                          <tr key={item.id} className="hover:bg-slate-50 transition-colors">
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className="text-sm font-semibold font-mono text-slate-900 bg-slate-100 px-2 py-1 rounded">{item.nomor_pesanan}</span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-800">{item.nama_pbf}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">{formatDate(item.tanggal_pesanan)}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-slate-800 text-right">Rp {(item.total_harga || 0).toLocaleString('id-ID')}</td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full border ${getStatusBadge(item.status)}`}>
                                {item.status}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              {renderAction(item)}
                            </td>
                          </tr>
                        )) : (
                          <tr>
                            <td colSpan="6" className="text-center py-12">
                              <ShoppingCart size={48} className="mx-auto mb-3 text-slate-300" />
                              <p className="text-slate-500 font-medium">
                                {searchTerm || statusFilter !== 'Semua'
                                  ? "Tidak ada pesanan yang sesuai dengan filter."
                                  : "Anda belum pernah membuat pesanan."}
                              </p>
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
       <style jsx global>{`
        /* Remove blob animation styles if they were here */
      `}</style>
    </div>
  );
};

export default PesanObatApotek;