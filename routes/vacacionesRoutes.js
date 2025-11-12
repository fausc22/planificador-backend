// routes/vacacionesRoutes.js - Rutas para gestión de vacaciones
const express = require('express');
const router = express.Router();
const vacacionesController = require('../controllers/vacacionesController');
const { verificarToken } = require('../middlewares/authMiddleware');

// Aplicar middleware de autenticación a todas las rutas
router.use(verificarToken);

// GET - Obtener todas las vacaciones
router.get('/', vacacionesController.obtenerVacaciones);

// GET - Obtener vacaciones por empleado
router.get('/empleado/:nombre_empleado', vacacionesController.obtenerVacacionesPorEmpleado);

// POST - Crear vacaciones
router.post('/', vacacionesController.crearVacaciones);

// PUT - Actualizar vacaciones
router.put('/:id', vacacionesController.actualizarVacaciones);

// DELETE - Eliminar vacaciones
router.delete('/:id', vacacionesController.eliminarVacaciones);

module.exports = router;

