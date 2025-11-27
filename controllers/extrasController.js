// controllers/extrasController.js - Gestión de pagos extras
const db = require('./dbPromise');
const AppError = require('../utils/AppError');

// Función auxiliar para verificar si una tabla existe
const verificarTablaExiste = async (tabla) => {
    try {
        const [result] = await db.execute(
            `SELECT COUNT(*) as count FROM information_schema.tables 
             WHERE table_schema = DATABASE() AND table_name = ?`,
            [tabla]
        );
        return result[0].count > 0;
    } catch (error) {
        return false;
    }
};

// Función auxiliar para verificar si un empleado existe
const verificarEmpleadoExiste = async (nombreCompleto) => {
    try {
        if (!nombreCompleto || nombreCompleto.trim() === '') {
            return false;
        }
        
        // Usar CONCAT para comparar con el nombre completo (más robusto)
        const [empleados] = await db.execute(
            `SELECT id FROM empleados WHERE CONCAT(nombre, ' ', apellido) = ?`,
            [nombreCompleto.trim()]
        );
        return empleados.length > 0;
    } catch (error) {
        console.error('Error verificando empleado:', error);
        return false;
    }
};

// Obtener todos los pagos extras de un mes/año (con filtro opcional de empleado)
exports.obtenerTodosExtras = async (req, res) => {
    try {
        const { anio, mes } = req.params;
        const { nombre_empleado } = req.query;
        const tabla = `extras_${anio}`;

        // Verificar si la tabla existe
        const tablaExiste = await verificarTablaExiste(tabla);
        if (!tablaExiste) {
            return res.json({
                success: true,
                anio,
                mes,
                empleado: nombre_empleado || 'todos',
                count: 0,
                extras: [],
                totales: {
                    bonificaciones: 0,
                    deducciones: 0,
                    neto: 0
                },
                mensaje: `No existe tabla de extras para el año ${anio}`
            });
        }

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
                totalBonificaciones += parseFloat(extra.monto) || 0;
            } else if (extra.detalle === 2) {
                totalDeducciones += parseFloat(extra.monto) || 0;
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
        
        // Manejar error específico de tabla no encontrada
        if (error.code === 'ER_NO_SUCH_TABLE' || error.message.includes("doesn't exist")) {
            return res.json({
                success: true,
                anio: req.params.anio,
                mes: req.params.mes,
                empleado: req.query.nombre_empleado || 'todos',
                count: 0,
                extras: [],
                totales: {
                    bonificaciones: 0,
                    deducciones: 0,
                    neto: 0
                }
            });
        }

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

        // Verificar si la tabla existe
        const tablaExiste = await verificarTablaExiste(tabla);
        if (!tablaExiste) {
            return res.json({
                success: true,
                anio,
                mes,
                empleado: nombre_empleado,
                count: 0,
                extras: [],
                totales: {
                    bonificaciones: 0,
                    deducciones: 0,
                    neto: 0
                }
            });
        }

        const [extras] = await db.execute(
            `SELECT * FROM ${tabla} WHERE nombre_empleado = ? AND mes = ? ORDER BY id DESC`,
            [nombre_empleado, mes]
        );

        // Calcular totales (detalle: 1 = bonificación, 2 = deducción)
        let totalBonificaciones = 0;
        let totalDeducciones = 0;

        extras.forEach(extra => {
            if (extra.detalle === 1) {
                totalBonificaciones += parseFloat(extra.monto) || 0;
            } else if (extra.detalle === 2) {
                totalDeducciones += parseFloat(extra.monto) || 0;
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
        
        // Manejar error específico de tabla no encontrada
        if (error.code === 'ER_NO_SUCH_TABLE' || error.message.includes("doesn't exist")) {
            return res.json({
                success: true,
                anio: req.params.anio,
                mes: req.params.mes,
                empleado: req.params.nombre_empleado,
                count: 0,
                extras: [],
                totales: {
                    bonificaciones: 0,
                    deducciones: 0,
                    neto: 0
                }
            });
        }

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

        // Validaciones básicas
        if (!nombre_empleado || !mes || detalle === undefined || !categoria || monto === undefined || monto === null || !descripcion) {
            return res.status(400).json({
                success: false,
                message: 'Faltan datos obligatorios'
            });
        }

        // Validar monto positivo
        const montoNum = parseFloat(monto);
        if (isNaN(montoNum) || montoNum <= 0) {
            return res.status(400).json({
                success: false,
                message: 'El monto debe ser un número positivo'
            });
        }

        // detalle: 1 = bonificación, 2 = deducción
        if (detalle !== 1 && detalle !== 2) {
            return res.status(400).json({
                success: false,
                message: 'Detalle debe ser 1 (bonificación) o 2 (deducción)'
            });
        }

        // Verificar que el empleado existe
        const empleadoExiste = await verificarEmpleadoExiste(nombre_empleado);
        if (!empleadoExiste) {
            return res.status(400).json({
                success: false,
                message: 'El empleado especificado no existe en el sistema'
            });
        }

        const tabla = `extras_${anio}`;

        // Verificar si la tabla existe, si no, crearla
        const tablaExiste = await verificarTablaExiste(tabla);
        if (!tablaExiste) {
            // Crear la tabla si no existe
            await db.execute(`
                CREATE TABLE IF NOT EXISTS ${tabla} (
                    id INT NOT NULL AUTO_INCREMENT,
                    nombre_empleado VARCHAR(50) NOT NULL,
                    mes VARCHAR(50) NOT NULL,
                    categoria VARCHAR(50) NOT NULL,
                    monto DECIMAL(10,2) NOT NULL,
                    descripcion VARCHAR(200) NOT NULL,
                    detalle INT NOT NULL,
                    PRIMARY KEY (id),
                    KEY idx_empleado_mes (nombre_empleado, mes)
                ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_spanish_ci
            `);
        }

        const [result] = await db.execute(
            `INSERT INTO ${tabla} (nombre_empleado, mes, detalle, categoria, monto, descripcion) 
             VALUES (?, ?, ?, ?, ?, ?)`,
            [nombre_empleado, mes, detalle, categoria, montoNum, descripcion]
        );

        res.status(201).json({
            success: true,
            message: 'Pago extra registrado exitosamente',
            id: result.insertId
        });

    } catch (error) {
        console.error('❌ Error al crear extra:', error);
        
        // Manejar error de tabla no encontrada
        if (error.code === 'ER_NO_SUCH_TABLE' || error.message.includes("doesn't exist")) {
            return res.status(500).json({
                success: false,
                message: `No se pudo crear la tabla de extras para el año ${req.params.anio}. Contacte al administrador.`,
                error: error.message
            });
        }

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

        // Validar que al menos un campo sea enviado
        if (!categoria && monto === undefined && !descripcion && detalle === undefined) {
            return res.status(400).json({
                success: false,
                message: 'Debe enviar al menos un campo para actualizar'
            });
        }

        // Validar monto si se envía
        if (monto !== undefined) {
            const montoNum = parseFloat(monto);
            if (isNaN(montoNum) || montoNum <= 0) {
                return res.status(400).json({
                    success: false,
                    message: 'El monto debe ser un número positivo'
                });
            }
        }

        // Validar detalle si se envía
        if (detalle !== undefined && detalle !== 1 && detalle !== 2) {
            return res.status(400).json({
                success: false,
                message: 'Detalle debe ser 1 (bonificación) o 2 (deducción)'
            });
        }

        const tabla = `extras_${anio}`;

        // Construir query dinámicamente
        const campos = [];
        const valores = [];

        if (categoria) {
            campos.push('categoria = ?');
            valores.push(categoria);
        }
        if (monto !== undefined) {
            campos.push('monto = ?');
            valores.push(parseFloat(monto));
        }
        if (descripcion) {
            campos.push('descripcion = ?');
            valores.push(descripcion);
        }
        if (detalle !== undefined) {
            campos.push('detalle = ?');
            valores.push(detalle);
        }

        valores.push(id);

        const query = `UPDATE ${tabla} SET ${campos.join(', ')} WHERE id = ?`;
        const [result] = await db.execute(query, valores);

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
        
        // Manejar error de tabla no encontrada
        if (error.code === 'ER_NO_SUCH_TABLE' || error.message.includes("doesn't exist")) {
            return res.status(404).json({
                success: false,
                message: `No existe tabla de extras para el año ${req.params.anio}`,
                error: error.message
            });
        }

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

        // Verificar si la tabla existe
        const tablaExiste = await verificarTablaExiste(tabla);
        if (!tablaExiste) {
            return res.status(404).json({
                success: false,
                message: `No existe tabla de extras para el año ${anio}`
            });
        }

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
        
        // Manejar error de tabla no encontrada
        if (error.code === 'ER_NO_SUCH_TABLE' || error.message.includes("doesn't exist")) {
            return res.status(404).json({
                success: false,
                message: `No existe tabla de extras para el año ${req.params.anio}`,
                error: error.message
            });
        }

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

