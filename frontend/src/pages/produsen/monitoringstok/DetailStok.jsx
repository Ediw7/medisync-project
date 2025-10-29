import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import SidebarProdusen from '../../../components/SidebarProdusen';
import NavbarProdusen from '../../../components/NavbarProdusen';
import qrcode from 'qrcode';
import {
  Loader2,
  ArrowLeft,
  Package,
  Calendar,
  Shield,
  FileText,
  QrCode,
  CheckCircle2,
  Clock,
  AlertCircle,
  Copy,
  ExternalLink,
  Download,
} from 'lucide-react';

const DetailStok = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [produksi, setProduksi] = useState(null);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [qrCode, setQrCode] = useState('');
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [copiedHash, setCopiedHash] = useState(false);

  useEffect(() => {
    const fetchProduksi = async () => {
      setIsLoading(true);
      setError('');
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
        if (!result.success) throw new Error(result.message || 'Data tidak ditemukan');
        const data = {
          ...result.data,
          bentuk_sediaan: result.data.bentuk_sediaan || '',
          penanggung_jawab: result.data.penanggung_jawab || '',
        };
        setProduksi(data);

        if (data.status === 'Tercatat di Blockchain') {
          if (data.qr_code_url) {
            setQrCode(data.qr_code_url);
          } else {
            const qrUrl = await qrcode.toDataURL(
              `http://localhost:5173/verifikasi/${data.batch_id}`
            );
            setQrCode(qrUrl);
          }
        }
      } catch (err) {
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };
    fetchProduksi();
  }, [id, navigate]);

  const getStatusConfig = (status) => {
    const configs = {
      'Terjadwal': { icon: Clock, color: 'bg-teal-100 text-teal-800 border-teal-200', label: 'Terjadwal' },
      'Dalam Produksi': { icon: AlertCircle, color: 'bg-blue-100 text-blue-800 border-blue-200', label: 'Dalam Produksi' },
      'Selesai': { icon: CheckCircle2, color: 'bg-green-100 text-green-800 border-green-200', label: 'Selesai' },
      'Tercatat di Blockchain': { 
        icon: Shield, 
        color: 'bg-emerald-100 text-emerald-800 border-emerald-200', 
        label: 'Tercatat di Blockchain' 
      }
    };
    return configs[status] || { icon: AlertCircle, color: 'bg-gray-100 text-gray-800 border-gray-200', label: status || 'Tidak Diketahui' };
  };

  const handleCopyHash = async (hash) => {
    if (hash) {
      await navigator.clipboard.writeText(hash);
      setCopiedHash(true);
      setTimeout(() => setCopiedHash(false), 2000);
    }
  };

  const formatDateLocal = (dateString) => {
    if (!dateString) return '-';
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return '-';
      return date.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
    } catch (e) {
      return '-';
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
        <div className="flex flex-col items-center space-y-4">
          <Loader2 className="h-12 w-12 animate-spin text-emerald-600" />
          <p className="text-gray-500">Memuat detail stok...</p>
        </div>
      </div>
    );
  }

  if (error && !produksi) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center p-6">
        <div className="bg-red-50 border border-red-200 rounded-xl p-8 max-w-md text-center shadow-lg">
          <AlertCircle className="mx-auto h-12 w-12 text-red-500 mb-4" />
          <h2 className="text-xl font-bold text-red-800 mb-2">Terjadi Kesalahan</h2>
          <p className="text-red-600 mb-6">{error}</p>
          <button
            onClick={() => navigate('/produsen/monitoring-stok')}
            className="text-sm text-gray-600 hover:underline"
          >
            Kembali ke Monitoring Stok
          </button>
        </div>
      </div>
    );
  }

  if (!produksi) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center p-6">
        <div className="bg-white rounded-xl p-8 max-w-md text-center shadow-lg">
          <Package className="mx-auto h-12 w-12 text-gray-400 mb-4" />
          <h2 className="text-xl font-bold text-gray-800 mb-2">Data Stok Tidak Ditemukan</h2>
          <p className="text-gray-500 mb-6">Tidak ada data untuk ID produksi ini.</p>
          <button
            onClick={() => navigate('/produsen/monitoring-stok')}
            className="text-sm text-gray-600 hover:underline"
          >
            Kembali ke Monitoring Stok
          </button>
        </div>
      </div>
    );
  }

  const statusConfig = getStatusConfig(produksi.status);
  const StatusIcon = statusConfig.icon;

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <SidebarProdusen isCollapsed={isCollapsed} setIsCollapsed={setIsCollapsed} />
      <div className={`flex-1 flex flex-col transition-all duration-300 ${isCollapsed ? 'ml-16' : 'ml-64'}`}>
        <NavbarProdusen
          onLogout={() => {
            localStorage.clear();
            navigate('/');
          }}
          username={localStorage.getItem('username')}
        />
        <main className="flex-1 overflow-auto pt-[72px] px-6 pl-14 py-8">
          <div className="max-w-6xl mx-auto">
     
            <div className="mb-8">
              <button
                onClick={() => navigate('/produsen/monitoring-stok')}
                className="mb-6 inline-flex items-center text-emerald-600 hover:text-emerald-700 transition-colors text-sm font-medium"
              >
                <ArrowLeft size={16} className="mr-1" />
                Kembali ke Monitoring Stok
              </button>
              <div className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
                <div className="bg-gradient-to-r from-emerald-50 to-green-50 px-8 py-6 border-b border-gray-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <h1 className="text-3xl font-bold text-gray-900 mb-1">Detail Stok Obat</h1>
                      <p className="text-gray-600">
                        Batch ID: <span className="font-mono font-semibold text-emerald-700">{produksi.batch_id}</span>
                      </p>
                    </div>
                    <div className={`px-4 py-2 rounded-full border ${statusConfig.color} flex items-center space-x-2`}>
                      <StatusIcon size={16} />
                      <span className="font-medium text-sm">{statusConfig.label}</span>
                    </div>
                  </div>
                </div>

                {error && (
                  <div className="p-4 bg-red-50 border border-red-200 text-red-700 rounded-xl flex items-center gap-3 mx-8 mt-4">
                    <AlertCircle size={20} />
                    <span>{error}</span>
                  </div>
                )}

            
                <div className="p-8">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
       
                    <div className="space-y-6">
                      <InfoCard title="Informasi Obat" icon={Package}>
                        <InfoItem label="Nama Obat" value={produksi.nama_obat} />
                        <InfoItem label="Nomor Izin Edar" value={produksi.nomor_izin_edar} />
                        <InfoItem label="Dosis" value={produksi.dosis} />
                        <InfoItem label="Bentuk Sediaan" value={produksi.bentuk_sediaan} />
                        <InfoItem label="Jumlah Tersedia" value={`${produksi.jumlah.toLocaleString()} pcs`} />
                      </InfoCard>

                      <InfoCard title="Detail Produksi" icon={FileText}>
                        <InfoItem label="Penanggung Jawab" value={produksi.penanggung_jawab} />
                        <InfoItem label="Prioritas" value={produksi.prioritas} />
                        <InfoItem label="Tanggal Produksi" value={formatDateLocal(produksi.tanggal_produksi)} />
                        <InfoItem label="Tanggal Kadaluarsa" value={formatDateLocal(produksi.tanggal_kadaluarsa)} />
                        <InfoItem label="Komposisi Obat" value={produksi.komposisi_obat} isFull />
                      </InfoCard>
                    </div>

                    <div className="space-y-6">
                      <InfoCard title="Dokumen & Validasi" icon={Download}>
                        <DocumentItem label="Dokumen BPOM" path={produksi.dokumen_bpom_path} />
                        <DocumentItem label="Sertifikat Analisis" path={produksi.sertifikat_analisis_path} />
                        <HashItem
                          label="Hash Sertifikat Analisis"
                          hash={produksi.hash_sertifikat_analisis}
                          onCopy={handleCopyHash}
                          copied={copiedHash}
                        />
                      </InfoCard>

                      

                      {qrCode && (
                      <InfoCard title="QR Code Verifikasi" icon={QrCode} bgColor="bg-blue-50" borderColor="border-blue-200">
                        <div className="col-span-full text-center">
                          <div className="bg-white p-4 rounded-xl border border-gray-200 mb-4 shadow-sm inline-block">
                            <img src={qrCode} alt="QR Code" className="w-full max-w-[200px] mx-auto rounded-lg block" />
                          </div>
                          <p className="text-sm text-gray-600 mb-4 max-w-md mx-auto">Pindai kode QR untuk verifikasi detail produk.</p>
                          <button
                            onClick={() => {
                              const link = document.createElement('a');
                              link.href = qrCode;
                              link.download = `${produksi.batch_id}_qr.png`;
                              link.click();
                            }}
                            className="text-xs text-blue-600 hover:text-blue-800 font-medium inline-block"
                          >
                            Download QR Code
                          </button>
                        </div>
                      </InfoCard>
                    )}

                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};


