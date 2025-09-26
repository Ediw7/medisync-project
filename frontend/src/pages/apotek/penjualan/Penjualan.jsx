import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import SidebarApotek from '../../../components/SidebarApotek'; // Pastikan path ini benar
import NavbarApotek from '../../../components/NavbarApotek';   // Pastikan path ini benar
import { Search, Trash2, QrCode } from 'lucide-react';

const Penjualan = () => {
  const navigate = useNavigate();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [keranjang, setKeranjang] = useState([
    { id: 1, nama: 'Antalgin tablet 500mg', batchId: 'ATG-0023', harga: 15000, jumlah: 3, total: 45000 },
    { id: 2, nama: 'Bodrex Ekstra 4 KPL 600mg', batchId: 'BDE-0044', harga: 5000, jumlah: 2, total: 10000 },
  ]);
  const [nominalBayar, setNominalBayar] = useState(100000);
  
  // Kalkulasi total
  const subtotal = keranjang.reduce((acc, item) => acc + item.total, 0);
  const pajak = 5000; // Contoh pajak statis
  const total = subtotal + pajak;
  const kembalian = nominalBayar > 0 ? nominalBayar - total : 0;

  return (
    <div className="flex min-h-screen bg-gray-50">
      <SidebarApotek isCollapsed={isCollapsed} setIsCollapsed={setIsCollapsed} />
      <div className={`flex-1 flex flex-col transition-all duration-300 ${isCollapsed ? 'ml-16' : 'ml-64'}`}>
        <NavbarApotek onLogout={() => { localStorage.clear(); navigate('/'); }} />
        <main className="flex-1 pt-16 p-6">
          <h1 className="text-2xl font-bold">Penjualan obat ke konsumen</h1>
          <p className="text-gray-500 mb-6">Pilih obat sesuai permintaan konsumen</p>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Kolom Kiri: Input dan Tabel */}
            <div className="lg:col-span-2 bg-white p-6 rounded-lg shadow">
              <div className="flex flex-col md:flex-row gap-4 mb-4">
                <div className="relative flex-grow">
                  <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input 
                    type="text" 
                    placeholder="Cari nama obat..." 
                    className="pl-10 pr-4 py-2 border rounded-lg text-sm w-full"
                  />
                </div>
                <div className="flex gap-4">
                    <input 
                        type="number" 
                        placeholder="Masukan jumlah" 
                        className="px-4 py-2 border rounded-lg text-sm w-full md:w-40"
                    />
                    <button className="bg-emerald-600 text-white py-2 px-4 rounded-lg hover:bg-emerald-700 transition text-sm font-semibold">
                        Tambahkan
                    </button>
                </div>
              </div>
              
              <div className="overflow-x-auto mt-6">
                <table className="min-w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Nama obat</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Harga Satuan</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Jumlah</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Total</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {keranjang.map(item => (
                      <tr key={item.id}>
                        <td className="px-4 py-3 whitespace-nowrap">
                            <p className="text-sm font-medium">{item.nama}</p>
                            <p className="text-xs text-gray-500">Batch ID: {item.batchId}</p>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm">Rp. {item.harga.toLocaleString('id-ID')}</td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm">{item.jumlah} pcs</td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm">Rp. {item.total.toLocaleString('id-ID')}</td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm">
                          <button className="text-red-500 hover:text-red-700">
                            <Trash2 size={18} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Kolom Kanan: Ringkasan Transaksi */}
            <div className="bg-white p-6 rounded-lg shadow h-fit">
              <h2 className="text-lg font-bold mb-4">Ringkasan Transaksi</h2>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Subtotal :</span>
                  <span className="font-medium">Rp. {subtotal.toLocaleString('id-ID')}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Pajak :</span>
                  <span className="font-medium">Rp. {pajak.toLocaleString('id-ID')}</span>
                </div>
                <div className="flex justify-between font-bold text-base border-t pt-3 mt-3">
                  <span>Total :</span>
                  <span>Rp. {total.toLocaleString('id-ID')}</span>
                </div>
              </div>

              <div className="mt-6">
                <p className="text-sm font-medium mb-2">Metode yang tersedia</p>
                <div className="flex gap-4">
                  <div className="w-20 h-20 border rounded-lg flex items-center justify-center bg-gray-100"></div>
                  <div className="w-20 h-20 border rounded-lg flex items-center justify-center bg-gray-100"></div>
                </div>
              </div>

              <div className="mt-6">
                <label className="text-sm font-medium">Nominal yang dibayarkan</label>
                <input 
                  type="number"
                  value={nominalBayar}
                  onChange={(e) => setNominalBayar(Number(e.target.value))}
                  className="w-full mt-1 px-4 py-2 border rounded-lg" 
                />
              </div>

              <div className="flex justify-between mt-4">
                  <span className="text-gray-600">Kembalian:</span>
                  <span className="font-bold text-lg text-emerald-600">Rp. {kembalian.toLocaleString('id-ID')}</span>
              </div>
              
              <div className="mt-6 space-y-3">
                 <button className="w-full bg-emerald-600 text-white py-3 rounded-lg hover:bg-emerald-700 transition font-semibold">
                    Proses Pembayaran
                 </button>
                 <button className="w-full border border-emerald-600 text-emerald-600 py-3 rounded-lg hover:bg-emerald-50 transition font-semibold flex items-center justify-center gap-2">
                    <QrCode size={18} />
                    Scan QR Code
                 </button>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default Penjualan;