import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import SidebarApotek from '../../../components/SidebarApotek';
import NavbarApotek from '../../../components/NavbarApotek';
import { Building, ChevronRight } from 'lucide-react';
import axios from 'axios';

const PilihPbf = () => {
  const navigate = useNavigate();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [pbfList, setPbfList] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchPbf = async () => {
      setIsLoading(true);
      try {
        const token = localStorage.getItem('token');
        if (!token) {
            navigate('/login/apotek');
            return;
        };
        const response = await axios.get('http://localhost:5000/api/apotek/pbf', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (response.data.success) {
          setPbfList(response.data.data);
        } else {
          throw new Error(response.data.message || 'Gagal memuat daftar PBF.');
        }
      } catch (err) {
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };
    fetchPbf();
  }, [navigate]);

const handlePbfSelect = (pbf) => {
    // Sekarang mengirimkan state yang berisi NAMA dan ALAMAT PBF
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

  return (
    <div className="flex min-h-screen bg-gray-50">
      <SidebarApotek isCollapsed={isCollapsed} setIsCollapsed={setIsCollapsed} />
      <div className={`flex-1 flex flex-col transition-all duration-300 ${isCollapsed ? 'ml-16' : 'ml-64'}`}>
        <NavbarApotek onLogout={handleLogout} />
        <main className="pt-16 p-6">
          <div className="mb-6">
            <h1 className="text-2xl font-bold">Pesan Obat</h1>
            <p className="text-gray-500">Langkah 1: Pilih Pedagang Besar Farmasi (PBF) tujuan.</p>
          </div>
          {error && <div className="p-4 mb-4 bg-red-100 text-red-700 rounded-lg">{error}</div>}
          {isLoading ? (
            <p className="text-gray-500">Memuat daftar PBF...</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {pbfList.map(p => (
                <div 
                  key={p.id} 
                  onClick={() => handlePbfSelect(p)} 
                  className="bg-white p-6 rounded-lg shadow-md hover:shadow-xl hover:-translate-y-1 transition-all cursor-pointer group"
                >
                  <div className="flex items-start justify-between">
                    <div>
                        <div className="flex items-center gap-4 mb-3">
                            <div className="bg-emerald-100 p-3 rounded-full">
                                <Building className="text-emerald-600" size={24} />
                            </div>
                            <h2 className="font-bold text-lg text-gray-800">{p.nama_resmi}</h2>
                        </div>
                        <p className="text-sm text-gray-500">{p.alamat}</p>
                        <p className="text-sm text-gray-500 mt-1">{p.email}</p>
                    </div>
                    <ChevronRight className="text-gray-400 group-hover:text-emerald-600 transition-colors" size={24}/>
                  </div>
                </div>
              ))}
               {pbfList.length === 0 && (
                 <div className="col-span-full text-center py-10 bg-white rounded-lg shadow-md">
                    <p className="text-gray-500">Tidak ada PBF yang terdaftar.</p>
                 </div>
                )}
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default PilihPbf;