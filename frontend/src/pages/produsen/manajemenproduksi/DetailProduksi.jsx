import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import SidebarProdusen from '../../../components/SidebarProdusen';
import NavbarProdusen from '../../../components/NavbarProdusen';
import {
  ArrowLeft,
  Package,
  Calendar,
  Shield,
  FileText,
  QrCode,
  CheckCircle2,
  Clock,
  AlertCircle,
  Download,
  ExternalLink,
  Loader2,
  CheckCircle, // Ditambahkan untuk popup
  XCircle // Ditambahkan untuk popup
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import qrcode from 'qrcode';

const DetailProduksi = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [produksi, setProduksi] = useState(null);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isRecording, setIsRecording] = useState(false);
  const [qrCode, setQrCode] = useState('');
  const [isCollapsed, setIsCollapsed] = useState(false);
  const username = localStorage.getItem('username');

  // --- State untuk Modal Konfirmasi ---
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  const parseDateAsLocal = (dateString) => {
    if (!dateString) return null;
    try {
      const utcDate = new Date(dateString);
      if (isNaN(utcDate.getTime())) {
        console.warn('Invalid date string:', dateString);
        return null;
      }

      const localYear = utcDate.getFullYear();
      const localMonth = utcDate.getMonth();
      const localDay = utcDate.getDate();
      
      const localDate = new Date(localYear, localMonth, localDay);

      console.log('Parsing in Detail:', dateString, '-> Local date:', localDate.toLocaleDateString('id-ID'));
      
      return localDate;
    } catch (error) {
      console.error("Error parsing date in Detail:", dateString, error);
      return null;
    }
  };

  useEffect(() => {
    const fetchProduksi = async () => {
      setIsLoading(true);
      setError('');
      let token;
      try {
        token = localStorage.getItem('token');
        if (!token) {
          toast.error('Anda harus login untuk mengakses halaman ini.');
          navigate('/login/produsen');
          return;
        }
        const response = await fetch(`http://localhost:5000/api/produksi/${id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!response.ok) throw new Error('Gagal mengambil data');
        const result = await response.json();
        
        if (!result.success || !result.data) {
           throw new Error(result.message || 'Data produksi tidak ditemukan.');
        }

        const data = {
          ...result.data,
          bentuk_sediaan: result.data.bentuk_sediaan || '',
          penanggung_jawab: result.data.penanggung_jawab || '',
        };
        setProduksi(data);
        
        if (data.status === 'Tercatat di Blockchain' && data.qr_code_url) {
          setQrCode(data.qr_code_url);
        } else if (data.status === 'Tercatat di Blockchain' && !data.qr_code_url) {
           const qrUrl = await qrcode.toDataURL(
               `http://localhost:5173/verifikasi/${data.batch_id}`
           );
           setQrCode(qrUrl);
        }

        console.log('Raw API dates in Detail:', {
          produksi: data.tanggal_produksi,
          kadaluarsa: data.tanggal_kadaluarsa
        });
      } catch (err) {
        setError(err.message);
        toast.error(err.message);
        if ((err.message.includes('401') || err.message.includes('403') || err.message.includes('login')) && token) {
            navigate('/login/produsen');
        } else if (!token) {
             navigate('/login/produsen');
        }
      } finally {
        setIsLoading(false);
      }
    };
    fetchProduksi();
  }, [id, navigate]);

  // --- Tombol "Hasilkan QR Code" SEKARANG HANYA MEMBUKA MODAL ---
  const handleRecordToBlockchain = async () => {
    setShowConfirmModal(true);
  };

  // --- LOGIKA ASLI DIPINDAHKAN KE SINI ---
  const handleConfirmBlockchain = async () => {
    if (!produksi) return;

    setShowConfirmModal(false); // Tutup modal
    setIsRecording(true);
    setError('');
    const toastId = toast.loading(`Mencatat ${produksi.batch_id} ke blockchain...`);

    try {
      const token = localStorage.getItem('token');
      if (!token) throw new Error('Token autentikasi tidak ditemukan. Silakan login kembali.');
      
      const response = await fetch(`http://localhost:5000/api/produksi/${id}/record`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      
      const result = await response.json();
      if (!response.ok) throw new Error(result.message || 'Gagal mencatat ke blockchain');

      toast.success(result.message || 'Data berhasil dicatat!', { id: toastId });
      
      setProduksi({ ...produksi, status: 'Tercatat di Blockchain' });

      if (result.qrCodeDataUrl) {
        setQrCode(result.qrCodeDataUrl);
      } else {
         const qrUrl = await qrcode.toDataURL(
             `http://localhost:5173/verifikasi/${produksi.batch_id}`
         );
         setQrCode(qrUrl);
      }
      
    } catch (err) {
      setError(err.message);
      toast.error(err.message || 'Gagal mencatat ke blockchain.', { id: toastId });
    } finally {
      setIsRecording(false);
    }
  };


  const getStatusConfig = (status) => {
    const configs = {
      'Terjadwal': {
        icon: <Clock size={20} />,
        bgColor: 'bg-blue-50',
        textColor: 'text-blue-700',
        borderColor: 'border-blue-200',
        label: 'Terjadwal'
      },
      'Dalam Produksi': {
        icon: <AlertCircle size={20} />,
        bgColor: 'bg-yellow-50',
        textColor: 'text-yellow-700',
        borderColor: 'border-yellow-200',
        label: 'Dalam Produksi'
      },
      'Selesai': {
        icon: <CheckCircle2 size={20} />,
        bgColor: 'bg-green-50',
        textColor: 'text-green-700',
        borderColor: 'border-green-200',
        label: 'Selesai'
      },
      'Tercatat di Blockchain': {
        icon: <Shield size={20} />,
        bgColor: 'bg-emerald-50',
        textColor: 'text-emerald-700',
        borderColor: 'border-emerald-200',
        label: 'Tercatat'
      }
    };
    return configs[status] || configs['Terjadwal'];
  };

  // --- RENDER MODAL KONFIRMASI ---
  const renderConfirmModal = () => {
    if (!showConfirmModal) return null;
    return (
      <div
        className="fixed inset-0 bg-black/20 backdrop-blur-sm flex items-center justify-center z-50 p-4"
        onClick={() => setShowConfirmModal(false)}
      >
        <div
          className="bg-white p-8 rounded-xl shadow-2xl max-w-sm w-full mx-auto animate-in fade-in zoom-in-95 duration-200 border border-slate-200"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center gap-3 mb-4 text-emerald-600">
            <Shield size={28} className="flex-shrink-0" />
            <h3 className="font-bold text-lg text-slate-800">Konfirmasi Pencatatan</h3>
          </div>
          <p className="text-slate-700 mb-6 leading-relaxed">
            Anda yakin ingin mencatat Batch ID: <strong>{produksi?.batch_id}</strong> ke blockchain?
            <br/><br/>
            Tindakan ini tidak dapat dibatalkan.
          </p>
          <div className="flex justify-end gap-3">
            <button
              onClick={() => setShowConfirmModal(false)}
              disabled={isRecording}
              className="px-6 py-2.5 font-medium rounded-lg transition bg-slate-100 text-slate-700 hover:bg-slate-200 disabled:opacity-50"
            >
              Batal
            </button>
            <button
              onClick={handleConfirmBlockchain}
              disabled={isRecording}
              className={`px-6 py-2.5 font-medium rounded-lg transition flex items-center gap-2 ${
                isRecording
                  ? "bg-slate-400 cursor-not-allowed text-white"
                  : "bg-emerald-600 text-white hover:bg-emerald-700 active:bg-emerald-800"
              }`}
            >
              {isRecording ? <Loader2 size={18} className="animate-spin" /> : <CheckCircle size={18} />}
              {isRecording ? 'Memproses...' : 'Ya, Konfirmasi'}
            </button>
          </div>
        </div>
      </div>
    )
  }
  // --- AKHIR RENDER MODAL ---

  if (isLoading) {
    return (
       <div className="flex flex-col justify-center items-center h-screen bg-gradient-to-br from-slate-50 via-white to-emerald-50">
          <div className="relative">
            <Loader2 className="animate-spin h-12 w-12 text-emerald-600" />
            <div className="absolute inset-0 h-12 w-12 rounded-full border-4 border-emerald-200 animate-ping opacity-20"></div>
          </div>
          <p className="mt-4 text-slate-700 font-medium">Memuat data produksi...</p>
      </div>
    );
  }

  if (error && !produksi) {
     return (
       <div className="flex flex-col justify-center items-center h-screen bg-gradient-to-br from-slate-50 via-white to-red-50 p-6">
          <div className="bg-white p-8 rounded-xl shadow-lg border border-red-200 text-center">
            <AlertCircle className="mx-auto h-12 w-12 text-red-500 mb-4" />
            <h2 className="text-xl font-bold text-red-800 mb-2">Gagal Memuat Data</h2>
            <p className="text-red-600 mb-6">{error}</p>
            <button
               onClick={() => navigate('/produsen/manajemen-produksi')}
               className="flex items-center gap-2 px-4 py-2.5 border border-slate-300 text-slate-700 font-medium rounded-lg hover:bg-slate-100 transition mx-auto"
             >
               <ArrowLeft size={18} />
               Kembali ke Manajemen
             </button>
          </div>
       </div>
    );
  }

  if (!produksi) {
    return (
       <div className="flex flex-col justify-center items-center h-screen bg-slate-50 p-6">
        <div className="bg-white p-8 rounded-xl shadow-lg border border-slate-200 text-center">
          <Package size={64} className="mx-auto text-slate-300 mb-4" />
          <h2 className="text-xl font-bold text-slate-800 mb-2">Data Tidak Ditemukan</h2>
          <p className="text-slate-500 mb-6">Data produksi untuk ID ini tidak dapat ditemukan.</p>
           <button
             onClick={() => navigate('/produsen/manajemen-produksi')}
             className="flex items-center gap-2 px-4 py-2.5 border border-slate-300 text-slate-700 font-medium rounded-lg hover:bg-slate-100 transition mx-auto"
           >
             <ArrowLeft size={18} />
             Kembali ke Manajemen
           </button>
        </div>
      </div>
    );
  }

  const statusConfig = getStatusConfig(produksi.status);

  return (
    <div className="flex min-h-screen bg-slate-50">
      {renderConfirmModal()}
      <SidebarProdusen isCollapsed={isCollapsed} setIsCollapsed={setIsCollapsed} />
      
      <div className={`flex-1 flex flex-col transition-all duration-300 ${isCollapsed ? 'ml-16' : 'ml-64'}`}>
        <NavbarProdusen onLogout={() => { localStorage.clear(); navigate('/'); }} username={username} />
        
        <main className="flex-1 overflow-auto pt-[72px] px-12 py-8">
          <div className="max-w-5xl mx-auto">
            <div className="mb-8">
              <button
                onClick={() => navigate('/produsen/manajemen-produksi')}
                className="mb-4 inline-flex items-center text-emerald-600 hover:text-emerald-700 transition-colors text-sm font-medium"
              >
                <ArrowLeft size={16} className="mr-1" />
                Kembali ke Manajemen Produksi
              </button>
              
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    <h1 className="text-4xl font-bold text-slate-900">{produksi.nama_obat}</h1>
                    <span className={`flex items-center gap-2 px-3 py-1 rounded-full text-sm font-semibold border ${statusConfig.bgColor} ${statusConfig.textColor} ${statusConfig.borderColor}`}>
                      {statusConfig.icon}
                      {statusConfig.label}
                    </span>
                  </div>
                  <p className="text-slate-600 text-lg flex items-center gap-2">
                    <Package size={18} />
                    Batch ID: <span className="font-semibold text-slate-800">{produksi.batch_id}</span>
                  </p>
                </div>
              </div>
            </div>

            {error && (
              <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 rounded-xl flex items-center gap-3">
                <AlertCircle size={20} />
                <span>{error}</span>
              </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 space-y-6">
                <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
                  <div className="bg-gradient-to-r from-emerald-50 to-emerald-100 px-6 py-4 border-b border-slate-200">
                    <h2 className="text-lg font-semibold text-emerald-900 flex items-center gap-2">
                      Informasi Produk
                    </h2>
                  </div>
                  <div className="p-6 grid grid-cols-2 gap-x-6 gap-y-5">
                    <InfoItem label="Nama Obat" value={produksi.nama_obat} />
                    <InfoItem label="Batch ID" value={produksi.batch_id} />
                    <InfoItem label="Nomor Izin Edar" value={produksi.nomor_izin_edar} />
                    <InfoItem label="Dosis" value={produksi.dosis} />
                    <InfoItem label="Bentuk Sediaan" value={produksi.bentuk_sediaan} />
                    <InfoItem label="Jumlah Produksi" value={`${produksi.jumlah.toLocaleString('id-ID')} Pcs`} />
                    <InfoItem label="Penanggung Jawab" value={produksi.penanggung_jawab} />
                    <InfoItem label="Prioritas" value={produksi.prioritas} />
                    <div className="col-span-2">
                      <InfoItem label="Komposisi Obat" value={produksi.komposisi_obat} />
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
                  <div className="bg-gradient-to-r from-emerald-50 to-emerald-100 px-6 py-4 border-b border-slate-200">
                    <h2 className="text-lg font-semibold text-emerald-900 flex items-center gap-2">
                      Informasi Waktu
                    </h2>
                  </div>
                  <div className="p-6 grid grid-cols-2 gap-x-6 gap-y-5">
                    <InfoItem 
                      label="Tanggal Produksi" 
                      value={parseDateAsLocal(produksi.tanggal_produksi)?.toLocaleDateString('id-ID', {
                        day: 'numeric',
                        month: 'long',
                        year: 'numeric',
                      }) || '-'} 
                    />
                    <InfoItem 
                      label="Tanggal Kadaluarsa" 
                      value={parseDateAsLocal(produksi.tanggal_kadaluarsa)?.toLocaleDateString('id-ID', {
                        day: 'numeric',
                        month: 'long',
                        year: 'numeric',
                      }) || '-'} 
                    />
                  </div>
                </div>

                <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
                  <div className="bg-gradient-to-r from-emerald-50 to-emerald-100 px-6 py-4 border-b border-slate-200">
                    <h2 className="text-lg font-semibold text-emerald-900 flex items-center gap-2">
                      Dokumen & Sertifikasi
                    </h2>
                  </div>
                  <div className="p-6 space-y-5">
                    <DocumentItem 
                      label="Dokumen BPOM" 
                      path={produksi.dokumen_bpom_path}
                    />
                    <DocumentItem 
                      label="Sertifikat Analisis" 
                      path={produksi.sertifikat_analisis_path}
                    />
                    <div>
                      <p className="text-sm font-semibold text-slate-700 mb-2">Hash Sertifikat Analisis</p>
                      <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                        <code className="text-xs text-slate-700 break-all font-mono">
                          {produksi.hash_sertifikat_analisis || '-'}
                        </code>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-6 lg:sticky lg:top-24">
                {produksi.status === 'Selesai' && (
                  <div className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden">
                    <div className="p-6">
                      <div className="flex items-center gap-3 mb-4">
                        <div className="p-3 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl shadow-lg">
                          <Shield size={24} className="text-white" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-slate-900 text-lg">Catat ke Blockchain</h3>
                          <p className="text-sm text-slate-600">Amankan data produksi</p>
                        </div>
                      </div>
                      <p className="text-sm text-slate-600 mb-5 leading-relaxed">
                        Proses ini akan mencatat data produksi secara permanen ke blockchain dan menghasilkan QR Code untuk verifikasi.
                      </p>
                      <button
                        onClick={handleRecordToBlockchain}
                        disabled={isRecording}
                        className="w-full bg-emerald-600 text-white py-3 rounded-lg hover:bg-emerald-700 disabled:bg-slate-400 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2 font-semibold shadow-md shadow-emerald-500/20"
                      >
                        {isRecording ? (
                          <>
                            <Loader2 className="animate-spin" size={18} />
                            Memproses...
                          </>
                        ) : (
                          <>
                            <QrCode size={18} />
                            Hasilkan QR Code
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                )}

                {produksi.status === 'Tercatat di Blockchain' && (
                  <>
                    <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6">
                      <div className="flex items-center gap-3 mb-4">
                        <div className="p-3 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl shadow-lg">
                          <Shield size={24} className="text-white" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-slate-900 text-lg">Tercatat di Blockchain</h3>
                          <p className="text-sm text-emerald-700 font-medium">Data telah diamankan</p>
                        </div>
                      </div>
                      <div className="p-4 bg-slate-50 rounded-xl border border-dashed border-emerald-300">
                        <p className="text-sm text-slate-600 text-center">
                          Batch ini telah tercatat permanen & tidak dapat diubah.
                        </p>
                      </div>
                    </div>

                    {qrCode && (
                      <div className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden">
                        <div className="px-6 py-4 border-b border-slate-200 bg-slate-50">
                          <h3 className="font-semibold text-slate-900 flex items-center gap-2">
                            <QrCode size={20} className="text-emerald-600" />
                            QR Code Verifikasi
                          </h3>
                        </div>
                        <div className="p-6">
                          <div className="bg-white p-4 rounded-xl border border-slate-200 mb-4">
                            <img 
                              src={qrCode} 
                              alt="QR Code" 
                              className="w-full max-w-[200px] mx-auto rounded"
                            />
                          </div>
                          <div className="space-y-2">
                            <p className="text-sm text-slate-600 text-center">
                              Pindai QR Code untuk verifikasi
                            </p>
                            <div className="p-3 bg-emerald-50 rounded-lg border border-emerald-200">
                              <p className="text-xs text-emerald-700 text-center font-medium">
                                Batch ID: {produksi.batch_id}
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          </div>
        </main>
      </div>
       <style jsx>{`
        .react-datepicker-wrapper {
          width: 100%;
        }
        .react-datepicker__input-container input {
          width: 100%;
          padding: 0.625rem 1rem; 
          border: 1px solid #cbd5e1; 
          border-radius: 0.5rem; 
          transition: all 0.2s;
        }
        .react-datepicker__input-container input:focus {
          outline: none;
          border-color: transparent;
          box-shadow: 0 0 0 2px #34d399; 
        }
        
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

const InfoItem = ({ label, value }) => (
  <div>
    <p className="text-sm font-medium text-slate-500 mb-1">{label}</p>
    <p className="text-slate-800 font-semibold">{value || '-'}</p>
  </div>
);

const DocumentItem = ({ label, path }) => (
  <div>
    <p className="text-sm font-semibold text-slate-700 mb-2">{label}</p>
    {path ? (
      <a
        href={`http://localhost:5000/${path.replace(/\\/g, '/')}`}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-50 text-emerald-700 rounded-lg hover:bg-emerald-100 transition-colors border border-emerald-200 text-sm font-medium"
      >
        <ExternalLink size={14} />
        Lihat Dokumen
      </a>
    ) : (
      <div className="px-4 py-2 bg-slate-100 text-slate-500 rounded-lg border border-slate-200 inline-block text-sm">
        Tidak ada dokumen
      </div>
    )}
  </div>
);

export default DetailProduksi;