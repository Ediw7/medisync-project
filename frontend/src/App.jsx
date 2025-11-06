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
import ProfilProdusen from './pages/produsen/profil/ProfilProdusen';
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
import ProfilPbf from './pages/pbf/profil/ProfilPbf';
import PesanObat from './pages/pbf/pesanobat/PesanObat';
import PilihProdusen from './pages/pbf/pesanobat/PilihProdusen';
import TambahPesanan from './pages/pbf/pesanobat/TambahPesanan';
import DetailPesanan from './pages/pbf/pesanobat/DetailPesanan';
import BatalPesanan from './pages/pbf/pesanobat/BatalPesanan';
import AjukanPengembalian from './pages/pbf/pesanobat/AjukanPengembalian';
import KonfirmasiPenerimaan from './pages/pbf/pesanobat/KonfirmasiPenerimaan';
import LihatRiwayatPesanan from './pages/pbf/pesanobat/LIhatRiwayatPesanan';
import LihatRiwayatPengembalian from './pages/pbf/pesanobat/LihatRiwayatPengembalian';
import DetailPembatalan from './pages/pbf/pesanobat/DetailPembatalan';
import DetailPengembalian from './pages/pbf/pesanobat/DetailPengembalian';


import MonitoringStokPbf from './pages/pbf/monitoringstok/MonitoringStokPbf';
import DetailStokPbf from './pages/pbf/monitoringstok/DetailStokPbf';
import RiwayatDistribusiPbf from './pages/pbf/monitoringstok/RiwayatDistribusiPbf';

import PengelolaanPesanan from './pages/pbf/pengelolaanpesanan/PengelolaanPesanan';

import PerluDikirimPbf from './pages/pbf/pengelolaanpesanan/PerluDikirimPbf';
import DibatalkanPbf from './pages/pbf/pengelolaanpesanan/DibatalkanPbf';
import SuratPesananApotek from './pages/pbf/pengelolaanpesanan/SuratPesananApotek';
import KonfirmasiPembatalanApotek from './pages/pbf/pengelolaanpesanan/KonfirmasiPembatalanApotek';
import LihatRiwayatPembatalanApotek from './pages/pbf/pengelolaanpesanan/LihatRiwayatPembatalanApotek';
import PengirimanMassalPbf from './pages/pbf/pengelolaanpesanan/PengirimanMassalPbf';
import AturPickupMassalPbf from './pages/pbf/pengelolaanpesanan/AturPickupMassalPbf';
import KonfirmasiPengirimanMassalPbf from './pages/pbf/pengelolaanpesanan/KonfirmasiPengirimanMassalPbf';
import CetakSuratJalanMassalPbf from './pages/pbf/pengelolaanpesanan/CetakSuratJalanMassalPbf';
import AturPengirimanApotek from './pages/pbf/pengelolaanpesanan/AturPengirimanApotek';
import RincianPengirimanApotek from './pages/pbf/pengelolaanpesanan/RincianPengirimanApotek';
import SuratJalanPbf from './pages/pbf/pengelolaanpesanan/SuratJalanPbf';
import KonfirmasiPengembalianPbf from './pages/pbf/trackingpengiriman/KonfirmasiPengembalianPbf';


import LihatStatusApotek from './pages/pbf/trackingpengiriman/LihatStatusApotek';
import LihatRiwayatPesananApotek from './pages/pbf/trackingpengiriman/LihatRiwayatPesananApotek';
import TrackingPengiriman from './pages/pbf/trackingpengiriman/TrackingPengiriman';
import DikirimPbf from './pages/pbf/trackingpengiriman/DikirimPbf';
import SelesaiPbf from './pages/pbf/trackingpengiriman/SelesaiPbf';
import PengembalianPbf from './pages/pbf/trackingpengiriman/PengembalianPbf';
import LacakPengembalianPbf from './pages/pbf/trackingpengiriman/LacakPengembalianPbf';

