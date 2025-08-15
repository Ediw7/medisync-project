import React, { useState } from 'react';
import { Link } from 'react-router-dom';
// --- PERBAIKAN DI SINI ---
import { 
  Blocks, Shield, Database, Link as LinkIcon, 
  Search, FileCheck, ChevronRight, CheckCircle, Building2, Camera 
} from 'lucide-react';
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

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      
      {/* Hero Section */}
      <div className="relative overflow-hidden pt-20">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_#dcfce7_30%,_transparent_70%)]"></div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-20 relative">
          <div className="text-center">
            <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6">
              Rantai Pasok Farmasi
              <span className="text-emerald-600"> Transparan</span>
            </h1>
            <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
              Amankan keaslian produk dari produsen hingga pasien dengan sistem pelacakan berbasis teknologi blockchain.
            </p>
            <div className="flex flex-col sm:flex-row justify-center gap-4">
              <Link to="/roles" className="px-8 py-4 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-all duration-300 flex items-center justify-center gap-2 shadow-lg">
                <LinkIcon size={20} />
                Masuk Platform
              </Link>
              <button onClick={() => setShowScanner(true)} className="px-8 py-4 border-2 border-emerald-600 text-emerald-600 rounded-lg hover:bg-emerald-50 transition-all duration-300 flex items-center justify-center gap-2">
                <Camera size={20} />
                Lacak dengan QR Code
              </button>
            </div>
          </div>
        </div>
    
        {/* Partner Companies Section */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="bg-white/70 backdrop-blur-md rounded-xl p-8 shadow-lg border border-gray-200">
            <h3 className="text-center text-xl font-semibold text-gray-700 mb-8">
              Perusahaan yang Bekerja Sama dengan Kami
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
              {[
                { name: "Kimia Farma", type: "Perusahaan Farmasi Nasional" },
                { name: "Kalbe Farma", type: "Manufaktur & Distribusi" },
                { name: "Dexa Medica", type: "Produsen Farmasi" },
                { name: "Apotek K-24", type: "Jaringan Apotek Nasional" }
              ].map((company, index) => (
                <div key={index} className="text-center flex flex-col items-center">
                  <div className="h-16 w-16 bg-emerald-50 rounded-full flex items-center justify-center mb-3">
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

      {/* Features Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="text-center mb-16">
            <h2 className="text-3xl font-bold mb-4">Fitur Kami</h2>
        </div>
        <div className="grid md:grid-cols-3 gap-8">
          {[
            { icon: <Database />, title: "Immutable Records", description: "Every transaction is permanently recorded on the blockchain, ensuring complete traceability and authenticity." },
            { icon: <Shield />, title: "Smart Contracts", description: "Automated compliance and verification through blockchain-powered smart contracts." },
            { icon: <FileCheck />, title: "Digital Certificates", description: "Blockchain-verified certificates for each product ensuring authenticity and preventing counterfeits." }
          ].map((feature, index) => (
            <div key={index} className="bg-white p-8 rounded-xl shadow-sm hover:shadow-lg transition-shadow border border-gray-100">
              <div className="h-14 w-14 bg-emerald-100 rounded-xl flex items-center justify-center mb-6">
                <div className="text-emerald-600">{React.cloneElement(feature.icon, { size: 28 })}</div>
              </div>
              <h3 className="text-xl font-semibold text-gray-800 mb-3">{feature.title}</h3>
              <p className="text-gray-600">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>

      {/* How It Works Section */}
      <div className="bg-white py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold mb-4">Blockchain-Powered Supply Chain</h2>
            <p className="text-xl text-gray-600">Complete transparency from manufacturer to end-user</p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              "Smart contract verification", "Real-time blockchain tracking", "Decentralized record keeping", "Automated compliance",
              "Product authentication", "Temperature monitoring", "Secure data sharing", "Digital certificates"
            ].map((feature, index) => (
              <div key={index} className="flex items-center gap-3 bg-emerald-50 p-4 rounded-lg border border-emerald-100">
                <CheckCircle className="text-emerald-600 flex-shrink-0" />
                <span className="text-gray-700 font-medium">{feature}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="bg-emerald-600">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 text-center">
          <h2 className="text-3xl font-bold mb-4 text-white">Join Our Blockchain Network</h2>
          <p className="text-xl mb-8 text-emerald-100">Connect your supply chain to our secure blockchain platform</p>
          <Link to="/roles" 
            className="inline-flex items-center px-8 py-4 bg-white text-emerald-600 rounded-lg 
                     hover:bg-emerald-50 transition-all duration-300 font-medium gap-2 shadow-lg">
            Connect Now
            <ChevronRight size={20} />
          </Link>
        </div>
      </div>

       {showScanner && <QrScanner onScanResult={handleScanResult} onClose={() => setShowScanner(false)} />}
      
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