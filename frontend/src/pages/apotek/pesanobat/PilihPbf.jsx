import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import NavbarApotek from '../../../components/NavbarApotek';
import { Building, ChevronRight, Loader2, AlertTriangle, ArrowLeft } from 'lucide-react';
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

        <main className="flex-1 overflow-auto pt-[72px]">
           <div className="max-w-7xl mx-auto px-6 py-8">
              <div className="mb-8">
                 <button
                    onClick={() => navigate('/apotek/pesan-obat')}
                    className="mb-4 inline-flex items-center text-emerald-600 hover:text-emerald-700 transition-colors text-sm font-medium"
                  >
                    <ArrowLeft size={16} className="mr-1" /> Kembali ke Daftar Pesanan
                  </button>
                <h1 className="text-4xl font-bold text-slate-900 mb-2">Pesan Obat</h1>
                <p className="text-slate-600">Langkah 1: Pilih Pedagang Besar Farmasi (PBF) tujuan pesanan.</p>
              </div>

              {error && (
                 <div className="p-4 mb-6 bg-red-50 text-red-700 rounded-lg border border-red-200 flex items-center gap-2 text-sm">
                   <AlertTriangle size={18} /> {error}
                 </div>
               )}

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {pbfList.map(pbf => (
                  <div
                    key={pbf.id}
                    onClick={() => handlePbfSelect(pbf)}
                    className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 hover:shadow-lg hover:border-emerald-300 hover:scale-[1.02] transition-all duration-300 cursor-pointer group flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-center gap-4 mb-4">
                          <div className="flex-shrink-0  bg-gradient-to-br from-emerald-500 to-teal-600 p-3 rounded-lg border border-emerald-200">
                              <Building className="text-white" size={24} />
                          </div>
                          <h2 className="font-bold text-lg text-slate-800 leading-tight">{pbf.nama_resmi}</h2>
                      </div>
                      <div className="space-y-1 text-sm text-slate-600">
                         <p className="line-clamp-2">{pbf.alamat || 'Alamat tidak tersedia'}</p>
                         <p className="text-slate-500">{pbf.email || 'Email tidak tersedia'}</p>
                      </div>
                    </div>
                     <div className="flex justify-end mt-4">
                       <ChevronRight className="text-slate-300 group-hover:text-emerald-500 group-hover:translate-x-1 transition-all duration-300" size={24}/>
                     </div>
                  </div>
                ))}

                {pbfList.length === 0 && !isLoading && (
                   <div className="md:col-span-2 lg:col-span-3 text-center py-16 bg-white rounded-lg shadow-sm border border-dashed border-slate-300">
                      <Building size={48} className="mx-auto mb-3 text-slate-300" />
                      <p className="text-slate-500 font-medium">Tidak ada PBF yang terdaftar saat ini.</p>
                       <p className="text-xs text-slate-400 mt-1">Hubungi administrator jika ini adalah kesalahan.</p>
                   </div>
                  )}
              </div>
          </div>
        </main>
      </div>
       <style jsx global>{`
        /* Remove blob animation styles if they were here */
      `}</style>
    </div>
  );
};

export default PilihPbf;