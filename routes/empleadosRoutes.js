// routes/empleadosRoutes.js - Rutas para gestión de empleados
const express = require('express');
const router = express.Router();
const empleadosController = require('../controllers/empleadosController');
const { verificarToken } = require('../middlewares/authMiddleware');
const upload = require('../middlewares/upload');

// Aplicar middleware de autenticación a todas las rutas
router.use(verificarToken);

// GET - Obtener todos los empleados
router.get('/', empleadosController.obtenerEmpleados);

// GET - Obtener empleado por ID
router.get('/:id', empleadosController.obtenerEmpleadoPorId);

// GET - Obtener empleado por nombre
router.get('/nombre/:nombre', empleadosController.obtenerEmpleadoPorNombre);

// GET - Obtener hora normal de un empleado
router.get('/hora-normal/:nombre', empleadosController.obtenerHoraNormal);

// POST - Crear nuevo empleado (con foto opcional)
router.post('/', upload.single('foto_perfil'), empleadosController.crearEmpleado);

// PUT - Actualizar empleado (con foto opcional)
router.put('/:id', upload.single('foto_perfil'), empleadosController.actualizarEmpleado);

// PUT - Actualizar hora normal
router.put('/:id/hora-normal', empleadosController.actualizarHoraNormal);

// POST - Crear empleado completo (con generación de turnos y totales)
router.post('/completo', empleadosController.crearEmpleadoCompleto);

// POST - Calcular antigüedad de un empleado
router.post('/calcular-antiguedad', empleadosController.calcularAntiguedad);

// DELETE - Eliminar empleado
router.delete('/:id', empleadosController.eliminarEmpleado);

module.exports = router;

