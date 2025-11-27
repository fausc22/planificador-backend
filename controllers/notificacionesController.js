// controllers/notificacionesController.js - Controlador de notificaciones
const notificacionesService = require('../services/notificacionesService');
const whatsappService = require('../services/whatsappService');

/**
 * Obtiene notificaciones de logueos faltantes
 * Requiere autenticación
 */
exports.obtenerNotificacionesLogueos = async (req, res) => {
    try {
        const resultado = await notificacionesService.obtenerNotificacionesLogueos();
        
        res.json({
            success: true,
            data: resultado
        });
    } catch (error) {
        console.error('❌ Error al obtener notificaciones:', error);
        res.status(500).json({
            success: false,
            message: 'Error al obtener notificaciones',
            error: error.message
        });
    }
};

/**
 * Fuerza la verificación y envío de notificaciones (útil para testing o ejecución manual)
 * Requiere autenticación
 */
exports.verificarYEnviarNotificaciones = async (req, res) => {
    try {
        const resultado = await notificacionesService.verificarYEnviarNotificaciones();
        
        res.json({
            success: true,
            message: 'Notificaciones verificadas y procesadas',
            data: resultado
        });
    } catch (error) {
        console.error('❌ Error al verificar y enviar notificaciones:', error);
        res.status(500).json({
            success: false,
            message: 'Error al verificar y enviar notificaciones',
            error: error.message
        });
    }
};

/**
 * Obtiene el estado de la conexión de WhatsApp
 * Requiere autenticación
 */
exports.obtenerEstadoWhatsApp = async (req, res) => {
    try {
        const conectado = whatsappService.estaConectado();
        
        res.json({
            success: true,
            data: {
                conectado,
                adminPhone: process.env.ADMIN_PHONE ? 'Configurado' : 'No configurado'
            }
        });
    } catch (error) {
        console.error('❌ Error al obtener estado de WhatsApp:', error);
        res.status(500).json({
            success: false,
            message: 'Error al obtener estado de WhatsApp',
            error: error.message
        });
    }
};

/**
 * Envía un mensaje de prueba por WhatsApp
 * Conecta WhatsApp solo cuando se llama este endpoint y luego lo desconecta
 * Requiere autenticación (solo para testing)
 */
exports.enviarMensajePrueba = async (req, res) => {
    const whatsappService = require('../services/whatsappService');
    
    try {
        const { mensaje } = req.body;
        const adminPhone = process.env.ADMIN_PHONE;

        if (!adminPhone) {
            return res.status(400).json({
                success: false,
                message: 'ADMIN_PHONE no está configurado en .env'
            });
        }

        // Conectar WhatsApp solo para esta prueba
        console.log('📱 Conectando WhatsApp para prueba...');
        const authDir = process.env.AUTH_DIR || './auth';
        
        try {
            await whatsappService.iniciarWhatsApp(authDir);
            
            // Esperar a que se conecte (máximo 30 segundos)
            let intentos = 0;
            while (!whatsappService.estaConectado() && intentos < 30) {
                await new Promise(resolve => setTimeout(resolve, 1000));
                intentos++;
            }

            if (!whatsappService.estaConectado()) {
                return res.status(503).json({
                    success: false,
                    message: 'WhatsApp no se pudo conectar. Verifica que hayas escaneado el QR si es la primera vez.'
                });
            }

            // Si no hay mensaje, usar el predeterminado
            const mensajePrueba = mensaje && mensaje.trim() 
              ? mensaje.trim() 
              : `🧪 *Mensaje de Prueba*

Este es un mensaje de prueba del sistema de notificaciones de logueos.

✅ Si recibiste este mensaje, significa que WhatsApp está funcionando correctamente.

_Enviado desde el sistema de planificación_`;

            await whatsappService.enviarWhatsApp(adminPhone, mensajePrueba);

            // Desconectar WhatsApp después de enviar
            await whatsappService.cerrarWhatsApp();
            console.log('✅ WhatsApp desconectado después de prueba');

            res.json({
                success: true,
                message: 'Mensaje de prueba enviado exitosamente',
                data: {
                    destinatario: adminPhone,
                    enviado: true
                }
            });
        } catch (error) {
            // Asegurarse de desconectar en caso de error
            try {
                await whatsappService.cerrarWhatsApp();
            } catch (e) {
                // Ignorar errores al cerrar
            }
            throw error;
        }
    } catch (error) {
        console.error('❌ Error al enviar mensaje de prueba:', error);
        res.status(500).json({
            success: false,
            message: 'Error al enviar mensaje de prueba',
            error: error.message
        });
    }
};

