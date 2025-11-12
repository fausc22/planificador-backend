// controllers/controlHsController.js - Control de horas trabajadas (fichajes)
const db = require('./dbPromise');
const { obtenerNumeroMes } = require('../utils/dateUtils');

// Obtener control de horas por empleado y mes
exports.obtenerControlHoras = async (req, res) => {
    try {
        const { anio, mes, nombre_empleado } = req.params;
        const tabla = `controlhs_${anio}`;

        const [registros] = await db.execute(
            `SELECT * FROM ${tabla} WHERE nombre_empleado = ? AND mes = ? ORDER BY fecha ASC`,
            [nombre_empleado, mes]
        );

        res.json({
            success: true,
            anio,
            mes,
            empleado: nombre_empleado,
            count: registros.length,
            registros
        });

    } catch (error) {
        console.error('❌ Error al obtener control de horas:', error);
        res.status(500).json({
            success: false,
            message: 'Error al obtener control de horas',
            error: error.message
        });
    }
};

// Registrar ingreso/egreso
exports.registrarIngresoEgreso = async (req, res) => {
    try {
        const { anio } = req.params;
        const { nombre_empleado, fecha, hora_ingreso, hora_egreso, mes } = req.body;

        if (!nombre_empleado || !fecha || !hora_ingreso || !hora_egreso || !mes) {
            return res.status(400).json({
                success: false,
                message: 'Faltan datos obligatorios'
            });
        }

        // Obtener valor hora del empleado
        const [empleados] = await db.execute(
            'SELECT hora_normal FROM empleados WHERE nombre = ?',
            [nombre_empleado]
        );

        if (empleados.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Empleado no encontrado'
            });
        }

        const valorHora = empleados[0].hora_normal;

        // Calcular horas trabajadas
        const [horasI, minutosI, segundosI] = hora_ingreso.split(':').map(Number);
        const [horasE, minutosE, segundosE] = hora_egreso.split(':').map(Number);

        let minutosIngreso = horasI * 60 + minutosI;
        let minutosEgreso = horasE * 60 + minutosE;

        // Manejar cambio de día
        if (minutosEgreso < minutosIngreso) {
            minutosEgreso += 24 * 60;
        }

        const minutosTrabajados = minutosEgreso - minutosIngreso;
        const horasTrabajadas = Math.floor(minutosTrabajados / 60);
        const acumulado = Math.round((minutosTrabajados / 60) * valorHora);

        const tabla = `controlhs_${anio}`;

        // Verificar si es feriado para crear pago extra
        const [feriados] = await db.execute(
            'SELECT COUNT(*) as count FROM feriados WHERE fecha = ?',
            [fecha]
        );

        const esFeriado = feriados[0].count > 0;

        if (esFeriado) {
            // Crear pago extra por feriado
            const tablaExtras = `extras_${anio}`;
            await db.execute(
                `INSERT INTO ${tablaExtras} (nombre_empleado, mes, detalle, categoria, monto, descripcion) 
                 VALUES (?, ?, 1, 'HORAS EXTRAS FERIADO', ?, ?)`,
                [nombre_empleado, mes, acumulado, `${fecha} - ${horasTrabajadas} Horas trabajadas`]
            );
        }

        // Insertar registro
        const [result] = await db.execute(
            `INSERT INTO ${tabla} (fecha, nombre_empleado, hora_ingreso, hora_egreso, horas_trabajadas, acumulado, mes) 
             VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [fecha, nombre_empleado, hora_ingreso, hora_egreso, minutosTrabajados, acumulado, mes]
        );

        res.status(201).json({
            success: true,
            message: 'Registro creado exitosamente',
            id: result.insertId,
            minutosTrabajados,
            horasTrabajadas,
            acumulado,
            esFeriado
        });

    } catch (error) {
        console.error('❌ Error al registrar ingreso/egreso:', error);
        res.status(500).json({
            success: false,
            message: 'Error al registrar',
            error: error.message
        });
    }
};

// Modificar registro de control de horas
exports.modificarRegistro = async (req, res) => {
    try {
        const { anio, id } = req.params;
        const { fecha, hora_ingreso, hora_egreso, mes } = req.body;

        const tabla = `controlhs_${anio}`;

        // Obtener el registro actual
        const [registros] = await db.execute(
            `SELECT nombre_empleado FROM ${tabla} WHERE id = ?`,
            [id]
        );

        if (registros.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Registro no encontrado'
            });
        }

        const nombre_empleado = registros[0].nombre_empleado;

        // Obtener valor hora
        const [empleados] = await db.execute(
            'SELECT hora_normal FROM empleados WHERE nombre = ?',
            [nombre_empleado]
        );

        const valorHora = empleados[0].hora_normal;

        // Calcular nuevas horas
        const [horasI, minutosI] = hora_ingreso.split(':').map(Number);
        const [horasE, minutosE] = hora_egreso.split(':').map(Number);

        let minutosIngreso = horasI * 60 + minutosI;
        let minutosEgreso = horasE * 60 + minutosE;

        if (minutosEgreso < minutosIngreso) {
            minutosEgreso += 24 * 60;
        }

        const minutosTrabajados = minutosEgreso - minutosIngreso;
        const horasTrabajadas = Math.floor(minutosTrabajados / 60);
        const acumulado = Math.round((minutosTrabajados / 60) * valorHora);

        // Actualizar
        await db.execute(
            `UPDATE ${tabla} SET fecha = ?, hora_ingreso = ?, hora_egreso = ?, horas_trabajadas = ?, acumulado = ?, mes = ? WHERE id = ?`,
            [fecha, hora_ingreso, hora_egreso, minutosTrabajados, acumulado, mes, id]
        );

        res.json({
            success: true,
            message: 'Registro actualizado exitosamente',
            minutosTrabajados,
            horasTrabajadas,
            acumulado
        });

    } catch (error) {
        console.error('❌ Error al modificar registro:', error);
        res.status(500).json({
            success: false,
            message: 'Error al modificar registro',
            error: error.message
        });
    }
};

// Recalcular acumulados (útil después de cambiar tarifa por hora)
exports.recalcularAcumulados = async (req, res) => {
    try {
        const { anio } = req.params;
        const { nombre_empleado, fecha_inicio, fecha_fin } = req.body;

        const tabla = `controlhs_${anio}`;

        // Obtener valor hora actual
        const [empleados] = await db.execute(
            'SELECT hora_normal FROM empleados WHERE nombre = ?',
            [nombre_empleado]
        );

        if (empleados.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Empleado no encontrado'
            });
        }

        const valorHora = empleados[0].hora_normal;

        // Obtener registros en el rango
        const [registros] = await db.execute(
            `SELECT id, horas_trabajadas FROM ${tabla} WHERE nombre_empleado = ? AND fecha >= ? AND fecha <= ?`,
            [nombre_empleado, fecha_inicio, fecha_fin]
        );

        // Actualizar cada registro
        for (const registro of registros) {
            const nuevoAcumulado = Math.round((registro.horas_trabajadas / 60) * valorHora);
            await db.execute(
                `UPDATE ${tabla} SET acumulado = ? WHERE id = ?`,
                [nuevoAcumulado, registro.id]
            );
        }

        res.json({
            success: true,
            message: 'Acumulados recalculados exitosamente',
            registrosActualizados: registros.length
        });

    } catch (error) {
        console.error('❌ Error al recalcular acumulados:', error);
        res.status(500).json({
            success: false,
            message: 'Error al recalcular acumulados',
            error: error.message
        });
    }
};

