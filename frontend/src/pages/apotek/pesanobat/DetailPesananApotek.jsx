import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import NavbarApotek from '../../../components/NavbarApotek';
import {
  Loader2,
  ArrowLeft,
  AlertCircle,
  FileText,
  Package,
MapPin,
  Calendar,
  Hash,
  Building,
  DollarSign,
  Info // Ditambahkan
} from 'lucide-react';
import axios from 'axios';
import { toast } from 'react-hot-toast'; // Import toast

const DetailPesananApotek = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [pesanan, setPesanan] = useState(null);
    const [detailPesanan, setDetailPesanan] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const username = localStorage.getItem('username'); // Ambil username

    useEffect(() => {
        const fetchDetail = async () => {
            setIsLoading(true);
            setError(null);
            try {
                const token = localStorage.getItem('token');
                if (!token) {
                    toast.error('Sesi tidak valid, silakan login kembali.');
                    navigate('/login/apotek');
                    return;
                }
                const response = await axios.get(`http://localhost:5000/api/apotek/pesanan/${id}`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                if (response.data.success && response.data.data) {
                    setPesanan(response.data.data.pesanan);
                    setDetailPesanan(response.data.data.detail_pesanan);
                } else {
                    throw new Error(response.data.message || 'Data pesanan tidak ditemukan.');
                }
            } catch (err) {
                const errorMsg = err.response?.data?.message || err.message;
                setError(errorMsg);
                toast.error(errorMsg); // Tampilkan error di toast
                if (err.response?.status === 401 || err.response?.status === 403) {
                    navigate('/login/apotek');
                }
            } finally {
                setIsLoading(false);
            }
        };
        fetchDetail();
    }, [id, navigate]);

    const formatDate = (dateString) => {
        if (!dateString) return '-';
        try {
            const date = new Date(dateString);
            if (isNaN(date.getTime())) return '-';
            return new Date(dateString).toLocaleDateString('id-ID', {
                day: '2-digit', month: 'long', year: 'numeric', timeZone: 'UTC'
            });
        } catch(e) { return '-' }
    };

    const getStatusBadge = (status) => {
        switch (status) {
            case 'Menunggu Konfirmasi': return 'bg-amber-100 text-amber-800 border border-amber-200';
            case 'Perlu Dikirim': return 'bg-orange-100 text-orange-800 border border-orange-200';
            case 'Dikirim': return 'bg-blue-100 text-blue-800 border border-blue-200';
            case 'Selesai': return 'bg-emerald-100 text-emerald-800 border border-emerald-200';
            case 'Pembatalan Diajukan': return 'bg-yellow-100 text-yellow-800 border border-yellow-200';
            case 'Dibatalkan': return 'bg-red-100 text-red-800 border border-red-200';
            case 'Pembatalan Ditolak': return 'bg-pink-100 text-pink-800 border border-pink-200';
            default: return 'bg-slate-100 text-slate-700 border border-slate-200';
        }
    };
    
    const handleLogout = () => { // Tambahkan handleLogout
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
            <p className="mt-4 text-slate-700 font-medium">Memuat detail pesanan...</p>
          </div>
        );
    }

    if (error) {
        return (
          <div className="flex min-h-screen bg-slate-50">
            <div className="flex-1 flex flex-col">
              <NavbarApotek onLogout={handleLogout} username={username} />
              <main className="flex-1 flex items-center justify-center p-6 pt-[72px]">
                <div className="bg-white p-8 rounded-2xl shadow-lg border border-red-200 text-center max-w-md">
                  <AlertTriangle className="mx-auto h-12 w-12 text-red-500 mb-4" />
                  <h2 className="text-xl font-bold text-red-800 mb-2">Gagal Memuat Data</h2>
                  <p className="text-red-600 mb-6">{error}</p>
                  <button onClick={() => navigate('/apotek/pesan-obat')} className="flex items-center gap-2 px-4 py-2.5 border border-slate-300 text-slate-700 font-medium rounded-lg hover:bg-slate-100 transition mx-auto">
                    <ArrowLeft size={18} /> Kembali ke Pesanan
                  </button>
                </div>
              </main>
            </div>
          </div>
        );
    }
    
    if (!pesanan) {
        return (
          <div className="flex min-h-screen bg-slate-50">
            <div className="flex-1 flex flex-col">
              <NavbarApotek onLogout={handleLogout} username={username} />
              <main className="flex-1 flex items-center justify-center p-6 pt-[72px]">
                <div className="bg-white p-8 rounded-2xl shadow-lg border border-slate-200 text-center max-w-lg">
                  <FileText className="mx-auto h-12 w-12 text-yellow-500 mb-4" />
                  <h2 className="text-xl font-bold text-slate-800 mb-2">Data Tidak Ditemukan</h2>
                  <p className="text-slate-600 mb-6">Tidak dapat menemukan detail untuk pesanan ini.</p>
                  <button onClick={() => navigate('/apotek/pesan-obat')} className="flex items-center gap-2 px-4 py-2.5 border border-slate-300 text-slate-700 font-medium rounded-lg hover:bg-slate-100 transition mx-auto">
                    <ArrowLeft size={18} /> Kembali ke Pesanan
                  </button>
                </div>
              </main>
            </div>
          </div>
        );
    }
    
    // Ekstrak alasan
    const alasanPembatalan = pesanan.catatan_khusus?.split('Alasan:')[1]?.split('\n')[0]?.trim() || null;
    const alasanPenolakan = pesanan.catatan_khusus?.split('[PENOLAKAN]:')[1]?.trim() || null;

    return (
        <div className="flex min-h-screen bg-slate-50">
            <div className="flex-1 flex flex-col">
                <NavbarApotek onLogout={handleLogout} username={username} />
                
                <main className="flex-1 overflow-auto pt-[72px] px-4 sm:px-6 lg:px-8 py-8">
                    <div className="max-w-5xl mx-auto">
                        
                        <div className="mb-10 relative">
                          <div className="absolute -top-20 -left-20 w-72 h-72 bg-emerald-200 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob"></div>
                          <div className="absolute -top-20 -right-20 w-72 h-72 bg-teal-200 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000"></div>

                          <div className="relative">
                            <button
                              onClick={() => navigate(-1)} // Kembali ke halaman sebelumnya
                              className="mb-4 inline-flex items-center text-emerald-600 hover:text-emerald-700 transition-colors text-sm font-medium"
                            >
                              <ArrowLeft size={16} className="mr-1" /> Kembali
                            </button>
                            <div className="flex items-center gap-3">
                              <div className="flex items-center justify-center w-12 h-12 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl shadow-lg">
                                <FileText className="text-white" size={24} />
                              </div>
                              <div>
                                <h1 className="text-4xl font-bold bg-gradient-to-r from-slate-900 via-emerald-900 to-teal-900 bg-clip-text text-transparent">
                                  Detail Pesanan
                                </h1>
                                <p className="text-slate-600 text-lg mt-1">Nomor Pesanan: <span className="font-medium text-slate-700 font-mono">{pesanan.nomor_pesanan}</span></p>
                              </div>
                            </div>
                          </div>
                        </div>

                        <div className="space-y-6 relative z-10">

                            {/* --- KARTU ALASAN (JIKA ADA) --- */}
                            {alasanPembatalan && (
                              <div className={`p-6 rounded-lg border ${
                                alasanPenolakan 
                                ? 'bg-pink-50 border-pink-200' 
                                : (pesanan.status === 'Dibatalkan' ? 'bg-red-50 border-red-200' : 'bg-yellow-50 border-yellow-200')
                              }`}>
                                <h3 className={`text-lg font-semibold flex items-center gap-2 ${
                                  alasanPenolakan 
                                  ? 'text-pink-800' 
                                  : (pesanan.status === 'Dibatalkan' ? 'text-red-800' : 'text-yellow-800')
                                }`}>
                                  <AlertTriangle size={20} />
                                  Status: {pesanan.status}
                                </h3>
                                <p className={`mt-2 text-sm italic ${
                                  alasanPenolakan 
                                  ? 'text-pink-700' 
                                  : (pesanan.status === 'Dibatalkan' ? 'text-red-700' : 'text-yellow-700')
                                }`}>
                                  "{alasanPembatalan}"
                                </p>
                                {alasanPenolakan && (
                                  <div className="mt-3 pt-3 border-t border-pink-200">
                                    <h4 className="font-semibold text-pink-800">Alasan Penolakan PBF:</h4>
                                    <p className="text-sm text-pink-700 italic">"{alasanPenolakan}"</p>
                                  </div>
                                )}
                              </div>
                            )}

                            {/* --- KARTU INFO UTAMA --- */}
                            <div className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden">
                                <div className="bg-slate-50 px-6 py-4 border-b border-slate-200">
                                    <h2 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
                                        <Info size={20} /> Info Pesanan
                                    </h2>
                                </div>
                                <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-6">
                                    <InfoItem icon={Hash} label="Nomor Pesanan" value={pesanan.nomor_pesanan} mono />
                                    <InfoItem icon={Calendar} label="Tanggal Pesan" value={formatDate(pesanan.tanggal_pesanan)} />
                                    <InfoItem icon={DollarSign} label="Total Harga" value={`Rp ${pesanan.total_harga.toLocaleString('id-ID')}`} highlight />
                                </div>
                            </div>
                            
                            {/* --- KARTU PBF --- */}
                            <div className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden">
                                <div className="bg-slate-50 px-6 py-4 border-b border-slate-200">
                                    <h2 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
                                        <Building size={20} /> PBF (Pengirim)
                                    </h2>
                                </div>
                                <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <InfoItem icon={Building} label="Nama PBF" value={pesanan.nama_pbf} />
                                    <InfoItem icon={MapPin} label="Alamat PBF" value={pesanan.alamat_pbf} />
                                </div>
                            </div>

                            {/* --- KARTU DETAIL ITEM --- */}
                            <div className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden">
                                <div className="bg-slate-50 px-6 py-4 border-b border-slate-200">
                                    <h2 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
                                        <Package size={20} /> Rincian Obat
                                    </h2>
                                </div>
                                <div className="overflow-x-auto">
                                    <table className="min-w-full">
                                        <thead className="bg-slate-50">
                                            <tr>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Nama Obat</th>
                                                <th className="px-6 py-3 text-center text-xs font-medium text-slate-500 uppercase tracking-wider">Jumlah</th>
                                                <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">Harga Satuan</th>
                                                <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">Subtotal</th>
                                            </tr>
                                        </thead>
                                        <tbody className="bg-white divide-y divide-slate-100">
                                            {detailPesanan.map(item => (
                                                <tr key={item.id}>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-900">{item.nama_obat}</td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600 text-center">{item.jumlah} {item.satuan || 'Box'}</td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600 text-right">Rp {Number(item.harga_satuan || 0).toLocaleString('id-ID')}</td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-800 font-medium text-right">Rp {Number(item.total_harga || 0).toLocaleString('id-ID')}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>

                        </div>
                    </div>
                </main>
            </div>
             <style jsx>{`
                @keyframes blob {
                  0%, 100% { transform: translate(0, 0) scale(1); }
                  33% { transform: translate(30px, -50px) scale(1.1); }
                  66% { transform: translate(-20px, 20px) scale(0.9); }
                }
                .animate-blob {
                  animation: blob 7s infinite;
                }
                .animation-delay-2000 {
                  animation-delay: 2s;
                }
              `}</style>
        </div>
    );
};

// Helper komponen
const InfoItem = ({ icon: Icon, label, value, mono = false, highlight = false }) => (
  <div className="space-y-1">
    <span className="text-xs font-medium text-slate-500 flex items-center gap-1.5"><Icon size={14} /> {label}</span>
    <p className={`font-semibold text-base ${mono ? 'font-mono' : ''} ${highlight ? 'text-emerald-700' : 'text-slate-700'}`}>
      {value || '-'}
    </p>
  </div>
);

export default DetailPesananApotek;