import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import NavbarApotek from '../../../components/NavbarApotek';
import { Search, History, Loader2, AlertTriangle, ArrowUpDown, FileText } from 'lucide-react';
import axios from 'axios';
import { toast } from 'react-hot-toast';

const RiwayatPenjualan = () => {
  const navigate = useNavigate();
  const [riwayatData, setRiwayatData] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const username = localStorage.getItem('username');

  useEffect(() => {
    const fetchRiwayat = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          toast.error('Sesi tidak valid.');
          navigate('/login/apotek');
          return;
        }
        const response = await axios.get('http://localhost:5000/api/apotek/penjualan/riwayat', {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (response.data.success) {
          setRiwayatData(response.data.data || []);
        } else {
          throw new Error(response.data.message || 'Gagal mengambil data riwayat.');
        }
      } catch (err) {
        const errorMsg = err.response?.data?.message || err.message;
        setError(errorMsg);
        toast.error(errorMsg);
        if (err.response?.status === 401) navigate('/login/apotek');
      } finally {
        setIsLoading(false);
      }
    };
    fetchRiwayat();
  }, [navigate]);

  const filteredData = useMemo(() => {
    return riwayatData.filter(
      (item) =>
        (item.nama_pelanggan?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
        (String(item.id) || '').includes(searchTerm.toLowerCase())
    );
  }, [riwayatData, searchTerm]);

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleString('id-ID', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const handleLogout = () => {
    localStorage.clear();
    navigate('/');
  };

  if (isLoading) {
    return (
      <div className="flex flex-col justify-center items-center h-screen bg-gradient-to-br from-slate-50 via-white to-emerald-50">
        <Loader2 className="animate-spin h-12 w-12 text-emerald-600" />
        <p className="mt-4 text-slate-700 font-medium">Memuat riwayat penjualan...</p>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-slate-50">
      <div className="flex-1 flex flex-col">
        <NavbarApotek onLogout={handleLogout} username={username} />

        <main className="flex-1 overflow-auto pt-[72px] px-4 sm:px-6 lg:px-8 py-8">
          <div className="max-w-7xl mx-auto">
            <div className="mb-10 relative">
              <div className="absolute -top-20 -left-20 w-72 h-72 bg-emerald-200 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob"></div>
              <div className="absolute -top-20 -right-20 w-72 h-72 bg-teal-200 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000"></div>
              <div className="relative flex items-center gap-3">
                <div className="flex items-center justify-center w-12 h-12 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl shadow-lg">
                  <History className="text-white" size={24} />
                </div>
                <div>
                  <h1 className="text-4xl font-bold bg-gradient-to-r from-slate-900 via-emerald-900 to-teal-900 bg-clip-text text-transparent">
                    Riwayat Penjualan
                  </h1>
                  <p className="text-slate-600 text-lg mt-1">
                    Daftar transaksi penjualan ke konsumen.
                  </p>
                </div>
              </div>
            </div>

            {error && (
              <div className="p-4 mb-6 bg-red-50 text-red-700 rounded-lg border border-red-200 flex items-center gap-2 text-sm">
                <AlertTriangle size={18} /> {error}
              </div>
            )}

            <div className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden relative z-10">
              <div className="p-4 border-b border-slate-200">
                <div className="relative flex-grow">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Cari ID Penjualan atau Nama Pelanggan..."
                    className="w-full pl-9 pr-4 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="min-w-full">
                  <thead className="bg-slate-50 border-b border-slate-200">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                        ID Penjualan
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                        Nama Pelanggan
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                        Tanggal
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                        Total Harga
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                        Apoteker
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                        Aksi
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-slate-100">
                    {filteredData.length > 0 ? (
                      filteredData.map((item) => (
                        <tr key={item.id} className="hover:bg-slate-50 transition-colors">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className="text-sm font-mono text-slate-900 bg-slate-100 px-2 py-1 rounded">
                              #{String(item.id).padStart(6, '0')}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-slate-900">
                            {item.nama_pelanggan}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">
                            {formatDate(item.tanggal_penjualan)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-emerald-700">
                            Rp {(item.total_harga || 0).toLocaleString('id-ID')}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">
                            {item.penanggung_jawab_apoteker}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <Link
                              to={`/apotek/penjualan/riwayat/${item.id}`}
                              className="text-sm font-medium text-emerald-600 hover:text-emerald-700 hover:underline transition-colors"
                            >
                              Lihat Detail & QR
                            </Link>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="6" className="text-center py-12">
                          <History size={48} className="mx-auto mb-3 text-slate-300" />
                          <p className="text-slate-500 font-medium">
                            {searchTerm
                              ? 'Tidak ada riwayat yang sesuai.'
                              : 'Belum ada riwayat penjualan.'}
                          </p>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </main>
      </div>
      <style jsx>{`
        @keyframes blob {
          0%,
          100% {
            transform: translate(0, 0) scale(1);
          }
          33% {
            transform: translate(30px, -50px) scale(1.1);
          }
          66% {
            transform: translate(-20px, 20px) scale(0.9);
          }
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

export default RiwayatPenjualan;
