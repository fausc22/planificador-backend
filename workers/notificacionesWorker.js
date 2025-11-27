// workers/notificacionesWorker.js - Worker para verificar y enviar notificaciones periódicamente
const cron = require('node-cron');
const notificacionesService = require('../services/notificacionesService');

let cronJob = null;

/**
 * Inicia el worker de notificaciones
 * Verifica logueos faltantes cada 5 minutos
 * Cuando detecta una notificación, conecta WhatsApp, envía el mensaje y se desconecta
 */
function iniciarWorker() {
    console.log('🚀 Iniciando worker de notificaciones...');
    console.log('💡 WhatsApp se conectará automáticamente cuando haya notificaciones y se desconectará después de enviar');

    // Programar verificación cada 5 minutos
    // Formato cron: minuto hora día mes día-semana
    // '*/5 * * * *' = cada 5 minutos
    cronJob = cron.schedule('*/5 * * * *', async () => {
        try {
            await notificacionesService.verificarYEnviarNotificaciones();
        } catch (error) {
            console.error('❌ Error en worker de notificaciones:', error);
        }
    }, {
        scheduled: true,
        timezone: 'America/Argentina/Cordoba' // Ajustar según tu zona horaria
    });

    console.log('✅ Worker de notificaciones iniciado. Verificará cada 5 minutos.');

    // Ejecutar una verificación inmediata al iniciar
    setTimeout(async () => {
        try {
            console.log('🔍 Ejecutando verificación inicial...');
            await notificacionesService.verificarYEnviarNotificaciones();
        } catch (error) {
            console.error('❌ Error en verificación inicial:', error);
        }
    }, 10000); // Esperar 10 segundos antes de la primera verificación
}

/**
 * Detiene el worker de notificaciones
 */
function detenerWorker() {
    if (cronJob) {
        cronJob.stop();
        console.log('⏹️ Worker de notificaciones detenido');
    }
}

// Manejar cierre graceful
process.on('SIGINT', () => {
    console.log('\n🛑 Deteniendo worker de notificaciones...');
    detenerWorker();
    process.exit(0);
});

process.on('SIGTERM', () => {
    console.log('\n🛑 Deteniendo worker de notificaciones...');
    detenerWorker();
    process.exit(0);
});

module.exports = {
    iniciarWorker,
    detenerWorker
};

