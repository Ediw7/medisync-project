import React from 'react';
import { Routes, Route } from 'react-router-dom';
import LandingPage from './pages/LandingPage';
import PilihRole from './pages/PilihRole';
import LoginPage from './pages/LoginPage';
import ForgotPasswordPage from './pages/ForgotPasswordPage';
import ResetPasswordPage from './pages/ResetPasswordPage'; 
import RegisterPage from './pages/RegisterPage';
import BlockchainDetail from './pages/BlockchainDetail';

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
import KonfirmasiPembatalan from './pages/produsen/pengelolaanpengiriman/KonfirmasiPembatalan';
import PengirimanMassal from './pages/produsen/pengelolaanpengiriman/PengirimanMassal';
import AturPickupMassal from './pages/produsen/pengelolaanpengiriman/AturPickupMassal';
import KonfirmasiPengirimanMassal from './pages/produsen/pengelolaanpengiriman/KonfirmasiPengirimanMassal';
import CetakSuratJalanMassal from './pages/produsen/pengelolaanpengiriman/CetakSuratJalanMassal';
import KonfirmasiPengembalian from './pages/produsen/pengelolaanpengiriman/KonfirmasiPengembalian';
import LacakPengembalian from './pages/produsen/pengelolaanpengiriman/LacakPengembalian';
import LihatRiwayatPembatalan from './pages/produsen/pengelolaanpengiriman/LihatRiwayatPembatalan';

import LaporanAnalitik from './pages/produsen/laporananalitik/LaporanAnalitik';

import PbfDashboard from './pages/pbf/PbfDashboard';
import PesanObat from './pages/pbf/pesanobat/PesanObat';
import PilihProdusen from './pages/pbf/pesanobat/PilihProdusen';
import TambahPesanan from './pages/pbf/pesanobat/TambahPesanan';
import DetailPesanan from './pages/pbf/pesanobat/DetailPesanan';
import BatalPesanan from './pages/pbf/pesanobat/BatalPesanan';
import AjukanPengembalian from './pages/pbf/pesanobat/AjukanPengembalian';
import KonfirmasiPenerimaan from './pages/pbf/pesanobat/KonfirmasiPenerimaan';
import LihatRiwayatPesanan from './pages/pbf/pesanobat/LIhatRiwayatPesanan';
import LihatRiwayatPengembalian from './pages/pbf/pesanobat/LihatRiwayatPengembalian';
import LacakPengembalianPbf from './pages/pbf/pesanobat/LacakPengembalianPbf';

import MonitoringStokPbf from './pages/pbf/monitoringstok/MonitoringStokPbf';
import DetailStokPbf from './pages/pbf/monitoringstok/DetailStokPbf';
import RiwayatDistribusiPbf from './pages/pbf/monitoringstok/RiwayatDistribusiPbf';

import PengelolaanPesanan from './pages/pbf/pengelolaanpesanan/PengelolaanPesanan';
import SuratPesananApotek from './pages/pbf/pengelolaanpesanan/SuratPesananApotek';
import KonfirmasiPembatalanApotek from './pages/pbf/pengelolaanpesanan/KonfirmasiPembatalanApotek';
import LihatRiwayatPembatalanApotek from './pages/pbf/pengelolaanpesanan/LihatRiwayatPembatalanApotek';
import PengirimanMassalPbf from './pages/pbf/pengelolaanpesanan/PengirimanMassalPbf';
import AturPickupMassalPbf from './pages/pbf/pengelolaanpesanan/AturPickupMassalPbf';
import KonfirmasiPengirimanMassalPbf from './pages/pbf/pengelolaanpesanan/KonfirmasiPengirimanMassalPbf';
import CetakSuratJalanMassalPbf from './pages/pbf/pengelolaanpesanan/CetakSuratJalanMassalPbf';

