import React, { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import SidebarProdusen from '../../../components/SidebarProdusen';
import NavbarProdusen from '../../../components/NavbarProdusen';
import { 
    Loader2, 
    CheckCircle2, 
    Printer, 
    AlertTriangle, 
    ArrowLeft, 
    FileText, 
    Send 
} from 'lucide-react';
import axios from 'axios';
import { toast } from 'react-hot-toast'; 

const KonfirmasiPengirimanMassal = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const payload = location.state; 

  const [isCollapsed, setIsCollapsed] = useState(false);
  const [processingStatus, setProcessingStatus] = useState('loading'); 
  const [processedDetails, setProcessedDetails] = useState([]);
  const [errorMessage, setErrorMessage] = useState('');
  const [errorList, setErrorList] = useState([]); 
  const hasProcessed = useRef(false);
  const username = localStorage.getItem('username');

  useEffect(() => {
    if (!payload || !payload.selectedIds || payload.selectedIds.length === 0) {
      toast.error('Data pengiriman tidak lengkap. Kembali ke halaman sebelumnya.');
      navigate('/produsen/pengelolaan-pengiriman/pengiriman-massal');
      return;
    }

    const processRequest = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) throw new Error("Otentikasi gagal. Silakan login kembali.");
        
        const response = await axios.post('http://localhost:5000/api/produsen/pesanan-masuk/proses-pengiriman-massal', payload, {
          headers: { Authorization: `Bearer ${token}` }
        });

        if(response.data.data) {
            setProcessedDetails(response.data.data);
        }

        if (response.status === 207 || !response.data.success) {
          const errors = response.data.errors || [];
          setErrorMessage(response.data.message || 'Beberapa pesanan gagal diproses.');
          setErrorList(errors); 
          setProcessingStatus('partial_error');
          toast.warn(response.data.message || 'Beberapa pesanan gagal diproses.', { duration: 5000 });
        } else {
          setProcessingStatus('success');
          toast.success('Semua pesanan berhasil diproses dan dicatat ke blockchain.');
        }
      } catch (err) {
        const errorMsg = err.response?.data?.message || err.message || 'Terjadi kesalahan tidak terduga.';
        setErrorMessage(errorMsg);
        setErrorList(err.response?.data?.errors || []); 
        setProcessingStatus('error');
        toast.error(`Gagal total: ${errorMsg}`, { duration: 5000 });
 
        if ((err.message.includes('401') || err.message.includes('403') || err.message.includes('login')) && localStorage.getItem('token')) {
            navigate('/login/produsen');
        } else if (!localStorage.getItem('token')) {
             navigate('/login/produsen');
        }
      }
    };

    if (!hasProcessed.current) {
      hasProcessed.current = true;
      processRequest();
    }
  }, [payload, navigate]);

  const handleLogout = () => {
    localStorage.clear();
    navigate('/');
  };

  const handleCetak = () => {
      if (!processedDetails || processedDetails.length === 0) {
          toast.error("Tidak ada data pengiriman yang berhasil diproses untuk dicetak.");
          return;
      }
       navigate('/produsen/pengelolaan-pengiriman/cetak-surat-jalan-massal', { 
         state: { 
           pesananDetails: processedDetails, 
           allDetails: payload 
         } 
       })
  };
  
  return (
    <div className="flex min-h-screen bg-gradient-to-br from-slate-50 via-white to-emerald-50">
      <SidebarProdusen isCollapsed={isCollapsed} setIsCollapsed={setIsCollapsed} />
      <div className={`flex-1 flex flex-col transition-all duration-300 ${isCollapsed ? 'ml-16' : 'ml-64'}`}>
        <NavbarProdusen onLogout={handleLogout} username={username} />
        
        <main className="flex-1 overflow-auto pt-[72px] px-12 py-8">
          <div className="max-w-7xl mx-auto">

            <div className="mb-8 flex items-center gap-3">
              <div className={`flex items-center justify-center w-12 h-12 rounded-xl shadow-lg
                 ${processingStatus === 'loading' ? 'bg-blue-500' : 
                   processingStatus === 'success' ? 'bg-gradient-to-br from-emerald-500 to-teal-600' : 
                   'bg-red-500'}`}>
                {processingStatus === 'loading' && <Loader2 className="text-white animate-spin" size={24} />}
                {processingStatus === 'success' && <CheckCircle2 className="text-white" size={24} />}
                {processingStatus === 'partial_error' && <AlertTriangle className="text-white" size={24} />}
                {processingStatus === 'error' && <AlertTriangle className="text-white" size={24} />}
              </div>
              <div>
                <h1 className="text-3xl font-bold text-slate-800">
                  {processingStatus === 'loading' && 'Memproses Pengiriman Massal...'}
                  {processingStatus === 'success' && 'Pengiriman Massal Berhasil'}
                  {processingStatus === 'error' && 'Gagal Memproses'}
                  {processingStatus === 'partial_error' && 'Hasil Proses Pengiriman'}
                </h1>
                <p className="text-slate-600 text-base mt-1">
                  {processingStatus === 'loading' && 'Mencatat data ke database dan blockchain...'}
                  {processingStatus === 'success' && 'Semua pesanan terpilih telah berhasil dikirim.'}
                  {processingStatus === 'error' && 'Terjadi kesalahan saat memproses permintaan.'}
                  {processingStatus === 'partial_error' && 'Beberapa pesanan gagal diproses. Lihat detail di bawah.'}
                </p>
              </div>
            </div>

            {processingStatus === 'loading' && (
              <div className="flex flex-col justify-center items-center h-[50vh] bg-white rounded-lg shadow-sm border border-slate-200">
                <div className="relative mb-4">
                  <Loader2 className="animate-spin h-16 w-16 text-emerald-600" />
                  <div className="absolute inset-0 h-16 w-16 rounded-full border-4 border-emerald-200 animate-ping opacity-20"></div>
                </div>
                <p className="text-slate-700 font-medium">Harap tunggu...</p>
                <p className="text-sm text-slate-500 mt-1">Sistem sedang memproses {payload?.selectedIds?.length || 0} pesanan.</p>
              </div>
            )}

            {processingStatus === 'error' && (
              <div className="bg-white p-8 rounded-2xl shadow-lg border border-red-200 text-center max-w-lg mx-auto">
                <AlertTriangle className="mx-auto h-12 w-12 text-red-500 mb-4" />
                <h2 className="text-xl font-bold text-red-800 mb-2">Gagal Total</h2>
                <p className="text-red-600 mb-6">{errorMessage}</p>
                 {errorList && errorList.length > 0 && (
                    <ul className="text-left text-red-600 text-sm list-disc list-inside mb-6 bg-red-50 p-3 rounded border border-red-200">
                      {errorList.map((err, index) => <li key={index}>{err}</li>)}
                    </ul>
                  )}
                <button
                  onClick={() => navigate('/produsen/pengelolaan-pengiriman/pengiriman-massal')}
                  className="flex items-center gap-2 px-4 py-2.5 border border-slate-300 text-slate-700 font-medium rounded-lg hover:bg-slate-100 transition mx-auto"
                >
                  <ArrowLeft size={18} />
                  Kembali ke Pengiriman Massal
                </button>
              </div>
            )}

            {(processingStatus === 'success' || processingStatus === 'partial_error') && (
              <div>
                {processingStatus === 'partial_error' && (
                   <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg flex items-start gap-3 text-sm">
                     <AlertTriangle size={18} className="flex-shrink-0 mt-0.5" />
                     <div>
                       <p className="font-semibold">{errorMessage}</p>
                       {errorList && errorList.length > 0 && (
                         <ul className="list-disc list-inside mt-1">
                           {errorList.map((err, index) => <li key={index}>{err}</li>)}
                         </ul>
                       )}
                     </div>
                   </div>
                )}

                <div className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden">
                  <div className="p-4 border-b border-slate-200 bg-slate-50">
                    <h3 className="text-base font-semibold text-slate-700">Ringkasan Pengiriman yang Berhasil Diproses</h3>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="min-w-full">
                      <thead className="bg-slate-50 border-b border-slate-200">
                        <tr>
                          <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">PBF & ID</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Nomor Resi</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Nomor Surat Jalan</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Status</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Aksi</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-slate-100">
                        {processedDetails && processedDetails.length > 0 ? processedDetails.map(item => (
                          <tr key={item.id} className="hover:bg-gray-50">
                            <td className="px-4 py-4 whitespace-nowrap">
                              <p className="font-medium text-sm text-slate-900">{item.nama_pbf}</p>
                              <p className="text-xs text-slate-500 font-mono">#{String(item.id).padStart(6, '0')}</p>
                            </td>
                            <td className="px-4 py-4 whitespace-nowrap font-mono text-sm text-slate-600">{item.nomorResi}</td>
                            <td className="px-4 py-4 whitespace-nowrap font-mono text-sm text-slate-600">{item.nomorSuratJalan}</td>
                            <td className="px-4 py-4 whitespace-nowrap">
                              <span className="px-2.5 py-0.5 inline-flex text-xs leading-5 font-semibold rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
                                Berhasil Diproses
                              </span>
                            </td>
                            <td className="px-4 py-4 whitespace-nowrap text-sm font-medium">
                              <Link 
                                to={`/produsen/pengelolaan-pengiriman/detail/${item.id}/surat`} 
                               
                                className="text-emerald-600 hover:text-emerald-800 hover:underline"
                              >
                                Lihat Surat
                              </Link>
                            </td>
                          </tr>
                        )) : (
                          <tr>
                             <td colSpan="5" className="text-center py-10 text-slate-500">
                                {processingStatus === 'error' || processingStatus === 'partial_error' ? 'Tidak ada pesanan yang berhasil diproses.' : 'Memuat hasil...'}
                             </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>

                <div className="mt-6 flex flex-col sm:flex-row justify-end items-center gap-3">
                  <button 
                    onClick={() => navigate('/produsen/pengelolaan-pengiriman')} 
                    className="w-full sm:w-auto py-2 px-5 bg-slate-100 text-slate-700 font-medium rounded-lg hover:bg-slate-200 transition text-sm"
                  >
                    Kembali ke Pengiriman
                  </button>
                  {processedDetails && processedDetails.length > 0 && ( 
                     <button
                       onClick={handleCetak}
                       className="w-full sm:w-auto py-2 px-5 bg-emerald-600 text-white font-medium rounded-lg hover:bg-emerald-700 transition flex items-center justify-center gap-1.5 text-sm"
                     >
                       <Printer size={16} />
                       Cetak Semua Surat Jalan ({processedDetails.length})
                     </button>
                  )}
                </div>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
};

export default KonfirmasiPengirimanMassal;