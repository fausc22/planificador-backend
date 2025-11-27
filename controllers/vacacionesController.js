// controllers/vacacionesController.js - Gestión de vacaciones
const db = require('./dbPromise');
const { 
    validarFormatoFecha, 
    obtenerNumeroMes, 
    obtenerNombreMes,
    obtenerRangoFechas,
    parsearFecha
} = require('../utils/dateUtils');
const AppError = require('../utils/AppError');

// ========================================
// FUNCIONES AUXILIARES
// ========================================

// Obtener información del empleado
const obtenerInfoEmpleado = async (nombreEmpleado) => {
    const [empleados] = await db.execute(
        'SELECT id, dia_vacaciones, hora_normal, horas_vacaciones FROM empleados WHERE CONCAT(nombre, " ", apellido) = ?',
        [nombreEmpleado]
    );
    return empleados.length > 0 ? empleados[0] : null;
};

// Calcular horas y acumulado para un día de vacaciones
const calcularHorasYAcumuladoVacaciones = async (nombreEmpleado, fecha) => {
    const empleado = await obtenerInfoEmpleado(nombreEmpleado);
    if (!empleado) return { horas: 0, acumulado: 0 };
    
    // Vacaciones = 8 horas fijas por día
    const horas = 8;
    const acumulado = empleado.hora_normal * horas;
    
    return { horas, acumulado };
};

// Actualizar planificador con turnos de vacaciones
const actualizarPlanificadorVacaciones = async (nombreEmpleado, fechas, anio, connection = null) => {
    const dbToUse = connection || db;
    const tablaTurnos = `turnos_${anio}`;
    const tablaTotales = `totales_${anio}`;
    
    // Agrupar fechas por mes para actualizar totales
    const fechasPorMes = {};
    
    for (const fecha of fechas) {
        const [dia, mes, anioFecha] = fecha.split('/');
        const nroMes = parseInt(mes);
        
        if (!fechasPorMes[nroMes]) {
            fechasPorMes[nroMes] = [];
        }
        fechasPorMes[nroMes].push(fecha);
        
        // Calcular horas y acumulado para este día
        const { horas, acumulado } = await calcularHorasYAcumuladoVacaciones(nombreEmpleado, fecha);
        
        // Verificar si existe el turno, si no existe crearlo
        const [turnoExistente] = await dbToUse.execute(
            `SELECT turno_id FROM ${tablaTurnos} WHERE fecha = ? AND nombre_empleado = ?`,
            [fecha, nombreEmpleado]
        );
        
        if (turnoExistente.length > 0) {
            // Actualizar turno existente
            await dbToUse.execute(
                `UPDATE ${tablaTurnos} SET turno = ?, horas = ?, acumulado = ? WHERE fecha = ? AND nombre_empleado = ?`,
                ['VACACIONES', horas, acumulado, fecha, nombreEmpleado]
            );
        } else {
            // Crear nuevo turno
            await dbToUse.execute(
                `INSERT INTO ${tablaTurnos} (fecha, nombre_empleado, turno, horas, acumulado) VALUES (?, ?, ?, ?, ?)`,
                [fecha, nombreEmpleado, 'VACACIONES', horas, acumulado]
            );
        }
    }
    
    // Actualizar totales mensuales para cada mes afectado
    for (const [mes, fechasMes] of Object.entries(fechasPorMes)) {
        const nroMes = parseInt(mes);
        
        // Obtener totales actuales antes de agregar vacaciones
        const [totalesMes] = await dbToUse.execute(
            `SELECT horas, acumulado FROM ${tablaTotales} WHERE mes = ? AND nombre_empleado = ?`,
            [nroMes, nombreEmpleado]
        );
        
        let horasTotales = totalesMes.length > 0 ? (totalesMes[0].horas || 0) : 0;
        let acumuladoTotal = totalesMes.length > 0 ? (totalesMes[0].acumulado || 0) : 0;
        
        // Sumar horas y acumulado de las vacaciones de este mes
        for (const fecha of fechasMes) {
            const { horas, acumulado } = await calcularHorasYAcumuladoVacaciones(nombreEmpleado, fecha);
            horasTotales += horas;
            acumuladoTotal += acumulado;
        }
        
        // Actualizar o crear totales mensuales
        if (totalesMes.length > 0) {
            await dbToUse.execute(
                `UPDATE ${tablaTotales} SET horas = ?, acumulado = ? WHERE mes = ? AND nombre_empleado = ?`,
                [horasTotales, acumuladoTotal, nroMes, nombreEmpleado]
            );
        } else {
            await dbToUse.execute(
                `INSERT INTO ${tablaTotales} (mes, nombre_empleado, horas, acumulado) VALUES (?, ?, ?, ?)`,
                [nroMes, nombreEmpleado, horasTotales, acumuladoTotal]
            );
        }
    }
};

