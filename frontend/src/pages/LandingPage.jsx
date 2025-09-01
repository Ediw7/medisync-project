// src/pages/LandingPage.jsx

import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  ArrowRight,
  CheckCircle,
  Zap,
  Shield, 
  Database, 
  FileCheck, 
  ChevronRight, 
  Building2, 
  Camera,
  Link as LinkIcon
} from 'lucide-react';

// Assuming these components are in the correct path
import Navbar from '../components/Navbar';
import QrScanner from '../components/QrScanner';
import RiwayatObatModal from '../components/RiwayatObatModal';

const LandingPage = () => {
  const [showScanner, setShowScanner] = useState(false);
  const [showResultModal, setShowResultModal] = useState(false);
  const [scanResult, setScanResult] = useState(null);
  const [scanError, setScanError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleScanResult = async (batchId) => {
    setShowScanner(false);
    setIsLoading(true);
    setShowResultModal(true);
    setScanError('');
    setScanResult(null);

    try {
        const response = await fetch(`http://localhost:5000/api/public/riwayat/${batchId}`);
        const result = await response.json();
        if (!response.ok || !result.success) {
            throw new Error(result.message || 'Gagal mengambil data.');
        }
        setScanResult(result.data);
    } catch (err) {
        setScanError(err.message);
    } finally {
        setIsLoading(false);
    }
  };

  const blockchainFeatures = [
    "Smart contract verification",
    "Real-time blockchain tracking", 
    "Decentralized record keeping",
    "Automated compliance",
    "Product authentication",
    "Temperature monitoring",
    "Secure data sharing",
    "Digital certificates"
  ];

  const steps = [
    {
      number: "01",
      title: "Produksi",
      description: "Produk didaftarkan dengan ID unik di blockchain saat diproduksi",
      color: "from-[#22C55E] to-[#16A34A]"
    },
    {
      number: "02", 
      title: "Distribusi",
      description: "Setiap perpindahan dicatat secara real-time dengan verifikasi digital",
      color: "from-[#22C55E] to-[#16A34A]"
    },
    {
      number: "03",
      title: "Verifikasi",
      description: "Konsumen dapat memverifikasi keaslian dengan scan QR code",
      color: "from-[#22C55E] to-[#16A34A]"
    }
  ];

  return (
    // Light theme change: Changed background to white and default text to dark gray
    <div className="min-h-screen bg-white text-gray-800">
      <Navbar />
      
      {/* The max-w-7xl container was removed from here to allow the hero section 
        to have a full-width background, and was added inside each section instead.
      */}
      <div>
        {/* The Hero Section code you provided already uses a light theme, so it fits perfectly. */}
        <section className="pt-24 pb-20 overflow-hidden relative">
          <div className="absolute inset-0 overflow-hidden">
            <div className="absolute top-20 left-10 w-72 h-72 bg-gradient-to-br from-emerald-500/10 to-emerald-700/5 rounded-full blur-3xl animate-float"></div>
            <div className="absolute bottom-20 right-10 w-96 h-96 bg-gradient-to-br from-emerald-600/10 to-emerald-500/10 animate-liquid blur-2xl"></div>
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-gradient-to-br from-emerald-400/5 to-emerald-600/10 rounded-full blur-3xl animate-pulse"></div>
          </div>
      
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid lg:grid-cols-2 gap-12 items-center relative z-10">
              {/* Left Column - Content */}
              <div className="animate-fade-in">
                <div className="inline-flex items-center px-4 py-2 bg-white/30 backdrop-blur-md rounded-full text-emerald-700 text-sm font-medium mb-6 border border-white/40 shadow-lg">
                  <Shield size={16} className="mr-2" />
                  Teknologi Blockchain Terpercaya
                </div>
            
                <h1 className="text-4xl lg:text-6xl font-bold text-gray-900 mb-6 leading-tight">
                  Rantai Pasok Farmasi
                  <span className="text-emerald-600 block">Transparan</span>
                </h1>
            
                <p className="text-xl text-gray-600 mb-8 leading-relaxed max-w-xl">
                  Amankan keaslian produk dari produsen hingga pasien dengan sistem pelacakan berbasis teknologi blockchain yang tidak dapat diubah.
                </p>

                {/* CTAs */}
                <div className="flex flex-col sm:flex-row gap-4 mb-12">
                  <Link
                    to="/roles"
                    className="group inline-flex items-center justify-center px-8 py-4 bg-gradient-to-r from-emerald-600 to-emerald-700 text-white rounded-2xl hover:from-emerald-700 hover:to-emerald-800 transition-all duration-500 font-semibold shadow-2xl hover:shadow-emerald-500/25 hover:scale-110 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 relative overflow-hidden"
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
                    <span className="relative z-10 flex items-center">
                    Masuk Platform
                    <ArrowRight size={20} className="ml-2 group-hover:translate-x-1 transition-transform" />
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

                {/* Quick Stats */}
                <div className="grid grid-cols-3 gap-6">
                  {[
                    { number: '99.9%', label: 'Akurasi Tracking' },
                    { number: '24/7', label: 'Monitoring' },
                    { number: '100+', label: 'Mitra Terpercaya' }
                  ].map((stat, index) => (
                    <div key={index} className="text-center">
                      <div className="text-2xl font-bold text-emerald-600">{stat.number}</div>
                      <div className="text-sm text-gray-500 font-medium">{stat.label}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Right Column - Visual */}
              <div className="relative animate-slide-up">
                <div className="relative z-10">
                  <div className="bg-gradient-to-br from-emerald-500/80 to-emerald-700/90 backdrop-blur-xl rounded-3xl p-8 shadow-2xl border border-white/20 animate-float">
                    <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent rounded-3xl"></div>
                    <div className="relative z-10">
                    <div className="bg-white/20 backdrop-blur-md rounded-2xl p-6 mb-6 border border-white/30 shadow-inner">
                      <div className="flex items-center gap-3 mb-4">
                        <div className="h-3 w-3 bg-green-400 rounded-full animate-glow"></div>
                        <span className="text-white/90 font-medium">Live Tracking</span>
                      </div>
                      <div className="space-y-3">
                        {[
                          { label: 'Manufaktur', status: 'Selesai', time: '2h ago' },
                          { label: 'Distribusi', status: 'Transit', time: '30m ago' },
                          { label: 'Apotek', status: 'Pending', time: 'Real-time' }
                        ].map((step, index) => (
                          <div key={index} className="flex items-center justify-between bg-white/20 backdrop-blur-sm rounded-xl p-3 border border-white/20 hover:bg-white/30 transition-all duration-300">
                            <div>
                              <div className="text-white font-medium text-sm">{step.label}</div>
                              <div className="text-emerald-200 text-xs">{step.time}</div>
                            </div>
                            <div className={`px-2 py-1 rounded-full text-xs font-medium ${
                              step.status === 'Selesai' ? 'bg-green-400/20 text-green-100' :
                              step.status === 'Transit' ? 'bg-yellow-400/20 text-yellow-100' :
                              'bg-blue-400/20 text-blue-100'
                            }`}>
                              {step.status}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                    <div className="text-center">
                      <div className="inline-flex items-center justify-center w-16 h-16 bg-white/20 backdrop-blur-sm rounded-2xl mb-3 animate-glow">
                        <Zap size={32} className="text-white" />
                      </div>
                      <div className="text-white/90 font-medium mt-2">Blockchain Verified</div>
                    </div>
                    </div>
                  </div>
                </div>
            
                <div className="absolute -top-10 -right-10 h-40 w-40 bg-emerald-200/40 rounded-full blur-3xl animate-pulse"></div>
                <div className="absolute -bottom-10 -left-10 h-32 w-32 bg-emerald-500/30 animate-liquid blur-2xl"></div>
              </div>
            </div>
          </div>
        </section>

        {/* --- PARTNER COMPANIES SECTION --- */}
        <div className="py-20">
          <div className="max-w-7xl mx-auto px-6">
            <h3 className="text-center text-2xl font-semibold text-gray-700 mb-10">
              Perusahaan yang Bekerja Sama dengan Kami
            </h3>
            <div className="bg-gray-50 rounded-xl p-8 border border-gray-200">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-8 items-center">
                {[
                  { name: "Kimia Farma", type: "Perusahaan Farmasi Nasional" },
                  { name: "Kalbe Farma", type: "Manufaktur & Distribusi" },
                  { name: "Dexa Medica", type: "Produsen Farmasi" },
                  { name: "Apotek K-24", type: "Jaringan Apotek Nasional" }
                ].map((company, index) => (
                  <div key={index} className="text-center flex flex-col items-center">
                    <div className="h-16 w-16 bg-emerald-100 rounded-full flex items-center justify-center mb-3">
                      <Building2 size={32} className="text-emerald-600" />
                    </div>
                    <div className="text-lg font-bold text-gray-800">{company.name}</div>
                    <div className="text-sm text-gray-500">{company.type}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
        
        {/* --- FEATURES SECTION --- */}
        <div className="py-20 border-t border-gray-100">
          <div className="max-w-7xl mx-auto px-6">
            <div className="text-center">
              <span className="bg-emerald-100 text-emerald-700 rounded-full h-6 text-sm font-medium px-3 py-1 uppercase">
                Fitur
              </span>
              <h2 className="text-3xl sm:text-5xl lg:text-6xl mt-8 tracking-wide text-gray-900">
                Fitur Unggulan
                <span className="bg-gradient-to-r from-emerald-500 to-green-600 text-transparent bg-clip-text">
                  {" "}
                  Kami
                </span>
              </h2>
            </div>
            <div className="flex flex-wrap mt-10 lg:mt-20">
              {[
                { icon: <Database />, title: "Immutable Records", description: "Setiap transaksi dicatat secara permanen di blockchain, memastikan ketertelusuran dan keaslian yang lengkap." },
                { icon: <Shield />, title: "Smart Contracts", description: "Kepatuhan dan verifikasi otomatis melalui smart contract yang didukung oleh blockchain." },
                { icon: <FileCheck />, title: "Digital Certificates", description: "Sertifikat terverifikasi blockchain untuk setiap produk memastikan keaslian dan mencegah pemalsuan." }
              ].map((feature, index) => (
                <div key={index} className="w-full sm:w-1/2 lg:w-1/3 p-4">
                  <div className="flex">
                    <div className="flex mx-4 h-12 w-12 p-2 bg-emerald-100 text-emerald-600 justify-center items-center rounded-full">
                      {feature.icon}
                    </div>
                    <div>
                      <h5 className="mt-1 mb-4 text-xl font-semibold">{feature.title}</h5>
                      <p className="text-md text-gray-600">
                        {feature.description}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

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
            Hubungkan bisnis Anda ke platform blockchain yang aman dan terpercaya. 
            Tingkatkan transparansi, kurangi risiko, dan bangun kepercayaan konsumen.
          </p>

          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <Link
              to="/roles"
              className="group inline-flex items-center justify-center px-8 py-4 bg-white/90 backdrop-blur-md text-[#16A34A] rounded-2xl hover:bg-white transition-all duration-500 font-semibold shadow-2xl hover:shadow-white/25 hover:scale-110 focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-brand-600 border border-white/50 relative overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-[#22C55E]/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
              <span className="relative z-10 flex items-center">
              Mulai Sekarang
              <ArrowRight size={20} className="ml-2 group-hover:translate-x-1 transition-transform" />
              </span>
            </Link>
            
            <a
              href="#features"
              className="inline-flex items-center justify-center px-8 py-4 bg-white/10 backdrop-blur-md border-2 border-white/40 text-white rounded-2xl hover:bg-white/20 hover:border-white/60 transition-all duration-500 font-semibold hover:scale-110 focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-brand-600 shadow-xl"
            >
              Pelajari Lebih Lanjut
            </a>
          </div>
        </div>
      </div>
    </section>
      </div>

      {/* --- MODALS (No style changes needed for these) --- */}
      {showScanner && <QrScanner onScanResult={handleScanResult} onClose={() => setShowScanner(false)} />}
      {showResultModal && (
        <RiwayatObatModal 
            data={scanResult} 
            error={scanError}
            isLoading={isLoading}
            onClose={() => setShowResultModal(false)} 
        />
      )}

      <section className="py-20 bg-white relative overflow-hidden">
      {/* Liquid Glass Background */}
      <div className="absolute inset-0">
        <div className="absolute top-1/4 left-10 w-80 h-80 bg-brand-500/5 rounded-full blur-3xl animate-float"></div>
        <div className="absolute bottom-1/4 right-10 w-96 h-96 bg-brand-600/10 animate-liquid blur-2xl"></div>
      </div>
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16 animate-fade-in relative z-10">
          <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4">
            Teknologi Blockchain Terdepan
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Transparansi penuh dari manufaktur hingga konsumen akhir dengan keamanan blockchain
          </p>
        </div>

        {/* Process Steps */}
        <div className="grid md:grid-cols-3 gap-8 mb-16 relative z-10">
          {steps.map((step, index) => (
            <div key={index} className="relative group animate-slide-up hover:scale-105 transition-all duration-500" style={{ animationDelay: `${index * 0.2}s` }}>
              <div className="text-center">
                <div className={`inline-flex items-center justify-center w-16 h-16 rounded-3xl bg-gradient-to-r ${step.color} text-white text-2xl font-bold mb-6 group-hover:scale-125 transition-all duration-500 shadow-2xl border border-white/20 backdrop-blur-sm animate-glow`}>
                  {step.number}
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-4 group-hover:text-brand-700 transition-all duration-300">
                  {step.title}
                </h3>
                <p className="text-gray-600 leading-relaxed group-hover:text-gray-700 transition-colors duration-300">
                  {step.description}
                </p>
              </div>
              
              {/* Arrow connector */}
              {index < steps.length - 1 && (
                <div className="hidden md:block absolute top-8 -right-4 z-10">
                  <ArrowRight size={24} className="text-brand-300" />
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Blockchain Features Grid */}
        <div className="bg-white/40 backdrop-blur-xl rounded-3xl p-8 lg:p-12 border border-white/30 shadow-2xl relative z-10">
          <h3 className="text-2xl font-bold text-gray-900 text-center mb-8 relative">
            Fitur Blockchain Terintegrasi
          </h3>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {blockchainFeatures.map((feature, index) => (
              <div
                key={index}
                className="flex items-center gap-3 bg-white/60 backdrop-blur-sm p-4 rounded-2xl border border-white/40 hover:border-brand-200/50 hover:shadow-lg hover:bg-white/80 transition-all duration-500 animate-slide-up hover:scale-105"
                style={{ animationDelay: `${index * 0.05}s` }}
              >
                <CheckCircle className="text-brand-600 flex-shrink-0 group-hover:scale-110 transition-transform duration-300" size={20} />
                <span className="text-gray-700 font-medium text-sm">
                  {feature}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
    </div>
  );
};

export default LandingPage;