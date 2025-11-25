import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Copy,
  CheckCircle2,
  AlertCircle,
  Shield,
  Package,
  Loader2,
  CircleDot,
  ShoppingCart,
} from 'lucide-react';
import { toast } from 'react-hot-toast';

// --- Helper Functions (Tidak Berubah) ---
const getStatusConfig = (status) => {
  const configs = {
    DIPRODUKSI: {
      icon: CheckCircle2,
      color: 'bg-green-100 text-green-800 border-green-200',
      label: 'Diproduksi',
    },
    DIKIRIM_KE_PBF: {
      icon: CircleDot,
      color: 'bg-blue-100 text-blue-800 border-blue-200',
      label: 'Dikirim ke PBF',
    },
    DITERIMA_PBF: {
      icon: CheckCircle2,
      color: 'bg-purple-100 text-purple-800 border-purple-200',
      label: 'Diterima PBF',
    },
    DIKIRIM_KE_APOTEK: {
      icon: CircleDot,
      color: 'bg-orange-100 text-orange-800 border-orange-200',
      label: 'Dikirim ke Apotek',
    },
    DITERIMA_APOTEK: {
      icon: CheckCircle2,
      color: 'bg-emerald-100 text-emerald-800 border-emerald-200',
      label: 'Diterima Apotek',
    },
    TERJUAL_SEBAGIAN: {
      icon: ShoppingCart,
      color: 'bg-rose-100 text-rose-800 border-rose-200',
      label: 'Terjual Sebagian',
    },
    STOK_HABIS: {
      icon: ShoppingCart,
      color: 'bg-rose-100 text-rose-800 border-rose-200',
      label: 'Terjual Habis',
    },
  };
  return (
    configs[status] || {
      icon: AlertCircle,
      color: 'bg-gray-100 text-gray-800 border-gray-200',
      label: status || 'Tidak Diketahui',
    }
  );
};

const InfoCard = ({
  title,
  children,
  bgColor = 'from-gray-50 to-gray-100',
  borderColor = 'border-gray-200',
}) => (
  <div
    className={`bg-gradient-to-br ${bgColor} rounded-xl border ${borderColor} overflow-hidden shadow-sm hover:shadow-md transition-shadow`}
  >
    {title && (
      <h3 className="px-6 py-4 text-lg font-semibold text-gray-700 border-b border-gray-200 bg-white/50">
        {title}
      </h3>
    )}
    <div
      className={`grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-5 ${title ? 'px-6 pb-6 pt-5' : 'p-6'}`}
    >
      {children}
    </div>
  </div>
);

const InfoItem = ({ label, value }) => (
  <div className="col-span-1">
    <p className="text-sm font-medium text-gray-500 mb-1">{label}</p>
    <p className="text-gray-900 font-semibold break-words">{value || '-'}</p>
  </div>
);

const HashItem = ({ label, hash, onCopy, copied }) => (
  <div className="col-span-full relative">
    <p className="text-sm font-medium text-gray-500 mb-1">{label}</p>
    <div className="p-3 bg-gray-100 rounded-lg border border-gray-200 pr-12">
      <code className="text-xs text-gray-700 break-all font-mono whitespace-pre-wrap">
        {hash || '-'}
      </code>
    </div>
    {hash && (
      <button
        onClick={() => onCopy(hash)}
        className="absolute top-8 right-3 p-1.5 text-gray-400 hover:text-gray-600 transition-colors rounded-md hover:bg-gray-200"
        title="Salin hash"
      >
        <Copy size={14} />
      </button>
    )}
    {copied && hash && (
      <div className="absolute -top-6 right-2 bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded text-xs shadow z-10 animate-in fade-in slide-in-from-top-4 duration-300">
        Disalin!
      </div>
    )}
  </div>
);
// --- (Akhir Helper) ---

