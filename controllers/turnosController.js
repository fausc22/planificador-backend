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

        // Validaciones básicas
        if (!turnos || horaInicio === undefined || horaFin === undefined || horas === undefined || horas === null) {
            return res.status(400).json({
                success: false,
                message: 'Faltan campos obligatorios'
            });
        }

        // Validar que el nombre del turno no esté duplicado
        const [turnosExistentes] = await db.execute(
            'SELECT id FROM horarios WHERE turnos = ?',
            [turnos.trim()]
        );

        if (turnosExistentes.length > 0) {
            return res.status(400).json({
                success: false,
                message: `Ya existe un turno con el nombre "${turnos.trim()}"`
            });
        }

        // Validar rango de horas
        const inicio = parseInt(horaInicio);
        const fin = parseInt(horaFin);
        const horasNum = parseInt(horas);

        if (inicio < 0 || inicio > 23 || fin < 0 || fin > 23) {
            return res.status(400).json({
                success: false,
                message: 'Las horas deben estar entre 0 y 23'
            });
        }

        if (horasNum < 0 || horasNum > 24) {
            return res.status(400).json({
                success: false,
                message: 'El total de horas debe estar entre 0 y 24'
            });
        }

        // Validar que las horas coincidan con el cálculo
        let horasCalculadas = fin - inicio;
        if (horasCalculadas < 0) {
            horasCalculadas = 24 + horasCalculadas; // Turno que cruza medianoche
        }

        if (horasCalculadas !== horasNum) {
            return res.status(400).json({
                success: false,
                message: `Las horas ingresadas (${horasNum}) no coinciden con el cálculo (${horasCalculadas} horas)`
            });
        }

        const [result] = await db.execute(
            'INSERT INTO horarios (turnos, horaInicio, horaFin, horas) VALUES (?, ?, ?, ?)',
            [turnos.trim(), inicio, fin, horasNum]
        );

        res.status(201).json({
            success: true,
            message: 'Turno creado exitosamente',
            turnoId: result.insertId
        });
    } catch (error) {
        console.error('❌ Error al crear turno:', error);
        
        // Manejar error de duplicado
        if (error.code === 'ER_DUP_ENTRY') {
            return res.status(400).json({
                success: false,
                message: 'Ya existe un turno con ese nombre'
            });
        }

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
            'SELECT id, turnos as nombre_turno FROM horarios WHERE id = ?',
            [id]
        );

        if (turnosExistentes.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Turno no encontrado'
            });
        }

        // Si se está cambiando el nombre, verificar que no esté duplicado
        if (turnos && turnos.trim() !== turnosExistentes[0].nombre_turno) {
            const [turnosDuplicados] = await db.execute(
                'SELECT id FROM horarios WHERE turnos = ? AND id != ?',
                [turnos.trim(), id]
            );

            if (turnosDuplicados.length > 0) {
                return res.status(400).json({
                    success: false,
                    message: `Ya existe otro turno con el nombre "${turnos.trim()}"`
                });
            }
        }

        // Construir query dinámicamente
        const campos = [];
        const valores = [];

        if (turnos !== undefined) {
            campos.push('turnos = ?');
            valores.push(turnos.trim());
        }

        if (horaInicio !== undefined) {
            const inicio = parseInt(horaInicio);
            if (inicio < 0 || inicio > 23) {
                return res.status(400).json({
                    success: false,
                    message: 'La hora de inicio debe estar entre 0 y 23'
                });
            }
            campos.push('horaInicio = ?');
            valores.push(inicio);
        }

        if (horaFin !== undefined) {
            const fin = parseInt(horaFin);
            if (fin < 0 || fin > 23) {
                return res.status(400).json({
                    success: false,
                    message: 'La hora de fin debe estar entre 0 y 23'
                });
            }
            campos.push('horaFin = ?');
            valores.push(fin);
        }

        if (horas !== undefined) {
            const horasNum = parseInt(horas);
            if (horasNum < 0 || horasNum > 24) {
                return res.status(400).json({
                    success: false,
                    message: 'El total de horas debe estar entre 0 y 24'
                });
            }
            campos.push('horas = ?');
            valores.push(horasNum);
        }

        // Validar que si se actualizan horaInicio, horaFin y horas, coincidan
        if (horaInicio !== undefined && horaFin !== undefined && horas !== undefined) {
            const inicio = parseInt(horaInicio);
            const fin = parseInt(horaFin);
            const horasNum = parseInt(horas);
            
            let horasCalculadas = fin - inicio;
            if (horasCalculadas < 0) {
                horasCalculadas = 24 + horasCalculadas;
            }

            if (horasCalculadas !== horasNum) {
                return res.status(400).json({
                    success: false,
                    message: `Las horas ingresadas (${horasNum}) no coinciden con el cálculo (${horasCalculadas} horas)`
                });
            }
        }

        if (campos.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'Debe enviar al menos un campo para actualizar'
            });
        }

        valores.push(id);

        await db.execute(
            `UPDATE horarios SET ${campos.join(', ')} WHERE id = ?`,
            valores
        );

        res.json({
            success: true,
            message: 'Turno actualizado exitosamente'
        });
    } catch (error) {
        console.error('❌ Error al actualizar turno:', error);
        
        // Manejar error de duplicado
        if (error.code === 'ER_DUP_ENTRY') {
            return res.status(400).json({
                success: false,
                message: 'Ya existe un turno con ese nombre'
            });
        }

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

