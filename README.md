# Sistema de Planificación de Empleados - Backend

Sistema backend completo para la gestión y planificación de turnos de empleados, migrado de C# a Node.js.

## 📋 Características

- ✅ Gestión completa de empleados
- ✅ Administración de turnos y horarios
- ✅ Manejo de feriados
- ✅ Planificación mensual/anual de turnos
- ✅ Cálculo automático de horas y acumulados
- ✅ Autenticación JWT
- ✅ Sistema de auditoría
- ✅ API RESTful completa

## 🚀 Instalación

### Requisitos previos

- Node.js >= 14.0.0
- MySQL 8.0+
- npm o yarn

### Pasos de instalación

1. **Clonar el repositorio** (si aplica)

2. **Instalar dependencias**

```bash
npm install
```

3. **Configurar variables de entorno**

Copiar el archivo `.env.example` a `.env` y configurar:

```bash
cp .env.example .env
```

Editar `.env` con tus valores:

```env
NODE_ENV=development
PORT=3000

DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=tu_password
DB_DATABASE=planificador

JWT_SECRET=tu_secreto_jwt_muy_seguro_minimo_32_caracteres_aqui
JWT_REFRESH_SECRET=tu_secreto_refresh_jwt_muy_seguro_minimo_32_caracteres_aqui
```

4. **Importar la base de datos**

```bash
mysql -u root -p planificador < planificador-structure.sql
```

5. **Iniciar el servidor**

```bash
# Modo desarrollo con auto-reload
npm run dev

# Modo producción
npm start
```

## 📚 Estructura del Proyecto

```
backend/
├── controllers/          # Controladores de la aplicación
│   ├── authController.js          # Autenticación y autorización
│   ├── empleadosController.js     # Gestión de empleados
│   ├── turnosController.js        # Gestión de turnos/horarios
│   ├── feriadosController.js      # Gestión de feriados
│   ├── planeamientoController.js  # Planificación principal
│   ├── db.js                      # Conexión MySQL (callback)
│   └── dbPromise.js              # Conexión MySQL (promesas)
│
├── middlewares/         # Middlewares
│   ├── authMiddleware.js         # Verificación de JWT
│   └── auditoriaMiddleware.js    # Auditoría de acciones
│
├── routes/              # Definición de rutas
│   ├── authRoutes.js
│   ├── empleadosRoutes.js
│   ├── turnosRoutes.js
│   ├── feriadosRoutes.js
│   └── planeamientoRoutes.js
│
├── utils/               # Utilidades
│   └── dateUtils.js              # Manejo de fechas
│
├── server.js            # Servidor principal
├── package.json         # Dependencias
└── .env.example         # Ejemplo de variables de entorno
```

## 🔌 API Endpoints

### Autenticación (`/api/auth`)

- `POST /api/auth/login` - Iniciar sesión
- `POST /api/auth/refresh-token` - Renovar token
- `POST /api/auth/logout` - Cerrar sesión
- `GET /api/auth/profile` - Obtener perfil
- `PUT /api/auth/change-password` - Cambiar contraseña

### Empleados (`/api/empleados`)

- `GET /api/empleados` - Obtener todos los empleados
- `GET /api/empleados/:id` - Obtener empleado por ID
- `GET /api/empleados/nombre/:nombre` - Obtener empleado por nombre
- `GET /api/empleados/hora-normal/:nombre` - Obtener tarifa por hora
- `POST /api/empleados` - Crear empleado
- `POST /api/empleados/completo` - ✨ Crear empleado con turnos y totales
- `POST /api/empleados/calcular-antiguedad` - Calcular antigüedad
- `PUT /api/empleados/:id` - Actualizar empleado
- `PUT /api/empleados/:id/hora-normal` - Actualizar tarifa
- `DELETE /api/empleados/:id` - Eliminar empleado

### Turnos/Horarios (`/api/turnos`)

- `GET /api/turnos` - Obtener todos los turnos
- `GET /api/turnos/:id` - Obtener turno por ID
- `GET /api/turnos/horas/:turno` - Obtener horas de un turno
- `POST /api/turnos` - Crear turno
- `POST /api/turnos/calcular-horas` - Calcular horas
- `PUT /api/turnos/:id` - Actualizar turno
- `DELETE /api/turnos/:id` - Eliminar turno

### Feriados (`/api/feriados`)

- `GET /api/feriados` - Obtener todos los feriados
- `GET /api/feriados/periodo/:periodo` - Obtener por año
- `GET /api/feriados/verificar/:fecha` - Verificar si es feriado
- `GET /api/feriados/fecha/:fecha` - Obtener info de feriado
- `POST /api/feriados` - Crear feriado
- `POST /api/feriados/importar` - Importar múltiples
- `PUT /api/feriados/:id` - Actualizar feriado
- `DELETE /api/feriados/:id` - Eliminar feriado

### Planeamiento (`/api/planeamiento`)

- `GET /api/planeamiento/planificador/:mes/:anio` - Cargar planificador
- `GET /api/planeamiento/planificador-detallado/:mes/:anio` - Planificador con detalles
- `GET /api/planeamiento/totales/:mes/:anio` - Totales mensuales
- `GET /api/planeamiento/turno/:anio/:fecha/:empleado` - Turno específico
- `PUT /api/planeamiento/turno/:mes/:anio` - Actualizar turno
- `PUT /api/planeamiento/actualizar-mes/:anio` - Recalcular acumulados
- `POST /api/planeamiento/generar/:anio` - Generar año completo

