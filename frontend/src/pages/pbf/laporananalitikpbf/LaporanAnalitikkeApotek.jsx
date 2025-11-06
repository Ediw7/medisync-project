import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import SidebarPbf from '../../../components/SidebarPbf';
import NavbarPbf from '../../../components/NavbarPbf';
import { ChevronDown, Loader2, AlertTriangle, BarChart as BarChartIcon } from 'lucide-react';
import { Bar, Line, Doughnut } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
} from 'chart.js';
import { FaChartBar } from 'react-icons/fa';
import axios from 'axios';
import { toast } from 'react-hot-toast';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
);

// === CHART OPTIONS ===
const chartOptions = (title, yLabel = 'Jumlah') => ({
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: { position: 'bottom', labels: { boxWidth: 12, padding: 15 } },
    title: {
      display: true,
      text: title,
      font: { size: 16, weight: '600' },
      padding: { bottom: 20 },
      color: '#1e293b',
    },
  },
  scales: {
    y: {
      beginAtZero: true,
      grid: { color: '#e2e8f0' },
      ticks: { color: '#64748b' },
      title: { display: true, text: yLabel },
    },
    x: { grid: { display: false }, ticks: { color: '#64748b' } },
  },
});

const currencyChartOptions = (title) => ({
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: { position: 'bottom', labels: { boxWidth: 12, padding: 15 } },
    title: {
      display: true,
      text: title,
      font: { size: 16, weight: '600' },
      padding: { bottom: 20 },
      color: '#1e293b',
    },
    tooltip: {
      callbacks: {
        label: (ctx) => `Rp ${(ctx.parsed.y * 1000000).toLocaleString('id-ID')}`,
      },
    },
  },
  scales: {
    y: {
      beginAtZero: true,
      grid: { color: '#e2e8f0' },
      ticks: {
        color: '#64748b',
        callback: (v) => `Rp ${v} jt`,
      },
      title: { display: true, text: 'Jutaan Rupiah' },
    },
    x: { grid: { display: false }, ticks: { color: '#64748b' } },
  },
});

const horizontalChartOptions = (title) => ({
  indexAxis: 'y',
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
    tooltip: {
      callbacks: {
        label: (ctx) => `Rp ${(ctx.parsed.x * 1000000).toLocaleString('id-ID')}`,
      },
    },
  },
  scales: {
    x: {
      beginAtZero: true,
      grid: { color: '#e2e8f0' },
      ticks: {
        color: '#64748b',
        callback: (v) => `Rp ${v} jt`,
      },
      title: { display: true, text: 'Jutaan Rupiah' },
    },
    y: { grid: { display: false }, ticks: { color: '#64748b' } },
  },
});

const doughnutChartOptions = (title) => ({
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: { position: 'right', labels: { boxWidth: 12, padding: 15 } },
    title: {
      display: true,
      text: title,
      font: { size: 16, weight: '600' },
      padding: { bottom: 20 },
      color: '#1e293b',
    },
    tooltip: {
      callbacks: {
        label: (ctx) => {
          const value = ctx.parsed;
          const total = ctx.dataset.data.reduce((a, b) => a + b, 0);
          const percentage = ((value / total) * 100).toFixed(1);
          return `${ctx.label}: Rp ${value.toLocaleString('id-ID')} (${percentage}%)`;
        },
      },
    },
  },
});

// === HELPER ===
const formatMonth = (isoMonth) => {
  const [y, m] = isoMonth.split('-');
  return new Date(y, m - 1).toLocaleDateString('id-ID', { month: 'short' });
};

const getChartColors = (count) => {
  const colors = ['#10B981', '#06B6D4', '#3B82F6', '#8B5CF6', '#EC4899', '#F59E0B', '#F87171'];
  return colors.slice(0, count).map((c) => c + 'B3');
};

