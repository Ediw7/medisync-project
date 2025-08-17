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

ChartJS.register(
  CategoryScale, LinearScale, PointElement, LineElement, BarElement, Title, Tooltip, Legend
);

const LaporanAnalitik = () => {
  const navigate = useNavigate();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [produksiChartData, setProduksiChartData] = useState({ labels: [], datasets: [] });
  const [stokChartData, setStokChartData] = useState({ labels: [], datasets: [] });

  useEffect(() => {
    // --- MENGGUNAKAN DATA DUMMY ---
    // Data untuk chart Produksi per Bulan
    const dummyProduksiLabels = ['Sep 2023', 'Okt 2023', 'Nov 2023', 'Des 2023', 'Jan 2024', 'Feb 2024'];
    const dummyProduksiData = [12000, 13500, 13000, 14500, 14000, 15000];
    setProduksiChartData({
      labels: dummyProduksiLabels,
      datasets: [{
        label: 'Jumlah Produksi',
        data: dummyProduksiData,
        borderColor: 'rgb(22, 163, 74)',
        backgroundColor: 'rgba(22, 163, 74, 0.5)',
        tension: 0.4,
      }],
    });

    // Data untuk chart Stok Obat vs Minimum
    const dummyStokLabels = ['Paracetamol', 'Amoxicillin', 'Omeprazole', 'Simvastatin', 'Metformin'];
    const dummyStokTersedia = [5000, 3200, 4000, 2800, 3500];
    const dummyStokMinimum = [2000, 2500, 2000, 2200, 2500];
    setStokChartData({
      labels: dummyStokLabels,
      datasets: [{
        label: 'Stok Tersedia',
        data: dummyStokTersedia,
        backgroundColor: 'rgba(22, 163, 74, 0.7)',
      }, {
        label: 'Stok Minimum',
        data: dummyStokMinimum,
        backgroundColor: 'rgba(203, 213, 225, 1)',
      }]
    });

  }, []);

  const handleLogout = () => {
    localStorage.clear();
    navigate('/');
  };

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'bottom',
      },
    },
  };

  return (
    <div className="flex min-h-screen bg-gray-50">
      <SidebarProdusen isCollapsed={isCollapsed} setIsCollapsed={setIsCollapsed} />
      <div className={`flex-1 flex flex-col transition-all duration-300 ${isCollapsed ? 'ml-16' : 'ml-64'}`}>
        <NavbarProdusen onLogout={handleLogout} />
        <main className="pt-16 p-6">
          <div className="mb-6">
            <h1 className="text-2xl font-bold">Laporan & Analitik</h1>
            <p className="text-gray-500">Overview performa produksi dan distribusi</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Chart Produksi per Bulan */}
            <div className="bg-white p-6 rounded-lg shadow">
              <h2 className="text-lg font-semibold mb-4">Produksi per Bulan</h2>
              <Line options={chartOptions} data={produksiChartData} />
            </div>

            {/* Chart Stok Obat vs Minimum */}
            <div className="bg-white p-6 rounded-lg shadow">
              <h2 className="text-lg font-semibold mb-4">Stok Obat vs Minimum</h2>
              <Bar options={chartOptions} data={stokChartData} />
            </div>

            {/* Chart Rata-rata Waktu Pengiriman (Placeholder) */}
            <div className="bg-white p-6 rounded-lg shadow lg:col-span-2">
              <h2 className="text-lg font-semibold mb-4">Rata-rata Waktu Pengiriman (Bulan)</h2>
              <p className="text-center text-gray-400 py-16">Data pengiriman belum tersedia.</p>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default LaporanAnalitik;
