// routes/marcacionesRoutes.js - Rutas de marcaciones ACTUALIZADAS
const express = require('express');
const router = express.Router();
const marcacionesController = require('../controllers/marcacionesController');
const { authenticateToken, authorizeRole } = require('../middlewares/authMiddleware');

// ========================================
// RUTAS PÚBLICAS (sin autenticación)
// ========================================

/**
 * POST /api/marcaciones/verificar-empleado
 * Verifica si un empleado existe por email
 * Público - No requiere autenticación
 */
router.post('/verificar-empleado', marcacionesController.verificarEmpleado);

/**
 * POST /api/marcaciones/generar-qr
 * Genera un código QR (token JWT) para marcación con acción específica
 * Body: { empleadoId, accion: 'INGRESO' | 'EGRESO' }
 * Público - No requiere autenticación
 */
router.post('/generar-qr', marcacionesController.generarQR);

/**
 * POST /api/marcaciones/registrar
 * Registra una marcación (INGRESO o EGRESO)
 * Body: { token, direccion }
 * Público - Valida token JWT y ubicación con OpenCage API
 */
router.post('/registrar', marcacionesController.registrarMarcacion);

// ========================================
// RUTAS PROTEGIDAS (requieren autenticación)
// ========================================

/**
 * GET /api/marcaciones/logueos/:empleadoId
 * Obtiene el historial de logueos de un empleado
 * Query params: fechaInicio, fechaFin
 * Requiere autenticación (propio empleado o gerente)
 */
router.get(
    '/logueos/:empleadoId', 
    authenticateToken, 
    marcacionesController.obtenerHistorialLogueos
);

/**
 * GET /api/marcaciones/control-hs/:empleadoId
 * Obtiene el historial de control de horas de un empleado
 * Query params: fechaInicio, fechaFin
 * Requiere autenticación (propio empleado o gerente)
 */
router.get(
    '/control-hs/:empleadoId', 
    authenticateToken, 
    marcacionesController.obtenerHistorialControlHs
);

/**
 * GET /api/marcaciones/estado/:empleadoId
 * Obtiene el estado actual de un empleado (último logueo)
 * Requiere autenticación (propio empleado o gerente)
 */
router.get(
    '/estado/:empleadoId', 
    authenticateToken, 
    marcacionesController.obtenerEstadoActual
);

module.exports = router;
