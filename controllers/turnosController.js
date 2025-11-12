// controllers/turnosController.js - Gestión de turnos y horarios
const db = require('./dbPromise');

// Obtener todos los turnos/horarios ordenados por hora de inicio
exports.obtenerTurnos = async (req, res) => {
    try {
        const [turnos] = await db.execute(
            'SELECT * FROM horarios ORDER BY horaInicio ASC'
        );

        res.json({
            success: true,
            count: turnos.length,
            turnos
        });
    } catch (error) {
        console.error('❌ Error al obtener turnos:', error);
        res.status(500).json({
            success: false,
            message: 'Error al obtener turnos',
            error: error.message
        });
    }
};

// Obtener un turno por ID
exports.obtenerTurnoPorId = async (req, res) => {
    try {
        const { id } = req.params;

        const [turnos] = await db.execute(
            'SELECT * FROM horarios WHERE id = ?',
            [id]
        );

        if (turnos.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Turno no encontrado'
            });
        }

        res.json({
            success: true,
            turno: turnos[0]
        });
    } catch (error) {
        console.error('❌ Error al obtener turno:', error);
        res.status(500).json({
            success: false,
            message: 'Error al obtener turno',
            error: error.message
        });
    }
};

// Obtener horas de un turno específico por nombre
exports.obtenerHorasTurno = async (req, res) => {
    try {
        const { turno } = req.params;

        const [turnos] = await db.execute(
            'SELECT horas FROM horarios WHERE turnos = ?',
            [turno]
        );

        if (turnos.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Turno no encontrado',
                horas: 0
            });
        }

        res.json({
            success: true,
            turno: turno,
            horas: turnos[0].horas
        });
    } catch (error) {
        console.error('❌ Error al obtener horas del turno:', error);
        res.status(500).json({
            success: false,
            message: 'Error al obtener horas del turno',
            error: error.message
        });
    }
};

// Crear nuevo turno
exports.crearTurno = async (req, res) => {
    try {
        const { turnos, horaInicio, horaFin, horas } = req.body;

        // Validaciones
        if (!turnos || horaInicio === undefined || horaFin === undefined || !horas) {
            return res.status(400).json({
                success: false,
                message: 'Faltan campos obligatorios'
            });
        }

        const [result] = await db.execute(
            'INSERT INTO horarios (turnos, horaInicio, horaFin, horas) VALUES (?, ?, ?, ?)',
            [turnos, horaInicio, horaFin, horas]
        );

        res.status(201).json({
            success: true,
            message: 'Turno creado exitosamente',
            turnoId: result.insertId
        });
    } catch (error) {
        console.error('❌ Error al crear turno:', error);
        res.status(500).json({
            success: false,
            message: 'Error al crear turno',
            error: error.message
        });
    }
};

// Actualizar turno
exports.actualizarTurno = async (req, res) => {
    try {
        const { id } = req.params;
        const { turnos, horaInicio, horaFin, horas } = req.body;

        // Verificar que el turno existe
        const [turnosExistentes] = await db.execute(
            'SELECT id FROM horarios WHERE id = ?',
            [id]
        );

        if (turnosExistentes.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Turno no encontrado'
            });
        }

        await db.execute(
            'UPDATE horarios SET turnos = ?, horaInicio = ?, horaFin = ?, horas = ? WHERE id = ?',
            [turnos, horaInicio, horaFin, horas, id]
        );

        res.json({
            success: true,
            message: 'Turno actualizado exitosamente'
        });
    } catch (error) {
        console.error('❌ Error al actualizar turno:', error);
        res.status(500).json({
            success: false,
            message: 'Error al actualizar turno',
            error: error.message
        });
    }
};

// Eliminar turno
exports.eliminarTurno = async (req, res) => {
    try {
        const { id } = req.params;

        const [result] = await db.execute(
            'DELETE FROM horarios WHERE id = ?',
            [id]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({
                success: false,
                message: 'Turno no encontrado'
            });
        }

        res.json({
            success: true,
            message: 'Turno eliminado exitosamente'
        });
    } catch (error) {
        console.error('❌ Error al eliminar turno:', error);
        res.status(500).json({
            success: false,
            message: 'Error al eliminar turno',
            error: error.message
        });
    }
};

// Calcular horas entre hora inicio y hora fin
exports.calcularHoras = (req, res) => {
    try {
        const { horaInicio, horaFin } = req.body;

        if (horaInicio === undefined || horaFin === undefined) {
            return res.status(400).json({
                success: false,
                message: 'horaInicio y horaFin son requeridos'
            });
        }

        let horas = horaFin - horaInicio;
        
        // Manejar casos donde el turno cruza la medianoche
        if (horas < 0) {
            horas = 24 + horas;
        }

        res.json({
            success: true,
            horaInicio,
            horaFin,
            horas
        });
    } catch (error) {
        console.error('❌ Error al calcular horas:', error);
        res.status(500).json({
            success: false,
            message: 'Error al calcular horas',
            error: error.message
        });
    }
};