const LaporanAnalitikkeApotek = () => {
  const navigate = useNavigate();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [username] = useState(localStorage.getItem('username') || 'PBF');
  const [chartData, setChartData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem('token');
      if (!token) throw new Error('Sesi tidak valid');

      const res = await axios.get('http://localhost:5000/api/pbf/laporan/apotek', {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.data.success) {
        setChartData(res.data.data);
      } else {
        throw new Error(res.data.message);
      }
    } catch (err) {
      const msg = err.response?.data?.message || err.message;
      setError(msg);
      toast.error(msg);
      if (err.response?.status === 401) navigate('/login/pbf');
    } finally {
      setIsLoading(false);
    }
  }, [navigate]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // === CHART DATA ===
  const lineData = useMemo(() => {
    if (!chartData?.distribusiObat) return { labels: [], datasets: [] };
    return {
      labels: chartData.distribusiObat.map((d) => formatMonth(d.bulan)),
      datasets: [
        {
          label: 'Box/Strip',
          data: chartData.distribusiObat.map((d) => d.jumlah),
          borderColor: '#10B981',
          backgroundColor: 'rgba(16, 185, 129, 0.1)',
          fill: true,
          tension: 0.3,
        },
      ],
    };
  }, [chartData]);

  const barPengiriman = useMemo(() => {
    if (!chartData?.jumlahPengiriman) return { labels: [], datasets: [] };
    return {
      labels: chartData.jumlahPengiriman.map((d) => formatMonth(d.bulan)),
      datasets: [
        {
          label: 'Pengiriman',
          data: chartData.jumlahPengiriman.map((d) => d.jumlah),
          backgroundColor: '#10B981',
          borderRadius: 6,
        },
      ],
    };
  }, [chartData]);

  const barPenjualan = useMemo(() => {
    if (!chartData?.hasilPenjualan) return { labels: [], datasets: [] };
    return {
      labels: chartData.hasilPenjualan.map((d) => formatMonth(d.bulan)),
      datasets: [
        {
          label: 'Pendapatan (Jt)',
          data: chartData.hasilPenjualan.map((d) => (d.total / 1000000).toFixed(1)),
          backgroundColor: '#10B981',
          borderRadius: 6,
        },
      ],
    };
  }, [chartData]);

  const horizontalProduk = useMemo(() => {
    if (!chartData?.produkTerlaris?.length) return { labels: [], datasets: [] };
    return {
      labels: chartData.produkTerlaris.map((p) => p.nama_obat),
      datasets: [
        {
          label: 'Pendapatan (Jt)',
          data: chartData.produkTerlaris.map((p) => (p.total_pendapatan / 1000000).toFixed(2)),
          backgroundColor: '#10B981',
          borderRadius: 6,
        },
      ],
    };
  }, [chartData]);

  const doughnutApotek = useMemo(() => {
    if (!chartData?.topApotekRevenue?.length) return { labels: [], datasets: [] };
    const labels = chartData.topApotekRevenue.map((a) => a.nama_apotek);
    const data = chartData.topApotekRevenue.map((a) => a.total_penjualan);
    return {
      labels,
      datasets: [
        {
          data,
          backgroundColor: getChartColors(labels.length),
          borderWidth: 2,
          borderColor: '#fff',
        },
      ],
    };
  }, [chartData]);

  const handleDropdown = (e) => {
    if (e.target.value === 'produsen') navigate('/pbf/laporan-analitik');
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
                      Laporan & Analitik Apotek
                    </h1>
                    <p className="text-slate-600 text-lg mt-1">
                      Pantau distribusi, penjualan, dan performa apotek mitra.
                    </p>
                  </div>
                </div>

                <div className="relative">
                  <select
                    defaultValue="apotek"
                    onChange={handleDropdown}
                    className="appearance-none bg-white border border-slate-300 rounded-lg pl-4 pr-10 py-2.5 text-sm font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500"
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

            {/* STATE HANDLING */}
            {isLoading ? (
              <div className="flex flex-col items-center justify-center h-96 bg-white rounded-2xl shadow-sm border border-slate-200">
                <div className="relative">
                  <Loader2 className="animate-spin h-12 w-12 text-emerald-600" />
                  <div className="absolute inset-0 h-12 w-12 rounded-full border-4 border-emerald-200 animate-ping opacity-20"></div>
                </div>
                <p className="mt-4 text-slate-700 font-medium">Memuat data laporan...</p>
              </div>
            ) : error ? (
              <div className="flex flex-col items-center justify-center h-96 bg-white rounded-2xl shadow-sm border border-red-200 text-center p-6">
                <AlertTriangle className="h-12 w-12 text-red-500 mb-4" />
                <h3 className="text-xl font-bold text-red-800 mb-2">Gagal Memuat Data</h3>
                <p className="text-red-600 max-w-md">{error}</p>
              </div>
            ) : !chartData ? (
              <div className="flex flex-col items-center justify-center h-96 bg-white rounded-2xl shadow-sm border border-slate-200">
                <BarChartIcon className="h-12 w-12 text-slate-400 mb-4" />
                <h3 className="text-xl font-bold text-slate-800 mb-2">Tidak Ada Data</h3>
                <p className="text-slate-500">Belum ada transaksi dengan apotek.</p>
              </div>
            ) : (
              <>
                {/* CHARTS GRID */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                  <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 h-96">
                    <Line
                      data={lineData}
                      options={chartOptions('Distribusi Obat ke Apotek', 'Box/Strip')}
                    />
                  </div>
                  <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 h-96">
                    <Bar
                      data={barPengiriman}
                      options={chartOptions('Jumlah Pengiriman Bulanan', 'Pengiriman')}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-6 mb-8">
                  <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 h-96">
                    <Bar
                      data={barPenjualan}
                      options={currencyChartOptions('Hasil Penjualan dengan Apotek')}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
                  <div className="lg:col-span-3 bg-white p-6 rounded-2xl shadow-sm border border-slate-200 h-[500px]">
                    <Bar
                      data={horizontalProduk}
                      options={horizontalChartOptions('Top 10 Produk Terlaris')}
                    />
                  </div>
                  <div className="lg:col-span-2 bg-white p-6 rounded-2xl shadow-sm border border-slate-200 h-[500px]">
                    <Doughnut
                      data={doughnutApotek}
                      options={doughnutChartOptions('Top Apotek berdasarkan Pendapatan')}
                    />
                  </div>
                </div>
              </>
            )}
          </div>
        </main>
      </div>

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

export default LaporanAnalitikkeApotek;
