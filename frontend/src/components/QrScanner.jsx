import React, { useState } from 'react';
import { QrReader } from 'react-qr-reader';
import { X } from 'lucide-react';

const QrScanner = ({ onScanResult, onClose }) => {
  const [error, setError] = useState('');

  const handleResult = (result, error) => {
    if (!!result) {
      onScanResult(result?.text);
    }

    if (!!error) {
      if (error.name !== 'NotFoundException') {
        setError('Gagal mengakses kamera. Pastikan Anda memberikan izin.');
      }
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-md relative">
        <button onClick={onClose} className="absolute top-2 right-2 text-gray-500 hover:text-gray-800">
          <X size={24} />
        </button>
        <h2 className="text-xl font-bold mb-4 text-center">Pindai QR Code Obat</h2>
        <div className="w-full h-64 border rounded-lg overflow-hidden">
          <QrReader
            onResult={handleResult}
            constraints={{ facingMode: 'environment' }}
            style={{ width: '100%' }}
          />
        </div>
        {error && <p className="mt-4 text-sm text-center text-red-500">{error}</p>}
        <p className="mt-4 text-sm text-center text-gray-500">Arahkan kamera ke QR code pada kemasan obat.</p>
      </div>
    </div>
  );
};

export default QrScanner;