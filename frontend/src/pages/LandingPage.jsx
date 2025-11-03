import React, { useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowRight,
  CheckCircle,
  Github,
  QrCode,
  HeartHandshake,
  ArrowBigUpDash,
  Heart,
  Zap,
  Blocks,
  Lock,
  Shield,
  Database,
  FileCheck,
  ChevronRight,
  Building2,
  Camera,
  Link as LinkIcon,
} from "lucide-react";
import { AnimatedBackground } from "../components/BackgroundLanding";
// Assuming these components are in the correct path
import Navbar from "../components/Navbar";
import Threads from "../components/Threads";
import QrScanner from "../components/QrScanner";
import RiwayatObatModal from "../components/RiwayatObatModal";
import HeroImage from "../assets/hero.png";
import LogoPutih from "../assets/logoPutih.png";

const LandingPage = () => {
  const [showScanner, setShowScanner] = useState(false);
  const [showResultModal, setShowResultModal] = useState(false);
  const [scanResult, setScanResult] = useState(null);
  const [scanError, setScanError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleScanResult = async (batchId) => {
    setShowScanner(false);
    setIsLoading(true);
    setShowResultModal(true);
    setScanError("");
    setScanResult(null);

    try {
      const response = await fetch(
        `http://localhost:5000/api/public/riwayat/${batchId}`
      );
      const result = await response.json();
      if (!response.ok || !result.success) {
        throw new Error(result.message || "Gagal mengambil data.");
      }
      setScanResult(result.data);
    } catch (err) {
      setScanError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const partners = [
    { name: "Kimia Farma", type: "Perusahaan Farmasi Nasional" },
    { name: "Kalbe Farma", type: "Manufaktur & Distribusi" },
    { name: "Dexa Medica", type: "Produsen Farmasi" },
    { name: "Apotek K-24", type: "Jaringan Apotek Nasional" },
    { name: "Guardian", type: "Retail Farmasi" },
    { name: "Medicology", type: "Distribusi Digital" },
  ];

  const features = [
    {
      icon: <Database />,
      title: "Immutable Records",
      description:
        "Setiap transaksi dicatat secara permanen di blockchain, memastikan jejak lengkap dan keaslian produk yang tidak dapat diubah.",
    },
    {
      icon: <Shield />,
      title: "Smart Contracts",
      description:
        "Kepatuhan dan verifikasi otomatis melalui kontrak pintar berbasis blockchain untuk transparansi maksimal.",
    },
    {
      icon: <FileCheck />,
      title: "Digital Certificates",
      description:
        "Sertifikat terverifikasi blockchain untuk setiap produk memastikan keaslian dan mencegah pemalsuan.",
    },
    {
      icon: <Lock />,
      title: "Secure Tracking",
      description:
        "Pelacakan aman dengan enkripsi tingkat enterprise dan protokol keamanan blockchain.",
    },
    {
      icon: <Blocks />,
      title: "Decentralized Network",
      description:
        "Jaringan terdesentralisasi yang menghilangkan single point of failure dan meningkatkan keandalan.",
    },
    {
      icon: <Zap />,
      title: "Real-time Updates",
      description:
        "Pembaruan status real-time untuk monitoring kondisi dan lokasi produk sepanjang rantai pasok.",
    },
  ];

  const blockchainFeatures = [
    "Smart contract verification",
    "Real-time blockchain tracking",
    "Decentralized record keeping",
    "Automated compliance",
    "Product authentication",
    "Temperature monitoring",
    "Secure data sharing",
    "Digital certificates",
  ];

  const steps = [
    {
      number: "01",
      title: "Produksi",
      description:
        "Produk didaftarkan dengan ID unik di blockchain saat diproduksi",
      color: "from-[#22C55E] to-[#16A34A]",
    },
    {
      number: "02",
      title: "Distribusi",
      description:
        "Setiap perpindahan dicatat secara real-time dengan verifikasi digital",
      color: "from-[#16A34A] to-[#047857]",
    },
    {
      number: "03",
      title: "Verifikasi",
      description: "Konsumen dapat memverifikasi keaslian dengan scan QR code",
      color: "from-[#047857] to-green-800",
    },
  ];

  const resourcesLinks = [
    { href: "#", text: "Dokumentasi" },
    { href: "#", text: "API Reference" },
    { href: "#", text: "Tutorial" },
  ];

  const platformLinks = [
    { href: "#", text: "Fitur" },
    { href: "#", text: "Harga" },
    { href: "#", text: "Keamanan" },
  ];

  const communityLinks = [
    { href: "#", text: "Events" },
    { href: "#", text: "Blog" },
    { href: "#", text: "Forum" },
  ];

  return (
    // Light theme change: Changed background to white and default text to dark gray
    <div className="min-h-screen bg-gray-200/30 text-gray-800">
      {/* <AnimatedBackground /> */}
      <Navbar />

     
      <div>
        <div
          style={{ width: "100%", height: "700px", position: "relative" }}
          className=""
        >
          {/* Komponen Threads sebagai Latar Belakang Animasi */}
          <div className="absolute inset-0 z-0">
            <Threads
              color={[0.133, 0.772, 0.368]}
              amplitude={3}
              distance={0.1}
              enableMouseInteraction={false}
            />
          </div>
          <AnimatedBackground />

          {/* Konten Hero Section di atas Latar Belakang */}
          <main className="relative w-full min-h-[700px] flex items-center justify-center">
            <section className="relative z-10 w-full">
              <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                <div className="flex flex-col items-center text-center gap-8">
                  {/* Judul */}
                  <div className="max-w-3xl">
                    <h1 className="text-4xl lg:text-6xl font-bold text-foreground leading-tight text-balance">
                      Rantai Pasok Farmasi
                      <span className="text-[#047857]/90 block">
                        Transparan
                      </span>
                    </h1>
                  </div>

                  {/* Deskripsi */}
                  <p className="text-lg lg:text-xl text-[#121212]/70  leading-relaxed max-w-2xl">
                    Amankan keaslian produk dari produsen hingga pasien dengan
                    sistem pelacakan berbasis teknologi blockchain yang tidak
                    dapat diubah.
                  </p>

                  {/* Tombol Aksi */}
                  <div className="flex flex-col sm:flex-row gap-4">
                    <Link
                      to="/roles"
                      className="group inline-flex items-center justify-center px-8 py-4 bg-gradient-to-r from-[#16A34A] to-[#047857] text-white rounded-2xl hover:from-emerald-700 hover:to-emerald-800 transition-all duration-500 font-semibold shadow-2xl hover:shadow-emerald-500/25 hover:scale-110 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 relative overflow-hidden"
                    >
                      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
                      <span className="relative z-10 flex items-center">
                        Masuk Platform
                        <ArrowRight
                          size={20}
                          className="ml-2 group-hover:translate-x-1 transition-transform"
                        />
                      </span>
                    </Link>

                    <button
                      onClick={() => setShowScanner(true)}
                      className="inline-flex items-center justify-center px-8 py-4 bg-white/20 backdrop-blur-md border-2 border-emerald-600/50 text-emerald-600 rounded-2xl hover:bg-white/30 hover:border-emerald-600 transition-all duration-500 font-semibold hover:scale-110 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 shadow-xl hover:shadow-2xl"
                    >
                      <Camera size={20} className="mr-2" />
                      Lacak dengan QR Code
                    </button>
                  </div>

                  {/* Statistik */}
                  <div className="grid grid-cols-3 gap-6 max-w-md">
                    {[
                      { number: "99.9%", label: "Akurasi Tracking" },
                      { number: "24/7", label: "Monitoring" },
                      { number: "100+", label: "Mitra Terpercaya" },
                    ].map((stat) => (
                      <div key={stat.label} className="text-center">
                        <div className="text-2xl font-bold text-primary">
                          {stat.number}
                        </div>
                        <div className="text-sm text-muted-foreground font-medium">
                          {stat.label}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </section>
          </main>
        </div>

        {/* --- FEATURES SECTION --- */}

        <section
          id="fitur"
          className="py-20 bg-gradient-to-b relative overflow-hidden"
        >
          {/* Liquid Glass Background */}
          <div className="absolute inset-0">
            <div className="absolute top-10 left-1/4 w-64 h-64 bg-[#22C55E]/10 rounded-full blur-3xl animate-[float_6s_ease-in-out_infinite]"></div>
            <div className="absolute bottom-10 right-1/4 w-80 h-80 bg-[#16A34A]/5 animate-[liquid_8s_ease-in-out_infinite] blur-2xl"></div>
          </div>

          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16 animate-[fadeIn_0.6s_ease-out] relative z-10">
              <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4">
                Fitur Unggulan Platform
              </h2>
              <p className="text-xl text-[#121212] max-w-3xl mx-auto">
                Teknologi blockchain terdepan untuk memastikan integritas dan
                transparansi rantai pasok farmasi
              </p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 relative z-10">
              {features.map((feature, index) => (
                <div
                  key={index}
                  className="group bg-white/40 backdrop-blur-xl p-8 rounded-3xl border border-white/30 hover:border-[#A7F3D0]/50 hover:shadow-2xl hover:shadow-[#22C55E]/10 transition-all duration-500 hover:-translate-y-2 animate-[slideUp_0.6s_ease-out] hover:bg-white/60"
                  style={{ animationDelay: `${index * 0.1}s` }}
                >
                  <div className="h-14 w-14 bg-gradient-to-br from-[#F0FDFA] to-[#CCFBF1] backdrop-blur-sm rounded-2xl flex items-center justify-center mb-6 group-hover:bg-gradient-to-br group-hover:from-[#CCFBF1] group-hover:to-[#A7F3D0] transition-all duration-500 shadow-lg group-hover:shadow-xl group-hover:animate-[glow_2s_ease-in-out_infinite_alternate]">
                    <div className="text-[#16A34A] group-hover:scale-125 transition-transform duration-500">
                      {React.cloneElement(feature.icon, { size: 28 })}
                    </div>
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-4 group-hover:text-[#047857] transition-all duration-300">
                    {feature.title}
                  </h3>
                  <p className="text-gray-600 leading-relaxed group-hover:text-gray-700 transition-colors duration-300">
                    {feature.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* --- BLOCKCHAIN SECTION --- */}
        <section id="tentang" className="py-20  relative overflow-hidden">
          {/* Liquid Glass Background */}
          <div className="absolute inset-0">
            <div className="absolute top-1/4 left-10 w-80 h-80 bg-[#22C55E]/5 rounded-full blur-3xl animate-float"></div>
            <div className="absolute bottom-1/4 right-10 w-96 h-96 bg-[#16A34A]/10 animate-liquid blur-2xl"></div>
          </div>

          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16 animate-fade-in relative z-10">
              <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4">
                Teknologi Blockchain Terdepan
              </h2>
              <p className="text-xl text-gray-600 max-w-3xl mx-auto">
                Transparansi penuh dari manufaktur hingga konsumen akhir dengan
                keamanan blockchain
              </p>
            </div>

            {/* Process Steps */}
            <div className="grid md:grid-cols-3 gap-8 mb-16 relative z-10">
              {steps.map((step, index) => (
                <div
                  key={index}
                  className="relative group animate-slide-up hover:scale-105 transition-all duration-500"
                  style={{ animationDelay: `${index * 0.2}s` }}
                >
                  <div className="text-center">
                    <div
                      className={`inline-flex items-center justify-center w-16 h-16 rounded-3xl bg-gradient-to-r ${step.color} text-white text-2xl font-bold mb-6 group-hover:scale-125 transition-all duration-500 shadow-2xl border border-white/20 backdrop-blur-sm animate-glow`}
                    >
                      {step.number}
                    </div>
                    <h3 className="text-xl font-semibold text-gray-900 mb-4 group-hover:text-#047857 transition-all duration-300">
                      {step.title}
                    </h3>
                    <p className="text-gray-600 leading-relaxed group-hover:text-gray-700 transition-colors duration-300">
                      {step.description}
                    </p>
                  </div>

                  {/* Arrow connector */}
                  {index < steps.length - 1 && (
                    <div className="hidden md:block absolute top-8 -right-4 z-10">
                      <ArrowRight size={24} className="text-gray-900" />
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* --- Blockchain Features Grid --- */}
            <div className="py-20">
              {/* Kontainer Kaca */}
              <div
                className="relative z-10 max-w-7xl mx-auto rounded-3xl shadow-3xl glass-container" /* Terapkan kelas .glass-container di sini */
              >
                {/* Konten di dalam kartu kaca */}
                <div className="p-8 lg:p-12 bg-gradient-to-r from-[#16A34A]/95 to-[#047857]/95">
                  <h3 className="text-2xl font-bold text-white text-center mb-8 relative">
                    Fitur Blockchain Terintegrasi
                  </h3>
                  <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {blockchainFeatures.map((feature, index) => (
                      <div
                        key={index}
                        className="flex items-center gap-3 bg-white/60 backdrop-blur-sm p-4 rounded-2xl border border-white/40 hover:border-[#A7F3D0]/50 hover:shadow-lg hover:bg-white/80 transition-all duration-500 hover:scale-105"
                      >
                        <CheckCircle
                          className="text-[#16A34A] flex-shrink-0"
                          size={20}
                        />
                        <span className="text-gray-700 font-medium text-sm">
                          {feature}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* --- SVG FILTER (WAJIB ADA) --- */}
              {/* Filter ini tidak akan terlihat, tapi akan digunakan oleh CSS */}
              <svg style={{ display: "none" }}>
                <filter id="container-glass">
                  <feTurbulence
                    type="fractalNoise"
                    baseFrequency="0.008 0.008"
                    numOctaves="2"
                    seed="92"
                    result="noise"
                  />
                  <feGaussianBlur
                    in="noise"
                    stdDeviation="0.02"
                    result="blur"
                  />
                  <feDisplacementMap
                    in="SourceGraphic"
                    in2="blur"
                    scale="77"
                    xChannelSelector="R"
                    yChannelSelector="G"
                  />
                </filter>
              </svg>
            </div>
          </div>
        </section>

        {/* --- CTA SECTION --- */}
        <section className="py-20 bg-gradient-to-r from-[#16A34A] to-[#047857] relative overflow-hidden">
          {/* Background decorations */}
          <div className="absolute inset-0">
            <div className="absolute inset-0 bg-gradient-to-br from-white/10 via-transparent to-white/5"></div>
            <div className="absolute top-10 left-10 h-32 w-32 bg-white/20 rounded-full blur-2xl animate-float"></div>
            <div className="absolute bottom-10 right-10 h-40 w-40 bg-white/10 animate-liquid blur-3xl"></div>
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 h-64 w-64 bg-white/15 rounded-full blur-3xl animate-pulse"></div>
          </div>

          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
            <div className="text-center animate-fade-in">
              <div className="inline-flex items-center px-4 py-2 bg-white/20 backdrop-blur-md rounded-full text-[#A7F3D0] text-sm font-medium mb-6 border border-white/30 shadow-lg">
                <Shield size={16} className="mr-2" />
                Bergabung dengan Jaringan Blockchain
              </div>

              <h2 className="text-3xl lg:text-5xl font-bold text-white mb-6">
                Mulai Transformasi Digital
                <span className="block text-[#A7F3D0]">Rantai Pasok Anda</span>
              </h2>

              <p className="text-xl text-white mb-10 max-w-3xl mx-auto leading-relaxed">
                Hubungkan bisnis Anda ke platform blockchain yang aman dan
                terpercaya. Tingkatkan transparansi, kurangi risiko, dan bangun
                kepercayaan konsumen.
              </p>

              <div className="flex flex-col sm:flex-row justify-center gap-4">
                <Link
                  to="/roles"
                  className="group inline-flex items-center justify-center px-8 py-4 bg-white/90 backdrop-blur-md text-[#16A34A] rounded-2xl hover:bg-white transition-all duration-500 font-semibold shadow-2xl hover:shadow-white/25 hover:scale-110 focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-[#16A34A] border border-white/50 relative overflow-hidden"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-[#22C55E]/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
                  <span className="relative z-10 flex items-center">
                    Mulai Sekarang
                    <ArrowRight
                      size={20}
                      className="ml-2 group-hover:translate-x-1 transition-transform"
                    />
                  </span>
                </Link>

                <a
                  href="#features"
                  className="inline-flex items-center justify-center px-8 py-4 bg-white/10 backdrop-blur-md border-2 border-white/40 text-white rounded-2xl hover:bg-white/20 hover:border-white/60 transition-all duration-500 font-semibold hover:scale-110 focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-[#16A34A] shadow-xl"
                >
                  Pelajari Lebih Lanjut
                </a>
              </div>
            </div>
          </div>
        </section>
      </div>

      <footer id="kontak" className="bg-slate-900 text-white">
        <div className="max-w-7xl mx-auto px-6 py-12">
          {/* Main footer content */}
          <div className="flex flex-col md:flex-row items-center justify-between gap-8">
            {/* Logo */}
            <div className="flex items-center gap-3">
              <img
                src={LogoPutih}
                alt="MediSync Logo"
                className="h-16 w-auto"
              />
            </div>

            {/* Navigation Links */}
            <nav className="flex items-center gap-8">
              <a
                href="#"
                className="text-white hover:text-white transition-colors duration-200"
              >
                About
              </a>
              <a
                href="#"
                className="text-white hover:text-white transition-colors duration-200"
              >
                Services
              </a>
              <a
                href="#"
                className="text-white hover:text-white transition-colors duration-200"
              >
                Contact
              </a>
            </nav>

            {/* Social Icons */}
            <div className="flex items-center gap-4">
              <a
                href="#"
                className="text-white hover:text-white transition-colors duration-200"
                aria-label="GitHub"
              >
                <Github size={20} />
              </a>
              <a
                href="#"
                className="text-white hover:text-white transition-colors duration-200"
                aria-label="QR Code"
              >
                <QrCode size={20} />
              </a>
              <a
                href="#"
                className="text-white hover:text-white transition-colors duration-200"
                aria-label="Collaboration"
              >
                <HeartHandshake size={20} />
              </a>
              <a
                href="#"
                className="text-white hover:text-white transition-colors duration-200"
                aria-label="Back to Top"
              >
                <ArrowBigUpDash size={20} />
              </a>
            </div>
          </div>

          {/* Divider */}
          <div className="border-t border-slate-700 mt-8 pt-6">
            {/* Copyright */}
            <p className="text-left text-white/80 text-sm">
              © Copyright 2025, All Rights Reserved by MediSync
            </p>
          </div>
        </div>
      </footer>

      {/* --- MODALS (No style changes needed for these) --- */}
      {showScanner && (
        <QrScanner
          onScanResult={handleScanResult}
          onClose={() => setShowScanner(false)}
        />
      )}
      {showResultModal && (
        <RiwayatObatModal
          data={scanResult}
          error={scanError}
          isLoading={isLoading}
          onClose={() => setShowResultModal(false)}
        />
      )}
    </div>
  );
};

export default LandingPage;
