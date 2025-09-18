import React, { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import SidebarPbf from '../../../components/SidebarPbf';
import NavbarPbf from '../../../components/NavbarPbf';
import { AlertCircle, Loader2 } from 'lucide-react';
import axios from 'axios';

const BatalPesanan = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const [isCollapsed, setIsCollapsed] = useState(false);

  const reasonsList = [
    'Ingin mengubah alamat pengiriman',
    'Ingin memesan ulang dengan detail yang berbeda',
    'Produk atau layanan tidak sesuai dengan yang diharapkan',
    'Lainnya/ berubah pikiran',
  ];

  const [selectedReasons, setSelectedReasons] = useState([]);
  const [error, setError] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleCheckboxChange = (reason) => {
    setSelectedReasons((prev) =>
      prev.includes(reason)
        ? prev.filter((r) => r !== reason)
        : [...prev, reason]
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    if (selectedReasons.length === 0) {
      setError('Anda harus memilih setidaknya satu alasan pembatalan.');
      setIsSubmitting(false);
      return;
    }

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        navigate('/login/pbf');
        return;
      }

      const response = await axios.put(`http://localhost:5000/api/pbf/pesanan/${id}/request-batalkan`, {
        alasan: selectedReasons.join(', '),
      }, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.data.success) {
        throw new Error(response.data.message || 'Gagal terhubung ke server.');
      }

      alert('Pengajuan pembatalan berhasil dikirim.');
      navigate('/pbf/pesan-obat');
    } catch (err) {
      setError(err.response?.data?.message || err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-gray-100">
      <SidebarPbf isCollapsed={isCollapsed} setIsCollapsed={setIsCollapsed} />
      <div className={`flex-1 flex flex-col transition-all duration-300 ${isCollapsed ? 'ml-16' : 'ml-64'}`}>
        <NavbarPbf onLogout={() => { localStorage.clear(); navigate('/'); }} />
        <main className="flex-1 pt-16 p-6">
          <div className="max-w-3xl mx-auto">
            <div className="mb-6">
              <h1 className="text-3xl font-bold text-gray-800">Pilih Alasan Pembatalan</h1>
              <p className="text-gray-500 mt-1">Pesanan ID: {String(id).padStart(6, '0')}</p>
            </div>

            {error && (
              <div className="mb-6 p-4 bg-red-100 text-red-700 rounded-lg flex items-center gap-3">
                <AlertCircle className="h-5 w-5 flex-shrink-0" />
                <span className="text-sm">{error}</span>
              </div>
            )}

            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
              <form onSubmit={handleSubmit}>
                <div className="space-y-5">
                  {reasonsList.map((reason) => (
                    <label key={reason} htmlFor={reason} className="flex items-center gap-3 cursor-pointer">
                      <input
                        type="checkbox"
                        id={reason}
                        name="alasan_pembatalan"
                        value={reason}
                        checked={selectedReasons.includes(reason)}
                        onChange={() => handleCheckboxChange(reason)}
                        className="h-5 w-5 text-emerald-600 rounded border-gray-300 focus:ring-emerald-500"
                      />
                      <span className="text-base text-gray-700">{reason}</span>
                    </label>
                  ))}
                </div>

                <div className="flex justify-end gap-4 mt-10 pt-6 border-t border-gray-200">
                  <button
                    type="button"
                    onClick={() => navigate(-1)}
                    className="py-2 px-6 bg-gray-100 text-gray-700 font-semibold rounded-lg hover:bg-gray-200 transition"
                    disabled={isSubmitting}
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    className="py-2 px-6 bg-emerald-600 text-white font-semibold rounded-lg hover:bg-emerald-700 transition flex items-center gap-2 disabled:bg-emerald-300"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                    {isSubmitting ? 'Memproses...' : 'Konfirmasi'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default BatalPesanan;