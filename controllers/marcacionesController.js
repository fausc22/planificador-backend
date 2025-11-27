// controllers/marcacionesController.js - Controlador de marcaciones ACTUALIZADO
const db = require('./db');
const jwt = require('jsonwebtoken');
const marcacionesService = require('../services/marcacionesService');
const AppError = require('../utils/AppError');
const fs = require('fs');
const path = require('path');

/**
 * Verifica si un empleado existe por email y devuelve sus datos
 * Endpoint público - No requiere autenticación
 */
async function verificarEmpleado(req, res, next) {
    try {
        const { email } = req.body;
        
        if (!email) {
            throw new AppError('Email es requerido', 400);
        }
        
        // Buscar empleado por email (con hora_normal para cálculos)
        db.query(
            `SELECT id, nombre, apellido, mail, hora_normal 
             FROM empleados 
             WHERE mail = ? `,
            [email],
            (error, results) => {
                if (error) {
                    console.error('Error buscando empleado:', error);
                    throw new AppError('Error al buscar empleado', 500);
                }
                
                if (!results || results.length === 0) {
                    return res.status(404).json({
                        success: false,
                        message: 'No se encontró un empleado activo con ese email'
                    });
                }
                
                const empleado = results[0];
                
                res.json({
                    success: true,
                    message: 'Empleado encontrado',
                    empleado: {
                        id: empleado.id,
                        nombre: empleado.nombre,
                        apellido: empleado.apellido,
                        nombreCompleto: `${empleado.nombre} ${empleado.apellido}`,
                        email: empleado.mail,
                        horaNormal: empleado.hora_normal || 8
                    }
                });
            }
        );
    } catch (error) {
        next(error);
    }
}

/**
 * Genera un QR (token JWT) para marcación con acción específica
 * Endpoint público - No requiere autenticación
 */
async function generarQR(req, res, next) {
    try {
        const { empleadoId, accion } = req.body;
        
        if (!empleadoId) {
            throw new AppError('ID de empleado es requerido', 400);
        }
        
        if (!accion || !['INGRESO', 'EGRESO'].includes(accion)) {
            throw new AppError('Acción inválida. Debe ser INGRESO o EGRESO', 400);
        }
        
        // Verificar que el empleado existe
        db.query(
            'SELECT id, nombre, apellido, mail, hora_normal FROM empleados WHERE id = ? ',
            [empleadoId],
            async (error, results) => {
                if (error) {
                    console.error('Error verificando empleado:', error);
                    throw new AppError('Error al verificar empleado', 500);
                }
                
                if (!results || results.length === 0) {
                    return res.status(404).json({
                        success: false,
                        message: 'Empleado no encontrado'
                    });
                }
                
                const empleado = results[0];
                const nombreCompleto = `${empleado.nombre} ${empleado.apellido}`;
                
                // Validar que la acción sea posible
                try {
                    const actionValidation = await marcacionesService.validateAction(nombreCompleto, accion);
                    
                    if (!actionValidation.valid) {
                        return res.status(400).json({
                            success: false,
                            message: actionValidation.message
                        });
                    }
                } catch (validationError) {
                    console.error('Error validando acción:', validationError);
                    throw new AppError('Error al validar acción', 500);
                }
                
                // Generar token JWT con expiración corta (5 minutos)
                const token = jwt.sign(
                    {
                        empleadoId: empleado.id,
                        nombre: empleado.nombre,
                        apellido: empleado.apellido,
                        email: empleado.mail,
                        horaNormal: empleado.hora_normal, // Precio por hora del empleado
                        accion,
                        tipo: 'marcacion' // Identificador del tipo de token
                    },
                    process.env.JWT_SECRET,
                    { expiresIn: '5m' } // Token válido por 5 minutos
                );
                
                // URL para escanear (debe apuntar a tu frontend)
                const baseUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
                const marcacionUrl = `${baseUrl}/marcar-asistencia?token=${token}`;
                
                res.json({
                    success: true,
                    message: 'QR generado exitosamente',
                    data: {
                        token,
                        qrUrl: marcacionUrl,
                        empleado: {
                            id: empleado.id,
                            nombre: empleado.nombre,
                            apellido: empleado.apellido,
                            nombreCompleto
                        },
                        accion,
                        expiraEn: '5 minutos'
                    }
                });
            }
        );
    } catch (error) {
        next(error);
    }
}

