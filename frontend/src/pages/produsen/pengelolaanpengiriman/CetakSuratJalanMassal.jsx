// frontend/src/pages/produsen/pengelolaanpengiriman/CetakSuratJalanMassal.jsx

import React, { useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import SidebarProdusen from '../../../components/SidebarProdusen';
import NavbarProdusen from '../../../components/NavbarProdusen';
import { Printer, Download } from 'lucide-react';
import html2pdf from 'html2pdf.js';

const CetakSuratJalanMassal = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const contentRef = useRef(null);
  
  // Ambil data lengkap dari halaman konfirmasi
  const { pesananDetails, allDetails } = location.state || { pesananDetails: [], allDetails: {} };
  
  if (pesananDetails.length === 0) {
    return (
      <div className="flex justify-center items-center h-screen">
        <p>Tidak ada data untuk dicetak. Silakan kembali.</p>
        <button onClick={() => navigate(-1)} className="ml-4 p-2 bg-gray-200 rounded">Kembali</button>
      </div>
    );
  }

  const handlePrint = () => window.print();
  const handleDownloadPDF = () => {
    const element = contentRef.current;
    html2pdf()
      .from(element)
      .set({
        margin: [10, 10, 10, 10],
        filename: `surat_jalan_massal.pdf`,
        html2canvas: { scale: 2 },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
      })
      .save();
  };

  return (
    <div className="bg-gray-100">
      {/* Sidebar dan Navbar sengaja disembunyikan di versi cetak */}
      <div className="print:hidden">
        <SidebarProdusen isCollapsed={true} /> 
      </div>
      <div className="flex-1 flex flex-col transition-all duration-300 print:ml-0">
        <div className="print:hidden">
          <NavbarProdusen onLogout={() => { localStorage.clear(); navigate('/'); }} />
        </div>
        
        <main className="flex-1 p-6">
          <div className="max-w-4xl mx-auto">
            <div className="print:hidden flex justify-between items-center mb-6 sticky top-0 bg-gray-100 py-4 z-10">
              <h1 className="text-2xl font-bold">Cetak Surat Jalan Massal ({pesananDetails.length} Lembar)</h1>
              <div className="flex space-x-3">
                <button onClick={handlePrint} className="flex items-center px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700">
                  <Printer className="w-4 h-4 mr-2" /> Cetak
                </button>
                <button onClick={handleDownloadPDF} className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                  <Download className="w-4 h-4 mr-2" /> Unduh PDF
                </button>
                <button onClick={() => navigate('/produsen/pengelolaan-pengiriman')} className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg">
                  Selesai
                </button>
              </div>
            </div>

            <div ref={contentRef}>
              {/* Loop melalui setiap pesanan dan buat satu surat jalan untuk masing-masing */}
              {pesananDetails.map((data) => {
                // --- PERBAIKAN 1: Hitung total harga dari detail ---
               const totalHargaPesanan = data.detail_pesanan?.reduce((sum, item) => sum + (Number(item.total_harga) || 0), 0) || 0;
                return (
                <div key={data.id} className="bg-white p-8 border border-gray-300 shadow-md print:shadow-none print:border-0 print:break-after-page mb-8">
                  {/* Konten Surat Jalan disalin dari SuratJalanProdusen.jsx */}
                  <header className="flex justify-between items-start mb-8 pb-4 border-b-2 border-black">
                    <div className="flex flex-col">
                      <h1 className="text-2xl font-bold text-gray-800">{data.nama_produsen || 'Nama Produsen'}</h1>
                      <p className="text-xs text-gray-600">{data.alamat_produsen || 'Alamat Produsen'}</p>
                    </div>
                    <div className="flex flex-col text-right">
                      <h2 className="text-3xl font-bold text-gray-900">SURAT JALAN</h2>
                      <p className="text-lg font-semibold text-gray-700">No. {data.nomorSuratJalan}</p>
                      <p className="text-sm text-gray-500">
                        Tanggal: {new Date(allDetails.tanggalPengiriman || Date.now()).toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' })}
                      </p>
                    </div>
                  </header>
                  
                  <section className="grid grid-cols-2 gap-8 mb-8 text-sm">
                    <div>
                      <h3 className="font-bold text-gray-800 mb-2">PENGIRIM</h3>
                      <p>{data.nama_produsen || 'Nama Produsen'}</p>
                      <p>{data.alamat_produsen || 'Alamat Produsen'}</p>
                    </div>
                    <div>
                      <h3 className="font-bold text-gray-800 mb-2">PENERIMA</h3>
                      <p className="font-semibold">{data.nama_pbf}</p>
          	      <p>{data.alamat_pbf}</p>
                      <p>{data.kontak_telepon}</p>
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
                        {data.detail_pesanan?.map((item, idx) => (
                          <tr key={item.detail_pesanan_id || idx} className="border-b">
                            <td className="p-2 border">{idx + 1}</td>
                            <td className="p-2 border">{item.nama_obat}</td>
                            <td className="p-2 border font-mono text-xs">{item.id_aset_blockchain}</td>
                            <td className="p-2 border">{item.jumlah_pesanan} Box</td>
                            {/* PERBAIKAN 2: Terapkan toLocaleString di sini juga */}
                            <td className="p-2 text-right border">Rp {(item.total_harga || 0).toLocaleString('id-ID')}</td>
                          </tr>
                        ))}
                      </tbody>
                      <tfoot>
                        <tr className="font-bold bg-gray-50">
                          <td colSpan="4" className="p-2 text-right border">TOTAL HARGA</td>
                          {/* PERBAIKAN 3: Gunakan variabel totalHargaPesanan yang sudah dihitung */}
                          <td className="p-2 text-right border">Rp {totalHargaPesanan.toLocaleString('id-ID')}</td>
                        </tr>
                      </tfoot>
                    </table>
                  </section>
                  
                  <footer className="grid grid-cols-2 gap-8 text-center mt-20 pt-8 text-sm w-full">
                    <div>
                      <p>Penerima,</p>
                      <div className="h-20"></div>
                      <p>(.....................)</p>
                    </div>
                    <div>
                      <p>Hormat Kami,</p>
                      <div className="h-20"></div>
                      <p>( {data.nama_produsen || 'Nama Produsen'} )</p>
                    </div>
                  </footer>
                	<p className="text-xs text-gray-600 mt-12">No. Resi: <span className="font-bold text-gray-900">{data.nomorResi}</span></p>
                </div>
                )
              })}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default CetakSuratJalanMassal;