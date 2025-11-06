import React, { useState, useEffect, useRef } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import SidebarProdusen from '../../../components/SidebarProdusen';
import NavbarProdusen from '../../../components/NavbarProdusen';
import { Loader2, Printer, Download, ArrowLeft, AlertCircle, FileText } from 'lucide-react';
import axios from 'axios';
import html2pdf from 'html2pdf.js';
import logo from '../../../assets/logo.png';
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

        const cleanedId = id.replace(':', ''); // Membersihkan ID jika ada ':'
        console.log('Fetching pesanan with ID:', cleanedId);

        const response = await axios.get(
          `http://localhost:5000/api/produsen/pesanan-masuk/${cleanedId}`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );

        if (!response.data || !response.data.success || !response.data.data) {
          throw new Error(
            response.data.message || 'Gagal mengambil data pesanan atau format data salah'
          );
        }
        setPesananData(response.data.data);
      } catch (error) {
        console.error('Error fetching pesanan:', error);
        const errorMessage =
          error.response?.data?.message || error.message || 'Terjadi kesalahan tidak diketahui';
        setError(errorMessage);
        toast.error(errorMessage);

        const isAuthError =
          error.response?.status === 401 ||
          error.response?.status === 403 ||
          errorMessage.includes('login');
        if (!token || isAuthError) {
          setTimeout(() => navigate('/login/produsen'), 1500);
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
      toast.error('Konten surat pesanan belum siap atau data tidak lengkap.');
      return;
    }

    const toastId = toast.loading('Membuat file PDF...');

    const opt = {
      margin: [10, 5, 10, 5],
      filename: `surat_pesanan_${pesananData.pesanan.nomor_po}.pdf`,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: {
        scale: 2,
        useCORS: true,
        logging: false,
        dpi: 192,
        letterRendering: true,
      },
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
    };

    html2pdf()
      .from(element)
      .set(opt)
      .save()
      .then(() => {
        toast.success('PDF berhasil diunduh!', { id: toastId });
      })
      .catch((err) => {
        console.error('Error creating PDF:', err);
        toast.error('Gagal membuat PDF.', { id: toastId });
      });
  };

  // --- FUNGSI PRINT YANG DIPERBAIKI ---
  const handlePrint = () => {
    if (!contentRef.current) {
      toast.error('Konten surat pesanan belum siap untuk dicetak.');
      return;
    }

    const elementToPrint = contentRef.current.cloneNode(true);

    // Sembunyikan elemen yang tidak perlu dicetak (jika ada) di dalam kloningan
    // (Saat ini tidak ada, tapi ini cara yang baik)
    // const elementsToHide = elementToPrint.querySelectorAll('.print-hidden');
    // elementsToHide.forEach(el => el.style.display = 'none');

    const printWindow = window.open('', '_blank', 'height=800,width=800');
    printWindow.document.write('<html><head><title>Cetak Surat Pesanan</title>');

    // Salin semua tag <style> dan <link> dari dokumen utama
    document.querySelectorAll('style, link[rel="stylesheet"]').forEach((style) => {
      printWindow.document.write(style.outerHTML);
    });

    // Tambahkan CSS khusus untuk cetak
    printWindow.document.write(`
        <style>
            @media print {
              body {
                 margin: 10mm 5mm; 
                 -webkit-print-color-adjust: exact; 
                 print-color-adjust: exact; 
              }
              .print\\:shadow-none { box-shadow: none !important; }
              .print\\:border-0 { border: 0 !important; }
              .print\\:p-4 { padding: 1rem !important; }
              .print\\:ml-0 { margin-left: 0 !important; }
              .print\\:pt-0 { padding-top: 0 !important; }
              .print\\:px-0 { padding-left: 0 !important; padding-right: 0 !important; }
              .print\\:py-0 { padding-top: 0 !important; padding-bottom: 0 !important; }
              .print\\:rounded-none { border-radius: 0 !important; }
              .print\\:h-12 { height: 3rem !important; }
              .print\\:text-xs { font-size: 0.75rem !important; line-height: 1rem !important; }
              .print\\:mb-6 { margin-bottom: 1.5rem !important; }
              .print\\:mt-10 { margin-top: 2.5rem !important; }
              .print\\:pt-4 { padding-top: 1rem !important; }
              .print\\:border-slate-400 { border-color: #94a3b8 !important; }
              .print\\:bg-slate-200 { background-color: #e2e8f0 !important; }
              .print\\:text-slate-700 { color: #334155 !important; }
              .print\\:block { display: block !important; }
            }
        </style>
    `);

    printWindow.document.write('</head><body>');
    printWindow.document.write(elementToPrint.innerHTML);
    printWindow.document.write('</body></html>');

    printWindow.document.close();
    printWindow.focus();

    setTimeout(() => {
      // Beri waktu untuk memuat gambar/gaya
      printWindow.print();
      printWindow.close();
    }, 1000);
  };
  // --- AKHIR FUNGSI PRINT ---

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    try {
      let isoString = dateString;
      if (dateString.length === 10) {
        // YYYY-MM-DD format
        isoString = dateString + 'T00:00:00Z'; // Force UTC midnight
      }
      const date = new Date(isoString);
      if (isNaN(date.getTime())) return '-';
      return date.toLocaleDateString('id-ID', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      });
    } catch (e) {
      console.error('Error formatting date:', dateString, e);
      return 'Invalid Date';
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
            Kembali ke Pengiriman
          </button>
        </div>
      </div>
    );
  }

  if (!pesananData || !pesananData.pesanan || !pesananData.detail_pesanan) {
    return (
      <div className="flex flex-col justify-center items-center h-screen bg-slate-50 p-6">
        <div className="bg-white p-8 rounded-xl shadow-lg border border-slate-200 text-center">
          <FileText className="mx-auto h-12 w-12 text-yellow-500 mb-4" />
          <h2 className="text-xl font-bold text-slate-800 mb-2">Data Pesanan Tidak Lengkap</h2>
          <p className="text-slate-600 mb-6">
            Tidak dapat menemukan informasi pesanan atau detail item.
          </p>
          <button
            onClick={() => navigate('/produsen/pengelolaan-pengiriman')}
            className="flex items-center gap-2 px-4 py-2.5 border border-slate-300 text-slate-700 font-medium rounded-lg hover:bg-slate-100 transition mx-auto"
          >
            <ArrowLeft size={18} />
            Kembali ke Pengiriman
          </button>
        </div>
      </div>
    );
  }

  const { pesanan: info, detail_pesanan: detail } = pesananData;
  const totalHargaKeseluruhan = detail.reduce(
    (acc, item) => acc + (Number(item.total_harga) || 0),
    0
  );

  return (
    <div className="flex min-h-screen bg-slate-100">
      <SidebarProdusen isCollapsed={isCollapsed} setIsCollapsed={setIsCollapsed} />
      <div
        className={`print:ml-0 flex-1 flex flex-col transition-all duration-300 ${isCollapsed ? 'ml-16' : 'ml-64'}`}
      >
        <NavbarProdusen onLogout={handleLogout} username={username} className="print:hidden" />
        <main className="flex-1 overflow-auto pt-[72px] px-12 py-8 print:pt-0 print:px-0 print:py-0">
          <div className="max-w-4xl mx-auto">
            <div className="print:hidden flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4 relative z-10">
              <button
                onClick={() => navigate('/produsen/pengelolaan-pengiriman')}
                className="inline-flex items-center text-emerald-600 hover:text-emerald-700 transition-colors text-sm font-medium"
              >
                <ArrowLeft size={16} className="mr-1" /> Kembali ke Pengiriman
              </button>
              <div className="flex flex-wrap items-center gap-3">
                <button
                  onClick={handlePrint}
                  className="inline-flex items-center px-4 py-2.5 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition"
                >
                  <Printer className="w-4 h-4 mr-2" /> Cetak
                </button>
                <button
                  onClick={handleDownloadPDF}
                  className="inline-flex items-center px-4 py-2.5 bg-slate-700 text-white font-medium rounded-lg hover:bg-slate-800 transition"
                >
                  <Download className="w-4 h-4 mr-2" /> Unduh PDF
                </button>
              </div>
            </div>

            <div
              ref={contentRef}
              className="bg-white rounded-xl shadow-lg border border-slate-200 p-10 print:shadow-none print:border-0 print:p-4 print:rounded-none"
            >
              <header className="flex justify-between items-start mb-10 pb-6 border-b-2 border-slate-800">
                <img src={logo} alt="Logo Perusahaan" className="h-16 w-auto print:h-12" />
                <div className="text-right">
                  <h2 className="text-3xl font-bold text-slate-900 uppercase tracking-tight">
                    Surat Pesanan
                  </h2>
                  <p className="text-lg font-semibold text-slate-700 mt-1">No. {info.nomor_po}</p>
                  <p className="text-sm text-slate-500 mt-1">
                    Tanggal: {formatDate(info.tanggal_pesanan)}
                  </p>
                </div>
              </header>

              <section className="grid grid-cols-2 gap-8 mb-10 text-sm print:gap-4 print:mb-6 print:text-xs">
                <div className="space-y-1">
                  <h3 className="font-bold text-slate-800 mb-2 uppercase text-xs tracking-wider border-b pb-1">
                    Pemesanan Oleh (PBF)
                  </h3>
                  <p className="font-semibold text-slate-700">{info.nama_pbf}</p>
                  <p className="text-slate-600">{info.alamat_pbf}</p>
                  <p className="text-slate-600">Telp: {info.kontak_telepon || '-'}</p>
                  <p className="text-slate-600">Email: {info.kontak_email || '-'}</p>
                  <p className="text-slate-600">SIUP: {info.nomor_siup || '-'}</p>
                  <p className="text-slate-600">SIA/SIKA: {info.nomor_sia_sika || '-'}</p>
                </div>
                <div className="space-y-1 text-right">
                  <h3 className="font-bold text-slate-800 mb-2 uppercase text-xs tracking-wider border-b pb-1">
                    Kepada Yth. (Produsen)
                  </h3>
                  <p className="font-semibold text-slate-700">
                    {info.nama_produsen || 'Nama Produsen Anda'}
                  </p>
                  <p className="text-slate-600">{info.alamat_produsen || 'Alamat Produsen Anda'}</p>
                  <p className="text-slate-600 mt-4">
                    Tanggal Pesan:{' '}
                    <span className="font-medium">{formatDate(info.tanggal_pesanan)}</span>
                  </p>
                </div>
              </section>

              <section className="mb-10">
                <p className="mb-4 text-slate-700 leading-relaxed print:mb-2 print:text-xs">
                  Dengan hormat,
                  <br />
                  Mohon untuk disediakan produk farmasi sebagai berikut:
                </p>
                <div className="overflow-x-auto border border-slate-200 rounded-lg print:border-slate-400">
                  <table className="w-full text-sm print:text-xs">
                    <thead className="bg-slate-100 text-slate-700 print:bg-slate-200">
                      <tr>
                        <th className="px-3 py-2 text-left font-semibold border-b border-slate-200 print:border-slate-400">
                          No.
                        </th>
                        <th className="px-3 py-2 text-left font-semibold border-b border-slate-200 print:border-slate-400">
                          Nama Obat
                        </th>
                        <th className="px-3 py-2 text-left font-semibold border-b border-slate-200 print:border-slate-400">
                          Bentuk Sediaan
                        </th>
                        <th className="px-3 py-2 text-center font-semibold border-b border-slate-200 print:border-slate-400">
                          Jumlah
                        </th>
                        <th className="px-3 py-2 text-right font-semibold border-b border-slate-200 print:border-slate-400">
                          Harga Satuan (Rp)
                        </th>
                        <th className="px-3 py-2 text-right font-semibold border-b border-slate-200 print:border-slate-400">
                          Total (Rp)
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 print:divide-slate-300">
                      {detail.map((item, index) => (
                        <tr key={item.id || index}>
                          <td className="px-3 py-2 border-r border-slate-200 print:border-slate-400">
                            {index + 1}
                          </td>
                          <td className="px-3 py-2 border-r border-slate-200 print:border-slate-400 font-medium text-slate-800">
                            {item.nama_obat}
                          </td>
                          <td className="px-3 py-2 border-r border-slate-200 print:border-slate-400">
                            {item.bentuk_sediaan || '-'}
                          </td>
                          <td className="px-3 py-2 text-center border-r border-slate-200 print:border-slate-400">
                            {item.jumlah_pesanan.toLocaleString('id-ID')} Box
                          </td>
                          <td className="px-3 py-2 text-right border-r border-slate-200 print:border-slate-400">
                            {(Number(item.harga_per_unit) || 0).toLocaleString('id-ID')}
                          </td>
                          <td className="px-3 py-2 text-right">
                            {(Number(item.total_harga) || 0).toLocaleString('id-ID')}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot className="bg-slate-100 print:bg-slate-200 font-semibold text-slate-800">
                      <tr>
                        <td
                          colSpan="5"
                          className="px-3 py-2 text-right border-t-2 border-slate-300 print:border-slate-400"
                        >
                          TOTAL HARGA KESELURUHAN
                        </td>
                        <td className="px-3 py-2 text-right border-t-2 border-slate-300 print:border-slate-400">
                          {totalHargaKeseluruhan.toLocaleString('id-ID')}
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
                <p className="mt-6 text-slate-700 leading-relaxed print:mt-4 print:text-xs">
                  Produk tersebut akan kami gunakan untuk keperluan distribusi ke{' '}
                  <span className="font-semibold text-slate-800">
                    {info.tujuan_distribusi || 'Fasilitas Kesehatan Terkait'}
                  </span>{' '}
                  sesuai dengan peraturan yang berlaku.
                </p>
                {info.catatan_khusus && (
                  <p className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg text-yellow-800 print:bg-transparent print:border-slate-300 print:text-slate-700 print:text-xs print:mt-2 print:p-2">
                    <span className="font-semibold">Catatan Khusus:</span> {info.catatan_khusus}
                  </p>
                )}
              </section>

              <footer className="grid grid-cols-2 gap-8 mt-16 pt-8 border-t border-slate-300 text-sm print:text-xs print:mt-10 print:pt-4 print:border-slate-400">
                <div className="text-center">
                  <p className="mb-16 print:mb-12">Hormat kami,</p>
                  <div className="h-20 print:h-16 w-40 mb-2 mx-auto flex items-center justify-center">
                    {info.tanda_tangan_apoteker ? (
                      <img
                        src={`http://localhost:5000/${info.tanda_tangan_apoteker.replace(/\\/g, '/')}`}
                        alt="Tanda Tangan Apoteker"
                        className="max-h-full max-w-full object-contain mix-blend-darken"
                        onError={(e) => {
                          e.target.style.display = 'none';
                          e.target.nextElementSibling.style.display = 'block';
                        }}
                      />
                    ) : null}
                    <span
                      className={`text-slate-400 text-xs italic border-b border-slate-400 w-full text-center ${info.tanda_tangan_apoteker ? 'hidden' : 'block'}`}
                    >
                      ( Tanda Tangan Digital )
                    </span>
                  </div>
                  <p className="font-bold underline text-slate-800 mt-2">
                    {info.nama_apoteker || '(Nama Apoteker PBF)'}
                  </p>
                  <p className="text-slate-600">Apoteker Penanggung Jawab PBF</p>
                  <p className="text-slate-600">SIPA: {info.nomor_sipa || '(Nomor SIPA)'}</p>
                </div>
                <div className="text-center print:hidden"></div>
              </footer>
            </div>
          </div>
        </main>
      </div>
      <style jsx global>{`
        @media print {
          body {
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
          .print\\:hidden {
            display: none !important;
          }
          .print\\:shadow-none {
            box-shadow: none !important;
          }
          .print\\:border-0 {
            border: 0 !important;
          }
          .print\\:p-4 {
            padding: 1rem !important;
          }
          .print\\:ml-0 {
            margin-left: 0 !important;
          }
          .print\\:pt-0 {
            padding-top: 0 !important;
          }
          .print\\:px-0 {
            padding-left: 0 !important;
            padding-right: 0 !important;
          }
          .print\\:py-0 {
            padding-top: 0 !important;
            padding-bottom: 0 !important;
          }
          .print\\:rounded-none {
            border-radius: 0 !important;
          }
          .print\\:h-12 {
            height: 3rem !important;
          }
          .print\\:text-xs {
            font-size: 0.75rem !important;
            line-height: 1rem !important;
          }
          .print\\:mb-6 {
            margin-bottom: 1.5rem !important;
          }
          .print\\:mt-10 {
            margin-top: 2.5rem !important;
          }
          .print\\:pt-4 {
            padding-top: 1rem !important;
          }
          .print\\:border-slate-400 {
            border-color: #94a3b8 !important;
          }
          .print\\:bg-slate-200 {
            background-color: #e2e8f0 !important;
          }
          .print\\:text-slate-700 {
            color: #334155 !important;
          }
          .print\\:block {
            display: block !important;
          }
        }
      `}</style>
    </div>
  );
};

export default SuratPesanan;
