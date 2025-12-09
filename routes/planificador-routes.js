// routes/planificador-routes.js - Rutas consolidadas del sistema de planificación
const express = require('express');
const router = express.Router();

// Importar todas las rutas del planificador
const authRoutes = require('./authRoutes');
const empleadosRoutes = require('./empleadosRoutes');
const turnosRoutes = require('./turnosRoutes');
const feriadosRoutes = require('./feriadosRoutes');
const planeamientoRoutes = require('./planeamientoRoutes');
const vacacionesRoutes = require('./vacacionesRoutes');
const controlHsRoutes = require('./controlHsRoutes');
const logueoRoutes = require('./logueoRoutes');
const extrasRoutes = require('./extrasRoutes');
const recibosRoutes = require('./recibosRoutes');
const marcacionesRoutes = require('./marcacionesRoutes');
const notificacionesRoutes = require('./notificacionesRoutes');

// Montar todas las rutas bajo el prefijo /api/planificador
// Las rutas ya tienen su prefijo interno (ej: /api/auth), pero aquí se agrega /api/planificador
// Entonces quedarán como: /api/planificador/auth, /api/planificador/empleados, etc.
router.use('/auth', authRoutes);
router.use('/empleados', empleadosRoutes);
router.use('/turnos', turnosRoutes);
router.use('/feriados', feriadosRoutes);
router.use('/planeamiento', planeamientoRoutes);
router.use('/vacaciones', vacacionesRoutes);
router.use('/control-hs', controlHsRoutes);
router.use('/logueo', logueoRoutes);
router.use('/extras', extrasRoutes);
router.use('/recibos', recibosRoutes);
router.use('/marcaciones', marcacionesRoutes);
router.use('/notificaciones', notificacionesRoutes);

// Ruta de información del módulo planificador
router.get('/', (req, res) => {
    res.json({
        success: true,
        message: 'Sistema de Planificación de Empleados',
        version: '1.0.0',
        endpoints: {
            auth: '/api/planificador/auth',
            empleados: '/api/planificador/empleados',
            turnos: '/api/planificador/turnos',
            feriados: '/api/planificador/feriados',
            planeamiento: '/api/planificador/planeamiento',
            vacaciones: '/api/planificador/vacaciones',
            'control-hs': '/api/planificador/control-hs',
            logueo: '/api/planificador/logueo',
            extras: '/api/planificador/extras',
            recibos: '/api/planificador/recibos',
            marcaciones: '/api/planificador/marcaciones',
            notificaciones: '/api/planificador/notificaciones'
        }
    });
});

module.exports = router;

