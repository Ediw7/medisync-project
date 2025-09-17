// frontend/src/pages/produsen/pengelolaanpengiriman/KonfirmasiPembatalan.jsx

import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import SidebarProdusen from '../../../components/SidebarProdusen';
import NavbarProdusen from '../../../components/NavbarProdusen';

// Fungsi helper untuk format tanggal (Contoh: 01-03-2025)
const formatDate = (dateString) => {
  if (!dateString) return '-';
  const date = new Date(dateString);
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0'); // Bulan dimulai dari 0
  const year = date.getFullYear();
  return `${day}-${month}-${year}`;
};

// Fungsi helper untuk format Rupiah
const formatRupiah = (number) => {
  if (isNaN(number)) return 'Rp. 0';
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(number);
};

// Fungsi helper untuk menghitung batas konfirmasi (Contoh: +4 hari dari tanggal pengajuan)
const getBatasKonfirmasi = (dateString) => {
  if (!dateString) return 'data tidak tersedia';
  const date = new Date(dateString);
  date.setDate(date.getDate() + 4); // Sesuai contoh di gambar (01-03 menjadi 05-03)
  return formatDate(date);
};

// Fungsi helper untuk mengekstrak alasan pembatalan
const getAlasan = (catatan) => {
  if (!catatan) return 'Tidak ada alasan';
  if (catatan.includes('Alasan:')) {
    return catatan.split('Alasan:')[1].trim();
  }
  return catatan;
};


