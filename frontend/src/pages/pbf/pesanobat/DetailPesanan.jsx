import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import SidebarPbf from '../../../components/SidebarPbf';
import NavbarPbf from '../../../components/NavbarPbf';
import { Printer, ArrowLeft } from 'lucide-react';
import axios from 'axios';

const DetailPesanan = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [pesanan, setPesanan] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const token = localStorage.getItem('token');
        if (!token) throw new Error('Silakan login terlebih dahulu');

        console.log('Fetching pesanan with ID:', id); // Logging untuk debugging
        const response = await axios.get(`http://localhost:5000/api/pbf/pesanan/${id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        console.log('Response data:', response.data); // Logging respons
        if (!response.data.success) throw new Error(response.data.message || 'Gagal mengambil data pesanan');
        setPesanan(response.data.data);
      } catch (error) {
        console.error('Error fetching pesanan:', error);
        setError(error.message);
        if (error.message.includes('login')) navigate('/login/pbf');
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, [id, navigate]);

  const handleLogout = () => {
    localStorage.clear();
    navigate('/');
  };

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('id-ID', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    });
  };

  if (isLoading) {
    return (
      <div className="p-6 text-center text-gray-500">
        <svg
          className="animate-spin mx-auto h-8 w-8 text-emerald-600"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
        >
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          ></path>
        </svg>
        <p className="mt-2">Memuat data pesanan...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 text-center text-red-500 flex items-center justify-center gap-2">
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
          <path
            fillRule="evenodd"
            d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.732 6.732a1 1 0 011.414 0L10 7.586l.854-.854a1 1 0 111.414 1.414L11.414 9l.854.854a1 1 0 11-1.414 1.414L10 10.414l-.854.854a1 1 0 01-1.414-1.414L8.586 9l-.854-.854a1 1 0 010-1.414z"
            clipRule="evenodd"
          />
        </svg>
        <span>Error: {error}</span>
      </div>
    );
  }

  if (!pesanan || !pesanan.pesanan) {
    return <div className="p-6 text-center text-gray-500">Data pesanan tidak ditemukan.</div>;
  }

  const { pesanan: info, detail_pesanan: detail } = pesanan;

  return (
    <div className="flex min-h-screen bg-gray-100">
      <SidebarPbf isCollapsed={isCollapsed} setIsCollapsed={setIsCollapsed} />
      <div className={`flex-1 flex flex-col transition-all duration-300 ${isCollapsed ? 'ml-16' : 'ml-64'}`}>
        <NavbarPbf onLogout={handleLogout} />
        <main className="flex-1 pt-16 p-6">
          <div className="max-w-5xl mx-auto">
            <div className="flex justify-between items-center mb-6">
              <button
                onClick={() => navigate('/pbf/pesan-obat')}
                className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition"
              >
                <ArrowLeft size={18} /> Kembali ke Daftar Pesanan
              </button>
              <button
                onClick={() => window.print()}
                className="flex items-center gap-2 bg-emerald-600 text-white py-2 px-4 rounded-lg hover:bg-emerald-700 transition"
              >
                <Printer size={18} /> Cetak Surat Pesanan
              </button>
            </div>

            <div className="bg-white p-8 rounded-lg shadow-sm border border-gray-200">
              <header className="text-center mb-8 border-b pb-4">
                <h1 className="text-2xl font-bold text-gray-800">SURAT PESANAN</h1>
                <p className="text-gray-500">
                  Nomor: {String(info.id).padStart(6, '0')}/SP/PBF/{new Date(info.tanggal_pesanan).getMonth() + 1}/
                  {new Date(info.tanggal_pesanan).getFullYear()}
                </p>
              </header>

              <section className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
                <div>
                  <h2 className="font-semibold text-gray-600 mb-2">Pemesanan oleh:</h2>
                  <p className="font-bold">{info.nama_pbf}</p>
                  <p className="text-sm text-gray-600">{info.alamat_pbf}</p>
                  <p className="text-sm text-gray-600">Telp: {info.kontak_telepon}</p>
                  <p className="text-sm text-gray-600">Email: {info.kontak_email}</p>
                  <p className="text-sm text-gray-600">SIUP: {info.nomor_siup}</p>
                  <p className="text-sm text-gray-600">SIA/SIKA: {info.nomor_sia_sika}</p>
                </div>
                <div className="text-right">
                  <h2 className="font-semibold text-gray-600 mb-2">Kepada Yth:</h2>
                  <p className="font-bold">{info.nama_produsen || 'Produsen'}</p>
                  <p className="text-sm text-gray-600">{info.alamat_produsen || '-'}</p>
                  <p className="text-sm text-gray-600">Tanggal Pesan: {formatDate(info.tanggal_pesanan)}</p>
                </div>
              </section>

              <section className="mb-8">
                <p className="mb-4">
                  Dengan hormat,<br />
                  Mohon untuk disediakan produk farmasi sebagai berikut:
                </p>
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="p-3 text-sm font-semibold text-gray-700 border">No.</th>
                        <th className="p-3 text-sm font-semibold text-gray-700 border">Nama Obat</th>
                        <th className="p-3 text-sm font-semibold text-gray-700 border">Bentuk Sediaan</th>
                        <th className="p-3 text-sm font-semibold text-gray-700 border">Dosis</th>
                        <th className="p-3 text-sm font-semibold text-gray-700 border">Jumlah</th>
                        <th className="p-3 text-sm font-semibold text-gray-700 border">Harga Satuan</th>
                        <th className="p-3 text-sm font-semibold text-gray-700 border">Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      {detail && detail.length > 0 ? (
                        detail.map((item, index) => (
                          <tr key={item.id} className="border-t">
                            <td className="p-3 border">{index + 1}</td>
                            <td className="p-3 border">{item.nama_obat}</td>
                            <td className="p-3 border">{item.bentuk_sediaan || '-'}</td>
                            <td className="p-3 border">{item.dosis || '-'}</td>
                            <td className="p-3 border">{item.jumlah_pesanan}</td>
                            <td className="p-3 border">Rp {Number(item.harga_per_unit || 0).toLocaleString('id-ID')}</td>
                            <td className="p-3 border">Rp {Number(item.total_harga || 0).toLocaleString('id-ID')}</td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan="7" className="p-3 text-center text-gray-500">
                            Tidak ada item pesanan.
                          </td>
                        </tr>
                      )}
                    </tbody>
                    <tfoot>
                      <tr className="bg-gray-50 font-semibold">
                        <td colSpan="6" className="p-3 text-right">Total Harga:</td>
                        <td className="p-3">Rp {(info.total_harga || 0).toLocaleString('id-ID')}</td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
                <p className="mt-4">
                  Produk tersebut akan kami gunakan untuk keperluan distribusi ke{' '}
                  <span className="font-semibold">{info.tujuan_distribusi || '-'}</span> sesuai dengan
                  peraturan yang berlaku.
                </p>
                {info.catatan_khusus && (
                  <p className="mt-2">
                    <span className="font-semibold">Catatan Khusus:</span> {info.catatan_khusus}
                  </p>
                )}
              </section>

              <footer className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-12 pt-8 border-t">
                <div>
                  <p className="font-semibold">Hormat kami,</p>
                  <p className="mb-2">Apoteker Penanggung Jawab PBF,</p>
                  <div className="h-24 w-48 my-2 border rounded flex items-center justify-center bg-gray-50">
                    {info.tanda_tangan_apoteker ? (
                      <img
                        src={`http://localhost:5000/${info.tanda_tangan_apoteker.replace(/\\/g, '/')}`}
                        alt="Tanda Tangan"
                        className="h-full w-full object-contain"
                        onError={() => console.error('Failed to load tanda tangan')}
                      />
                    ) : (
                      <span className="text-gray-500 text-sm">Tanda tangan tidak tersedia</span>
                    )}
                  </div>
                  <p className="font-bold underline">{info.nama_apoteker}</p>
                  <p className="text-sm text-gray-600">SIPA: {info.nomor_sipa}</p>
                </div>
                <div className="text-center self-end">
                  <p className="font-semibold">(Cap Perusahaan)</p>
                </div>
              </footer>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default DetailPesanan;