/**
 * Registra una marcación con foto (INGRESO o EGRESO)
 * Endpoint público - Valida email, contraseña y procesa marcación con foto
 */
async function registrarMarcacionConFoto(req, res, next) {
    try {
        const { email, password, accion } = req.body;
        const foto = req.file;
        
        // Validaciones básicas
        if (!email) {
            throw new AppError('Email es requerido', 400);
        }
        
        if (!password) {
            throw new AppError('Contraseña es requerida', 400);
        }
        
        if (!accion || !['INGRESO', 'EGRESO'].includes(accion)) {
            throw new AppError('Acción inválida. Debe ser INGRESO o EGRESO', 400);
        }
        
        if (!foto) {
            throw new AppError('Foto es requerida', 400);
        }
        
        // Validar contraseña
        const loginPass = process.env.LOGIN_PASS;
        if (!loginPass) {
            console.error('❌ LOGIN_PASS no está configurado en .env');
            throw new AppError('Error de configuración del servidor', 500);
        }
        
        if (password !== loginPass) {
            throw new AppError('Contraseña incorrecta', 403);
        }
        
        // Buscar empleado por email
        db.query(
            `SELECT id, nombre, apellido, mail, hora_normal 
             FROM empleados 
             WHERE mail = ?`,
            [email],
            async (error, results) => {
                if (error) {
                    console.error('Error buscando empleado:', error);
                    throw new AppError('Error al buscar empleado', 500);
                }
                
                if (!results || results.length === 0) {
                    return res.status(404).json({
                        success: false,
                        message: 'No se encontró un empleado activo con ese email'
                    });
                }
                
                const empleado = results[0];
                const nombreCompleto = `${empleado.nombre} ${empleado.apellido}`;
                
                try {
                    // Generar nombre de archivo con formato: TIPO-APELLIDO-HH-MM-SS.jpg
                    // Usamos guiones en lugar de dos puntos para compatibilidad con sistemas de archivos
                    const ahora = new Date();
                    const hora = ahora.toTimeString().split(' ')[0].replace(/:/g, '-'); // HH-MM-SS
                    const apellido = empleado.apellido.toUpperCase().replace(/\s+/g, '');
                    const nombreFoto = `${accion}-${apellido}-${hora}.jpg`;
                    
                    // Mover/renombrar el archivo temporal al nombre final
                    const uploadDir = path.join(__dirname, '../public/uploads/logueos');
                    const tempPath = foto.path;
                    const finalPath = path.join(uploadDir, nombreFoto);
                    
                    // Si el archivo ya existe, agregar timestamp único
                    let nombreFinal = nombreFoto;
                    if (fs.existsSync(finalPath)) {
                        const timestamp = Date.now();
                        const ext = path.extname(nombreFoto);
                        const nombreSinExt = path.basename(nombreFoto, ext);
                        nombreFinal = `${nombreSinExt}-${timestamp}${ext}`;
                    }
                    
                    const finalPathConTimestamp = path.join(uploadDir, nombreFinal);
                    fs.renameSync(tempPath, finalPathConTimestamp);
                    
                    // Procesar marcación con foto (sin validación de ubicación)
                    const empleadoData = {
                        id: empleado.id,
                        nombre: empleado.nombre,
                        apellido: empleado.apellido,
                        hora_normal: empleado.hora_normal
                    };
                    
                    const resultado = await marcacionesService.procesarMarcacionConFoto(
                        empleadoData,
                        accion,
                        finalPathConTimestamp, // fotoPath
                        nombreFinal // fotoNombre
                    );
                    
                    // Si fue rechazado
                    if (resultado.rechazado) {
                        // Eliminar foto si la marcación fue rechazada
                        if (fs.existsSync(finalPathConTimestamp)) {
                            fs.unlinkSync(finalPathConTimestamp);
                        }
                        
                        return res.status(400).json({
                            success: false,
                            rechazado: true,
                            message: resultado.message,
                            data: resultado.data
                        });
                    }
                    
                    // Marcación exitosa
                    res.json({
                        success: true,
                        rechazado: false,
                        message: resultado.message,
                        data: {
                            ...resultado.data,
                            foto: nombreFinal
                        }
                    });
                    
                } catch (marcacionError) {
                    console.error('Error procesando marcación:', marcacionError);
                    
                    // Eliminar foto si hubo error
                    if (foto && foto.path && fs.existsSync(foto.path)) {
                        fs.unlinkSync(foto.path);
                    }
                    
                    throw new AppError(
                        marcacionError.message || 'Error al registrar marcación', 
                        500
                    );
                }
            }
        );
        
    } catch (error) {
        next(error);
    }
}

