require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');

const authRoutes = require('./routes/auth');
const produksiRoutes = require('./routes/produsen/produksiRoute'); 
const pesananMasukRoutes = require('./routes/produsen/pesananMasukRoute');
const pembatalanRoutes = require('./routes/produsen/pembatalanRoute');
const riwayatRoute = require('./routes/produsen/riwayatRoute');
const laporananalitikRoutes = require('./routes/produsen/laporananalitikRoute');
const pesananPbfRoutes = require('./routes/pbf/pesananRoute'); 
const pbfRoutes = require('./routes/pbf/pbfRoute');
const penerimaanRoutes = require('./routes/pbf/penerimaanRoute'); 
const dashboardPbfRoutes = require('./routes/pbf/dashboardRoute');
const blockchainRoutes = require('./routes/blockchain');
const publicRoutes = require('./routes/publicRoute');
const produksiController = require('./controllers/produsen/produksiController');
const stokPbfRoutes = require('./routes/pbf/stokRoute');

const apotekRoutes = require('./routes/apotek/apotekRoute'); 
const pesananApotekPbfRoutes = require('./routes/pbf/pesananApotekRoute'); 
const penerimaanApotekRoutes = require('./routes/apotek/penerimaanRoute');

const app = express();

app.use(cors());
app.use(express.json());

// Membuat folder 'uploads' bisa diakses secara publik
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Gunakan semua rute
app.use('/api/auth', authRoutes);
app.use('/api/produksi', produksiRoutes);
app.use('/api/produsen/pesanan-masuk', pesananMasukRoutes);
app.use('/api/produsen/pembatalan', pembatalanRoutes);
app.use('/api/produsen/riwayat-distribusi', riwayatRoute);
app.use('/api/produsen', laporananalitikRoutes);
app.use('/api/pbf/pesanan', pesananPbfRoutes);
app.use('/api/pbf/stok', stokPbfRoutes);

app.use('/api/pbf/pesanan-apotek', pesananApotekPbfRoutes); 

app.use('/api/pbf', pbfRoutes);
app.use('/api/pbf/penerimaan', penerimaanRoutes); 
app.use('/api/pbf/dashboard', dashboardPbfRoutes);
app.use('/api/blockchain', blockchainRoutes);
app.use('/api/public', publicRoutes);
app.use('/api/apotek', apotekRoutes);
app.use('/api/apotek/penerimaan', penerimaanApotekRoutes);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server terintegrasi berjalan di http://localhost:${PORT}`);
});