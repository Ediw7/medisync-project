import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import SidebarPbf from '../../../components/SidebarPbf'; // Ganti ke SidebarPbf
import NavbarPbf from '../../../components/NavbarPbf';   // Ganti ke NavbarPbf
import { Printer, ArrowLeft, Download } from 'lucide-react';
import html2pdf from 'html2pdf.js';
import axios from 'axios';

const SuratPesananApotek = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [pesananData, setPesananData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const contentRef = useRef(null);

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const token = localStorage.getItem('token');
        if (!token) throw new Error('Silakan login terlebih dahulu');

        // --- PERUBAHAN ENDPOINT API ---
        const response = await axios.get(`http://localhost:5000/api/pbf/pesanan-apotek/${id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (!response.data.success) throw new Error(response.data.message || 'Gagal mengambil data pesanan');
        setPesananData(response.data.data);
      } catch (error) {
        console.error('Error fetching pesanan apotek:', error);
        setError(error.message);
        if (error.message.includes('login')) navigate('/login/pbf'); // Arahkan ke login PBF
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
        filename: `surat_pesanan_apotek_${pesananData?.pesanan?.nomor_pesanan}.pdf`,
        html2canvas: { scale: 2 },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
      })
      .save();
  };

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('id-ID', {
      day: '2-digit', month: 'long', year: 'numeric'
    });
  };

  if (isLoading) return <div className="p-6 text-center">Memuat data pesanan...</div>;
  if (error) return <div className="p-6 text-center text-red-500">Error: {error}</div>;
  if (!pesananData || !pesananData.pesanan) return <div className="p-6 text-center">Data pesanan tidak ditemukan.</div>;
  
  // --- SESUAIKAN DENGAN STRUKTUR DATA BARU ---
  const { pesanan: info, detail_pesanan: detail } = pesananData;
  const totalHargaKeseluruhan = detail.reduce((acc, item) => acc + (Number(item.harga_satuan * item.jumlah) || 0), 0);

  return (
    <div className="flex min-h-screen bg-gray-100">
      <SidebarPbf isCollapsed={isCollapsed} setIsCollapsed={setIsCollapsed} />
      <div className={`flex-1 flex flex-col transition-all duration-300 ${isCollapsed ? 'ml-16' : 'ml-64'}`}>
        <NavbarPbf onLogout={handleLogout} />
        <main className="flex-1 pt-16 p-6">
          <div className="max-w-4xl mx-auto">
            <div className="flex justify-between items-center mb-6">
              <button
                onClick={() => navigate('/pbf/pengelolaan-pesanan')} // Kembali ke daftar pesanan PBF
                className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition"
              >
                <ArrowLeft size={18} /> Kembali ke Daftar Pesanan
              </button>
              <div className="flex gap-2">
                <button onClick={() => window.print()} className="flex items-center gap-2 bg-emerald-600 text-white py-2 px-4 rounded-lg hover:bg-emerald-700 transition">
                  <Printer size={18} /> Cetak
                </button>
                <button onClick={handleDownloadPDF} className="flex items-center gap-2 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition">
                  <Download size={18} /> Unduh PDF
                </button>
              </div>
            </div>

            <div ref={contentRef} className="bg-white p-8 md:p-12 rounded-lg shadow-lg border border-gray-200">
              <header className="text-center mb-8 border-b pb-4">
                <h1 className="text-2xl font-bold text-gray-800">SURAT PESANAN APOTEK</h1>
                <p className="text-gray-500">Nomor: {info.nomor_pesanan}</p>
              </header>

              <section className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
                <div>
                  <h2 className="font-semibold text-gray-600 mb-2">Pemesanan oleh:</h2>
                  <p className="font-bold">{info.nama_apotek}</p>
                  <p className="text-sm text-gray-600">{info.alamat_apotek}</p>
                  <p className="text-sm text-gray-600">Telp: {info.telepon}</p>
                  <p className="text-sm text-gray-600">SIPA: {info.nomor_sipa}</p>
                </div>
                <div className="text-left md:text-right">
                  <h2 className="font-semibold text-gray-600 mb-2">Kepada Yth:</h2>
                  <p className="font-bold">{info.nama_pbf}</p>
                  <p className="text-sm text-gray-600">Tanggal Pesan: {formatDate(info.tanggal_pesanan)}</p>
                </div>
              </section>

              <section className="mb-8">
                <p className="mb-4">Dengan hormat, mohon untuk disediakan produk sebagai berikut:</p>
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="p-3 text-sm font-semibold text-gray-700 border">No.</th>
                        <th className="p-3 text-sm font-semibold text-gray-700 border">Nama Obat</th>
                        <th className="p-3 text-sm font-semibold text-gray-700 border">Keterangan (Dosis)</th>
                        <th className="p-3 text-sm font-semibold text-gray-700 border">Jumlah</th>
                        <th className="p-3 text-sm font-semibold text-gray-700 border">Satuan</th>
                        <th className="p-3 text-sm font-semibold text-gray-700 border">Harga Satuan</th>
                        <th className="p-3 text-sm font-semibold text-gray-700 border">Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      {detail.map((item, index) => (
                        <tr key={item.id} className="border-t">
                          <td className="p-3 border">{index + 1}</td>
                          <td className="p-3 border">{item.nama_obat}</td>
                          <td className="p-3 border">{item.keterangan || '-'}</td>
                          <td className="p-3 border">{item.jumlah}</td>
                          <td className="p-3 border">{item.satuan}</td>
                          <td className="p-3 border text-right">Rp {Number(item.harga_satuan || 0).toLocaleString('id-ID')}</td>
                          <td className="p-3 border text-right">Rp {Number(item.harga_satuan * item.jumlah).toLocaleString('id-ID')}</td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr className="bg-gray-50 font-semibold">
                        <td colSpan="6" className="p-3 text-right border">Total Harga Keseluruhan:</td>
                        <td className="p-3 text-right border">Rp {totalHargaKeseluruhan.toLocaleString('id-ID')}</td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </section>

              <footer className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-12 pt-8 border-t">
                <div>
                  <p className="font-semibold">Hormat kami,</p>
                  <p className="mb-2">{info.jabatan || 'Apoteker Penanggung Jawab'},</p>
                  <div className="h-24 w-48 my-2 border rounded flex items-center justify-center bg-gray-50">
                    {info.tanda_tangan_apoteker && (
                      <img
                        src={`http://localhost:5000/${info.tanda_tangan_apoteker.replace(/\\/g, '/')}`}
                        alt="Tanda Tangan"
                        className="h-full w-full object-contain"
                      />
                    )}
                  </div>
                  {/* Di sini bisa diisi nama apoteker jika ada di data */}
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

export default SuratPesananApotek;