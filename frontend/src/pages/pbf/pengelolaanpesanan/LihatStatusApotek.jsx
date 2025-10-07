import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import SidebarPbf from '../../../components/SidebarPbf';
import NavbarPbf from '../../../components/NavbarPbf';
import { ArrowLeft, ClipboardCopy, Package, Truck, CheckCircle, Loader2, AlertTriangle } from 'lucide-react';
import axios from 'axios';

const LihatStatusApotek = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [shippingData, setShippingData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchShippingData = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const token = localStorage.getItem('token');
        if (!token) throw new Error('Silakan login terlebih dahulu');

        const response = await axios.get(`http://localhost:5000/api/pbf/pesanan-apotek/${id}/lacak`, {
          headers: { 'Authorization': `Bearer ${token}` },
        });
        
        if (!response.data.success) throw new Error(response.data.message || 'Data pengiriman tidak tersedia');
        
        const data = response.data.data;

        const tanggalPengiriman = data.tanggal_pengiriman ? new Date(data.tanggal_pengiriman) : null;
        if (!tanggalPengiriman || isNaN(tanggalPengiriman.getTime())) {
          throw new Error('Pengiriman untuk pesanan ini belum diatur.');
        }
        
        const estimasiSampai = new Date(tanggalPengiriman);
        const hariTambah = data.opsi_pengiriman === 'ekspres' ? 1 : 3;
        estimasiSampai.setDate(tanggalPengiriman.getDate() + hariTambah);

        setShippingData({
          noResi: data.nomor_resi,
          noSuratJalan: data.nomor_surat_jalan,
          pengirim: data.nama_pbf_pengirim,
          tujuan: data.nama_apotek_penerima,
          waktuPesan: new Date(data.tanggal_pesanan),
          idPesanan: String(data.id).padStart(6, '0'),
          tanggalPengiriman: tanggalPengiriman,
          waktuPengiriman: data.waktu_pengiriman,
          statusPengiriman: data.status,
          estimasiSampai: estimasiSampai,
          opsiPengiriman: data.opsi_pengiriman
        });

      } catch (err) {
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };
    fetchShippingData();
  }, [id, navigate]);

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
    return (
      <div className="flex min-h-screen bg-gray-50">
        <SidebarPbf isCollapsed={isCollapsed} setIsCollapsed={setIsCollapsed} />
        <div className={`flex-1 flex flex-col transition-all duration-300 ${isCollapsed ? 'ml-16' : 'ml-64'}`}>
          <NavbarPbf onLogout={() => { localStorage.clear(); navigate('/'); }} />
          <main className="pt-16 p-6 flex items-center justify-center">
            <div className="text-center p-8 bg-white rounded-lg shadow-md">
                <AlertTriangle className="mx-auto h-12 w-12 text-yellow-500" />
                <h2 className="mt-4 text-xl font-semibold text-gray-800">Oops! Terjadi Masalah</h2>
                <p className="mt-2 text-gray-600">{error}</p>
                <Link to={`/pbf/pengelolaan-pesanan/atur-pengiriman/${id}`} className="mt-6 inline-block px-6 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700">
                    Atur Ulang Pengiriman
                </Link>
            </div>
          </main>
        </div>
      </div>
    );
  }

  if (!shippingData) return <div className="p-6 text-center">Data pengiriman tidak ditemukan.</div>;

  const formatDate = (date) => date.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
  
  const isDipersiapkanCompleted = ['Perlu Dikirim', 'Dikirim', 'Selesai'].includes(shippingData.statusPengiriman);
  const isDikirimCompleted = ['Dikirim', 'Selesai'].includes(shippingData.statusPengiriman);
  const isSelesaiCompleted = shippingData.statusPengiriman === 'Selesai';

  return (
    <div className="flex min-h-screen bg-gray-50">
      <SidebarPbf isCollapsed={isCollapsed} setIsCollapsed={setIsCollapsed} />
      <div className={`flex-1 flex flex-col transition-all duration-300 ${isCollapsed ? 'ml-16' : 'ml-64'}`}>
        <NavbarPbf onLogout={() => { localStorage.clear(); navigate('/'); }} />
        <main className="pt-16 p-6">
          <div className="max-w-4xl mx-auto">
            <div className="flex items-center mb-6">
              <button onClick={() => navigate('/pbf/pengelolaan-pesanan')} className="flex items-center gap-2 text-gray-600 hover:text-gray-900">
                <ArrowLeft size={18} /> Kembali
              </button>
            </div>

            <div className="bg-white p-8 rounded-lg shadow-lg border border-gray-200">
              <header className="mb-8">
                <h1 className="text-2xl font-bold text-gray-800">Lacak Pengiriman ke Apotek</h1>
                <p className="text-gray-500">Lihat status pengiriman pesanan dari Apotek</p>
              </header>
              <section className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-12">
                <div>
                  <p className="text-sm text-gray-500">No Resi</p>
                  <div className="flex items-center gap-2"><p className="font-semibold text-lg">{shippingData.noResi}</p><button onClick={() => copyToClipboard(shippingData.noResi)} className="text-gray-400 hover:text-emerald-600"><ClipboardCopy size={16} /></button></div>
                </div>
                <div><p className="text-sm text-gray-500">Pengirim</p><p className="font-semibold text-lg">{shippingData.pengirim}</p></div>
                <div><p className="text-sm text-gray-500">Waktu Pesan</p><p className="font-semibold text-lg">{formatDate(shippingData.waktuPesan)}</p></div>
                <div><p className="text-sm text-gray-500">ID Pesanan</p><p className="font-semibold text-lg">{shippingData.idPesanan}</p></div>
                <div><p className="text-sm text-gray-500">No Surat Jalan</p><p className="font-semibold text-lg">{shippingData.noSuratJalan}</p></div>
                <div><p className="text-sm text-gray-500">Tujuan</p><p className="font-semibold text-lg">{shippingData.tujuan}</p></div>
                <div><p className="text-sm text-gray-500">Estimasi Sampai</p><p className="font-semibold text-lg">{formatDate(shippingData.estimasiSampai)}</p></div>
                <div><p className="text-sm text-gray-500">Opsi Pengiriman</p><p className="font-semibold text-lg capitalize">{shippingData.opsiPengiriman}</p></div>
              </section>

              <section className="flex justify-center py-6">
                <StatusStep icon={<Package size={24}/>} label="Dipersiapkan" timestamp={isDipersiapkanCompleted ? formatDate(shippingData.waktuPesan) : null} isCompleted={isDipersiapkanCompleted} />
                <StatusStep icon={<Truck size={24}/>} label="Dikirim" timestamp={isDikirimCompleted ? `${formatDate(shippingData.tanggalPengiriman)} ${shippingData.waktuPengiriman || ''}` : null} isCompleted={isDikirimCompleted} />
                <StatusStep icon={<CheckCircle size={24}/>} label="Selesai" timestamp={isSelesaiCompleted ? 'Diterima Apotek' : null} isCompleted={isSelesaiCompleted} isLast={true} />
              </section>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default LihatStatusApotek;