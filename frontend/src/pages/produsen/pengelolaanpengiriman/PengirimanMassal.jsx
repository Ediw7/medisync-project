
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import SidebarProdusen from '../../../components/SidebarProdusen';
import NavbarProdusen from '../../../components/NavbarProdusen';
import { Search, CalendarPlus, ChevronDown } from 'lucide-react';

const PengirimanMassal = () => {
  const navigate = useNavigate();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [pesananData, setPesananData] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  
  // --- State baru untuk checkbox ---
  const [selectedPesanan, setSelectedPesanan] = useState([]);

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

  const filteredData = pesananData.filter(item =>
    item.nama_pbf.toLowerCase().includes(searchQuery.toLowerCase()) ||
    String(item.id).includes(searchQuery)
  );

  // --- Handler untuk checkbox ---
  const handleSelectAll = (e) => {
    if (e.target.checked) {
      const allIds = filteredData.map(item => item.id);
      setSelectedPesanan(allIds);
    } else {
      setSelectedPesanan([]);
    }
  };

  const handleSelectOne = (id) => {
    setSelectedPesanan(prevSelected =>
      prevSelected.includes(id)
        ? prevSelected.filter(item => item !== id)
        : [...prevSelected, id]
    );
  };

  return (
    <div className="flex min-h-screen bg-gray-50">
      <SidebarProdusen isCollapsed={isCollapsed} setIsCollapsed={setIsCollapsed} />
      <div className={`flex-1 flex flex-col transition-all duration-300 ${isCollapsed ? 'ml-16' : 'ml-64'}`}>
        <NavbarProdusen onLogout={() => { localStorage.clear(); navigate('/'); }} />
        <main className="pt-16 p-6">
          <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
            <div>
              <h1 className="text-2xl font-bold">Pengiriman Massal</h1>
              <p className="text-gray-500">Kirim pesanan sekaligus dan cetak surat jalan secara massal</p>
            </div>
            <div className="flex items-center gap-2 sm:gap-4 flex-shrink-0">
              <button className="text-gray-600 font-medium py-2 px-3 rounded-lg hover:bg-gray-200 transition">Atur Pengiriman Pengiriman Massal</button>
              <button className="bg-emerald-600 text-white font-medium py-2 px-3 rounded-lg hover:bg-emerald-700 transition flex items-center gap-2">
                <CalendarPlus size={18} />
                <span>Atur pickup massal</span>
              </button>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="p-4 border-b flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="relative">
                  <Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Cari batch atau nama obat..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 pr-4 py-2 border rounded-lg w-full sm:w-80 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
                <button className="border rounded-lg py-2 px-4 flex items-center gap-2 text-gray-600 hover:bg-gray-100">
                  Urutkan <ChevronDown size={16} />
                </button>
              </div>
              <p className="text-sm text-gray-600 font-medium">{selectedPesanan.length} Pesanan dipilih</p>
            </div>

            <div className="overflow-x-auto">
              {isLoading ? <p className="text-center p-4">Memuat data...</p> : (
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        <input
                          type="checkbox"
                          className="h-4 w-4 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
                          onChange={handleSelectAll}
                          checked={filteredData.length > 0 && selectedPesanan.length === filteredData.length}
                        />
                        <span className="ml-4">Semua</span>
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">ID Pesanan</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Pesanan Produk</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Qty</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Total Harga</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                     
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredData.map((item) => (
                      <tr key={item.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <input
                            type="checkbox"
                            className="h-4 w-4 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
                            onChange={() => handleSelectOne(item.id)}
                            checked={selectedPesanan.includes(item.id)}
                          />
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">{item.nama_pbf}</div>
                          <div className="text-sm text-gray-500">ID Pesanan : {String(item.id).padStart(6, '0')}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {/* Tampilkan detail produk secara dinamis */}
                        {item.detail_pesanan && item.detail_pesanan.map(detail => (
                            <p key={detail.id} className="truncate">
                            {detail.nama_obat} (Batch: {detail.batch_id || 'N/A'})
                            </p>
                        ))}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {/* Tampilkan kuantitas secara dinamis */}
                        {item.detail_pesanan && item.detail_pesanan.map(detail => (
                            <p key={detail.id}>
                            {detail.jumlah_pesanan.toLocaleString('id-ID')} box
                            </p>
                        ))}
                        </td>
                       
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">Rp. {item.total_harga.toLocaleString('id-ID')}</td>
                        <td className="px-6 py-4 whitespace-nowrap">
                        {/* Mengubah <p> menjadi <span> dengan styling badge */}
                        <span className="px-2.5 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-orange-100 text-orange-800">
                            {item.status}
                        </span>
                        <p className="text-xs text-gray-500 mt-1">
                            Tgl. Pesanan: {new Date(item.tanggal_pesanan).toLocaleDateString('id-ID')}
                        </p>
                        </td>
                        
                      </tr>
                    ))}
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

export default PengirimanMassal;