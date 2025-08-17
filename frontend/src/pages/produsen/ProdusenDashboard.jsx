import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import SidebarProdusen from '../../components/SidebarProdusen';
import NavbarProdusen from '../../components/NavbarProdusen';
import { Package, Truck, Box, BarChart, AlertCircle } from 'lucide-react';

const ProdusenDashboard = () => {
  const navigate = useNavigate();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [username, setUsername] = useState('');

  // Data dummy untuk statistik dan tabel
  const [stats, setStats] = useState({
    totalProduksi: 1284,
    pengirimanAktif: 67,
    stokTersedia: 19184,
    efisiensiProduksi: 87.5,
  });

  const [aktivitasTerbaru, setAktivitasTerbaru] = useState([
    { id: 1, jenis: 'Pengiriman ke PBF Semarang Sedang Berlangsung', waktu: '1 jam yang lalu' },
    { id: 2, jenis: 'Pengiriman ke PBF Solo Selesai', waktu: '2 jam yang lalu' },
    { id: 3, jenis: 'Pengiriman ke PBF Makassar Batal', waktu: '2 jam yang lalu' },
    { id: 4, jenis: 'Pengiriman ke PBF Bandung Selesai', waktu: '4 jam yang lalu' },
  ]);

  useEffect(() => {
    const storedUsername = localStorage.getItem('username');
    if (storedUsername) setUsername(storedUsername);

    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/roles');
    }
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

  return (
    <div className="flex min-h-screen bg-gray-50">
      <SidebarProdusen isCollapsed={isCollapsed} setIsCollapsed={setIsCollapsed} />
      <div className={`flex-1 flex flex-col transition-all duration-300 ${isCollapsed ? 'ml-20' : 'ml-64'}`}>
        <NavbarProdusen onLogout={handleLogout} />
        <main className="pt-16 p-6">
          <h1 className="text-3xl font-bold mb-6">{username || 'Produsen'}</h1>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <StatCard icon={<Package size={32} className="text-emerald-600"/>} value={stats.totalProduksi} label="Total produksi" unit="box" />
            <StatCard icon={<Truck size={32} className="text-emerald-600"/>} value={stats.pengirimanAktif} label="Pengiriman Aktif" unit="unit" />
            <StatCard icon={<Box size={32} className="text-emerald-600"/>} value={stats.stokTersedia} label="Stok Tersedia" unit="box" />
            <StatCard icon={<BarChart size={32} className="text-emerald-600"/>} value={stats.efisiensiProduksi} label="Efisiensi Produksi" unit="%" />
          </div>
  
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-bold mb-4">Aktivitas Terbaru</h2>
            <div className="space-y-4">
              {aktivitasTerbaru.map((aktivitas) => (
                <div key={aktivitas.id} className="flex items-center py-3 border-b last:border-0">
                  <div className="p-2 bg-yellow-100 rounded-full mr-4">
                    <AlertCircle className="h-6 w-6 text-yellow-600" />
                  </div>
                  <div>
                    <p className="font-medium">{aktivitas.jenis}</p>
                    <p className="text-sm text-gray-500">{aktivitas.waktu}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default ProdusenDashboard;