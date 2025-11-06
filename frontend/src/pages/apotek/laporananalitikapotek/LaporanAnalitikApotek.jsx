import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import NavbarApotek from '../../../components/NavbarApotek';
import {
  ChevronDown,
  TrendingUp,
  AlertTriangle,
  BarChart3,
  PieChart,
  Package,
  Loader2,
  CheckCircle2,
} from 'lucide-react';
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
import axios from 'axios';
import { toast } from 'react-hot-toast';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ArcElement);

// --- PERBAIKAN 1: Definisikan state kosong di luar ---
const emptyChartData = { labels: [], datasets: [] };

// --- OPSI CHART (Tidak Berubah) ---
const barOptions = {
  responsive: true,
  maintainAspectRatio: true,
  plugins: {
    legend: { position: 'bottom', labels: { padding: 15, font: { size: 12 } } },
  },
  scales: {
    y: { beginAtZero: true, grid: { color: '#f1f5f9' } },
    x: { grid: { display: false } },
  },
};
const doughnutOptions = {
  responsive: true,
  maintainAspectRatio: true,
  plugins: {
    legend: { position: 'bottom', labels: { padding: 12, font: { size: 11 } } },
  },
};
// --- AKHIR OPSI CHART ---

const LaporanAnalitikApotek = () => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const username = localStorage.getItem('username');

  // --- PERBAIKAN 2: Inisialisasi state dengan 'emptyChartData' ---
  const [totalPenjualanData, setTotalPenjualanData] = useState(emptyChartData);
  const [obatTerlarisData, setObatTerlarisData] = useState(emptyChartData);
  const [totalPembelianData, setTotalPembelianData] = useState(emptyChartData);
  const [hampirKadaluwarsaData, setHampirKadaluwarsaData] = useState([]);
  // --- AKHIR PERBAIKAN 2 ---

  // --- FETCH DATA DINAMIS ---
  useEffect(() => {
    const fetchAnalytics = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          toast.error('Sesi tidak valid.');
          navigate('/login/apotek');
          return;
        }

        const response = await axios.get('http://localhost:5000/api/apotek/laporan/analytics', {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (response.data.success && response.data.data) {
          const data = response.data.data;

          // Set Total Penjualan (ke Konsumen)
          if (data.totalPenjualanChart) {
            setTotalPenjualanData({
              labels: data.totalPenjualanChart.labels,
              datasets: [
                {
                  label: 'Total Penjualan (Rp)',
                  data: data.totalPenjualanChart.data,
                  backgroundColor: '#10B981',
                  borderColor: '#059669',
                  borderWidth: 1,
                  borderRadius: 8,
                },
              ],
            });
          }

          // Set Obat Terlaris (ke Konsumen)
          if (data.obatTerlarisChart) {
            setObatTerlarisData({
              labels: data.obatTerlarisChart.labels,
              datasets: [
                {
                  data: data.obatTerlarisChart.data,
                  backgroundColor: ['#10B981', '#34D399', '#6EE7B7', '#A7F3D0', '#D1FAE5'],
                  borderColor: '#FFFFFF',
                  borderWidth: 3,
                },
              ],
            });
          }

          // Set Total Pembelian (dari PBF)
          if (data.totalPembelianChart) {
            setTotalPembelianData({
              labels: data.totalPembelianChart.labels,
              datasets: [
                {
                  label: 'Total Pembelian (Rp)',
                  data: data.totalPembelianChart.data,
                  backgroundColor: '#3B82F6', // Warna biru
                  borderColor: '#2563EB',
                  borderWidth: 1,
                  borderRadius: 8,
                },
              ],
            });
          }

          // Set Hampir Kadaluwarsa
          setHampirKadaluwarsaData(data.hampirKadaluwarsaData || []);
        } else {
          throw new Error(response.data.message || 'Gagal memuat data analitik.');
        }
      } catch (err) {
        const errorMsg = err.response?.data?.message || err.message;
        setError(errorMsg);
        toast.error(errorMsg);
        if (err.response?.status === 401) navigate('/login/apotek');
      } finally {
        setIsLoading(false);
      }
    };
    fetchAnalytics();
  }, [navigate]);

  const handleLogout = () => {
    localStorage.clear();
    navigate('/');
  };

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('id-ID', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      timeZone: 'UTC',
    });
  };

  if (isLoading) {
    return (
      <div className="flex min-h-screen bg-gradient-to-br from-slate-50 via-white to-emerald-50">
        <div className="flex-1 flex flex-col">
          <NavbarApotek onLogout={handleLogout} username={username} />
          <main className="flex-1 flex items-center justify-center">
            <Loader2 className="animate-spin h-12 w-12 text-emerald-600" />
          </main>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-slate-50 via-white to-emerald-50">
      <div className="flex-1 flex flex-col">
        <NavbarApotek onLogout={handleLogout} username={username} />

        <main className="flex-1 overflow-auto pt-[72px]">
          <div className="max-w-7xl mx-auto px-6 py-8">
            {/* Header */}
            <div className="mb-8">
              <h1 className="text-3xl font-bold text-slate-900 mb-2">Laporan dan Analitik</h1>
              <p className="text-slate-600">Pantau performa dan statistik apotek Anda</p>
            </div>

            {error && (
              <div className="p-4 mb-6 bg-red-50 text-red-700 rounded-lg border border-red-200 flex items-center gap-2 text-sm">
                <AlertTriangle size={18} /> {error}
              </div>
            )}

            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
              {/* Kolom Kiri */}
              <div className="space-y-6">
                {/* Total Penjualan (Konsumen) */}
                <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                  <div className="px-6 py-4 border-b border-slate-200 flex justify-between items-center">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-emerald-100 rounded-lg">
                        <BarChart3 className="text-emerald-600" size={20} />
                      </div>
                      <h2 className="font-bold text-slate-900">Total Penjualan (ke Konsumen)</h2>
                    </div>
                  </div>
                  <div className="p-6">
                    {/* --- PERBAIKAN 3: Cek 'data.length' --- */}
                    {totalPenjualanData.datasets[0]?.data?.length > 0 ? (
                      <Bar data={totalPenjualanData} options={barOptions} />
                    ) : (
                      <p className="text-center text-slate-500 py-10">
                        Tidak ada data penjualan 6 bulan terakhir.
                      </p>
                    )}
                  </div>
                </div>

                {/* Obat Terlaris (Konsumen) */}
                <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                  <div className="px-6 py-4 border-b border-slate-200 flex justify-between items-center">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-emerald-100 rounded-lg">
                        <PieChart className="text-emerald-600" size={20} />
                      </div>
                      <h2 className="font-bold text-slate-900">Obat Terlaris (Top 5)</h2>
                    </div>
                  </div>
                  <div className="p-6">
                    <div className="max-w-sm mx-auto">
                      {obatTerlarisData.datasets[0]?.data?.length > 0 ? (
                        <Doughnut data={obatTerlarisData} options={doughnutOptions} />
                      ) : (
                        <p className="text-center text-slate-500 py-10">
                          Belum ada obat yang terjual.
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Kolom Kanan */}
              <div className="space-y-6">
                {/* Total Pembelian (dari PBF) */}
                <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                  <div className="px-6 py-4 border-b border-slate-200">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-blue-100 rounded-lg">
                        <Package className="text-blue-600" size={20} />
                      </div>
                      <h2 className="font-bold text-slate-900">Total Pembelian (dari PBF)</h2>
                    </div>
                  </div>
                  <div className="p-6">
                    {totalPembelianData.datasets[0]?.data?.length > 0 ? (
                      <Bar data={totalPembelianData} options={barOptions} />
                    ) : (
                      <p className="text-center text-slate-500 py-10">
                        Tidak ada data pembelian 6 bulan terakhir.
                      </p>
                    )}
                  </div>
                </div>

                {/* (Kartu Prediksi & Stok Dummy Dihapus) */}
              </div>
            </div>

            {/* Obat Hampir Kadaluwarsa */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden mt-6">
              <div className="px-6 py-4 border-b border-slate-200 flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-red-100 rounded-lg">
                    <AlertTriangle className="text-red-600" size={20} />
                  </div>
                  <h2 className="font-bold text-slate-900">
                    Obat yang Hampir Kadaluwarsa (90 Hari)
                  </h2>
                </div>
                <button className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white text-sm font-semibold px-5 py-2 rounded-xl shadow-lg hover:shadow-xl transition-all duration-200">
                  Lihat Semua
                </button>
              </div>

              <div className="overflow-x-auto">
                <table className="min-w-full">
                  <thead>
                    <tr className="border-b-2 border-slate-200 bg-slate-50">
                      <th className="px-6 py-4 text-left text-xs font-bold text-slate-600 uppercase tracking-wider">
                        Nama Obat
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-bold text-slate-600 uppercase tracking-wider">
                        Stok
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-bold text-slate-600 uppercase tracking-wider">
                        Tanggal Kadaluwarsa
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-bold text-slate-600 uppercase tracking-wider">
                        Status
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {hampirKadaluwarsaData.length > 0 ? (
                      hampirKadaluwarsaData.map((item, index) => (
                        <tr key={index} className="hover:bg-slate-50 transition-colors">
                          <td className="px-6 py-4">
                            <p className="text-sm font-semibold text-slate-900">{item.nama}</p>
                            <p className="text-xs text-slate-500 font-mono bg-slate-100 px-2 py-0.5 rounded inline-block mt-1">
                              Batch: {item.batchId}
                            </p>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className="text-sm font-medium text-emerald-700 bg-emerald-50 px-3 py-1 rounded-lg">
                              {(item.stok || 0).toLocaleString('id-ID')} box
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-700 font-medium">
                            {formatDate(item.tanggal)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className="px-3 py-1 text-xs font-semibold rounded-full bg-red-50 text-red-700 border border-red-200">
                              {item.status}
                            </span>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="4" className="text-center py-10 text-slate-500">
                          <CheckCircle2
                            size={32}
                            className="mx-auto mb-2 opacity-50 text-emerald-600"
                          />
                          Tidak ada obat yang mendekati kadaluwarsa.
                        </td>
                      </tr>
                    )}
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
