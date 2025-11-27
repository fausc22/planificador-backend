// services/whatsappService.js - Servicio de WhatsApp usando Baileys
const {
    default: makeWASocket,
    useMultiFileAuthState,
    fetchLatestBaileysVersion,
    DisconnectReason
} = require('@whiskeysockets/baileys');
const { Boom } = require('@hapi/boom');
const fs = require('fs');
const path = require('path');
const qrcode = require('qrcode-terminal');

let sock = null;
let ready = false;
let authDir = './auth';
let reconectando = false; // Flag para evitar múltiples intentos de reconexión simultáneos

/**
 * Formatea un número de teléfono al formato JID de WhatsApp
 * @param {string} number - Número de teléfono (ej: "5493511234567" o "+5493511234567")
 * @returns {string} - JID formateado (ej: "5493511234567@s.whatsapp.net")
 */
function formatJidFromNumber(number) {
    // Eliminar todo lo que no sea dígito
    const digits = String(number).replace(/\D/g, '');
    return `${digits}@s.whatsapp.net`;
}

/**
 * Inicia la conexión de WhatsApp
 * @param {string} authDirectory - Directorio donde guardar las credenciales
 * @returns {Promise<Object>} - Socket de WhatsApp
 */
async function iniciarWhatsApp(authDirectory = './auth') {
    // Si ya está conectado, no hacer nada
    if (sock && ready) {
        console.log('✅ WhatsApp ya está conectado');
        return sock;
    }

    // Si ya hay un socket pero no está listo, esperar un momento antes de crear uno nuevo
    if (sock && !ready && !reconectando) {
        console.log('⏳ WhatsApp está conectándose, esperando...');
        return sock;
    }

    // Si está reconectando, no crear una nueva conexión
    if (reconectando) {
        console.log('⏳ Ya hay un proceso de reconexión en curso...');
        return sock;
    }

    // Si ya hay un socket activo (aunque no esté listo), no crear otro
    if (sock) {
        console.log('⏳ Ya existe una conexión de WhatsApp, esperando...');
        return sock;
    }

    authDir = authDirectory;

    try {
        // Crear directorio de auth si no existe
        await fs.promises.mkdir(authDir, { recursive: true });

        // Obtener versión más reciente de Baileys
        const { version } = await fetchLatestBaileysVersion();
        
        // Cargar estado de autenticación
        const { state, saveCreds } = await useMultiFileAuthState(authDir);

        // Crear socket de WhatsApp
        // Configurado para SOLO ENVIAR mensajes, no recibir
        sock = makeWASocket({
            auth: state,
            version,
            printQRInTerminal: false, // Ya lo manejamos manualmente
            // No sincronizar mensajes entrantes
            syncFullHistory: false,
            // No marcar como online para evitar recibir mensajes
            markOnlineOnConnect: false,
            // Ignorar todos los JIDs excepto el nuestro
            shouldIgnoreJid: (jid) => {
                // Ignorar todos los mensajes entrantes
                return true;
            }
        });

        // Guardar credenciales cuando se actualicen
        sock.ev.on('creds.update', saveCreds);

        // Manejar actualizaciones de conexión
        sock.ev.on('connection.update', (update) => {
            const { connection, lastDisconnect, qr } = update;

            // Mostrar QR cuando esté disponible
            if (qr) {
                console.log('\n========================================');
                console.log('📱 CÓDIGO QR PARA CONECTAR WHATSAPP');
                console.log('========================================');
                console.log('Instrucciones:');
                console.log('1. Abre WhatsApp en tu teléfono');
                console.log('2. Ve a Configuración → Dispositivos vinculados');
                console.log('3. Toca "Vincular un dispositivo"');
                console.log('4. Escanea el código QR que aparece abajo:');
                console.log('========================================\n');
                
                // Mostrar QR en la terminal usando qrcode-terminal
                qrcode.generate(qr, { small: true });
                
                console.log('\n========================================');
                console.log('⏳ Esperando escaneo del código QR...');
                console.log('========================================\n');
            }

            if (connection === 'open') {
                console.log('✅ WhatsApp conectado exitosamente');
                ready = true;
                reconectando = false;
            } else if (connection === 'close') {
                ready = false;
                
                // Verificar el código de error
                const statusCode = lastDisconnect?.error?.output?.statusCode;
                const shouldReconnect = statusCode && statusCode !== 401 && statusCode !== 403;

                if (statusCode === 401) {
                    console.log('❌ Cierre por credenciales inválidas. Necesitas re-escaneear el QR.');
                    sock = null;
                    reconectando = false;
                } else if (statusCode === 403) {
                    console.log('❌ Sesión cerrada desde otro dispositivo. Necesitas re-escaneear el QR.');
                    sock = null;
                    reconectando = false;
                } else if (shouldReconnect && !reconectando) {
                    console.log(`⚠️ WhatsApp desconectado (código: ${statusCode}). Intentando reconectar en 5 segundos...`);
                    reconectando = true;
                    
                    // Intentar reconectar después de 5 segundos (más tiempo para evitar loops)
                    setTimeout(async () => {
                        if (!ready) {
                            console.log('🔄 Intentando reconectar WhatsApp...');
                            try {
                                sock = null; // Limpiar socket anterior
                                await iniciarWhatsApp(authDir);
                            } catch (error) {
                                console.error('❌ Error en reconexión:', error.message);
                                reconectando = false;
                            }
                        } else {
                            reconectando = false;
                        }
                    }, 5000);
                } else {
                    console.log('⚠️ WhatsApp desconectado. No se intentará reconectar automáticamente.');
                    reconectando = false;
                }
            } else if (connection === 'connecting') {
                if (!reconectando) {
                    console.log('🔄 Conectando a WhatsApp...');
                }
            }
        });

        // Silenciar errores de mensajes de grupos (Bad MAC es normal)
        // Estos eventos se manejan automáticamente, no necesitamos hacer nada

        // Manejo de errores
        sock.ev.on('creds.update', () => {
            // Credenciales actualizadas
        });

        return sock;

    } catch (error) {
        console.error('❌ Error iniciando WhatsApp:', error);
        throw error;
    }
}

