import React, { useState, useRef, useEffect } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import SidebarPbf from '../../../components/SidebarPbf';
import NavbarPbf from '../../../components/NavbarPbf';
import { Printer, Download, ArrowLeft, Loader2 } from 'lucide-react';
import html2pdf from 'html2pdf.js';
import logo from '../../../assets/logo.png';
import axios from 'axios';

const CetakSuratJalanMassalPbf = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const contentRef = useRef(null);
  const [isCollapsed, setIsCollapsed] = useState(false);

  // --- PERBAIKAN 1: Variabel destructuring sudah benar ---
  const { pesananDetails: processedDetails = [], allDetails = {} } = location.state || {};
  const username = localStorage.getItem('username');

  const [pbfProfile, setPbfProfile] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchPbfProfile = async () => {
      setIsLoading(true);
      try {
        const token = localStorage.getItem('token');
        if (!token) throw new Error('Token tidak ditemukan');
        const response = await axios.get('http://localhost:5000/api/pbf/profile', {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (response.data.success) {
          setPbfProfile(response.data.data);
        } else {
          throw new Error(response.data.message || 'Gagal mengambil profil PBF');
        }
      } catch (error) {
        console.error('Gagal mengambil profil PBF:', error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchPbfProfile();
  }, []);

  // --- PERBAIKAN 2: Gunakan 'processedDetails' ---
  if (!processedDetails || processedDetails.length === 0) {
    return (
      <div className="flex justify-center items-center h-screen bg-gradient-to-br from-slate-50 via-white to-emerald-50">
        <p className="text-slate-700 font-medium">Tidak ada data untuk dicetak. Silakan kembali.</p>
        <button
          onClick={() => navigate(-1)}
          className="ml-4 px-4 py-2 bg-slate-200 rounded-lg hover:bg-slate-300 transition"
        >
          Kembali
        </button>
      </div>
    );
  }

  const handlePrint = () => {
    const printContents = contentRef.current.innerHTML;
    const originalContents = document.body.innerHTML;
    const styles = document.querySelectorAll('style, link[rel="stylesheet"]');
    let styleHTML = '';
    styles.forEach((style) => (styleHTML += style.outerHTML));

    document.body.innerHTML = `
      <html>
        <head>
          <title>Surat Jalan Massal PBF</title>
          ${styleHTML}
          <style>
            @media print {
              body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
              .print\\:hidden { display: none; }
              .print\\:shadow-none { box-shadow: none; }
              .print\\:border-0 { border: 0; }
              .print\\:p-4 { padding: 1rem; }
              .print\\:h-12 { height: 3rem; }
              .print\\:block { display: block; }
              .print-break-page { page-break-after: always; }
            }
          </style>
        </head>
        <body>${printContents}</body>
      </html>
    `;
    window.print();
    document.body.innerHTML = originalContents;
    window.location.reload();
  };

  const handleDownloadPDF = () => {
    const element = contentRef.current;
    const opt = {
      margin: [10, 5, 10, 5],
      filename: `surat_jalan_massal_pbf_${new Date().getTime()}.pdf`,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2, useCORS: true, logging: true, dpi: 192, letterRendering: true },
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
      pagebreak: { mode: ['avoid-all', 'css', 'legacy'] },
    };

    html2pdf().from(element).set(opt).save();
  };

  const handleLogout = () => {
    localStorage.clear();
    navigate('/');
  };

  if (isLoading) {
    return (
      <div className="flex flex-col justify-center items-center h-screen bg-gradient-to-br from-slate-50 via-white to-emerald-50">
        <Loader2 className="animate-spin h-12 w-12 text-emerald-600" />
        <p className="mt-4 text-slate-700 font-medium">Memuat profil PBF...</p>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-slate-50 via-white to-emerald-50">
      <SidebarPbf isCollapsed={isCollapsed} setIsCollapsed={setIsCollapsed} />
      <div
        className={`flex-1 flex flex-col transition-all duration-300 print:ml-0 ${isCollapsed ? 'ml-16' : 'ml-64'}`}
      >
        <NavbarPbf onLogout={handleLogout} username={username} className="print:hidden" />

        <main className="flex-1 overflow-auto pt-[72px] p-6 print:p-0">
          <div className="max-w-4xl mx-auto">
            {/* Header Action Buttons */}
            <div className="print:hidden flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4 sticky top-0 bg-gradient-to-br from-slate-50 via-white to-emerald-50 py-4 z-10 px-2 rounded-xl shadow-sm">
              <div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-slate-900 via-emerald-900 to-teal-900 bg-clip-text text-transparent">
                  Cetak Surat Jalan Massal
                </h1>
                {/* --- PERBAIKAN 3: Gunakan 'processedDetails' --- */}
                <p className="text-slate-600 mt-1">{processedDetails.length} Lembar Surat Jalan</p>
              </div>
              <div className="flex flex-wrap gap-3">
                <button
                  onClick={handlePrint}
                  className="inline-flex items-center px-4 py-2.5 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition shadow-sm"
                >
                  <Printer className="w-4 h-4 mr-2" /> Cetak
                </button>
                <button
                  onClick={handleDownloadPDF}
                  className="inline-flex items-center px-4 py-2.5 bg-slate-700 text-white font-medium rounded-lg hover:bg-slate-800 transition shadow-sm"
                >
                  <Download className="w-4 h-4 mr-2" /> Unduh PDF
                </button>
                <button
                  onClick={() => navigate('/pbf/tracking-pengiriman')}
                  className="inline-flex items-center px-4 py-2.5 border border-slate-300 text-slate-700 font-medium rounded-lg hover:bg-slate-100 transition"
                >
                  <ArrowLeft className="w-4 h-4 mr-2" /> Kembali
                </button>
              </div>
            </div>

            {/* Surat Jalan Content */}
            <div ref={contentRef} className="space-y-12 print:space-y-0">
              {/* --- PERBAIKAN 4: Gunakan 'processedDetails' --- */}
              {processedDetails.map((pesanan, index) => {
                const totalHargaPesanan =
                  pesanan.detail_pesanan?.reduce(
                    (sum, item) => sum + (Number(item.jumlah) * Number(item.harga_satuan) || 0),
                    0
                  ) || 0;

                return (
                  <div
                    key={pesanan.id}
                    // --- PERBAIKAN 5: Gunakan 'processedDetails' ---
                    className={`bg-white rounded-xl shadow-lg border border-slate-200 p-10 print:shadow-none print:border-0 print:p-4 print-break-page ${index < processedDetails.length - 1 ? 'print:break-after-page' : ''}`}
                  >
                    {/* Header */}
                    <header className="flex justify-between items-start mb-10 pb-6 border-b-2 border-slate-800">
                      <div className="flex items-center gap-4">
                        <img src={logo} alt="Company Logo" className="h-16 w-auto print:h-12" />
                        <div>
                          <h1 className="text-2xl font-bold text-slate-800">
                            {pbfProfile?.nama_resmi || 'Nama PBF Anda'}
                          </h1>
                          <p className="text-xs text-slate-600 max-w-xs">
                            {pbfProfile?.alamat || 'Alamat PBF Anda'}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <h2 className="text-3xl font-bold text-slate-900 uppercase tracking-tight">
                          Surat Jalan
                        </h2>
                        <p className="text-lg font-semibold text-slate-700 mt-1">
                          No. {pesanan.nomorSuratJalan}
                        </p>
                        <p className="text-sm text-slate-500 mt-1">
                          Tanggal:{' '}
                          {new Date(allDetails.tanggalPengiriman || Date.now()).toLocaleDateString(
                            'id-ID',
                            {
                              day: 'numeric',
                              month: 'long',
                              year: 'numeric',
                            }
                          )}
                        </p>
                      </div>
                    </header>

                    {/* Pengirim & Penerima */}
                    <section className="grid grid-cols-1 sm:grid-cols-2 gap-8 mb-10 text-sm">
                      <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
                        <h3 className="font-bold text-slate-800 mb-2 uppercase text-xs tracking-wider">
                          Pengirim
                        </h3>
                        <p className="font-semibold text-slate-700">{pbfProfile?.nama_resmi}</p>
                        <p className="text-slate-600">{pbfProfile?.alamat}</p>
                      </div>
                      <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
                        <h3 className="font-bold text-slate-800 mb-2 uppercase text-xs tracking-wider">
                          Penerima
                        </h3>
                        <p className="font-semibold text-slate-700">{pesanan.nama_apotek}</p>
                        <p className="text-slate-600">{pesanan.alamat_apotek}</p>
                      </div>
                    </section>

                    {/* Detail Barang */}
                    <section className="mb-10">
                      <h3 className="font-bold text-slate-800 mb-4 uppercase text-sm tracking-wider">
                        Detail Barang
                      </h3>
                      <div className="overflow-x-auto border border-slate-200 rounded-lg">
                        <table className="w-full text-sm">
                          <thead className="bg-slate-100 text-slate-700">
                            <tr>
                              <th className="px-4 py-3 text-left font-semibold border-b border-slate-200">
                                No.
                              </th>
                              <th className="px-4 py-3 text-left font-semibold border-b border-slate-200">
                                Nama Obat
                              </th>
                              <th className="px-4 py-3 text-left font-semibold border-b border-slate-200">
                                Asset ID (Baru)
                              </th>
                              <th className="px-4 py-3 text-center font-semibold border-b border-slate-200">
                                Jumlah
                              </th>
                              <th className="px-4 py-3 text-right font-semibold border-b border-slate-200">
                                Total Harga
                              </th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100">
                            {pesanan.detail_pesanan && pesanan.detail_pesanan.length > 0 ? (
                              pesanan.detail_pesanan.map((item, idx) => (
                                <tr
                                  key={item.detail_pesanan_id || idx}
                                  className="hover:bg-slate-50"
                                >
                                  <td className="px-4 py-3 border-r border-slate-200">{idx + 1}</td>
                                  <td className="px-4 py-3 border-r border-slate-200 font-medium text-slate-800">
                                    {item.nama_obat}
                                  </td>
                                  <td className="px-4 py-3 border-r border-slate-200 font-mono text-xs">
                                    {item.id_aset_blockchain}
                                  </td>
                                  <td className="px-4 py-3 text-center border-r border-slate-200">
                                    {item.jumlah.toLocaleString('id-ID')} Box
                                  </td>
                                  <td className="px-4 py-3 text-right">
                                    Rp{' '}
                                    {Number(item.jumlah * item.harga_satuan || 0).toLocaleString(
                                      'id-ID',
                                      { minimumFractionDigits: 2 }
                                    )}
                                  </td>
                                </tr>
                              ))
                            ) : (
                              <tr>
                                <td colSpan="5" className="text-center py-6 text-slate-500">
                                  Tidak ada detail barang.
                                </td>
                              </tr>
                            )}
                          </tbody>
                          {pesanan.detail_pesanan && pesanan.detail_pesanan.length > 0 && (
                            <tfoot className="bg-slate-100 font-semibold text-slate-800">
                              <tr>
                                <td
                                  colSpan="4"
                                  className="px-4 py-3 text-right border-t-2 border-slate-300 uppercase"
                                >
                                  Total Keseluruhan
                                </td>
                                <td className="px-4 py-3 text-right border-t-2 border-slate-300">
                                  Rp{' '}
                                  {Number(totalHargaPesanan).toLocaleString('id-ID', {
                                    minimumFractionDigits: 2,
                                  })}
                                </td>
                              </tr>
                            </tfoot>
                          )}
                        </table>
                      </div>
                    </section>

                    {/* Footer */}
                    <footer className="flex flex-col sm:flex-row justify-between items-start sm:items-end mt-16 pt-8 border-t border-slate-300 text-xs text-slate-600 gap-4">
                      <div>
                        <p>
                          No. Resi Pengiriman:{' '}
                          <span className="font-semibold text-slate-900">
                            {pesanan.nomorResi || '-'}
                          </span>
                        </p>
                        {allDetails.catatanKurir && (
                          <p className="mt-1">
                            <span className="font-semibold">Catatan Kurir:</span> {allDetails.catatanKurir}
                          </p>
                        )}
                      
                        <p className="mt-4 print:block hidden">
                          Dokumen ini dicetak pada: {new Date().toLocaleString('id-ID')}
                        </p>
                      </div>
                      <div className="text-center sm:text-right mt-8 sm:mt-0 print:block">
                        <p className="mb-16">Hormat Kami,</p>
                        <p className="font-semibold border-t border-slate-400 pt-2">
                          {pbfProfile?.nama_resmi || 'Nama PBF Anda'}
                        </p>
                        <p>(Pengirim)</p>
                      </div>
                    </footer>
                  </div>
                );
              })}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default CetakSuratJalanMassalPbf;
