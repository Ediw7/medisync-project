import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import SidebarPbf from '../../components/SidebarPbf';
import NavbarPbf from '../../components/NavbarPbf';
import {
  ShoppingCart,
  Truck,
  CheckCircle2, // Diganti dari CheckCircle
  Box,
  Loader2,
  TrendingUp,
  ArrowUpRight,
  Calendar,
  Package,
  AlertTriangle,
  FileText,
} from 'lucide-react';
import { toast } from 'react-hot-toast';

const PbfDashboard = () => {
  const navigate = useNavigate();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const username = localStorage.getItem('username');

  const [stats, setStats] = useState({
    totalDipesan: 0,
    pengirimanAktif: 0,
    stokTersedia: 0,
    pesananBelumSelesai: 0,
  });
  const [stokTerbaru, setStokTerbaru] = useState([]);
  const [pesananTerbaru, setPesananTerbaru] = useState([]);

  useEffect(() => {
    const fetchDashboardData = async () => {
      setIsLoading(true);
      setError(null);
      let token;
      try {
        token = localStorage.getItem('token');
        if (!token) {
          navigate('/login/pbf');
          return;
        }

        const response = await fetch('http://localhost:5000/api/pbf/dashboard', {
          headers: { Authorization: `Bearer ${token}` },
        });

        const contentType = response.headers.get('content-type');
        if (!response.ok) {
          let errorMsg = `Gagal mengambil data dasbor: Status ${response.status}`;
          if (contentType && contentType.indexOf('application/json') !== -1) {
            const errData = await response.json();
            errorMsg = errData.message || errorMsg;
          } else {
            errorMsg = (await response.text()) || errorMsg;
          }
          throw new Error(errorMsg);
        }

        if (contentType && contentType.indexOf('application/json') !== -1) {
          const result = await response.json();
          if (result.success && result.data) {
            setStats(
              result.data.stats || {
                totalDipesan: 0,
                pengirimanAktif: 0,
                stokTersedia: 0,
                pesananBelumSelesai: 0,
              }
            );
            setStokTerbaru(result.data.stokTerbaru || []);
            setPesananTerbaru(result.data.pesananTerbaru || []);
          } else {
            throw new Error(result.message || 'Data dasbor tidak tersedia atau format salah.');
          }
        } else {
          const resultText = await response.text();
          console.warn('Received non-JSON response:', resultText);
          throw new Error('Menerima format data tidak terduga dari server.');
        }
      } catch (err) {
        setError(err.message);
        toast.error(err.message || 'Gagal memuat data dasbor.');
        if (
          (err.message.includes('401') ||
            err.message.includes('403') ||
            err.message.includes('login')) &&
          token
        ) {
          navigate('/login/pbf');
        } else if (!token) {
          navigate('/login/pbf');
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

  const StatCard = ({ icon, value, label, unit, trend, color = 'emerald', isCurrency = false }) => {
    const colorClasses = {
      emerald: {
        bg: 'bg-gradient-to-br from-emerald-400 to-emerald-600',
        text: 'text-emerald-600',
        bgLight: 'bg-emerald-50',
      },
      blue: {
        bg: 'bg-gradient-to-br from-blue-400 to-blue-600',
        text: 'text-blue-600',
        bgLight: 'bg-blue-50',
      },
      purple: {
        bg: 'bg-gradient-to-br from-purple-400 to-purple-600',
        text: 'text-purple-600',
        bgLight: 'bg-purple-50',
      },
      orange: {
        bg: 'bg-gradient-to-br from-orange-400 to-orange-600',
        text: 'text-orange-600',
        bgLight: 'bg-orange-50',
      },
    };
    const selectedColor = colorClasses[color] || colorClasses.emerald;

    return (
      <div className="group relative bg-white p-5 rounded-xl shadow-sm border border-slate-200 hover:shadow-lg hover:border-slate-300 transition-all duration-300 overflow-hidden">
        <div
          className={`absolute -top-4 -right-4 w-24 h-24 ${selectedColor.bgLight} rounded-full opacity-50 blur-lg group-hover:scale-125 transition-transform duration-500`}
        ></div>
        <ArrowUpRight
          className="absolute top-4 right-4 text-slate-300 group-hover:text-slate-400 transition-colors"
          size={18}
        />

        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-3">
            <div className={`p-2.5 rounded-lg ${selectedColor.bg} shadow-md`}>
              {React.cloneElement(icon, { className: 'text-white', size: 20 })}
            </div>
            {trend && (
              <span
                className={`flex items-center text-xs font-semibold ${selectedColor.text} ${selectedColor.bgLight} px-2 py-1 rounded-full`}
              >
                <TrendingUp size={12} className="mr-1" />
                {trend}
              </span>
            )}
          </div>

          <p className="text-3xl font-bold text-slate-900 mb-0.5">
            {isCurrency ? `Rp ${value.toLocaleString('id-ID')}` : value.toLocaleString('id-ID')}
            {unit && <span className="text-lg font-medium text-slate-500 ml-1">{unit}</span>}
          </p>
          <p className="text-sm text-slate-600 font-medium">{label}</p>
        </div>
      </div>
    );
  };

  const getStatusBadge = (status) => {
    const styles = {
      Diproses: 'bg-amber-50 text-amber-700 border-amber-200',
      'Menunggu Konfirmasi': 'bg-amber-50 text-amber-700 border-amber-200',
      Diterima: 'bg-green-50 text-green-700 border-green-200',
      Dikirim: 'bg-blue-50 text-blue-700 border-blue-200',
      Selesai: 'bg-emerald-50 text-emerald-700 border-emerald-200',
      Dibatalkan: 'bg-red-50 text-red-700 border-red-200',
      'Pembatalan Diajukan': 'bg-yellow-50 text-yellow-700 border-yellow-200',
      'Perlu Dikirim': 'bg-orange-50 text-orange-700 border-orange-200',
    };
    return styles[status] || 'bg-slate-50 text-slate-700 border-slate-200';
  };

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return '-';
      return date.toLocaleDateString('id-ID', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        timeZone: 'UTC',
      });
    } catch (e) {
      return '-';
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col justify-center items-center h-screen bg-gradient-to-br from-slate-50 via-white to-emerald-50">
        <div className="relative">
          <Loader2 className="animate-spin h-12 w-12 text-emerald-600" />
          <div className="absolute inset-0 h-12 w-12 rounded-full border-4 border-emerald-200 animate-ping opacity-20"></div>
        </div>
        <p className="mt-4 text-slate-700 font-medium">Memuat dasbor PBF...</p>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-slate-50">
      <SidebarPbf isCollapsed={isCollapsed} setIsCollapsed={setIsCollapsed} />
      <div
        className={`flex-1 flex flex-col transition-all duration-300 ${isCollapsed ? 'ml-16' : 'ml-64'}`}
      >
        <NavbarPbf onLogout={handleLogout} username={username} />

        <main className="flex-1 overflow-auto pt-[72px] px-12 py-8">
          <div className="max-w-7xl mx-auto">
            <div className="mb-10 relative">
              <div className="absolute -top-20 -left-20 w-72 h-72 bg-emerald-200 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob"></div>
              <div className="absolute -top-20 -right-20 w-72 h-72 bg-teal-200 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000"></div>

              <div className="relative">
                <div className="flex items-center gap-3 mb-3">
                  <div className="flex items-center justify-center w-12 h-12 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl shadow-lg">
                    <Truck className="text-white" size={24} />
                  </div>
                  <div>
                    <h1 className="text-4xl font-bold bg-gradient-to-r from-slate-900 via-emerald-900 to-teal-900 bg-clip-text text-transparent">
                      Dasbor PBF
                    </h1>
                  </div>
                </div>
                <p className="text-slate-600 text-lg flex items-center gap-2">
                  <span>Selamat datang kembali,</span>
                  <span className="font-semibold text-emerald-700">{username || 'PBF'}</span>
                  <span>👋</span>
                </p>
                <div className="flex items-center gap-2 mt-2 text-sm text-slate-500">
                  <Calendar size={16} />
                  <span>
                    {new Date().toLocaleDateString('id-ID', {
                      weekday: 'long',
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })}
                  </span>
                </div>
              </div>
            </div>

            {error && (
              <div className="p-4 mb-6 bg-red-50 text-red-700 rounded-2xl border border-red-200 flex items-center gap-3 shadow-sm">
                <AlertTriangle size={20} />
                <span className="font-medium">Error: {error}</span>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <StatCard
                icon={<ShoppingCart />}
                value={stats.totalDipesan}
                label="Total Pesanan Diterima"
                unit=""
                color="emerald"
              />
              <StatCard
                icon={<Truck />}
                value={stats.pengirimanAktif}
                label="Pengiriman ke Apotek"
                unit=""
                color="purple"
              />
              <StatCard
                icon={<Box />}
                value={stats.stokTersedia}
                label="Total Stok Tersedia"
                unit="Pcs"
                color="blue"
              />
              <StatCard
                icon={<FileText />}
                value={stats.pesananBelumSelesai}
                label="Pesanan Belum Selesai"
                unit=""
                color="orange"
              />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden hover:shadow-lg transition-shadow duration-300">
                <div className="bg-gray-50 px-6 py-4 border-b border-slate-200">
                  <h2 className="text-xl font-bold text-emerald-800 flex items-center gap-2">
                    <Box size={20} />
                    Stok Obat Terbaru
                  </h2>
                </div>
                <div className="overflow-x-auto">
                  <table className="min-w-full">
                    <thead className="bg-slate-50 border-b border-slate-200">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                          Batch ID
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                          Nama Obat
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                          Stok
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                          Kedaluwarsa
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-slate-100">
                      {stokTerbaru.length > 0 ? (
                        stokTerbaru.map((item, index) => (
                          <tr
                            key={item.batch_id || index}
                            className="hover:bg-emerald-50/50 transition-colors"
                          >
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-900 font-mono">
                              {item.batch_id}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-700">
                              {item.nama_obat}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-emerald-700">
                              {item.stok.toLocaleString('id-ID')} Pcs
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-orange-600 font-medium">
                              {formatDate(item.tanggal_kadaluarsa)}
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan="4" className="text-center py-10 text-slate-500">
                            <Package size={32} className="mx-auto mb-2 opacity-50" />
                            Tidak ada data stok terbaru.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden hover:shadow-lg transition-shadow duration-300">
                <div className="bg-gray-50 px-6 py-4 border-b border-slate-200">
                  <h2 className="text-xl font-bold text-emerald-800 flex items-center gap-2">
                    <ShoppingCart size={20} />
                    Pesanan Terbaru dari Apotek
                  </h2>
                </div>
                <div className="overflow-x-auto">
                  <table className="min-w-full">
                    <thead className="bg-slate-50 border-b border-slate-200">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                          Nama Apotek
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                          Obat & Batch
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                          Jumlah
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                          Status
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-slate-100">
                      {pesananTerbaru.length > 0 ? (
                        pesananTerbaru.map((item) => (
                          <tr key={item.id} className="hover:bg-blue-50/50 transition-colors">
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-900">
                              {item.namaApotek}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className="text-sm text-slate-700 block">{item.obat}</span>
                              <span className="text-xs text-slate-500 font-mono bg-slate-100 px-1.5 py-0.5 rounded">
                                Batch: {item.batchId}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-emerald-700">
                              {(item.stok || 0).toLocaleString('id-ID')} Pcs
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm">
                              <span
                                className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full border ${getStatusBadge(item.status)}`}
                              >
                                {item.status}
                              </span>
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan="4" className="text-center py-10 text-slate-500">
                            <FileText size={32} className="mx-auto mb-2 opacity-50" />
                            Tidak ada pesanan terbaru.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>

      <style jsx>{`
        @keyframes blob {
          0%,
          100% {
            transform: translate(0, 0) scale(1);
          }
          33% {
            transform: translate(30px, -50px) scale(1.1);
          }
          66% {
            transform: translate(-20px, 20px) scale(0.9);
          }
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

export default PbfDashboard;
