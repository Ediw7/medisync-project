import React, { useState, useEffect, useMemo } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import SidebarPbf from '../../../components/SidebarPbf';
import NavbarPbf from '../../../components/NavbarPbf';
import { 
    Loader2, 
    CheckCircle2, 
    Printer, 
    AlertTriangle, 
    ArrowLeft, 
    FileText, 
    Clock,
    Truck,
    Calendar,
    Check
} from 'lucide-react';
import axios from 'axios';
import { toast } from 'react-hot-toast'; 

// === GENERATE NOMOR RESI ===
const generateProNumber = (prefix, orderId) => {
  const date = new Date();
  const year = date.getFullYear().toString().slice(-2);
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const day = date.getDate().toString().padStart(2, '0');
  const timestamp = date.getTime().toString().slice(-4);
  const paddedOrderId = String(orderId).padStart(3, '0');
  return `${prefix}-${year}${month}${day}-${paddedOrderId}-${timestamp}`;
};

// === GENERATE NOMOR SURAT JALAN (Disesuaikan untuk PBF) ===
const toRoman = (num) => {
  const map = { M:1000, CM:900, D:500, CD:400, C:100, XC:90, L:50, XL:40, X:10, IX:9, V:5, IV:4, I:1 };
  let result = '';
  for (let key in map) while (num >= map[key]) { result += key; num -= map[key]; }
  return result;
};

const generateSuratJalanNumber = (orderId) => {
  // PBF menggunakan nomor izin PBF dari local storage
  const nomorIzin = localStorage.getItem('nomorIzin'); // Pastikan ini ada di local storage PBF
  if (!nomorIzin) return 'ERROR-NO-IZIN';
  const date = new Date();
  const year = date.getFullYear().toString().slice(-2);
  const month = date.getMonth() + 1;
  const paddedOrderId = String(orderId).padStart(6, '0');
  return `SJ-PBF/${paddedOrderId}/${nomorIzin}/${toRoman(month)}/${year}`;
};