// Limpiar turnos de vacaciones del planificador
const limpiarPlanificadorVacaciones = async (nombreEmpleado, fechas, anio, connection = null) => {
    const dbToUse = connection || db;
    const tablaTurnos = `turnos_${anio}`;
    const tablaTotales = `totales_${anio}`;
    
    // Agrupar fechas por mes
    const fechasPorMes = {};
    
    for (const fecha of fechas) {
        const [dia, mes] = fecha.split('/');
        const nroMes = parseInt(mes);
        
        if (!fechasPorMes[nroMes]) {
            fechasPorMes[nroMes] = [];
        }
        fechasPorMes[nroMes].push(fecha);
        
        // Obtener horas y acumulado que se van a eliminar
        const [turnoActual] = await dbToUse.execute(
            `SELECT horas, acumulado FROM ${tablaTurnos} WHERE fecha = ? AND nombre_empleado = ? AND turno = 'VACACIONES'`,
            [fecha, nombreEmpleado]
        );
        
        if (turnoActual.length > 0) {
            // Eliminar o resetear el turno (ponerlo como null)
            await dbToUse.execute(
                `UPDATE ${tablaTurnos} SET turno = NULL, horas = 0, acumulado = 0 WHERE fecha = ? AND nombre_empleado = ? AND turno = 'VACACIONES'`,
                [fecha, nombreEmpleado]
            );
        }
    }
    
    // Recalcular totales mensuales para cada mes afectado
    for (const [mes, fechasMes] of Object.entries(fechasPorMes)) {
        const nroMes = parseInt(mes);
        
        // Obtener todos los turnos del mes para recalcular correctamente
        const [turnosMes] = await dbToUse.execute(
            `SELECT horas, acumulado FROM ${tablaTurnos} WHERE nombre_empleado = ? AND fecha LIKE ?`,
            [nombreEmpleado, `%/${String(nroMes).padStart(2, '0')}/%`]
        );
        
        // Recalcular totales sumando todas las horas y acumulados del mes
        let horasTotales = 0;
        let acumuladoTotal = 0;
        
        turnosMes.forEach(turno => {
            horasTotales += turno.horas || 0;
            acumuladoTotal += turno.acumulado || 0;
        });
        
        // Actualizar totales mensuales
        const [totalesMes] = await dbToUse.execute(
            `SELECT horas, acumulado FROM ${tablaTotales} WHERE mes = ? AND nombre_empleado = ?`,
            [nroMes, nombreEmpleado]
        );
        
        if (totalesMes.length > 0) {
            await dbToUse.execute(
                `UPDATE ${tablaTotales} SET horas = ?, acumulado = ? WHERE mes = ? AND nombre_empleado = ?`,
                [horasTotales, acumuladoTotal, nroMes, nombreEmpleado]
            );
        } else if (horasTotales > 0 || acumuladoTotal > 0) {
            // Solo crear si hay horas o acumulado
            await dbToUse.execute(
                `INSERT INTO ${tablaTotales} (mes, nombre_empleado, horas, acumulado) VALUES (?, ?, ?, ?)`,
                [nroMes, nombreEmpleado, horasTotales, acumuladoTotal]
            );
        }
    }
};

// ========================================
// ENDPOINTS
// ========================================

