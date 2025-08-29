import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import SidebarApotek from '../../../components/SidebarApotek';
import NavbarApotek from '../../../components/NavbarApotek';
import { Search, ArrowUpDown, Calendar } from 'lucide-react';

const PesanObatApotek = () => {
  const navigate = useNavigate();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [pesananData, setPesananData] = useState([]);
  const [isLoading, setIsLoading] = useState(false); // Set ke false karena pakai data dummy
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('Semua');

  // Data dummy sesuai desain
  useEffect(() => {
    const dummyData = [
        { id: 456, pbf: 'PBF Solo', total_harga: 198750000, status: 'Menunggu Konfirmasi', tanggal_pesan: '2025-02-01', metode_pembayaran: 'Transfer Bank' },
        { id: 457, pbf: 'PBF Bandung', total_harga: 7000000, status: 'Dikirim', tanggal_pesan: '2025-02-01', metode_pembayaran: 'COD' },
    ];
    setPesananData(dummyData);
  }, []);

  const handleLogout = () => {
    localStorage.clear();
    navigate('/');
  };

  const filteredData = useMemo(() => {
    return pesananData.filter(item =>
        item.pbf.toLowerCase().includes(searchTerm.toLowerCase()) ||
        String(item.id).padStart(6, '0').includes(searchTerm)
    );
  }, [pesananData, searchTerm]);

  const getStatusBadge = (status) => {
    switch (status) {
      case 'Menunggu Konfirmasi': return 'bg-yellow-100 text-yellow-800';
      case 'Dikirim': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };
  
  const TabButton = ({ label }) => (
    <button 
        onClick={() => setActiveTab(label)}
        className={`py-2 px-4 text-center font-medium transition-colors duration-200 ${activeTab === label ? 'border-b-2 border-emerald-600 text-emerald-600' : 'text-gray-500 hover:text-emerald-600'}`}
    >
        {label}
    </button>
  );

  return (
    <div className="flex min-h-screen bg-gray-50">
      <SidebarApotek isCollapsed={isCollapsed} setIsCollapsed={setIsCollapsed} />
      <div className={`flex-1 flex flex-col transition-all duration-300 ${isCollapsed ? 'ml-16' : 'ml-64'}`}>
        <NavbarApotek onLogout={handleLogout} />
        <main className="pt-16 p-6">
          <div className="flex justify-between items-center mb-6">
            <div>
                <h1 className="text-2xl font-bold">Pesanan Obat ke PBF</h1>
                <p className="text-gray-500">Kelola pesanan dan pengiriman dari PBF</p>
            </div>
            <button onClick={() => navigate('/apotek/pesan-obat/tambah')} className="bg-emerald-600 hover:bg-emerald-700 text-white py-2 px-4 rounded-lg flex items-center gap-2">
              <span className="font-semibold">+</span> Pesan Obat
            </button>
          </div>

          {error && <div className="mb-4 p-4 bg-red-100 text-red-700 rounded">{error}</div>}

          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="p-4 border-b">
                <div className="flex justify-between items-center">
                    <div className="flex">
                        {['Semua', 'Menunggu konfirmasi', 'Diproses', 'Dikirim', 'Diterima', 'Ditolak', 'Pembatalan', 'Pengembalian'].map(tab => <TabButton key={tab} label={tab}/>)}
                    </div>
                </div>
                <div className="flex items-center gap-4 mt-4">
                    <div className="relative flex-grow">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                        <input type="text" className="w-full pl-10 pr-4 py-2 border rounded-lg" placeholder="Cari batch atau nama obat..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
                    </div>
                    <button className="p-2 border rounded-lg flex items-center gap-2 text-gray-600 hover:bg-gray-100">
                        <ArrowUpDown size={18} /> Urutkan
                    </button>
                    <div className="relative">
                        <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                        <input type="text" className="w-full pl-10 pr-4 py-2 border rounded-lg" placeholder="Waktu Pesanan Dibuat" disabled/>
                    </div>
                </div>
            </div>

            <div className="overflow-x-auto">
              {isLoading ? <p className="p-4 text-center">Loading...</p> : (
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">ID Pesanan</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Pesanan</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Total Harga</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredData.length > 0 ? filteredData.map((item) => (
                      <tr key={item.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            {item.pbf}
                            <div className="text-xs text-gray-400">ID Pesanan : {String(item.id).padStart(6, '0')}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-blue-600 hover:underline">
                            <Link to={`/apotek/pesanan/${item.id}/surat`}>Lihat Surat Pesanan</Link>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            Rp. {(item.total_harga || 0).toLocaleString('id-ID')}
                            <div className="text-xs text-gray-400">Via {item.metode_pembayaran}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                           <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusBadge(item.status)}`}>
                            {item.status}
                           </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-blue-600 hover:underline">
                          {item.status === 'Menunggu Konfirmasi' && <button className="text-red-600 hover:text-red-800">Batalkan Pesanan</button>}
                          {item.status === 'Dikirim' && <Link to={`/apotek/pesanan/${item.id}/lacak`}>Lacak pengiriman</Link>}
                        </td>
                      </tr>
                    )) : (
                        <tr>
                            <td colSpan="5" className="text-center py-10 text-gray-500">
                                {searchTerm ? "Tidak ada pesanan yang sesuai dengan pencarian." : "Belum ada pesanan."}
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
export default PesanObatApotek;
