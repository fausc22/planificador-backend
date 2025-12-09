// controllers/marcacionesController.js - Controlador de marcaciones OPTIMIZADO
const db = require('./db');
// JWT solo se usa para el flujo de QR (generarQR y registrarMarcacion)
// NO se usa en registrarMarcacionConFoto (página pública de asistencia)
const jwt = require('jsonwebtoken');
const marcacionesService = require('../services/marcacionesService');
const AppError = require('../utils/AppError');
const fs = require('fs');
const fsPromises = require('fs').promises;
const path = require('path');

// No hay error sintáctico grave en el archivo, pero SÍ hay un error lógico/sintáctico en la función `registrarMarcacionConFoto`,
// específicamente en la gestión de cierre de llaves y paréntesis (brackets) en el callback del upload de multer.

// En concreto, el cierre de la función callback "uploadLogueo.single('foto')(req, res, async (err) => {...})" 
// está mal indentado y FALTAN llaves de cierre. Lo correcto es que TODO el código (incluido el manejo de "foto rechazada")
// esté dentro del callback y se cierre bien la función y luego el archivo. Además, la variable `finalPath` usada 
// al eliminar la foto si es rechazada, no está definida (probablemente debería ser `newPath`).
//
// CORRECCIÓN: Aquí está la versión corregida y simplificada, con los bloques bien cerrados y el error de variable arreglado.

const asyncHandler = (fn) => (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
};

