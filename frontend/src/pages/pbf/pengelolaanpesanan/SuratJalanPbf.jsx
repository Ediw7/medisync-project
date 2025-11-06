import React, { useState, useEffect, useRef } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import SidebarPbf from '../../../components/SidebarPbf';
import NavbarPbf from '../../../components/NavbarPbf';
import { Loader2, Printer, Download, ArrowLeft, Send, CheckCircle, AlertCircle, FileText } from 'lucide-react';
import axios from 'axios';
import html2pdf from 'html2pdf.js';
import logo from '../../../assets/logo.png'; // Pastikan logo ada
import { toast } from 'react-hot-toast';

const SuratJalanPbf = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [data, setData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isSending, setIsSending] = useState(false);

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

        const response = await axios.get(`http://localhost:5000/api/pbf/pesanan-apotek/${id}/surat-jalan`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (!response.data.success) throw new Error(response.data.message || 'Gagal mengambil data surat jalan');
        setData(response.data.data);

      } catch (err) {
        setError(err.message);
        toast.error(err.message || 'Gagal memuat data.');
        if ((err.message.includes('401') || err.message.includes('403') || err.message.includes('login')) && token) {
            navigate('/login/pbf');
        } else if (!token) {
             navigate('/login/pbf');
        }
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, [id, navigate]);

  const handleKirimKeBlockchain = async () => {
    setIsSending(true);
    setError(null);
    toast.dismiss();
    try {
      const token = localStorage.getItem('token');
      if (!token) throw new Error('Sesi tidak valid, silakan login ulang.');

      const response = await fetch(`http://localhost:5000/api/pbf/pesanan-apotek/${id}/record-to-blockchain`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      const result = await response.json();
      if (!response.ok) throw new Error(result.message || 'Gagal mencatat ke blockchain');

      toast.success(result.message || 'Data berhasil dicatat ke blockchain.');
      setData(prevData => ({
          ...prevData,
          pesanan: { ...prevData.pesanan, status_blockchain: 'Tercatat' }
      }));
    } catch (err) {
      setError(err.message);
      toast.error(err.message || 'Gagal mencatat ke blockchain.');
    } finally {
      setIsSending(false);
    }
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
          <title>Surat Jalan PBF ${data?.pesanan?.nomor_surat_jalan || id}</title>
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
        margin:       [10, 5, 10, 5],
        filename:     `surat_jalan_pbf_${data?.pesanan?.nomor_surat_jalan || id}.pdf`,
        image:        { type: 'jpeg', quality: 0.98 },
        html2canvas:  { scale: 2, useCORS: true, logging: true, dpi: 192, letterRendering: true },
        jsPDF:        { unit: 'mm', format: 'a4', orientation: 'portrait' }
    };

    html2pdf().from(element).set(opt).save();
  };

  // --- LOADING STATE ---
  if (isLoading) {
     return (
       <div className="flex flex-col justify-center items-center h-screen bg-gradient-to-br from-slate-50 via-white to-emerald-50">
          <div className="relative">
            <Loader2 className="animate-spin h-12 w-12 text-emerald-600" />
            <div className="absolute inset-0 h-12 w-12 rounded-full border-4 border-emerald-200 animate-ping opacity-20"></div>
          </div>
          <p className="mt-4 text-slate-700 font-medium">Memuat Surat Jalan...</p>
      </div>
    );
  }

  // --- ERROR STATE ---
  if (error) {
     return (
       <div className="flex flex-col justify-center items-center h-screen bg-gradient-to-br from-slate-50 via-white to-red-50 p-6">
          <div className="bg-white p-8 rounded-xl shadow-lg border border-red-200 text-center">
            <AlertCircle className="mx-auto h-12 w-12 text-red-500 mb-4" />
            <h2 className="text-xl font-bold text-red-800 mb-2">Gagal Memuat Data</h2>
            <p className="text-red-600 mb-6">{error}</p>
            <button
               onClick={() => navigate('/pbf/pengelolaan-pesanan')}
               className="flex items-center gap-2 px-4 py-2.5 border border-slate-300 text-slate-700 font-medium rounded-lg hover:bg-slate-100 transition mx-auto"
             >
               <ArrowLeft size={18} />
               Kembali
             </button>
          </div>
       </div>
    );
  }

  // --- DATA KOSONG ---
  if (!data || !data.pesanan) {
    return (
       <div className="flex flex-col justify-center items-center h-screen bg-slate-50 p-6">
        <div className="bg-white p-8 rounded-xl shadow-lg border border-slate-200 text-center">
          <FileText className="mx-auto h-12 w-12 text-yellow-500 mb-4" />
          <h2 className="text-xl font-bold text-slate-800 mb-2">Data Surat Jalan Tidak Ditemukan</h2>
          <p className="text-slate-600 mb-6">Tidak dapat menemukan detail untuk pesanan ini.</p>
           <button
             onClick={() => navigate('/pbf/pengelolaan-pesanan')}
             className="flex items-center gap-2 px-4 py-2.5 border border-slate-300 text-slate-700 font-medium rounded-lg hover:bg-slate-100 transition mx-auto"
           >
             <ArrowLeft size={18} />
             Kembali
           </button>
        </div>
      </div>
    );
  }

  const { pesanan: info, detail_pesanan: detail } = data;
  const isBlockchainSent = info.status_blockchain === 'Tercatat';

  return (
    <div className="flex min-h-screen bg-slate-50">
      <SidebarPbf isCollapsed={isCollapsed} setIsCollapsed={setIsCollapsed} />
      <div className={`flex-1 flex flex-col transition-all duration-300 ${isCollapsed ? 'ml-16' : 'ml-64'}`}>
        <NavbarPbf onLogout={() => { localStorage.clear(); navigate('/'); }} username={username} />

        <main className="flex-1 overflow-auto pt-[72px]">
          <div className="max-w-4xl mx-auto px-6 py-8">
            {/* HEADER & TOMBOL AKSI */}
            <div className="print:hidden flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
              <div>
                <h1 className="text-3xl font-bold text-slate-900">Surat Jalan PBF</h1>
                <p className="text-slate-600 mt-1">No: {info.nomor_surat_jalan}</p>
              </div>
              <div className="flex flex-wrap items-center gap-3">
                 {!isBlockchainSent && (
                  <button
                    onClick={handleKirimKeBlockchain}
                    disabled={isSending}
                    className="inline-flex items-center px-4 py-2.5 bg-green-600 text-white font-medium rounded-lg hover:bg-green-700 transition disabled:bg-slate-400"
                  >
                    {isSending ? (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <Send className="w-4 h-4 mr-2" />
                    )}
                    {isSending ? 'Mengirim...' : 'Kirim ke Blockchain'}
                  </button>
                )}
                <button onClick={handlePrint} className="inline-flex items-center px-4 py-2.5 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition">
                  <Printer className="w-4 h-4 mr-2" /> Cetak
                </button>
                <button onClick={handleDownloadPDF} className="inline-flex items-center px-4 py-2.5 bg-slate-700 text-white font-medium rounded-lg hover:bg-slate-800 transition">
                  <Download className="w-4 h-4 mr-2" /> Unduh PDF
                </button>
                <button
                  onClick={() => navigate('/pbf/pengelolaan-pesanan')}
                  className="inline-flex items-center px-4 py-2.5 border border-slate-300 text-slate-700 font-medium rounded-lg hover:bg-slate-100 transition"
                >
                  <ArrowLeft size={16} className="mr-1.5" /> Kembali
                </button>
              </div>
            </div>

            {/* ERROR INLINE */}
            {error && !isLoading && (
              <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 rounded-xl flex items-center gap-3">
                <AlertCircle size={20} />
                <span>{error}</span>
              </div>
            )}

            {/* KONTEN SURAT JALAN */}
            <div ref={contentRef} className="bg-white rounded-xl shadow-lg border border-slate-200 p-10 print:shadow-none print:border-0 print:p-4">
              <header className="flex justify-between items-start mb-10 pb-6 border-b-2 border-slate-800">
                  <div className="flex items-center gap-4">
                      <img src={logo} alt="Logo PBF" className="h-16 w-auto print:h-12" />
                      <div>
                          <h1 className="text-2xl font-bold text-slate-800">{info.nama_pbf || 'Nama PBF'}</h1>
                          <p className="text-xs text-slate-600 max-w-xs">{info.alamat_pbf || 'Alamat PBF'}</p>
                      </div>
                  </div>
                  <div className="text-right">
                      <h2 className="text-3xl font-bold text-slate-900 uppercase tracking-tight">Surat Jalan</h2>
                      <p className="text-lg font-semibold text-slate-700 mt-1">No. {info.nomor_surat_jalan}</p>
                      <p className="text-sm text-slate-500 mt-1">
                          Tanggal: {new Date(info.tanggal_pengiriman).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
                      </p>
                  </div>
              </header>

              <section className="grid grid-cols-1 sm:grid-cols-2 gap-8 mb-10 text-sm">
                  <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
                      <h3 className="font-bold text-slate-800 mb-2 uppercase text-xs tracking-wider">Pengirim (PBF)</h3>
                      <p className="font-semibold text-slate-700">{info.nama_pbf || 'Nama PBF'}</p>
                      <p className="text-slate-600">{info.alamat_pbf || 'Alamat PBF'}</p>
                  </div>
                  <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
                      <h3 className="font-bold text-slate-800 mb-2 uppercase text-xs tracking-wider">Penerima (Apotek)</h3>
                      <p className="font-semibold text-slate-700">{info.nama_apotek || 'Nama Apotek'}</p>
                      <p className="text-slate-600">{info.alamat_apotek || 'Alamat Apotek'}</p>
                      <p className="text-slate-600">Kontak: {info.kontak_telepon || '-'}</p>
                  </div>
              </section>

              <section className="mb-10">
                <h3 className="font-bold text-slate-800 mb-4 uppercase text-sm tracking-wider">Detail Barang</h3>
                <div className="overflow-x-auto border border-slate-200 rounded-lg">
                  <table className="w-full text-sm">
                    <thead className="bg-slate-100 text-slate-700">
                      <tr>
                        <th className="px-4 py-3 text-left font-semibold border-b border-slate-200">No.</th>
                        <th className="px-4 py-3 text-left font-semibold border-b border-slate-200">Nama Obat</th>
                        <th className="px-4 py-3 text-left font-semibold border-b border-slate-200">Asset ID</th>
                        <th className="px-4 py-3 text-center font-semibold border-b border-slate-200">Jumlah</th>
                        <th className="px-4 py-3 text-right font-semibold border-b border-slate-200">Total Harga</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {detail && detail.length > 0 ? (
                         detail.map((item, index) => (
                          <tr key={index} className="hover:bg-slate-50">
                            <td className="px-4 py-3 border-r border-slate-200">{index + 1}</td>
                            <td className="px-4 py-3 border-r border-slate-200 font-medium text-slate-800">{item.nama_obat}</td>
                            <td className="px-4 py-3 border-r border-slate-200 font-mono text-slate-600">{item.id_aset_blockchain}</td>
                            <td className="px-4 py-3 text-center border-r border-slate-200">{item.jumlah} {item.satuan}</td>
                            <td className="px-4 py-3 text-right">
                              Rp {Number(item.jumlah * item.harga_satuan || 0).toLocaleString('id-ID', { minimumFractionDigits: 2 })}
                            </td>
                          </tr>
                         ))
                       ) : (
                         <tr>
                           <td colSpan="5" className="text-center py-6 text-slate-500">Tidak ada detail barang.</td>
                         </tr>
                       )}
                    </tbody>
                    {detail && detail.length > 0 && (
                      <tfoot className="bg-slate-100 font-semibold text-slate-800">
                        <tr>
                            <td colSpan="4" className="px-4 py-3 text-right border-t-2 border-slate-300">TOTAL KESELURUHAN</td>
<td className="px-4 py-3 text-right border-t-2 border-slate-300">
                              Rp {Number(info.total_harga || 0).toLocaleString('id-ID', { minimumFractionDigits: 2 })}
                            </td>
                        </tr>
                      </tfoot>
                    )}
                  </table>
                </div>
              </section>

              <footer className="flex flex-col sm:flex-row justify-between items-start sm:items-end mt-16 pt-8 border-t border-slate-300 text-xs text-slate-600 gap-4">
                  <div>
                    <p>No. Resi Pengiriman: <span className="font-semibold text-slate-900">{info.nomor_resi || '-'}</span></p>
                    
                    {/* --- PERBAIKAN DI SINI --- */}
                    {/* Tampilkan catatan_kurir, BUKAN catatan (yang lama) */}
                    {info.catatan_kurir && (
                      <p className="mt-1">
                        <span className="font-semibold">Catatan Kurir:</span> {info.catatan_kurir}
                      </p>
                    )}
                    {/* --- AKHIR PERBAIKAN --- */}

                    <p className="mt-4 print:block hidden">Dokumen ini dicetak pada: {new Date().toLocaleString('id-ID')}</p>
                  </div>
                  <div className="text-center sm:text-right mt-8 sm:mt-0 print:block">
                     <p className="mb-16">Hormat Kami,</p>
                     <p className="font-semibold border-t border-slate-400 pt-2">{info.nama_pbf || 'PBF'}</p>
                     <p>(Pengirim)</p>
                  </div>
              </footer>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default SuratJalanPbf;