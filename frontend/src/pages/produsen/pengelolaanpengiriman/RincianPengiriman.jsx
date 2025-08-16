import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import SidebarProdusen from '../../../components/SidebarProdusen';
import NavbarProdusen from '../../../components/NavbarProdusen';

const RincianPengiriman = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [pesanan, setPesanan] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [tanggalPengiriman, setTanggalPengiriman] = useState('');
  const [catatan, setCatatan] = useState('');

  // Mendapatkan tanggal hari ini
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

        const response = await fetch(`http://localhost:5000/api/produsen/pesanan-masuk/${id}`, {
          headers: { 'Authorization': `Bearer ${token}` },
        });

        if (!response.ok) throw new Error('Gagal mengambil data pesanan');
        const result = await response.json();
        if (!result.success) throw new Error(result.message || 'Data pesanan tidak tersedia');
        setPesanan(result.data);
      } catch (error) {
        setError(error.message);
        if (error.message.includes('login')) navigate('/login/produsen');
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, [id, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:5000/api/produsen/pesanan-masuk/${id}/status`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          status: 'Dikirim',
          tanggalPengiriman,
          catatan,
        }),
      });

      if (!response.ok) throw new Error('Gagal mengatur pengiriman');
      const result = await response.json();
      if (result.success) {
        alert('Pengiriman berhasil diatur!');
        navigate('/produsen/pengelolaan-pengiriman');
      } else {
        throw new Error(result.message || 'Gagal mengatur pengiriman');
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

  if (!pesanan) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-gray-50">
        <p className="text-gray-500">Data pesanan tidak ditemukan.</p>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-gray-50">
      <SidebarProdusen isCollapsed={isCollapsed} setIsCollapsed={setIsCollapsed} />
      <div className={`flex-1 flex flex-col transition-all duration-300 ${isCollapsed ? 'ml-16' : 'ml-64'}`}>
        <NavbarProdusen onLogout={handleLogout} />
        <main className="pt-16 p-6">
          {/* Header dengan Tanggal */}
          <div className="mb-6 bg-emerald-50 p-4 rounded-lg shadow-md">
            <h3 className="text-lg font-semibold text-emerald-800">Tanggal Hari Ini</h3>
            <p className="text-gray-600">{currentDate}</p>
          </div>

          <div className="flex justify-between items-center mb-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Rincian Pengiriman</h1>
              <p className="text-gray-600">Rincian pesanan untuk pengiriman ID: {id}</p>
            </div>
            <Link
              to="/produsen/pengelolaan-pengiriman"
              className="bg-gray-200 text-gray-800 py-2 px-4 rounded-lg hover:bg-gray-300 transition"
            >
              Kembali
            </Link>
          </div>

          <div className="bg-white rounded-lg shadow-lg p-6">
            <div className="mb-6">
              <h2 className="text-lg font-semibold text-gray-900 border-b pb-2">Detail Pesanan</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                <p className="text-gray-700"><strong className="text-gray-900">PBF:</strong> {pesanan.pesanan.nama_pbf}</p>
                <p className="text-gray-700"><strong className="text-gray-900">Alamat PBF:</strong> {pesanan.pesanan.alamat_pbf}</p>
                <p className="text-gray-700"><strong className="text-gray-900">Total Harga:</strong> Rp. {pesanan.pesanan.total_harga.toLocaleString('id-ID')}</p>
                <p className="text-gray-700"><strong className="text-gray-900">Tujuan Distribusi:</strong> {pesanan.pesanan.tujuan_distribusi || 'Tidak ditentukan'}</p>
              </div>
            </div>

            <div className="mb-6">
              <h2 className="text-lg font-semibold text-gray-900 border-b pb-2">Detail Produk</h2>
              <div className="overflow-x-auto mt-4">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Nama Obat</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Bentuk Sediaan</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Dosis</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Jumlah Pesanan</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Harga Per Unit</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Total Harga</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {pesanan.detail_pesanan.map((item, index) => (
                      <tr key={index} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.nama_obat}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.bentuk_sediaan}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.dosis}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.jumlah_pesanan}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">Rp. {item.harga_per_unit.toLocaleString('id-ID')}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">Rp. {item.total_harga.toLocaleString('id-ID')}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700">Tanggal Pengiriman</label>
                <input
                  type="date"
                  value={tanggalPengiriman}
                  onChange={(e) => setTanggalPengiriman(e.target.value)}
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-emerald-500 focus:border-emerald-500 p-2"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Catatan</label>
                <textarea
                  value={catatan}
                  onChange={(e) => setCatatan(e.target.value)}
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-emerald-500 focus:border-emerald-500 p-2 h-24 resize-none"
                  placeholder="Tambahkan catatan pengiriman (opsional)"
                />
              </div>
              <button
                type="submit"
                className="w-full bg-emerald-600 text-white py-3 px-6 rounded-lg hover:bg-emerald-700 transition duration-300 disabled:bg-gray-400 disabled:cursor-not-allowed"
                disabled={isLoading}
              >
                {isLoading ? 'Mengatur...' : 'Konfirmasi Pengiriman'}
              </button>
            </form>

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

export default RincianPengiriman;