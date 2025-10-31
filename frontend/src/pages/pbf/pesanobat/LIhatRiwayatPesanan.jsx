import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import SidebarPbf from '../../../components/SidebarPbf';
import NavbarPbf from '../../../components/NavbarPbf';
import {
  Loader2,
  ArrowLeft,
  ClipboardCopy,
  Package,
  Truck,
  CheckCircle2,
  AlertTriangle,
  FileText, 
  Info,
  Archive, // Mengganti Package
  Home,
  CheckCircle,
  XCircle,
  HelpCircle,
  ImageIcon, // Untuk modal
  X // Untuk modal
} from 'lucide-react';
import axios from 'axios';
import { toast } from 'react-hot-toast';

// --- Komponen Modal (Diperbarui) ---
const BuktiPenerimaanModal = ({ isOpen, onClose, imageUrl }) => {
  if (!isOpen) return null;
  // Pastikan URL benar, tambahkan http://localhost:5000 jika perlu
  const fullImageUrl = imageUrl ? (imageUrl.startsWith('http') ? imageUrl : `http://localhost:5000/${imageUrl.replace(/\\/g, '/')}`) : null;
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-white p-4 rounded-lg shadow-2xl relative w-full max-w-lg overflow-hidden" onClick={(e) => e.stopPropagation()}>
        <div className="flex justify-between items-center pb-3 mb-4 border-b border-slate-200">
          <h3 className="text-lg font-semibold text-slate-800">Bukti Penerimaan PBF</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-colors p-1 rounded-full"><X size={20} /></button>
        </div>
        {fullImageUrl ? (
          <div className="bg-slate-100 p-2 rounded"><img src={fullImageUrl} alt="Bukti Penerimaan Barang" className="w-full h-auto max-h-[70vh] object-contain rounded"/></div>
        ) : (
           <div className="text-center py-10 text-slate-500">
               <ImageIcon size={48} className="mx-auto mb-2 opacity-50"/>
               Gambar tidak tersedia.
           </div>
        )}
      </div>
    </div>
  );
};


// --- Komponen Step Timeline BARU ---
const StatusStep = ({ icon: Icon, label, timestamp, isCompleted, isCurrent, children }) => (
    <div className="relative flex flex-col items-center justify-start text-center w-40">
      <div className={`w-14 h-14 rounded-full flex items-center justify-center border-2 ${
         isCurrent ? 'bg-emerald-100 border-emerald-500 animate-pulse' :
         isCompleted ? 'bg-emerald-500 border-emerald-600 text-white' :
         'bg-slate-100 border-slate-300 text-slate-400'
      } transition-colors duration-300 z-10`}>
        <Icon size={26} />
      </div>
      <div className="mt-3">
        <p className={`font-semibold text-sm ${
          isCurrent ? 'text-emerald-700' :
          isCompleted ? 'text-slate-800' :
          'text-slate-500'
        }`}>{label}</p>
        {timestamp && <p className="text-xs text-slate-500 mt-1">{timestamp}</p>}
        {children && <div className="mt-1">{children}</div>} 
      </div>
    </div>
  );

