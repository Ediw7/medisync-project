import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import NavbarApotek from '../../../components/NavbarApotek';
import { Plus, Trash2, Loader2, ArrowLeft, User, FileText, Edit, Package, AlertTriangle } from 'lucide-react';
import SignatureCanvas from 'react-signature-canvas';
import axios from 'axios';
import { toast } from 'react-hot-toast';

const TambahPesananApotek = () => {
    const navigate = useNavigate();
    const { idPbf } = useParams();
    const location = useLocation();
    const sigCanvas = useRef({});
    // State untuk menyimpan stok asli seperti yang diterima dari API
    const [originalStokPbf, setOriginalStokPbf] = useState([]);
    const [infoApoteker, setInfoApoteker] = useState({
        nama_apotek: '',
        alamat_apotek: '',
        jabatan: '',
        nomor_sipa: '',
        telepon: '',
    });
    // State untuk item yang sedang dipilih/diedit
    const [itemObat, setItemObat] = useState({
        id: '', // id_aset_blockchain
        nama_obat: '',
        keterangan: '', // dosis + bentuk sediaan
        qty: 1,
        satuan: '', // bentuk sediaan
        harga_satuan: 0,
        stok_tersedia: 0, // stok *saat ini* untuk batch yang dipilih
    });
    const [detailPesanan, setDetailPesanan] = useState([]); // Keranjang pesanan
    const [error, setError] = useState('');
    const [isStokLoading, setIsStokLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const username = localStorage.getItem('username');
    const pbfInfo = location.state || { namaPbf: 'PBF Tujuan', alamatPbf: 'Alamat PBF' };

    // State turunan: menghitung stok tersedia untuk setiap batch individual
    const availableStock = useMemo(() => {
        return originalStokPbf.map(stokItem => {
            // Cari item yang sama di keranjang berdasarkan ID (id_aset_blockchain)
            const itemInCart = detailPesanan.find(cartItem => cartItem.id === stokItem.id);
            const quantityInCart = itemInCart ? itemInCart.qty : 0;
            // Stok awal item ini adalah 'jumlah'
            const currentStock = (stokItem.jumlah || 0) - quantityInCart;
            return {
                ...stokItem,
                stok_saat_ini: currentStock >= 0 ? currentStock : 0, // Pastikan tidak negatif
            };
        });
    }, [originalStokPbf, detailPesanan]);

    useEffect(() => {
        const fetchProfile = async () => {
             let token;
            try {
                token = localStorage.getItem('token');
                if (!token) throw new Error("Otentikasi Gagal. Silakan login kembali.");
                const response = await axios.get('http://localhost:5000/api/apotek/profile', {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                if (response.data.success && response.data.data) {
                    const { nama_resmi, alamat, nomor_izin, kontak_telepon } = response.data.data;
                    setInfoApoteker(prev => ({
                        ...prev,
                        nama_apotek: nama_resmi || '',
                        alamat_apotek: alamat || '',
                        nomor_sipa: nomor_izin || '',
                        telepon: kontak_telepon || ''
                     }));
                } else {
                     throw new Error(response.data.message || 'Gagal memuat profil Apotek.');
                }
            } catch (err) {
                 const errorMsg = err.response?.data?.message || err.message || 'Gagal memuat profil Apotek.';
                setError(errorMsg);
                toast.error(errorMsg);
                if ((err.message.includes('401') || err.message.includes('403') || err.message.includes('login')) && token) {
                    navigate('/login/apotek');
                } else if (!token) {
                     navigate('/login/apotek');
                }
            }
        };
        fetchProfile();
    }, [navigate]);


    useEffect(() => {
        // Fetch stok PBF (tidak ada penggabungan)
        const fetchStokPbf = async () => {
            if (!idPbf) {
                 setError('ID PBF tidak ditemukan. Silakan pilih PBF kembali.');
                 setIsStokLoading(false);
                 return;
            };
            setIsStokLoading(true);
            setError('');
            let token;
            try {
                token = localStorage.getItem('token');
                if (!token) throw new Error("Otentikasi Gagal");
                const response = await axios.get(`http://localhost:5000/api/apotek/pbf/${idPbf}/stok`, {
                     headers: { 'Authorization': `Bearer ${token}` }
                });
                if (response.data.success) {
                    // Langsung simpan data asli ke originalStokPbf
                    setOriginalStokPbf(response.data.data || []);
                } else {
                    throw new Error(response.data.message || 'Gagal mengambil data stok PBF.');
                }
            } catch (err) {
                 const errorMsg = err.response?.data?.message || err.message || 'Gagal memuat stok obat dari PBF.';
                 setError(errorMsg);
                 toast.error(errorMsg);
                 if ((err.message.includes('401') || err.message.includes('403') || err.message.includes('login')) && token) {
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

    // Handler saat memilih obat dari dropdown
    const handleObatSelect = (e) => {
        const selectedObatId = e.target.value; // Value adalah id_aset_blockchain
        // Cari obat di availableStock berdasarkan ID
        const selectedObat = availableStock.find(obat => obat.id === selectedObatId);

        if (selectedObat) {
            setItemObat({
                id: selectedObat.id, // Simpan id_aset_blockchain
                nama_obat: selectedObat.nama_obat,
                keterangan: `${selectedObat.dosis || ''} ${selectedObat.bentuk_sediaan || ''}`.trim(),
                qty: 1,
                satuan: selectedObat.bentuk_sediaan || 'Box',
                harga_satuan: selectedObat.harga_per_unit || 0,
                // Stok tersedia adalah stok *batch* ini saat ini
                stok_tersedia: selectedObat.stok_saat_ini || 0,
            });
        } else {
            // Reset jika tidak dipilih
            setItemObat({ id: '', nama_obat: '', keterangan: '', qty: 1, satuan: '', harga_satuan: 0, stok_tersedia: 0 });
        }
    };

    const handleQtyChange = (e) => {
        const newQty = parseInt(e.target.value, 10);
        if (newQty > 0 && newQty <= itemObat.stok_tersedia) {
            setItemObat({ ...itemObat, qty: newQty });
        } else if (newQty > itemObat.stok_tersedia) {
             toast.error(`Jumlah tidak boleh melebihi stok tersedia (${itemObat.stok_tersedia})`);
             setItemObat({ ...itemObat, qty: itemObat.stok_tersedia });
        } else {
             setItemObat({ ...itemObat, qty: 1 });
        }
    };

     const handleAddItem = () => {
        setError('');
        toast.dismiss();

        if (!itemObat.id) {
            toast.error('Silakan pilih obat yang valid.'); return;
        }
        const qtyToAdd = parseInt(itemObat.qty, 10);
        if (isNaN(qtyToAdd) || qtyToAdd <= 0) {
            toast.error('Jumlah pesanan harus lebih dari 0.'); return;
        }
        if (qtyToAdd > itemObat.stok_tersedia) {
            toast.error(`Jumlah pesanan (${qtyToAdd}) melebihi stok tersedia untuk batch ini (${itemObat.stok_tersedia}).`); return;
        }

        const hargaSatuan = parseFloat(itemObat.harga_satuan);
        // Cek item di keranjang berdasarkan ID (id_aset_blockchain)
        const existingItemIndex = detailPesanan.findIndex(item => item.id === itemObat.id);

        if (existingItemIndex > -1) {
            // Jika batch yang sama sudah ada, update jumlahnya
            const updatedDetailPesanan = [...detailPesanan];
            const existingItem = updatedDetailPesanan[existingItemIndex];
            const newQty = existingItem.qty + qtyToAdd;
            const currentStockInfo = availableStock.find(s => s.id === itemObat.id);
            // Ambil stok awal dari originalStokPbf untuk validasi total
            const originalStockInfo = originalStokPbf.find(s => s.id === itemObat.id);
            const maxStock = originalStockInfo ? originalStockInfo.jumlah : 0;

            if (newQty > maxStock) {
                 toast.error(`Total jumlah di keranjang (${newQty}) melebihi stok awal batch ini (${maxStock}).`);
                 return;
            }

            existingItem.qty = newQty;
            existingItem.total_harga = newQty * existingItem.harga_satuan;
            setDetailPesanan(updatedDetailPesanan);
            toast.success(`${itemObat.nama_obat} (batch ${itemObat.id.slice(-6)}) diperbarui.`);
        } else {
            // Tambah batch baru ke keranjang
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
        // Reset form
        setItemObat({ id: '', nama_obat: '', keterangan: '', qty: 1, satuan: '', harga_satuan: 0, stok_tersedia: 0 });
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
            if (!token) throw new Error("Otentikasi Gagal");
            const tanda_tangan_data_url = sigCanvas.current.getTrimmedCanvas().toDataURL('image/png');

            const payload = {
                nama_apotek: infoApoteker.nama_apotek,
                alamat_apotek: infoApoteker.alamat_apotek,
                jabatan: infoApoteker.jabatan,
                nomor_sipa: infoApoteker.nomor_sipa,
                telepon: infoApoteker.telepon,
                id_pbf: parseInt(idPbf, 10),
                items: detailPesanan.map(item => ({
                    id_aset_blockchain: item.id, // Kirim ID batch yang benar
                    nama_obat: item.nama_obat,
                    keterangan: item.keterangan,
                    qty: item.qty,
                    satuan: item.satuan,
                    harga_satuan: item.harga_satuan,
                })),
                total_harga: totalHarga,
                tanda_tangan_data_url
            };

            console.log("Payload yang akan dikirim ke backend:", payload);

            const response = await axios.post('http://localhost:5000/api/apotek/pesanan', payload, {
                 headers: { 'Authorization': `Bearer ${token}` }
            });

            if (response.data.success) {
                toast.success('Pesanan berhasil dibuat!');
                navigate('/apotek/pesan-obat');
            } else { throw new Error(response.data.message || 'Gagal membuat pesanan.'); }
        } catch (err) {
             const errorMsg = err.response?.data?.message || err.message || 'Kesalahan Server Internal.';
             setError(errorMsg);
             toast.error(errorMsg);
             console.error("Submit error:", err.response || err);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="flex min-h-screen bg-slate-50">
            <div className="flex-1 flex flex-col">
                <NavbarApotek onLogout={() => { localStorage.clear(); navigate('/'); }} username={username} />
                <main className="flex-1 overflow-auto pt-[72px]">
                    <div className="max-w-4xl mx-auto px-6 py-8">
                        <div className="mb-8">
                            <button
                                onClick={() => navigate('/apotek/pesan-obat/tambah')} // Kembali ke PilihPbf
                                className="mb-4 inline-flex items-center text-emerald-600 hover:text-emerald-700 transition-colors text-sm font-medium"
                            >
                                <ArrowLeft size={16} className="mr-1" /> Kembali Pilih PBF
                            </button>
                            <h1 className="text-4xl font-bold text-slate-900 mb-2">Form Pemesanan Obat</h1>
                            <p className="text-slate-600">Lengkapi detail pesanan Anda ke <span className="font-semibold">{pbfInfo.namaPbf}</span>.</p>
                        </div>

                        {error && (
                          <div className="p-4 mb-6 bg-red-50 text-red-700 rounded-lg border border-red-200 text-sm font-medium flex items-center gap-2">
                            <AlertTriangle size={18} /> {error}
                          </div>
                        )}

                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
                                <div className="bg-gradient-to-r from-slate-50 to-slate-100 px-6 py-4 border-b border-slate-200">
                                  <h2 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
                                     <User size={20} /> Informasi Apotek Pemesan
                                  </h2>
                                </div>
                                <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <InputField label="Nama Apotek" value={infoApoteker.nama_apotek} readOnly disabled />
                                    <InputField label="Alamat Apotek" value={infoApoteker.alamat_apotek} readOnly disabled />
                                    <InputField label="Nomor SIPA" value={infoApoteker.nomor_sipa} readOnly disabled />
                                    <InputField label="Telepon*" name="telepon" value={infoApoteker.telepon} onChange={handleInfoChange} placeholder="Masukkan nomor telepon aktif" required />
                                    <div className="md:col-span-2">
                                       <InputField label="Jabatan Penanggung Jawab*" name="jabatan" value={infoApoteker.jabatan} onChange={handleInfoChange} placeholder="Contoh: Apoteker Penanggung Jawab" required />
                                    </div>
                                </div>
                            </div>

                            <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
                                <div className="bg-gradient-to-r from-emerald-50 to-emerald-100 px-6 py-4 border-b border-slate-200">
                                    <h2 className="text-lg font-semibold text-emerald-900 flex items-center gap-2">
                                       <Package size={20} /> Detail Pesanan Obat
                                    </h2>
                                </div>

                                {detailPesanan.length > 0 && (
                                    <div className="overflow-x-auto">
                                        <table className="w-full text-sm">
                                            <thead className="bg-slate-50 text-slate-700">
                                                <tr>
                                                    <th className="px-4 py-3 text-left font-semibold border-b border-slate-200">Nama Obat</th>
                                                    <th className="px-4 py-3 text-left font-semibold border-b border-slate-200">Sediaan</th>
                                                    <th className="px-4 py-3 text-left font-semibold border-b border-slate-200">Keterangan</th>
                                                    <th className="px-4 py-3 text-center font-semibold border-b border-slate-200">Jumlah</th>
                                                    <th className="px-4 py-3 text-right font-semibold border-b border-slate-200">Harga Satuan</th>
                                                    <th className="px-4 py-3 text-right font-semibold border-b border-slate-200">Total</th>
                                                    <th className="px-4 py-3 text-center font-semibold border-b border-slate-200">Aksi</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-slate-100">
                                                {detailPesanan.map((item, index) => (
                                                    <tr key={index} className="hover:bg-slate-50">
                                                        <td className="px-4 py-3 font-medium text-slate-800">{item.nama_obat}</td>
                                                        <td className="px-4 py-3 text-slate-600">{item.satuan}</td>
                                                        <td className="px-4 py-3 text-slate-600">{item.keterangan || '-'}</td>
                                                        <td className="px-4 py-3 text-center font-medium text-emerald-700">{item.qty}</td>
                                                        <td className="px-4 py-3 text-right text-slate-600">Rp {Number(item.harga_satuan).toLocaleString('id-ID')}</td>
                                                        <td className="px-4 py-3 font-semibold text-slate-800 text-right">
                                                            Rp {Number(item.total_harga).toLocaleString('id-ID')}
                                                        </td>
                                                        <td className="px-4 py-3 text-center">
                                                            <button type="button" onClick={() => handleRemoveItem(index)} className="text-red-500 hover:text-red-700 p-1 hover:bg-red-50 rounded" title="Hapus Item">
                                                              <Trash2 size={16} />
                                                            </button>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                             <tfoot className="bg-slate-100 font-semibold text-slate-800">
                                                <tr>
                                                    <td colSpan="5" className="px-4 py-3 text-right border-t-2 border-slate-300">Total Harga Keseluruhan:</td>
                                                    <td className="px-4 py-3 text-right border-t-2 border-slate-300">Rp {totalHarga.toLocaleString('id-ID')}</td>
                                                    <td className="px-4 py-3 border-t-2 border-slate-300"></td>
                                                </tr>
                                            </tfoot>
                                        </table>
                                    </div>
                                )}

                                <div className="p-6 border-t border-slate-200 grid grid-cols-1 md:grid-cols-12 gap-4 items-end">
                                    <div className="md:col-span-5">
                                        <label className="block text-sm font-medium text-slate-700 mb-1">Pilih Obat*</label>
                                        <select
                                            name="id"
                                            value={itemObat.id || ''}
                                            onChange={handleObatSelect}
                                            className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition bg-white appearance-none"
                                            disabled={isStokLoading}
                                        >
                                            <option value="">{isStokLoading ? 'Memuat stok...' : '-- Pilih Obat Tersedia --'}</option>
                                            {/* Filter item yang stoknya > 0 */}
                                            {availableStock.filter(o => o.stok_saat_ini > 0).map(o => (
                                                <option key={o.id} value={o.id}>
                                                    {o.nama_obat} ({o.dosis} {o.bentuk_sediaan}) - Batch: {o.id.slice(-6)} (Stok: {o.stok_saat_ini})
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                    <div className="md:col-span-2">
                                        <InputField
                                            label="Jumlah*" name="qty" type="number" min="1"
                                            max={itemObat.stok_tersedia || 1}
                                            value={itemObat.qty} onChange={handleQtyChange}
                                            disabled={!itemObat.id} required
                                        />
                                    </div>
                                    <div className="md:col-span-3">
                                       <InputField
                                            label="Harga Satuan" name="harga_satuan"
                                            value={`Rp ${Number(itemObat.harga_satuan).toLocaleString('id-ID')}`}
                                            readOnly disabled
                                        />
                                    </div>
                                    <div className="md:col-span-2">
                                        <button 
                                            type="button" 
                                            onClick={handleAddItem} 
                                            className="w-full bg-blue-600 text-white py-2.5 px-4 rounded-lg hover:bg-blue-700 disabled:bg-slate-400 flex items-center justify-center gap-1" 
                                            disabled={!itemObat.id || isStokLoading}
                                        >
                                            <Plus size={16} /> Tambah
                                        </button>
                                    </div>
                                </div>
                            </div>

                            <div className="bg-white p-6 rounded-lg shadow-sm border border-slate-200">
                                <h3 className="text-lg font-semibold text-emerald-700 mb-2 flex items-center gap-2"><Edit size={18}/>Tanda Tangan Apoteker*</h3>
                                <p className="text-sm text-slate-500 mb-4">Tanda tangan di area kosong di bawah ini.</p>
                                <div className="w-full h-48 bg-slate-50 border border-dashed border-slate-400 rounded-lg overflow-hidden">
                                    <SignatureCanvas ref={sigCanvas} penColor='black' canvasProps={{className: 'w-full h-full'}} />
                                </div>
                                <div className="flex justify-end mt-3">
                                   <button type="button" onClick={clearSignature} className="px-4 py-2 text-xs text-red-600 hover:text-red-800 hover:bg-red-50 rounded-md transition-colors">
                                     Hapus Tanda Tangan
                                   </button>
                                </div>
                            </div>

                            <div className="flex justify-end gap-3 pt-4">
                                <button
                                  type="button"
                                  onClick={() => navigate('/apotek/pesan-obat')}
                                  className="px-6 py-2.5 border border-slate-300 text-slate-700 font-medium rounded-lg hover:bg-slate-100 transition"
                                >
                                  Batal
                                </button>
                                <button
                                  type="submit"
                                  disabled={isSubmitting || detailPesanan.length === 0}
                                  className="px-6 py-2.5 bg-emerald-600 text-white font-medium rounded-lg hover:bg-emerald-700 transition disabled:bg-slate-400 disabled:cursor-not-allowed flex items-center gap-2"
                                >
                                  {isSubmitting ? <Loader2 className="animate-spin" size={18}/> : null}
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

// Komponen InputField tidak berubah
const InputField = ({ label, readOnly = false, ...props }) => (
    <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">{label}</label>
        <input
           {...props}
           readOnly={readOnly}
           className={`w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition ${readOnly ? 'bg-slate-100 text-slate-500 cursor-not-allowed' : 'bg-white'}`}
        />
    </div>
);

export default TambahPesananApotek;