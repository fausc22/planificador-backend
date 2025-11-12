// controllers/logueoController.js - Gestión de logueos/fichajes
const db = require('./dbPromise');

// Obtener logueos por mes y año (con filtro opcional de empleado)
exports.obtenerLogueos = async (req, res) => {
    try {
        const { anio, mes } = req.params;
        const { nombre_empleado } = req.query;
        const tabla = `logueo_${anio}`;

        let query = `SELECT * FROM ${tabla} WHERE mes = ?`;
        let params = [mes];

        if (nombre_empleado && nombre_empleado !== '') {
            query += ` AND nombre_empleado = ?`;
            params.push(nombre_empleado);
        }

        query += ` ORDER BY fecha DESC, hora DESC`;

        const [logueos] = await db.execute(query, params);

        res.json({
            success: true,
            anio,
            mes,
            empleado: nombre_empleado || 'todos',
            count: logueos.length,
            logueos
        });

    } catch (error) {
        console.error('❌ Error al obtener logueos:', error);
        res.status(500).json({
            success: false,
            message: 'Error al obtener logueos',
            error: error.message
        });
    }
};

// Obtener logueos filtrados por empleado
exports.obtenerLogueosPorEmpleado = async (req, res) => {
    try {
        const { anio, mes, nombre_empleado } = req.params;
        const tabla = `logueo_${anio}`;

        const [logueos] = await db.execute(
            `SELECT * FROM ${tabla} WHERE mes = ? AND nombre_empleado = ? ORDER BY fecha DESC, hora DESC`,
            [mes, nombre_empleado]
        );

        res.json({
            success: true,
            anio,
            mes,
            empleado: nombre_empleado,
            count: logueos.length,
            logueos
        });

    } catch (error) {
        console.error('❌ Error al obtener logueos:', error);
        res.status(500).json({
            success: false,
            message: 'Error al obtener logueos',
            error: error.message
        });
    }
};

// Obtener logueos filtrados por fecha
exports.obtenerLogueosPorFecha = async (req, res) => {
    try {
        const { anio, mes, fecha } = req.params;
        const tabla = `logueo_${anio}`;

        const [logueos] = await db.execute(
            `SELECT * FROM ${tabla} WHERE mes = ? AND fecha = ? ORDER BY hora DESC`,
            [mes, fecha]
        );

        res.json({
            success: true,
            anio,
            mes,
            fecha,
            count: logueos.length,
            logueos
        });

    } catch (error) {
        console.error('❌ Error al obtener logueos:', error);
        res.status(500).json({
            success: false,
            message: 'Error al obtener logueos',
            error: error.message
        });
    }
};

// Crear nuevo logueo
exports.crearLogueo = async (req, res) => {
    try {
        const { anio } = req.params;
        const { nombre_empleado, fecha, accion, hora, mes } = req.body;

        if (!nombre_empleado || !fecha || !accion || !hora || !mes) {
            return res.status(400).json({
                success: false,
                message: 'Faltan datos obligatorios'
            });
        }

        // Obtener huella dactilar del empleado
        const [empleados] = await db.execute(
            'SELECT huella_dactilar FROM empleados WHERE nombre = ?',
            [nombre_empleado]
        );

        if (empleados.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Empleado no encontrado'
            });
        }

        const huella_dactilar = empleados[0].huella_dactilar;
        const tabla = `logueo_${anio}`;

        const [result] = await db.execute(
            `INSERT INTO ${tabla} (fecha, nombre_empleado, accion, hora, mes, huella_dactilar) 
             VALUES (?, ?, ?, ?, ?, ?)`,
            [fecha, nombre_empleado, accion, hora, mes, huella_dactilar]
        );

        res.status(201).json({
            success: true,
            message: 'Logueo registrado exitosamente',
            id: result.insertId
        });

    } catch (error) {
        console.error('❌ Error al crear logueo:', error);
        res.status(500).json({
            success: false,
            message: 'Error al crear logueo',
            error: error.message
        });
    }
};

// Actualizar logueo
exports.actualizarLogueo = async (req, res) => {
    try {
        const { anio, id } = req.params;
        const { fecha, accion, hora } = req.body;

        const tabla = `logueo_${anio}`;

        const [result] = await db.execute(
            `UPDATE ${tabla} SET fecha = ?, accion = ?, hora = ? WHERE id = ?`,
            [fecha, accion, hora, id]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({
                success: false,
                message: 'Logueo no encontrado'
            });
        }

        res.json({
            success: true,
            message: 'Logueo actualizado exitosamente'
        });

    } catch (error) {
        console.error('❌ Error al actualizar logueo:', error);
        res.status(500).json({
            success: false,
            message: 'Error al actualizar logueo',
            error: error.message
        });
    }
};

// Eliminar logueo
exports.eliminarLogueo = async (req, res) => {
    try {
        const { anio, id } = req.params;
        const tabla = `logueo_${anio}`;

        const [result] = await db.execute(
            `DELETE FROM ${tabla} WHERE id = ?`,
            [id]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({
                success: false,
                message: 'Logueo no encontrado'
            });
        }

        res.json({
            success: true,
            message: 'Logueo eliminado exitosamente'
        });

    } catch (error) {
        console.error('❌ Error al eliminar logueo:', error);
        res.status(500).json({
            success: false,
            message: 'Error al eliminar logueo',
            error: error.message
        });
    }
};

// Verificar último ingreso (útil para saber si corresponde registrar ingreso o egreso)
exports.verificarUltimoIngreso = async (req, res) => {
    try {
        const { anio, nombre_empleado, mes } = req.params;
        const tabla = `logueo_${anio}`;

        const [logueos] = await db.execute(
            `SELECT accion FROM ${tabla} WHERE nombre_empleado = ? AND mes = ? ORDER BY id DESC LIMIT 1`,
            [nombre_empleado, mes]
        );

        if (logueos.length === 0) {
            return res.json({
                success: true,
                ultimaAccion: null,
                debeRegistrar: 'INGRESO'
            });
        }

        const ultimaAccion = logueos[0].accion;
        const debeRegistrar = ultimaAccion === 'INGRESO' ? 'EGRESO' : 'INGRESO';

        res.json({
            success: true,
            ultimaAccion,
            debeRegistrar
        });

    } catch (error) {
        console.error('❌ Error al verificar último ingreso:', error);
        res.status(500).json({
            success: false,
            message: 'Error al verificar último ingreso',
            error: error.message
        });
    }
};

