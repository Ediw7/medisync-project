import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import NavbarApotek from '../../../components/NavbarApotek';
import {
  Building,
  ChevronRight,
  Loader2,
  AlertTriangle,
  ArrowLeft,
  ShoppingCart, // Untuk header
  Factory, // Untuk fallback
  Mail, // Untuk info card
  MapPin, // Untuk info card
  ArrowRight // Untuk info card
} from 'lucide-react';
import axios from 'axios';
import { toast } from 'react-hot-toast';

const PilihPbf = () => {
  const navigate = useNavigate();
  const [pbfList, setPbfList] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const username = localStorage.getItem('username');

  useEffect(() => {
    const fetchPbf = async () => {
      setIsLoading(true);
      setError('');
      let token;
      try {
        token = localStorage.getItem('token');
        if (!token) {
            navigate('/login/apotek');
            return;
        };
        const response = await axios.get('http://localhost:5000/api/apotek/pbf', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (response.data.success) {
          setPbfList(response.data.data || []);
        } else {
          throw new Error(response.data.message || 'Gagal memuat daftar PBF.');
        }
      } catch (err) {
         const errorMsg = err.response?.data?.message || err.message || 'Gagal memuat daftar PBF.';
        setError(errorMsg);
        toast.error(errorMsg);
        if ((err.message.includes('401') || err.message.includes('403') || err.message.includes('login')) && token) {
            navigate('/login/apotek');
        } else if (!token) {
             navigate('/login/apotek');
        }
      } finally {
        setIsLoading(false);
      }
    };
    fetchPbf();
  }, [navigate]);

  const handlePbfSelect = (pbf) => {
    navigate(`/apotek/pesan-obat/tambah/${pbf.id}`, {
      state: {
        namaPbf: pbf.nama_resmi,
        alamatPbf: pbf.alamat
      }
    });
  };

  const handleLogout = () => {
    localStorage.clear();
    navigate('/');
  };

  if (isLoading) {
    return (
       <div className="flex flex-col justify-center items-center h-screen bg-gradient-to-br from-slate-50 via-white to-emerald-50">
          <div className="relative">
            <Loader2 className="animate-spin h-12 w-12 text-emerald-600" />
            <div className="absolute inset-0 h-12 w-12 rounded-full border-4 border-emerald-200 animate-ping opacity-20"></div>
          </div>
          <p className="mt-4 text-slate-700 font-medium">Memuat daftar PBF...</p>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-slate-50">
      <div className="flex-1 flex flex-col">
        <NavbarApotek onLogout={handleLogout} username={username} />

        <main className="flex-1 overflow-auto pt-[72px] px-12 py-8">
           <div className="max-w-7xl mx-auto">
              
              <div className="mb-10 relative">
                <div className="absolute -top-20 -left-20 w-72 h-72 bg-emerald-200 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob"></div>
                <div className="absolute -top-20 -right-20 w-72 h-72 bg-teal-200 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000"></div>
                
                <div className="relative">
                  <button
                    onClick={() => navigate('/apotek/pesan-obat')}
                    className="mb-4 inline-flex items-center text-emerald-600 hover:text-emerald-700 transition-colors text-sm font-medium"
                  >
                    <ArrowLeft size={16} className="mr-1" /> Kembali ke Daftar Pesanan
                  </button>
                  <div className="flex items-center gap-3 mb-3">
                    <div className="flex items-center justify-center w-12 h-12 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl shadow-lg">
                      <ShoppingCart className="text-white" size={24} />
                    </div>
                    <div>
                      <h1 className="text-4xl font-bold bg-gradient-to-r from-slate-900 via-emerald-900 to-teal-900 bg-clip-text text-transparent">
                        Pesan Obat
                      </h1>
                      <p className="text-slate-600 text-lg mt-1">Pilih Pedagang Besar Farmasi (PBF) tujuan.</p>
                    </div>
                  </div>
                </div>
              </div>

              {error && (
                 <div className="p-4 mb-6 bg-red-50 text-red-700 rounded-2xl border border-red-200 flex items-center gap-3 shadow-sm">
                   <AlertTriangle size={20} />
                   <span className="font-medium">{error}</span>
                 </div>
               )}

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 relative z-10">
                {pbfList.length > 0 ? (
                  pbfList.map(pbf => (
                    <div 
                      key={pbf.id} 
                      onClick={() => handlePbfSelect(pbf)} 
                      className="group relative bg-white p-6 rounded-2xl shadow-sm border border-slate-200 hover:shadow-xl hover:border-emerald-300 transition-all duration-300 cursor-pointer overflow-hidden"
                    >
                      <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-emerald-500 to-teal-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                      
                      <div className="relative">
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex items-center gap-3">
                            <div className="p-3 rounded-xl bg-gradient-to-br from-emerald-100 to-teal-100 group-hover:from-emerald-500 group-hover:to-teal-600 transition-all duration-300">
                              <Building className="text-emerald-600 group-hover:text-white transition-colors duration-300" size={24} />
                            </div>
                            <div className="flex-1">
                              <h2 className="font-bold text-lg text-slate-900 group-hover:text-emerald-700 transition-colors line-clamp-1">
                                {pbf.nama_resmi}
                              </h2>
                            </div>
                          </div>
                          <ArrowRight className="text-slate-300 group-hover:text-emerald-600 group-hover:translate-x-1 transition-all duration-300 flex-shrink-0" size={20} />
                        </div>
                        
                        <div className="space-y-2">
                          <div className="flex items-start gap-2 text-sm text-slate-600">
                            <MapPin size={16} className="text-slate-400 mt-0.5 flex-shrink-0" />
                            <span className="line-clamp-2">{pbf.alamat || 'Alamat tidak tersedia'}</span>
                          </div>
                          <div className="flex items-center gap-2 text-sm text-slate-600">
                            <Mail size={16} className="text-slate-400 flex-shrink-0" />
                            <span className="truncate">{pbf.email || 'Email tidak tersedia'}</span>
                          </div>
                        </div>
                        
                        <div className="mt-4 pt-4 border-t border-slate-100">
                          <p className="text-xs text-slate-400 group-hover:text-emerald-600 transition-colors text-center font-medium">
                            Klik untuk melanjutkan pesanan
                          </p>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                   <div className="col-span-full text-center py-16 bg-white rounded-lg shadow-sm border border-dashed border-slate-300">
                      <Building size={48} className="mx-auto mb-3 text-slate-300" />
                      <p className="text-slate-500 text-lg font-medium">Tidak ada PBF yang terdaftar saat ini.</p>
                       <p className="text-sm text-slate-400 mt-1">Hubungi administrator jika ini adalah kesalahan.</p>
                   </div>
                )}
              </div>
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

export default PilihPbf;