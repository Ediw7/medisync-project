import React, { useState } from 'react';
import { QrReader } from 'react-qr-reader';
import { X, RefreshCw, AlertTriangle, Upload, Image as ImageIcon } from 'lucide-react';
import QrScannerLib from 'qr-scanner'; // Pastikan npm install qr-scanner

const QrScanner = ({ onScanResult, onClose }) => {
  const [error, setError] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  // Handle Scan Kamera
  const handleResult = (result, error) => {
    if (result) {
      onScanResult(result?.text);
      // Matikan suara 'beep' default jika ada, atau biarkan
    }
    if (error) {
      // Abaikan error scanning frame-by-frame
      if (error.message?.includes("No QR code found")) return;
      
      // Deteksi error permission
      if (error.name === 'NotAllowedError' || error.name === 'NotFoundError') {
         setError('Gagal mengakses kamera. Pastikan izin diberikan.');
      }
    }
  };

  // Handle Upload File
  const handleFileUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    setIsProcessing(true);
    try {
      // Decode QR dari gambar menggunakan library qr-scanner
      const result = await QrScannerLib.scanImage(file);
      if (result) {
        onScanResult(result);
      }
    } catch (err) {
      console.error(err);
      alert("QR Code tidak terdeteksi dalam gambar ini.");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    // PERBAIKAN 1: Background lebih transparan (bg-black/60) & Blur
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-md p-4 transition-all duration-300">
      
      <div className="bg-white rounded-3xl w-full max-w-md overflow-hidden shadow-2xl relative animate-in fade-in zoom-in duration-300 flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-white z-10">
          <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
            <RefreshCw className="text-emerald-600 animate-spin-slow" size={20} />
            Pindai QR Code
          </h3>
          <button 
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X size={20} className="text-gray-500" />
          </button>
        </div>

        {/* Area Kamera */}
        <div className="relative bg-black flex-1 min-h-[300px] flex items-center justify-center overflow-hidden">
          {!error ? (
            <>
              <QrReader
                onResult={handleResult}
                constraints={{ facingMode: 'environment' }}
                className="w-full h-full object-cover absolute inset-0"
                videoContainerStyle={{ height: '100%', paddingTop: 0 }}
                videoStyle={{ objectFit: 'cover', height: '100%' }}
              />
              
              {/* Overlay Kotak Pindai */}
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
                <div className="w-64 h-64 border-2 border-emerald-500/50 rounded-3xl relative bg-transparent shadow-[0_0_0_9999px_rgba(0,0,0,0.5)]">
                  {/* Sudut-sudut */}
                  <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-emerald-500 rounded-tl-xl"></div>
                  <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-emerald-500 rounded-tr-xl"></div>
                  <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-emerald-500 rounded-bl-xl"></div>
                  <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-emerald-500 rounded-br-xl"></div>
                  
                  {/* Garis Scanning */}
                  <div className="absolute left-2 right-2 h-0.5 bg-emerald-400 shadow-[0_0_15px_#34d399] animate-[scan_2s_linear_infinite]"></div>
                </div>
              </div>
              
              {/* Text Instruksi Overlay */}
              <div className="absolute bottom-8 left-0 right-0 text-center z-20 pointer-events-none">
                <p className="text-white/90 text-sm font-medium bg-black/40 inline-block px-4 py-1 rounded-full backdrop-blur-sm">
                  Arahkan kamera ke QR Code
                </p>
              </div>
            </>
          ) : (
            <div className="flex flex-col items-center justify-center text-center p-6 text-white z-10">
              <AlertTriangle size={48} className="text-red-500 mb-4" />
              <p className="text-lg font-semibold">Akses Kamera Gagal</p>
              <p className="text-sm text-gray-400 mt-2 mb-6 max-w-xs">{error}</p>
              <button 
                onClick={() => window.location.reload()}
                className="px-6 py-2 bg-emerald-600 rounded-full text-sm font-bold hover:bg-emerald-700 transition-colors"
              >
                Muat Ulang Halaman
              </button>
            </div>
          )}
        </div>

        {/* PERBAIKAN 2: Footer dengan Tombol Upload */}
        <div className="p-5 bg-white border-t border-gray-100 flex flex-col items-center gap-3 z-10">
            <div className="w-full flex items-center gap-4">
                <div className="h-[1px] bg-gray-200 flex-1"></div>
                <span className="text-xs text-gray-400 font-medium uppercase">Atau</span>
                <div className="h-[1px] bg-gray-200 flex-1"></div>
            </div>

            <label className={`
                flex items-center justify-center gap-2 w-full py-3 rounded-xl border-2 border-dashed border-gray-300 
                hover:border-emerald-500 hover:bg-emerald-50 cursor-pointer transition-all group
                ${isProcessing ? 'opacity-50 cursor-not-allowed' : ''}
            `}>
                <input 
                    type="file" 
                    accept="image/*" 
                    className="hidden" 
                    onChange={handleFileUpload}
                    disabled={isProcessing}
                />
                <div className="p-2 bg-gray-100 rounded-full group-hover:bg-white transition-colors">
                    <ImageIcon size={20} className="text-gray-500 group-hover:text-emerald-600" />
                </div>
                <span className="text-sm font-semibold text-gray-600 group-hover:text-emerald-700">
                    {isProcessing ? 'Memproses...' : 'Unggah Gambar dari Galeri'}
                </span>
            </label>
        </div>

      </div>
      
      <style>{`
        @keyframes scan {
          0% { top: 4%; opacity: 0; }
          10% { opacity: 1; }
          90% { opacity: 1; }
          100% { top: 96%; opacity: 0; }
        }
      `}</style>
    </div>
  );
};

export default QrScanner;