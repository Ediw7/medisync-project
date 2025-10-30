import React, { useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import SidebarProdusen from '../../../components/SidebarProdusen';
import NavbarProdusen from '../../../components/NavbarProdusen';
import { Printer, Download, ArrowLeft } from 'lucide-react';
import html2pdf from 'html2pdf.js';
import logo from '../../../assets/logo.png';

const CetakSuratJalanMassal = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const contentRef = useRef(null);

  const { pesananDetails, allDetails } = location.state || { pesananDetails: [], allDetails: {} };

  if (pesananDetails.length === 0) {
    return (
      <div className="flex justify-center items-center h-screen bg-gradient-to-br from-slate-50 via-white to-emerald-50">
        <p className="text-slate-700 font-medium">Tidak ada data untuk dicetak. Silakan kembali.</p>
        <button onClick={() => navigate(-1)} className="ml-4 px-4 py-2 bg-slate-200 rounded-lg hover:bg-slate-300 transition">Kembali</button>
      </div>
    );
  }

  const handlePrint = () => {
    const printContents = contentRef.current.innerHTML;
    const originalContents = document.body.innerHTML;
    const styles = document.querySelectorAll('style, link[rel="stylesheet"]');
    let styleHTML = '';
    styles.forEach(style => styleHTML += style.outerHTML);

    document.body.innerHTML = `
      <html>
        <head>
          <title>Surat Jalan Massal</title>
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
      filename: `surat_jalan_massal_${new Date().getTime()}.pdf`,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2, useCORS: true, logging: true, dpi: 192, letterRendering: true },
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
      pagebreak: { mode: ['avoid-all', 'css', 'legacy'] }
    };

    html2pdf().from(element).set(opt).save();
  };

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-slate-50 via-white to-emerald-50">
      <SidebarProdusen isCollapsed={true} setIsCollapsed={() => {}} className="print:hidden" />
      <div className="flex-1 flex flex-col transition-all duration-300 print:ml-0 ml-16">
        <NavbarProdusen onLogout={() => { localStorage.clear(); navigate('/'); }} className="print:hidden" />
       
        <main className="flex-1 overflow-auto pt-[72px] p-6 print:p-0">
          <div className="max-w-4xl mx-auto">
            {/* Header Action Buttons */}
            <div className="print:hidden flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4 sticky top-0 bg-gradient-to-br from-slate-50 via-white to-emerald-50 py-4 z-10 px-2 rounded-xl shadow-sm">
              <div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-slate-900 via-emerald-900 to-teal-900 bg-clip-text text-transparent">
                  Cetak Surat Jalan Massal
                </h1>
                <p className="text-slate-600 mt-1">{pesananDetails.length} Lembar Surat Jalan</p>
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
                  onClick={() => navigate('/produsen/pengelolaan-pengiriman')} 
                  className="inline-flex items-center px-4 py-2.5 border border-slate-300 text-slate-700 font-medium rounded-lg hover:bg-slate-100 transition"
                >
                  <ArrowLeft className="w-4 h-4 mr-2" /> Kembali
                </button>
              </div>
            </div>

            {/* Surat Jalan Content */}
            <div ref={contentRef} className="space-y-12 print:space-y-0">
              {pesananDetails.map((pesanan, index) => {
                const totalHargaPesanan = pesanan.detail_pesanan?.reduce((sum, item) => sum + (Number(item.total_harga) || 0), 0) || 0;

                return (
                  <div 
                    key={pesanan.id} 
                    className={`bg-white rounded-xl shadow-lg border border-slate-200 p-10 print:shadow-none print:border-0 print:p-4 print-break-page ${
                      index < pesananDetails.length - 1 ? 'print:break-after-page' : ''
                    }`}
                  >
                    {/* Header */}
                    <header className="flex justify-between items-start mb-10 pb-6 border-b-2 border-slate-800">
                      <div className="flex items-center gap-4">
                        <img src={logo} alt="Company Logo" className="h-16 w-auto print:h-12" />
                        <div>
                          <h1 className="text-2xl font-bold text-slate-800">{pesanan.nama_produsen || 'Nama Produsen'}</h1>
                          <p className="text-xs text-slate-600 max-w-xs">{pesanan.alamat_produsen || 'Alamat Produsen'}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <h2 className="text-3xl font-bold text-slate-900 uppercase tracking-tight">Surat Jalan</h2>
                        <p className="text-lg font-semibold text-slate-700 mt-1">No. {pesanan.nomorSuratJalan}</p>
                        <p className="text-sm text-slate-500 mt-1">
                          Tanggal: {new Date(allDetails.tanggalPengiriman || Date.now()).toLocaleDateString('id-ID', { 
                            day: 'numeric', 
                            month: 'long', 
                            year: 'numeric' 
                          })}
                        </p>
                      </div>
                    </header>

                    {/* Pengirim & Penerima */}
                    <section className="grid grid-cols-1 sm:grid-cols-2 gap-8 mb-10 text-sm">
                      <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
                        <h3 className="font-bold text-slate-800 mb-2 uppercase text-xs tracking-wider">Pengirim</h3>
                        <p className="font-semibold text-slate-700">{pesanan.nama_produsen || 'Nama Produsen'}</p>
                        <p className="text-slate-600">{pesanan.alamat_produsen || 'Alamat Produsen'}</p>
                      </div>
                      <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
                        <h3 className="font-bold text-slate-800 mb-2 uppercase text-xs tracking-wider">Penerima</h3>
                        <p className="font-semibold text-slate-700">{pesanan.nama_pbf}</p>
                        <p className="text-slate-600">{pesanan.alamat_pbf}</p>
                        <p className="text-slate-600">Kontak: {pesanan.kontak_telepon || '-'}</p>
                      </div>
                    </section>

                    {/* Detail Barang */}
                    <section className="mb-10">
                      <h3 className="font-bold text-slate-800 mb-4 uppercase text-sm tracking-wider">Detail Barang</h3>
                      <div className="overflow-x-auto border border-slate-200 rounded-lg">
                        <table className="w-full text-sm">
                          <thead className="bg-slate-100 text-slate-700">
                            <tr>
                              <th className="px-4 py-3 text-left font-semibold border-b border-slate-200">No.</th>
                              <th className="px-4 py-3 text-left font-semibold border-b border-slate-200">Nama Obat</th>
                              <th className="px-4 py-3 text-left font-semibold border-b border-slate-200">Batch ID</th>
                              <th className="px-4 py-3 text-center font-semibold border-b border-slate-200">Jumlah</th>
                              <th className="px-4 py-3 text-right font-semibold border-b border-slate-200">Total Harga</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100">
                            {pesanan.detail_pesanan && pesanan.detail_pesanan.length > 0 ? (
                              pesanan.detail_pesanan.map((item, idx) => (
                                <tr key={item.detail_pesanan_id || idx} className="hover:bg-slate-50">
                                  <td className="px-4 py-3 border-r border-slate-200">{idx + 1}</td>
                                  <td className="px-4 py-3 border-r border-slate-200 font-medium text-slate-800">{item.nama_obat}</td>
                                  <td className="px-4 py-3 border-r border-slate-200 font-mono text-slate-600">{item.batch_id}</td>
                                  <td className="px-4 py-3 text-center border-r border-slate-200">{item.jumlah_pesanan.toLocaleString('id-ID')} Box</td>
                                  <td className="px-4 py-3 text-right">Rp {(item.total_harga || 0).toLocaleString('id-ID')}</td>
                                </tr>
                              ))
                            ) : (
                              <tr>
                                <td colSpan="5" className="text-center py-6 text-slate-500">Tidak ada detail barang.</td>
                              </tr>
                            )}
                          </tbody>
                          {pesanan.detail_pesanan && pesanan.detail_pesanan.length > 0 && (
                            <tfoot className="bg-slate-100 font-semibold text-slate-800">
                              <tr>
                                <td colSpan="4" className="px-4 py-3 text-right border-t-2 border-slate-300 uppercase">Total Keseluruhan</td>
                                <td className="px-4 py-3 text-right border-t-2 border-slate-300">Rp {totalHargaPesanan.toLocaleString('id-ID')}</td>
                              </tr>
                            </tfoot>
                          )}
                        </table>
                      </div>
                    </section>

                    {/* Footer */}
                    <footer className="flex flex-col sm:flex-row justify-between items-start sm:items-end mt-16 pt-8 border-t border-slate-300 text-xs text-slate-600 gap-4">
                      <div>
                        <p>No. Resi Pengiriman: <span className="font-semibold text-slate-900">{pesanan.nomorResi || '-'}</span></p>
                        {allDetails.catatan && <p className="mt-1">Catatan Tambahan: {allDetails.catatan}</p>}
                        <p className="mt-4 print:block hidden">Dokumen ini dicetak pada: {new Date().toLocaleString('id-ID')}</p>
                      </div>
                      <div className="text-center sm:text-right mt-8 sm:mt-0 print:block">
                        <p className="mb-16">Hormat Kami,</p>
                        <p className="font-semibold border-t border-slate-400 pt-2">{pesanan.nama_produsen || 'Produsen'}</p>
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

export default CetakSuratJalanMassal;