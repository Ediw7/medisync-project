import React, { useState, useRef } from 'react';
import { QrReader } from 'react-qr-reader'; // ✅ gunakan react-qr-reader, bukan @zxing
import { X, Camera, Upload, AlertTriangle, RefreshCw } from 'lucide-react';
import { toast } from 'react-hot-toast';

const QrScanner = ({ onScanResult, onClose }) => {
  const [error, setError] = useState(null);
  const [isScanning, setIsScanning] = useState(true);
  const fileInputRef = useRef(null);

  const handleScan = (result) => {
    if (result?.text) {
      onScanResult(result.text);
    }
  };

  const handleError = (err) => {
    console.error("QR Camera Error:", err);
    setError("Gagal mengakses kamera. Pastikan Anda memberikan izin dan kamera tidak sedang digunakan.");
    setIsScanning(false);
  };

  // Fungsi untuk memicu klik input file
  const handleUploadClick = () => {
    fileInputRef.current.click();
  };

  // Fungsi untuk menangani file yang diupload (sementara belum diimplementasikan)
  const handleFileChange = (event) => {
    const file = event.target.files[0];
    if (!file) return;
    toast.error("Fitur upload file belum diimplementasikan.");
    event.target.value = null;
  };

  return (
    <div 
      className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[100] p-4 animate-in fade-in-0 duration-300"
      onClick={onClose}
    >
      <div 
        className="bg-white p-6 rounded-2xl shadow-2xl w-full max-w-md relative border border-slate-200 animate-in zoom-in-95 duration-300"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Tombol Close */}
        <button 
          onClick={onClose} 
          className="absolute -top-3 -right-3 z-10 text-white bg-slate-800 rounded-full p-1.5 shadow-lg hover:bg-red-600 transition-colors"
        >
          <X size={20} />
        </button>
        
        <h2 className="text-xl font-bold mb-4 text-center text-slate-900 flex items-center justify-center gap-2">
          <Camera size={22} className="text-emerald-600" />
          Pindai QR Code Obat
        </h2>

        {/* Kontainer Scanner */}
        <div className="w-full h-80 bg-slate-900 border-4 border-slate-300 rounded-xl overflow-hidden relative shadow-inner">
          {isScanning ? (
            <QrReader
              constraints={{ facingMode: 'environment' }}
              onResult={(result, error) => {
                if (result) handleScan(result);
                if (error && error.name !== "NotFoundException") {
                  handleError(error);
                }
              }}
              scanDelay={500}
              containerStyle={{ width: '100%', height: '100%' }}
              videoContainerStyle={{ width: '100%', height: '100%' }}
              videoStyle={{ objectFit: 'cover' }}
            />
          ) : (
            // Tampilan jika kamera error
            <div className="flex flex-col items-center justify-center h-full text-center p-4">
              <AlertTriangle size={40} className="text-red-500 mb-4" />
              <p className="text-white font-medium mb-2">Kamera Error</p>
              <p className="text-slate-400 text-sm mb-4">{error}</p>
              <button
                onClick={() => {
                  setIsScanning(true);
                  setError(null);
                }}
                className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg text-sm font-medium hover:bg-emerald-700 transition"
              >
                <RefreshCw size={16} />
                Coba Lagi
              </button>
            </div>
          )}
          
          {/* Garis laser (opsional) */}
          {isScanning && (
            <div className="absolute top-1/2 left-0 w-full h-1 bg-red-500 shadow-[0_0_10px_2px_rgba(239,68,68,0.7)] animate-laser-scan"></div>
          )}
        </div>
        
        <p className="mt-4 text-sm text-center text-slate-500">
          Arahkan kamera ke QR code pada kemasan obat.
        </p>

        {/* Tombol Upload */}
        <div className="mt-4 pt-4 border-t border-slate-200">
          <input
            type="file"
            accept="image/png, image/jpeg"
            ref={fileInputRef}
            onChange={handleFileChange}
            className="hidden"
          />
          <button
            onClick={handleUploadClick}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-slate-100 text-slate-700 rounded-lg text-sm font-medium hover:bg-slate-200 transition"
          >
            <Upload size={16} />
            Atau Unggah dari Galeri
          </button>
        </div>
      </div>

      {/* CSS animasi laser */}
      <style>{`
        @keyframes laser-scan {
          0% { transform: translateY(-100px); opacity: 0.8; }
          50% { transform: translateY(100px); opacity: 1; }
          100% { transform: translateY(-100px); opacity: 0.8; }
        }
        .animate-laser-scan {
          animation: laser-scan 2.5s infinite ease-in-out;
        }
      `}</style>
    </div>
  );
};

export default QrScanner;
