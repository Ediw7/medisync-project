import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import SidebarPbf from '../../../components/SidebarPbf';
import NavbarPbf from '../../../components/NavbarPbf';
import {
  Loader2,
  ArrowLeft,
  ClipboardCopy,
  Package,
  Truck,
  CheckCircle2,
  AlertTriangle,
  FileText,
  Info,
  Clock,
  X,
  ImageIcon,
  Home, // Mengganti CheckCircle2 untuk "Diterima Apotek"
} from 'lucide-react';
import axios from 'axios';
import { toast } from 'react-hot-toast';

const BuktiPenerimaanModal = ({ isOpen, onClose, imageUrl }) => {
  if (!isOpen) return null;
  const fullImageUrl = imageUrl
    ? imageUrl.startsWith('http')
      ? imageUrl
      : `http://localhost:5000/${imageUrl.replace(/\\/g, '/').toLowerCase()}`
    : null;
  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="bg-white p-4 rounded-lg shadow-2xl relative w-full max-w-lg overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center pb-3 mb-4 border-b border-slate-200">
          <h3 className="text-lg font-semibold text-slate-800">Bukti Penerimaan Apotek</h3>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 transition-colors p-1 rounded-full"
          >
            <X size={20} />
          </button>
        </div>
        {fullImageUrl ? (
          <div className="bg-slate-100 p-2 rounded">
            <img
              src={fullImageUrl}
              alt="Bukti Penerimaan Barang"
              className="w-full h-auto max-h-[70vh] object-contain rounded"
            />
          </div>
        ) : (
          <div className="text-center py-10 text-slate-500">
            <ImageIcon size={48} className="mx-auto mb-2 opacity-50" />
            Gambar tidak tersedia.
          </div>
        )}
      </div>
    </div>
  );
};

const StatusStep = ({ icon: Icon, label, timestamp, isCompleted, isCurrent, children }) => (
  <div className="relative flex flex-col items-center justify-start text-center w-40">
    <div
      className={`w-14 h-14 rounded-full flex items-center justify-center border-2 ${
        isCurrent
          ? 'bg-emerald-100 border-emerald-500 animate-pulse'
          : isCompleted
            ? 'bg-emerald-500 border-emerald-600 text-white'
            : 'bg-slate-100 border-slate-300 text-slate-400'
      } transition-colors duration-300 z-10`}
    >
      <Icon size={26} />
    </div>
    <div className="mt-3">
      <p
        className={`font-semibold text-sm ${
          isCurrent ? 'text-emerald-700' : isCompleted ? 'text-slate-800' : 'text-slate-500'
        }`}
      >
        {label}
      </p>
      {timestamp && <p className="text-xs text-slate-500 mt-1">{timestamp}</p>}

      {children && <div className="mt-1">{children}</div>}
    </div>
  </div>
);

