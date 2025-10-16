import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate, useLocation } from 'react-router-dom';
import SidebarPbf from '../../../components/SidebarPbf';
import NavbarPbf from '../../../components/NavbarPbf';
import { Loader2, AlertTriangle } from 'lucide-react'; // Import AlertTriangle
import axios from 'axios';

// ... (fungsi generateProNumber tetap sama)
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
  const [pesanan, setPesanan] = useState(null);
  const [detailPesanan, setDetailPesanan] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const nomorResi = generateProNumber('RESPBF', id);
  const nomorSuratJalan = generateProNumber('SJPBF', id);
  const [opsiPengiriman, setOpsiPengiriman] = useState(location.state?.opsiPengiriman || 'standar');
  const [catatan, setCatatan] = useState(location.state?.catatan || '');
  const [tanggalPengiriman, setTanggalPengiriman] = useState(location.state?.tanggalPengiriman || '');
  const [waktuPengiriman, setWaktuPengiriman] = useState(location.state?.waktuPengiriman || '09:00-12:00');
  const [alamatTujuan, setAlamatTujuan] = useState('');

  const currentDate = new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });

  useEffect(() => {
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
          const { pesanan, detail_pesanan } = response.data.data;
          setPesanan(pesanan);
          setDetailPesanan(detail_pesanan || []);
          setAlamatTujuan(pesanan.alamat_apotek || 'Alamat tidak tersedia');

          if (!detail_pesanan || detail_pesanan.length === 0 || detail_pesanan.some(item => !item.id_aset_blockchain)) {
             setError("Data pesanan tidak lengkap. ID Aset Blockchain untuk satu atau lebih item tidak ditemukan. Pesanan ini tidak bisa dikirim.");
          }
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
  }, [id, navigate]);

  const handleSubmitPengiriman = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tanggalPengirimanDate = new Date(tanggalPengiriman);

    if (!tanggalPengiriman || isNaN(tanggalPengirimanDate.getTime()) || tanggalPengirimanDate < today) {
      setError('Tanggal pengiriman harus valid dan tidak boleh sebelum hari ini.');
      setIsSubmitting(false);
      return;
    }
    if (!alamatTujuan || alamatTujuan === 'Alamat tidak tersedia') {
      setError('Alamat tujuan tidak tersedia. Hubungi admin.');
      setIsSubmitting(false);
      return;
    }
     if (detailPesanan.length === 0 || detailPesanan.some(item => !item.id_aset_blockchain)) {
      setError('ID Aset Blockchain untuk item pesanan tidak lengkap. Pengiriman gagal.');
      setIsSubmitting(false);
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const hashSuratJalan = `HASH_SJPBF_${Date.now()}_${id}`;

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

      const response = await axios.put(`http://localhost:5000/api/pbf/pesanan-apotek/${id}/atur-pengiriman`, payload, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.data.success) {
        alert('Surat jalan berhasil dibuat dan data disimpan ke blockchain.');
        navigate(`/pbf/pengelolaan-pesanan/surat-jalan/${id}`);
      } else {
        throw new Error(response.data.message || 'Gagal mengatur pengiriman.');
      }
    } catch (err) {
      // --- PERBAIKAN DI SINI ---
      const errorMessage = err.response?.data?.message || err.message;
      console.error("Gagal mengirim data:", err.response || err); // Log error lengkap ke console
      setError(errorMessage); // Set state error agar ditampilkan di UI
      // --- AKHIR PERBAIKAN ---
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleLogout = () => {
    localStorage.clear();
    navigate('/');
  };

  return (
    <div className="flex min-h-screen bg-gray-50">
      <SidebarPbf isCollapsed={isCollapsed} setIsCollapsed={setIsCollapsed} />
      <div className={`flex-1 flex flex-col transition-all duration-300 ${isCollapsed ? 'ml-16' : 'ml-64'}`}>
        <NavbarPbf onLogout={handleLogout} />
        <main className="pt-16 p-6">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Rincian Pengiriman ke Apotek</h1>
                    <p className="text-gray-600">Rincian pengiriman untuk pesanan ID: {id}</p>
                </div>
                <button
                    type="button"
                    onClick={() => navigate('/pbf/pengelolaan-pesanan')}
                    className="bg-gray-200 text-gray-800 py-2 px-4 rounded-lg hover:bg-gray-300 transition"
                >
                    Kembali
                </button>
            </div>

            <div className="bg-white rounded-lg shadow-lg p-6">
            {isLoading ? (
                <div className="flex justify-center items-center py-10">
                    <Loader2 className="animate-spin h-8 w-8 text-emerald-600" />
                </div>
            ) : !pesanan ? (
                <div className="text-center py-10 text-gray-500">
                    Data pesanan tidak ditemukan.
                </div>
            ) : (
                <form onSubmit={handleSubmitPengiriman} className="space-y-6">
                  {/* Form inputs tetap sama */}
                  <div>
                      <label className="block text-sm font-medium text-gray-700">Nomor Resi</label>
                      <input
                      type="text"
                      value={nomorResi}
                      readOnly
                      className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm bg-gray-100 text-gray-800 font-semibold"
                      />
                  </div>
                  <div>
                      <label className="block text-sm font-medium text-gray-700">Nomor Surat Jalan</label>
                      <input
                      type="text"
                      value={nomorSuratJalan}
                      readOnly
                      className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm bg-gray-100 text-gray-800 font-semibold"
                      />
                  </div>
                  <div>
                      <label className="block text-sm font-medium text-gray-700">Opsi Pengiriman</label>
                      <select
                      value={opsiPengiriman}
                      onChange={(e) => setOpsiPengiriman(e.target.value)}
                      className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-emerald-500 focus:border-emerald-500 p-2"
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
                      className="mt-1 block w-full border-gray-300 rounded-md shadow-sm p-2 h-24 resize-none"
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
                      className="mt-1 block w-full border-gray-300 rounded-md shadow-sm p-2 focus:ring-emerald-500 focus:border-emerald-500"
                      required
                      />
                  </div>
                  <div>
                      <label className="block text-sm font-medium text-gray-700">Alamat Tujuan</label>
                      <input
                      type="text"
                      value={alamatTujuan}
                      onChange={(e) => setAlamatTujuan(e.target.value)}
                      className="mt-1 block w-full border-gray-300 rounded-md shadow-sm p-2 focus:ring-emerald-500 focus:border-emerald-500"
                      placeholder="Masukkan alamat tujuan"
                      required
                      disabled={alamatTujuan === 'Alamat tidak tersedia'}
                      />
                  </div>
                  <div>
                      <label className="block text-sm font-medium text-gray-700">Waktu Pengiriman</label>
                      <select
                      value={waktuPengiriman}
                      onChange={(e) => setWaktuPengiriman(e.target.value)}
                      className="mt-1 block w-full border-gray-300 rounded-md shadow-sm p-2 focus:ring-emerald-500 focus:border-emerald-500"
                      >
                      <option value="09:00-12:00">09:00 - 12:00</option>
                      <option value="13:00-16:00">13:00 - 16:00</option>
                      <option value="16:00-19:00">16:00 - 19:00</option>
                      </select>
                  </div>
                  <div className="flex space-x-4">
                      <button
                          type="submit"
                          disabled={isSubmitting || isLoading || !!error}
                          className="w-full bg-emerald-600 text-white py-3 px-6 rounded-lg hover:bg-emerald-700 transition duration-300 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                      >
                          {isSubmitting ? (
                          <>
                              <Loader2 className="animate-spin h-5 w-5" />
                              Menyimpan...
                          </>
                          ) : (
                          'Konfirmasi & Buat Surat Jalan'
                          )}
                      </button>
                      <button
                          type="button"
                          onClick={() => navigate('/pbf/pengelolaan-pesanan')}
                          className="w-full bg-gray-200 text-gray-800 py-3 px-6 rounded-lg hover:bg-gray-300 transition text-center"
                      >
                          Kembali
                      </button>
                  </div>
                </form>
            )}

            {/* --- PERBAIKAN TAMPILAN ERROR DI SINI --- */}
            {error && (
                <div className="mt-6 p-4 bg-red-100 text-red-700 rounded-lg flex items-start gap-3">
                    <AlertTriangle className="w-6 h-6 flex-shrink-0" />
                    <div>
                        <h3 className="font-bold">Proses Gagal</h3>
                        <p className="text-sm">{error}</p>
                    </div>
                </div>
            )}
            </div>
        </main>
      </div>
    </div>
  );
};

export default RincianPengirimanApotek;