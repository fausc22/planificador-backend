// server.js - Servidor principal del sistema de planificación de empleados
require('dotenv').config();
require('express-async-errors'); // Maneja automáticamente errores en funciones async
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');

// Importar rutas
const authRoutes = require('./routes/authRoutes');
const empleadosRoutes = require('./routes/empleadosRoutes');
const turnosRoutes = require('./routes/turnosRoutes');
const feriadosRoutes = require('./routes/feriadosRoutes');
const planeamientoRoutes = require('./routes/planeamientoRoutes');
const vacacionesRoutes = require('./routes/vacacionesRoutes');
const controlHsRoutes = require('./routes/controlHsRoutes');
const logueoRoutes = require('./routes/logueoRoutes');
const extrasRoutes = require('./routes/extrasRoutes');
const recibosRoutes = require('./routes/recibosRoutes');
const marcacionesRoutes = require('./routes/marcacionesRoutes');
const notificacionesRoutes = require('./routes/notificacionesRoutes');
const testUploadRoutes = require('./routes/testUpload');

// Importar middlewares
const { verificarToken } = require('./middlewares/authMiddleware');
const errorHandler = require('./middlewares/errorHandler');
const AppError = require('./utils/AppError');

// Importar worker de notificaciones (sin WhatsApp automático)
const notificacionesWorker = require('./workers/notificacionesWorker');

// Inicializar app
const app = express();
const PORT = process.env.PORT || 3000;

// ========================================
// MIDDLEWARES GLOBALES
// ========================================

// CORS
app.use(cors({
    origin: process.env.CORS_ORIGIN || '*',
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'x-refresh-token']
}));

// Body parser
app.use(bodyParser.json({ limit: '50mb' }));
app.use(bodyParser.urlencoded({ extended: true, limit: '50mb' }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Servir archivos estáticos (fotos de empleados)
app.use('/uploads', express.static('public/uploads'));

// Logger de requests
app.use((req, res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
    next();
});

// ========================================
// RUTAS
// ========================================

// Ruta de bienvenida
app.get('/', (req, res) => {
    res.json({
        message: 'API del Sistema de Planificación de Empleados',
        version: '2.0.0',
        status: 'running',
        endpoints: {
            auth: '/api/auth',
            empleados: '/api/empleados',
            turnos: '/api/turnos',
            feriados: '/api/feriados',
            planeamiento: '/api/planeamiento',
            vacaciones: '/api/vacaciones',
            controlHs: '/api/control-hs',
            logueo: '/api/logueo',
            extras: '/api/extras',
            recibos: '/api/recibos',
            marcaciones: '/api/marcaciones',
            notificaciones: '/api/notificaciones'
        }
    });
});

// Health check
app.get('/health', (req, res) => {
    res.json({
        status: 'ok',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        environment: process.env.NODE_ENV || 'development'
    });
});

// Rutas de la API
app.use('/api/auth', authRoutes);
app.use('/api/empleados', empleadosRoutes);
app.use('/api/turnos', turnosRoutes);
app.use('/api/feriados', feriadosRoutes);
app.use('/api/planeamiento', planeamientoRoutes);
app.use('/api/vacaciones', vacacionesRoutes);
app.use('/api/control-hs', controlHsRoutes);
app.use('/api/logueo', logueoRoutes);
app.use('/api/extras', extrasRoutes);
app.use('/api/recibos', recibosRoutes);
app.use('/api/marcaciones', marcacionesRoutes); // Rutas de marcación (públicas y protegidas)
app.use('/api/notificaciones', notificacionesRoutes);
app.use('/api', testUploadRoutes); // Ruta de prueba

// ========================================
// MANEJO DE ERRORES
// ========================================

// Ruta no encontrada
app.use((req, res, next) => {
    throw new AppError(`Ruta ${req.originalUrl} no encontrada`, 404);
});

// Error handler global (debe ser el último middleware)
app.use(errorHandler);

// ========================================
// INICIAR SERVIDOR
// ========================================

app.listen(PORT, async () => {
    console.log('\n========================================');
    console.log('🚀 SERVIDOR DE PLANIFICACIÓN INICIADO');
    console.log('========================================');
    console.log(`📍 Puerto: ${PORT}`);
    console.log(`🌍 Entorno: ${process.env.NODE_ENV || 'development'}`);
    console.log(`🔗 URL: http://localhost:${PORT}`);
    console.log(`📚 API Docs: http://localhost:${PORT}/`);
    console.log('========================================\n');
    
    // Iniciar worker de notificaciones (sin WhatsApp automático)
    // WhatsApp solo se conecta cuando se llama al endpoint de prueba
    console.log('💡 WhatsApp: Se conectará solo cuando uses el endpoint de prueba');
    notificacionesWorker.iniciarWorker();
});

// Manejo de cierre graceful
process.on('SIGTERM', () => {
    console.log('🛑 SIGTERM recibido. Cerrando servidor...');
    notificacionesWorker.detenerWorker();
    process.exit(0);
});

process.on('SIGINT', () => {
    console.log('\n🛑 SIGINT recibido. Cerrando servidor...');
    notificacionesWorker.detenerWorker();
    process.exit(0);
});

// Manejo de errores no capturados
process.on('uncaughtException', (error) => {
    console.error('❌ Excepción no capturada:', error);
    process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
    console.error('❌ Promesa rechazada no manejada:', reason);
    process.exit(1);
});

module.exports = app;

