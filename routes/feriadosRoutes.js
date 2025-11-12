// routes/feriadosRoutes.js - Rutas para gestión de feriados
const express = require('express');
const router = express.Router();
const feriadosController = require('../controllers/feriadosController');
const { verificarToken } = require('../middlewares/authMiddleware');

// Aplicar middleware de autenticación a todas las rutas
router.use(verificarToken);

// GET - Obtener todos los feriados
router.get('/', feriadosController.obtenerFeriados);

// GET - Obtener feriados por periodo/año
router.get('/periodo/:periodo', feriadosController.obtenerFeriadosPorPeriodo);

// GET - Verificar si una fecha es feriado
router.get('/verificar/:fecha', feriadosController.esFeriado);

// GET - Obtener información de un feriado por fecha
router.get('/fecha/:fecha', feriadosController.obtenerFeriadoPorFecha);

// POST - Crear nuevo feriado
router.post('/', feriadosController.crearFeriado);

// POST - Importar múltiples feriados
router.post('/importar', feriadosController.importarFeriados);

// PUT - Actualizar feriado
router.put('/:id', feriadosController.actualizarFeriado);

// DELETE - Eliminar feriado
router.delete('/:id', feriadosController.eliminarFeriado);

module.exports = router;

