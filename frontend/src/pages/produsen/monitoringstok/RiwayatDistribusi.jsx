import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import SidebarProdusen from '../../../components/SidebarProdusen';
import NavbarProdusen from '../../../components/NavbarProdusen';
import { Search, Package, Truck, Box } from 'lucide-react';

const RiwayatDistribusi = () => {
  const navigate = useNavigate();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [distribusiData, setDistribusiData] = useState([]);
  const [stats, setStats] = useState({
    totalStok: 0,
    distribusiBulanIni: 0,
    stokMenipis: 0,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('Semua');

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const token = localStorage.getItem('token');
        if (!token) throw new Error('Silakan login terlebih dahulu');

        // Mengambil data stok dan data distribusi secara bersamaan
        const [stokResponse, distribusiResponse] = await Promise.all([
          fetch('http://localhost:5000/api/produksi/jadwal', {
            headers: { 'Authorization': `Bearer ${token}` }
          }),
          fetch('http://localhost:5000/api/produsen/riwayat-distribusi', {
            headers: { 'Authorization': `Bearer ${token}` }
          })
        ]);

        if (!stokResponse.ok || !distribusiResponse.ok) {
          throw new Error('Gagal mengambil data dari server.');
        }

        const stokResult = await stokResponse.json();
        const distribusiResult = await distribusiResponse.json();

        if (!stokResult.success || !distribusiResult.success) {
          throw new Error('Respons dari server tidak berhasil.');
        }

        // --- Logika Kalkulasi Statistik dari MonitoringStok.jsx ---
        const stokData = stokResult.data || [];
        let total = 0;
        let menipis = 0;
        stokData.forEach(item => {
          const jumlahStok = item.jumlah || 0;
          total += jumlahStok;
          if (jumlahStok > 0 && jumlahStok < 2000) {
            menipis += jumlahStok;
          }
        });

        // Hitung distribusi bulan ini dari data distribusi
        const distribusiBulanIni = (distribusiResult.data || []).filter(item => {
            if (!item.tanggal_pengiriman) return false;
            const bulanIni = new Date().getMonth();
            const tahunIni = new Date().getFullYear();
            const tanggalData = new Date(item.tanggal_pengiriman);
            return tanggalData.getMonth() === bulanIni && tanggalData.getFullYear() === tahunIni;
        }).length;

        setStats({
          totalStok: total,
          distribusiBulanIni: 0, // Sesuai permintaan Anda, ini diatur ke 0
          stokMenipis: menipis,
        });
        // --- Akhir Logika Kalkulasi ---

        // Proses data distribusi untuk tabel (tidak berubah)
        const mappedData = (distribusiResult.data || []).map(item => ({
          id: item.id,
          nomor_po: item.nomor_po,
          tujuan: item.nama_pbf || '-',
          nomor_surat_jalan: item.nomor_surat_jalan,
          jumlah_total_obat: item.jumlah_total_obat || 0,
          tanggal_pengiriman: item.tanggal_pengiriman,
          status_pengiriman:
            item.status_blockchain === 'DITERIMA_PBF' ? 'Diterima' :
            item.status_blockchain === 'DIKIRIM_KE_PBF' ? 'Dikirim' :
            item.status === 'Dikirim' ? 'Dikirim' :
            item.status === 'Selesai' ? 'Diterima' :
            'Tidak Diketahui',
        })).filter(item => 
          item.status_pengiriman === 'Dikirim' || item.status_pengiriman === 'Diterima'
        );
        setDistribusiData(mappedData);

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

  const filteredData = useMemo(() => {
    return distribusiData
      .filter(item => {
        if (statusFilter === 'Semua') return true;
        return item.status_pengiriman === statusFilter;
      })
      .filter(item => {
        const searchableString = `${item.nomor_po || ''} ${item.nomor_surat_jalan || ''} ${item.tujuan || ''}`.toLowerCase();
        return searchableString.includes(searchTerm.toLowerCase());
      });
  }, [distribusiData, searchTerm, statusFilter]);

  const StatCard = ({ icon, value, label, unit }) => (
    <div className="bg-white p-6 rounded-xl shadow-lg flex items-center gap-6">
      <div className="bg-emerald-100 p-4 rounded-full">{icon}</div>
      <div>
        <p className="text-3xl font-bold text-gray-800">
          {value.toLocaleString('id-ID')} <span className="text-xl font-medium text-gray-500">{unit}</span>
        </p>
        <p className="text-gray-500">{label}</p>
      </div>
    </div>
  );

  return (
    <div className="flex min-h-screen bg-gray-50">
      <SidebarProdusen isCollapsed={isCollapsed} setIsCollapsed={setIsCollapsed} />
      <div className={`flex-1 flex flex-col transition-all duration-300 ${isCollapsed ? 'ml-16' : 'ml-64'}`}>
        <NavbarProdusen onLogout={handleLogout} />
        <main className="pt-16 p-6">
          <h1 className="text-2xl font-bold mb-6">Riwayat Distribusi</h1>

          {/* Statistik */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <StatCard icon={<Package size={32} className="text-emerald-600" />} value={stats.totalStok} label="Total Stok" unit="box" />
          <StatCard icon={<Truck size={32} className="text-emerald-600" />} value={stats.distribusiBulanIni} label="Distribusi Bulan Ini" unit="unit" />
          <StatCard icon={<Box size={32} className="text-emerald-600" />} value={stats.stokMenipis} label="Stok Menipis" unit="box" />
        </div>

          {error && <div className="mb-4 p-4 bg-red-100 text-red-700 rounded">{error}</div>}

          {/* Table */}
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="flex justify-between items-center p-4 border-b">
              <div className="flex">
                <Link to="/produsen/monitoring-stok" className="py-2 px-4 text-center text-gray-500 hover:text-emerald-600">
                  Stok Gudang
                </Link>
                <button className="py-2 px-4 text-center border-b-2 border-emerald-600 text-emerald-600 font-medium">Riwayat Distribusi</button>
              </div>
              <div className="flex items-center gap-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <input
                    type="text"
                    className="w-full pl-10 pr-4 py-2 border rounded-lg"
                    placeholder="Cari..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="p-2 border rounded-lg"
                >
                  <option value="Semua">Semua status</option>
                  <option value="Dikirim">Dikirim</option>
                  <option value="Diterima">Diterima</option>
                </select>
              </div>
            </div>

            <div className="overflow-x-auto">
              {isLoading ? (
                <p className="p-4 text-center">Memuat...</p>
              ) : (
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Nomor PO</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tujuan</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Nomor Surat Jalan</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Jumlah</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tanggal Kirim</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredData.length > 0 ? (
                      filteredData.map(item => (
                        <tr key={item.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{item.nomor_po || '-'}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item.tujuan || '-'}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item.nomor_surat_jalan || '-'}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item.jumlah_total_obat?.toLocaleString('id-ID') || '0'} unit</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {item.tanggal_pengiriman ? new Date(item.tanggal_pengiriman).toLocaleDateString('id-ID') : '-'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span
                              className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                                ${item.status_pengiriman === 'Dikirim'
                                  ? 'bg-blue-100 text-blue-800'
                                  : item.status_pengiriman === 'Diterima'
                                  ? 'bg-green-100 text-green-800'
                                  : 'bg-gray-100 text-gray-600'}`}
                            >
                              {item.status_pengiriman}
                            </span>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="7" className="px-6 py-4 text-center text-gray-500">
                          Tidak ada data yang sesuai.
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

export default RiwayatDistribusi;