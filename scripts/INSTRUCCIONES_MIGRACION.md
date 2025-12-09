# Instrucciones para Migración de Datos desde backup.sql a actual.sql

Este documento explica cómo migrar los datos desde `backup.sql` (sistema viejo) a `actual.sql` (sistema actual).

## Tablas a Migrar

Las siguientes tablas deben migrarse:
- ✅ `controlhs_2025` - Vacía en backup.sql
- ✅ `extras_2025` - Vacía en backup.sql  
- ✅ `logueo_2025` - Vacía en backup.sql
- ✅ `totales_2025` - **Incluida en migracion_datos.sql**
- ⚠️ `turnos_2025` - **Requiere archivo separado (muy grande)**
- ✅ `vacaciones` - **Incluida en migracion_datos.sql**
- ✅ `recibos` - **Incluida en migracion_datos.sql**
- ⚠️ `empleados` - **Requiere ajuste manual (contiene BLOBs)**
- ✅ `horarios` - **Incluida en migracion_datos.sql**

## Diferencias de Estructura Encontradas

### 1. `logueo_2025`
- **backup.sql**: `huella_dactilar` es `NOT NULL`
- **actual.sql**: `huella_dactilar` es `NULL` y tiene campo adicional `foto_logueo`

### 2. `empleados`
- **backup.sql**: No tiene campo `foto_perfil_url`
- **actual.sql**: Tiene campo adicional `foto_perfil_url` (nullable)

### 3. Otras tablas
- Las demás tablas tienen estructuras idénticas, aunque `actual.sql` puede tener índices adicionales.

## Pasos para la Migración

### Paso 1: Preparar la Base de Datos

1. Asegúrate de tener `actual.sql` cargado en tu base de datos:
```bash
mysql -u usuario -p nombre_base_datos < actual.sql
```

### Paso 2: Ejecutar el Script Principal

Ejecuta el script de migración para las tablas que tienen datos pequeños:

```bash
mysql -u usuario -p nombre_base_datos < migracion_datos.sql
```

Este script migrará:
- `totales_2025`
- `vacaciones`
- `recibos`
- `horarios`

### Paso 3: Migrar `turnos_2025` (Opcional)

Si necesitas migrar los datos de `turnos_2025` desde backup.sql:

**Opción A - Usar el archivo extraído:**
```bash
mysql -u usuario -p nombre_base_datos < turnos_2025_insert.sql
```

**Opción B - Extraer directamente desde backup.sql:**
```bash
# Extraer solo los INSERT de turnos_2025
sed -n '/LOCK TABLES `turnos_2025`/,/UNLOCK TABLES/p' backup.sql > turnos_temp.sql
mysql -u usuario -p nombre_base_datos < turnos_temp.sql
```

### Paso 4: Migrar `empleados` (Opcional)

Para migrar la tabla `empleados` que contiene BLOBs (fotos y huellas):

**Opción A - Importar directamente desde backup.sql:**
```bash
# Extraer solo la tabla empleados
sed -n '/LOCK TABLES `empleados`/,/UNLOCK TABLES/p' backup.sql > empleados_temp.sql

# Ajustar el INSERT para incluir foto_perfil_url
# Editar empleados_temp.sql y agregar NULL al final de cada INSERT para foto_perfil_url
# Ejemplo: cambiar de:
#   INSERT INTO `empleados` VALUES (25,'CATALINA',...,NULL);
# a:
#   INSERT INTO `empleados` VALUES (25,'CATALINA',...,NULL,NULL);

mysql -u usuario -p nombre_base_datos < empleados_temp.sql
```

**Opción B - Usar mysqldump:**
```bash
# Si tienes acceso a la base de datos del backup
mysqldump -u usuario -p base_datos_backup empleados > empleados_backup.sql
# Luego ajustar manualmente para incluir foto_perfil_url
```

### Paso 5: Verificar la Migración

Verifica que los datos se migraron correctamente:

```sql
-- Verificar conteos
SELECT 'totales_2025' as tabla, COUNT(*) as registros FROM totales_2025
UNION ALL
SELECT 'vacaciones', COUNT(*) FROM vacaciones
UNION ALL
SELECT 'recibos', COUNT(*) FROM recibos
UNION ALL
SELECT 'horarios', COUNT(*) FROM horarios
UNION ALL
SELECT 'turnos_2025', COUNT(*) FROM turnos_2025
UNION ALL
SELECT 'empleados', COUNT(*) FROM empleados;
```

## Notas Importantes

1. **Tablas Vacías**: Las tablas `controlhs_2025`, `extras_2025` y `logueo_2025` están vacías en backup.sql, por lo que no hay datos para migrar.

2. **Conflictos de Claves Primarias**: El script usa `ON DUPLICATE KEY UPDATE` para evitar errores si ya existen registros con los mismos IDs.

3. **BLOBs Grandes**: Los datos de `empleados` contienen imágenes y huellas dactilares que son muy grandes. Se recomienda importar directamente desde backup.sql.

4. **Índices**: Las tablas en `actual.sql` pueden tener índices adicionales que no están en `backup.sql`. Esto no afecta la migración de datos.

5. **Backup**: Siempre haz un backup de tu base de datos actual antes de ejecutar la migración:
```bash
mysqldump -u usuario -p nombre_base_datos > backup_antes_migracion.sql
```

## Solución de Problemas

### Error: "Duplicate entry for key 'PRIMARY'"
- El script usa `ON DUPLICATE KEY UPDATE` para manejar esto automáticamente.
- Si persiste, puedes limpiar las tablas antes de migrar (descomentar las líneas `DELETE FROM` en el script).

### Error: "Column count doesn't match"
- Verifica que la estructura de las tablas en `actual.sql` coincida con lo esperado.
- Para `empleados`, asegúrate de agregar el campo `foto_perfil_url` (NULL) al final de cada INSERT.

### Error: "Unknown column 'foto_logueo'"
- Para `logueo_2025`, si migras datos manualmente, asegúrate de incluir `foto_logueo` como NULL en los INSERT.

## Contacto

Si encuentras problemas durante la migración, revisa:
1. Las estructuras de las tablas en ambos archivos SQL
2. Los logs de MySQL para errores específicos
3. Que los datos de backup.sql sean válidos





