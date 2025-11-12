// controllers/recibosController.js - Gestión de recibos de sueldo
const db = require('./dbPromise');
const { obtenerNumeroMes } = require('../utils/dateUtils');

// Obtener recibo de un empleado en un mes/año específico
exports.obtenerRecibo = async (req, res) => {
    try {
        const { nombre_empleado, mes, anio } = req.params;

        const [recibos] = await db.execute(
            'SELECT * FROM recibos WHERE empleado = ? AND mes = ? AND anio = ?',
            [nombre_empleado, mes, anio]
        );

        if (recibos.length === 0) {
            return res.json({
                success: true,
                existe: false,
                message: 'No existe recibo guardado, se generarán datos en tiempo real'
            });
        }

        res.json({
            success: true,
            existe: true,
            recibo: recibos[0]
        });

    } catch (error) {
        console.error('❌ Error al obtener recibo:', error);
        res.status(500).json({
            success: false,
            message: 'Error al obtener recibo',
            error: error.message
        });
    }
};

// Generar/Cargar datos de recibo (calcula automáticamente si no existe)
exports.cargarDatosRecibo = async (req, res) => {
    try {
        const { nombre_empleado, mes, anio } = req.params;
        const nroMes = typeof mes === 'string' ? obtenerNumeroMes(mes) : parseInt(mes);

        // Verificar si ya existe recibo guardado
        const [recibosExistentes] = await db.execute(
            'SELECT * FROM recibos WHERE empleado = ? AND mes = ? AND anio = ?',
            [nombre_empleado, mes, anio]
        );

        if (recibosExistentes.length > 0) {
            // Recibo ya existe, retornar datos guardados
            const recibo = recibosExistentes[0];

            // También obtener extras
            const tablaExtras = `extras_${anio}`;
            const [extras] = await db.execute(
                `SELECT * FROM ${tablaExtras} WHERE nombre_empleado = ? AND mes = ?`,
                [nombre_empleado, mes]
            );

            let sumaExtras = 0;
            let restaExtras = 0;

            extras.forEach(extra => {
                if (extra.detalle === 1) {
                    sumaExtras += extra.monto;
                } else if (extra.detalle === 0) {
                    restaExtras += extra.monto;
                }
            });

            return res.json({
                success: true,
                existe: true,
                recibo,
                extras: {
                    items: extras,
                    suma: sumaExtras,
                    resta: restaExtras
                }
            });
        }

        // No existe recibo guardado, generar datos en tiempo real
        const tablaPlanificar = `totales_${anio}`;
        const tablaControlHs = `controlhs_${anio}`;
        const tablaExtras = `extras_${anio}`;

        // Obtener datos del planificador
        const [planificado] = await db.execute(
            `SELECT horas, acumulado FROM ${tablaPlanificar} WHERE nombre_empleado = ? AND mes = ?`,
            [nombre_empleado, nroMes]
        );

        const hsPlaniCantidad = planificado.length > 0 ? planificado[0].horas : 0;
        const hsPlaniValor = planificado.length > 0 ? planificado[0].acumulado : 0;

        // Obtener horas trabajadas (control de horas)
        const [controlHs] = await db.execute(
            `SELECT SUM(horas_trabajadas) as totalMinutos, SUM(acumulado) as totalAcumulado FROM ${tablaControlHs} WHERE nombre_empleado = ? AND mes = ?`,
            [nombre_empleado, mes]
        );

        const totalMinutos = controlHs.length > 0 && controlHs[0].totalMinutos ? controlHs[0].totalMinutos : 0;
        const hsTrabajadasCantidad = Math.round(totalMinutos / 60);
        const hsTrabajadasValor = controlHs.length > 0 && controlHs[0].totalAcumulado ? controlHs[0].totalAcumulado : 0;

        // Obtener extras
        const [extras] = await db.execute(
            `SELECT * FROM ${tablaExtras} WHERE nombre_empleado = ? AND mes = ?`,
            [nombre_empleado, mes]
        );

        let sumaExtras = 0;
        let restaExtras = 0;

        extras.forEach(extra => {
            if (extra.detalle === 1) {
                sumaExtras += extra.monto;
            } else if (extra.detalle === 0) {
                restaExtras += extra.monto;
            }
        });

        res.json({
            success: true,
            existe: false,
            recibo: {
                empleado: nombre_empleado,
                mes,
                anio,
                hsPlaniValor,
                hsPlaniCantidad,
                hsTrabajadasValor,
                hsTrabajadasCantidad,
                consumos: 0 // Por defecto, se puede modificar
            },
            extras: {
                items: extras,
                suma: sumaExtras,
                resta: restaExtras
            }
        });

    } catch (error) {
        console.error('❌ Error al cargar datos de recibo:', error);
        res.status(500).json({
            success: false,
            message: 'Error al cargar datos de recibo',
            error: error.message
        });
    }
};

