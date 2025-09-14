import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import SidebarPbf from '../../../components/SidebarPbf';
import NavbarPbf from '../../../components/NavbarPbf';
import { Plus, Trash2, Loader2 } from 'lucide-react';
import SignatureCanvas from 'react-signature-canvas';

const TambahPesanan = () => {
  const navigate = useNavigate();
  const { idProdusen } = useParams();
  const sigCanvas = useRef({});

  const [isCollapsed, setIsCollapsed] = useState(false);
  const [stokObat, setStokObat] = useState([]);
  const [infoPemesanan, setInfoPemesanan] = useState({
    // nomor_po: '',  // <-- 1. DIHAPUS DARI STATE
    nama_pbf: '',
    alamat_pbf: '',
    nomor_siup: '',
    nomor_sia_sika: '',
    nama_apoteker: '',
    nomor_sipa: '',
    kontak_telepon: '',
    kontak_email: '',
    tanggal_pesanan: new Date().toISOString().split('T')[0],
    tujuan_distribusi: '',
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
          console.log('Stok loaded from:', result.source); // Log sumber data
          console.log('Sample stok with harga:', result.data[0]); // Log untuk debug harga
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
      const jumlah = 1; // Jumlah default saat item dipilih
      setItemObat({
        id_produksi: String(selected.id), // Fix: Pastikan string
        nama_obat: selected.nama_obat,
        bentuk_sediaan: selected.bentuk_sediaan || '',
        dosis: selected.dosis || '',
        jumlah_pesanan: jumlah.toString(),
        harga_per_unit: harga,
        total_harga: jumlah * harga, // Langsung hitung total
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
    // Jika harga_per_unit 0 dari produksi, izinkan dengan catatan
    if (Number(itemObat.harga_per_unit) === 0) {
      console.warn('Harga satuan 0 dari produksi, lanjutkan dengan hati-hati.');
    }
    setDetailObat([...detailObat, {
      id_produksi: String(itemObat.id_produksi), // Fix: Pastikan string saat tambah ke detail
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
      harga_per_unit: '', // Reset harga setelah tambah
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
      // !infoPemesanan.nomor_po || // <-- 2. DIHAPUS DARI VALIDASI
      !infoPemesanan.nama_pbf ||
      !infoPemesanan.alamat_pbf ||
      !infoPemesanan.nomor_siup ||
      !infoPemesanan.nomor_sia_sika ||
      !infoPemesanan.nama_apoteker ||
      !infoPemesanan.nomor_sipa ||
      !infoPemesanan.kontak_telepon ||
      !infoPemesanan.kontak_email ||
      !infoPemesanan.tanggal_pesanan
    ) {
      setError('Semua informasi pemesanan wajib diisi.');
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
        // nomor_po: infoPemesanan.nomor_po, // <-- 3. DIHAPUS DARI PAYLOAD
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
        tujuan_distribusi: infoPemesanan.tujuan_distribusi || null,
        catatan_khusus: infoPemesanan.catatan_khusus || null,
        items: detailObat, // Sekarang id_produksi sudah string
        tanda_tangan_data_url: tandaTanganDataUrl,
      };

      console.log('Submitting formData items sample:', formData.items[0]?.id_produksi); // Debug: Cek tipe string

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

      console.log('Pesanan berhasil dibuat!'); // Ganti alert dengan log sementara
      navigate('/pbf/pesan-obat');
    } catch (err) {
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-gray-100">
      <SidebarPbf isCollapsed={isCollapsed} setIsCollapsed={setIsCollapsed} />
      <div className={`flex-1 flex flex-col transition-all duration-300 ${isCollapsed ? 'ml-16' : 'ml-64'}`}>
        <NavbarPbf onLogout={() => { localStorage.clear(); navigate('/'); }} />
        <main className="flex-1 pt-16 p-6">
          <form onSubmit={handleSubmit} className="space-y-6 max-w-5xl mx-auto">
            <div className="flex justify-between items-center">
              <div>
                <h1 className="text-3xl font-bold text-gray-800">Buat Pesanan Obat</h1>
                <p className="text-gray-500 mt-1">Isi detail pesanan sesuai regulasi BPOM/Kemenkes.</p>
              </div>
            </div>

            {error && (
              <div className="p-4 bg-red-100 text-red-700 rounded-lg flex items-center gap-2">
                <span>{error}</span>
              </div>
            )}

            {/* Informasi Pemesanan */}
            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
              <h2 className="text-lg font-semibold text-emerald-700 mb-4">Informasi Pemesanan</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                
                {/* 4. BLOK INPUT NOMOR PO DIHAPUS SELURUHNYA DARI SINI */}
                
                <div>
                  <label className="block text-sm font-medium text-gray-700">Nama PBF</label>
                  <input
                    name="nama_pbf"
                    value={infoPemesanan.nama_pbf}
                    onChange={handleInfoChange}
                    placeholder="Masukkan nama PBF"
                    className="mt-1 w-full p-2 border border-gray-300 rounded-lg focus:ring-emerald-500 focus:border-emerald-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Alamat PBF</label>
                  <input
                    name="alamat_pbf"
                    value={infoPemesanan.alamat_pbf}
                    onChange={handleInfoChange}
                    placeholder="Masukkan alamat PBF"
                    className="mt-1 w-full p-2 border border-gray-300 rounded-lg focus:ring-emerald-500 focus:border-emerald-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Nomor SIUP/Izin PBF</label>
                  <input
                    name="nomor_siup"
                    value={infoPemesanan.nomor_siup}
                    onChange={handleInfoChange}
                    placeholder="Masukkan nomor SIUP"
                    className="mt-1 w-full p-2 border border-gray-300 rounded-lg focus:ring-emerald-500 focus:border-emerald-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Nomor SIA/SIKA</label>
                  <input
                    name="nomor_sia_sika"
                    value={infoPemesanan.nomor_sia_sika}
                    onChange={handleInfoChange}
                    placeholder="Masukkan nomor SIA/SIKA"
                    className="mt-1 w-full p-2 border border-gray-300 rounded-lg focus:ring-emerald-500 focus:border-emerald-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Nama Apoteker</label>
                  <input
                    name="nama_apoteker"
                    value={infoPemesanan.nama_apoteker}
                    onChange={handleInfoChange}
                    placeholder="Masukkan nama apoteker"
                    className="mt-1 w-full p-2 border border-gray-300 rounded-lg focus:ring-emerald-500 focus:border-emerald-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Nomor SIPA</label>
                  <input
                    name="nomor_sipa"
                    value={infoPemesanan.nomor_sipa}
                    onChange={handleInfoChange}
                    placeholder="Masukkan nomor SIPA"
                    className="mt-1 w-full p-2 border border-gray-300 rounded-lg focus:ring-emerald-500 focus:border-emerald-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Kontak Telepon</label>
                  <input
                    name="kontak_telepon"
                    value={infoPemesanan.kontak_telepon}
                    onChange={handleInfoChange}
                    placeholder="Masukkan nomor telepon"
                    className="mt-1 w-full p-2 border border-gray-300 rounded-lg focus:ring-emerald-500 focus:border-emerald-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Kontak Email</label>
                  <input
                    name="kontak_email"
                    value={infoPemesanan.kontak_email}
                    onChange={handleInfoChange}
                    placeholder="Masukkan email"
                    className="mt-1 w-full p-2 border border-gray-300 rounded-lg focus:ring-emerald-500 focus:border-emerald-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Tanggal Pesanan</label>
                  <input
                    name="tanggal_pesanan"
                    type="date"
                    value={infoPemesanan.tanggal_pesanan}
                    onChange={handleInfoChange}
                    className="mt-1 w-full p-2 border border-gray-300 rounded-lg focus:ring-emerald-500 focus:border-emerald-500"
                    required
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700">Tujuan Distribusi (Opsional)</label>
                  <input
                    name="tujuan_distribusi"
                    value={infoPemesanan.tujuan_distribusi}
                    onChange={handleInfoChange}
                    placeholder="Masukkan tujuan distribusi"
                    className="mt-1 w-full p-2 border border-gray-300 rounded-lg focus:ring-emerald-500 focus:border-emerald-500"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700">Catatan Khusus (Opsional)</label>
                  <textarea
                    name="catatan_khusus"
                    value={infoPemesanan.catatan_khusus}
                    onChange={handleInfoChange}
                    placeholder="Masukkan catatan khusus"
                    className="mt-1 w-full p-2 border border-gray-300 rounded-lg focus:ring-emerald-500 focus:border-emerald-500"
                    rows="4"
                  />
                </div>
              </div>
            </div>

            {/* Detail Pemesanan Obat */}
            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
              <h2 className="text-lg font-semibold text-emerald-700 mb-4">Detail Pemesanan Obat</h2>
              {detailObat.length > 0 && (
                <div className="overflow-x-auto mb-6">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-gray-50">
                        <th className="p-3 text-sm font-semibold text-gray-700">Nama Obat</th>
                        <th className="p-3 text-sm font-semibold text-gray-700">Bentuk Sediaan</th>
                        <th className="p-3 text-sm font-semibold text-gray-700">Dosis</th>
                        <th className="p-3 text-sm font-semibold text-gray-700">Jumlah</th>
                        <th className="p-3 text-sm font-semibold text-gray-700">Harga Satuan</th>
                        <th className="p-3 text-sm font-semibold text-gray-700">Total</th>
                        <th className="p-3 text-sm font-semibold text-gray-700">Aksi</th>
                      </tr>
                    </thead>
                    <tbody>
                      {detailObat.map((item, index) => (
                        <tr key={index} className="border-t">
                          <td className="p-3 text-gray-800">{item.nama_obat}</td>
                          <td className="p-3 text-gray-800">{item.bentuk_sediaan}</td>
                          <td className="p-3 text-gray-800">{item.dosis || '-'}</td>
                          <td className="p-3 text-gray-800">{item.jumlah_pesanan}</td>
                          <td className="p-3 text-gray-800">Rp {Number(item.harga_per_unit).toLocaleString('id-ID')}</td>
                          <td className="p-3 text-gray-800 font-semibold">Rp {Number(item.total_harga).toLocaleString('id-ID')}</td>
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
                      <tr className="bg-gray-50 font-semibold">
                        <td colSpan="5" className="p-3 text-right">Total Harga:</td>
                        <td className="p-3">Rp {infoPemesanan.total_harga.toLocaleString('id-ID')}</td>
                        <td className="p-3"></td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end pt-4 border-t">
                <div className="md:col-span-3">
                  <label className="block text-sm font-medium text-gray-700">Pilih Obat</label>
                  <select
                    onChange={handleItemSelect}
                    value={itemObat.id_produksi}
                    className="mt-1 w-full p-2 border border-gray-300 rounded-lg focus:ring-emerald-500 focus:border-emerald-500"
                  >
                    <option value="">-- Pilih Obat --</option>
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
                  <label className="block text-sm font-medium text-gray-700">Jumlah</label>
                  <input
                    name="jumlah_pesanan"
                    type="number"
                    min="1"
                    value={itemObat.jumlah_pesanan}
                    onChange={handleItemChange}
                    placeholder="Jumlah"
                    className="mt-1 w-full p-2 border border-gray-300 rounded-lg focus:ring-emerald-500 focus:border-emerald-500"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700">Harga Satuan</label>
                  <input
                    name="harga_per_unit"
                    type="number"
                    value={itemObat.harga_per_unit}
                    onChange={handleItemChange}
                    placeholder="Harga satuan"
                    className="mt-1 w-full p-2 border border-gray-300 rounded-lg focus:ring-emerald-500 focus:border-emerald-500"
                    readOnly // Tambahkan readOnly agar pengguna tidak ubah harga
                  />
                </div>
                <div className="md:col-span-2">
                  <button
                    type="button"
                    onClick={handleAddItem}
                    className="mt-6 w-full bg-blue-500 text-white py-2 px-4 rounded-lg hover:bg-blue-600 transition flex items-center justify-center gap-2"
                    disabled={!itemObat.id_produksi || !itemObat.jumlah_pesanan || Number(itemObat.jumlah_pesanan) <= 0}
                  >
                    <Plus size={18} /> Tambah
                  </button>
                </div>
              </div>
            </div>

            {/* Tanda Tangan Apoteker */}
            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
              <h2 className="text-lg font-semibold text-emerald-700 mb-4">Tanda Tangan Apoteker</h2>
              <p className="text-sm text-gray-500 mb-2">Silakan tanda tangan untuk konfirmasi pesanan:</p>
              <div className="w-full h-48 bg-gray-50 border border-gray-300 rounded-lg overflow-hidden">
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
                  className="px-4 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition"
                >
                  Hapus Tanda Tangan
                </button>
              </div>
            </div>

            {/* Tombol-tombol */}
            <div className="flex justify-end gap-4 mt-6">
              <button
                type="button"
                onClick={() => navigate('/pbf/pesan-obat')}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition"
              >
                Kembali
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition disabled:bg-gray-400 flex items-center gap-2"
              >
                {isSubmitting && <Loader2 className="animate-spin" size={18} />}
                {isSubmitting ? 'Menyimpan...' : 'Simpan Pesanan'}
              </button>
            </div>
          </form>
        </main>
      </div>
    </div>
  );
};

export default TambahPesanan;