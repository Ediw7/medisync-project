import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import SidebarProdusen from '../../../components/SidebarProdusen';
import NavbarProdusen from '../../../components/NavbarProdusen';
import { Line, Bar, Doughnut } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
} from 'chart.js';

import { 
    Loader2, 
    AlertTriangle, 
    BarChart as BarChartIcon, 
    LineChart, 
    Truck, 
    Calendar, 
    PieChart,
    DollarSign, // KPI
    Package, // KPI
    ArchiveX, // KPI
    CheckCircle2 // Tambahkan di sini jika diperlukan, tapi sepertinya tidak digunakan
} from 'lucide-react';
import { FaClipboardList} from "react-icons/fa";
 
import { toast } from 'react-hot-toast'; 

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement 
);

// --- Komponen Kartu KPI ---
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

const LaporanAnalitik = () => {
  const navigate = useNavigate();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const username = localStorage.getItem('username');

  // --- State untuk semua data ---
  const [kpiData, setKpiData] = useState(null);
  const [produksiChartData, setProduksiChartData] = useState({ labels: [], datasets: [] });
  const [stokChartData, setStokChartData] = useState({ labels: [], datasets: [] });
  const [pengirimanChartData, setPengirimanChartData] = useState({ labels: [], datasets: [] });
  const [penjualanBulananData, setPenjualanBulananData] = useState({ labels: [], datasets: [] });
  const [topPbfData, setTopPbfData] = useState({ labels: [], datasets: [] });
  const [rasioPesananData, setRasioPesananData] = useState({ labels: [], datasets: [] });


  useEffect(() => {
    const fetchAnalyticsData = async () => {
      setIsLoading(true);
      setError(null);
      let token;
      try {
        token = localStorage.getItem('token');
        if (!token) throw new Error('Silakan login terlebih dahulu');

        const response = await fetch('http://localhost:5000/api/produsen/laporananalitik', {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (!response.ok) {
           const errorData = await response.text();
           throw new Error(`Gagal mengambil data analitik: ${response.status} - ${errorData}`);
        }
        
        const result = await response.json();
        if (!result.success || !result.data) throw new Error(result.message || 'Format data analitik tidak valid.');

        const { 
            produksi, 
            stok, 
            pengiriman, 
            kpi, 
            penjualanBulanan, 
            topPbf, 
            rasioPesanan 
        } = result.data;

        setProduksiChartData(produksi || { labels: [], datasets: [] });
        setStokChartData(stok || { labels: [], datasets: [] });
        setPengirimanChartData(pengiriman || { labels: [], datasets: [] });
        setKpiData(kpi || null);
        setPenjualanBulananData(penjualanBulanan || { labels: [], datasets: [] });
        setTopPbfData(topPbf || { labels: [], datasets: [] });
        setRasioPesananData(rasioPesanan || { labels: [], datasets: [] });
        
      } catch (error) {
        setError(error.message);
        toast.error(error.message || 'Gagal memuat data.');
         if ((error.message.includes('401') || error.message.includes('403') || error.message.includes('login')) && token) {
            navigate('/login/produsen');
        } else if (!token) {
             navigate('/login/produsen');
        }
      } finally {
        setIsLoading(false);
      }
    };
    fetchAnalyticsData();
  }, [navigate]); 

  const handleLogout = () => {
    localStorage.clear();
    navigate('/');
  };

  // --- Opsi Chart ---

  const lineBarChartOptions = (title, xLabel = 'Periode', yLabel = 'Jumlah') => ({
    responsive: true,
    maintainAspectRatio: false, 
    plugins: {
      legend: {
        position: 'bottom',
        labels: { padding: 20, boxWidth: 15, font: { size: 12 } }
      },
      title: {
        display: true,
        text: title, 
        font: { size: 16, weight: '600' }, 
        padding: { top: 10, bottom: 20 },
        color: '#1e293b' 
      },
      tooltip: {
         backgroundColor: 'rgba(30, 41, 59, 0.8)', 
         padding: 10,
         cornerRadius: 4,
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        title: { display: true, text: yLabel, font: { size: 12 }, color: '#64748b' },
        grid: { color: '#e2e8f0' },
        ticks: { font: { size: 10 }, color: '#475569' }
      },
      x: {
        title: { display: true, text: xLabel, font: { size: 12 }, color: '#64748b' },
        grid: { display: false },
        ticks: { font: { size: 10 }, color: '#475569' }
      },
    }
  });

  const horizontalBarChartOptions = (title, xLabel = 'Total Pembelian (Rp)', yLabel = 'PBF') => ({
    ...lineBarChartOptions(title, xLabel, yLabel),
    indexAxis: 'y', // Ini yang membuatnya horizontal
    scales: {
      y: {
        title: { display: true, text: yLabel, font: { size: 12 }, color: '#64748b' },
        grid: { display: false },
        ticks: { font: { size: 10 }, color: '#475569' }
      },
      x: {
        beginAtZero: true,
        title: { display: true, text: xLabel, font: { size: 12 }, color: '#64748b' },
        grid: { color: '#e2e8f0' },
        ticks: { font: { size: 10 }, color: '#475569' }
      },
    }
  });

  const doughnutChartOptions = (title) => ({
    responsive: true,
    maintainAspectRatio: false,
    cutout: '70%',
    plugins: {
      legend: {
        position: 'bottom',
        labels: { padding: 20, boxWidth: 15, font: { size: 12 } }
      },
      title: {
        display: true,
        text: title,
        font: { size: 16, weight: '600' },
        padding: { top: 10, bottom: 20 },
        color: '#1e293b'
      },
      tooltip: {
         backgroundColor: 'rgba(30, 41, 59, 0.8)', 
         padding: 10,
         cornerRadius: 4,
         callbacks: {
             label: function(context) {
                 let label = context.label || '';
                 if (label) { label += ': '; }
                 if (context.parsed !== null) {
                     label += context.parsed + ' Pesanan';
                 }
                 return label;
             }
         }
      }
    }
  });

  const ChartPlaceholder = ({ state, message }) => (
    <div className="flex flex-col items-center justify-center h-full text-center text-slate-500 py-16">
        {state === 'loading' && <Loader2 className="animate-spin h-10 w-10 text-emerald-600" />}
        {state === 'error' && <AlertTriangle className="h-10 w-10 text-red-500" />}
        {state === 'empty' && <BarChartIcon className="h-10 w-10 text-slate-400" />}
        <p className="mt-3 font-medium">{message}</p>
    </div>
  );

  return (
    <div className="flex min-h-screen bg-slate-50">
      <SidebarProdusen isCollapsed={isCollapsed} setIsCollapsed={setIsCollapsed} />
      <div className={`flex-1 flex flex-col transition-all duration-300 ${isCollapsed ? 'ml-16' : 'ml-64'}`}>
        <NavbarProdusen onLogout={handleLogout} username={username}/>
        
        <main className="flex-1 overflow-auto pt-[72px] px-12 py-8">
           <div className="max-w-7xl mx-auto">
           
            {/* HEADER */}
            <div className="mb-10 relative">
              <div className="absolute -top-20 -left-20 w-72 h-72 bg-emerald-200 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob"></div>
              <div className="absolute -top-20 -right-20 w-72 h-72 bg-teal-200 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000"></div>
              <div className="relative">
                <div className="flex items-center gap-3 mb-3">
                  <div className="flex items-center justify-center w-12 h-12 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl shadow-lg">
                    <FaClipboardList className="text-white" size={24} />
                  </div>
                  <div>
                    <h1 className="text-4xl font-bold bg-gradient-to-r from-slate-900 via-emerald-900 to-teal-900 bg-clip-text text-transparent">
                      Laporan & Analitik
                    </h1>
                    <p className="text-slate-600 text-lg mt-1">Overview performa bisnis, produksi, dan distribusi.</p>
                  </div>
                </div>
                 <div className="flex items-center gap-2 mt-2 text-sm text-slate-500">
                  <Calendar size={16} />
                  <span>{new Date().toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
                </div>
              </div>
            </div>
            
             {error && (
              <div className="p-4 mb-6 bg-red-50 text-red-700 rounded-lg border border-red-200 flex items-center gap-2 text-sm">
                <AlertTriangle size={18} /> {error}
              </div>
            )}

            {/* --- KARTU KPI (BARU) --- */}
            {isLoading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
                    {/* Placeholder loading untuk KPI */}
                    <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-200 h-[100px] animate-pulse"><div className="w-3/4 h-4 bg-slate-200 rounded"></div><div className="w-1/2 h-6 bg-slate-200 rounded mt-2"></div></div>
                    <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-200 h-[100px] animate-pulse"><div className="w-3/4 h-4 bg-slate-200 rounded"></div><div className="w-1/2 h-6 bg-slate-200 rounded mt-2"></div></div>
                    <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-200 h-[100px] animate-pulse"><div className="w-3/4 h-4 bg-slate-200 rounded"></div><div className="w-1/2 h-6 bg-slate-200 rounded mt-2"></div></div>
                    <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-200 h-[100px] animate-pulse"><div className="w-3/4 h-4 bg-slate-200 rounded"></div><div className="w-1/2 h-6 bg-slate-200 rounded mt-2"></div></div>
                </div>
            ) : kpiData && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
                    <KpiCard title="Penjualan (30 Hari)" value={kpiData.totalPenjualan} icon={DollarSign} format="currency" />
                    <KpiCard title="Pesanan Selesai (30 Hari)" value={kpiData.totalPesananSelesai} icon={CheckCircle2} />
                    <KpiCard title="Dalam Pengiriman" value={kpiData.pesananDalamPengiriman} icon={Truck} />
                    <KpiCard title="Pesanan Bermasalah (30 Hari)" value={kpiData.pesananBermasalah} icon={AlertTriangle} />
                </div>
            )}
            
            
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">

{/* --- GRAFIK PRODUKSI & STOK (LAMA, DIPINDAH) --- */}
              <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 lg:col-span-2 h-[400px] flex flex-col">
                {isLoading ? (
                  <ChartPlaceholder state="loading" message="Memuat data produksi..." />
                ) : error ? (
                  <ChartPlaceholder state="error" message={"Gagal memuat data produksi."} />
                ) : produksiChartData.labels?.length === 0 ? (
                  <ChartPlaceholder state="empty" message="Tidak ada data produksi tersedia" />
                ) : (
                  <div className="flex-grow relative">
                    <Line options={lineBarChartOptions('Produksi Bulanan (6 Bulan Terakhir)', 'Bulan', 'Jumlah Unit')} data={produksiChartData} />
                  </div>
                )}
              </div>

              <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 lg:col-span-2 h-[400px] flex flex-col">
                {isLoading ? (
                  <ChartPlaceholder state="loading" message="Memuat data stok..." />
                ) : error ? (
                  <ChartPlaceholder state="error" message={"Gagal memuat data stok."} />
                ) : stokChartData.labels?.length === 0 ? (
                  <ChartPlaceholder state="empty" message="Tidak ada data stok tersedia" />
                ) : (
                   <div className="flex-grow relative">
                    <Bar options={lineBarChartOptions('Stok Obat vs Target Minimum', 'Obat', 'Jumlah Unit')} data={stokChartData} />
                  </div>
                )}
              </div>

              
              {/* --- GRAFIK PENJUALAN BULANAN (BARU) --- */}
              <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 lg:col-span-4 h-[400px] flex flex-col">
                {isLoading ? (
                  <ChartPlaceholder state="loading" message="Memuat data penjualan..." />
                ) : error ? (
                  <ChartPlaceholder state="error" message={"Gagal memuat data penjualan."} />
                ) : penjualanBulananData.labels?.length === 0 ? (
                  <ChartPlaceholder state="empty" message="Tidak ada data penjualan tersedia" />
                ) : (
                  <div className="flex-grow relative">
                    <Bar options={lineBarChartOptions('Penjualan Selesai (6 Bulan Terakhir)', 'Bulan', 'Total Penjualan (Rp)')} data={penjualanBulananData} />
                  </div>
                )}
              </div>
              

              {/* --- GRAFIK DISTRIBUSI (BARU) --- */}
              <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 lg:col-span-2 h-[450px] flex flex-col">
                 <div className="h-full flex flex-col">
                    {isLoading ? (
                      <ChartPlaceholder state="loading" message="Memuat data pengiriman..." />
                    ) : error ? (
                      <ChartPlaceholder state="error" message={"Gagal memuat data pengiriman."} />
                    ) : (pengirimanChartData.datasets?.[0]?.data.reduce((a, b) => a + b, 0) === 0) ? (
                       <ChartPlaceholder state="empty" message="Tidak ada data pengiriman untuk ditampilkan." />
                    ) : (
                      <div className="flex-grow relative">
                        <Doughnut options={doughnutChartOptions('Status Pengiriman Saat Ini (Pipeline)')} data={pengirimanChartData} />
                      </div>
                    )}
                 </div>
              </div>
              

              {/* --- GRAFIK RASIO PESANAN (BARU) --- */}
              <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 lg:col-span-2 h-[450px] flex flex-col">
                 <div className="h-full flex flex-col">
                    {isLoading ? (
                      <ChartPlaceholder state="loading" message="Memuat rasio pesanan..." />
                    ) : error ? (
                      <ChartPlaceholder state="error" message={"Gagal memuat rasio pesanan."} />
                    ) : (rasioPesananData.datasets?.[0]?.data.reduce((a, b) => a + b, 0) === 0) ? (
                       <ChartPlaceholder state="empty" message="Tidak ada data pesanan selesai/bermasalah." />
                    ) : (
                      <div className="flex-grow relative">
                        <Doughnut options={doughnutChartOptions('Rasio Pesanan Sempurna (All-Time)')} data={rasioPesananData} />
                      </div>
                    )}
                 </div>
              </div>
              

              
              
              {/* --- GRAFIK TOP PBF (BARU) --- */}
              <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 lg:col-span-4 h-[450px] flex flex-col">
                {isLoading ? (
                  <ChartPlaceholder state="loading" message="Memuat data PBF..." />
                ) : error ? (
                  <ChartPlaceholder state="error" message={"Gagal memuat data PBF."} />
                ) : topPbfData.labels?.length === 0 ? (
                  <ChartPlaceholder state="empty" message="Belum ada penjualan ke PBF." />
                ) : (
                  <div className="flex-grow relative">
                    <Bar options={horizontalBarChartOptions('Top 5 PBF (Berdasarkan Total Pembelian)', 'Total Pembelian (Rp)', 'Nama PBF')} data={topPbfData} />
                  </div>
                )}
              </div>
              

            </div>
          </div>
        </main>
      </div>
       <style jsx>{`
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

export default LaporanAnalitik;