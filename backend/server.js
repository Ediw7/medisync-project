require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const http = require('http');
const { Server } = require('socket.io');

const authRoutes = require('./routes/auth');
const produksiRoutes = require('./routes/produsen/produksiRoute'); // Pastikan path ini benar
const pesananMasukRoutes = require('./routes/produsen/pesananMasukRoute');
const pembatalanRoutes = require('./routes/produsen/pembatalanRoute');
const riwayatRoute = require('./routes/produsen/riwayatRoute');
const laporananalitikRoutes = require('./routes/produsen/laporananalitikRoute');
const produsenProfilRoutes = require('./routes/produsen/profilRoute');

const pesananPbfRoutes = require('./routes/pbf/pesananRoute'); 
const pbfRoutes = require('./routes/pbf/pbfRoute');
const penerimaanRoutes = require('./routes/pbf/penerimaanRoute'); 
const dashboardPbfRoutes = require('./routes/pbf/dashboardRoute');
const blockchainRoutes = require('./routes/blockchain');
const publicRoutes = require('./routes/publicRoute');
// const produksiController = require('./controllers/produsen/produksiController'); // Tidak perlu di server.js

const stokPbfRoutes = require('./routes/pbf/stokRoute');
const pbfDistribusiRoutes = require('./routes/pbf/distribusiRoute');
const laporanRoutes = require('./routes/pbf/laporanRoute');
const pengembalianPbfRoute = require('./routes/pbf/pengembalianRoute');
const pbfProfilRoutes = require('./routes/pbf/profilRoute');

const apotekRoutes = require('./routes/apotek/apotekRoute'); 
const apotekProfilRoutes = require('./routes/apotek/profilRoute');
const pesananApotekPbfRoutes = require('./routes/pbf/pesananApotekRoute'); 
const penerimaanApotekRoutes = require('./routes/apotek/penerimaanRoute');
const dashboardApotekRoutes = require('./routes/apotek/dashboardRoute');
const batalkanApotekRoute = require('./routes/apotek/batalkanRoute');
const pengembalianApotekRoute = require('./routes/apotek/pengembalianRoute');
const penjualanApotekRoute = require('./routes/apotek/penjualanRoute');
const laporanApotekRoute = require('./routes/apotek/laporanApotekRoute');

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: "http://localhost:5173", 
    methods: ["GET", "POST"]
  }
});

app.use(cors());
app.use(express.json());

// Akses folder upload publik
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Middleware Socket.io
app.use((req, res, next) => {
  req.io = io;
  next();
});

// --- ROUTE MOUNTING ---

app.use('/api/auth', authRoutes);

// [REVISI PENTING DI SINI]
// Dulu: app.use('/api/produksi', produksiRoutes); 
// Sekarang: Diganti ke '/api/produsen' agar URL-nya menjadi /api/produsen/produksi
app.use('/api/produsen', produksiRoutes); 

app.use('/api/produsen', produsenProfilRoutes);
app.use('/api/produsen/pesanan-masuk', pesananMasukRoutes);
app.use('/api/produsen/pembatalan', pembatalanRoutes);
app.use('/api/produsen/riwayat-distribusi', riwayatRoute);
app.use('/api/produsen', laporananalitikRoutes);

// Route PBF
app.use('/api/pbf/pesanan', pesananPbfRoutes);
app.use('/api/pbf/stok', stokPbfRoutes);
app.use('/api/pbf/riwayat-distribusi', pbfDistribusiRoutes)
app.use('/api/pbf/pesanan-apotek', pesananApotekPbfRoutes); 
app.use('/api/pbf/penerimaan', penerimaanRoutes); 
app.use('/api/pbf/dashboard', dashboardPbfRoutes);
app.use('/api/pbf/laporan', laporanRoutes);
app.use('/api/pbf/pengembalian', pengembalianPbfRoute);
app.use('/api/pbf', pbfRoutes);
app.use('/api/pbf', pbfProfilRoutes);

// Route Blockchain & Public
app.use('/api/blockchain', blockchainRoutes);
app.use('/api/public', publicRoutes);

// Route Apotek
app.use('/api/apotek/penerimaan', penerimaanApotekRoutes);
app.use('/api/apotek/dashboard', dashboardApotekRoutes);
app.use('/api/apotek/pengembalian', pengembalianApotekRoute);
app.use('/api/apotek/batalkan', batalkanApotekRoute);
app.use('/api/apotek/penjualan', penjualanApotekRoute);
app.use('/api/apotek/laporan', laporanApotekRoute);
app.use('/api/apotek', apotekRoutes);
app.use('/api/apotek', apotekProfilRoutes);

const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
  console.log(`Server terintegrasi (+Socket.io) berjalan di http://localhost:${PORT}`);
});