import React from 'react';
import { Routes, Route } from 'react-router-dom';
import LandingPage from './pages/LandingPage';
import PilihRole from './pages/PilihRole';
import LoginPage from './pages/LoginPage';
import ForgotPasswordPage from './pages/ForgotPasswordPage';
import ResetPasswordPage from './pages/ResetPasswordPage'; 
import RegisterPage from './pages/RegisterPage';

import ProdusenDashboard from './pages/produsen/ProdusenDashboard';
import ManajemenProduksi from './pages/produsen/manajemenproduksi/ManajemenProduksi';
import TambahProduksi from './pages/produsen/manajemenproduksi/TambahProduksi';
import EditProduksi from './pages/produsen/manajemenproduksi/EditProduksi';
import DetailProduksi from './pages/produsen/manajemenproduksi/DetailProduksi';
import RiwayatProduksi from './pages/produsen/manajemenproduksi/RiwayatProduksi';

import MonitoringStok from './pages/produsen/monitoringstok/MonitoringStok';
import RiwayatDistribusi from './pages/produsen/monitoringstok/RiwayatDistribusi';
import DetailStok from './pages/produsen/monitoringstok/DetailStok';

import PengelolaanPengiriman from './pages/produsen/pengelolaanpengiriman/PengelolaanPengiriman';
import PerluDikirim from './pages/produsen/pengelolaanpengiriman/PerluDikirim';
import Dikirim from './pages/produsen/pengelolaanpengiriman/Dikirim';
import Selesai from './pages/produsen/pengelolaanpengiriman/Selesai';
import Pembatalan from './pages/produsen/pengelolaanpengiriman/Pembatalan';
import Pengembalian from './pages/produsen/pengelolaanpengiriman/Pengembalian';
import SuratPesanan from './pages/produsen/pengelolaanpengiriman/SuratPesanan';
import AturPengiriman from './pages/produsen/pengelolaanpengiriman/AturPengiriman';
import RincianPengiriman from './pages/produsen/pengelolaanpengiriman/RincianPengiriman';
import SuratJalanProdusen from './pages/produsen/pengelolaanpengiriman/SuratJalanProdusen';
import LihatStatus from './pages/produsen/pengelolaanpengiriman/LihatStatus';
import LihatRiwayat from './pages/produsen/pengelolaanpengiriman/LihatRiwayat';

import LaporanAnalitik from './pages/produsen/laporananalitik/LaporanAnalitik';

import PbfDashboard from './pages/pbf/PbfDashboard';
import PesanObat from './pages/pbf/pesanobat/PesanObat';
import PilihProdusen from './pages/pbf/pesanobat/PilihProdusen';
import TambahPesanan from './pages/pbf/pesanobat/TambahPesanan';
import DetailPesanan from './pages/pbf/pesanobat/DetailPesanan';
import BatalPesanan from './pages/pbf/pesanobat/BatalPesanan';


import MonitoringStokPbf from './pages/pbf/monitoringstok/MonitoringStokPbf';


import ApotekDashboard from './pages/apotek/ApotekDashboard';
import StokObat from './pages/apotek/stokobat/StokObat';
import PesanObatApotek from './pages/apotek/pesanobat/PesanObatApotek';


function App() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/roles" element={<PilihRole />} />
      <Route path="/login/:role" element={<LoginPage />} />
      <Route path="/forgot-password" element={<ForgotPasswordPage />} />
      <Route path="/reset-password/:token" element={<ResetPasswordPage />} />
      <Route path="/register/:role" element={<RegisterPage />} />
      
       {/* Rute Produsen */}
      <Route path="/produsen/dashboard" element={<ProdusenDashboard />} />
      <Route path="/produsen/manajemen-produksi" element={<ManajemenProduksi />} />
      <Route path="/produsen/produksi/tambah" element={<TambahProduksi />} />
      <Route path="/produsen/produksi/edit/:id" element={<EditProduksi />} />
      <Route path="/produsen/produksi/detail/:id" element={<DetailProduksi />} />
      <Route path="/produsen/riwayat-produksi" element={<RiwayatProduksi />} />

      <Route path="/produsen/monitoring-stok" element={<MonitoringStok />} />
      <Route path="/produsen/riwayat-distribusi" element={<RiwayatDistribusi />} /> 
      <Route path="/produsen/produksi/detailstok/:id" element={<DetailStok />} />
    

       <Route path="/produsen/pengelolaan-pengiriman" element={<PengelolaanPengiriman />} />
      <Route path="/produsen/pengelolaan-pengiriman/perlu-dikirim" element={<PerluDikirim />} />
      <Route path="/produsen/pengelolaan-pengiriman/dikirim" element={<Dikirim />} />
      <Route path="/produsen/pengelolaan-pengiriman/selesai" element={<Selesai />} />
      <Route path="/produsen/pengelolaan-pengiriman/pembatalan" element={<Pembatalan />} />
      <Route path="/produsen/pengelolaan-pengiriman/pengembalian" element={<Pengembalian />} />
      <Route path="/produsen/pengelolaan-pengiriman/detail/:id/surat" element={<SuratPesanan />} />
      <Route path="/produsen/pengelolaan-pengiriman/atur-pengiriman/:id" element={<AturPengiriman />} />
      <Route path="/produsen/pengelolaan-pengiriman/rincian-pengiriman/:id" element={<RincianPengiriman />} />
      <Route path="/produsen/pengelolaan-pengiriman/surat-jalan/:id" element={<SuratJalanProdusen />} />
      <Route path="/produsen/pengelolaan-pengiriman/lihat-status/:id" element={<LihatStatus />} />
      <Route path="/produsen/pengelolaan-pengiriman/lihat-riwayat/:id" element={<LihatRiwayat />} />


        <Route path="/produsen/laporan-analitik" element={<LaporanAnalitik />} />
      
      <Route path="/pbf/dashboard" element={<PbfDashboard />} />
      <Route path="/pbf/pesan-obat" element={<PesanObat />} />
      <Route path="/pbf/pesan-obat/tambah" element={<PilihProdusen />} /> 
      <Route path="/pbf/pesan-obat/tambah/:idProdusen" element={<TambahPesanan />} /> 
      <Route path="/pbf/pesanan/:id/batalkan" element={<BatalPesanan />} />
      <Route path="/pbf/pesanan/:id/detail" element={<DetailPesanan />} />
      <Route path="/pbf/monitoring-stok" element={<MonitoringStokPbf />} />


      <Route path="/apotek/dashboard" element={<ApotekDashboard />} />
       <Route path="/apotek/stok-obat" element={<StokObat />} />
        <Route path="/apotek/pesan-obat" element={<PesanObatApotek />} />
    </Routes>
  );
}

export default App;
