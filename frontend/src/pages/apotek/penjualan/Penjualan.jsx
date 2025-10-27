import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import NavbarApotek from '../../../components/NavbarApotek';
import { Search, Trash2, QrCode, ShoppingCart, Plus } from 'lucide-react';

const Penjualan = () => {
  const navigate = useNavigate();
  const [keranjang, setKeranjang] = useState([
    { id: 1, nama: 'Antalgin tablet 500mg', batchId: 'ATG-0023', harga: 15000, jumlah: 3, total: 45000 },
    { id: 2, nama: 'Bodrex Ekstra 4 KPL 600mg', batchId: 'BDE-0044', harga: 5000, jumlah: 2, total: 10000 },
  ]);
  const [nominalBayar, setNominalBayar] = useState(100000);
  
  const subtotal = keranjang.reduce((acc, item) => acc + item.total, 0);
  const pajak = 5000;
  const total = subtotal + pajak;
  const kembalian = nominalBayar > 0 ? nominalBayar - total : 0;

  const handleLogout = () => {
    localStorage.clear();
    navigate('/');
  };

  const handleHapusItem = (id) => {
    setKeranjang(keranjang.filter(item => item.id !== id));
  };

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-slate-50 via-white to-emerald-50">
      <div className="flex-1 flex flex-col">
        <NavbarApotek onLogout={handleLogout} />
        
        <main className="flex-1 overflow-auto pt-[72px]">
          <div className="max-w-7xl mx-auto px-6 py-8">
            {/* Header */}
            <div className="mb-8">
              <h1 className="text-3xl font-bold text-slate-900 mb-2">Penjualan Obat</h1>
              <p className="text-slate-600">Pilih obat sesuai permintaan konsumen</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Kolom Kiri: Input dan Tabel */}
              <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="p-6 border-b border-slate-200">
                  <div className="flex flex-col md:flex-row gap-4">
                    <div className="relative flex-grow">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                      <input 
                        type="text" 
                        placeholder="Cari nama obat..." 
                        className="w-full pl-10 pr-4 py-2.5 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
                      />
                    </div>
                    <div className="flex gap-3">
                      <input 
                        type="number" 
                        placeholder="Jumlah" 
                        className="w-full md:w-32 px-4 py-2.5 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all"
                      />
                      <button className="flex items-center gap-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white px-5 py-2.5 rounded-xl font-medium shadow-lg hover:shadow-xl transition-all duration-200 whitespace-nowrap">
                        <Plus size={18} />
                        Tambah
                      </button>
                    </div>
                  </div>
                </div>
                
                <div className="overflow-x-auto">
                  <table className="min-w-full">
                    <thead>
                      <tr className="border-b-2 border-slate-200 bg-slate-50">
                        <th className="px-6 py-4 text-left text-xs font-bold text-slate-600 uppercase tracking-wider">Nama Obat</th>
                        <th className="px-6 py-4 text-left text-xs font-bold text-slate-600 uppercase tracking-wider">Harga Satuan</th>
                        <th className="px-6 py-4 text-left text-xs font-bold text-slate-600 uppercase tracking-wider">Jumlah</th>
                        <th className="px-6 py-4 text-left text-xs font-bold text-slate-600 uppercase tracking-wider">Total</th>
                        <th className="px-6 py-4 text-left text-xs font-bold text-slate-600 uppercase tracking-wider">Aksi</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {keranjang.length > 0 ? keranjang.map(item => (
                        <tr key={item.id} className="hover:bg-slate-50 transition-colors">
                          <td className="px-6 py-4">
                            <p className="text-sm font-semibold text-slate-900">{item.nama}</p>
                            <p className="text-xs text-slate-500 font-mono bg-slate-100 px-2 py-0.5 rounded inline-block mt-1">
                              Batch: {item.batchId}
                            </p>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-700">
                            Rp {item.harga.toLocaleString('id-ID')}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className="text-sm font-medium text-emerald-700 bg-emerald-50 px-3 py-1 rounded-lg">
                              {item.jumlah} pcs
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-slate-900">
                            Rp {item.total.toLocaleString('id-ID')}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <button 
                              onClick={() => handleHapusItem(item.id)}
                              className="text-red-500 hover:text-red-700 hover:bg-red-50 p-2 rounded-lg transition-all"
                            >
                              <Trash2 size={18} />
                            </button>
                          </td>
                        </tr>
                      )) : (
                        <tr>
                          <td colSpan="5" className="text-center py-12">
                            <ShoppingCart size={48} className="mx-auto mb-3 text-slate-300" />
                            <p className="text-slate-500 font-medium">Keranjang masih kosong</p>
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Kolom Kanan: Ringkasan Transaksi */}
              <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 h-fit sticky top-24">
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-2 bg-emerald-100 rounded-lg">
                    <ShoppingCart className="text-emerald-600" size={20} />
                  </div>
                  <h2 className="text-xl font-bold text-slate-900">Ringkasan Transaksi</h2>
                </div>

                <div className="space-y-3 text-sm mb-6">
                  <div className="flex justify-between py-2">
                    <span className="text-slate-600">Subtotal</span>
                    <span className="font-semibold text-slate-900">Rp {subtotal.toLocaleString('id-ID')}</span>
                  </div>
                  <div className="flex justify-between py-2">
                    <span className="text-slate-600">Pajak</span>
                    <span className="font-semibold text-slate-900">Rp {pajak.toLocaleString('id-ID')}</span>
                  </div>
                  <div className="flex justify-between py-3 border-t-2 border-slate-200 mt-3">
                    <span className="font-bold text-base text-slate-900">Total</span>
                    <span className="font-bold text-lg text-slate-900">Rp {total.toLocaleString('id-ID')}</span>
                  </div>
                </div>

                <div className="mb-6 pb-6 border-b border-slate-200">
                  <p className="text-sm font-semibold text-slate-700 mb-3">Metode Pembayaran</p>
                  <div className="flex gap-3">
                    <div className="flex-1 h-20 border-2 border-slate-200 rounded-xl flex items-center justify-center bg-slate-50 hover:border-emerald-500 hover:bg-emerald-50 cursor-pointer transition-all">
                      <span className="text-xs font-medium text-slate-600">Cash</span>
                    </div>
                    <div className="flex-1 h-20 border-2 border-slate-200 rounded-xl flex items-center justify-center bg-slate-50 hover:border-emerald-500 hover:bg-emerald-50 cursor-pointer transition-all">
                      <span className="text-xs font-medium text-slate-600">QRIS</span>
                    </div>
                  </div>
                </div>

                <div className="mb-4">
                  <label className="text-sm font-semibold text-slate-700 mb-2 block">
                    Nominal yang dibayarkan
                  </label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-600 font-medium">Rp</span>
                    <input 
                      type="number"
                      value={nominalBayar}
                      onChange={(e) => setNominalBayar(Number(e.target.value))}
                      className="w-full pl-12 pr-4 py-3 border-2 border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all font-semibold text-slate-900"
                    />
                  </div>
                </div>

                <div className="flex justify-between items-center py-3 px-4 bg-emerald-50 rounded-xl mb-6">
                  <span className="text-slate-700 font-medium">Kembalian</span>
                  <span className="font-bold text-xl text-emerald-600">
                    Rp {kembalian.toLocaleString('id-ID')}
                  </span>
                </div>
                
                <div className="space-y-3">
                  <button className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white py-3 rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all duration-200">
                    Proses Pembayaran
                  </button>
                  <button className="w-full border-2 border-emerald-600 text-emerald-600 py-3 rounded-xl hover:bg-emerald-50 transition-all font-semibold flex items-center justify-center gap-2">
                    <QrCode size={18} />
                    Scan QR Code
                  </button>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default Penjualan;