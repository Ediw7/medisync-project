import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import SidebarPbf from '../../../components/SidebarPbf';
import NavbarPbf from '../../../components/NavbarPbf';
import {
  ChevronDown,
  Search,
  Calendar,
  Loader2,
  AlertTriangle,
  BarChart as BarChartIcon,
  DollarSign,
  Archive,
  Package,
  FileText, // GANTI DARI FaClipboardList
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
import { FaChartBar } from 'react-icons/fa';
import axios from 'axios';
import { toast } from 'react-hot-toast';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ArcElement);

// === KOMPONEN KECIL ===
const KpiCard = ({ title, value, icon: Icon, format = 'number' }) => {
  const formattedValue =
    format === 'currency'
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
    {type === 'empty' && <BarChartIcon className="h-8 w-8 text-slate-400" />}
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
  const badges = {
    'Perlu Dikirim': 'bg-amber-100 text-amber-800',
    Dikirim: 'bg-blue-100 text-blue-800',
    Selesai: 'bg-emerald-100 text-emerald-800',
    Dibatalkan: 'bg-red-100 text-red-800',
    'Pembatalan Ditolak': 'bg-pink-100 text-pink-800',
    'Pengembalian Diajukan': 'bg-orange-100 text-orange-800',
    Dikembalikan: 'bg-purple-100 text-purple-800',
    'Pengembalian Ditolak': 'bg-pink-100 text-pink-800',
    'Pengembalian Selesai': 'bg-purple-100 text-purple-800',
  };
  return badges[status] || 'bg-slate-100 text-slate-800';
};

