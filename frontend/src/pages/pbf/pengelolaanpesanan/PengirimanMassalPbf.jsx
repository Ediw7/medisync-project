import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import SidebarPbf from '../../../components/SidebarPbf';
import NavbarPbf from '../../../components/NavbarPbf';
import { Search, CalendarPlus } from 'lucide-react';
import axios from 'axios';

const PengirimanMassalPbf = () => {
  const navigate = useNavigate();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [pesananData, setPesananData] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPesanan, setSelectedPesanan] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const token = localStorage.getItem('token');
        if (!token) throw new Error('Silakan login terlebih dahulu');

        const response = await axios.get('http://localhost:5000/api/pbf/pesanan-apotek', {
          headers: { 'Authorization': `Bearer ${token}` },
        });

        if (response.data.success) {
          const filtered = response.data.data.filter(p => p.status === 'Perlu Dikirim');
          setPesananData(filtered);
        } else {
          throw new Error(response.data.message);
        }
      } catch (err) {
        setError(err.message);
        if (err.message.includes('login')) navigate('/login/pbf');
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, [navigate]);

  const filteredData = useMemo(() =>
    pesananData.filter(item =>
      item.nama_apotek.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.nomor_pesanan.toLowerCase().includes(searchQuery.toLowerCase())
    ),
  [pesananData, searchQuery]);

  const handleSelectAll = (e) => {
    if (e.target.checked) {
      setSelectedPesanan(filteredData.map(item => item.id));
    } else {
      setSelectedPesanan([]);
    }
  };

  const handleSelectOne = (id) => {
    setSelectedPesanan(prev =>
      prev.includes(id) ? prev.filter(pId => pId !== id) : [...prev, id]
    );
  };

  const handleAturPickup = () => {
    if (selectedPesanan.length === 0) {
      alert('Pilih minimal satu pesanan untuk diatur.');
      return;
    }
    navigate('/pbf/pengelolaan-pesanan/atur-pickup-massal', {
      state: { selectedIds: selectedPesanan }
    });
  };

  return (
    <div className="flex min-h-screen bg-gray-50">
      <SidebarPbf isCollapsed={isCollapsed} setIsCollapsed={setIsCollapsed} />
      <div className={`flex-1 flex flex-col transition-all duration-300 ${isCollapsed ? 'ml-16' : 'ml-64'}`}>
        <NavbarPbf onLogout={() => { localStorage.clear(); navigate('/'); }} />
        <main className="pt-16 p-6">
          <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
            <div>
              <h1 className="text-2xl font-bold">Pengiriman Massal (PBF)</h1>
              <p className="text-gray-500">Pilih pesanan yang siap dikirim ke apotek.</p>
            </div>
            <button
              onClick={handleAturPickup}
              disabled={selectedPesanan.length === 0}
              className="bg-emerald-600 text-white font-medium py-2 px-4 rounded-lg hover:bg-emerald-700 disabled:bg-gray-400 flex items-center gap-2"
            >
              <CalendarPlus size={18} />
              <span>Atur Pickup ({selectedPesanan.length})</span>
            </button>
          </div>

          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="p-4 border-b flex justify-between items-center">
              <div className="relative">
                <Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  placeholder="Cari Apotek atau No. Pesanan..."
                  className="pl-10 pr-4 py-2 border rounded-lg w-full sm:w-80 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
              <p className="text-sm font-medium text-gray-600">{selectedPesanan.length} dari {filteredData.length} pesanan dipilih</p>
            </div>

            <div className="overflow-x-auto">
              {isLoading ? (<p className="text-center p-10">Memuat data...</p>)
               : error ? (<p className="text-center p-10 text-red-500">{error}</p>)
               : (
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left">
                        <input
                          type="checkbox"
                          className="h-4 w-4 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
                          onChange={handleSelectAll}
                          checked={filteredData.length > 0 && selectedPesanan.length === filteredData.length}
                        />
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Apotek</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Nomor Pesanan</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Total Harga</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tgl. Pesanan</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredData.length > 0 ? filteredData.map(order => (
                      <tr key={order.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4">
                          <input
                            type="checkbox"
                            className="h-4 w-4 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
                            checked={selectedPesanan.includes(order.id)}
                            onChange={() => handleSelectOne(order.id)}
                          />
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{order.nama_apotek}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{order.nomor_pesanan}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-800">
                          {new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(order.total_harga)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {new Date(order.tanggal_pesanan).toLocaleDateString('id-ID')}
                        </td>
                      </tr>
                    )) : (
                      <tr>
                        <td colSpan="5" className="text-center p-10 text-gray-500">Tidak ada pesanan yang perlu dikirim.</td>
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

export default PengirimanMassalPbf;