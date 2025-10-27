import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import NavbarApotek from '../../../components/NavbarApotek';
import { Search, Plus, ShoppingCart, Loader2 } from 'lucide-react';
import axios from 'axios';

const PesanObatApotek = () => {
  const navigate = useNavigate();
  const [pesananData, setPesananData] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('Semua');

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          navigate('/login/apotek');
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
        setError(err.message);
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

  const getStatusBadge = (status) => {
    switch (status) {
      case 'Menunggu Konfirmasi': return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'Perlu Dikirim': return 'bg-orange-50 text-orange-700 border-orange-200';
      case 'Dikirim': return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'Selesai': return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'Pembatalan Diajukan': return 'bg-yellow-50 text-yellow-700 border-yellow-200';
      case 'Dibatalkan': return 'bg-red-50 text-red-700 border-red-200';
      default: return 'bg-slate-50 text-slate-700 border-slate-200';
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('id-ID', {
      day: '2-digit', month: 'long', year: 'numeric',
    });
  };
  
  const TabButton = ({ label }) => (
    <button 
        onClick={() => setStatusFilter(label)}
        className={`py-3 px-4 text-sm font-medium transition-all duration-200 whitespace-nowrap ${
          statusFilter === label 
            ? 'border-b-2 border-emerald-600 text-emerald-600' 
            : 'text-slate-600 hover:text-emerald-600 border-b-2 border-transparent'
        }`}
    >
        {label}
    </button>
  );

  const renderAction = (item) => {
    const baseClasses = "text-sm font-medium hover:underline transition-colors";
    
    switch (item.status) {
      case 'Menunggu Konfirmasi':
        return (
          <Link to={`/apotek/pesanan/${item.id}/batalkan`} className={`${baseClasses} text-red-600 hover:text-red-700`}>
            Batalkan Pesanan
          </Link>
        );
      case 'Dikirim':
        return (
          <Link to={`/apotek/pesanan/${item.id}/konfirmasi-penerimaan`} className={`${baseClasses} text-emerald-600 hover:text-emerald-700`}>
            Konfirmasi Penerimaan
          </Link>
        );
      case 'Selesai':
        return item.id_aset_blockchain ? (
          <Link to={`/apotek/pesanan/riwayat/${item.id_aset_blockchain}`} className={`${baseClasses} text-purple-600 hover:text-purple-700`}>
            Lihat Riwayat
          </Link>
        ) : (
          <span className="text-slate-400 text-sm">Riwayat T/A</span>
        );
      case 'Dibatalkan':
      case 'Pembatalan Diajukan':
        return (
          <Link to={`/apotek/pesanan/${item.id}/detail`} className={`${baseClasses} text-slate-600 hover:text-slate-700`}>
            Lihat Detail
          </Link>
        );
      default:
        return (
          <Link to={`/apotek/pesanan/${item.id}/detail`} className={`${baseClasses} text-slate-600 hover:text-slate-700`}>
            Lihat Detail
          </Link>
        );
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col justify-center items-center h-screen bg-gradient-to-br from-slate-50 via-white to-emerald-50">
        <div className="relative">
          <Loader2 className="animate-spin h-12 w-12 text-emerald-600" />
          <div className="absolute inset-0 h-12 w-12 rounded-full border-4 border-emerald-200 animate-ping opacity-20"></div>
        </div>
        <p className="mt-4 text-slate-700 font-medium">Memuat data pesanan...</p>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-slate-50 via-white to-emerald-50">
      <div className="flex-1 flex flex-col">
        <NavbarApotek onLogout={handleLogout} />
        
        <main className="flex-1 overflow-auto pt-[72px]">
          <div className="max-w-7xl mx-auto px-6 py-8">
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
              <div>
                <h1 className="text-3xl font-bold text-slate-900 mb-2">Pesanan Obat ke PBF</h1>
                <p className="text-slate-600">Kelola riwayat pesanan dan lacak pengiriman dari PBF</p>
              </div>
              <button 
                onClick={() => navigate('/apotek/pesan-obat/tambah')} 
                className="flex items-center gap-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white py-2.5 px-5 rounded-xl font-medium shadow-lg hover:shadow-xl transition-all duration-200"
              >
                <Plus size={20} />
                Pesan Obat Baru
              </button>
            </div>

            {error && (
              <div className="p-4 mb-6 bg-red-50 text-red-700 rounded-2xl border border-red-200 flex items-center gap-3 shadow-sm">
                <span className="font-medium">{error}</span>
              </div>
            )}

            {/* Main Card */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
              {/* Tabs */}
              <div className="border-b border-slate-200 overflow-x-auto">
                <div className="flex min-w-max px-2">
                  {['Semua', 'Menunggu Konfirmasi', 'Perlu Dikirim', 'Dikirim', 'Selesai', 'Dibatalkan'].map(tab => 
                    <TabButton key={tab} label={tab}/>
                  )}
                </div>
              </div>

              {/* Search Bar */}
              <div className="p-6 border-b border-slate-200">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                  <input 
                    type="text" 
                    className="w-full pl-10 pr-4 py-2.5 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all" 
                    placeholder="Cari No. Pesanan atau Nama PBF..." 
                    value={searchTerm} 
                    onChange={(e) => setSearchTerm(e.target.value)} 
                  />
                </div>
              </div>

              {/* Table */}
              <div className="overflow-x-auto">
                <table className="min-w-full">
                  <thead>
                    <tr className="border-b-2 border-slate-200 bg-slate-50">
                      <th className="px-6 py-4 text-left text-xs font-bold text-slate-600 uppercase tracking-wider">Nomor Pesanan</th>
                      <th className="px-6 py-4 text-left text-xs font-bold text-slate-600 uppercase tracking-wider">Tujuan PBF</th>
                      <th className="px-6 py-4 text-left text-xs font-bold text-slate-600 uppercase tracking-wider">Tanggal Pesan</th>
                      <th className="px-6 py-4 text-left text-xs font-bold text-slate-600 uppercase tracking-wider">Total Harga</th>
                      <th className="px-6 py-4 text-left text-xs font-bold text-slate-600 uppercase tracking-wider">Status</th>
                      <th className="px-6 py-4 text-left text-xs font-bold text-slate-600 uppercase tracking-wider">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredData.length > 0 ? filteredData.map((item) => (
                      <tr key={item.id} className="hover:bg-slate-50 transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="text-sm font-mono text-slate-900 bg-slate-100 px-2 py-1 rounded">{item.nomor_pesanan}</span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-slate-900">{item.nama_pbf}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">{formatDate(item.tanggal_pesanan)}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-slate-900">Rp {(item.total_harga || 0).toLocaleString('id-ID')}</td>
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
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default PesanObatApotek;