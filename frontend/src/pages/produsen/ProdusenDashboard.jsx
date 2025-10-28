import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import SidebarProdusen from '../../components/SidebarProdusen';
import NavbarProdusen from '../../components/NavbarProdusen';
import {
  Truck,
  Box,
  BarChart,
  AlertCircle,
  ArrowRight,
  BellRing,
  ShoppingCart,
  Factory,
  Loader2,
  TrendingUp,
  ArrowUpRight,
  Calendar
} from 'lucide-react';
import {
  FaHome,

} from "react-icons/fa";
import { toast } from 'react-hot-toast';

const ProdusenDashboard = () => {
  const navigate = useNavigate();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [username, setUsername] = useState('');
  const [stats, setStats] = useState({
    totalPesanan: 0,
    pengirimanAktif: 0,
    stokTersedia: 0,
    efisiensiProduksi: 0.0,
  });
  const [aktivitasTerbaru, setAktivitasTerbaru] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
        setIsLoading(true);
        setError(null);
        let token, storedUsername;

        try {
            token = localStorage.getItem('token');
            storedUsername = localStorage.getItem('username');
            if (!token) {
                navigate('/login/produsen');
                return;
            }
            if (storedUsername) {
                setUsername(storedUsername);
            }

            const [riwayatResponse, pesananResponse, produksiResponse] = await Promise.all([
                fetch('http://localhost:5000/api/produsen/riwayat-distribusi', { headers: { Authorization: `Bearer ${token}` } }),
                fetch('http://localhost:5000/api/produsen/pesanan-masuk', { headers: { Authorization: `Bearer ${token}` } }),
                fetch('http://localhost:5000/api/produksi/jadwal', { headers: { Authorization: `Bearer ${token}` } })
            ]);

            let riwayatResult = { success: true, data: [] };
            if (riwayatResponse.ok) {
                riwayatResult = await riwayatResponse.json();
                if (!riwayatResult.success) console.warn('Respons riwayat tidak berhasil:', riwayatResult.message);
            } else {
                console.warn('Gagal mengambil data riwayat:', riwayatResponse.status);
            }

            let pesananResult = { success: true, data: [] };
            if (pesananResponse.ok) {
                pesananResult = await pesananResponse.json();
                if (!pesananResult.success) console.warn('Respons pesanan tidak berhasil:', pesananResult.message);
            } else {
                console.warn('Gagal mengambil data pesanan:', pesananResponse.status);
            }

            let produksiResult = { success: true, data: [] };
            if (produksiResponse.ok) {
                produksiResult = await produksiResponse.json();
                if (!produksiResult.success) console.warn('Respons produksi tidak berhasil:', produksiResult.message);
            } else {
                console.warn('Gagal mengambil data produksi:', produksiResponse.status, ' - Menggunakan fallback.');
                produksiResult.data = [
                    { id: 76, batch_id: 'Test-0009', nama_obat: 'paracetamol', jumlah: 7988, tanggal_produksi: '2025-09-20', status: 'Tercatat di Blockchain' },
                ];
            }

            const mappedRiwayat = (riwayatResult.data || [])
              .filter(item => item.status === 'Dikirim' || item.status === 'Selesai')
              .map(item => ({
                id: `riwayat-${item.id}`,
                type: 'Pengiriman',
                title: 'Pengiriman',
                description: `Pengiriman ke ${item.nama_pbf || '-'} (${item.nomor_surat_jalan || 'N/A'})`,
                status: item.status_blockchain === 'DITERIMA_PBF' ? 'Diterima' :
                        item.status_blockchain === 'DIKIRIM_KE_PBF' ? 'Dikirim' :
                        item.status === 'Selesai' ? 'Diterima' : 'Dikirim',
                timestamp: item.tanggal_pengiriman ? new Date(item.tanggal_pengiriman) : new Date(),
              }));

            const mappedPesanan = (pesananResult.data || []).map(item => ({
              id: `pesanan-${item.id}`,
              type: 'Pesanan',
              title: 'Pesanan Baru',
              description: `Pesanan ${item.nomor_po} dari ${item.nama_pbf || '-'} (${item.status})`,
              status: item.status,
              timestamp: new Date(item.tanggal_pesanan),
            }));

            const mappedProduksiSelesai = (produksiResult.data || [])
              .filter(item => item.status === 'Selesai' || item.status === 'Tercatat di Blockchain')
              .map(item => ({
                  id: `produksi-${item.id}`,
                  type: 'Produksi',
                  title: 'Produksi Selesai',
                  description: `Batch ${item.batch_id} (${item.nama_obat}) tercatat di Blockchain`,
                  status: item.status,
                  timestamp: new Date(item.tanggal_produksi),
              }));

              const combinedActivities = [...mappedRiwayat, ...mappedPesanan, ...mappedProduksiSelesai]
                  .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
                  .slice(0, 5)
                  .map(item => ({
                      id: item.id,
                      title: item.title,
                      description: item.description,
                      type: item.type,
                      timestamp: item.timestamp,
                      status: item.status
                  }));

                setAktivitasTerbaru(combinedActivities);

              const totalPesanan = mappedPesanan.length;
              const pengirimanAktif = mappedRiwayat.filter(item => item.status === 'Dikirim').length;
              const stokTersedia = (produksiResult.data || []).reduce((acc, cur) => acc + (cur.jumlah || 0), 0);
              const totalProduksi = (produksiResult.data || []).length;
              const produksiSelesai = (produksiResult.data || []).filter(p => p.status === 'Selesai' || p.status === 'Tercatat di Blockchain').length;

              setStats({
                  totalPesanan,
                  pengirimanAktif,
                  stokTersedia,
                  efisiensiProduksi: totalProduksi > 0 ? parseFloat(((produksiSelesai / totalProduksi) * 100).toFixed(1)) : 0,
              });

        } catch (error) {
            setError(error.message);
            if ((error.message.includes('401') || error.message.includes('403') || error.message.includes('login')) && token) {
                navigate('/login/produsen');
            } else if (!token) {
                 navigate('/login/produsen');
            }
             toast.error(error.message || 'Terjadi kesalahan');
        } finally {
            setIsLoading(false);
        }
    };
    fetchData();
  }, [navigate]);

  const handleLogout = () => {
    localStorage.clear();
    navigate('/');
  };

  const StatCard = ({ icon, value, label, unit, isCurrency = false, trend, color = "emerald" }) => {
    const colorClasses = {
      emerald: { bg: "bg-gradient-to-br from-emerald-400 to-emerald-600", text: "text-emerald-600", bgLight: "bg-emerald-50" },
      blue: { bg: "bg-gradient-to-br from-blue-400 to-blue-600", text: "text-blue-600", bgLight: "bg-blue-50" },
      purple: { bg: "bg-gradient-to-br from-purple-400 to-purple-600", text: "text-purple-600", bgLight: "bg-purple-50" },
      orange: { bg: "bg-gradient-to-br from-orange-400 to-orange-600", text: "text-orange-600", bgLight: "bg-orange-50" },
    };
    const selectedColor = colorClasses[color] || colorClasses.emerald;

    return (
      <div className="group relative bg-white p-6 rounded-2xl shadow-sm border border-slate-200 hover:shadow-xl hover:border-slate-300 transition-all duration-300 overflow-hidden">
        <div className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-br ${selectedColor.bg} opacity-5 rounded-full -mr-16 -mt-16 group-hover:scale-150 transition-transform duration-500`}></div>

        <div className="relative flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-3">
              <div className={`p-2.5 rounded-xl bg-gradient-to-br ${selectedColor.bg} shadow-lg`}>
                {React.cloneElement(icon, { className: "text-white", size: 24 })}
              </div>
              {trend && (
                <span className="flex items-center text-xs font-semibold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-full">
                  <TrendingUp size={12} className="mr-1" />
                  {trend}
                </span>
              )}
            </div>

            <p className="text-3xl font-bold text-slate-900 mb-1">
              {isCurrency ? `Rp ${value.toLocaleString('id-ID')}` : value.toLocaleString('id-ID')}
              {unit && <span className="text-lg font-medium text-slate-500 ml-1">{unit}</span>}
            </p>
            <p className="text-sm text-slate-600 font-medium">{label}</p>
          </div>

          <ArrowUpRight className="text-slate-300 group-hover:text-slate-400 transition-colors" size={20} />
        </div>
      </div>
    );
  };

   const getActivityIcon = (type) => {
        switch (type) {
            case 'Pesanan': return <ShoppingCart size={18} className="text-purple-600" />;
            case 'Pengiriman': return <Truck size={18} className="text-blue-600" />;
            case 'Produksi': return <Factory size={18} className="text-emerald-600" />;
            default: return <AlertCircle size={18} className="text-gray-600" />;
        }
    };

    const getActivityColor = (type) => {
         switch (type) {
            case 'Pesanan': return 'bg-purple-50';
            case 'Pengiriman': return 'bg-blue-50';
            case 'Produksi': return 'bg-emerald-50';
            default: return 'bg-gray-50';
        }
    };

    const AktivitasItem = ({ icon, color, jenis, deskripsi, waktu }) => (
      <div className="flex items-start space-x-4 p-4 hover:bg-gray-50 rounded-lg transition-colors duration-200">
        <div className={`flex-shrink-0 p-3 rounded-full ${color}`}>
          {icon}
        </div>
        <div className="flex-1">
          <p className="font-semibold text-gray-900">{jenis}</p>
          <p className="text-gray-700 text-sm">{deskripsi}</p>
          <p className="text-gray-500 text-xs mt-1">
            {waktu.toLocaleString('id-ID', {
              day: 'numeric', month: 'short', year: 'numeric',
              hour: '2-digit', minute: '2-digit'
           })}
          </p>
        </div>
      </div>
    );

  if (isLoading) {
    return (
       <div className="flex flex-col justify-center items-center h-screen bg-gradient-to-br from-slate-50 via-white to-emerald-50">
          <div className="relative">
            <Loader2 className="animate-spin h-12 w-12 text-emerald-600" />
            <div className="absolute inset-0 h-12 w-12 rounded-full border-4 border-emerald-200 animate-ping opacity-20"></div>
          </div>
          <p className="mt-4 text-slate-700 font-medium">Memuat dasbor Produsen...</p>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-slate-50 via-white to-emerald-50">
      <SidebarProdusen isCollapsed={isCollapsed} setIsCollapsed={setIsCollapsed} />
      <div className={`flex-1 flex flex-col transition-all duration-300 ${isCollapsed ? 'ml-16' : 'ml-64'}`}>
        <NavbarProdusen onLogout={handleLogout} username={username} />

        <main className="flex-1 overflow-auto pt-[72px] px-12 py-8">
          <div className="max-w-7xl mx-auto">
            <div className="mb-10 relative">
              <div className="absolute -top-20 -left-20 w-72 h-72 bg-emerald-200 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob"></div>
              <div className="absolute -top-20 -right-20 w-72 h-72 bg-teal-200 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000"></div>

              <div className="relative">
                <div className="flex items-center gap-3 mb-3">
                  <div className="flex items-center justify-center w-12 h-12 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl shadow-lg">
                    <FaHome className="text-white" size={24} />
                  </div>
                  <div>
                    <h1 className="text-4xl font-bold bg-gradient-to-r from-slate-900 via-emerald-900 to-teal-900 bg-clip-text text-transparent">
                      Dasbor Produsen
                    </h1>
                  </div>
                </div>
                <p className="text-slate-600 text-lg flex items-center gap-2">
                  <span>Selamat datang kembali,</span>
                  <span className="font-semibold text-emerald-700">{username || 'Produsen'}</span>
                  <span>👋</span>
                </p>
                <div className="flex items-center gap-2 mt-2 text-sm text-slate-500">
                  <Calendar size={16} />
                  <span>{new Date().toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
                </div>
              </div>
            </div>

            {error && (
              <div className="p-4 mb-6 bg-red-50 text-red-700 rounded-2xl border border-red-200 flex items-center gap-3 shadow-sm">
                <AlertCircle size={20} />
                <span className="font-medium">Error: {error}</span>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <StatCard
                icon={<ShoppingCart />}
                value={stats.totalPesanan}
                label="Total Pesanan Masuk"
                unit=""
                color="emerald"
              />
              <StatCard
                icon={<Truck />}
                value={stats.pengirimanAktif}
                label="Pengiriman Aktif"
                unit=""
                color="purple"
              />
              <StatCard
                icon={<Box />}
                value={stats.stokTersedia}
                label="Total Stok Tersedia"
                unit="Pcs"
                color="orange"
              />
              <StatCard
                icon={<BarChart />}
                value={stats.efisiensiProduksi}
                label="Efisiensi Produksi"
                unit="%"
                color="blue"
              />
            </div>

            <div className="bg-white p-6 rounded-2xl shadow-xl border border-gray-100">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
                    <BellRing size={24} className="text-emerald-600" />
                    Aktivitas Terbaru
                </h2>
                <button
                  
                  className="inline-flex items-center text-emerald-600 hover:text-emerald-700 font-medium transition-colors group text-sm"
                >
                  Lihat Semua
                  <ArrowRight size={16} className="ml-1 group-hover:translate-x-1 transition-transform" />
                </button>
              </div>
              <div className="space-y-2">
                {isLoading ? (
                  <div className="flex justify-center items-center h-40">
                    <Loader2 className="animate-spin h-8 w-8 text-emerald-500" />
                  </div>
                ) : aktivitasTerbaru.length > 0 ? (
                  aktivitasTerbaru.map((aktivitas) => (
                    <AktivitasItem
                      key={aktivitas.id}
                      icon={getActivityIcon(aktivitas.type)}
                      color={getActivityColor(aktivitas.type)}
                      jenis={aktivitas.title}
                      deskripsi={aktivitas.description}
                      waktu={aktivitas.timestamp}
                    />
                  ))
                ) : (
                  <p className="text-gray-500 text-center py-6">Tidak ada aktivitas terbaru saat ini.</p>
                )}
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

export default ProdusenDashboard;
