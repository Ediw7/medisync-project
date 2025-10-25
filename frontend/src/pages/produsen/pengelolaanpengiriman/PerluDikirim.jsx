import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import SidebarProdusen from '../../../components/SidebarProdusen';
import NavbarProdusen from '../../../components/NavbarProdusen';
import { Search, CalendarPlus } from 'lucide-react';

// Komponen nav item untuk handle state aktif
const NavItem = ({ to, children }) => {
  const location = useLocation();
  const isActive = location.pathname === to;

 const baseClass = "py-3 px-1 text-center font-medium transition whitespace-nowrap";
  const activeClass = "text-emerald-600 border-b-2 border-emerald-600 pointer-events-none cursor-default";
  const inactiveClass = "text-gray-600 hover:text-emerald-600";

  if (isActive) {
    return (
      <span className={`${baseClass} ${activeClass}`}>
        {children}
      </span>
    );
  }

  return (
    <Link to={to} className={`${baseClass} ${inactiveClass}`}>
      {children}
    </Link>
  );
};

const PerluDikirim = () => {
  const navigate = useNavigate();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [pesananData, setPesananData] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const token = localStorage.getItem('token');
        if (!token) throw new Error('Silakan login terlebih dahulu');

        const response = await fetch('http://localhost:5000/api/produsen/pesanan-masuk', {
          headers: { 'Authorization': `Bearer ${token}` },
        });

        if (!response.ok) throw new Error('Gagal mengambil data pesanan');
        const result = await response.json();
        if (!result.success) throw new Error(result.message || 'Data pesanan tidak tersedia');

        // Filter hanya status "Perlu Dikirim"
        const filteredData = (result.data || []).filter(item => item.status === 'Perlu Dikirim');
        setPesananData(filteredData);
      } catch (error) {
        setError(error.message);
        if (error.message.includes('login')) navigate('/login/produsen');
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

  const getStatusBadge = (status) => {
    switch (status) {
      case 'Perlu Dikirim': return 'bg-orange-100 text-orange-800';
      default: return 'bg-gray-100 text-gray-800'; // Hanya "Perlu Dikirim" yang relevan
    }
  };

  const filteredData = pesananData.filter(item =>
    item.nama_pbf.toLowerCase().includes(searchQuery.toLowerCase()) ||
    String(item.id).includes(searchQuery)
  );

  return (
    <div className="flex min-h-screen bg-gray-50">
      <SidebarProdusen isCollapsed={isCollapsed} setIsCollapsed={setIsCollapsed} />
      <div className={`flex-1 flex flex-col transition-all duration-300 ${isCollapsed ? 'ml-16' : 'ml-64'}`}>
        <NavbarProdusen onLogout={handleLogout} />
        <main className="pt-18 pl-12 p-6 mt-8 ml-8">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold">Pesanan Perlu Dikirim</h1>
            <p className="text-gray-500">Daftar pesanan yang menunggu untuk diatur pengirimannya</p>
          </div>
          <div className="flex items-center gap-2 sm:gap-4 flex-shrink-0">
            <button className="text-gray-600 font-medium py-2 px-3 rounded-lg hover:bg-gray-200 transition">
              Atur Pengiriman Massal
            </button>
            <button 
            onClick={() => navigate('/produsen/pengelolaan-pengiriman/pengiriman-massal')}
            className="bg-emerald-600 text-white font-medium py-2 px-3 rounded-lg hover:bg-emerald-700 transition flex items-center gap-2">
            <CalendarPlus size={18} />
            <span>Pengiriman Massal</span>
          </button>
          </div>
        </div>

          <div className="bg-white rounded-lg shadow overflow-hidden">
           <div className="p-4 border-b flex flex-wrap items-center gap-x-4 gap-y-3">
               <div className="flex items-center gap-x-2">
              <NavItem to="/produsen/pengelolaan-pengiriman">Semua</NavItem>
              <NavItem to="/produsen/pengelolaan-pengiriman/perlu-dikirim">Perlu dikirim</NavItem>
              <NavItem to="/produsen/pengelolaan-pengiriman/dikirim">Dikirim</NavItem>
              <NavItem to="/produsen/pengelolaan-pengiriman/selesai">Selesai</NavItem>
              <NavItem to="/produsen/pengelolaan-pengiriman/pembatalan">Pembatalan</NavItem>
              <NavItem to="/produsen/pengelolaan-pengiriman/pengembalian">Pengembalian</NavItem>
            </div>
            <div className="relative w-full sm:w-auto sm:ml-auto">
              <input
                type="text"
                placeholder="Cari PBF atau ID..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 pr-4 py-2 border rounded-lg w-full sm:w-64 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
              <Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            </div>
          </div>

            <div className="overflow-x-auto">
              {error && (
                <div className="mb-4 p-4 bg-red-100 text-red-700 rounded-lg flex items-center gap-2">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.732 6.732a1 1 0 011.414 0L10 7.586l.854-.854a1 1 0 111.414 1.414L11.414 9l.854.854a1 1 0 11-1.414 1.414L10 10.414l-.854.854a1 1 0 01-1.414-1.414L8.586 9l-.854-.854a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                  {error}
                </div>
              )}

              {isLoading ? (
                <div className="p-4 text-center">
                  <svg className="animate-spin mx-auto h-8 w-8 text-emerald-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  <p className="mt-2 text-gray-500">Memuat pesanan...</p>
                </div>
              ) : (
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">PBF</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">ID Pesanan</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Pesanan (Surat Pesanan)</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Total Harga</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
  {filteredData.length > 0 ? filteredData.map((item) => (
    <tr key={item.id} className="hover:bg-gray-50">
      
      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{item.nama_pbf}</td>
      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{String(item.id).padStart(6, '0')}</td>
      
      
      <td className="px-6 py-4 whitespace-nowrap text-sm text-blue-600 hover:underline">
        <Link to={`/produsen/pengelolaan-pengiriman/detail/${item.id}/surat`}>Lihat Surat</Link>
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">Rp. {item.total_harga.toLocaleString('id-ID')}</td>
      <td className="px-6 py-4 whitespace-nowrap">
        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusBadge(item.status)}`}>
          {item.status}
        </span>
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
        <Link to={`/produsen/pengelolaan-pengiriman/atur-pengiriman/${item.id}`} className="text-emerald-600 hover:text-emerald-800">
          Atur Pengiriman
        </Link>
      </td>
    </tr>
  )) : (
    <tr>
      <td colSpan="6" className="text-center py-10 text-gray-500">
        {searchQuery ? 'Pencarian tidak ditemukan.' : 'Tidak ada pesanan yang perlu dikirim.'}
      </td>
    </tr>
  )}
</tbody>
                </table>
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default PerluDikirim;