import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import SidebarProdusen from '../../../components/SidebarProdusen';
import NavbarProdusen from '../../../components/NavbarProdusen';
import { Loader2, Printer } from 'lucide-react';

const SuratJalanProdusen = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [suratJalan, setSuratJalan] = useState(null);
  const [pesanan, setPesanan] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isBlockchainSent, setIsBlockchainSent] = useState(false);
  const [isSending, setIsSending] = useState(false);

  const currentDate = new Date().toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  const handleLogout = () => {
    localStorage.clear();
    navigate('/');
  };

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const token = localStorage.getItem('token');
        if (!token) throw new Error('Silakan login terlebih dahulu');

        // Fetching surat jalan data
        const sjResponse = await fetch(`http://localhost:5000/api/produsen/pesanan-masuk/${id}/surat-jalan`, {
          headers: { 'Authorization': `Bearer ${token}` },
        });
        if (!sjResponse.ok) throw new Error('Gagal mengambil data surat jalan');
        const sjResult = await sjResponse.json();
        if (!sjResult.success) throw new Error(sjResult.message || 'Data surat jalan tidak tersedia');
        setSuratJalan(sjResult.data);
        
        // Fetching order details
        const pesananResponse = await fetch(`http://localhost:5000/api/produsen/pesanan-masuk/${id}`, {
          headers: { 'Authorization': `Bearer ${token}` },
        });
        if (!pesananResponse.ok) throw new Error('Gagal mengambil data pesanan');
        const pesananResult = await pesananResponse.json();
        if (!pesananResult.success) throw new Error(pesananResult.message || 'Data pesanan tidak tersedia');
        setPesanan(pesananResult.data);

        if (sjResult.data.status_blockchain === 'Tercatat') {
          setIsBlockchainSent(true);
        }

      } catch (err) {
        setError(err.message);
        if (err.message.includes('login')) navigate('/login/produsen');
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, [id, navigate]);

  const handleKirimKeBlockchain = async () => {
    setIsSending(true);
    setError(null);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:5000/api/produsen/pesanan-masuk/${id}/record-to-blockchain`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Gagal mencatat ke blockchain');
      }
      
      const result = await response.json();
      if (result.success) {
        alert(result.message);
        setIsBlockchainSent(true);
        setSuratJalan(prev => ({...prev, status_blockchain: 'Tercatat'}));
      } else {
        throw new Error(result.message || 'Gagal mengatur pengiriman ke blockchain');
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setIsSending(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-gray-50">
        <Loader2 className="animate-spin h-8 w-8 text-blue-600" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-gray-50">
        <div className="p-4 bg-red-100 text-red-700 rounded-lg flex items-center gap-2">
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.732 6.732a1 1 0 011.414 0L10 7.586l.854-.854a1 1 0 111.414 1.414L11.414 9l.854.854a1 1 0 11-1.414 1.414L10 10.414l-.854.854a1 1 0 01-1.414-1.414L8.586 9l-.854-.854a1 1 0 010-1.414z" clipRule="evenodd" />
          </svg>
          {error}
        </div>
      </div>
    );
  }

  if (!suratJalan || !pesanan) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-gray-50">
        <p className="text-gray-500">Data surat jalan atau pesanan tidak ditemukan.</p>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-gray-50">
      <SidebarProdusen isCollapsed={isCollapsed} setIsCollapsed={setIsCollapsed} />
      <div className={`flex-1 flex flex-col transition-all duration-300 ${isCollapsed ? 'ml-16' : 'ml-64'}`}>
        <NavbarProdusen onLogout={handleLogout} />
        
        {/* Control Panel - Hidden when printing */}
        <div className="print:hidden pt-16 p-6 bg-white border-b">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Surat Jalan</h1>
              <p className="text-gray-600">No. {suratJalan.nomor_surat_jalan}</p>
            </div>
            <div className="flex space-x-3">
              <button
                onClick={handlePrint}
                className="flex items-center px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition"
              >
                <Printer className="w-4 h-4 mr-2" />
                Cetak
              </button>
              {suratJalan.status_blockchain !== 'Tercatat' && (
                <button
                  onClick={handleKirimKeBlockchain}
                  disabled={isSending}
                  className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 transition"
                >
                  {isSending ? (
                    <>
                      <Loader2 className="animate-spin w-4 h-4 mr-2" />
                      Mengirim...
                    </>
                  ) : (
                    'Kirim ke Blockchain'
                  )}
                </button>
              )}
              <Link
                to="/produsen/pengelolaan-pengiriman"
                className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition"
              >
                Kembali
              </Link>
            </div>
          </div>
        </div>

        {/* Surat Jalan Document - Start */}
        <main className="print:pt-0 p-8 print:p-0 flex-1">
          <div className="max-w-4xl mx-auto bg-white p-8 border border-gray-300 shadow-md print:border-0 print:shadow-none">
            {/* Header Surat Jalan */}
            <div className="flex justify-between items-start mb-8 pb-4 border-b-2 border-black">
                <div className="flex flex-col">
                    <h1 className="text-2xl font-bold text-gray-800">PT. MediSync Produsen</h1>
                    <p className="text-xs text-gray-600">Jl. Teknologi No. 1, Jakarta Pusat, 10110</p>
                    <p className="text-xs text-gray-600">Email: info@medisync.com | Telp: (021) 1234-5678</p>
                </div>
                <div className="flex flex-col text-right">
                    <h2 className="text-3xl font-bold text-gray-900">SURAT JALAN</h2>
                    <p className="text-lg font-semibold text-gray-700">No. {suratJalan.nomor_surat_jalan}</p>
                    <p className="text-sm text-gray-500">Tanggal: {currentDate}</p>
                </div>
            </div>

            {/* Informasi Pengiriman */}
            <div className="grid grid-cols-2 gap-8 mb-8 text-sm">
                <div>
                    <h3 className="font-bold text-gray-800 mb-2">PENGIRIM</h3>
                    <div className="space-y-1">
                        <p>PT. MediSync Produsen</p>
                        <p>Jl. Teknologi No. 1</p>
                        <p>Jakarta Pusat, 10110</p>
                        <p>Telp: (021) 1234-5678</p>
                    </div>
                </div>
                <div>
                    <h3 className="font-bold text-gray-800 mb-2">PENERIMA</h3>
                    <div className="space-y-1">
                        <p className="font-semibold">{pesanan.pesanan.nama_pbf}</p>
                        <p>{suratJalan.alamat_tujuan}</p>
                        <p>{pesanan.pesanan.kontak_telepon}</p>
                    </div>
                </div>
            </div>

            <hr className="my-6 border-t-2 border-dashed border-gray-300 print:hidden"/>

            {/* Tabel Detail Obat */}
            <div className="mb-8">
              <h3 className="font-bold text-gray-800 mb-4">DETAIL PENGIRIMAN</h3>
              <table className="w-full text-sm border-collapse table-auto">
                <thead>
                  <tr className="bg-gray-100 border border-gray-400">
                    <th className="p-2 text-left font-bold border border-gray-400">No.</th>
                    <th className="p-2 text-left font-bold border border-gray-400">Nama Obat</th>
                    <th className="p-2 text-left font-bold border border-gray-400">Batch ID</th>
                    <th className="p-2 text-left font-bold border border-gray-400">Jumlah</th>
                  </tr>
                </thead>
                <tbody>
                  {pesanan.detail_pesanan.map((item, index) => (
                    <tr key={index} className="border-b border-gray-400">
                      <td className="p-2 border border-gray-400">{index + 1}</td>
                      <td className="p-2 border border-gray-400">{item.nama_obat}</td>
                      <td className="p-2 border border-gray-400 font-mono">{item.batch_id}</td>
                      <td className="p-2 border border-gray-400">{item.jumlah_pesanan} Box</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Barcode dan Informasi Tambahan */}
            <div className="flex justify-between items-end">
              <div className="flex-1">
                <p className="text-xs text-gray-600 mb-2">No. Resi: <span className="font-bold text-gray-900">{suratJalan.nomor_resi}</span></p>
                
              </div>
              
            </div>

          </div>
        </main>
      </div>
    </div>
  );
};

export default SuratJalanProdusen;
