import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import SidebarProdusen from '../../../components/SidebarProdusen';
import NavbarProdusen from '../../../components/NavbarProdusen';

const SuratJalanProdusen = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [suratJalan, setSuratJalan] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isBlockchainSent, setIsBlockchainSent] = useState(false);

  // Definisikan currentDate
  const currentDate = new Date().toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const token = localStorage.getItem('token');
        if (!token) throw new Error('Silakan login terlebih dahulu');

        const response = await fetch(`http://localhost:5000/api/produsen/pesanan-masuk/${id}/surat-jalan`, {
          headers: { 'Authorization': `Bearer ${token}` },
        });

        if (!response.ok) throw new Error('Gagal mengambil data surat jalan');
        const result = await response.json();
        if (!result.success) throw new Error(result.message || 'Data surat jalan tidak tersedia');
        setSuratJalan(result.data);
      } catch (error) {
        setError(error.message);
        if (error.message.includes('login')) navigate('/login/produsen');
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, [id, navigate]);

  const handleKirimKeBlockchain = async () => {
    setIsLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:5000/api/produsen/pesanan-masuk/${id}/record-to-blockchain`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) throw new Error('Gagal mencatat ke blockchain');
      const result = await response.json();
      if (result.success) {
        alert(result.message);
        setIsBlockchainSent(true);
      } else {
        throw new Error(result.message || 'Gagal mengatur pengiriman ke blockchain');
      }
    } catch (error) {
      setError(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.clear();
    navigate('/');
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-gray-50">
        <svg className="animate-spin h-8 w-8 text-emerald-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
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

  if (!suratJalan) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-gray-50">
        <p className="text-gray-500">Data surat jalan tidak ditemukan.</p>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-gray-50">
      <SidebarProdusen isCollapsed={isCollapsed} setIsCollapsed={setIsCollapsed} />
      <div className={`flex-1 flex flex-col transition-all duration-300 ${isCollapsed ? 'ml-16' : 'ml-64'}`}>
        <NavbarProdusen onLogout={handleLogout} />
        <main className="pt-16 p-6">
          <div className="mb-6 bg-emerald-50 p-4 rounded-lg shadow-md">
            <h3 className="text-lg font-semibold text-emerald-800">Tanggal Hari Ini</h3>
            <p className="text-gray-600">{currentDate}</p>
          </div>

          <div className="flex justify-between items-center mb-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Surat Jalan Produsen</h1>
              <p className="text-gray-600">Detail surat jalan untuk pesanan ID: {id}</p>
            </div>
            <Link
              to="/produsen/pengelolaan-pengiriman"
              className="bg-gray-200 text-gray-800 py-2 px-4 rounded-lg hover:bg-gray-300 transition"
            >
              Kembali
            </Link>
          </div>

          <div className="bg-white rounded-lg shadow-lg p-6">
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700">Nomor Resi</label>
                <p className="mt-1 p-2 bg-gray-100 rounded-md">{suratJalan.nomor_resi}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Nomor Surat Jalan</label>
                <p className="mt-1 p-2 bg-gray-100 rounded-md">{suratJalan.nomor_surat_jalan}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Tanggal Pengiriman</label>
                <p className="mt-1 p-2 bg-gray-100 rounded-md">{suratJalan.tanggal_pengiriman}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Alamat Tujuan</label>
                <p className="mt-1 p-2 bg-gray-100 rounded-md">{suratJalan.alamat_tujuan}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Waktu Pengiriman</label>
                <p className="mt-1 p-2 bg-gray-100 rounded-md">{suratJalan.waktu_pengiriman}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Catatan</label>
                <p className="mt-1 p-2 bg-gray-100 rounded-md">{suratJalan.catatan || 'Tidak ada catatan'}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Status Blockchain</label>
                <p className="mt-1 p-2 bg-gray-100 rounded-md">{suratJalan.status_blockchain || 'Belum Tercatat'}</p>
              </div>
              <div className="flex space-x-4">
                {!isBlockchainSent && (
                  <button
                    type="button"
                    onClick={handleKirimKeBlockchain}
                    className="w-full bg-blue-600 text-white py-3 px-6 rounded-lg hover:bg-blue-700 transition duration-300 disabled:bg-gray-400 disabled:cursor-not-allowed"
                    disabled={isLoading}
                  >
                    {isLoading ? 'Mengirim...' : 'Kirim ke Blockchain'}
                  </button>
                )}
                <Link
                  to="/produsen/pengelolaan-pengiriman"
                  className="w-full bg-gray-200 text-gray-800 py-3 px-6 rounded-lg hover:bg-gray-300 transition text-center"
                >
                  Kembali
                </Link>
              </div>
            </div>

            {error && (
              <div className="mt-6 p-4 bg-red-100 text-red-700 rounded-lg flex items-center gap-2">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.732 6.732a1 1 0 011.414 0L10 7.586l.854-.854a1 1 0 111.414 1.414L11.414 9l.854.854a1 1 0 11-1.414 1.414L10 10.414l-.854.854a1 1 0 01-1.414-1.414L8.586 9l-.854-.854a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
                {error}
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
};

export default SuratJalanProdusen;