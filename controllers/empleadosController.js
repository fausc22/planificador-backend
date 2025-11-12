// controllers/empleadosController.js - Gestión de empleados
const db = require('./dbPromise');

// Obtener todos los empleados activos ordenados alfabéticamente
exports.obtenerEmpleados = async (req, res) => {
    try {
        const [empleados] = await db.execute(
            'SELECT id, nombre, apellido, mail as email, fecha_ingreso, antiguedad, hora_normal, dia_vacaciones, horas_vacaciones, foto_perfil_url FROM empleados ORDER BY nombre ASC'
        );

        // Agregar URL completa de la foto si existe
        const empleadosConFoto = empleados.map(emp => ({
            ...emp,
            foto_perfil_url: emp.foto_perfil_url ? `/uploads/empleados/${emp.foto_perfil_url}` : null
        }));

        res.json({
            success: true,
            count: empleadosConFoto.length,
            empleados: empleadosConFoto
        });
    } catch (error) {
        console.error('❌ Error al obtener empleados:', error);
        res.status(500).json({
            success: false,
            message: 'Error al obtener empleados',
            error: error.message
        });
    }
};

// Obtener un empleado por ID
exports.obtenerEmpleadoPorId = async (req, res) => {
    try {
        const { id } = req.params;

        const [empleados] = await db.execute(
            'SELECT id, nombre, apellido, mail as email, fecha_ingreso, antiguedad, hora_normal, dia_vacaciones, horas_vacaciones FROM empleados WHERE id = ?',
            [id]
        );

        if (empleados.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Empleado no encontrado'
            });
        }

        res.json({
            success: true,
            empleado: empleados[0]
        });
    } catch (error) {
        console.error('❌ Error al obtener empleado:', error);
        res.status(500).json({
            success: false,
            message: 'Error al obtener empleado',
            error: error.message
        });
    }
};

// Obtener empleado por nombre
exports.obtenerEmpleadoPorNombre = async (req, res) => {
    try {
        const { nombre } = req.params;

        const [empleados] = await db.execute(
            'SELECT id, nombre, apellido, mail as email, fecha_ingreso, antiguedad, hora_normal, dia_vacaciones, horas_vacaciones FROM empleados WHERE nombre = ?',
            [nombre]
        );

        if (empleados.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Empleado no encontrado'
            });
        }

        res.json({
            success: true,
            empleado: empleados[0]
        });
    } catch (error) {
        console.error('❌ Error al obtener empleado:', error);
        res.status(500).json({
            success: false,
            message: 'Error al obtener empleado',
            error: error.message
        });
    }
};

