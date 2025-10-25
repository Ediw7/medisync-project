import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import SidebarProdusen from '../../../components/SidebarProdusen';
import NavbarProdusen from '../../../components/NavbarProdusen';
import { 
  ArrowLeft, 
  Package, 
  Calendar, 
  Shield, 
  FileText, 
  QrCode,
  CheckCircle2,
  Clock,
  AlertCircle,
  Download,
  ExternalLink
} from 'lucide-react';

const DetailProduksi = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [produksi, setProduksi] = useState(null);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isRecording, setIsRecording] = useState(false);
  const [qrCode, setQrCode] = useState('');
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

  const getStatusConfig = (status) => {
    const configs = {
      'Terjadwal': {
        icon: <Clock size={20} />,
        bgColor: 'bg-teal-50',
        textColor: 'text-teal-700',
        borderColor: 'border-teal-200',
        label: 'Terjadwal'
      },
      'Dalam Produksi': {
        icon: <AlertCircle size={20} />,
        bgColor: 'bg-green-50',
        textColor: 'text-green-700',
        borderColor: 'border-green-200',
        label: 'Dalam Produksi'
      },
      'Selesai': {
        icon: <CheckCircle2 size={20} />,
        bgColor: 'bg-emerald-50',
        textColor: 'text-emerald-700',
        borderColor: 'border-emerald-200',
        label: 'Selesai'
      },
      'Tercatat di Blockchain': {
        icon: <Shield size={20} />,
        bgColor: 'bg-emerald-50',
        textColor: 'text-emerald-700',
        borderColor: 'border-emerald-200',
        label: 'Tercatat di Blockchain'
      }
    };
    return configs[status] || configs['Terjadwal'];
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="inline-block w-12 h-12 border-4 border-emerald-200 border-t-emerald-600 rounded-full animate-spin"></div>
          <p className="mt-4 text-gray-500">Memuat data...</p>
        </div>
      </div>
    );
  }

  if (!produksi) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Package size={64} className="mx-auto text-gray-300 mb-4" />
          <p className="text-gray-500">Data tidak ditemukan</p>
        </div>
      </div>
    );
  }

  const statusConfig = getStatusConfig(produksi.status);

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <SidebarProdusen isCollapsed={isCollapsed} setIsCollapsed={setIsCollapsed} />
      
      <div className={`flex-1 flex flex-col transition-all duration-300 ${isCollapsed ? 'ml-20' : 'ml-72'}`}>
        <NavbarProdusen onLogout={() => { localStorage.clear(); navigate('/'); }} />
        
        <main className="flex-1 p-8 pt-24">
          {/* Header */}
          <div className="mb-8">
            <button
              onClick={() => navigate('/produsen/manajemen-produksi')}
              className="mb-4 flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
            >
              <ArrowLeft size={20} />
              <span className="font-medium">Kembali ke Manajemen Produksi</span>
            </button>
            
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <h1 className="text-3xl font-bold text-gray-900">{produksi.nama_obat}</h1>
                  <span className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold border ${statusConfig.bgColor} ${statusConfig.textColor} ${statusConfig.borderColor}`}>
                    {statusConfig.icon}
                    {statusConfig.label}
                  </span>
                </div>
                <p className="text-gray-500 flex items-center gap-2">
                  <Package size={16} />
                  Batch ID: <span className="font-semibold text-gray-700">{produksi.batch_id}</span>
                </p>
              </div>
            </div>
          </div>

          {/* Error Alert */}
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 rounded-xl flex items-center gap-3">
              <AlertCircle size={20} />
              <span>{error}</span>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Main Info - Left Side */}
            <div className="lg:col-span-2 space-y-6">
              {/* Informasi Produk */}
              <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-emerald-50 to-emerald-100">
                  <h2 className="text-lg font-semibold text-emerald-900 flex items-center gap-2">
                    {/* <Package size={20} className="text-emerald-600" /> */}
                    Informasi Produk
                  </h2>
                </div>
                <div className="p-6 grid grid-cols-2 gap-6">
                  <InfoItem label="Nama Obat" value={produksi.nama_obat} />
                  <InfoItem label="Batch ID" value={produksi.batch_id} />
                  <InfoItem label="Nomor Izin Edar" value={produksi.nomor_izin_edar} />
                  <InfoItem label="Dosis" value={produksi.dosis} />
                  <InfoItem label="Bentuk Sediaan" value={produksi.bentuk_sediaan} />
                  <InfoItem label="Jumlah Produksi" value={`${produksi.jumlah.toLocaleString()} pcs`} />
                  <InfoItem label="Penanggung Jawab" value={produksi.penanggung_jawab} />
                  <InfoItem label="Prioritas" value={produksi.prioritas} />
                  <div className="col-span-2">
                    <InfoItem label="Komposisi Obat" value={produksi.komposisi_obat} />
                  </div>
                </div>
              </div>

              {/* Informasi Waktu */}
              <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-emerald-50 to-emerald-100">
                  <h2 className="text-lg font-semibold text-emerald-900 flex items-center gap-2">
                    {/* <Calendar size={20} className="text-emerald-600" /> */}
                    Informasi Waktu
                  </h2>
                </div>
                <div className="p-6 grid grid-cols-2 gap-6">
                  <InfoItem 
                    label="Tanggal Produksi" 
                    value={new Date(produksi.tanggal_produksi).toLocaleDateString('id-ID', {
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric',
                      timeZone: 'UTC',
                    })} 
                  />
                  <InfoItem 
                    label="Tanggal Kadaluarsa" 
                    value={new Date(produksi.tanggal_kadaluarsa).toLocaleDateString('id-ID', {
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric',
                      timeZone: 'UTC',
                    })} 
                  />
                </div>
              </div>

              {/* Dokumen & Sertifikasi */}
              <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-emerald-50 to-emerald-100">
                  <h2 className="text-lg font-semibold text-emerald-900 flex items-center gap-2">
                    {/* <FileText size={20} className="text-emerald-600" /> */}
                    Dokumen & Sertifikasi
                  </h2>
                </div>
                <div className="p-6 space-y-4">
                  <DocumentItem 
                    label="Dokumen BPOM" 
                    path={produksi.dokumen_bpom_path}
                  />
                  <DocumentItem 
                    label="Sertifikat Analisis" 
                    path={produksi.sertifikat_analisis_path}
                  />
                  <div>
                    <p className="text-sm font-medium text-gray-500 mb-2">Hash Sertifikat Analisis</p>
                    <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                      <code className="text-xs text-gray-700 break-all font-mono">
                        {produksi.hash_sertifikat_analisis || '-'}
                      </code>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* QR Code & Actions - Right Side */}
            <div className="space-y-6">
              {/* Action Card */}
              {produksi.status === 'Selesai' && (
                <div className="bg-gray-50 rounded-2xl shadow-sm border border-emerald-200 overflow-hidden">
                  <div className="p-6">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="p-3 bg-emerald-600 rounded-xl">
                        <Shield size={24} className="text-white" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900">Catat ke Blockchain</h3>
                        <p className="text-sm text-gray-600">Amankan data produksi</p>
                      </div>
                    </div>
                    <p className="text-sm text-gray-600 mb-4">
                      Proses ini akan mencatat data produksi secara permanen ke blockchain dan menghasilkan QR Code untuk verifikasi.
                    </p>
                    <button
                      onClick={handleRecordToBlockchain}
                      disabled={isRecording}
                      className="w-full bg-gradient-to-r from-emerald-600 to-emerald-700 text-white py-3 rounded-xl hover:from-emerald-700 hover:to-emerald-800 disabled:from-gray-400 disabled:to-gray-400 transition-all flex items-center justify-center gap-2 font-semibold shadow-lg shadow-emerald-500/30"
                    >
                      {isRecording ? (
                        <>
                          <div className="w-5 h-5 border-3 border-white border-t-transparent rounded-full animate-spin"></div>
                          Memproses...
                        </>
                      ) : (
                        <>
                          <QrCode size={20} />
                          Hasilkan QR Code
                        </>
                      )}
                    </button>
                  </div>
                </div>
              )}

              {/* QR Code Display */}
              {produksi.status === 'Tercatat di Blockchain' && (
                <>
                  <div className="bg-gray-50 rounded-2xl shadow-sm border border-emerald-200 p-6">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="p-3 bg-gradient-to-br from-emerald-600/90 to-[#047857] rounded-xl">
                        <Shield size={24} className="text-white" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900">Tercatat di Blockchain</h3>
                        <p className="text-sm text-emerald-700">Data telah diamankan</p>
                      </div>
                    </div>
                    <div className="p-4 bg-white rounded-xl border-2 border-dashed border-green-300">
                      <p className="text-sm text-gray-600 text-center">
                        Batch ini telah tercatat secara permanen dan tidak dapat diubah
                      </p>
                    </div>
                  </div>

                  {qrCode && (
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
                      <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
                        <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                          <QrCode size={20} className="text-emerald-600" />
                          QR Code Verifikasi
                        </h3>
                      </div>
                      <div className="p-6">
                        <div className="bg-gray-50 p-6 rounded-xl border border-gray-200 mb-4">
                          <img 
                            src={qrCode} 
                            alt="QR Code" 
                            className="w-full max-w-[240px] mx-auto"
                          />
                        </div>
                        <div className="space-y-2">
                          <p className="text-sm text-gray-600 text-center">
                            Pindai QR Code untuk verifikasi
                          </p>
                          <div className="p-3 bg-emerald-50 rounded-lg border border-emerald-200">
                            <p className="text-xs text-emerald-700 text-center font-medium">
                              Batch ID: {produksi.batch_id}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </>
              )}

              {/* Info Card */}
              <div className="bg-red-50 rounded-2xl shadow-sm border border-red-200 p-6">
                <h3 className="font-semibold text-red-900 mb-3">Informasi</h3>
                <ul className="space-y-2 text-sm text-red-800">
                  <li className="flex items-start gap-2">
                    <span className="mt-1">•</span>
                    <span>Data yang tercatat di blockchain tidak dapat diubah atau dihapus</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="mt-1">•</span>
                    <span>QR Code dapat digunakan untuk verifikasi keaslian produk</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="mt-1">•</span>
                    <span>Simpan QR Code dengan aman untuk referensi di masa depan</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

const InfoItem = ({ label, value }) => (
  <div>
    <p className="text-sm font-medium text-gray-500 mb-1">{label}</p>
    <p className="text-gray-900 font-medium">{value || '-'}</p>
  </div>
);

const DocumentItem = ({ label, path }) => (
  <div>
    <p className="text-sm font-medium text-gray-500 mb-2">{label}</p>
    {path ? (
      <a
        href={`http://localhost:5000/${path.replace(/\\/g, '/')}`}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-50 text-emerald-700 rounded-lg hover:bg-emerald-100 transition-colors border border-emerald-200"
      >
        <ExternalLink size={16} />
        <span className="font-medium">Lihat Dokumen</span>
      </a>
    ) : (
      <div className="px-4 py-2 bg-gray-50 text-gray-500 rounded-lg border border-gray-200 inline-block">
        Tidak ada dokumen
      </div>
    )}
  </div>
);

export default DetailProduksi;