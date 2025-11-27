# Integración de WhatsApp para Notificaciones

Este sistema envía notificaciones automáticas por WhatsApp cuando los empleados no registran sus logueos o lo hacen fuera del margen permitido.

## Configuración

### 1. Instalar dependencias

```bash
cd backend
npm install
```

Esto instalará automáticamente:
- `@whiskeysockets/baileys` - Librería para WhatsApp
- `@hapi/boom` - Manejo de errores
- `node-cron` - Para tareas programadas

### 2. Configurar variables de entorno

Agrega estas variables a tu archivo `.env`:

```env
# WhatsApp (opcional - solo si quieres notificaciones por WhatsApp)
ADMIN_PHONE=5493511234567
AUTH_DIR=./auth
```

**Formato del número:**
- Debe incluir código de país sin el `+`
- Ejemplo para Argentina: `5493511234567` (54 = código país, 9 = móvil, 351 = código de área, resto = número)

### 3. Crear tabla de notificaciones

Ejecuta el script SQL:

```sql
-- Ejecutar: backend/scripts/CREATE_NOTIFICACIONES_TABLE.sql
```

### 4. Iniciar el servidor

```bash
npm start
# o en desarrollo:
npm run dev
```

### 5. Escanear código QR

La primera vez que inicies el servidor:
1. Verás un código QR en la terminal
2. Abre WhatsApp en tu teléfono
3. Ve a Configuración → Dispositivos vinculados → Vincular un dispositivo
4. Escanea el código QR que aparece en la terminal
5. ¡Listo! WhatsApp quedará conectado

**Importante:** 
- El directorio `./auth` guarda las credenciales de sesión
- **NO borres** este directorio o tendrás que re-escaneear el QR
- Si cierras sesión en tu teléfono, deberás re-escaneear

## Funcionamiento

### Verificación automática

El sistema verifica cada **5 minutos**:
1. Obtiene los turnos del día actual del planificador
2. Compara con los logueos registrados
3. Detecta:
   - **Falta de logueo**: Empleado con turno pero sin INGRESO registrado
   - **Logueo fuera de margen**: INGRESO registrado fuera del margen de ±30 minutos

### Envío de notificaciones

Cuando detecta un problema:
1. Verifica si ya se envió una notificación similar hoy (evita duplicados)
2. Envía mensaje por WhatsApp al número configurado en `ADMIN_PHONE`
3. Guarda el registro en la tabla `notificaciones_enviadas`

### Formato del mensaje

```
🚨 Notificación de Logueo

[Empleado] tiene turno [Turno] a las [Hora] pero no registró INGRESO

Detalles:
• Empleado: [Nombre]
• Turno: [Turno]
• Hora del turno: [HH:MM]
• Fecha: [DD/MM/YYYY]

Generado automáticamente por el sistema de planificación
```

## Endpoints de API

### Obtener notificaciones (Dashboard)
```
GET /api/notificaciones/logueos-faltantes
```

### Forzar verificación manual
```
POST /api/notificaciones/verificar-y-enviar
```

### Estado de WhatsApp
```
GET /api/notificaciones/whatsapp/estado
```

## Solución de problemas

### WhatsApp no se conecta
- Verifica que `ADMIN_PHONE` esté configurado correctamente
- Asegúrate de escanear el QR cuando aparezca
- Revisa que el directorio `./auth` tenga permisos de escritura

### No recibo mensajes
- Verifica que WhatsApp esté conectado (endpoint `/api/notificaciones/whatsapp/estado`)
- Revisa los logs del servidor
- Confirma que hay notificaciones pendientes en el dashboard

### Mensajes duplicados
- El sistema evita duplicados verificando la tabla `notificaciones_enviadas`
- Si ves duplicados, verifica que la tabla esté creada correctamente

### Reconexión automática
- Si WhatsApp se desconecta, el sistema intentará reconectar automáticamente
- Si falla la reconexión, reinicia el servidor y re-escanea el QR

## Notas importantes

- **Proceso persistente**: WhatsApp necesita que el servidor esté corriendo constantemente
- **No funciona en serverless**: Requiere un proceso siempre activo
- **Tu número personal**: Se usa tu número de WhatsApp para enviar mensajes
- **Rate limiting**: WhatsApp puede limitar si envías muchos mensajes seguidos
- **Privacidad**: Los mensajes se envían desde tu número personal

## Deshabilitar WhatsApp

Si no quieres usar WhatsApp, simplemente:
- No configures `ADMIN_PHONE` en el `.env`
- El sistema funcionará normalmente, solo sin notificaciones por WhatsApp
- Las notificaciones seguirán apareciendo en el dashboard

