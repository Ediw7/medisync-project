import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
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
  Calendar,
  Clock
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

        const response = await axios.get(`http://localhost:5000/api/produsen/pesanan-masuk/${id}/surat-jalan`, {
          headers: { 'Authorization': `Bearer ${token}` },
        });

        if (!response.data.success || !response.data.data?.pesanan) {
            throw new Error(response.data.message || 'Data pengiriman tidak lengkap atau tidak tersedia');
        }

        const data = response.data.data.pesanan;

        const tanggalPengiriman = data.tanggal_pengiriman ? new Date(data.tanggal_pengiriman) : null;
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
          waktuPesan: data.tanggal_pesanan ? new Date(data.tanggal_pesanan) : null,
          idPesanan: String(data.pesanan_id || id).padStart(6, '0'),
          tanggalPengiriman: tanggalPengiriman,
          waktuPengiriman: data.waktu_pengiriman || 'N/A',
          statusPengiriman: data.status,
          statusBlockchain: data.status_blockchain,
          estimasiSampai: estimasiSampai,
          opsiPengiriman: data.opsi_pengiriman || 'standar'
        });

      } catch (err) {
        setError(err.message);
        if ((err.message.includes('401') || err.message.includes('403') || err.message.includes('login')) && token) {
            navigate('/login/produsen');
        } else if (!token) {
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
        console.error('Failed to copy text: ', err);
    }
  };

  const formatDate = (date, includeTime = false) => {
      if (!date || isNaN(new Date(date).getTime())) return 'N/A';
      const options = { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' };
      if(includeTime) {
          options.hour = '2-digit';
          options.minute = '2-digit';
      }
      return new Date(date).toLocaleDateString('id-ID', options);
  };

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
      if (status === 'Dipersiapkan' && shippingData.waktuPesan) return formatDate(shippingData.waktuPesan, true);
      if (status === 'Dikirim' && shippingData.tanggalPengiriman) return `${formatDate(shippingData.tanggalPengiriman)} ${shippingData.waktuPengiriman}`;
      if (status === 'Selesai' && shippingData.estimasiSampai) return `Estimasi: ${formatDate(shippingData.estimasiSampai)}`;
      return null;
  };

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
      <div className="flex min-h-screen bg-slate-50">
        <SidebarProdusen isCollapsed={isCollapsed} setIsCollapsed={setIsCollapsed} />
        <div className={`flex-1 flex flex-col transition-all duration-300 ${isCollapsed ? 'ml-16' : 'ml-64'}`}>
          <NavbarProdusen onLogout={() => { localStorage.clear(); navigate('/'); }} username={localStorage.getItem('username')} />
          <main className="flex-1 flex items-center justify-center p-6 pt-[72px]">
            <div className="bg-white p-8 rounded-xl shadow-lg border border-red-200 text-center max-w-md">
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

  if (!shippingData) return <div className="p-6 text-center text-slate-500">Data pengiriman tidak ditemukan.</div>;

  return (
    <div className="flex min-h-screen bg-slate-50">
      <SidebarProdusen isCollapsed={isCollapsed} setIsCollapsed={setIsCollapsed} />
      <div className={`flex-1 flex flex-col transition-all duration-300 ${isCollapsed ? 'ml-16' : 'ml-64'}`}>
        <NavbarProdusen onLogout={() => { localStorage.clear(); navigate('/'); }} username={localStorage.getItem('username')} />

        <main className="flex-1 overflow-auto pt-[72px]">
          <div className="max-w-5xl mx-auto px-6 py-8">
            <button
              onClick={() => navigate('/produsen/pengelolaan-pengiriman')}
              className="mb-6 inline-flex items-center text-emerald-600 hover:text-emerald-700 transition-colors text-sm font-medium"
            >
              <ArrowLeft size={16} className="mr-1" /> Kembali ke Pengelolaan Pengiriman
            </button>

            <div className="bg-white rounded-xl shadow-lg border border-slate-200 overflow-hidden">
              <div className="bg-gradient-to-r from-emerald-50 to-emerald-100 px-6 py-5 border-b border-slate-200 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                 <div>
                    <h1 className="text-2xl font-bold text-emerald-900">Lacak Pengiriman</h1>
                    <p className="text-sm text-emerald-700 mt-1">Status pengiriman untuk Pesanan #{shippingData.idPesanan}</p>
                 </div>
                 <div className={`px-4 py-2 rounded-full border text-sm font-semibold flex items-center gap-2 ${
                     currentStatus === 'Selesai' ? 'bg-green-100 text-green-800 border-green-200' :
                     currentStatus === 'Dikirim' ? 'bg-blue-100 text-blue-800 border-blue-200' :
                     'bg-yellow-100 text-yellow-800 border-yellow-200'
                 }`}>
                     {currentStatus === 'Selesai' ? <CheckCircle2 size={16} /> :
                      currentStatus === 'Dikirim' ? <Truck size={16} /> :
                      <Clock size={16} />}
                     Status: {currentStatus}
                 </div>
              </div>

              <div className="p-6 border-b border-slate-200">
                  <h3 className="text-lg font-semibold text-slate-800 mb-4">Detail Pengiriman</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-4 text-sm">
                      <div className="flex items-center justify-between sm:block">
                          <span className="text-slate-500">Nomor Resi:</span>
                          <div className="flex items-center gap-1">
                              <span className="font-semibold text-slate-700 font-mono">{shippingData.noResi}</span>
                              <button onClick={() => copyToClipboard(shippingData.noResi, 'resi')} className="text-slate-400 hover:text-emerald-600 transition-colors" title="Salin No Resi">
                                  <ClipboardCopy size={14} />
                              </button>
                               {copiedResi && <CheckCircle2 size={14} className="text-green-500" />}
                          </div>
                      </div>
                       <div className="flex items-center justify-between sm:block">
                           <span className="text-slate-500">No Surat Jalan:</span>
                           <span className="font-semibold text-slate-700 font-mono">{shippingData.noSuratJalan}</span>
                       </div>
                       <div className="flex items-center justify-between sm:block">
                           <span className="text-slate-500">ID Pesanan:</span>
                           <span className="font-semibold text-slate-700">#{shippingData.idPesanan}</span>
                       </div>
                       <div className="flex items-center justify-between sm:block">
                           <span className="text-slate-500">Pengirim:</span>
                           <span className="font-semibold text-slate-700">{shippingData.pengirim}</span>
                       </div>
                       <div className="flex items-center justify-between sm:block">
                           <span className="text-slate-500">Penerima:</span>
                           <span className="font-semibold text-slate-700">{shippingData.penerima}</span>
                       </div>
                       <div className="flex items-center justify-between sm:block">
                           <span className="text-slate-500">Opsi Pengiriman:</span>
                           <span className="font-semibold text-slate-700 capitalize">{shippingData.opsiPengiriman}</span>
                       </div>
                       <div className="flex items-center justify-between sm:block">
                          <span className="text-slate-500">Tanggal Pesan:</span>
                          <span className="font-semibold text-slate-700">{formatDate(shippingData.waktuPesan)}</span>
                       </div>
                       <div className="flex items-center justify-between sm:block">
                           <span className="text-slate-500">Tanggal Pengiriman:</span>
                           <span className="font-semibold text-slate-700">{formatDate(shippingData.tanggalPengiriman)} {shippingData.waktuPengiriman}</span>
                       </div>
                       <div className="flex items-center justify-between sm:block">
                           <span className="text-slate-500">Estimasi Sampai:</span>
                           <span className="font-semibold text-slate-700">{formatDate(shippingData.estimasiSampai)}</span>
                       </div>
                  </div>
              </div>

              <div className="p-6 py-8">
                <h3 className="text-lg font-semibold text-slate-800 mb-6 text-center">Alur Pengiriman</h3>
                <div className="relative flex items-start justify-between">
                  {/* Step 1: Dipersiapkan */}
                  <div className="flex flex-col items-center flex-1 text-center">
                    <div className={`w-14 h-14 rounded-full flex items-center justify-center mb-2 shadow-md transition-all duration-300 ${
                      isDipersiapkanCompleted 
                        ? 'bg-emerald-500 text-white border-2 border-emerald-600' 
                        : 'bg-slate-100 text-slate-400 border-2 border-slate-300'
                    }`}>
                      <Package size={22} />
                    </div>
                    <p className="text-sm font-medium text-slate-800 mb-1">Dipersiapkan</p>
                    <p className="text-xs text-slate-500">{getTimestamp('Dipersiapkan')}</p>
                  </div>

                  {/* Horizontal Line 1 */}
                  <div className={`w-16 h-1 mx-1 bg-slate-300 rounded-full flex-1 ${
                    isDipersiapkanCompleted ? 'bg-emerald-500' : ''
                  }`}>
                  </div>

                  {/* Step 2: Dikirim */}
                  <div className="flex flex-col items-center flex-1 text-center">
                    <div className={`w-14 h-14 rounded-full flex items-center justify-center mb-2 shadow-md transition-all duration-300 ${
                      isDikirimCompleted 
                        ? 'bg-emerald-500 text-white border-2 border-emerald-600' 
                        : !isDipersiapkanCompleted && currentStatus === 'Dikirim'
                          ? 'bg-blue-100 text-blue-600 border-2 border-blue-300 ring-2 ring-blue-200' 
                          : 'bg-slate-100 text-slate-400 border-2 border-slate-300'
                    }`}>
                      <Truck size={22} />
                    </div>
                    <p className="text-sm font-medium text-slate-800 mb-1">Dikirim</p>
                    <p className="text-xs text-slate-500">{getTimestamp('Dikirim')}</p>
                  </div>

                  {/* Horizontal Line 2 */}
                  <div className={`w-16 h-1 mx-1 bg-slate-300 rounded-full flex-1 ${
                    isDikirimCompleted ? 'bg-emerald-500' : ''
                  }`}>
                  </div>

                  {/* Step 3: Selesai */}
                  <div className="flex flex-col items-center flex-1 text-center">
                    <div className={`w-14 h-14 rounded-full flex items-center justify-center mb-2 shadow-md transition-all duration-300 ${
                      isSelesaiCompleted 
                        ? 'bg-emerald-500 text-white border-2 border-emerald-600' 
                        : !isDikirimCompleted && currentStatus === 'Selesai'
                          ? 'bg-blue-100 text-blue-600 border-2 border-blue-300 ring-2 ring-blue-200' 
                          : 'bg-slate-100 text-slate-400 border-2 border-slate-300'
                    }`}>
                      <CheckCircle2 size={22} />
                    </div>
                    <p className="text-sm font-medium text-slate-800 mb-1">Selesai</p>
                    <p className="text-xs text-slate-500">{getTimestamp('Selesai')}</p>
                  </div>
                </div>
              </div>

              <div className="px-6 pb-6">
                 <div className="bg-blue-50 border border-blue-200 text-blue-800 rounded-lg p-4 text-sm flex items-start gap-3">
                   <Info size={18} className="flex-shrink-0 mt-0.5"/>
                   <span>
                     Status pengiriman akan diperbarui secara otomatis berdasarkan konfirmasi dari PBF. Estimasi sampai adalah perkiraan.
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