// Guardar o actualizar recibo
exports.guardarRecibo = async (req, res) => {
    try {
        const {
            empleado,
            mes,
            anio,
            hsPlaniValor,
            hsPlaniCantidad,
            hsTrabajadasValor,
            hsTrabajadasCantidad,
            consumos
        } = req.body;

        if (!empleado || !mes || !anio) {
            return res.status(400).json({
                success: false,
                message: 'Empleado, mes y año son obligatorios'
            });
        }

        // Verificar si ya existe
        const [existentes] = await db.execute(
            'SELECT * FROM recibos WHERE empleado = ? AND mes = ? AND anio = ?',
            [empleado, mes, anio]
        );

        if (existentes.length > 0) {
            // Actualizar
            await db.execute(
                `UPDATE recibos SET hsPlaniValor = ?, hsPlaniCantidad = ?, hsTrabajadasValor = ?, hsTrabajadasCantidad = ?, consumos = ? 
                 WHERE empleado = ? AND mes = ? AND anio = ?`,
                [hsPlaniValor || 0, hsPlaniCantidad || 0, hsTrabajadasValor || 0, hsTrabajadasCantidad || 0, consumos || 0, empleado, mes, anio]
            );

            return res.json({
                success: true,
                message: 'Recibo actualizado exitosamente'
            });
        }

        // Insertar nuevo
        await db.execute(
            `INSERT INTO recibos (empleado, mes, anio, hsPlaniValor, hsPlaniCantidad, hsTrabajadasValor, hsTrabajadasCantidad, consumos) 
             VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
            [empleado, mes, anio, hsPlaniValor || 0, hsPlaniCantidad || 0, hsTrabajadasValor || 0, hsTrabajadasCantidad || 0, consumos || 0]
        );

        res.status(201).json({
            success: true,
            message: 'Recibo guardado exitosamente'
        });

    } catch (error) {
        console.error('❌ Error al guardar recibo:', error);
        res.status(500).json({
            success: false,
            message: 'Error al guardar recibo',
            error: error.message
        });
    }
};

// Eliminar recibo
exports.eliminarRecibo = async (req, res) => {
    try {
        const { nombre_empleado, mes, anio } = req.params;

        const [result] = await db.execute(
            'DELETE FROM recibos WHERE empleado = ? AND mes = ? AND anio = ?',
            [nombre_empleado, mes, anio]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({
                success: false,
                message: 'No existe recibo para eliminar'
            });
        }

        res.json({
            success: true,
            message: 'Recibo eliminado exitosamente'
        });

    } catch (error) {
        console.error('❌ Error al eliminar recibo:', error);
        res.status(500).json({
            success: false,
            message: 'Error al eliminar recibo',
            error: error.message
        });
    }
};

// Obtener todos los recibos de un mes/año (para ver todos los empleados)
exports.obtenerRecibosPorMes = async (req, res) => {
    try {
        const { mes, anio } = req.params;

        const [recibos] = await db.execute(
            'SELECT * FROM recibos WHERE mes = ? AND anio = ? ORDER BY empleado',
            [mes, anio]
        );

        res.json({
            success: true,
            mes,
            anio,
            count: recibos.length,
            recibos
        });

    } catch (error) {
        console.error('❌ Error al obtener recibos:', error);
        res.status(500).json({
            success: false,
            message: 'Error al obtener recibos',
            error: error.message
        });
    }
};

