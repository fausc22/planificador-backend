// routes/turnosRoutes.js - Rutas para gestión de turnos/horarios
const express = require('express');
const router = express.Router();
const turnosController = require('../controllers/turnosController');
const { verificarToken } = require('../middlewares/authMiddleware');
const validate = require('../middlewares/validate');
const {
    crearTurnoSchema,
    actualizarTurnoSchema,
    calcularHorasSchema
} = require('../validations/turnosValidation');
const { idParamSchema } = require('../validations/commonValidation');

// Aplicar middleware de autenticación a todas las rutas
router.use(verificarToken);

// GET - Obtener todos los turnos
router.get('/', turnosController.obtenerTurnos);

// GET - Obtener turno por ID
router.get('/:id', 
    validate(idParamSchema, 'params'),
    turnosController.obtenerTurnoPorId
);

// GET - Obtener horas de un turno específico
router.get('/horas/:turno', turnosController.obtenerHorasTurno);

// POST - Crear nuevo turno
router.post('/', 
    validate(crearTurnoSchema, 'body'),
    turnosController.crearTurno
);

// POST - Calcular horas entre hora inicio y fin
router.post('/calcular-horas', 
    validate(calcularHorasSchema, 'body'),
    turnosController.calcularHoras
);

// PUT - Actualizar turno
router.put('/:id', 
    validate(idParamSchema, 'params'),
    validate(actualizarTurnoSchema, 'body'),
    turnosController.actualizarTurno
);

// DELETE - Eliminar turno
router.delete('/:id', 
    validate(idParamSchema, 'params'),
    turnosController.eliminarTurno
);

module.exports = router;

