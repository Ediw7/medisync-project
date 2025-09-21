import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import SidebarProdusen from '../../../components/SidebarProdusen';
import NavbarProdusen from '../../../components/NavbarProdusen';
import { ArrowLeft, CheckCircle, Package, Truck, Loader2, X, ClipboardCopy } from 'lucide-react';

// --- Komponen Modal (Tidak ada perubahan) ---
const BuktiPenerimaanModal = ({ isOpen, onClose, imageUrl }) => {
  if (!isOpen) return null;
  const fullImageUrl = imageUrl ? (imageUrl.startsWith('http') ? imageUrl : `http://localhost:5000/${imageUrl}`) : null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in-0" onClick={onClose}>
      <div className="bg-white p-4 rounded-lg shadow-2xl relative w-full max-w-lg overflow-hidden animate-in fade-in-0 zoom-in-95" onClick={(e) => e.stopPropagation()}>
        <div className="flex justify-between items-center pb-3 mb-4 border-b">
          <h3 className="text-lg font-semibold text-slate-800">Bukti Penerimaan</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-colors p-1 rounded-full"><X size={20} /></button>
        </div>
        {fullImageUrl ? (
          <div className="bg-slate-100 p-2 rounded">
            <img src={fullImageUrl} alt="Bukti Penerimaan Barang" className="w-full h-auto max-h-[70vh] object-contain rounded"/>
          </div>
        ) : <p className="text-center text-slate-500">Gambar tidak tersedia.</p>}
      </div>
    </div>
  );
};

// --- Komponen StatusStep (Tidak ada perubahan) ---
const StatusStep = ({ icon, label, timestamp, isCompleted, isLast = false, children }) => (
    <div className="flex items-center">
      <div className={`flex flex-col items-center text-center ${isLast ? '' : 'flex-1'}`}>
        <div className={`w-12 h-12 rounded-full flex items-center justify-center transition-colors duration-300 ${isCompleted ? 'bg-emerald-500 text-white' : 'bg-slate-200 text-slate-500'}`}>{icon}</div>
        <div className="mt-2 w-24">
            <p className={`font-semibold text-sm transition-colors duration-300 ${isCompleted ? 'text-slate-800' : 'text-slate-500'}`}>{label}</p>
            {timestamp && <p className="text-xs text-slate-500 mt-1">{timestamp}</p>}
            {children}
        </div>
      </div>
      {!isLast && (<div className={`flex-1 h-1 mx-4 transition-colors duration-500 ${isCompleted ? 'bg-emerald-500' : 'bg-slate-200'}`} />)}
    </div>
);

