import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import SidebarPbf from '../../../components/SidebarPbf';
import NavbarPbf from '../../../components/NavbarPbf';
import { ChevronDown, Search, Calendar } from 'lucide-react';
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

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
);

const LaporanAnalitikPbf = () => {
  const navigate = useNavigate();
  const [isCollapsed, setIsCollapsed] = useState(false);

  // Data Dummy untuk Bar Chart
  const barChartData = {
    labels: ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun'],
    datasets: [
      {
        label: 'Jumlah Obat Dipesan',
        data: [1500, 1800, 1900, 1700, 2100, 2000],
        backgroundColor: '#10B981',
        borderRadius: 5,
      },
    ],
  };

  // Data Dummy untuk Pie Chart
  const pieChartData = {
    labels: ['Kimia Farma', 'Kalbe Farma', 'Pharos', 'Sanbe Farma', 'Dexa Medica'],
    datasets: [
      {
        data: [27, 23, 13, 17, 20],
        backgroundColor: ['#10B981', '#34D399', '#6EE7B7', '#A7F3D0', '#D1FAE5'],
        borderColor: '#FFFFFF',
        borderWidth: 2,
      },
    ],
  };

  // Data Dummy untuk Tabel Riwayat
  const riwayatData = [
    { id: '001', tanggal: '25 Mar 2025', namaProdusen: 'Kimia Farma', jumlah: 250, status: 'Selesai' },
    { id: '002', tanggal: '22 Mar 2025', namaProdusen: 'Kalbe Farma', jumlah: 180, status: 'Selesai' },
    { id: '003', tanggal: '20 Mar 2025', namaProdusen: 'Dexa Medica', jumlah: 120, status: 'Selesai' },
    { id: '004', tanggal: '18 Mar 2025', namaProdusen: 'Sanbe Farma', jumlah: 90, status: 'Selesai' },
  ];
  
  const chartOptions = {
    responsive: true,
    plugins: {
        legend: {
            display: false,
        },
    },
    scales: {
        y: {
            beginAtZero: true
        }
    }
  };

  const pieChartOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'right',
        labels: {
            boxWidth: 15,
            padding: 15,
        }
      },
    },
  };

  return (
    <div className="flex min-h-screen bg-gray-50">
      <SidebarPbf isCollapsed={isCollapsed} setIsCollapsed={setIsCollapsed} />
      <div className={`flex-1 flex flex-col transition-all duration-300 ${isCollapsed ? 'ml-16' : 'ml-64'}`}>
        <NavbarPbf onLogout={() => { localStorage.clear(); navigate('/'); }} />
        <main className="flex-1 pt-16 p-6">
          <div className="flex flex-wrap justify-between items-center mb-6">
            <div>
              <h1 className="text-2xl font-bold">Laporan dan Analitik</h1>
              <p className="text-gray-500">Pantau penjualan, mengelola stok, serta memahami tren pasar</p>
            </div>
            <div className="relative">
                <button className="flex items-center gap-2 border rounded-lg px-4 py-2 text-sm">
                    Produsen <ChevronDown size={16} />
                </button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            {/* Pemesanan Obat */}
            <div className="bg-white p-6 rounded-lg shadow">
              <div className="flex justify-between items-center mb-4">
                <h2 className="font-semibold">Pemesanan Obat dari Produsen</h2>
                <button className="text-sm border rounded px-3 py-1 flex items-center gap-2">Bulanan <ChevronDown size={14}/></button>
              </div>
              <Bar data={barChartData} options={chartOptions} />
            </div>

            {/* Transaksi dengan Produsen */}
            <div className="bg-white p-6 rounded-lg shadow">
              <h2 className="font-semibold mb-4">Transaksi dengan Produsen</h2>
              <Pie data={pieChartData} options={pieChartOptions} />
            </div>
          </div>

          {/* Riwayat Transaksi */}
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex flex-wrap justify-between items-center mb-4">
                <h2 className="font-semibold">Riwayat Transaksi dengan Produsen</h2>
                <div className="flex items-center gap-4">
                    <div className="relative">
                        <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                        <input type="text" placeholder="Cari ID Pesanan atau Nama Produsen..." className="pl-10 pr-4 py-2 border rounded-lg text-sm w-72" />
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
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">ID</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tanggal</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Nama Produsen</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Jumlah Item</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {riwayatData.map(item => (
                            <tr key={item.id}>
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold">{item.id}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm">{item.tanggal}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm">{item.namaProdusen}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm">{item.jumlah}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm">
                                    <span className="text-green-600 font-semibold">{item.status}</span>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
            <div className="text-center mt-4">
                <a href="#" className="text-emerald-600 font-semibold text-sm hover:underline">Lihat Semua Transaksi →</a>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default LaporanAnalitikPbf;