// Komponen Timeline BARU untuk alur Produsen -> PBF
const ProdusenToPbfTimeline = ({ onChain, offChain, onShowBukti }) => {
    
    const dataDipesan = onChain.riwayat.find(item => item.status === 'DIPRODUKSI');
    const dataDikirim = onChain.riwayat.find(item => item.status === 'DIKIRIM_KE_PBF');
    const dataDiterima = onChain.riwayat.find(item => item.status === 'DITERIMA_PBF');
    
    // Status untuk Pengembalian dari data offChain
    const isPengembalian = [
        'Pengembalian Diajukan', 
        'Pengembalian Ditolak', 
        'Pengembalian Selesai',
        'Dikembalikan'
    ].includes(offChain.status);

    const isDipesan = true; // Selalu true jika ada
    const isDikirim = !!dataDikirim;
    const isDiterima = !!dataDiterima;

    const currentStatus = isDiterima ? 'Diterima' : (isDikirim ? 'Dikirim' : 'Dipesan');

    const formatTimestamp = (isoString) => {
       if (!isoString) return '-';
       try {
            const date = new Date(isoString);
             if (isNaN(date.getTime())) return '-';
            return date.toLocaleString('id-ID', { 
                 day:'numeric', month:'short', year: 'numeric',
                 hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Jakarta'
             });
       } catch(e) {
           return '-';
       }
    };
    
    const getTimestamp = (status) => {
        if (status === 'Dipesan' && dataDipesan) return formatTimestamp(dataDipesan.timestamp);
        if (status === 'Dikirim' && dataDikirim) return formatTimestamp(dataDikirim.timestamp);
        if (status === 'Diterima' && dataDiterima) return formatTimestamp(dataDiterima.timestamp);
        return null;
    };

    const formatDate = (dateString, includeTime = false) => {
      if (!dateString) return '-';
      try {
          const date = new Date(dateString);
          if (isNaN(date.getTime())) return '-';
          const options = { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' }; 
          if (includeTime) {
              options.hour = '2-digit';
              options.minute = '2-digit';
              options.timeZone = 'Asia/Jakarta'; 
          }
          return date.toLocaleDateString('id-ID', options);
      } catch(e) {
          return '-';
      }
    };
    
    // Render timeline standar
    if (!isPengembalian) {
      return (
        <div className="flex items-start justify-center gap-0">
          <StatusStep
            icon={Archive}
            label="Dipesan"
            timestamp={getTimestamp('Dipesan')}
            isCompleted={isDipesan}
            isCurrent={currentStatus === 'Dipesan'}
          />
          <div className="relative flex items-center h-14 w-24">
              <div className={`w-full h-1.5 rounded-full ${isDikirim ? 'bg-emerald-500' : 'bg-slate-300'}`} />
          </div>
          <StatusStep
            icon={Truck}
            label="Dikirim Produsen"
            timestamp={getTimestamp('Dikirim')}
            isCompleted={isDikirim}
            isCurrent={currentStatus === 'Dikirim'}
          />
          <div className="relative flex items-center h-14 w-24">
              <div className={`w-full h-1.5 rounded-full ${isDiterima ? 'bg-emerald-500' : 'bg-slate-300'}`} />
          </div>
          <StatusStep
            icon={Home}
            label="Diterima PBF"
            timestamp={getTimestamp('Diterima')}
            isCompleted={isDiterima}
            isCurrent={currentStatus === 'Diterima'}
          >
            {/* Tampilkan tombol lihat bukti PBF */}
            {isDiterima && offChain.buktiPenerimaUrl && (
                <button onClick={onShowBukti} className="text-xs text-emerald-600 hover:underline mt-1 font-semibold block w-full text-center">
                  Lihat Bukti
                </button>
            )}
          </StatusStep>
        </div>
      );
    }
    
    // Render timeline jika ada pengembalian
    return (
        <div className="flex items-start justify-center gap-0">
          <StatusStep
            icon={CheckCircle}
            label="Pesanan Selesai"
            timestamp={getTimestamp('Diterima')}
            isCompleted={true}
          />
          <div className="relative flex items-center h-14 w-24">
              <div className="w-full h-1.5 rounded-full bg-red-500" />
          </div>
          <StatusStep
            icon={XCircle} // Icon untuk status pengembalian
            label={offChain.status} // Tampilkan status (misal: "Pengembalian Selesai")
            isCompleted={true}
            isCurrent={true}
          >
            <p className="text-xs text-slate-500 mt-1">{formatDate(offChain.updated_at, true)}</p>
          </StatusStep>
        </div>
    );
};


// --- Komponen Halaman Utama (Diperbarui) ---
const LihatRiwayatPesanan = () => {
  const navigate = useNavigate();
  const { assetId } = useParams();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [riwayatData, setRiwayatData] = useState(null);
  const [copiedResi, setCopiedResi] = useState(false); // State baru
  const username = localStorage.getItem('username'); // State baru

  useEffect(() => {
    const fetchData = async () => {
      if (!assetId) {
        setError("ID Aset tidak ditemukan di URL.");
        setIsLoading(false);
        return;
      }
      setIsLoading(true);
      setError(null);
      try {
        const token = localStorage.getItem('token');
        if (!token) throw new Error('Silakan login terlebih dahulu');
        
        // Menggunakan axios dan toast
        const response = await axios.get(`http://localhost:5000/api/pbf/pesanan/riwayat/${assetId}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });

        if (!response.data.success || !response.data.data) {
          throw new Error(response.data.message || 'Gagal mengambil data riwayat');
        }
        setRiwayatData(response.data.data);
      } catch (err) {
        const errorMsg = err.response?.data?.message || err.message || 'Terjadi kesalahan';
        setError(errorMsg);
        toast.error(errorMsg);
        if ((err.message.includes('401') || err.message.includes('403') || err.message.includes('login'))) {
            navigate('/login/pbf');
        }
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, [assetId, navigate]);

  const handleLogout = () => { localStorage.clear(); navigate('/'); };
  
  const copyToClipboard = async (text, type) => {
    try {
        await navigator.clipboard.writeText(text);
        if (type === 'resi') {
            setCopiedResi(true);
            toast.success('Nomor Resi disalin!');
            setTimeout(() => setCopiedResi(false), 2000);
        } else {
            toast.success('Teks disalin!');
        }
    } catch (err) {
        toast.error('Gagal menyalin teks.');
    }
  };

  const formatDate = (dateString, includeTime = false) => {
      if (!dateString) return '-';
      try {
          const date = new Date(dateString);
          if (isNaN(date.getTime())) return '-';

          const options = { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' }; 
          if (includeTime) {
              options.hour = '2-digit';
              options.minute = '2-digit';
              options.timeZone = 'Asia/Jakarta'; 
          }
          return date.toLocaleDateString('id-ID', options);
      } catch(e) {
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
          <p className="mt-4 text-slate-700 font-medium">Memuat Riwayat Pesanan...</p>
      </div>
    );
  }

  if (error || !riwayatData || !riwayatData.onChain || !riwayatData.offChain) {
     return (
       <div className="flex min-h-screen bg-gradient-to-br from-slate-50 via-white to-emerald-50">
        <SidebarPbf isCollapsed={isCollapsed} setIsCollapsed={setIsCollapsed} />
        <div className={`flex-1 flex flex-col transition-all duration-300 ${isCollapsed ? 'ml-16' : 'ml-64'}`}>
          <NavbarPbf onLogout={handleLogout} username={username} />
          <main className="flex-1 flex items-center justify-center p-6 pt-[72px]">
            <div className="bg-white p-8 rounded-2xl shadow-lg border border-red-200 text-center max-w-md">
              <AlertTriangle className="mx-auto h-12 w-12 text-red-500 mb-4" />
              <h2 className="text-xl font-bold text-red-800 mb-2">Gagal Memuat Data</h2>
              <p className="text-red-600 mb-6">{error || 'Data riwayat tidak ditemukan.'}</p>
              <button
                 onClick={() => navigate('/pbf/pesan-obat')}
                 className="flex items-center gap-2 px-4 py-2.5 border border-slate-300 text-slate-700 font-medium rounded-lg hover:bg-slate-100 transition mx-auto"
               >
                 <ArrowLeft size={18} />
                 Kembali ke Daftar Pesanan
               </button>
            </div>
          </main>
        </div>
      </div>
    );
  }

  const { onChain, offChain, detail_pesanan } = riwayatData; // Ambil detail_pesanan
  const currentStatus = offChain.status; 

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-slate-50 via-white to-emerald-50">
      <SidebarPbf isCollapsed={isCollapsed} setIsCollapsed={setIsCollapsed} />
      <div className={`flex-1 flex flex-col transition-all duration-300 ${isCollapsed ? 'ml-16' : 'ml-64'}`}>
        <NavbarPbf onLogout={handleLogout} username={username} />

        <main className="flex-1 overflow-auto pt-[72px] px-12 py-8">
          <div className="max-w-5xl mx-auto">
            <button
              onClick={() => navigate('/pbf/pesan-obat')}
              className="mb-6 inline-flex items-center text-emerald-600 hover:text-emerald-700 transition-colors text-sm font-medium"
            >
              <ArrowLeft size={16} className="mr-1" /> Kembali ke Daftar Pesanan
            </button>

            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
   
              <div className="bg-gradient-to-r from-emerald-500 to-teal-600 px-6 py-5 border-b border-slate-200 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                 <div>
                    <h1 className="text-2xl font-bold text-white">Riwayat Pesanan</h1>
                    <p className="text-sm text-emerald-50 mt-1">Status pengiriman untuk Aset ID: <span className="font-mono">{assetId}</span></p>
                 </div>
                  <div className={`px-4 py-2 rounded-full border-2 text-sm font-semibold flex items-center gap-2 bg-white ${
                     currentStatus === 'Selesai' ? 'text-emerald-700 border-emerald-200' :
                     currentStatus === 'Pengembalian Selesai' ? 'text-purple-700 border-purple-200' :
                     currentStatus === 'Dikirim' ? 'text-blue-700 border-blue-200' :
                     'text-amber-700 border-amber-200'
                 }`}>
                     {currentStatus === 'Selesai' || currentStatus === 'Pengembalian Selesai' ? <CheckCircle2 size={16} /> :
                      currentStatus === 'Dikirim' ? <Truck size={16} /> :
                      <Package size={16} />}
                     Status: {currentStatus}
                 </div>
              </div>

              <div className="p-8 border-b border-slate-200">
                  <h3 className="text-lg font-bold text-slate-900 mb-6 flex items-center gap-2">
                    <Package size={20} className="text-emerald-600" />
                    Detail Pengiriman
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-1">
                          <span className="text-sm font-medium text-slate-500">Nomor Resi</span>
                          <div className="flex items-center gap-2 bg-slate-50 p-3 rounded-lg border border-slate-200">
                              <span className="font-bold text-slate-900 font-mono text-base flex-1">{offChain.nomor_resi || '-'}</span>
                              {offChain.nomor_resi && <button onClick={() => copyToClipboard(offChain.nomor_resi, 'resi')} className="text-slate-400 hover:text-emerald-600 transition-colors p-1" title="Salin No Resi">
                                  <ClipboardCopy size={18} />
                              </button>}
                               {copiedResi && <CheckCircle2 size={18} className="text-emerald-500" />}
                          </div>
                      </div>
                      <div className="space-y-1">
                           <span className="text-sm font-medium text-slate-500">No Surat Jalan</span>
                           <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
                             <span className="font-bold text-slate-900 font-mono text-base">{offChain.nomor_surat_jalan || '-'}</span>
                           </div>
                       </div>
                       <div className="space-y-1">
                           <span className="text-sm font-medium text-slate-500">Nomor PO Terkait</span>
                           <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
                             <span className="font-bold text-slate-900 text-base">{offChain.nomor_po || '-'}</span>
                           </div>
                       </div>
                       <div className="space-y-1">
                           <span className="text-sm font-medium text-slate-500">Opsi Pengiriman</span>
                           <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
                             <span className="font-bold text-slate-900 capitalize text-base">{offChain.opsi_pengiriman || 'standar'}</span>
                           </div>
                       </div>
                       <div className="space-y-1">
                           <span className="text-sm font-medium text-slate-500">Pengirim (Produsen)</span>
                           <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
                             <span className="font-semibold text-slate-900 text-base">{offChain.nama_produsen}</span>
                           </div>
                       </div>
                       <div className="space-y-1">
                           <span className="text-sm font-medium text-slate-500">Penerima (PBF)</span>
                           <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
                             <span className="font-semibold text-slate-900 text-base">{offChain.nama_pbf}</span>
                           </div>
                       </div>
                       <div className="space-y-1">
                          <span className="text-sm font-medium text-slate-500">Tanggal Pesan</span>
                          <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
                            <span className="font-semibold text-slate-900 text-base">{formatDate(offChain.tanggal_pesanan)}</span>
                          </div>
                       </div>
                       <div className="space-y-1">
                           <span className="text-sm font-medium text-slate-500">Tanggal Pengiriman</span>
                           <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
                             <span className="font-semibold text-slate-900 text-base">{formatDate(offChain.tanggal_pengiriman)}</span>
                           </div>
                       </div>
                  </div>
              </div>

              {/* --- TAMBAHAN BARU: Rincian Pesanan --- */}
              <div className="p-8 border-b border-slate-200">
                  <h3 className="text-lg font-bold text-slate-900 mb-6 flex items-center gap-2">
                    <FileText size={20} className="text-emerald-600" />
                    Rincian Barang
                  </h3>
                  <div className="overflow-x-auto border border-slate-200 rounded-lg">
                    <table className="w-full text-sm">
                      <thead className="bg-slate-50 text-slate-700">
                        <tr>
                          <th className="px-4 py-3 text-left font-semibold border-b border-slate-200">Nama Obat</th>
                          <th className="px-4 py-3 text-left font-semibold border-b border-slate-200">Jumlah</th>
                          <th className="px-4 py-3 text-left font-semibold border-b border-slate-200">Harga Satuan</th>
                          <th className="px-4 py-3 text-right font-semibold border-b border-slate-200">Total Harga</th>
                        </tr>
                      </thead>
                     <tbody className="divide-y divide-slate-100">
                        {/* Kita perlu 'detail_pesanan' dari backend.
                          Kita asumsikan 'riwayatData' sekarang memiliki 'detail_pesanan'
                        */}
                        {riwayatData.detail_pesanan && riwayatData.detail_pesanan.length > 0 ? (
                           riwayatData.detail_pesanan.map((item, index) => (
                            <tr key={item.id || index} className="hover:bg-slate-50">
                              <td className="px-4 py-3 font-medium text-slate-800">
                                {item.nama_obat}
                                <span className="block text-xs text-slate-500 font-mono">{item.batch_id || assetId.split('-')[0]}</span>
                              </td>
                              <td className="px-4 py-3 text-slate-600">{item.jumlah_pesanan} Box</td>
                              <td className="px-4 py-3 text-slate-600">Rp {Number(item.harga_per_unit || 0).toLocaleString('id-ID')}</td>
                              <td className="px-4 py-3 text-right font-semibold text-slate-800">Rp {Number(item.total_harga || 0).toLocaleString('id-ID')}</td>
                            </tr>
                           ))
                         ) : (
                           <tr>
                             <td colSpan="4" className="text-center py-6 text-slate-500 border-t border-slate-200">
                               Tidak ada detail barang.
                             </td>
                           </tr>
                         )}
                      </tbody>
                       <tfoot className="bg-slate-50 font-semibold">
                          <tr>
                            <td colSpan="3" className="px-4 py-3 text-right text-slate-800">Total Keseluruhan</td>
                            <td className="px-4 py-3 text-right text-xl text-emerald-700">
                              Rp {Number(offChain.total_harga || 0).toLocaleString('id-ID')}
                            </td>
                          </tr>
                       </tfoot>
                    </table>
                  </div>
              </div>
              {/* --- AKHIR TAMBAHAN --- */}

              <div className="p-8 py-12">
                <h3 className="text-lg font-bold text-slate-900 mb-8 text-center">Riwayat Status Aset</h3>
                <ProdusenToPbfTimeline onChain={onChain} offChain={offChain} onShowBukti={() => setIsModalOpen(true)} />
              </div>

              <div className="px-8 pb-8">
                 <div className="bg-blue-50 border border-blue-200 text-blue-800 rounded-xl p-4 text-sm flex items-start gap-3">
                   <Info size={18} className="flex-shrink-0 mt-0.5"/>
                   <span>
                     Status pengiriman ini diverifikasi berdasarkan data yang tercatat di blockchain untuk memastikan transparansi dan keaslian.
                   </span>
                 </div>
              </div>

            </div>
          </div>
        </main>
      </div>
      
      {/* Modal bukti penerimaan */}
      <BuktiPenerimaanModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        imageUrl={offChain.buktiPenerimaUrl}
      />
    </div>
  );
};

export default LihatRiwayatPesanan;

