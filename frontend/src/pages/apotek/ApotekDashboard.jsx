import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import NavbarApotek from '../../components/NavbarApotek';
import { 
  Box, 
  ShoppingBag, 
  FileText, 
  AlertTriangle, 
  Loader2, 
  TrendingUp, 
  Package, 
  Calendar, 
  ArrowUpRight,
  BarChart2, // <-- Baru
  PlusCircle, // <-- Baru
  FilePlus // <-- Baru
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { Bar } from 'react-chartjs-2'; // <-- Baru
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js'; // <-- Baru

// --- REGISTRASI CHART.JS ---
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

// --- HELPER SAPAAN ---
const getGreeting = () => {
  const hour = new Date().getHours();
  if (hour < 11) return "Selamat Pagi";
  if (hour < 15) return "Selamat Siang";
  if (hour < 19) return "Selamat Sore";
  return "Selamat Malam";
};

// --- HELPER FORMAT TANGGAL (BARU) ---
const formatDate = (dateString) => {
  if (!dateString) return '-';
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return '-';
    return date.toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' });
  } catch (e) { return '-'; }
};

// --- KARTU KPI (Desain Asli Anda - Sudah Bagus) ---
const StatCard = ({ icon, value, label, unit, isCurrency = false, trend, color = "emerald" }) => {
  const colorClasses = {
    emerald: "from-emerald-500 to-teal-600",
    blue: "from-blue-500 to-cyan-600",
    purple: "from-purple-500 to-pink-600",
    orange: "from-orange-500 to-red-600"
  };

  return (
    <div className="group relative bg-white p-5 rounded-xl shadow-sm border border-slate-200 hover:shadow-md hover:border-slate-300 transition-all duration-300 overflow-hidden">
      <div className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-br ${colorClasses[color]} opacity-5 rounded-full -mr-16 -mt-16 group-hover:scale-150 transition-transform duration-500`}></div>
      <div className="relative flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-3">
            <div className={`p-2.5 rounded-xl bg-gradient-to-br ${colorClasses[color]} shadow-lg`}>
              {React.cloneElement(icon, { className: "text-white", size: 20 })}
            </div>
            {trend && (
              <span className="flex items-center text-xs font-semibold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-full">
                <TrendingUp size={12} className="mr-1" />
                {trend}
              </span>
            )}
          </div>
          <p className="text-3xl font-bold text-slate-900 mb-1">
            {isCurrency ? `Rp ${Number(value || 0).toLocaleString('id-ID')}` : Number(value || 0).toLocaleString('id-ID')}
            {unit && <span className="text-lg font-medium text-slate-500 ml-1">{unit}</span>}
          </p>
          <p className="text-sm text-slate-600 font-medium">{label}</p>
        </div>
        <ArrowUpRight className="text-slate-300 group-hover:text-slate-400 transition-colors" size={20} />
      </div>
    </div>
  );
};

// --- KOMPONEN GRAFIK PENJUALAN (BARU) ---
const SalesChart = () => {
  // Data dummy (gantilah dengan data API Anda jika ada)
  const data = {
    labels: ['Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab', 'Min'],
    datasets: [
      {
        label: 'Penjualan (Rp)',
        data: [120000, 190000, 300000, 500000, 200000, 300000, 450000],
        backgroundColor: '#10B981',
        borderColor: '#059669',
        borderWidth: 1,
        borderRadius: 5,
        barThickness: 30,
      },
    ],
  };
  
  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      title: {
        display: true,
        text: 'Penjualan 7 Hari Terakhir',
        font: { size: 16, weight: '600' },
        color: '#1e293b',
        padding: { bottom: 20 }
      },
      tooltip: {
        callbacks: {
          label: (context) => `Rp ${context.raw.toLocaleString('id-ID')}`
        }
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          callback: (value) => `Rp${value / 1000}k`
        }
      },
      x: { grid: { display: false } }
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 h-96">
      <Bar data={data} options={options} />
    </div>
  );
};

// --- KOMPONEN AKSI CEPAT (BARU) ---
const QuickActions = () => (
  <div className="bg-white rounded-2xl shadow-sm border border-slate-200">
    <div className="p-5 border-b border-slate-200">
      <h3 className="text-lg font-semibold text-slate-800">Aksi Cepat</h3>
    </div>
    <div className="p-6 space-y-4">
      <Link to="/apotek/penjualan" className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-emerald-600 text-white rounded-lg text-sm font-medium hover:bg-emerald-700 transition shadow-sm">
        <PlusCircle size={18} />
        Buat Penjualan Baru
      </Link>
      <Link to="/apotek/pesan-obat" className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition shadow-sm">
        <FilePlus size={18} />
        Pesan Obat ke PBF
      </Link>
    </div>
  </div>
);

// --- KOMPONEN STOK KRITIS (Desain List Baru) ---
const CriticalStockList = ({ data }) => (
  <div className="bg-white rounded-2xl shadow-sm border border-slate-200">
    <div className="p-5 border-b border-slate-200">
      <h3 className="text-lg font-semibold text-slate-800">Stok Kritis & Terbaru</h3>
    </div>
    <div className="p-3">
      {data.length > 0 ? (
        <ul className="divide-y divide-slate-100 max-h-96 overflow-y-auto">
          {data.map((item, index) => (
            <li key={index} className="flex items-center justify-between p-3 hover:bg-slate-50 rounded-lg">
              <div>
                <p className="text-sm font-semibold text-slate-900">{item.namaObat}</p>
                <p className="text-xs text-slate-500 font-mono">{item.batchId}</p>
              </div>
              <div className="text-right flex-shrink-0 ml-4">
                <p className="text-sm font-bold text-emerald-700">{item.stok.toLocaleString('id-ID')} box</p>
                <p className="text-xs text-orange-600">{item.kadaluarsa}</p>
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <div className="text-center py-10 text-slate-400">
          <Package size={32} className="mx-auto mb-2 opacity-50" />
          <span className="text-sm">Tidak ada data stok.</span>
        </div>
      )}
    </div>
  </div>
);

// --- KOMPONEN PESANAN TERBARU (Tabel) ---
const RecentOrdersTable = ({ data, getStatusBadge }) => (
  <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
    <div className="p-5 border-b border-slate-200">
      <h3 className="text-lg font-semibold text-slate-800">Pesanan Terbaru ke PBF</h3>
    </div>
    <div className="overflow-x-auto">
      <table className="min-w-full">
        <thead className="bg-slate-50">
          <tr className="border-b-2 border-slate-200">
            <th className="px-4 py-3 text-left text-xs font-bold text-slate-600 uppercase">Tanggal</th>
            <th className="px-4 py-3 text-left text-xs font-bold text-slate-600 uppercase">Obat</th>
            <th className="px-4 py-3 text-left text-xs font-bold text-slate-600 uppercase">Jumlah</th>
            <th className="px-4 py-3 text-left text-xs font-bold text-slate-600 uppercase">Status</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {data.length > 0 ? data.map(item => (
            <tr key={item.id} className="hover:bg-blue-50/50 transition-colors">
              <td className="px-4 py-4 whitespace-nowrap">
                <span className="text-sm font-semibold text-slate-900">{formatDate(item.tanggal)}</span>
              </td>
              <td className="px-4 py-4 whitespace-nowrap">
                <span className="text-sm text-slate-600 truncate max-w-xs block">{item.obat}</span>
              </td>
              <td className="px-4 py-4 whitespace-nowrap">
                <span className="text-sm font-medium text-blue-700">{item.jumlah.toLocaleString('id-ID')} box</span>
              </td>
              <td className="px-4 py-4 whitespace-nowrap">
                <span className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full border ${getStatusBadge(item.status)}`}>
                  {item.status}
                </span>
              </td>
            </tr>
          )) : (
            <tr>
              <td colSpan="4" className="text-center py-10 text-slate-400">
                <FileText size={32} className="mx-auto mb-2 opacity-50" />
                <span>Tidak ada pesanan terbaru.</span>
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  </div>
);