import AturPengirimanApotek from './pages/pbf/pengelolaanpesanan/AturPengirimanApotek';
import RincianPengirimanApotek from './pages/pbf/trackingpengiriman/RincianPengirimanApotek';
import LihatStatusApotek from './pages/pbf/trackingpengiriman/LihatStatusApotek';
import SuratJalanPbf from './pages/pbf/trackingpengiriman/SuratJalanPbf';
import LihatRiwayatPesananApotek from './pages/pbf/trackingpengiriman/LihatRiwayatPesananApotek';
import TrackingPengiriman from './pages/pbf/trackingpengiriman/TrackingPengiriman';



import LaporanAnalitikPbf from './pages/pbf/laporananalitikpbf/LaporanAnalitikPbf';

import ApotekDashboard from './pages/apotek/ApotekDashboard';
import StokObat from './pages/apotek/stokobat/StokObat';



import PilihPbf from './pages/apotek/pesanobat/PilihPbf';
import TambahPesananApotek from './pages/apotek/pesanobat/TambahPesananApotek';
import PesanObatApotek from './pages/apotek/pesanobat/PesanObatApotek';
import BatalPesananApotek from './pages/apotek/pesanobat/BatalPesananApotek';
import KonfirmasiPenerimaanApotek from './pages/apotek/pesanobat/KonfirmasiPenerimaanApotek';
import LihatRiwayatPenerimaanApotek from './pages/apotek/pesanobat/LihatRiwayatPenerimaanApotek';
import DetailPesananApotek from './pages/apotek/pesanobat/DetailPesananApotek';


import RiwayatPembelian from './pages/apotek/riwayatpembelian/RiwayatPembelian';
import Penjualan from './pages/apotek/penjualan/Penjualan';
import LaporanAnalitikApotek from './pages/apotek/laporananalitikapotek/LaporanAnalitikApotek';

