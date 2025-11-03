import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import NavbarApotek from '../../../components/NavbarApotek';
import { 
    AlertCircle, 
    Loader2, 
    ArrowLeft, 
    XCircle, 
    Check, 
    Package,
    Undo2, // Ikon Pengembalian
    Camera,
    FileText,
    Info,
    Upload, // Ikon Upload
    Edit,
    AlertTriangle
} from 'lucide-react';
import axios from 'axios';
import { toast } from 'react-hot-toast';

const AjukanPengembalianApotek = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const username = localStorage.getItem('username');

  // Daftar alasan (bisa disesuaikan)
  const reasonsList = [
    { id: 'rusak', label: 'Produk rusak saat diterima', icon: <AlertTriangle /> },
    { id: 'salah_produk', label: 'Produk tidak sesuai pesanan (salah kirim)', icon: <Package /> },
    { id: 'jumlah_kurang', label: 'Jumlah produk tidak sesuai', icon: <Info /> },
    { id: 'lainnya', label: 'Lainnya (jelaskan di catatan)', icon: <Edit /> },
  ];

  const [selectedReason, setSelectedReason] = useState(null);
  const [catatanLainnya, setCatatanLainnya] = useState('');
  const [buktiFoto, setBuktiFoto] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [error, setError] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);


  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        toast.error('Ukuran file tidak boleh melebihi 5MB.');
        e.target.value = null;
        return;
      }
      if (!['image/jpeg', 'image/png'].includes(file.type)) {
        toast.error('Hanya file JPG atau PNG yang diizinkan.');
        e.target.value = null;
        return;
      }
      setBuktiFoto(file);
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    toast.dismiss();

    const alasanFinal = selectedReason === 'Lainnya (jelaskan di catatan)' ? catatanLainnya : selectedReason;

    if (!alasanFinal || alasanFinal.trim() === '') {
      const msg = 'Anda harus memilih alasan pengembalian (atau mengisinya jika memilih "Lainnya").';
      setError(msg);
      toast.error(msg);
      return;
    }
    if (!buktiFoto) {
      const msg = 'Anda harus mengunggah bukti foto.';
      setError(msg);
      toast.error(msg);
      return;
    }

    setIsSubmitting(true);
    const toastId = toast.loading('Mengajukan pengembalian...');

    const formData = new FormData();
    formData.append('alasan', alasanFinal);
    // Nama field ini ("buktiFotoPengembalian") HARUS sama dengan di multer (pengembalianRoute.js)
    formData.append('buktiFotoPengembalian', buktiFoto); 

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Sesi tidak valid. Silakan login ulang.');
      }

      // --- PERBAIKAN ENDPOINT DI SINI ---
      // Panggil endpoint baru yang telah Anda buat
      const response = await axios.put(`http://localhost:5000/api/apotek/pengembalian/${id}`, formData, {
        headers: { 
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'multipart/form-data'
        },
      });
      // --- AKHIR PERBAIKAN ---

      if (!response.data.success) {
        throw new Error(response.data.message || 'Gagal terhubung ke server.');
      }

      toast.success('Pengajuan pengembalian berhasil dikirim.', { id: toastId });
      navigate('/apotek/pesan-obat/pengembalian'); // Arahkan ke tab pengembalian

    } catch (err) {
      const errorMsg = err.response?.data?.message || err.message;
      setError(errorMsg);
      toast.error(errorMsg, { id: toastId });
      if (err.response?.status === 401) {
        navigate('/login/apotek');
      }
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const handleLogout = () => {
    localStorage.clear();
    navigate('/');
  };

  return (
    <div className="flex min-h-screen bg-slate-50">
      <div className="flex-1 flex flex-col">
        <NavbarApotek onLogout={handleLogout} username={username} />
        
        <main className="flex-1 overflow-auto pt-[72px] px-4 sm:px-12 py-8">
          <div className="max-w-3xl mx-auto">
            
            {/* Header Halaman */}
            <div className="mb-10 relative">
              <div className="absolute -top-20 -left-20 w-72 h-72 bg-indigo-200 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob"></div>
              <div className="absolute -top-20 -right-20 w-72 h-72 bg-purple-200 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000"></div>

              <div className="relative">
                <button
                  onClick={() => navigate(-1)}
                  className="mb-4 inline-flex items-center text-emerald-600 hover:text-emerald-700 transition-colors text-sm font-medium"
                >
                  <ArrowLeft size={16} className="mr-1" /> Kembali
                </button>
                <div className="flex items-center gap-3">
                  <div className="flex items-center justify-center w-12 h-12 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl shadow-lg">
                    <Undo2 className="text-white" size={24} />
                  </div>
                  <div>
                    <h1 className="text-4xl font-bold bg-gradient-to-r from-slate-900 via-indigo-900 to-purple-900 bg-clip-text text-transparent">
                      Ajukan Pengembalian
                    </h1>
                    <p className="text-slate-600 text-lg mt-1">Pesanan ID: <span className="font-medium text-slate-700 font-mono">#{String(id).padStart(6, '0')}</span></p>
                  </div>
                </div>
              </div>
            </div>

            {error && (
              <div className="mb-6 p-4 bg-red-50 text-red-700 rounded-lg border border-red-200 flex items-center gap-3 text-sm">
                <AlertCircle className="h-5 w-5 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6 sm:p-8">
              <form onSubmit={handleSubmit}>
                <div className="space-y-6">
                  {/* Pilihan Alasan */}
                  <div>
                    <h3 className="text-lg font-semibold text-slate-800 mb-4">Pilih Alasan Pengembalian*</h3>
                    <div className="space-y-3">
                      {reasonsList.map((reason) => (
                        <label 
                          key={reason.id} 
                          htmlFor={reason.id} 
                          className={`flex items-center gap-4 p-4 rounded-lg border-2 cursor-pointer transition-all duration-200 ${
                            selectedReason === reason.label
                              ? 'bg-emerald-50 border-emerald-500 ring-2 ring-emerald-300'
                              : 'bg-white border-slate-200 hover:bg-slate-50 hover:border-slate-300'
                          }`}
                        >
                          <input
                            type="radio"
                            id={reason.id}
                            name="alasan_pengembalian"
                            value={reason.label}
                            checked={selectedReason === reason.label}
                            onChange={() => setSelectedReason(reason.label)}
                            className="h-4 w-4 text-emerald-600 border-slate-300 focus:ring-emerald-500"
                          />
                          <span className={`text-slate-500 ${selectedReason === reason.label ? 'text-emerald-600' : ''}`}>
                            {React.cloneElement(reason.icon, { size: 20 })}
                          </span>
                          <span className="text-sm font-medium text-slate-700">{reason.label}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  {/* Textarea untuk Alasan "Lainnya" */}
                  {selectedReason === 'Lainnya (jelaskan di catatan)' && (
                    <div className="animate-in fade-in duration-300">
                      <label htmlFor="catatanLainnya" className="block text-sm font-semibold text-slate-700 mb-2">Catatan Alasan Lainnya*</label>
                      <textarea
                        id="catatanLainnya"
                        value={catatanLainnya}
                        onChange={(e) => setCatatanLainnya(e.target.value)}
                        className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition resize-none"
                        rows={3}
                        placeholder="Jelaskan alasan pengembalian Anda di sini..."
                        required
                      />
                    </div>
                  )}

                  {/* Upload Bukti Foto */}
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">Unggah Bukti Foto*</label>
                    <label htmlFor="buktiFoto" className="relative flex flex-col items-center justify-center w-full min-h-[150px] bg-slate-50 border-2 border-dashed border-slate-300 rounded-lg cursor-pointer hover:border-emerald-500 transition-colors group p-4">
                      {previewUrl ? (
                        <img src={previewUrl} alt="Preview" className="w-auto h-auto max-h-48 object-contain rounded-lg" />
                      ) : (
                        <div className="text-center text-slate-500 group-hover:text-emerald-600 transition-colors">
                          <Upload size={32} className="mx-auto" />
                          <p className="text-sm mt-2 font-medium">Klik untuk mengunggah gambar</p>
                          <p className="text-xs text-slate-400 mt-1">JPG/PNG, Max 5MB</p>
                        </div>
                      )}
                      <input id="buktiFoto" type="file" accept="image/jpeg,image/png" onChange={handleFileChange} className="hidden" />
                    </label>
                    {buktiFoto && <p className="text-xs text-slate-500 mt-2 truncate">File terpilih: {buktiFoto.name}</p>}
                  </div>
                </div>

                {/* Tombol Aksi */}
                <div className="flex flex-col-reverse sm:flex-row justify-end gap-3 mt-10 pt-6 border-t border-slate-200">
                  <button
                    type="button"
                    onClick={() => navigate(-1)}
                    className="w-full sm:w-auto py-2.5 px-6 bg-slate-100 text-slate-700 font-semibold rounded-lg hover:bg-slate-200 transition"
                    disabled={isSubmitting}
                  >
                    Kembali
                  </button>
                  <button
                    type="submit"
                    className="w-full sm:w-auto py-2.5 px-6 bg-red-600 text-white font-semibold rounded-lg hover:bg-red-700 transition flex items-center justify-center gap-2 disabled:bg-red-300"
                    disabled={isSubmitting || !selectedReason || !buktiFoto}
                  >
                    {isSubmitting ? <Loader2 className="h-5 w-5 animate-spin" /> : <Undo2 size={18} />}
                    {isSubmitting ? 'Memproses...' : 'Ajukan Pengembalian'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </main>
      </div>
      
      <style jsx global>{`
         @keyframes blob {
          0%, 100% { transform: translate(0, 0) scale(1); }
          33% { transform: translate(30px, -50px) scale(1.1); }
          66% { transform: translate(-20px, 20px) scale(0.9); }
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

export default AjukanPengembalianApotek;