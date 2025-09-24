import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import SidebarProdusen from '../../../components/SidebarProdusen';
import NavbarProdusen from '../../../components/NavbarProdusen';
import qrcode from 'qrcode';
import { Loader2 } from 'lucide-react';

const DetailProduksi = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [produksi, setProduksi] = useState(null);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isRecording, setIsRecording] = useState(false);
  const [qrCode, setQrCode] = useState(''); // Akan diatur dari qr_code_url atau API
  const [isCollapsed, setIsCollapsed] = useState(false);

  useEffect(() => {
    const fetchProduksi = async () => {
      setIsLoading(true);
      const token = localStorage.getItem('token');
      if (!token) {
        alert('Anda harus login untuk mengakses halaman ini.');
        navigate('/login/produsen');
        return;
      }
      try {
        const response = await fetch(`http://localhost:5000/api/produksi/${id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!response.ok) throw new Error('Gagal mengambil data');
        const result = await response.json();
        const data = {
          ...result.data,
          bentuk_sediaan: result.data.bentuk_sediaan || '',
          penanggung_jawab: result.data.penanggung_jawab || '',
        };
        setProduksi(data);
        // Muat qr_code_url jika sudah ada
        if (data.status === 'Tercatat di Blockchain' && data.qr_code_url) {
          setQrCode(data.qr_code_url);
        }
      } catch (err) {
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };
    fetchProduksi();
  }, [id, navigate]);

  const handleRecordToBlockchain = async () => {
    if (!window.confirm(`Anda yakin ingin mencatat Batch ID: ${produksi.batch_id} ke blockchain? Proses ini tidak bisa dibatalkan.`)) return;
    setIsRecording(true);
    setError('');

    try {
      const token = localStorage.getItem('token');
      if (!token) throw new Error('Token autentikasi tidak ditemukan. Silakan login kembali.');
      const response = await fetch(`http://localhost:5000/api/produksi/${id}/record`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.message || 'Gagal mencatat ke blockchain');

      alert(result.message);
      setProduksi({ ...produksi, status: 'Tercatat di Blockchain' });

      if (result.qrCodeDataUrl) {
        setQrCode(result.qrCodeDataUrl);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setIsRecording(false);
    }
  };

  const fetchQrData = async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      setError('Token autentikasi tidak ditemukan. Silakan login kembali.');
      return;
    }
    try {
      const response = await fetch(`http://localhost:5000/api/produksi/qr-data/${produksi.batch_id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) throw new Error('Gagal memuat data QR');
      window.open(`http://localhost:5000/api/produksi/qr-data/${produksi.batch_id}`, '_blank');
    } catch (err) {
      setError(err.message);
    }
  };

  if (isLoading) return <div className="p-6 text-center text-gray-500">Loading...</div>;
  if (error) return <div className="p-6 text-center text-red-500">{error}</div>;
  if (!produksi) return <div className="p-6 text-center text-gray-500">Data tidak ditemukan.</div>;

  const DetailItem = ({ label, value }) => (
    <div>
      <p className="text-sm font-medium text-gray-500">{label}</p>
      <p className="mt-1 text-gray-900 break-words">{value || '-'}</p>
    </div>
  );

  return (
    <div className="flex min-h-screen bg-gray-100">
      <SidebarProdusen isCollapsed={isCollapsed} setIsCollapsed={setIsCollapsed} />
      <div className={`flex-1 flex flex-col transition-all duration-300 ${isCollapsed ? 'ml-16' : 'ml-64'}`}>
        <NavbarProdusen onLogout={() => { localStorage.clear(); navigate('/'); }} />
        <main className="flex-1 pt-16 p-6">
          <div className="max-w-4xl mx-auto">
            <div className="flex justify-between items-center mb-6">
              <h1 className="text-3xl font-bold text-gray-800">Detail Produksi: {produksi.batch_id}</h1>
              <button
                onClick={() => navigate('/produsen/manajemen-produksi')}
                className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition"
              >
                Kembali
              </button>
            </div>
            {error && (
              <div className="mb-4 p-4 bg-red-100 text-red-700 rounded-lg flex items-center gap-2">
                <span>{error}</span>
              </div>
            )}
            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <DetailItem label="Batch ID" value={produksi.batch_id} />
                <DetailItem label="Nama Obat" value={produksi.nama_obat} />
                <DetailItem label="Nomor Izin Edar" value={produksi.nomor_izin_edar} />
                <DetailItem label="Dosis" value={produksi.dosis} />
                <DetailItem label="Bentuk Sediaan" value={produksi.bentuk_sediaan} />
                <DetailItem label="Jumlah" value={`${produksi.jumlah} pcs`} />
                <DetailItem label="Penanggung Jawab" value={produksi.penanggung_jawab} />
                <DetailItem label="Status" value={produksi.status} />
                 <DetailItem
                  label="Tanggal Produksi"
                  value={
                    new Date(produksi.tanggal_produksi).toLocaleDateString('id-ID', {
                      day: 'numeric',
                      month: 'numeric',
                      year: 'numeric',
                      timeZone: 'UTC', // Kunci perbaikannya ada di sini
                    })
                  }
                />
                <DetailItem
                  label="Tanggal Kadaluarsa"
                  value={
                    new Date(produksi.tanggal_kadaluarsa).toLocaleDateString('id-ID', {
                      day: 'numeric',
                      month: 'numeric',
                      year: 'numeric',
                      timeZone: 'UTC', // Kunci perbaikannya ada di sini
                    })
                  }
                />
                <DetailItem label="Prioritas" value={produksi.prioritas} />
                <div className="col-span-full">
                  <DetailItem label="Komposisi" value={produksi.komposisi_obat} />
                </div>
                <div className="col-span-full">
                  <DetailItem label="Hash Sertifikat" value={produksi.hash_sertifikat_analisis} />
                </div>
                <div className="col-span-full">
                  <p className="text-sm font-medium text-gray-500">Dokumen BPOM</p>
                  {produksi.dokumen_bpom_path ? (
                    <a
                      href={`http://localhost:5000/${produksi.dokumen_bpom_path.replace(/\\/g, '/')}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-emerald-600 hover:underline"
                    >
                      Lihat Dokumen
                    </a>
                  ) : (
                    '-'
                  )}
                </div>
                <div className="col-span-full">
                  <p className="text-sm font-medium text-gray-500">Sertifikat Analisis</p>
                  {produksi.sertifikat_analisis_path ? (
                    <a
                      href={`http://localhost:5000/${produksi.sertifikat_analisis_path.replace(/\\/g, '/')}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-emerald-600 hover:underline"
                    >
                      Lihat Dokumen
                    </a>
                  ) : (
                    '-'
                  )}
                </div>
              </div>
              <div className="mt-6 border-t pt-6">
                {produksi.status === 'Selesai' && (
                  <button
                    onClick={handleRecordToBlockchain}
                    disabled={isRecording}
                    className="w-full bg-emerald-600 text-white py-3 rounded-lg hover:bg-emerald-700 disabled:bg-gray-400 transition flex items-center justify-center gap-2 font-semibold"
                  >
                    {isRecording && <Loader2 className="animate-spin" size={18} />}
                    {isRecording ? 'Mencatat...' : 'Hasilkan QR Code'}
                  </button>
                )}
                {produksi.status === 'Tercatat di Blockchain' && (
                  <>
                    <div className="p-4 text-center bg-green-100 text-green-800 rounded-lg">
                      Batch ini sudah tercatat secara permanen di blockchain.
                    </div>
                    {qrCode && (
                      <div className="mt-6 text-center p-4 border rounded-lg">
                        <h3 className="font-semibold text-lg mb-2">QR Code</h3>
                        <img src={qrCode} alt="QR Code" className="mx-auto max-w-[200px]" />
                        <p className="text-sm text-gray-500 mt-2">Pindai untuk verifikasi. Berisi: {produksi.batch_id}</p>
                        
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default DetailProduksi;