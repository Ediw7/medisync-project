// frontend/src/pages/pbf/pesanobat/LihatRiwayat.jsx (Updated to handle :id param and all riwayat)
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useParams, Link } from 'react-router-dom'; // Added Link for navigation

// Icons
import { FaBox, FaTruck, FaCheckCircle } from 'react-icons/fa';

const LihatRiwayatPbf = () => {
  const { id } = useParams(); // For specific riwayat/:id
  const [riwayat, setRiwayat] = useState(null);
  const [riwayatList, setRiwayatList] = useState([]); // For list view if no id
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [viewMode, setViewMode] = useState(id ? 'detail' : 'list'); // 'list' or 'detail'

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);

        const token = localStorage.getItem('token');
        if (!token) {
          throw new Error('Token autentikasi tidak ditemukan.');
        }

        const config = {
          headers: { Authorization: `Bearer ${token}` },
        };

        if (id) {
          // Detail view
          const response = await axios.get(`/api/pbf/riwayat/${id}`, config);
          if (response.data.success) {
            setRiwayat(response.data.data);
            setViewMode('detail');
          }
        } else {
          // List view - fetch all
          const response = await axios.get('/api/pbf/riwayat', config);
          if (response.data.success) {
            setRiwayatList(response.data.data);
            setViewMode('list');
          }
        }
      } catch (err) {
        setError(err.response?.data?.message || 'Gagal memuat data dari blockchain');
        console.error('Error fetching data:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id]);

  if (loading) {
    return (
      <div className="loading-container" style={{ padding: '20px', textAlign: 'center' }}>
        <p>Memuat riwayat pengiriman dari blockchain...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="error-container" style={{ padding: '20px', color: 'red', textAlign: 'center' }}>
        <p>Error: {error}</p>
      </div>
    );
  }

  // Format timestamp
  const formatTimestamp = (isoString) => {
    if (!isoString) return 'N/A';
    const date = new Date(isoString);
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${day}-${month}-${year} ${hours}:${minutes}`;
  };

  // Detail View
  if (viewMode === 'detail' && riwayat) {
    const currentStatus = riwayat.statusSaatIni;
    const pengirim = riwayat.riwayat?.[0]?.pemilik || 'ProdusenMSP';
    const waktuPesan = formatTimestamp(riwayat.riwayat?.[0]?.timestamp);
    const idPesanan = riwayat.id_aset || riwayat.batchId || 'N/A'; // Adapt field
    const noSuratJalan = riwayat.hashDokumen?.suratJalan || 'N/A';
    const tujuan = riwayat.pemilikSaatIni === 'PBFMSP' ? 'PBF Semarang' : 'Apotek Ada'; // From image
    const estimasiSampai = formatTimestamp(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)); // Example: +7 days

    const timeline = (riwayat.riwayat || [])
      .filter((item) => item.status)
      .map((item, index) => ({
        status: item.status
          .replace('DIKIRIM_KE_', 'Dikirim ')
          .replace('DITERIMA_', 'Diterima ')
          .replace('_PBF', ' ke PBF')
          .replace('_APOTEK', ' ke Apotek'),
        timestamp: formatTimestamp(item.timestamp),
        icon: index === 0 ? <FaBox /> : index === 1 ? <FaTruck /> : <FaCheckCircle />,
        completed: index < (riwayat.riwayat.length - 1),
        detail: item.detail || '',
      }));

    return (
      <div className="lihat-riwayat-container" style={{ padding: '20px', fontFamily: 'Arial, sans-serif' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h1 style={{ margin: 0, color: '#4CAF50' }}>Pantau Pengiriman ke PBF</h1>
          <Link to="/pbf/pesanobat" style={{ textDecoration: 'none' }}>
            <button style={{ background: '#4CAF50', color: 'white', border: 'none', padding: '10px', borderRadius: '5px' }}>
              Kembali ke Daftar
            </button>
          </Link>
        </div>

        {/* Detail Cards - Adapt from image */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '10px', marginBottom: '20px' }}>
          <div style={{ border: '1px solid #ddd', padding: '10px', borderRadius: '5px' }}>
            <label style={{ fontWeight: 'bold' }}>No Resi</label>
            <p>002 887 772 47</p>
          </div>
          <div style={{ border: '1px solid #ddd', padding: '10px', borderRadius: '5px' }}>
            <label style={{ fontWeight: 'bold' }}>Pengirim</label>
            <p>{pengirim}</p>
          </div>
          <div style={{ border: '1px solid #ddd', padding: '10px', borderRadius: '5px' }}>
            <label style={{ fontWeight: 'bold' }}>Waktu Pesan</label>
            <p>{waktuPesan}</p>
          </div>
          <div style={{ border: '1px solid #ddd', padding: '10px', borderRadius: '5px' }}>
            <label style={{ fontWeight: 'bold' }}>ID Pesanan</label>
            <p>{idPesanan}</p>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '10px', marginBottom: '20px' }}>
          <div style={{ border: '1px solid #ddd', padding: '10px', borderRadius: '5px' }}>
            <label style={{ fontWeight: 'bold' }}>No Surat Jalan</label>
            <p>{noSuratJalan}</p>
          </div>
          <div style={{ border: '1px solid #ddd', padding: '10px', borderRadius: '5px' }}>
            <label style={{ fontWeight: 'bold' }}>Tujuan</label>
            <p>{tujuan}</p>
          </div>
          <div style={{ border: '1px solid #ddd', padding: '10px', borderRadius: '5px' }}>
            <label style={{ fontWeight: 'bold' }}>Estimasi Sampai</label>
            <p>{estimasiSampai}</p>
          </div>
        </div>

        {/* Timeline */}
        <div style={{ marginTop: '30px' }}>
          <h3 style={{ color: '#4CAF50', marginBottom: '10px' }}>Timeline Pengiriman</h3>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            {timeline.map((step, index) => (
              <div key={index} style={{ textAlign: 'center', flex: 1, position: 'relative' }}>
                <div
                  style={{
                    width: '50px',
                    height: '50px',
                    borderRadius: '50%',
                    backgroundColor: step.completed ? '#4CAF50' : '#e0e0e0',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    margin: '0 auto 10px',
                    color: step.completed ? 'white' : 'gray',
                    zIndex: 2,
                  }}
                >
                  {step.icon}
                </div>
                <p style={{ fontSize: '12px', margin: '0 0 5px 0', fontWeight: step.completed ? 'bold' : 'normal' }}>
                  {step.status}
                </p>
                <p style={{ fontSize: '10px', color: '#666', margin: 0 }}>{step.timestamp}</p>
                {step.detail && (
                  <p style={{ fontSize: '9px', color: '#999', marginTop: '5px' }}>{step.detail}</p>
                )}
                {index < timeline.length - 1 && (
                  <div
                    style={{
                      position: 'absolute',
                      top: '50px',
                      left: '50%',
                      transform: 'translateX(-50%)',
                      height: '100px', // Adjust based on content height
                      width: '2px',
                      backgroundColor: step.completed ? '#4CAF50' : '#e0e0e0',
                      zIndex: 1,
                    }}
                  />
                )}
              </div>
            ))}
          </div>
        </div>

        <div style={{ marginTop: '20px', textAlign: 'center', color: '#666' }}>
          <p>Data diambil dari Blockchain Medisync - Immutable & Secure</p>
        </div>
      </div>
    );
  }

  // List View (if no id)
  if (viewMode === 'list') {
    return (
      <div style={{ padding: '20px', fontFamily: 'Arial, sans-serif' }}>
        <h1 style={{ color: '#4CAF50' }}>Daftar Riwayat Pengiriman</h1>
        {riwayatList.length === 0 ? (
          <p>Tidak ada riwayat pengiriman.</p>
        ) : (
          <ul style={{ listStyle: 'none', padding: 0 }}>
            {riwayatList.map((item) => (
              <li key={item.id_aset || item.pesananId} style={{ border: '1px solid #ddd', margin: '10px 0', padding: '10px', borderRadius: '5px' }}>
                <Link to={`/pbf/pesanobat/lihat-riwayat/${item.id_aset || item.pesananId}`} style={{ textDecoration: 'none', color: '#4CAF50' }}>
                  <strong>ID: {item.id_aset || item.pesananId}</strong> - Status: {item.statusSaatIni}
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    );
  }

  return <div>Tidak ada data yang tersedia.</div>;
};

export default LihatRiwayatPbf;