import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import SidebarPbf from '../../../components/SidebarPbf';
import NavbarPbf from '../../../components/NavbarPbf';
import { ArrowLeft, Camera, CheckCircle, Package, Truck, Loader2, Download, X } from 'lucide-react';
import html2pdf from 'html2pdf.js';
import axios from 'axios';

// Komponen Modal Konfirmasi
const ConfirmationModal = ({ show, onClose, onConfirm, isSubmitting, orderId, onFileChange, buktiFoto }) => {
  if (!show) return null;
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center p-4">
      <div className="bg-white p-6 rounded-lg shadow-xl max-w-sm w-full">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold text-gray-800">Konfirmasi Penerimaan</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X size={24} /></button>
        </div>
        <div className="text-center">
          <CheckCircle size={48} className="text-emerald-500 mx-auto mb-4" />
          <p className="text-gray-600 mb-4">
            Anda akan mengkonfirmasi penerimaan pesanan ID: <strong>{String(orderId).padStart(6, '0')}</strong>. Unggah foto bukti penerimaan.
          </p>
          <div className="mb-4">
            <label htmlFor="buktiFoto" className="flex items-center justify-center w-32 h-32 bg-gray-100 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-emerald-500 transition mx-auto">
              {buktiFoto ? (
                <img src={URL.createObjectURL(buktiFoto)} alt="Bukti Foto" className="w-full h-full object-cover rounded-lg" />
              ) : (
                <div className="text-center text-gray-500">
                  <Camera size={24} />
                  <p className="text-sm mt-2">Unggah Foto</p>
                </div>
              )}
              <input id="buktiFoto" type="file" accept="image/*" onChange={onFileChange} className="hidden" />
            </label>
          </div>
          <div className="flex justify-end gap-4">
            <button onClick={onClose} className="py-2 px-4 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200" disabled={isSubmitting}>
              Batal
            </button>
            <button
              onClick={onConfirm}
              className="py-2 px-4 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 flex items-center gap-2 disabled:bg-emerald-300"
              disabled={isSubmitting || !buktiFoto}
            >
              {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
              {isSubmitting ? 'Memproses...' : 'Ya, Konfirmasi'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// Komponen StatusStep
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

const KonfirmasiPenerimaan = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [pesanan, setPesanan] = useState(null);
  const [buktiFoto, setBuktiFoto] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
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
    const file = e.target.files[0];
    if (file && file.size > 5 * 1024 * 1024) {
      alert('Ukuran file tidak boleh melebihi 5MB.');
      return;
    }
    if (file && !['image/jpeg', 'image/png', 'image/jpg'].includes(file.type)) {
      alert('Hanya file JPG, PNG, atau JPEG yang diizinkan.');
      return;
    }
    setBuktiFoto(file);
  };

  const handleOpenConfirmModal = () => {
    setShowConfirmModal(true);
  };

  const handleCloseConfirmModal = () => {
    setShowConfirmModal(false);
    setBuktiFoto(null);
  };

  const handleConfirm = async () => {
    if (!buktiFoto) {
      alert('Bukti foto wajib diunggah sebelum konfirmasi.');
      return;
    }
    setIsSubmitting(true);
    setError(null);
    const formData = new FormData();
    formData.append('buktiFoto', buktiFoto);

    try {
      const token = localStorage.getItem('token');
      const response = await axios.put(
        `http://localhost:5000/api/pbf/penerimaan/${id}/konfirmasi`,
        formData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'multipart/form-data',
          },
        }
      );

      if (response.data.success) {
        alert('Pesanan berhasil dikonfirmasi dan diarsipkan di blockchain.');
        navigate('/pbf/pesan-obat');
      } else {
        throw new Error(response.data.message);
      }
    } catch (err) {
      console.error('Error in handleConfirm:', err);
      setError(err.response?.data?.message || 'Gagal mengkonfirmasi pesanan. Pastikan server berjalan di localhost:5000.');
      alert(err.response?.data?.message || 'Gagal mengkonfirmasi pesanan. Pastikan server berjalan di localhost:5000.');
    } finally {
      setIsSubmitting(false);
      setShowConfirmModal(false);
      setBuktiFoto(null);
    }
  };

  const handleDownloadPDF = () => {
    const element = contentRef.current;
    html2pdf().from(element).set({ margin: 10, filename: `konfirmasi_penerimaan_${pesanan?.pesanan?.id}.pdf` }).save();
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
  if (!pesanan || !pesanan.pesanan) return <div className="p-6 text-center">Data tidak ditemukan.</div>;

  const { pesanan: info, detail_pesanan: detail } = pesanan;
  
  const totalHargaKeseluruhan = detail.reduce((acc, item) => acc + (Number(item.total_harga) || 0), 0);
  const tanggalPengiriman = info.tanggal_pengiriman ? new Date(info.tanggal_pengiriman) : null;
  const estimasiSampai = tanggalPengiriman ? new Date(new Date(tanggalPengiriman).setDate(tanggalPengiriman.getDate() + (info.opsi_pengiriman === 'ekspres' ? 1 : 3))) : null;

  const isDipersiapkanCompleted = ['Dipesan', 'Perlu Dikirim', 'Dikirim', 'Selesai'].includes(info.status);
  const isDikirimCompleted = ['Dikirim', 'Selesai'].includes(info.status);
  const isSelesaiCompleted = info.status === 'Selesai';

  return (
    <div className="flex min-h-screen bg-gray-50">
      <SidebarPbf isCollapsed={isCollapsed} setIsCollapsed={setIsCollapsed} />
      <div className={`flex-1 flex flex-col transition-all duration-300 ${isCollapsed ? 'ml-16' : 'ml-64'}`}>
        <NavbarPbf onLogout={() => { localStorage.clear(); navigate('/'); }} />
        <main className="pt-16 p-6">
          <div className="max-w-4xl mx-auto">
            <div className="flex justify-between items-center mb-6">
              <button onClick={() => navigate('/pbf/pesan-obat')} className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition">
                <ArrowLeft size={18} /> Kembali
              </button>
              <button onClick={handleDownloadPDF} className="flex items-center gap-2 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition">
                <Download size={18} /> Unduh PDF
              </button>
            </div>

            <div ref={contentRef} className="bg-white p-8 md:p-12 rounded-lg shadow-lg border border-gray-200">
              <header className="text-center mb-8 border-b pb-4">
                <h1 className="text-2xl font-bold text-gray-800">Konfirmasi Penerimaan Pesanan</h1>
                <p className="text-gray-500">Nomor PO: {info.nomor_po}</p>
              </header>
              <section className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
                <div>
                  <h2 className="font-semibold text-gray-600 mb-2">Pemesan:</h2>
                  <p className="font-bold">{info.nama_pbf}</p>
                  <p className="text-sm text-gray-600">{info.alamat_pbf}</p>
                </div>
                <div className="text-left md:text-right">
                  <h2 className="font-semibold text-gray-600 mb-2">Pengirim:</h2>
                  <p className="font-bold">{info.nama_produsen || 'Produsen'}</p>
                  <p className="text-sm text-gray-600">Tanggal Pesan: {formatDate(info.tanggal_pesanan)}</p>
                </div>
              </section>
              <section className="mb-8">
                <h2 className="text-xl font-bold text-gray-800 mb-4 border-b pb-2">Daftar Produk</h2>
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="p-3 text-sm font-semibold text-gray-700 border">No.</th>
                        <th className="p-3 text-sm font-semibold text-gray-700 border">Nama Obat</th>
                        <th className="p-3 text-sm font-semibold text-gray-700 border">Jumlah</th>
                      </tr>
                    </thead>
                    <tbody>
                      {detail.map((item, index) => (
                        <tr key={item.id}>
                          <td className="p-3 border">{index + 1}</td>
                          <td className="p-3 border">{item.nama_obat}</td>
                          <td className="p-3 border">{item.jumlah_pesanan}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </section>
              <section className="mb-8">
                <h2 className="text-xl font-bold text-gray-800 mb-4 border-b pb-2">Status Pengiriman</h2>
                <div className="flex justify-center py-6">
                  <StatusStep
                    icon={<Package size={24} />}
                    label="Dipersiapkan"
                    timestamp={isDipersiapkanCompleted ? formatDate(info.tanggal_pesanan) : null}
                    isCompleted={isDipersiapkanCompleted}
                  />
                  <StatusStep
                    icon={<Truck size={24} />}
                    label="Dikirim"
                    timestamp={isDikirimCompleted ? formatDate(tanggalPengiriman) : null}
                    isCompleted={isDikirimCompleted}
                  />
                  <StatusStep
                    icon={<CheckCircle size={24} />}
                    label="Selesai"
                    timestamp={isSelesaiCompleted ? formatDate(estimasiSampai) : null}
                    isCompleted={isSelesaiCompleted}
                    isLast={true}
                  />
                </div>
              </section>

              <div className="flex justify-end items-center gap-4 pt-6 border-t">
                {info.status === 'Dikirim' && (
                  <>
                    <Link
                      to={`/pbf/pesanan/${id}/ajukan-pengembalian`}
                      className="py-2 px-6 bg-red-600 text-white font-semibold rounded-lg hover:bg-red-700 transition"
                    >
                      Ajukan Pengembalian
                    </Link>
                    <button
                      onClick={handleOpenConfirmModal}
                      className="py-2 px-6 bg-emerald-600 text-white font-semibold rounded-lg hover:bg-emerald-700 flex items-center gap-2 disabled:bg-emerald-300"
                      disabled={isSubmitting}
                    >
                      {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
                      {isSubmitting ? 'Memproses...' : 'Konfirmasi Penerimaan'}
                    </button>
                  </>
                )}
                {info.status === 'Selesai' && (
                  <Link
                    to={`/pbf/pesanan/${id}/ajukan-pengembalian`}
                    className="py-2 px-6 bg-red-600 text-white font-semibold rounded-lg hover:bg-red-700 transition"
                  >
                    Ajukan Pengembalian
                  </Link>
                )}
              </div>
            </div>

            <ConfirmationModal
              show={showConfirmModal}
              onClose={handleCloseConfirmModal}
              onConfirm={handleConfirm}
              isSubmitting={isSubmitting}
              orderId={id}
              onFileChange={handleFileChange}
              buktiFoto={buktiFoto}
            />
          </div>
        </main>
      </div>
    </div>
  );
};

export default KonfirmasiPenerimaan;