const LaporanAnalitikPbf = () => {
  const navigate = useNavigate();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [username] = useState(localStorage.getItem('username') || 'PBF');

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
        color: '#1e293b',
      },
    },
    scales: {
      y: { beginAtZero: true, grid: { color: '#e2e8f0' }, ticks: { color: '#64748b' } },
      x: { grid: { display: false }, ticks: { color: '#64748b' } },
    },
  });

  const pieChartOptions = (title) => ({
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { position: 'bottom', labels: { boxWidth: 15, padding: 15 } },
      title: {
        display: true,
        text: title,
        font: { size: 16, weight: '600' },
        padding: { bottom: 20 },
        color: '#1e293b',
      },
    },
  });

  // === FETCH DATA ===
  useEffect(() => {
    const fetchAllData = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          toast.error('Sesi tidak valid, silakan login.');
          navigate('/login/pbf');
          return;
        }

        const [barRes, pieRes, tableRes, kpiRes] = await Promise.all([
          axios.get(`http://localhost:5000/api/pbf/laporan/pemesanan-bulanan-produsen`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
          axios.get('http://localhost:5000/api/pbf/laporan/transaksi-per-produsen', {
            headers: { Authorization: `Bearer ${token}` },
          }),
          axios.get('http://localhost:5000/api/pbf/laporan/riwayat-produsen', {
            headers: { Authorization: `Bearer ${token}` },
          }),
          axios.get('http://localhost:5000/api/pbf/laporan/kpi-data', {
            headers: { Authorization: `Bearer ${token}` },
          }),
        ]);

        // Bar Chart
        if (barRes.data.success) {
          setBarChartData({
            labels: barRes.data.labels,
            datasets: [
              {
                label: 'Jumlah Obat Dipesan',
                data: barRes.data.data,
                backgroundColor: '#10B981',
                borderRadius: 5,
              },
            ],
          });
        }

        // Pie Chart
        if (pieRes.data.success) {
          setPieChartData({
            labels: pieRes.data.labels,
            datasets: [
              {
                data: pieRes.data.data,
                backgroundColor: ['#10B981', '#34D399', '#6EE7B7', '#A7F3D0', '#D1FAE5'],
                borderColor: '#FFFFFF',
                borderWidth: 2,
              },
            ],
          });
        }

        // Table
        if (tableRes.data.success) setRiwayatData(tableRes.data.data);

        // KPI
        if (kpiRes.data.success) setKpiData(kpiRes.data.data);
      } catch (err) {
        const msg = err.response?.data?.message || err.message;
        setError(msg);
        toast.error(msg);
        if (err.response?.status === 401) navigate('/login/pbf');
      } finally {
        setIsLoading(false);
      }
    };

    fetchAllData();
  }, [navigate]);

  // === DROPDOWN NAVIGASI ===
  const handleViewChange = (e) => {
    if (e.target.value === 'apotek') {
      navigate('/pbf/laporan-analitik-ke-apotek');
    }
  };

  const handleLogout = () => {
    localStorage.clear();
    navigate('/');
  };

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-slate-50 via-white to-emerald-50">
      <SidebarPbf isCollapsed={isCollapsed} setIsCollapsed={setIsCollapsed} />
      <div
        className={`flex-1 flex flex-col transition-all duration-300 ${isCollapsed ? 'ml-16' : 'ml-64'}`}
      >
        <NavbarPbf onLogout={handleLogout} username={username} />

        <main className="flex-1 overflow-auto pt-[72px] px-12 py-8">
          <div className="max-w-7xl mx-auto">
            {/* HEADER */}
            <div className="mb-10 relative">
              <div className="absolute -top-20 -left-20 w-72 h-72 bg-emerald-200 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob"></div>
              <div className="absolute -top-20 -right-20 w-72 h-72 bg-teal-200 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000"></div>

              <div className="relative flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div className="flex items-center gap-3">
                  <div className="flex items-center justify-center w-12 h-12 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl shadow-lg">
                    <FaChartBar className="text-white" size={24} />
                  </div>
                  <div>
                    <h1 className="text-4xl font-bold bg-gradient-to-r from-slate-900 via-emerald-900 to-teal-900 bg-clip-text text-transparent">
                      Laporan & Analitik
                    </h1>
                    <p className="text-slate-600 text-lg mt-1">
                      Overview performa bisnis dan distribusi ke apotek.
                    </p>
                  </div>
                </div>

                {/* DROPDOWN */}
                <div className="relative">
                  <select
                    defaultValue="produsen"
                    onChange={handleViewChange}
                    className="appearance-none bg-white border border-slate-300 rounded-lg pl-4 pr-10 py-2.5 text-sm font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 transition"
                  >
                    <option value="produsen">Laporan Produsen</option>
                    <option value="apotek">Laporan Apotek</option>
                  </select>
                  <ChevronDown
                    size={16}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none"
                  />
                </div>
              </div>
            </div>

            {/* ERROR */}
            {error && (
              <div className="p-4 mb-6 bg-red-50 text-red-700 rounded-lg border border-red-200 flex items-center gap-2 text-sm">
                <AlertTriangle size={18} /> {error}
              </div>
            )}

            {/* KPI CARDS */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
              {isLoading || !kpiData ? (
                Array(3)
                  .fill()
                  .map((_, i) => (
                    <div
                      key={i}
                      className="bg-white p-5 rounded-xl shadow-sm border border-slate-200 h-28 animate-pulse"
                    >
                      <div className="w-3/4 h-4 bg-slate-200 rounded"></div>
                      <div className="w-1/2 h-6 bg-slate-200 rounded mt-2"></div>
                    </div>
                  ))
              ) : (
                <>
                  <KpiCard
                    title="Total Pembelian (Selesai)"
                    value={kpiData.totalPembelian}
                    icon={DollarSign}
                    format="currency"
                  />
                  <KpiCard
                    title="Total Pesanan Selesai"
                    value={kpiData.totalPesananProdusenSelesai}
                    icon={Package}
                  />
                  <KpiCard
                    title="Total Stok Gudang"
                    value={kpiData.totalStokGudang}
                    icon={Archive}
                  />
                </>
              )}
            </div>

            {/* CHARTS */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
              {/* Bar Chart */}
              <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 h-96">
                {isLoading ? (
                  <ChartPlaceholder message="Memuat chart..." type="loading" />
                ) : barChartData?.labels?.length > 0 ? (
                  <Bar
                    data={barChartData}
                    options={chartOptions('Pemesanan Obat dari Produsen (12 Bulan)')}
                  />
                ) : (
                  <ChartPlaceholder message="Tidak ada data pemesanan." type="empty" />
                )}
              </div>

              {/* Pie Chart */}
              <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 h-96">
                {isLoading ? (
                  <ChartPlaceholder message="Memuat chart..." type="loading" />
                ) : pieChartData?.labels?.length > 0 ? (
                  <Pie
                    data={pieChartData}
                    options={pieChartOptions('Distribusi Transaksi per Produsen')}
                  />
                ) : (
                  <ChartPlaceholder message="Tidak ada data transaksi." type="empty" />
                )}
              </div>
            </div>

            {/* RIWAYAT */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                <h2 className="text-lg font-semibold text-slate-800">
                  Riwayat Transaksi (10 Terbaru)
                </h2>
                <div className="flex gap-3 w-full sm:w-auto">
                  <div className="relative flex-1 sm:flex-none">
                    <Search
                      size={18}
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                    />
                    <input
                      type="text"
                      placeholder="Cari ID Pesanan..."
                      className="pl-10 pr-4 py-2 border border-slate-300 rounded-lg text-sm w-full sm:w-64 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                  <div className="relative">
                    <Calendar
                      size={18}
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                    />
                    <input
                      type="text"
                      placeholder="Pilih Tanggal"
                      className="pl-10 pr-4 py-2 border border-slate-300 rounded-lg text-sm w-full sm:w-40 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="min-w-full">
                  <thead className="bg-slate-50 border-b border-slate-200">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                        ID Pesanan
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                        Tanggal
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                        Nama Produsen
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                        Jumlah Item
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                        Status
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {isLoading ? (
                      <tr>
                        <td colSpan="5" className="py-12">
                          <ChartPlaceholder message="Memuat riwayat..." type="loading" />
                        </td>
                      </tr>
                    ) : riwayatData.length > 0 ? (
                      riwayatData.map((item) => (
                        <tr key={item.id} className="hover:bg-emerald-50 transition">
                          <td className="px-6 py-4 text-sm font-semibold text-emerald-700">
                            #{String(item.id).padStart(6, '0')}
                          </td>
                          <td className="px-6 py-4 text-sm text-slate-600">
                            {formatDate(item.tanggal_pesanan)}
                          </td>
                          <td className="px-6 py-4 text-sm font-medium text-slate-900">
                            {item.nama_produsen}
                          </td>
                          <td className="px-6 py-4 text-sm text-slate-600">{item.jumlah_item}</td>
                          <td className="px-6 py-4">
                            <span
                              className={`px-3 py-1 text-xs font-semibold rounded-full ${getStatusBadge(item.status)}`}
                            >
                              {item.status}
                            </span>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="5" className="py-12">
                          <ChartPlaceholder message="Tidak ada riwayat." type="empty" />
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

      {/* BLOB ANIMATION */}
      <style jsx>{`
        @keyframes blob {
          0%,
          100% {
            transform: translate(0, 0) scale(1);
          }
          33% {
            transform: translate(30px, -50px) scale(1.1);
          }
          66% {
            transform: translate(-20px, 20px) scale(0.9);
          }
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

export default LaporanAnalitikPbf;
