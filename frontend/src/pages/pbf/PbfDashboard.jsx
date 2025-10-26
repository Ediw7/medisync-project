import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import SidebarPbf from '../../components/SidebarPbf';
import NavbarPbf from '../../components/NavbarPbf';
import { ShoppingCart, Truck, CheckCircle, Box, Loader2 } from 'lucide-react';

const PbfDashboard = () => {
  const navigate = useNavigate();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // State untuk data dinamis, diinisialisasi kosong
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
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          navigate('/login/pbf');
          return;
        }

        const response = await fetch('http://localhost:5000/api/pbf/dashboard', {
          headers: { 'Authorization': `Bearer ${token}` },
        });

        if (!response.ok) throw new Error('Gagal mengambil data dasbor');
        
        const result = await response.json();
        if (result.success) {
          setStats(result.data.stats);
          setStokTerbaru(result.data.stokTerbaru);
          setPesananTerbaru(result.data.pesananTerbaru);
        } else {
          throw new Error(result.message || 'Data tidak tersedia');
        }
      } catch (err) {
        setError(err.message);
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

  const StatCard = ({ icon, value, label, unit }) => (
    <div className="bg-white p-6 rounded-xl shadow-lg flex items-center gap-6">
      <div className="bg-emerald-100 p-4 rounded-full">{icon}</div>
      <div>
        <p className="text-3xl font-bold text-gray-800">{value.toLocaleString('id-ID')} <span className="text-xl font-medium text-gray-500">{unit}</span></p>
        <p className="text-gray-500">{label}</p>
      </div>
    </div>
  );

  const getStatusBadge = (status) => {
    switch (status) {
      case 'Diproses': return 'bg-yellow-100 text-yellow-800';
      case 'Diterima': return 'bg-green-100 text-green-800';
      case 'Dikirim': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };
  
  if (isLoading) {
    return (
       <div className="flex justify-center items-center h-screen">
          <Loader2 className="animate-spin h-8 w-8 text-emerald-600" />
          <p className="ml-2">Memuat data dasbor...</p>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen bg-gray-50">
      <SidebarPbf isCollapsed={isCollapsed} setIsCollapsed={setIsCollapsed} />
      <div className={`flex-1 flex flex-col transition-all duration-300 ${isCollapsed ? 'ml-16' : 'ml-64'}`}>
        <NavbarPbf onLogout={handleLogout} />
        <main className="pt-16 p-6 mt-8 ml-8">
          <h1 className="text-3xl font-bold mb-6">Dashboard</h1>
           {error && <div className="p-4 mb-4 bg-red-100 text-red-700 rounded-lg">{error}</div>}

          {/* Kartu Statistik */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <StatCard icon={<ShoppingCart size={32} className="text-emerald-600"/>} value={stats.totalDipesan} label="Total pesanan" unit="pesanan" />
            <StatCard icon={<Truck size={32} className="text-emerald-600"/>} value={stats.pengirimanAktif} label="Pengiriman Aktif" unit="unit" />
            <StatCard icon={<CheckCircle size={32} className="text-emerald-600"/>} value={stats.stokTersedia} label="Stok Tersedia" unit="box" />
            <StatCard icon={<Box size={32} className="text-emerald-600"/>} value={stats.pesananBelumSelesai} label="Pesanan belum selesai" unit="pesanan" />
          </div>

          {/* Tabel */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Tabel Stok Obat Terbaru */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-bold mb-4">Stok obat terbaru</h2>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Batch ID</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Nama Obat</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Stok</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Kadaluwarsa</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {stokTerbaru.map((item, index) => (
                      <tr key={index}>
                        <td className="px-4 py-3 whitespace-nowrap text-sm font-medium">{item.batch_id}</td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600">{item.nama_obat}</td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600">{item.stok.toLocaleString('id-ID')} box</td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-yellow-600 font-medium">{new Date(item.tanggal_kadaluarsa).toLocaleDateString('id-ID')}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Tabel Pesanan Terbaru */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-bold mb-4">Pesanan terbaru</h2>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Nama Apotek</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Obat</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Jumlah</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {pesananTerbaru.map(item => (
                      <tr key={item.id}>
                        <td className="px-4 py-3 whitespace-nowrap text-sm font-medium">{item.namaApotek}</td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600">{item.obat}<br/><span className="text-xs text-gray-400">Batch ID: {item.batchId}</span></td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600">{item.jumlah.toLocaleString('id-ID')} box</td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm">
                          <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusBadge(item.status)}`}>
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

export default PbfDashboard;