// routes/testUpload.js - Ruta de prueba para upload
const express = require('express');
const router = express.Router();
const upload = require('../middlewares/upload');

// Ruta de prueba sin autenticación
router.post('/test-upload', upload.single('foto_perfil'), (req, res) => {
    console.log('📝 Body:', req.body);
    console.log('📸 File:', req.file);
    
    if (req.file) {
        res.json({
            success: true,
            message: 'Archivo subido exitosamente',
            filename: req.file.filename,
            path: req.file.path,
            url: `/uploads/empleados/${req.file.filename}`
        });
    } else {
        res.json({
            success: false,
            message: 'No se recibió archivo'
        });
    }
});

module.exports = router;

