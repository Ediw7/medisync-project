import React, { useState, useRef, useCallback, useEffect } from 'react';
import { QrReader } from 'react-qr-reader';
import { X, Camera, Upload, AlertTriangle, RefreshCw } from 'lucide-react';
import { toast } from 'react-hot-toast';

const QrScanner = React.memo(({ onScanResult, onClose }) => {
  const [error, setError] = useState(null);
  const [isScanning, setIsScanning] = useState(true);
  const [hasScanned, setHasScanned] = useState(false);
  const [scannerKey, setScannerKey] = useState(0); // Reset scanner
  const fileInputRef = useRef(null);
  const videoRef = useRef(null);

  // --- STOP VIDEO SEBELUM RESET ---
  const stopVideo = useCallback(() => {
    if (videoRef.current?.srcObject) {
      videoRef.current.srcObject.getTracks().forEach(track => track.stop());
    }
  }, []);

  // --- SCAN HANDLER ---
  const handleScan = useCallback((result) => {
    if (result?.text && !hasScanned) {
      setHasScanned(true);
      setIsScanning(false);
      stopVideo();
      onScanResult(result.text);
      toast.success('QR Code berhasil dipindai!');
      setTimeout(() => onClose(), 1500);
    }
  }, [hasScanned, onScanResult, onClose, stopVideo]);

  // --- ERROR HANDLER ---
  const handleError = useCallback((err) => {
    stopVideo();
    let msg = 'Gagal mengakses kamera.';
    if (err.name === 'NotAllowedError') msg = 'Akses kamera ditolak. Izinkan di pengaturan.';
    else if (err.name === 'NotFoundError') msg = 'Kamera tidak ditemukan.';
    else if (err.name === 'AbortError') msg = 'Kamera terganggu. Coba lagi.';
    setError(msg);
    setIsScanning(false);
  }, [stopVideo]);

  // --- RESET SCANNER ---
  const resetScanner = useCallback(() => {
    stopVideo();
    setIsScanning(true);
    setError(null);
    setHasScanned(false);
    setScannerKey(prev => prev + 1); // Force remount
  }, [stopVideo]);

  // --- UPLOAD GAMBAR (ZXING) ---
  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    try {
      const { BrowserQRCodeReader } = await import('@zxing/library');
      const reader = new BrowserQRCodeReader();
      const result = await reader.decodeFromImageUrl(URL.createObjectURL(file));
      if (result?.text) {
        setHasScanned(true);
        onScanResult(result.text);
        toast.success('QR dari gambar berhasil!');
        setTimeout(() => onClose(), 1500);
      }
    } catch (err) {
      toast.error('QR tidak ditemukan di gambar.');
    } finally {
      e.target.value = null;
    }
  };

  // --- CLEANUP ON UNMOUNT ---
  useEffect(() => {
    return () => stopVideo();
  }, [stopVideo]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-300">
        
        {/* HEADER */}
        <div className="flex items-center justify-between p-5 bg-gradient-to-r from-emerald-600 to-teal-600 text-white">
          <h3 className="text-xl font-bold flex items-center gap-3">
            <Camera size={22} /> Pindai QR Code Obat
          </h3>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-white/20 transition-all"
          >
            <X size={22} />
          </button>
        </div>

        {/* SCANNER VIEW */}
        <div className="relative h-80 bg-black overflow-hidden">
          {isScanning ? (
            <QrReader
              key={scannerKey}
              onResult={(result, error) => {
                if (result) handleScan(result);
                if (error) handleError(error);
              }}
              constraints={{ facingMode: 'environment' }}
              scanDelay={1000}
              videoContainerStyle={{ width: '100%', height: '100%' }}
              videoStyle={{ objectFit: 'cover' }}
              className="w-full h-full"
              // Fix willReadFrequently
              onLoad={(video) => {
                videoRef.current = video;
                const canvas = video?.querySelector('canvas');
                if (canvas) {
                  const ctx = canvas.getContext('2d');
                  if (ctx) ctx.willReadFrequently = true;
                }
              }}
            />
          ) : (
            <div className="flex flex-col items-center justify-center h-full p-6 text-center space-y-4">
              <AlertTriangle className="w-14 h-14 text-red-500 animate-pulse" />
              <p className="text-gray-700 font-medium">{error}</p>
              <button
                onClick={resetScanner}
                className="flex items-center gap-2 px-5 py-3 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 transition-all font-medium"
              >
                <RefreshCw size={18} /> Coba Lagi
              </button>
            </div>
          )}

          {/* LASER LINE */}
          {isScanning && (
            <div className="absolute inset-x-8 top-1/2 h-1 bg-red-500/90 shadow-lg animate-laser">
              <div className="h-full w-full bg-gradient-to-r from-transparent via-red-400 to-transparent"></div>
            </div>
          )}
        </div>

        {/* FOOTER */}
        <div className="p-5 bg-gradient-to-t from-gray-50 to-white border-t">
          <p className="text-center text-sm text-gray-600 mb-4 font-medium">
            Arahkan kamera ke QR code pada kemasan obat.
          </p>
          <button
            onClick={() => fileInputRef.current?.click()}
            className="w-full flex items-center justify-center gap-3 py-3 bg-gray-200 text-gray-800 rounded-xl hover:bg-gray-300 transition-all font-medium text-sm"
          >
            <Upload size={18} /> Atau Unggah dari Galeri
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            className="hidden"
          />
        </div>
      </div>

      {/* ANIMASI */}
      <style jsx>{`
        @keyframes laser {
          0%, 100% { transform: translateY(-50%) scaleY(1); opacity: 0.8; }
          50% { transform: translateY(-50%) scaleY(2); opacity: 1; }
        }
        .animate-laser { animation: laser 1.8s infinite ease-in-out; }
        .animate-in { animation: fadeIn 0.3s ease-out; }
        @keyframes fadeIn {
          from { opacity: 0; transform: scale(0.95); }
          to { opacity: 1; transform: scale(1); }
        }
      `}</style>
    </div>
  );
});

QrScanner.displayName = 'QrScanner';

export default QrScanner;