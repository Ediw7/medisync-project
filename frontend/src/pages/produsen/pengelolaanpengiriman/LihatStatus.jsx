import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import SidebarProdusen from '../../../components/SidebarProdusen';
import NavbarProdusen from '../../../components/NavbarProdusen';
import {
  Loader2,
  ArrowLeft,
  ClipboardCopy,
  Package,
  Truck,
  CheckCircle2,
  AlertTriangle,
  Info,
} from 'lucide-react';
import axios from 'axios';
import { toast } from 'react-hot-toast';

const LihatStatus = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [shippingData, setShippingData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [copiedResi, setCopiedResi] = useState(false);

  useEffect(() => {
    const fetchShippingData = async () => {
      setIsLoading(true);
      setError(null);
      let token;
      try {
        token = localStorage.getItem('token');
        if (!token) throw new Error('Silakan login terlebih dahulu');

        const response = await axios.get(
          `http://localhost:5000/api/produsen/pesanan-masuk/${id}/surat-jalan`,
          { headers: { Authorization: `Bearer ${token}` } }
        );

        if (!response.data.success || !response.data.data?.pesanan) {
          throw new Error(
            response.data.message || 'Data pengiriman tidak lengkap atau tidak tersedia'
          );
        }

        const data = response.data.data.pesanan;

        // Pastikan semua tanggal dalam bentuk Date (UTC → lokal)
        const parseDate = (str) => (str ? new Date(str) : null);

        const tanggalPengiriman = parseDate(data.tanggal_pengiriman);
        if (!tanggalPengiriman || isNaN(tanggalPengiriman.getTime())) {
          throw new Error('Pengiriman untuk pesanan ini belum diatur atau tanggal tidak valid.');
        }

        const estimasiSampai = new Date(tanggalPengiriman);
        const hariTambah = data.opsi_pengiriman === 'ekspres' ? 1 : 3;
        estimasiSampai.setDate(tanggalPengiriman.getDate() + hariTambah);

        setShippingData({
          noResi: data.nomor_resi,
          noSuratJalan: data.nomor_surat_jalan,
          pengirim: data.nama_produsen || 'Produsen',
          penerima: data.nama_pbf || 'PBF Tujuan',
          waktuPesan: parseDate(data.tanggal_pesanan),
          idPesanan: String(data.pesanan_id || id).padStart(6, '0'),
          tanggalPengiriman,
          waktuPengiriman: data.waktu_pengiriman || 'N/A',
          statusPengiriman: data.status,
          statusBlockchain: data.status_blockchain,
          estimasiSampai,
          opsiPengiriman: data.opsi_pengiriman || 'standar',
        });
      } catch (err) {
        setError(err.message);
        if (
          err.message.includes('401') ||
          err.message.includes('403') ||
          err.message.includes('login')
        ) {
          navigate('/login/produsen');
        }
      } finally {
        setIsLoading(false);
      }
    };
    fetchShippingData();
  }, [id, navigate]);

  const copyToClipboard = async (text, type) => {
    try {
      await navigator.clipboard.writeText(text);
      if (type === 'resi') {
        setCopiedResi(true);
        toast.success('Nomor Resi disalin!');
        setTimeout(() => setCopiedResi(false), 2000);
      }
    } catch (err) {
      toast.error('Gagal menyalin teks.');
    }
  };

  // === FUNGSI FORMAT TANGGAL & WAKTU (WIB) ===
  const formatDate = (date, includeTime = false) => {
    if (!date || isNaN(date.getTime())) return 'N/A';

    const options = {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      timeZone: 'Asia/Jakarta',
    };

    if (includeTime) {
      options.hour = '2-digit';
      options.minute = '2-digit';
    }

    return date.toLocaleString('id-ID', options) + (includeTime ? ' WIB' : '');
  };
  // === AKHIR FORMAT ===

  const StatusStep = ({ icon: Icon, label, timestamp, isCompleted, isCurrent }) => (
    <div className="relative flex flex-col items-center justify-start text-center w-40">
      <div
        className={`w-14 h-14 rounded-full flex items-center justify-center border-2 transition-colors duration-300 z-10 ${
          isCurrent
            ? 'bg-emerald-100 border-emerald-500 animate-pulse'
            : isCompleted
              ? 'bg-emerald-500 border-emerald-600 text-white'
              : 'bg-slate-100 border-slate-300 text-slate-400'
        }`}
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
      </div>
    </div>
  );

  if (isLoading) {
    return (
      <div className="flex flex-col justify-center items-center h-screen bg-gradient-to-br from-slate-50 via-white to-emerald-50">
        <div className="relative">
          <Loader2 className="animate-spin h-12 w-12 text-emerald-600" />
          <div className="absolute inset-0 h-12 w-12 rounded-full border-4 border-emerald-200 animate-ping opacity-20"></div>
        </div>
        <p className="mt-4 text-slate-700 font-medium">Memuat Status Pengiriman...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-screen bg-gradient-to-br from-slate-50 via-white to-emerald-50">
        <SidebarProdusen isCollapsed={isCollapsed} setIsCollapsed={setIsCollapsed} />
        <div
          className={`flex-1 flex flex-col transition-all duration-300 ${isCollapsed ? 'ml-16' : 'ml-64'}`}
        >
          <NavbarProdusen
            onLogout={() => {
              localStorage.clear();
              navigate('/');
            }}
            username={localStorage.getItem('username')}
          />
          <main className="flex-1 flex items-center justify-center p-6 pt-[72px]">
            <div className="bg-white p-8 rounded-2xl shadow-lg border border-red-200 text-center max-w-md">
              <AlertTriangle className="mx-auto h-12 w-12 text-red-500 mb-4" />
              <h2 className="text-xl font-bold text-red-800 mb-2">Oops! Terjadi Masalah</h2>
              <p className="text-red-600 mb-6">{error}</p>
              {error.includes('belum diatur') ? (
                <button
                  onClick={() => navigate(`/produsen/pengelolaan-pengiriman/atur-pengiriman/${id}`)}
                  className="flex items-center gap-2 px-4 py-2.5 bg-emerald-600 text-white font-medium rounded-lg hover:bg-emerald-700 transition mx-auto"
                >
                  Atur Pengiriman Sekarang
                </button>
              ) : (
                <button
                  onClick={() => navigate('/produsen/pengelolaan-pengiriman')}
                  className="flex items-center gap-2 px-4 py-2.5 border border-slate-300 text-slate-700 font-medium rounded-lg hover:bg-slate-100 transition mx-auto"
                >
                  <ArrowLeft size={18} />
                  Kembali ke Pengiriman
                </button>
              )}
            </div>
          </main>
        </div>
      </div>
    );
  }

  if (!shippingData)
    return <div className="p-6 text-center text-slate-500">Data pengiriman tidak ditemukan.</div>;

  const getCurrentStatus = () => {
    if (shippingData.statusBlockchain === 'DITERIMA_PBF') return 'Selesai';
    if (shippingData.statusBlockchain === 'DIKIRIM_KE_PBF') return 'Dikirim';
    if (shippingData.statusPengiriman === 'Dikirim') return 'Dikirim';
    return 'Dipersiapkan';
  };

  const currentStatus = getCurrentStatus();
  const isDipersiapkanCompleted = true;
  const isDikirimCompleted = currentStatus === 'Dikirim' || currentStatus === 'Selesai';
  const isSelesaiCompleted = currentStatus === 'Selesai';

  const getTimestamp = (status) => {
    if (status === 'Dipersiapkan' && shippingData.waktuPesan)
      return formatDate(shippingData.waktuPesan, true);
    if (status === 'Dikirim' && shippingData.tanggalPengiriman)
      return `${formatDate(shippingData.tanggalPengiriman)} ${shippingData.waktuPengiriman}`;
    if (status === 'Selesai') {
      return isSelesaiCompleted
        ? formatDate(new Date(), true)
        : `Estimasi: ${formatDate(shippingData.estimasiSampai)}`;
    }
    return null;
  };

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-slate-50 via-white to-emerald-50">
      <SidebarProdusen isCollapsed={isCollapsed} setIsCollapsed={setIsCollapsed} />
      <div
        className={`flex-1 flex flex-col transition-all duration-300 ${isCollapsed ? 'ml-16' : 'ml-64'}`}
      >
        <NavbarProdusen
          onLogout={() => {
            localStorage.clear();
            navigate('/');
          }}
          username={localStorage.getItem('username')}
        />

        <main className="flex-1 overflow-auto pt-[72px] px-12 py-8">
          <div className="max-w-5xl mx-auto">
            <button
              onClick={() => navigate('/produsen/pengelolaan-pengiriman')}
              className="mb-6 inline-flex items-center text-emerald-600 hover:text-emerald-700 transition-colors text-sm font-medium"
            >
              <ArrowLeft size={16} className="mr-1" /> Kembali ke Pengelolaan Pengiriman
            </button>

            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
              {/* Header */}
              <div className="bg-gradient-to-r from-emerald-500 to-teal-600 px-6 py-5 border-b border-slate-200 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                <div>
                  <h1 className="text-2xl font-bold text-white">Lacak Pengiriman</h1>
                  <p className="text-sm text-emerald-50 mt-1">
                    Status pengiriman untuk Pesanan #{shippingData.idPesanan}
                  </p>
                </div>
                <div
                  className={`px-4 py-2 rounded-full border-2 text-sm font-semibold flex items-center gap-2 bg-white ${
                    currentStatus === 'Selesai'
                      ? 'text-emerald-700 border-emerald-200'
                      : currentStatus === 'Dikirim'
                        ? 'text-blue-700 border-blue-200'
                        : 'text-amber-700 border-amber-200'
                  }`}
                >
                  {currentStatus === 'Selesai' ? (
                    <CheckCircle2 size={16} />
                  ) : currentStatus === 'Dikirim' ? (
                    <Truck size={16} />
                  ) : (
                    <Clock size={16} />
                  )}
                  Status: {currentStatus}
                </div>
              </div>

              {/* Detail Pengiriman */}
              <div className="p-8 border-b border-slate-200">
                <h3 className="text-lg font-bold text-slate-900 mb-6 flex items-center gap-2">
                  <Package size={20} className="text-emerald-600" />
                  Detail Pengiriman
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Nomor Resi */}
                  <div className="space-y-1">
                    <span className="text-sm font-medium text-slate-500">Nomor Resi</span>
                    <div className="flex items-center gap-2 bg-slate-50 p-3 rounded-lg border border-slate-200">
                      <span className="font-bold text-slate-900 font-mono text-base flex-1">
                        {shippingData.noResi}
                      </span>
                      <button
                        onClick={() => copyToClipboard(shippingData.noResi, 'resi')}
                        className="text-slate-400 hover:text-emerald-600 transition-colors p-1"
                        title="Salin No Resi"
                      >
                        <ClipboardCopy size={18} />
                      </button>
                      {copiedResi && <CheckCircle2 size={18} className="text-emerald-500" />}
                    </div>
                  </div>

                  {/* No Surat Jalan */}
                  <div className="space-y-1">
                    <span className="text-sm font-medium text-slate-500">No Surat Jalan</span>
                    <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
                      <span className="font-bold text-slate-900 font-mono text-base">
                        {shippingData.noSuratJalan}
                      </span>
                    </div>
                  </div>

                  {/* ID Pesanan */}
                  <div className="space-y-1">
                    <span className="text-sm font-medium text-slate-500">ID Pesanan</span>
                    <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
                      <span className="font-bold text-slate-900 text-base">
                        #{shippingData.idPesanan}
                      </span>
                    </div>
                  </div>

                  {/* Opsi Pengiriman */}
                  <div className="space-y-1">
                    <span className="text-sm font-medium text-slate-500">Opsi Pengiriman</span>
                    <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
                      <span className="font-bold text-slate-900 capitalize text-base">
                        {shippingData.opsiPengiriman}
                      </span>
                    </div>
                  </div>

                  {/* Pengirim */}
                  <div className="space-y-1">
                    <span className="text-sm font-medium text-slate-500">Pengirim</span>
                    <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
                      <span className="font-semibold text-slate-900 text-base">
                        {shippingData.pengirim}
                      </span>
                    </div>
                  </div>

                  {/* Penerima */}
                  <div className="space-y-1">
                    <span className="text-sm font-medium text-slate-500">Penerima</span>
                    <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
                      <span className="font-semibold text-slate-900 text-base">
                        {shippingData.penerima}
                      </span>
                    </div>
                  </div>

                  {/* Tanggal Pesan (dengan waktu) */}
                  <div className="space-y-1">
                    <span className="text-sm font-medium text-slate-500">Tanggal Pesan</span>
                    <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
                      <span className="font-semibold text-slate-900 text-base">
                        {formatDate(shippingData.waktuPesan, true)}
                      </span>
                    </div>
                  </div>

                  {/* Tanggal Pengiriman (dengan waktu) */}
                  <div className="space-y-1">
                    <span className="text-sm font-medium text-slate-500">Tanggal Pengiriman</span>
                    <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
                      <span className="font-semibold text-slate-900 text-base">
                        {formatDate(shippingData.tanggalPengiriman)} {shippingData.waktuPengiriman}
                      </span>
                    </div>
                  </div>

                  {/* Estimasi Sampai */}
                  <div className="space-y-1 md:col-span-2">
                    <span className="text-sm font-medium text-slate-500">Estimasi Sampai</span>
                    <div className="bg-emerald-50 p-3 rounded-lg border border-emerald-200">
                      <span className="font-semibold text-emerald-700 text-base">
                        {formatDate(shippingData.estimasiSampai)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Timeline Status */}
              <div className="p-8 py-12">
                <h3 className="text-lg font-bold text-slate-900 mb-8 text-center">
                  Status Pengiriman
                </h3>
                <div className="flex items-center justify-center gap-0">
                  <StatusStep
                    icon={Package}
                    label="Dipersiapkan"
                    timestamp={getTimestamp('Dipersiapkan')}
                    isCompleted={isDipersiapkanCompleted}
                    isCurrent={currentStatus === 'Dipersiapkan'}
                  />
                  <div className="relative flex items-center h-14 w-24">
                    <div
                      className={`w-full h-1.5 rounded-full ${isDikirimCompleted ? 'bg-emerald-500' : 'bg-slate-300'}`}
                    />
                  </div>
                  <StatusStep
                    icon={Truck}
                    label="Dikirim"
                    timestamp={getTimestamp('Dikirim')}
                    isCompleted={isDikirimCompleted}
                    isCurrent={currentStatus === 'Dikirim'}
                  />
                  <div className="relative flex items-center h-14 w-24">
                    <div
                      className={`w-full h-1.5 rounded-full ${isSelesaiCompleted ? 'bg-emerald-500' : 'bg-slate-300'}`}
                    />
                  </div>
                  <StatusStep
                    icon={CheckCircle2}
                    label="Selesai"
                    timestamp={getTimestamp('Selesai')}
                    isCompleted={isSelesaiCompleted}
                    isCurrent={currentStatus === 'Selesai'}
                  />
                </div>
              </div>

              {/* Info */}
              <div className="px-8 pb-8">
                <div className="bg-blue-50 border border-blue-200 text-blue-800 rounded-xl p-4 text-sm flex items-start gap-3">
                  <Info size={18} className="flex-shrink-0 mt-0.5" />
                  <span>
                    Status pengiriman akan diperbarui secara otomatis berdasarkan konfirmasi dari
                    PBF. Estimasi sampai adalah perkiraan.
                  </span>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default LihatStatus;
