// routes/vacacionesRoutes.js - Rutas para gestión de vacaciones
const express = require('express');
const router = express.Router();
const vacacionesController = require('../controllers/vacacionesController');
const { verificarToken } = require('../middlewares/authMiddleware');
const validate = require('../middlewares/validate');
const {
    crearVacacionesSchema,
    actualizarVacacionesSchema,
    actualizarDiasVacacionesSchema
} = require('../validations/vacacionesValidation');

// Aplicar middleware de autenticación a todas las rutas
router.use(verificarToken);

// GET - Obtener todas las vacaciones
router.get('/', vacacionesController.obtenerVacaciones);

// GET - Obtener vacaciones por empleado
router.get('/empleado/:nombre_empleado', vacacionesController.obtenerVacacionesPorEmpleado);

// GET - Obtener empleados con días de vacaciones disponibles
router.get('/empleados', vacacionesController.obtenerEmpleadosConDiasVacaciones);

// POST - Crear vacaciones
router.post('/', 
    validate(crearVacacionesSchema, 'body'),
    vacacionesController.crearVacaciones
);

// PUT - Actualizar vacaciones
router.put('/:id', 
    validate(actualizarVacacionesSchema, 'body'),
    vacacionesController.actualizarVacaciones
);

// PUT - Actualizar días de vacaciones de un empleado directamente
router.put('/empleado/:id/dias', 
    validate(actualizarDiasVacacionesSchema, 'body'),
    vacacionesController.actualizarDiasVacaciones
);

// DELETE - Eliminar vacaciones
router.delete('/:id', vacacionesController.eliminarVacaciones);

module.exports = router;