const InfoCard = ({ title, icon: Icon, children, bgColor = 'bg-white', borderColor = 'border-gray-200' }) => (
  <div className={`rounded-xl ${bgColor} border ${borderColor} overflow-hidden shadow-sm hover:shadow-md hover:border-gray-300 transition-all duration-200`}>
    <div className="px-6 py-4 border-b border-gray-200 bg-white/50 flex items-center gap-3">
      {Icon && <Icon className="h-5 w-5 text-gray-500" />}
      <h3 className="text-lg font-semibold text-gray-800">{title}</h3>
    </div>
    <div className="p-6 grid grid-cols-1 sm:grid-cols-2 gap-6">
      {children}
    </div>
  </div>
);

const InfoItem = ({ label, value, isFull = false }) => (
  <div className={`col-span-1 ${isFull ? 'col-span-full' : ''}`}>
    <p className="text-sm font-medium text-gray-500 mb-1">{label}</p>
    <p className="text-gray-900 font-semibold break-words">{value || '-'}</p>
  </div>
);

const HashItem = ({ label, hash, onCopy, copied }) => (
  <div className="col-span-full relative">
    <p className="text-sm font-medium text-gray-500 mb-1">{label}</p>
    <div className="p-3 bg-gray-50 rounded-lg border border-gray-200 pr-10">
      <code className="text-xs text-gray-700 break-all font-mono">{hash || '-'}</code>
    </div>
    {hash && (
      <button
        onClick={() => onCopy(hash)}
        className="absolute top-2 right-2 p-1.5 text-gray-400 hover:text-gray-600 transition-colors rounded-md hover:bg-gray-200"
        title="Salin hash"
        aria-label="Salin hash"
      >
        <Copy size={14} />
      </button>
    )}
    {copied && hash && (
      <div className="absolute top-12 right-2 bg-green-100 text-green-800 px-2 py-0.5 rounded text-xs shadow z-10 animate-pulse">
        Disalin!
      </div>
    )}
  </div>
);

const DocumentItem = ({ label, path }) => (
  <div className="col-span-1">
    <p className="text-sm font-medium text-gray-500 mb-2">{label}</p>
    {path ? (
      <a
        href={`http://localhost:5000/${path.replace(/\\/g, '/')}`}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-50 text-emerald-700 rounded-lg hover:bg-emerald-100 transition-colors border border-emerald-200 text-sm font-medium"
      >
        <ExternalLink size={14} />
        Lihat Dokumen
      </a>
    ) : (
      <div className="px-4 py-2 bg-gray-50 text-gray-500 rounded-lg border border-gray-200 inline-block text-sm">
        Tidak ada dokumen
      </div>
    )}
  </div>
);

export default DetailStok;