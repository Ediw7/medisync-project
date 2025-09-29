// File: frontend/src/pages/pbf/pesanobat/LacakPengembalian.jsx

import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import SidebarPbf from '../../../components/SidebarPbf';
import NavbarPbf from '../../../components/NavbarPbf';
import { ArrowLeft, ClipboardCopy, Package, Truck, CheckCircle, Loader2 } from 'lucide-react';
import axios from 'axios';

const LacakPengembalianPbf = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [trackingData, setTrackingData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchTrackingData = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const token = localStorage.getItem('token');
        if (!token) throw new Error('Silakan login terlebih dahulu');

        const response = await axios.get(`http://localhost:5000/api/pbf/pesanan/${id}/lacak-pengembalian`, {
          headers: { 'Authorization': `Bearer ${token}` },
        });
        
        if (!response.data.success) throw new Error(response.data.message || 'Data pelacakan tidak tersedia');
        
        const data = response.data.data;
        const waktuPengembalian = new Date(data.tanggal_pengiriman || data.tanggal_pesanan);
        const estimasiSampai = new Date(waktuPengembalian);
        estimasiSampai.setDate(waktuPengembalian.getDate() + 2);

        setTrackingData({
          noResi: data.nomor_resi,
          noSuratJalanBerangkat: data.nomor_surat_jalan,
          noSuratJalanPulang: `SJPULANG-${data.id}-${new Date().getTime().toString().slice(-4)}`,
          pengirim: data.nama_pbf,
          tujuan: data.nama_produsen,
          idPesanan: String(data.id).padStart(6, '0'),
          waktuPengembalian: waktuPengembalian,
          estimasiSampai: estimasiSampai,
          status: data.status,
          buktiFotoPengembalian: data.bukti_foto_pengembalian,
        });
      } catch (err) {
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };
    fetchTrackingData();
  }, [id]);

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    alert(`Teks "${text}" telah disalin.`);
  };

  const StatusStep = ({ icon, label, timestamp, isCompleted, isLast = false }) => (
    <div className="flex items-center">
      <div className={`flex flex-col items-center ${isLast ? '' : 'flex-1'}`}>
        <div className={`w-12 h-12 rounded-full flex items-center justify-center ${isCompleted ? 'bg-emerald-500 text-white' : 'bg-gray-200 text-gray-500'}`}>
          {icon}
        </div>
        <div className="text-center mt-2">
          <p className={`font-semibold ${isCompleted ? 'text-gray-800' : 'text-gray-500'}`}>{label}</p>
          {timestamp && <p className="text-sm text-gray-500">{timestamp}</p>}
        </div>
      </div>
      {!isLast && (
        <div className={`flex-1 h-1 mx-4 ${isCompleted ? 'bg-emerald-500' : 'bg-gray-200'}`} />
      )}
    </div>
  );

  if (isLoading) {
    return <div className="flex justify-center items-center h-screen"><Loader2 className="animate-spin h-8 w-8 text-emerald-600" /></div>;
  }
  
  if (error) {
    return <div className="p-6 text-center text-red-500">{error}</div>;
  }

  if (!trackingData) return <div className="p-6 text-center">Data pelacakan tidak ditemukan.</div>;

  const formatDate = (date) => date.toLocaleDateString('id-ID', { day: '2-digit', month: '2-digit', year: 'numeric' }).replace(/\//g, '-');
  
  const isSelesai = trackingData.status === 'Pengembalian Selesai';

  return (
    <div className="flex min-h-screen bg-gray-50">
      <SidebarPbf isCollapsed={isCollapsed} setIsCollapsed={setIsCollapsed} />
      <div className={`flex-1 flex flex-col transition-all duration-300 ${isCollapsed ? 'ml-16' : 'ml-64'}`}>
        <NavbarPbf onLogout={() => { localStorage.clear(); navigate('/'); }} />
        <main className="pt-16 p-6">
          <div className="max-w-4xl mx-auto">
            <div className="flex items-center mb-6">
              <button onClick={() => navigate('/pbf/pesan-obat')} className="flex items-center gap-2 text-gray-600 hover:text-gray-900">
                <ArrowLeft size={18} /> Kembali
              </button>
            </div>

            <div className="bg-white p-8 rounded-lg shadow-lg border border-gray-200">
              <header className="mb-8">
                <h1 className="text-2xl font-bold text-gray-800">Lacak Pengembalian Produk</h1>
                <p className="text-gray-500">Lihat Proses Pengembalian Produk Anda ke Produsen</p>
              </header>
              <section className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-12">
                <div>
                  <p className="text-sm text-gray-500">No Resi</p>
                  <div className="flex items-center gap-2"><p className="font-semibold text-lg">{trackingData.noResi}</p><button onClick={() => copyToClipboard(trackingData.noResi)} className="text-gray-400 hover:text-emerald-600"><ClipboardCopy size={16} /></button></div>
                </div>
                <div><p className="text-sm text-gray-500">Pengirim</p><p className="font-semibold text-lg">{trackingData.pengirim}</p></div>
                <div><p className="text-sm text-gray-500">No Surat Jalan Berangkat</p><p className="font-semibold text-lg">{trackingData.noSuratJalanBerangkat}</p></div>
                <div><p className="text-sm text-gray-500">Waktu Pengembalian</p><p className="font-semibold text-lg">{formatDate(trackingData.waktuPengembalian)}</p></div>

                <div><p className="text-sm text-gray-500">ID Pesanan</p><p className="font-semibold text-lg">{trackingData.idPesanan}</p></div>
                <div><p className="text-sm text-gray-500">Tujuan</p><p className="font-semibold text-lg">{trackingData.tujuan}</p></div>
                <div><p className="text-sm text-gray-500">No Surat Jalan Pulang</p><p className="font-semibold text-lg">{trackingData.noSuratJalanPulang}</p></div>
                <div><p className="text-sm text-gray-500">Estimasi Sampai</p><p className="font-semibold text-lg">{formatDate(trackingData.estimasiSampai)}</p></div>
              </section>

              <section className="flex justify-center py-6">
                  <StatusStep icon={<Package size={24}/>} label="Dipersiapkan" timestamp={formatDate(trackingData.waktuPengembalian)} isCompleted={true} />
                  <StatusStep icon={<Truck size={24}/>} label="Dikirim" timestamp={formatDate(trackingData.waktuPengembalian)} isCompleted={true} />
                  <StatusStep icon={<CheckCircle size={24}/>} label="Diterima Produsen" timestamp={isSelesai ? formatDate(new Date()) : null} isCompleted={isSelesai} isLast={true} />
              </section>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default LacakPengembalianPbf;