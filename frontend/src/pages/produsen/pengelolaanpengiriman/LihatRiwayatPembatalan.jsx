// File: frontend/src/pages/produsen/pengelolaanpengiriman/LihatRiwayatPembatalan.jsx

import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import SidebarProdusen from '../../../components/SidebarProdusen';
import NavbarProdusen from '../../../components/NavbarProdusen';
import { ArrowLeft, Loader2 } from 'lucide-react';
import axios from 'axios';

const LihatRiwayatPembatalan = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [data, setData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const token = localStorage.getItem('token');
        const response = await axios.get(`http://localhost:5000/api/produsen/pesanan-masuk/${id}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setData(response.data.data);
      } catch (err) {
        setError(err.response?.data?.message || 'Gagal memuat data pembatalan');
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, [id]);

  if (isLoading) {
    return <div className="flex justify-center items-center h-screen"><Loader2 className="animate-spin h-8 w-8 text-emerald-600" /></div>;
  }

  if (error) {
    return <div className="p-6 text-center text-red-500">Error: {error}</div>;
  }
  
  if (!data || !data.pesanan) {
    return <div className="p-6 text-center text-gray-500">Data tidak ditemukan.</div>;
  }
  
  const { pesanan } = data;

  return (
    <div className="flex min-h-screen bg-gray-100">
      <SidebarProdusen isCollapsed={isCollapsed} setIsCollapsed={setIsCollapsed} />
      <div className={`flex-1 flex flex-col transition-all duration-300 ${isCollapsed ? 'ml-16' : 'ml-64'}`}>
        <NavbarProdusen onLogout={() => { localStorage.clear(); navigate('/'); }} />
        <main className="flex-1 pt-16 p-6">
          <div className="max-w-4xl mx-auto">
            <h1 className="text-2xl font-bold text-gray-800 mb-6">Riwayat Pembatalan</h1>

            <div className="bg-white p-8 rounded-lg shadow-sm border border-gray-200">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 pb-6 border-b">
                <div>
                  <p className="text-sm text-gray-500">Dana Pengembalian</p>
                  <p className="text-lg font-semibold text-gray-900">Rp {(pesanan.total_harga || 0).toLocaleString('id-ID')}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Diajukan oleh</p>
                  <p className="text-lg font-semibold text-gray-900">{pesanan.nama_pbf}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Alasan Pembeli</p>
                  <p className="text-lg font-semibold text-gray-900">{pesanan.alasan_pembatalan}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">No Surat Jalan</p>
                  <p className="text-lg font-semibold text-gray-900">{pesanan.nomor_surat_jalan || '-'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Diajukan pada</p>
                  <p className="text-lg font-semibold text-gray-900">
                    {new Date(pesanan.tanggal_pesanan).toLocaleDateString('id-ID', { day: '2-digit', month: '2-digit', year: 'numeric' }).replace(/\//g, '-')}
                  </p>
                </div>
              </div>

              <div className="mt-6">
                <h2 className="text-xl font-bold text-gray-800 mb-4">Rincian Pesanan</h2>
                <div className="bg-white border rounded-lg overflow-hidden">
                  <div className="grid grid-cols-3 bg-gray-50 p-4 font-semibold text-sm text-gray-600">
                    <span>ID Pesanan</span>
                    <span>Pesanan Produk</span>
                    <span className="text-right">Total Harga</span>
                  </div>
                  <div className="grid grid-cols-3 p-4 items-center">
                    <div>
                      <p className="font-semibold text-gray-900">{pesanan.nama_pbf}</p>
                      <p className="text-xs text-gray-500">ID Pesanan : {String(pesanan.id).padStart(6, '0')}</p>
                    </div>
                    <Link to={`/produsen/pengelolaan-pengiriman/detail/${pesanan.id}/surat`} className="text-emerald-600 hover:underline font-medium">
                      Lihat Surat Pesanan
                    </Link>
                    <div className="text-right">
                      <p className="font-bold text-gray-900">Rp {(pesanan.total_harga || 0).toLocaleString('id-ID')}</p>
                      <p className="text-xs text-gray-500">Via Transfer Bank</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex justify-end mt-8">
                <button
                  onClick={() => navigate('/produsen/pengelolaan-pengiriman')}
                  className="py-2 px-6 bg-gray-200 text-gray-800 font-semibold rounded-lg hover:bg-gray-300 transition"
                >
                  Kembali
                </button>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default LihatRiwayatPembatalan;