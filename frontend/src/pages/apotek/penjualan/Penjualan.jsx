import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom'; // <-- 1. Import Link
import NavbarApotek from '../../../components/NavbarApotek';
import {
  Search,
  Trash2,
  QrCode,
  ShoppingCart,
  Plus,
  Loader2,
  AlertTriangle,
  X,
  CheckCircle2,
  History, // <-- 2. Import History
} from 'lucide-react';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import QRCode from 'react-qr-code'; // Pastikan Anda sudah install: npm install react-qr-code --legacy-peer-deps

// --- MODAL HASIL PENJUALAN (BARU) ---
const HasilPenjualanModal = ({ show, onClose, soldAssetIds }) => {
  if (!show) return null;

  return (
    <div
      className="fixed inset-0 bg-black/20 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div
        className="bg-white p-6 rounded-xl shadow-2xl max-w-lg w-full mx-auto animate-in fade-in zoom-in-95 duration-200 border border-slate-200"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center pb-3 border-b border-slate-200">
          <h3 className="text-lg font-semibold text-slate-800">Penjualan Berhasil</h3>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 rounded-full p-1"
          >
            <X size={20} />
          </button>
        </div>

        <div className="mt-4 text-center">
          <CheckCircle2 size={48} className="text-emerald-500 mx-auto mb-4" />
          <p className="text-slate-600 mb-6">
            Penjualan telah berhasil dicatat. Berikan QR code ini kepada pelanggan untuk melacak
            riwayat obat.
          </p>
        </div>

        {/* Daftar QR Code */}
        <div className="space-y-4 max-h-[40vh] overflow-y-auto p-4 bg-slate-50 rounded-lg border">
          {soldAssetIds.map((asset, index) => (
            <div
              key={index}
              className="flex flex-col sm:flex-row items-center gap-4 p-4 bg-white rounded-lg border"
            >
              <div className="p-2 bg-white border rounded-lg">
                <QRCode
                  // Arahkan ke halaman detail publik Anda
                  value={`http://localhost:5173/blockchain-detail/${asset.id_aset_blockchain}`}
                  size={80}
                  viewBox={`0 0 80 80`}
                />
              </div>
              <div className="flex-1 text-center sm:text-left">
                <p className="font-semibold text-slate-800">{asset.nama_obat}</p>
                <p className="text-xs text-slate-500 font-mono">
                  Batch ID: {asset.id_aset_blockchain.slice(-6)}
                </p>
                <p className="text-sm text-slate-700">Jumlah: {asset.jumlah_jual}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="flex justify-end gap-3 mt-6">
          <button
            onClick={onClose}
            className="w-full px-6 py-2.5 font-medium rounded-lg transition bg-emerald-600 text-white hover:bg-emerald-700"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
};
// --- AKHIR MODAL ---

const Penjualan = () => {
  const navigate = useNavigate();
  const [keranjang, setKeranjang] = useState([]);
  const [nominalBayar, setNominalBayar] = useState('');
  const [namaPelanggan, setNamaPelanggan] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const username = localStorage.getItem('username');

  // --- State untuk Stok dan Search ---
  const [stokApotek, setStokApotek] = useState([]);
  const [isStokLoading, setIsStokLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStokId, setSelectedStokId] = useState('');
  const [jumlahJual, setJumlahJual] = useState(1);

  // --- State untuk Modal Hasil ---
  const [showHasilModal, setShowHasilModal] = useState(false);
  const [hasilPenjualan, setHasilPenjualan] = useState([]);

  // --- Fetch Stok Apotek ---
  const fetchStok = useCallback(async () => {
    setIsStokLoading(true);
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        toast.error('Sesi tidak valid.');
        navigate('/login/apotek');
        return;
      }
      // Panggil endpoint stok baru
      const response = await axios.get('http://localhost:5000/api/apotek/penjualan/stok', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.data.success) {
        setStokApotek(response.data.data || []);
      } else {
        throw new Error(response.data.message || 'Gagal memuat stok.');
      }
    } catch (err) {
      const errorMsg = err.response?.data?.message || err.message;
      setError(errorMsg);
      toast.error(errorMsg);
      if (err.response?.status === 401) navigate('/login/apotek');
    } finally {
      setIsStokLoading(false);
    }
  }, [navigate]);

  useEffect(() => {
    fetchStok();
  }, [fetchStok]);

  // --- Filter stok berdasarkan keranjang ---
  const availableStock = useMemo(() => {
    return stokApotek
      .map((stokItem) => {
        const itemInCart = keranjang.find(
          (cartItem) => cartItem.id_aset_blockchain === stokItem.id
        );
        const quantityInCart = itemInCart ? itemInCart.jumlah_jual : 0;
        const currentStock = (stokItem.jumlah || 0) - quantityInCart;

        return {
          ...stokItem,
          stok_saat_ini: currentStock,
        };
      })
      .filter((stokItem) => stokItem.stok_saat_ini > 0); // Hanya tampilkan yang stoknya masih ada
  }, [stokApotek, keranjang]);

  // --- Filter stok berdasarkan pencarian ---
  const searchResults = useMemo(() => {
    if (!searchTerm) return [];

    const lowerSearchTerm = searchTerm.toLowerCase();

    return availableStock.filter((item) => {
      const nama = item.nama_obat || ''; // Fallback ke string kosong
      const id = item.id || ''; // Fallback ke string kosong

      return (
        nama.toLowerCase().includes(lowerSearchTerm) || id.toLowerCase().includes(lowerSearchTerm)
      );
    });
  }, [searchTerm, availableStock]);

  const handleSelectStok = (stokId) => {
    setSelectedStokId(stokId);
    const selected = availableStock.find((s) => s.id === stokId);
    if (selected) {
      setSearchTerm(`${selected.nama_obat} (Batch: ${selected.id.slice(-6)})`); // Set search bar
    }
    setJumlahJual(1); // Reset jumlah
  };

  // --- Aksi Keranjang ---
  const handleAddItem = () => {
    setError(null);
    toast.dismiss();
    const selectedObat = availableStock.find((s) => s.id === selectedStokId);

    if (!selectedObat) {
      toast.error('Silakan pilih obat yang valid dari daftar pencarian.');
      return;
    }

    const qtyToAdd = Number(jumlahJual);
    if (isNaN(qtyToAdd) || qtyToAdd <= 0) {
      toast.error('Jumlah harus lebih dari 0.');
      return;
    }
    if (qtyToAdd > selectedObat.stok_saat_ini) {
      toast.error(`Jumlah melebihi stok tersedia (${selectedObat.stok_saat_ini}).`);
      return;
    }

    const existingItemIndex = keranjang.findIndex(
      (item) => item.id_aset_blockchain === selectedObat.id
    );

    if (existingItemIndex > -1) {
      const updatedKeranjang = [...keranjang];
      const item = updatedKeranjang[existingItemIndex];
      item.jumlah_jual += qtyToAdd;
      item.total_item = item.jumlah_jual * item.harga_satuan;
      setKeranjang(updatedKeranjang);
      toast.success(`${selectedObat.nama_obat} diperbarui di keranjang.`);
    } else {
      const newItem = {
        id_aset_blockchain: selectedObat.id,
        nama_obat: selectedObat.nama_obat,
        batchId: selectedObat.id,
        harga_satuan: selectedObat.harga_per_unit || 0,
        jumlah_jual: qtyToAdd,
        total_item: qtyToAdd * (selectedObat.harga_per_unit || 0),
        satuan: selectedObat.bentuk_sediaan || 'Box',
      };
      setKeranjang([...keranjang, newItem]);
      toast.success(`${selectedObat.nama_obat} ditambahkan ke keranjang.`);
    }

    // Reset input
    setSearchTerm('');
    setSelectedStokId('');
    setJumlahJual(1);
  };

  const handleHapusItem = (id_aset_blockchain) => {
    setKeranjang(keranjang.filter((item) => item.id_aset_blockchain !== id_aset_blockchain));
    toast.error('Item dihapus dari keranjang.');
  };

  const handleLogout = () => {
    localStorage.clear();
    navigate('/');
  };

  // --- Kalkulasi Total ---
  const subtotal = keranjang.reduce((acc, item) => acc + item.total_item, 0);
  const pajak = 0; // Pajak 0
  const total = subtotal + pajak;
  const kembalian = (Number(nominalBayar) || 0) >= total ? Number(nominalBayar) - total : 0;

  // --- PROSES PEMBAYARAN ---
  const handleProsesPembayaran = async () => {
    setError(null);
    toast.dismiss();

    if (keranjang.length === 0) {
      toast.error('Keranjang masih kosong.');
      return;
    }
    if ((Number(nominalBayar) || 0) < total) {
      toast.error('Nominal bayar tidak mencukupi total belanja.');
      return;
    }

    setIsSubmitting(true);
    const toastId = toast.loading('Memproses penjualan...');

    try {
      const token = localStorage.getItem('token');
      if (!token) throw new Error('Sesi tidak valid.');

      const payload = {
        items: keranjang, // Mengirim semua data keranjang
        total_harga: total,
        nama_pelanggan: namaPelanggan || 'Konsumen',
      };

      // Panggil endpoint baru
      const response = await axios.post(
        'http://localhost:5000/api/apotek/penjualan/proses',
        payload,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (response.data.success) {
        toast.success('Penjualan berhasil dicatat!', { id: toastId });
        setHasilPenjualan(response.data.soldAssetIds); // Simpan data untuk QR
        setShowHasilModal(true);
        // Reset state
        setKeranjang([]);
        setNominalBayar('');
        setNamaPelanggan('');
        fetchStok(); // Ambil ulang stok
      } else {
        throw new Error(response.data.message || 'Gagal memproses penjualan.');
      }
    } catch (err) {
      const errorMsg = err.response?.data?.message || err.message;
      setError(errorMsg);
      toast.error(errorMsg, { id: toastId });
      if (err.response?.status === 401) navigate('/login/apotek');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-slate-50 via-white to-emerald-50">
      <HasilPenjualanModal
        show={showHasilModal}
        onClose={() => setShowHasilModal(false)}
        soldAssetIds={hasilPenjualan}
      />
      <div className="flex-1 flex flex-col">
        <NavbarApotek onLogout={handleLogout} username={username} />

        <main className="flex-1 overflow-auto pt-[72px]">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            {/* --- PERBAIKAN HEADER --- */}
            <div className="mb-10 relative">
              <div className="absolute -top-20 -left-20 w-72 h-72 bg-emerald-200 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob"></div>
              <div className="absolute -top-20 -right-20 w-72 h-72 bg-teal-200 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000"></div>

              <div className="relative flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                {/* Judul */}
                <div className="flex items-center gap-3">
                  <div className="flex items-center justify-center w-12 h-12 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl shadow-lg">
                    <ShoppingCart className="text-white" size={24} />
                  </div>
                  <div>
                    <h1 className="text-4xl font-bold bg-gradient-to-r from-slate-900 via-emerald-900 to-teal-900 bg-clip-text text-transparent">
                      Kasir Penjualan
                    </h1>
                    <p className="text-slate-600 text-lg mt-1">
                      Pilih obat dari stok untuk dijual kepada konsumen.
                    </p>
                  </div>
                </div>

                {/* Tombol Riwayat Baru */}
                <Link
                  to="/apotek/riwayat-penjualan"
                  className="w-full sm:w-auto flex items-center justify-center gap-2 bg-white text-emerald-700 border border-emerald-300 hover:bg-emerald-50 py-2.5 px-5 rounded-lg font-medium shadow-sm hover:shadow-md transition-all duration-200 whitespace-nowrap"
                >
                  <History size={18} />
                  Lihat Riwayat Penjualan
                </Link>
              </div>
            </div>
            {/* --- AKHIR PERBAIKAN HEADER --- */}

            {error && (
              <div className="p-4 mb-6 bg-red-50 text-red-700 rounded-xl border border-red-200 flex items-center gap-2 text-sm shadow-sm">
                <AlertTriangle size={18} /> {error}
              </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 relative z-10">
              {/* Kolom Kiri: Input dan Tabel */}
              <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="p-6 border-b border-slate-200">
                  <div className="flex flex-col md:flex-row gap-4">
                    {/* --- AUTOCOMPLETE SEARCH --- */}
                    <div className="relative flex-grow">
                      <label className="block text-sm font-medium text-slate-700 mb-2">
                        Cari Obat (Nama atau Batch)
                      </label>
                      <Search className="absolute left-3 top-[calc(50%+8px)] -translate-y-1/2 h-5 w-5 text-slate-400" />
                      <input
                        type="text"
                        placeholder={
                          isStokLoading ? 'Memuat stok...' : 'Cari nama obat atau batch ID...'
                        }
                        className="w-full pl-10 pr-4 py-2.5 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
                        value={searchTerm}
                        onChange={(e) => {
                          setSearchTerm(e.target.value);
                          setSelectedStokId('');
                        }}
                        disabled={isStokLoading}
                      />
                      {/* --- HASIL SEARCH --- */}
                      {searchTerm && searchResults.length > 0 && (
                        <div className="absolute z-20 w-full mt-1 bg-white border border-slate-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                          {searchResults.map((item) => (
                            <div
                              key={item.id}
                              onClick={() => handleSelectStok(item.id)}
                              className="p-3 hover:bg-emerald-50 cursor-pointer border-b last:border-b-0"
                            >
                              <p className="font-medium text-sm text-slate-800">
                                {item.nama_obat}{' '}
                                <span className="text-xs text-slate-500">({item.dosis})</span>
                              </p>
                              <p className="text-xs text-slate-600 font-mono">
                                Batch: {item.id.slice(-6)} (Stok: {item.stok_saat_ini})
                              </p>
                            </div>
                          ))}
                        </div>
                      )}
                      {searchTerm && searchResults.length === 0 && !isStokLoading && (
                        <div className="absolute z-10 w-full mt-1 bg-white border border-slate-300 rounded-lg shadow-lg p-4">
                          <p className="text-sm text-slate-500 text-center">
                            Obat tidak ditemukan.
                          </p>
                        </div>
                      )}
                    </div>
                    {/* --- AKHIR AUTOCOMPLETE --- */}

                    <div className="flex gap-3">
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">
                          Jumlah
                        </label>
                        <input
                          type="number"
                          placeholder="Jumlah"
                          value={jumlahJual}
                          onChange={(e) => setJumlahJual(Number(e.target.value))}
                          disabled={!selectedStokId}
                          className="w-full md:w-32 px-4 py-2.5 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all"
                        />
                      </div>
                      <div className="flex-shrink-0">
                        <label className="block text-sm font-medium text-slate-700 mb-2 opacity-0">
                          Aksi
                        </label>
                        <button
                          onClick={handleAddItem}
                          disabled={!selectedStokId || isStokLoading || jumlahJual <= 0}
                          className="flex items-center justify-center gap-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white px-5 py-2.5 rounded-xl font-medium shadow-lg hover:shadow-xl transition-all duration-200 whitespace-nowrap disabled:bg-slate-400"
                        >
                          <Plus size={18} />
                          Tambah
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="min-w-full">
                    <thead>
                      <tr className="border-b-2 border-slate-200 bg-slate-50">
                        <th className="px-6 py-4 text-left text-xs font-bold text-slate-600 uppercase tracking-wider">
                          Nama Obat
                        </th>
                        <th className="px-6 py-4 text-left text-xs font-bold text-slate-600 uppercase tracking-wider">
                          Harga Satuan
                        </th>
                        <th className="px-6 py-4 text-left text-xs font-bold text-slate-600 uppercase tracking-wider">
                          Jumlah
                        </th>
                        <th className="px-6 py-4 text-left text-xs font-bold text-slate-600 uppercase tracking-wider">
                          Total
                        </th>
                        <th className="px-6 py-4 text-left text-xs font-bold text-slate-600 uppercase tracking-wider">
                          Aksi
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {keranjang.length > 0 ? (
                        keranjang.map((item) => (
                          <tr
                            key={item.id_aset_blockchain}
                            className="hover:bg-slate-50 transition-colors"
                          >
                            <td className="px-6 py-4">
                              <p className="text-sm font-semibold text-slate-900">
                                {item.nama_obat}
                              </p>
                              <p className="text-xs text-slate-500 font-mono bg-slate-100 px-2 py-0.5 rounded inline-block mt-1">
                                Batch: {item.batchId.slice(-6)}
                              </p>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-700">
                              Rp {item.harga_satuan.toLocaleString('id-ID')}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className="text-sm font-medium text-emerald-700 bg-emerald-50 px-3 py-1 rounded-lg">
                                {item.jumlah_jual} {item.satuan}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-slate-900">
                              Rp {item.total_item.toLocaleString('id-ID')}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <button
                                onClick={() => handleHapusItem(item.id_aset_blockchain)}
                                className="text-red-500 hover:text-red-700 hover:bg-red-50 p-2 rounded-lg transition-all"
                              >
                                <Trash2 size={18} />
                              </button>
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan="5" className="text-center py-12">
                            <ShoppingCart size={48} className="mx-auto mb-3 text-slate-300" />
                            <p className="text-slate-500 font-medium">Keranjang masih kosong</p>
                            <p className="text-xs text-slate-400 mt-1">
                              Cari obat di atas untuk menambahkannya ke keranjang.
                            </p>
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Kolom Kanan: Ringkasan Transaksi */}
              <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 h-fit sticky top-24">
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-2 bg-emerald-100 rounded-lg">
                    <ShoppingCart className="text-emerald-600" size={20} />
                  </div>
                  <h2 className="text-xl font-bold text-slate-900">Ringkasan Transaksi</h2>
                </div>

                <div className="space-y-3 text-sm mb-6">
                  <div className="flex justify-between py-2">
                    <span className="text-slate-600">Subtotal</span>
                    <span className="font-semibold text-slate-900">
                      Rp {subtotal.toLocaleString('id-ID')}
                    </span>
                  </div>
                  <div className="flex justify-between py-2">
                    <span className="text-slate-600">Pajak</span>
                    <span className="font-semibold text-slate-900">
                      Rp {pajak.toLocaleString('id-ID')}
                    </span>
                  </div>
                  <div className="flex justify-between py-3 border-t-2 border-slate-200 mt-3">
                    <span className="font-bold text-base text-slate-900">Total</span>
                    <span className="font-bold text-lg text-slate-900">
                      Rp {total.toLocaleString('id-ID')}
                    </span>
                  </div>
                </div>

                <div className="mb-6 pb-6 border-b border-slate-200">
                  <label className="text-sm font-semibold text-slate-700 mb-2 block">
                    Nama Pelanggan (Opsional)
                  </label>
                  <input
                    type="text"
                    value={namaPelanggan}
                    onChange={(e) => setNamaPelanggan(e.target.value)}
                    placeholder="Contoh: Budi Santoso"
                    className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all font-medium text-slate-900"
                  />
                </div>

                <div className="mb-4">
                  <label className="text-sm font-semibold text-slate-700 mb-2 block">
                    Nominal yang dibayarkan
                  </label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-600 font-medium">
                      Rp
                    </span>
                    <input
                      type="number"
                      value={nominalBayar}
                      onChange={(e) => setNominalBayar(e.target.value)}
                      className="w-full pl-12 pr-4 py-3 border-2 border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all font-semibold text-slate-900"
                      placeholder="0"
                    />
                  </div>
                </div>

                <div className="flex justify-between items-center py-3 px-4 bg-emerald-50 rounded-xl mb-6">
                  <span className="text-slate-700 font-medium">Kembalian</span>
                  <span className="font-bold text-xl text-emerald-600">
                    Rp {kembalian.toLocaleString('id-ID')}
                  </span>
                </div>

                <div className="space-y-3">
                  <button
                    onClick={handleProsesPembayaran}
                    disabled={
                      isSubmitting || keranjang.length === 0 || (Number(nominalBayar) || 0) < total
                    }
                    className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white py-3 rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all duration-200 disabled:bg-slate-400 disabled:shadow-none"
                  >
                    {isSubmitting ? (
                      <Loader2 className="h-5 w-5 animate-spin mx-auto" />
                    ) : (
                      'Proses Pembayaran'
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
      <style jsx global>{`
        @keyframes blob {
          0%,
          100% {
            transform: translate(0, 0) scale(1);
          }
          33% {
            transform: translate(30px, -50px) scale(1.1);
          }
          66% {
            transform: translate(-20px, 20px) scale(0.9);
          }
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

export default Penjualan;
