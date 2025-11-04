import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import SidebarPbf from '../../../components/SidebarPbf';
import NavbarPbf from '../../../components/NavbarPbf';
import { Search, Calendar, X, CheckCircle, Loader2, Package, ShoppingCart, AlertTriangle } from 'lucide-react';
import axios from 'axios';

// --- MODAL ---
const SelesaiModal = ({ show, onClose, onConfirm, orderId }) => {
  if (!show) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center p-4">
      <div className="bg-white p-6 rounded-2xl shadow-xl max-w-sm w-full">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold text-slate-800">Konfirmasi Pesanan Selesai</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <X size={24} />
          </button>
        </div>
        <div className="text-center">
          <CheckCircle size={48} className="text-emerald-500 mx-auto mb-4" />
          <p className="text-slate-600 mb-6">
            Apakah Anda yakin ingin menyelesaikan pesanan ID: <strong>{String(orderId).padStart(6, '0')}</strong>?
          </p>
          <div className="flex justify-end gap-4">
            <button onClick={onClose} className="py-2 px-4 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200">
              Batal
            </button>
            <button onClick={onConfirm} className="py-2 px-4 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700">
              Ya, Selesaikan
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

const PesanObat = () => {
  const navigate = useNavigate();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [pesananData, setPesananData] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('Semua Status');
  const [dateRange, setDateRange] = useState({ startDate: null, endDate: null });
  const [isDateFilterOpen, setIsDateFilterOpen] = useState(false);

  const [showSelesaiModal, setShowSelesaiModal] = useState(false);
  const [selectedOrderId, setSelectedOrderId] = useState(null);

  useEffect(() => {
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
    return pesananData
      .filter(item => statusFilter === 'Semua Status' || item.status === statusFilter)
      .filter(item =>
        (item.nomor_po?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
        (item.nama_produsen?.toLowerCase() || '').includes(searchTerm.toLowerCase())
      )
      .filter(item => {
        if (!dateRange.startDate || !dateRange.endDate) return true;
        const itemDate = new Date(item.tanggal_pesanan);
        const startDate = new Date(dateRange.startDate);
        const endDate = new Date(dateRange.endDate);
        startDate.setHours(0, 0, 0, 0);
        endDate.setHours(23, 59, 59, 999);
        return itemDate >= startDate && itemDate <= endDate;
      });
  }, [pesananData, searchTerm, statusFilter, dateRange]);

  const getStatusBadge = (status) => {
    const badges = {
      'Perlu Dikirim': 'bg-amber-50 text-amber-700 border-amber-200',
      'Dikirim': 'bg-blue-50 text-blue-700 border-blue-200',
      'Selesai': 'bg-emerald-50 text-emerald-700 border-emerald-200',
      'Ditolak': 'bg-red-50 text-red-700 border-red-200',
      'Dibatalkan': 'bg-red-50 text-red-700 border-red-200',
      'Pembatalan Ditolak': 'bg-pink-50 text-pink-700 border-pink-200',
      'Pengembalian Diajukan': 'bg-orange-50 text-orange-700 border-orange-200',
      'Dikembalikan': 'bg-purple-50 text-purple-700 border-purple-200',
      'Pengembalian Ditolak': 'bg-pink-50 text-pink-700 border-pink-200',
      'Pengembalian Selesai': 'bg-purple-50 text-purple-700 border-purple-200',
    };
    return badges[status] || 'bg-slate-50 text-slate-700 border-slate-200';
  };

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('id-ID', {
      day: '2-digit', month: 'long', year: 'numeric'
    });
  };

  const formatRupiah = (value) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(value || 0);
  };

  const handleOpenSelesaiModal = (id) => {
    setSelectedOrderId(id);
    setShowSelesaiModal(true);
  };

  const handleCloseSelesaiModal = () => {
    setShowSelesaiModal(false);
    setSelectedOrderId(null);
  };

  const handleConfirmSelesai = () => {
    alert('Pesanan telah dikonfirmasi selesai dan akan diarsipkan.');
    handleCloseSelesaiModal();
    setPesananData(prev => prev.filter(item => item.id !== selectedOrderId));
  };

  if (isLoading && pesananData.length === 0) {
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
      <SidebarPbf isCollapsed={isCollapsed} setIsCollapsed={setIsCollapsed} />
      <div className={`flex-1 flex flex-col transition-all duration-300 ${isCollapsed ? 'ml-16' : 'ml-64'}`}>
        <NavbarPbf onLogout={handleLogout} />
        <main className="flex-1 overflow-auto pt-[72px] px-12 py-8">
          <div className="max-w-7xl mx-auto">

            {/* Header */}
            <div className="mb-10 relative">
              <div className="absolute -top-20 -left-20 w-72 h-72 bg-emerald-200 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob"></div>
              <div className="absolute -top-20 -right-20 w-72 h-72 bg-teal-200 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000"></div>

              <div className="relative flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div className="flex items-center gap-3">
                  <div className="flex items-center justify-center w-12 h-12 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl shadow-lg">
                    <ShoppingCart className="text-white" size={24} />
                  </div>
                  <div>
                    <h1 className="text-4xl font-bold bg-gradient-to-r from-slate-900 via-emerald-900 to-teal-900 bg-clip-text text-transparent">
                      Pesanan Obat
                    </h1>
                    <p className="text-slate-600 text-lg mt-1">Kelola dan lacak pesanan obat ke produsen</p>
                  </div>
                </div>

                <button
                  onClick={() => navigate('/pbf/pesan-obat/tambah')}
                  className="bg-gradient-to-br from-emerald-500 to-teal-600 text-white font-medium py-2.5 px-5 rounded-lg hover:shadow-lg transition-all flex items-center gap-2 shadow-sm"
                >
                  <span className="font-semibold">+</span> Buat Pesanan Baru
                </button>
              </div>
            </div>

            {error && (
              <div className="p-4 mb-6 bg-red-50 text-red-700 rounded-2xl border border-red-200 flex items-center gap-3 shadow-sm">
                <AlertTriangle size={20} />
                <span className="font-medium">{error}</span>
              </div>
            )}

            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
              <div className="p-6 border-b border-slate-200">
                <h2 className="text-xl font-bold text-slate-900 mb-4 flex items-center gap-2">
                  <Package size={20} className="text-emerald-600" />
                  Daftar Pesanan Obat
                </h2>

                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <input
                      type="text"
                      placeholder="Cari Nomor PO atau Nama Produsen..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                    />
                  </div>

                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="px-4 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 bg-white"
                  >
                    <option>Semua Status</option>
                    <option>Perlu Dikirim</option>
                    <option>Dikirim</option>
                    <option>Selesai</option>
                    <option>Dibatalkan</option>
                    <option>Pembatalan Ditolak</option>
                    <option>Pengembalian Diajukan</option>
                    <option>Dikembalikan</option>
                    <option>Pengembalian Ditolak</option>
                    <option>Pengembalian Selesai</option>
                  </select>

                  {/* Filter Tanggal */}
                  <div className="relative">
                    <button
                      onClick={() => setIsDateFilterOpen(!isDateFilterOpen)}
                      className="w-full sm:w-auto flex items-center justify-between pl-10 pr-4 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 hover:bg-slate-50"
                    >
                      <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                      <span className="text-slate-700">
                        {dateRange.startDate && dateRange.endDate
                          ? `${formatDate(dateRange.startDate)} - ${formatDate(dateRange.endDate)}`
                          : 'Filter Tanggal'}
                      </span>
                      {dateRange.startDate && (
                        <X
                          size={16}
                          className="ml-2 text-slate-500 hover:text-red-500"
                          onClick={(e) => {
                            e.stopPropagation();
                            setDateRange({ startDate: null, endDate: null });
                            setIsDateFilterOpen(false);
                          }}
                        />
                      )}
                    </button>

                    {isDateFilterOpen && (
                      <div className="absolute right-0 mt-2 w-80 bg-white p-4 rounded-xl shadow-xl z-20 border border-slate-200">
                        <p className="text-sm font-semibold text-slate-900 mb-3">Pilih Rentang Tanggal</p>
                        <div className="grid grid-cols-2 gap-3 mb-3">
                          <div>
                            <label className="text-xs text-slate-500 mb-1 block">Mulai</label>
                            <input type="date" value={dateRange.startDate || ''} onChange={(e) => setDateRange({ ...dateRange, startDate: e.target.value })} className="w-full p-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500" />
                          </div>
                          <div>
                            <label className="text-xs text-slate-500 mb-1 block">Selesai</label>
                            <input type="date" value={dateRange.endDate || ''} onChange={(e) => setDateRange({ ...dateRange, endDate: e.target.value })} className="w-full p-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500" />
                          </div>
                        </div>
                        <div className="flex gap-2 mb-3">
                          <button onClick={() => { const today = new Date(); const lastWeek = new Date(today.getFullYear(), today.getMonth(), today.getDate() - 7); setDateRange({ startDate: lastWeek.toISOString().split('T')[0], endDate: today.toISOString().split('T')[0] }); }} className="text-xs border border-slate-300 px-3 py-1.5 rounded-lg hover:bg-emerald-50 hover:border-emerald-300 hover:text-emerald-700">7 Hari Terakhir</button>
                          <button onClick={() => { const today = new Date(); const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1); setDateRange({ startDate: startOfMonth.toISOString().split('T')[0], endDate: today.toISOString().split('T')[0] }); }} className="text-xs border border-slate-300 px-3 py-1.5 rounded-lg hover:bg-emerald-50 hover:border-emerald-300 hover:text-emerald-700">Bulan Ini</button>
                        </div>
                        <button onClick={() => setIsDateFilterOpen(false)} className="w-full py-2 bg-gradient-to-br from-emerald-500 to-teal-600 text-white rounded-lg text-sm hover:shadow-lg">
                          Terapkan
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="min-w-full">
                  <thead className="bg-slate-50 border-b-2 border-slate-200">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-bold text-slate-600 uppercase tracking-wider">Nomor PO</th>
                      <th className="px-6 py-3 text-left text-xs font-bold text-slate-600 uppercase tracking-wider">Produsen</th>
                      <th className="px-6 py-3 text-left text-xs font-bold text-slate-600 uppercase tracking-wider">Total Harga</th> {/* GANTI */}
                      <th className="px-6 py-3 text-left text-xs font-bold text-slate-600 uppercase tracking-wider">Tanggal Pesanan</th>
                      <th className="px-6 py-3 text-left text-xs font-bold text-slate-600 uppercase tracking-wider">Status</th>
                      <th className="px-6 py-3 text-left text-xs font-bold text-slate-600 uppercase tracking-wider">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-slate-100">
                    {filteredData.length > 0 ? (
                      filteredData.map((item) => (
                        <tr key={item.id} className="hover:bg-emerald-50/30 transition-colors">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-semibold text-slate-900 font-mono">{item.nomor_po}</div>
                            <div className="text-xs text-slate-400">ID: {String(item.id).padStart(6, '0')}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-slate-900">
                              {item.nama_produsen || 'Produsen Tidak Diketahui'}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-bold text-emerald-600">
                              {formatRupiah(item.total_harga)}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">
                            {formatDate(item.tanggal_pesanan)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full border ${getStatusBadge(item.status)}`}>
                              {item.status}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            <div className="flex gap-4 items-center">
                              {(() => {
                                switch (item.status) {
                                  case 'Perlu Dikirim':
                                    return <Link to={`/pbf/pesanan/${item.id}/batalkan`} className="text-red-600 hover:text-red-800">Batalkan</Link>;
                                  case 'Dikirim':
                                    return <button onClick={() => navigate(`/pbf/pesanan/${item.id}/konfirmasi-penerimaan`)} className="text-emerald-600 hover:text-emerald-800">Konfirmasi</button>;
                                  case 'Selesai':
                                    return item.id_aset_blockchain ? (
                                      <Link to={`/pbf/pesanan/riwayat/${item.id_aset_blockchain}`} className="text-emerald-600 hover:text-emerald-800">Lihat Riwayat</Link>
                                    ) : (
                                      <span className="text-slate-400">Riwayat T/A</span>
                                    );
                                  case 'Pengembalian Selesai':
                                    return <Link to={`/pbf/pesanan/${item.id}/detail-pengembalian`} className="text-purple-600 hover:text-purple-800">Lihat Riwayat</Link>;
                                  case 'Pembatalan Diajukan':
                                  case 'Dibatalkan':
                                  case 'Pembatalan Ditolak':
                                    return <Link to={`/pbf/pesanan/${item.id}/detail-pembatalan`} className="text-yellow-700 hover:text-yellow-800">Lihat Detail</Link>;
                                  case 'Pengembalian Diajukan':
                                  case 'Dikembalikan':
                                    return (
                                      <>
                                        <Link to={`/pbf/pesanan/${item.id}/detail-pengembalian`} className="text-blue-600 hover:text-blue-800">Detail</Link>
                                      </>
                                    );
                                  case 'Pengembalian Ditolak':
                                    return <Link to={`/pbf/pesanan/${item.id}/detail-pengembalian`} className="text-red-600 hover:text-red-800">Lihat Detail</Link>;
                                  default:
                                    return <Link to={`/pbf/pesanan/${item.id}/detail-pengembalian`} className="text-slate-600 hover:text-slate-800">Lihat Detail</Link>;
                                }
                              })()}
                            </div>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="6" className="text-center py-10">
                          <Package size={32} className="mx-auto mb-2 text-slate-300" />
                          <p className="text-slate-500">
                            {searchTerm || statusFilter !== 'Semua Status'
                              ? 'Tidak ada pesanan yang sesuai dengan filter.'
                              : 'Anda belum memiliki pesanan.'}
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

        <SelesaiModal show={showSelesaiModal} onClose={handleCloseSelesaiModal} onConfirm={handleConfirmSelesai} orderId={selectedOrderId} />
      </div>
    </div>
  );
};

export default PesanObat;