import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import SidebarPbf from '../../../components/SidebarPbf';
import NavbarPbf from '../../../components/NavbarPbf';
import { Loader2 } from 'lucide-react';
import qrcode from 'qrcode'; // <-- 1. Tambahkan impor untuk QR Code

const DetailStokPbf = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [stok, setStok] = useState(null);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [qrCode, setQrCode] = useState(''); // <-- 2. Tambahkan state untuk QR Code

  useEffect(() => {
    const fetchStokDetail = async () => {
      setIsLoading(true);
      const token = localStorage.getItem('token');
      if (!token) {
        alert('Anda harus login untuk mengakses halaman ini.');
        navigate('/login/pbf');
        return;
      }
      try {
        const response = await fetch(`http://localhost:5000/api/pbf/stok/detail/${id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!response.ok) throw new Error('Gagal mengambil detail stok');
        const result = await response.json();
        if (result.success) {
          setStok(result.data);
          // --- 3. Generate QR Code setelah data berhasil diambil ---
          const qrUrl = `http://localhost:5173/blockchain-detail/${result.data.batch_id}`;
          qrcode.toDataURL(qrUrl, (err, url) => {
            if (err) {
              console.error('Gagal membuat QR code:', err);
              return;
            }
            setQrCode(url);
          });
          // --- Akhir dari generate QR Code ---
        } else {
          throw new Error(result.message);
        }
      } catch (err) {
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };
    fetchStokDetail();
  }, [id, navigate]);
  
  const DetailItem = ({ label, value }) => (
    <div>
      <p className="text-sm font-medium text-gray-500">{label}</p>
      <p className="mt-1 text-gray-900 break-words">{value || '-'}</p>
    </div>
  );

  if (isLoading) return <div className="p-6 text-center text-gray-500">Loading...</div>;
  if (error) return <div className="p-6 text-center text-red-500">{error}</div>;
  if (!stok) return <div className="p-6 text-center text-gray-500">Data stok tidak ditemukan.</div>;

  return (
    <div className="flex min-h-screen bg-gray-100">
      <SidebarPbf isCollapsed={isCollapsed} setIsCollapsed={setIsCollapsed} />
      <div className={`flex-1 flex flex-col transition-all duration-300 ${isCollapsed ? 'ml-16' : 'ml-64'}`}>
        <NavbarPbf onLogout={() => { localStorage.clear(); navigate('/'); }} />
        <main className="flex-1 pt-16 p-6">
          <div className="max-w-4xl mx-auto">
            <div className="flex justify-between items-center mb-6">
              <h1 className="text-3xl font-bold text-gray-800">Detail Stok: {stok.batch_id}</h1>
              <button
                onClick={() => navigate('/pbf/monitoring-stok')}
                className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition"
              >
                Kembali
              </button>
            </div>
            
            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <DetailItem label="Batch ID" value={stok.batch_id} />
                <DetailItem label="Nama Obat" value={stok.nama_obat} />
                <DetailItem label="Manufaktur" value={stok.nama_produsen} />
                <DetailItem label="Nomor Izin Edar" value={stok.nomor_izin_edar} />
                <DetailItem label="Dosis" value={stok.dosis} />
                <DetailItem label="Bentuk Sediaan" value={stok.bentuk_sediaan} />
                <DetailItem label="Stok Saat Ini" value={`${stok.stok.toLocaleString('id-ID')} box`} />
                <DetailItem label="Harga Satuan (Pembelian)" value={`Rp ${stok.harga_per_unit.toLocaleString('id-ID')}`} />
                <DetailItem
                  label="Tanggal Produksi"
                  value={new Date(stok.tanggal_produksi).toLocaleDateString('id-ID', { timeZone: 'UTC' })}
                />
                <DetailItem
                  label="Tanggal Kadaluarsa"
                  value={new Date(stok.tanggal_kadaluarsa).toLocaleDateString('id-ID', { timeZone: 'UTC' })}
                />
                 <div className="col-span-full">
                  <DetailItem label="Komposisi" value={stok.komposisi_obat} />
                </div>
                <div className="col-span-full">
                  <DetailItem label="Hash Sertifikat Analisis" value={stok.hash_sertifikat_analisis} />
                </div>
                 <div className="col-span-full">
                  <p className="text-sm font-medium text-gray-500">Dokumen BPOM (dari Produsen)</p>
                  {stok.dokumen_bpom_path ? (
                    <a
                      href={`http://localhost:5000/${stok.dokumen_bpom_path.replace(/\\/g, '/').toLowerCase()}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-emerald-600 hover:underline"
                    >
                      Lihat Dokumen
                    </a>
                  ) : ('-')}
                </div>
                <div className="col-span-full">
                  <p className="text-sm font-medium text-gray-500">Sertifikat Analisis (dari Produsen)</p>
                  {stok.sertifikat_analisis_path ? (
                    <a
                      href={`http://localhost:5000/${stok.sertifikat_analisis_path.replace(/\\/g, '/').toLowerCase()}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-emerald-600 hover:underline"
                    >
                      Lihat Dokumen
                    </a>
                  ) : ('-')}
                </div>
              </div>

              {/* --- PERBAIKAN: Menggunakan variabel 'stok' yang benar --- */}
              <div className="mt-6 border-t pt-6">
                  <div className="p-4 text-center bg-green-100 text-green-800 rounded-lg">
                    Batch ini sudah tercatat secara permanen di blockchain.
                  </div>
                  {qrCode && (
                    <div className="mt-6 text-center p-4 border rounded-lg">
                      <h3 className="font-semibold text-lg mb-2">QR Code</h3>
                      <img src={qrCode} alt="QR Code" className="mx-auto max-w-[200px]" />
                      <p className="text-sm text-gray-500 mt-2">Pindai untuk verifikasi. Berisi: {stok.batch_id}</p>
                    </div>
                  )}
              </div>
              {/* --- Akhir dari perbaikan --- */}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default DetailStokPbf;

