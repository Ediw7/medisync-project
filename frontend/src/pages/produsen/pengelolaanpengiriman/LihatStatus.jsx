import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import SidebarProdusen from '../../../components/SidebarProdusen';
import NavbarProdusen from '../../../components/NavbarProdusen';
import { ArrowLeft, ClipboardCopy, Package, Truck, CheckCircle } from 'lucide-react';

const LihatStatus = () => {
  const navigate = useNavigate();
  const { id } = useParams(); // Ambil ID pesanan dari URL
  const [isCollapsed, setIsCollapsed] = useState(false);
  
  // Data dummy untuk status pengiriman
  // Di aplikasi nyata, data ini akan diambil dari backend menggunakan ID pesanan
  const [shippingData, setShippingData] = useState({
    noResi: '002 887 377 247',
    noSuratJalan: 'ABC-007653',
    pengirim: 'Produsen',
    tujuan: 'PBF Semarang',
    waktuPesan: '01-03-2025',
    idPesanan: '000001',
    estimasiSampai: '03-03-2025',
    history: [
      { status: 'Dipersiapkan', timestamp: '02-03-2025 10:00' },
      { status: 'Dikirim', timestamp: '02-03-2025 12:00' },
      { status: 'Selesai', timestamp: null }, // Belum selesai
    ]
  });

  const handleLogout = () => {
    localStorage.clear();
    navigate('/');
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    alert(`Nomor Resi "${text}" telah disalin.`);
  };
  
  const StatusStep = ({ icon, label, timestamp, isCompleted, isLast = false }) => (
    <div className="flex items-center">
      <div className={`flex flex-col items-center ${isLast ? '' : 'flex-1'}`}>
        <div className={`w-12 h-12 rounded-full flex items-center justify-center ${isCompleted ? 'bg-emerald-500 text-white' : 'bg-gray-200 text-gray-500'}`}>
          {icon}
        </div>
        <div className="text-center mt-2">
            <p className={`font-semibold ${isCompleted ? 'text-gray-800' : 'text-gray-500'}`}>{label}</p>
            {isCompleted && <p className="text-sm text-gray-500">{timestamp}</p>}
        </div>
      </div>
      {!isLast && (
        <div className={`flex-1 h-1 mx-4 ${isCompleted ? 'bg-emerald-500' : 'bg-gray-200'}`} />
      )}
    </div>
  );

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

            <div className="bg-white p-8 rounded-lg shadow-lg border border-gray-200">
              <header className="mb-8">
                <h1 className="text-2xl font-bold text-gray-800">Lacak Pengiriman</h1>
                <p className="text-gray-500">Lihat Proses Pengiriman</p>
              </header>

              {/* Detail Pengiriman */}
              <section className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-12">
                <div>
                  <p className="text-sm text-gray-500">No Resi</p>
                  <div className="flex items-center gap-2">
                    <p className="font-semibold text-lg">{shippingData.noResi}</p>
                    <button onClick={() => copyToClipboard(shippingData.noResi)} className="text-gray-400 hover:text-emerald-600">
                        <ClipboardCopy size={16}/>
                    </button>
                  </div>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Pengirim</p>
                  <p className="font-semibold text-lg">{shippingData.pengirim}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Waktu Pesan</p>
                  <p className="font-semibold text-lg">{shippingData.waktuPesan}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">ID Pesanan</p>
                  <p className="font-semibold text-lg">{shippingData.idPesanan}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">No Surat Jalan</p>
                  <p className="font-semibold text-lg">{shippingData.noSuratJalan}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Tujuan</p>
                  <p className="font-semibold text-lg">{shippingData.tujuan}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Estimasi Sampai</p>
                  <p className="font-semibold text-lg">{shippingData.estimasiSampai}</p>
                </div>
              </section>

              {/* Timeline Status */}
              <section className="flex justify-center">
                <StatusStep icon={<Package size={24}/>} label="Dipersiapkan" timestamp={shippingData.history[0].timestamp} isCompleted={!!shippingData.history[0].timestamp} />
                <StatusStep icon={<Truck size={24}/>} label="Dikirim" timestamp={shippingData.history[1].timestamp} isCompleted={!!shippingData.history[1].timestamp} />
                <StatusStep icon={<CheckCircle size={24}/>} label="Selesai" timestamp={shippingData.history[2].timestamp} isCompleted={!!shippingData.history[2].timestamp} isLast={true} />
              </section>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};
export default LihatStatus;