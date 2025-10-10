import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import SidebarApotek from '../../components/SidebarApotek';
import NavbarApotek from '../../components/NavbarApotek';
import { Box, ShoppingBag, FileText, AlertTriangle, Loader2 } from 'lucide-react';
import { toast } from 'react-hot-toast';

const ApotekDashboard = () => {
  const navigate = useNavigate();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // State untuk data spesifik Apotek
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
            // Jika respons tidak oke, lemparkan teks sebagai pesan error
            throw new Error(`Gagal mengambil data: ${resultText}`);
        }
        
        // Coba parsing teks sebagai JSON
        const result = JSON.parse(resultText);

        if (result.success) {
          setStats(result.data.stats);
          setStokTerbaru(result.data.stokTerbaru);
          setPesananTerbaru(result.data.pesananTerbaru);
        } else {
          throw new Error(result.message || 'Data dasbor tidak tersedia');
        }
      } catch (err) {
        // Cek apakah error karena gagal parsing JSON
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

  const StatCard = ({ icon, value, label, unit, isCurrency = false }) => (
    <div className="bg-white p-6 rounded-xl shadow-lg flex items-center gap-6">
      <div className="bg-emerald-100 p-4 rounded-full">{icon}</div>
      <div>
        <p className="text-3xl font-bold text-gray-800">
            {isCurrency ? `Rp ${value.toLocaleString('id-ID')}` : value}
            <span className="text-xl font-medium text-gray-500"> {unit}</span>
        </p>
        <p className="text-gray-500 mt-1">{label}</p>
      </div>
    </div>
  );

  const getStatusBadge = (status) => {
    const styles = {
      'Menunggu Konfirmasi': 'bg-gray-100 text-gray-800',
      'Perlu Dikirim': 'bg-orange-100 text-orange-800',
      'Dikirim': 'bg-blue-100 text-blue-800',
      'Selesai': 'bg-green-100 text-green-800',
      'Dibatalkan': 'bg-red-100 text-red-800',
      'Pembatalan Diajukan': 'bg-yellow-100 text-yellow-800'
    };
    return styles[status] || 'bg-gray-100 text-gray-800';
  };
  
  if (isLoading) {
    return (
       <div className="flex justify-center items-center h-screen bg-gray-50">
          <Loader2 className="animate-spin h-8 w-8 text-emerald-600" />
          <p className="ml-3 text-gray-700">Memuat dasbor Apotek...</p>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-gray-50">
      <SidebarApotek isCollapsed={isCollapsed} setIsCollapsed={setIsCollapsed} />
      <div className={`flex-1 flex flex-col transition-all duration-300 ${isCollapsed ? 'ml-16' : 'ml-64'}`}>
        <NavbarApotek onLogout={handleLogout} />
        <main className="pt-16 p-6">
          <h1 className="text-3xl font-bold mb-6">Dasbor Apotek</h1>
           {error && <div className="p-4 mb-4 bg-red-100 text-red-700 rounded-lg">Error: {error}</div>}

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <StatCard icon={<Box size={32} className="text-emerald-600"/>} value={stats.totalStok} label="Total Stok Obat" unit="box" />
            <StatCard icon={<ShoppingBag size={32} className="text-emerald-600"/>} value={stats.penjualanHariIni} label="Penjualan Hari Ini" isCurrency={true} />
            <StatCard icon={<FileText size={32} className="text-emerald-600"/>} value={stats.pesananAktif} label="Pesanan Aktif" unit="" />
            <StatCard icon={<AlertTriangle size={32} className="text-emerald-600"/>} value={stats.akanKadaluarsa} label="Obat Akan Kedaluwarsa" unit="%" />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-bold mb-4">Stok Obat Terbaru</h2>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Nama Obat</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">ID Batch</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Stok</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Kedaluwarsa</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {stokTerbaru.length > 0 ? stokTerbaru.map((item, index) => (
                      <tr key={index}>
                        <td className="px-4 py-3 whitespace-nowrap text-sm font-medium">{item.namaObat}</td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600">{item.batchId}</td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600">{item.stok.toLocaleString('id-ID')} box</td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-yellow-600 font-medium">{item.kadaluarsa}</td>
                      </tr>
                    )) : (
                       <tr><td colSpan="4" className="text-center py-4 text-gray-500">Tidak ada data stok.</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-bold mb-4">Pesanan Terbaru</h2>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Tanggal</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Obat</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Jumlah</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {pesananTerbaru.length > 0 ? pesananTerbaru.map(item => (
                      <tr key={item.id}>
                        <td className="px-4 py-3 whitespace-nowrap text-sm font-medium">{item.tanggal}</td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600 truncate max-w-xs">{item.obat}</td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600">{item.jumlah.toLocaleString('id-ID')} box</td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm">
                          <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusBadge(item.status)}`}>
                            {item.status}
                          </span>
                        </td>
                      </tr>
                    )) : (
                      <tr><td colSpan="4" className="text-center py-4 text-gray-500">Tidak ada pesanan terbaru.</td></tr>
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

export default ApotekDashboard;