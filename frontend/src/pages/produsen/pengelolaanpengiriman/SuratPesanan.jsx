import React, { useState, useEffect, useRef } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import SidebarProdusen from '../../../components/SidebarProdusen';
import NavbarProdusen from '../../../components/NavbarProdusen';
import { Loader2, Printer, Download, ArrowLeft, AlertCircle, FileText } from 'lucide-react';
import axios from 'axios';
import html2pdf from 'html2pdf.js';
import logo from '../../../assets/logo.png'; // Assuming company logo is needed for header
import { toast } from 'react-hot-toast';

const SuratPesanan = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [pesananData, setPesananData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const contentRef = useRef(null);
  const username = localStorage.getItem('username');

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      setError(null);
      let token;
      try {
        token = localStorage.getItem('token');
        if (!token) throw new Error('Silakan login terlebih dahulu');

        const cleanedId = id.replace(':', '');
        console.log('Fetching pesanan with ID:', cleanedId);

        const response = await axios.get(`http://localhost:5000/api/produsen/pesanan-masuk/${cleanedId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (!response.data.success || !response.data.data) throw new Error(response.data.message || 'Gagal mengambil data pesanan atau format data salah');
        setPesananData(response.data.data);
      } catch (error) {
        console.error('Error fetching pesanan:', error);
        setError(error.message);
        toast.error(error.message || 'Gagal memuat data.');
        if ((error.message.includes('401') || error.message.includes('403') || error.message.includes('login')) && token) {
            navigate('/login/produsen');
        } else if (!token) {
             navigate('/login/produsen');
        }
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
     if (!element || !pesananData?.pesanan?.nomor_po) {
        toast.error("Data belum siap untuk diunduh.");
        return;
    }
    const opt = {
        margin:       [10, 5, 10, 5],
        filename:     `surat_pesanan_${pesananData.pesanan.nomor_po}.pdf`,
        image:        { type: 'jpeg', quality: 0.98 },
        html2canvas:  { scale: 2, useCORS: true, logging: true, dpi: 192, letterRendering: true },
        jsPDF:        { unit: 'mm', format: 'a4', orientation: 'portrait' }
    };

    html2pdf().from(element).set(opt).save();
  };

  const handlePrint = () => {
     const printContents = contentRef.current.innerHTML;
     const originalContents = document.body.innerHTML;
     const styles = document.querySelectorAll('style, link[rel="stylesheet"]');
     let styleHTML = '';
     styles.forEach(style => styleHTML += style.outerHTML);

     document.body.innerHTML = `
       <html>
         <head>
           <title>Surat Pesanan ${pesananData?.pesanan?.nomor_po || id}</title>
           ${styleHTML}
           <style>
             @media print {
               @page { size: A4 portrait; margin: 10mm 5mm; } /* Control print margins */
               body { -webkit-print-color-adjust: exact; print-color-adjust: exact; margin: 0; padding: 0;}
               .print\\:hidden { display: none; }
               .print\\:shadow-none { box-shadow: none; }
               .print\\:border-0 { border: 0; }
               .print\\:p-4 { padding: 1rem; } /* Adjust padding for print */
               /* Add other print-specific styles */
             }
           </style>
         </head>
         <body>${printContents}</body>
       </html>
     `;
     window.print();
     document.body.innerHTML = originalContents;
     window.location.reload(); // Reload needed
   };


  const formatDate = (dateString) => {
    if (!dateString) return '-';
    try {
        const date = new Date(dateString);
         if (isNaN(date.getTime())) return '-'; // Check if date is valid
        return date.toLocaleDateString('id-ID', {
          day: 'numeric',
          month: 'long',
          year: 'numeric',
        });
    } catch (e) {
        console.error("Error formatting date:", e);
        return '-';
    }
  };


 if (isLoading) {
     return (
       <div className="flex flex-col justify-center items-center h-screen bg-gradient-to-br from-slate-50 via-white to-emerald-50">
          <div className="relative">
            <Loader2 className="animate-spin h-12 w-12 text-emerald-600" />
            <div className="absolute inset-0 h-12 w-12 rounded-full border-4 border-emerald-200 animate-ping opacity-20"></div>
          </div>
          <p className="mt-4 text-slate-700 font-medium">Memuat Surat Pesanan...</p>
      </div>
    );
  }

  if (error) {
     return (
       <div className="flex flex-col justify-center items-center h-screen bg-gradient-to-br from-slate-50 via-white to-red-50 p-6">
          <div className="bg-white p-8 rounded-xl shadow-lg border border-red-200 text-center">
            <AlertCircle className="mx-auto h-12 w-12 text-red-500 mb-4" />
            <h2 className="text-xl font-bold text-red-800 mb-2">Gagal Memuat Data</h2>
            <p className="text-red-600 mb-6">{error}</p>
            <button
               onClick={() => navigate('/produsen/pengelolaan-pengiriman')}
               className="flex items-center gap-2 px-4 py-2.5 border border-slate-300 text-slate-700 font-medium rounded-lg hover:bg-slate-100 transition mx-auto"
             >
               <ArrowLeft size={18} />
               Kembali
             </button>
          </div>
       </div>
    );
  }

  if (!pesananData || !pesananData.pesanan) {
    return (
       <div className="flex flex-col justify-center items-center h-screen bg-slate-50 p-6">
        <div className="bg-white p-8 rounded-xl shadow-lg border border-slate-200 text-center">
          <FileText className="mx-auto h-12 w-12 text-yellow-500 mb-4" />
          <h2 className="text-xl font-bold text-slate-800 mb-2">Data Pesanan Tidak Ditemukan</h2>
          <p className="text-slate-600 mb-6">Tidak dapat menemukan detail untuk pesanan ini.</p>
           <button
             onClick={() => navigate('/produsen/pengelolaan-pengiriman')}
             className="flex items-center gap-2 px-4 py-2.5 border border-slate-300 text-slate-700 font-medium rounded-lg hover:bg-slate-100 transition mx-auto"
           >
             <ArrowLeft size={18} />
             Kembali
           </button>
        </div>
      </div>
    );
  }

  const { pesanan: info, detail_pesanan: detail } = pesananData;
  const totalHargaKeseluruhan = detail ? detail.reduce((acc, item) => acc + (Number(item.total_harga) || 0), 0) : 0;

  return (
    <div className="flex min-h-screen bg-slate-50">
      <SidebarProdusen isCollapsed={isCollapsed} setIsCollapsed={setIsCollapsed} />
      <div className={`flex-1 flex flex-col transition-all duration-300 ${isCollapsed ? 'ml-16' : 'ml-64'}`}>
        <NavbarProdusen onLogout={handleLogout} username={username} />
        <main className="flex-1 overflow-auto pt-[72px]">
          <div className="max-w-4xl mx-auto px-6 py-8">
            <div className="print:hidden flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
               <button
                  onClick={() => navigate('/produsen/pengelolaan-pengiriman')}
                  className="inline-flex items-center text-emerald-600 hover:text-emerald-700 transition-colors text-sm font-medium"
                >
                  <ArrowLeft size={16} className="mr-1" /> Kembali ke Pesanan Masuk
                </button>
              <div className="flex flex-wrap items-center gap-3">
                <button onClick={handlePrint} className="inline-flex items-center px-4 py-2.5 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition">
                  <Printer className="w-4 h-4 mr-2" /> Cetak
                </button>
                <button onClick={handleDownloadPDF} className="inline-flex items-center px-4 py-2.5 bg-slate-700 text-white font-medium rounded-lg hover:bg-slate-800 transition">
                  <Download className="w-4 h-4 mr-2" /> Unduh PDF
                </button>
              </div>
            </div>

            <div ref={contentRef} className="bg-white rounded-xl shadow-lg border border-slate-200 p-10 print:shadow-none print:border-0 print:p-4">
              <header className="text-center mb-10 pb-6 border-b-2 border-slate-800 relative">
                 <img src={logo} alt="Logo PBF" className="h-16 w-auto mx-auto mb-4 print:h-12 absolute top-0 left-0" /> {/* Logo PBF */}
                <h1 className="text-3xl font-bold text-slate-900 uppercase tracking-tight mt-8">Surat Pesanan</h1>
                <p className="text-slate-600 mt-1">Nomor PO: <span className="font-semibold text-slate-800">{info.nomor_po}</span></p>
              </header>

              <section className="grid grid-cols-1 sm:grid-cols-2 gap-8 mb-10 text-sm">
                  <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
                      <h3 className="font-bold text-slate-800 mb-2 uppercase text-xs tracking-wider">Pemesanan Oleh</h3>
                      <p className="font-semibold text-slate-700">{info.nama_pbf}</p>
                      <p className="text-slate-600">{info.alamat_pbf}</p>
                      <p className="text-slate-600">Telp: {info.kontak_telepon}</p>
                      <p className="text-slate-600">Email: {info.kontak_email}</p>
                      <p className="text-slate-600">SIUP: {info.nomor_siup || '-'}</p>
                      <p className="text-slate-600">SIA/SIKA: {info.nomor_sia_sika || '-'}</p>
                  </div>
                  <div className="bg-slate-50 p-4 rounded-lg border border-slate-200 text-left sm:text-right">
                      <h3 className="font-bold text-slate-800 mb-2 uppercase text-xs tracking-wider">Kepada Yth</h3>
                      <p className="font-semibold text-slate-700">{info.nama_produsen || 'Produsen'}</p>
                      <p className="text-slate-600">{info.alamat_produsen || '-'}</p>
                      <p className="text-slate-600 mt-2">Tanggal Pesan: <span className="font-medium">{formatDate(info.tanggal_pesanan)}</span></p>
                  </div>
              </section>

              <section className="mb-10 text-sm">
                <p className="mb-4 text-slate-700 leading-relaxed">
                  Dengan hormat,<br />
                  Mohon untuk disediakan produk farmasi sebagai berikut:
                </p>
                <div className="overflow-x-auto border border-slate-200 rounded-lg">
                  <table className="w-full text-sm">
                    <thead className="bg-slate-100 text-slate-700">
                      <tr>
                        <th className="px-4 py-3 text-left font-semibold border-b border-slate-200">No.</th>
                        <th className="px-4 py-3 text-left font-semibold border-b border-slate-200">Nama Obat</th>
                        <th className="px-4 py-3 text-left font-semibold border-b border-slate-200">Bentuk Sediaan</th>
                        <th className="px-4 py-3 text-center font-semibold border-b border-slate-200">Jumlah</th>
                        <th className="px-4 py-3 text-right font-semibold border-b border-slate-200">Harga Satuan</th>
                        <th className="px-4 py-3 text-right font-semibold border-b border-slate-200">Total</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {detail && detail.length > 0 ? (
                        detail.map((item, index) => (
                          <tr key={item.id || index} className="hover:bg-slate-50">
                            <td className="px-4 py-3 border-r border-slate-200">{index + 1}</td>
                            <td className="px-4 py-3 border-r border-slate-200 font-medium text-slate-800">{item.nama_obat}</td>
                            <td className="px-4 py-3 border-r border-slate-200">{item.bentuk_sediaan || '-'}</td>
                            <td className="px-4 py-3 text-center border-r border-slate-200">{item.jumlah_pesanan.toLocaleString('id-ID')} Box</td>
                            <td className="px-4 py-3 text-right border-r border-slate-200">Rp {(Number(item.harga_per_unit) || 0).toLocaleString('id-ID')}</td>
                            <td className="px-4 py-3 text-right">Rp {(Number(item.total_harga) || 0).toLocaleString('id-ID')}</td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan="6" className="text-center py-6 text-slate-500 border-t border-slate-200">
                            Tidak ada item pesanan.
                          </td>
                        </tr>
                      )}
                    </tbody>
                    {detail && detail.length > 0 && (
                      <tfoot className="bg-slate-100 font-semibold text-slate-800">
                        <tr>
                          <td colSpan="5" className="px-4 py-3 text-right border-t-2 border-slate-300">TOTAL HARGA KESELURUHAN</td>
                          <td className="px-4 py-3 text-right border-t-2 border-slate-300">
                            Rp {totalHargaKeseluruhan.toLocaleString('id-ID')}
                          </td>
                        </tr>
                      </tfoot>
                    )}
                  </table>
                </div>
                <p className="mt-6 text-slate-700 leading-relaxed">
                  Produk tersebut akan kami gunakan untuk keperluan distribusi ke{' '}
                  <span className="font-semibold text-slate-800">{info.tujuan_distribusi || '-'}</span> sesuai dengan
                  peraturan yang berlaku.
                </p>
                {info.catatan_khusus && (
                  <p className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg text-yellow-800">
                    <span className="font-semibold">Catatan Khusus:</span> {info.catatan_khusus}
                  </p>
                )}
              </section>

              <footer className="grid grid-cols-1 sm:grid-cols-2 gap-8 mt-16 pt-8 border-t border-slate-300 text-sm">
                <div className="text-center sm:text-left">
                  <p className="mb-16">Hormat kami,</p>
                   <div className="h-20 w-40 mb-2 border-b border-slate-400 mx-auto sm:mx-0 flex items-center justify-center bg-slate-50">
                     {/* Tampilkan tanda tangan jika ada, jika tidak, kosongkan */}
                     {info.tanda_tangan_apoteker ? (
                        <img
                          src={`http://localhost:5000/${info.tanda_tangan_apoteker.replace(/\\/g, '/')}`}
                          alt="Tanda Tangan Apoteker"
                          className="h-full w-full object-contain mix-blend-darken"
                          onError={(e) => { e.target.style.display = 'none'; /* Sembunyikan jika error load */ }}
                        />
                      ) : (
                         <span className="text-slate-400 text-xs italic">Tanda Tangan</span>
                      )}
                   </div>
                  <p className="font-bold underline text-slate-800">{info.nama_apoteker || 'Nama Apoteker'}</p>
                  <p className="text-slate-600">Apoteker Penanggung Jawab PBF</p>
                  <p className="text-slate-600">SIPA: {info.nomor_sipa || '-'}</p>
                </div>
                 {/* Kolom kanan bisa ditambahkan jika perlu tanda tangan penerima/produsen */}
                 <div className="text-center sm:text-right pt-8 sm:pt-0 print:hidden">
                    <p className="text-slate-500">Dicetak oleh: {username || 'Sistem'}</p>
                    <p className="text-slate-500">Tanggal Cetak: {new Date().toLocaleString('id-ID')}</p>
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