const KonfirmasiPengirimanMassalPbf = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const payload = location.state; 

  const [isCollapsed, setIsCollapsed] = useState(false);
  const [processingStatus, setProcessingStatus] = useState('idle'); 
  const [pesananDetails, setPesananDetails] = useState([]); 
  const [processedDetails, setProcessedDetails] = useState([]);
  const [errorMessage, setErrorMessage] = useState('');
  const [errorList, setErrorList] = useState([]); 
  const username = localStorage.getItem('username');

  // === GENERATE NOMOR RESI & SJ OTOMATIS PER PESANAN ===
  const enrichPesananWithTracking = (details) => {
    return details.map(item => ({
      ...item,
      nomorResi: generateProNumber('RES-PBF', item.id),
      nomorSuratJalan: generateSuratJalanNumber(item.id),
    }));
  };

  useEffect(() => {
    if (!payload || !payload.selectedIds || payload.selectedIds.length === 0) {
      toast.error('Data pengiriman tidak lengkap. Kembali ke halaman sebelumnya.');
      navigate('/pbf/pengelolaan-pesanan/pengiriman-massal');
      return;
    }

    const fetchDetails = async () => {
      setProcessingStatus('loading_details');
      try {
        const token = localStorage.getItem('token');
        if (!token) throw new Error("Otentikasi gagal. Silakan login kembali.");
        
        // --- PERBAIKAN: Panggil endpoint 'detail-pesanan-massal' (BARU) ---
        const response = await axios.post('http://localhost:5000/api/pbf/pesanan-apotek/detail-pesanan-massal', 
          { selectedIds: payload.selectedIds }, 
          { headers: { Authorization: `Bearer ${token}` } }
        );

        if (response.data.success) {
          const enriched = enrichPesananWithTracking(response.data.data);
          setPesananDetails(enriched);
          setProcessingStatus('idle'); 
        } else {
          throw new Error(response.data.message || 'Gagal mengambil detail pesanan.');
        }
      } catch (err) {
         const errorMsg = err.response?.data?.message || err.message || 'Terjadi kesalahan tidak terduga.';
         setErrorMessage(errorMsg);
         setProcessingStatus('error'); 
         toast.error(`Gagal memuat detail: ${errorMsg}`, { duration: 5000 });
         if ((err.message.includes('401') || err.message.includes('403')) && localStorage.getItem('token')) {
            navigate('/login/pbf');
         }
      }
    };
    
    fetchDetails();
    
  }, [payload, navigate]);

  const handleLogout = () => {
    localStorage.clear();
    navigate('/');
  };

  const handleProcessAndPrint = async () => {
      setProcessingStatus('submitting');
      setErrorMessage('');
      setErrorList([]);
      
      try {
        const token = localStorage.getItem('token');
        if (!token) throw new Error("Otentikasi gagal. Silakan login kembali.");
        
        // --- PERBAIKAN: Kirim payload yang sudah diperkaya ---
        const payloadWithTracking = {
          ...payload,
          // Kirim detail pesanan yang sudah diperkaya dengan No. Resi & SJ
          pesananDetails: pesananDetails.map(p => ({
            id: p.id,
            nomorResi: p.nomorResi,
            nomorSuratJalan: p.nomorSuratJalan,
            tanggalPengiriman: payload.tanggalPengiriman,
            waktuPengiriman: payload.waktuPengiriman,
            opsiPengiriman: payload.opsiPengiriman,
            catatan: payload.catatan,
            alamatTujuan: p.alamat_apotek, // Ambil alamat dari detail
          }))
        };
        
        // --- PERBAIKAN: Panggil endpoint 'proses-pengiriman-massal' ---
        const response = await axios.post('http://localhost:5000/api/pbf/pesanan-apotek/proses-pengiriman-massal', payloadWithTracking, {
          headers: { Authorization: `Bearer ${token}` }
        });

        if (response.data.data) {
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
          
          const successIds = response.data.data.map(item => item.id);
          const successfulFullDetails = pesananDetails.filter(item => 
              successIds.includes(item.id)
          );
          
          // --- PERBAIKAN: Navigasi ke halaman cetak PBF ---
          navigate('/pbf/pengelolaan-pesanan/cetak-surat-jalan-massal', { 
             state: { 
               pesananDetails: successfulFullDetails, 
               allDetails: payload 
             } 
           });
       }
      } catch (err) {
        const errorMsg = err.response?.data?.message || err.message || 'Terjadi kesalahan tidak terduga.';
        setErrorMessage(errorMsg);
        setErrorList(err.response?.data?.errors || []); 
        setProcessingStatus('error');
        toast.error(`Gagal total: ${errorMsg}`, { duration: 5000 });
 
        if ((err.message.includes('401') || err.message.includes('403')) && localStorage.getItem('token')) {
            navigate('/login/pbf');
        }
      }
  };
  
  const formatDate = (dateString) => {
    if (!dateString) return '-';
    try {
      return new Date(dateString).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric', timeZone: 'UTC' });
    } catch(e) { return '-'; }
  };
  
  return (
    <div className="flex min-h-screen bg-gradient-to-br from-slate-50 via-white to-emerald-50">
      {/* --- PERBAIKAN: SidebarPbf & NavbarPbf --- */}
      <SidebarPbf isCollapsed={isCollapsed} setIsCollapsed={setIsCollapsed} />
      <div className={`flex-1 flex flex-col transition-all duration-300 ${isCollapsed ? 'ml-16' : 'ml-64'}`}>
        <NavbarPbf onLogout={handleLogout} username={username} />
        
        <main className="flex-1 overflow-auto pt-[72px] px-12 py-8">
          <div className="max-w-7xl mx-auto">

            <div className="mb-10 relative">
              <div className="absolute -top-20 -left-20 w-72 h-72 bg-emerald-200 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob"></div>
              <div className="absolute -top-20 -right-20 w-72 h-72 bg-teal-200 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000"></div>

              {/* --- PERBAIKAN: Header Dinamis --- */}
              <div className="relative flex items-center gap-3">
                <div className={`flex items-center justify-center w-12 h-12 rounded-xl shadow-lg 
                   ${processingStatus === 'idle' || processingStatus === 'loading_details' ? 'bg-gradient-to-br from-emerald-500 to-teal-600' : 
                     processingStatus === 'success' ? 'bg-gradient-to-br from-emerald-500 to-teal-600' : 
                     'bg-red-500'}`}>
                  
                  {processingStatus === 'loading_details' && <Loader2 className="text-white animate-spin" size={24} />}
                  {processingStatus === 'idle' && <FileText className="text-white" size={24} />}
                  {processingStatus === 'success' && <CheckCircle2 className="text-white" size={24} />}
                  {processingStatus === 'partial_error' && <AlertTriangle className="text-white" size={24} />}
                  {processingStatus === 'error' && <AlertTriangle className="text-white" size={24} />}
                  {processingStatus === 'submitting' && <Loader2 className="text-white animate-spin" size={24} />}
                </div>
                <div>
                  <h1 className="text-4xl font-bold bg-gradient-to-r from-slate-900 via-emerald-900 to-teal-900 bg-clip-text text-transparent">
                    {processingStatus === 'idle' && 'Konfirmasi Pengiriman Massal'}
                    {processingStatus === 'loading_details' && 'Memuat Detail Pesanan...'}
                    {processingStatus === 'submitting' && 'Memproses Pengiriman...'}
                    {processingStatus === 'success' && 'Pengiriman Massal Berhasil'}
                    {processingStatus === 'error' && 'Gagal Memproses'}
                    {processingStatus === 'partial_error' && 'Hasil Proses Pengiriman'}
                  </h1>
                   <p className="text-slate-600 text-lg mt-1">
                    {processingStatus === 'idle' && 'Harap periksa kembali rincian pengiriman sebelum konfirmasi.'}
                    {processingStatus === 'loading_details' && `Memuat detail untuk ${payload?.selectedIds?.length || 0} pesanan...`}
                    {processingStatus === 'submitting' && 'Mencatat data ke database dan blockchain...'}
                    {processingStatus === 'success' && 'Semua pesanan terpilih telah berhasil dikirim.'}
                    {processingStatus === 'error' && 'Terjadi kesalahan saat memproses permintaan.'}
                    {processingStatus === 'partial_error' && 'Beberapa pesanan gagal diproses.'}
                   </p>
                </div>
              </div>
            </div>

            {processingStatus === 'loading_details' && (
              <div className="flex flex-col justify-center items-center h-[50vh] bg-white rounded-lg shadow-sm border border-slate-200">
                <div className="relative mb-4">
                  <Loader2 className="animate-spin h-16 w-16 text-emerald-600" />
                  <div className="absolute inset-0 h-16 w-16 rounded-full border-4 border-emerald-200 animate-ping opacity-20"></div>
                </div>
                <p className="text-slate-700 font-medium">Memuat detail pesanan...</p>
              </div>
            )}
            
             {processingStatus === 'error' && (
              <div className="bg-white p-8 rounded-2xl shadow-lg border border-red-200 text-center max-w-lg mx-auto">
                <AlertTriangle className="mx-auto h-12 w-12 text-red-500 mb-4" />
                <h2 className="text-xl font-bold text-red-800 mb-2">Gagal Memuat Detail</h2>
                <p className="text-red-600 mb-6">{errorMessage}</p>
                <button
                  onClick={() => navigate('/pbf/pengelolaan-pesanan/pengiriman-massal')}
                  className="flex items-center gap-2 px-4 py-2.5 border border-slate-300 text-slate-700 font-medium rounded-lg hover:bg-slate-100 transition mx-auto"
                >
                  <ArrowLeft size={18} />
                  Kembali
                </button>
              </div>
            )}

            {(processingStatus === 'idle' || processingStatus === 'submitting' || processingStatus === 'success' || processingStatus === 'partial_error') && (
              <div className="space-y-6">
                
                {processingStatus === 'partial_error' && (
                   <div className="p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg flex items-start gap-3 text-sm">
                     <AlertTriangle size={18} className="flex-shrink-0 mt-0.5" />
                     <div>
                       <p className="font-semibold">{errorMessage}</p>
                       {errorList && errorList.length > 0 && (
                         <ul className="list-disc list-inside mt-1">
                           {errorList.map((err, index) => <li key={index}>{err.id ? `ID ${err.id}: ${err.message}` : err}</li>)}
                         </ul>
                       )}
                     </div>
                   </div>
                )}
                
                 {processingStatus === 'success' && (
                   <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-lg flex items-start gap-3 text-sm">
                     <CheckCircle2 size={18} className="flex-shrink-0 mt-0.5" />
                     <p className="font-semibold">Semua {processedDetails.length} pesanan berhasil diproses dan dicatat ke blockchain.</p>
                   </div>
                )}

                <div className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden">
                   <div className="p-4 border-b border-slate-200 bg-slate-50">
                    <h3 className="text-base font-semibold text-slate-700">Ringkasan Jadwal Pengiriman</h3>
                  </div>
                  <div className="p-6 grid grid-cols-2 md:grid-cols-4 gap-4">
                     <InfoItem icon={Calendar} label="Tanggal Kirim" value={formatDate(payload.tanggalPengiriman)} />
                     <InfoItem icon={Clock} label="Waktu Kirim" value={payload.waktuPengiriman} />
                     <InfoItem icon={Truck} label="Opsi Kirim" value={payload.opsiPengiriman} />
                     <InfoItem icon={FileText} label="Catatan" value={payload.catatan || '-'} />
                  </div>
                </div>

                <div className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden">
                  <div className="p-4 border-b border-slate-200 bg-slate-50">
                    <h3 className="text-base font-semibold text-slate-700">Daftar Pesanan ({pesananDetails.length})</h3>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="min-w-full">
                      <thead className="bg-slate-50 border-b border-slate-200">
                        <tr>
                          {/* --- PERBAIKAN: Sesuaikan Header Tabel --- */}
                          <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Apotek & ID</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Nomor Pesanan</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Alamat</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Nomor Resi</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">No Surat Jalan</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Status</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-slate-100">
                        {pesananDetails.map(item => {
                           const processedItem = processedDetails.find(p => p.id === item.id);
                           const isSuccess = !!processedItem;
                           const isFailed = (processingStatus === 'partial_error' || processingStatus === 'error') && !isSuccess;
                           
                           let statusText = "Menunggu";
                           let statusClass = "bg-gray-100 text-gray-800 border-gray-200";

                           if (processingStatus === 'submitting') {
                             statusText = "Memproses...";
                             statusClass = "bg-blue-100 text-blue-800 border-blue-200";
                           } else if (isSuccess) {
                             statusText = "Berhasil";
                             statusClass = "bg-emerald-100 text-emerald-800 border-emerald-200";
                           } else if (isFailed) {
                             const errorMsg = errorList.find(e => e.id === item.id)?.message || "Gagal";
                             statusText = errorMsg.length > 30 ? errorMsg.substring(0, 30) + "..." : errorMsg;
                             statusClass = "bg-red-100 text-red-800 border-red-200";
                           }
                           
                           return (
                              <tr key={item.id} className={isSuccess ? "bg-emerald-50/50" : (isFailed ? "bg-red-50/50" : "hover:bg-gray-50")}>
                                {/* --- PERBAIKAN: Sesuaikan Data Tabel --- */}
                                <td className="px-4 py-4 whitespace-nowrap">
                                  <p className="font-medium text-sm text-slate-900">{item.nama_apotek}</p>
                                  <p className="text-xs text-slate-500 font-mono">#{String(item.id).padStart(6, '0')}</p>
                                </td>
                                <td className="px-4 py-4 whitespace-nowrap font-mono text-sm text-slate-600">{item.nomor_pesanan}</td>
                                <td className="px-4 py-4 text-sm text-slate-600 max-w-xs truncate">{item.alamat_apotek}</td>
                                <td className="px-4 py-4 whitespace-nowrap font-mono text-sm text-emerald-700">
                                  {processedItem?.nomorResi || item.nomorResi}
                                </td>
                                <td className="px-4 py-4 whitespace-nowrap font-mono text-sm text-emerald-700">
                                  {processedItem?.nomorSuratJalan || item.nomorSuratJalan}
                                </td>
                                <td className="px-4 py-4 whitespace-nowrap">
                                  <span className={`px-2.5 py-0.5 inline-flex text-xs leading-5 font-semibold rounded-full border ${statusClass}`} title={statusText}>
                                    {statusText}
                                  </span>
                                </td>
                              </tr>
                           );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>

                <div className="mt-6 flex flex-col sm:flex-row justify-end items-center gap-3">
                  <button 
                    onClick={() => navigate('/pbf/pengelolaan-pesanan')} // <-- PERBAIKAN: Navigasi PBF
                    className="w-full sm:w-auto py-2 px-5 bg-slate-100 text-slate-700 font-medium rounded-lg hover:bg-slate-200 transition text-sm"
                  >
                    Kembali ke Pengiriman
                  </button>
                  <button
                     onClick={handleProcessAndPrint}
                     disabled={processingStatus === 'submitting' || processingStatus === 'loading_details' || processingStatus === 'error'}
                     className="w-full sm:w-auto py-2 px-5 bg-emerald-600 text-white font-medium rounded-lg hover:bg-emerald-700 transition flex items-center justify-center gap-1.5 text-sm disabled:bg-slate-400 disabled:cursor-not-allowed"
                   >
                     {processingStatus === 'submitting' && <Loader2 size={16} className="animate-spin" />}
                     {processingStatus === 'idle' && <Check size={16} />}
                     {(processingStatus === 'success' || processingStatus === 'partial_error') && <Printer size={16} />}
                     
                     {processingStatus === 'idle' && 'Konfirmasi & Proses Pengiriman'}
                     {processingStatus === 'submitting' && 'Memproses...'}
                     {(processingStatus === 'success' || processingStatus === 'partial_error') && `Cetak Surat Jalan (${pesananDetails.length})`}
                   </button>
                </div>
              </div>
            )}
            
          </div>
        </main>
      </div>
       <style jsx>{`
        @keyframes blob {
          0%, 100% { transform: translate(0, 0) scale(1); }
          33% { transform: translate(30px, -50px) scale(1.1); }
          66% { transform: translate(-20px, 20px) scale(0.9); }
        }
        .animate-blob {
          animation: blob 7s infinite;
        }
        .animation-delay-2000 {
          animation-delay: 2s;
        }
      `}</style>
    </div>
  );
};

// --- PERBAIKAN: Komponen InfoItem ---
const InfoItem = ({ icon: Icon, label, value }) => (
  <div className="space-y-1">
    <span className="text-xs font-medium text-slate-500 flex items-center gap-1.5"><Icon size={14} /> {label}</span>
    <p className="font-semibold text-slate-700 text-sm">{value}</p>
  </div>
);

export default KonfirmasiPengirimanMassalPbf;