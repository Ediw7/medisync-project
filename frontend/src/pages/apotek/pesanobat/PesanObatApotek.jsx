import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import NavbarApotek from '../../../components/NavbarApotek';
import {
  Search,
  Plus,
  ShoppingCart,
  Loader2,
  AlertTriangle,
  Package,
  Calendar,
  FileText,
  CheckCircle,
  CheckCircle2,
  XCircle,
  Info,
  X
} from 'lucide-react';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import NavItemApotek from '../../../components/NavItemApotek';

// --- MODAL KONFIRMASI (DESAIN BARU) ---
const SelesaiModal = ({ show, onClose, onConfirm, orderId }) => {
  if (!show) return null;

  return (
    <div 
      className="fixed inset-0 bg-black/20 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div
        className="bg-white p-8 rounded-xl shadow-2xl max-w-sm w-full mx-auto animate-in fade-in zoom-in-95 duration-200 border border-slate-200"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-3 mb-4 text-emerald-600">
          <CheckCircle size={28} className="flex-shrink-0" />
          <h3 className="font-bold text-lg text-slate-800">Konfirmasi Pesanan Selesai</h3>
        </div>
        <p className="text-slate-700 mb-6 leading-relaxed">
          Apakah Anda yakin ingin menyelesaikan pesanan ID: <strong className="font-mono">#{String(orderId).padStart(6, '0')}</strong>? 
          Tindakan ini akan mengarsipkan pesanan.
        </p>
        <div className="flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-6 py-2.5 font-medium rounded-lg transition bg-slate-100 text-slate-700 hover:bg-slate-200"
          >
            Batal
          </button>
          <button
            onClick={onConfirm}
            className="px-6 py-2.5 font-medium rounded-lg transition bg-emerald-600 text-white hover:bg-emerald-700"
          >
            Ya, Selesaikan
          </button>
        </div>
      </div>
    </div>
  );
};
// --- AKHIR MODAL ---

