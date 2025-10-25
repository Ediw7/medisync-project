import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import SidebarProdusen from '../../../components/SidebarProdusen';
import NavbarProdusen from '../../../components/NavbarProdusen';
import { Search, ArrowUpDown, Filter, X } from 'lucide-react';

const ManajemenProduksi = () => {
  const navigate = useNavigate();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [produksiData, setProduksiData] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const [showFilters, setShowFilters] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({
    month: '',
    year: new Date().getFullYear(),
    minJumlah: '',
    maxJumlah: '',
    status: '',
  });
  const [sortConfig, setSortConfig] = useState({ key: 'tanggal_produksi', direction: 'desc' });

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem('token');
      if (!token) throw new Error('Silakan login terlebih dahulu');

      const params = new URLSearchParams();
      if (filters.month) params.append('month', filters.month);
      if (filters.year) params.append('year', filters.year);
      if (filters.minJumlah) params.append('minJumlah', filters.minJumlah);
      if (filters.maxJumlah) params.append('maxJumlah', filters.maxJumlah);
      if (filters.status) params.append('status', filters.status);
      if (sortConfig.key) {
        params.append('sortBy', sortConfig.key);
        params.append('sortOrder', sortConfig.direction);
      }
      
      const response = await fetch(`http://localhost:5000/api/produksi/jadwal?${params.toString()}`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });

      if (!response.ok) throw new Error('Gagal mengambil data dari server');
      const result = await response.json();
      if (!result.success) throw new Error(result.message);
      
      let data = result.data.filter(item => item.status !== 'Tercatat di Blockchain');
      if (searchTerm) {
        data = data.filter(item =>
          item.batch_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
          item.nama_obat.toLowerCase().includes(searchTerm.toLowerCase())
        );
      }
      setProduksiData(data);

    } catch (error) {
      setError(error.message);
      if (error.message.includes('login')) navigate('/login/produsen');
    } finally {
      setIsLoading(false);
    }
  }, [filters, sortConfig, searchTerm, navigate]);

  useEffect(() => {
    const handler = setTimeout(() => {
        fetchData();
    }, 500);
    return () => clearTimeout(handler);
  }, [fetchData]);
  
  const handleFilterChange = (e) => {
    setFilters({ ...filters, [e.target.name]: e.target.value });
  };

  const resetFilters = () => {
    setFilters({ month: '', year: new Date().getFullYear(), minJumlah: '', maxJumlah: '', status: '' });
    setSearchTerm('');
  };

  const requestSort = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  // --- FUNGSI BARU UNTUK MENGHAPUS DATA ---
  const handleDelete = async (id) => {
    if (!window.confirm('Apakah Anda yakin ingin menghapus jadwal produksi ini?')) return;
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:5000/api/produksi/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` },
      });
      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.message || 'Gagal menghapus data');
      }
      // Hapus item dari state lokal agar UI langsung update
      setProduksiData(produksiData.filter(item => item.id !== id));
      alert('Jadwal produksi berhasil dihapus');
    } catch (error) {
      setError(error.message);
    }
  };

  return (
    <div className="flex min-h-screen bg-gray-50">
      <SidebarProdusen isCollapsed={isCollapsed} setIsCollapsed={setIsCollapsed} />
      <div className={`flex-1 flex flex-col transition-all duration-300 ${isCollapsed ? 'ml-16' : 'ml-64'}`}>
        <NavbarProdusen onLogout={() => { localStorage.clear(); navigate('/'); }} />
        <main className="pt-18 pl-12 p-6">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-bold">Manajemen Produksi</h1>
            <button onClick={() => navigate('/produsen/produksi/tambah')} className="bg-emerald-600 hover:bg-emerald-700 text-white py-2 px-4 rounded flex items-center gap-2">
              <span className="font-semibold">+</span> Jadwalkan Produksi
            </button>
          </div>

          {error && <div className="mb-4 p-4 bg-red-100 text-red-700 rounded">{error}</div>}

          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="p-4 border-b">
                <div className="flex justify-between items-center">
                    <div className="flex">
                        <button className="py-2 px-4 text-center border-b-2 border-emerald-600 text-emerald-600 font-medium">Jadwal Produksi</button>
                        <Link to="/produsen/riwayat-produksi" className="py-2 px-4 text-center text-gray-500 hover:text-emerald-600">Riwayat Produksi</Link>
                    </div>
                    <div className="flex items-center gap-4">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                            <input type="text" className="w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500" placeholder="Cari batch..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
                        </div>
                        <button onClick={() => setShowFilters(!showFilters)} className="p-2 border rounded-lg flex items-center gap-2 text-gray-600 hover:bg-gray-100">
                            <Filter size={18} /> Filter
                        </button>
                    </div>
                </div>
                {showFilters && (
                    <div className="p-4 bg-gray-50 grid grid-cols-2 md:grid-cols-5 gap-4 items-end border-t">
                        <select name="status" value={filters.status} onChange={handleFilterChange} className="p-2 border rounded-lg w-full"><option value="">Semua Status</option><option>Terjadwal</option><option>Dalam Produksi</option><option>Selesai</option></select>
                        <select name="month" value={filters.month} onChange={handleFilterChange} className="p-2 border rounded-lg w-full"><option value="">Semua Bulan</option>{[...Array(12).keys()].map(i => <option key={i+1} value={i+1}>{new Date(0, i).toLocaleString('id-ID', { month: 'long' })}</option>)}</select>
                        <input type="number" name="year" value={filters.year} onChange={handleFilterChange} placeholder="Tahun" className="p-2 border rounded-lg w-full" />
                        <input type="number" name="minJumlah" value={filters.minJumlah} onChange={handleFilterChange} placeholder="Jumlah Min" className="p-2 border rounded-lg w-full" />
                        <input type="number" name="maxJumlah" value={filters.maxJumlah} onChange={handleFilterChange} placeholder="Jumlah Max" className="p-2 border rounded-lg w-full" />
                        <button onClick={resetFilters} className="p-2 border rounded-lg flex items-center gap-2 text-red-600 hover:bg-red-50 justify-center col-span-2 md:col-span-1 mt-4 md:mt-0">
                            <X size={18} /> Reset Filter
                        </button>
                    </div>
                )}
            </div>

            <div className="overflow-x-auto">
              {isLoading ? <p className="p-4 text-center">Loading...</p> : (
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      {[{label: 'Batch ID', key: 'batch_id'}, {label: 'Nama Obat', key: 'nama_obat'}, {label: 'Tgl. Produksi', key: 'tanggal_produksi'}, {label: 'Jumlah', key: 'jumlah'}, {label: 'Status', key: 'status'}].map(header => (
                        <th key={header.key} className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          <button onClick={() => requestSort(header.key)} className="flex items-center gap-1 hover:text-gray-800">{header.label} <ArrowUpDown size={14} /></button>
                        </th>
                      ))}
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {produksiData.map((item) => (
                      <tr key={item.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{item.batch_id}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item.nama_obat}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{new Date(item.tanggal_produksi).toLocaleDateString('id-ID')}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item.jumlah}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item.status}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-4">
                          <button onClick={() => navigate(`/produsen/produksi/detail/${item.id}`)} className="text-indigo-600 hover:text-indigo-900">Detail</button>
                          <button onClick={() => navigate(`/produsen/produksi/edit/${item.id}`)} className="text-yellow-600 hover:text-yellow-900">Edit</button>
                          {/* --- TOMBOL HAPUS SEKARANG MEMANGGIL FUNGSI handleDelete --- */}
                          <button onClick={() => handleDelete(item.id)} className="text-red-600 hover:text-red-900">Hapus</button>
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
export default ManajemenProduksi;