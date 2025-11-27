// routes/extrasRoutes.js - Rutas para gestión de pagos extras
const express = require('express');
const router = express.Router();
const extrasController = require('../controllers/extrasController');
const { verificarToken } = require('../middlewares/authMiddleware');
const validate = require('../middlewares/validate');
const {
    crearExtraSchema,
    actualizarExtraSchema,
    anioMesParamsSchema,
    anioMesEmpleadoParamsSchema,
    anioIdParamsSchema,
    anioParamsSchema
} = require('../validations/extrasValidation');

// Aplicar middleware de autenticación a todas las rutas
router.use(verificarToken);

// GET - Obtener todos los extras de un mes (con filtro opcional de empleado)
router.get('/:anio/:mes', 
    validate(anioMesParamsSchema, 'params'),
    extrasController.obtenerTodosExtras
);

// GET - Obtener extras de un empleado en un mes
router.get('/:anio/:mes/:nombre_empleado', 
    validate(anioMesEmpleadoParamsSchema, 'params'),
    extrasController.obtenerExtras
);

// GET - Obtener descripción de sumas (premios, vacaciones, etc)
router.get('/:anio/:mes/:nombre_empleado/sumas', 
    validate(anioMesEmpleadoParamsSchema, 'params'),
    extrasController.obtenerDescripcionSumas
);

// GET - Obtener descripción de restas (adelantos, consumos, etc)
router.get('/:anio/:mes/:nombre_empleado/restas', 
    validate(anioMesEmpleadoParamsSchema, 'params'),
    extrasController.obtenerDescripcionRestas
);

// POST - Crear pago extra
router.post('/:anio', 
    validate(anioParamsSchema, 'params'),
    validate(crearExtraSchema, 'body'),
    extrasController.crearExtra
);

// PUT - Modificar pago extra
router.put('/:anio/:id', 
    validate(anioIdParamsSchema, 'params'),
    validate(actualizarExtraSchema, 'body'),
    extrasController.modificarExtra
);

// DELETE - Eliminar pago extra
router.delete('/:anio/:id', 
    validate(anioIdParamsSchema, 'params'),
    extrasController.eliminarExtra
);

module.exports = router;

