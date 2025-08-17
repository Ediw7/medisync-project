import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import SidebarProdusen from '../../../components/SidebarProdusen';
import NavbarProdusen from '../../../components/NavbarProdusen';
import { ArrowLeft, CheckCircle, FileText, Hash } from 'lucide-react';

const LihatRiwayat = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const [isCollapsed, setIsCollapsed] = useState(false);

  // Data dummy untuk riwayat, ganti dengan data asli dari API nanti
  const [riwayatData, setRiwayatData] = useState({
    idPesanan: '000001',
    namaPbf: 'PBF Semarang',
    totalHarga: 45000000,
    status: 'Selesai',
    riwayatBlockchain: [
      { txId: 'a1b2c3d4...', status: 'DIPRODUKSI', timestamp: '01-03-2025 08:00', oleh: 'ProdusenMSP' },
      { txId: 'e5f6g7h8...', status: 'DIKIRIM_KE_PBF', timestamp: '02-03-2025 12:00', oleh: 'ProdusenMSP' },
      { txId: 'i9j0k1l2...', status: 'DITERIMA_PBF', timestamp: '03-03-2025 09:00', oleh: 'PBFMSP' },
    ]
  });

  const handleLogout = () => {
    localStorage.clear();
    navigate('/');
  };

  const RiwayatItem = ({ txId, status, timestamp, oleh, isLast = false }) => (
    <div className="flex gap-4">
        <div className="flex flex-col items-center">
            <div className="bg-emerald-500 text-white w-8 h-8 rounded-full flex items-center justify-center">
                <CheckCircle size={20} />
            </div>
            {!isLast && <div className="w-px h-full bg-gray-300 my-2" />}
        </div>
        <div className="pb-8">
            <p className="font-semibold">{status.replace(/_/g, ' ')}</p>
            <p className="text-sm text-gray-500">Oleh: {oleh}</p>
            <p className="text-sm text-gray-500">Waktu: {timestamp}</p>
            <div className="text-xs text-gray-400 mt-1 flex items-center gap-1">
                <Hash size={12} />
                <span>TxID: {txId}</span>
            </div>
        </div>
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
              <header className="mb-8 border-b pb-4">
                <h1 className="text-2xl font-bold text-gray-800">Riwayat Pengiriman</h1>
                <p className="text-gray-500">Menampilkan jejak digital dari pesanan ID: {riwayatData.idPesanan}</p>
              </header>

              <div className="flex justify-between items-start mb-8">
                <div>
                    <p className="text-sm text-gray-500">Tujuan Pengiriman</p>
                    <p className="font-semibold text-lg">{riwayatData.namaPbf}</p>
                </div>
                <div>
                    <p className="text-sm text-gray-500">Total Harga</p>
                    <p className="font-semibold text-lg">Rp. {riwayatData.totalHarga.toLocaleString('id-ID')}</p>
                </div>
                <div>
                    <p className="text-sm text-gray-500">Status Final</p>
                    <span className="px-2 py-1 text-xs font-semibold rounded-full bg-gray-200 text-gray-800">{riwayatData.status}</span>
                </div>
              </div>

              <section>
                <h2 className="text-lg font-semibold mb-4">Jejak Transaksi di Blockchain</h2>
                <div>
                    {riwayatData.riwayatBlockchain.map((item, index) => (
                        <RiwayatItem 
                            key={item.txId}
                            {...item}
                            isLast={index === riwayatData.riwayatBlockchain.length - 1}
                        />
                    ))}
                </div>
              </section>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};
export default LihatRiwayat;