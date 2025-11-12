// controllers/extrasController.js - Gestión de pagos extras
const db = require('./dbPromise');

// Obtener pagos extras por empleado, mes y año
exports.obtenerExtras = async (req, res) => {
    try {
        const { anio, mes, nombre_empleado } = req.params;
        const tabla = `extras_${anio}`;

        const [extras] = await db.execute(
            `SELECT * FROM ${tabla} WHERE nombre_empleado = ? AND mes = ? ORDER BY id DESC`,
            [nombre_empleado, mes]
        );

        // Calcular totales
        let totalSuma = 0;
        let totalResta = 0;

        extras.forEach(extra => {
            if (extra.detalle === 1) {
                totalSuma += extra.monto;
            } else if (extra.detalle === 0) {
                totalResta += extra.monto;
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
                suma: totalSuma,
                resta: totalResta,
                neto: totalSuma - totalResta
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

// Obtener todos los extras de un mes (para todos los empleados)
exports.obtenerExtrasPorMes = async (req, res) => {
    try {
        const { anio, mes } = req.params;
        const tabla = `extras_${anio}`;

        const [extras] = await db.execute(
            `SELECT * FROM ${tabla} WHERE mes = ? ORDER BY nombre_empleado, id`,
            [mes]
        );

        res.json({
            success: true,
            anio,
            mes,
            count: extras.length,
            extras
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

        // detalle: 1 = suma (premio, vacaciones, etc), 0 = resta (adelanto, consumos, etc)
        if (detalle !== 0 && detalle !== 1) {
            return res.status(400).json({
                success: false,
                message: 'Detalle debe ser 0 (resta) o 1 (suma)'
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

// Obtener descripción de adelantos/restas para un empleado
exports.obtenerDescripcionRestas = async (req, res) => {
    try {
        const { anio, mes, nombre_empleado } = req.params;
        const tabla = `extras_${anio}`;

        const [extras] = await db.execute(
            `SELECT * FROM ${tabla} WHERE nombre_empleado = ? AND mes = ? AND detalle = 0`,
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

