import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import SidebarApotek from '../../../components/SidebarApotek';
import NavbarApotek from '../../../components/NavbarApotek';
import { ArrowLeft, CheckCircle, Package, Truck, Loader2, X, ClipboardCopy } from 'lucide-react';

const BuktiPenerimaanModal = ({ isOpen, onClose, imageUrl }) => {
    if (!isOpen) return null;
    const fullImageUrl = imageUrl ? (imageUrl.startsWith('http') ? imageUrl : `http://localhost:5000/${imageUrl.replace(/\\/g, '/')}`) : null;
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={onClose}>
            <div className="bg-white p-4 rounded-lg shadow-2xl relative w-full max-w-lg" onClick={e => e.stopPropagation()}>
                <div className="flex justify-between items-center pb-3 mb-4 border-b">
                    <h3 className="text-lg font-semibold text-slate-800">Bukti Penerimaan</h3>
                    <button onClick={onClose} className="text-slate-400 hover:text-slate-600 p-1 rounded-full"><X size={20} /></button>
                </div>
                {fullImageUrl ? <img src={fullImageUrl} alt="Bukti Penerimaan" className="w-full h-auto max-h-[70vh] object-contain rounded"/> : <p className="text-center text-slate-500">Gambar tidak tersedia.</p>}
            </div>
        </div>
    );
};

const StatusStep = ({ icon, label, timestamp, isCompleted, isLast = false, children }) => (
    <div className="flex items-center">
        <div className={`flex flex-col items-center text-center ${isLast ? '' : 'flex-1'}`}>
            <div className={`w-12 h-12 rounded-full flex items-center justify-center transition-colors ${isCompleted ? 'bg-emerald-500 text-white' : 'bg-gray-200 text-gray-500'}`}>{icon}</div>
            <div className="mt-2 w-28">
                <p className={`font-semibold text-sm ${isCompleted ? 'text-gray-800' : 'text-gray-500'}`}>{label}</p>
                {timestamp && <p className="text-xs text-gray-500 mt-1">{timestamp}</p>}
                {children}
            </div>
        </div>
        {!isLast && (<div className={`flex-1 h-1 mx-4 ${isCompleted ? 'bg-emerald-500' : 'bg-gray-200'}`} />)}
    </div>
);

