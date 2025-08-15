import React from 'react';
import { X, CheckCircle, AlertTriangle, Clock, ChevronRight, Hash, Pill, Calendar, Building } from 'lucide-react';

const RiwayatObatModal = ({ data, error, onClose, isLoading }) => {
  const getStatusInfo = (status) => {
    switch (status) {
      case 'DIPRODUKSI': return { icon: <CheckCircle className="text-blue-500" />, text: 'Diproduksi oleh' };
      case 'DIKIRIM_KE_PBF': return { icon: <CheckCircle className="text-purple-500" />, text: 'Dikirim ke PBF' };
      case 'DIKIRIM_KE_APOTEK': return { icon: <CheckCircle className="text-orange-500" />, text: 'Dikirim ke Apotek' };
      case 'TERJUAL_KE_KONSUMEN': return { icon: <CheckCircle className="text-green-500" />, text: 'Terjual kepada' };
      default: return { icon: <Clock className="text-gray-500" />, text: status };
    }
  };

  const DetailItem = ({ icon, label, value }) => (
    <div className="flex items-start">
        <div className="flex-shrink-0 text-gray-400">{icon}</div>
        <div className="ml-3">
            <p className="text-sm font-medium text-gray-500">{label}</p>
            <p className="text-base font-semibold text-gray-800">{value || '-'}</p>
        </div>
    </div>
  );

  // Ambil data produksi dari catatan pertama dalam riwayat
  const infoProduksi = data?.[0]?.Value;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-2xl relative animate-fade-in-up">
        <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-gray-800">
          <X size={24} />
        </button>
        <h2 className="text-2xl font-bold mb-4 text-center">Hasil Pelacakan Obat</h2>

        {isLoading && <p className="text-center">Mencari data di blockchain...</p>}
        
        {error && (
            <div className="text-center p-4 bg-red-50 rounded-lg">
                <AlertTriangle className="mx-auto h-12 w-12 text-red-400" />
                <h3 className="mt-2 text-lg font-medium text-red-800">Data Tidak Ditemukan</h3>
                <p className="mt-1 text-sm text-red-700">{error}</p>
            </div>
        )}

        {infoProduksi && (
          <div>
            <div className="bg-gray-50 p-4 rounded-lg mb-6 border">
              <h3 className="font-bold text-lg">{infoProduksi.namaObat}</h3>
              <p className="text-sm text-gray-600">Batch ID: {infoProduksi.id}</p>
            </div>
            
            <div className="mb-6">
                <h3 className="font-semibold text-gray-700 mb-4 border-b pb-2">Detail Produksi</h3>
                <div className="grid grid-cols-2 gap-4">
                    <DetailItem icon={<Building size={20}/>} label="Produsen" value={infoProduksi.pemilikSaatIni} />
                    <DetailItem icon={<Pill size={20}/>} label="Bentuk Sediaan & Dosis" value={`${infoProduksi.bentukSediaan} - ${infoProduksi.dosis}`} />
                    <DetailItem icon={<Calendar size={20}/>} label="Tanggal Produksi" value={new Date(infoProduksi.tanggalProduksi).toLocaleDateString('id-ID')} />
                    <DetailItem icon={<Calendar size={20}/>} label="Tanggal Kadaluarsa" value={new Date(infoProduksi.tanggalKadaluarsa).toLocaleDateString('id-ID')} />
                    <DetailItem icon={<FileText size={20}/>} label="Nomor Izin Edar" value={infoProduksi.nomorIzinEdar} />
                    <DetailItem icon={<Hash size={20}/>} label="Hash Sertifikat" value={infoProduksi.hashDokumen.hasilUjiMutu.substring(0, 15) + '...'} />
                </div>
            </div>

            <div>
                <h3 className="font-semibold text-gray-700 mb-4 border-b pb-2">Riwayat Perjalanan</h3>
                <ul className="space-y-4">
                  {data.map((item, index) => {
                    const { icon, text } = getStatusInfo(item.Value.statusSaatIni);
                    return (
                      <li key={item.TxId} className="flex items-start gap-4">
                        <div className="flex flex-col items-center">
                          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-100">{icon}</span>
                          {index < data.length - 1 && <div className="h-12 w-0.5 bg-gray-200" />}
                        </div>
                        <div>
                          <p className="font-semibold">{text} <span className="font-bold text-emerald-600">{item.Value.pemilikSaatIni}</span></p>
                          <p className="text-sm text-gray-500">{new Date(item.Timestamp).toLocaleString('id-ID')}</p>
                        </div>
                      </li>
                    );
                  })}
                </ul>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default RiwayatObatModal;