### 🆕 Vacaciones (`/api/vacaciones`)

- `GET /api/vacaciones` - Obtener todas las vacaciones
- `GET /api/vacaciones/empleado/:nombre_empleado` - Por empleado
- `POST /api/vacaciones` - Crear vacaciones
- `PUT /api/vacaciones/:id` - Actualizar vacaciones
- `DELETE /api/vacaciones/:id` - Eliminar vacaciones

### 🆕 Control de Horas (`/api/control-hs`)

- `GET /api/control-hs/:anio/:mes/:nombre_empleado` - Obtener control de horas
- `POST /api/control-hs/:anio` - Registrar ingreso/egreso
- `PUT /api/control-hs/:anio/:id` - Modificar registro
- `POST /api/control-hs/:anio/recalcular` - Recalcular acumulados

### 🆕 Logueos/Fichajes (`/api/logueo`)

- `GET /api/logueo/:anio/:mes` - Obtener logueos del mes
- `GET /api/logueo/:anio/:mes/empleado/:nombre_empleado` - Por empleado
- `GET /api/logueo/:anio/:mes/fecha/:fecha` - Por fecha
- `GET /api/logueo/:anio/:mes/verificar/:nombre_empleado` - Verificar último ingreso
- `POST /api/logueo/:anio` - Crear logueo
- `PUT /api/logueo/:anio/:id` - Actualizar logueo
- `DELETE /api/logueo/:anio/:id` - Eliminar logueo

### 🆕 Pagos Extras (`/api/extras`)

- `GET /api/extras/:anio/:mes/:nombre_empleado` - Obtener extras de empleado
- `GET /api/extras/:anio/:mes` - Obtener todos los extras del mes
- `GET /api/extras/:anio/:mes/:nombre_empleado/sumas` - Descripción de sumas
- `GET /api/extras/:anio/:mes/:nombre_empleado/restas` - Descripción de restas
- `POST /api/extras/:anio` - Crear pago extra
- `PUT /api/extras/:anio/:id` - Modificar pago extra
- `DELETE /api/extras/:anio/:id` - Eliminar pago extra

### 🆕 Recibos (`/api/recibos`)

- `GET /api/recibos/:nombre_empleado/:mes/:anio` - Obtener recibo
- `GET /api/recibos/:nombre_empleado/:mes/:anio/datos` - Cargar datos (auto-genera)
- `GET /api/recibos/:mes/:anio` - Obtener todos los recibos del mes
- `POST /api/recibos` - Guardar/actualizar recibo
- `DELETE /api/recibos/:nombre_empleado/:mes/:anio` - Eliminar recibo

## 🔒 Autenticación

La API usa JWT (JSON Web Tokens) para autenticación. Todas las rutas excepto `/api/auth/login` requieren autenticación.

### Uso del token:

```javascript
// Headers de la request
{
  "Authorization": "Bearer tu_token_jwt_aqui"
}
```

## 📝 Ejemplos de Uso

### Login

```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "username": "admin",
    "password": "tu_password",
    "remember": true
  }'
```

### Cargar planificador

```bash
curl -X GET http://localhost:3000/api/planeamiento/planificador/1/2024 \
  -H "Authorization: Bearer tu_token_jwt"
```

### Actualizar turno

```bash
curl -X PUT http://localhost:3000/api/planeamiento/turno/1/2024 \
  -H "Authorization: Bearer tu_token_jwt" \
  -H "Content-Type: application/json" \
  -d '{
    "fecha": "15/01/2024",
    "nombreEmpleado": "Juan",
    "turno": "Mañana"
  }'
```

### Generar turnos para un año

```bash
curl -X POST http://localhost:3000/api/planeamiento/generar/2025 \
  -H "Authorization: Bearer tu_token_jwt"
```

## 🛠️ Scripts Disponibles

```bash
# Desarrollo con auto-reload
npm run dev

# Producción
npm start

# Test de conexión a BD
npm test
```

## 🔧 Tecnologías Utilizadas

- **Express.js** - Framework web
- **MySQL2** - Cliente MySQL
- **JWT** - Autenticación
- **bcryptjs** - Encriptación de contraseñas
- **Moment.js** - Manejo de fechas
- **CORS** - Cross-Origin Resource Sharing
- **dotenv** - Variables de entorno

## 📊 Base de Datos

El sistema utiliza MySQL con las siguientes tablas principales:

- `empleados` - Información de empleados
- `horarios` - Definición de turnos
- `feriados` - Feriados nacionales
- `turnos_YYYY` - Turnos diarios por año
- `totales_YYYY` - Totales mensuales por año

## 🚨 Notas Importantes

1. **Seguridad**: Cambiar los secrets de JWT en producción
2. **Base de datos**: Crear las tablas anuales antes de usar (usar endpoint de generación)
3. **Formato de fechas**: Siempre usar formato DD/MM/YYYY
4. **Feriados**: Los feriados pagan doble automáticamente

## 📄 Licencia

ISC

## 👥 Autor

Migrado de C# a Node.js por el equipo de desarrollo.

## 🆘 Soporte

Para problemas o preguntas, contactar al equipo de desarrollo.

