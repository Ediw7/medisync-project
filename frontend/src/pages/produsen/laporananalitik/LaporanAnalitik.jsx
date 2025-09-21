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

  useEffect(() => {
    const fetchAnalyticsData = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const token = localStorage.getItem('token');
        if (!token) throw new Error('Silakan login terlebih dahulu');

        const response = await fetch('http://localhost:5000/api/produsen/laporananalitik', {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (!response.ok) {
          const err = await response.json();
          throw new Error(err.message || 'Gagal mengambil data');
        }

        const result = await response.json();
        if (!result.success) throw new Error(result.message);

        const { produksi, stok, delivery } = result.data;

        setProduksiChartData(produksi);
        setStokChartData(stok);
        setAvgDeliveryDays(delivery.avgDeliveryDays);
      } catch (error) {
        setError(error.message);
      } finally {
        setIsLoading(false);
      }
    };
    fetchAnalyticsData();
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
      title: {
        display: true,
        text: (ctx) => ctx.chart.data.datasets[0]?.label || '',
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        title: {
          display: true,
          text: 'Jumlah',
        },
      },
      x: {
        title: {
          display: true,
          text: 'Bulan',
        },
      },
    },
  };

  const deliveryChartData = {
    labels: ['Rata-rata'],
    datasets: [
      {
        label: 'Waktu Pengiriman (Hari)',
        data: [avgDeliveryDays],
        backgroundColor: 'rgba(59, 130, 246, 0.7)',
      },
    ],
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
              {isLoading ? (
                <p className="text-center text-gray-400 py-16">Memuat...</p>
              ) : error ? (
                <p className="text-center text-red-500 py-16">{error}</p>
              ) : produksiChartData.labels.length === 0 ? (
                <p className="text-center text-gray-400 py-16">Tidak ada data produksi tersedia</p>
              ) : (
                <Line options={chartOptions} data={produksiChartData} />
              )}
            </div>

            {/* Chart Stok Obat vs Minimum */}
            <div className="bg-white p-6 rounded-lg shadow">
              <h2 className="text-lg font-semibold mb-4">Stok Obat vs Minimum</h2>
              {isLoading ? (
                <p className="text-center text-gray-400 py-16">Memuat...</p>
              ) : error ? (
                <p className="text-center text-red-500 py-16">{error}</p>
              ) : stokChartData.labels.length === 0 ? (
                <p className="text-center text-gray-400 py-16">Tidak ada data stok tersedia</p>
              ) : (
                <Bar options={chartOptions} data={stokChartData} />
              )}
            </div>

            {/* Metrik Rata-rata Waktu Pengiriman */}
            <div className="bg-white p-6 rounded-lg shadow lg:col-span-2">
  <h2 className="text-lg font-semibold mb-4">Rata-rata Waktu Pengiriman</h2>
  {isLoading ? (
    <p className="text-center text-gray-400 py-16">Memuat...</p>
  ) : error ? (
    <p className="text-center text-red-500 py-16">{error}</p>
  ) : (
    // Add a more robust check here
    typeof avgDeliveryDays === 'number' && avgDeliveryDays > 0 ? (
      <div className="flex flex-col items-center">
        <Bar options={chartOptions} data={deliveryChartData} />
        <p className="mt-4 text-gray-600">
          Rata-rata waktu pengiriman: <strong>{avgDeliveryDays.toFixed(2)} hari</strong>
        </p>
      </div>
    ) : (
      // Show this if the value is 0, null, or undefined
      <p className="text-center text-gray-400 py-16">Tidak ada data pengiriman tersedia</p>
    )
  )}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default LaporanAnalitik;