import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import SidebarApotek from '../../../components/SidebarApotek'; // Pastikan path ini benar
import NavbarApotek from '../../../components/NavbarApotek';   // Pastikan path ini benar
import { Search, ChevronDown, Calendar, Plus } from 'lucide-react';

const RiwayatPembelian = () => {
  const navigate = useNavigate();
  const [isCollapsed, setIsCollapsed] = useState(false);

  // Data Dummy untuk tabel riwayat
  const riwayatData = [
    { id: '000456', tanggal: '22-02-2025', pbf: 'PBF Solo', status: 'Ditolak' },
    { id: '000376', tanggal: '12-02-2025', pbf: 'PBF Solo', status: 'Diterima' },
  ];

  const getStatusBadge = (status) => {
    switch (status) {
      case 'Ditolak':
        return 'bg-red-100 text-red-800';
      case 'Diterima':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="flex min-h-screen bg-gray-50">
      <SidebarApotek isCollapsed={isCollapsed} setIsCollapsed={setIsCollapsed} />
      <div className={`flex-1 flex flex-col transition-all duration-300 ${isCollapsed ? 'ml-16' : 'ml-64'}`}>
        <NavbarApotek onLogout={() => { localStorage.clear(); navigate('/'); }} />
        <main className="flex-1 pt-16 p-6">
          <div className="flex flex-wrap justify-between items-center mb-6">
            <div>
              <h1 className="text-2xl font-bold">Riwayat Pembelian dari PBF</h1>
              <p className="text-gray-500">Melihat riwayat pembelian dari PBF</p>
            </div>
            <button
                onClick={() => navigate('/apotek/pesan-obat')} // Arahkan ke halaman pesan obat
                className="bg-emerald-600 text-white py-2 px-4 rounded-lg hover:bg-emerald-700 transition flex items-center gap-2"
            >
                <Plus size={18} />
                Pesan Obat
            </button>
          </div>

          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex flex-col md:flex-row gap-4 mb-4">
                {/* Search Input */}
                <div className="relative flex-grow">
                    <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input 
                        type="text" 
                        placeholder="Cari Batch atau nama obat..." 
                        className="pl-10 pr-4 py-2 border rounded-lg text-sm w-full"
                    />
                </div>
                {/* Status Filter */}
                <div className="relative">
                    <select className="appearance-none w-full md:w-48 bg-white border rounded-lg px-4 py-2 text-sm pr-8">
                        <option>Semua Status</option>
                        <option>Diterima</option>
                        <option>Ditolak</option>
                    </select>
                    <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"/>
                </div>
                {/* Tanggal Filter */}
                <div className="relative">
                    <Calendar size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input 
                        type="text" 
                        placeholder="Tanggal Pembelian" 
                        defaultValue="01/02/2025 - 02/03/2025"
                        className="pl-10 pr-4 py-2 border rounded-lg text-sm w-full md:w-60"
                    />
                </div>
            </div>

            <div className="flex items-center gap-4 mb-4 text-sm">
                <span>Lihat</span>
                <select className="border rounded-lg px-2 py-1">
                    <option>10</option>
                    <option>25</option>
                    <option>50</option>
                </select>
                <span>entri</span>
            </div>

            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">ID Pesanan</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Pesanan Produk</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tanggal</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">PBF</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {riwayatData.map((item, index) => (
                    <tr key={index}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">ID Pesanan : {item.id}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-blue-600 font-semibold hover:underline">
                        <Link to="#">Lihat Surat Pesanan</Link>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">{item.tanggal}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">{item.pbf}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <span className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusBadge(item.status)}`}>
                          {item.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default RiwayatPembelian;