const LihatRiwayatPenerimaanApotek = () => {
    const navigate = useNavigate();
    const { assetId } = useParams();
    const [isCollapsed, setIsCollapsed] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [riwayatData, setRiwayatData] = useState(null);

    useEffect(() => {
        const fetchData = async () => {
            setIsLoading(true);
            try {
                const token = localStorage.getItem('token');
                if (!token) {
                    navigate('/login/apotek');
                    return;
                }
                const response = await fetch(`http://localhost:5000/api/apotek/pesanan/riwayat/${assetId}`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                if (!response.ok) throw new Error((await response.json()).message);
                const result = await response.json();
                setRiwayatData(result.data);
            } catch (err) {
                setError(err.message);
            } finally {
                setIsLoading(false);
            }
        };
        fetchData();
    }, [assetId, navigate]);

    const copyToClipboard = (text) => { navigator.clipboard.writeText(text); alert(`Teks "${text}" telah disalin.`); };
    const formatDate = (dateString) => dateString ? new Date(dateString).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }) : '-';
    const formatTimestamp = (isoString) => isoString ? new Date(isoString).toLocaleString('id-ID', { day:'2-digit', month:'2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '-';
    
    if (isLoading) return <div className="flex justify-center items-center h-screen"><Loader2 className="animate-spin h-8 w-8 text-emerald-600" /></div>;
    if (error) return <div className="p-6 text-center text-red-500">{error}</div>;
    if (!riwayatData) return <div className="p-6 text-center">Data riwayat tidak ditemukan.</div>;
    
    const { onChain, offChain } = riwayatData;
    const dataKirim = onChain.riwayat.find(item => item.status === 'DIKIRIM_KE_APOTEK');
    const dataTerima = onChain.riwayat.find(item => item.status === 'DITERIMA_APOTEK');

    const isDipersiapkanCompleted = true;
    const isDikirimCompleted = !!dataKirim;
    const isSelesaiCompleted = !!dataTerima;

    const tanggalPengiriman = offChain.tanggal_pengiriman ? new Date(offChain.tanggal_pengiriman) : new Date();
    const estimasiSampai = new Date(tanggalPengiriman);
    estimasiSampai.setDate(tanggalPengiriman.getDate() + (offChain.opsi_pengiriman === 'ekspres' ? 1 : 3));

    return (
        <div className="flex min-h-screen bg-gray-50">
            <SidebarApotek isCollapsed={isCollapsed} setIsCollapsed={setIsCollapsed} />
            <div className={`flex-1 flex flex-col transition-all duration-300 ${isCollapsed ? 'ml-16' : 'ml-64'}`}>
                <NavbarApotek onLogout={() => { localStorage.clear(); navigate('/'); }} />
                <main className="pt-16 p-6">
                    <div className="max-w-4xl mx-auto">
                        <button onClick={() => navigate('/apotek/pesan-obat')} className="flex items-center gap-2 text-gray-600 hover:text-gray-900 font-semibold mb-6">
                            <ArrowLeft size={18} /> Kembali
                        </button>
                        <div className="bg-white p-8 rounded-lg shadow-lg border">
                            <header className="mb-8 text-center">
                                <h1 className="text-2xl font-bold text-gray-800">Riwayat Pengiriman</h1>
                                <p className="text-gray-500 mt-1">Lacak jejak produk dari PBF ke Apotek Anda</p>
                            </header>
                             <section className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-12 text-sm">
                                <div>
                                    <p className="text-gray-500">No Resi</p>
                                    <div className="flex items-center gap-2 mt-1">
                                        <p className="font-semibold text-lg text-gray-700">{offChain.nomor_resi || '-'}</p>
                                        {offChain.nomor_resi && <button onClick={() => copyToClipboard(offChain.nomor_resi)} className="text-gray-400 hover:text-emerald-600"><ClipboardCopy size={16}/></button>}
                                    </div>
                                </div>
                                <div><p className="text-gray-500">Pengirim (PBF)</p><p className="font-semibold text-lg mt-1">{offChain.nama_pbf}</p></div>
                                <div><p className="text-gray-500">Waktu Pesan</p><p className="font-semibold text-lg mt-1">{formatDate(offChain.tanggal_pesanan)}</p></div>
                                <div><p className="text-gray-500">No. Pesanan</p><p className="font-semibold text-lg mt-1">{offChain.nomor_pesanan}</p></div>
                                <div><p className="text-gray-500">No Surat Jalan</p><p className="font-semibold text-lg mt-1">{offChain.nomor_surat_jalan || '-'}</p></div>
                                <div><p className="text-gray-500">Tujuan</p><p className="font-semibold text-lg mt-1">{offChain.nama_apotek}</p></div>
                                <div><p className="text-gray-500">Estimasi Sampai</p><p className="font-semibold text-lg mt-1">{formatDate(estimasiSampai)}</p></div>
                                <div><p className="text-gray-500">Status Final</p><span className="px-2 py-1 text-xs font-semibold rounded-full bg-emerald-100 text-emerald-800 mt-1 inline-block">{offChain.status}</span></div>
                            </section>
                            <section className="flex justify-center py-6">
                                <StatusStep icon={<Package size={24}/>} label="Dipesan" timestamp={formatDate(offChain.tanggal_pesanan)} isCompleted={isDipersiapkanCompleted} />
                                <StatusStep icon={<Truck size={24}/>} label="Dikirim" timestamp={isDikirimCompleted ? formatDate(offChain.tanggal_pengiriman) : null} isCompleted={isDikirimCompleted} />
                                <StatusStep icon={<CheckCircle size={24}/>} label="Diterima" timestamp={isSelesaiCompleted ? formatTimestamp(dataTerima.timestamp) : null} isCompleted={isSelesaiCompleted} isLast={true}>
                                    {isSelesaiCompleted && offChain.bukti_foto && (
                                        <button onClick={() => setIsModalOpen(true)} className="text-xs text-emerald-600 hover:underline mt-1 font-semibold">
                                            Lihat Bukti
                                        </button>
                                    )}
                                </StatusStep>
                            </section>
                        </div>
                    </div>
                </main>
            </div>
            <BuktiPenerimaanModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} imageUrl={offChain.bukti_foto} />
        </div>
    );
};

export default LihatRiwayatPenerimaanApotek;
