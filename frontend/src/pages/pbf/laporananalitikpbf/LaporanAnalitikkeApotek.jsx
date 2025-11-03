import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import SidebarPbf from '../../../components/SidebarPbf';
import NavbarPbf from '../../../components/NavbarPbf';
import { ChevronDown, Loader2, AlertTriangle, BarChart as BarChartIcon } from 'lucide-react';
import { Bar, Line, Doughnut, Pie } from 'react-chartjs-2'; // <-- Tambahkan Doughnut & Pie
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

// --- Opsi Chart (Tidak Berubah) ---
const chartOptions = (title, yLabel = 'Jumlah') => ({
  responsive: true,
  maintainAspectRatio: false,
  plugins: { 
    legend: { display: true, position: 'bottom', labels: { boxWidth: 12, padding: 15 } },
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
      ticks: { color: '#64748b' },
      title: { display: true, text: yLabel }
    },
    x: { 
      grid: { display: false },
      ticks: { color: '#64748b' }
    }
  }
});

const currencyChartOptions = (title) => ({
  responsive: true,
  maintainAspectRatio: false,
  plugins: { 
    legend: { display: true, position: 'bottom', labels: { boxWidth: 12, padding: 15 } },
    title: {
      display: true,
      text: title,
      font: { size: 16, weight: '600' },
      padding: { bottom: 20 },
      color: '#1e293b'
    },
    tooltip: {
      callbacks: {
        label: function(context) {
          let label = context.dataset.label || '';
          if (label) { label += ': '; }
          if (context.parsed.y !== null) {
            // Tampilkan sebagai "Rp X.XXX jt"
            label += `Rp ${context.parsed.y.toLocaleString('id-ID')} jt`;
          }
          return label;
        }
      }
    }
  },
  scales: { 
    y: { 
      beginAtZero: true, 
      grid: { color: '#e2e8f0' },
      ticks: { 
        color: '#64748b',
        callback: function(value) {
          return `Rp ${value} jt`; // Sumbu Y dalam jutaan
        }
      },
      title: { display: true, text: 'Jutaan Rupiah' }
    },
    x: { 
      grid: { display: false },
      ticks: { color: '#64748b' }
    }
  }
});
// --- Akhir Opsi Chart ---

// --- Helper untuk format label bulan ---
const formatMonth = (isoMonth) => {
  const [year, month] = isoMonth.split('-');
  const date = new Date(year, month - 1);
  return date.toLocaleDateString('id-ID', { month: 'short' }); // Hanya "Okt", "Nov"
};

// --- HELPER BARU UNTUK WARNA ---
const getChartColors = (count) => {
  const colors = [
    '#10B981', '#06B6D4', '#3B82F6', '#8B5CF6', '#EC4899',
    '#F59E0B', '#F87171', '#6D28D9', '#047857', '#1D4ED8'
  ];
  const bgColors = [];
  const borderColors = [];
  for (let i = 0; i < count; i++) {
    bgColors.push(colors[i % colors.length] + 'B3'); // Transparansi 70%
    borderColors.push(colors[i % colors.length]);
  }
  return { bgColors, borderColors };
};

// --- OPSI CHART BARU ---

// Opsi untuk Horizontal Bar Chart (Produk Terlaris)
const horizontalChartOptions = (title) => ({
  ...currencyChartOptions(title), // Mewarisi opsi currency
  indexAxis: 'y', // <-- Ini kuncinya
  scales: {
    x: { // Sumbu X (bawah) sekarang adalah Juta Rupiah
      beginAtZero: true,
      grid: { color: '#e2e8f0' },
      ticks: { 
        color: '#64748b',
        callback: value => `Rp ${value} jt`
      },
      title: { display: true, text: 'Jutaan Rupiah' }
    },
    y: { // Sumbu Y (samping) adalah label produk
      grid: { display: false },
      ticks: { color: '#64748b' }
    }
  }
});

// Opsi untuk Doughnut Chart (Top Apotek)
const doughnutChartOptions = (title) => ({
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: { display: true, position: 'right', labels: { boxWidth: 12, padding: 15 } },
    title: {
      display: true,
      text: title,
      font: { size: 16, weight: '600' },
      padding: { bottom: 20 },
      color: '#1e293b'
    },
    tooltip: {
      callbacks: {
        label: function(context) {
          let label = context.label || '';
          if (label) { label += ': '; }
          if (context.parsed !== null) {
            label += new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(context.parsed);
          }
          return label;
        }
      }
    }
  }
});
// --- Akhir Opsi Chart Baru ---


