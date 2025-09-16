// frontend/src/pages/produsen/pengelolaanpengiriman/KonfirmasiPembatalan.jsx

import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom'; // Hapus 'Link' jika tidak dipakai
import SidebarProdusen from '../../../components/SidebarProdusen';
import NavbarProdusen from '../../../components/NavbarProdusen';

const KonfirmasiPembatalan = () => {
  const navigate = useNavigate();
  const { id } = useParams(); // Mendapatkan ID pesanan dari URL
  const [isCollapsed, setIsCollapsed] = useState(false);
  
  // --- UPDATED ---
  // State untuk menyimpan data dari API
  const [pesananDetail, setPesananDetail] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isUpdating, setIsUpdating] = useState(false); // State untuk loading tombol

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const token = localStorage.getItem('token');
        if (!token) throw new Error('Otentikasi diperlukan.');

        // Mengambil data pesanan dari endpoint getPesananById
        const response = await fetch(`http://localhost:5000/api/produsen/pesanan/${id}`, {
          headers: { 'Authorization': `Bearer ${token}` },
        });

        if (!response.ok) throw new Error('Gagal mengambil data pesanan.');
        
        const result = await response.json();
        
        if (result.success) {
          setPesananDetail(result.data);
        } else {
          throw new Error(result.message || 'Gagal memuat data');
        }
      } catch (err) {
        setError(err.message);
        if (err.message.includes('Otentikasi')) navigate('/login/produsen');
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, [id, navigate]);
  // --- END UPDATED ---

  const handleLogout = () => {
    localStorage.clear();
    navigate('/');
  };

  // --- UPDATED ---
  // Fungsi untuk menangani update status (Terima / Tolak)
  const handleUpdateStatus = async (status) => {
    setIsUpdating(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:5000/api/produsen/pesanan/${id}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ status })
      });

      const result = await response.json();
      if (!response.ok || !result.success) {
        throw new Error(result.message || 'Gagal memperbarui status');
      }

      alert(`Pengajuan pembatalan telah ${status === 'Dibatalkan' ? 'diterima' : 'ditolak'}.`);
      navigate('/produsen/pengelolaan-pengiriman/pembatalan'); // Arahkan ke tab pembatalan

    } catch (err) {
      setError(err.message);
      alert(`Error: ${err.message}`);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleTerima = () => {
    // Mengubah status menjadi 'Dibatalkan'
    handleUpdateStatus('Dibatalkan');
  };

  const handleTolak = () => {
    // Mengubah status kembali ke 'Perlu Dikirim'
    // (Asumsi: jika dibatalkan, kembali ke status 'Perlu Dikirim')
    // Sesuaikan logika ini jika status sebelumnya bisa jadi 'Dikirim'
    handleUpdateStatus('Perlu Dikirim');
  };
  // --- END UPDATED ---

  // Menampilkan loading atau error
  if (isLoading) {
    return (
      <div className="flex min-h-screen bg-gray-50">
        <SidebarProdusen isCollapsed={isCollapsed} setIsCollapsed={setIsCollapsed} />
        <div className={`flex-1 flex flex-col transition-all duration-300 ${isCollapsed ? 'ml-16' : 'ml-64'}`}>
          <NavbarProdusen onLogout={handleLogout} />
          <main className="pt-16 p-6 text-center">Memuat data...</main>
        </div>
      </div>
    );
  }

  if (error) {
     return (
      <div className="flex min-h-screen bg-gray-50">
        <SidebarProdusen isCollapsed={isCollapsed} setIsCollapsed={setIsCollapsed} />
        <div className={`flex-1 flex flex-col transition-all duration-300 ${isCollapsed ? 'ml-16' : 'ml-64'}`}>
          <NavbarProdusen onLogout={handleLogout} />
          <main className="pt-16 p-6 text-center text-red-600">Error: {error}</main>
        </div>
      </div>
    );
  }

  if (!pesananDetail || !pesananDetail.pesanan) {
    return (
      <div className="flex min-h-screen bg-gray-50">
        <SidebarProdusen isCollapsed={isCollapsed} setIsCollapsed={setIsCollapsed} />
        <div className={`flex-1 flex flex-col transition-all duration-300 ${isCollapsed ? 'ml-16' : 'ml-64'}`}>
          <NavbarProdusen onLogout={handleLogout} />
          <main className="pt-16 p-6 text-center">Data pesanan tidak ditemukan.</main>
        </div>
      </div>
    );
  }

  // Jika data sudah ada
  const { pesanan, detail_pesanan } = pesananDetail;

  return (
    <div className="flex min-h-screen bg-gray-50">
      <SidebarProdusen isCollapsed={isCollapsed} setIsCollapsed={setIsCollapsed} />
      <div className={`flex-1 flex flex-col transition-all duration-300 ${isCollapsed ? 'ml-16' : 'ml-64'}`}>
        <NavbarProdusen onLogout={handleLogout} />
        
        <main className="pt-16 p-6">
          <h1 className="text-2xl font-bold mb-6">Konfirmasi Pembatalan</h1>
          
          <div className="bg-white rounded-lg shadow-lg p-8 max-w-5xl mx-auto">
            
            {/* --- Bagian Header --- */}
            <h2 className="text-xl font-semibold text-gray-800">Pembatalan Diajukan</h2>
            <p className="text-gray-500 text-sm mt-1">
              {/* TODO: Ganti dengan tanggal dinamis jika ada */}
              Mohon konfirmasi sebelum 05-03-2025 atau pesanan akan dibatalkan secara otomatis
            </p>

            {/* --- Bagian Detail Pengajuan (Data dari API) --- */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-y-6 gap-x-12 mt-8 border-b pb-8">
              <div>
                <label className="block text-sm font-medium text-gray-500">Dana Pengembalian</label>
                <p className="text-lg font-semibold text-gray-900 mt-1">
                  Rp. {pesanan.total_harga.toLocaleString('id-ID')}
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-500">Diajukan oleh</label>
                <p className="text-lg font-semibold text-gray-900 mt-1">
                  {pesanan.nama_pbf_resmi || 'N/A'}
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-500">Alasan Pembeli</label>
                <p className="text-lg font-semibold text-gray-900 mt-1">
                  {pesanan.alasan_pembatalan || 'Tidak ada alasan'}
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-500">No Surat Jalan</label>
                <p className="text-lg font-semibold text-gray-900 mt-1">
                  {pesanan.nomor_surat_jalan || 'Belum Dibuat'}
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-500">Diajukan pada</label>
                <p className="text-lg font-semibold text-gray-900 mt-1">
                  {pesanan.tanggal_pengajuan_pembatalan ? 
                    new Date(pesanan.tanggal_pengajuan_pembatalan).toLocaleDateString('id-ID', {
                      day: '2-digit', month: '2-digit', year: 'numeric'
                    }) : 'N/A'
                  }
                </p>
              </div>
            </div>

            {/* --- Bagian Rincian Pesanan --- */}
            <h3 className="text-lg font-semibold text-gray-800 mt-8 mb-4">Rincian Pesanan</h3>
            
            <div className="bg-gray-50 rounded-t-lg px-6 py-3">
              <div className="grid grid-cols-10 gap-4 text-xs font-medium text-gray-500 uppercase">
                <div className="col-span-3">ID Pesanan</div>
                <div className="col-span-3">Pesanan Produk</div>
                <div className="col-span-2 text-right">Qty</div>
                <div className="col-span-2 text-right">Total Harga</div>
              </div>
            </div>

            {/* Loop untuk detail pesanan */}
            {detail_pesanan.length > 0 ? detail_pesanan.map((item, index) => (
              <div key={item.id} className={`border-x px-6 py-4 ${index === detail_pesanan.length - 1 ? 'border-b rounded-b-lg' : 'border-b-0'}`}>
                <div className="grid grid-cols-10 gap-4 items-center">
                  <div className="col-span-3">
                    <p className="text-sm font-medium text-gray-900">{pesanan.nama_pbf_resmi}</p>
                    <p className="text-xs text-gray-500">ID Pesanan : {String(pesanan.id).padStart(6, '0')}</p>
                  </div>
                  <div className="col-span-3">
                    <p className="text-sm font-medium text-gray-900">{item.nama_obat}</p>
                    <p className="text-xs text-gray-500">Batch ID : {item.batch_id || 'N/A'}</p>
                  </div>
                  <div className="col-span-2 text-right">
                    <p className="text-sm text-gray-900">{item.jumlah_pesanan.toLocaleString('id-ID')} box</p>
                  </div>
                  <div className="col-span-2 text-right">
                    <p className="text-sm font-medium text-gray-900">
                      Rp. {item.total_harga.toLocaleString('id-ID')}
                    </p>
                    {/* Hanya tampilkan total keseluruhan di item pertama untuk menghindari duplikasi visual */}
                    {index === 0 && (
                       <p className="text-xs text-gray-500">Total: Rp. {pesanan.total_harga.toLocaleString('id-ID')}</p>
                    )}
                  </div>
                </div>
              </div>
            )) : (
              <div className="border-b border-x rounded-b-lg px-6 py-4 text-center text-gray-500">
                Tidak ada detail produk ditemukan.
              </div>
            )}

            {/* --- Bagian Tombol Aksi --- */}
            <div className="flex justify-end gap-4 mt-10">
              <button 
                onClick={handleTolak}
                disabled={isUpdating}
                className="py-2 px-6 bg-gray-100 text-gray-700 font-medium rounded-lg hover:bg-gray-200 transition disabled:opacity-50"
              >
                {isUpdating ? 'Memproses...' : 'Tolak Pengajuan'}
              </button>
              <button 
                onClick={handleTerima}
                disabled={isUpdating}
                className="py-2 px-6 bg-emerald-600 text-white font-medium rounded-lg hover:bg-emerald-700 transition disabled:opacity-50"
              >
                {isUpdating ? 'Memproses...' : 'Terima Pengajuan'}
              </button>
            </div>
            
          </div>
        </main>
      </div>
    </div>
  );
};

export default KonfirmasiPembatalan;