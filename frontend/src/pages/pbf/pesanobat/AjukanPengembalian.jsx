import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import SidebarPbf from '../../../components/SidebarPbf';
import NavbarPbf from '../../../components/NavbarPbf';
import { 
    Upload, 
    AlertCircle, 
    Loader2, 
    ArrowLeft, 
    FileText,
    Package, 
    X 
} from 'lucide-react';
import axios from 'axios';
import { toast } from 'react-hot-toast';

const AjukanPengembalian = () => {
  const navigate = useNavigate();
  const { id } = useParams(); 
  const [isCollapsed, setIsCollapsed] = useState(false);
  const username = localStorage.getItem('username'); 
  
  const [alasan, setAlasan] = useState('');
  const [foto, setFoto] = useState(null);
  const [previewFoto, setPreviewFoto] = useState('');
  const [isLoading, setIsLoading] = useState(false); 
  const [error, setError] = useState(null);

  const handleLogout = () => {
    localStorage.clear();
    navigate('/');
  };

  const handleFotoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) { 
        toast.error('Ukuran file tidak boleh melebihi 5MB.');
        return;
      }
      if (!['image/jpeg', 'image/png'].includes(file.type)) {
        toast.error('Hanya file JPG atau PNG yang diizinkan.');
        return;
      }
      setFoto(file);
      setPreviewFoto(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!alasan || !foto) {
      const errorMsg = 'Alasan dan foto bukti wajib diisi.';
      setError(errorMsg);
      toast.error(errorMsg);
      return;
    }
    
    setIsLoading(true);
    setError(null);

    const formData = new FormData();
    formData.append('alasan', alasan);
    formData.append('buktiFoto', foto);

    const promise = axios.post(
      `http://localhost:5000/api/pbf/pesanan/${id}/ajukan-pengembalian`,
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
      }
    );

    toast.promise(promise, {
        loading: 'Mengirim pengajuan...',
        success: (response) => {
            setIsLoading(false);

            navigate(`/pbf/pesanan/${id}/detail-pengembalian`, { 
                state: { 
                    idPesanan: id, 
                    alasan: alasan, 
                    
                } 
            });
            return 'Pengajuan pengembalian berhasil dikirim.';
        },
        error: (err) => {
            const errorMsg = err.response?.data?.message || err.message || 'Terjadi kesalahan';
            setError(errorMsg);
            setIsLoading(false);
            return errorMsg; 
        }
    });
  };

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-slate-50 via-white to-emerald-50">
      <SidebarPbf isCollapsed={isCollapsed} setIsCollapsed={setIsCollapsed} />
      <div className={`flex-1 flex flex-col transition-all duration-300 ${isCollapsed ? 'ml-16' : 'ml-64'}`}>
        <NavbarPbf onLogout={handleLogout} username={username} />
        
        <main className="flex-1 overflow-auto pt-[72px] px-12 py-8">
          <div className="max-w-4xl mx-auto">
            
            <button
              onClick={() => navigate(-1)} 
              className="mb-6 inline-flex items-center text-emerald-600 hover:text-emerald-700 transition-colors text-sm font-medium relative z-20"
            >
              <ArrowLeft size={16} className="mr-1" />
              Kembali
            </button>

            {/* Header Halaman */}
            <div className="mb-10 relative">
              <div className="absolute -top-20 -left-20 w-72 h-72 bg-emerald-200 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob"></div>
              <div className="absolute -top-20 -right-20 w-72 h-72 bg-emerald-200 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000"></div>

              <div className="relative flex items-center gap-3">
                 <div className="flex items-center justify-center w-12 h-12 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl shadow-lg">
                  <AlertCircle className="text-white" size={24} />
                </div>
                <div>
                  <h1 className="text-4xl font-bold bg-gradient-to-r from-slate-900 via-emerald-900 to-teal-900 bg-clip-text text-transparent">
                    Ajukan Pengembalian Barang
                  </h1>
                  <p className="text-slate-600 text-lg mt-1">Pesanan ID: <span className="font-mono font-medium text-slate-700">#{String(id).padStart(6, '0')}</span></p>
                </div>
              </div>
            </div>
            
            {/* Kartu Form */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
              <form onSubmit={handleSubmit}>
                {/* Header Kartu */}
                <div className="bg-slate-50 px-8 py-5 border-b border-slate-200">
                    <h2 className="text-lg font-semibold text-slate-800 flex items-center gap-2">
                        <FileText size={20} className="text-emerald-600" />
                        Formulir Pengajuan Pengembalian
                    </h2>
                    <p className="text-sm text-slate-500 mt-1">Isi detail alasan dan unggah bukti foto yang jelas.</p>
                </div>
                
                {/* Konten Form */}
                <div className="p-8 space-y-6">
                  {error && (
                    <div className="p-4 bg-red-50 text-red-700 rounded-lg border border-red-200 flex items-center gap-3 text-sm">
                      <AlertCircle className="h-5 w-5 flex-shrink-0" />
                      <span>{error}</span>
                    </div>
                  )}

                  <div>
                    <label htmlFor="alasan" className="block text-sm font-medium text-slate-700 mb-2">
                      Alasan Pengembalian <span className="text-red-500">*</span>
                    </label>
                    <textarea
                      id="alasan"
                      rows="4"
                      value={alasan}
                      onChange={(e) => setAlasan(e.target.value)}
                      className="w-full p-3 text-sm bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                      placeholder="Contoh: Paracetamol 1 box rusak segelnya dan 2 box penyok..."
                    ></textarea>
                    <p className="text-xs text-slate-500 mt-1">Jelaskan mengapa Anda ingin mengembalikan barang (misal: barang rusak, jumlah tidak sesuai, salah kirim).</p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Foto Bukti <span className="text-red-500">*</span>
                    </label>
                    <div className="mt-1 flex justify-center items-center w-full">
                      <label
                        htmlFor="file-upload"
                        className={`relative flex flex-col items-center justify-center w-full h-48 rounded-lg border-2 border-slate-300 border-dashed cursor-pointer transition-all
                                    ${previewFoto ? 'p-2 bg-slate-100' : 'bg-slate-50 hover:bg-slate-100'}`}
                      >
                        {previewFoto ? (
                          <img src={previewFoto} alt="Preview Bukti" className="h-full w-full object-contain rounded-md" />
                        ) : (
                          <div className="text-center text-slate-500">
                            <Upload className="mx-auto h-10 w-10 text-slate-400" />
                            <p className="mt-2 text-sm font-medium">Klik untuk <span className="text-emerald-600">unggah file</span></p>
                            <p className="text-xs text-slate-400 mt-1">PNG atau JPG (Maks. 5MB)</p>
                          </div>
                        )}
                         <input id="file-upload" name="foto" type="file" className="sr-only" onChange={handleFotoChange} accept="image/png, image/jpeg, image/jpg" />
                      </label>
                    </div>
                     {foto && !previewFoto && ( 
                        <p className="text-xs text-slate-500 mt-2">File dipilih: {foto.name}</p>
                     )}
                  </div>
                </div>

                {/* Footer Tombol Aksi */}
                <div className="flex justify-end items-center gap-3 p-6 bg-slate-50 border-t border-slate-200">
                  <button
                    type="button"
                    onClick={() => navigate(-1)}
                    className="py-2 px-5 bg-slate-100 text-slate-700 font-medium rounded-lg hover:bg-slate-200 transition text-sm"
                    disabled={isLoading}
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    className="py-2 px-5 bg-emerald-600 text-white font-medium rounded-lg hover:bg-emerald-700 transition flex items-center gap-2 text-sm disabled:bg-slate-400 disabled:cursor-not-allowed"
                    disabled={isLoading}
                  >
                    {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                    {isLoading ? 'Mengirim...' : 'Kirim Pengajuan'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </main>
      </div>
      
      {/* Animasi Blob (Dihapus) */}
    </div>
  );
};

export default AjukanPengembalian;
