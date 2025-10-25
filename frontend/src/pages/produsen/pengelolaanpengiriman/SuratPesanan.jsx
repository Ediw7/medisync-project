import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import SidebarProdusen from '../../../components/SidebarProdusen';
import NavbarProdusen from '../../../components/NavbarProdusen';
import { Printer, ArrowLeft, Download } from 'lucide-react';
import html2pdf from 'html2pdf.js';
import axios from 'axios';

const SuratPesanan = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [pesananData, setPesananData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const contentRef = useRef(null); // Referensi untuk elemen yang akan dikonversi ke PDF

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const token = localStorage.getItem('token');
        if (!token) throw new Error('Silakan login terlebih dahulu');

        const cleanedId = id.replace(':', ''); // Pastikan ini ada
        console.log('Fetching pesanan with ID:', cleanedId);

        const response = await axios.get(`http://localhost:5000/api/produsen/pesanan-masuk/${cleanedId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (!response.data.success) throw new Error(response.data.message || 'Gagal mengambil data pesanan');
        setPesananData(response.data.data);
      } catch (error) {
        console.error('Error fetching pesanan:', error);
        setError(error.message);
        if (error.message.includes('login')) navigate('/login/produsen');
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

  const handleDownloadPDF = () => {
    const element = contentRef.current;
    html2pdf()
      .from(element)
      .set({
        margin: [10, 10, 10, 10],
        filename: `surat_pesanan_${pesananData?.pesanan?.id}.pdf`,
        html2canvas: { scale: 2 },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
      })
      .save();
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
      <div className="flex min-h-screen bg-gray-100 items-center justify-center">
        <p>Memuat data pesanan...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-screen bg-gray-100 items-center justify-center text-red-500">
        Error: {error}
      </div>
    );
  }

  if (!pesananData || !pesananData.pesanan) {
    return <div className="p-6 text-center text-gray-500">Data pesanan tidak ditemukan.</div>;
  }

  const { pesanan: info, detail_pesanan: detail } = pesananData;
  const totalHargaKeseluruhan = detail.reduce((acc, item) => acc + (Number(item.total_harga) || 0), 0);

  return (
    <div className="flex min-h-screen bg-gray-100">
      <SidebarProdusen isCollapsed={isCollapsed} setIsCollapsed={setIsCollapsed} />
      <div className={`flex-1 flex flex-col transition-all duration-300 ${isCollapsed ? 'ml-16' : 'ml-64'}`}>
        <NavbarProdusen onLogout={handleLogout} />
        <main className="flex-1 pt-18 pl-12 p-6 mt-8 ml-8">
          <div className="max-w-4xl mx-auto">
            <div className="flex justify-between items-center mb-6">
              <button
                onClick={() => navigate('/produsen/pengelolaan-pengiriman')}
                className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition"
              >
                <ArrowLeft size={18} /> Kembali ke Daftar Pesanan Masuk
              </button>
              <div className="flex gap-2">
                <button
                  onClick={() => window.print()}
                  className="flex items-center gap-2 bg-emerald-600 text-white py-2 px-4 rounded-lg hover:bg-emerald-700 transition"
                >
                  <Printer size={18} /> Cetak Surat Pesanan
                </button>
                <button
                  onClick={handleDownloadPDF}
                  className="flex items-center gap-2 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition"
                >
                  <Download size={18} /> Unduh PDF
                </button>
              </div>
            </div>

            <div ref={contentRef} className="bg-white p-8 md:p-12 rounded-lg shadow-lg border border-gray-200">
              <header className="text-center mb-8 border-b pb-4">
                <h1 className="text-2xl font-bold text-gray-800">SURAT PESANAN</h1>
                
                {/* --- PERUBAHAN DI SINI --- */}
                {/* Kita hapus logika fallback yang salah, dan hanya tampilkan info.nomor_po */}
                <p className="text-gray-500">
                  Nomor PO: {info.nomor_po}
                </p>
                {/* --- AKHIR PERUBAHAN --- */}

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
                <div className="text-left md:text-right">
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
                            <td className="p-3 border">{item.jumlah_pesanan}</td>
                            <td className="p-3 border text-right">Rp {Number(item.harga_per_unit || 0).toLocaleString('id-ID')}</td>
                            <td className="p-3 border text-right">Rp {Number(item.total_harga || 0).toLocaleString('id-ID')}</td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan="6" className="p-3 text-center text-gray-500 border">
                            Tidak ada item pesanan.
                          </td>
                        </tr>
                      )}
                    </tbody>
                    <tfoot>
                      <tr className="bg-gray-50 font-semibold">
                        <td colSpan="5" className="p-3 text-right border">Total Harga Keseluruhan:</td>
                        <td className="p-3 text-right border">
                          Rp {totalHargaKeseluruhan.toLocaleString('id-ID')}
                        </td>
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
                    {info.tanda_tangan_apoteker && (
                      <img
                        src={`http://localhost:5000/${info.tanda_tangan_apoteker.replace(/\\/g, '/')}`}
                        alt="Tanda Tangan"
                        className="h-full w-full object-contain"
                      />
                    )}
                  </div>
                  <p className="font-bold underline">{info.nama_apoteker}</p>
                  <p className="text-sm text-gray-600">SIPA: {info.nomor_sipa}</p>
                </div>
              </footer>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default SuratPesanan;