const BlockchainDetail = () => {
  const { batch_id } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const response = await fetch(`http://localhost:5000/api/public/blockchain-detail/${batch_id}`);
        
        // JIKA 404 ATAU ERROR LAIN -> Redirect ke Not Found
        if (!response.ok) {
            navigate('/not-found', { replace: true }); // Redirect
            return;
        }

        const result = await response.json();
        if (!result.success || !result.data) {
            navigate('/not-found', { replace: true }); // Redirect jika data kosong
            return;
        }
        
        setData(result.data);
      } catch (err) {
        console.error(err);
        navigate('/not-found', { replace: true }); // Redirect jika fetch gagal total
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, [batch_id, navigate]);

  const handleCopyHash = async () => {
    if (data?.hash_sertifikat) {
      await navigator.clipboard.writeText(data.hash_sertifikat);
      setCopied(true);
      toast.success('Hash disalin ke clipboard!');
      setTimeout(() => setCopied(false), 2000);
    }
  };

  // ... (Render Loading, Error, Not Found - tidak berubah)
  if (isLoading) {
    return (
      <div className="flex flex-col justify-center items-center h-screen bg-gradient-to-br from-slate-50 via-white to-emerald-50">
        <div className="relative">
          <Loader2 className="animate-spin h-12 w-12 text-emerald-600" />
          <div className="absolute inset-0 h-12 w-12 rounded-full border-4 border-emerald-200 animate-ping opacity-20"></div>
        </div>
        <p className="mt-4 text-slate-700 font-medium">Memuat detail blockchain...</p>
      </div>
    );
  }

  if (error)
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-red-50 flex items-center justify-center p-6">
        <div className="bg-white p-8 rounded-2xl shadow-lg border border-red-200 text-center max-w-md">
          <AlertCircle className="mx-auto h-12 w-12 text-red-500 mb-4" />
          <h2 className="text-xl font-bold text-red-800 mb-2">Terjadi Kesalahan</h2>
          <p className="text-red-600 mb-6">{error}</p>
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 px-4 py-2.5 border border-slate-300 text-slate-700 font-medium rounded-lg hover:bg-slate-100 transition mx-auto"
          >
            <ArrowLeft size={18} /> Kembali
          </button>
        </div>
      </div>
    );

  if (!data)
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-emerald-50 flex items-center justify-center p-6">
        <div className="bg-white p-8 rounded-2xl shadow-lg border border-slate-200 text-center max-w-md">
          <Package className="mx-auto h-12 w-12 text-slate-400 mb-4" />
          <h2 className="text-xl font-bold text-slate-800 mb-2">Data Tidak Ditemukan</h2>
          <p className="text-slate-500">
            Batch ID <span className="font-semibold">{batch_id}</span> tidak tersedia di blockchain.
          </p>
          <button
            onClick={() => navigate(-1)}
            className="mt-6 text-sm text-emerald-600 hover:underline"
          >
            Kembali
          </button>
        </div>
      </div>
    );
  // --- (Akhir Render Loading/Error) ---

  const statusConfig = getStatusConfig(data.status_saat_ini);
  const StatusIcon = statusConfig.icon;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-emerald-50 p-6 md:p-8">
      <div className="max-w-6xl mx-auto">
        {/* --- HEADER --- */}
        <div className="mb-10 relative">
          <div className="absolute -top-20 -left-20 w-72 h-72 bg-emerald-200 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob"></div>
          <div className="absolute -top-20 -right-20 w-72 h-72 bg-teal-200 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000"></div>

          <div className="relative">
            <button
              onClick={() => navigate(-1)}
              className="mb-4 inline-flex items-center text-emerald-600 hover:text-emerald-700 transition-colors text-sm font-medium"
            >
              <ArrowLeft size={16} className="mr-1" /> Kembali
            </button>
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div className="flex items-center gap-3">
                <div className="flex items-center justify-center w-12 h-12 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl shadow-lg">
                  <Shield className="text-white" size={24} />
                </div>
                <div>
                  <h1 className="text-4xl font-bold bg-gradient-to-r from-slate-900 via-emerald-900 to-teal-900 bg-clip-text text-transparent">
                    Detail Aset Blockchain
                  </h1>
                  <p className="text-slate-600 text-lg mt-1">Lacak riwayat lengkap produk Anda.</p>
                </div>
              </div>
              <div
                className={`px-4 py-2 rounded-full border ${statusConfig.color} flex items-center space-x-2 bg-white/50`}
              >
                <StatusIcon size={16} />
                <span className="font-medium text-sm">{statusConfig.label}</span>
              </div>
            </div>
            <p className="text-sm text-slate-500 mt-4 font-mono break-all">
              Batch ID: {data.batch_id}
            </p>
          </div>
        </div>
        {/* --- AKHIR HEADER --- */}

        <div className="relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Kolom Kiri */}
            <div className="lg:col-span-2 space-y-6">
              {/* --- PERBAIKAN: Kartu Info Obat --- */}
              <InfoCard
                title="Informasi Obat"
                bgColor="from-white to-white"
                borderColor="border-slate-200"
              >
                <InfoItem label="Nama Obat" value={data.nama_obat} />
                <InfoItem label="Produsen" value={data.nama_perusahaan} />
                <InfoItem label="Penanggung Jawab Produksi" value={data.penanggung_jawab} />
                <div className="col-span-full grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-5">
                  <InfoItem
                    label="Tanggal Produksi"
                    value={new Date(data.tanggal_produksi).toLocaleDateString('id-ID', {
                      dateStyle: 'long',
                      timeZone: 'UTC',
                    })}
                  />
                  <InfoItem
                    label="Tanggal Kadaluarsa"
                    value={new Date(data.tanggal_kadaluarsa).toLocaleDateString('id-ID', {
                      dateStyle: 'long',
                      timeZone: 'UTC',
                    })}
                  />
                </div>
              </InfoCard>

              {/* --- KARTU BARU: PEMILIK --- */}
              <InfoCard
                title="Informasi Pemilik"
                bgColor="from-white to-white"
                borderColor="border-slate-200"
              >
                <InfoItem label="PBF (Distributor)" value={data.nama_pbf || 'Belum diterima PBF'} />
                <InfoItem
                  label="Apotek (Penjual)"
                  value={data.nama_apotek || 'Belum diterima Apotek'}
                />
              </InfoCard>
              {/* --- AKHIR KARTU BARU --- */}

              <InfoCard
                title="Detail Batch"
                bgColor="from-white to-white"
                borderColor="border-slate-200"
              >
                <InfoItem label="Jumlah Unit" value={`${data.jumlah} pcs`} />
                <HashItem
                  label="Hash Sertifikat Analisis"
                  hash={data.hash_sertifikat}
                  onCopy={handleCopyHash}
                  copied={copied}
                />
              </InfoCard>
            </div>

            {/* Kolom Kanan */}
            <div className="space-y-6 lg:sticky lg:top-24">
              <InfoCard
                title="Riwayat Transaksi"
                bgColor="from-white to-white"
                borderColor="border-slate-200"
              >
                <ul className="space-y-4 col-span-full">
                  {data.riwayat && data.riwayat.length > 0 ? (
                    data.riwayat.map((item, index) => {
                      const itemStatusConfig = getStatusConfig(item.status);
                      const ItemStatusIcon = itemStatusConfig.icon;
                      // Ambil nama penerima jika ada (dari perbaikan chaincode)
                      const penerima = item.penerima || item.pemilik;

                      return (
                        <li
                          key={index}
                          className="flex items-start space-x-3 p-3 bg-slate-50 rounded-lg border border-slate-200 shadow-sm"
                        >
                          <div
                            className={`flex-shrink-0 p-1.5 rounded-md mt-1 ${itemStatusConfig.color.replace('text-', 'bg-').split(' ')[0]}`}
                          >
                            <ItemStatusIcon
                              size={14}
                              className={
                                itemStatusConfig.color.replace('bg-', 'text-').split(' ')[1]
                              }
                            />
                          </div>

                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-gray-900">
                              {itemStatusConfig.label}
                            </p>
                            <p className="text-xs text-gray-500 truncate">
                              Oleh: {penerima} ({item.pemilik})
                            </p>
                            <p className="text-xs text-gray-500">
                              {new Date(item.timestamp).toLocaleDateString('id-ID')}{' '}
                              {new Date(item.timestamp).toLocaleTimeString('id-ID', {
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                            </p>

                            {item.detail && (
                              <p className="text-xs text-gray-700 mt-2 pt-2 border-t border-slate-200 whitespace-pre-wrap break-all">
                                {item.detail}
                              </p>
                            )}
                          </div>
                        </li>
                      );
                    })
                  ) : (
                    <li className="text-sm text-gray-500 text-center py-4 col-span-full">
                      Belum ada riwayat transaksi.
                    </li>
                  )}
                </ul>
              </InfoCard>
            </div>
          </div>
        </div>
      </div>
      <style jsx>{`
        @keyframes blob {
          0%,
          100% {
            transform: translate(0, 0) scale(1);
          }
          33% {
            transform: translate(30px, -50px) scale(1.1);
          }
          66% {
            transform: translate(-20px, 20px) scale(0.9);
          }
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

export default BlockchainDetail;
