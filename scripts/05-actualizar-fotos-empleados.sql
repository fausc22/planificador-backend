-- ========================================
-- SCRIPT 5: ACTUALIZAR SISTEMA DE FOTOS
-- Migra de LONGBLOB a sistema de archivos
-- ========================================

USE planificador;

-- Agregar columna foto_perfil_url si no existe
ALTER TABLE empleados 
ADD COLUMN IF NOT EXISTS foto_perfil_url VARCHAR(255) DEFAULT NULL
COMMENT 'Nombre del archivo de foto en /uploads/empleados/';

SELECT '✅ Columna foto_perfil_url agregada a tabla empleados' AS mensaje;

-- Opcional: Eliminar foto_perfil y huella_dactilar BLOB si quieres ahorrar espacio
-- DESCOMENTAR SOLO SI ESTÁS SEGURO:
-- ALTER TABLE empleados DROP COLUMN foto_perfil;
-- ALTER TABLE empleados DROP COLUMN huella_dactilar;

SELECT 'Ahora las fotos se guardan en: backend/public/uploads/empleados/' AS info;
SELECT 'Se acceden via: http://localhost:3001/uploads/empleados/nombre-archivo.jpg' AS url;

