import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import SidebarApotek from '../../../components/SidebarApotek';
import NavbarApotek from '../../../components/NavbarApotek';
import { ChevronDown, TrendingUp, AlertTriangle } from 'lucide-react';
import { Bar, Doughnut } from 'react-chartjs-2';
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

const LaporanAnalitikApotek = () => {
  const navigate = useNavigate();
  const [isCollapsed, setIsCollapsed] = useState(false);

  // Data Dummy untuk Total Penjualan
  const totalPenjualanData = {
    labels: ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun'],
    datasets: [{
      label: 'Total Penjualan',
      data: [40000, 35000, 42000, 38000, 44000, 48000],
      backgroundColor: '#34D399',
      borderColor: '#10B981',
      borderWidth: 1,
      borderRadius: 5,
    }],
  };
  
  // Data Dummy untuk Stok dan Kadaluwarsa (Stacked Bar)
  const stokData = {
      labels: ['Analgesik', 'Antibiotik', 'Vitamin', 'Antasida'],
      datasets: [
          {
              label: 'Stok Tersedia',
              data: [280, 200, 180, 100],
              backgroundColor: '#10B981',
              borderRadius: 5,
          },
          {
              label: 'Hampir Kadaluwarsa',
              data: [60, 25, 15, 20],
              backgroundColor: '#F87171',
              borderRadius: 5,
          },
      ],
  };

  // Data Dummy untuk Obat Terlaris (Doughnut)
  const obatTerlarisData = {
    labels: ['Paracetamol', 'Amoxicillin', 'Omeprazole', 'Vitamin C', 'Antasida'],
    datasets: [{
      data: [29, 21, 19, 17, 13],
      backgroundColor: ['#10B981', '#34D399', '#6EE7B7', '#A7F3D0', '#D1FAE5'],
      borderColor: '#FFFFFF',
      borderWidth: 2,
    }],
  };
  
  // Data Dummy untuk Obat Hampir Kadaluwarsa
  const hampirKadaluwarsaData = [
      { nama: 'Antalgin tablet 500mg', batchId: 'ATG-0023', stok: 5000, tanggal: '22-02-2025', status: '1 bulan lagi' },
      { nama: 'Bodrex Ekstra 4 KPL 600mg', batchId: 'BDE-0044', stok: 5000, tanggal: '22-02-2025', status: '3 bulan lagi' },
  ];

  const barOptions = { responsive: true, plugins: { legend: { position: 'bottom' } } };
  const doughnutOptions = { responsive: true, plugins: { legend: { position: 'bottom' } } };
  const stackedBarOptions = { responsive: true, scales: { x: { stacked: true }, y: { stacked: true } }, plugins: { legend: { position: 'bottom' } } };

  return (
    <div className="flex min-h-screen bg-gray-50">
      <SidebarApotek isCollapsed={isCollapsed} setIsCollapsed={setIsCollapsed} />
      <div className={`flex-1 flex flex-col transition-all duration-300 ${isCollapsed ? 'ml-16' : 'ml-64'}`}>
        <NavbarApotek onLogout={() => { localStorage.clear(); navigate('/'); }} />
        <main className="flex-1 pt-16 p-6">
          <h1 className="text-2xl font-bold mb-6">Laporan dan Analitik</h1>
          
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            {/* Kolom Kiri */}
            <div className="space-y-6">
              {/* Total Penjualan */}
              <div className="bg-white p-6 rounded-lg shadow">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="font-semibold">Total Penjualan Obat Apotek</h2>
                  <button className="text-sm border rounded px-3 py-1 flex items-center gap-2">6 bulan terakhir <ChevronDown size={14}/></button>
                </div>
                <Bar data={totalPenjualanData} options={barOptions} />
              </div>
              {/* Obat Terlaris */}
              <div className="bg-white p-6 rounded-lg shadow">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="font-semibold">Obat terlaris</h2>
                  <button className="text-sm border rounded px-3 py-1 flex items-center gap-2">6 bulan terakhir <ChevronDown size={14}/></button>
                </div>
                <div className="max-w-xs mx-auto">
                    <Doughnut data={obatTerlarisData} options={doughnutOptions} />
                </div>
              </div>
            </div>

            {/* Kolom Kanan */}
            <div className="space-y-6">
                {/* Stok dan Kadaluwarsa */}
                <div className="bg-white p-6 rounded-lg shadow">
                    <h2 className="font-semibold mb-4">Stok dan Kadaluwarsa</h2>
                    <Bar data={stokData} options={stackedBarOptions} />
                </div>
                {/* Prediksi Kebutuhan Stok */}
                <div className="bg-white p-6 rounded-lg shadow">
                    <div className="flex justify-between items-center mb-4">
                        <h2 className="font-semibold">Prediksi Kebutuhan stok</h2>
                        <button className="text-sm border rounded px-3 py-1 flex items-center gap-2">6 bulan kedepan <ChevronDown size={14}/></button>
                    </div>
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <TrendingUp size={20} className="text-green-500"/>
                                <p className="font-medium">Paracetamol</p>
                            </div>
                            <p className="font-semibold text-green-500">+150.000 box</p>
                        </div>
                         <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <AlertTriangle size={20} className="text-yellow-500"/>
                                <div>
                                    <p className="font-medium">Amoxicillin</p>
                                    <p className="text-xs text-yellow-600">Stok hampir habis</p>
                                </div>
                            </div>
                            <p className="font-semibold text-green-500">+10.000 box</p>
                        </div>
                    </div>
                </div>
            </div>
          </div>
          
          {/* Obat Hampir Kadaluwarsa */}
          <div className="bg-white p-6 rounded-lg shadow mt-6">
            <div className="flex justify-between items-center mb-4">
                <h2 className="font-semibold">Obat yang hampir kadaluwarsa</h2>
                <button className="bg-emerald-600 text-white text-sm font-semibold px-4 py-2 rounded-lg hover:bg-emerald-700">Lihat semua</button>
            </div>
            <div className="overflow-x-auto">
                <table className="min-w-full">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Nama Obat</th>
                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Stok</th>
                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Tanggal Kadaluwarsa</th>
                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {hampirKadaluwarsaData.map((item, index) => (
                            <tr key={index}>
                                <td className="px-4 py-3">
                                    <p className="text-sm font-medium">{item.nama}</p>
                                    <p className="text-xs text-gray-500">Batch ID: {item.batchId}</p>
                                </td>
                                <td className="px-4 py-3 whitespace-nowrap text-sm">{item.stok.toLocaleString('id-ID')}</td>
                                <td className="px-4 py-3 whitespace-nowrap text-sm">{item.tanggal}</td>
                                <td className="px-4 py-3 whitespace-nowrap text-sm">
                                    <span className="px-2 py-1 text-xs font-semibold rounded-full bg-red-100 text-red-800">{item.status}</span>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default LaporanAnalitikApotek;