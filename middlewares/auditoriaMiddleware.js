// middlewares/auditoriaMiddleware.js - Middleware para auditoría de acciones
const db = require('../controllers/dbPromise');

/**
 * Auditar acciones de autenticación
 * @param {Object} req - Request object
 * @param {Object} datos - Datos de auditoría
 */
const auditarAuth = async (req, datos) => {
    try {
        const {
            accion,
            usuarioId = null,
            usuarioNombre = 'DESCONOCIDO',
            estado,
            detallesAdicionales = null
        } = datos;

        // Obtener información de la request
        const ip = req.ip || req.connection.remoteAddress || 'DESCONOCIDO';
        const userAgent = req.headers['user-agent'] || 'DESCONOCIDO';

        // Log en consola
        console.log(`[AUDIT] ${accion} - Usuario: ${usuarioNombre} (${usuarioId}) - Estado: ${estado} - IP: ${ip}`);
        
        if (detallesAdicionales) {
            console.log(`[AUDIT] Detalles: ${detallesAdicionales}`);
        }

        // Aquí podrías guardar en una tabla de auditoría si lo deseas
        // Por ahora solo hacemos logging en consola
        
    } catch (error) {
        console.error('❌ Error en auditoría:', error);
        // No lanzamos error para no interrumpir el flujo principal
    }
};

/**
 * Limpiar datos sensibles de un objeto
 * @param {Object} obj - Objeto a limpiar
 * @returns {Object} - Objeto sin datos sensibles
 */
const limpiarDatosSensibles = (obj) => {
    const objLimpio = { ...obj };
    
    // Lista de campos sensibles a eliminar
    const camposSensibles = ['password', 'token', 'refreshToken', 'jwt', 'secret'];
    
    camposSensibles.forEach(campo => {
        if (objLimpio[campo]) {
            objLimpio[campo] = '***OCULTO***';
        }
    });
    
    return objLimpio;
};

module.exports = {
    auditarAuth,
    limpiarDatosSensibles
};

