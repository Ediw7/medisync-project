import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import SidebarPbf from '../../../components/SidebarPbf';
import NavbarPbf from '../../../components/NavbarPbf';
import { ChevronDown, Loader2, AlertTriangle, BarChart as BarChartIcon } from 'lucide-react';
import { Bar, Line } from 'react-chartjs-2'; // Impor Line chart
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement, // Diperlukan untuk Line chart
  LineElement, // Diperlukan untuk Line chart
  Title,
  Tooltip,
  Legend,
  ArcElement,
} from 'chart.js';

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

// --- Opsi Chart ---
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
          return `Rp ${value} jt`;
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

// --- Data Dummy Sesuai Gambar ---
const lineChartData = {
  labels: ['Januari 2025', 'Februari 2025', 'Maret 2025', 'Apr 25'],
  datasets: [
    {
      label: 'Jumlah obat (box/strip)',
      data: [7000, 6000, 9000, 6500],
      borderColor: '#10B981',
      backgroundColor: 'rgba(16, 185, 129, 0.1)',
      fill: true,
      tension: 0.1
    },
  ],
};

const barChartDataPengiriman = {
  labels: ['Jan 25', 'Feb 25', 'Maret 2025', 'Apr 25'],
  datasets: [
    {
      label: 'Jumlah Pengiriman',
      data: [4000, 3000, 7500, 5000],
      backgroundColor: '#10B981',
      borderRadius: 5,
    },
  ],
};

const barChartDataPenjualan = {
  labels: ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul'],
  datasets: [
    {
      label: 'Pendapatan Bulanan',
      data: [38.5, 47.2, 40.8, 39.0, 42.1, 45.9, 38.9],
      backgroundColor: '#10B981',
      borderRadius: 5,
    },
    {
      label: 'Trend Penjualan',
      data: [38.5, 47.2, 40.8, 39.0, 42.1, 45.9, 38.9],
      type: 'line',
      borderColor: '#059669',
      tension: 0.1,
      fill: false,
    }
  ],
};
// --- Akhir Data Dummy ---


const LaporanAnalitikkeApotek = () => {
  const navigate = useNavigate();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [username, setUsername] = useState(localStorage.getItem('username') || 'PBF');

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
            {/* --- Dropdown Fungsional --- */}
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
          
          {/* Grid untuk 2 Chart Teratas */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            {/* Distribusi Obat ke Apotek (Line Chart) */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 h-[400px] flex flex-col">
              <div className="h-full">
                <Line data={lineChartData} options={chartOptions('Distribusi Obat ke Apotek', 'Jumlah (Box/Strip)')} />
              </div>
            </div>

            {/* Jumlah Pengiriman Bulanan (Bar Chart) */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 h-[400px] flex flex-col">
              <div className="h-full flex items-center justify-center">
                <Bar data={barChartDataPengiriman} options={chartOptions('Jumlah Pengiriman Bulanan', 'Jumlah Pengiriman')} />
              </div>
            </div>
          </div>

          {/* Chart Full-Width Bawah */}
          <div className="grid grid-cols-1 gap-6 mb-6">
            <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 h-[400px] flex flex-col">
              <div className="h-full">
                <Bar data={barChartDataPenjualan} options={currencyChartOptions('Hasil Penjualan dengan Apotek')} />
              </div>
            </div>
          </div>

        </main>
      </div>
    </div>
  );
};

export default LaporanAnalitikkeApotek;