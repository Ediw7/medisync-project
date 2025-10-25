import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import SidebarProdusen from '../../../components/SidebarProdusen';
import NavbarProdusen from '../../../components/NavbarProdusen';
import { Loader2 } from 'lucide-react';
import axios from 'axios';

const KonfirmasiPembatalan = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [pesanan, setPesanan] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const fetchPesananData = async () => {
      setIsLoading(true);
      try {
        const token = localStorage.getItem('token');
        if (!token) throw new Error('Silakan login terlebih dahulu');
        
        const response = await axios.get(`http://localhost:5000/api/produsen/pesanan-masuk/${id}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (response.data.success) {
          setPesanan(response.data.data.pesanan);
        } else {
          throw new Error(response.data.message || 'Data pesanan tidak ditemukan.');
        }
      } catch (err) {
        setError(err.response?.data?.message || err.message);
      } finally {
        setIsLoading(false);
      }
    };
    fetchPesananData();
  }, [id, navigate]);

  const handleAction = async (newStatus) => {
    setIsSubmitting(true);
    setError(null);
    try {
      const token = localStorage.getItem('token');
      const response = await axios.put(`http://localhost:5000/api/produsen/pembatalan/${id}/konfirmasi-pembatalan`, 
        { status: newStatus },
        { headers: { 'Authorization': `Bearer ${token}` } }
      );
      if (response.data.success) {
        alert(`Pesanan berhasil ${newStatus === 'Dibatalkan' ? 'dibatalkan' : 'ditolak pembatalannya'}.`);
        navigate('/produsen/pengelolaan-pengiriman');
      } else {
        throw new Error(response.data.message);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Gagal mengubah status pesanan.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' });
  };

  if (isLoading) return <div className="p-6 text-center">Loading...</div>;
  if (error) return <div className="p-6 text-center text-red-500">Error: {error}</div>;
  if (!pesanan) return <div className="p-6 text-center">Data tidak ditemukan.</div>;

  return (
    <div className="flex min-h-screen bg-gray-50">
      <SidebarProdusen isCollapsed={isCollapsed} setIsCollapsed={setIsCollapsed} />
      <div className={`flex-1 flex flex-col transition-all duration-300 ${isCollapsed ? 'ml-16' : 'ml-64'}`}>
        <NavbarProdusen onLogout={() => { localStorage.clear(); navigate('/'); }} />
        <main className="pt-18 pl-12 p-6 mt-8 ml-8">
          <div className="max-w-4xl mx-auto">
            <div className="mb-6">
              <h1 className="text-3xl font-bold text-gray-800">Pembatalan Diajukan</h1>
              <p className="text-gray-500 mt-1">Mohon konfirmasi sebelum {formatDate(new Date(new Date(pesanan.tanggal_pengajuan_pembatalan).getTime() + 2 * 24 * 60 * 60 * 1000))}</p>
            </div>

            <div className="bg-white rounded-xl shadow-md p-8 space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <label className="block text-sm text-gray-500">Dana Pengembalian</label>
                  <p className="text-lg font-semibold">Rp. {(pesanan.total_harga || 0).toLocaleString('id-ID')}</p>
                </div>
                <div>
                  <label className="block text-sm text-gray-500">Diajukan oleh</label>
                  <p className="text-lg font-semibold">{pesanan.nama_pbf}</p>
                </div>
                <div>
                  <label className="block text-sm text-gray-500">Alasan Pembeli</label>
                  <p className="text-lg font-semibold">{pesanan.alasan_pembatalan || '-'}</p>
                </div>
                <div>
                  <label className="block text-sm text-gray-500">No Surat Jalan</label>
                  <p className="text-lg font-semibold">{pesanan.nomor_surat_jalan || 'Belum Dibuat'}</p>
                </div>
                <div>
                  <label className="block text-sm text-gray-500">Diajukan pada</label>
                  <p className="text-lg font-semibold">{formatDate(pesanan.tanggal_pengajuan_pembatalan)}</p>
                </div>
              </div>

              <div>
                <h2 className="text-xl font-bold text-gray-800 mb-4 border-t pt-8">Rincian Pesanan</h2>
                <div className="border rounded-lg overflow-hidden">
                  <div className="grid grid-cols-3 bg-gray-50 p-4 font-semibold text-sm">
                    <span>ID Pesanan</span>
                    <span>Pesanan Produk</span>
                    <span className="text-right">Total Harga</span>
                  </div>
                  <div className="grid grid-cols-3 p-4">
                    <div>
                      <p>{pesanan.nama_pbf}</p>
                      <p className="text-xs text-gray-400">ID Pesanan : {String(pesanan.id).padStart(6, '0')}</p>
                    </div>
                    <Link to={`/produsen/pengelolaan-pengiriman/detail/${pesanan.id}/surat`} className="text-blue-600 hover:underline">
                      Lihat Surat Pesanan
                    </Link>
                    <div className="text-right">
                      <p className="font-bold">Rp. {(pesanan.total_harga || 0).toLocaleString('id-ID')}</p>
                      <p className="text-xs text-gray-500">Via Transfer Bank</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex justify-end items-center gap-4 pt-4 border-t">
                <button
                  onClick={() => handleAction('Perlu Dikirim')}
                  className="py-2 px-6 bg-gray-200 text-gray-800 font-semibold rounded-lg hover:bg-gray-300"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                  Tolak Pengajuan
                </button>
                <button
                  onClick={() => handleAction('Dibatalkan')}
                  className="py-2 px-6 bg-emerald-600 text-white font-semibold rounded-lg hover:bg-emerald-700"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                  Terima Pengajuan
                </button>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default KonfirmasiPembatalan;