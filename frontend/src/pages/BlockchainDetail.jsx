import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Copy, Clock, CheckCircle, AlertTriangle } from 'lucide-react';

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
        console.log(`Fetching data for batch_id: ${batch_id}`); // Debug log
        const response = await fetch(`http://localhost:5000/api/public/blockchain-detail/${batch_id}`);
        if (!response.ok) throw new Error('Gagal mengambil data dari server.');
        const result = await response.json();
        console.log('Response received:', result); // Debug log
        if (!result.success) throw new Error(result.message);
        setData(result.data);
      } catch (err) {
        console.error('Fetch error:', err); // Debug error
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, [batch_id]);

  const handleCopyHash = async () => {
    if (data.hash_sertifikat) {
      await navigator.clipboard.writeText(data.hash_sertifikat);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'DIPRODUKSI':
        return { color: 'bg-green-100 text-green-800 border-green-200', icon: CheckCircle };
      case 'DIKIRIM_KE_PBF':
        return { color: 'bg-blue-100 text-blue-800 border-blue-200', icon: Clock };
      default:
        return { color: 'bg-gray-100 text-gray-800 border-gray-200', icon: AlertTriangle };
    }
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
        <AlertTriangle className="mx-auto h-12 w-12 text-red-500 mb-4" />
        <h2 className="text-xl font-bold text-red-800 mb-2">Terjadi Kesalahan</h2>
        <p className="text-red-600">{error}</p>
      </div>
    </div>
  );
  if (!data) return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-6">
      <div className="bg-white rounded-xl p-8 max-w-md text-center shadow-lg">
        <AlertTriangle className="mx-auto h-12 w-12 text-gray-400 mb-4" />
        <h2 className="text-xl font-bold text-gray-800 mb-2">Data Tidak Ditemukan</h2>
        <p className="text-gray-500">Batch ID {batch_id} tidak tersedia di blockchain.</p>
      </div>
    </div>
  );

  const statusBadge = getStatusBadge(data.status_saat_ini);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-6">
      <div className="max-w-4xl mx-auto">
        <button
          onClick={() => navigate(-1)}
          className="mb-6 inline-flex items-center text-emerald-600 hover:text-emerald-700 transition-colors text-sm font-medium"
        >
          <ArrowLeft size={16} className="mr-1" /> Kembali ke Verifikasi
        </button>

        <div className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-xl p-8 border border-white/20 hover:shadow-2xl transition-all duration-300">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-1">
                Detail Blockchain: {data.batch_id}
              </h1>
              <p className="text-sm text-gray-500">Verifikasi traceability obat</p>
            </div>
            <div className={`px-4 py-2 rounded-full border ${statusBadge.color} flex items-center space-x-2`}>
              <statusBadge.icon size={16} />
              <span className="font-medium">{data.status_saat_ini}</span>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="space-y-6">
              <div className="p-6 bg-gradient-to-r from-emerald-50 to-green-50 rounded-xl border border-emerald-100">
                <p className="text-sm font-medium text-gray-600 mb-2">Nama Obat</p>
                <p className="text-2xl text-gray-900 font-bold">{data.nama_obat}</p>
              </div>
              <div className="p-6 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors border border-gray-200">
                <p className="text-sm font-medium text-gray-600 mb-2">Nama Perusahaan</p>
                <p className="text-xl text-gray-900 font-semibold">{data.nama_perusahaan}</p>
              </div>
              <div className="p-6 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors border border-gray-200">
                <p className="text-sm font-medium text-gray-600 mb-2">Penanggung Jawab</p>
                <p className="text-lg text-gray-900">{data.penanggung_jawab}</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors border border-gray-200">
                  <p className="text-sm font-medium text-gray-600 mb-2">Tanggal Produksi</p>
                  <p className="text-lg text-gray-900 font-medium">
                    {new Date(data.tanggal_produksi).toLocaleDateString('id-ID')}
                  </p>
                </div>
                <div className="p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors border border-gray-200">
                  <p className="text-sm font-medium text-gray-600 mb-2">Tanggal Kadaluarsa</p>
                  <p className="text-lg text-gray-900 font-medium">
                    {new Date(data.tanggal_kadaluarsa).toLocaleDateString('id-ID')}
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-6">
              <div className="p-6 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors border border-gray-200">
                <p className="text-sm font-medium text-gray-600 mb-2">Jumlah Unit</p>
                <p className="text-2xl text-gray-900 font-bold">{data.jumlah} pcs</p>
              </div>
              <div className="p-6 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors border border-gray-200 relative">
                <p className="text-sm font-medium text-gray-600 mb-2">Hash Sertifikat Analisis</p>
                <p className="text-sm text-gray-900 break-all mb-2 pr-8">{data.hash_sertifikat}</p>
                <button
                  onClick={handleCopyHash}
                  className="absolute top-4 right-4 p-2 text-gray-500 hover:text-gray-700 transition-colors rounded-full hover:bg-gray-200"
                  title="Salin hash"
                >
                  <Copy size={16} />
                </button>
                {copied && (
                  <div className="absolute top-14 right-4 bg-green-100 text-green-800 px-2 py-1 rounded text-xs">
                    Disalin!
                  </div>
                )}
              </div>
              <div className="p-6 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-100">
                <p className="text-sm font-medium text-gray-600 mb-4">Riwayat Transaksi</p>
                <ul className="space-y-3">
                  {data.riwayat && data.riwayat.map((item, index) => (
                    <li key={index} className="flex items-start space-x-3 p-3 bg-white rounded-lg border border-gray-100">
                      <div className="flex-shrink-0 w-2 h-2 bg-emerald-500 rounded-full mt-2"></div>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-900">{item.status}</p>
                        <p className="text-xs text-gray-500">Oleh {item.pemilik} pada {new Date(item.timestamp).toLocaleDateString('id-ID')} {new Date(item.timestamp).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}</p>
                        {item.detail && <p className="text-xs text-gray-600 mt-1">{item.detail}</p>}
                      </div>
                    </li>
                  ))}
                </ul>
                {(!data.riwayat || data.riwayat.length === 0) && (
                  <p className="text-sm text-gray-500 text-center py-4">Belum ada riwayat transaksi.</p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BlockchainDetail;