// --- KOMPONEN UTAMA DASHBOARD ---
const ApotekDashboard = () => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const username = localStorage.getItem('username');
  const greeting = getGreeting(); // Sapaan dinamis

  const [stats, setStats] = useState({
    totalStok: 0,
    penjualanHariIni: 0,
    pesananAktif: 0,
    akanKadaluarsa: 0.0,
  });
  const [stokTerbaru, setStokTerbaru] = useState([]);
  const [pesananTerbaru, setPesananTerbaru] = useState([]);

  useEffect(() => {
    const fetchDashboardData = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          navigate('/login/apotek');
          return;
        }

        const response = await fetch(`http://localhost:5000/api/apotek/dashboard`, {
          headers: { 'Authorization': `Bearer ${token}` },
        });

        const resultText = await response.text();
        if (!response.ok) {
            throw new Error(`Gagal mengambil data: ${resultText}`);
        }
        
        const result = JSON.parse(resultText);

        if (result.success) {
          setStats(result.data.stats);
          setStokTerbaru(result.data.stokTerbaru);
          setPesananTerbaru(result.data.pesananTerbaru);
        } else {
          throw new Error(result.message || 'Data dasbor tidak tersedia');
        }
      } catch (err) {
        if (err instanceof SyntaxError) {
             setError('Menerima data tidak valid dari server. Silakan coba lagi nanti.');
             toast.error('Menerima data tidak valid dari server.');
        } else {
            setError(err.message);
            toast.error(err.message);
        }
      } finally {
        setIsLoading(false);
      }
    };

    fetchDashboardData();
  }, [navigate]);

  const handleLogout = () => {
    localStorage.clear();
    navigate('/');
  };

  const getStatusBadge = (status) => {
    const styles = {
      'Menunggu Konfirmasi': 'bg-amber-50 text-amber-700 border-amber-200',
      'Perlu Dikirim': 'bg-orange-50 text-orange-700 border-orange-200',
      'Dikirim': 'bg-blue-50 text-blue-700 border-blue-200',
      'Selesai': 'bg-emerald-50 text-emerald-700 border-emerald-200',
      'Dibatalkan': 'bg-red-50 text-red-700 border-red-200',
      'Pembatalan Diajukan': 'bg-yellow-50 text-yellow-700 border-yellow-200'
    };
    return styles[status] || 'bg-slate-50 text-slate-700 border-slate-200';
  };
  
  if (isLoading) {
    return (
       <div className="flex flex-col justify-center items-center h-screen bg-gradient-to-br from-slate-50 via-white to-emerald-50">
          <div className="relative">
            <Loader2 className="animate-spin h-12 w-12 text-emerald-600" />
            <div className="absolute inset-0 h-12 w-12 rounded-full border-4 border-emerald-200 animate-ping opacity-20"></div>
          </div>
          <p className="mt-4 text-slate-700 font-medium">Memuat dasbor Apotek...</p>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-slate-50 via-white to-emerald-50">
      <div className="flex-1 flex flex-col">
        <NavbarApotek onLogout={handleLogout} />
        
        <main className="flex-1 overflow-auto pt-[72px]">
          <div className="max-w-screen-xl mx-auto px-6 py-8">
            
            {/* Header Section */}
            <div className="mb-8 relative">
              <div className="absolute -top-20 -left-20 w-72 h-72 bg-emerald-200 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob"></div>
              <div className="absolute -top-20 -right-20 w-72 h-72 bg-teal-200 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000"></div>
              
              <div className="relative">
                <h1 className="text-4xl font-bold text-slate-900">
                  {greeting}, <span className="bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">{username || 'Pengguna'}!</span>
                </h1>
                <p className="text-slate-600 text-lg mt-2">
                  Berikut adalah ringkasan aktivitas apotek Anda hari ini.
                </p>
                <div className="flex items-center gap-2 mt-2 text-sm text-slate-500">
                  <Calendar size={16} />
                  <span>{new Date().toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
                </div>
              </div>
            </div>
            
            {error && (
              <div className="p-4 mb-6 bg-red-50 text-red-700 rounded-2xl border border-red-200 flex items-center gap-3 shadow-sm">
                <AlertTriangle size={20} />
                <span className="font-medium">Error: {error}</span>
              </div>
            )}

            {/* --- STRUKTUR UTAMA DASHBOARD (BARU) --- */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

              {/* --- Kolom Utama (Kiri) --- */}
              <div className="lg:col-span-2 space-y-6">
                
                {/* Stats Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <StatCard 
                    icon={<Box />} 
                    value={stats.totalStok} 
                    label="Total Stok Obat" 
                    unit="box" 
                    color="emerald"
                  />
                  <StatCard 
                    icon={<ShoppingBag />} 
                    value={stats.penjualanHariIni} 
                    label="Penjualan Hari Ini" 
                    isCurrency={true}
                    color="blue"
                  />
                  <StatCard 
                    icon={<FileText />} 
                    value={stats.pesananAktif} 
                    label="Pesanan Aktif"
                    color="purple"
                  />
                  <StatCard 
                    icon={<AlertTriangle />} 
                    value={stats.akanKadaluarsa} 
                    label="Obat Akan Kedaluwarsa" 
                    color="orange"
                  />
                </div>

                {/* Grafik Penjualan */}
                <SalesChart />
                
                {/* Tabel Pesanan Terbaru */}
                <RecentOrdersTable data={pesananTerbaru} getStatusBadge={getStatusBadge} />

              </div>

              {/* --- Sidebar Kanan --- */}
              <div className="lg:col-span-1 space-y-6">
                
                {/* Aksi Cepat */}
                <QuickActions />

                {/* Stok Kritis */}
                <CriticalStockList data={stokTerbaru} />
                
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

export default ApotekDashboard;