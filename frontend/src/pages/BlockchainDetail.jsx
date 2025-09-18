import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

const BlockchainDetail = () => {
  const { batch_id } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(true);

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

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-emerald-600" />
      </div>
    );
  }

  if (error) return <div className="min-h-screen bg-gray-100 p-6 text-center text-red-600">{error}</div>;
  if (!data) return <div className="min-h-screen bg-gray-100 p-6 text-center text-gray-500">Data tidak ditemukan.</div>;

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <button
        onClick={() => navigate(-1)}
        className="mb-6 inline-flex items-center text-emerald-600 hover:text-[#047857] transition-colors text-sm"
      >
        <ArrowLeft size={16} className="mr-1" /> Kembali
      </button>

      <div className="max-w-3xl mx-auto bg-white/90 backdrop-blur-sm rounded-xl shadow-lg p-8 border border-gray-200/50 hover:shadow-xl transition-all duration-300">
        <h1 className="text-3xl font-bold text-gray-900 mb-6 border-b-2 border-emerald-500/50 pb-2">
          Detail Blockchain: {data.batch_id}
        </h1>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-6">
            <div className="p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
              <p className="text-sm font-medium text-gray-600">Nama Obat</p>
              <p className="mt-1 text-xl text-gray-900 font-semibold">{data.nama_obat}</p>
            </div>
            <div className="p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
              <p className="text-sm font-medium text-gray-600">Tanggal Produksi</p>
              <p className="mt-1 text-lg text-gray-900">
                {new Date(data.tanggal_produksi).toLocaleDateString('id-ID')}
              </p>
            </div>
            <div className="p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
              <p className="text-sm font-medium text-gray-600">Tanggal Kadaluarsa</p>
              <p className="mt-1 text-lg text-gray-900">
                {new Date(data.tanggal_kadaluarsa).toLocaleDateString('id-ID')}
              </p>
            </div>
            <div className="p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
              <p className="text-sm font-medium text-gray-600">Penanggung Jawab</p>
              <p className="mt-1 text-lg text-gray-900">{data.penanggung_jawab}</p>
            </div>
          </div>

          <div className="space-y-6">
            <div className="p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
              <p className="text-sm font-medium text-gray-600">Jumlah</p>
              <p className="mt-1 text-lg text-gray-900">{data.jumlah} pcs</p>
            </div>
            <div className="p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
              <p className="text-sm font-medium text-gray-600">Hash Sertifikat</p>
              <p className="mt-1 text-lg text-gray-900 break-all">{data.hash_sertifikat}</p>
            </div>
            <div className="p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
              <p className="text-sm font-medium text-gray-600">Status Saat Ini</p>
              <p className="mt-1 text-lg text-gray-900">{data.status_saat_ini}</p>
            </div>
            <div className="p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
              <p className="text-sm font-medium text-gray-600">Riwayat</p>
              {data.riwayat && data.riwayat.map((item, index) => (
                <p key={index} className="mt-1 text-gray-900">
                  - {item.status} oleh {item.pemilik} pada{' '}
                  {new Date(item.timestamp).toLocaleDateString('id-ID')}
                </p>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BlockchainDetail;