// --- Komponen Halaman Utama (Logika Fetching Diubah) ---
const LihatRiwayat = () => {
  const navigate = useNavigate();
  const { assetId } = useParams(); // Menggunakan assetId dari URL
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [riwayatData, setRiwayatData] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      if (!assetId) {
        setError("ID Aset tidak ditemukan di URL.");
        setIsLoading(false);
        return;
      }
      setIsLoading(true);
      setError(null);
      try {
        const token = localStorage.getItem('token');
        const response = await fetch(`http://localhost:5000/api/produsen/riwayat/${assetId}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!response.ok) {
          const errData = await response.json();
          throw new Error(errData.message || `Error: ${response.status}`);
        }
        const result = await response.json();
        setRiwayatData(result.data);
      } catch (err) {
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, [assetId]);

  const handleLogout = () => { localStorage.clear(); navigate('/'); };
  const copyToClipboard = (text) => { navigator.clipboard.writeText(text); alert(`Teks "${text}" telah disalin.`); };
  const formatDate = (dateString) => dateString ? new Date(dateString).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }) : '-';
  const formatTimestamp = (isoString) => isoString ? new Date(isoString).toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' }) : '-';

  if (isLoading) {
    return <div className="flex justify-center items-center h-screen"><Loader2 className="animate-spin h-8 w-8 text-emerald-600" /></div>;
  }
  if (error) {
    return <div className="p-6 text-center text-red-500">Error: {error}</div>;
  }
  if (!riwayatData) {
    return <div className="p-6 text-center text-slate-500">Data riwayat tidak ditemukan.</div>;
  }

  const { onChain, offChain } = riwayatData;
  const dataProduksi = onChain.riwayat.find(item => item.status === 'DIPRODUKSI');
  const dataKirim = onChain.riwayat.find(item => item.status === 'DIKIRIM_KE_PBF');
  const dataTerima = onChain.riwayat.find(item => item.status === 'DITERIMA_PBF');

  const isDipersiapkanCompleted = !!dataProduksi;
  const isDikirimCompleted = !!dataKirim;
  const isSelesaiCompleted = !!dataTerima;

  return (
    <div className="flex min-h-screen bg-slate-50">
      <SidebarProdusen isCollapsed={isCollapsed} setIsCollapsed={setIsCollapsed} />
      <div className={`flex-1 flex flex-col transition-all duration-300 ${isCollapsed ? 'ml-16' : 'ml-64'}`}>
        <NavbarProdusen onLogout={handleLogout} />
        <main className="pt-16 p-4 md:p-6">
          <div className="max-w-4xl mx-auto">
            <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-slate-600 hover:text-slate-900 font-semibold mb-6">
              <ArrowLeft size={18} /> Kembali
            </button>
            <div className="bg-white p-8 rounded-lg shadow-md border border-slate-200">
              <header className="mb-8 text-center border-b pb-4">
                <h1 className="text-3xl font-bold text-slate-800">Riwayat Pengiriman</h1>
                <p className="text-slate-500 mt-1">Jejak Transaksi Blockchain untuk Pesanan #{String(offChain.id).padStart(6, '0')}</p>
              </header>
              <section className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-12 text-sm">
                <div>
                  <p className="text-slate-500">No Resi</p>
                  <div className="flex items-center gap-2 mt-1">
                    <p className="font-semibold text-slate-700">{offChain.nomor_resi || '-'}</p>
                    {offChain.nomor_resi && <button onClick={() => copyToClipboard(offChain.nomor_resi)} className="text-slate-400 hover:text-emerald-600"><ClipboardCopy size={14}/></button>}
                  </div>
                </div>
                <div>
                  <p className="text-slate-500">Pengirim</p>
                  <p className="font-semibold text-slate-700 mt-1">{offChain.nama_produsen}</p>
                </div>
                <div>
                  <p className="text-slate-500">Waktu Pesan</p>
                  <p className="font-semibold text-slate-700 mt-1">{formatDate(offChain.tanggal_pesanan)}</p>
                </div>
                <div>
                  <p className="text-slate-500">Status Final</p>
                  <span className="px-2 py-1 text-xs font-semibold rounded-full bg-emerald-100 text-emerald-800 mt-1 inline-block">{offChain.status}</span>
                </div>
              </section>
              <section className="flex justify-center py-6">
                <StatusStep 
                  icon={<Package size={24}/>} 
                  label="DIPRODUKSI" 
                  timestamp={isDipersiapkanCompleted ? formatTimestamp(dataProduksi.timestamp) : null} 
                  isCompleted={isDipersiapkanCompleted} />
                <StatusStep 
                  icon={<Truck size={24}/>} 
                  label="DIKIRIM" 
                  timestamp={isDikirimCompleted ? formatTimestamp(dataKirim.timestamp) : null} 
                  isCompleted={isDikirimCompleted} />
                <StatusStep 
                  icon={<CheckCircle size={24}/>} 
                  label="DITERIMA" 
                  timestamp={isSelesaiCompleted ? formatTimestamp(dataTerima.timestamp) : null} 
                  isCompleted={isSelesaiCompleted} 
                  isLast={true}
                >
                  {isSelesaiCompleted && offChain.buktiPenerimaUrl && (
                    <button onClick={() => setIsModalOpen(true)} className="text-xs text-emerald-600 hover:underline mt-1 font-semibold">Lihat Bukti</button>
                  )}
                </StatusStep>
              </section>
            </div>
          </div>
        </main>
      </div>
      <BuktiPenerimaanModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        imageUrl={offChain.buktiPenerimaUrl}
      />
    </div>
  );
};

export default LihatRiwayat;