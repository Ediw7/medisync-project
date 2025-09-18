
import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import SidebarPbf from '../../../components/SidebarPbf';
import NavbarPbf from '../../../components/NavbarPbf';
import { Search, Calendar, X, CheckCircle } from 'lucide-react'; // Import Ikon
import axios from 'axios';

// --- KOMPONEN MODAL (Tidak Berubah) ---
const SelesaiModal = ({ show, onClose, onConfirm, orderId }) => {
  if (!show) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center p-4">
      <div className="bg-white p-6 rounded-lg shadow-xl max-w-sm w-full">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold text-gray-800">Konfirmasi Pesanan Selesai</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X size={24} />
          </button>
        </div>
        <div className="text-center">
          <CheckCircle size={48} className="text-green-500 mx-auto mb-4" />
          <p className="text-gray-600 mb-6">
            Apakah Anda yakin ingin menyelesaikan pesanan ID: **{String(orderId).padStart(6, '0')}**? 
            Tindakan ini akan mengarsipkan pesanan.
          </p>
          <div className="flex justify-end gap-4">
            <button
              onClick={onClose}
              className="py-2 px-4 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
            >
              Batal
            </button>
            <button
              onClick={onConfirm}
              className="py-2 px-4 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700"
            >
              Ya, Selesaikan
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
// --- AKHIR KOMPONEN MODAL ---


const PesanObat = () => {
  const navigate = useNavigate();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [pesananData, setPesananData] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('Semua Status');

  const [showSelesaiModal, setShowSelesaiModal] = useState(false);
  const [selectedOrderId, setSelectedOrderId] = useState(null);

  useEffect(() => {
    // (Fungsi fetchData tidak berubah)
    const fetchData = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const token = localStorage.getItem('token');
        if (!token) throw new Error('Silakan login terlebih dahulu');

        const response = await axios.get('http://localhost:5000/api/pbf/pesanan', {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (!response.data.success) throw new Error(response.data.message || 'Gagal mengambil data pesanan');
        setPesananData(response.data.data || []);
      } catch (error) {
        setError(error.message);
        if (error.message.includes('login')) navigate('/login/pbf');
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
     // (Fungsi filteredData tidak berubah)
    return pesananData
      .filter(item => {
        if (statusFilter === 'Semua Status') return true;
        return item.status === statusFilter;
      })
      .filter(item =>
        (item.nomor_po?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
        (item.nama_pbf?.toLowerCase() || '').includes(searchTerm.toLowerCase())
      );
  }, [pesananData, searchTerm, statusFilter]);

  const getStatusBadge = (status) => {
    // (Fungsi getStatusBadge tidak berubah)
    switch (status) {
      case 'Perlu Dikirim': return 'bg-yellow-100 text-yellow-800';
      case 'Dikirim': return 'bg-blue-100 text-blue-800';
      case 'Selesai': return 'bg-green-100 text-green-800';
      case 'Ditolak': return 'bg-red-100 text-red-800';
      case 'Dibatalkan': return 'bg-red-100 text-red-800';
      case 'Pengembalian Diajukan': return 'bg-orange-100 text-orange-800'; // Baru
      case 'Dikembalikan': return 'bg-purple-100 text-purple-800'; // Baru
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDate = (dateString) => {
    // (Fungsi formatDate tidak berubah)
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('id-ID', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    });
  };

  // --- (Fungsi Modal tidak berubah) ---
  const handleOpenSelesaiModal = (id) => {
    setSelectedOrderId(id);
    setShowSelesaiModal(true);
  };

  const handleCloseSelesaiModal = () => {
    setShowSelesaiModal(false);
    setSelectedOrderId(null);
  };

  const handleConfirmSelesai = () => {
    console.log('Pesanan dikonfirmasi selesai:', selectedOrderId);
    alert('Pesanan telah dikonfirmasi selesai dan akan diarsipkan.');
    handleCloseSelesaiModal();
    setPesananData(prevData => prevData.filter(item => item.id !== selectedOrderId));
  };


  return (
    <div className="flex min-h-screen bg-gray-100">
      <SidebarPbf isCollapsed={isCollapsed} setIsCollapsed={setIsCollapsed} />
      <div className={`flex-1 flex flex-col transition-all duration-300 ${isCollapsed ? 'ml-16' : 'ml-64'}`}>
        <NavbarPbf onLogout={handleLogout} />
        <main className="flex-1 pt-16 p-6">
          {/* ... (Header, Error, Filter tidak berubah) ... */}
           <div className="flex justify-between items-center mb-6">
             <div>
               <h1 className="text-3xl font-bold text-gray-800">Pesanan Obat ke Produsen</h1>
               <p className="text-gray-500 mt-1">Kelola dan lacak pesanan obat Anda</p>
             </div>
             <button
               onClick={() => navigate('/pbf/pesan-obat/tambah')}
               className="bg-emerald-600 hover:bg-emerald-700 text-white py-2 px-4 rounded-lg flex items-center gap-2 transition"
             >
               <span className="font-semibold">+</span> Buat Pesanan Baru
             </button>
           </div>
 
           {error && (
             <div className="mb-6 p-4 bg-red-100 text-red-700 rounded-lg flex items-center gap-2">
               <span>{error}</span>
             </div>
           )}
 
           <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
             <div className="p-6 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-emerald-700 mb-4">Daftar Pesanan Obat</h2>
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                <div className="relative flex-grow">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <input
                    type="text"
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-emerald-500 focus:border-emerald-500"
                    placeholder="Cari Nomor PO atau Nama PBF..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="p-2 border border-gray-300 rounded-lg focus:ring-emerald-500 focus:border-emerald-500"
                >
                  <option>Semua Status</option>
                  <option>Perlu Dikirim</option>
                  <option>Dikirim</option>
                  <option>Selesai</option>
                  <option>Ditolak</option>
                  <option>Dikembalikan</option>
                </select>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <input
                    type="text"
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg bg-gray-100 cursor-not-allowed"
                    placeholder="Filter Tanggal (Segera Hadir)"
                    disabled
                  />
                </div>
              </div>
            </div>

            <div className="overflow-x-auto">
              {isLoading ? (
                <div className="p-6 text-center text-gray-500">
                  <p>Memuat pesanan...</p>
                </div>
              ) : (
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nomor PO</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">PBF</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Alamat Pengiriman</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tanggal Pesanan</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredData.length > 0 ? (
                      filteredData.map((item) => (
                        <tr key={item.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            {item.nomor_po}
                            <div className="text-xs text-gray-400">ID: {String(item.id).padStart(6, '0')}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {item.nama_pbf}
                            <div className="text-xs text-gray-400">Rp. {(item.total_harga || 0).toLocaleString('id-ID')}</div>
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-500">{item.alamat_pbf}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {formatDate(item.tanggal_pesanan)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span
                              className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusBadge(item.status)}`}
                            >
                              {item.status}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            <div className="flex gap-4 items-center">
                              {(() => {
                                if (item.status === 'Perlu Dikirim') {
                                  return (
                                    <Link
                                      to={`/pbf/pesanan/${item.id}/batalkan`}
                                      className="text-blue-600 hover:text-blue-800 font-medium"
                                    >
                                      Batalkan Pesanan
                                    </Link>
                                  );
                                }
                                if (item.status === 'Dikirim') {
                                  return (
                                    <button
                                      onClick={() => navigate(`/pbf/pesanan/${item.id}/konfirmasi-penerimaan`)}
                                      className="text-emerald-600 hover:text-emerald-800 font-medium"
                                    >
                                      Konfirmasi Penerimaan
                                    </button>
                                  );
                                }
                                if (item.status === 'Selesai') {
                                  return (
                                    <>
                                      <Link
                                        to={`/pbf/pesanan/${item.id}/ajukan-pengembalian`}
                                        className="text-red-600 hover:text-red-800 font-medium"
                                      >
                                        Ajukan Pengembalian
                                      </Link>
                                      <button
                                        onClick={() => handleOpenSelesaiModal(item.id)}
                                        className="text-gray-600 hover:text-gray-800 font-medium p-0"
                                      >
                                        Selesai
                                      </button>
                                    </>
                                  );
                                }
                                // Default untuk status lain (Ditolak, Dibatalkan, Pengembalian Diajukan, dll)
                                return (
                                  <>
                                    <Link to={`/pbf/pesanan/${item.id}/detail`} className="text-blue-600 hover:text-blue-800">
                                      Detail
                                    </Link>
                                    <Link to={`/pbf/pesanan/${item.id}/lacak`} className="text-blue-600 hover:text-blue-800">
                                      Lacak
                                    </Link>
                                  </>
                                );
                              })()}
                            </div>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="6" className="text-center py-10 text-gray-500">
                          {searchTerm || statusFilter !== 'Semua Status'
                            ? 'Tidak ada pesanan yang sesuai dengan filter.'
                            : 'Anda belum memiliki pesanan.'}
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </main>

        {/* --- RENDER MODAL (Tidak Berubah) --- */}
        <SelesaiModal 
          show={showSelesaiModal}
          onClose={handleCloseSelesaiModal}
          onConfirm={handleConfirmSelesai}
          orderId={selectedOrderId}
        />
        {/* --- AKHIR RENDER MODAL --- */}

      </div>
    </div>
  );
};

export default PesanObat;