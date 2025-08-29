import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import SidebarApotek from '../../../components/SidebarApotek';
import NavbarApotek from '../../../components/NavbarApotek';
import { Search, ArrowUpDown, Trash2, Pencil } from 'lucide-react';

const StokObat = () => {
  const navigate = useNavigate();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [stokData, setStokData] = useState([]);
  const [isLoading, setIsLoading] = useState(false); // Set ke false karena pakai data dummy
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  // Data dummy sesuai desain
  useEffect(() => {
    const dummyData = [
        { id: 1, batch_id: 'PCL-001', nama_obat: 'Paracetamol', jumlah: 500, tanggal_kadaluarsa: '2024-12-22' },
        { id: 2, batch_id: 'ACL-002', nama_obat: 'Amoxicillin', jumlah: 475, tanggal_kadaluarsa: '2025-08-13' },
        { id: 3, batch_id: 'OMP-003', nama_obat: 'Omeprazole', jumlah: 123, tanggal_kadaluarsa: '2028-02-22' },
    ];
    setStokData(dummyData);
  }, []);

  const handleLogout = () => {
    localStorage.clear();
    navigate('/');
  };

  const filteredData = useMemo(() => {
    return stokData.filter(item =>
        item.batch_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.nama_obat.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [stokData, searchTerm]);

  const getKadaluarsaBadge = (tanggal) => {
    const sekarang = new Date();
    const kadaluarsa = new Date(tanggal);
    // Set jam ke 0 untuk perbandingan tanggal yang adil
    sekarang.setHours(0, 0, 0, 0);
    kadaluarsa.setHours(0, 0, 0, 0);
    
    const selisihHari = (kadaluarsa - sekarang) / (1000 * 60 * 60 * 24);

    if (selisihHari < 0) return 'bg-red-100 text-red-800';
    if (selisihHari <= 180) return 'bg-yellow-100 text-yellow-800'; // 6 bulan
    return 'bg-green-100 text-green-800';
  };

  return (
    <div className="flex min-h-screen bg-gray-50">
      <SidebarApotek isCollapsed={isCollapsed} setIsCollapsed={setIsCollapsed} />
      <div className={`flex-1 flex flex-col transition-all duration-300 ${isCollapsed ? 'ml-16' : 'ml-64'}`}>
        <NavbarApotek onLogout={handleLogout} />
        <main className="pt-16 p-6">
          <h1 className="text-2xl font-bold mb-6">Mengelola Stok Obat</h1>

          {error && <div className="mb-4 p-4 bg-red-100 text-red-700 rounded">{error}</div>}

          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="p-4 border-b flex justify-between items-center">
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <input type="text" className="w-full pl-10 pr-4 py-2 border rounded-lg" placeholder="Cari batch atau nama obat..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
                </div>
                <div className="flex items-center gap-4">
                    <button className="p-2 border rounded-lg flex items-center gap-2 text-gray-600 hover:bg-gray-100">
                        <ArrowUpDown size={18} /> Urutkan
                    </button>
                    <input type="text" className="p-2 border rounded-lg" placeholder="Waktu Pesanan Obat" disabled/>
                </div>
            </div>

            <div className="overflow-x-auto">
              {isLoading ? <p className="p-4 text-center">Loading...</p> : (
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Batch ID</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Nama Obat</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Stok</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tanggal Kadaluwarsa</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredData.length > 0 ? filteredData.map((item) => (
                      <tr key={item.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{item.batch_id}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item.nama_obat}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 flex items-center gap-2">
                            {item.jumlah} box
                            <button className="text-emerald-600 hover:text-emerald-900"><Pencil size={16} /></button>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                           <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getKadaluarsaBadge(item.tanggal_kadaluarsa)}`}>
                            {new Date(item.tanggal_kadaluarsa).toLocaleDateString('id-ID')}
                           </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <button className="text-red-600 hover:text-red-900"><Trash2 size={18} /></button>
                        </td>
                      </tr>
                    )) : (
                        <tr>
                            <td colSpan="5" className="text-center py-10 text-gray-500">
                                {searchTerm ? "Tidak ada stok yang sesuai dengan pencarian." : "Belum ada stok obat."}
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
export default StokObat;
