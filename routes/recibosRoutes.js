// routes/recibosRoutes.js - Rutas para gestión de recibos
const express = require('express');
const router = express.Router();
const recibosController = require('../controllers/recibosController');
const { verificarToken } = require('../middlewares/authMiddleware');

// Aplicar middleware de autenticación a todas las rutas
router.use(verificarToken);

// GET - Obtener recibo específico de un empleado
router.get('/:nombre_empleado/:mes/:anio', recibosController.obtenerRecibo);

// GET - Cargar datos de recibo (genera automáticamente si no existe)
router.get('/:nombre_empleado/:mes/:anio/datos', recibosController.cargarDatosRecibo);

// GET - Obtener todos los recibos de un mes/año
router.get('/:mes/:anio', recibosController.obtenerRecibosPorMes);

// POST - Guardar o actualizar recibo
router.post('/', recibosController.guardarRecibo);

// DELETE - Eliminar recibo
router.delete('/:nombre_empleado/:mes/:anio', recibosController.eliminarRecibo);

module.exports = router;

