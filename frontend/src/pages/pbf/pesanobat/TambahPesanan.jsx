import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import SidebarPbf from '../../../components/SidebarPbf';
import NavbarPbf from '../../../components/NavbarPbf';
import { Plus, Trash2, Loader2, CheckCircle, XCircle, Upload } from 'lucide-react';
import SignatureCanvas from 'react-signature-canvas';
import { FaClipboardList } from "react-icons/fa";

const TambahPesanan = () => {
  const navigate = useNavigate();
  const { idProdusen } = useParams();
  const sigCanvas = useRef({});
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [stokObat, setStokObat] = useState([]);
  const [infoPemesanan, setInfoPemesanan] = useState({
    nama_pbf: '',
    alamat_pbf: '',
    nomor_siup: '',
    nomor_sia_sika: '',
    nama_apoteker: '',
    nomor_sipa: '',
    kontak_telepon: '',
    kontak_email: '',
    tanggal_pesanan: new Date().toISOString().split('T')[0],
    tujuan_distribusi: '', // Akan diisi otomatis dari profil
    catatan_khusus: '',
    total_harga: 0,
  });
  const [itemObat, setItemObat] = useState({
    id_produksi: '',
    nama_obat: '',
    bentuk_sediaan: '',
    dosis: '',
    jumlah_pesanan: '',
    harga_per_unit: '',
    total_harga: '',
  });
  const [detailObat, setDetailObat] = useState([]);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
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
      navigate('/pbf/pesan-obat');
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

  // Fetch profil PBF
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          navigate('/login/pbf');
          return;
        }
        const response = await fetch('http://localhost:5000/api/pbf/profile', {
          headers: { Authorization: `Bearer ${token}` },
        });
        const result = await response.json();
        if (result.success) {
          setInfoPemesanan((prev) => ({
            ...prev,
            nama_pbf: result.data.nama_resmi,
            alamat_pbf: result.data.alamat,
            kontak_email: result.data.email,
            nomor_siup: result.data.nomor_izin,
            // <-- PERUBAHAN 1: Set tujuan_distribusi dari alamat profil
            tujuan_distribusi: result.data.alamat, 
          }));
        } else {
          throw new Error(result.message || 'Gagal memuat profil PBF.');
        }
      } catch (err) {
        setError(err.message);
      }
    };

    fetchProfile();
  }, [navigate]);

  // Fetch stok obat
  useEffect(() => {
    const fetchStok = async () => {
      setIsLoading(true);
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          navigate('/login/pbf');
          return;
        }
        const response = await fetch(`http://localhost:5000/api/pbf/produsen/${idProdusen}/stok`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const result = await response.json();
        if (result.success) {
          setStokObat(result.data);
          console.log('Stok loaded from:', result.source);
          console.log('Sample stok with harga:', result.data[0]);
        } else {
          throw new Error(result.message || 'Gagal memuat stok obat.');
        }
      } catch (err) {
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };

    if (idProdusen) {
      fetchStok();
    }
  }, [idProdusen, navigate]);

  // Handler untuk info pemesanan
  const handleInfoChange = (e) => {
    const { name, value } = e.target;
    setInfoPemesanan({ ...infoPemesanan, [name]: value });
  };

  // Handler untuk item obat
  const handleItemChange = (e) => {
    const { name, value } = e.target;
    setItemObat((prev) => {
      const updated = { ...prev, [name]: value };
      if (name === 'jumlah_pesanan' || name === 'harga_per_unit') {
        const jumlah = Number(updated.jumlah_pesanan) || 0;
        const harga = Number(updated.harga_per_unit) || 0;
        updated.total_harga = jumlah * harga;
      }
      return updated;
    });
  };

  // Handler untuk memilih obat
  const handleItemSelect = (e) => {
    const selectedId = e.target.value;
    const selected = stokObat.find((o) => o.id.toString() === selectedId);
    if (selected) {
      const harga = Number(selected.harga_per_unit) || 0;
      const jumlah = 1; 
      setItemObat({
        id_produksi: String(selected.id),
        nama_obat: selected.nama_obat,
        bentuk_sediaan: selected.bentuk_sediaan || '',
        dosis: selected.dosis || '',
        jumlah_pesanan: jumlah.toString(),
        harga_per_unit: harga,
        total_harga: jumlah * harga,
      });
    } else {
      setItemObat({ id_produksi: '', nama_obat: '', bentuk_sediaan: '', dosis: '', jumlah_pesanan: '1', harga_per_unit: 0, total_harga: 0 });
    }
  };

  // Handler untuk tambah item
  const handleAddItem = () => {
    if (!itemObat.id_produksi || !itemObat.jumlah_pesanan || Number(itemObat.jumlah_pesanan) <= 0) {
      setError('Pilih obat dan masukkan jumlah yang valid.');
      return;
    }
    const selectedObat = stokObat.find((o) => o.id.toString() === itemObat.id_produksi.toString());
    if (Number(itemObat.jumlah_pesanan) > selectedObat.jumlah) {
      setError(`Jumlah pesanan (${itemObat.jumlah_pesanan}) melebihi stok tersedia (${selectedObat.jumlah}).`);
      return;
    }
    if (Number(itemObat.harga_per_unit) === 0) {
      console.warn('Harga satuan 0 dari produksi, lanjutkan dengan hati-hati.');
    }
    setDetailObat([...detailObat, {
      id_produksi: String(itemObat.id_produksi),
      nama_obat: itemObat.nama_obat,
      bentuk_sediaan: itemObat.bentuk_sediaan,
      dosis: itemObat.dosis,
      jumlah_pesanan: Number(itemObat.jumlah_pesanan),
      harga_per_unit: Number(itemObat.harga_per_unit),
      total_harga: Number(itemObat.total_harga),
    }]);
    setItemObat({
      id_produksi: '',
      nama_obat: '',
      bentuk_sediaan: '',
      dosis: '',
      jumlah_pesanan: '',
      harga_per_unit: '',
      total_harga: '',
    });
    setError('');
  };

  // Handler untuk hapus item
  const handleRemoveItem = (index) => {
    setDetailObat(detailObat.filter((_, i) => i !== index));
  };

  // Hitung total harga
  useEffect(() => {
    const total = detailObat.reduce((sum, item) => sum + Number(item.total_harga), 0);
    setInfoPemesanan((prev) => ({ ...prev, total_harga: total }));
  }, [detailObat]);

  // Handler untuk hapus tanda tangan
  const clearSignature = () => {
    sigCanvas.current.clear();
  };

  // Handler untuk submit
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);

    // Validasi info pemesanan
    if (
      !infoPemesanan.nama_pbf ||
      !infoPemesanan.alamat_pbf ||
      !infoPemesanan.nomor_siup ||
      !infoPemesanan.nomor_sia_sika ||
      !infoPemesanan.nama_apoteker ||
      !infoPemesanan.nomor_sipa ||
      !infoPemesanan.kontak_telepon ||
      !infoPemesanan.kontak_email ||
      !infoPemesanan.tanggal_pesanan ||
      !infoPemesanan.tujuan_distribusi // Pastikan tujuan distribusi juga tervalidasi
    ) {
      setError('Semua informasi pemesanan (termasuk tujuan distribusi) wajib diisi.');
      setIsSubmitting(false);
      return;
    }

    // Validasi detail obat
    if (detailObat.length === 0) {
      setError('Tambahkan setidaknya satu item obat.');
      setIsSubmitting(false);
      return;
    }

    // Validasi tanda tangan
    if (sigCanvas.current.isEmpty()) {
      setError('Tanda tangan Apoteker Penanggung Jawab wajib diisi.');
      setIsSubmitting(false);
      return;
    }

    try {
      const token = localStorage.getItem('token');
      if (typeof sigCanvas.current.getTrimmedCanvas !== 'function') {
        throw new Error('getTrimmedCanvas bukan fungsi. Periksa versi react-signature-canvas.');
      }
      const tandaTanganDataUrl = sigCanvas.current.getTrimmedCanvas().toDataURL('image/png');
      const formData = {
        // nomor_po: DIHAPUS
        id_produsen: Number(idProdusen),
        nama_pbf: infoPemesanan.nama_pbf,
        alamat_pbf: infoPemesanan.alamat_pbf,
        nomor_siup: infoPemesanan.nomor_siup,
        nomor_sia_sika: infoPemesanan.nomor_sia_sika,
        nama_apoteker: infoPemesanan.nama_apoteker,
        nomor_sipa: infoPemesanan.nomor_sipa,
        kontak_telepon: infoPemesanan.kontak_telepon,
        kontak_email: infoPemesanan.kontak_email,
        tanggal_pesanan: infoPemesanan.tanggal_pesanan,
        tujuan_distribusi: infoPemesanan.tujuan_distribusi, // Sudah terisi dari state
        catatan_khusus: infoPemesanan.catatan_khusus || null,
        items: detailObat,
        tanda_tangan_data_url: tandaTanganDataUrl,
      };

      console.log('Submitting formData items sample:', formData.items[0]?.id_produksi);

      const response = await fetch('http://localhost:5000/api/pbf/pesanan', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const result = await response.json();
      if (!response.ok) throw new Error(result.message || 'Gagal membuat pesanan');

      console.log('Pesanan berhasil dibuat!');
      navigate('/pbf/pesan-obat');
    } catch (err) {
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-slate-50">
      {renderPopup()}
      <SidebarPbf isCollapsed={isCollapsed} setIsCollapsed={setIsCollapsed} />

      <div
        className={`flex-1 flex flex-col transition-all duration-300 ${
          isCollapsed ? "ml-16" : "ml-64"
        }`}
      >
        <NavbarPbf
          onLogout={() => {
            localStorage.clear();
            navigate("/");
          }}
        />

        <main className="flex-1 overflow-auto pt-[72px] px-12 py-8">
          <div className="max-w-7xl mx-auto">
            <div className="mb-10 relative">
              <div className="absolute -top-20 -left-20 w-72 h-72 bg-emerald-200 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob"></div>
              <div className="absolute -top-20 -right-20 w-72 h-72 bg-teal-200 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000"></div>

              <div className="relative flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div className="flex items-center gap-3">
                  <div className="flex items-center justify-center w-12 h-12 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl shadow-lg">
                    <FaClipboardList className="text-white" size={24} />
                  </div>

                  <div>
                    <h1 className="text-4xl font-bold bg-gradient-to-r from-slate-900 via-emerald-900 to-teal-900 bg-clip-text text-transparent">
                      Buat Pesanan Obat
                    </h1>
                    <p className="text-slate-600 text-lg mt-1">
                      Isi detail pesanan sesuai regulasi BPOM/Kemenkes.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {error && (
              <div className="mb-6 p-4 bg-red-50 text-red-700 rounded-lg border border-red-200 flex items-center gap-2">
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Informasi Pemesanan */}
              <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
                <div className="bg-gradient-to-r from-emerald-50 to-emerald-100 px-6 py-4 border-b border-slate-200">
                  <h2 className="text-lg font-semibold text-emerald-900">Informasi Pemesanan</h2>
                  <p className="text-sm text-emerald-700 mt-1">Detail pemesan dan pesanan</p>
                </div>
                <div className="p-6 space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-2">Nama PBF</label>
                      <input
                        name="nama_pbf"
                        value={infoPemesanan.nama_pbf}
                        onChange={handleInfoChange}
                        placeholder="Masukkan nama PBF"
                        className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-2">Alamat PBF</label>
                      <input
                        name="alamat_pbf"
                        value={infoPemesanan.alamat_pbf}
                        onChange={handleInfoChange}
                        placeholder="Masukkan alamat PBF"
                        className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-2">Nomor SIUP/Izin PBF</label>
                      <input
                        name="nomor_siup"
                        value={infoPemesanan.nomor_siup}
                        onChange={handleInfoChange}
                        placeholder="Masukkan nomor SIUP"
                        className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-2">Nomor SIA/SIKA</label>
                      <input
                        name="nomor_sia_sika"
                        value={infoPemesanan.nomor_sia_sika}
                        onChange={handleInfoChange}
                        placeholder="Masukkan nomor SIA/SIKA"
                        className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-2">Nama Apoteker</label>
                      <input
                        name="nama_apoteker"
                        value={infoPemesanan.nama_apoteker}
                        onChange={handleInfoChange}
                        placeholder="Masukkan nama apoteker"
                        className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-2">Nomor SIPA</label>
                      <input
                        name="nomor_sipa"
                        value={infoPemesanan.nomor_sipa}
                        onChange={handleInfoChange}
                        placeholder="Masukkan nomor SIPA"
                        className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-2">Kontak Telepon</label>
                      <input
                        name="kontak_telepon"
                        value={infoPemesanan.kontak_telepon}
                        onChange={handleInfoChange}
                        placeholder="Masukkan nomor telepon"
                        className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-2">Kontak Email</label>
                      <input
                        name="kontak_email"
                        value={infoPemesanan.kontak_email}
                        onChange={handleInfoChange}
                        placeholder="Masukkan email"
                        className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-2">Tanggal Pesanan</label>
                      <input
                        name="tanggal_pesanan"
                        type="date"
                        value={infoPemesanan.tanggal_pesanan}
                        onChange={handleInfoChange}
                        className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition"
                        required
                      />
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-sm font-semibold text-slate-700 mb-2">Tujuan Distribusi (Otomatis dari Alamat PBF)</label>
                      <input
                        name="tujuan_distribusi"
                        value={infoPemesanan.tujuan_distribusi}
                        placeholder="Otomatis terisi dari alamat PBF"
                        className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition bg-slate-100 cursor-not-allowed"
                        readOnly // Dibuat read-only
                      />
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-sm font-semibold text-slate-700 mb-2">Catatan Khusus (Opsional)</label>
                      <textarea
                        name="catatan_khusus"
                        value={infoPemesanan.catatan_khusus}
                        onChange={handleInfoChange}
                        placeholder="Masukkan catatan khusus"
                        className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition resize-none"
                        rows="4"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Detail Pemesanan Obat */}
              <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
                <div className="bg-gradient-to-r from-emerald-50 to-emerald-100 px-6 py-4 border-b border-slate-200">
                  <h2 className="text-lg font-semibold text-emerald-900">Detail Pemesanan Obat</h2>
                  <p className="text-sm text-emerald-700 mt-1">Tambahkan item obat yang dipesan</p>
                </div>
                <div className="p-6 space-y-4">
                  {detailObat.length > 0 && (
                    <div className="overflow-x-auto mb-6">
                      <table className="w-full text-left border-collapse">
                        <thead>
                          <tr className="bg-slate-50">
                            <th className="p-3 text-sm font-semibold text-slate-700">Nama Obat</th>
                            <th className="p-3 text-sm font-semibold text-slate-700">Bentuk Sediaan</th>
                            <th className="p-3 text-sm font-semibold text-slate-700">Dosis</th>
                            <th className="p-3 text-sm font-semibold text-slate-700">Jumlah</th>
                            <th className="p-3 text-sm font-semibold text-slate-700">Harga Satuan</th>
                            <th className="p-3 text-sm font-semibold text-slate-700">Total</th>
                            <th className="p-3 text-sm font-semibold text-slate-700">Aksi</th>
                          </tr>
                        </thead>
                        <tbody>
                          {detailObat.map((item, index) => (
                            <tr key={index} className="border-t">
                              <td className="p-3 text-slate-800">{item.nama_obat}</td>
                              <td className="p-3 text-slate-800">{item.bentuk_sediaan}</td>
                              <td className="p-3 text-slate-800">{item.dosis || '-'}</td>
                              <td className="p-3 text-slate-800">{item.jumlah_pesanan}</td>
                              <td className="p-3 text-slate-800">Rp {Number(item.harga_per_unit).toLocaleString('id-ID')}</td>
                              <td className="p-3 text-slate-800 font-semibold">Rp {Number(item.total_harga).toLocaleString('id-ID')}</td>
                              <td className="p-3">
                                <button
                                  type="button"
                                  onClick={() => handleRemoveItem(index)}
                                  className="text-red-500 hover:text-red-700 transition"
                                >
                                  <Trash2 size={18} />
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                        <tfoot>
                          <tr className="bg-slate-50 font-semibold">
                            <td colSpan="5" className="p-3 text-right">Total Harga:</td>
                            <td className="p-3">Rp {infoPemesanan.total_harga.toLocaleString('id-ID')}</td>
                            <td className="p-3"></td>
                          </tr>
                        </tfoot>
                      </table>
                    </div>
                  )}

                  <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-end pt-4 border-t">
                    <div className="md:col-span-3">
                      <label className="block text-sm font-semibold text-slate-700 mb-2">Pilih Obat</label>
                      <select
                        onChange={handleItemSelect}
                        value={itemObat.id_produksi}
                        className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition appearance-none bg-white"
                      >
                        <option value="">Pilih Obat</option>
                        {isLoading ? (
                          <option>Loading...</option>
                        ) : (
                          stokObat.map((o) => (
                            <option key={o.id} value={o.id}>
                              {o.nama_obat} (Stok: {o.jumlah}, {o.bentuk_sediaan})
                            </option>
                          ))
                        )}
                      </select>
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-sm font-semibold text-slate-700 mb-2">Jumlah</label>
                      <input
                        name="jumlah_pesanan"
                        type="number"
                        min="1"
                        value={itemObat.jumlah_pesanan}
                        onChange={handleItemChange}
                        placeholder="Jumlah"
                        className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition"
                      />
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-sm font-semibold text-slate-700 mb-2">Harga Satuan</label>
                      <input
                        name="harga_per_unit"
                        type="number"
                        value={itemObat.harga_per_unit}
                        onChange={handleItemChange}
                        placeholder="Harga satuan"
                        className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition bg-slate-100 cursor-not-allowed"
                        readOnly // Harga diambil dari stok
                      />
                    </div>
                    <div className="md:col-span-2">
                      <button
                        type="button"
                        onClick={handleAddItem}
                        className="w-full px-6 py-2.5 bg-emerald-600 text-white font-medium rounded-lg hover:bg-emerald-700 transition flex items-center justify-center gap-2 disabled:bg-slate-400 disabled:cursor-not-allowed"
                        disabled={!itemObat.id_produksi || !itemObat.jumlah_pesanan || Number(itemObat.jumlah_pesanan) <= 0}
                      >
                        <Plus size={18} /> Tambah
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Tanda Tangan Apoteker */}
              <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
                <div className="bg-gradient-to-r from-emerald-50 to-emerald-100 px-6 py-4 border-b border-slate-200">
                  <h2 className="text-lg font-semibold text-emerald-900">Tanda Tangan Apoteker</h2>
                  <p className="text-sm text-emerald-700 mt-1">Tanda tangan untuk konfirmasi pesanan</p>
                </div>
                <div className="p-6 space-y-4">
                  <div className="w-full h-48 bg-slate-50 border border-slate-300 rounded-lg overflow-hidden">
                    <SignatureCanvas
                      ref={sigCanvas}
                      penColor="black"
                      canvasProps={{ className: 'w-full h-full' }}
                    />
                  </div>
                  <div className="flex justify-end mt-4">
                    <button
                      type="button"
                      onClick={clearSignature}
                      className="px-6 py-2.5 text-red-700 font-medium rounded-lg hover:text-red-800 transition flex items-center gap-2"
                    >
                      <XCircle size={18} /> Hapus Tanda Tangan
                    </button>
                  </div>
                </div>
              </div>

              {/* Tombol-tombol */}
              <div className="flex justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => navigate('/pbf/pesan-obat')}
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
                  {isSubmitting ? 'Menyimpan...' : 'Simpan Pesanan'}
                </button>
              </div>
            </form>
          </div>
        </main>
      </div>
    </div>
  );
};

export default TambahPesanan;