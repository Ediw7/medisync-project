import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import SidebarPbf from '../../../components/SidebarPbf';
import NavbarPbf from '../../../components/NavbarPbf';
import qrcode from 'qrcode';
import {
  Loader2,
  ArrowLeft,
  Package,
  Calendar,
  Shield,
  FileText,
  QrCode,
  CheckCircle2,
  Clock,
  AlertCircle,
  Copy,
  ExternalLink,
  Download,
  DollarSign, // Ditambahkan untuk harga
  Archive // Ditambahkan untuk manufaktur
} from 'lucide-react';
import { toast } from 'react-hot-toast'; // Menggunakan toast

const DetailStokPbf = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [stok, setStok] = useState(null);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [qrCode, setQrCode] = useState('');
  const [copiedHash, setCopiedHash] = useState(false);
  const username = localStorage.getItem('username'); // Ambil username

  useEffect(() => {
    const fetchStokDetail = async () => {
      setIsLoading(true);
      setError('');
      const token = localStorage.getItem('token');
      if (!token) {
        toast.error('Anda harus login untuk mengakses halaman ini.');
        navigate('/login/pbf');
        return;
      }
      try {
        const response = await fetch(`http://localhost:5000/api/pbf/stok/detail/${id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!response.ok) throw new Error('Gagal mengambil detail stok');
        const result = await response.json();
        if (result.success) {
          const data = result.data;
          setStok(data);
          
          // Generate QR Code
          // URL QR Code diubah agar sesuai dengan ID Aset (bukan batch_id produsen)
          const qrUrl = `http://localhost:5173/blockchain-detail/${data.id_aset_blockchain}`; 
          qrcode.toDataURL(qrUrl, (err, url) => {
            if (err) {
              console.error('Gagal membuat QR code:', err);
              return;
            }
            setQrCode(url);
          });
          
        } else {
          throw new Error(result.message);
        }
      } catch (err) {
        setError(err.message);
        toast.error(err.message || 'Gagal memuat data.'); // Tampilkan toast
      } finally {
        setIsLoading(false);
      }
    };
    fetchStokDetail();
  }, [id, navigate]);
  
  // (Helper dari contoh)
  const getStatusConfig = (status) => {
     // PBF hanya punya 1 status di halaman ini: "Tersedia" (hasil verifikasi)
    if (status) { // Asumsi jika data ada, berarti sudah tercatat
       return { 
        icon: Shield, 
        color: 'bg-emerald-100 text-emerald-800 border-emerald-200', 
        label: 'Tercatat di Blockchain' 
      };
    }
    return { icon: AlertCircle, color: 'bg-gray-100 text-gray-800 border-gray-200', label: 'Tidak Diketahui' };
  };

  // (Helper dari contoh)
  const handleCopyHash = async (hash) => {
    if (hash) {
      await navigator.clipboard.writeText(hash);
      setCopiedHash(true);
      toast.success('Hash disalin!'); // Gunakan toast
      setTimeout(() => setCopiedHash(false), 2000);
    }
  };

  // (Helper dari contoh)
  const formatDateLocal = (dateString) => {
    if (!dateString) return '-';
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return '-';
      // Gunakan UTC agar konsisten dengan data produsen
      return date.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' }); 
    } catch (e) {
      return '-';
    }
  };
  
  const handleLogout = () => {
    localStorage.clear();
    navigate('/');
  };

  // --- RENDER LOADING (Dari Contoh) ---
  if (isLoading) {
    return (
      <div className="flex min-h-screen bg-gradient-to-br from-slate-50 via-white to-emerald-50">
        <SidebarPbf isCollapsed={isCollapsed} setIsCollapsed={setIsCollapsed} />
        <div className={`flex-1 flex flex-col transition-all duration-300 ${isCollapsed ? 'ml-16' : 'ml-64'}`}>
          <NavbarPbf onLogout={handleLogout} username={username} />
          <main className="flex-1 overflow-auto pt-[72px] px-12 py-8 flex items-center justify-center">
            <div className="flex flex-col items-center space-y-4">
              <Loader2 className="h-12 w-12 animate-spin text-emerald-600" />
              <p className="text-gray-500">Memuat detail stok...</p>
            </div>
          </main>
        </div>
      </div>
    );
  }

  // --- RENDER ERROR (Dari Contoh) ---
  if (error && !stok) {
    return (
      <div className="flex min-h-screen bg-gradient-to-br from-slate-50 via-white to-emerald-50">
        <SidebarPbf isCollapsed={isCollapsed} setIsCollapsed={setIsCollapsed} />
        <div className={`flex-1 flex flex-col transition-all duration-300 ${isCollapsed ? 'ml-16' : 'ml-64'}`}>
          <NavbarPbf onLogout={handleLogout} username={username} />
          <main className="flex-1 overflow-auto pt-[72px] px-12 py-8 flex items-center justify-center p-6">
            <div className="bg-white p-8 rounded-2xl shadow-lg border border-red-200 text-center max-w-md">
              <AlertCircle className="mx-auto h-12 w-12 text-red-500 mb-4" />
              <h2 className="text-xl font-bold text-red-800 mb-2">Terjadi Kesalahan</h2>
              <p className="text-red-600 mb-6">{error}</p>
              <button
                onClick={() => navigate('/pbf/monitoring-stok')}
                className="flex items-center gap-2 px-4 py-2.5 border border-slate-300 text-slate-700 font-medium rounded-lg hover:bg-slate-100 transition mx-auto"
              >
                <ArrowLeft size={18} />
                Kembali ke Monitoring Stok
              </button>
            </div>
          </main>
        </div>
      </div>
    );
  }

  // --- RENDER TIDAK DITEMUKAN (Dari Contoh) ---
  if (!stok) {
    return (
      <div className="flex min-h-screen bg-gradient-to-br from-slate-50 via-white to-emerald-50">
         <SidebarPbf isCollapsed={isCollapsed} setIsCollapsed={setIsCollapsed} />
        <div className={`flex-1 flex flex-col transition-all duration-300 ${isCollapsed ? 'ml-16' : 'ml-64'}`}>
          <NavbarPbf onLogout={handleLogout} username={username} />
          <main className="flex-1 overflow-auto pt-[72px] px-12 py-8 flex items-center justify-center p-6">
            <div className="bg-white p-8 rounded-2xl shadow-lg border border-slate-200 text-center max-w-md">
              <Package className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              <h2 className="text-xl font-bold text-gray-800 mb-2">Data Stok Tidak Ditemukan</h2>
              <p className="text-gray-500 mb-6">Tidak ada data untuk ID aset ini.</p>
              <button
                onClick={() => navigate('/pbf/monitoring-stok')}
                className="flex items-center gap-2 px-4 py-2.5 border border-slate-300 text-slate-700 font-medium rounded-lg hover:bg-slate-100 transition mx-auto"
              >
                <ArrowLeft size={18} />
                Kembali ke Monitoring Stok
              </button>
            </div>
          </main>
        </div>
      </div>
    );
  }

  // (Helper dari contoh)
  const statusConfig = getStatusConfig(stok.id_aset_blockchain); // Cek berdasarkan ID Aset
  const StatusIcon = statusConfig.icon;

  // --- RENDER UTAMA (Desain dari Contoh) ---
  return (
    <div className="flex min-h-screen bg-gradient-to-br from-slate-50 via-white to-emerald-50">
      <SidebarPbf isCollapsed={isCollapsed} setIsCollapsed={setIsCollapsed} />
      <div className={`flex-1 flex flex-col transition-all duration-300 ${isCollapsed ? 'ml-16' : 'ml-64'}`}>
        <NavbarPbf onLogout={handleLogout} username={username} />
        
        <main className="flex-1 overflow-auto pt-[72px] px-12 py-8">
          <div className="max-w-6xl mx-auto">
     
            <div className="mb-8">
              <button
                onClick={() => navigate('/pbf/monitoring-stok')}
                className="mb-6 inline-flex items-center text-emerald-600 hover:text-emerald-700 transition-colors text-sm font-medium"
              >
                <ArrowLeft size={16} className="mr-1" />
                Kembali ke Monitoring Stok
              </button>
              
              {/* KARTU UTAMA */}
              <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
                {/* HEADER KARTU */}
                <div className="bg-gradient-to-r from-emerald-50 to-green-50 px-8 py-6 border-b border-gray-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <h1 className="text-3xl font-bold text-gray-900 mb-1">Detail Stok PBF</h1>
                      <p className="text-gray-600">
                        ID Aset: <span className="font-mono font-semibold text-emerald-700">{stok.id_aset_blockchain}</span>
                      </p>
                    </div>
                    <div className={`px-4 py-2 rounded-full border ${statusConfig.color} flex items-center space-x-2`}>
                      <StatusIcon size={16} />
                      <span className="font-medium text-sm">{statusConfig.label}</span>
                    </div>
                  </div>
                </div>

                {/* ERROR INLINE */}
                {error && (
                  <div className="p-4 bg-red-50 border border-red-200 text-red-700 rounded-xl flex items-center gap-3 mx-8 mt-4">
                    <AlertCircle size={20} />
                    <span>{error}</span>
                  </div>
                )}

                {/* KONTEN GRID */}
                <div className="p-8">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
       
                    {/* Kolom Kiri */}
                    <div className="space-y-6">
                      <InfoCard title="Informasi Obat" icon={Package}>
                        <InfoItem label="Nama Obat" value={stok.nama_obat} />
                        <InfoItem label="Batch ID (Asal)" value={stok.batch_id} />
                        <InfoItem label="Nomor Izin Edar" value={stok.nomor_izin_edar} />
                        <InfoItem label="Dosis" value={stok.dosis} />
                        <InfoItem label="Bentuk Sediaan" value={stok.bentuk_sediaan} />
                        <InfoItem label="Stok Saat Ini" value={`${stok.stok.toLocaleString('id-ID')} box`} highlight />
                      </InfoCard>

                      <InfoCard title="Informasi Harga & Manufaktur" icon={Archive}>
                         <InfoItem 
                            label="Harga Beli (per Unit)" 
                            value={`Rp ${Number(stok.harga_per_unit || 0).toLocaleString('id-ID', { minimumFractionDigits: 2 })}`} 
                         />
                         <InfoItem 
                            label="Total Nilai Stok" 
                            value={`Rp ${Number(stok.harga_per_unit * stok.stok || 0).toLocaleString('id-ID', { minimumFractionDigits: 2 })}`} 
                            highlight
                         />
                         <InfoItem label="Manufaktur (Produsen)" value={stok.nama_produsen} isFull/>
                      </InfoCard>

                      <InfoCard title="Detail Produksi & Kadaluarsa" icon={Calendar}>
                        <InfoItem label="Tanggal Produksi" value={formatDateLocal(stok.tanggal_produksi)} />
                        <InfoItem label="Tanggal Kadaluarsa" value={formatDateLocal(stok.tanggal_kadaluarsa)} />
                        <InfoItem label="Komposisi Obat" value={stok.komposisi_obat} isFull />
                      </InfoCard>
                    </div>

                    {/* Kolom Kanan */}
                    <div className="space-y-6">
                      <InfoCard title="Dokumen & Validasi" icon={FileText}>
                        <DocumentItem label="Dokumen BPOM (dari Produsen)" path={stok.dokumen_bpom_path} />
                        <DocumentItem label="Sertifikat Analisis (dari Produsen)" path={stok.sertifikat_analisis_path} />
                        <HashItem
                          label="Hash Sertifikat Analisis"
                          hash={stok.hash_sertifikat_analisis}
                          onCopy={handleCopyHash}
                          copied={copiedHash}
                        />
                      </InfoCard>

                      {qrCode && (
                        <InfoCard title="QR Code Verifikasi" icon={QrCode} bgColor="bg-slate-50" borderColor="border-slate-200">
                          <div className="col-span-full text-center">
                            <div className="bg-white p-4 rounded-xl border border-gray-200 mb-4 shadow-sm inline-block">
                              <img src={qrCode} alt="QR Code" className="w-full max-w-[200px] mx-auto rounded-lg block" />
                            </div>
                            <p className="text-sm text-gray-600 mb-4 max-w-md mx-auto">Pindai kode QR untuk verifikasi detail aset blockchain.</p>
                            <button
                              onClick={() => {
                                const link = document.createElement('a');
                                link.href = qrCode;
                                link.download = `${stok.id_aset_blockchain}_qr.png`;
                                link.click();
                              }}
                              className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-50 text-emerald-700 rounded-lg hover:bg-emerald-100 transition-colors border border-emerald-200 text-sm font-medium"
                            >
                              <Download size={14} />
                              Download QR Code
                            </button>
                          </div>
                        </InfoCard>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
       {/* STYLE BLOB (Dari Contoh) */}
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


// --- Komponen Helper (Dari Contoh) ---

const InfoCard = ({ title, icon: Icon, children, bgColor = 'bg-white', borderColor = 'border-gray-200' }) => (
  <div className={`rounded-2xl ${bgColor} border ${borderColor} overflow-hidden shadow-sm hover:shadow-md transition-all duration-200`}>
    <div className="px-6 py-4 border-b border-gray-200 bg-white/50 flex items-center gap-3">
      {Icon && <Icon className="h-5 w-5 text-emerald-600" />}
      <h3 className="text-lg font-semibold text-gray-800">{title}</h3>
    </div>
    <div className="p-6 grid grid-cols-1 sm:grid-cols-2 gap-6">
      {children}
    </div>
  </div>
);

const InfoItem = ({ label, value, isFull = false, highlight = false }) => (
  <div className={`col-span-1 ${isFull ? 'col-span-full' : ''}`}>
    <p className="text-sm font-medium text-gray-500 mb-1">{label}</p>
    <p className={`text-gray-900 break-words ${highlight ? 'font-bold text-emerald-700 text-lg' : 'font-semibold'}`}>{value || '-'}</p>
  </div>
);

const HashItem = ({ label, hash, onCopy, copied }) => (
  <div className="col-span-full relative">
    <p className="text-sm font-medium text-gray-500 mb-1">{label}</p>
    <div className="p-3 bg-gray-50 rounded-lg border border-gray-200 pr-10">
      <code className="text-xs text-gray-700 break-all font-mono">{hash || '-'}</code>
    </div>
    {hash && (
      <button
        onClick={() => onCopy(hash)}
        className="absolute top-8 right-2 p-1.5 text-gray-400 hover:text-gray-600 transition-colors rounded-md hover:bg-gray-200"
        title="Salin hash"
        aria-label="Salin hash"
      >
        <Copy size={14} />
      </button>
    )}
    {copied && hash && (
      <div className="absolute top-0 right-2 bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded text-xs shadow z-10">
        Disalin!
      </div>
    )}
  </div>
);

const DocumentItem = ({ label, path }) => (
  <div className="col-span-1">
    <p className="text-sm font-medium text-gray-500 mb-2">{label}</p>
    {path ? (
      <a
        href={`http://localhost:5000/${path.replace(/\\/g, '/')}`}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-50 text-emerald-700 rounded-lg hover:bg-emerald-100 transition-colors border border-emerald-200 text-sm font-medium"
      >
        <ExternalLink size={14} />
        Lihat Dokumen
      </a>
    ) : (
      <div className="px-4 py-2 bg-gray-50 text-gray-500 rounded-lg border border-gray-200 inline-block text-sm">
        Tidak ada dokumen
      </div>
    )}
  </div>
);

export default DetailStokPbf;