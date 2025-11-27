// services/notificacionesService.js - Servicio para verificar logueos faltantes
const db = require('../controllers/dbPromise');
const { obtenerFechaActual, parsearFecha } = require('../utils/dateUtils');

/**
 * Verifica logueos faltantes basado en los turnos del planificador
 * Compara turnos del día actual con logueos registrados
 * Margen: 30 minutos antes y 30 minutos después de la hora de inicio del turno
 */
async function verificarLogueosFaltantes() {
    try {
        const fechaActual = obtenerFechaActual(); // DD/MM/YYYY
        const anio = new Date().getFullYear();
        const tablaTurnos = `turnos_${anio}`;
        const tablaLogueos = `logueo_${anio}`;
        
        // Obtener todos los turnos del día actual
        const [turnosHoy] = await db.execute(
            `SELECT t.nombre_empleado, t.turno, t.fecha
             FROM ${tablaTurnos} t
             WHERE t.fecha = ?
             AND t.turno IS NOT NULL
             AND t.turno != ''
             AND t.turno != 'Libre'
             AND t.turno != 'VACACIONES'`,
            [fechaActual]
        );
        
        if (turnosHoy.length === 0) {
            return [];
        }
        
        // Obtener información de horarios (horaInicio) para cada turno
        const turnosConHorario = [];
        for (const turno of turnosHoy) {
            const [horarios] = await db.execute(
                'SELECT horaInicio FROM horarios WHERE turnos = ?',
                [turno.turno]
            );
            
            if (horarios.length > 0) {
                turnosConHorario.push({
                    nombre_empleado: turno.nombre_empleado,
                    turno: turno.turno,
                    horaInicio: horarios[0].horaInicio, // Hora en formato 0-23
                    fecha: turno.fecha
                });
            }
        }
        
        // Obtener logueos de INGRESO del día actual
        const [logueosHoy] = await db.execute(
            `SELECT nombre_empleado, hora, accion
             FROM ${tablaLogueos}
             WHERE fecha = ?
             AND accion = 'INGRESO'
             ORDER BY nombre_empleado, hora`,
            [fechaActual]
        );
        
        // Crear mapa de logueos por empleado (tomar el primero si hay múltiples)
        const logueosPorEmpleado = {};
        logueosHoy.forEach(logueo => {
            if (!logueosPorEmpleado[logueo.nombre_empleado]) {
                logueosPorEmpleado[logueo.nombre_empleado] = logueo;
            }
        });
        
        // Verificar cada turno
        const notificaciones = [];
        
        for (const turnoInfo of turnosConHorario) {
            const { nombre_empleado, turno, horaInicio, fecha } = turnoInfo;
            const logueo = logueosPorEmpleado[nombre_empleado];
            
            // Convertir horaInicio a minutos desde medianoche para facilitar comparación
            const horaInicioMinutos = horaInicio * 60;
            const margenAntes = 30; // 30 minutos antes
            const margenDespues = 30; // 30 minutos después
            const horaMinima = horaInicioMinutos - margenAntes;
            const horaMaxima = horaInicioMinutos + margenDespues;
            
            if (!logueo) {
                // No hay logueo registrado
                const horaInicioFormato = `${String(horaInicio).padStart(2, '0')}:00`;
                notificaciones.push({
                    tipo: 'FALTA_LOGUEO',
                    severidad: 'ALTA',
                    empleado: nombre_empleado,
                    turno: turno,
                    horaTurno: horaInicioFormato,
                    mensaje: `${nombre_empleado} tiene turno ${turno} a las ${horaInicioFormato} pero no registró INGRESO`,
                    fecha: fecha,
                    horaEsperada: `${String(Math.floor(horaMinima / 60)).padStart(2, '0')}:${String(horaMinima % 60).padStart(2, '0')} - ${String(Math.floor(horaMaxima / 60)).padStart(2, '0')}:${String(horaMaxima % 60).padStart(2, '0')}`
                });
            } else {
                // Hay logueo, verificar si está dentro del margen
                const [hora, minutos] = logueo.hora.split(':').map(Number);
                const logueoMinutos = hora * 60 + minutos;
                
                if (logueoMinutos < horaMinima || logueoMinutos > horaMaxima) {
                    // Logueo fuera del margen permitido
                    const horaInicioFormato = `${String(horaInicio).padStart(2, '0')}:00`;
                    const horaRegistrada = logueo.hora;
                    const fueraMargen = logueoMinutos < horaMinima ? 'ANTES' : 'DESPUÉS';
                    
                    notificaciones.push({
                        tipo: 'LOGUEO_FUERA_MARGEN',
                        severidad: 'MEDIA',
                        empleado: nombre_empleado,
                        turno: turno,
                        horaTurno: horaInicioFormato,
                        horaRegistrada: horaRegistrada,
                        mensaje: `${nombre_empleado} registró INGRESO a las ${horaRegistrada} pero su turno ${turno} es a las ${horaInicioFormato} (fuera del margen de ±30 min)`,
                        fecha: fecha,
                        fueraMargen: fueraMargen
                    });
                }
            }
        }
        
        return notificaciones;
        
    } catch (error) {
        console.error('❌ Error verificando logueos faltantes:', error);
        throw error;
    }
}

