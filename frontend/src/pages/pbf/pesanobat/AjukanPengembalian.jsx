// frontend/src/pages/pbf/pesanobat/AjukanPengembalian.jsx

import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import SidebarPbf from '../../../components/SidebarPbf';
import NavbarPbf from '../../../components/NavbarPbf';
import { Upload, AlertCircle } from 'lucide-react';
import axios from 'axios';

const AjukanPengembalian = () => {
  const navigate = useNavigate();
  const { id } = useParams(); // ID Pesanan
  const [isCollapsed, setIsCollapsed] = useState(false);
  
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
      setFoto(file);
      setPreviewFoto(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!alasan || !foto) {
      setError('Alasan dan foto bukti wajib diisi.');
      return;
    }
    
    setIsLoading(true);
    setError(null);

    // Kita gunakan FormData karena ada file upload
    const formData = new FormData();
    formData.append('alasan', alasan);
    formData.append('buktiFoto', foto); // 'buktiFoto' harus sama dengan di backend multer

    try {
      const token = localStorage.getItem('token');
      // Pastikan backend Anda memiliki endpoint ini
      const response = await axios.post(
        `http://localhost:5000/api/pbf/pesanan/${id}/ajukan-pengembalian`,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
            'Authorization': `Bearer ${token}`
          },
        }
      );

      if (response.data.success) {
        alert('Pengajuan pengembalian berhasil dikirim.');
        navigate('/pbf/pesan-obat'); // Kembali ke daftar pesanan
      } else {
        throw new Error(response.data.message || 'Gagal mengajukan pengembalian');
      }
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Terjadi kesalahan');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-gray-100">
      <SidebarPbf isCollapsed={isCollapsed} setIsCollapsed={setIsCollapsed} />
      <div className={`flex-1 flex flex-col transition-all duration-300 ${isCollapsed ? 'ml-16' : 'ml-64'}`}>
        <NavbarPbf onLogout={handleLogout} />
        <main className="flex-1 pt-16 p-6">
          <h1 className="text-3xl font-bold text-gray-800 mb-6">Ajukan Pengembalian Barang</h1>
          
          <div className="max-w-2xl mx-auto bg-white p-8 rounded-lg shadow-sm border border-gray-200">
            <form onSubmit={handleSubmit}>
              <div className="mb-6">
                <label htmlFor="orderId" className="block text-sm font-medium text-gray-500 mb-1">
                  ID Pesanan
                </label>
                <input
                  id="orderId"
                  type="text"
                  value={String(id).padStart(6, '0')}
                  disabled
                  className="w-full p-2 bg-gray-100 border border-gray-300 rounded-md"
                />
              </div>

              <div className="mb-6">
                <label htmlFor="alasan" className="block text-sm font-medium text-gray-700 mb-1">
                  Alasan Pengembalian <span className="text-red-500">*</span>
                </label>
                <p className="text-xs text-gray-500 mb-2">Jelaskan mengapa Anda ingin mengembalikan barang (misal: barang rusak, jumlah tidak sesuai, salah kirim).</p>
                <textarea
                  id="alasan"
                  rows="4"
                  value={alasan}
                  onChange={(e) => setAlasan(e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-emerald-500 focus:border-emerald-500"
                  placeholder="Contoh: Paracetamol 1 box rusak segelnya dan 2 box penyok..."
                ></textarea>
              </div>

              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Foto Bukti <span className="text-red-500">*</span>
                </label>
                <p className="text-xs text-gray-500 mb-2">Unggah foto barang yang bermasalah sebagai bukti.</p>
                <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md">
                  <div className="space-y-1 text-center">
                    {previewFoto ? (
                      <img src={previewFoto} alt="Preview" className="mx-auto h-32 w-auto object-contain mb-4" />
                    ) : (
                      <Upload className="mx-auto h-12 w-12 text-gray-400" />
                    )}
                    <div className="flex text-sm text-gray-600 justify-center">
                      <label
                        htmlFor="file-upload"
                        className="relative cursor-pointer bg-white rounded-md font-medium text-emerald-600 hover:text-emerald-500 focus-within:outline-none"
                      >
                        <span>{previewFoto ? 'Ganti foto' : 'Unggah file'}</span>
                        <input id="file-upload" name="foto" type="file" className="sr-only" onChange={handleFotoChange} accept="image/png, image/jpeg, image/jpg" />
                      </label>
                    </div>
                    <p className="text-xs text-gray-500">PNG, JPG, JPEG (Maks. 5MB)</p>
                  </div>
                </div>
              </div>

              {error && (
                <div className="mb-6 p-3 bg-red-100 text-red-700 rounded-lg flex items-center gap-2 text-sm">
                  <AlertCircle size={18} />
                  <span>{error}</span>
                </div>
              )}

              <div className="flex justify-end gap-4">
                <button
                  type="button"
                  onClick={() => navigate('/pbf/pesan-obat')}
                  className="py-2 px-6 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
                  disabled={isLoading}
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="py-2 px-6 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-50"
                  disabled={isLoading}
                >
                  {isLoading ? 'Mengirim...' : 'Kirim Pengajuan'}
                </button>
              </div>
            </form>
          </div>
        </main>
      </div>
    </div>
  );
};

export default AjukanPengembalian;