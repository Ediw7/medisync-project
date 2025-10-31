import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import SidebarPbf from '../../../components/SidebarPbf';
import NavbarPbf from '../../../components/NavbarPbf';
import { Building, Loader2, AlertTriangle, Factory, Mail, MapPin, ArrowRight } from 'lucide-react';

const PilihProdusen = () => {
  const navigate = useNavigate();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [produsenList, setProdusenList] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchProdusen = async () => {
      setIsLoading(true);
      try {
        const token = localStorage.getItem('token');
        if (!token) navigate('/login/pbf');
        const response = await fetch('http://localhost:5000/api/pbf/produsen', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const result = await response.json();
        if (result.success) {
          setProdusenList(result.data);
        } else {
          throw new Error(result.message || 'Gagal memuat daftar produsen.');
        }
      } catch (err) {
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };
    fetchProdusen();
  }, [navigate]);

  const handleProdusenSelect = (produsenId) => {
    navigate(`/pbf/pesan-obat/tambah/${produsenId}`);
  };

  if (isLoading) {
    return (
      <div className="flex flex-col justify-center items-center h-screen bg-gradient-to-br from-slate-50 via-white to-emerald-50">
        <div className="relative">
          <Loader2 className="animate-spin h-12 w-12 text-emerald-600" />
          <div className="absolute inset-0 h-12 w-12 rounded-full border-4 border-emerald-200 animate-ping opacity-20"></div>
        </div>
        <p className="mt-4 text-slate-700 font-medium">Memuat daftar produsen...</p>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-slate-50 via-white to-emerald-50">
      <SidebarPbf isCollapsed={isCollapsed} setIsCollapsed={setIsCollapsed} />
      <div className={`flex-1 flex flex-col transition-all duration-300 ${isCollapsed ? 'ml-16' : 'ml-64'}`}>
        <NavbarPbf onLogout={() => { localStorage.clear(); navigate('/'); }} />
        
        <main className="flex-1 overflow-auto pt-[72px] px-12 py-8">
          <div className="max-w-7xl mx-auto">
            

            <div className="mb-10 relative">
              <div className="absolute -top-20 -left-20 w-72 h-72 bg-emerald-200 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob"></div>
              <div className="absolute -top-20 -right-20 w-72 h-72 bg-teal-200 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000"></div>
              
              <div className="relative">
                <div className="flex items-center gap-3 mb-3">
                  <div className="flex items-center justify-center w-12 h-12 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl shadow-lg">
                    <Factory className="text-white" size={24} />
                  </div>
                  <div>
                    <h1 className="text-4xl font-bold bg-gradient-to-r from-slate-900 via-emerald-900 to-teal-900 bg-clip-text text-transparent">
                      Pesan Obat ke Produsen
                    </h1>
                    <p className="text-slate-600 text-lg mt-1">Pilih produsen yang dituju</p>
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
              {produsenList.length > 0 ? (
                produsenList.map(p => (
                  <div 
                    key={p.id} 
                    onClick={() => handleProdusenSelect(p.id)} 
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
                              {p.nama_resmi}
                            </h2>
                          </div>
                        </div>
                        <ArrowRight className="text-slate-300 group-hover:text-emerald-600 group-hover:translate-x-1 transition-all duration-300 flex-shrink-0" size={20} />
                      </div>
                      
                      {/* Info Details */}
                      <div className="space-y-2">
                        <div className="flex items-start gap-2 text-sm text-slate-600">
                          <MapPin size={16} className="text-slate-400 mt-0.5 flex-shrink-0" />
                          <span className="line-clamp-2">{p.alamat}</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-slate-600">
                          <Mail size={16} className="text-slate-400 flex-shrink-0" />
                          <span className="truncate">{p.email}</span>
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
                <div className="col-span-full text-center py-12">
                  <Factory size={48} className="mx-auto mb-4 text-slate-300" />
                  <p className="text-slate-500 text-lg">Tidak ada produsen tersedia saat ini</p>
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

export default PilihProdusen;