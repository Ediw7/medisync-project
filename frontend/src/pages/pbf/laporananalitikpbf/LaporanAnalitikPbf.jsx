import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom'; // Ditambahkan 'Link'
import SidebarPbf from '../../../components/SidebarPbf';
import NavbarPbf from '../../../components/NavbarPbf';
import { 
  ChevronDown, 
  Search, 
  Calendar, 
  Loader2, 
  AlertTriangle, 
  BarChart as BarChartIcon, 
  PieChart,
  DollarSign,
  Archive,
  ShoppingCart,
  Package // Icon untuk tabel
} from 'lucide-react';
import { Bar, Pie } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
} from 'chart.js';
import axios from 'axios';
import { toast } from 'react-hot-toast';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
);

// ... (Komponen KpiCard, ChartPlaceholder, formatDate, getStatusBadge - TIDAK BERUBAH) ...
const KpiCard = ({ title, value, icon: Icon, format = "number" }) => {
  const formattedValue = format === 'currency' 
    ? `Rp ${Number(value || 0).toLocaleString('id-ID')}`
    : Number(value || 0).toLocaleString('id-ID');
  
  return (
    <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-200 flex items-center gap-4">
      <div className="flex-shrink-0 flex items-center justify-center w-12 h-12 rounded-full bg-emerald-100 text-emerald-600">
        <Icon size={24} />
      </div>
      <div>
        <p className="text-sm font-medium text-slate-500">{title}</p>
        <p className="text-2xl font-bold text-slate-800">{formattedValue}</p>
      </div>
    </div>
  );
};
const ChartPlaceholder = ({ message, type = 'loading' }) => (
  <div className="flex flex-col items-center justify-center h-full min-h-[300px] text-slate-500">
    {type === 'loading' && <Loader2 className="animate-spin h-8 w-8 text-emerald-600" />}
    {type === 'error' && <AlertTriangle className="h-8 w-8 text-red-500" />}
    {type ===( 'empty') && <BarChartIcon className="h-8 w-8 text-slate-400" />}
    <span className="mt-3 text-sm font-medium">{message}</span>
  </div>
);
const formatDate = (dateString) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('id-ID', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    });
};
const getStatusBadge = (status) => {
    switch (status) {
      case 'Perlu Dikirim': return 'bg-amber-100 text-amber-800';
      case 'Dikirim': return 'bg-blue-100 text-blue-800';
      case 'Selesai': return 'bg-emerald-100 text-emerald-800';
      case 'Dibatalkan': return 'bg-red-100 text-red-800';
      case 'Pembatalan Ditolak': return 'bg-pink-100 text-pink-800';
      case 'Pengembalian Diajukan': return 'bg-orange-100 text-orange-800';
      case 'Dikembalikan': return 'bg-purple-100 text-purple-800';
      case 'Pengembalian Ditolak': return 'bg-pink-100 text-pink-800';
      case 'Pengembalian Selesai': return 'bg-purple-100 text-purple-800';
      default: return 'bg-slate-100 text-slate-800';
    }
};


