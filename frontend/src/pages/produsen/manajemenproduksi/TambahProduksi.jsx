import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import SidebarProdusen from '../../../components/SidebarProdusen';
import NavbarProdusen from '../../../components/NavbarProdusen';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { Upload, Loader2, CheckCircle, XCircle } from 'lucide-react';

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
    harga_per_unit: '',
  });
  const [dokumenBpomFile, setDokumenBpomFile] = useState(null);
  const [sertifikatFile, setSertifikatFile] = useState(null);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // State untuk popup custom
  const [showPopup, setShowPopup] = useState(false);
  const [popupMessage, setPopupMessage] = useState('');
  const [popupType, setPopupType] = useState('success'); // 'success' or 'error'

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      showCustomAlert('Anda harus login untuk mengakses halaman ini.', 'error');
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
      showCustomAlert('Semua field wajib harus diisi: Batch ID, Nama Obat, Jumlah, Tanggal Produksi, Tanggal Kadaluarsa.', 'error');
      setIsSubmitting(false);
      return;
    }

    // Validasi jumlah positif
    if (Number(formData.jumlah) <= 0) {
      showCustomAlert('Jumlah produksi harus lebih dari 0.', 'error');
      setIsSubmitting(false);
      return;
    }

    // Validasi tanggal kadaluarsa
    if (
      formData.tanggal_produksi &&
      formData.tanggal_kadaluarsa &&
      new Date(formData.tanggal_kadaluarsa) <= new Date(formData.tanggal_produksi)
    ) {
      showCustomAlert('Tanggal kadaluarsa harus setelah tanggal produksi.', 'error');
      setIsSubmitting(false);
      return;
    }

    // Validasi bentuk_sediaan dan penanggung_jawab
    if (!formData.bentuk_sediaan) {
      showCustomAlert('Bentuk sediaan wajib dipilih.', 'error');
      setIsSubmitting(false);
      return;
    }
    if (!formData.penanggung_jawab) {
      showCustomAlert('Penanggung jawab wajib diisi.', 'error');
      setIsSubmitting(false);
      return;
    }

    // Validasi dokumen wajib (pop-up khusus setelah klik submit)
    if (!dokumenBpomFile || !sertifikatFile) {
      showCustomAlert('Dokumen BPOM dan Sertifikat Analisis wajib diunggah untuk dapat menyimpan jadwal.', 'error');
      setIsSubmitting(false);
      return;
    }

    const token = localStorage.getItem('token');
    if (!token) {
      showCustomAlert('Sesi Anda telah berakhir, silakan login kembali.', 'error');
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
      showCustomAlert('Jadwal produksi berhasil dibuat!', 'success');
      navigate('/produsen/manajemen-produksi');
    } catch (err) {
      showCustomAlert(err.message, 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Fungsi untuk menampilkan popup custom
  const showCustomAlert = (message, type) => {
    setPopupMessage(message);
    setPopupType(type);
    setShowPopup(true);
  };

  // Fungsi untuk tutup popup
  const closePopup = () => {
    setShowPopup(false);
    setPopupMessage('');
    setPopupType('success');
  };

  // Render popup jika showPopup true
  const renderPopup = () => {
    if (!showPopup) return null;
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white p-6 rounded-lg shadow-lg max-w-sm w-full mx-4">
          <div className={`flex items-center gap-2 mb-4 ${popupType === 'success' ? 'text-green-600' : 'text-red-600'}`}>
            {popupType === 'success' ? <CheckCircle size={24} /> : <XCircle size={24} />}
            <h3 className="font-semibold">{popupType === 'success' ? 'Sukses' : 'Error'}</h3>
          </div>
          <p className="text-gray-700 mb-6">{popupMessage}</p>
          <div className="flex justify-end">
            <button
              onClick={closePopup}
              className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition"
            >
              Tutup
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="flex min-h-screen bg-gray-100">
      {renderPopup()}
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
                <div>
                  <label className="block text-sm font-medium text-gray-700">Harga Satuan (Rp)</label>
                  <input
                    type="number"
                    name="harga_per_unit"
                    value={formData.harga_per_unit}
                    onChange={handleInputChange}
                    placeholder="Masukkan Harga Satuan"
                    min="0"
                    step="0.01"
                    className="mt-1 w-full p-2 border border-gray-300 rounded-lg focus:ring-emerald-500 focus:border-emerald-500"
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
                    <option value="Terjadwal" disabled={formData.status !== "Terjadwal"}>Terjadwal</option>
                    <option value="Dalam Produksi" disabled={formData.status === "Terjadwal"}>Dalam Produksi</option>
                    <option value="Selesai" disabled={formData.status !== "Selesai" && formData.status !== "Dalam Produksi"}>Selesai</option>
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
                  <label className="block text-sm font-medium text-gray-700">Dokumen BPOM (Wajib)</label>
                  <div className="mt-1 flex items-center gap-2">
                    <input
                      type="file"
                      name="dokumen_bpom"
                      onChange={(e) => setDokumenBpomFile(e.target.files[0])}
                      accept=".pdf,.png,.jpg"
                      className="hidden"
                      id="dokumen_bpom"
                      required
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
                  <label className="block text-sm font-medium text-gray-700">Sertifikat Analisis (Wajib)</label>
                  <div className="mt-1 flex items-center gap-2">
                    <input
                      type="file"
                      name="sertifikat_analisis"
                      onChange={(e) => setSertifikatFile(e.target.files[0])}
                      accept=".pdf,.png,.jpg"
                      className="hidden"
                      id="sertifikat_analisis"
                      required
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