// ecosystem.config.js - Configuración de PM2
module.exports = {
  apps: [{
    name: 'planificador-backend',
    script: './server.js',
    instances: 1,
    exec_mode: 'fork',
    watch: false,
    max_memory_restart: '1G',
    env: {
      NODE_ENV: 'production',
      PORT: 3001
    },
    error_file: './logs/err.log',
    out_file: './logs/out.log',
    log_file: './logs/combined.log',
    time: true,
    autorestart: true,
    max_restarts: 10,
    min_uptime: '10s',
    // Ignorar cambios en estos archivos/directorios
    ignore_watch: [
      'node_modules',
      'logs',
      'auth',
      'public/uploads'
    ]
  }]
};

