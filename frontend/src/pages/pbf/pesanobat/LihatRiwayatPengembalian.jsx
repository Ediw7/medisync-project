import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import SidebarPbf from '../../../components/SidebarPbf';
import NavbarPbf from '../../../components/NavbarPbf';
import { ArrowLeft, CheckCircle } from 'lucide-react';

const LihatRiwayatPengembalian = () => {
  const navigate = useNavigate();
  const location = useLocation();
  
  // --- PERBAIKAN DI SINI ---
  // Hapus 'foto' dari destrukturisasi, karena kita tidak mengirimkannya
  const { idPesanan, alasan } = location.state || {};
  // Ambil 'previewFoto' dari state
  const previewFoto = location.state?.foto; 
  // --- AKHIR PERBAIKAN ---
  
  const [isCollapsed, setIsCollapsed] = useState(false);

  // --- PERBAIKAN DI SINI ---
  // Ubah pengecekan: 'foto' tidak lagi wajib, 'alasan' juga tidak wajib
  if (!idPesanan) {
  // --- AKHIR PERBAIKAN ---
    return (
        <div className="flex justify-center items-center h-screen">
            <p>Data pengajuan tidak ditemukan.</p>
            <button onClick={() => navigate('/pbf/pesan-obat')} className="ml-4 p-2 bg-gray-200 rounded">
                Kembali
            </button>
        </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-gray-50">
      <SidebarPbf isCollapsed={isCollapsed} setIsCollapsed={setIsCollapsed} />
      <div className={`flex-1 flex flex-col transition-all duration-300 ${isCollapsed ? 'ml-16' : 'ml-64'}`}>
        <NavbarPbf onLogout={() => { localStorage.clear(); navigate('/'); }} />
        <main className="flex-1 pt-16 p-6">
          <div className="max-w-2xl mx-auto">
            <button 
              onClick={() => navigate('/pbf/pesan-obat')} 
              className="flex items-center gap-2 text-gray-600 hover:text-gray-900 font-semibold mb-6"
            >
              <ArrowLeft size={18} /> Kembali ke Daftar Pesanan
            </button>
            
            <div className="bg-white p-8 rounded-lg shadow-md border border-gray-200">
                <div className="text-center mb-6">
                    <CheckCircle size={48} className="text-emerald-500 mx-auto mb-4" />
                    <h1 className="text-2xl font-bold text-gray-800">Pengajuan Pengembalian Terkirim</h1>
                    <p className="text-gray-500 mt-1">Pengajuan Anda akan segera ditinjau oleh Produsen.</p>
                </div>

                <div className="space-y-4">
                    <div>
                        <p className="text-sm font-medium text-gray-500">ID Pesanan</p>
                        <p className="mt-1 font-semibold text-gray-900">{String(idPesanan).padStart(6, '0')}</p>
                    </div>
                     <div>
                        <p className="text-sm font-medium text-gray-500">Alasan Pengembalian</p>
                        <p className="mt-1 text-gray-700 bg-gray-50 p-3 rounded-md border">{alasan || 'Tidak ada alasan.'}</p>
                    </div>
                     <div>
                        <p className="text-sm font-medium text-gray-500">Foto Bukti</p>
                        {/* --- PERBAIKAN DI SINI --- */}
                        {previewFoto ? (
                          <div className="mt-2 border rounded-lg p-2 bg-gray-50 inline-block">
                             <img src={previewFoto} alt="Bukti Pengembalian" className="h-48 w-auto object-contain rounded" />
                          </div>
                        ) : (
                          <p className="mt-1 text-gray-500">Tidak ada bukti foto.</p>
                        )}
                        {/* --- AKHIR PERBAIKAN --- */}
                    </div>
                </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default LihatRiwayatPengembalian;