import LaporanAnalitikPbf from './pages/pbf/laporananalitikpbf/LaporanAnalitikPbf';
import LaporanAnalitikkeApotek from './pages/pbf/laporananalitikpbf/LaporanAnalitikkeApotek';

import ApotekDashboard from './pages/apotek/ApotekDashboard';
import ProfilApotek from './pages/apotek/profil/ProfilApotek';
import StokObat from './pages/apotek/stokobat/StokObat';



import PilihPbf from './pages/apotek/pesanobat/PilihPbf';
import TambahPesananApotek from './pages/apotek/pesanobat/TambahPesananApotek';
import PesanObatApotek from './pages/apotek/pesanobat/PesanObatApotek';
import BatalPesananApotek from './pages/apotek/pesanobat/BatalPesananApotek';
import KonfirmasiPenerimaanApotek from './pages/apotek/pesanobat/KonfirmasiPenerimaanApotek';
import LihatRiwayatPenerimaanApotek from './pages/apotek/pesanobat/LihatRiwayatPenerimaanApotek';
import DetailPesananApotek from './pages/apotek/pesanobat/DetailPesananApotek';
import PerluDikirimApotek from './pages/apotek/pesanobat/PerluDikirimApotek';
import DikirimApotek from './pages/apotek/pesanobat/DikirimApotek';
import SelesaiApotek from './pages/apotek/pesanobat/SelesaiApotek';
import DibatalkanApotek from './pages/apotek/pesanobat/DibatalkanApotek';
import PengembalianApotek from './pages/apotek/pesanobat/PengembalianApotek';
import DetailPembatalanApotek from './pages/apotek/pesanobat/DetailPembatalanApotek';
import AjukanPengembalianApotek from './pages/apotek/pesanobat/AjukanPengembalianApotek';
import LacakPengembalianApotek from './pages/apotek/pesanobat/LacakPengembalianApotek';

