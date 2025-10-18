import React, { useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Printer, Download } from 'lucide-react';
import html2pdf from 'html2pdf.js';

const CetakSuratJalanMassalPbf = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const contentRef = useRef(null);
  const { processedDetails, allDetails } = location.state || {};
  const [pbfProfile, setPbfProfile] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  if (!processedDetails || processedDetails.length === 0) {
    return (
      <div className="flex flex-col justify-center items-center h-screen">
        <p>Tidak ada data untuk dicetak.</p>
        <button onClick={() => navigate(-2)} className="mt-4 py-2 px-4 bg-gray-200 rounded-lg">Kembali</button>
      </div>
    );
  }

  const handlePrint = () => window.print();
  
  const handleDownloadPDF = () => {
    const element = contentRef.current;
    const opt = {
      margin: [10, 10, 10, 10],
      filename: `surat_jalan_massal_${Date.now()}.pdf`,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2 },
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
    };
    html2pdf().from(element).set(opt).save();
  };

  return (
    <div className="bg-gray-100">
        <div className="max-w-4xl mx-auto p-6">
            <div className="print:hidden flex justify-between items-center mb-6 sticky top-0 bg-gray-100 py-4 z-10">
                <h1 className="text-2xl font-bold">Cetak Surat Jalan Massal ({processedDetails.length} Lembar)</h1>
                <div className="flex space-x-3">
                    <button onClick={handlePrint} className="flex items-center px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700">
                        <Printer className="w-4 h-4 mr-2" /> Cetak
                    </button>
                    <button onClick={handleDownloadPDF} className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                        <Download className="w-4 h-4 mr-2" /> Unduh PDF
                    </button>
                    <button onClick={() => navigate('/pbf/tracking-pengiriman')} className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg">
                        Selesai
                    </button>
                </div>
            </div>

            <div ref={contentRef}>
                {processedDetails.map((data, index) => {
                  const totalHargaPesanan = data.detail_pesanan?.reduce((sum, item) => sum + (item.jumlah * item.harga_satuan), 0) || 0;

                  return (
                    <div key={data.id} className="bg-white p-8 border border-gray-300 shadow-md print:shadow-none print:border-0 print:break-after-page mb-8">
                      {/* --- KONTEN DISAMAKAN DENGAN SuratJalanPbf.jsx --- */}
                      <header className="flex justify-between items-start mb-8 pb-4 border-b-2 border-black">
                          <div className="flex flex-col">
                             <h1 className="text-2xl font-bold text-gray-800">{pbfProfile?.nama_resmi || 'Nama PBF Anda'}</h1>
                              <p className="text-xs text-gray-600">{pbfProfile?.alamat || 'Alamat PBF Anda'}</p>
                          </div>
                          <div className="flex flex-col text-right">
                              <h2 className="text-3xl font-bold text-gray-900">SURAT JALAN</h2>
                              <p className="text-lg font-semibold text-gray-700">No. {data.nomorSuratJalan}</p>
                              <p className="text-sm text-gray-500">
                                Tanggal: {new Date(allDetails.tanggalPengiriman).toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' })}
                              </p>
                          </div>
                      </header>

                      <section className="grid grid-cols-2 gap-8 mb-8 text-sm">
                          <div>
                              <h3 className="font-bold text-gray-800 mb-2">PENGIRIM</h3>
                              <p>{pbfProfile?.nama_resmi || 'Nama PBF Anda'}</p>
                              <p>{pbfProfile?.alamat || 'Alamat PBF Anda'}</p>
                          </div>
                          <div>
                              <h3 className="font-bold text-gray-800 mb-2">PENERIMA</h3>
                              <p className="font-semibold">{data.nama_apotek}</p>
                              <p>{data.alamat_apotek || 'Alamat tidak tersedia'}</p>
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
                              <th className="p-2 text-right font-bold border">Subtotal</th>
                            </tr>
                          </thead>
                          <tbody>
                            {data.detail_pesanan?.map((item, idx) => (
                              <tr key={item.detail_pesanan_id || idx} className="border-b">
                                <td className="p-2 border">{idx + 1}</td>
                                <td className="p-2 border">{item.nama_obat}</td>
                                <td className="p-2 border font-mono text-xs">{item.id_aset_blockchain}</td>
                                <td className="p-2 border">{item.jumlah} Box</td>
                                <td className="p-2 text-right border">Rp {(item.jumlah * item.harga_satuan).toLocaleString('id-ID')}</td>
                              </tr>
                            ))}
                          </tbody>
                          <tfoot>
                            <tr className="font-bold bg-gray-50">
                                <td colSpan="4" className="p-2 text-right border">TOTAL HARGA</td>
                                <td className="p-2 text-right border">Rp {totalHargaPesanan.toLocaleString('id-ID')}</td>
                            </tr>
                          </tfoot>
                        </table>
                      </section>

                      <footer className="flex justify-between items-end mt-12 pt-8 border-t">
                        <p className="text-xs text-gray-600">No. Resi: <span className="font-bold text-gray-900">{data.nomorResi}</span></p>
                        {/* Area Tanda Tangan */}
                        <div className="grid grid-cols-2 gap-8 text-center text-sm w-1/2">
                            <div>
                                <p>Penerima,</p>
                                <div className="h-20"></div>
                                <p>(.....................)</p>
                            </div>
                            <div>
                                <p>Hormat Kami,</p>
                                <div className="h-20"></div>
                                <p>( {pbfProfile?.nama_resmi || 'Nama PBF Anda'} )</p>
                            </div>
                        </div>
                      </footer>
                    </div>
                  )
                })}
            </div>
        </div>
    </div>
  );
};

export default CetakSuratJalanMassalPbf;