const LihatRiwayatPbf = () => {
  const navigate = useNavigate();
  const { assetId } = useParams();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [riwayatData, setRiwayatData] = useState(null);
  const [copiedResi, setCopiedResi] = useState(false);
  const username = localStorage.getItem('username');

  useEffect(() => {
    const fetchData = async () => {
      if (!assetId) {
        setError('ID Aset tidak ditemukan di URL.');
        setIsLoading(false);
        return;
      }
      setIsLoading(true);
      setError(null);
      let token;
      try {
        token = localStorage.getItem('token');
        if (!token) throw new Error('Silakan login terlebih dahulu');

        const response = await axios.get(
          `http://localhost:5000/api/pbf/riwayat-distribusi/${assetId}`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );

        if (!response.data.success || !response.data.data) {
          throw new Error(
            response.data.message || 'Gagal mengambil data riwayat atau format salah'
          );
        }
        setRiwayatData(response.data.data);
      } catch (err) {
        const errorMsg =
          err.response?.data?.message || err.message || 'Terjadi kesalahan saat memuat data.';
        setError(errorMsg);
        toast.error(errorMsg);
        if (
          (err.message.includes('401') ||
            err.message.includes('403') ||
            err.message.includes('login')) &&
          token
        ) {
          navigate('/login/pbf');
        } else if (!token) {
          navigate('/login/pbf');
        }
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, [assetId, navigate]);

  const handleLogout = () => {
    localStorage.clear();
    navigate('/');
  };

  const copyToClipboard = async (text, type) => {
    try {
      await navigator.clipboard.writeText(text);
      if (type === 'resi') {
        setCopiedResi(true);
        toast.success('Nomor Resi disalin!');
        setTimeout(() => setCopiedResi(false), 2000);
      } else {
        toast.success('Teks disalin!');
      }
    } catch (err) {
      toast.error('Gagal menyalin teks.');
      console.error('Failed to copy text: ', err);
    }
  };

  const formatDate = (dateString, includeTime = false) => {
    if (!dateString) return '-';
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return '-';

      const options = { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' };
      if (includeTime) {
        options.hour = '2-digit';
        options.minute = '2-digit';
        options.timeZone = 'Asia/Jakarta';
      }
      return date.toLocaleDateString('id-ID', options);
    } catch (e) {
      console.error('Error formatting date:', e);
      return '-';
    }
  };

  const formatTimestamp = (isoString) => {
    if (!isoString) return '-';
    try {
      const date = new Date(isoString);
      if (isNaN(date.getTime())) return '-';

      return date.toLocaleString('id-ID', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        timeZone: 'Asia/Jakarta',
      });
    } catch (e) {
      console.error('Error formatting timestamp:', e);
      return '-';
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col justify-center items-center h-screen bg-gradient-to-br from-slate-50 via-white to-emerald-50">
        <div className="relative">
          <Loader2 className="animate-spin h-12 w-12 text-emerald-600" />
          <div className="absolute inset-0 h-12 w-12 rounded-full border-4 border-emerald-200 animate-ping opacity-20"></div>
        </div>
        <p className="mt-4 text-slate-700 font-medium">Memuat Riwayat Distribusi...</p>
      </div>
    );
  }

  if (error && !riwayatData) {
    return (
      <div className="flex min-h-screen bg-gradient-to-br from-slate-50 via-white to-emerald-50">
        <SidebarPbf isCollapsed={isCollapsed} setIsCollapsed={setIsCollapsed} />
        <div
          className={`flex-1 flex flex-col transition-all duration-300 ${isCollapsed ? 'ml-16' : 'ml-64'}`}
        >
          <NavbarPbf onLogout={handleLogout} username={username} />
          <main className="flex-1 flex items-center justify-center p-6 pt-[72px]">
            <div className="bg-white p-8 rounded-2xl shadow-lg border border-red-200 text-center max-w-md">
              <AlertTriangle className="mx-auto h-12 w-12 text-red-500 mb-4" />
              <h2 className="text-xl font-bold text-red-800 mb-2">Gagal Memuat Data</h2>
              <p className="text-red-600 mb-6">{error}</p>
              <button
                onClick={() => navigate('/pbf/monitoring-stok')}
                className="flex items-center gap-2 px-4 py-2.5 border border-slate-300 text-slate-700 font-medium rounded-lg hover:bg-slate-100 transition mx-auto"
              >
                <ArrowLeft size={18} />
                Kembali ke Monitoring Stok
              </button>
            </div>
          </main>
        </div>
      </div>
    );
  }

  if (!riwayatData || !riwayatData.onChain || !riwayatData.offChain) {
    return (
      <div className="flex min-h-screen bg-gradient-to-br from-slate-50 via-white to-emerald-50">
        <SidebarPbf isCollapsed={isCollapsed} setIsCollapsed={setIsCollapsed} />
        <div
          className={`flex-1 flex flex-col transition-all duration-300 ${isCollapsed ? 'ml-16' : 'ml-64'}`}
        >
          <NavbarPbf onLogout={handleLogout} username={username} />
          <main className="flex-1 flex items-center justify-center p-6 pt-[72px]">
            <div className="bg-white p-8 rounded-2xl shadow-lg border border-slate-200 text-center max-w-md">
              <FileText className="mx-auto h-12 w-12 text-yellow-500 mb-4" />
              <h2 className="text-xl font-bold text-slate-800 mb-2">
                Data Riwayat Tidak Ditemukan
              </h2>
              <p className="text-slate-600 mb-6">
                Tidak dapat menemukan detail riwayat untuk Aset ID ini.
              </p>
              <button
                onClick={() => navigate('/pbf/monitoring-stok')}
                className="flex items-center gap-2 px-4 py-2.5 border border-slate-300 text-slate-700 font-medium rounded-lg hover:bg-slate-100 transition mx-auto"
              >
                <ArrowLeft size={18} />
                Kembali ke Monitoring Stok
              </button>
            </div>
          </main>
        </div>
      </div>
    );
  }

  const { onChain, offChain } = riwayatData;

  const dataDiterimaPbf = onChain.riwayat.find((item) => item.status === 'DITERIMA_PBF');
  const dataKirimApotek = onChain.riwayat.find((item) => item.status === 'DIKIRIM_KE_APOTEK');
  const dataDiterimaApotek = onChain.riwayat.find((item) => item.status === 'DITERIMA_APOTEK');

  const isDiterimaPbfCompleted = !!dataDiterimaPbf;
  const isDikirimApotekCompleted = !!dataKirimApotek;
  const isDiterimaApotekCompleted = !!dataDiterimaApotek;

  const tanggalPengiriman = offChain.tanggal_pengiriman
    ? new Date(offChain.tanggal_pengiriman)
    : null;
  const estimasiSampai = new Date(tanggalPengiriman || Date.now());
  const hariTambah = offChain.opsi_pengiriman === 'ekspres' ? 1 : 3;
  if (tanggalPengiriman) {
    estimasiSampai.setDate(tanggalPengiriman.getDate() + hariTambah);
  }

  const getCurrentStatus = () => {
    if (dataDiterimaApotek) return 'Diterima Apotek';
    if (dataKirimApotek) return 'Dikirim ke Apotek';
    if (dataDiterimaPbf) return 'Diterima PBF';
    return 'Dipersiapkan';
  };
  const currentStatus = getCurrentStatus();

  const getTimestamp = (status) => {
    if (status === 'Diterima PBF' && dataDiterimaPbf)
      return formatTimestamp(dataDiterimaPbf.timestamp);
    if (status === 'Dikirim ke Apotek' && dataKirimApotek)
      return formatTimestamp(dataKirimApotek.timestamp);
    if (status === 'Diterima Apotek') {
      return isDiterimaApotekCompleted
        ? formatTimestamp(dataDiterimaApotek.timestamp)
        : `Estimasi: ${formatDate(estimasiSampai)}`;
    }
    return null;
  };

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-slate-50 via-white to-emerald-50">
      <SidebarPbf isCollapsed={isCollapsed} setIsCollapsed={setIsCollapsed} />
      <div
        className={`flex-1 flex flex-col transition-all duration-300 ${isCollapsed ? 'ml-16' : 'ml-64'}`}
      >
        <NavbarPbf onLogout={handleLogout} username={username} />

        <main className="flex-1 overflow-auto pt-[72px] px-12 py-8">
          <div className="max-w-5xl mx-auto">
            <button
              onClick={() => navigate('/pbf/monitoring-stok')}
              className="mb-6 inline-flex items-center text-emerald-600 hover:text-emerald-700 transition-colors text-sm font-medium"
            >
              <ArrowLeft size={16} className="mr-1" /> Kembali ke Monitoring Stok
            </button>

            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
              <div className="bg-gradient-to-r from-emerald-500 to-teal-600 px-6 py-5 border-b border-slate-200 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                <div>
                  <h1 className="text-2xl font-bold text-white">Lacak Riwayat Aset</h1>
                  <p className="text-sm text-emerald-50 mt-1">
                    Status pengiriman untuk Aset ID: <span className="font-mono">{assetId}</span>
                  </p>
                </div>
                <div
                  className={`px-4 py-2 rounded-full border-2 text-sm font-semibold flex items-center gap-2 bg-white ${
                    currentStatus === 'Diterima Apotek'
                      ? 'text-emerald-700 border-emerald-200'
                      : currentStatus === 'Dikirim ke Apotek'
                        ? 'text-blue-700 border-blue-200'
                        : 'text-amber-700 border-amber-200'
                  }`}
                >
                  {currentStatus === 'Diterima Apotek' ? (
                    <CheckCircle2 size={16} />
                  ) : currentStatus === 'Dikirim ke Apotek' ? (
                    <Truck size={16} />
                  ) : (
                    <Package size={16} />
                  )}
                  Status: {currentStatus}
                </div>
              </div>

              <div className="p-8 border-b border-slate-200">
                <h3 className="text-lg font-bold text-slate-900 mb-6 flex items-center gap-2">
                  <Package size={20} className="text-emerald-600" />
                  Detail Pengiriman
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-1">
                    <span className="text-sm font-medium text-slate-500">Nomor Resi</span>
                    <div className="flex items-center gap-2 bg-slate-50 p-3 rounded-lg border border-slate-200">
                      <span className="font-bold text-slate-900 font-mono text-base flex-1">
                        {offChain.nomor_resi || '-'}
                      </span>
                      <button
                        onClick={() => copyToClipboard(offChain.nomor_resi, 'resi')}
                        className="text-slate-400 hover:text-emerald-600 transition-colors p-1"
                        title="Salin No Resi"
                      >
                        <ClipboardCopy size={18} />
                      </button>
                      {copiedResi && <CheckCircle2 size={18} className="text-emerald-500" />}
                    </div>
                  </div>

                  <div className="space-y-1">
                    <span className="text-sm font-medium text-slate-500">No Surat Jalan</span>
                    <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
                      <span className="font-bold text-slate-900 font-mono text-base">
                        {offChain.nomor_surat_jalan || '-'}
                      </span>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <span className="text-sm font-medium text-slate-500">ID Pesanan Terkait</span>
                    <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
                      <span className="font-bold text-slate-900 text-base">
                        #{String(offChain.id).padStart(6, '0')}
                      </span>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <span className="text-sm font-medium text-slate-500">Opsi Pengiriman</span>
                    <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
                      <span className="font-bold text-slate-900 capitalize text-base">
                        {offChain.opsi_pengiriman || 'standar'}
                      </span>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <span className="text-sm font-medium text-slate-500">Pengirim (PBF)</span>
                    <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
                      <span className="font-semibold text-slate-900 text-base">
                        {offChain.nama_pbf}
                      </span>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <span className="text-sm font-medium text-slate-500">Penerima (Apotek)</span>
                    <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
                      <span className="font-semibold text-slate-900 text-base">
                        {offChain.nama_apotek}
                      </span>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <span className="text-sm font-medium text-slate-500">Tanggal Pesan</span>
                    <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
                      <span className="font-semibold text-slate-900 text-base">
                        {formatDate(offChain.tanggal_pesanan)}
                      </span>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <span className="text-sm font-medium text-slate-500">Tanggal Pengiriman</span>
                    <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
                      <span className="font-semibold text-slate-900 text-base">
                        {formatDate(offChain.tanggal_pengiriman)} {offChain.waktu_pengiriman || ''}
                      </span>
                    </div>
                  </div>

                  <div className="space-y-1 md:col-span-2">
                    <span className="text-sm font-medium text-slate-500">Estimasi Sampai</span>
                    <div className="bg-emerald-50 p-3 rounded-lg border border-emerald-200">
                      <span className="font-semibold text-emerald-700 text-base">
                        {formatDate(estimasiSampai)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-8 py-12">
                <h3 className="text-lg font-bold text-slate-900 mb-8 text-center">
                  Riwayat Status Aset
                </h3>
                <div className="flex items-start justify-center gap-0">
                  <StatusStep
                    icon={Package}
                    label="Diterima PBF"
                    timestamp={getTimestamp('Diterima PBF')}
                    isCompleted={isDiterimaPbfCompleted}
                    isCurrent={currentStatus === 'Diterima PBF'}
                  />

                  <div className="relative flex items-center h-14 w-24">
                    <div
                      className={`w-full h-1.5 rounded-full ${isDikirimApotekCompleted ? 'bg-emerald-500' : 'bg-slate-300'}`}
                    />
                  </div>

                  <StatusStep
                    icon={Truck}
                    label="Dikirim ke Apotek"
                    timestamp={getTimestamp('Dikirim ke Apotek')}
                    isCompleted={isDikirimApotekCompleted}
                    isCurrent={currentStatus === 'Dikirim ke Apotek'}
                  />

                  <div className="relative flex items-center h-14 w-24">
                    <div
                      className={`w-full h-1.5 rounded-full ${isDiterimaApotekCompleted ? 'bg-emerald-500' : 'bg-slate-300'}`}
                    />
                  </div>

                  <StatusStep
                    icon={Home}
                    label="Diterima Apotek"
                    timestamp={getTimestamp('Diterima Apotek')}
                    isCompleted={isDiterimaApotekCompleted}
                    isCurrent={currentStatus === 'Diterima Apotek'}
                  >
                    {isDiterimaApotekCompleted && offChain.buktiPenerimaUrl && (
                      <button
                        onClick={() => setIsModalOpen(true)}
                        className="text-xs text-emerald-600 hover:underline mt-1 font-semibold block w-full text-center"
                      >
                        Lihat Bukti
                      </button>
                    )}
                  </StatusStep>
                </div>
              </div>

              <div className="px-8 pb-8">
                <div className="bg-blue-50 border border-blue-200 text-blue-800 rounded-xl p-4 text-sm flex items-start gap-3">
                  <Info size={18} className="flex-shrink-0 mt-0.5" />
                  <span>
                    Status pengiriman ini diverifikasi berdasarkan data yang tercatat di blockchain
                    untuk memastikan transparansi dan keaslian.
                  </span>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>

      <BuktiPenerimaanModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        imageUrl={offChain.buktiPenerimaUrl}
      />

      <style jsx>{`
        @keyframes blob {
          0%,
          100% {
            transform: translate(0, 0) scale(1);
          }
          33% {
            transform: translate(30px, -50px) scale(1.1);
          }
          66% {
            transform: translate(-20px, 20px) scale(0.9);
          }
        }
        .animate-blob {
          animation: blob 7s infinite;
        }
        .animation-delay-2000 {
          animation-delay: 2s;
        }
      `}</style>
    </div>
  );
};

export default LihatRiwayatPbf;
