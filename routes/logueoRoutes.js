// routes/logueoRoutes.js - Rutas para gestión de logueos/fichajes
const express = require('express');
const router = express.Router();
const logueoController = require('../controllers/logueoController');
const { verificarToken } = require('../middlewares/authMiddleware');
const validate = require('../middlewares/validate');
const { crearLogueoSchema, actualizarLogueoSchema } = require('../validations/logueoValidation');
const { idParamSchema } = require('../validations/commonValidation');

// Aplicar middleware de autenticación a todas las rutas
router.use(verificarToken);

// ⚠️ IMPORTANTE: Las rutas específicas deben ir ANTES de las rutas con parámetros dinámicos

// GET - Obtener configuración actual de logueo (contraseña y teléfono)
router.get('/configuracion', logueoController.obtenerConfiguracionLogueo);

// POST - Actualizar configuración de logueo (contraseña y/o teléfono)
router.post('/configuracion', logueoController.actualizarConfiguracionLogueo);

// GET - Obtener logueos por mes y año
router.get('/:anio/:mes', logueoController.obtenerLogueos);

// GET - Obtener logueos por empleado
router.get('/:anio/:mes/empleado/:nombre_empleado', logueoController.obtenerLogueosPorEmpleado);

// GET - Obtener logueos por fecha
router.get('/:anio/:mes/fecha/:fecha', logueoController.obtenerLogueosPorFecha);

// GET - Verificar último ingreso (para saber si toca ingreso o egreso)
router.get('/:anio/:mes/verificar/:nombre_empleado', logueoController.verificarUltimoIngreso);

// POST - Crear logueo
router.post('/:anio', 
    validate(crearLogueoSchema, 'body'),
    logueoController.crearLogueo
);

// PUT - Actualizar logueo
router.put('/:anio/:id', 
    validate(idParamSchema, 'params'),
    validate(actualizarLogueoSchema, 'body'),
    logueoController.actualizarLogueo
);

// DELETE - Eliminar logueo
router.delete('/:anio/:id', 
    validate(idParamSchema, 'params'),
    logueoController.eliminarLogueo
);

module.exports = router;

