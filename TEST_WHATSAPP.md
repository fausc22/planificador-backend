# Cómo Probar el Sistema de Notificaciones por WhatsApp

## ✅ Estado Actual

Según tus logs, WhatsApp está **conectado correctamente**:
- ✅ "WhatsApp conectado exitosamente"
- ✅ "opened connection to WA"
- ✅ Worker de notificaciones activo

## 🧪 Formas de Probar

### 1. Enviar Mensaje de Prueba (Más Rápido)

Usa el endpoint de prueba para enviar un mensaje inmediatamente:

```bash
# Desde la terminal o Postman
curl -X POST http://localhost:3001/api/notificaciones/whatsapp/enviar-prueba \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer TU_TOKEN_JWT" \
  -d '{"mensaje": "Mensaje de prueba personalizado"}'
```

O desde el navegador (si tienes un cliente API):
- URL: `POST /api/notificaciones/whatsapp/enviar-prueba`
- Headers: `Authorization: Bearer TU_TOKEN`
- Body (opcional): `{"mensaje": "Tu mensaje personalizado"}`

### 2. Verificar Estado de WhatsApp

```bash
GET http://localhost:3001/api/notificaciones/whatsapp/estado
```

Debería responder:
```json
{
  "success": true,
  "data": {
    "conectado": true,
    "adminPhone": "Configurado"
  }
}
```

### 3. Forzar Verificación de Notificaciones

```bash
POST http://localhost:3001/api/notificaciones/verificar-y-enviar
```

Esto ejecutará la verificación inmediatamente (sin esperar los 5 minutos del cron).

### 4. Simular una Notificación Real

Para probar con datos reales:

1. **Crear un turno para hoy** en el planificador para un empleado
2. **NO registrar el logueo** de ese empleado
3. Esperar 5 minutos (o ejecutar manualmente `/verificar-y-enviar`)
4. Deberías recibir un WhatsApp con la notificación

### 5. Ver Notificaciones en el Dashboard

Las notificaciones también aparecen en el dashboard:
- Ve a `http://localhost:3001/dashboard` (o la URL de tu frontend)
- Deberías ver el componente de notificaciones

## 📱 Verificar que Recibiste el Mensaje

1. Abre WhatsApp en tu teléfono (el número configurado en `ADMIN_PHONE`)
2. Deberías ver el mensaje de prueba o la notificación
3. Si no lo recibes:
   - Verifica que `ADMIN_PHONE` esté correcto en `.env`
   - Verifica que WhatsApp esté conectado (endpoint `/whatsapp/estado`)
   - Revisa los logs del servidor para ver errores

## 🔍 Logs a Revisar

Cuando se envía un mensaje, deberías ver en los logs:
```
📤 Enviando WhatsApp a 5492302651250...
✅ WhatsApp enviado exitosamente a 5492302651250
```

Si hay errores, aparecerán con:
```
❌ Error enviando WhatsApp: [detalles del error]
```

## ⚠️ Nota Importante

El sistema **evita duplicados**: si ya se envió una notificación para un empleado hoy, no se enviará otra. Para probar múltiples veces, puedes:

1. Cambiar la fecha del turno
2. Usar diferentes empleados
3. Limpiar la tabla `notificaciones_enviadas` (solo para testing)

## 🎯 Prueba Rápida Recomendada

1. Ejecuta el endpoint de prueba: `POST /api/notificaciones/whatsapp/enviar-prueba`
2. Revisa tu WhatsApp
3. Si recibes el mensaje, ¡todo funciona! 🎉

