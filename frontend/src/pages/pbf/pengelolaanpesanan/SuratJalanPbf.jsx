import React, { useState, useEffect, useRef } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import SidebarPbf from '../../../components/SidebarPbf';
import NavbarPbf from '../../../components/NavbarPbf';
import { Printer, Download, Loader2 } from 'lucide-react';
import axios from 'axios';
import html2pdf from 'html2pdf.js';

const SuratJalanPbf = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [data, setData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const contentRef = useRef(null);

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const token = localStorage.getItem('token');
        if (!token) throw new Error('Silakan login terlebih dahulu');

        const response = await axios.get(`http://localhost:5000/api/pbf/pesanan-apotek/${id}/surat-jalan`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (!response.data.success) throw new Error(response.data.message);
        setData(response.data.data);
      } catch (err) {
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, [id, navigate]);

  const handlePrint = () => window.print();
  const handleDownloadPDF = () => {
    const element = contentRef.current;
    if (element && data?.pesanan?.nomor_surat_jalan) {
      html2pdf()
        .from(element)
        .set({
          margin: [10, 10, 10, 10],
          filename: `surat_jalan_pbf_${data.pesanan.nomor_surat_jalan}.pdf`,
          html2canvas: { scale: 2 },
          jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
        })
        .save();
    }
  };

  const handleLogout = () => {
    localStorage.clear();
    navigate('/');
  };

  if (isLoading) return <div className="flex justify-center items-center h-screen"><Loader2 className="animate-spin h-8 w-8 text-emerald-600" /></div>;
  if (error) return <div className="flex justify-center items-center h-screen"><p className="text-red-500">Error: {error}</p></div>;
  // --- PERBAIKAN: Pemeriksaan data yang lebih kuat ---
  if (!data || !data.pesanan || !data.detail_pesanan) {
    return <div className="p-6 text-center">Data surat jalan tidak lengkap atau tidak ditemukan.</div>;
  }

  const { pesanan: info, detail_pesanan: detail } = data;

  return (
    <div className="flex min-h-screen bg-gray-100">
      <SidebarPbf isCollapsed={isCollapsed} setIsCollapsed={setIsCollapsed} />
      <div className={`flex-1 flex flex-col transition-all duration-300 ${isCollapsed ? 'ml-16' : 'ml-64'}`}>
        <NavbarPbf onLogout={handleLogout} />
        
        <main className="flex-1 pt-16 p-6">
          <div className="max-w-4xl mx-auto">
            <div className="print:hidden flex justify-between items-center mb-6">
              <h1 className="text-2xl font-bold">Surat Jalan PBF</h1>
              <div className="flex space-x-3">
                <button onClick={handlePrint} className="flex items-center px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700">
                  <Printer className="w-4 h-4 mr-2" /> Cetak
                </button>
                <button onClick={handleDownloadPDF} className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                  <Download className="w-4 h-4 mr-2" /> Unduh PDF
                </button>
                <Link to="/pbf/pengelolaan-pesanan" className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg">
                  Selesai
                </Link>
              </div>
            </div>

            <div ref={contentRef} className="bg-white p-8 border border-gray-300 shadow-md print:border-0 print:shadow-none">
              <header className="flex justify-between items-start mb-8 pb-4 border-b-2 border-black">
                  <div className="flex flex-col">
                      {/* --- PERBAIKAN: Tambahkan fallback --- */}
                      <h1 className="text-2xl font-bold text-gray-800">{info?.nama_pbf || 'Nama PBF tidak tersedia'}</h1>
                      <p className="text-xs text-gray-600">{info?.alamat_pbf || 'Alamat tidak tersedia'}</p>
                  </div>
                  <div className="flex flex-col text-right">
                      <h2 className="text-3xl font-bold text-gray-900">SURAT JALAN</h2>
                      {/* --- PERBAIKAN: Tambahkan fallback --- */}
                      <p className="text-lg font-semibold text-gray-700">No. {info?.nomor_surat_jalan || '...'}</p>
                      <p className="text-sm text-gray-500">
                        Tanggal: {info?.tanggal_pengiriman ? new Date(info.tanggal_pengiriman).toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' }) : '...'}
                      </p>
                  </div>
              </header>

              <section className="grid grid-cols-2 gap-8 mb-8 text-sm">
                  <div>
                      <h3 className="font-bold text-gray-800 mb-2">PENGIRIM</h3>
                      {/* --- PERBAIKAN: Tambahkan fallback --- */}
                      <p>{info?.nama_pbf || '...'}</p>
                      <p>{info?.alamat_pbf || '...'}</p>
                  </div>
                  <div>
                      <h3 className="font-bold text-gray-800 mb-2">PENERIMA</h3>
                      {/* --- PERBAIKAN: Tambahkan fallback --- */}
                      <p className="font-semibold">{info?.nama_apotek || '...'}</p>
                      <p>{info?.alamat_apotek || '...'}</p>
                      <p>{info?.kontak_telepon || '...'}</p>
                  </div>
              </section>

              <section className="mb-8">
                <h3 className="font-bold text-gray-800 mb-4">DETAIL PENGIRIMAN</h3>
                <table className="w-full text-sm border-collapse table-auto">
                  <thead className="bg-gray-100">
                    <tr className="border">
                      <th className="p-2 text-left font-bold border">No.</th>
                      <th className="p-2 text-left font-bold border">Nama Obat</th>
                      <th className="p-2 text-left font-bold border">Asset ID (Baru)</th>
                      <th className="p-2 text-left font-bold border">Jumlah</th>
                      <th className="p-2 text-right font-bold border">Total Harga</th>
                    </tr>
                  </thead>
                  <tbody>
                    {/* --- PERBAIKAN: Gunakan optional chaining pada 'detail' --- */}
                    {detail?.map((item, index) => (
                      <tr key={item?.id || index} className="border-b">
                        <td className="p-2 border">{index + 1}</td>
                        <td className="p-2 border">{item?.nama_obat || 'N/A'}</td>
                        <td className="p-2 border font-mono text-xs">{item?.id_aset_blockchain || 'N/A'}</td>
                        <td className="p-2 border">{`${item?.jumlah || 0} ${item?.satuan || ''}`}</td>
                        <td className="p-2 text-right border">Rp {item?.harga_satuan ? (item.jumlah * item.harga_satuan).toLocaleString('id-ID') : '0'}</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="font-bold bg-gray-50">
                        <td colSpan="4" className="p-2 text-right border">TOTAL HARGA</td>
                        {/* --- PERBAIKAN: Tambahkan fallback untuk total_harga --- */}
                        <td className="p-2 text-right border">Rp {(info?.total_harga || 0).toLocaleString('id-ID')}</td>
                    </tr>
                  </tfoot>
                </table>
              </section>

              <footer className="flex justify-between items-end mt-12 pt-8 border-t">
                 {/* --- PERBAIKAN: Tambahkan fallback --- */}
                <p className="text-xs text-gray-600">No. Resi: <span className="font-bold text-gray-900">{info?.nomor_resi || '...'}</span></p>
                
              </footer>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default SuratJalanPbf;