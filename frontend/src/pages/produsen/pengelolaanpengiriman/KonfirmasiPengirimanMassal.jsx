// frontend/src/pages/produsen/pengelolaanpengiriman/KonfirmasiPengirimanMassal.jsx

import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import SidebarProdusen from '../../../components/SidebarProdusen';
import NavbarProdusen from '../../../components/NavbarProdusen';
import { Loader2, CheckCircle2, Printer, ArrowLeft } from 'lucide-react';

const KonfirmasiPengirimanMassal = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { selectedIds, tanggalPengiriman, waktuPengiriman, catatan } = location.state || {};

  const [isCollapsed, setIsCollapsed] = useState(false);
  const [pesananDetails, setPesananDetails] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  
  const generateProNumber = (prefix, orderId) => {
  const date = new Date();
  const year = date.getFullYear().toString().slice(-2);
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const day = date.getDate().toString().padStart(2, '0');
  const timestamp = date.getTime().toString().slice(-4);
  return `${prefix}-${year}${month}${day}-${orderId}-${timestamp}`;
};
  useEffect(() => {
    if (!selectedIds || selectedIds.length === 0) {
      navigate('/produsen/pengelolaan-pengiriman/pengiriman-massal');
      return;
    }

    const fetchPesananDetails = async () => {
      setIsLoading(true);
      try {
        const token = localStorage.getItem('token');
        if (!token) throw new Error('Token tidak ditemukan');

        // Ambil detail untuk setiap pesanan yang dipilih
        const promises = selectedIds.map(id =>
          fetch(`http://localhost:5000/api/produsen/pesanan-masuk/${id}`, {
            headers: { Authorization: `Bearer ${token}` },
          }).then(res => res.json())
        );

        const results = await Promise.all(promises);
        
        const details = results.map(result => {
        if (result.success) {
            // Gabungkan data pesanan utama DENGAN detail pesanannya
            return {
            ...result.data.pesanan, // Mengambil semua properti (id, nama_pbf, nama_produsen, dll.)
            detail_pesanan: result.data.detail_pesanan, // SECARA EKSPLISIT MENAMBAHKAN DETAIL PRODUK
            nomorResi: generateProNumber('RES', result.data.pesanan.id),
            nomorSuratJalan: generateProNumber('SJ', result.data.pesanan.id),
            };
        }
        return null;
        }).filter(Boolean);

        setPesananDetails(details);
      } catch (err) {
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };

    fetchPesananDetails();
  }, [selectedIds, navigate]);

  return (
    <div className="flex min-h-screen bg-gray-50">
      <SidebarProdusen isCollapsed={isCollapsed} setIsCollapsed={setIsCollapsed} />
      <div className={`flex-1 flex flex-col transition-all duration-300 ${isCollapsed ? 'ml-16' : 'ml-64'}`}>
        <NavbarProdusen onLogout={() => { localStorage.clear(); navigate('/'); }} />
        <main className="flex-1 pt-18 pl-12 p-6 mt-8 ml-8 lg:p-8">
          <div className="max-w-7xl mx-auto">
            <h1 className="text-3xl font-bold text-gray-800 mb-6 pt-10">Proses Pengaturan Pengiriman</h1>
            
            <div className="bg-white rounded-lg shadow-md border">
              <div className="px-6 py-4 border-b">
                <div className="grid grid-cols-5 gap-4 text-xs font-medium text-gray-500 uppercase">
                  <div className="col-span-1">ID Pesanan</div>
                  <div className="col-span-1">Pesanan Produk</div>
                  <div className="col-span-1">Nomor Resi</div>
                  <div className="col-span-1">Nomor Surat Jalan</div>
                  <div className="col-span-1">Status</div>
                </div>
              </div>

              {isLoading ? (
                <div className="p-6 text-center"><Loader2 className="animate-spin inline-block" /></div>
              ) : error ? (
                <div className="p-6 text-center text-red-500">{error}</div>
              ) : (
                <div className="divide-y">
                  {pesananDetails.map(item => (
                    <div key={item.id} className="grid grid-cols-5 gap-4 p-6 items-center">
                      <div className="col-span-1">
                        <p className="font-semibold text-gray-900">{item.nama_pbf}</p>
                        <p className="text-sm text-gray-500">ID Pesanan : {String(item.id).padStart(6, '0')}</p>
                      </div>
                      <div className="col-span-1 text-sm text-emerald-600 hover:underline">
                        <Link to={`/produsen/pengelolaan-pengiriman/detail/${item.id}/surat`}>
                          Lihat Surat Pesanan
                        </Link>
                      </div>
                     <div className="col-span-1 font-mono text-sm text-gray-700 font-semibold">{item.nomorResi}</div>
                    <div className="col-span-1 font-mono text-sm text-gray-700 font-semibold">{item.nomorSuratJalan}</div>
                      <div className="col-span-1">
                        <div className="flex items-center gap-2 text-green-600">
                          <CheckCircle2 size={18} />
                          <div>
                            <p className="font-semibold">Pengiriman Berhasil</p>
                            <p className="text-xs text-gray-500">Siap untuk dikirim</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="mt-6 flex justify-end gap-4">
              <button
                onClick={() => navigate(-1)}
                className="py-2 px-6 bg-gray-200 text-gray-800 font-semibold rounded-lg hover:bg-gray-300"
              >
                Kembali
              </button>
              <button
            onClick={() => navigate('/produsen/pengelolaan-pengiriman/cetak-surat-jalan-massal', { state: { pesananDetails } })}
            className="py-2 px-6 bg-emerald-600 text-white font-semibold rounded-lg hover:bg-emerald-700 flex items-center gap-2"
            >
            <Printer size={18} />
            Cetak Surat Jalan
            </button>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default KonfirmasiPengirimanMassal;