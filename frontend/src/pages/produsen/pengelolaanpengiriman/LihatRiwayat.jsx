import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import SidebarProdusen from '../../../components/SidebarProdusen';
import NavbarProdusen from '../../../components/NavbarProdusen';
// Mengimpor ikon yang diperlukan untuk layout baru
import { ArrowLeft, CheckCircle, Package, Truck, Loader2, X, ClipboardCopy } from 'lucide-react'; 

const LihatRiwayat = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const [isCollapsed, setIsCollapsed] = useState(false);
  
  // State untuk modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false); // Nanti ganti true jika fetch data

  // Kita tetap gunakan state dummy data dari LihatRiwayat
  const [riwayatData, setRiwayatData] = useState({
    idPesanan: '000076',
    namaPbf: 'PBF Bandung',
    totalHarga: 45000000,
    status: 'Selesai',
    // Data tambahan dari layout LihatStatus
    noResi: 'RES-250915-14-0869',
    noSuratJalan: 'SJ-250915-14-0869',
    waktuPesan: new Date('2025-09-15T10:00:00'),
    estimasiSampai: new Date('2025-09-17T00:00:00'), // Asumsi estimasi
    pengirim: 'Produsen',
    // URL Bukti untuk modal
    buktiPenerimaUrl: 'https://i.imgur.com/g0P3kco.jpeg', // Placeholder (Ganti dengan data asli API)
    // Data Riwayat Blockchain
    riwayatBlockchain: [
      { txId: 'a1b2c3d4...', status: 'DIPRODUKSI', timestamp: '15-09-2025 10:00', oleh: 'ProdusenMSP' },
      { txId: 'e5f6g7h8...', status: 'DIKIRIM_KE_PBF', timestamp: '17-09-2025 16:00', oleh: 'ProdusenMSP' },
      { txId: 'i9j0k1l2...', status: 'DITERIMA_PBF', timestamp: '17-09-2025 19:00', oleh: 'PBFMSP' },
    ]
  });

  // useEffect untuk fetch data riwayat asli (saat ini dinonaktifkan karena pakai dummy)
  // useEffect(() => {
  //   const fetchData = async () => {
  //     setIsLoading(true);
  //     // const response = await fetch(...);
  //     // const result = await response.json();
  //     // setRiwayatData(result.data);
  //     // setIsLoading(false);
  //   };
  //   fetchData();
  // }, [id]);

  const handleLogout = () => {
    localStorage.clear();
    navigate('/');
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    alert(`Teks "${text}" telah disalin.`);
  };

  // --- Mengambil Komponen StatusStep dari LihatStatus.jsx ---
  const StatusStep = ({ icon, label, timestamp, isCompleted, isLast = false, children }) => (
    <div className="flex items-center">
      <div className={`flex flex-col items-center ${isLast ? '' : 'flex-1'}`}>
        <div className={`w-12 h-12 rounded-full flex items-center justify-center ${isCompleted ? 'bg-emerald-500 text-white' : 'bg-gray-200 text-gray-500'}`}>
          {icon}
        </div>
        <div className="text-center mt-2">
            <p className={`font-semibold ${isCompleted ? 'text-gray-800' : 'text-gray-500'}`}>{label}</p>
            {timestamp && <p className="text-sm text-gray-500">{timestamp}</p>}
            {children} {/* Slot untuk link "Lihat Bukti Penerima" */}
        </div>
      </div>
      {!isLast && (
        <div className={`flex-1 h-1 mx-4 ${isCompleted ? 'bg-emerald-500' : 'bg-gray-200'}`} />
      )}
    </div>
  );

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <Loader2 className="animate-spin h-8 w-8 text-emerald-600" />
      </div>
    );
  }

  // --- LOGIKA MAPPING DATA BLOCKCHAIN KE STATUS UI ---
  // (Kita cari data dari array dummy)
  const dataProduksi = riwayatData.riwayatBlockchain.find(item => item.status === 'DIPRODUKSI');
  const dataKirim = riwayatData.riwayatBlockchain.find(item => item.status === 'DIKIRIM_KE_PBF');
  const dataTerima = riwayatData.riwayatBlockchain.find(item => item.status === 'DITERIMA_PBF');

  const isDipersiapkanCompleted = !!dataProduksi;
  const isDikirimCompleted = !!dataKirim;
  const isSelesaiCompleted = !!dataTerima;

  const formatDate = (date) => date.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });

  return (
    <div className="flex min-h-screen bg-gray-50">
      <SidebarProdusen isCollapsed={isCollapsed} setIsCollapsed={setIsCollapsed} />
      <div className={`flex-1 flex flex-col transition-all duration-300 ${isCollapsed ? 'ml-16' : 'ml-64'}`}>
        <NavbarProdusen onLogout={handleLogout} />
        <main className="pt-16 p-6">
          <div className="max-w-4xl mx-auto">
            <div className="flex items-center mb-6">
              <button onClick={() => navigate('/produsen/pengelolaan-pengiriman')} className="flex items-center gap-2 text-gray-600 hover:text-gray-900">
                <ArrowLeft size={18} /> Kembali
              </button>
            </div>

            {/* --- INI ADALAH LAYOUT DARI LihatStatus.jsx --- */}
            <div className="bg-white p-8 rounded-lg shadow-lg border border-gray-200">
              <header className="mb-8">
                {/* Judul tetap Riwayat Pengiriman, tapi sub-judul dari LihatStatus */}
                <h1 className="text-2xl font-bold text-gray-800">Riwayat Pengiriman (Jejak Blockchain)</h1>
                <p className="text-gray-500">Lihat Proses Pengiriman dari ID: {riwayatData.idPesanan}</p>
              </header>
              
              {/* Detail Header dari LihatStatus */}
              <section className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-12">
                <div>
                  <p className="text-sm text-gray-500">No Resi</p>
                  <div className="flex items-center gap-2">
                    <p className="font-semibold text-lg">{riwayatData.noResi}</p>
                    <button onClick={() => copyToClipboard(riwayatData.noResi)} className="text-gray-400 hover:text-emerald-600">
                        <ClipboardCopy size={16}/>
                    </button>
                  </div>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Pengirim</p>
                  <p className="font-semibold text-lg">{riwayatData.pengirim}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Waktu Pesan</p>
                  <p className="font-semibold text-lg">{formatDate(riwayatData.waktuPesan)}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">ID Pesanan</p>
                  <p className="font-semibold text-lg">{riwayatData.idPesanan}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">No Surat Jalan</p>
                  <p className="font-semibold text-lg">{riwayatData.noSuratJalan}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Tujuan</p>
                  <p className="font-semibold text-lg">{riwayatData.namaPbf}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Estimasi Sampai</p>
                  <p className="font-semibold text-lg">{formatDate(riwayatData.estimasiSampai)}</p>
                </div>
                 <div>
                  <p className="text-sm text-gray-500">Status Final</p>
                  <span className="px-2 py-1 text-xs font-semibold rounded-full bg-emerald-100 text-emerald-800">
                      {riwayatData.status}
                  </span>
                </div>
              </section>

              {/* Timeline Horizontal dari LihatStatus, tapi diisi data Blockchain */}
              <section className="flex justify-center py-6">
                <StatusStep 
                  icon={<Package size={24}/>} 
                  label="DIPRODUKSI" 
                  timestamp={isDipersiapkanCompleted ? dataProduksi.timestamp : null} 
                  isCompleted={isDipersiapkanCompleted} />
                <StatusStep 
                  icon={<Truck size={24}/>} 
                  label="DIKIRIM KE PBF" 
                  timestamp={isDikirimCompleted ? dataKirim.timestamp : null} 
                  isCompleted={isDikirimCompleted} />
                <StatusStep 
                  icon={<CheckCircle size={24}/>} 
                  label="DITERIMA PBF" 
                  timestamp={isSelesaiCompleted ? dataTerima.timestamp : null} 
                  isCompleted={isSelesaiCompleted} 
                  isLast={true}
                >
                  {/* Tampilkan link HANYA jika selesai (DITERIMA) DAN ada URL bukti */}
                  {isSelesaiCompleted && riwayatData.buktiPenerimaUrl && (
                    <button
                      onClick={() => setIsModalOpen(true)}
                      className="text-sm text-emerald-600 hover:underline mt-1"
                    >
                      Lihat bukti Penerima
                    </button>
                  )}
                </StatusStep>
              </section>
            </div>
          </div>
        </main>
      </div>

      {/* MODAL (Pop-up) untuk Bukti Penerima */}
      {isModalOpen && riwayatData.buktiPenerimaUrl && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-70 backdrop-blur-sm"
          onClick={() => setIsModalOpen(false)} 
        >
          <div 
            className="bg-white p-0 rounded-lg shadow-2xl relative w-full max-w-xl overflow-hidden"
            onClick={(e) => e.stopPropagation()} 
          >
            <div className="flex justify-between items-center p-4 border-b bg-emerald-600 text-white">
              <h3 className="text-lg font-semibold">Bukti Penerima</h3>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="text-white opacity-70 hover:opacity-100"
              >
                <X size={24} />
              </button>
            </div>
            <div className="p-4 bg-gray-100">
                <img 
                    src={riwayatData.buktiPenerimaUrl} 
                    alt="Bukti Penerima" 
                    className="w-full h-auto rounded"
                />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
export default LihatRiwayat;