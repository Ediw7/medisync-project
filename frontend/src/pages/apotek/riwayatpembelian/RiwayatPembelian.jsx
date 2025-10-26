import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import SidebarApotek from '../../../components/SidebarApotek';
import NavbarApotek from '../../../components/NavbarApotek';
import { Search, Plus } from 'lucide-react';
import axios from 'axios';

const RiwayatPembelian = () => {
    const navigate = useNavigate();
    const [isCollapsed, setIsCollapsed] = useState(false);
    const [riwayatData, setRiwayatData] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('Semua');

    useEffect(() => {
        const fetchRiwayat = async () => {
            setIsLoading(true);
            setError(null);
            try {
                const token = localStorage.getItem('token');
                if (!token) {
                    navigate('/login/apotek');
                    return;
                }
                // Menggunakan endpoint yang sama dengan halaman 'Pesan Obat' untuk mendapatkan semua pesanan
                const response = await axios.get('http://localhost:5000/api/apotek/pesanan', {
                    headers: { Authorization: `Bearer ${token}` },
                });
                if (response.data.success) {
                    setRiwayatData(response.data.data || []);
                } else {
                    throw new Error(response.data.message || 'Gagal mengambil data riwayat.');
                }
            } catch (err) {
                setError(err.message);
            } finally {
                setIsLoading(false);
            }
        };
        fetchRiwayat();
    }, [navigate]);

    const filteredData = useMemo(() => {
        // Hanya tampilkan status final di halaman riwayat
        const relevantStatuses = ['Selesai', 'Dibatalkan', 'Dikembalikan', 'Ditolak'];
        return riwayatData
            .filter(item => {
                // Jika filter bukan 'Semua', filter berdasarkan status yang dipilih
                if (statusFilter !== 'Semua') {
                    return item.status === statusFilter;
                }
                // Jika filter 'Semua', tampilkan semua pesanan dengan status final
                return relevantStatuses.includes(item.status);
            })
            .filter(item =>
                (item.nomor_pesanan?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
                (item.nama_pbf?.toLowerCase() || '').includes(searchTerm.toLowerCase())
            );
    }, [riwayatData, searchTerm, statusFilter]);

    const getStatusBadge = (status) => {
        switch (status) {
            case 'Selesai': return 'bg-green-100 text-green-800';
            case 'Dibatalkan': return 'bg-red-100 text-red-800';
            case 'Dikembalikan': return 'bg-blue-100 text-blue-800'; // Contoh untuk masa depan
            case 'Ditolak': return 'bg-orange-100 text-orange-800'; // Contoh untuk masa depan
            default: return 'bg-gray-100 text-gray-800';
        }
    };

    const formatDate = (dateString) => {
        if (!dateString) return '-';
        return new Date(dateString).toLocaleDateString('id-ID', {
            day: '2-digit', month: 'long', year: 'numeric',
        });
    };

    return (
        <div className="flex min-h-screen bg-gray-50">
            <SidebarApotek isCollapsed={isCollapsed} setIsCollapsed={setIsCollapsed} />
            <div className={`flex-1 flex flex-col transition-all duration-300 ${isCollapsed ? 'ml-16' : 'ml-64'}`}>
                <NavbarApotek onLogout={() => { localStorage.clear(); navigate('/'); }} />
                <main className="flex-1 pt-16 p-6 mt-8 ml-8">
                    <div className="flex flex-wrap justify-between items-center mb-6">
                        <div>
                            <h1 className="text-2xl font-bold">Riwayat Pembelian</h1>
                            <p className="text-gray-500">Melihat riwayat pesanan yang telah selesai atau dibatalkan.</p>
                        </div>
                        <button
                            onClick={() => navigate('/apotek/pesan-obat')}
                            className="bg-emerald-600 text-white py-2 px-4 rounded-lg hover:bg-emerald-700 transition flex items-center gap-2"
                        >
                            <Plus size={18} />
                            Pesan Obat Baru
                        </button>
                    </div>

                    {error && <div className="mb-4 p-4 bg-red-100 text-red-700 rounded-lg">{error}</div>}

                    <div className="bg-white p-6 rounded-lg shadow">
                        <div className="flex flex-col md:flex-row gap-4 mb-4">
                            <div className="relative flex-grow">
                                <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                                <input
                                    type="text"
                                    placeholder="Cari No. Pesanan atau Nama PBF..."
                                    className="pl-10 pr-4 py-2 border rounded-lg text-sm w-full focus:ring-2 focus:ring-emerald-500"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                />
                            </div>
                            <div className="relative">
                                <select
                                    className="appearance-none w-full md:w-48 bg-white border rounded-lg px-4 py-2 text-sm focus:ring-2 focus:ring-emerald-500"
                                    value={statusFilter}
                                    onChange={(e) => setStatusFilter(e.target.value)}
                                >
                                    <option value="Semua">Semua Status</option>
                                    <option value="Selesai">Selesai</option>
                                    <option value="Dibatalkan">Dibatalkan</option>
                                    <option value="Dikembalikan">Dikembalikan</option>
                                    <option value="Ditolak">Ditolak</option>
                                </select>
                            </div>
                        </div>

                        <div className="overflow-x-auto">
                            {isLoading ? (
                                <p className="text-center py-10 text-gray-500">Memuat data riwayat...</p>
                            ) : (
                                <table className="min-w-full">
                                    <thead className="bg-gray-50">
                                        <tr>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Nomor Pesanan</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">PBF</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tanggal Pesan</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Total Harga</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Aksi</th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white divide-y divide-gray-200">
                                        {filteredData.length > 0 ? filteredData.map((item) => (
                                            <tr key={item.id}>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{item.nomor_pesanan}</td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm">{item.nama_pbf}</td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm">{formatDate(item.tanggal_pesanan)}</td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm">Rp {(item.total_harga || 0).toLocaleString('id-ID')}</td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm">
                                                    <span className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusBadge(item.status)}`}>
                                                        {item.status}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-emerald-600 font-semibold hover:underline">
                                                    <Link to={`/apotek/pesanan/${item.id}/detail`}>Lihat Detail</Link>
                                                </td>
                                            </tr>
                                        )) : (
                                            <tr>
                                                <td colSpan="6" className="text-center py-10 text-gray-500">
                                                    Tidak ada data riwayat yang sesuai dengan filter.
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

export default RiwayatPembelian;