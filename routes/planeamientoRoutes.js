// routes/planeamientoRoutes.js - Rutas para planificación de empleados
const express = require('express');
const router = express.Router();
const planeamientoController = require('../controllers/planeamientoController');
const pdfPlanificadorController = require('../controllers/pdfPlanificadorController');
const { verificarToken } = require('../middlewares/authMiddleware');

// Aplicar middleware de autenticación a todas las rutas
router.use(verificarToken);

// ========================================
// RUTAS DE CONSULTA
// ========================================

// GET - Cargar planificador (grilla básica con turnos)
// Ejemplo: /api/planeamiento/planificador/1/2024 o /api/planeamiento/planificador/Enero/2024
router.get('/planificador/:mes/:anio', planeamientoController.cargarPlanificador);

// GET - Cargar planificador detallado (con horas o acumulado)
// Ejemplo: /api/planeamiento/planificador-detallado/1/2024?campo=horas
router.get('/planificador-detallado/:mes/:anio', planeamientoController.cargarPlanificadorDetallado);

// GET - Cargar totales mensuales
// Ejemplo: /api/planeamiento/totales/1/2024?campo=horas
router.get('/totales/:mes/:anio', planeamientoController.cargarTotalesMensuales);

// GET - Obtener turno específico
// Ejemplo: /api/planeamiento/turno/2024/01/01/2024/Juan
router.get('/turno/:anio/:fecha/:empleado', planeamientoController.obtenerTurno);

// ========================================
// RUTAS DE MODIFICACIÓN
// ========================================

// PUT - Actualizar turno de un empleado en una fecha
// Body: { fecha, nombreEmpleado, turno }
router.put('/turno/:mes/:anio', planeamientoController.actualizarTurno);

// PUT - Actualizar mes trabajado (recalcular acumulados por cambio en tarifa)
// Body: { nombreEmpleado, diferencia }
router.put('/actualizar-mes/:anio', planeamientoController.actualizarMesTrabajado);

// ========================================
// RUTAS DE GENERACIÓN
// ========================================

// POST - Generar turnos y totales para un año completo
// Ejemplo: /api/planeamiento/generar/2025
router.post('/generar/:anio', planeamientoController.generarTurnosYTotales);

// POST - Generar PDF del planificador
// Body: { colores: { "Juan Pérez": "#E3F2FD", ... } }
router.post('/pdf/:mes/:anio', pdfPlanificadorController.generarPdfPlanificador);

module.exports = router;

