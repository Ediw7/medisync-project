import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import SidebarProdusen from '../../../components/SidebarProdusen';
import NavbarProdusen from '../../../components/NavbarProdusen';
import { Line, Bar } from 'react-chartjs-2';
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
} from 'chart.js';

import { Loader2, AlertTriangle, BarChart as BarChartIcon, LineChart, Truck, Calendar } from 'lucide-react';
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
  Legend
);

const LaporanAnalitik = () => {
  const navigate = useNavigate();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [produksiChartData, setProduksiChartData] = useState({ labels: [], datasets: [] });
  const [stokChartData, setStokChartData] = useState({ labels: [], datasets: [] });
  const [avgDeliveryDays, setAvgDeliveryDays] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const username = localStorage.getItem('username');

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

        const { produksi = { labels: [], datasets: [] }, stok = { labels: [], datasets: [] }, delivery = { avgDeliveryDays: 0 } } = result.data;

        setProduksiChartData(produksi);
        setStokChartData(stok);
        setAvgDeliveryDays(delivery.avgDeliveryDays || 0); 
        
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

  const chartOptions = (title) => ({
    responsive: true,
    maintainAspectRatio: false, 
    plugins: {
      legend: {
        position: 'bottom',
        labels: {
            padding: 20,
            boxWidth: 15,
            font: { size: 12 }
        }
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
         titleFont: { weight: 'bold'},
         bodyFont: { size: 12 },
         padding: 10,
         cornerRadius: 4,
         boxPadding: 4
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        title: {
          display: true,
          text: 'Jumlah Unit / Pcs',
          font: { size: 12 },
          color: '#64748b' 
        },
        grid: {
           color: '#e2e8f0' 
        },
        ticks: {
           font: { size: 10 },
           color: '#475569' 
        }
      },
      x: {
        title: {
          display: true,
          text: 'Periode Waktu',
          font: { size: 12 },
           color: '#64748b'
        },
         grid: {
           display: false
        },
         ticks: {
           font: { size: 10 },
           color: '#475569'
        }
      },
    },
    elements: {
        line: {
            tension: 0.1,
            borderColor: '#059669',
            backgroundColor: 'rgba(16, 185, 129, 0.1)', 
            borderWidth: 2,
            fill: true,
        },
        point: {
            radius: 3,
            hoverRadius: 6,
            backgroundColor: '#059669',
            borderColor: '#ffffff'
        },
        bar: {
            backgroundColor: '#059669', 
            borderColor: '#047857', 
            borderRadius: 4,
            hoverBackgroundColor: '#047857'
        }
    }
  });


  const ChartPlaceholder = ({ state, message }) => {
     let icon;
     if(state === 'loading') icon = <Loader2 className="animate-spin h-10 w-10 text-emerald-600" />;
     else if(state === 'error') icon = <AlertTriangle className="h-10 w-10 text-red-500" />;
     else icon = <BarChartIcon className="h-10 w-10 text-slate-400" />; 
     
     return (
        <div className="flex flex-col items-center justify-center h-full text-center text-slate-500 py-16">
            {icon}
            <p className="mt-3 font-medium">{message}</p>
        </div>
     );
  };


  return (
    <div className="flex min-h-screen bg-slate-50">
      <SidebarProdusen isCollapsed={isCollapsed} setIsCollapsed={setIsCollapsed} />
      <div className={`flex-1 flex flex-col transition-all duration-300 ${isCollapsed ? 'ml-16' : 'ml-64'}`}>
        <NavbarProdusen onLogout={handleLogout} username={username}/>
        
        <main className="flex-1 overflow-auto pt-[72px] px-12 py-8">
           <div className="max-w-7xl mx-auto">
           
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
                    <p className="text-slate-600 text-lg mt-1">Overview performa produksi dan distribusi Anda.</p>
                  </div>
                </div>
                 <div className="flex items-center gap-2 mt-2 text-sm text-slate-500">
                  <Calendar size={16} />
                  <span>{new Date().toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
                </div>
              </div>
            </div>
            
             {error && !isLoading && (
              <div className="p-4 mb-6 bg-red-50 text-red-700 rounded-lg border border-red-200 flex items-center gap-2 text-sm">
                <AlertTriangle size={18} /> {error}
              </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              
              <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 h-[400px] flex flex-col">
                {isLoading ? (
                  <ChartPlaceholder state="loading" message="Memuat data produksi..." />
                ) : error ? (
                  <ChartPlaceholder state="error" message={error} />
                ) : produksiChartData.labels?.length === 0 ? (
                  <ChartPlaceholder state="empty" message="Tidak ada data produksi tersedia" />
                ) : (
                  <div className="flex-grow relative">
                    <Line options={chartOptions('Produksi per Bulan')} data={produksiChartData} />
                  </div>
                )}
              </div>

              <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 h-[400px] flex flex-col">
                {isLoading ? (
                  <ChartPlaceholder state="loading" message="Memuat data stok..." />
                ) : error ? (
                  <ChartPlaceholder state="error" message={error} />
                ) : stokChartData.labels?.length === 0 ? (
                  <ChartPlaceholder state="empty" message="Tidak ada data stok tersedia" />
                ) : (
                   <div className="flex-grow relative">
                    <Bar options={chartOptions('Stok Obat vs Minimum')} data={stokChartData} />
                  </div>
                )}
              </div>

              <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 lg:col-span-2">
                <h2 className="text-lg font-semibold text-slate-800 mb-4">Rata-rata Waktu Pengiriman</h2>
                <div className="text-center py-8">
                  {isLoading ? (
                     <ChartPlaceholder state="loading" message="Memuat data pengiriman..." />
                  ) : error ? (
                     <ChartPlaceholder state="error" message={error.includes('delivery') ? error : "Gagal memuat data pengiriman."} />
                  ) : (
                    (typeof avgDeliveryDays === 'number' && avgDeliveryDays > 0) ? (
                      <div className="flex flex-col items-center">
                        <div className="p-4 bg-emerald-100 rounded-full mb-3">
                           <Truck size={32} className="text-emerald-600" />
                        </div>
                        <p className="text-6xl font-bold text-emerald-600">{avgDeliveryDays.toFixed(2)}</p>
                        <p className="text-lg text-slate-500 mt-1">Hari</p>
                        <p className="text-sm text-slate-400 mt-4">(Rata-rata dari pesanan selesai ke PBF)</p>
                      </div>
                    ) : (
                       <ChartPlaceholder state="empty" message="Tidak ada data pengiriman tersedia untuk dihitung." />
                    )
                  )}
                </div>
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