// Crear nuevo empleado
exports.crearEmpleado = async (req, res) => {
    try {
        console.log('📝 Datos recibidos:', req.body);
        console.log('📸 Archivo recibido:', req.file);
        
        const {
            nombre,
            apellido,
            mail,
            fecha_ingreso,
            antiguedad,
            hora_normal,
            dia_vacaciones,
            horas_vacaciones
        } = req.body;

        // Validaciones básicas
        if (!nombre || !apellido || !mail || !fecha_ingreso || !hora_normal) {
            return res.status(400).json({
                success: false,
                message: 'Faltan campos obligatorios'
            });
        }

        // Obtener nombre de archivo de foto si se subió
        const foto_perfil_url = req.file ? req.file.filename : null;
        
        if (req.file) {
            console.log('✅ Foto guardada:', foto_perfil_url);
        } else {
            console.log('ℹ️  Sin foto de perfil');
        }

        const [result] = await db.execute(
            `INSERT INTO empleados (nombre, apellido, mail, fecha_ingreso, antiguedad, hora_normal, dia_vacaciones, horas_vacaciones, foto_perfil_url) 
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                nombre,
                apellido,
                mail,
                fecha_ingreso,
                antiguedad || 0,
                hora_normal,
                dia_vacaciones || 14,
                horas_vacaciones || 0,
                foto_perfil_url
            ]
        );

        const empleadoId = result.insertId;
        const nombreCompleto = `${nombre} ${apellido}`;

        // Generar turnos automáticamente para años 2024-2027
        try {
            await db.execute(
                'CALL generar_turnos_empleado(?, ?, ?)',
                [nombreCompleto, 2024, 2027]
            );
            console.log(`✅ Turnos generados para ${nombreCompleto} (2024-2027)`);
        } catch (errorTurnos) {
            console.error(`⚠️  Error al generar turnos para ${nombreCompleto}:`, errorTurnos.message);
        }

        res.status(201).json({
            success: true,
            message: 'Empleado creado exitosamente con turnos generados (2024-2027)',
            empleadoId,
            turnosGenerados: true,
            foto_perfil_url: foto_perfil_url ? `/uploads/empleados/${foto_perfil_url}` : null
        });
    } catch (error) {
        console.error('❌ Error al crear empleado:', error);
        res.status(500).json({
            success: false,
            message: 'Error al crear empleado',
            error: error.message
        });
    }
};

// Actualizar empleado
exports.actualizarEmpleado = async (req, res) => {
    try {
        const { id } = req.params;
        const {
            nombre,
            apellido,
            mail,
            fecha_ingreso,
            antiguedad,
            hora_normal,
            dia_vacaciones,
            horas_vacaciones
        } = req.body;

        // Verificar que el empleado existe
        const [empleados] = await db.execute(
            'SELECT id, foto_perfil_url FROM empleados WHERE id = ?',
            [id]
        );

        if (empleados.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Empleado no encontrado'
            });
        }

        // Si hay nueva foto, actualizar también
        const foto_perfil_url = req.file ? req.file.filename : empleados[0].foto_perfil_url;

        await db.execute(
            `UPDATE empleados 
             SET nombre = ?, apellido = ?, mail = ?, fecha_ingreso = ?, 
                 antiguedad = ?, hora_normal = ?, dia_vacaciones = ?, horas_vacaciones = ?,
                 foto_perfil_url = ?
             WHERE id = ?`,
            [
                nombre,
                apellido,
                mail,
                fecha_ingreso,
                antiguedad,
                hora_normal,
                dia_vacaciones,
                horas_vacaciones,
                foto_perfil_url,
                id
            ]
        );

        res.json({
            success: true,
            message: 'Empleado actualizado exitosamente',
            foto_perfil_url: foto_perfil_url ? `/uploads/empleados/${foto_perfil_url}` : null
        });
    } catch (error) {
        console.error('❌ Error al actualizar empleado:', error);
        res.status(500).json({
            success: false,
            message: 'Error al actualizar empleado',
            error: error.message
        });
    }
};

// Eliminar empleado (soft delete o hard delete según necesidad)
exports.eliminarEmpleado = async (req, res) => {
    try {
        const { id } = req.params;

        // Verificar que el empleado existe
        const [empleados] = await db.execute(
            'SELECT id FROM empleados WHERE id = ?',
            [id]
        );

        if (empleados.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Empleado no encontrado'
            });
        }

        // Hard delete (cambiar a soft delete si es necesario)
        await db.execute('DELETE FROM empleados WHERE id = ?', [id]);

        res.json({
            success: true,
            message: 'Empleado eliminado exitosamente'
        });
    } catch (error) {
        console.error('❌ Error al eliminar empleado:', error);
        res.status(500).json({
            success: false,
            message: 'Error al eliminar empleado',
            error: error.message
        });
    }
};

// Obtener hora normal (tarifa por hora) de un empleado
exports.obtenerHoraNormal = async (req, res) => {
    try {
        const { nombre } = req.params;

        const [empleados] = await db.execute(
            'SELECT hora_normal FROM empleados WHERE nombre = ?',
            [nombre]
        );

        if (empleados.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Empleado no encontrado'
            });
        }

        res.json({
            success: true,
            hora_normal: empleados[0].hora_normal
        });
    } catch (error) {
        console.error('❌ Error al obtener hora normal:', error);
        res.status(500).json({
            success: false,
            message: 'Error al obtener hora normal',
            error: error.message
        });
    }
};

// Actualizar hora normal de un empleado
exports.actualizarHoraNormal = async (req, res) => {
    try {
        const { id } = req.params;
        const { hora_normal } = req.body;

        if (!hora_normal || hora_normal <= 0) {
            return res.status(400).json({
                success: false,
                message: 'Hora normal debe ser mayor a 0'
            });
        }

        const [result] = await db.execute(
            'UPDATE empleados SET hora_normal = ? WHERE id = ?',
            [hora_normal, id]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({
                success: false,
                message: 'Empleado no encontrado'
            });
        }

        res.json({
            success: true,
            message: 'Hora normal actualizada exitosamente'
        });
    } catch (error) {
        console.error('❌ Error al actualizar hora normal:', error);
        res.status(500).json({
            success: false,
            message: 'Error al actualizar hora normal',
            error: error.message
        });
    }
};

// Crear empleado con generación automática de turnos y totales
exports.crearEmpleadoCompleto = async (req, res) => {
    try {
        const {
            nombre,
            apellido,
            mail,
            fecha_ingreso,
            antiguedad,
            hora_normal,
            dia_vacaciones,
            horas_vacaciones,
            foto_perfil,
            huella_dactilar
        } = req.body;

        // Validaciones básicas
        if (!nombre || !apellido || !mail || !fecha_ingreso || !hora_normal) {
            return res.status(400).json({
                success: false,
                message: 'Faltan campos obligatorios'
            });
        }

        // Insertar empleado
        const [result] = await db.execute(
            `INSERT INTO empleados (nombre, apellido, mail, fecha_ingreso, antiguedad, hora_normal, foto_perfil, huella_dactilar, dia_vacaciones, horas_vacaciones) 
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                nombre,
                apellido,
                mail,
                fecha_ingreso,
                antiguedad || 0,
                hora_normal,
                foto_perfil || null,
                huella_dactilar || null,
                dia_vacaciones || 0,
                horas_vacaciones || 0
            ]
        );

        const empleadoId = result.insertId;
        const nombreCompleto = `${nombre} ${apellido}`;

        // Generar turnos automáticamente usando el procedimiento almacenado (2024-2027)
        try {
            await db.execute(
                'CALL generar_turnos_empleado(?, ?, ?)',
                [nombreCompleto, 2024, 2027]
            );
            console.log(`✅ Turnos generados para ${nombreCompleto} (2024-2027)`);
        } catch (errorTurnos) {
            console.error(`⚠️  Error al generar turnos para ${nombreCompleto}:`, errorTurnos.message);
            // No fallar la creación del empleado si falla la generación de turnos
        }

        res.status(201).json({
            success: true,
            message: 'Empleado creado con éxito y turnos generados (2024-2027)',
            empleadoId,
            turnosGenerados: true
        });

    } catch (error) {
        console.error('❌ Error al crear empleado completo:', error);
        res.status(500).json({
            success: false,
            message: 'Error al crear empleado',
            error: error.message
        });
    }
};

