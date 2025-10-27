import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import NavbarApotek from '../../../components/NavbarApotek';
import { ArrowLeft, Camera, CheckCircle, Package, Truck, Loader2, Download, X } from 'lucide-react';
import axios from 'axios';
import html2pdf from 'html2pdf.js';

const ConfirmationModal = ({ show, onClose, onConfirm, isSubmitting, orderId, onFileChange, buktiFoto }) => {
  if (!show) return null;
  return (
    <div className="fixed inset-0 z-50 flex justify-center items-center p-4 bg-slate-900/20 backdrop-blur-sm">
      <div className="bg-white p-6 rounded-2xl shadow-xl max-w-sm w-full border">
        <div className="flex justify-between items-center pb-3 border-b">
          <h3 className="text-lg font-semibold text-slate-800">Konfirmasi Penerimaan</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 rounded-full p-1"><X size={20} /></button>
        </div>
        <div className="text-center pt-5">
          <CheckCircle size={48} className="text-emerald-500 mx-auto mb-4" />
          <p className="text-slate-600 mb-5 text-sm">Anda akan mengkonfirmasi penerimaan pesanan: <br /><strong className="text-base text-slate-800">{orderId}</strong></p>
          <div className="mb-6">
            <label htmlFor="buktiFoto" className="relative flex items-center justify-center w-32 h-32 bg-slate-100 border-2 border-dashed border-slate-300 rounded-lg cursor-pointer hover:border-emerald-500 mx-auto">
              {buktiFoto ? <img src={URL.createObjectURL(buktiFoto)} alt="Preview" className="w-full h-full object-cover rounded-lg" /> : <div className="text-center text-slate-500"><Camera size={24} className="mx-auto" /><p className="text-xs mt-2">Unggah Bukti Foto</p></div>}
              <input id="buktiFoto" type="file" accept="image/jpeg,image/png" onChange={onFileChange} className="hidden" />
            </label>
            {buktiFoto && <p className="text-xs text-slate-500 mt-2">{buktiFoto.name}</p>}
          </div>
          <div className="flex justify-end gap-3">
            <button onClick={onClose} className="py-2 px-4 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 font-semibold" disabled={isSubmitting}>Batal</button>
            <button onClick={onConfirm} className="py-2 px-4 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 flex items-center gap-2 font-semibold disabled:bg-emerald-300" disabled={isSubmitting || !buktiFoto}>
              {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
              {isSubmitting ? 'Memproses...' : 'Ya, Konfirmasi'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

const StatusStep = ({ icon, label, timestamp, isCompleted, isLast = false }) => (
    <div className="flex items-center">
      <div className={`flex flex-col items-center text-center ${isLast ? '' : 'flex-1'}`}>
        <div className={`w-12 h-12 rounded-full flex items-center justify-center transition-colors duration-300 ${isCompleted ? 'bg-emerald-500 text-white' : 'bg-slate-200 text-slate-500'}`}>{icon}</div>
        <div className="mt-2 w-24">
          <p className={`font-semibold text-sm transition-colors duration-300 ${isCompleted ? 'text-slate-800' : 'text-slate-500'}`}>{label}</p>
          {timestamp && <p className="text-xs text-slate-500 mt-1">{timestamp}</p>}
        </div>
      </div>
      {!isLast && (<div className={`flex-1 h-1 mx-4 transition-colors duration-500 ${isCompleted ? 'bg-emerald-500' : 'bg-slate-200'}`} />)}
    </div>
);

const KonfirmasiPenerimaanApotek = () => {
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
            try {
                const token = localStorage.getItem('token');
                const response = await axios.get(`http://localhost:5000/api/apotek/pesanan/${id}`, {
                    headers: { Authorization: `Bearer ${token}` },
                });
                setPesanan(response.data.data);
            } catch (err) {
                setError(err.response?.data?.message || 'Gagal memuat data.');
            } finally {
                setIsLoading(false);
            }
        };
        fetchData();
    }, [id]);

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file && file.size > 5 * 1024 * 1024) {
            alert('Ukuran file maksimal 5MB.');
            return;
        }
        setBuktiFoto(file);
    };

    const handleConfirm = async () => {
        if (!buktiFoto) return;
        setIsSubmitting(true);
        const formData = new FormData();
        formData.append('buktiFoto', buktiFoto);

        try {
            const token = localStorage.getItem('token');
            const response = await axios.put(`http://localhost:5000/api/apotek/penerimaan/konfirmasi/${id}`, formData, {
                headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'multipart/form-data' },
            });

            if (response.data.success) {
                alert('Penerimaan berhasil dikonfirmasi!');
                navigate('/apotek/pesan-obat');
            } else {
                throw new Error(response.data.message || 'Gagal konfirmasi');
            }
        } catch (err) {
            alert('Gagal konfirmasi: ' + (err.response?.data?.message || err.message));
        } finally {
            setIsSubmitting(false);
            setShowConfirmModal(false);
        }
    };
    
    const handleDownloadPDF = () => {
        const element = contentRef.current;
        html2pdf().from(element).set({ margin: 10, filename: `konfirmasi_penerimaan_apotek_${pesanan?.pesanan?.id}.pdf` }).save();
    };

    const formatDate = (dateString) => dateString ? new Date(dateString).toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' }) : '-';

    if (isLoading) return <div className="p-6 text-center">Memuat...</div>;
    if (error) return <div className="p-6 text-center text-red-500">{error}</div>;
    if (!pesanan) return <div className="p-6 text-center">Data tidak ditemukan.</div>;

    const { pesanan: info, detail_pesanan: detail } = pesanan;

    return (
        <div className="flex min-h-screen bg-slate-50">
            <div className={`flex-1 flex flex-col transition-all duration-300 ${isCollapsed ? 'ml-16' : 'ml-64'}`}>
                <NavbarApotek onLogout={() => { localStorage.clear(); navigate('/'); }} />
                <main className="pt-16 p-6">
                    <div className="max-w-4xl mx-auto">
                        <div className="flex justify-between items-center mb-6">
                            <button onClick={() => navigate('/apotek/pesan-obat')} className="flex items-center gap-2 text-slate-600 hover:text-slate-900 font-semibold">
                                <ArrowLeft size={18} /> Kembali
                            </button>
                            <button onClick={handleDownloadPDF} className="flex items-center gap-2 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 font-semibold">
                                <Download size={18} /> Unduh PDF
                            </button>
                        </div>
                        <div ref={contentRef} className="bg-white p-8 rounded-lg shadow-md border">
                            <header className="text-center mb-8 border-b pb-4">
                                <h1 className="text-3xl font-bold text-slate-800">Konfirmasi Penerimaan</h1>
                                <p className="text-slate-500 mt-1">Nomor Pesanan: {info.nomor_pesanan}</p>
                            </header>
                            <section className="grid md:grid-cols-2 gap-8 mb-8">
                                <div>
                                    <h2 className="font-semibold text-slate-600 mb-2">Dikirim Dari (PBF):</h2>
                                    <p className="font-bold text-slate-800">{info.nama_pbf}</p>
                                    <p className="text-sm text-slate-600">{info.alamat_pbf}</p>
                                </div>
                                <div className="text-left md:text-right">
                                    <h2 className="font-semibold text-slate-600 mb-2">Diterima Oleh (Apotek):</h2>
                                    <p className="font-bold text-slate-800">{info.nama_apotek}</p>
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
                                                    <td className="p-3 text-right">{item.jumlah}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                                <div className="flex justify-end mt-4">
                                    <div className="text-right">
                                        <p className="text-sm text-slate-500">Total Harga</p>
                                        <p className="text-xl font-bold text-slate-800">
                                            {new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(info.total_harga)}
                                        </p>
                                    </div>
                                </div>
                            </section>
                            <section className="mb-8">
                                <h2 className="text-xl font-bold text-slate-800 mb-6 text-center">Status Pengiriman</h2>
                                <div className="flex justify-center">
                                    <StatusStep icon={<Package size={24} />} label="Dipersiapkan" timestamp={formatDate(info.tanggal_pesanan)} isCompleted={true} />
                                    <StatusStep icon={<Truck size={24} />} label="Dikirim" timestamp={formatDate(info.tanggal_pengiriman)} isCompleted={true} />
                                    <StatusStep icon={<CheckCircle size={24} />} label="Diterima" isCompleted={false} isLast={true} />
                                </div>
                            </section>
                            <div className="flex justify-end mt-8 border-t pt-6">
                                <button onClick={() => setShowConfirmModal(true)} className="py-2.5 px-6 bg-emerald-600 text-white font-semibold rounded-lg hover:bg-emerald-700 flex items-center gap-2">
                                    <CheckCircle size={18} /> Konfirmasi Penerimaan
                                </button>
                            </div>
                        </div>
                    </div>
                </main>
                <ConfirmationModal show={showConfirmModal} onClose={() => setShowConfirmModal(false)} onConfirm={handleConfirm} isSubmitting={isSubmitting} orderId={info.nomor_pesanan} onFileChange={handleFileChange} buktiFoto={buktiFoto} />
            </div>
        </div>
    );
};

export default KonfirmasiPenerimaanApotek;