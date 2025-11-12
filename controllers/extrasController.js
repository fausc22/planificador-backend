// controllers/extrasController.js - Gestión de pagos extras
const db = require('./dbPromise');

// Obtener todos los pagos extras de un mes/año (con filtro opcional de empleado)
exports.obtenerTodosExtras = async (req, res) => {
    try {
        const { anio, mes } = req.params;
        const { nombre_empleado } = req.query;
        const tabla = `extras_${anio}`;

        let query = `SELECT * FROM ${tabla} WHERE mes = ?`;
        let params = [mes];

        if (nombre_empleado && nombre_empleado !== '') {
            query += ` AND nombre_empleado = ?`;
            params.push(nombre_empleado);
        }

        query += ` ORDER BY id DESC`;

        const [extras] = await db.execute(query, params);

        // Calcular totales (detalle: 1 = bonificación, 2 = deducción)
        let totalBonificaciones = 0;
        let totalDeducciones = 0;

        extras.forEach(extra => {
            if (extra.detalle === 1) {
                totalBonificaciones += extra.monto;
            } else if (extra.detalle === 2) {
                totalDeducciones += extra.monto;
            }
        });

        res.json({
            success: true,
            anio,
            mes,
            empleado: nombre_empleado || 'todos',
            count: extras.length,
            extras,
            totales: {
                bonificaciones: totalBonificaciones,
                deducciones: totalDeducciones,
                neto: totalBonificaciones - totalDeducciones
            }
        });

    } catch (error) {
        console.error('❌ Error al obtener extras:', error);
        res.status(500).json({
            success: false,
            message: 'Error al obtener pagos extras',
            error: error.message
        });
    }
};

// Obtener pagos extras por empleado, mes y año
exports.obtenerExtras = async (req, res) => {
    try {
        const { anio, mes, nombre_empleado } = req.params;
        const tabla = `extras_${anio}`;

        const [extras] = await db.execute(
            `SELECT * FROM ${tabla} WHERE nombre_empleado = ? AND mes = ? ORDER BY id DESC`,
            [nombre_empleado, mes]
        );

        // Calcular totales (detalle: 1 = bonificación, 2 = deducción)
        let totalBonificaciones = 0;
        let totalDeducciones = 0;

        extras.forEach(extra => {
            if (extra.detalle === 1) {
                totalBonificaciones += extra.monto;
            } else if (extra.detalle === 2) {
                totalDeducciones += extra.monto;
            }
        });

        res.json({
            success: true,
            anio,
            mes,
            empleado: nombre_empleado,
            count: extras.length,
            extras,
            totales: {
                bonificaciones: totalBonificaciones,
                deducciones: totalDeducciones,
                neto: totalBonificaciones - totalDeducciones
            }
        });

    } catch (error) {
        console.error('❌ Error al obtener extras:', error);
        res.status(500).json({
            success: false,
            message: 'Error al obtener pagos extras',
            error: error.message
        });
    }
};


// Crear pago extra
exports.crearExtra = async (req, res) => {
    try {
        const { anio } = req.params;
        const { nombre_empleado, mes, detalle, categoria, monto, descripcion } = req.body;

        if (!nombre_empleado || !mes || detalle === undefined || !categoria || !monto || !descripcion) {
            return res.status(400).json({
                success: false,
                message: 'Faltan datos obligatorios'
            });
        }

        // detalle: 1 = bonificación, 2 = deducción
        if (detalle !== 1 && detalle !== 2) {
            return res.status(400).json({
                success: false,
                message: 'Detalle debe ser 1 (bonificación) o 2 (deducción)'
            });
        }

        const tabla = `extras_${anio}`;

        const [result] = await db.execute(
            `INSERT INTO ${tabla} (nombre_empleado, mes, detalle, categoria, monto, descripcion) 
             VALUES (?, ?, ?, ?, ?, ?)`,
            [nombre_empleado, mes, detalle, categoria, monto, descripcion]
        );

        res.status(201).json({
            success: true,
            message: 'Pago extra registrado exitosamente',
            id: result.insertId
        });

    } catch (error) {
        console.error('❌ Error al crear extra:', error);
        res.status(500).json({
            success: false,
            message: 'Error al crear pago extra',
            error: error.message
        });
    }
};

// Modificar pago extra
exports.modificarExtra = async (req, res) => {
    try {
        const { anio, id } = req.params;
        const { categoria, monto, descripcion, detalle } = req.body;

        const tabla = `extras_${anio}`;

        const [result] = await db.execute(
            `UPDATE ${tabla} SET categoria = ?, monto = ?, descripcion = ?, detalle = ? WHERE id = ?`,
            [categoria, monto, descripcion, detalle, id]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({
                success: false,
                message: 'Pago extra no encontrado'
            });
        }

        res.json({
            success: true,
            message: 'Pago extra modificado exitosamente'
        });

    } catch (error) {
        console.error('❌ Error al modificar extra:', error);
        res.status(500).json({
            success: false,
            message: 'Error al modificar pago extra',
            error: error.message
        });
    }
};

// Eliminar pago extra
exports.eliminarExtra = async (req, res) => {
    try {
        const { anio, id } = req.params;
        const tabla = `extras_${anio}`;

        const [result] = await db.execute(
            `DELETE FROM ${tabla} WHERE id = ?`,
            [id]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({
                success: false,
                message: 'Pago extra no encontrado'
            });
        }

        res.json({
            success: true,
            message: 'Pago extra eliminado exitosamente'
        });

    } catch (error) {
        console.error('❌ Error al eliminar extra:', error);
        res.status(500).json({
            success: false,
            message: 'Error al eliminar pago extra',
            error: error.message
        });
    }
};

// Obtener descripción de premios/sumas para un empleado
exports.obtenerDescripcionSumas = async (req, res) => {
    try {
        const { anio, mes, nombre_empleado } = req.params;
        const tabla = `extras_${anio}`;

        const [extras] = await db.execute(
            `SELECT * FROM ${tabla} WHERE nombre_empleado = ? AND mes = ? AND detalle = 1`,
            [nombre_empleado, mes]
        );

        let descripcion = '';
        extras.forEach(extra => {
            descripcion += `CATEGORIA: ${extra.categoria} - MONTO: $ ${extra.monto} - DESCRIPCION: ${extra.descripcion}\n`;
        });

        res.json({
            success: true,
            empleado: nombre_empleado,
            mes,
            anio,
            descripcion,
            items: extras
        });

    } catch (error) {
        console.error('❌ Error al obtener descripción:', error);
        res.status(500).json({
            success: false,
            message: 'Error al obtener descripción',
            error: error.message
        });
    }
};

// Obtener descripción de deducciones para un empleado
exports.obtenerDescripcionRestas = async (req, res) => {
    try {
        const { anio, mes, nombre_empleado } = req.params;
        const tabla = `extras_${anio}`;

        const [extras] = await db.execute(
            `SELECT * FROM ${tabla} WHERE nombre_empleado = ? AND mes = ? AND detalle = 2`,
            [nombre_empleado, mes]
        );

        let descripcion = '';
        extras.forEach(extra => {
            descripcion += `CATEGORIA: ${extra.categoria} - MONTO: $ ${extra.monto} - DESCRIPCION: ${extra.descripcion}\n`;
        });

        res.json({
            success: true,
            empleado: nombre_empleado,
            mes,
            anio,
            descripcion,
            items: extras
        });

    } catch (error) {
        console.error('❌ Error al obtener descripción:', error);
        res.status(500).json({
            success: false,
            message: 'Error al obtener descripción',
            error: error.message
        });
    }
};