// --- KOMPONEN CARD PESANAN (DIPERBAIKI) ---
const OrderCard = ({ item, getStatusBadge, formatDate, renderAction }) => {
  return (
    <div className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden transition-all duration-300 hover:shadow-md">
      {/* Card Header: PO Num + Status */}
      <div className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50 border-b border-slate-200">
        <div>
          <span className="text-xs text-slate-500">Nomor Pesanan</span>
          {/* PERBAIKAN: Gunakan nomor_pesanan */}
          <p className="text-sm font-semibold font-mono text-slate-900">{item.nomor_pesanan}</p> 
        </div>
        <span className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full border ${getStatusBadge(item.status)}`}>
          {item.status}
        </span>
      </div>
      
      {/* Card Body: PBF, Date, Price */}
      <div className="p-4 grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div>
          <p className="text-xs text-slate-500">PBF (Pengirim)</p>
          {/* PERBAIKAN: Gunakan nama_pbf */}
          <p className="text-sm font-medium text-slate-800">{item.nama_pbf || 'N/A'}</p>
        </div>
        <div>
          <p className="text-xs text-slate-500">Tanggal Pesan</p>
          <p className="text-sm font-medium text-slate-600">{formatDate(item.tanggal_pesanan)}</p>
        </div>
        <div className="sm:text-right">
          <p className="text-xs text-slate-500">Total</p>
          <p className="text-sm font-semibold text-emerald-700">Rp {(item.total_harga || 0).toLocaleString('id-ID')}</p>
        </div>
      </div>

      {/* Card Footer: Actions (DIPERBAIKI) */}
      <div className="p-4 flex justify-between items-center bg-slate-50/50 border-t border-slate-100">
        {/* Link Surat Pesanan ditambahkan di kiri */}
        <Link 
          to={`/apotek/pesanan/${item.id}/detail`}
          className="text-sm font-medium text-emerald-600 hover:text-emerald-800 hover:underline"
        >
          Lihat Surat Pesanan
        </Link>
        {/* Aksi utama di kanan */}
        {renderAction(item)}
      </div>
    </div>
  );
};
// --- AKHIR KOMPONEN CARD ---


const PesanObatApotek = () => {
  const navigate = useNavigate();
  const [pesananData, setPesananData] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  // statusFilter tidak lagi dibutuhkan
  const [dateRange, setDateRange] = useState({ startDate: null, endDate: null });
  const [isDateFilterOpen, setIsDateFilterOpen] = useState(false);
  const [showSelesaiModal, setShowSelesaiModal] = useState(false);
  const [selectedOrderId, setSelectedOrderId] = useState(null);
  const username = localStorage.getItem('username');

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    let token;
    try {
      token = localStorage.getItem('token');
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
  }, [navigate]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleLogout = () => {
    localStorage.clear();
    navigate('/');
  };

  const filteredData = useMemo(() => {
    return pesananData
      // Filter status Dihapus (ini tab "Semua")
      .filter(item =>
        (item.nama_pbf?.toLowerCase() || '').includes(searchTerm.toLowerCase()) || // PERBAIKAN: Cari nama_pbf
        (item.nomor_pesanan?.toLowerCase() || '').includes(searchTerm.toLowerCase()) // PERBAIKAN: Cari nomor_pesanan
      )
      .filter(item => {
        if (!dateRange.startDate || !dateRange.endDate) {
          return true;
        }
        try {
            const itemDate = new Date(item.tanggal_pesanan);
            const startDate = new Date(dateRange.startDate);
            const endDate = new Date(dateRange.endDate);
            
            if (isNaN(itemDate.getTime()) || isNaN(startDate.getTime()) || isNaN(endDate.getTime())) return false;

            startDate.setHours(0, 0, 0, 0);
            endDate.setHours(23, 59, 59, 999);

            return itemDate >= startDate && itemDate <= endDate;
        } catch (e) {
            console.error("Date parsing error:", e);
            return false;
        }
      });
  }, [pesananData, searchTerm, dateRange]); // statusFilter dihapus

  const getStatusBadge = (status) => {
    switch (status) {
      case 'Menunggu Konfirmasi': return 'bg-amber-100 text-amber-800 border border-amber-200';
      case 'Perlu Dikirim': return 'bg-orange-100 text-orange-800 border border-orange-200';
      case 'Dikirim': return 'bg-blue-100 text-blue-800 border border-blue-200';
      case 'Selesai': return 'bg-emerald-100 text-emerald-800 border border-emerald-200';
      case 'Pembatalan Diajukan': return 'bg-yellow-100 text-yellow-800 border border-yellow-200';
      case 'Dibatalkan': return 'bg-red-100 text-red-800 border border-red-200';
      case 'Pengembalian Diajukan': return 'bg-indigo-100 text-indigo-800 border-indigo-200';
      case 'Pengembalian Disetujui': return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'Dikembalikan': return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'Pengembalian Ditolak': return 'bg-pink-100 text-pink-800 border-pink-200';
      case 'Pengembalian Selesai': return 'bg-teal-100 text-teal-800 border-teal-200';
      default: return 'bg-slate-100 text-slate-700 border border-slate-200';
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    try {
        const date = new Date(dateString);
        if (isNaN(date.getTime())) return '-';
        return date.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' });
    } catch {
        return '-';
    }
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
    console.log('Pesanan dikonfirmasi selesai:', selectedOrderId);
    toast.success('Pesanan telah ditandai selesai.');
    handleCloseSelesaiModal();
    setPesananData(prevData => prevData.map(item => 
        item.id === selectedOrderId ? { ...item, status: 'Selesai' } : item
    ));
  };
  
  const renderAction = (item) => {
    const baseClasses = "text-sm font-semibold hover:underline transition-colors duration-150 inline-flex items-center gap-1.5 py-1 px-2 rounded-md";
    const detailClasses = "text-slate-600 hover:text-slate-800 hover:bg-slate-100";
    const cancelClasses = "text-red-600 hover:text-red-800 hover:bg-red-50";
    const confirmClasses = "text-emerald-600 hover:text-emerald-800 hover:bg-emerald-50";
    const historyClasses = "text-purple-600 hover:text-purple-800 hover:bg-purple-50";

    switch (item.status) {
      case 'Menunggu Konfirmasi':
      case 'Perlu Dikirim':
        return (
          <Link to={`/apotek/pesanan/${item.id}/batalkan`} className={`${baseClasses} ${cancelClasses}`}>
            <XCircle size={14}/> Batalkan
          </Link>
        );
      case 'Dikirim':
        return (
          <Link to={`/apotek/pesanan/${item.id}/konfirmasi-penerimaan`} className={`${baseClasses} ${confirmClasses}`}>
            <CheckCircle2 size={14}/> Konfirmasi Penerimaan
          </Link>
        );
      case 'Selesai':
       
        const assetId = item.id_aset_blockchain;


        return assetId ? (
          <Link to={`/apotek/pesanan/riwayat/${assetId}`} className={`${baseClasses} ${historyClasses}`}>
            <FileText size={14}/> Lihat Riwayat
          </Link>
        ) : (
          <span className="text-slate-400 text-xs italic">(Riwayat T/A)</span>
        );
      
      case 'Pengembalian Diajukan':
      case 'Dikembalikan':
      case 'Pengembalian Disetujui':
      case 'Pengembalian Selesai':
      case 'Pengembalian Ditolak':
        return (
          <Link to={`/apotek/pesanan/${item.id}/lacak-pengembalian`} className={`${baseClasses} ${historyClasses}`}>
            Lacak Retur
          </Link>
        );
        
      case 'Dibatalkan':
      case 'Pembatalan Diajukan':
      default:
        // Aksi default (atau tidak ada aksi) untuk status ini,
        // karena link "Lihat Surat Pesanan" sudah ada
        return null; 
    }
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
    <div className="flex min-h-screen bg-slate-50">
      <div className="flex-1 flex flex-col">
        <NavbarApotek onLogout={handleLogout} username={username} />
        
        <main className="flex-1 overflow-auto pt-[72px] px-4 sm:px-6 lg:px-8 py-8">
          <div className="max-w-7xl mx-auto">
            
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
                    <p className="text-slate-600 text-lg mt-1">Kelola riwayat pesanan Anda ke PBF.</p>
                  </div>
                </div>
                <button 
                  onClick={() => navigate('/apotek/pesan-obat/tambah')}
                  className="w-full sm:w-auto flex items-center justify-center gap-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white py-2.5 px-5 rounded-lg font-medium shadow-md hover:shadow-lg transition-all duration-200 whitespace-nowrap"
                >
                  <Plus size={18} />
                  Pesan Obat Baru
                </button>
              </div>
               <div className="relative flex items-center gap-2 mt-4 text-sm text-slate-500">
                  <Calendar size={16} />
                  <span>{new Date().toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
                </div>
            </div>

            {error && (
              <div className="p-4 mb-6 bg-red-50 text-red-700 rounded-lg border border-red-200 flex items-center gap-2 text-sm">
                <AlertTriangle size={18} /> {error}
              </div>
            )}

            {/* --- KARTU FILTER/SEARCH --- */}
            <div className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden relative z-10 mb-6">
              <div className="p-4 border-b border-slate-200">
                  <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
                      <div className="flex overflow-x-auto sm:overflow-visible w-full sm:w-auto">
                        <div className="flex space-x-2 bg-slate-100 p-1.5 rounded-lg">
                          {/* --- MENGGUNAKAN NAVITEM (LINK) --- */}
                          <NavItemApotek to="/apotek/pesan-obat">Semua</NavItemApotek>
                          {/* Menghapus 'Menunggu Konfirmasi' */}
                          <NavItemApotek to="/apotek/pesan-obat/perlu-dikirim">Perlu Dikirim</NavItemApotek>
                          <NavItemApotek to="/apotek/pesan-obat/dikirim">Dikirim</NavItemApotek>
                          <NavItemApotek to="/apotek/pesan-obat/selesai">Selesai</NavItemApotek>
                          <NavItemApotek to="/apotek/pesan-obat/dibatalkan">Dibatalkan</NavItemApotek>
                          <NavItemApotek to="/apotek/pesan-obat/pengembalian">Pengembalian</NavItemApotek>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2 w-full sm:w-auto flex-shrink-0">
                          <div className="relative flex-1 sm:flex-none">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
                            <input
                              type="text"
                              placeholder="Cari No. Pesanan / PBF..."
                              value={searchTerm}
                              onChange={(e) => setSearchTerm(e.target.value)}
                              className="pl-9 pr-4 py-2 border border-slate-300 rounded-lg w-full sm:w-64 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
                            />
                          </div>
                          <div className="relative">
                            <button
                              onClick={() => setIsDateFilterOpen(!isDateFilterOpen)}
                              className={`p-2 border rounded-lg flex items-center gap-2 text-sm ${isDateFilterOpen ? 'bg-emerald-50 text-emerald-700 border-emerald-300' : 'bg-white text-slate-600 border-slate-300 hover:bg-slate-50'}`}
                            >
                              <Calendar size={16} />
                            </button>

                            {isDateFilterOpen && (
                              <div className="absolute right-0 mt-2 w-72 bg-white p-4 rounded-lg shadow-xl z-20 border border-slate-200">
                                <p className="text-sm font-semibold mb-2 text-slate-800">Pilih Rentang Tanggal</p>
                                <div className="flex items-center gap-2 mb-2">
                                  <div>
                                    <label className="text-xs text-slate-500">Mulai</label>
                                    <input
                                      type="date"
                                      value={dateRange.startDate || ''}
                                      onChange={(e) => setDateRange({ ...dateRange, startDate: e.target.value })}
                                      className="w-full p-1 border border-slate-300 rounded-md text-sm"
                                    />
                                  </div>
                                  <div>
                                    <label className="text-xs text-slate-500">Selesai</label>
                                    <input
                                      type="date"
                                      value={dateRange.endDate || ''}
                                      onChange={(e) => setDateRange({ ...dateRange, endDate: e.target.value })}
                                      className="w-full p-1 border border-slate-300 rounded-md text-sm"
                                    />
                                  </div>
                                </div>
                                <div className="flex justify-end gap-2 mt-4">
                                     <button onClick={() => {
                                          setDateRange({ startDate: null, endDate: null });
                                          setIsDateFilterOpen(false);
                                      }} className="text-xs font-medium text-slate-600 hover:text-red-600 px-3 py-1 rounded-md hover:bg-red-50">Reset</button>
                                     <button
                                        onClick={() => setIsDateFilterOpen(false)}
                                        className="py-1.5 px-4 bg-emerald-600 text-white rounded-md text-sm hover:bg-emerald-700"
                                      >
                                        Terapkan
                                      </button>
                                </div>
                              </div>
                            )}
                          </div>
                      </div>
                  </div>
              </div>
            </div>
            
            {/* --- DAFTAR KARTU PENGGANTI TABEL --- */}
            <div className="overflow-x-auto">
              {isLoading && pesananData.length === 0 ? (
                <div className="p-10 text-center text-slate-500">
                   {/* Loader ditaruh di state loading utama */}
                </div>
              ) : filteredData.length > 0 ? (
                <div className="space-y-4">
                  {filteredData.map((item) => (
                    <OrderCard
                      key={item.id}
                      item={item}
                      getStatusBadge={getStatusBadge}
                      formatDate={formatDate}
                      renderAction={renderAction}
                    />
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 bg-white rounded-lg border border-dashed border-slate-300">
                  <ShoppingCart size={48} className="mx-auto mb-3 text-slate-300" />
                  <p className="text-slate-500 font-medium">
                    {searchTerm
                      ? "Tidak ada pesanan yang sesuai dengan filter."
                      : "Anda belum pernah membuat pesanan."}
                  </p>
                </div>
              )}
            </div>
            {/* --- AKHIR DAFTAR KARTU --- */}

          </div>
        </main>

        <SelesaiModal 
          show={showSelesaiModal}
          onClose={handleCloseSelesaiModal}
          onConfirm={handleConfirmSelesai}
          orderId={selectedOrderId}
        />
        
      </div>
       <style jsx global>{`
        input[type="date"]::-webkit-calendar-picker-indicator {
            background: transparent;
            bottom: 0;
            color: transparent;
            cursor: pointer;
            height: auto;
            left: 0;
            position: absolute;
            right: 0;
            top: 0;
            width: auto;
        }
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

export default PesanObatApotek;
