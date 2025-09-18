import React, { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import SidebarPbf from '../../../components/SidebarPbf';
import NavbarPbf from '../../../components/NavbarPbf';
import { AlertCircle, Loader2 } from 'lucide-react'; // Impor Loader2

const BatalPesanan = () => {
  const navigate = useNavigate();
  const { id } = useParams(); // ID Pesanan yang akan dibatalkan
  const [isCollapsed, setIsCollapsed] = useState(false);

  const reasonsList = [
    'Ingin mengubah alamat pengiriman',
    'Ingin memesan ulang dengan detail yang berbeda',
    'Produk atau layanan tidak sesuai dengan yang diharapkan',
    'Lainnya/ berubah pikiran',
  ];

  const [selectedReasons, setSelectedReasons] = useState(['Lainnya/ berubah pikiran']);
  
  // State untuk error dinamis dari API
  const [error, setError] = useState(
    'Mohon pilih alasan pematalan. Pesananmu akan langsung dibatalkan setelah alasan pembatalan diajukan'
  );
  const [isSubmitting, setIsSubmitting] = useState(false); // State untuk loading

  const handleLogout = () => {
    localStorage.clear();
    navigate('/');
  };

  const handleCheckboxChange = (reason) => {
    setSelectedReasons((prev) => {
      if (prev.includes(reason)) {
        return prev.filter((r) => r !== reason);
      } else {
        return [...prev, reason];
      }
    });
  };

  // --- INI ADALAH FUNGSI PENTING YANG MEMANGGIL BACKEND ---
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null); // Bersihkan error sebelumnya
    setIsSubmitting(true);

    if (selectedReasons.length === 0) {
      setError('Anda harus memilih setidaknya satu alasan pembatalan.');
      setIsSubmitting(false);
      return;
    }

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        navigate('/login/pbf'); // Jika token tidak ada, lempar ke login
        return;
      }

      // Memanggil API Backend (fungsi batalkanPesanan di pesananController.js)
      const response = await fetch(`http://localhost:5000/api/pbf/pesanan/${id}/request-batalkan`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          alasanPembatalan: selectedReasons, // Kirim array alasan
        }),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        // Tampilkan error dari backend (misal: "Pesanan sudah dikirim")
        throw new Error(result.message || 'Gagal terhubung ke server.');
      }

      // Jika sukses
      alert('Pesanan berhasil dibatalkan dan status diubah menjadi Dikembalikan.');
      navigate('/pbf/pesan-obat'); // Kembali ke daftar pesanan

    } catch (err) {
      setError(err.message); // Tampilkan error di kotak merah
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-gray-100">
      <SidebarPbf isCollapsed={isCollapsed} setIsCollapsed={setIsCollapsed} />
      <div className={`flex-1 flex flex-col transition-all duration-300 ${isCollapsed ? 'ml-16' : 'ml-64'}`}>
        <NavbarPbf onLogout={handleLogout} />
        <main className="flex-1 pt-16 p-6">
          <div className="max-w-3xl mx-auto">
            
            <div className="mb-6">
              <h1 className="text-3xl font-bold text-gray-800">Pilih Alasan Pembatalan</h1>
              <p className="text-gray-500 mt-1">Pesanan ID: {String(id).padStart(6, '0')}</p>
            </div>

            {/* Alert Box Merah (sekarang dinamis) */}
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

                {/* Tombol Aksi */}
                <div className="flex justify-end gap-4 mt-10 pt-6 border-t border-gray-200">
                  <button
                    type="button"
                    onClick={() => navigate(-1)} // Kembali
                    className="py-2 px-6 bg-gray-100 text-gray-700 font-semibold rounded-lg hover:bg-gray-200 transition"
                    disabled={isSubmitting} // Nonaktifkan saat loading
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    className="py-2 px-6 bg-emerald-600 text-white font-semibold rounded-lg hover:bg-emerald-700 transition flex items-center gap-2 disabled:bg-emerald-300"
                    disabled={isSubmitting} // Nonaktifkan saat loading
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Memproses...
                      </>
                    ) : (
                      'Konfirmasi'
                    )}
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