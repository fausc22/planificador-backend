-- Script para crear tabla de notificaciones enviadas
-- Esta tabla trackea qué notificaciones ya se enviaron por WhatsApp para evitar duplicados

CREATE TABLE IF NOT EXISTS `notificaciones_enviadas` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `tipo` VARCHAR(50) NOT NULL COMMENT 'Tipo de notificación: FALTA_LOGUEO, LOGUEO_FUERA_MARGEN, etc.',
  `empleado` VARCHAR(255) NOT NULL COMMENT 'Nombre completo del empleado',
  `turno` VARCHAR(50) DEFAULT NULL COMMENT 'Nombre del turno',
  `fecha` VARCHAR(50) NOT NULL COMMENT 'Fecha de la notificación (DD/MM/YYYY)',
  `mensaje` TEXT NOT NULL COMMENT 'Mensaje de la notificación',
  `whatsapp_enviado` BOOLEAN DEFAULT FALSE COMMENT 'Si se envió por WhatsApp',
  `whatsapp_enviado_at` DATETIME DEFAULT NULL COMMENT 'Fecha y hora del envío',
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT 'Fecha de creación',
  PRIMARY KEY (`id`),
  KEY `idx_empleado_fecha_tipo` (`empleado`, `fecha`, `tipo`),
  KEY `idx_whatsapp_enviado` (`whatsapp_enviado`),
  KEY `idx_fecha` (`fecha`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_spanish_ci;

