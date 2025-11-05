import React, { useState, useEffect, useRef } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import NavbarApotek from '../../../components/NavbarApotek';
import {
  Loader2,
  ArrowLeft,
  AlertTriangle,
  FileText,
  User,
  Calendar,
  DollarSign,
  QrCode,
  Package,
  Info
} from 'lucide-react';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import QRCode from 'react-qr-code';

// Helper komponen
const InfoItem = ({ icon: Icon, label, value, mono = false, highlight = false }) => (
  <div className="space-y-1">
    <span className="text-xs font-medium text-slate-500 flex items-center gap-1.5"><Icon size={14} /> {label}</span>
    <p className={`font-semibold text-base ${mono ? 'font-mono' : ''} ${highlight ? 'text-emerald-700' : 'text-slate-700'}`}>
      {value || '-'}
    </p>
  </div>
);

const DetailPenjualan = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [penjualan, setPenjualan] = useState(null);
    const [detail, setDetail] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const username = localStorage.getItem('username');

    useEffect(() => {
        const fetchDetail = async () => {
            setIsLoading(true);
            setError(null);
            try {
                const token = localStorage.getItem('token');
                if (!token) {
                    toast.error('Sesi tidak valid.');
                    navigate('/login/apotek');
                    return;
                }
                // Panggil endpoint detail
                const response = await axios.get(`http://localhost:5000/api/apotek/penjualan/riwayat/${id}`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                if (response.data.success && response.data.data) {
                    setPenjualan(response.data.data.penjualan);
                    setDetail(response.data.data.detail);
                } else {
                    throw new Error(response.data.message || 'Data penjualan tidak ditemukan.');
                }
            } catch (err) {
                const errorMsg = err.response?.data?.message || err.message;
                setError(errorMsg);
                toast.error(errorMsg);
                if (err.response?.status === 401) navigate('/login/apotek');
            } finally {
                setIsLoading(false);
            }
        };
        fetchDetail();
    }, [id, navigate]);

    const formatDate = (dateString) => {
        if (!dateString) return '-';
        return new Date(dateString).toLocaleString('id-ID', {
            day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit'
        });
    };
    
    const handleLogout = () => {
        localStorage.clear();
        navigate('/');
    };

    if (isLoading) {
        return (
          <div className="flex flex-col justify-center items-center h-screen bg-gradient-to-br from-slate-50 via-white to-emerald-50">
            <Loader2 className="animate-spin h-12 w-12 text-emerald-600" />
            <p className="mt-4 text-slate-700 font-medium">Memuat detail penjualan...</p>
          </div>
        );
    }
    
    if (error || !penjualan) {
        return (
          <div className="flex min-h-screen bg-slate-50">
            <div className="flex-1 flex flex-col">
              <NavbarApotek onLogout={handleLogout} username={username} />
              <main className="flex-1 flex items-center justify-center p-6 pt-[72px]">
                <div className="bg-white p-8 rounded-2xl shadow-lg border border-red-200 text-center max-w-md">
                  <AlertTriangle className="mx-auto h-12 w-12 text-red-500 mb-4" />
                  <h2 className="text-xl font-bold text-red-800 mb-2">Gagal Memuat Data</h2>
                  <p className="text-red-600 mb-6">{error || 'Data tidak ditemukan.'}</p>
                  <button onClick={() => navigate('/apotek/riwayat-penjualan')} className="flex items-center gap-2 px-4 py-2.5 border border-slate-300 text-slate-700 font-medium rounded-lg hover:bg-slate-100 transition mx-auto">
                    <ArrowLeft size={18} /> Kembali ke Riwayat
                  </button>
                </div>
              </main>
            </div>
          </div>
        );
    }

    return (
        <div className="flex min-h-screen bg-slate-50">
            <div className="flex-1 flex flex-col">
                <NavbarApotek onLogout={handleLogout} username={username} />
                
                <main className="flex-1 overflow-auto pt-[72px] px-4 sm:px-6 lg:px-8 py-8">
                    <div className="max-w-4xl mx-auto">
                        
                        <div className="mb-10 relative">
                          <div className="absolute -top-20 -left-20 w-72 h-72 bg-emerald-200 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob"></div>
                          <div className="absolute -top-20 -right-20 w-72 h-72 bg-teal-200 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000"></div>

                          <div className="relative">
                            <button
                              onClick={() => navigate('/apotek/riwayat-penjualan')}
                              className="mb-4 inline-flex items-center text-emerald-600 hover:text-emerald-700 transition-colors text-sm font-medium"
                            >
                              <ArrowLeft size={16} className="mr-1" /> Kembali ke Riwayat
                            </button>
                            <div className="flex items-center gap-3">
                              <div className="flex items-center justify-center w-12 h-12 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl shadow-lg">
                                <FileText className="text-white" size={24} />
                              </div>
                              <div>
                                <h1 className="text-4xl font-bold bg-gradient-to-r from-slate-900 via-emerald-900 to-teal-900 bg-clip-text text-transparent">
                                  Detail Penjualan
                                </h1>
                                <p className="text-slate-600 text-lg mt-1">ID Penjualan: <span className="font-medium text-slate-700 font-mono">#{String(penjualan.id).padStart(6, '0')}</span></p>
                              </div>
                            </div>
                          </div>
                        </div>

                        <div className="space-y-6 relative z-10">
                            {/* --- KARTU INFO TRANSAKSI --- */}
                            <div className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden">
                                <div className="bg-slate-50 px-6 py-4 border-b border-slate-200">
                                    <h2 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
                                        <Info size={20} /> Info Transaksi
                                    </h2>
                                </div>
                                <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-6">
                                    <InfoItem icon={User} label="Nama Pelanggan" value={penjualan.nama_pelanggan} />
                                    <InfoItem icon={Calendar} label="Tanggal Transaksi" value={formatDate(penjualan.tanggal_penjualan)} />
                                    <InfoItem icon={DollarSign} label="Total Transaksi" value={`Rp ${penjualan.total_harga.toLocaleString('id-ID')}`} highlight />
                                </div>
                            </div>

                            {/* --- KARTU QR CODE --- */}
                            <div className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden">
                                <div className="bg-slate-50 px-6 py-4 border-b border-slate-200">
                                    <h2 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
                                        <QrCode size={20} /> QR Code Pelacakan (untuk Konsumen)
                                    </h2>
                                </div>
                                <div className="p-6 space-y-4">
                                  {detail.map((item) => (
                                    <div key={item.id_aset_blockchain} className="flex flex-col sm:flex-row items-center gap-4 p-4 bg-white rounded-lg border border-slate-200">
                                      <div className="p-2 bg-white border rounded-lg">
                                        <QRCode
                                          value={`http://localhost:5173/blockchain-detail/${item.id_aset_blockchain}`}
                                          size={100} 
                                          viewBox={`0 0 100 100`}
                                        />
                                      </div>
                                      <div className="flex-1 text-center sm:text-left">
                                        <p className="font-semibold text-slate-800">{item.nama_obat || 'Nama Obat Tidak Tercatat'}</p>
                                        <p className="text-sm text-slate-600">Jumlah Terjual: <span className="font-medium text-emerald-700">{item.jumlah_jual}</span></p>
                                        <p className="text-xs text-slate-500 font-mono mt-1">Batch ID: {item.id_aset_blockchain.slice(-12)}</p>
                                        <a 
                                           href={`http://localhost:5173/blockchain-detail/${item.id_aset_blockchain}`}
                                           target="_blank" 
                                           rel="noopener noreferrer"
                                           className="text-xs text-emerald-600 hover:underline"
                                        >
                                           Lihat Riwayat Publik
                                        </a>
                                      </div>
                                    </div>
                                  ))}
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

export default DetailPenjualan;