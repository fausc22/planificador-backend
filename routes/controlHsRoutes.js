// routes/controlHsRoutes.js - Rutas para control de horas
const express = require('express');
const router = express.Router();
const controlHsController = require('../controllers/controlHsController');
const { verificarToken } = require('../middlewares/authMiddleware');

// Aplicar middleware de autenticación a todas las rutas
router.use(verificarToken);

// GET - Obtener control de horas por empleado, mes y año
router.get('/:anio/:mes/:nombre_empleado', controlHsController.obtenerControlHoras);

// POST - Registrar ingreso/egreso
router.post('/:anio', controlHsController.registrarIngresoEgreso);

// PUT - Modificar registro
router.put('/:anio/:id', controlHsController.modificarRegistro);

// POST - Recalcular acumulados (útil después de cambiar tarifa)
router.post('/:anio/recalcular', controlHsController.recalcularAcumulados);

module.exports = router;

