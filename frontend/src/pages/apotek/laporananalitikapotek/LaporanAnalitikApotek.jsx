import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import NavbarApotek from '../../../components/NavbarApotek';
import { ChevronDown, TrendingUp, AlertTriangle, BarChart3, PieChart, Package } from 'lucide-react';
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

  const totalPenjualanData = {
    labels: ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun'],
    datasets: [{
      label: 'Total Penjualan',
      data: [40000, 35000, 42000, 38000, 44000, 48000],
      backgroundColor: '#10B981',
      borderColor: '#059669',
      borderWidth: 1,
      borderRadius: 8,
    }],
  };
  
  const stokData = {
    labels: ['Analgesik', 'Antibiotik', 'Vitamin', 'Antasida'],
    datasets: [
      {
        label: 'Stok Tersedia',
        data: [280, 200, 180, 100],
        backgroundColor: '#10B981',
        borderRadius: 6,
      },
      {
        label: 'Hampir Kadaluwarsa',
        data: [60, 25, 15, 20],
        backgroundColor: '#F87171',
        borderRadius: 6,
      },
    ],
  };

  const obatTerlarisData = {
    labels: ['Paracetamol', 'Amoxicillin', 'Omeprazole', 'Vitamin C', 'Antasida'],
    datasets: [{
      data: [29, 21, 19, 17, 13],
      backgroundColor: ['#10B981', '#34D399', '#6EE7B7', '#A7F3D0', '#D1FAE5'],
      borderColor: '#FFFFFF',
      borderWidth: 3,
    }],
  };
  
  const hampirKadaluwarsaData = [
    { nama: 'Antalgin tablet 500mg', batchId: 'ATG-0023', stok: 5000, tanggal: '22-02-2025', status: '1 bulan lagi' },
    { nama: 'Bodrex Ekstra 4 KPL 600mg', batchId: 'BDE-0044', stok: 5000, tanggal: '22-02-2025', status: '3 bulan lagi' },
  ];

  const barOptions = { 
    responsive: true, 
    maintainAspectRatio: true,
    plugins: { 
      legend: { 
        position: 'bottom',
        labels: {
          padding: 15,
          font: { size: 12 }
        }
      } 
    },
    scales: {
      y: {
        beginAtZero: true,
        grid: { color: '#f1f5f9' }
      },
      x: {
        grid: { display: false }
      }
    }
  };

  const doughnutOptions = { 
    responsive: true,
    maintainAspectRatio: true,
    plugins: { 
      legend: { 
        position: 'bottom',
        labels: {
          padding: 12,
          font: { size: 11 }
        }
      } 
    } 
  };

  const stackedBarOptions = { 
    responsive: true,
    maintainAspectRatio: true,
    scales: { 
      x: { 
        stacked: true,
        grid: { display: false }
      }, 
      y: { 
        stacked: true,
        beginAtZero: true,
        grid: { color: '#f1f5f9' }
      } 
    }, 
    plugins: { 
      legend: { 
        position: 'bottom',
        labels: {
          padding: 15,
          font: { size: 12 }
        }
      } 
    } 
  };

  const handleLogout = () => {
    localStorage.clear();
    navigate('/');
  };

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-slate-50 via-white to-emerald-50">
      <div className="flex-1 flex flex-col">
        <NavbarApotek onLogout={handleLogout} />
        
        <main className="flex-1 overflow-auto pt-[72px]">
          <div className="max-w-7xl mx-auto px-6 py-8">
            {/* Header */}
            <div className="mb-8">
              <h1 className="text-3xl font-bold text-slate-900 mb-2">Laporan dan Analitik</h1>
              <p className="text-slate-600">Pantau performa dan statistik apotek Anda</p>
            </div>
            
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
              {/* Kolom Kiri */}
              <div className="space-y-6">
                {/* Total Penjualan */}
                <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                  <div className="px-6 py-4 border-b border-slate-200 flex justify-between items-center">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-emerald-100 rounded-lg">
                        <BarChart3 className="text-emerald-600" size={20} />
                      </div>
                      <h2 className="font-bold text-slate-900">Total Penjualan Obat</h2>
                    </div>
                    <button className="text-sm border border-slate-300 rounded-xl px-4 py-2 flex items-center gap-2 hover:bg-slate-50 transition-all font-medium text-slate-700">
                      6 bulan terakhir 
                      <ChevronDown size={16}/>
                    </button>
                  </div>
                  <div className="p-6">
                    <Bar data={totalPenjualanData} options={barOptions} />
                  </div>
                </div>

                {/* Obat Terlaris */}
                <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                  <div className="px-6 py-4 border-b border-slate-200 flex justify-between items-center">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-emerald-100 rounded-lg">
                        <PieChart className="text-emerald-600" size={20} />
                      </div>
                      <h2 className="font-bold text-slate-900">Obat Terlaris</h2>
                    </div>
                    <button className="text-sm border border-slate-300 rounded-xl px-4 py-2 flex items-center gap-2 hover:bg-slate-50 transition-all font-medium text-slate-700">
                      6 bulan terakhir 
                      <ChevronDown size={16}/>
                    </button>
                  </div>
                  <div className="p-6">
                    <div className="max-w-sm mx-auto">
                      <Doughnut data={obatTerlarisData} options={doughnutOptions} />
                    </div>
                  </div>
                </div>
              </div>

              {/* Kolom Kanan */}
              <div className="space-y-6">
                {/* Stok dan Kadaluwarsa */}
                <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                  <div className="px-6 py-4 border-b border-slate-200">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-blue-100 rounded-lg">
                        <Package className="text-blue-600" size={20} />
                      </div>
                      <h2 className="font-bold text-slate-900">Stok dan Kadaluwarsa</h2>
                    </div>
                  </div>
                  <div className="p-6">
                    <Bar data={stokData} options={stackedBarOptions} />
                  </div>
                </div>

                {/* Prediksi Kebutuhan Stok */}
                <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                  <div className="px-6 py-4 border-b border-slate-200 flex justify-between items-center">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-purple-100 rounded-lg">
                        <TrendingUp className="text-purple-600" size={20} />
                      </div>
                      <h2 className="font-bold text-slate-900">Prediksi Kebutuhan Stok</h2>
                    </div>
                    <button className="text-sm border border-slate-300 rounded-xl px-4 py-2 flex items-center gap-2 hover:bg-slate-50 transition-all font-medium text-slate-700">
                      6 bulan kedepan 
                      <ChevronDown size={16}/>
                    </button>
                  </div>
                  <div className="p-6 space-y-4">
                    <div className="flex items-center justify-between p-4 bg-emerald-50 rounded-xl border border-emerald-200">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-emerald-100 rounded-lg">
                          <TrendingUp size={20} className="text-emerald-600"/>
                        </div>
                        <p className="font-semibold text-slate-900">Paracetamol</p>
                      </div>
                      <p className="font-bold text-emerald-600">+150.000 box</p>
                    </div>
                    
                    <div className="flex items-center justify-between p-4 bg-amber-50 rounded-xl border border-amber-200">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-amber-100 rounded-lg">
                          <AlertTriangle size={20} className="text-amber-600"/>
                        </div>
                        <div>
                          <p className="font-semibold text-slate-900">Amoxicillin</p>
                          <p className="text-xs text-amber-700 font-medium">Stok hampir habis</p>
                        </div>
                      </div>
                      <p className="font-bold text-emerald-600">+10.000 box</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Obat Hampir Kadaluwarsa */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden mt-6">
              <div className="px-6 py-4 border-b border-slate-200 flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-red-100 rounded-lg">
                    <AlertTriangle className="text-red-600" size={20} />
                  </div>
                  <h2 className="font-bold text-slate-900">Obat yang Hampir Kadaluwarsa</h2>
                </div>
                <button className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white text-sm font-semibold px-5 py-2 rounded-xl shadow-lg hover:shadow-xl transition-all duration-200">
                  Lihat Semua
                </button>
              </div>
              
              <div className="overflow-x-auto">
                <table className="min-w-full">
                  <thead>
                    <tr className="border-b-2 border-slate-200 bg-slate-50">
                      <th className="px-6 py-4 text-left text-xs font-bold text-slate-600 uppercase tracking-wider">Nama Obat</th>
                      <th className="px-6 py-4 text-left text-xs font-bold text-slate-600 uppercase tracking-wider">Stok</th>
                      <th className="px-6 py-4 text-left text-xs font-bold text-slate-600 uppercase tracking-wider">Tanggal Kadaluwarsa</th>
                      <th className="px-6 py-4 text-left text-xs font-bold text-slate-600 uppercase tracking-wider">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {hampirKadaluwarsaData.map((item, index) => (
                      <tr key={index} className="hover:bg-slate-50 transition-colors">
                        <td className="px-6 py-4">
                          <p className="text-sm font-semibold text-slate-900">{item.nama}</p>
                          <p className="text-xs text-slate-500 font-mono bg-slate-100 px-2 py-0.5 rounded inline-block mt-1">
                            Batch: {item.batchId}
                          </p>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="text-sm font-medium text-emerald-700 bg-emerald-50 px-3 py-1 rounded-lg">
                            {item.stok.toLocaleString('id-ID')} box
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-700 font-medium">{item.tanggal}</td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="px-3 py-1 text-xs font-semibold rounded-full bg-red-50 text-red-700 border border-red-200">
                            {item.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default LaporanAnalitikApotek;