// Obtener todas las vacaciones (con filtro opcional de empleado y año, con paginación)
exports.obtenerVacaciones = async (req, res) => {
    try {
        const { nombre_empleado, anio, page = 1, limit = 10 } = req.query;
        
        // Validar y parsear parámetros de paginación
        const pageNum = Math.max(1, parseInt(page) || 1);
        const limitNum = Math.max(1, Math.min(100, parseInt(limit) || 10)); // Máximo 100 por página
        const offset = (pageNum - 1) * limitNum;
        
        let query = 'SELECT * FROM vacaciones WHERE 1=1';
        let countQuery = 'SELECT COUNT(*) as total FROM vacaciones WHERE 1=1';
        let params = [];

        if (nombre_empleado && nombre_empleado !== '') {
            query += ' AND nombre_empleado = ?';
            countQuery += ' AND nombre_empleado = ?';
            params.push(nombre_empleado);
        }

        if (anio) {
            query += ' AND (salida LIKE ? OR regreso LIKE ?)';
            countQuery += ' AND (salida LIKE ? OR regreso LIKE ?)';
            params.push(`%/${anio}`, `%/${anio}`);
        }

        // Ordenar por fecha de salida descendente (más reciente primero)
        query += ' ORDER BY STR_TO_DATE(salida, "%d/%m/%Y") DESC';

        // Agregar paginación (LIMIT y OFFSET deben ser valores directos, no parámetros)
        query += ` LIMIT ${limitNum} OFFSET ${offset}`;

        // Obtener total de registros
        const [countResult] = await db.execute(countQuery, params);
        const total = countResult[0].total;
        const totalPages = Math.ceil(total / limitNum);

        // Obtener vacaciones paginadas
        const [vacaciones] = await db.execute(query, params);

        res.json({
            success: true,
            count: vacaciones.length,
            total,
            page: pageNum,
            limit: limitNum,
            totalPages,
            vacaciones
        });
    } catch (error) {
        console.error('❌ Error al obtener vacaciones:', error);
        res.status(500).json({
            success: false,
            message: 'Error al obtener vacaciones',
            error: error.message
        });
    }
};

// Obtener vacaciones por empleado
exports.obtenerVacacionesPorEmpleado = async (req, res) => {
    try {
        const { nombre_empleado } = req.params;

        const [vacaciones] = await db.execute(
            'SELECT * FROM vacaciones WHERE nombre_empleado = ? ORDER BY salida DESC',
            [nombre_empleado]
        );

        res.json({
            success: true,
            empleado: nombre_empleado,
            count: vacaciones.length,
            vacaciones
        });
    } catch (error) {
        console.error('❌ Error al obtener vacaciones:', error);
        res.status(500).json({
            success: false,
            message: 'Error al obtener vacaciones',
            error: error.message
        });
    }
};

// Obtener empleados con días de vacaciones disponibles
exports.obtenerEmpleadosConDiasVacaciones = async (req, res) => {
    try {
        const [empleados] = await db.execute(
            'SELECT id, nombre, apellido, dia_vacaciones, horas_vacaciones FROM empleados ORDER BY nombre ASC, apellido ASC'
        );

        const empleadosConInfo = empleados.map(emp => ({
            id: emp.id,
            nombre_completo: `${emp.nombre} ${emp.apellido}`,
            nombre: emp.nombre,
            apellido: emp.apellido,
            dia_vacaciones: emp.dia_vacaciones,
            horas_vacaciones: emp.horas_vacaciones
        }));

        res.json({
            success: true,
            count: empleadosConInfo.length,
            empleados: empleadosConInfo
        });
    } catch (error) {
        console.error('❌ Error al obtener empleados:', error);
        res.status(500).json({
            success: false,
            message: 'Error al obtener empleados',
            error: error.message
        });
    }
};

