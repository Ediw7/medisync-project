import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import SidebarPbf from '../../../components/SidebarPbf';
import NavbarPbf from '../../../components/NavbarPbf';
import { ArrowLeft, Camera, CheckCircle, Package, Truck, Loader2,Download} from 'lucide-react';
import html2pdf from 'html2pdf.js';
import axios from 'axios';

const KonfirmasiPenerimaan = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [pesanan, setPesanan] = useState(null);
  const [buktiFoto, setBuktiFoto] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const contentRef = useRef(null);

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const token = localStorage.getItem('token');
        if (!token) throw new Error('Silakan login terlebih dahulu');

        const response = await axios.get(`http://localhost:5000/api/pbf/pesanan/${id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (response.data.success) {
          setPesanan(response.data.data);
        } else {
          throw new Error(response.data.message || 'Data pesanan tidak ditemukan.');
        }
      } catch (err) {
        setError(err.response?.data?.message || err.message);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, [id, navigate]);

  const handleFileChange = (e) => {
    setBuktiFoto(e.target.files[0]);
  };

  const handleConfirm = async () => {
    if (!buktiFoto) {
      setError('Bukti foto wajib diunggah.');
      return;
    }

    setIsSubmitting(true);
    setError(null);
    const formData = new FormData();
    formData.append('buktiFoto', buktiFoto);
    formData.append('status', 'Selesai');

    try {
      const token = localStorage.getItem('token');
      const response = await axios.put(
        `http://localhost:5000/api/pbf/pesanan/${id}/status`,
        formData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'multipart/form-data',
          },
        }
      );

      if (response.data.success) {
        alert('Pesanan berhasil dikonfirmasi dan diarsipkan.');
        navigate('/pbf/pesan-obat');
      } else {
        throw new Error(response.data.message);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Gagal mengkonfirmasi pesanan.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDownloadPDF = () => {
    const element = contentRef.current;
    html2pdf()
      .from(element)
      .set({
        margin: [10, 10, 10, 10],
        filename: `konfirmasi_penerimaan_${pesanan?.id}.pdf`,
        html2canvas: { scale: 2 },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
      })
      .save();
  };

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('id-ID', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    });
  };

  if (isLoading) return <div className="p-6 text-center">Loading...</div>;
  if (error) return <div className="p-6 text-center text-red-500">Error: {error}</div>;
  if (!pesanan) return <div className="p-6 text-center">Data tidak ditemukan.</div>;

  const totalHargaKeseluruhan = pesanan.detail_pesanan.reduce((acc, item) => acc + (Number(item.total_harga) || 0), 0);
  const tanggalPengiriman = pesanan.tanggal_pengiriman ? new Date(pesanan.tanggal_pengiriman) : null;
  const estimasiSampai = tanggalPengiriman ? new Date(tanggalPengiriman.getTime() + (pesanan.opsi_pengiriman === 'ekspres' ? 1 : 3) * 24 * 60 * 60 * 1000) : null;

  const isDipersiapkanCompleted = ['Dipesan', 'Perlu Dikirim', 'Dikirim', 'Selesai'].includes(pesanan.status);
  const isDikirimCompleted = ['Dikirim', 'Selesai'].includes(pesanan.status);
  const isSelesaiCompleted = pesanan.status === 'Selesai';

  return (
    <div className="flex min-h-screen bg-gray-50">
      <SidebarPbf isCollapsed={isCollapsed} setIsCollapsed={setIsCollapsed} />
      <div className={`flex-1 flex flex-col transition-all duration-300 ${isCollapsed ? 'ml-16' : 'ml-64'}`}>
        <NavbarPbf onLogout={() => { localStorage.clear(); navigate('/'); }} />
        <main className="pt-16 p-6">
          <div className="max-w-4xl mx-auto">
            <div className="flex justify-between items-center mb-6">
              <button
                onClick={() => navigate('/pbf/pesan-obat')}
                className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition"
              >
                <ArrowLeft size={18} /> Kembali ke Daftar Pesanan
              </button>
              <button
                onClick={handleDownloadPDF}
                className="flex items-center gap-2 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition"
              >
                <Download size={18} /> Unduh PDF
              </button>
            </div>

            <div ref={contentRef} className="bg-white p-8 md:p-12 rounded-lg shadow-lg border border-gray-200">
              <header className="text-center mb-8 border-b pb-4">
                <h1 className="text-2xl font-bold text-gray-800">Konfirmasi Penerimaan Pesanan</h1>
                <p className="text-gray-500">Nomor PO: {pesanan.nomor_po}</p>
              </header>

              {/* Detail Pesanan */}
              <section className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
                <div>
                  <h2 className="font-semibold text-gray-600 mb-2">Pemesan:</h2>
                  <p className="font-bold">{pesanan.nama_pbf}</p>
                  <p className="text-sm text-gray-600">{pesanan.alamat_pbf}</p>
                  <p className="text-sm text-gray-600">Telp: {pesanan.kontak_telepon}</p>
                  <p className="text-sm text-gray-600">Email: {pesanan.kontak_email}</p>
                </div>
                <div className="text-left md:text-right">
                  <h2 className="font-semibold text-gray-600 mb-2">Pengirim:</h2>
                  <p className="font-bold">{pesanan.nama_produsen || 'Produsen'}</p>
                  <p className="text-sm text-gray-600">Tanggal Pesan: {formatDate(pesanan.tanggal_pesanan)}</p>
                  <p className="text-sm text-gray-600">Estimasi Sampai: {estimasiSampai ? formatDate(estimasiSampai) : '-'}</p>
                </div>
              </section>

              {/* Daftar Produk */}
              <section className="mb-8">
                <h2 className="text-xl font-bold text-gray-800 mb-4 border-b pb-2">Daftar Produk</h2>
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="p-3 text-sm font-semibold text-gray-700 border">No.</th>
                        <th className="p-3 text-sm font-semibold text-gray-700 border">Nama Obat</th>
                        <th className="p-3 text-sm font-semibold text-gray-700 border">Bentuk Sediaan</th>
                        <th className="p-3 text-sm font-semibold text-gray-700 border">Jumlah</th>
                        <th className="p-3 text-sm font-semibold text-gray-700 border">Harga Satuan</th>
                        <th className="p-3 text-sm font-semibold text-gray-700 border">Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      {pesanan.detail_pesanan.map((item, index) => (
                        <tr key={item.id} className="border-t">
                          <td className="p-3 border">{index + 1}</td>
                          <td className="p-3 border">{item.nama_obat}</td>
                          <td className="p-3 border">{item.bentuk_sediaan || '-'}</td>
                          <td className="p-3 border">{item.jumlah_pesanan}</td>
                          <td className="p-3 border text-right">Rp {Number(item.harga_per_unit || 0).toLocaleString('id-ID')}</td>
                          <td className="p-3 border text-right">Rp {Number(item.total_harga || 0).toLocaleString('id-ID')}</td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr className="bg-gray-50 font-semibold">
                        <td colSpan="5" className="p-3 text-right border">Total Harga Keseluruhan:</td>
                        <td className="p-3 text-right border">Rp {totalHargaKeseluruhan.toLocaleString('id-ID')}</td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </section>

              {/* Status Pengiriman */}
              <section className="mb-8">
                <h2 className="text-xl font-bold text-gray-800 mb-4 border-b pb-2">Status Pengiriman</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div>
                    <p className="text-sm text-gray-500">No Resi</p>
                    <p className="font-semibold text-lg">{pesanan.nomor_resi || '-'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">No Surat Jalan</p>
                    <p className="font-semibold text-lg">{pesanan.nomor_surat_jalan || 'Belum Dibuat'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Opsi Pengiriman</p>
                    <p className="font-semibold text-lg capitalize">{pesanan.opsi_pengiriman || '-'}</p>
                  </div>
                </div>
                <div className="flex justify-center py-6">
                  <StatusStep icon={<Package size={24} />} label="Dipersiapkan" timestamp={isDipersiapkanCompleted ? formatDate(pesanan.tanggal_pesanan) : null} isCompleted={isDipersiapkanCompleted} />
                  <StatusStep icon={<Truck size={24} />} label="Dikirim" timestamp={isDikirimCompleted ? `${formatDate(tanggalPengiriman)} ${pesanan.waktu_pengiriman || ''}` : null} isCompleted={isDikirimCompleted} />
                  <StatusStep icon={<CheckCircle size={24} />} label="Selesai" timestamp={isSelesaiCompleted ? formatDate(estimasiSampai) : null} isCompleted={isSelesaiCompleted} isLast={true} />
                </div>
              </section>

              {/* Unggah Bukti Foto */}
              <section className="mb-8">
                <h2 className="text-xl font-bold text-gray-800 mb-4 border-b pb-2">Konfirmasi Penerimaan</h2>
                <div className="space-y-4">
                  <p className="text-gray-600">Unggah foto bukti bahwa barang telah sampai untuk menyelesaikan pesanan ini.</p>
                  <div className="flex items-center gap-4">
                    <label
                      htmlFor="buktiFoto"
                      className="flex items-center justify-center w-32 h-32 bg-gray-100 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-emerald-500 transition"
                    >
                      {buktiFoto ? (
                        <img
                          src={URL.createObjectURL(buktiFoto)}
                          alt="Bukti Foto"
                          className="w-full h-full object-cover rounded-lg"
                        />
                      ) : (
                        <div className="text-center text-gray-500">
                          <Camera size={24} />
                          <p className="text-sm mt-2">Unggah Foto</p>
                        </div>
                      )}
                      <input
                        id="buktiFoto"
                        type="file"
                        accept="image/*"
                        onChange={handleFileChange}
                        className="hidden"
                      />
                    </label>
                  </div>
                  {error && <p className="text-red-500 text-sm">{error}</p>}
                </div>
              </section>

              {/* Tombol Aksi */}
              <div className="flex justify-end items-center gap-4 pt-6 border-t">
                <Link
                  to={`/pbf/pesanan/${id}/ajukan-pengembalian`}
                  className="py-2 px-6 bg-red-600 text-white font-semibold rounded-lg hover:bg-red-700 transition"
                >
                  Ajukan Pengembalian
                </Link>
                <button
                  onClick={handleConfirm}
                  className="py-2 px-6 bg-emerald-600 text-white font-semibold rounded-lg hover:bg-emerald-700 flex items-center gap-2 disabled:bg-emerald-300"
                  disabled={isSubmitting}
                >
                  {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
                  {isSubmitting ? 'Memproses...' : 'Konfirmasi Penerimaan'}
                </button>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

// Komponen StatusStep (diambil dari LihatStatus.jsx)
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
    {!isLast && <div className={`flex-1 h-1 mx-4 ${isCompleted ? 'bg-emerald-500' : 'bg-gray-200'}`} />}
  </div>
);

export default KonfirmasiPenerimaan;