const LaporanAnalitikPbf = () => {
  const navigate = useNavigate();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [username, setUsername] = useState(localStorage.getItem('username') || 'PBF');

  // ... (State dan Opsi Chart tidak berubah) ...
  const [kpiData, setKpiData] = useState(null); 
  const [barChartData, setBarChartData] = useState(null);
  const [pieChartData, setPieChartData] = useState(null);
  const [riwayatData, setRiwayatData] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const chartOptions = (title) => ({
    responsive: true,
    maintainAspectRatio: false,
    plugins: { 
      legend: { display: false },
      title: {
        display: true,
        text: title,
        font: { size: 16, weight: '600' },
        padding: { bottom: 20 },
        color: '#1e293b'
      }
    },
    scales: { 
      y: { 
        beginAtZero: true, 
        grid: { color: '#e2e8f0' },
        ticks: { color: '#64748b' }
      },
      x: { 
        grid: { display: false },
        ticks: { color: '#64748b' }
      }
    }
  });
  const pieChartOptions = (title) => ({
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom',
        labels: { boxWidth: 15, padding: 15 }
      },
      title: {
        display: true,
        text: title,
        font: { size: 16, weight: '600' },
        padding: { bottom: 20 },
        color: '#1e293b'
      }
    },
  });

  // --- useEffect Data Fetching (Tidak berubah) ---
  useEffect(() => {
    const fetchAllData = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          toast.error("Sesi tidak valid, silakan login.");
          navigate('/login/pbf');
          return;
        }

        const barPromise = axios.get(`http://localhost:5000/api/pbf/laporan/pemesanan-bulanan-produsen`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        const piePromise = axios.get('http://localhost:5000/api/pbf/laporan/transaksi-per-produsen', {
          headers: { Authorization: `Bearer ${token}` }
        });
        const tablePromise = axios.get('http://localhost:5000/api/pbf/laporan/riwayat-produsen', {
          headers: { Authorization: `Bearer ${token}` }
        });
        const kpiPromise = axios.get('http://localhost:5000/api/pbf/laporan/kpi-data', {
          headers: { Authorization: `Bearer ${token}` }
        });

        const [barResponse, pieResponse, tableResponse, kpiResponse] = await Promise.all([
          barPromise,
          piePromise,
          tablePromise,
          kpiPromise
        ]);

        if (barResponse.data.success) {
          setBarChartData({
            labels: barResponse.data.labels,
            datasets: [{
              label: 'Jumlah Obat Dipesan',
              data: barResponse.data.data,
              backgroundColor: '#10B981',
              borderRadius: 5,
            }],
          });
        } else {
          throw new Error('Gagal memuat data chart pemesanan');
        }

        if (pieResponse.data.success) {
          setPieChartData({
            labels: pieResponse.data.labels,
            datasets: [{
              data: pieResponse.data.data,
              backgroundColor: ['#10B981', '#34D399', '#6EE7B7', '#A7F3D0', '#D1FAE5'],
              borderColor: '#FFFFFF',
              borderWidth: 2,
            }],
          });
        } else {
          throw new Error('Gagal memuat data transaksi produsen');
        }
        
        if (tableResponse.data.success) {
          setRiwayatData(tableResponse.data.data);
        } else {
          throw new Error('Gagal memuat riwayat transaksi');
        }

        if (kpiResponse.data.success) {
          setKpiData(kpiResponse.data.data);
        } else {
          throw new Error('Gagal memuat data KPI');
        }

      } catch (err) {
        const errorMsg = err.response?.data?.message || err.message;
        setError(errorMsg);
        toast.error(errorMsg);
        if ((err.message.includes('401') || err.message.includes('403'))) {
            navigate('/login/pbf');
        }
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchAllData();
  }, [navigate]);

  // --- HANDLER BARU UNTUK DROPDOWN ---
  const handleDropdownChange = (e) => {
    if (e.target.value === 'apotek') {
      navigate('/pbf/laporan-analitik-ke-apotek');
    }
  };

  return (
    <div className="flex min-h-screen bg-slate-50">
      <SidebarPbf isCollapsed={isCollapsed} setIsCollapsed={setIsCollapsed} />
      <div className={`flex-1 flex flex-col transition-all duration-300 ${isCollapsed ? 'ml-16' : 'ml-64'}`}>
        <NavbarPbf onLogout={() => { localStorage.clear(); navigate('/'); }} username={username} />
        <main className="flex-1 overflow-auto pt-[72px] px-12 py-8">
          
          {/* Header */}
          <div className="flex flex-wrap justify-between items-center mb-6">
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-slate-900 via-emerald-900 to-teal-900 bg-clip-text text-transparent">
                Laporan & Analitik
              </h1>
              <p className="text-slate-600 text-lg mt-1">Pantau performa pembelian Anda dari produsen.</p>
            </div>
            
            {/* --- PERBAIKAN DROPDOWN --- */}
            <div className="relative">
                <select 
                  value="produsen" // <-- Nilai default halaman ini
                  onChange={handleDropdownChange} // <-- Handler untuk pindah halaman
                  className="flex items-center gap-2 border rounded-lg px-4 py-2 text-sm bg-white shadow-sm appearance-none pr-8 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                    <option value="produsen">Laporan Produsen</option>
                    <option value="apotek">Laporan Apotek</option>
                </select>
                <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
            </div>
            {/* --- AKHIR PERBAIKAN --- */}

          </div>
          
          {error && (
             <div className="p-4 mb-6 bg-red-50 text-red-700 rounded-lg border border-red-200 flex items-center gap-2 text-sm">
                <AlertTriangle size={18} /> {error}
              </div>
          )}
          
          {/* KPI Cards (Sudah diperbarui) */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
            {isLoading || !kpiData ? (
              <>
                <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-200 h-[100px] animate-pulse"><div className="w-3/4 h-4 bg-slate-200 rounded"></div><div className="w-1/2 h-6 bg-slate-200 rounded mt-2"></div></div>
                <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-200 h-[100px] animate-pulse"><div className="w-3/4 h-4 bg-slate-200 rounded"></div><div className="w-1/2 h-6 bg-slate-200 rounded mt-2"></div></div>
                <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-200 h-[100px] animate-pulse"><div className="w-3/4 h-4 bg-slate-200 rounded"></div><div className="w-1/2 h-6 bg-slate-200 rounded mt-2"></div></div>
              </>
            ) : (
              <>
                <KpiCard title="Total Pembelian (Selesai)" value={kpiData.totalPembelian} icon={DollarSign} format="currency" />
                <KpiCard title="Total Pesanan Selesai" value={kpiData.totalPesananProdusenSelesai} icon={Package} />
                <KpiCard title="Total Stok Gudang" value={kpiData.totalStokGudang} icon={Archive} />
              </>
            )}
          </div>

          {/* Tata Letak Grafik (Sudah diperbarui) */}
          <div className="grid grid-cols-1 gap-6 mb-6">
            {/* Pemesanan Obat (Bar Chart) - Full-width */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 h-[400px] flex flex-col">
              <div className="h-full">
                {isLoading ? (
                  <ChartPlaceholder message="Memuat chart pemesanan..." type="loading" />
                ) : barChartData?.labels.length > 0 ? (
                  <Bar data={barChartData} options={chartOptions('Pemesanan Obat dari Produsen (12 Bulan)')} />
                ) : (
                  <ChartPlaceholder message="Tidak ada data pemesanan." type="empty" />
                )}
              </div>
            </div>

            {/* Transaksi dengan Produsen (Pie Chart) - Full-width */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 h-[400px] flex flex-col">
              <div className="h-full flex items-center justify-center">
                {isLoading ? (
                  <ChartPlaceholder message="Memuat chart transaksi..." type="loading" />
                ) : pieChartData?.labels.length > 0 ? (
                  <Pie data={pieChartData} options={pieChartOptions('Distribusi Transaksi per Produsen')} />
                ) : (
                  <ChartPlaceholder message="Tidak ada data transaksi." type="empty" />
                )}
              </div>
            </div>
          </div>

          {/* Riwayat Transaksi (Tidak berubah) */}
          <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
            <div className="flex flex-wrap justify-between items-center mb-4">
                <h2 className="font-semibold text-lg">Riwayat Transaksi (10 Terbaru)</h2>
                <div className="flex items-center gap-4">
                    <div className="relative">
                        <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                        <input type="text" placeholder="Cari ID Pesanan..." className="pl-10 pr-4 py-2 border rounded-lg text-sm w-72" />
                    </div>
                    <div className="relative">
                         <Calendar size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                        <input type="text" placeholder="Tanggal" className="pl-10 pr-4 py-2 border rounded-lg text-sm w-40" />
                    </div>
                </div>
            </div>
            
            <div className="overflow-x-auto">
                <table className="min-w-full">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">ID Pesanan</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tanggal</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Nama Produsen</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Jumlah Item</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {isLoading ? (
                            <tr>
                                <td colSpan="5">
                                    <ChartPlaceholder message="Memuat riwayat..." type="loading" />
                                </td>
                            </tr>
                        ) : riwayatData.length > 0 ? (
                            riwayatData.map(item => (
                                <tr key={item.id}>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-emerald-700">#{String(item.id).padStart(6, '0')}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm">{formatDate(item.tanggal_pesanan)}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">{item.nama_produsen}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm">{item.jumlah_item}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                                        <span className={`px-3 py-1 text-xs font-semibold rounded-full ${getStatusBadge(item.status)}`}>
                                            {item.status}
                                        </span>
                                    </td>
                                </tr>
                            ))
                        ) : (
                             <tr>
                                <td colSpan="5">
                                    <ChartPlaceholder message="Tidak ada riwayat transaksi ditemukan." type="empty" />
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
            {/* --- Link "Lihat Semua" --- */}
            <div className="text-center mt-6">
                <Link to="/pbf/pesan-obat" className="text-emerald-600 font-semibold text-sm hover:underline">
                    Lihat Semua Transaksi →
                </Link>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default LaporanAnalitikPbf;