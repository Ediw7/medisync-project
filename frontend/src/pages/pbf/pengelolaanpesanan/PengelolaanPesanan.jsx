import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import SidebarPbf from '../../../components/SidebarPbf';
import NavbarPbf from '../../../components/NavbarPbf';
import { Search, ChevronDown, Calendar, Plus, ChevronLeft, ChevronRight } from 'lucide-react';

const PengelolaanPesanan = () => {
  const navigate = useNavigate();
  const [isCollapsed, setIsCollapsed] = useState(false);

  // --- TAMBAHKAN FUNGSI INI ---
  const handleLogout = () => {
    localStorage.clear(); // Hapus token atau data sesi
    navigate('/'); // Arahkan ke halaman utama/login
  };
  // -----------------------------

  // Mock data representing the orders, based on the provided image
  const mockPesanan = [
    {
      id_pesanan: '000456',
      nama_apotek: 'Apotek Maju',
      harga_total: 7000000,
      metode_pembayaran: 'COD',
      alamat_pengiriman: 'Jl. Mawar Merah, Kel. Tandang, Kec Tembalang, Kota Semarang 50274',
      tanggal_pesanan: '2025-02-01',
      status: 'Menunggu',
    },
    {
      id_pesanan: '000456', // Assuming ID is unique, but using image data
      nama_apotek: 'Apotek Ada',
      harga_total: 7000000,
      metode_pembayaran: 'COD',
      alamat_pengiriman: 'Jl. Mawar Merah',
      tanggal_pesanan: '2025-02-01',
      status: 'Dibatalkan',
    },
  ];

  // Function to get status color
  const getStatusClass = (status) => {
    switch (status) {
      case 'Menunggu':
        return 'bg-yellow-100 text-yellow-800';
      case 'Dibatalkan':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="flex min-h-screen bg-gray-50">
    <SidebarPbf isCollapsed={isCollapsed} setIsCollapsed={setIsCollapsed} />
      <div className={`flex-1 flex flex-col transition-all duration-300 ${isCollapsed ? 'ml-16' : 'ml-64'}`}>
        {/* Sekarang `handleLogout` sudah terdefinisi */}
        <NavbarPbf onLogout={handleLogout} />
        <main className="flex-1 pt-16 p-6">
          <div className="max-w-7xl mx-auto">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h1 className="text-3xl font-bold text-gray-800">Pengelolaan Pesanan ke Apotek</h1>
                <p className="text-gray-500 mt-1">Kelola pesanan Obat</p>
              </div>
              <div className="flex items-center gap-4">
                <button className="px-4 py-2 bg-white border border-gray-300 text-gray-800 rounded-lg hover:bg-gray-100 transition">
                  Atur Pengiriman Massal
                </button>
                <button className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition flex items-center gap-2">
                  <Plus size={18} />
                  Pengiriman Massal
                </button>
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
              <h2 className="text-xl font-semibold text-gray-800 mb-4">Daftar Pesanan Masuk</h2>

              {/* Filter Section */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                  <input
                    type="text"
                    placeholder="Cari ID Pesanan atau nama apotek..."
                    className="w-full p-2 pl-10 border border-gray-300 rounded-lg focus:ring-emerald-500 focus:border-emerald-500"
                  />
                </div>
                <div className="relative">
                  <select
                    className="w-full p-2 border border-gray-300 rounded-lg appearance-none focus:ring-emerald-500 focus:border-emerald-500"
                    defaultValue=""
                  >
                    <option value="" disabled>Semua Status</option>
                    <option value="Menunggu">Menunggu</option>
                    <option value="Dibatalkan">Dibatalkan</option>
                    <option value="Diproses">Diproses</option>
                    <option value="Dikirim">Dikirim</option>
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                </div>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                  <input
                    type="text"
                    placeholder="Waktu Pesanan Masuk"
                    defaultValue="01/02/2025 - 02/03/2025"
                    className="w-full p-2 pl-10 border border-gray-300 rounded-lg focus:ring-emerald-500 focus:border-emerald-500"
                    onFocus={(e) => (e.target.type = 'date')}
                    onBlur={(e) => (e.target.type = 'text')}
                  />
                </div>
              </div>

              {/* Table Section */}
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID Pesanan</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Pesanan</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Alamat Pengiriman</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tanggal Pesanan</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {mockPesanan.map((order, index) => (
                      <tr key={index} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-semibold text-gray-900">{order.nama_apotek}</div>
                          <div className="text-sm text-gray-500">ID Pesanan : {order.id_pesanan}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <a href="#" className="text-sm text-emerald-600 hover:underline font-medium">
                            Lihat Surat Pesanan
                          </a>
                           <div className="text-sm font-bold text-gray-900 mt-1">
                            {new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(order.harga_total)}
                          </div>
                          <div className="text-xs text-gray-500">Via {order.metode_pembayaran}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 max-w-xs truncate">{order.alamat_pengiriman}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                          {new Date(order.tanggal_pesanan).toLocaleDateString('id-ID', { timeZone: 'UTC' })}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusClass(order.status)}`}>
                            {order.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          {order.status === 'Menunggu' && (
                            <button className="text-emerald-600 hover:text-emerald-800">Proses Pesanan</button>
                          )}
                           {order.status === 'Dibatalkan' && (
                            <button className="text-blue-600 hover:text-blue-800">Lihat Riwayat</button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
               {/* Pagination */}
              <div className="flex justify-between items-center mt-4">
                 <div className="text-sm text-gray-700">
                    Menampilkan <span className="font-semibold">1</span> - <span className="font-semibold">{mockPesanan.length}</span> dari <span className="font-semibold">{mockPesanan.length}</span> entri
                </div>
                <div className="flex items-center gap-2">
                    <button className="p-2 border rounded-md hover:bg-gray-100 disabled:opacity-50">
                        <ChevronLeft size={16} />
                    </button>
                     <span className="px-4 py-2 bg-emerald-600 text-white rounded-md text-sm">1</span>
                    <button className="p-2 border rounded-md hover:bg-gray-100 disabled:opacity-50">
                        <ChevronRight size={16} />
                    </button>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default PengelolaanPesanan;

