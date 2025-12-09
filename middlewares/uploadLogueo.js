// middlewares/uploadLogueo.js - Configuración de Multer para subida de fotos de logueos
// PATRÓN IDÉNTICO A upload.js (empleados) que funciona correctamente
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Crear directorio si no existe
const uploadDir = path.join(__dirname, '../../public/uploads/logueos');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

// Configuración de almacenamiento
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        // Generar nombre único: logueo_timestamp.ext
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const ext = path.extname(file.originalname);
        cb(null, `logueo-${uniqueSuffix}${ext}`);
    }
});

// Filtro de archivos (solo imágenes)
const fileFilter = (req, file, cb) => {
    console.log('🔍 [MULTER] Validando archivo:', file.originalname, 'mimetype:', file.mimetype);
    
    const allowedTypes = /jpeg|jpg|png|gif|webp/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    
    // Aceptar si la extensión es válida (ignorar mimetype por el proxy PHP)
    if (extname) {
        console.log('✅ [MULTER] Archivo aceptado por extensión');
        return cb(null, true);
    } else {
        console.log('❌ [MULTER] Archivo rechazado');
        cb(new Error('Solo se permiten imágenes (jpeg, jpg, png, gif, webp)'));
    }
};

// Configurar multer
const uploadLogueo = multer({
    storage: storage,
    limits: {
        fileSize: 5 * 1024 * 1024 // 5MB máximo
    },
    fileFilter: fileFilter
});

module.exports = uploadLogueo;
