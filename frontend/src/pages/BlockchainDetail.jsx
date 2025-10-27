import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Copy, Clock, CheckCircle2, AlertCircle, Shield, Package } from 'lucide-react'; // Menggunakan ikon yang konsisten

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
      setError(''); // Reset error
      try {
        const response = await fetch(`http://localhost:5000/api/public/blockchain-detail/${batch_id}`);
        if (!response.ok) throw new Error('Gagal mengambil data dari server.');
        const result = await response.json();
        if (!result.success) throw new Error(result.message);
        setData(result.data);
      } catch (err) {
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, [batch_id]);

  const handleCopyHash = async () => {
    if (data?.hash_sertifikat) {
      await navigator.clipboard.writeText(data.hash_sertifikat);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  // Status config disesuaikan dengan gaya DetailProduksi/Manajemen
  const getStatusConfig = (status) => {
    const configs = {
      'DIPRODUKSI': { icon: CheckCircle2, color: 'bg-green-100 text-green-800 border-green-200', label: 'Diproduksi' },
      'DIKIRIM_KE_PBF': { icon: Clock, color: 'bg-blue-100 text-blue-800 border-blue-200', label: 'Dikirim ke PBF' },
       // Tambahkan status lain jika ada di blockchain Anda
      'DITERIMA_PBF': { icon: CheckCircle2, color: 'bg-purple-100 text-purple-800 border-purple-200', label: 'Diterima PBF' },
      'DIKIRIM_KE_APOTEK': { icon: Clock, color: 'bg-orange-100 text-orange-800 border-orange-200', label: 'Dikirim ke Apotek' },
      'DITERIMA_APOTEK': { icon: CheckCircle2, color: 'bg-emerald-100 text-emerald-800 border-emerald-200', label: 'Diterima Apotek' },
    };
    // Default jika status tidak dikenali
    return configs[status] || { icon: AlertCircle, color: 'bg-gray-100 text-gray-800 border-gray-200', label: status || 'Tidak Diketahui' };
  };


  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="flex flex-col items-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-emerald-600" />
          <p className="text-gray-500">Memuat detail blockchain...</p>
        </div>
      </div>
    );
  }

  if (error) return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-6">
      <div className="bg-red-50 border border-red-200 rounded-xl p-8 max-w-md text-center">
        <AlertCircle className="mx-auto h-12 w-12 text-red-500 mb-4" />
        <h2 className="text-xl font-bold text-red-800 mb-2">Terjadi Kesalahan</h2>
        <p className="text-red-600">{error}</p>
        <button onClick={() => navigate(-1)} className="mt-6 text-sm text-gray-600 hover:underline">Kembali</button>
      </div>
    </div>
  );

  if (!data) return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-6">
      <div className="bg-white rounded-xl p-8 max-w-md text-center shadow-lg">
        <Package className="mx-auto h-12 w-12 text-gray-400 mb-4" /> {/* Ganti ikon */}
        <h2 className="text-xl font-bold text-gray-800 mb-2">Data Tidak Ditemukan</h2>
        <p className="text-gray-500">Batch ID <span className="font-semibold">{batch_id}</span> tidak tersedia di blockchain.</p>
         <button onClick={() => navigate(-1)} className="mt-6 text-sm text-gray-600 hover:underline">Kembali</button>
      </div>
    </div>
  );

  const statusConfig = getStatusConfig(data.status_saat_ini);
  const StatusIcon = statusConfig.icon;

  return (
    // Background gradien dari DetailProduksi
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-6">
      <div className="max-w-4xl mx-auto">
        <button
          onClick={() => navigate(-1)}
          // Tombol kembali disesuaikan
          className="mb-6 inline-flex items-center text-emerald-600 hover:text-emerald-700 transition-colors text-sm font-medium"
        >
          <ArrowLeft size={16} className="mr-1" /> Kembali
        </button>

        {/* Main Card disesuaikan */}
        <div className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-xl p-8 border border-white/20 hover:shadow-2xl transition-all duration-300">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-1">
                Detail Blockchain
              </h1>
              {/* Batch ID dibuat lebih menonjol */}
              <p className="text-sm text-gray-500">Batch ID: <span className="font-semibold text-gray-700">{data.batch_id}</span></p>
            </div>
            {/* Status badge disesuaikan */}
            <div className={`px-4 py-2 rounded-full border ${statusConfig.color} flex items-center space-x-2`}>
              <StatusIcon size={16} />
              <span className="font-medium text-sm">{statusConfig.label}</span>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Kolom Kiri */}
            <div className="space-y-6">
              {/* Kartu Info Obat */}
              <InfoCard title="Informasi Obat" bgColor="from-emerald-50 to-green-50" borderColor="border-emerald-100">
                <InfoItem label="Nama Obat" value={data.nama_obat} />
                <InfoItem label="Nama Perusahaan" value={data.nama_perusahaan} />
                <InfoItem label="Penanggung Jawab" value={data.penanggung_jawab} />
                 {/* Tanggal dibuat full width */}
                <div className="col-span-full grid grid-cols-2 gap-x-6 gap-y-5">
                   <InfoItem
                      label="Tanggal Produksi"
                      value={new Date(data.tanggal_produksi).toLocaleDateString('id-ID', { dateStyle: 'long', timeZone: 'UTC' })}
                   />
                   <InfoItem
                      label="Tanggal Kadaluarsa"
                      value={new Date(data.tanggal_kadaluarsa).toLocaleDateString('id-ID', { dateStyle: 'long', timeZone: 'UTC' })}
                    />
                </div>
              </InfoCard>

              {/* Kartu Jumlah & Hash */}
               <InfoCard title="Detail Batch" bgColor="from-gray-50 to-gray-100" borderColor="border-gray-200">
                 <InfoItem label="Jumlah Unit" value={`${data.jumlah} pcs`} />
                 <HashItem label="Hash Sertifikat Analisis" hash={data.hash_sertifikat} onCopy={handleCopyHash} copied={copied}/>
               </InfoCard>
            </div>

            {/* Kolom Kanan */}
            <div className="space-y-6">
              {/* Kartu Riwayat */}
              <InfoCard title="Riwayat Transaksi" bgColor="from-blue-50 to-indigo-50" borderColor="border-blue-100">
                <ul className="space-y-4 col-span-full"> {/* Buat full width */}
                  {data.riwayat && data.riwayat.length > 0 ? (
                      data.riwayat.map((item, index) => {
                       const itemStatusConfig = getStatusConfig(item.status); // Dapatkan config untuk setiap item riwayat
                       const ItemStatusIcon = itemStatusConfig.icon;
                       return (
                        <li key={index} className="flex items-start space-x-3 p-3 bg-white rounded-lg border border-gray-100 shadow-sm">
                           <div className={`flex-shrink-0 p-1.5 rounded-md mt-1 ${itemStatusConfig.color.replace('text-', 'bg-').split(' ')[0]}`}>
                            <ItemStatusIcon size={14} className={itemStatusConfig.color.replace('bg-', 'text-').split(' ')[1]} />
                          </div>
                          <div className="flex-1">
                            <p className="text-sm font-semibold text-gray-900">{itemStatusConfig.label}</p>
                            <p className="text-xs text-gray-500">
                              Oleh {item.pemilik} pada {new Date(item.timestamp).toLocaleDateString('id-ID')} {new Date(item.timestamp).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                            </p>
                            {item.detail && <p className="text-xs text-gray-600 mt-1">{item.detail}</p>}
                          </div>
                        </li>
                       );
                      })
                  ) : (
                    <li className="text-sm text-gray-500 text-center py-4 col-span-full">Belum ada riwayat transaksi.</li>
                  )}
                </ul>
              </InfoCard>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// --- Helper Components (Disalin dari DetailProduksi yang sudah disesuaikan) ---

const InfoCard = ({ title, children, bgColor = 'from-gray-50 to-gray-100', borderColor = 'border-gray-200' }) => (
  <div className={`bg-gradient-to-br ${bgColor} rounded-xl border ${borderColor} overflow-hidden shadow-sm hover:shadow-md transition-shadow`}>
    {title && <h3 className="px-6 py-4 text-lg font-semibold text-gray-700 border-b border-gray-200 bg-white/50">{title}</h3>}
    {/* Mengubah p-6 menjadi px-6 pb-6 pt-5 jika ada title, atau p-6 jika tidak */}
    <div className={`grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-5 ${title ? 'px-6 pb-6 pt-5' : 'p-6'}`}>
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
    <div className="p-3 bg-gray-100 rounded-lg border border-gray-200 pr-10">
      <code className="text-xs text-gray-700 break-all font-mono">
        {hash || '-'}
      </code>
    </div>
    {hash && (
      <button
        onClick={() => onCopy(hash)}
        className="absolute top-8 right-2 p-1.5 text-gray-400 hover:text-gray-600 transition-colors rounded-md hover:bg-gray-200"
        title="Salin hash"
      >
        <Copy size={14} />
      </button>
    )}
    {copied && hash && (
      <div className="absolute top-16 right-2 bg-green-100 text-green-800 px-2 py-0.5 rounded text-xs shadow z-10">
        Disalin!
      </div>
    )}
  </div>
);

export default BlockchainDetail;