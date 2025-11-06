import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import SidebarProdusen from '../../../components/SidebarProdusen';
import NavbarProdusen from '../../../components/NavbarProdusen';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { FaCogs } from 'react-icons/fa';
import { Upload, Loader2, CheckCircle, XCircle, AlertTriangle, ChevronDown } from 'lucide-react'; // Tambah ChevronDown

const EditProduksi = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [formData, setFormData] = useState(null);
  const [dokumenBpomFile, setDokumenBpomFile] = useState(null);
  const [sertifikatFile, setSertifikatFile] = useState(null);
  const [fetchError, setFetchError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const [showPopup, setShowPopup] = useState(false);
  const [popupMessage, setPopupMessage] = useState('');
  const [popupType, setPopupType] = useState('success');

  const showCustomAlert = (message, type) => {
    setPopupMessage(message);
    setPopupType(type);
    setShowPopup(true);
  };

  const closePopup = () => {
    setShowPopup(false);
    if (popupType === 'success') {
      navigate('/produsen/manajemen-produksi');
    }
    setPopupMessage('');
    setPopupType('success');
  };

  const renderPopup = () => {
    if (!showPopup) return null;
    return (
      <div
        className="fixed inset-0 bg-black/20 backdrop-blur-sm flex items-center justify-center z-50 p-4"
        onClick={closePopup}
      >
        <div
          className="bg-white p-8 rounded-xl shadow-2xl max-w-sm w-full mx-auto animate-in fade-in zoom-in-95 duration-200 border border-slate-200"
          onClick={(e) => e.stopPropagation()}
        >
          <div
            className={`flex items-center gap-3 mb-4 ${popupType === 'success' ? 'text-emerald-600' : 'text-red-600'}`}
          >
            {popupType === 'success' ? (
              <CheckCircle size={28} className="flex-shrink-0" />
            ) : (
              <XCircle size={28} className="flex-shrink-0" />
            )}
            <h3 className="font-bold text-lg">{popupType === 'success' ? 'Sukses' : 'Error'}</h3>
          </div>
          <p className="text-slate-700 mb-6 leading-relaxed">{popupMessage}</p>
          <div className="flex justify-end gap-2">
            <button
              onClick={closePopup}
              className={`px-6 py-2.5 font-medium rounded-lg transition ${
                popupType === 'success'
                  ? 'bg-emerald-600 text-white hover:bg-emerald-700 active:bg-emerald-800'
                  : 'bg-red-600 text-white hover:bg-red-700 active:bg-red-800'
              }`}
            >
              Oke
            </button>
          </div>
        </div>
      </div>
    );
  };

  const parseDateAsLocal = (dateString) => {
    if (!dateString) return null;
    try {
      const utcDate = new Date(dateString);
      if (isNaN(utcDate.getTime())) {
        console.warn('Invalid date string:', dateString);
        return null;
      }
      // Ambil local year, month, date dari UTC parsed (otomatis adjust timezone)
      const localYear = utcDate.getFullYear();
      const localMonth = utcDate.getMonth();
      const localDay = utcDate.getDate();

      const localDate = new Date(localYear, localMonth, localDay);

      console.log(
        'Parsing:',
        dateString,
        '-> UTC parsed:',
        utcDate.toISOString(),
        '-> Local date:',
        localDate.toLocaleDateString('id-ID')
      );

      return localDate;
    } catch (error) {
      console.error('Error parsing date:', dateString, error);
      return null;
    }
  };

  const formatDateForAPI = (date) => {
    if (!date) return null;
    try {
      const year = date.getFullYear();
      const month = (date.getMonth() + 1).toString().padStart(2, '0');
      const day = date.getDate().toString().padStart(2, '0');
      return `${year}-${month}-${day}`;
    } catch (error) {
      console.error('Error formatting date:', date, error);
      return null;
    }
  };

  useEffect(() => {
    const fetchProduksi = async () => {
      setIsLoading(true);
      setFetchError('');
      const token = localStorage.getItem('token');
      if (!token) {
        showCustomAlert('Anda harus login untuk mengakses halaman ini.', 'error');
        setTimeout(() => navigate('/login/produsen'), 1500);
        setIsLoading(false);
        return;
      }
      try {
        const response = await fetch(`http://localhost:5000/api/produksi/${id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!response.ok) throw new Error('Gagal mengambil data produksi untuk diedit.');
        const result = await response.json();
        if (!result.success || !result.data)
          throw new Error(result.message || 'Data tidak ditemukan.');

        const data = result.data;

        console.log('Raw API dates:', {
          produksi: data.tanggal_produksi,
          kadaluarsa: data.tanggal_kadaluarsa,
        });

        setFormData({
          ...data,
          tanggal_produksi: parseDateAsLocal(data.tanggal_produksi),
          tanggal_kadaluarsa: parseDateAsLocal(data.tanggal_kadaluarsa),
          bentuk_sediaan: data.bentuk_sediaan || '',
          penanggung_jawab: data.penanggung_jawab || '',
          harga_per_unit: data.harga_per_unit || '',
        });
      } catch (err) {
        setFetchError(err.message);
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
    setIsSubmitting(true);

    if (
      !formData.batch_id ||
      !formData.nama_obat ||
      !formData.jumlah ||
      !formData.tanggal_produksi ||
      !formData.tanggal_kadaluarsa
    ) {
      showCustomAlert(
        'Semua field wajib harus diisi: Batch ID, Nama Obat, Jumlah, Tanggal Produksi, Tanggal Kadaluarsa.',
        'error'
      );
      setIsSubmitting(false);
      return;
    }
    if (!formData.bentuk_sediaan) {
      showCustomAlert('Bentuk sediaan wajib diisi.', 'error');
      setIsSubmitting(false);
      return;
    }
    if (!formData.penanggung_jawab) {
      showCustomAlert('Penanggung jawab wajib diisi.', 'error');
      setIsSubmitting(false);
      return;
    }

    if (Number(formData.jumlah) <= 0) {
      showCustomAlert('Jumlah produksi harus lebih dari 0.', 'error');
      setIsSubmitting(false);
      return;
    }

    if (
      formData.tanggal_produksi &&
      formData.tanggal_kadaluarsa &&
      new Date(formData.tanggal_kadaluarsa) <= new Date(formData.tanggal_produksi)
    ) {
      showCustomAlert('Tanggal kadaluarsa harus setelah tanggal produksi.', 'error');
      setIsSubmitting(false);
      return;
    }

    if (
      formData.harga_per_unit &&
      (isNaN(formData.harga_per_unit) || Number(formData.harga_per_unit) < 0)
    ) {
      showCustomAlert('Harga per unit harus angka valid >= 0.', 'error');
      setIsSubmitting(false);
      return;
    }

    const token = localStorage.getItem('token');
    if (!token) {
      showCustomAlert('Sesi Anda telah berakhir, silakan login kembali.', 'error');
      setIsSubmitting(false);
      return;
    }

    const dataPayload = new FormData();
    Object.keys(formData).forEach((key) => {
      if (key === 'tanggal_produksi' || key === 'tanggal_kadaluarsa') {
        if (formData[key]) {
          dataPayload.append(key, formatDateForAPI(formData[key]));
        }
      } else if (
        key !== 'created_at' &&
        key !== 'updated_at' &&
        key !== 'id_produsen' &&
        key !== 'id' &&
        key !== 'dokumen_bpom_path' &&
        key !== 'sertifikat_analisis_path' &&
        key !== 'hash_sertifikat_analisis'
      ) {
        // Explicitly exclude paths and hash
        dataPayload.append(key, formData[key] || '');
      }
    });

    if (formData.dokumen_bpom_path && !dokumenBpomFile) {
      dataPayload.append('dokumen_bpom_path_existing', formData.dokumen_bpom_path);
    }
    if (formData.sertifikat_analisis_path && !sertifikatFile) {
      dataPayload.append('sertifikat_analisis_path_existing', formData.sertifikat_analisis_path);
      dataPayload.append(
        'hash_sertifikat_analisis_existing',
        formData.hash_sertifikat_analisis || ''
      );
    }

    if (dokumenBpomFile) {
      dataPayload.append('dokumen_bpom', dokumenBpomFile);
    }
    if (sertifikatFile) {
      dataPayload.append('sertifikat_analisis', sertifikatFile);
    }

    console.log('FormData contents:', Array.from(dataPayload.entries()));

    try {
      const response = await fetch(`http://localhost:5000/api/produksi/${id}`, {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: dataPayload,
      });

      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.message || 'Gagal mengupdate data produksi.');
      }

      showCustomAlert('Jadwal produksi berhasil diperbarui!', 'success');
    } catch (err) {
      showCustomAlert(err.message || 'Terjadi kesalahan saat menyimpan.', 'error');
      console.error('Error details:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading || !formData) {
    return (
      <div className="flex flex-col justify-center items-center h-screen bg-gradient-to-br from-slate-50 via-white to-emerald-50">
        <div className="relative">
          <Loader2 className="animate-spin h-12 w-12 text-emerald-600" />
          <div className="absolute inset-0 h-12 w-12 rounded-full border-4 border-emerald-200 animate-ping opacity-20"></div>
        </div>
        <p className="mt-4 text-slate-700 font-medium">Memuat data produksi...</p>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-slate-50">
      {renderPopup()}
      <SidebarProdusen isCollapsed={isCollapsed} setIsCollapsed={setIsCollapsed} />
      <div
        className={`flex-1 flex flex-col transition-all duration-300 ${isCollapsed ? 'ml-16' : 'ml-64'}`}
      >
        <NavbarProdusen
          onLogout={() => {
            localStorage.clear();
            navigate('/');
          }}
          username={localStorage.getItem('username')}
        />
        <main className="flex-1 overflow-auto pt-[72px] px-12 py-8">
          <div className="max-w-7xl mx-auto">
            <div className="mb-10 relative">
              <div className="absolute -top-20 -left-20 w-72 h-72 bg-emerald-200 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob"></div>
              <div className="absolute -top-20 -right-20 w-72 h-72 bg-teal-200 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000"></div>

              <div className="relative flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div className="flex items-center gap-3">
                  <div className="flex items-center justify-center w-12 h-12 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl shadow-lg">
                    <FaCogs className="text-white" size={24} />
                  </div>

                  <div>
                    <h1 className="text-4xl font-bold bg-gradient-to-r from-slate-900 via-emerald-900 to-teal-900 bg-clip-text text-transparent">
                      Edit Jadwal Produksi
                    </h1>
                    <p className="text-slate-600 text-lg mt-1">
                      Perbarui formulir di bawah untuk mengubah data produksi
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {fetchError && (
              <div className="mb-6 p-4 bg-red-50 text-red-700 rounded-lg border border-red-200 flex items-center gap-2">
                <AlertTriangle size={18} /> <span>{fetchError}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
                <div className="bg-gradient-to-r from-emerald-50 to-emerald-100 px-6 py-4 border-b border-slate-200">
                  <h2 className="text-lg font-semibold text-emerald-900">Identitas Produk</h2>
                  <p className="text-sm text-emerald-700 mt-1">
                    Informasi dasar tentang produk yang akan diproduksi
                  </p>
                </div>
                <div className="p-6 space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-2">
                        Batch ID
                      </label>
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
                      <label className="block text-sm font-semibold text-slate-700 mb-2">
                        Nomor Izin Edar (BPOM)
                      </label>
                      <input
                        name="nomor_izin_edar"
                        value={formData.nomor_izin_edar || ''}
                        onChange={handleInputChange}
                        placeholder="Masukkan Nomor Izin Edar"
                        className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-2">
                        Dosis
                      </label>
                      <input
                        name="dosis"
                        value={formData.dosis || ''}
                        onChange={handleInputChange}
                        placeholder="Masukkan Dosis (cth: 500 mg)"
                        className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-2">
                        Bentuk Sediaan
                      </label>
                      <div className="relative">
                        <select
                          name="bentuk_sediaan"
                          value={formData.bentuk_sediaan || ''}
                          onChange={handleInputChange}
                          className="w-full px-4 py-2.5 pr-10 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition appearance-none bg-white" // Tambah pr-10 untuk space icon
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
                        {/* Custom dropdown arrow */}
                        <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-2">
                        Jumlah Produksi
                      </label>
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
                      <label className="block text-sm font-semibold text-slate-700 mb-2">
                        Tanggal Produksi
                      </label>
                      <DatePicker
                        selected={formData.tanggal_produksi}
                        onChange={(date) => setFormData({ ...formData, tanggal_produksi: date })}
                        dateFormat="dd/MM/yyyy"
                        className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-2">
                        Tanggal Kadaluarsa
                      </label>
                      <DatePicker
                        selected={formData.tanggal_kadaluarsa}
                        onChange={(date) => setFormData({ ...formData, tanggal_kadaluarsa: date })}
                        dateFormat="dd/MM/yyyy"
                        className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-2">
                        Harga Satuan (Rp)
                      </label>
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
                  <p className="text-sm text-emerald-700 mt-1">
                    Informasi detail tentang proses produksi
                  </p>
                </div>
                <div className="p-6 space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-2">
                        Prioritas
                      </label>
                      <div className="relative">
                        <select
                          name="prioritas"
                          value={formData.prioritas || 'Medium'}
                          onChange={handleInputChange}
                          className="w-full px-4 py-2.5 pr-10 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition appearance-none bg-white" // Tambah pr-10
                          required
                        >
                          <option value="High">Tinggi</option>
                          <option value="Medium">Sedang</option>
                          <option value="Low">Rendah</option>
                        </select>
                        {/* Custom dropdown arrow */}
                        <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-2">
                        Status
                      </label>
                      <div className="relative">
                        <select
                          name="status"
                          value={formData.status || 'Terjadwal'}
                          onChange={handleInputChange}
                          className="w-full px-4 py-2.5 pr-10 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition appearance-none bg-white" // Tambah pr-10
                          required
                        >
                          <option value="Terjadwal">Terjadwal</option>
                          <option value="Dalam Produksi">Dalam Produksi</option>
                          <option value="Selesai">Selesai</option>
                        </select>
                        {/* Custom dropdown arrow */}
                        <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-2">
                        Penanggung Jawab
                      </label>
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
                    <label className="block text-sm font-semibold text-slate-700 mb-2">
                      Komposisi Obat
                    </label>
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
                  <p className="text-sm text-emerald-700 mt-1">
                    Upload dokumen baru untuk menggantikan file lama (jika perlu)
                  </p>
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
                          <span className="truncate">
                            {dokumenBpomFile ? dokumenBpomFile.name : 'Pilih File Baru'}
                          </span>
                        </label>
                      </div>
                      {formData.dokumen_bpom_path && !dokumenBpomFile && (
                        <p className="text-sm text-slate-500 mt-2">
                          File saat ini:{' '}
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
                          <span className="truncate">
                            {sertifikatFile ? sertifikatFile.name : 'Pilih File Baru'}
                          </span>
                        </label>
                      </div>
                      {formData.sertifikat_analisis_path && !sertifikatFile && (
                        <p className="text-sm text-slate-500 mt-2">
                          File saat ini:{' '}
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
                  className="px-6 py-2.5 border border-slate-300 text-slate-700 font-medium rounded-lg hover:bg-slate-100 transition"
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