/**
 * Verifica si una notificación ya fue enviada por WhatsApp
 * @param {Object} notificacion - Objeto de notificación
 * @returns {Promise<boolean>}
 */
async function notificacionYaEnviada(notificacion) {
    try {
        const [existentes] = await db.execute(
            `SELECT id FROM notificaciones_enviadas 
             WHERE empleado = ? 
             AND fecha = ? 
             AND tipo = ? 
             AND whatsapp_enviado = TRUE
             AND DATE(created_at) = CURDATE()`,
            [notificacion.empleado, notificacion.fecha, notificacion.tipo]
        );
        
        return existentes.length > 0;
    } catch (error) {
        console.error('❌ Error verificando notificación existente:', error);
        return false;
    }
}

/**
 * Guarda una notificación en la base de datos
 * @param {Object} notificacion - Objeto de notificación
 * @param {boolean} whatsappEnviado - Si se envió por WhatsApp
 * @returns {Promise<number>} - ID de la notificación guardada
 */
async function guardarNotificacion(notificacion, whatsappEnviado = false) {
    try {
        const [result] = await db.execute(
            `INSERT INTO notificaciones_enviadas 
             (tipo, empleado, turno, fecha, mensaje, whatsapp_enviado, whatsapp_enviado_at) 
             VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [
                notificacion.tipo,
                notificacion.empleado,
                notificacion.turno || null,
                notificacion.fecha,
                notificacion.mensaje,
                whatsappEnviado,
                whatsappEnviado ? new Date() : null
            ]
        );
        
        return result.insertId;
    } catch (error) {
        console.error('❌ Error guardando notificación:', error);
        throw error;
    }
}

/**
 * Envía notificación por WhatsApp
 * Conecta WhatsApp, envía el mensaje y se desconecta automáticamente
 * @param {Object} notificacion - Objeto de notificación
 * @returns {Promise<boolean>} - True si se envió exitosamente
 */
async function enviarNotificacionWhatsApp(notificacion) {
    const whatsappService = require('./whatsappService');
    const adminPhone = process.env.ADMIN_PHONE;
    
    if (!adminPhone) {
        console.log('⚠️ ADMIN_PHONE no configurado en .env. Saltando envío de WhatsApp.');
        return false;
    }

    try {
        // Conectar WhatsApp solo para esta notificación
        console.log('📱 Conectando WhatsApp para enviar notificación...');
        const authDir = process.env.AUTH_DIR || './auth';
        
        await whatsappService.iniciarWhatsApp(authDir);
        
        // Esperar a que se conecte (máximo 30 segundos)
        let intentos = 0;
        while (!whatsappService.estaConectado() && intentos < 30) {
            await new Promise(resolve => setTimeout(resolve, 1000));
            intentos++;
        }

        if (!whatsappService.estaConectado()) {
            console.log('⚠️ WhatsApp no se pudo conectar. Saltando envío.');
            return false;
        }

        // Formatear mensaje para WhatsApp
        const emoji = notificacion.severidad === 'ALTA' ? '🚨' : '⚠️';
        const mensajeWhatsApp = `${emoji} *Notificación de Logueo*

${notificacion.mensaje}

*Detalles:*
• Empleado: ${notificacion.empleado}
• Turno: ${notificacion.turno || 'N/A'}
• Hora del turno: ${notificacion.horaTurno || 'N/A'}
${notificacion.horaRegistrada ? `• Hora registrada: ${notificacion.horaRegistrada}` : ''}
${notificacion.horaEsperada ? `• Margen esperado: ${notificacion.horaEsperada}` : ''}
• Fecha: ${notificacion.fecha}

_Generado automáticamente por el sistema de planificación_`;

        await whatsappService.enviarWhatsApp(adminPhone, mensajeWhatsApp);
        console.log(`✅ Notificación WhatsApp enviada para ${notificacion.empleado}`);

        // Desconectar WhatsApp después de enviar
        await whatsappService.cerrarWhatsApp();
        console.log('✅ WhatsApp desconectado después de enviar notificación');

        return true;
    } catch (error) {
        console.error('❌ Error enviando notificación por WhatsApp:', error);
        // Asegurarse de desconectar en caso de error
        try {
            await whatsappService.cerrarWhatsApp();
        } catch (e) {
            // Ignorar errores al cerrar
        }
        return false;
    }
}

/**
 * Procesa y envía notificaciones (verifica duplicados y envía WhatsApp)
 * @param {Array} notificaciones - Array de notificaciones
 * @returns {Promise<Object>} - Resumen de notificaciones procesadas
 */
async function procesarYEnviarNotificaciones(notificaciones) {
    const resumen = {
        total: notificaciones.length,
        nuevas: 0,
        duplicadas: 0,
        whatsappEnviadas: 0,
        whatsappFallidas: 0
    };

    for (const notificacion of notificaciones) {
        try {
            // Verificar si ya fue enviada hoy
            const yaEnviada = await notificacionYaEnviada(notificacion);
            
            if (yaEnviada) {
                resumen.duplicadas++;
                continue;
            }

            // Intentar enviar por WhatsApp
            let whatsappEnviado = false;
            try {
                whatsappEnviado = await enviarNotificacionWhatsApp(notificacion);
                if (whatsappEnviado) {
                    resumen.whatsappEnviadas++;
                } else {
                    resumen.whatsappFallidas++;
                }
            } catch (error) {
                console.error(`❌ Error enviando WhatsApp para ${notificacion.empleado}:`, error);
                resumen.whatsappFallidas++;
            }

            // Guardar en base de datos
            await guardarNotificacion(notificacion, whatsappEnviado);
            resumen.nuevas++;

        } catch (error) {
            console.error(`❌ Error procesando notificación para ${notificacion.empleado}:`, error);
        }
    }

    return resumen;
}

/**
 * Obtiene notificaciones de logueos faltantes para el dashboard
 */
async function obtenerNotificacionesLogueos() {
    try {
        const notificaciones = await verificarLogueosFaltantes();
        
        // Agrupar por severidad
        const porSeveridad = {
            ALTA: notificaciones.filter(n => n.severidad === 'ALTA'),
            MEDIA: notificaciones.filter(n => n.severidad === 'MEDIA')
        };
        
        return {
            total: notificaciones.length,
            alta: porSeveridad.ALTA.length,
            media: porSeveridad.MEDIA.length,
            notificaciones: notificaciones.sort((a, b) => {
                // Ordenar por severidad (ALTA primero) y luego por empleado
                if (a.severidad !== b.severidad) {
                    return a.severidad === 'ALTA' ? -1 : 1;
                }
                return a.empleado.localeCompare(b.empleado);
            })
        };
        
    } catch (error) {
        console.error('❌ Error obteniendo notificaciones:', error);
        throw error;
    }
}

/**
 * Verifica logueos faltantes y envía notificaciones por WhatsApp
 * Esta función se puede llamar periódicamente (ej: cada 5 minutos)
 */
async function verificarYEnviarNotificaciones() {
    try {
        console.log('🔍 Verificando logueos faltantes y enviando notificaciones...');
        
        const notificaciones = await verificarLogueosFaltantes();
        
        if (notificaciones.length === 0) {
            console.log('✅ No hay notificaciones pendientes');
            return { enviadas: 0, nuevas: 0 };
        }

        console.log(`📋 Se encontraron ${notificaciones.length} notificaciones`);
        
        const resumen = await procesarYEnviarNotificaciones(notificaciones);
        
        console.log(`✅ Procesadas: ${resumen.nuevas} nuevas, ${resumen.duplicadas} duplicadas`);
        console.log(`📱 WhatsApp: ${resumen.whatsappEnviadas} enviadas, ${resumen.whatsappFallidas} fallidas`);
        
        return resumen;
        
    } catch (error) {
        console.error('❌ Error en verificarYEnviarNotificaciones:', error);
        throw error;
    }
}

module.exports = {
    verificarLogueosFaltantes,
    obtenerNotificacionesLogueos,
    verificarYEnviarNotificaciones,
    procesarYEnviarNotificaciones,
    guardarNotificacion,
    notificacionYaEnviada
};

