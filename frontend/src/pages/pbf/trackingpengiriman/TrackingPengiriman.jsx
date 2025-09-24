import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import SidebarPbf from '../../../components/SidebarPbf';
import NavbarPbf from '../../../components/NavbarPbf';
import { Search, ChevronDown, Calendar, ArrowUpDown } from 'lucide-react';

const TrackingPengiriman = () => {
  const navigate = useNavigate();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [activeTab, setActiveTab] = useState('Semua');

  const handleLogout = () => {
    localStorage.clear();
    navigate('/');
  };

  const mockPesanan = [
    {
      id_pesanan: '000456',
      nama_apotek: 'Apotek Maju',
      harga_total: 7000000,
      metode_pembayaran: 'COD',
      status: 'Sedang Diproses',
      status_detail: 'Mohon konfirmasi sebelum 05-02-2025 atau pesanan akan dibatalkan secara otomatis',
    },
    {
      id_pesanan: '000456',
      nama_apotek: 'Apotek Ada',
      harga_total: 7000000,
      metode_pembayaran: 'COD',
      status: 'Dalam Perjalanan',
      status_detail: 'Produk sedang dalam pengiriman ke tujuan',
    },
  ];

  const tabs = ['Semua', 'Diproses', 'Dikirim', 'Diterima', 'Ditolak', 'Pengembalian'];

  return (
    <div className="flex min-h-screen bg-gray-50">
      <SidebarPbf isCollapsed={isCollapsed} setIsCollapsed={setIsCollapsed} />
      <div className={`flex-1 flex flex-col transition-all duration-300 ${isCollapsed ? 'ml-16' : 'ml-64'}`}>
        <NavbarPbf onLogout={handleLogout} />
        <main className="flex-1 pt-16 p-6">
          <div className="max-w-7xl mx-auto">
            <div className="mb-6">
              <h1 className="text-3xl font-bold text-gray-800">Pantau pengiriman ke Apotek</h1>
              <p className="text-gray-500 mt-1">Lacak Pengiriman obat ke Apotek</p>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
              {/* Tabs Section */}
              <div className="border-b border-gray-200 mb-6">
                <nav className="-mb-px flex space-x-8" aria-label="Tabs">
                  {tabs.map((tab) => (
                    <button
                      key={tab}
                      onClick={() => setActiveTab(tab)}
                      className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${
                        activeTab === tab
                          ? 'border-emerald-500 text-emerald-600'
                          : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                      }`}
                    >
                      {tab}
                    </button>
                  ))}
                </nav>
              </div>

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
                    className="w-full p-2 pl-10 border border-gray-300 rounded-lg appearance-none focus:ring-emerald-500 focus:border-emerald-500"
                    defaultValue="tercepat"
                  >
                    <option value="tercepat">Waktu pesanan tercepat</option>
                    <option value="terlama">Waktu pesanan terlama</option>
                  </select>
                   <ArrowUpDown className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                </div>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                  <input
                    type="text"
                    placeholder="Waktu Pesanan Dibuat"
                    defaultValue="01/02/2025 - 02/03/2025"
                    className="w-full p-2 pl-10 border border-gray-300 rounded-lg focus:ring-emerald-500 focus:border-emerald-500"
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
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Harga</th>
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
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-bold text-gray-900">
                            {new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(order.harga_total)}
                          </div>
                          <div className="text-xs text-gray-500">Via {order.metode_pembayaran}</div>
                        </td>
                         <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-semibold text-gray-900">{order.status}</div>
                          <div className="text-xs text-gray-500 max-w-xs">{order.status_detail}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          {order.status === 'Sedang Diproses' && (
                            <button className="text-red-600 hover:text-red-800">Batalkan Pesanan</button>
                          )}
                          {order.status === 'Dalam Perjalanan' && (
                            <button className="text-emerald-600 hover:text-emerald-800">Lacak pengiriman</button>
                          )}
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

export default TrackingPengiriman;
