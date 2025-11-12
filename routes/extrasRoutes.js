// routes/extrasRoutes.js - Rutas para gestión de pagos extras
const express = require('express');
const router = express.Router();
const extrasController = require('../controllers/extrasController');
const { verificarToken } = require('../middlewares/authMiddleware');

// Aplicar middleware de autenticación a todas las rutas
router.use(verificarToken);

// GET - Obtener extras de un empleado en un mes
router.get('/:anio/:mes/:nombre_empleado', extrasController.obtenerExtras);

// GET - Obtener todos los extras de un mes
router.get('/:anio/:mes', extrasController.obtenerExtrasPorMes);

// GET - Obtener descripción de sumas (premios, vacaciones, etc)
router.get('/:anio/:mes/:nombre_empleado/sumas', extrasController.obtenerDescripcionSumas);

// GET - Obtener descripción de restas (adelantos, consumos, etc)
router.get('/:anio/:mes/:nombre_empleado/restas', extrasController.obtenerDescripcionRestas);

// POST - Crear pago extra
router.post('/:anio', extrasController.crearExtra);

// PUT - Modificar pago extra
router.put('/:anio/:id', extrasController.modificarExtra);

// DELETE - Eliminar pago extra
router.delete('/:anio/:id', extrasController.eliminarExtra);

module.exports = router;

