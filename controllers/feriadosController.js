// controllers/feriadosController.js - Gestión de feriados
const db = require('./dbPromise');
const { validarFormatoFecha } = require('../utils/dateUtils');

// Obtener todos los feriados
exports.obtenerFeriados = async (req, res) => {
    try {
        const [feriados] = await db.execute(
            'SELECT * FROM feriados ORDER BY fecha ASC'
        );

        res.json({
            success: true,
            count: feriados.length,
            feriados
        });
    } catch (error) {
        console.error('❌ Error al obtener feriados:', error);
        res.status(500).json({
            success: false,
            message: 'Error al obtener feriados',
            error: error.message
        });
    }
};

// Obtener feriados por año/periodo
exports.obtenerFeriadosPorPeriodo = async (req, res) => {
    try {
        const { periodo } = req.params;

        const [feriados] = await db.execute(
            'SELECT * FROM feriados WHERE periodo = ? ORDER BY fecha ASC',
            [periodo]
        );

        res.json({
            success: true,
            count: feriados.length,
            periodo,
            feriados
        });
    } catch (error) {
        console.error('❌ Error al obtener feriados por periodo:', error);
        res.status(500).json({
            success: false,
            message: 'Error al obtener feriados',
            error: error.message
        });
    }
};

// Verificar si una fecha es feriado
exports.esFeriado = async (req, res) => {
    try {
        const { fecha } = req.params;

        // Validar formato de fecha
        if (!validarFormatoFecha(fecha)) {
            return res.status(400).json({
                success: false,
                message: 'Formato de fecha inválido. Use DD/MM/YYYY'
            });
        }

        const [feriados] = await db.execute(
            'SELECT COUNT(*) as count FROM feriados WHERE fecha = ?',
            [fecha]
        );

        const esFeriado = feriados[0].count > 0;

        res.json({
            success: true,
            fecha,
            esFeriado
        });
    } catch (error) {
        console.error('❌ Error al verificar feriado:', error);
        res.status(500).json({
            success: false,
            message: 'Error al verificar feriado',
            error: error.message
        });
    }
};

// Obtener información de un feriado específico
exports.obtenerFeriadoPorFecha = async (req, res) => {
    try {
        const { fecha } = req.params;

        const [feriados] = await db.execute(
            'SELECT * FROM feriados WHERE fecha = ?',
            [fecha]
        );

        if (feriados.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'No es feriado',
                esFeriado: false
            });
        }

        res.json({
            success: true,
            esFeriado: true,
            feriado: feriados[0]
        });
    } catch (error) {
        console.error('❌ Error al obtener feriado:', error);
        res.status(500).json({
            success: false,
            message: 'Error al obtener feriado',
            error: error.message
        });
    }
};

// Crear nuevo feriado
exports.crearFeriado = async (req, res) => {
    try {
        const { fecha, festejo, dia, periodo } = req.body;

        // Validaciones
        if (!fecha || !festejo || !dia) {
            return res.status(400).json({
                success: false,
                message: 'Faltan campos obligatorios'
            });
        }

        if (!validarFormatoFecha(fecha)) {
            return res.status(400).json({
                success: false,
                message: 'Formato de fecha inválido. Use DD/MM/YYYY'
            });
        }

        // Verificar si ya existe
        const [existente] = await db.execute(
            'SELECT id FROM feriados WHERE fecha = ?',
            [fecha]
        );

        if (existente.length > 0) {
            return res.status(400).json({
                success: false,
                message: 'Ya existe un feriado registrado para esta fecha'
            });
        }

        // Extraer año de la fecha (DD/MM/YYYY -> YYYY)
        const anio = fecha.split('/')[2];

        const [result] = await db.execute(
            'INSERT INTO feriados (fecha, festejo, dia, periodo) VALUES (?, ?, ?, ?)',
            [fecha, festejo, dia, periodo || anio]
        );

        res.status(201).json({
            success: true,
            message: 'Feriado creado exitosamente',
            feriadoId: result.insertId
        });
    } catch (error) {
        console.error('❌ Error al crear feriado:', error);
        res.status(500).json({
            success: false,
            message: 'Error al crear feriado',
            error: error.message
        });
    }
};

// Actualizar feriado
exports.actualizarFeriado = async (req, res) => {
    try {
        const { id } = req.params;
        const { fecha, festejo, dia, periodo } = req.body;

        // Verificar que el feriado existe
        const [feriados] = await db.execute(
            'SELECT id FROM feriados WHERE id = ?',
            [id]
        );

        if (feriados.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Feriado no encontrado'
            });
        }

        if (fecha && !validarFormatoFecha(fecha)) {
            return res.status(400).json({
                success: false,
                message: 'Formato de fecha inválido. Use DD/MM/YYYY'
            });
        }

        // Extraer año de la fecha si se proporciona
        const periodoFinal = periodo || (fecha ? fecha.split('/')[2] : null);

        await db.execute(
            'UPDATE feriados SET fecha = ?, festejo = ?, dia = ?, periodo = ? WHERE id = ?',
            [fecha, festejo, dia, periodoFinal, id]
        );

        res.json({
            success: true,
            message: 'Feriado actualizado exitosamente'
        });
    } catch (error) {
        console.error('❌ Error al actualizar feriado:', error);
        res.status(500).json({
            success: false,
            message: 'Error al actualizar feriado',
            error: error.message
        });
    }
};

// Eliminar feriado
exports.eliminarFeriado = async (req, res) => {
    try {
        const { id } = req.params;

        const [result] = await db.execute(
            'DELETE FROM feriados WHERE id = ?',
            [id]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({
                success: false,
                message: 'Feriado no encontrado'
            });
        }

        res.json({
            success: true,
            message: 'Feriado eliminado exitosamente'
        });
    } catch (error) {
        console.error('❌ Error al eliminar feriado:', error);
        res.status(500).json({
            success: false,
            message: 'Error al eliminar feriado',
            error: error.message
        });
    }
};

// Importar múltiples feriados
exports.importarFeriados = async (req, res) => {
    try {
        const { feriados } = req.body;

        if (!Array.isArray(feriados) || feriados.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'Se requiere un array de feriados'
            });
        }

        let importados = 0;
        let errores = 0;
        const resultados = [];

        for (const feriado of feriados) {
            try {
                const { fecha, festejo, dia, periodo } = feriado;

                if (!fecha || !festejo || !dia) {
                    errores++;
                    resultados.push({ fecha, status: 'error', message: 'Datos incompletos' });
                    continue;
                }

                // Verificar si ya existe
                const [existente] = await db.execute(
                    'SELECT id FROM feriados WHERE fecha = ?',
                    [fecha]
                );

                if (existente.length > 0) {
                    errores++;
                    resultados.push({ fecha, status: 'error', message: 'Ya existe' });
                    continue;
                }

                await db.execute(
                    'INSERT INTO feriados (fecha, festejo, dia, periodo) VALUES (?, ?, ?, ?)',
                    [fecha, festejo, dia, periodo || null]
                );

                importados++;
                resultados.push({ fecha, status: 'success', message: 'Importado' });
            } catch (error) {
                errores++;
                resultados.push({ fecha: feriado.fecha, status: 'error', message: error.message });
            }
        }

        res.json({
            success: true,
            message: `Importación completada: ${importados} exitosos, ${errores} errores`,
            importados,
            errores,
            resultados
        });
    } catch (error) {
        console.error('❌ Error al importar feriados:', error);
        res.status(500).json({
            success: false,
            message: 'Error al importar feriados',
            error: error.message
        });
    }
};