/**
 * Registra una marcación (INGRESO o EGRESO) validando ubicación
 * Endpoint público - Valida token JWT y ubicación con OpenCage API
 */
async function registrarMarcacion(req, res, next) {
    try {
        const { token, latitude, longitude, direccion, password } = req.body;
        
        // Validaciones básicas
        if (!token) {
            throw new AppError('Token es requerido', 400);
        }
        
        // Validar contraseña
        if (!password) {
            throw new AppError('Contraseña es requerida', 400);
        }
        
        const loginPass = process.env.LOGIN_PASS;
        if (!loginPass) {
            console.error('❌ LOGIN_PASS no está configurado en .env');
            throw new AppError('Error de configuración del servidor', 500);
        }
        
        if (password !== loginPass) {
            throw new AppError('Contraseña incorrecta', 403);
        }
        
        // Debe proporcionar coordenadas o dirección
        if (!latitude && !longitude && (!direccion || direccion.trim().length < 5)) {
            throw new AppError('Debe proporcionar coordenadas (latitude, longitude) o dirección válida', 400);
        }
        
        // Verificar y decodificar token
        let decoded;
        try {
            decoded = jwt.verify(token, process.env.JWT_SECRET);
            
            // Verificar que sea un token de marcación
            if (decoded.tipo !== 'marcacion') {
                throw new AppError('Token inválido para marcación', 403);
            }
        } catch (jwtError) {
            if (jwtError.name === 'TokenExpiredError') {
                throw new AppError('El código QR ha expirado. Por favor genera uno nuevo.', 401);
            }
            throw new AppError('Token inválido', 403);
        }
        
        // Procesar marcación con el servicio
        try {
            const empleado = {
                id: decoded.empleadoId,
                nombre: decoded.nombre,
                apellido: decoded.apellido,
                hora_normal: decoded.horaNormal
            };
            
            const resultado = await marcacionesService.procesarMarcacion(
                empleado,
                decoded.accion,
                latitude,
                longitude,
                direccion ? direccion.trim() : null
            );
            
            // Si fue rechazado (fuera de rango o validación fallida)
            if (resultado.rechazado) {
                return res.status(400).json({
                    success: false,
                    rechazado: true,
                    message: resultado.message,
                    data: resultado.data
                });
            }
            
            // Marcación exitosa
            res.json({
                success: true,
                rechazado: false,
                message: resultado.message,
                data: resultado.data
            });
            
        } catch (marcacionError) {
            console.error('Error procesando marcación:', marcacionError);
            throw new AppError(
                marcacionError.message || 'Error al registrar marcación', 
                500
            );
        }
        
    } catch (error) {
        next(error);
    }
}

/**
 * Obtiene el historial de logueos de un empleado
 * Requiere autenticación
 */
async function obtenerHistorialLogueos(req, res, next) {
    try {
        const { empleadoId } = req.params;
        const { fechaInicio, fechaFin } = req.query;
        
        // Verificar permisos: solo el propio empleado o un gerente
        if (req.user.id != empleadoId && req.user.rol !== 'GERENTE') {
            throw new AppError('No tienes permiso para ver este historial', 403);
        }
        
        // Obtener nombre completo del empleado
        db.query(
            'SELECT nombre, apellido FROM empleados WHERE id = ?',
            [empleadoId],
            async (error, results) => {
                if (error || !results || results.length === 0) {
                    throw new AppError('Empleado no encontrado', 404);
                }
                
                const nombreCompleto = `${results[0].nombre} ${results[0].apellido}`;
                
                const historial = await marcacionesService.obtenerHistorialLogueos(
                    nombreCompleto,
                    fechaInicio,
                    fechaFin
                );
                
                res.json({
                    success: true,
                    message: 'Historial de logueos obtenido exitosamente',
                    data: historial
                });
            }
        );
        
    } catch (error) {
        next(error);
    }
}

