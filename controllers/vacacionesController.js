// controllers/vacacionesController.js - Gestión de vacaciones
const db = require('./dbPromise');
const { validarFormatoFecha, obtenerNumeroMes, obtenerNombreMes } = require('../utils/dateUtils');

// Obtener todas las vacaciones (con filtro opcional de empleado y año)
exports.obtenerVacaciones = async (req, res) => {
    try {
        const { nombre_empleado, anio } = req.query;
        
        let query = 'SELECT * FROM vacaciones WHERE 1=1';
        let params = [];

        if (nombre_empleado && nombre_empleado !== '') {
            query += ' AND nombre_empleado = ?';
            params.push(nombre_empleado);
        }

        if (anio) {
            query += ' AND (salida LIKE ? OR regreso LIKE ?)';
            params.push(`%/${anio}`, `%/${anio}`);
        }

        query += ' ORDER BY salida DESC';

        const [vacaciones] = await db.execute(query, params);

        res.json({
            success: true,
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

// Crear vacaciones (con descuento de días y actualización de planificador)
exports.crearVacaciones = async (req, res) => {
    try {
        const {
            nombre_empleado,
            dias,
            salida,
            regreso,
            mes,
            anio,
            tipo = 'vacaciones' // 'vacaciones' o 'vacaciones sin goce'
        } = req.body;

        // Validaciones
        if (!nombre_empleado || !dias || !salida || !regreso || !mes || !anio) {
            return res.status(400).json({
                success: false,
                message: 'Faltan campos obligatorios'
            });
        }

        // Obtener días de vacaciones disponibles
        const [empleados] = await db.execute(
            'SELECT dia_vacaciones, hora_normal, horas_vacaciones FROM empleados WHERE CONCAT(nombre, " ", apellido) = ?',
            [nombre_empleado]
        );

        if (empleados.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Empleado no encontrado'
            });
        }

        const empleado = empleados[0];
        const diasDisponibles = empleado.dia_vacaciones;

        if (tipo === 'vacaciones' && diasDisponibles < dias) {
            return res.status(400).json({
                success: false,
                message: `El empleado solo tiene ${diasDisponibles} días de vacaciones disponibles`
            });
        }

        // Calcular horas por día de vacaciones
        const horasPorDia = empleado.horas_vacaciones / 5;
        const valorHora = empleado.hora_normal;
        const acumuladoPorDia = valorHora * horasPorDia;

        // Actualizar días de vacaciones del empleado
        if (tipo === 'vacaciones') {
            const diasRestantes = diasDisponibles - dias;
            await db.execute(
                'UPDATE empleados SET dia_vacaciones = ? WHERE CONCAT(nombre, " ", apellido) = ?',
                [diasRestantes, nombre_empleado]
            );
        }

        // Insertar vacaciones
        const [result] = await db.execute(
            'INSERT INTO vacaciones (nombre_empleado, dias, salida, regreso) VALUES (?, ?, ?, ?)',
            [nombre_empleado, dias, salida, regreso]
        );

        // Actualizar planificador con las fechas de vacaciones
        const nroMes = typeof mes === 'string' ? obtenerNumeroMes(mes) : parseInt(mes);
        const tablaTurnos = `turnos_${anio}`;
        const tablaTotales = `totales_${anio}`;

        // Obtener totales actuales
        const [totalesMes] = await db.execute(
            `SELECT horas, acumulado FROM ${tablaTotales} WHERE mes = ? AND nombre_empleado = ?`,
            [nroMes, nombre_empleado]
        );

        let horasTotales = totalesMes.length > 0 ? totalesMes[0].horas : 0;
        let acumuladoTotal = totalesMes.length > 0 ? totalesMes[0].acumulado : 0;

        // Parsear fechas
        const [diaS, mesS, anioS] = salida.split('/');
        const [diaR, mesR, anioR] = regreso.split('/');
        const fechaSalida = new Date(anioS, mesS - 1, diaS);
        const fechaRegreso = new Date(anioR, mesR - 1, diaR);

        // Actualizar cada día entre salida y regreso
        for (let fecha = new Date(fechaSalida); fecha <= fechaRegreso; fecha.setDate(fecha.getDate() + 1)) {
            const fechaStr = `${String(fecha.getDate()).padStart(2, '0')}/${String(fecha.getMonth() + 1).padStart(2, '0')}/${fecha.getFullYear()}`;
            
            const horas = tipo === 'vacaciones' ? horasPorDia : 0;
            const acumulado = tipo === 'vacaciones' ? acumuladoPorDia : 0;

            await db.execute(
                `UPDATE ${tablaTurnos} SET turno = ?, horas = ?, acumulado = ? WHERE fecha = ? AND nombre_empleado = ?`,
                ['VACACIONES', horas, acumulado, fechaStr, nombre_empleado]
            );

            if (tipo === 'vacaciones') {
                horasTotales += horas;
                acumuladoTotal += acumulado;
            }
        }

        // Actualizar totales mensuales
        if (totalesMes.length > 0) {
            await db.execute(
                `UPDATE ${tablaTotales} SET horas = ?, acumulado = ? WHERE mes = ? AND nombre_empleado = ?`,
                [horasTotales, acumuladoTotal, nroMes, nombre_empleado]
            );
        }

        res.status(201).json({
            success: true,
            message: 'Vacaciones creadas exitosamente',
            vacacionesId: result.insertId,
            diasRestantes: tipo === 'vacaciones' ? (diasDisponibles - dias) : diasDisponibles
        });

    } catch (error) {
        console.error('❌ Error al crear vacaciones:', error);
        res.status(500).json({
            success: false,
            message: 'Error al crear vacaciones',
            error: error.message
        });
    }
};

// Actualizar vacaciones
exports.actualizarVacaciones = async (req, res) => {
    try {
        const { id } = req.params;
        const { nombre_empleado, dias, salida, regreso } = req.body;

        // Verificar que las vacaciones existen
        const [vacacionesAnteriores] = await db.execute(
            'SELECT * FROM vacaciones WHERE id = ?',
            [id]
        );

        if (vacacionesAnteriores.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Vacaciones no encontradas'
            });
        }

        await db.execute(
            'UPDATE vacaciones SET nombre_empleado = ?, dias = ?, salida = ?, regreso = ? WHERE id = ?',
            [nombre_empleado, dias, salida, regreso, id]
        );

        res.json({
            success: true,
            message: 'Vacaciones actualizadas exitosamente'
        });

    } catch (error) {
        console.error('❌ Error al actualizar vacaciones:', error);
        res.status(500).json({
            success: false,
            message: 'Error al actualizar vacaciones',
            error: error.message
        });
    }
};

// Eliminar vacaciones
exports.eliminarVacaciones = async (req, res) => {
    try {
        const { id } = req.params;

        const [result] = await db.execute(
            'DELETE FROM vacaciones WHERE id = ?',
            [id]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({
                success: false,
                message: 'Vacaciones no encontradas'
            });
        }

        res.json({
            success: true,
            message: 'Vacaciones eliminadas exitosamente'
        });

    } catch (error) {
        console.error('❌ Error al eliminar vacaciones:', error);
        res.status(500).json({
            success: false,
            message: 'Error al eliminar vacaciones',
            error: error.message
        });
    }
};

