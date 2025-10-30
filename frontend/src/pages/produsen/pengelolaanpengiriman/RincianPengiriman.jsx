import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate, useLocation } from 'react-router-dom';
import SidebarProdusen from '../../../components/SidebarProdusen';
import NavbarProdusen from '../../../components/NavbarProdusen';
import { Loader2 } from 'lucide-react';


const toRoman = (num) => {
  const map = { M: 1000, CM: 900, D: 500, CD: 400, C: 100, XC: 90, L: 50, XL: 40, X: 10, IX: 9, V: 5, IV: 4, I: 1 };
  let result = '';
  for (let key in map) {
    while (num >= map[key]) {
      result += key;
      num -= map[key];
    }
  }
  return result;
};

const generateProNumber = (prefix, orderId) => {
  const date = new Date();
  const year = date.getFullYear().toString().slice(-2);
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const day = date.getDate().toString().padStart(2, '0');
  const timestamp = date.getTime().toString().slice(-4);
  return `${prefix}-${year}${month}${day}-${orderId}-${timestamp}`;
};


const generateSuratJalanNumber = (orderId) => {
  const nomorIzin = localStorage.getItem('nomorIzin');
  if (!nomorIzin) {
    return 'ERROR-NO-IZIN';
  }

  const date = new Date();
  const year = date.getFullYear().toString().slice(-2);
  const month = date.getMonth() + 1; 
  const monthRoman = toRoman(month); 
  const paddedOrderId = String(orderId).padStart(6, '0'); 

  return `SJ-${paddedOrderId}-${nomorIzin}-${monthRoman}-${year}`;
};

