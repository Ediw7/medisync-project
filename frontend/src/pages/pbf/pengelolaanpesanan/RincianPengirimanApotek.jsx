import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate, useLocation } from 'react-router-dom';
import SidebarPbf from '../../../components/SidebarPbf';
import NavbarPbf from '../../../components/NavbarPbf';
import { Loader2 } from 'lucide-react';
import axios from 'axios';

// Fungsi helper untuk generate nomor
const generateProNumber = (prefix, orderId) => {
  const date = new Date();
  const year = date.getFullYear().toString().slice(-2);
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const day = date.getDate().toString().padStart(2, '0');
  const timestamp = date.getTime().toString().slice(-4);
  return `${prefix}-${year}${month}${day}-${orderId}-${timestamp}`;
};

const RincianPengirimanApotek = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();

  const [isCollapsed, setIsCollapsed] = useState(false);
  const [pesanan, setPesanan] = useState(location.state?.pesanan || null);
  const [detailPesanan, setDetailPesanan] = useState(location.state?.detail_pesanan || []);
  const [isLoading, setIsLoading] = useState(!location.state?.pesanan);
  const [error, setError] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Data dari halaman sebelumnya (AturPengirimanApotek)
  const nomorResi = generateProNumber('RESPBF', id);
  const nomorSuratJalan = generateProNumber('SJPBF', id);
  const [opsiPengiriman, setOpsiPengiriman] = useState(location.state?.opsiPengiriman || 'standar');
  const [catatan, setCatatan] = useState(location.state?.catatan || '');
  const [tanggalPengiriman, setTanggalPengiriman] = useState(location.state?.tanggalPengiriman || '');
  const [waktuPengiriman, setWaktuPengiriman] = useState(location.state?.waktuPengiriman || '09:00-12:00');
  const [alamatTujuan, setAlamatTujuan] = useState('');

  const currentDate = new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });

  useEffect(() => {
    // Jika data pesanan tidak dilewatkan dari state, fetch dari API
    if (!pesanan) {
      const fetchPesananData = async () => {
        setIsLoading(true);
        setError(null);
        try {
          const token = localStorage.getItem('token');
          if (!token) throw new Error('Silakan login terlebih dahulu');
          const response = await axios.get(`http://localhost:5000/api/pbf/pesanan-apotek/${id}`, {
            headers: { 'Authorization': `Bearer ${token}` },
          });
          if (response.data.success) {
            setPesanan(response.data.data.pesanan);
            setDetailPesanan(response.data.data.detail_pesanan || []);
            setAlamatTujuan(response.data.data.pesanan.alamat_apotek || '');
          } else {
            throw new Error(response.data.message || 'Data pesanan tidak ditemukan');
          }
        } catch (err) {
          setError(err.response?.data?.message || err.message);
          if (err.message.includes('login')) navigate('/login/pbf');
        } finally {
          setIsLoading(false);
        }
      };
      fetchPesananData();
    } else {
      setAlamatTujuan(pesanan.alamat_apotek || '');
    }
  }, [id, navigate, pesanan]);

  const handleSubmitPengiriman = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    // Validasi tanggal
    const tanggalPengirimanDate = new Date(tanggalPengiriman);
    if (!tanggalPengiriman || isNaN(tanggalPengirimanDate.getTime()) || tanggalPengirimanDate < new Date()) {
      setError('Tanggal pengiriman harus valid dan tidak boleh sebelum hari ini.');
      setIsSubmitting(false);
      return;
    }
    if (!alamatTujuan || alamatTujuan.trim() === '') {
      setError('Alamat tujuan tidak tersedia. Hubungi admin.');
      setIsSubmitting(false);
      return;
    }
    if (detailPesanan.length === 0) {
      setError('Tidak ada detail pesanan yang ditemukan.');
      setIsSubmitting(false);
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const hashSuratJalan = `HASH_SJPBF_${Date.now()}_${id}`;
      const formattedId = String(id).padStart(6, '0'); // Format ID seperti di controller

      const payload = {
        status: 'Dikirim',
        nomorResi,
        nomorSuratJalan,
        tanggalPengiriman,
        alamatTujuan,
        waktuPengiriman,
        catatan,
        hashSuratJalan,
        opsiPengiriman
      };

      const response = await axios.put(`http://localhost:5000/api/pbf/pesanan-apotek/${formattedId}/atur-pengiriman`, payload, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.data.success) {
        alert('Surat jalan berhasil dibuat dan data disimpan ke blockchain.');
        // Arahkan ke halaman surat jalan PBF (perlu dibuat) atau kembali ke daftar
        navigate('/pbf/pengelolaan-pesanan', { 
          state: { 
            nomorResi, 
            nomorSuratJalan, 
            pesanan, 
            detailPesanan,
            tanggalPengiriman, 
            alamatTujuan, 
            waktuPengiriman, 
            catatan, 
            hashSuratJalan 
          } 
        });
      } else {
        throw new Error(response.data.message || 'Gagal mengatur pengiriman.');
      }
    } catch (err) {
      setError(err.response?.data?.message || err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleLogout = () => {
    localStorage.clear();
    navigate('/');
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-gray-50">
        <div className="text-center">
          <Loader2 className="animate-spin h-8 w-8 text-emerald-600 mx-auto mb-4" />
          <p className="text-gray-600">Memuat data pesanan...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-gray-50">
        <div className="p-6 bg-red-100 text-red-700 rounded-lg flex items-center gap-2 max-w-md">
          <Loader2 className="w-5 h-5" />
          <span>Error: {error}</span>
        </div>
      </div>
    );
  }

  if (!pesanan) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-gray-50">
        <p className="text-gray-500">Data pesanan tidak ditemukan.</p>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-gray-50">
      <SidebarPbf isCollapsed={isCollapsed} setIsCollapsed={setIsCollapsed} />
      <div className={`flex-1 flex flex-col transition-all duration-300 ${isCollapsed ? 'ml-16' : 'ml-64'}`}>
        <NavbarPbf onLogout={handleLogout} />
        <main className="pt-16 p-6">
          <div className="max-w-4xl mx-auto">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Rincian Pengiriman ke Apotek</h1>
                <p className="text-gray-600">Tanggal hari ini: {currentDate}</p>
              </div>
              <button
                type="button"
                onClick={() => navigate(-1)}
                className="bg-gray-200 text-gray-800 py-2 px-4 rounded-lg hover:bg-gray-300 transition"
              >
                Kembali
              </button>
            </div>
            <div className="bg-white rounded-lg shadow-lg p-6">
              <form onSubmit={handleSubmitPengiriman} className="space-y-6">
                {/* Detail Pesanan Table */}
                {detailPesanan.length > 0 && (
                  <div className="mb-6">
                    <h2 className="text-lg font-semibold mb-2 text-gray-900">Detail Pesanan</h2>
                    <div className="overflow-x-auto">
                      <table className="min-w-full bg-white border border-gray-200 rounded-lg">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Nama Obat</th>
                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Keterangan</th>
                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Jumlah</th>
                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Satuan</th>
                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Harga Satuan (Rp)</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                          {detailPesanan.map((item) => (
                            <tr key={item.id} className="hover:bg-gray-50">
                              <td className="px-4 py-2 text-sm text-gray-900">{item.nama_obat}</td>
                              <td className="px-4 py-2 text-sm text-gray-600">{item.keterangan || '-'}</td>
                              <td className="px-4 py-2 text-sm font-medium">{item.jumlah}</td>
                              <td className="px-4 py-2 text-sm text-gray-600">{item.satuan}</td>
                              <td className="px-4 py-2 text-sm font-medium">Rp {item.harga_satuan?.toLocaleString('id-ID')}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-700">Nomor Resi</label>
                  <input type="text" value={nomorResi} readOnly className="mt-1 block w-full p-2 border bg-gray-100 rounded-md" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Nomor Surat Jalan</label>
                  <input type="text" value={nomorSuratJalan} readOnly className="mt-1 block w-full p-2 border bg-gray-100 rounded-md" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Opsi Pengiriman</label>
                  <select
                    value={opsiPengiriman}
                    onChange={(e) => setOpsiPengiriman(e.target.value)}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-emerald-500 focus:border-emerald-500"
                  >
                    <option value="standar">Standar (2-3 hari)</option>
                    <option value="ekspres">Ekspres (1 hari)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Catatan</label>
                  <textarea
                    value={catatan}
                    onChange={(e) => setCatatan(e.target.value)}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 h-24 resize-none focus:ring-emerald-500 focus:border-emerald-500"
                    placeholder="Masukkan catatan jika ada."
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Tanggal Pengiriman</label>
                  <input
                    type="date"
                    value={tanggalPengiriman}
                    onChange={(e) => setTanggalPengiriman(e.target.value)}
                    min={new Date().toISOString().split('T')[0]}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-emerald-500 focus:border-emerald-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Alamat Tujuan</label>
                  <input
                    type="text"
                    value={alamatTujuan}
                    onChange={(e) => setAlamatTujuan(e.target.value)}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-emerald-500 focus:border-emerald-500"
                    placeholder="Masukkan alamat tujuan"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Waktu Pengiriman</label>
                  <select
                    value={waktuPengiriman}
                    onChange={(e) => setWaktuPengiriman(e.target.value)}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-emerald-500 focus:border-emerald-500"
                  >
                    <option value="09:00-12:00">09:00 - 12:00</option>
                    <option value="13:00-16:00">13:00 - 16:00</option>
                    <option value="16:00-19:00">16:00 - 19:00</option>
                  </select>
                </div>
                <div className="flex justify-end space-x-4">
                  <button
                    type="button"
                    onClick={() => navigate(-1)}
                    className="py-2 px-6 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300"
                  >
                    Kembali
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting || !tanggalPengiriman || !alamatTujuan.trim()}
                    className="py-2 px-6 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="animate-spin h-5 w-5" />
                        Menyimpan...
                      </>
                    ) : (
                      'Konfirmasi & Cetak Surat Jalan'
                    )}
                  </button>
                </div>
              </form>
              {error && (
                <div className="mt-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg flex items-center gap-2">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                  {error}
                </div>
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default RincianPengirimanApotek;