import RiwayatPembelian from './pages/apotek/riwayatpembelian/RiwayatPembelian';
import Penjualan from './pages/apotek/penjualan/Penjualan';
import RiwayatPenjualan from './pages/apotek/penjualan/RiwayatPenjualan';
import DetailPenjualan from './pages/apotek/penjualan/DetailPenjualan';
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
      <Route path="/produsen/profil" element={<ProfilProdusen />} />
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
      <Route path="/pbf/profil" element={<ProfilPbf />} />
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
      <Route path="/pbf/pesanan/:id/detail-pembatalan" element={<DetailPembatalan />} />
      <Route path="/pbf/pesanan/:id/detail-pengembalian" element={<DetailPengembalian />} />

       <Route path="/pbf/pesanan/riwayat/:assetId" element={<LihatRiwayatPesanan />} />
       <Route path="/pbf/pesanan/:id/riwayat-pengembalian" element={<LihatRiwayatPengembalian />} />
       <Route path="/pbf/pesanan/:id/lacak-pengembalian-pbf" element={<LacakPengembalianPbf />} />

      <Route path="/pbf/pengelolaan-pesanan" element={<PengelolaanPesanan />} />
     
      <Route path="/pbf/pengelolaan-pesanan/perlu-dikirim" element={<PerluDikirimPbf />} />
      <Route path="/pbf/pengelolaan-pesanan/dibatalkan" element={<DibatalkanPbf />} />
      <Route path="/pbf/pengelolaan-pesanan/surat/:id" element={<SuratPesananApotek />} />
      <Route path="/pbf/pengelolaan-pesanan/rincian-pengiriman/:id" element={<RincianPengirimanApotek />} />
     <Route path="/pbf/pengelolaan-pesanan/konfirmasi-pembatalan/:id" element={<KonfirmasiPembatalanApotek />} />
      <Route path="/pbf/pengelolaan-pesanan/riwayat-pembatalan/:id" element={<LihatRiwayatPembatalanApotek />} />
      <Route path="/pbf/pengelolaan-pesanan/pengiriman-massal" element={<PengirimanMassalPbf />} />
      <Route path="/pbf/pengelolaan-pesanan/atur-pickup-massal" element={<AturPickupMassalPbf />} />
      <Route path="/pbf/pengelolaan-pesanan/konfirmasi-pengiriman-massal" element={<KonfirmasiPengirimanMassalPbf />} />
      <Route path="/pbf/pengelolaan-pesanan/cetak-surat-jalan-massal" element={<CetakSuratJalanMassalPbf />} />
       <Route path="/pbf/pengelolaan-pesanan/atur-pengiriman/:id" element={<AturPengirimanApotek />} />
 <Route path="/pbf/pengelolaan-pesanan/surat-jalan/:id" element={<SuratJalanPbf />} />

      <Route path="/pbf/tracking-pengiriman" element={<TrackingPengiriman />} />
      <Route path="/pbf/tracking-pengiriman/dikirim" element={<DikirimPbf />} />
      <Route path="/pbf/tracking-pengiriman/selesai" element={<SelesaiPbf />} />
      <Route path="/pbf/tracking-pengiriman/pengembalian" element={<PengembalianPbf />} />
      <Route path="/pbf/tracking-pengiriman/lacak-pengembalian/:id" element={<LacakPengembalianPbf />} />
      <Route path="/pbf/tracking-pengiriman/konfirmasi-pengembalian/:id" element={<KonfirmasiPengembalianPbf />} />
     
      <Route path="/pbf/tracking-pengiriman/lihatstatus/:id" element={<LihatStatusApotek />} />
      <Route path="/pbf/tracking-pengiriman/riwayat/:assetId" element={<LihatRiwayatPesananApotek />} />
     


      <Route path="/pbf/laporan-analitik" element={<LaporanAnalitikPbf />} />
      <Route path="/pbf/laporan-analitik-ke-apotek" element={<LaporanAnalitikkeApotek />} />

      <Route path="/apotek/dashboard" element={<ApotekDashboard />} />
       <Route path="/apotek/profil" element={<ProfilApotek />} />
      <Route path="/apotek/stok-obat" element={<StokObat />} />
      <Route path="/apotek/pesan-obat/tambah" element={<PilihPbf />} />
      <Route path="/apotek/pesan-obat/tambah/:idPbf" element={<TambahPesananApotek />} />
      <Route path="/apotek/pesan-obat" element={<PesanObatApotek />} />
      <Route path="/apotek/pesanan/:id/batalkan" element={<BatalPesananApotek />} />
      <Route path="/apotek/pesanan/:id/konfirmasi-penerimaan" element={<KonfirmasiPenerimaanApotek />} />
      <Route path="/apotek/pesanan/riwayat/:assetId" element={<LihatRiwayatPenerimaanApotek />} />
      <Route path="/apotek/pesanan/:id/ajukan-pengembalian" element={<AjukanPengembalianApotek />} />
      <Route path="/apotek/pesanan/:id/detail" element={<DetailPesananApotek />} />
      <Route path="/apotek/pesanan/:id/lacak-pengembalian" element={<LacakPengembalianApotek />} />
      <Route path="/apotek/pesan-obat/perlu-dikirim" element={<PerluDikirimApotek />} />
      <Route path="/apotek/pesan-obat/dikirim" element={<DikirimApotek />} />
      <Route path="/apotek/pesan-obat/selesai" element={<SelesaiApotek />} />
      <Route path="/apotek/pesan-obat/dibatalkan" element={<DibatalkanApotek />} />
      <Route path="/apotek/pesan-obat/pengembalian" element={<PengembalianApotek />} />
      <Route path="/apotek/pesanan/:id/detail-pembatalan" element={<DetailPembatalanApotek />} />
        <Route path="/apotek/riwayat-pembelian" element={<RiwayatPembelian />} />
        <Route path="/apotek/penjualan" element={<Penjualan />} />
        <Route path="/apotek/riwayat-penjualan" element={<RiwayatPenjualan />} />
      <Route path="/apotek/penjualan/riwayat/:id" element={<DetailPenjualan />} />
        <Route path="/apotek/laporan-analitik" element={<LaporanAnalitikApotek />} />

    </Routes>
  );
}

export default App;