/**
 * Obtiene el historial de control de horas de un empleado
 * Requiere autenticación
 */
async function obtenerHistorialControlHs(req, res, next) {
    try {
        const { empleadoId } = req.params;
        const { fechaInicio, fechaFin } = req.query;
        
        // Verificar permisos
        if (req.user.id != empleadoId && req.user.rol !== 'GERENTE') {
            throw new AppError('No tienes permiso para ver este historial', 403);
        }
        
        // Obtener nombre completo del empleado
        db.query(
            'SELECT nombre, apellido FROM empleados WHERE id = ?',
            [empleadoId],
            async (error, results) => {
                if (error || !results || results.length === 0) {
                    throw new AppError('Empleado no encontrado', 404);
                }
                
                const nombreCompleto = `${results[0].nombre} ${results[0].apellido}`;
                
                const historial = await marcacionesService.obtenerHistorialControlHs(
                    nombreCompleto,
                    fechaInicio,
                    fechaFin
                );
                
                res.json({
                    success: true,
                    message: 'Historial de control de horas obtenido exitosamente',
                    data: historial
                });
            }
        );
        
    } catch (error) {
        next(error);
    }
}

/**
 * Obtiene el estado actual de un empleado (último logueo)
 * Requiere autenticación
 */
async function obtenerEstadoActual(req, res, next) {
    try {
        const { empleadoId } = req.params;
        
        // Verificar permisos
        if (req.user.id != empleadoId && req.user.rol !== 'GERENTE') {
            throw new AppError('No tienes permiso para ver este estado', 403);
        }
        
        // Obtener nombre completo del empleado
        db.query(
            'SELECT nombre, apellido FROM empleados WHERE id = ?',
            [empleadoId],
            async (error, results) => {
                if (error || !results || results.length === 0) {
                    throw new AppError('Empleado no encontrado', 404);
                }
                
                const nombreCompleto = `${results[0].nombre} ${results[0].apellido}`;
                
                const ultimoLogueo = await marcacionesService.getLastLogueoToday(nombreCompleto);
                
                const enTrabajo = ultimoLogueo && ultimoLogueo.accion === 'INGRESO';
                const siguienteAccion = enTrabajo ? 'EGRESO' : 'INGRESO';
                
                res.json({
                    success: true,
                    message: 'Estado obtenido exitosamente',
                    data: {
                        ultimoLogueo,
                        enTrabajo,
                        siguienteAccion
                    }
                });
            }
        );
        
    } catch (error) {
        next(error);
    }
}

/**
 * Verifica qué acción debe registrar un empleado (INGRESO o EGRESO)
 * Endpoint público - No requiere autenticación
 */
async function verificarAccionPermitida(req, res, next) {
    try {
        const { nombreEmpleado } = req.body;
        
        if (!nombreEmpleado) {
            throw new AppError('Nombre del empleado es requerido', 400);
        }
        
        // Obtener año y mes actual
        const ahora = new Date();
        const anio = ahora.getFullYear();
        const mes = ahora.toLocaleString('es-ES', { month: 'long' }).toUpperCase();
        
        // Usar el servicio de marcaciones para verificar
        const lastLogueo = await marcacionesService.getLastLogueoToday(nombreEmpleado);
        
        let ultimaAccion = null;
        let debeRegistrar = 'INGRESO';
        
        if (lastLogueo) {
            ultimaAccion = lastLogueo.accion;
            debeRegistrar = ultimaAccion === 'INGRESO' ? 'EGRESO' : 'INGRESO';
        }
        
        res.json({
            success: true,
            ultimaAccion,
            debeRegistrar
        });
        
    } catch (error) {
        next(error);
    }
}

module.exports = {
    verificarEmpleado,
    generarQR,
    registrarMarcacion,
    registrarMarcacionConFoto,
    verificarAccionPermitida,
    obtenerHistorialLogueos,
    obtenerHistorialControlHs,
    obtenerEstadoActual
};
