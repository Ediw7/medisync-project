import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import NavbarApotek from '../../../components/NavbarApotek';
import { Search, Plus, History, Loader2 } from 'lucide-react';
import axios from 'axios';

const RiwayatPembelian = () => {
    const navigate = useNavigate();
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
        const relevantStatuses = ['Selesai', 'Dibatalkan', 'Dikembalikan', 'Ditolak'];
        return riwayatData
            .filter(item => {
                if (statusFilter !== 'Semua') {
                    return item.status === statusFilter;
                }
                return relevantStatuses.includes(item.status);
            })
            .filter(item =>
                (item.nomor_pesanan?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
                (item.nama_pbf?.toLowerCase() || '').includes(searchTerm.toLowerCase())
            );
    }, [riwayatData, searchTerm, statusFilter]);

    const getStatusBadge = (status) => {
        switch (status) {
            case 'Selesai': return 'bg-emerald-50 text-emerald-700 border-emerald-200';
            case 'Dibatalkan': return 'bg-red-50 text-red-700 border-red-200';
            case 'Dikembalikan': return 'bg-blue-50 text-blue-700 border-blue-200';
            case 'Ditolak': return 'bg-orange-50 text-orange-700 border-orange-200';
            default: return 'bg-slate-50 text-slate-700 border-slate-200';
        }
    };

    const formatDate = (dateString) => {
        if (!dateString) return '-';
        return new Date(dateString).toLocaleDateString('id-ID', {
            day: '2-digit', month: 'long', year: 'numeric',
        });
    };

    const handleLogout = () => {
        localStorage.clear();
        navigate('/');
    };

    if (isLoading) {
        return (
            <div className="flex flex-col justify-center items-center h-screen bg-gradient-to-br from-slate-50 via-white to-emerald-50">
                <div className="relative">
                    <Loader2 className="animate-spin h-12 w-12 text-emerald-600" />
                    <div className="absolute inset-0 h-12 w-12 rounded-full border-4 border-emerald-200 animate-ping opacity-20"></div>
                </div>
                <p className="mt-4 text-slate-700 font-medium">Memuat riwayat pembelian...</p>
            </div>
        );
    }

    return (
        <div className="flex min-h-screen bg-gradient-to-br from-slate-50 via-white to-emerald-50">
            <div className="flex-1 flex flex-col">
                <NavbarApotek onLogout={handleLogout} />
                
                <main className="flex-1 overflow-auto pt-[72px]">
                    <div className="max-w-7xl mx-auto px-6 py-8">
                        {/* Header */}
                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
                            <div>
                                <h1 className="text-3xl font-bold text-slate-900 mb-2">Riwayat Pembelian</h1>
                                <p className="text-slate-600">Melihat riwayat pesanan yang telah selesai atau dibatalkan</p>
                            </div>
                            <button
                                onClick={() => navigate('/apotek/pesan-obat')}
                                className="flex items-center gap-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white py-2.5 px-5 rounded-xl font-medium shadow-lg hover:shadow-xl transition-all duration-200"
                            >
                                <Plus size={20} />
                                Pesan Obat Baru
                            </button>
                        </div>

                        {error && (
                            <div className="p-4 mb-6 bg-red-50 text-red-700 rounded-2xl border border-red-200 flex items-center gap-3 shadow-sm">
                                <span className="font-medium">{error}</span>
                            </div>
                        )}

                        {/* Main Card */}
                        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                            {/* Filters */}
                            <div className="p-6 border-b border-slate-200">
                                <div className="flex flex-col md:flex-row gap-4">
                                    <div className="relative flex-grow">
                                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                                        <input
                                            type="text"
                                            placeholder="Cari No. Pesanan atau Nama PBF..."
                                            className="w-full pl-10 pr-4 py-2.5 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
                                            value={searchTerm}
                                            onChange={(e) => setSearchTerm(e.target.value)}
                                        />
                                    </div>
                                    <div className="w-full md:w-auto">
                                        <select
                                            className="w-full md:w-48 px-4 py-2.5 border border-slate-300 rounded-xl text-slate-700 bg-white hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all cursor-pointer"
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
                            </div>

                            {/* Table */}
                            <div className="overflow-x-auto">
                                <table className="min-w-full">
                                    <thead>
                                        <tr className="border-b-2 border-slate-200 bg-slate-50">
                                            <th className="px-6 py-4 text-left text-xs font-bold text-slate-600 uppercase tracking-wider">Nomor Pesanan</th>
                                            <th className="px-6 py-4 text-left text-xs font-bold text-slate-600 uppercase tracking-wider">PBF</th>
                                            <th className="px-6 py-4 text-left text-xs font-bold text-slate-600 uppercase tracking-wider">Tanggal Pesan</th>
                                            <th className="px-6 py-4 text-left text-xs font-bold text-slate-600 uppercase tracking-wider">Total Harga</th>
                                            <th className="px-6 py-4 text-left text-xs font-bold text-slate-600 uppercase tracking-wider">Status</th>
                                            <th className="px-6 py-4 text-left text-xs font-bold text-slate-600 uppercase tracking-wider">Aksi</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100">
                                        {filteredData.length > 0 ? filteredData.map((item) => (
                                            <tr key={item.id} className="hover:bg-slate-50 transition-colors">
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <span className="text-sm font-mono text-slate-900 bg-slate-100 px-2 py-1 rounded">{item.nomor_pesanan}</span>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-slate-900">{item.nama_pbf}</td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">{formatDate(item.tanggal_pesanan)}</td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-slate-900">Rp {(item.total_harga || 0).toLocaleString('id-ID')}</td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <span className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full border ${getStatusBadge(item.status)}`}>
                                                        {item.status}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <Link 
                                                        to={`/apotek/pesanan/${item.id}/detail`}
                                                        className="text-sm font-medium text-emerald-600 hover:text-emerald-700 hover:underline transition-colors"
                                                    >
                                                        Lihat Detail
                                                    </Link>
                                                </td>
                                            </tr>
                                        )) : (
                                            <tr>
                                                <td colSpan="6" className="text-center py-12">
                                                    <History size={48} className="mx-auto mb-3 text-slate-300" />
                                                    <p className="text-slate-500 font-medium">
                                                        {searchTerm || statusFilter !== 'Semua'
                                                            ? "Tidak ada riwayat yang sesuai dengan filter."
                                                            : "Belum ada riwayat pembelian."}
                                                    </p>
                                                </td>
                                            </tr>
                                        )}
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

export default RiwayatPembelian;