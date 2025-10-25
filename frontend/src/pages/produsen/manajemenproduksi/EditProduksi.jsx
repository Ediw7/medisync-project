import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import SidebarProdusen from '../../../components/SidebarProdusen';
import NavbarProdusen from '../../../components/NavbarProdusen';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { Upload, Loader2 } from 'lucide-react';

const EditProduksi = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [formData, setFormData] = useState(null);
  const [dokumenBpomFile, setDokumenBpomFile] = useState(null);
  const [sertifikatFile, setSertifikatFile] = useState(null);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchProduksi = async () => {
      const token = localStorage.getItem('token');
      if (!token) {
        alert('Anda harus login untuk mengakses halaman ini.');
        navigate('/login/produsen');
        return;
      }
      try {
        const response = await fetch(`http://localhost:5000/api/produksi/${id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!response.ok) throw new Error('Gagal mengambil data');
        const result = await response.json();
        const data = result.data;
        setFormData({
          ...data,
          tanggal_produksi: data.tanggal_produksi ? new Date(data.tanggal_produksi) : null,
          tanggal_kadaluarsa: data.tanggal_kadaluarsa ? new Date(data.tanggal_kadaluarsa) : null,
          bentuk_sediaan: data.bentuk_sediaan || '',
          penanggung_jawab: data.penanggung_jawab || '',
          harga_per_unit: data.harga_per_unit || '', // DIPERBAIKI: Pastikan field ini loaded sebagai string untuk input
        });
      } catch (err) {
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };
    fetchProduksi();
  }, [id, navigate]);

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);

    // Validasi field wajib
    if (!formData.batch_id || !formData.nama_obat || !formData.jumlah || !formData.tanggal_produksi || !formData.tanggal_kadaluarsa) {
      setError('Semua field wajib harus diisi: Batch ID, Nama Obat, Jumlah, Tanggal Produksi, Tanggal Kadaluarsa.');
      setIsSubmitting(false);
      return;
    }
    if (!formData.bentuk_sediaan) {
      setError('Bentuk sediaan wajib diisi.');
      setIsSubmitting(false);
      return;
    }
    if (!formData.penanggung_jawab) {
      setError('Penanggung jawab wajib diisi.');
      setIsSubmitting(false);
      return;
    }

    // Validasi jumlah positif
    if (Number(formData.jumlah) <= 0) {
      setError('Jumlah produksi harus lebih dari 0.');
      setIsSubmitting(false);
      return;
    }

    // Validasi tanggal kadaluarsa
    if (
      formData.tanggal_produksi &&
      formData.tanggal_kadaluarsa &&
      new Date(formData.tanggal_kadaluarsa) <= new Date(formData.tanggal_produksi)
    ) {
      setError('Tanggal kadaluarsa harus setelah tanggal produksi.');
      setIsSubmitting(false);
      return;
    }

    // DIPERBAIKI: Validasi harga_per_unit jika dikirim (opsional, tapi pastikan numeric)
    if (formData.harga_per_unit && (isNaN(formData.harga_per_unit) || Number(formData.harga_per_unit) < 0)) {
      setError('Harga per unit harus angka valid >= 0.');
      setIsSubmitting(false);
      return;
    }

    const token = localStorage.getItem('token');
    if (!token) {
      setError('Sesi Anda telah berakhir, silakan login kembali.');
      setIsSubmitting(false);
      return;
    }

    const data = new FormData();
    // Append semua field (skip created_at, updated_at, id_produsen, id)
    Object.keys(formData).forEach((key) => {
      if (key === 'tanggal_produksi' || key === 'tanggal_kadaluarsa') {
        if (formData[key]) {
          data.append(key, formData[key].toISOString().split('T')[0]);
        }
      } else if (key !== 'created_at' && key !== 'updated_at' && key !== 'id_produsen' && key !== 'id') {
        data.append(key, formData[key] || '');
      }
    });

    // Append files and existing paths
    if (dokumenBpomFile) {
      data.append('dokumen_bpom', dokumenBpomFile);
    } else if (formData.dokumen_bpom_path) {
      data.append('dokumen_bpom_path_existing', formData.dokumen_bpom_path);
    }
    if (sertifikatFile) {
      data.append('sertifikat_analisis', sertifikatFile);
    } else if (formData.sertifikat_analisis_path) {
      data.append('sertifikat_analisis_path_existing', formData.sertifikat_analisis_path);
      data.append('hash_sertifikat_analisis_existing', formData.hash_sertifikat_analisis || '');
    }

    console.log('FormData contents:', Array.from(data.entries())); // Debug log

    try {
      const response = await fetch(`http://localhost:5000/api/produksi/${id}`, {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: data,
      });

      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.message || 'Gagal mengupdate data produksi.');
      }

      alert('Jadwal produksi berhasil diperbarui!');
      navigate('/produsen/manajemen-produksi');
    } catch (err) {
      setError(err.message);
      console.error('Error details:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading || !formData) return <div className="p-6 text-center text-gray-500">Loading...</div>;

  return (
    <div className="flex min-h-screen bg-slate-50">
      {/* Asumsi Anda memiliki fungsi renderPopup() yang serupa di file ini */}
      {/* {renderPopup()} */}
      <SidebarProdusen isCollapsed={isCollapsed} setIsCollapsed={setIsCollapsed} />
      <div className={`flex-1 flex flex-col transition-all duration-300 ${isCollapsed ? "ml-16" : "ml-64"}`}>
        <NavbarProdusen
          onLogout={() => {
            localStorage.clear();
            navigate("/"); 
          }}
        />
        <main className="flex-1 overflow-auto">
          <div className="max-w-5xl mx-auto px-6 py-8">
            <div className="mb-8 pt-12">
              <h1 className="text-4xl font-bold text-slate-900 mb-2">Edit Jadwal Produksi</h1>
              <p className="text-slate-600">Perbarui formulir di bawah untuk mengubah data produksi</p>
            </div>

            {error && (
              <div className="mb-6 p-4 bg-red-50 text-red-700 rounded-lg border border-red-200 flex items-center gap-2">
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              
              <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
                <div className="bg-gradient-to-r from-emerald-50 to-emerald-100 px-6 py-4 border-b border-slate-200">
                  <h2 className="text-lg font-semibold text-emerald-900">Identitas Produk</h2>
                  <p className="text-sm text-emerald-700 mt-1">Informasi dasar tentang produk yang akan diproduksi</p>
                </div>
                <div className="p-6 space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-2">Batch ID</label>
                      <input
                        name="batch_id"
                        value={formData.batch_id || ''}
                        onChange={handleInputChange}
                        placeholder="Masukkan Batch ID Unik"
                        className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-2">
                        Nama Obat (Merek/Generik)
                      </label>
                      <input
                        name="nama_obat"
                        value={formData.nama_obat || ''}
                        onChange={handleInputChange}
                        placeholder="Masukkan Nama Obat"
                        className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-2">Nomor Izin Edar (BPOM)</label>
                      <input
                        name="nomor_izin_edar"
                        value={formData.nomor_izin_edar || ''}
                        onChange={handleInputChange}
                        placeholder="Masukkan Nomor Izin Edar"
                        className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-2">Dosis</label>
                      <input
                        name="dosis"
                        value={formData.dosis || ''}
                        onChange={handleInputChange}
                        placeholder="Masukkan Dosis (cth: 500 mg)"
                        className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-2">Bentuk Sediaan</label>
                      <select
                        name="bentuk_sediaan"
                        value={formData.bentuk_sediaan || ''}
                        onChange={handleInputChange}
                        className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition"
                        required
                      >
                        <option value="">Pilih Bentuk Sediaan</option>
                        <option value="Tablet">Tablet</option>
                        <option value="Kapsul">Kapsul</option>
                        <option value="Sirup">Sirup</option>
                        <option value="Injeksi">Injeksi</option>
                        <option value="Salep">Salep</option>
                        <option value="Krim">Krim</option>
                        <option value="Tetes">Tetes</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-2">Jumlah Produksi</label>
                      <input
                        type="number"
                        name="jumlah"
                        value={formData.jumlah || ''}
                        onChange={handleInputChange}
                        placeholder="Masukkan Jumlah (pcs)"
                        min="1"
                        className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-2">Tanggal Produksi</label>
                      <DatePicker
                        selected={formData.tanggal_produksi}
                        onChange={(date) => setFormData({ ...formData, tanggal_produksi: date })}
                        dateFormat="dd/MM/yyyy"
                        className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-2">Tanggal Kadaluarsa</label>
                      <DatePicker
                        selected={formData.tanggal_kadaluarsa}
                        onChange={(date) => setFormData({ ...formData, tanggal_kadaluarsa: date })}
                        dateFormat="dd/MM/yyyy"
                        className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-2">Harga Satuan (Rp)</label>
                      <input
                        type="number"
                        name="harga_per_unit"
                        value={formData.harga_per_unit || ''}
                        onChange={handleInputChange}
                        placeholder="Masukkan Harga Satuan"
                        min="0"
                        step="0.01"
                        className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition"
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
                <div className="bg-gradient-to-r from-emerald-50 to-emerald-100 px-6 py-4 border-b border-slate-200">
                  <h2 className="text-lg font-semibold text-emerald-900">Detail Produksi</h2>
                  <p className="text-sm text-emerald-700 mt-1">Informasi detail tentang proses produksi</p>
                </div>
                <div className="p-6 space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-2">Prioritas</label>
                      <select
                        name="prioritas"
                        value={formData.prioritas || 'Medium'}
                        onChange={handleInputChange}
                        className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition"
                        required
                      >
                        <option value="High">Tinggi</option>
                        <option value="Medium">Sedang</option>
                        <option value="Low">Rendah</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-2">Status</label>
                      <select
                        name="status"
                        value={formData.status || 'Terjadwal'}
                        onChange={handleInputChange}
                        className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition"
                        required
                      >
                        <option value="Terjadwal">Terjadwal</option>
                        <option value="Dalam Produksi">Dalam Produksi</option>
                        <option value="Selesai">Selesai</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-2">Penanggung Jawab</label>
                      <input
                        name="penanggung_jawab"
                        value={formData.penanggung_jawab || ''}
                        onChange={handleInputChange}
                        placeholder="Masukkan Nama Penanggung Jawab"
                        className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition"
                        required
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">Komposisi Obat</label>
                    <textarea
                      name="komposisi_obat"
                      value={formData.komposisi_obat || ''}
                      onChange={handleInputChange}
                      placeholder="Masukkan komposisi obat (misalnya: Paracetamol 500 mg, Laktosa, Pati)"
                      rows={4}
                      className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition resize-none"
                    />
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
                <div className="bg-gradient-to-r from-emerald-50 to-emerald-100 px-6 py-4 border-b border-slate-200">
                  <h2 className="text-lg font-semibold text-emerald-900">Dokumen Pendukung</h2>
                  <p className="text-sm text-emerald-700 mt-1">Upload dokumen baru untuk menggantikan file lama (jika perlu)</p>
                </div>
                <div className="p-6 space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-2">
                        Dokumen BPOM (Opsional)
                      </label>
                      <div className="flex items-center gap-2">
                        <input
                          type="file"
                          onChange={(e) => setDokumenBpomFile(e.target.files[0])}
                          accept=".pdf,.png,.jpg"
                          className="hidden"
                          id="dokumen_bpom"
                        />
                        <label
                          htmlFor="dokumen_bpom"
                          className="flex-1 px-4 py-2.5 bg-slate-100 text-slate-700 rounded-lg cursor-pointer hover:bg-slate-200 transition flex items-center gap-2 border border-slate-300"
                        >
                          <Upload size={18} />
                          <span className="truncate">{dokumenBpomFile ? dokumenBpomFile.name : "Pilih File Baru"}</span>
                        </label>
                      </div>
                      {formData.dokumen_bpom_path && !dokumenBpomFile && (
                        <p className="text-sm text-slate-500 mt-2">
                          File saat ini:{" "}
                          <a
                            href={`http://localhost:5000/${formData.dokumen_bpom_path.replace(/\\/g, '/')}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-emerald-600 hover:underline"
                          >
                            {formData.dokumen_bpom_path.replace('uploads\\', '')}
                          </a>
                        </p>
                      )}
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-2">
                        Sertifikat Analisis (Opsional)
                      </label>
                      <div className="flex items-center gap-2">
                        <input
                          type="file"
                          onChange={(e) => setSertifikatFile(e.target.files[0])}
                          accept=".pdf,.png,.jpg"
                          className="hidden"
                          id="sertifikat_analisis"
                        />
                        <label
                          htmlFor="sertifikat_analisis"
                          className="flex-1 px-4 py-2.5 bg-slate-100 text-slate-700 rounded-lg cursor-pointer hover:bg-slate-200 transition flex items-center gap-2 border border-slate-300"
                        >
                          <Upload size={18} />
                          <span className="truncate">{sertifikatFile ? sertifikatFile.name : "Pilih File Baru"}</span>
                        </label>
                      </div>
                      {formData.sertifikat_analisis_path && !sertifikatFile && (
                        <p className="text-sm text-slate-500 mt-2">
                          File saat ini:{" "}
                          <a
                            href={`http://localhost:5000/${formData.sertifikat_analisis_path.replace(/\\/g, '/')}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-emerald-600 hover:underline"
                          >
                            {formData.sertifikat_analisis_path.replace('uploads\\', '')}
                          </a>
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => navigate('/produsen/manajemen-produksi')}
                  className="px-6 py-2.5 border border-slate-300 text-slate-700 font-medium rounded-lg hover:bg-slate-50 transition"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-6 py-2.5 bg-emerald-600 text-white font-medium rounded-lg hover:bg-emerald-700 transition disabled:bg-slate-400 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {isSubmitting && <Loader2 className="animate-spin" size={18} />}
                  {isSubmitting ? 'Menyimpan...' : 'Simpan Perubahan'}
                </button>
              </div>
            </form>
          </div>
        </main>
      </div>
    </div>
  );
};
export default EditProduksi;