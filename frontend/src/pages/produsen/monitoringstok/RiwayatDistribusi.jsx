import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import SidebarProdusen from '../../../components/SidebarProdusen';
import NavbarProdusen from '../../../components/NavbarProdusen';
import {
  Search,
  Package,
  Truck,
  Box,
  AlertTriangle,
  Loader2, 
  TrendingUp,
  ArrowUpRight 
} from 'lucide-react';
import { toast } from 'react-hot-toast';
const RiwayatDistribusi = () => {
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
          fetch('http://localhost:5000/api/produksi/jadwal', {
            headers: { 'Authorization': `Bearer ${token}` }
          }),
          fetch('http://localhost:5000/api/produsen/riwayat-distribusi', {
            headers: { 'Authorization': `Bearer ${token}` }
          })
        ]);


        if (!stokResponse.ok) {
            const errorText = await stokResponse.text();
            throw new Error(`Gagal mengambil data stok: ${stokResponse.status} - ${errorText}`);
        }
         if (!distribusiResponse.ok) {
            const errorText = await distribusiResponse.text();
            throw new Error(`Gagal mengambil data distribusi: ${distribusiResponse.status} - ${errorText}`);
        }


        const stokResult = await stokResponse.json();
        const distribusiResult = await distribusiResponse.json();

        if (!stokResult.success) {
           throw new Error(stokResult.message || 'Respons data stok tidak berhasil.');
        }
         if (!distribusiResult.success) {
           throw new Error(distribusiResult.message || 'Respons data distribusi tidak berhasil.');
        }


        const stokData = stokResult.data || [];
        let total = 0;
        let menipisCount = 0; 
        stokData.forEach(item => {
          const jumlahStok = item.jumlah || 0;
          total += jumlahStok;
          if (jumlahStok > 0 && jumlahStok < 2000) {
            menipisCount++; 
          }
        });

        const distribusiBulanIniData = (distribusiResult.data || []).filter(item => {
            if (!item.tanggal_pengiriman) return false;
            const bulanIni = new Date().getMonth();
            const tahunIni = new Date().getFullYear();
            try {
                const tanggalData = new Date(item.tanggal_pengiriman);
                return !isNaN(tanggalData.getTime()) && tanggalData.getMonth() === bulanIni && tanggalData.getFullYear() === tahunIni;
            } catch (e) {
                 console.error("Invalid date found in distribusi data:", item.tanggal_pengiriman);
                 return false;
            }
        });
     
        const totalQuantityDistribusiBulanIni = distribusiBulanIniData.reduce((sum, item) => sum + (item.jumlah_total_obat || 0), 0);


        setStats({
          totalStok: total,
          distribusiBulanIni: totalQuantityDistribusiBulanIni, 
          stokMenipis: menipisCount, 
        });

        const mappedData = (distribusiResult.data || []).map(item => ({
          id: item.id,
          nomor_po: item.nomor_po,
          tujuan: item.nama_pbf || '-',
          nomor_surat_jalan: item.nomor_surat_jalan,
          jumlah_total_obat: item.jumlah_total_obat || 0,
          tanggal_pengiriman: item.tanggal_pengiriman,
          status_pengiriman:
            item.status_blockchain === 'DITERIMA_PBF' ? 'Diterima' :
            item.status_blockchain === 'DIKIRIM_KE_PBF' ? 'Dikirim' :
            item.status === 'Dikirim' ? 'Dikirim' :
            item.status === 'Selesai' ? 'Diterima' :
            item.status, 
          assetId: item.detail_pesanan && item.detail_pesanan.length > 0 ? item.detail_pesanan[0].blockchain_asset_id : null // Get assetId for link
        })).filter(item =>
          item.status_pengiriman === 'Dikirim' || item.status_pengiriman === 'Diterima'
        );
        setDistribusiData(mappedData);

      } catch (error) {
        setError(error.message);
        toast.error(error.message || 'Gagal memuat data.');
        if ((error.message.includes('401') || error.message.includes('403') || error.message.includes('login')) && token) {
            navigate('/login/produsen');
        } else if (!token) {
             navigate('/login/produsen');
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
        const searchableString = `${item.nomor_po || ''} ${item.nomor_surat_jalan || ''} ${item.tujuan || ''}`.toLowerCase();
        return searchableString.includes(searchTerm.toLowerCase());
      });
  }, [distribusiData, searchTerm, statusFilter]);


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

   const getStatusBadge = (status) => {
      switch (status) {
        case 'Dikirim': return 'bg-blue-100 text-blue-800 border-blue-200';
        case 'Diterima': return 'bg-green-100 text-green-800 border-green-200';
        default: return 'bg-slate-100 text-slate-800 border-slate-200'; 
      }
    };

 if (isLoading) {
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


  return (
    <div className="flex min-h-screen bg-slate-50">
      <SidebarProdusen isCollapsed={isCollapsed} setIsCollapsed={setIsCollapsed} />
      <div className={`flex-1 flex flex-col transition-all duration-300 ${isCollapsed ? 'ml-16' : 'ml-64'}`}>
        <NavbarProdusen onLogout={handleLogout} username={username}/>
        <main className="flex-1 overflow-auto pt-[72px]">
           <div className="max-w-7xl mx-auto px-6 py-4 ml-8">
              <div className="mb-8">
                 <h1 className="text-4xl font-bold text-slate-900 mb-2">Riwayat Distribusi</h1>
                 <p className="text-slate-600">Lacak pengiriman obat yang telah Anda distribusikan.</p>
              </div>

              {error && (
                 <div className="p-4 mb-6 bg-red-50 text-red-700 rounded-lg border border-red-200 flex items-center gap-2">
                   <AlertTriangle size={18} /> Error: {error}
                 </div>
               )}

              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                   <StatCard
                    icon={<Box />}
                    value={stats.totalStok}
                    label="Total Stok Gudang"
                    unit="Pcs"
                    trend="+10%" 
                    color="emerald"
                  />
                  <StatCard
                    icon={<Truck />}
                    value={stats.distribusiBulanIni}
                    label="Distribusi Bulan Ini"
                    unit="Pcs"
                    trend="+2%" 
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
  

              <div className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden">
                <div className="p-4 border-b border-slate-200 flex flex-col sm:flex-row justify-between items-center gap-4">
                  <div className="flex flex-wrap gap-x-4">
                    <Link to="/produsen/monitoring-stok" className="py-2 px-1 text-center text-slate-500 hover:text-emerald-600 hover:border-b-2 hover:border-emerald-300 text-sm font-medium whitespace-nowrap">
                      Stok Gudang
                    </Link>
                    <button className="py-2 px-1 text-center border-b-2 border-emerald-600 text-emerald-600 font-semibold text-sm whitespace-nowrap">Riwayat Distribusi</button>
                  </div>
                  <div className="flex items-center gap-2 w-full sm:w-auto">
                    <div className="relative flex-1 sm:flex-none">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                      <input
                        type="text"
                        className="w-full sm:w-60 pl-9 pr-4 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                        placeholder="Cari PO / SJ / Tujuan..."
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
                  {isLoading ? (
                     <div className="p-10 text-center text-slate-500">Memuat data tabel...</div>
                  ) : (
                    <table className="min-w-full">
                      <thead className="bg-slate-50 border-b border-slate-200">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Nomor PO</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Tujuan (PBF)</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Nomor Surat Jalan</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Jumlah Total</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Tanggal Kirim</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Status</th>
                           {/* Optional: Add action column if needed */}
                           {/* <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Aksi</th> */}
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-slate-100">
                        {filteredData.length > 0 ? (
                          filteredData.map(item => (
                            <tr key={item.id} className="hover:bg-emerald-50/50 transition-colors duration-150">
                              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-900">{item.nomor_po || '-'}</td>
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
                            <td colSpan="7" className="px-6 py-10 text-center text-slate-500">
                              <Truck size={32} className="mx-auto mb-2 opacity-50"/>
                              Tidak ada data riwayat distribusi yang sesuai.
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
       <style jsx global>{`
        @media print {
          body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          .print\\:hidden { display: none !important; }
        }
      `}</style>
    </div>
  );
};

export default RiwayatDistribusi;