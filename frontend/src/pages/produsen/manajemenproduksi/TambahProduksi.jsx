import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import SidebarProdusen from '../../../components/SidebarProdusen';
import NavbarProdusen from '../../../components/NavbarProdusen';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { Upload, Loader2 } from 'lucide-react';

const TambahProduksi = () => {
  const navigate = useNavigate();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [formData, setFormData] = useState({
    batch_id: '',
    nama_obat: '',
    nomor_izin_edar: '',
    dosis: '',
    bentuk_sediaan: '',
    jumlah: '',
    tanggal_produksi: null,
    tanggal_kadaluarsa: null,
    prioritas: 'Medium',
    status: 'Terjadwal',
    komposisi_obat: '',
    penanggung_jawab: '',
  });
  const [dokumenBpomFile, setDokumenBpomFile] = useState(null);
  const [sertifikatFile, setSertifikatFile] = useState(null);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      alert('Anda harus login untuk mengakses halaman ini.');
      navigate('/login/produsen');
    }
  }, [navigate]);

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

    // Validasi bentuk_sediaan dan penanggung_jawab
    if (!formData.bentuk_sediaan) {
      setError('Bentuk sediaan wajib dipilih.');
      setIsSubmitting(false);
      return;
    }
    if (!formData.penanggung_jawab) {
      setError('Penanggung jawab wajib diisi.');
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
    // Append text fields
    Object.keys(formData).forEach((key) => {
      if (key === 'tanggal_produksi' || key === 'tanggal_kadaluarsa') {
        if (formData[key]) {
          data.append(key, formData[key].toISOString().split('T')[0]);
        }
      } else {
        data.append(key, formData[key]);
      }
    });

    // Append files
    if (dokumenBpomFile) {
      data.append('dokumen_bpom', dokumenBpomFile);
    }
    if (sertifikatFile) {
      data.append('sertifikat_analisis', sertifikatFile);
    }

    try {
      const response = await fetch('http://localhost:5000/api/produksi', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: data,
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.message || 'Gagal menambahkan data produksi.');
      alert('Jadwal produksi berhasil dibuat!');
      navigate('/produsen/manajemen-produksi');
    } catch (err) {
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-gray-100">
      <SidebarProdusen isCollapsed={isCollapsed} setIsCollapsed={setIsCollapsed} />
      <div className={`flex-1 flex flex-col transition-all duration-300 ${isCollapsed ? 'ml-16' : 'ml-64'}`}>
        <NavbarProdusen onLogout={() => { localStorage.clear(); navigate('/'); }} />
        <main className="flex-1 pt-16 p-6">
          <div className="max-w-4xl mx-auto">
            <h1 className="text-3xl font-bold text-gray-800 mb-6">Jadwalkan Produksi Baru</h1>
            {error && (
              <div className="mb-4 p-4 bg-red-100 text-red-700 rounded-lg flex items-center gap-2">
                <span>{error}</span>
              </div>
            )}
            <form onSubmit={handleSubmit} className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 space-y-6">
              <h2 className="text-lg font-semibold text-emerald-700">Identitas Produk</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Batch ID</label>
                  <input
                    name="batch_id"
                    value={formData.batch_id}
                    onChange={handleInputChange}
                    placeholder="Masukkan Batch ID Unik"
                    className="mt-1 w-full p-2 border border-gray-300 rounded-lg focus:ring-emerald-500 focus:border-emerald-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Nama Obat (Merek/Generik)</label>
                  <input
                    name="nama_obat"
                    value={formData.nama_obat}
                    onChange={handleInputChange}
                    placeholder="Masukkan Nama Obat"
                    className="mt-1 w-full p-2 border border-gray-300 rounded-lg focus:ring-emerald-500 focus:border-emerald-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Nomor Izin Edar (BPOM)</label>
                  <input
                    name="nomor_izin_edar"
                    value={formData.nomor_izin_edar}
                    onChange={handleInputChange}
                    placeholder="Masukkan Nomor Izin Edar"
                    className="mt-1 w-full p-2 border border-gray-300 rounded-lg focus:ring-emerald-500 focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Dosis</label>
                  <input
                    name="dosis"
                    value={formData.dosis}
                    onChange={handleInputChange}
                    placeholder="Masukkan Dosis (cth: 500 mg)"
                    className="mt-1 w-full p-2 border border-gray-300 rounded-lg focus:ring-emerald-500 focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Bentuk Sediaan</label>
                  <select
                    name="bentuk_sediaan"
                    value={formData.bentuk_sediaan}
                    onChange={handleInputChange}
                    className="mt-1 w-full p-2 border border-gray-300 rounded-lg focus:ring-emerald-500 focus:border-emerald-500"
                    required
                  >
                    <option value="" disabled>Pilih Bentuk Sediaan</option>
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
                  <label className="block text-sm font-medium text-gray-700">Jumlah Produksi</label>
                  <input
                    type="number"
                    name="jumlah"
                    value={formData.jumlah}
                    onChange={handleInputChange}
                    placeholder="Masukkan Jumlah (pcs)"
                    min="1"
                    className="mt-1 w-full p-2 border border-gray-300 rounded-lg focus:ring-emerald-500 focus:border-emerald-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Tanggal Produksi</label>
                  <DatePicker
                    selected={formData.tanggal_produksi}
                    onChange={(date) => setFormData({ ...formData, tanggal_produksi: date })}
                    dateFormat="dd/MM/yyyy"
                    className="mt-1 w-full p-2 border border-gray-300 rounded-lg focus:ring-emerald-500 focus:border-emerald-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Tanggal Kadaluarsa</label>
                  <DatePicker
                    selected={formData.tanggal_kadaluarsa}
                    onChange={(date) => setFormData({ ...formData, tanggal_kadaluarsa: date })}
                    dateFormat="dd/MM/yyyy"
                    className="mt-1 w-full p-2 border border-gray-300 rounded-lg focus:ring-emerald-500 focus:border-emerald-500"
                    required
                  />
                </div>
              </div>

              <h2 className="text-lg font-semibold text-emerald-700">Detail Produksi</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Prioritas</label>
                  <select
                    name="prioritas"
                    value={formData.prioritas}
                    onChange={handleInputChange}
                    className="mt-1 w-full p-2 border border-gray-300 rounded-lg focus:ring-emerald-500 focus:border-emerald-500"
                    required
                  >
                    <option value="High">Tinggi</option>
                    <option value="Medium">Sedang</option>
                    <option value="Low">Rendah</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Status</label>
                  <select
                    name="status"
                    value={formData.status}
                    onChange={handleInputChange}
                    className="mt-1 w-full p-2 border border-gray-300 rounded-lg focus:ring-emerald-500 focus:border-emerald-500"
                    required
                  >
                    <option value="Terjadwal">Terjadwal</option>
                    <option value="Dalam Produksi">Dalam Produksi</option>
                    <option value="Selesai">Selesai</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Penanggung Jawab</label>
                  <input
                    name="penanggung_jawab"
                    value={formData.penanggung_jawab}
                    onChange={handleInputChange}
                    placeholder="Masukkan Nama Penanggung Jawab"
                    className="mt-1 w-full p-2 border border-gray-300 rounded-lg focus:ring-emerald-500 focus:border-emerald-500"
                    required
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Komposisi Obat</label>
                <textarea
                  name="komposisi_obat"
                  value={formData.komposisi_obat}
                  onChange={handleInputChange}
                  placeholder="Masukkan komposisi obat (misalnya: Paracetamol 500 mg, Laktosa, Pati)"
                  className="mt-1 w-full p-2 border border-gray-300 rounded-lg focus:ring-emerald-500 focus:border-emerald-500"
                />
              </div>

              <h2 className="text-lg font-semibold text-emerald-700">Dokumen Pendukung</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Dokumen BPOM (Opsional)</label>
                  <div className="mt-1 flex items-center gap-2">
                    <input
                      type="file"
                      name="dokumen_bpom"
                      onChange={(e) => setDokumenBpomFile(e.target.files[0])}
                      accept=".pdf,.png,.jpg"
                      className="hidden"
                      id="dokumen_bpom"
                    />
                    <label
                      htmlFor="dokumen_bpom"
                      className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg cursor-pointer hover:bg-gray-200 transition flex items-center gap-2"
                    >
                      <Upload size={18} />
                      {dokumenBpomFile ? dokumenBpomFile.name : 'Pilih File'}
                    </label>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Sertifikat Analisis (Opsional)</label>
                  <div className="mt-1 flex items-center gap-2">
                    <input
                      type="file"
                      name="sertifikat_analisis"
                      onChange={(e) => setSertifikatFile(e.target.files[0])}
                      accept=".pdf,.png,.jpg"
                      className="hidden"
                      id="sertifikat_analisis"
                    />
                    <label
                      htmlFor="sertifikat_analisis"
                      className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg cursor-pointer hover:bg-gray-200 transition flex items-center gap-2"
                    >
                      <Upload size={18} />
                      {sertifikatFile ? sertifikatFile.name : 'Pilih File'}
                    </label>
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-4 pt-4">
                <button
                  type="button"
                  onClick={() => navigate('/produsen/manajemen-produksi')}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 transition"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition disabled:bg-gray-400 flex items-center gap-2"
                >
                  {isSubmitting && <Loader2 className="animate-spin" size={18} />}
                  {isSubmitting ? 'Menyimpan...' : 'Simpan Jadwal'}
                </button>
              </div>
            </form>
          </div>
        </main>
      </div>
    </div>
  );
};

export default TambahProduksi;