const LaporanAnalitikkeApotek = () => {
  const navigate = useNavigate();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [username, setUsername] = useState(localStorage.getItem('username') || 'PBF');

  // --- STATE BARU UNTUK DATA ---
  const [chartData, setChartData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // --- FUNGSI FETCH DATA ---
  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    let token;
    try {
      token = localStorage.getItem('token');
      if (!token) {
        toast.error('Sesi tidak valid, silakan login kembali.');
        navigate('/login/pbf');
        return;
      }
      
      // Panggil endpoint laporan Apotek
      // Endpoint ini SEKARANG MENGANDUNG SEMUA data (agregat, produk, top apotek)
      const response = await axios.get('http://localhost:5000/api/pbf/laporan/apotek', {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.data.success) {
        setChartData(response.data.data);
      } else {
        throw new Error(response.data.message || 'Gagal memuat data laporan.');
      }
    } catch (err) {
      const errorMsg = err.response?.data?.message || err.message;
      setError(errorMsg);
      toast.error(errorMsg);
      if (err.response?.status === 401 || err.response?.status === 403) {
          navigate('/login/pbf');
      }
    } finally {
      setIsLoading(false);
    }
  }, [navigate]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // --- DATA CHART YANG DIPROSES (LAMA) ---
  const processedLineData = useMemo(() => {
    if (!chartData?.distribusiObat) return { labels: [], datasets: [] };
    const labels = chartData.distribusiObat.map(d => formatMonth(d.bulan));
    const data = chartData.distribusiObat.map(d => d.jumlah);

    return {
      labels,
      datasets: [{
        label: 'Distribusi Obat (Box/Strip)',
        data,
        borderColor: '#10B981',
        backgroundColor: 'rgba(16, 185, 129, 0.1)',
        fill: true,
        tension: 0.3
      }]
    };
  }, [chartData]);

  const processedBarDataPengiriman = useMemo(() => {
    if (!chartData?.jumlahPengiriman) return { labels: [], datasets: [] };
    const labels = chartData.jumlahPengiriman.map(d => formatMonth(d.bulan));
    const data = chartData.jumlahPengiriman.map(d => d.jumlah);

    return {
      labels,
      datasets: [{
        label: 'Jumlah Pengiriman',
        data,
        backgroundColor: '#10B981',
        borderRadius: 6
      }]
    };
  }, [chartData]);

  const processedBarDataPenjualan = useMemo(() => {
    if (!chartData?.hasilPenjualan) return { labels: [], datasets: [] };
    const labels = chartData.hasilPenjualan.map(d => formatMonth(d.bulan));
    const data = chartData.hasilPenjualan.map(d => (d.total / 1000000).toFixed(1));

    return {
      labels,
      datasets: [{
        label: 'Pendapatan (Jt Rupiah)',
        data,
        backgroundColor: '#10B981',
        borderRadius: 6
      }]
    };
  }, [chartData]);
  // --- Akhir Data Chart (LAMA) ---

  // --- DATA CHART BARU ---
  const processedProdukTerlarisData = useMemo(() => {
    if (!chartData?.produkTerlaris || chartData.produkTerlaris.length === 0) return { labels: [], datasets: [] };
    
    const labels = chartData.produkTerlaris.map(p => p.nama_obat);
    const data = chartData.produkTerlaris.map(p => (p.total_pendapatan / 1000000).toFixed(2)); // Dalam Juta Rupiah

    return {
      labels,
      datasets: [{
        label: 'Pendapatan (Jt Rupiah)',
        data,
        backgroundColor: '#3B82F6', // Warna biru
        borderRadius: 6
      }]
    };
  }, [chartData]);

  const processedTopApotekData = useMemo(() => {
    if (!chartData?.topApotekRevenue || chartData.topApotekRevenue.length === 0) return { labels: [], datasets: [] };
    
    const labels = chartData.topApotekRevenue.map(a => a.nama_apotek);
    const data = chartData.topApotekRevenue.map(a => a.total_penjualan);
    const { bgColors, borderColors } = getChartColors(labels.length);

    return {
      labels,
      datasets: [{
        label: 'Total Penjualan',
        data,
        backgroundColor: bgColors,
        borderColor: borderColors,
        borderWidth: 1
      }]
    };
  }, [chartData]);
  // --- Akhir Data Chart Baru ---


  const handleDropdownChange = (e) => {
    if (e.target.value === 'produsen') {
      navigate('/pbf/laporan-analitik');
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
              <p className="text-slate-600 text-lg mt-1">Pantau penjualan, mengelola stok, serta memahami tren pasar.</p>
            </div>
            <div className="relative">
                <select 
                  value="apotek"
                  onChange={handleDropdownChange}
                  className="flex items-center gap-2 border rounded-lg px-4 py-2 text-sm bg-white shadow-sm appearance-none pr-8"
                >
                    <option value="produsen">Laporan Produsen</option>
                    <option value="apotek">Laporan Apotek</option>
                </select>
                <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
            </div>
          </div>
          
          {/* --- KONTEN DINAMIS --- */}
          {isLoading ? (
             <div className="flex flex-col justify-center items-center h-[60vh] bg-white rounded-lg shadow-sm border border-slate-200">
                <div className="relative">
                  <Loader2 className="animate-spin h-12 w-12 text-emerald-600" />
                  <div className="absolute inset-0 h-12 w-12 rounded-full border-4 border-emerald-200 animate-ping opacity-20"></div>
                </div>
                <p className="mt-4 text-slate-700 font-medium">Memuat data laporan...</p>
             </div>
          ) : error ? (
             <div className="flex flex-col justify-center items-center h-[60vh] bg-white rounded-lg shadow-sm border border-red-200">
                <AlertTriangle className="h-12 w-12 text-red-500 mb-4" />
                <h3 className="text-xl font-bold text-red-800 mb-2">Gagal Memuat Data</h3>
                <p className="text-red-600 max-w-md text-center">{error}</p>
             </div>
          ) : !chartData ? (
             <div className="flex flex-col justify-center items-center h-[60vh] bg-white rounded-lg shadow-sm border border-slate-200">
                <BarChartIcon className="h-12 w-12 text-slate-400 mb-4" />
                <h3 className="text-xl font-bold text-slate-800 mb-2">Data Tidak Ditemukan</h3>
                <p className="text-slate-500">Belum ada data laporan yang tersedia.</p>
             </div>
          ) : (
            <>
              {/* Grid untuk 2 Chart Teratas */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 h-[400px] flex flex-col">
                  <div className="h-full">
                    <Line data={processedLineData} options={chartOptions('Distribusi Obat ke Apotek', 'Jumlah (Box/Strip)')} />
                  </div>
                </div>
                <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 h-[400px] flex flex-col">
                  <div className="h-full flex items-center justify-center">
                    <Bar data={processedBarDataPengiriman} options={chartOptions('Jumlah Pengiriman Bulanan', 'Jumlah Pengiriman')} />
                  </div>
                </div>
              </div>

              {/* Chart Full-Width Bawah */}
              <div className="grid grid-cols-1 gap-6 mb-6">
                <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 h-[400px] flex flex-col">
                  <div className="h-full">
                    <Bar data={processedBarDataPenjualan} options={currencyChartOptions('Hasil Penjualan dengan Apotek')} />
                  </div>
                </div>
              </div>

              {/* --- GRID BARU UNTUK INSIGHT --- */}
              <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 mb-6">
                
                {/* Chart Produk Terlaris (Horizontal Bar) */}
                <div className="lg:col-span-3 bg-white p-6 rounded-xl shadow-sm border border-slate-200 h-[450px] flex flex-col">
                  <div className="h-full">
                    <Bar data={processedProdukTerlarisData} options={horizontalChartOptions('Top 10 Produk Terlaris (by Pendapatan)')} />
                  </div>
                </div>

                {/* Chart Top Apotek (Doughnut) */}
                <div className="lg:col-span-2 bg-white p-6 rounded-xl shadow-sm border border-slate-200 h-[450px] flex flex-col">
                  <div className="h-full">
                    <Doughnut data={processedTopApotekData} options={doughnutChartOptions('Top Apotek (by Pendapatan)')} />
                  </div>
                </div>

              </div>
              {/* --- AKHIR GRID BARU --- */}
            </>
          )}
          {/* --- AKHIR KONTEN DINAMIS --- */}

        </main>
      </div>
    </div>
  );
};

export default LaporanAnalitikkeApotek;