// routes/notificacionesRoutes.js - Rutas para notificaciones
const express = require('express');
const router = express.Router();
const notificacionesController = require('../controllers/notificacionesController');
const { verificarToken } = require('../middlewares/authMiddleware');

// Aplicar middleware de autenticación a todas las rutas
router.use(verificarToken);

// GET - Obtener notificaciones de logueos faltantes
router.get('/logueos-faltantes', notificacionesController.obtenerNotificacionesLogueos);

// POST - Forzar verificación y envío de notificaciones (útil para testing)
router.post('/verificar-y-enviar', notificacionesController.verificarYEnviarNotificaciones);

// GET - Obtener estado de WhatsApp
router.get('/whatsapp/estado', notificacionesController.obtenerEstadoWhatsApp);

// POST - Enviar mensaje de prueba por WhatsApp
router.post('/whatsapp/enviar-prueba', notificacionesController.enviarMensajePrueba);

module.exports = router;