// Crear vacaciones (con descuento de días y actualización de planificador)
exports.crearVacaciones = async (req, res) => {
    const connection = await db.getConnection();
    
    try {
        await connection.beginTransaction();
        
        const {
            nombre_empleado,
            dias,
            salida,
            regreso,
            mes,
            anio,
            tipo = 'vacaciones'
        } = req.body;

        // Validar formato de fechas
        if (!validarFormatoFecha(salida) || !validarFormatoFecha(regreso)) {
            await connection.rollback();
            return res.status(400).json({
                success: false,
                message: 'Formato de fecha inválido. Use DD/MM/YYYY'
            });
        }

        // Obtener información del empleado
        const empleado = await obtenerInfoEmpleado(nombre_empleado);
        if (!empleado) {
            await connection.rollback();
            return res.status(404).json({
                success: false,
                message: 'Empleado no encontrado'
            });
        }

        // Validar días disponibles
        if (tipo === 'vacaciones' && empleado.dia_vacaciones < dias) {
            await connection.rollback();
            return res.status(400).json({
                success: false,
                message: `El empleado solo tiene ${empleado.dia_vacaciones} días de vacaciones disponibles. Está intentando usar ${dias} días.`
            });
        }

        // Validar que regreso sea posterior a salida
        const fechaSalida = parsearFecha(salida);
        const fechaRegreso = parsearFecha(regreso);
        
        if (fechaRegreso.isBefore(fechaSalida)) {
            await connection.rollback();
            return res.status(400).json({
                success: false,
                message: 'La fecha de regreso debe ser posterior a la fecha de salida'
            });
        }

        // Calcular días reales
        const diasReales = fechaRegreso.diff(fechaSalida, 'days') + 1;
        if (diasReales !== dias) {
            await connection.rollback();
            return res.status(400).json({
                success: false,
                message: `Los días especificados (${dias}) no coinciden con el rango de fechas (${diasReales} días)`
            });
        }

        // Actualizar días de vacaciones del empleado
        if (tipo === 'vacaciones') {
            const diasRestantes = empleado.dia_vacaciones - dias;
            await connection.execute(
                'UPDATE empleados SET dia_vacaciones = ? WHERE CONCAT(nombre, " ", apellido) = ?',
                [diasRestantes, nombre_empleado]
            );
        }

        // Insertar vacaciones
        const [result] = await connection.execute(
            'INSERT INTO vacaciones (nombre_empleado, dias, salida, regreso) VALUES (?, ?, ?, ?)',
            [nombre_empleado, dias, salida, regreso]
        );

        // Obtener rango de fechas
        const fechas = obtenerRangoFechas(salida, regreso);

        // Extraer año de la fecha de salida
        const [diaS, mesS, anioS] = salida.split('/');
        const anioVacaciones = parseInt(anioS);

        // Actualizar planificador
        await actualizarPlanificadorVacaciones(nombre_empleado, fechas, anioVacaciones, connection);

        await connection.commit();

        res.status(201).json({
            success: true,
            message: 'Vacaciones creadas exitosamente. El planificador ha sido actualizado.',
            vacacionesId: result.insertId,
            diasRestantes: tipo === 'vacaciones' ? (empleado.dia_vacaciones - dias) : empleado.dia_vacaciones,
            fechasActualizadas: fechas.length
        });

    } catch (error) {
        await connection.rollback();
        console.error('❌ Error al crear vacaciones:', error);
        res.status(500).json({
            success: false,
            message: 'Error al crear vacaciones',
            error: error.message
        });
    } finally {
        connection.release();
    }
};

