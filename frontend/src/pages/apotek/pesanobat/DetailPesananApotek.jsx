import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import SidebarApotek from '../../../components/SidebarApotek';
import NavbarApotek from '../../../components/NavbarApotek';
import { ChevronLeft } from 'lucide-react';

const DetailPesananApotek = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [pesanan, setPesanan] = useState(null);
    const [detailPesanan, setDetailPesanan] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [isCollapsed, setIsCollapsed] = useState(false);

    useEffect(() => {
        const fetchDetail = async () => {
            setIsLoading(true);
            setError(null);
            try {
                const token = localStorage.getItem('token');
                if (!token) {
                    navigate('/login/apotek');
                    return;
                }
                const response = await axios.get(`http://localhost:5000/api/apotek/pesanan/${id}`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                if (response.data.success) {
                    setPesanan(response.data.data.pesanan);
                    setDetailPesanan(response.data.data.detail_pesanan);
                } else {
                    throw new Error(response.data.message);
                }
            } catch (err) {
                setError(err.message);
            } finally {
                setIsLoading(false);
            }
        };
        fetchDetail();
    }, [id, navigate]);

    const formatDate = (dateString) => {
        if (!dateString) return '-';
        return new Date(dateString).toLocaleDateString('id-ID', {
            day: '2-digit', month: 'long', year: 'numeric',
        });
    };

    const getStatusBadge = (status) => {
        switch (status) {
            case 'Menunggu Konfirmasi': return 'bg-yellow-100 text-yellow-800';
            case 'Perlu Dikirim': return 'bg-orange-100 text-orange-800';
            case 'Dikirim': return 'bg-cyan-100 text-cyan-800';
            case 'Selesai': return 'bg-green-100 text-green-800';
            case 'Pembatalan Diajukan': return 'bg-pink-100 text-pink-800';
            case 'Dibatalkan': return 'bg-red-100 text-red-800';
            default: return 'bg-gray-100 text-gray-800';
        }
    };

    if (isLoading) {
        return <div className="flex justify-center items-center h-screen"><p>Loading...</p></div>;
    }

    if (error) {
        return <div className="flex justify-center items-center h-screen"><p className="text-red-500">Error: {error}</p></div>;
    }

    return (
        <div className="flex min-h-screen bg-gray-50">
            <SidebarApotek isCollapsed={isCollapsed} setIsCollapsed={setIsCollapsed} />
            <div className={`flex-1 flex flex-col transition-all duration-300 ${isCollapsed ? 'ml-16' : 'ml-64'}`}>
                <NavbarApotek onLogout={() => { localStorage.clear(); navigate('/'); }} />
                <main className="flex-1 pt-16 p-6">
                    <div className="mb-6">
                        <Link to="/apotek/riwayat-pembelian" className="flex items-center text-emerald-600 hover:text-emerald-800">
                            <ChevronLeft size={20} />
                            Kembali ke Riwayat Pembelian
                        </Link>
                        <h1 className="text-2xl font-bold mt-2">Detail Pesanan #{pesanan?.nomor_pesanan}</h1>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="md:col-span-2 bg-white p-6 rounded-lg shadow">
                            <h2 className="text-lg font-semibold border-b pb-2 mb-4">Rincian Obat</h2>
                            <div className="overflow-x-auto">
                                <table className="min-w-full divide-y divide-gray-200">
                                    <thead className="bg-gray-50">
                                        <tr>
                                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Nama Obat</th>
                                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Jumlah</th>
                                            <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">Harga Satuan</th>
                                            <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">Subtotal</th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white divide-y divide-gray-200">
                                        {detailPesanan.map(item => (
                                            <tr key={item.id}>
                                                <td className="px-4 py-3 text-sm text-gray-900">{item.nama_obat}</td>
                                                <td className="px-4 py-3 text-sm text-gray-500">{item.jumlah} {item.satuan}</td>
                                                <td className="px-4 py-3 text-sm text-gray-500 text-right">Rp {item.harga_satuan.toLocaleString('id-ID')}</td>
                                                <td className="px-4 py-3 text-sm text-gray-900 font-medium text-right">Rp {(item.jumlah * item.harga_satuan).toLocaleString('id-ID')}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        <div className="bg-white p-6 rounded-lg shadow h-fit">
                            <h2 className="text-lg font-semibold border-b pb-2 mb-4">Informasi Pesanan</h2>
                            <div className="space-y-3 text-sm">
                                <div className="flex justify-between">
                                    <span className="text-gray-500">Status:</span>
                                    <span className={`font-semibold px-2 py-1 text-xs rounded-full ${getStatusBadge(pesanan.status)}`}>
                                        {pesanan.status}
                                    </span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-500">Tanggal Pesan:</span>
                                    <span className="font-medium text-gray-800">{formatDate(pesanan.tanggal_pesanan)}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-500">PBF Tujuan:</span>
                                    <span className="font-medium text-gray-800">{pesanan.nama_pbf}</span>
                                </div>
                                 <div className="border-t my-3"></div>
                                <div className="flex justify-between text-base font-bold">
                                    <span>Total Harga:</span>
                                    <span>Rp {pesanan.total_harga.toLocaleString('id-ID')}</span>
                                </div>
                            </div>
                            {pesanan.status === 'Dibatalkan' && pesanan.catatan_khusus && (
                                <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                                    <h3 className="font-semibold text-red-800">Alasan Pembatalan:</h3>
                                    <p className="text-sm text-red-700">{pesanan.catatan_khusus.split('Alasan:')[1]?.trim() || pesanan.catatan_khusus}</p>
                                </div>
                            )}
                        </div>
                    </div>
                </main>
            </div>
        </div>
    );
};

export default DetailPesananApotek;