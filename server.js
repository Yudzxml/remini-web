const express = require('express');
const multer = require('multer');
const path = require('path');
const processImage = require('./api/process-image'); // Mengimpor API untuk memproses gambar

const app = express();
const port = 3000;

// Middleware untuk menyimpan file yang diunggah
const upload = multer({ dest: 'uploads/' });

// Middleware untuk melayani file statis
app.use(express.static(path.join(__dirname))); // Melayani file statis dari root

// Endpoint untuk memproses gambar
app.post('/api/process-image', upload.single('image'), processImage);

// Menjalankan server
app.listen(port, () => {
    console.log(`Server berjalan di http://localhost:${port}`);
});