import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import SidebarApotek from '../../../components/SidebarApotek';
import NavbarApotek from '../../../components/NavbarApotek';
import { Search } from 'lucide-react';
import axios from 'axios';

const PesanObatApotek = () => {
  const navigate = useNavigate();
  const [isCollapsed, setIsCollapsed] = useState(false);
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
      case 'Menunggu Konfirmasi': return 'bg-yellow-100 text-yellow-800';
      case 'Perlu Dikirim': return 'bg-orange-100 text-orange-800';
      case 'Dikirim': return 'bg-cyan-100 text-cyan-800';
      case 'Selesai': return 'bg-green-100 text-green-800';
      case 'Pembatalan Diajukan': return 'bg-pink-100 text-pink-800';
      case 'Dibatalkan': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
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
        className={`py-2 px-4 text-sm text-center font-medium transition-colors duration-200 ${statusFilter === label ? 'border-b-2 border-emerald-600 text-emerald-600' : 'text-gray-500 hover:text-emerald-600'}`}
    >
        {label}
    </button>
  );

  const renderAction = (item) => {
    switch (item.status) {
      case 'Menunggu Konfirmasi':
        return (
          <Link to={`/apotek/pesanan/${item.id}/batalkan`} className="text-red-600 hover:text-red-800">
            Batalkan Pesanan
          </Link>
        );
      case 'Dikirim':
        return (
          <Link to={`/apotek/pesanan/${item.id}/konfirmasi-penerimaan`} className="text-emerald-600 hover:text-emerald-800">
            Konfirmasi Penerimaan
          </Link>
        );
      case 'Selesai':
        return item.id_aset_blockchain ? (
          <Link to={`/apotek/pesanan/riwayat/${item.id_aset_blockchain}`} className="text-purple-600 hover:text-purple-800">
            Lihat Riwayat
          </Link>
        ) : (
          <span className="text-gray-400">Riwayat T/A</span>
        );
      // Ini adalah case yang hilang sebelumnya
      case 'Dibatalkan':
      case 'Pembatalan Diajukan':
        return (
            <Link to={`/apotek/pesanan/${item.id}/detail`} className="text-gray-600 hover:text-gray-800">
                Lihat Detail
            </Link>
        );
      default:
        return (
            <Link to={`/apotek/pesanan/${item.id}/detail`} className="text-gray-600 hover:text-gray-800">
                Lihat Detail
            </Link>
        );
    }
  };

  return (
    <div className="flex min-h-screen bg-gray-50">
      <SidebarApotek isCollapsed={isCollapsed} setIsCollapsed={setIsCollapsed} />
      <div className={`flex-1 flex flex-col transition-all duration-300 ${isCollapsed ? 'ml-16' : 'ml-64'}`}>
        <NavbarApotek onLogout={handleLogout} />
        <main className="pt-16 p-6">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h1 className="text-2xl font-bold">Pesanan Obat ke PBF</h1>
              <p className="text-gray-500">Kelola riwayat pesanan dan lacak pengiriman dari PBF</p>
            </div>
            <button onClick={() => navigate('/apotek/pesan-obat/tambah')} className="bg-emerald-600 hover:bg-emerald-700 text-white py-2 px-4 rounded-lg flex items-center gap-2">
              <span className="font-semibold">+</span> Pesan Obat Baru
            </button>
          </div>

          {error && <div className="mb-4 p-4 bg-red-100 text-red-700 rounded-lg">{error}</div>}

          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="p-4 border-b">
              <div className="flex border-b overflow-x-auto">
                {['Semua', 'Menunggu Konfirmasi', 'Perlu Dikirim', 'Dikirim', 'Selesai', 'Dibatalkan'].map(tab => <TabButton key={tab} label={tab}/>)}
              </div>
              <div className="flex items-center gap-4 mt-4">
                <div className="relative flex-grow">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <input 
                    type="text" 
                    className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500" 
                    placeholder="Cari No. Pesanan atau Nama PBF..." 
                    value={searchTerm} 
                    onChange={(e) => setSearchTerm(e.target.value)} 
                  />
                </div>
              </div>
            </div>

            <div className="overflow-x-auto">
              {isLoading ? (
                <p className="p-10 text-center text-gray-500">Memuat data pesanan...</p>
              ) : (
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Nomor Pesanan</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tujuan PBF</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tanggal Pesan</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Total Harga</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredData.length > 0 ? filteredData.map((item) => (
                      <tr key={item.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{item.nomor_pesanan}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-800">{item.nama_pbf}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{formatDate(item.tanggal_pesanan)}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">Rp {(item.total_harga || 0).toLocaleString('id-ID')}</td>
                        <td className="px-6 py-4 whitespace-nowrap">
                           <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusBadge(item.status)}`}>{item.status}</span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <div className="flex gap-4 items-center">
                            {renderAction(item)}
                          </div>
                        </td>
                      </tr>
                    )) : (
                        <tr>
                          <td colSpan="6" className="text-center py-10 text-gray-500">
                            {searchTerm || statusFilter !== 'Semua' ? "Tidak ada pesanan yang sesuai dengan filter." : "Anda belum pernah membuat pesanan."}
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
export default PesanObatApotek;