/**
 * Envía un mensaje de WhatsApp
 * @param {string} numero - Número de teléfono del destinatario
 * @param {string} texto - Mensaje a enviar
 * @returns {Promise<Object>} - Resultado del envío
 */
async function enviarWhatsApp(numero, texto) {
    if (!sock || !ready) {
        console.log('⚠️ Socket de WhatsApp no está listo. Intentando iniciar...');
        try {
            await iniciarWhatsApp();
            // Esperar un momento para que se establezca la conexión
            await new Promise(resolve => setTimeout(resolve, 2000));
            
            if (!ready) {
                throw new Error('No se pudo establecer la conexión de WhatsApp');
            }
        } catch (error) {
            console.error('❌ Error iniciando WhatsApp para enviar mensaje:', error);
            throw new Error('WhatsApp no está disponible. Verifica la conexión.');
        }
    }

    try {
        const jid = formatJidFromNumber(numero);
        const msg = { text: texto };

        console.log(`📤 Enviando WhatsApp a ${numero}...`);
        const result = await sock.sendMessage(jid, msg);
        
        console.log(`✅ WhatsApp enviado exitosamente a ${numero}`);
        return result;

    } catch (error) {
        console.error('❌ Error enviando WhatsApp:', error?.output || error);
        throw error;
    }
}

/**
 * Verifica si WhatsApp está conectado y listo
 * @returns {boolean}
 */
function estaConectado() {
    return ready && sock !== null;
}

/**
 * Cierra la conexión de WhatsApp
 */
async function cerrarWhatsApp() {
    if (sock) {
        try {
            await sock.end();
            sock = null;
            ready = false;
            console.log('✅ Conexión de WhatsApp cerrada');
        } catch (error) {
            console.error('❌ Error cerrando WhatsApp:', error);
        }
    }
}

module.exports = {
    iniciarWhatsApp,
    enviarWhatsApp,
    estaConectado,
    cerrarWhatsApp
};

