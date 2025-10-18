import React, { useState, useEffect, useRef } from 'react'; // <-- Tambahkan import useRef
import { useLocation, useNavigate, Link } from 'react-router-dom';
import SidebarPbf from '../../../components/SidebarPbf';
import NavbarPbf from '../../../components/NavbarPbf';
import { Loader2, CheckCircle2, Printer, AlertTriangle } from 'lucide-react';
import axios from 'axios';

const KonfirmasiPengirimanMassalPbf = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const payload = location.state;

    const [isCollapsed, setIsCollapsed] = useState(false);
    const [processingStatus, setProcessingStatus] = useState('loading');
    const [processedDetails, setProcessedDetails] = useState([]);
    const [errorMessage, setErrorMessage] = useState('');

    // --- PERBAIKAN: Tambahkan useRef sebagai "penjaga" ---
    const hasProcessed = useRef(false);

    useEffect(() => {
        if (!payload || !payload.selectedIds || payload.selectedIds.length === 0) {
            navigate('/pbf/pengelolaan-pesanan/pengiriman-massal');
            return;
        }

        const processRequest = async () => {
            try {
                const token = localStorage.getItem('token');
                if (!token) throw new Error("Otentikasi gagal. Silakan login kembali.");
                
                const response = await axios.post('http://localhost:5000/api/pbf/pesanan-apotek/proses-pengiriman-massal', payload, {
                    headers: { Authorization: `Bearer ${token}` }
                });

                setProcessedDetails(response.data.data);
                if (response.status === 207 || !response.data.success) {
                   setErrorMessage(response.data.message + " " + (response.data.errors || []).join(', '));
                   setProcessingStatus('partial_error');
                } else {
                   setProcessingStatus('success');
                }
            } catch (err) {
                setErrorMessage(err.response?.data?.message || err.message);
                setProcessingStatus('error');
            }
        };

        // --- PERBAIKAN: Hanya jalankan proses jika "penjaga" belum aktif ---
        if (!hasProcessed.current) {
            // Aktifkan penjaga agar tidak berjalan lagi
            hasProcessed.current = true;
            // Jalankan proses pengiriman
            processRequest();
        }
    }, [payload, navigate]);

    return (
        <div className="flex min-h-screen bg-gray-50">
            <SidebarPbf isCollapsed={isCollapsed} setIsCollapsed={setIsCollapsed} />
            <div className={`flex-1 flex flex-col`}>
                <NavbarPbf onLogout={() => { localStorage.clear(); navigate('/'); }} />
                <main className="flex-1 p-6 lg:p-8">
                    <div className="max-w-7xl mx-auto">
                        <h1 className="text-3xl font-bold text-gray-800 mb-6 pt-10">
                            {processingStatus === 'loading' && 'Memproses Pengiriman Massal...'}
                            {processingStatus === 'success' && 'Pengiriman Massal Berhasil Diproses'}
                            {processingStatus === 'error' && 'Gagal Memproses Pengiriman'}
                            {processingStatus === 'partial_error' && 'Beberapa Pengiriman Gagal'}
                        </h1>

                        {processingStatus === 'loading' && (
                            <div className="text-center p-10 bg-white rounded-lg shadow">
                                <Loader2 className="animate-spin inline-block w-12 h-12 text-emerald-600" />
                                <p className="mt-4 text-gray-600">Harap tunggu, sistem sedang mencatat data ke database dan blockchain...</p>
                            </div>
                        )}

                        {(processingStatus === 'error' || processingStatus === 'partial_error') && (
                            <div className="p-6 bg-red-50 text-red-800 rounded-lg shadow border border-red-200 mb-6">
                                <div className="flex items-center gap-4">
                                    <AlertTriangle className="w-10 h-10" />
                                    <div>
                                        <h2 className="font-bold">Terjadi Kesalahan</h2>
                                        <p>{errorMessage}</p>
                                    </div>
                                </div>
                            </div>
                        )}

                        {(processingStatus === 'success' || processingStatus === 'partial_error') && (
                            <div>
                                <div className="bg-white rounded-lg shadow-md border">
                                    <div className="px-6 py-4 border-b">
                                        <div className="grid grid-cols-5 gap-4 text-xs font-medium text-gray-500 uppercase">
                                            <span>Pesanan</span>
                                            <span>Nomor Resi</span>
                                            <span>Nomor Surat Jalan</span>
                                            <span className="text-center">Surat Jalan</span>
                                            <span className="text-center">Status</span>
                                        </div>
                                    </div>
                                    <div className="divide-y">
                                        {processedDetails.map(item => (
                                            <div key={item.id} className="grid grid-cols-5 gap-4 p-6 items-center">
                                                <div>
                                                    <p className="font-semibold text-gray-900">{item.nama_apotek}</p>
                                                    <p className="text-sm text-gray-500">ID Pesanan: {item.id}</p>
                                                </div>
                                                <p className="font-mono text-sm text-gray-700 font-semibold">{item.nomorResi}</p>
                                                <p className="font-mono text-sm text-gray-700 font-semibold">{item.nomorSuratJalan}</p>
                                                <div className="text-center">
                                                    <Link 
                                                        to={`/pbf/tracking-pengiriman/surat-jalan/${item.id}`} 
                                                        target="_blank"
                                                        className="text-sm text-emerald-600 hover:underline font-medium"
                                                    >
                                                        Lihat Surat
                                                    </Link>
                                                </div>
                                                <div className="flex items-center justify-center gap-2 text-green-600">
                                                    <CheckCircle2 size={18} />
                                                    <p className="font-semibold">Berhasil</p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                                <div className="mt-6 flex justify-end gap-4">
                                    <button onClick={() => navigate('/pbf/tracking-pengiriman')} className="py-2 px-6 bg-gray-200 text-gray-800 font-semibold rounded-lg hover:bg-gray-300">
                                        Selesai
                                    </button>
                                    <button
                                        onClick={() => navigate('/pbf/pengelolaan-pesanan/cetak-surat-jalan-massal', { state: { processedDetails: processedDetails, allDetails: payload } })}
                                        className="py-2 px-6 bg-emerald-600 text-white font-semibold rounded-lg hover:bg-emerald-700 flex items-center gap-2"
                                    >
                                        <Printer size={18} />
                                        Cetak Semua
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </main>
            </div>
        </div>
    );
};

export default KonfirmasiPengirimanMassalPbf;