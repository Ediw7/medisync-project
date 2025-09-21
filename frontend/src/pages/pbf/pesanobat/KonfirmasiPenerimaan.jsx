import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import SidebarPbf from '../../../components/SidebarPbf';
import NavbarPbf from '../../../components/NavbarPbf';
import { ArrowLeft, Camera, CheckCircle, Package, Truck, Loader2, Download, X } from 'lucide-react';
import html2pdf from 'html2pdf.js';
import axios from 'axios';

//================================================================//
// 1. KOMPONEN MODAL (didefinisikan di file yang sama)
//================================================================//
const ConfirmationModal = ({ show, onClose, onConfirm, isSubmitting, orderId, onFileChange, buktiFoto }) => {
  if (!show) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex justify-center items-center p-4 
                 bg-slate-900/20 backdrop-blur-sm animate-in fade-in-0"
    >
      <div
        className="bg-white p-6 rounded-2xl shadow-xl max-w-sm w-full border
                   animate-in fade-in-0 zoom-in-95"
      >
        <div className="flex justify-between items-center pb-3 border-b">
          <h3 className="text-lg font-semibold text-slate-800">Konfirmasi Penerimaan</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-colors rounded-full p-1">
            <X size={20} />
          </button>
        </div>
        <div className="text-center pt-5">
          <CheckCircle size={48} className="text-emerald-500 mx-auto mb-4" />
          <p className="text-slate-600 mb-5 text-sm">
            Anda akan mengkonfirmasi penerimaan pesanan ID: <br />
            <strong className="text-base text-slate-800">{String(orderId).padStart(6, '0')}</strong>
          </p>

          <div className="mb-6">
            <label
              htmlFor="buktiFoto"
              className="relative flex items-center justify-center w-32 h-32 bg-slate-100 border-2 
                         border-dashed border-slate-300 rounded-lg cursor-pointer 
                         hover:border-emerald-500 transition-colors mx-auto group"
            >
              {buktiFoto ? (
                <img src={URL.createObjectURL(buktiFoto)} alt="Preview Bukti Foto" className="w-full h-full object-cover rounded-lg" />
              ) : (
                <div className="text-center text-slate-500">
                  <Camera size={24} className="mx-auto" />
                  <p className="text-xs mt-2">Unggah Bukti Foto</p>
                </div>
              )}
              <input id="buktiFoto" type="file" accept="image/jpeg,image/png" onChange={onFileChange} className="hidden" />
            </label>
            {buktiFoto && <p className="text-xs text-slate-500 mt-2">{buktiFoto.name}</p>}
          </div>

          <div className="flex justify-end gap-3">
            <button
              onClick={onClose}
              className="py-2 px-4 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 transition-colors font-semibold"
              disabled={isSubmitting}
            >
              Batal
            </button>
            <button
              onClick={onConfirm}
              className="py-2 px-4 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 flex 
                         items-center gap-2 transition-colors font-semibold disabled:bg-emerald-300 disabled:cursor-not-allowed"
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

//================================================================//
// 2. KOMPONEN STATUS (didefinisikan di file yang sama)
//================================================================//
const StatusStep = ({ icon, label, timestamp, isCompleted, isLast = false }) => (
  <div className="flex items-center">
    <div className={`flex flex-col items-center text-center ${isLast ? '' : 'flex-1'}`}>
      <div
        className={`w-12 h-12 rounded-full flex items-center justify-center transition-colors duration-300
          ${isCompleted ? 'bg-emerald-500 text-white' : 'bg-slate-200 text-slate-500'}`}
      >
        {icon}
      </div>
      <div className="mt-2 w-24">
        <p className={`font-semibold text-sm transition-colors duration-300 ${isCompleted ? 'text-slate-800' : 'text-slate-500'}`}>
          {label}
        </p>
        {timestamp && <p className="text-xs text-slate-500 mt-1">{timestamp}</p>}
      </div>
    </div>
    {!isLast && (
      <div
        className={`flex-1 h-1 mx-4 transition-colors duration-500 ${isCompleted ? 'bg-emerald-500' : 'bg-slate-200'}`}
      />
    )}
  </div>
);

//================================================================//
// 3. KOMPONEN UTAMA HALAMAN
//================================================================//
const KonfirmasiPenerimaan = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  
  // --- STATE MANAGEMENT AND LOGIC FUNCTIONS ---
  // (Semua fungsi logika Anda tetap sama, tidak ada yang diubah)
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

  const handleOpenConfirmModal = () => setShowConfirmModal(true);
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
      setError(err.response?.data?.message || 'Gagal mengkonfirmasi pesanan.');
      alert(err.response?.data?.message || 'Gagal mengkonfirmasi pesanan.');
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
      day: '2-digit', month: 'long', year: 'numeric',
    });
  };

  // --- RENDER LOGIC ---
  if (isLoading) return <div className="p-6 text-center">Memuat data pesanan...</div>;
  if (error) return <div className="p-6 text-center text-red-500">Error: {error}</div>;
  if (!pesanan || !pesanan.pesanan) return <div className="p-6 text-center">Data tidak ditemukan.</div>;

  const { pesanan: info, detail_pesanan: detail } = pesanan;
  
  const isDipersiapkanCompleted = ['Dipesan', 'Perlu Dikirim', 'Dikirim', 'Selesai'].includes(info.status);
  const isDikirimCompleted = ['Dikirim', 'Selesai'].includes(info.status);
  const isSelesaiCompleted = info.status === 'Selesai';
  
  const tanggalPengiriman = info.tanggal_pengiriman ? new Date(info.tanggal_pengiriman) : null;
  const estimasiSampai = isSelesaiCompleted ? (info.updated_at ? new Date(info.updated_at) : null) : null;


  return (
    <div className="flex min-h-screen bg-slate-50">
      <SidebarPbf isCollapsed={isCollapsed} setIsCollapsed={setIsCollapsed} />
      <div className={`flex-1 flex flex-col transition-all duration-300 ${isCollapsed ? 'ml-16' : 'ml-64'}`}>
        <NavbarPbf onLogout={() => { localStorage.clear(); navigate('/'); }} />
        
        <main className="pt-16 p-4 md:p-6">
          <div className="max-w-4xl mx-auto">
            <div className="flex justify-between items-center mb-6">
              <button onClick={() => navigate('/pbf/pesan-obat')} className="flex items-center gap-2 text-slate-600 hover:text-slate-900 transition-colors font-semibold">
                <ArrowLeft size={18} /> Kembali
              </button>
              <button onClick={handleDownloadPDF} className="flex items-center gap-2 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors font-semibold">
                <Download size={18} /> Unduh PDF
              </button>
            </div>

            <div ref={contentRef} className="bg-white p-8 md:p-12 rounded-lg shadow-md border border-slate-200">
              <header className="text-center mb-8 border-b pb-4">
                <h1 className="text-3xl font-bold text-slate-800">Konfirmasi Penerimaan</h1>
                <p className="text-slate-500 mt-1">Nomor PO: {info.nomor_po}</p>
              </header>

              <section className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
                <div>
                  <h2 className="font-semibold text-slate-600 mb-2">Dipesan Oleh (PBF):</h2>
                  <p className="font-bold text-slate-800">{info.nama_pbf}</p>
                  <p className="text-sm text-slate-600">{info.alamat_pbf}</p>
                </div>
                <div className="text-left md:text-right">
                  <h2 className="font-semibold text-slate-600 mb-2">Dikirim Dari (Produsen):</h2>
                  <p className="font-bold text-slate-800">{info.nama_produsen || 'Produsen Medisync'}</p>
                  <p className="text-sm text-slate-600">Tanggal Pesan: {formatDate(info.tanggal_pesanan)}</p>
                </div>
              </section>

              <section className="mb-10">
                <h2 className="text-xl font-bold text-slate-800 mb-4">Daftar Produk</h2>
                <div className="overflow-x-auto border rounded-lg">
                  <table className="w-full text-left">
                    <thead className="bg-slate-50">
                      <tr>
                        <th className="p-3 text-sm font-semibold text-slate-600">No.</th>
                        <th className="p-3 text-sm font-semibold text-slate-600">Nama Obat</th>
                        <th className="p-3 text-sm font-semibold text-slate-600 text-right">Jumlah</th>
                      </tr>
                    </thead>
                    <tbody>
                      {detail.map((item, index) => (
                        <tr key={item.id} className="border-t">
                          <td className="p-3">{index + 1}</td>
                          <td className="p-3 font-medium text-slate-700">{item.nama_obat}</td>
                          <td className="p-3 text-right">{item.jumlah_pesanan}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                
                {/* --- PERBAIKAN --- */}
                <div className="flex justify-end mt-4">
                  <div className="text-right">
                    <p className="text-sm text-slate-500">Total Harga</p>
                    <p className="text-xl font-bold text-slate-800">
                      {/* Mengambil total harga langsung dari info pesanan */}
                      {new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(info.total_harga)}
                    </p>
                  </div>
                </div>
                {/* --- AKHIR PERBAIKAN --- */}
              
              </section>
              
              <section className="mb-8">
                <h2 className="text-xl font-bold text-slate-800 mb-6 text-center">Status Pengiriman</h2>
                <div className="flex justify-center">
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
                    label="Diterima"
                    timestamp={isSelesaiCompleted ? formatDate(estimasiSampai) : null}
                    isCompleted={isSelesaiCompleted}
                    isLast={true}
                  />
                </div>
              </section>
              
              <div className="flex justify-end items-center gap-4 pt-6 border-t mt-8">
                {info.status === 'Dikirim' && (
                  <>
                    <Link
                      to={`/pbf/pesanan/${id}/ajukan-pengembalian`}
                      className="py-2.5 px-6 bg-red-600 text-white font-semibold rounded-lg hover:bg-red-700 transition-transform active:scale-95"
                    >
                      Ajukan Pengembalian
                    </Link>
                    <button
                      onClick={handleOpenConfirmModal}
                      className="py-2.5 px-6 bg-emerald-600 text-white font-semibold rounded-lg hover:bg-emerald-700 flex items-center gap-2 transition-transform active:scale-95 disabled:bg-emerald-300"
                      disabled={isSubmitting}
                    >
                      <CheckCircle size={18} />
                      Konfirmasi Penerimaan
                    </button>
                  </>
                )}
                {info.status === 'Selesai' && (
                  <Link
                    to={`/pbf/pesanan/${id}/ajukan-pengembalian`}
                    className="py-2.5 px-6 bg-red-600 text-white font-semibold rounded-lg hover:bg-red-700 transition-transform active:scale-95"
                  >
                    Ajukan Pengembalian
                  </Link>
                )}
              </div>
            </div>
          </div>
        </main>

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
    </div>
  );
};

export default KonfirmasiPenerimaan;