const RincianPengiriman = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();

  const [isCollapsed, setIsCollapsed] = useState(false);
  const [pesanan, setPesanan] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [nomorResi] = useState(() => generateProNumber('RES', id));
  const [nomorSuratJalan] = useState(() => generateSuratJalanNumber(id));

  const [opsiPengiriman, setOpsiPengiriman] = useState('standar');
  const [catatan, setCatatan] = useState(location.state?.catatan || '');
  const [tanggalPengiriman, setTanggalPengiriman] = useState(location.state?.tanggalPengiriman || '');
  const [waktuPengiriman, setWaktuPengiriman] = useState(location.state?.waktuPengiriman || '09:00-12:00');
  const [alamatTujuan, setAlamatTujuan] = useState('');

  const currentDate = new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const token = localStorage.getItem('token');
        if (!token) throw new Error('Silakan login terlebih dahulu');

        const nomorIzin = localStorage.getItem('nomorIzin'); 
        
        if (!token) throw new Error('Silakan login terlebih dahulu');

        if (!nomorIzin || nomorSuratJalan === 'ERROR-NO-IZIN') {
          throw new Error("Nomor Izin produsen tidak ditemukan di cache. Silakan logout dan login kembali.");
        }
        const pesananId = String(id).padStart(6, '0');
        const response = await fetch(`http://localhost:5000/api/produsen/pesanan-masuk/${pesananId}`, {
          headers: { 'Authorization': `Bearer ${token}` },
        });

        if (!response.ok) {
          const text = await response.text();
          throw new Error(`Gagal: ${response.status} - ${text}`);
        }
        if (!response.headers.get('content-type')?.includes('application/json')) {
          throw new Error('Respons bukan JSON');
        }
        const result = await response.json();
        if (!result.success) throw new Error(result.message || 'Data pesanan tidak tersedia');
        setPesanan(result.data);
        setAlamatTujuan(result.data.pesanan.alamat_pbf || 'Alamat tidak tersedia');
      } catch (error) {
        setError(error.message);
        if (error.message.includes('login')) navigate('/login/produsen');
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, [id, navigate,nomorSuratJalan]);

  const handleCetakSuratJalan = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    const tanggalPengirimanDate = new Date(tanggalPengiriman);
    if (!tanggalPengiriman || isNaN(tanggalPengirimanDate.getTime()) || tanggalPengirimanDate < new Date()) {
      setError('Tanggal pengiriman harus valid dan tidak boleh sebelum hari ini.');
      setIsSubmitting(false);
      return;
    }
    if (!alamatTujuan || alamatTujuan === 'Alamat tidak tersedia') {
      setError('Alamat tujuan tidak tersedia. Hubungi admin.');
      setIsSubmitting(false);
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const hashSuratJalan = `HASH_${Date.now()}_${id}`;
      const pesananId = String(id).padStart(6, '0');
      const response = await fetch(`http://localhost:5000/api/produsen/pesanan-masuk/${pesananId}/status`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          status: 'Dikirim',
          nomorResi,
          nomorSuratJalan,
          tanggalPengiriman,
          alamatTujuan,
          waktuPengiriman,
          catatan,
          hashSuratJalan,
          opsiPengiriman,
        }),
      });

      if (!response.ok) {
        const text = await response.text();
        throw new Error(`Gagal: ${response.status} - ${text}`);
      }
      const result = await response.json();
      if (result.success) {
        alert('Surat jalan berhasil dibuat, stok diperbarui, dan data disimpan ke blockchain.');
        navigate(`/produsen/pengelolaan-pengiriman/surat-jalan/${id}`, {
          state: {
            nomorResi,
            nomorSuratJalan,
            pesanan: pesanan,
            tanggalPengiriman,
            alamatTujuan,
            waktuPengiriman,
            catatan,
            hashSuratJalan,
          },
        });
      } else {
        throw new Error(result.message || 'Gagal mengatur pengiriman.');
      }
    } catch (err) {
      setError(err.message);
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
        <svg className="animate-spin h-8 w-8 text-emerald-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
      </div>
    );
  }

  if (error && !isSubmitting) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-gray-50">
        <div className="p-4 bg-red-100 text-red-700 rounded-lg flex items-center gap-2">
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.732 6.732a1 1 0 011.414 0L10 7.586l.854-.854a1 1 0 111.414 1.414L11.414 9l.854.854a1 1 0 11-1.414 1.414L10 10.414l-.854.854a1 1 0 01-1.414-1.414L8.586 9l-.854-.854a1 1 0 010-1.414z" clipRule="evenodd" />
          </svg>
          {error}
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
      <SidebarProdusen isCollapsed={isCollapsed} setIsCollapsed={setIsCollapsed} />
      <div className={`flex-1 flex flex-col transition-all duration-300 ${isCollapsed ? 'ml-16' : 'ml-64'}`}>
        <NavbarProdusen onLogout={handleLogout} />
        <main className="pt-16 mt-4 ml-8 p-6 ">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Rincian Pengiriman</h1>
              <p className="text-gray-600">Rincian pengiriman untuk pesanan ID: {id}</p>
            </div>
            <Link
              to="/produsen/pengelolaan-pengiriman"
              className="bg-gray-200 text-gray-800 py-2 px-4 rounded-lg hover:bg-gray-300 transition"
            >
              Kembali
            </Link>
          </div>

          <div className="bg-white rounded-lg shadow-lg p-6">
            <form onSubmit={handleCetakSuratJalan} className="space-y-6">
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
                <label className="block text-sm font-medium text-gray-700">Informasi Rincian Pengiriman</label>
                <textarea
                  value="Detail pengiriman akan dicetak pada surat jalan."
                  readOnly
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm bg-gray-100 p-2 h-24 resize-none"
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
                  className="w-full bg-emerald-600 text-white py-3 px-6 rounded-lg hover:bg-emerald-700 transition duration-300 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  // disabled={isSubmitting || !tanggalPengiriman || !alamatTujuan || alamatTujuan === 'Alamat tidak tersedia'}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="animate-spin h-5 w-5" />
                      Menyimpan...
                    </>
                  ) : 'Cetak Surat Jalan'}
                </button>
                <Link
                  to="/produsen/pengelolaan-pengiriman"
                  className="w-full bg-gray-200 text-gray-800 py-3 px-6 rounded-lg hover:bg-gray-300 transition text-center"
                >
                  Kembali
                </Link>
              </div>
            </form>

            {error && (
              <div className="mt-6 p-4 bg-red-100 text-red-700 rounded-lg flex items-center gap-2">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.732 6.732a1 1 0 011.414 0L10 7.586l.854-.854a1 1 0 111.414 1.414L11.414 9l.854.854a1 1 0 11-1.414 1.414L10 10.414l-.854.854a1 1 0 01-1.414-1.414L8.586 9l-.854-.854a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
                {error}
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
};

export default RincianPengiriman;