// Actualizar vacaciones
exports.actualizarVacaciones = async (req, res) => {
    const connection = await db.getConnection();
    
    try {
        await connection.beginTransaction();
        
        const { id } = req.params;
        const { nombre_empleado, dias, salida, regreso, mes, anio } = req.body;

        // Verificar que las vacaciones existen
        const [vacacionesAnteriores] = await connection.execute(
            'SELECT * FROM vacaciones WHERE id = ?',
            [id]
        );

        if (vacacionesAnteriores.length === 0) {
            await connection.rollback();
            return res.status(404).json({
                success: false,
                message: 'Vacaciones no encontradas'
            });
        }

        const vacacionAnterior = vacacionesAnteriores[0];
        const nombreEmpleadoAnterior = vacacionAnterior.nombre_empleado;
        const diasAnteriores = vacacionAnterior.dias;
        const salidaAnterior = vacacionAnterior.salida;
        const regresoAnterior = vacacionAnterior.regreso;

        // Obtener información del empleado
        const nombreEmpleadoFinal = nombre_empleado || nombreEmpleadoAnterior;
        const empleado = await obtenerInfoEmpleado(nombreEmpleadoFinal);
        if (!empleado) {
            await connection.rollback();
            return res.status(404).json({
                success: false,
                message: 'Empleado no encontrado'
            });
        }

        // Si se están cambiando las fechas o días, validar
        const salidaFinal = salida || salidaAnterior;
        const regresoFinal = regreso || regresoAnterior;
        const diasFinal = dias || diasAnteriores;

        if (salida && validarFormatoFecha(salida) && regreso && validarFormatoFecha(regreso)) {
            const fechaSalida = parsearFecha(salida);
            const fechaRegreso = parsearFecha(regreso);
            
            if (fechaRegreso.isBefore(fechaSalida)) {
                await connection.rollback();
                return res.status(400).json({
                    success: false,
                    message: 'La fecha de regreso debe ser posterior a la fecha de salida'
                });
            }

            const diasReales = fechaRegreso.diff(fechaSalida, 'days') + 1;
            if (diasReales !== diasFinal) {
                await connection.rollback();
                return res.status(400).json({
                    success: false,
                    message: `Los días especificados (${diasFinal}) no coinciden con el rango de fechas (${diasReales} días)`
                });
            }
        }

        // Calcular diferencia de días para actualizar días disponibles
        const diferenciaDias = diasFinal - diasAnteriores;
        const diasDisponiblesActuales = empleado.dia_vacaciones;

        // Validar que tenga días suficientes si está aumentando
        if (diferenciaDias > 0 && diasDisponiblesActuales < diferenciaDias) {
            await connection.rollback();
            return res.status(400).json({
                success: false,
                message: `El empleado solo tiene ${diasDisponiblesActuales} días disponibles. Necesita ${diferenciaDias} días adicionales.`
            });
        }

        // Limpiar planificador de las fechas antiguas
        const fechasAnteriores = obtenerRangoFechas(salidaAnterior, regresoAnterior);
        const [diaSAnterior, mesSAnterior, anioSAnterior] = salidaAnterior.split('/');
        const anioAnterior = parseInt(anioSAnterior);
        
        // Restaurar días si se están reduciendo
        if (diferenciaDias < 0) {
            await connection.execute(
                'UPDATE empleados SET dia_vacaciones = ? WHERE CONCAT(nombre, " ", apellido) = ?',
                [diasDisponiblesActuales + Math.abs(diferenciaDias), nombreEmpleadoFinal]
            );
        } else if (diferenciaDias > 0) {
            // Descontar días si se están aumentando
            await connection.execute(
                'UPDATE empleados SET dia_vacaciones = ? WHERE CONCAT(nombre, " ", apellido) = ?',
                [diasDisponiblesActuales - diferenciaDias, nombreEmpleadoFinal]
            );
        }

        // Limpiar planificador de fechas antiguas (solo si cambió el empleado o las fechas)
        if (nombreEmpleadoAnterior !== nombreEmpleadoFinal || 
            salidaAnterior !== salidaFinal || 
            regresoAnterior !== regresoFinal) {
            await limpiarPlanificadorVacaciones(nombreEmpleadoAnterior, fechasAnteriores, anioAnterior, connection);
        }

        // Actualizar registro de vacaciones
        await connection.execute(
            'UPDATE vacaciones SET nombre_empleado = ?, dias = ?, salida = ?, regreso = ? WHERE id = ?',
            [nombreEmpleadoFinal, diasFinal, salidaFinal, regresoFinal, id]
        );

        // Actualizar planificador con las nuevas fechas
        const fechasNuevas = obtenerRangoFechas(salidaFinal, regresoFinal);
        const [diaSNuevo, mesSNuevo, anioSNuevo] = salidaFinal.split('/');
        const anioNuevo = parseInt(anioSNuevo);
        
        await actualizarPlanificadorVacaciones(nombreEmpleadoFinal, fechasNuevas, anioNuevo, connection);

        await connection.commit();

        res.json({
            success: true,
            message: 'Vacaciones actualizadas exitosamente. El planificador ha sido actualizado.',
            diasRestantes: empleado.dia_vacaciones - diferenciaDias
        });

    } catch (error) {
        await connection.rollback();
        console.error('❌ Error al actualizar vacaciones:', error);
        res.status(500).json({
            success: false,
            message: 'Error al actualizar vacaciones',
            error: error.message
        });
    } finally {
        connection.release();
    }
};

