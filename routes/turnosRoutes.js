// routes/turnosRoutes.js - Rutas para gestión de turnos/horarios
const express = require('express');
const router = express.Router();
const turnosController = require('../controllers/turnosController');
const { verificarToken } = require('../middlewares/authMiddleware');

// Aplicar middleware de autenticación a todas las rutas
router.use(verificarToken);

// GET - Obtener todos los turnos
router.get('/', turnosController.obtenerTurnos);

// GET - Obtener turno por ID
router.get('/:id', turnosController.obtenerTurnoPorId);

// GET - Obtener horas de un turno específico
router.get('/horas/:turno', turnosController.obtenerHorasTurno);

// POST - Crear nuevo turno
router.post('/', turnosController.crearTurno);

// POST - Calcular horas entre hora inicio y fin
router.post('/calcular-horas', turnosController.calcularHoras);

// PUT - Actualizar turno
router.put('/:id', turnosController.actualizarTurno);

// DELETE - Eliminar turno
router.delete('/:id', turnosController.eliminarTurno);

module.exports = router;

