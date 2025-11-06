import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import NavbarApotek from '../../../components/NavbarApotek';
import {
  Plus,
  Trash2,
  Loader2,
  ArrowLeft,
  User,
  FileText,
  Edit,
  Package,
  AlertTriangle,
  X,
  ShoppingCart,
  Info,
  Camera,
} from 'lucide-react'; // Import semua ikon yang relevan
import SignatureCanvas from 'react-signature-canvas';
import axios from 'axios';
import { toast } from 'react-hot-toast';

const TambahPesananApotek = () => {
  const navigate = useNavigate();
  const { idPbf } = useParams();
  const location = useLocation();
  const sigCanvas = useRef({});
  const [originalStokPbf, setOriginalStokPbf] = useState([]);
  const [infoApoteker, setInfoApoteker] = useState({
    nama_apotek: '',
    alamat_apotek: '',
    jabatan: '',
    nomor_sipa: '',
    telepon: '',
  });
  const [itemObat, setItemObat] = useState({
    id: '',
    nama_obat: '',
    keterangan: '',
    qty: '', // Default string kosong
    satuan: '',
    harga_satuan: 0,
    stok_tersedia: 0,
  });
  const [detailPesanan, setDetailPesanan] = useState([]);
  const [error, setError] = useState('');
  const [isStokLoading, setIsStokLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const username = localStorage.getItem('username');
  const pbfInfo = location.state || { namaPbf: 'PBF Tujuan', alamatPbf: 'Alamat PBF' };

  const availableStock = useMemo(() => {
    return originalStokPbf.map((stokItem) => {
      const itemInCart = detailPesanan.find((cartItem) => cartItem.id === stokItem.id);
      const quantityInCart = itemInCart ? itemInCart.qty : 0;
      const currentStock = (stokItem.jumlah || 0) - quantityInCart;
      return {
        ...stokItem,
        stok_saat_ini: currentStock >= 0 ? currentStock : 0,
      };
    });
  }, [originalStokPbf, detailPesanan]);

  useEffect(() => {
    const fetchProfile = async () => {
      let token;
      try {
        token = localStorage.getItem('token');
        if (!token) throw new Error('Otentikasi Gagal. Silakan login kembali.');
        const response = await axios.get('http://localhost:5000/api/apotek/profile', {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (response.data.success && response.data.data) {
          const { nama_resmi, alamat, nomor_izin, kontak_telepon } = response.data.data;
          setInfoApoteker((prev) => ({
            ...prev,
            nama_apotek: nama_resmi || '',
            alamat_apotek: alamat || '',
            nomor_sipa: nomor_izin || '',
            telepon: kontak_telepon || '',
          }));
        } else {
          throw new Error(response.data.message || 'Gagal memuat profil Apotek.');
        }
      } catch (err) {
        const errorMsg =
          err.response?.data?.message || err.message || 'Gagal memuat profil Apotek.';
        setError(errorMsg);
        toast.error(errorMsg);
        if (
          (err.message.includes('401') ||
            err.message.includes('403') ||
            err.message.includes('login')) &&
          token
        ) {
          navigate('/login/apotek');
        } else if (!token) {
          navigate('/login/apotek');
        }
      }
    };
    fetchProfile();
  }, [navigate]);

  useEffect(() => {
    const fetchStokPbf = async () => {
      if (!idPbf) {
        setError('ID PBF tidak ditemukan. Silakan pilih PBF kembali.');
        setIsStokLoading(false);
        return;
      }
      setIsStokLoading(true);
      setError('');
      let token;
      try {
        token = localStorage.getItem('token');
        if (!token) throw new Error('Otentikasi Gagal');
        const response = await axios.get(`http://localhost:5000/api/apotek/pbf/${idPbf}/stok`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (response.data.success) {
          setOriginalStokPbf(response.data.data || []);
        } else {
          throw new Error(response.data.message || 'Gagal mengambil data stok PBF.');
        }
      } catch (err) {
        const errorMsg =
          err.response?.data?.message || err.message || 'Gagal memuat stok obat dari PBF.';
        setError(errorMsg);
        toast.error(errorMsg);
        if (
          (err.message.includes('401') ||
            err.message.includes('403') ||
            err.message.includes('login')) &&
          token
        ) {
          navigate('/login/apotek');
        } else if (!token) {
          navigate('/login/apotek');
        }
      } finally {
        setIsStokLoading(false);
      }
    };
    fetchStokPbf();
  }, [idPbf, navigate]);

  const handleInfoChange = (e) => {
    const { name, value } = e.target;
    setInfoApoteker({ ...infoApoteker, [name]: value });
  };

  const handleObatSelect = (e) => {
    const selectedObatId = e.target.value;
    const selectedObat = availableStock.find((obat) => obat.id === selectedObatId);

    if (selectedObat) {
      setItemObat({
        id: selectedObat.id,
        nama_obat: selectedObat.nama_obat,
        keterangan: `${selectedObat.dosis || ''} ${selectedObat.bentuk_sediaan || ''}`.trim(),
        qty: '', // Reset ke string kosong
        satuan: selectedObat.bentuk_sediaan || 'Box',
        harga_satuan: selectedObat.harga_per_unit || 0,
        stok_tersedia: selectedObat.stok_saat_ini || 0,
      });
    } else {
      setItemObat({
        id: '',
        nama_obat: '',
        keterangan: '',
        qty: '',
        satuan: '',
        harga_satuan: 0,
        stok_tersedia: 0,
      });
    }
  };

  // --- PERBAIKAN 2: handleQtyChange ---
  const handleQtyChange = (e) => {
    const value = e.target.value;

    // 1. Jika inputnya non-numerik (kecuali string kosong), abaikan.
    // Ini mencegah 'abc', '1.5', 'e', atau '-'
    if (value !== '' && !/^\d+$/.test(value)) {
      return;
    }

    // 2. Jika string kosong, izinkan (user sedang menghapus)
    if (value === '') {
      setItemObat({ ...itemObat, qty: '' });
      return;
    }

    const newQty = parseInt(value, 10);

    // 3. Jika (secara teknis) NaN (seharusnya tidak terjadi karena regex)
    if (isNaN(newQty)) {
      setItemObat({ ...itemObat, qty: '' });
      return;
    }

    // 4. Cek stok
    if (newQty > itemObat.stok_tersedia) {
      toast.error(`Jumlah tidak boleh melebihi stok tersedia (${itemObat.stok_tersedia})`);
      // Set ke stok maks
      setItemObat({ ...itemObat, qty: itemObat.stok_tersedia });
    } else {
      // 5. Input valid (termasuk "0" atau "123"), simpan stringnya
      // (Logika `handleAddItem` akan memvalidasi jika nilainya > 0 saat submit)
      setItemObat({ ...itemObat, qty: value });
    }
  };
  // --- AKHIR PERBAIKAN ---

  const handleAddItem = () => {
    setError('');
    toast.dismiss();

    if (!itemObat.id) {
      toast.error('Silakan pilih obat yang valid.');
      return;
    }

    // Validasi qty > 0 saat submit
    const qtyToAdd = parseInt(itemObat.qty, 10);
    if (isNaN(qtyToAdd) || qtyToAdd <= 0) {
      toast.error('Jumlah pesanan harus lebih dari 0.');
      return;
    }

    if (qtyToAdd > itemObat.stok_tersedia) {
      toast.error(
        `Jumlah pesanan (${qtyToAdd}) melebihi stok tersedia untuk batch ini (${itemObat.stok_tersedia}).`
      );
      return;
    }

    const hargaSatuan = parseFloat(itemObat.harga_satuan);
    const existingItemIndex = detailPesanan.findIndex((item) => item.id === itemObat.id);

    if (existingItemIndex > -1) {
      const updatedDetailPesanan = [...detailPesanan];
      const existingItem = updatedDetailPesanan[existingItemIndex];
      const newQty = existingItem.qty + qtyToAdd;
      const originalStockInfo = originalStokPbf.find((s) => s.id === itemObat.id);
      const maxStock = originalStockInfo ? originalStockInfo.jumlah : 0;

      if (newQty > maxStock) {
        toast.error(
          `Total jumlah di keranjang (${newQty}) melebihi stok awal batch ini (${maxStock}).`
        );
        return;
      }

      existingItem.qty = newQty;
      existingItem.total_harga = newQty * existingItem.harga_satuan;
      setDetailPesanan(updatedDetailPesanan);
      toast.success(`${itemObat.nama_obat} (batch ${itemObat.id.slice(-6)}) diperbarui.`);
    } else {
      const newItem = {
        id: itemObat.id,
        nama_obat: itemObat.nama_obat,
        satuan: itemObat.satuan,
        keterangan: itemObat.keterangan,
        qty: qtyToAdd,
        harga_satuan: hargaSatuan,
        total_harga: qtyToAdd * hargaSatuan,
      };
      setDetailPesanan([...detailPesanan, newItem]);
      toast.success(`${itemObat.nama_obat} (batch ${itemObat.id.slice(-6)}) ditambahkan.`);
    }

    setItemObat({
      id: '',
      nama_obat: '',
      keterangan: '',
      qty: '',
      satuan: '',
      harga_satuan: 0,
      stok_tersedia: 0,
    });
  };

  const handleRemoveItem = (index) => {
    const removedItem = detailPesanan[index];
    setDetailPesanan(detailPesanan.filter((_, i) => i !== index));
    toast.error(`${removedItem.nama_obat} (batch ${removedItem.id.slice(-6)}) dihapus.`);
  };

  const clearSignature = () => sigCanvas.current.clear();
  const totalHarga = detailPesanan.reduce((sum, item) => sum + (item.total_harga || 0), 0);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    toast.dismiss();
    if (detailPesanan.length === 0) {
      const msg = 'Keranjang pesanan kosong. Harap tambahkan minimal satu item obat.';
      setError(msg);
      toast.error(msg);
      return;
    }
    if (sigCanvas.current.isEmpty()) {
      const msg = 'Tanda tangan Apoteker Penanggung Jawab wajib diisi.';
      setError(msg);
      toast.error(msg);
      return;
    }
    if (!infoApoteker.jabatan || !infoApoteker.telepon) {
      const msg = 'Jabatan Penanggung Jawab dan Telepon Apotek wajib diisi.';
      setError(msg);
      toast.error(msg);
      return;
    }

    setIsSubmitting(true);
    try {
      const token = localStorage.getItem('token');
      if (!token) throw new Error('Otentikasi Gagal');
      const tanda_tangan_data_url = sigCanvas.current.getTrimmedCanvas().toDataURL('image/png');

      const payload = {
        nama_apotek: infoApoteker.nama_apotek,
        alamat_apotek: infoApoteker.alamat_apotek,
        jabatan: infoApoteker.jabatan,
        nomor_sipa: infoApoteker.nomor_sipa,
        telepon: infoApoteker.telepon,
        id_pbf: parseInt(idPbf, 10),
        items: detailPesanan.map((item) => ({
          id_aset_blockchain: item.id, // Ini adalah Batch ID dari PBF
          nama_obat: item.nama_obat,
          keterangan: item.keterangan,
          qty: item.qty,
          satuan: item.satuan,
          harga_satuan: item.harga_satuan,
        })),
        total_harga: totalHarga,
        tanda_tangan_data_url,
      };

      console.log('Payload yang akan dikirim ke backend:', payload);

      const response = await axios.post('http://localhost:5000/api/apotek/pesanan', payload, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.data.success) {
        toast.success('Pesanan berhasil dibuat!');
        navigate('/apotek/pesan-obat');
      } else {
        throw new Error(response.data.message || 'Gagal membuat pesanan.');
      }
    } catch (err) {
      const errorMsg = err.response?.data?.message || err.message || 'Kesalahan Server Internal.';
      setError(errorMsg);
      toast.error(errorMsg);
      console.error('Submit error:', err.response || err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleLogout = () => {
    // Tambahkan handleLogout
    localStorage.clear();
    navigate('/');
  };

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-slate-50 via-emerald-50/30 to-slate-50">
      <div className="flex-1 flex flex-col">
        <NavbarApotek onLogout={handleLogout} username={username} />
        <main className="flex-1 overflow-auto pt-16 md:pt-20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 md:py-10">
            {/* Header Section */}
            <div className="mb-6 md:mb-8">
              <button
                onClick={() => navigate('/apotek/pesan-obat/pilih-pbf')} // Ganti ke /pilih-pbf
                className="mb-4 inline-flex items-center text-emerald-600 hover:text-emerald-700 transition-colors text-sm font-medium group"
              >
                <ArrowLeft
                  size={16}
                  className="mr-1.5 group-hover:-translate-x-1 transition-transform"
                />
                Kembali Pilih PBF
              </button>
              <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 md:p-6">
                <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold text-slate-900 mb-2">
                  Form Pemesanan Obat
                </h1>
                <p className="text-sm md:text-base text-slate-600">
                  Lengkapi detail pesanan Anda ke{' '}
                  <span className="font-semibold text-emerald-700">{pbfInfo.namaPbf}</span>
                </p>
              </div>
            </div>

            {/* Error Alert */}
            {error && (
              <div className="p-4 mb-6 bg-red-50 text-red-700 rounded-xl border border-red-200 text-sm font-medium flex items-start gap-3 shadow-sm">
                <AlertTriangle size={20} className="flex-shrink-0 mt-0.5" />
                <span className="flex-1">{error}</span>
                <button
                  onClick={() => setError('')}
                  className="flex-shrink-0 hover:bg-red-100 rounded p-1"
                >
                  <X size={16} />
                </button>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Informasi Apotek */}
              <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="bg-gradient-to-r from-emerald-500 to-emerald-600 px-4 md:px-6 py-4">
                  <h2 className="text-base md:text-lg font-semibold text-white flex items-center gap-2">
                    <User size={20} /> Informasi Apotek Pemesan
                  </h2>
                </div>
                <div className="p-4 md:p-6 grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                  <InputField
                    label="Nama Apotek"
                    value={infoApoteker.nama_apotek}
                    readOnly
                    disabled
                  />
                  <InputField
                    label="Alamat Apotek"
                    value={infoApoteker.alamat_apotek}
                    readOnly
                    disabled
                  />
                  <InputField
                    label="Nomor SIPA"
                    value={infoApoteker.nomor_sipa}
                    readOnly
                    disabled
                  />
                  <InputField
                    label="Telepon"
                    name="telepon"
                    value={infoApoteker.telepon}
                    onChange={handleInfoChange}
                    placeholder="Masukkan nomor telepon aktif"
                    required
                  />
                  <div className="md:col-span-2">
                    <InputField
                      label="Jabatan Penanggung Jawab"
                      name="jabatan"
                      value={infoApoteker.jabatan}
                      onChange={handleInfoChange}
                      placeholder="Contoh: Apoteker Penanggung Jawab"
                      required
                    />
                  </div>
                </div>
              </div>

              {/* Detail Pesanan */}
              <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="bg-gradient-to-r from-blue-500 to-blue-600 px-4 md:px-6 py-4">
                  <div className="flex items-center justify-between">
                    <h2 className="text-base md:text-lg font-semibold text-white flex items-center gap-2">
                      <ShoppingCart size={20} /> Keranjang Pesanan
                    </h2>
                    <span className="bg-white/20 backdrop-blur-sm text-white text-xs md:text-sm font-medium px-3 py-1 rounded-full">
                      {detailPesanan.length} Item
                    </span>
                  </div>
                </div>

                {/* Mobile Card View */}
                {detailPesanan.length > 0 && (
                  <>
                    <div className="block md:hidden divide-y divide-slate-100">
                      {detailPesanan.map((item, index) => (
                        <div key={index} className="p-4 hover:bg-slate-50 transition-colors">
                          <div className="flex justify-between items-start mb-3">
                            <div className="flex-1">
                              <h3 className="font-semibold text-slate-900 text-sm mb-1">
                                {item.nama_obat}
                              </h3>
                              <p className="text-xs text-slate-600">{item.satuan}</p>
                              <p className="text-xs text-slate-500 mt-1">
                                {item.keterangan || '-'}
                              </p>
                            </div>
                            <button
                              type="button"
                              onClick={() => handleRemoveItem(index)}
                              className="text-red-500 hover:text-red-700 p-2 hover:bg-red-50 rounded-lg ml-2"
                            >
                              <Trash2 size={18} />
                            </button>
                          </div>
                          <div className="grid grid-cols-2 gap-2 text-sm">
                            <div>
                              <span className="text-slate-500 text-xs">Jumlah:</span>
                              <p className="font-semibold text-emerald-600">{item.qty}</p>
                            </div>
                            <div>
                              <span className="text-slate-500 text-xs">Harga Satuan:</span>
                              <p className="font-medium">
                                Rp{' '}
                                {Number(item.harga_satuan || 0).toLocaleString('id-ID', {
                                  minimumFractionDigits: 2,
                                })}
                              </p>
                            </div>
                            <div className="col-span-2">
                              <span className="text-slate-500 text-xs">Total:</span>
                              <p className="font-bold text-slate-900">
                                Rp{' '}
                                {Number(item.total_harga || 0).toLocaleString('id-ID', {
                                  minimumFractionDigits: 2,
                                })}
                              </p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Desktop Table View */}
                    <div className="hidden md:block overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead className="bg-slate-50 text-slate-700">
                          <tr>
                            <th className="px-4 py-3 text-left font-semibold border-b border-slate-200">
                              Nama Obat
                            </th>
                            <th className="px-4 py-3 text-left font-semibold border-b border-slate-200">
                              Sediaan
                            </th>
                            <th className="px-4 py-3 text-left font-semibold border-b border-slate-200">
                              Keterangan
                            </th>
                            <th className="px-4 py-3 text-center font-semibold border-b border-slate-200">
                              Jumlah
                            </th>
                            <th className="px-4 py-3 text-right font-semibold border-b border-slate-200">
                              Harga Satuan
                            </th>
                            <th className="px-4 py-3 text-right font-semibold border-b border-slate-200">
                              Total
                            </th>
                            <th className="px-4 py-3 text-center font-semibold border-b border-slate-200">
                              Aksi
                            </th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {detailPesanan.map((item, index) => (
                            <tr key={index} className="hover:bg-slate-50 transition-colors">
                              <td className="px-4 py-3 font-medium text-slate-800">
                                {item.nama_obat}
                              </td>
                              <td className="px-4 py-3 text-slate-600">{item.satuan}</td>
                              <td className="px-4 py-3 text-slate-600">{item.keterangan || '-'}</td>
                              <td className="px-4 py-3 text-center font-medium text-emerald-700">
                                {item.qty}
                              </td>
                              <td className="px-4 py-3 text-right text-slate-600">
                                Rp {Number(item.harga_satuan).toLocaleString('id-ID')}
                              </td>
                              <td className="px-4 py-3 font-semibold text-slate-800 text-right">
                                Rp{' '}
                                {Number(item.total_harga || 0).toLocaleString('id-ID', {
                                  minimumFractionDigits: 2,
                                })}
                              </td>
                              <td className="px-4 py-3 text-center">
                                <button
                                  type="button"
                                  onClick={() => handleRemoveItem(index)}
                                  className="text-red-500 hover:text-red-700 p-2 hover:bg-red-50 rounded-lg transition-colors inline-flex"
                                  title="Hapus Item"
                                >
                                  <Trash2 size={16} />
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    {/* Total Section */}
                    <div className="bg-gradient-to-r from-slate-50 to-slate-100 px-4 md:px-6 py-4 border-t-2 border-slate-300">
                      <div className="flex justify-between items-center">
                        <span className="text-sm md:text-base font-semibold text-slate-700">
                          Total Harga Keseluruhan:
                        </span>
                        <span className="text-lg md:text-xl font-bold text-slate-900">
                          Rp{' '}
                          {Number(totalHarga || 0).toLocaleString('id-ID', {
                            minimumFractionDigits: 2,
                          })}
                        </span>
                      </div>
                    </div>
                  </>
                )}

                {/* Add Item Form */}
                <div className="p-4 md:p-6 border-t border-slate-200 bg-slate-50/50">
                  <h3 className="text-sm font-semibold text-slate-700 mb-4 flex items-center gap-2">
                    <Plus size={18} /> Tambah Item Obat
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-3 md:gap-4">
                    <div className="sm:col-span-2 lg:col-span-5">
                      <label className="block text-xs md:text-sm font-medium text-slate-700 mb-1.5">
                        Pilih Obat
                      </label>
                      <select
                        name="id"
                        value={itemObat.id || ''}
                        onChange={handleObatSelect}
                        className="w-full px-3 md:px-4 py-2 md:py-2.5 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition bg-white"
                        disabled={isStokLoading}
                      >
                        <option value="">
                          {isStokLoading ? 'Memuat stok...' : '-- Pilih Obat Tersedia --'}
                        </option>
                        {availableStock
                          .filter((o) => o.stok_saat_ini > 0)
                          .map((o) => (
                            <option key={o.id} value={o.id}>
                              {o.nama_obat} ({o.dosis} {o.bentuk_sediaan}) - Batch: {o.id.slice(-6)}{' '}
                              (Stok: {o.stok_saat_ini})
                            </option>
                          ))}
                      </select>
                    </div>
                    <div className="lg:col-span-2">
                      <label className="block text-xs md:text-sm font-medium text-slate-700 mb-1.5">
                        Jumlah
                      </label>
                      <input
                        type="text" // Diubah ke text untuk mengizinkan string kosong
                        name="qty"
                        value={itemObat.qty}
                        onChange={handleQtyChange}
                        disabled={!itemObat.id}
                        className="w-full px-3 md:px-4 py-2 md:py-2.5 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition disabled:bg-slate-100 disabled:cursor-not-allowed"
                        placeholder="0"
                      />
                    </div>
                    <div className="lg:col-span-3">
                      <label className="block text-xs md:text-sm font-medium text-slate-700 mb-1.5">
                        Harga Satuan
                      </label>
                      <input
                        type="text"
                        value={`Rp ${Number(itemObat.harga_satuan).toLocaleString('id-ID')}`}
                        readOnly
                        disabled
                        className="w-full px-3 md:px-4 py-2 md:py-2.5 text-sm border border-slate-300 rounded-lg bg-slate-100 text-slate-500 cursor-not-allowed"
                      />
                    </div>
                    <div className="sm:col-span-2 lg:col-span-2">
                      <label className="block text-xs md:text-sm font-medium text-slate-700 mb-1.5 opacity-0">
                        Action
                      </label>
                      <button
                        type="button"
                        onClick={handleAddItem}
                        className="w-full bg-emerald-600 text-white py-2 md:py-2.5 px-4 rounded-lg hover:bg-emerald-700 disabled:bg-slate-400 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition-colors shadow-sm text-sm font-medium"
                        disabled={!itemObat.id || isStokLoading || !itemObat.qty}
                      >
                        <Plus size={18} /> Tambah
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Signature Section */}
              <div className="bg-white p-4 md:p-6 rounded-xl shadow-sm border border-slate-200">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-base md:text-lg font-semibold text-emerald-700 flex items-center gap-2">
                      <Edit size={18} />
                      Tanda Tangan Apoteker*
                    </h3>
                    <p className="text-xs md:text-sm text-slate-500 mt-1">
                      Tanda tangan di area kosong di bawah ini
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={clearSignature}
                    className="px-3 md:px-4 py-1.5 md:py-2 text-xs md:text-sm text-red-600 hover:text-red-800 hover:bg-red-50 rounded-lg transition-colors font-medium border border-red-200"
                  >
                    Hapus
                  </button>
                </div>
                <div className="w-full h-40 md:h-48 lg:h-56 bg-slate-50 border-2 border-dashed border-slate-300 rounded-xl overflow-hidden hover:border-emerald-400 transition-colors">
                  <SignatureCanvas
                    ref={sigCanvas}
                    penColor="black"
                    canvasProps={{ className: 'w-full h-full' }}
                  />
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row justify-end gap-3 pt-4 sticky bottom-0 bg-gradient-to-t from-slate-50 via-slate-50 to-transparent pb-4">
                <button
                  type="button"
                  onClick={() => navigate('/apotek/pesan-obat')}
                  className="w-full sm:w-auto px-6 py-2.5 md:py-3 border-2 border-slate-300 text-slate-700 font-medium rounded-lg hover:bg-slate-50 transition-colors text-sm md:text-base"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || detailPesanan.length === 0}
                  className="w-full sm:w-auto px-6 py-2.5 md:py-3 bg-emerald-600 text-white font-medium rounded-lg hover:bg-emerald-700 transition-all disabled:bg-slate-400 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg hover:shadow-xl text-sm md:text-base"
                >
                  {isSubmitting ? (
                    <Loader2 className="animate-spin" size={18} />
                  ) : (
                    <Package size={18} />
                  )}
                  {isSubmitting ? 'Mengirim Pesanan...' : 'Kirim Pesanan'}
                </button>
              </div>
            </form>
          </div>
        </main>
      </div>
    </div>
  );
};

const InputField = ({ label, readOnly = false, ...props }) => (
  <div>
    <label className="block text-xs md:text-sm font-medium text-slate-700 mb-1.5">
      {label}
      {props.required && <span className="text-red-500 ml-1">*</span>}
    </label>
    <input
      {...props}
      readOnly={readOnly}
      className={`w-full px-3 md:px-4 py-2 md:py-2.5 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition ${readOnly ? 'bg-slate-100 text-slate-500 cursor-not-allowed' : 'bg-white hover:border-slate-400'}`}
    />
  </div>
);

export default TambahPesananApotek;
