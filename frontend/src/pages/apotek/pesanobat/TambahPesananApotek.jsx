import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import NavbarApotek from '../../../components/NavbarApotek';
import { Plus, Trash2, Loader2 } from 'lucide-react';
import SignatureCanvas from 'react-signature-canvas';
import axios from 'axios';

const TambahPesananApotek = () => {
    const navigate = useNavigate();
    const { idPbf } = useParams();
     const location = useLocation(); 
    const sigCanvas = useRef({});
    const [isCollapsed, setIsCollapsed] = useState(false);
    
    // State untuk data dari backend
    const [stokPbf, setStokPbf] = useState([]);
    const [infoApoteker, setInfoApoteker] = useState({
        nama_apotek: '',
        alamat_apotek: '',
        jabatan: '',
        nomor_sipa: '',
        telepon: '',
        
    });

    // State untuk form item obat
    const [itemObat, setItemObat] = useState({
        id_aset_blockchain: '', 
        nama_obat: '',
        keterangan: '', // Akan digunakan untuk Dosis
        qty: 1,
        satuan: '', // Akan digunakan untuk Bentuk Sediaan
        harga_satuan: 0,
        stok_tersedia: 0,
    });

    const [detailPesanan, setDetailPesanan] = useState([]);
    const [error, setError] = useState('');
    const [isStokLoading, setIsStokLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Fetch Profil Apotek
    useEffect(() => {
        const fetchProfile = async () => {
            try {
                const token = localStorage.getItem('token');
                if (!token) throw new Error("Otentikasi Gagal");
                const response = await axios.get('http://localhost:5000/api/apotek/profile', {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                if (response.data.success) {
                    const { nama_resmi, alamat, nomor_izin } = response.data.data;
                    setInfoApoteker(prev => ({ ...prev, nama_apotek: nama_resmi, alamat_apotek: alamat, nomor_sipa: nomor_izin }));
                }
            } catch (err) {
                setError('Gagal memuat profil Apotek.');
            }
        };
        fetchProfile();
    }, []);

   


    // Fetch Stok Obat dari PBF
    useEffect(() => {
        const fetchStokPbf = async () => {
            if (!idPbf) return;
            setIsStokLoading(true);
            try {
                const token = localStorage.getItem('token');
                if (!token) throw new Error("Otentikasi Gagal");
                const response = await axios.get(`http://localhost:5000/api/apotek/pbf/${idPbf}/stok`, {
                     headers: { 'Authorization': `Bearer ${token}` }
                });
                if (response.data.success) {
                    setStokPbf(response.data.data || []);
                } else {
                    throw new Error(response.data.message || 'Gagal mengambil data stok PBF.');
                }
            } catch (err) {
                 setError('Gagal memuat stok obat dari PBF.');
            } finally {
                setIsStokLoading(false);
            }
        };
        fetchStokPbf();
    }, [idPbf]);

    const handleInfoChange = (e) => {
        const { name, value } = e.target;
        setInfoApoteker({ ...infoApoteker, [name]: value });
    };

    const handleObatSelect = (e) => {
        const selectedId = e.target.value;
        const selectedObat = stokPbf.find(obat => obat.id === selectedId);

        if (selectedObat) {
            setItemObat({
                id_aset_blockchain: selectedObat.id,
                nama_obat: selectedObat.nama_obat,
                keterangan: selectedObat.dosis || '',
                qty: 1,
                satuan: selectedObat.bentuk_sediaan || 'Box',
                harga_satuan: selectedObat.harga_per_unit || 0,
                stok_tersedia: selectedObat.jumlah || 0,
            });
        } else {
            setItemObat({ id_aset_blockchain: '', nama_obat: '', keterangan: '', qty: 1, satuan: '', harga_satuan: 0, stok_tersedia: 0 });
        }
    };
    
    const handleQtyChange = (e) => {
        setItemObat({ ...itemObat, qty: e.target.value });
    };

    const handleAddItem = () => {
    // Validasi dasar
    if (!itemObat.id_aset_blockchain) {
        setError('Silakan pilih obat dari daftar.');
        return;
    }
    const qtyToAdd = parseInt(itemObat.qty, 10);
    if (isNaN(qtyToAdd) || qtyToAdd <= 0) {
        setError('Jumlah pesanan harus berupa angka dan lebih dari 0.');
        return;
    }

    const hargaSatuan = parseFloat(itemObat.harga_satuan);

    // Cek apakah item sudah ada di keranjang
    const existingItemIndex = detailPesanan.findIndex(
        (item) => item.id_aset_blockchain === itemObat.id_aset_blockchain
    );

    if (existingItemIndex > -1) {
        // Jika item sudah ada, perbarui jumlahnya
        const updatedDetailPesanan = [...detailPesanan];
        const existingItem = updatedDetailPesanan[existingItemIndex];
        const newQty = existingItem.qty + qtyToAdd;

        // Validasi stok dengan jumlah total yang baru
        if (newQty > itemObat.stok_tersedia) {
            setError(`Stok tidak cukup. Anda sudah punya ${existingItem.qty} di keranjang, menambahkan ${qtyToAdd} akan melebihi stok (${itemObat.stok_tersedia}).`);
            return;
        }

        existingItem.qty = newQty;
        // Hitung ulang total harga untuk item yang diperbarui
        existingItem.total_harga = newQty * existingItem.harga_satuan;
        setDetailPesanan(updatedDetailPesanan);

    } else {
        // Jika item baru, tambahkan ke keranjang
        if (qtyToAdd > itemObat.stok_tersedia) {
            setError(`Jumlah pesanan (${qtyToAdd}) melebihi stok tersedia (${itemObat.stok_tersedia}).`);
            return;
        }

        const newItem = {
            id_aset_blockchain: itemObat.id_aset_blockchain,
            nama_obat: itemObat.nama_obat,
            satuan: itemObat.satuan, // Ini adalah bentuk sediaan
            keterangan: itemObat.keterangan, // Ini adalah dosis
            qty: qtyToAdd,
            harga_satuan: hargaSatuan,
            total_harga: qtyToAdd * hargaSatuan, // <-- KUNCI: Hitung dan simpan total harga
        };
        setDetailPesanan([...detailPesanan, newItem]);
    }

    // Reset form item dan hapus error
    setItemObat({ id_aset_blockchain: '', nama_obat: '', keterangan: '', qty: 1, satuan: '', harga_satuan: 0, stok_tersedia: 0 });
    setError('');
};
    
    const handleRemoveItem = (index) => {
        setDetailPesanan(detailPesanan.filter((_, i) => i !== index));
    };

    const clearSignature = () => sigCanvas.current.clear();
    
    // Hitung total harga dari item yang sudah ada di detailPesanan
const totalHarga = detailPesanan.reduce((sum, item) => sum + item.total_harga, 0);
    const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (detailPesanan.length === 0) { setError('Harap tambahkan minimal satu item obat.'); return; }
    if (sigCanvas.current.isEmpty()) { setError('Tanda tangan Apoteker wajib diisi.'); return; }
    setIsSubmitting(true);

    // --- TAMBAHKAN DEBUGGING DI SINI ---
    console.log("Nilai 'idPbf' dari useParams:", idPbf);
    console.log("Tipe data 'idPbf':", typeof idPbf);

    try {
        const token = localStorage.getItem('token');
        const tanda_tangan_data_url = sigCanvas.current.getTrimmedCanvas().toDataURL('image/png');
        
        const payload = { 
            ...infoApoteker, 
            id_pbf: Number(idPbf),
            items: detailPesanan, 
            total_harga: totalHarga, 
            tanda_tangan_data_url 
        };
        
        // --- TAMBAHKAN DEBUGGING LAGI DI SINI ---
        console.log("Payload yang akan dikirim ke backend:", payload);
        
        const response = await axios.post('http://localhost:5000/api/apotek/pesanan', payload, { headers: { 'Authorization': `Bearer ${token}` }});
        
        if (response.data.success) navigate('/apotek/pesan-obat');
        else throw new Error(response.data.message || 'Gagal membuat pesanan.');
    } catch (err) {
            setError(err.response?.data?.message || 'Kesalahan Server Internal: ' + (err.response?.data?.message || err.message));
        } finally {
            setIsSubmitting(false);
        }
    };
    const handleLogout = () => {
        localStorage.clear();
        navigate('/apotek/pesan-obat');
    };

    return (
        <div className="flex min-h-screen bg-gray-100">
            <div className={`flex-1 flex flex-col transition-all duration-300 ${isCollapsed ? 'ml-16' : 'ml-64'}`}>
                <NavbarApotek onLogout={handleLogout} />
                <main className="flex-1 pt-16 p-6">
                    <form onSubmit={handleSubmit} className="max-w-4xl mx-auto space-y-6">
                        <h1 className="text-2xl font-bold text-gray-800">Form Pemesanan Obat</h1>
                        
                        {/* Informasi Apoteker (Tidak berubah) */}
                        <div className="bg-white p-6 rounded-lg shadow-sm border">
                            <h3 className="text-lg font-semibold text-emerald-700 mb-4 border-b pb-2">Informasi Apoteker</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <InputField label="Nama Apotek" value={infoApoteker.nama_apotek} readOnly disabled />
                              
                                <InputField label="Alamat Apotek" value={infoApoteker.alamat_apotek} readOnly disabled />
                                
                                <InputField label="Nomor SIPA" value={infoApoteker.nomor_sipa} readOnly disabled />
                                <InputField label="Telepon" name="telepon" value={infoApoteker.telepon} onChange={handleInfoChange} required />
                                <div className="md:col-span-2">
                                    <InputField label="Jabatan Penanggung Jawab" name="jabatan" value={infoApoteker.jabatan} onChange={handleInfoChange} required />
                                </div>
                            </div>
                        </div>

                        {/* --- PERUBAHAN UTAMA DI SINI --- */}
                        <div className="bg-white p-6 rounded-lg shadow-sm border">
                            <h3 className="text-lg font-semibold text-emerald-700 mb-4 border-b pb-2">Detail Pemesanan Obat</h3>
                            {detailPesanan.length > 0 && (
                                <div className="overflow-x-auto mb-6">
                                    <table className="w-full text-left border-collapse">
                                        <thead>
                                            <tr className="bg-gray-50">
                                                <th className="p-3 text-sm font-semibold text-gray-700">Nama Obat</th>
                                                <th className="p-3 text-sm font-semibold text-gray-700">Bentuk Sediaan</th>
                                                <th className="p-3 text-sm font-semibold text-gray-700">Dosis</th>
                                                <th className="p-3 text-sm font-semibold text-gray-700 text-center">Jumlah</th>
                                                <th className="p-3 text-sm font-semibold text-gray-700 text-right">Harga Satuan</th>
                                                <th className="p-3 text-sm font-semibold text-gray-700 text-right">Total</th>
                                                <th className="p-3 text-sm font-semibold text-gray-700 text-center">Aksi</th>
                                            </tr>
                                        </thead>
                                        <tbody>
    {detailPesanan.map((item, index) => (
        <tr key={index} className="border-b">
            <td className="p-3 text-gray-800">{item.nama_obat}</td>
            <td className="p-3 text-gray-800">{item.satuan}</td>
            <td className="p-3 text-gray-800">{item.keterangan || '-'}</td>
            <td className="p-3 text-gray-800 text-center">{item.qty}</td>
            <td className="p-3 text-gray-800 text-right">Rp {Number(item.harga_satuan).toLocaleString('id-ID')}</td>
            {/* --- PERUBAHAN DI SINI --- */}
            <td className="p-3 text-gray-800 font-semibold text-right">
                Rp {Number(item.total_harga).toLocaleString('id-ID')}
            </td>
            <td className="p-3 text-center">
                <button type="button" onClick={() => handleRemoveItem(index)} className="text-red-500 hover:text-red-700"><Trash2 size={18} /></button>
            </td>
        </tr>
    ))}
</tbody>
                                        <tfoot>
                                            <tr className="bg-gray-100 font-semibold">
                                                <td colSpan="5" className="p-3 text-right text-gray-800">Total Harga:</td>
                                                <td className="p-3 text-right text-gray-800">Rp {totalHarga.toLocaleString('id-ID')}</td>
                                                <td className="p-3"></td>
                                            </tr>
                                        </tfoot>
                                    </table>
                                </div>
                            )}

                            {/* Form Tambah Item */}
                            <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end pt-4 border-t">
                                <div className="md:col-span-5">
                                    <label className="block text-sm font-medium text-gray-700">Pilih Obat</label>
                                    <select name="id_aset_blockchain" value={itemObat.id_aset_blockchain} onChange={handleObatSelect} className="mt-1 w-full p-2 border border-gray-300 rounded-lg" disabled={isStokLoading}>
                                        <option value="">{isStokLoading ? 'Memuat stok...' : '-- Pilih Obat --'}</option>
                                        {stokPbf.map(o => <option key={o.id} value={o.id}>{o.nama_obat} (Stok: {o.jumlah})</option>)}
                                    </select>
                                </div>
                                <div className="md:col-span-2">
                                    <InputField label="Jumlah" name="qty" type="number" min="1" max={itemObat.stok_tersedia} value={itemObat.qty} onChange={handleQtyChange} disabled={!itemObat.id_aset_blockchain} />
                                </div>
                                <div className="md:col-span-3">
                                   <InputField 
        label="Harga Satuan" 
        name="harga_satuan" 
        value={`Rp ${Number(itemObat.harga_satuan).toLocaleString('id-ID')}`}   
        readOnly // <-- Tambahkan prop readOnly di sini
    />
                                </div>
                                <div className="md:col-span-2">
                                    <button type="button" onClick={handleAddItem} className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 disabled:bg-gray-400" disabled={!itemObat.id_aset_blockchain || isStokLoading}>
                                        <Plus size={18} className="inline-block mr-1"/> Tambah
                                    </button>
                                </div>
                            </div>
                        </div>
                        {/* --- AKHIR PERUBAHAN --- */}

                        {/* Tanda Tangan (Tidak berubah) */}
                        <div className="bg-white p-6 rounded-lg shadow-sm border">
                            <h3 className="text-lg font-semibold text-emerald-700 mb-2">Tanda Tangan Apoteker</h3>
                            <p className="text-sm text-gray-500 mb-4">Silahkan Tanda tangan di area di bawah ini :</p>
                            <div className="w-full h-48 bg-gray-50 border border-dashed border-gray-400 rounded-lg">
                                <SignatureCanvas ref={sigCanvas} penColor='black' canvasProps={{className: 'w-full h-full'}} />
                            </div>
                            <div className="flex justify-end gap-4 mt-4">
                                <button type="button" onClick={clearSignature} className="px-4 py-2 text-sm text-red-600 hover:text-red-800">Hapus tanda tangan</button>
                                <button type="submit" disabled={isSubmitting} className="px-6 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:bg-gray-400 flex items-center gap-2">
                                    {isSubmitting ? <Loader2 className="animate-spin" size={18}/> : null}
                                    {isSubmitting ? 'Mengirim...' : 'Simpan Pesanan'}
                                </button>
                            </div>
                        </div>
                        {error && <div className="p-4 text-center bg-red-100 text-red-700 rounded-lg">{error}</div>}
                    </form>
                </main>
            </div>
        </div>
    );
};

// Helper component
const InputField = ({ label, ...props }) => (
    <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
        <input {...props} className="w-full p-2 border border-gray-300 rounded-lg focus:ring-emerald-500 focus:border-emerald-500 disabled:bg-gray-200" />
    </div>
);

export default TambahPesananApotek;