function App() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/roles" element={<PilihRole />} />
      <Route path="/login/:role" element={<LoginPage />} />
      <Route path="/forgot-password" element={<ForgotPasswordPage />} />
      <Route path="/reset-password/:token" element={<ResetPasswordPage />} />
      <Route path="/register/:role" element={<RegisterPage />} />
      <Route path="/blockchain-detail/:batch_id" element={<BlockchainDetail />} />
      
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
      <Route path="/produsen/pengelolaan-pengiriman/lihat-riwayat/:assetId" element={<LihatRiwayat />} />
      <Route path="/produsen/pengelolaan-pengiriman/konfirmasi-pembatalan/:id" element={<KonfirmasiPembatalan />} /> 
      <Route path="/produsen/pengelolaan-pengiriman/pengiriman-massal" element={<PengirimanMassal />} />
      <Route path="/produsen/pengelolaan-pengiriman/atur-pickup-massal" element={<AturPickupMassal />} />
      <Route path="/produsen/pengelolaan-pengiriman/konfirmasi-pengiriman-massal" element={<KonfirmasiPengirimanMassal />} />
       <Route path="/produsen/pengelolaan-pengiriman/cetak-surat-jalan-massal" element={<CetakSuratJalanMassal />} />
        <Route path="/produsen/pengelolaan-pengiriman/konfirmasi-pengembalian/:id" element={<KonfirmasiPengembalian />} />
       <Route path="/produsen/pengelolaan-pengiriman/lacak-pengembalian/:id" element={<LacakPengembalian />} />
         <Route path="/produsen/pengelolaan-pengiriman/riwayat-pembatalan/:id" element={<LihatRiwayatPembatalan />} />

        <Route path="/produsen/laporan-analitik" element={<LaporanAnalitik />} />
      
      <Route path="/pbf/dashboard" element={<PbfDashboard />} />
      <Route path="/pbf/pesan-obat" element={<PesanObat />} />
      <Route path="/pbf/pesan-obat/tambah" element={<PilihProdusen />} /> 
      <Route path="/pbf/pesan-obat/tambah/:idProdusen" element={<TambahPesanan />} /> 
      <Route path="/pbf/pesanan/:id/konfirmasi-penerimaan" element={<KonfirmasiPenerimaan />} />
      <Route path="/pbf/pesanan/:id/ajukan-pengembalian" element={<AjukanPengembalian />} />
      <Route path="/pbf/pesanan/:id/batalkan" element={<BatalPesanan />} />
      <Route path="/pbf/pesanan/:id/detail" element={<DetailPesanan />} />
      <Route path="/pbf/monitoring-stok" element={<MonitoringStokPbf />} />
      <Route path="/pbf/stok/detail/:id" element={<DetailStokPbf />} />
      <Route path="/pbf/riwayat-distribusi" element={<RiwayatDistribusiPbf />} />

       <Route path="/pbf/pesanan/riwayat/:assetId" element={<LihatRiwayatPesanan />} />
       <Route path="/pbf/pesanan/:id/riwayat-pengembalian" element={<LihatRiwayatPengembalian />} />
       <Route path="/pbf/pesanan/:id/lacak-pengembalian-pbf" element={<LacakPengembalianPbf />} />

      <Route path="/pbf/pengelolaan-pesanan" element={<PengelolaanPesanan />} />
      <Route path="/pbf/pengelolaan-pesanan/surat/:id" element={<SuratPesananApotek />} />
      
      <Route path="/pbf/pengelolaan-pesanan/rincian-pengiriman/:id" element={<RincianPengirimanApotek />} />

      
     <Route path="/pbf/pengelolaan-pesanan/konfirmasi-pembatalan/:id" element={<KonfirmasiPembatalanApotek />} />
      <Route path="/pbf/pengelolaan-pesanan/riwayat-pembatalan/:id" element={<LihatRiwayatPembatalanApotek />} />
      <Route path="/pbf/pengelolaan-pesanan/pengiriman-massal" element={<PengirimanMassalPbf />} />
      <Route path="/pbf/pengelolaan-pesanan/atur-pickup-massal" element={<AturPickupMassalPbf />} />
      <Route path="/pbf/pengelolaan-pesanan/konfirmasi-pengiriman-massal" element={<KonfirmasiPengirimanMassalPbf />} />
      <Route path="/pbf/pengelolaan-pesanan/cetak-surat-jalan-massal" element={<CetakSuratJalanMassalPbf />} />
       <Route path="/pbf/pengelolaan-pesanan/atur-pengiriman/:id" element={<AturPengirimanApotek />} />


      <Route path="/pbf/tracking-pengiriman" element={<TrackingPengiriman />} />
     
      <Route path="/pbf/tracking-pengiriman/lacak/:id" element={<LihatStatusApotek />} />
      <Route path="/pbf/tracking-pengiriman/riwayat/:assetId" element={<LihatRiwayatPesananApotek />} />
      <Route path="/pbf/tracking-pengiriman/surat-jalan/:id" element={<SuratJalanPbf />} />


      <Route path="/pbf/laporan-analitik" element={<LaporanAnalitikPbf />} />
     
      <Route path="/apotek/dashboard" element={<ApotekDashboard />} />
       <Route path="/apotek/stok-obat" element={<StokObat />} />
         <Route path="/apotek/pesan-obat/tambah" element={<PilihPbf />} />
        <Route path="/apotek/pesan-obat/tambah/:idPbf" element={<TambahPesananApotek />} />
        <Route path="/apotek/pesan-obat" element={<PesanObatApotek />} />
        <Route path="/apotek/pesanan/:id/batalkan" element={<BatalPesananApotek />} />
        <Route path="/apotek/pesanan/:id/konfirmasi-penerimaan" element={<KonfirmasiPenerimaanApotek />} />
        <Route path="/apotek/pesanan/riwayat/:assetId" element={<LihatRiwayatPenerimaanApotek />} />
        <Route path="/apotek/pesanan/:id/detail" element={<DetailPesananApotek />} />


        <Route path="/apotek/riwayat-pembelian" element={<RiwayatPembelian />} />
        <Route path="/apotek/penjualan" element={<Penjualan />} />
        <Route path="/apotek/laporan-analitik" element={<LaporanAnalitikApotek />} />
    </Routes>
  );
}

export default App;
