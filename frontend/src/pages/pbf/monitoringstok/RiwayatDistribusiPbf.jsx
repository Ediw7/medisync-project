import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import SidebarPbf from '../../../components/SidebarPbf';
import NavbarPbf from '../../../components/NavbarPbf';
import {
  Search,
  Package,
  Truck,
  Box,
  AlertTriangle,
  Loader2,
  TrendingUp,
  ArrowUpRight,
  FileText,
  Calendar 
} from 'lucide-react';

import { toast } from 'react-hot-toast';

const RiwayatDistribusiPbf = () => {
  const navigate = useNavigate();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [distribusiData, setDistribusiData] = useState([]);
  const [stats, setStats] = useState({
    totalStok: 0,
    distribusiBulanIni: 0,
    stokMenipis: 0,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('Semua');
  const username = localStorage.getItem('username'); 

  
  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      setError(null);
      let token;
      try {
        token = localStorage.getItem('token');
        if (!token) throw new Error('Silakan login terlebih dahulu');

        const [stokResponse, distribusiResponse] = await Promise.all([
          fetch('http://localhost:5000/api/pbf/stok', { 
            headers: { 'Authorization': `Bearer ${token}` }
          }),
          fetch('http://localhost:5000/api/pbf/riwayat-distribusi', {
            headers: { 'Authorization': `Bearer ${token}` }
          })
        ]);

        if (!stokResponse.ok) {
           const stokError = await stokResponse.text();
           console.warn(`Gagal mengambil data statistik stok: ${stokResponse.status} - ${stokError}`);
            setStats({ totalStok: 0, distribusiBulanIni: 0, stokMenipis: 0 });
        } else {
             const stokResult = await stokResponse.json();
             if (stokResult.success && stokResult.data.stats) {
                 setStats(stokResult.data.stats); 
             } else {
                  console.warn('Data statistik stok tidak valid:', stokResult.message);
                  setStats({ totalStok: 0, distribusiBulanIni: 0, stokMenipis: 0 }); 
             }
        }

        if (!distribusiResponse.ok) {
           const distError = await distribusiResponse.text();
           throw new Error(`Gagal mengambil data riwayat distribusi: ${distribusiResponse.status} - ${distError}`);
        }
        const distribusiResult = await distribusiResponse.json();
        if (!distribusiResult.success) {
          throw new Error(distribusiResult.message || 'Respons data distribusi tidak berhasil.');
        }

        const mappedData = (distribusiResult.data || []).map(item => ({
          id: item.id,
          nomor_pesanan: item.nomor_pesanan,
          tujuan: item.nama_apotek || 'N/A',
          nomor_surat_jalan: item.nomor_surat_jalan,
          jumlah_total_obat: item.jumlah_total_obat || 0,
          tanggal_pengiriman: item.tanggal_pengiriman,
          status_pengiriman: item.status === 'Selesai' ? 'Diterima' : (item.status === 'Dikirim' ? 'Dikirim' : item.status),
        }));
        setDistribusiData(mappedData);

      } catch (error) {
        setError(error.message);
        toast.error(error.message || 'Gagal memuat data.');
        if ((error.message.includes('401') || error.message.includes('403') || error.message.includes('login')) && token) {
            navigate('/login/pbf');
        } else if (!token) {
             navigate('/login/pbf');
        }
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

  const filteredData = useMemo(() => {
    return distribusiData
      .filter(item => {
        if (statusFilter === 'Semua') return true;
        return item.status_pengiriman === statusFilter;
      })
      .filter(item => {
        const searchableString = `${item.nomor_pesanan || ''} ${item.nomor_surat_jalan || ''} ${item.tujuan || ''}`.toLowerCase();
        return searchableString.includes(searchTerm.toLowerCase());
      });
  }, [distribusiData, searchTerm, statusFilter]);

  // --- KARTU STATISTIK (Dari Desain Target) ---
  const StatCard = ({ icon, value, label, unit, trend, color = "emerald", isCurrency = false }) => {
    const colorClasses = {
      emerald: { bg: "bg-gradient-to-br from-emerald-400 to-emerald-600", text: "text-emerald-600", bgLight: "bg-emerald-50" },
      blue: { bg: "bg-gradient-to-br from-blue-400 to-blue-600", text: "text-blue-600", bgLight: "bg-blue-50" },
      purple: { bg: "bg-gradient-to-br from-purple-400 to-purple-600", text: "text-purple-600", bgLight: "bg-purple-50" },
      orange: { bg: "bg-gradient-to-br from-orange-400 to-orange-600", text: "text-orange-600", bgLight: "bg-orange-50" },
      red: { bg: "bg-gradient-to-br from-red-400 to-red-600", text: "text-red-600", bgLight: "bg-red-50" },
    };
    const selectedColor = colorClasses[color] || colorClasses.emerald;

    return (
      <div className="group relative bg-white p-5 rounded-xl shadow-sm border border-slate-200 hover:shadow-lg hover:border-slate-300 transition-all duration-300 overflow-hidden">
        <div className={`absolute -top-4 -right-4 w-24 h-24 ${selectedColor.bgLight} rounded-full opacity-50 blur-lg group-hover:scale-125 transition-transform duration-500`}></div>
        <ArrowUpRight className="absolute top-4 right-4 text-slate-300 group-hover:text-slate-400 transition-colors" size={18} />

        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-3">
            <div className={`p-2.5 rounded-lg ${selectedColor.bg} shadow-md`}>
              {React.cloneElement(icon, { className: "text-white", size: 20 })}
            </div>
            {trend && (
              <span className={`flex items-center text-xs font-semibold ${selectedColor.text} ${selectedColor.bgLight} px-2 py-1 rounded-full`}>
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

  // --- BADGE STATUS (Tetap dari PBF) ---
  const getStatusBadge = (status) => {
    switch (status) {
      case 'Dikirim': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'Diterima': return 'bg-green-100 text-green-800 border-green-200';
      default: return 'bg-slate-100 text-slate-800 border-slate-200';
    }
  };

   // --- RENDER LOADING (Dari Desain Target) ---
   if (isLoading && distribusiData.length === 0) {
     return (
       <div className="flex flex-col justify-center items-center h-screen bg-gradient-to-br from-slate-50 via-white to-emerald-50">
          <div className="relative">
            <Loader2 className="animate-spin h-12 w-12 text-emerald-600" />
            <div className="absolute inset-0 h-12 w-12 rounded-full border-4 border-emerald-200 animate-ping opacity-20"></div>
          </div>
          <p className="mt-4 text-slate-700 font-medium">Memuat Riwayat Distribusi...</p>
      </div>
    );
  }

  // --- RENDER UTAMA ---
  return (
    <div className="flex min-h-screen bg-slate-50">
      <SidebarPbf isCollapsed={isCollapsed} setIsCollapsed={setIsCollapsed} />
      <div className={`flex-1 flex flex-col transition-all duration-300 ${isCollapsed ? 'ml-16' : 'ml-64'}`}>
        <NavbarPbf onLogout={handleLogout} username={username}/>

        <main className="flex-1 overflow-auto pt-[72px] px-12 py-8">
           <div className="max-w-7xl mx-auto">
           
            {/* HEADER (Dari Desain Target) */}
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
                      Riwayat Distribusi
                    </h1>
                     <p className="text-slate-600 text-lg mt-1">Lacak pengiriman obat yang telah Anda distribusikan ke Apotek.</p>
                  </div>
                </div>
                 <div className="flex items-center gap-2 mt-2 text-sm text-slate-500">
                  <Calendar size={16} />
                  <span>{new Date().toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
                </div>
              </div>
            </div>

              {/* ERROR INLINE (Dari Desain Target) */}
              {error && (
                 <div className="p-4 mb-6 bg-red-50 text-red-700 rounded-lg border border-red-200 flex items-center gap-2">
                   <AlertTriangle size={18} /> Error: {error}
                 </div>
               )}

              {/* KARTU STATISTIK (Sama) */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                   <StatCard
                    icon={<Box />}
                    value={stats.totalStok}
                    label="Total Stok PBF"
                    unit="Pcs"
                    color="emerald"
                  />
                  <StatCard
                    icon={<Truck />}
                    value={stats.distribusiBulanIni}
                    label="Distribusi Bulan Ini"
                    unit="Pcs"
                    color="blue"
                  />
                  <StatCard
                    icon={<AlertTriangle />}
                    value={stats.stokMenipis} 
                    label="Item Stok Menipis"
                    unit="Jenis" 
                    color="orange"
                  />
              </div>
  
              {/* KARTU TABEL (Dari Desain Target) */}
              <div className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden relative z-10">
                <div className="p-4 border-b border-slate-200 flex flex-col sm:flex-row justify-between items-center gap-4">
                  {/* TAB (Dari Desain Target) */}
                  <div className="flex overflow-x-auto sm:overflow-visible w-full sm:w-auto">
                    <div className="flex space-x-2 bg-slate-100 p-1.5 rounded-lg">
                      <Link
                        to="/pbf/monitoring-stok" // Link PBF
                        className="py-2 px-3 text-sm font-medium text-slate-600 hover:text-emerald-600 transition"
                      >
                        Stok Gudang PBF
                      </Link>
                      <button className="py-2 px-3 text-sm font-semibold text-white bg-emerald-600 rounded-md shadow-sm">
                        Riwayat Distribusi
                      </button>
                    </div>
                  </div>
                  {/* SEARCH & FILTER (Dari Desain Target) */}
                  <div className="flex items-center gap-2 w-full sm:w-auto">
                    <div className="relative flex-1 sm:flex-none">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                      <input
                        type="text"
                        className="w-full sm:w-60 pl-9 pr-4 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                        placeholder="Cari No Pesanan / Apotek..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                      />
                    </div>
                    <select
                      value={statusFilter}
                      onChange={(e) => setStatusFilter(e.target.value)}
                      className="p-2 border border-slate-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 appearance-none"
                    >
                      <option value="Semua">Semua Status</option>
                      <option value="Dikirim">Dikirim</option>
                      <option value="Diterima">Diterima</option>
                    </select>
                  </div>
                </div>

                <div className="overflow-x-auto">
                  {isLoading && distribusiData.length > 0 ? (
                     <div className="p-10 text-center text-slate-500">Memperbarui data tabel...</div>
                  ) : (
                    <table className="min-w-full">
                      <thead className="bg-slate-50 border-b border-slate-200">
                        <tr>
                          {/* Sesuaikan TH dengan data PBF */}
                          <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Nomor Pesanan</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Tujuan (Apotek)</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Nomor Surat Jalan</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Jumlah Total</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Tanggal Kirim</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Status</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-slate-100">
                        {filteredData.length > 0 ? (
                          filteredData.map(item => (
                            <tr key={item.id} className="hover:bg-emerald-50/50 transition-colors duration-150">
                              {/* Sesuaikan TD dengan data PBF */}
                              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-900 font-mono">#{item.nomor_pesanan || '-'}</td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-700">{item.tujuan || '-'}</td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600 font-mono">{item.nomor_surat_jalan || '-'}</td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-emerald-700">{item.jumlah_total_obat?.toLocaleString('id-ID') || '0'} Pcs</td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">
                                {item.tanggal_pengiriman ? new Date(item.tanggal_pengiriman).toLocaleDateString('id-ID', {day: '2-digit', month:'short', year:'numeric'}) : '-'}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <span className={`px-2.5 py-0.5 inline-flex text-xs leading-5 font-semibold rounded-full border ${getStatusBadge(item.status_pengiriman)}`}>
                                  {item.status_pengiriman}
                                </span>
                              </td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td colSpan="6" className="px-6 py-10 text-center text-slate-500">
                              <Truck size={32} className="mx-auto mb-2 opacity-50"/>
                              {searchTerm ? 'Tidak ada data yang cocok.' : 'Belum ada riwayat distribusi.'}
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  )}
                </div>
              </div>
           </div>
        </main>
      </div>
       {/* STYLE BLOB (Dari Desain Target) */}
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

export default RiwayatDistribusiPbf;