const KonfirmasiPembatalan = () => {
  const navigate = useNavigate();
  const { id } = useParams(); // Mengambil ID pesanan dari URL
  const [isCollapsed, setIsCollapsed] = useState(false);
  
  const [data, setData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      setError(null);
      
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          throw new Error('Silakan login terlebih dahulu');
        }

        // Menggunakan endpoint getSuratJalanById karena me-return data gabungan
        // dari pesanan dan surat_jalan_produsen
        const response = await fetch(`http://localhost:5000/api/produsen/pesanan-masuk/surat-jalan/${id}`, {
          headers: { 'Authorization': `Bearer ${token}` },
        });

        if (response.status === 401) {
           throw new Error('Sesi Anda telah berakhir, silakan login kembali.');
        }
        if (!response.ok) {
           throw new Error('Gagal mengambil data pembatalan');
        }

        const result = await response.json();
        if (result.success && result.data.pesanan) {
          setData(result.data); // Data berisi { pesanan: {...}, detail_pesanan: [...] }
        } else {
          throw new Error(result.message || 'Data pesanan tidak ditemukan');
        }
      } catch (err) {
        setError(err.message);
        if (err.message.includes('login')) {
          navigate('/login/produsen');
        }
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchData();
  }, [id, navigate]);

  const handleLogout = () => {
    localStorage.clear();
    navigate('/');
  };

  const handleTolak = () => {
    // Logika untuk menolak pengajuan
    console.log(`Menolak pengajuan pembatalan untuk ID: ${id}`);
    alert('Pengajuan ditolak.');
    navigate('/produsen/pengelolaan-pengiriman');
  };

  const handleTerima = () => {
    // Logika untuk menerima pengajuan
    console.log(`Menerima pengajuan pembatalan untuk ID: ${id}`);
    alert('Pengajuan diterima.');
    navigate('/produsen/pengelolaan-pengiriman');
  };

  const renderContent = () => {
    if (isLoading) {
      return (
        <div className="flex justify-center items-center h-64">
          <svg className="animate-spin h-8 w-8 text-emerald-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <p className="ml-2 text-gray-500">Memuat data...</p>
        </div>
      );
    }

    if (error) {
      return (
        <div className="p-4 bg-red-100 text-red-700 rounded-lg">Error: {error}</div>
      );
    }

    if (!data || !data.pesanan) {
      return (
        <div className="p-4 text-center text-gray-500">Data pesanan tidak ditemukan.</div>
      );
    }

    const { pesanan } = data; // data.pesanan berisi semua info dari controller

    return (
      <>
        {/* --- Header --- */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-800">Pembatalan Diajukan</h1>
          <p className="text-sm text-gray-500">
            Mohon konfirmasi sebelum {getBatasKonfirmasi(pesanan.tanggal_pesanan)} atau pesanan akan dibatalkan secara otomatis
          </p>
        </div>

        {/* --- Detail Pengajuan --- */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div>
            <label className="block text-xs font-medium text-gray-500 uppercase">Dana Pengembalian</label>
            <p className="text-lg font-semibold text-gray-900">{formatRupiah(pesanan.total_harga)}</p>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 uppercase">Diajukan oleh</label>
            <p className="text-lg font-semibold text-gray-900">{pesanan.nama_pbf}</p>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 uppercase">Alasan Pembeli</label>
            {/* Mengambil dari 'catatan_khusus' atau 'status' jika ada alasan */}
            <p className="text-lg font-semibold text-gray-900">{getAlasan(pesanan.catatan_khusus || pesanan.status)}</p>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 uppercase">No Surat Jalan</label>
            {/* Mengambil dari 'nomor_surat_jalan' di tabel surat_jalan_produsen */}
            <p className="text-lg font-semibold text-gray-900">{pesanan.nomor_surat_jalan || 'Belum Dibuat'}</p>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 uppercase">Diajukan pada</label>
            {/* Mengambil dari 'tanggal_pesanan' */}
            <p className="text-lg font-semibold text-gray-900">{formatDate(pesanan.tanggal_pesanan)}</p>
          </div>
        </div>

        <hr className="my-6" />

        {/* --- Rincian Pesanan --- */}
        <div>
          <h2 className="text-xl font-bold text-gray-800 mb-4">Rincian Pesanan</h2>
          
          <div className="grid grid-cols-3 gap-4 px-4 py-2 bg-gray-50 rounded-t-lg">
            <div className="text-xs font-medium text-gray-500 uppercase">ID Pesanan</div>
            <div className="text-xs font-medium text-gray-500 uppercase">Pesanan Produk</div>
            <div className="text-xs font-medium text-gray-500 uppercase text-right">Total Harga</div>
          </div>

          <div className="grid grid-cols-3 gap-4 px-4 py-4 border border-gray-100 rounded-b-lg">
            <div>
              <p className="text-sm font-medium text-gray-900">{pesanan.nama_pbf}</p>
              {/* Menggunakan 'pesanan_id' (alias dari p.id) */}
              <p className="text-xs text-gray-500">ID Pesanan : {String(pesanan.pesanan_id).padStart(6, '0')}</p>
            </div>
            <div>
              <Link to={`/produsen/pengelolaan-pengiriman/detail/${pesanan.pesanan_id}/surat`} className="text-sm text-blue-600 hover:underline">
                Lihat Surat Pesanan
              </Link>
            </div>
            <div className="text-right">
              <p className="text-sm font-medium text-gray-900">{formatRupiah(pesanan.total_harga)}</p>
              <p className="text-xs text-gray-500">Via Transfer Bank</p> {/* Hardcoded sesuai gambar */}
            </div>
          </div>
        </div>
      </>
    );
  };

  return (
    <div className="flex min-h-screen bg-gray-50">
      <SidebarProdusen isCollapsed={isCollapsed} setIsCollapsed={setIsCollapsed} />
      <div className={`flex-1 flex flex-col transition-all duration-300 ${isCollapsed ? 'ml-16' : 'ml-64'}`}>
        <NavbarProdusen onLogout={handleLogout} />
        
        <main className="pt-16 p-6">
          <div className="bg-white rounded-lg shadow-lg overflow-hidden max-w-4xl mx-auto">
            <div className="p-6">
              {renderContent()}
            </div>
            
            {/* --- Footer Aksi --- */}
            {/* Hanya tampilkan tombol jika data berhasil dimuat */}
            {!isLoading && !error && data && (
              <div className="bg-gray-50 px-6 py-4 flex justify-end gap-3">
                <button 
                  onClick={handleTolak}
                  className="py-2 px-4 bg-gray-200 text-gray-800 font-medium rounded-lg hover:bg-gray-300 transition"
                >
                  Tolak Pengajuan
                </button>
                <button 
                  onClick={handleTerima}
                  className="py-2 px-4 bg-emerald-600 text-white font-medium rounded-lg hover:bg-emerald-700 transition"
                >
                  Terima Pengajuan
                </button>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
};

export default KonfirmasiPembatalan;