async function verificarEmpleado(req, res, next) {
    try {
        const { email } = req.body;

        if (!email) throw new AppError('Email es requerido', 400);

        db.query(
            `SELECT id, nombre, apellido, mail, hora_normal 
             FROM empleados 
             WHERE mail = ? `,
            [email],
            (error, results) => {
                if (error) {
                    console.error('Error buscando empleado:', error);
                    return next(new AppError('Error al buscar empleado', 500));
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

async function generarQR(req, res, next) {
    try {
        const { empleadoId, accion } = req.body;

        if (!empleadoId) throw new AppError('ID de empleado es requerido', 400);
        if (!accion || !['INGRESO', 'EGRESO'].includes(accion)) {
            throw new AppError('Acción inválida. Debe ser INGRESO o EGRESO', 400);
        }

        db.query(
            'SELECT id, nombre, apellido, mail, hora_normal FROM empleados WHERE id = ? ',
            [empleadoId],
            async (error, results) => {
                if (error) {
                    console.error('Error verificando empleado:', error);
                    return next(new AppError('Error al verificar empleado', 500));
                }
                if (!results || results.length === 0) {
                    return res.status(404).json({
                        success: false,
                        message: 'Empleado no encontrado'
                    });
                }
                const empleado = results[0];
                const nombreCompleto = `${empleado.nombre} ${empleado.apellido}`;

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
                    return next(new AppError('Error al validar acción', 500));
                }

                const token = jwt.sign(
                    {
                        empleadoId: empleado.id,
                        nombre: empleado.nombre,
                        apellido: empleado.apellido,
                        email: empleado.mail,
                        horaNormal: empleado.hora_normal,
                        accion,
                        tipo: 'marcacion'
                    },
                    process.env.JWT_SECRET,
                    { expiresIn: '5m' }
                );
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

const registrarMarcacionConFoto = (req, res, next) => {
    const startTime = Date.now();
    console.log('🚀 Iniciando registro de marcación con foto');
    console.log('📊 Headers recibidos:', JSON.stringify(req.headers, null, 2));

    const contentType = req.headers['content-type'] || req.headers['Content-Type'];
    console.log(`🔍 Content-Type recibido: "${contentType}"`);

    if (!contentType || !contentType.toLowerCase().includes('multipart/form-data')) {
        console.log(`❌ Content-Type inválido: ${contentType}`);
        return res.status(400).json({ 
            success: false, 
            message: `Content-Type debe ser multipart/form-data. Recibido: ${contentType}`
        });
    }
    console.log(`✅ Content-Type válido: ${contentType}`);

    const uploadLogueo = require('../middlewares/uploadLogueo');
    uploadLogueo.single('foto')(req, res, async (err) => {
        const duration = Date.now() - startTime;
        if (err) {
            console.error(`❌ Error de multer: ${err.message}`);
            console.error(`❌ Tipo de error: ${err.constructor.name}`);

            if (err instanceof require('multer').MulterError) {
                switch (err.code) {
                    case 'LIMIT_FILE_SIZE':
                        return res.status(400).json({ 
                            success: false, 
                            message: 'Archivo demasiado grande. Máximo 5MB permitido.' 
                        });
                    case 'LIMIT_UNEXPECTED_FILE':
                        return res.status(400).json({ 
                            success: false, 
                            message: 'Campo de archivo no válido. Use "foto".' 
                        });
                    default:
                        return res.status(400).json({ 
                            success: false, 
                            message: `Error de upload: ${err.message}` 
                        });
                }
            }
            return res.status(400).json({ 
                success: false, 
                message: err.message 
            });
        }

        console.log(`🔍 req.file: ${JSON.stringify(req.file, null, 2)}`);
        console.log(`🔍 req.body: ${JSON.stringify(req.body, null, 2)}`);

        if (!req.file) {
            console.log(`❌ No se recibió archivo (${duration}ms)`);
            return res.status(400).json({ 
                success: false, 
                message: 'No se subió ningún archivo. Verifica que el campo se llame "foto".'
            });
        }

        try {
            const { email, password, accion } = req.body;
            if (!email || !password || !accion) {
                return res.status(400).json({
                    success: false,
                    message: 'Faltan campos obligatorios'
                });
            }
            if (!['INGRESO', 'EGRESO'].includes(accion)) {
                return res.status(400).json({
                    success: false,
                    message: 'Acción inválida'
                });
            }
            const loginPass = process.env.LOGIN_PASS;
            if (!loginPass || password !== loginPass) {
                return res.status(403).json({
                    success: false,
                    message: 'Contraseña incorrecta'
                });
            }
            console.log('✅ Foto guardada:', req.file.filename);

            const empleado = await new Promise((resolve, reject) => {
                db.query(
                    `SELECT id, nombre, apellido, mail, hora_normal FROM empleados WHERE mail = ?`,
                    [email],
                    (error, results) => {
                        if (error) return reject(error);
                        if (!results || results.length === 0) {
                            return reject(new AppError('Empleado no encontrado', 404));
                        }
                        resolve(results[0]);
                    }
                );
            });

            console.log(`✅ Empleado encontrado: ${empleado.nombre} ${empleado.apellido}`);

            const ahora = new Date();
            const hora = ahora.toTimeString().split(' ')[0].replace(/:/g, '-');
            const apellido = empleado.apellido.toUpperCase().replace(/\s+/g, '');
            const ext = path.extname(req.file.filename);
            const nombreFinal = `${accion}-${apellido}-${hora}${ext}`;

            const uploadDir = path.join(__dirname, '../public/uploads/logueos');
            const oldPath = path.join(uploadDir, req.file.filename);
            const newPath = path.join(uploadDir, nombreFinal);

            await fsPromises.rename(oldPath, newPath);
            console.log('✅ Foto renombrada a:', nombreFinal);

            const empleadoData = {
                id: empleado.id,
                nombre: empleado.nombre,
                apellido: empleado.apellido,
                hora_normal: empleado.hora_normal
            };

            const resultado = await marcacionesService.procesarMarcacionConFoto(
                empleadoData,
                accion,
                newPath,
                nombreFinal
            );

            console.log(`✅ Marcación procesada correctamente (${duration}ms)`);
            
            // Si fue rechazada, eliminar foto
            if (resultado.rechazado) {
                if (fs.existsSync(newPath)) {
                    try { await fsPromises.unlink(newPath); } catch (e) {}
                }
                console.log(`❌ Marcación rechazada: ${resultado.message}`);
                return res.status(400).json({
                    success: false,
                    rechazado: true,
                    message: resultado.message,
                    data: resultado.data
                });
            }

            const elapsed = Date.now() - startTime;
            console.log(`✅ [FIN] Marcación exitosa en ${elapsed}ms`);
            res.json({
                success: true,
                rechazado: false,
                message: resultado.message,
                data: {
                    ...resultado.data,
                    foto: nombreFinal
                }
            });
        } catch (error) {
            next(error);
        }
    });
};

async function registrarMarcacion(req, res, next) {
    try {
        const { token, latitude, longitude, direccion, password } = req.body;
        if (!token) throw new AppError('Token es requerido', 400);
        if (!password) throw new AppError('Contraseña es requerida', 400);

        const loginPass = process.env.LOGIN_PASS;
        if (!loginPass) {
            console.error('❌ LOGIN_PASS no está configurado en .env');
            throw new AppError('Error de configuración del servidor', 500);
        }
        if (password !== loginPass) throw new AppError('Contraseña incorrecta', 403);

        if (!latitude && !longitude && (!direccion || direccion.trim().length < 5)) {
            throw new AppError('Debe proporcionar coordenadas (latitude, longitude) o dirección válida', 400);
        }

        let decoded;
        try {
            decoded = jwt.verify(token, process.env.JWT_SECRET);
            if (decoded.tipo !== 'marcacion') {
                throw new AppError('Token inválido para marcación', 403);
            }
        } catch (jwtError) {
            if (jwtError.name === 'TokenExpiredError') {
                throw new AppError('El código QR ha expirado. Por favor genera uno nuevo.', 401);
            }
            throw new AppError('Token inválido', 403);
        }

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
            if (resultado.rechazado) {
                return res.status(400).json({
                    success: false,
                    rechazado: true,
                    message: resultado.message,
                    data: resultado.data
                });
            }

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

async function obtenerHistorialLogueos(req, res, next) {
    try {
        const { empleadoId } = req.params;
        const { fechaInicio, fechaFin } = req.query;
        if (req.user.id != empleadoId && req.user.rol !== 'GERENTE') {
            throw new AppError('No tienes permiso para ver este historial', 403);
        }
        db.query(
            'SELECT nombre, apellido FROM empleados WHERE id = ?',
            [empleadoId],
            async (error, results) => {
                if (error || !results || results.length === 0) {
                    return next(new AppError('Empleado no encontrado', 404));
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

async function obtenerHistorialControlHs(req, res, next) {
    try {
        const { empleadoId } = req.params;
        const { fechaInicio, fechaFin } = req.query;
        if (req.user.id != empleadoId && req.user.rol !== 'GERENTE') {
            throw new AppError('No tienes permiso para ver este historial', 403);
        }
        db.query(
            'SELECT nombre, apellido FROM empleados WHERE id = ?',
            [empleadoId],
            async (error, results) => {
                if (error || !results || results.length === 0) {
                    return next(new AppError('Empleado no encontrado', 404));
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

async function obtenerEstadoActual(req, res, next) {
    try {
        const { empleadoId } = req.params;
        if (req.user.id != empleadoId && req.user.rol !== 'GERENTE') {
            throw new AppError('No tienes permiso para ver este estado', 403);
        }
        db.query(
            'SELECT nombre, apellido FROM empleados WHERE id = ?',
            [empleadoId],
            async (error, results) => {
                if (error || !results || results.length === 0) {
                    return next(new AppError('Empleado no encontrado', 404));
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

async function validarPassword(req, res, next) {
    try {
        const { password } = req.body;
        if (!password) {
            return res.status(400).json({
                success: false,
                message: 'Contraseña es requerida'
            });
        }
        const loginPass = process.env.LOGIN_PASS;
        if (!loginPass) {
            return res.status(500).json({
                success: false,
                message: 'Error de configuración del servidor'
            });
        }
        if (password !== loginPass) {
            return res.status(403).json({
                success: false,
                message: 'Contraseña incorrecta'
            });
        }
        res.json({
            success: true,
            message: 'Contraseña válida'
        });

    } catch (error) {
        next(error);
    }
}

async function verificarAccionPermitida(req, res, next) {
    try {
        const { nombreEmpleado } = req.body;
        if (!nombreEmpleado) {
            throw new AppError('Nombre del empleado es requerido', 400);
        }
        const ahora = new Date();
        // const anio = ahora.getFullYear(); // UNUSED
        // const mes = ahora.toLocaleString('es-ES', { month: 'long' }).toUpperCase(); // UNUSED

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

// ==============================================
// REGISTRO CON FOTO BASE64 (PATRÓN DEL EJEMPLO)
// ==============================================
const registrarMarcacionConFotoBase64 = async (req, res, next) => {
    const startTime = Date.now();
    console.log('🚀 [BASE64] Iniciando registro con foto Base64');
    
    try {
        const { email, password, accion, fotoBase64 } = req.body;
        
        // Validaciones básicas
        if (!email || !password || !accion || !fotoBase64) {
            return res.status(400).json({
                success: false,
                message: 'Faltan campos obligatorios'
            });
        }
        
        if (!['INGRESO', 'EGRESO'].includes(accion)) {
            return res.status(400).json({
                success: false,
                message: 'Acción inválida'
            });
        }
        
        // Validar contraseña
        const loginPass = process.env.LOGIN_PASS;
        if (!loginPass || password !== loginPass) {
            console.log('❌ Contraseña incorrecta');
            return res.status(403).json({
                success: false,
                message: 'Contraseña incorrecta'
            });
        }
        
        console.log('✅ Contraseña válida');
        
        // Buscar empleado
        const empleado = await new Promise((resolve, reject) => {
            db.query(
                `SELECT id, nombre, apellido, mail, hora_normal FROM empleados WHERE mail = ?`,
                [email],
                (error, results) => {
                    if (error) return reject(error);
                    if (!results || results.length === 0) {
                        return reject(new AppError('Empleado no encontrado', 404));
                    }
                    resolve(results[0]);
                }
            );
        });
        
        console.log(`✅ Empleado encontrado: ${empleado.nombre} ${empleado.apellido}`);
        
        // Extraer datos del Base64
        const matches = fotoBase64.match(/^data:([A-Za-z0-9+/-]+);base64,(.+)$/);
        if (!matches || matches.length !== 3) {
            return res.status(400).json({
                success: false,
                message: 'Formato Base64 inválido'
            });
        }
        
        const mimeType = matches[1];
        const imageData = matches[2];
        
        // Validar tipo MIME
        const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
        if (!allowedTypes.includes(mimeType.toLowerCase())) {
            return res.status(400).json({
                success: false,
                message: `Tipo de archivo no permitido: ${mimeType}`
            });
        }
        
        console.log(`✅ Tipo MIME válido: ${mimeType}`);
        
        // Convertir Base64 a Buffer
        const buffer = Buffer.from(imageData, 'base64');
        console.log(`📏 Tamaño del buffer: ${(buffer.length / 1024).toFixed(2)}KB`);
        
        // Validar tamaño (5MB máximo)
        const maxSize = 5 * 1024 * 1024;
        if (buffer.length > maxSize) {
            return res.status(400).json({
                success: false,
                message: 'Imagen demasiado grande. Máximo 5MB permitido'
            });
        }
        
        // Generar nombre de archivo
        const ahora = new Date();
        const hora = ahora.toTimeString().split(' ')[0].replace(/:/g, '-');
        const apellido = empleado.apellido.toUpperCase().replace(/\s+/g, '');
        const ext = mimeType === 'image/png' ? '.png' : '.jpg';
        const nombreFinal = `${accion}-${apellido}-${hora}${ext}`;
        
        // Guardar archivo
        // __dirname = /backend/controllers/planificador
        // Subir 2 niveles: ../../public/uploads/logueos
        const uploadDir = path.join(__dirname, '../../public/uploads/logueos');
        
        // Crear directorio si no existe
        if (!fs.existsSync(uploadDir)) {
            await fsPromises.mkdir(uploadDir, { recursive: true });
            console.log('📁 Directorio creado:', uploadDir);
        }
        
        const filePath = path.join(uploadDir, nombreFinal);
        
        await fsPromises.writeFile(filePath, buffer);
        console.log('✅ Foto guardada:', nombreFinal, 'en', filePath);
        
        // Procesar marcación en DB
        const empleadoData = {
            id: empleado.id,
            nombre: empleado.nombre,
            apellido: empleado.apellido,
            hora_normal: empleado.hora_normal
        };
        
        const resultado = await marcacionesService.procesarMarcacionConFoto(
            empleadoData,
            accion,
            filePath,
            nombreFinal
        );
        
        // Si fue rechazada, eliminar foto
        if (resultado.rechazado) {
            if (fs.existsSync(filePath)) {
                await fsPromises.unlink(filePath);
            }
            console.log(`❌ Marcación rechazada: ${resultado.message}`);
            return res.status(400).json({
                success: false,
                rechazado: true,
                message: resultado.message,
                data: resultado.data
            });
        }
        
        const elapsed = Date.now() - startTime;
        console.log(`✅ [FIN] Marcación Base64 exitosa en ${elapsed}ms`);
        
        res.json({
            success: true,
            rechazado: false,
            message: resultado.message,
            data: {
                ...resultado.data,
                foto: nombreFinal
            }
        });
        
    } catch (error) {
        console.error('❌ Error en registro Base64:', error);
        next(error);
    }
};

module.exports = {
    verificarEmpleado,
    generarQR,
    registrarMarcacion,
    registrarMarcacionConFoto,
    registrarMarcacionConFotoBase64, // NUEVO
    verificarAccionPermitida,
    validarPassword,
    obtenerHistorialLogueos,
    obtenerHistorialControlHs,
    obtenerEstadoActual
};