// Eliminar vacaciones
exports.eliminarVacaciones = async (req, res) => {
    const connection = await db.getConnection();
    
    try {
        await connection.beginTransaction();
        
        const { id } = req.params;

        // Obtener información de las vacaciones antes de eliminar
        const [vacaciones] = await connection.execute(
            'SELECT * FROM vacaciones WHERE id = ?',
            [id]
        );

        if (vacaciones.length === 0) {
            await connection.rollback();
            return res.status(404).json({
                success: false,
                message: 'Vacaciones no encontradas'
            });
        }

        const vacacion = vacaciones[0];
        const nombreEmpleado = vacacion.nombre_empleado;
        const dias = vacacion.dias;
        const salida = vacacion.salida;
        const regreso = vacacion.regreso;

        // Obtener información del empleado
        const empleado = await obtenerInfoEmpleado(nombreEmpleado);
        if (!empleado) {
            await connection.rollback();
            return res.status(404).json({
                success: false,
                message: 'Empleado no encontrado'
            });
        }

        // Limpiar planificador
        const fechas = obtenerRangoFechas(salida, regreso);
        const [diaS, mesS, anioS] = salida.split('/');
        const anio = parseInt(anioS);
        
        await limpiarPlanificadorVacaciones(nombreEmpleado, fechas, anio, connection);

        // Restaurar días de vacaciones
        await connection.execute(
            'UPDATE empleados SET dia_vacaciones = ? WHERE CONCAT(nombre, " ", apellido) = ?',
            [empleado.dia_vacaciones + dias, nombreEmpleado]
        );

        // Eliminar vacaciones
        const [result] = await connection.execute(
            'DELETE FROM vacaciones WHERE id = ?',
            [id]
        );

        if (result.affectedRows === 0) {
            await connection.rollback();
            return res.status(404).json({
                success: false,
                message: 'Vacaciones no encontradas'
            });
        }

        await connection.commit();

        res.json({
            success: true,
            message: 'Vacaciones eliminadas exitosamente. El planificador ha sido actualizado y los días han sido restaurados.',
            diasRestaurados: dias,
            diasDisponiblesActuales: empleado.dia_vacaciones + dias
        });

    } catch (error) {
        await connection.rollback();
        console.error('❌ Error al eliminar vacaciones:', error);
        res.status(500).json({
            success: false,
            message: 'Error al eliminar vacaciones',
            error: error.message
        });
    } finally {
        connection.release();
    }
};

// Actualizar días de vacaciones de un empleado directamente
exports.actualizarDiasVacaciones = async (req, res) => {
    try {
        const { id } = req.params;
        const { dia_vacaciones } = req.body;

        // Obtener empleado
        const [empleados] = await db.execute(
            'SELECT id, nombre, apellido, dia_vacaciones FROM empleados WHERE id = ?',
            [id]
        );

        if (empleados.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Empleado no encontrado'
            });
        }

        // Actualizar días de vacaciones
        await db.execute(
            'UPDATE empleados SET dia_vacaciones = ? WHERE id = ?',
            [dia_vacaciones, id]
        );

        res.json({
            success: true,
            message: 'Días de vacaciones actualizados exitosamente',
            empleado: {
                id,
                nombre_completo: `${empleados[0].nombre} ${empleados[0].apellido}`,
                dia_vacaciones: dia_vacaciones
            }
        });

    } catch (error) {
        console.error('❌ Error al actualizar días de vacaciones:', error);
        res.status(500).json({
            success: false,
            message: 'Error al actualizar días de vacaciones',
            error: error.message
        });
    }
};
