// routes/logueoRoutes.js - Rutas para gestión de logueos/fichajes
const express = require('express');
const router = express.Router();
const logueoController = require('../controllers/logueoController');
const { verificarToken } = require('../middlewares/authMiddleware');

// Aplicar middleware de autenticación a todas las rutas
router.use(verificarToken);

// GET - Obtener logueos por mes y año
router.get('/:anio/:mes', logueoController.obtenerLogueos);

// GET - Obtener logueos por empleado
router.get('/:anio/:mes/empleado/:nombre_empleado', logueoController.obtenerLogueosPorEmpleado);

// GET - Obtener logueos por fecha
router.get('/:anio/:mes/fecha/:fecha', logueoController.obtenerLogueosPorFecha);

// GET - Verificar último ingreso (para saber si toca ingreso o egreso)
router.get('/:anio/:mes/verificar/:nombre_empleado', logueoController.verificarUltimoIngreso);

// POST - Crear logueo
router.post('/:anio', logueoController.crearLogueo);

// PUT - Actualizar logueo
router.put('/:anio/:id', logueoController.actualizarLogueo);

// DELETE - Eliminar logueo
router.delete('/:anio/:id', logueoController.eliminarLogueo);

module.exports = router;

