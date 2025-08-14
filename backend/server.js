require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');

const authRoutes = require('./routes/auth');
const produksiRoutes = require('./routes/produsen/produksiRoute'); 
const pesananMasukRoutes = require('./routes/produsen/pesananMasukRoute');

const pesananPbfRoutes = require('./routes/pbf/pesananRoute'); 
const pbfRoutes = require('./routes/pbf/pbfRoute');
const blockchainRoutes = require('./routes/blockchain');

const app = express();

app.use(cors());
app.use(express.json());

// Membuat folder 'uploads' bisa diakses secara publik
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Gunakan semua rute
app.use('/api/auth', authRoutes);
app.use('/api/produksi', produksiRoutes);
app.use('/api/produsen/pesanan-masuk', pesananMasukRoutes);


app.use('/api/pbf/pesanan', pesananPbfRoutes);
app.use('/api/pbf', pbfRoutes);
app.use('/api/blockchain', blockchainRoutes);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server terintegrasi berjalan di http://localhost:${PORT}`);
});
