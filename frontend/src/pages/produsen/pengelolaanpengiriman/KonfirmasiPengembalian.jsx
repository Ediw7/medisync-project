// File: frontend/src/pages/produsen/pengelolaanpengiriman/KonfirmasiPengembalian.jsx

import React from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import SidebarProdusen from '../../../components/SidebarProdusen';
import NavbarProdusen from '../../../components/NavbarProdusen';
import { ArrowLeft, CheckCircle, XCircle, AlertCircle, Loader2 } from 'lucide-react';
import axios from 'axios';

const KonfirmasiPengembalian = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [isCollapsed, setIsCollapsed] = React.useState(false);
  const [data, setData] = React.useState(null);
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState(null);
  
  // State baru untuk modal dan aksi
  const [showModal, setShowModal] = React.useState(false);
  const [isActionLoading, setIsActionLoading] = React.useState(false);

  React.useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const token = localStorage.getItem('token');
        const response = await axios.get(`http://localhost:5000/api/produsen/pesanan-masuk/pengembalian/${id}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setData(response.data.data);
      } catch (err) {
        setError(err.response?.data?.message || 'Gagal memuat data pengembalian');
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, [id]);

  const handleAction = async () => {
    setIsActionLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem('token');
      await axios.put(`http://localhost:5000/api/produsen/pesanan-masuk/pengembalian/${id}/approve`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      alert('Pengajuan pengembalian telah disetujui. Anda akan diarahkan ke halaman pelacakan.');
      navigate(`/produsen/pengelolaan-pengiriman/lacak-pengembalian/${id}`);
    } catch (err) {
      setError(err.response?.data?.message || 'Gagal menyetujui pengembalian');
      setShowModal(false); // Sembunyikan modal jika error
    } finally {
      setIsActionLoading(false);
    }
  };

  const DetailItem = ({ label, value }) => (
    <div>
      <dt className="text-sm font-medium text-gray-500">{label}</dt>
      <dd className="mt-1 text-sm text-gray-900">{value}</dd>
    </div>
  );

  return (
    <div className="flex min-h-screen bg-gray-100">
      <SidebarProdusen isCollapsed={isCollapsed} setIsCollapsed={setIsCollapsed} />
      <div className={`flex-1 flex flex-col transition-all duration-300 ${isCollapsed ? 'ml-16' : 'ml-64'}`}>
        <NavbarProdusen onLogout={() => { localStorage.clear(); navigate('/'); }} />
        <main className="flex-1 pt-16 p-6">
          <div className="max-w-4xl mx-auto">
            <div className="mb-6">
              <Link to="/produsen/pengelolaan-pengiriman/pengembalian" className="flex items-center gap-2 text-gray-600 hover:text-gray-800">
                <ArrowLeft size={20} />
                <span className="font-medium">Kembali ke Daftar Pengembalian</span>
              </Link>
            </div>

            {isLoading && (
              <div className="text-center p-8">
                <Loader2 className="animate-spin mx-auto h-8 w-8 text-emerald-600" />
                <p className="mt-2 text-gray-500">Memuat data...</p>
              </div>
            )}
            {error && !isLoading &&(
               <div className="p-4 mb-4 text-sm text-red-800 rounded-lg bg-red-50 flex items-center gap-2" role="alert">
                 <AlertCircle size={20} />
                 <span className="font-medium">Error!</span> {error}
               </div>
            )}
            
            {data && (
              <>
                <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                  <div className="flex justify-between items-start mb-6">
                    <div>
                      <h1 className="text-2xl font-bold text-gray-800">Detail Pengajuan Pengembalian</h1>
                      <p className="text-gray-500">
                        Nomor Pesanan: <span className="font-semibold">{String(data.id).padStart(6, '0')}</span>
                      </p>
                    </div>
                     <span className={`px-3 py-1 text-sm font-semibold rounded-full ${
                          data.status === 'Pengembalian Diajukan' ? 'bg-indigo-100 text-indigo-800' : 'bg-purple-100 text-purple-800'
                        }`}>{data.status}</span>
                  </div>
                  
                  <div className="border-t border-gray-200 grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-6 pt-6">
                    <div>
                      <p className="text-sm text-gray-500">Dana Pengembalian</p>
                      <p className="text-lg font-semibold text-gray-900">Rp {(data.total_harga || 0).toLocaleString('id-ID')}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Diajukan oleh</p>
                      <p className="text-lg font-semibold text-gray-900">{data.nama_pbf}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">No Surat Jalan</p>
                      <p className="text-lg font-semibold text-gray-900">{data.nomor_surat_jalan || '-'}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Diajukan pada</p>
                      <p className="text-lg font-semibold text-gray-900">
                        {new Date(data.tanggal_pesanan).toLocaleDateString('id-ID', { day: '2-digit', month: '2-digit', year: 'numeric' }).replace(/\//g, '-')}
                      </p>
                    </div>
                  </div>

                  <div className="border-t border-gray-200 pt-6 mt-6">
                    <dl className="space-y-6">
                      <div>
                         <dt className="text-sm font-medium text-gray-500">Alasan Pengembalian</dt>
                         <dd className="mt-1 text-sm text-gray-900 bg-gray-50 p-3 rounded-md border">{data.alasan_pengembalian}</dd>
                      </div>
                       <div>
                         <dt className="text-sm font-medium text-gray-500 mb-2">Bukti Foto dari PBF</dt>
                         <div className="border rounded-lg p-2">
                           <img 
                            src={`http://localhost:5000/${data.bukti_foto.replace(/\\/g, '/')}`} 
                            alt="Bukti Pengembalian" 
                            className="w-full max-w-md mx-auto h-auto object-contain rounded-md"
                           />
                         </div>
                      </div>
                    </dl>
                  </div>
                </div>

                <div className="mt-6">
                    <h2 className="text-xl font-bold text-gray-800 mb-4">Rincian Pesanan</h2>
                    <div className="bg-white border rounded-lg overflow-hidden shadow-sm">
                      <div className="grid grid-cols-3 bg-gray-50 p-4 font-semibold text-sm text-gray-600">
                        <span>Pemesan</span>
                        <span>Dokumen Pesanan</span>
                        <span className="text-right">Total Harga</span>
                      </div>
                      <div className="grid grid-cols-3 p-4 items-center">
                        <div>
                          <p className="font-semibold text-gray-900">{data.nama_pbf}</p>
                          <p className="text-xs text-gray-500">ID Pesanan : {String(data.id).padStart(6, '0')}</p>
                        </div>
                        <Link to={`/produsen/pengelolaan-pengiriman/detail/${data.id}/surat`} className="text-emerald-600 hover:underline font-medium">
                          Lihat Surat Pesanan
                        </Link>
                        <div className="text-right">
                          <p className="font-bold text-gray-900">Rp {(data.total_harga || 0).toLocaleString('id-ID')}</p>
                          <p className="text-xs text-gray-500">Via Transfer Bank</p>
                        </div>
                      </div>
                    </div>
                </div>

                {data.status === 'Pengembalian Diajukan' && (
                    <div className="mt-6 flex justify-end gap-4">
                        <button
                          // onClick={() => handleAction('Tolak')}
                          className="flex items-center gap-2 py-2 px-4 bg-gray-200 text-gray-800 font-semibold rounded-lg hover:bg-gray-300 transition"
                        >
                          <XCircle size={18} />
                          Tolak Pengembalian
                        </button>
                        <button
                          onClick={() => setShowModal(true)} // Tampilkan modal
                          className="flex items-center gap-2 py-2 px-4 bg-emerald-600 text-white font-semibold rounded-lg hover:bg-emerald-700 transition"
                        >
                          <CheckCircle size={18} />
                          Setujui Pengembalian
                        </button>
                    </div>
                )}
              </>
            )}
          </div>
        </main>
      </div>

      {/* Modal Konfirmasi */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl p-8 max-w-md w-full text-center">
            <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-red-100 mb-4">
              <AlertCircle className="h-10 w-10 text-red-600" />
            </div>
            <h3 className="text-xl font-bold text-gray-900">Apakah kamu yakin menerima pengajuan pengembalian pesanan?</h3>
            <p className="text-gray-500 mt-2 text-sm">
              Pengiriman akan dijadwalkan jika kamu menyetujui pengajuan pengembalian produk ini. Dana akan dikembalikan otomatis setelah kamu menerima produk.
            </p>
            <div className="mt-8 flex justify-center gap-4">
              <button
                onClick={() => setShowModal(false)}
                disabled={isActionLoading}
                className="py-2 px-6 bg-gray-100 text-gray-700 font-semibold rounded-lg hover:bg-gray-200"
              >
                Tolak Pengajuan
              </button>
              <button
                onClick={handleAction}
                disabled={isActionLoading}
                className="py-2 px-6 bg-emerald-600 text-white font-semibold rounded-lg hover:bg-emerald-700 flex items-center justify-center"
              >
                {isActionLoading ? <Loader2 className="animate-spin" /> : 'Terima Pengajuan'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default KonfirmasiPengembalian;