// Calcular antigüedad de un empleado
exports.calcularAntiguedad = (req, res) => {
    try {
        const { fecha_ingreso } = req.body;

        if (!fecha_ingreso) {
            return res.status(400).json({
                success: false,
                message: 'Fecha de ingreso es requerida'
            });
        }

        // Parsear fecha en formato DD/MM/YYYY
        const partes = fecha_ingreso.split('/');
        const fechaIngreso = new Date(partes[2], partes[1] - 1, partes[0]);
        const fechaActual = new Date();

        let antiguedad = fechaActual.getFullYear() - fechaIngreso.getFullYear();

        // Ajustar si el aniversario no ha ocurrido este año
        const mesActual = fechaActual.getMonth();
        const mesIngreso = fechaIngreso.getMonth();
        const diaActual = fechaActual.getDate();
        const diaIngreso = fechaIngreso.getDate();

        if (mesActual < mesIngreso || (mesActual === mesIngreso && diaActual < diaIngreso)) {
            antiguedad--;
        }

        res.json({
            success: true,
            fecha_ingreso,
            antiguedad,
            anios: antiguedad
        });

    } catch (error) {
        console.error('❌ Error al calcular antigüedad:', error);
        res.status(500).json({
            success: false,
            message: 'Error al calcular antigüedad',
            error: error.message
        });
    }
};

