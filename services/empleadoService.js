// services/empleadoService.js - Capa de servicios para empleados (lógica de negocio)
const db = require('../controllers/dbPromise');
const AppError = require('../utils/AppError');

class EmpleadoService {
    /**
     * Obtener todos los empleados con paginación
     */
    async obtenerTodos(options = {}) {
        const { page = 1, limit = 20, sortBy = 'nombre', sortOrder = 'ASC' } = options;
        const offset = (page - 1) * limit;

        // Validar columna de ordenamiento para prevenir SQL injection
        const columnasPermitidas = ['nombre', 'apellido', 'fecha_ingreso', 'hora_normal', 'antiguedad'];
        const columnaOrden = columnasPermitidas.includes(sortBy) ? sortBy : 'nombre';
        const orden = sortOrder.toUpperCase() === 'DESC' ? 'DESC' : 'ASC';

        // Obtener total de registros
        const [countResult] = await db.execute('SELECT COUNT(*) as total FROM empleados');
        const total = countResult[0].total;

        // Obtener empleados paginados
        const [empleados] = await db.execute(
            `SELECT id, nombre, apellido, mail as email, fecha_ingreso, antiguedad, 
                    hora_normal, dia_vacaciones, horas_vacaciones 
             FROM empleados 
             ORDER BY ${columnaOrden} ${orden}
             LIMIT ? OFFSET ?`,
            [limit, offset]
        );

        return {
            empleados,
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit)
            }
        };
    }

    /**
     * Obtener empleado por ID
     */
    async obtenerPorId(id) {
        const [empleados] = await db.execute(
            `SELECT id, nombre, apellido, mail as email, fecha_ingreso, antiguedad, 
                    hora_normal, dia_vacaciones, horas_vacaciones 
             FROM empleados 
             WHERE id = ?`,
            [id]
        );

        if (empleados.length === 0) {
            throw new AppError('Empleado no encontrado', 404);
        }

        return empleados[0];
    }

    /**
     * Obtener empleado por nombre
     */
    async obtenerPorNombre(nombre) {
        const [empleados] = await db.execute(
            `SELECT id, nombre, apellido, mail as email, fecha_ingreso, antiguedad, 
                    hora_normal, dia_vacaciones, horas_vacaciones 
             FROM empleados 
             WHERE nombre = ?`,
            [nombre]
        );

        if (empleados.length === 0) {
            throw new AppError('Empleado no encontrado', 404);
        }

        return empleados[0];
    }

    /**
     * Crear empleado simple
     */
    async crear(datosEmpleado) {
        const {
            nombre, apellido, mail, fecha_ingreso, antiguedad = 0,
            hora_normal, dia_vacaciones = 0, horas_vacaciones = 0,
            foto_perfil = null, huella_dactilar = null
        } = datosEmpleado;

        // Verificar si ya existe un empleado con ese nombre
        const [existente] = await db.execute(
            'SELECT id FROM empleados WHERE nombre = ?',
            [nombre]
        );

        if (existente.length > 0) {
            throw new AppError('Ya existe un empleado con ese nombre', 409);
        }

        const [result] = await db.execute(
            `INSERT INTO empleados 
             (nombre, apellido, mail, fecha_ingreso, antiguedad, hora_normal, 
              foto_perfil, huella_dactilar, dia_vacaciones, horas_vacaciones) 
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [nombre, apellido, mail, fecha_ingreso, antiguedad, hora_normal,
             foto_perfil, huella_dactilar, dia_vacaciones, horas_vacaciones]
        );

        return {
            id: result.insertId,
            ...datosEmpleado
        };
    }

    /**
     * Crear empleado completo con turnos y totales
     */
    async crearCompleto(datosEmpleado, aniosGenerar = [2024, 2025, 2026]) {
        // Crear el empleado
        const empleado = await this.crear(datosEmpleado);

        // Generar turnos y totales para los años especificados
        let turnosCreados = 0;
        let totalesCreados = 0;

        for (const anio of aniosGenerar) {
            // Crear totales mensuales
            for (let mes = 1; mes <= 12; mes++) {
                try {
                    await db.execute(
                        `INSERT INTO totales_${anio} (mes, nombre_empleado, horas, acumulado) 
                         VALUES (?, ?, 0, 0)`,
                        [mes, datosEmpleado.nombre]
                    );
                    totalesCreados++;
                } catch (err) {
                    // Ignorar si ya existe
                }
            }

            // Crear turnos diarios
            for (let mes = 1; mes <= 12; mes++) {
                const diasEnMes = new Date(anio, mes, 0).getDate();
                
                for (let dia = 1; dia <= diasEnMes; dia++) {
                    const fechaStr = `${String(dia).padStart(2, '0')}/${String(mes).padStart(2, '0')}/${anio}`;
                    
                    try {
                        await db.execute(
                            `INSERT INTO turnos_${anio} (fecha, nombre_empleado, turno, horas, acumulado) 
                             VALUES (?, ?, 'Libre', 0, 0)`,
                            [fechaStr, datosEmpleado.nombre]
                        );
                        turnosCreados++;
                    } catch (err) {
                        // Ignorar si ya existe
                    }
                }
            }
        }

        return {
            empleado,
            turnosCreados,
            totalesCreados
        };
    }

    /**
     * Actualizar empleado
     */
    async actualizar(id, datosActualizados) {
        // Verificar que el empleado existe
        await this.obtenerPorId(id);

        const campos = [];
        const valores = [];

        // Construir query dinámicamente solo con campos presentes
        Object.keys(datosActualizados).forEach(key => {
            if (datosActualizados[key] !== undefined) {
                // Mapear 'email' a 'mail'
                const campo = key === 'email' ? 'mail' : key;
                campos.push(`${campo} = ?`);
                valores.push(datosActualizados[key]);
            }
        });

        if (campos.length === 0) {
            throw new AppError('No hay datos para actualizar', 400);
        }

        valores.push(id);

        await db.execute(
            `UPDATE empleados SET ${campos.join(', ')} WHERE id = ?`,
            valores
        );

        return await this.obtenerPorId(id);
    }

    /**
     * Eliminar empleado
     */
    async eliminar(id) {
        // Verificar que el empleado existe
        const empleado = await this.obtenerPorId(id);

        // Eliminar empleado
        await db.execute('DELETE FROM empleados WHERE id = ?', [id]);

        return empleado;
    }

    /**
     * Calcular antigüedad
     */
    calcularAntiguedad(fechaIngreso) {
        const partes = fechaIngreso.split('/');
        const fecha = new Date(partes[2], partes[1] - 1, partes[0]);
        const fechaActual = new Date();

        let antiguedad = fechaActual.getFullYear() - fecha.getFullYear();

        const mesActual = fechaActual.getMonth();
        const mesIngreso = fecha.getMonth();
        const diaActual = fechaActual.getDate();
        const diaIngreso = fecha.getDate();

        if (mesActual < mesIngreso || (mesActual === mesIngreso && diaActual < diaIngreso)) {
            antiguedad--;
        }

        return antiguedad;
    }
}

module.exports = new EmpleadoService();

