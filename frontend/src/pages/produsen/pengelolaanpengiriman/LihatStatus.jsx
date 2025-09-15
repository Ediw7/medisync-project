import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import SidebarProdusen from '../../../components/SidebarProdusen';
import NavbarProdusen from '../../../components/NavbarProdusen';
import { ArrowLeft, ClipboardCopy, Package, Truck, CheckCircle, Loader2 } from 'lucide-react';

const LihatStatus = () => {
  const navigate = useNavigate();
  const { id } = useParams(); // ID pesanan (string dari URL)
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

        const pesananId = String(id).padStart(6, '0'); // Sesuaikan dengan padding backend

        // Fetch surat jalan
        const sjResponse = await fetch(`http://localhost:5000/api/produsen/pesanan-masuk/${pesananId}/surat-jalan`, {
          headers: { 'Authorization': `Bearer ${token}` },
        });
        if (!sjResponse.ok) throw new Error('Gagal mengambil data surat jalan');
        const sjResult = await sjResponse.json();
        if (!sjResult.success) throw new Error(sjResult.message || 'Data surat jalan tidak tersedia');
        console.log('Surat Jalan Data:', sjResult.data);

        // Fetch pesanan
        const pesananResponse = await fetch(`http://localhost:5000/api/produsen/pesanan-masuk/${pesananId}`, {
          headers: { 'Authorization': `Bearer ${token}` },
        });
        if (!pesananResponse.ok) throw new Error('Gagal mengambil data pesanan');
        const pesananResult = await pesananResponse.json();
        if (!pesananResult.success) throw new Error(pesananResult.message || 'Data pesanan tidak tersedia');
        console.log('Pesanan Data:', pesananResult.data);

        // Hitung estimasi dengan validasi
        const tanggalPengiriman = sjResult.data.tanggal_pengiriman
          ? new Date(sjResult.data.tanggal_pengiriman)
          : null;
        if (!tanggalPengiriman || isNaN(tanggalPengiriman.getTime())) {
          throw new Error('Tanggal pengiriman tidak valid atau belum diatur. Pastikan pengiriman telah diatur.');
        }

        const opsiPengiriman = sjResult.data.opsi_pengiriman?.toLowerCase() || 'standar';
        const pengirimanEkspres = opsiPengiriman === 'ekspres';
        const estimasiSampai = new Date(tanggalPengiriman);
        estimasiSampai.setDate(tanggalPengiriman.getDate() + (pengirimanEkspres ? 1 : 3));

        const mergedData = {
          noResi: sjResult.data.nomor_resi || 'N/A',
          noSuratJalan: sjResult.data.nomor_surat_jalan || 'N/A',
          pengirim: 'Produsen',
          tujuan: pesananResult.data.pesanan.nama_pbf || 'Tujuan Tidak Diketahui',
          waktuPesan: pesananResult.data.pesanan.tanggal_pesanan
            ? new Date(pesananResult.data.pesanan.tanggal_pesanan)
            : new Date(),
          idPesanan: String(pesananResult.data.pesanan.id || id).padStart(6, '0'),
          tanggalPengiriman,
          waktuPengiriman: sjResult.data.waktu_pengiriman || 'N/A',
          statusPengiriman: pesananResult.data.pesanan.status || 'Perlu Dikirim',
          estimasiSampai,
          opsiPengiriman, // Ditampilkan dengan benar
        };

        setShippingData(mergedData);
      } catch (err) {
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };

    fetchShippingData();
  }, [id, navigate]);

  const handleLogout = () => {
    localStorage.clear();
    navigate('/');
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    alert(`Nomor Resi "${text}" telah disalin.`);
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
    return (
      <div className="flex justify-center items-center min-h-screen bg-gray-50">
        <Loader2 className="animate-spin h-8 w-8 text-emerald-600" />
        <p className="ml-2 text-gray-600">Memuat data...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col justify-center items-center min-h-screen bg-gray-50">
        <div className="p-4 bg-red-100 text-red-700 rounded-lg flex items-center gap-2 mb-4">
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.732 6.732a1 1 0 011.414 0L10 7.586l.854-.854a1 1 0 111.414 1.414L11.414 9l.854.854a1 1 0 11-1.414 1.414L10 10.414l-.854.854a1 1 0 01-1.414-1.414L8.586 9l-.854-.854a1 1 0 010-1.414z" clipRule="evenodd" />
          </svg>
          {error}
        </div>
        <button
          onClick={() => window.location.reload()}
          className="px-4 py-2 bg-emerald-500 text-white rounded hover:bg-emerald-600"
        >
          Coba Lagi
        </button>
      </div>
    );
  }

  if (!shippingData) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-gray-50">
        <p className="text-gray-500">Data pengiriman tidak ditemukan.</p>
      </div>
    );
  }

  const formatDate = (date) => date.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
  const formatTime = (date) => date.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });

  const isDipersiapkanCompleted = ['Perlu Dikirim', 'Dikirim', 'Selesai'].includes(shippingData.statusPengiriman);
  const isDikirimCompleted = ['Dikirim', 'Selesai'].includes(shippingData.statusPengiriman);
  const isSelesaiCompleted = shippingData.statusPengiriman === 'Selesai';

  return (
    <div className="flex min-h-screen bg-gray-50">
      <SidebarProdusen isCollapsed={isCollapsed} setIsCollapsed={setIsCollapsed} />
      <div className={`flex-1 flex flex-col transition-all duration-300 ${isCollapsed ? 'ml-16' : 'ml-64'}`}>
        <NavbarProdusen onLogout={handleLogout} />
        <main className="pt-16 p-6">
          <div className="max-w-4xl mx-auto">
            <div className="flex items-center mb-6">
              <button
                onClick={() => navigate('/produsen/pengelolaan-pengiriman')}
                className="flex items-center gap-2 text-gray-600 hover:text-gray-900"
              >
                <ArrowLeft size={18} /> Kembali
              </button>
              {shippingData.statusPengiriman === 'Perlu Dikirim' && (
                <Link
                  to={`/produsen/rincian-pengiriman/${id}`}
                  className="ml-4 px-4 py-2 bg-emerald-500 text-white rounded hover:bg-emerald-600"
                >
                  Atur Pengiriman
                </Link>
              )}
            </div>

            <div className="bg-white p-8 rounded-lg shadow-lg border border-gray-200">
              <header className="mb-8">
                <h1 className="text-2xl font-bold text-gray-800">Lacak Pengiriman</h1>
                <p className="text-gray-500">Lihat Proses Pengiriman</p>
              </header>
              <section className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-12">
                <div>
                  <p className="text-sm text-gray-500">No Resi</p>
                  <div className="flex items-center gap-2">
                    <p className="font-semibold text-lg">{shippingData.noResi}</p>
                    <button
                      onClick={() => copyToClipboard(shippingData.noResi)}
                      className="text-gray-400 hover:text-emerald-600"
                    >
                      <ClipboardCopy size={16} />
                    </button>
                  </div>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Pengirim</p>
                  <p className="font-semibold text-lg">{shippingData.pengirim}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Waktu Pesan</p>
                  <p className="font-semibold text-lg">{formatDate(shippingData.waktuPesan)}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">ID Pesanan</p>
                  <p className="font-semibold text-lg">{shippingData.idPesanan}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">No Surat Jalan</p>
                  <p className="font-semibold text-lg">{shippingData.noSuratJalan}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Tujuan</p>
                  <p className="font-semibold text-lg">{shippingData.tujuan}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Estimasi Sampai</p>
                  <p className="font-semibold text-lg">{formatDate(shippingData.estimasiSampai)}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Opsi Pengiriman</p>
                  <p className="font-semibold text-lg">{shippingData.opsiPengiriman}</p>
                </div>
              </section>

              <section className="flex justify-center py-6">
                <StatusStep
                  icon={<Package size={24} />}
                  label="Dipersiapkan"
                  timestamp={isDipersiapkanCompleted ? formatDate(shippingData.waktuPesan) : null}
                  isCompleted={isDipersiapkanCompleted}
                />
                <StatusStep
                  icon={<Truck size={24} />}
                  label="Dikirim"
                  timestamp={isDikirimCompleted ? `${formatDate(shippingData.tanggalPengiriman)} ${shippingData.waktuPengiriman}` : null}
                  isCompleted={isDikirimCompleted}
                />
                <StatusStep
                  icon={<CheckCircle size={24} />}
                  label="Selesai"
                  timestamp={isSelesaiCompleted ? formatDate(shippingData.estimasiSampai) : null}
                  isCompleted={isSelesaiCompleted}
                  isLast={true}
                />
              </section>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default LihatStatus;