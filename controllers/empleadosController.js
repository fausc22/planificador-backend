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
// Versión Base64 para crear empleado
exports.crearEmpleadoBase64 = async (req, res) => {
    try {
        console.log('📝 [BASE64] Creando empleado con foto Base64');
        
        const {
            nombre,
            apellido,
            mail,
            fecha_ingreso,
            antiguedad,
            hora_normal,
            dia_vacaciones,
            horas_vacaciones,
            fotoBase64
        } = req.body;

        // Validaciones básicas
        if (!nombre || !apellido || !mail || !fecha_ingreso || !hora_normal) {
            return res.status(400).json({
                success: false,
                message: 'Faltan campos obligatorios'
            });
        }

        let foto_perfil_url = null;
        
        // Procesar foto Base64 si existe
        if (fotoBase64) {
            const matches = fotoBase64.match(/^data:([A-Za-z0-9+/-]+);base64,(.+)$/);
            if (matches && matches.length === 3) {
                const mimeType = matches[1];
                const imageData = matches[2];
                const buffer = Buffer.from(imageData, 'base64');
                
                // Generar nombre único
                const timestamp = Date.now();
                const random = Math.floor(Math.random() * 1000000);
                const ext = mimeType === 'image/png' ? '.png' : '.jpg';
                const nombreFoto = `empleado-${timestamp}-${random}${ext}`;
                
                // Guardar archivo (desde controllers/ subir 1 nivel)
                const path = require('path');
                const fs = require('fs');
                const uploadDir = path.join(__dirname, '../public/uploads/empleados');
                
                if (!fs.existsSync(uploadDir)) {
                    fs.mkdirSync(uploadDir, { recursive: true });
                }
                
                const filePath = path.join(uploadDir, nombreFoto);
                await require('fs').promises.writeFile(filePath, buffer);
                
                foto_perfil_url = nombreFoto;
                console.log('✅ Foto guardada:', foto_perfil_url);
            }
        }

        // Insertar empleado
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

        // Generar turnos automáticamente
        try {
            await db.execute('CALL generar_turnos_empleado(?, ?, ?)', [nombreCompleto, 2024, 2027]);
            console.log(`✅ Turnos generados para ${nombreCompleto}`);
        } catch (errorTurnos) {
            console.error(`⚠️ Error generando turnos:`, errorTurnos.message);
        }

        res.status(201).json({
            success: true,
            message: 'Empleado creado exitosamente',
            empleadoId,
            turnosGenerados: true,
            foto_perfil_url: foto_perfil_url ? `/uploads/empleados/${foto_perfil_url}` : null
        });
    } catch (error) {
        console.error('❌ Error creando empleado Base64:', error);
        res.status(500).json({
            success: false,
            message: 'Error al crear empleado',
            error: error.message
        });
    }
};

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

// Función auxiliar para recalcular acumulados cuando cambia la tarifa
const recalcularAcumulados = async (nombreEmpleado, nuevaTarifa, opcionAplicacion) => {
    const connection = await db.getConnection();
    
    try {
        await connection.beginTransaction();
        
        const fechaActual = new Date();
        const anioActual = fechaActual.getFullYear();
        const mesActual = fechaActual.getMonth() + 1;
        const diaActual = fechaActual.getDate();
        
        // Determinar desde qué fecha aplicar el cambio
        let fechaDesde = null;
        let fechaHasta = null;
        
        if (opcionAplicacion === 'retroactivo_mes') {
            // Aplicar a todo el mes actual
            fechaDesde = `01/${String(mesActual).padStart(2, '0')}/${anioActual}`;
            const ultimoDiaMes = new Date(anioActual, mesActual, 0).getDate();
            fechaHasta = `${String(ultimoDiaMes).padStart(2, '0')}/${String(mesActual).padStart(2, '0')}/${anioActual}`;
        } else if (opcionAplicacion === 'desde_hoy') {
            // Aplicar desde hoy en adelante
            fechaDesde = `${String(diaActual).padStart(2, '0')}/${String(mesActual).padStart(2, '0')}/${anioActual}`;
            fechaHasta = null; // Hasta el final del año
        } else if (opcionAplicacion === 'proximo_mes') {
            // Aplicar desde el próximo mes
            const proximoMes = mesActual === 12 ? 1 : mesActual + 1;
            const proximoAnio = mesActual === 12 ? anioActual + 1 : anioActual;
            fechaDesde = `01/${String(proximoMes).padStart(2, '0')}/${proximoAnio}`;
            fechaHasta = null; // Hasta el final del año
        }
        
        // Obtener todos los años que necesitamos actualizar
        const anios = new Set();
        
        if (opcionAplicacion === 'retroactivo_mes') {
            anios.add(anioActual);
        } else if (opcionAplicacion === 'desde_hoy') {
            anios.add(anioActual);
            // Si estamos cerca del final del año, también considerar el próximo año
            if (mesActual >= 11) {
                anios.add(anioActual + 1);
            }
        } else if (opcionAplicacion === 'proximo_mes') {
            if (mesActual === 12) {
                anios.add(anioActual + 1);
            } else {
                anios.add(anioActual);
            }
        }
        
        for (const anio of Array.from(anios)) {
            const tablaTurnos = `turnos_${anio}`;
            const tablaTotales = `totales_${anio}`;
            
            // Verificar si las tablas existen
            try {
                const [tablaExiste] = await connection.execute(
                    `SELECT COUNT(*) as count FROM information_schema.tables 
                     WHERE table_schema = DATABASE() AND table_name = ?`,
                    [tablaTurnos]
                );
                
                if (tablaExiste[0].count === 0) continue;
            } catch (error) {
                continue;
            }
            
            // Construir query para actualizar turnos
            let queryTurnos = `UPDATE ${tablaTurnos} SET acumulado = horas * ? WHERE nombre_empleado = ?`;
            let paramsTurnos = [nuevaTarifa, nombreEmpleado];
            
            if (fechaDesde) {
                queryTurnos += ` AND STR_TO_DATE(fecha, '%d/%m/%Y') >= STR_TO_DATE(?, '%d/%m/%Y')`;
                paramsTurnos.push(fechaDesde);
            }
            
            if (fechaHasta) {
                queryTurnos += ` AND STR_TO_DATE(fecha, '%d/%m/%Y') <= STR_TO_DATE(?, '%d/%m/%Y')`;
                paramsTurnos.push(fechaHasta);
            }
            
            // Actualizar acumulados en turnos (considerando feriados)
            // Primero obtener todos los turnos afectados
            let querySelect = `SELECT fecha, horas, acumulado FROM ${tablaTurnos} WHERE nombre_empleado = ?`;
            let paramsSelect = [nombreEmpleado];
            
            if (fechaDesde) {
                querySelect += ` AND STR_TO_DATE(fecha, '%d/%m/%Y') >= STR_TO_DATE(?, '%d/%m/%Y')`;
                paramsSelect.push(fechaDesde);
            }
            
            if (fechaHasta) {
                querySelect += ` AND STR_TO_DATE(fecha, '%d/%m/%Y') <= STR_TO_DATE(?, '%d/%m/%Y')`;
                paramsSelect.push(fechaHasta);
            }
            
            const [turnos] = await connection.execute(querySelect, paramsSelect);
            
            // Actualizar acumulado con la nueva tarifa (sin considerar doble pago en feriados)
            for (const turno of turnos) {
                const nuevoAcumulado = nuevaTarifa * turno.horas;
                
                await connection.execute(
                    `UPDATE ${tablaTurnos} SET acumulado = ? WHERE fecha = ? AND nombre_empleado = ?`,
                    [nuevoAcumulado, turno.fecha, nombreEmpleado]
                );
            }
            
            // Recalcular totales mensuales para los meses afectados
            const mesesAfectados = new Set();
            
            if (opcionAplicacion === 'retroactivo_mes') {
                mesesAfectados.add(mesActual);
            } else if (opcionAplicacion === 'desde_hoy') {
                // Afecta desde el mes actual hasta el final del año
                mesesAfectados.add(mesActual);
                for (let m = mesActual + 1; m <= 12; m++) {
                    mesesAfectados.add(m);
                }
            } else if (opcionAplicacion === 'proximo_mes') {
                // Afecta desde el próximo mes hasta el final del año
                const proximoMes = mesActual === 12 ? 1 : mesActual + 1;
                const proximoAnio = mesActual === 12 ? anioActual + 1 : anioActual;
                
                if (proximoAnio === anio) {
                    mesesAfectados.add(proximoMes);
                    for (let m = proximoMes + 1; m <= 12; m++) {
                        mesesAfectados.add(m);
                    }
                }
            }
            
            // Recalcular totales para cada mes afectado
            for (const mes of mesesAfectados) {
                // Obtener todos los turnos del mes
                const [turnosMes] = await connection.execute(
                    `SELECT horas, acumulado FROM ${tablaTurnos} 
                     WHERE nombre_empleado = ? 
                     AND fecha LIKE ?`,
                    [nombreEmpleado, `%/${String(mes).padStart(2, '0')}/%`]
                );
                
                // Calcular nuevos totales
                let horasTotales = 0;
                let acumuladoTotal = 0;
                
                turnosMes.forEach(t => {
                    horasTotales += t.horas || 0;
                    acumuladoTotal += t.acumulado || 0;
                });
                
                // Actualizar o crear totales mensuales
                const [totalesExistentes] = await connection.execute(
                    `SELECT horas, acumulado FROM ${tablaTotales} WHERE mes = ? AND nombre_empleado = ?`,
                    [mes, nombreEmpleado]
                );
                
                if (totalesExistentes.length > 0) {
                    await connection.execute(
                        `UPDATE ${tablaTotales} SET horas = ?, acumulado = ? WHERE mes = ? AND nombre_empleado = ?`,
                        [horasTotales, acumuladoTotal, mes, nombreEmpleado]
                    );
                } else if (horasTotales > 0 || acumuladoTotal > 0) {
                    await connection.execute(
                        `INSERT INTO ${tablaTotales} (mes, nombre_empleado, horas, acumulado) VALUES (?, ?, ?, ?)`,
                        [mes, nombreEmpleado, horasTotales, acumuladoTotal]
                    );
                }
            }
        }
        
        await connection.commit();
        return { success: true };
        
    } catch (error) {
        await connection.rollback();
        console.error('❌ Error al recalcular acumulados:', error);
        throw error;
    } finally {
        connection.release();
    }
};

// Actualizar empleado
exports.actualizarEmpleado = async (req, res) => {
    const connection = await db.getConnection();
    
    try {
        await connection.beginTransaction();
        
        const { id } = req.params;
        const {
            nombre,
            apellido,
            mail,
            fecha_ingreso,
            antiguedad,
            hora_normal,
            dia_vacaciones,
            horas_vacaciones,
            aplicar_cambio_tarifa // 'retroactivo_mes', 'desde_hoy', 'proximo_mes', o null
        } = req.body;

        // Debug: Log de los datos recibidos
        console.log('📝 Datos recibidos para actualizar empleado:', {
            id,
            nombre,
            apellido,
            mail,
            fecha_ingreso,
            antiguedad,
            hora_normal,
            dia_vacaciones,
            horas_vacaciones,
            tieneArchivo: !!req.file
        });

        // Verificar que el empleado existe y obtener datos actuales
        const [empleados] = await connection.execute(
            'SELECT * FROM empleados WHERE id = ?',
            [id]
        );

        if (empleados.length === 0) {
            await connection.rollback();
            return res.status(404).json({
                success: false,
                message: 'Empleado no encontrado'
            });
        }

        const empleado = empleados[0];
        const horaNormalAnterior = empleado.hora_normal;
        const nombreCompleto = `${empleado.nombre} ${empleado.apellido}`;
        const horaNormalNueva = hora_normal ? parseFloat(hora_normal) : parseFloat(empleado.hora_normal);

        // Si hay nueva foto, actualizar también, sino mantener la actual
        const foto_perfil_url = req.file ? req.file.filename : (empleado.foto_perfil_url || null);

        // Función helper para valores: usar el enviado si existe y es válido, sino usar el del empleado
        const getValueOrDefault = (newValue, currentValue) => {
            // Si el nuevo valor existe y no está vacío, usarlo
            if (newValue !== undefined && newValue !== null && String(newValue).trim() !== '') {
                return String(newValue).trim();
            }
            // Si no, usar el valor actual
            return currentValue !== undefined && currentValue !== null ? String(currentValue) : '';
        };
        
        // Función helper para valores numéricos
        const getNumericOrDefault = (newValue, currentValue, fallback = 0) => {
            // Si el nuevo valor existe y no está vacío, intentar parsearlo
            if (newValue !== undefined && newValue !== null && String(newValue).trim() !== '') {
                const num = parseFloat(newValue);
                if (!isNaN(num)) return num;
            }
            // Si no, usar el valor actual parseado
            if (currentValue !== undefined && currentValue !== null) {
                const num = parseFloat(currentValue);
                if (!isNaN(num)) return num;
            }
            return fallback;
        };

        // Preparar valores finales: usar el valor enviado si es válido (no vacío), sino usar el actual
        // Esto asegura que los cambios se guarden correctamente
        const nombreFinal = (nombre !== undefined && String(nombre).trim() !== '') 
            ? String(nombre).trim() 
            : empleado.nombre;
        const apellidoFinal = (apellido !== undefined && String(apellido).trim() !== '') 
            ? String(apellido).trim() 
            : empleado.apellido;
        const mailFinal = (mail !== undefined && String(mail).trim() !== '') 
            ? String(mail).trim() 
            : empleado.mail;
        const fechaIngresoFinal = (fecha_ingreso !== undefined && String(fecha_ingreso).trim() !== '') 
            ? String(fecha_ingreso).trim() 
            : empleado.fecha_ingreso;
        const antiguedadFinal = getNumericOrDefault(antiguedad, empleado.antiguedad, 0);
        const horaNormalFinal = getNumericOrDefault(hora_normal, empleado.hora_normal, 0);
        const diaVacacionesFinal = getNumericOrDefault(dia_vacaciones, empleado.dia_vacaciones, 14);
        const horasVacacionesFinal = getNumericOrDefault(horas_vacaciones, empleado.horas_vacaciones, 0);

        // Debug: Log de los valores finales que se van a guardar
        console.log('💾 Valores finales a guardar:', {
            nombreFinal,
            apellidoFinal,
            mailFinal,
            fechaIngresoFinal,
            antiguedadFinal,
            horaNormalFinal,
            diaVacacionesFinal,
            horasVacacionesFinal,
            foto_perfil_url
        });

        // Actualizar datos del empleado - asegurarse de que ningún parámetro sea undefined
        const [updateResult] = await connection.execute(
            `UPDATE empleados 
             SET nombre = ?, apellido = ?, mail = ?, fecha_ingreso = ?, 
                 antiguedad = ?, hora_normal = ?, dia_vacaciones = ?, horas_vacaciones = ?,
                 foto_perfil_url = ?
             WHERE id = ?`,
            [
                nombreFinal,
                apellidoFinal,
                mailFinal,
                fechaIngresoFinal,
                antiguedadFinal,
                horaNormalFinal,
                diaVacacionesFinal,
                horasVacacionesFinal,
                foto_perfil_url,
                id
            ]
        );

        console.log('✅ Resultado de UPDATE:', {
            affectedRows: updateResult.affectedRows,
            changedRows: updateResult.changedRows
        });

        if (updateResult.affectedRows === 0) {
            await connection.rollback();
            return res.status(404).json({
                success: false,
                message: 'No se pudo actualizar el empleado. Verifica que el ID sea correcto.'
            });
        }

        // Si cambió la hora_normal y se especificó cómo aplicar el cambio
        if (horaNormalAnterior !== horaNormalNueva && aplicar_cambio_tarifa) {
            try {
                await recalcularAcumulados(nombreCompleto, horaNormalNueva, aplicar_cambio_tarifa);
                console.log(`✅ Acumulados recalculados para ${nombreCompleto} con opción: ${aplicar_cambio_tarifa}`);
            } catch (errorRecalc) {
                console.error('⚠️ Error al recalcular acumulados:', errorRecalc);
                // No fallar la actualización del empleado si falla el recálculo
            }
        }

        await connection.commit();

        res.json({
            success: true,
            message: aplicar_cambio_tarifa 
                ? `Empleado actualizado exitosamente. Acumulados recalculados (${aplicar_cambio_tarifa}).`
                : 'Empleado actualizado exitosamente',
            foto_perfil_url: foto_perfil_url ? `/uploads/empleados/${foto_perfil_url}` : null,
            tarifaActualizada: horaNormalAnterior !== horaNormalNueva && aplicar_cambio_tarifa
        });
    } catch (error) {
        await connection.rollback();
        console.error('❌ Error al actualizar empleado:', error);
        res.status(500).json({
            success: false,
            message: 'Error al actualizar empleado',
            error: error.message
        });
    } finally {
        connection.release();
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

// Generar/sobreescribir registros en TURNOS y TOTALES para todos los empleados (ENDPOINT PÚBLICO)
exports.verificarYGenerarRegistrosPlanificador = async (req, res) => {
    const connection = await db.getConnection();
    
    try {
        await connection.beginTransaction();
        
        // Obtener todos los empleados
        const [empleados] = await connection.execute(
            'SELECT id, nombre, apellido FROM empleados ORDER BY nombre ASC'
        );
        
        if (empleados.length === 0) {
            await connection.rollback();
            return res.status(404).json({
                success: false,
                message: 'No se encontraron empleados'
            });
        }
        
        const anioInicio = 2024; // Año desde el cual se generan los turnos
        const anioFin = 2027; // Año hasta el cual se generan los turnos
        
        const resultados = {
            empleadosProcesados: 0,
            empleadosActualizados: [],
            empleadosConError: []
        };
        
        // Procesar cada empleado
        for (const empleado of empleados) {
            try {
                const nombreCompleto = `${empleado.nombre} ${empleado.apellido}`;
                
                // Eliminar registros existentes antes de generar nuevos (sobreescribir)
                for (let anio = anioInicio; anio <= anioFin; anio++) {
                    const tablaTurnos = `turnos_${anio}`;
                    const tablaTotales = `totales_${anio}`;
                    
                    // Verificar si las tablas existen
                    const [tablaTurnosExiste] = await connection.execute(
                        `SELECT COUNT(*) as count FROM information_schema.tables 
                         WHERE table_schema = DATABASE() AND table_name = ?`,
                        [tablaTurnos]
                    );
                    
                    if (tablaTurnosExiste[0].count === 0) {
                        console.log(`⚠️  Tabla ${tablaTurnos} no existe, saltando año ${anio}`);
                        continue;
                    }
                    
                    // Eliminar registros existentes en TURNOS
                    try {
                        await connection.execute(
                            `DELETE FROM ${tablaTurnos} WHERE nombre_empleado = ?`,
                            [nombreCompleto]
                        );
                    } catch (errorDeleteTurnos) {
                        console.error(`⚠️  Error al eliminar turnos de ${tablaTurnos} para ${nombreCompleto}:`, errorDeleteTurnos.message);
                    }
                    
                    // Eliminar registros existentes en TOTALES
                    try {
                        await connection.execute(
                            `DELETE FROM ${tablaTotales} WHERE nombre_empleado = ?`,
                            [nombreCompleto]
                        );
                    } catch (errorDeleteTotales) {
                        console.error(`⚠️  Error al eliminar totales de ${tablaTotales} para ${nombreCompleto}:`, errorDeleteTotales.message);
                    }
                }
                
                // Generar turnos y totales usando el procedimiento almacenado (sobreescribe todo)
                try {
                    await connection.execute(
                        'CALL generar_turnos_empleado(?, ?, ?)',
                        [nombreCompleto, anioInicio, anioFin]
                    );
                    
                    resultados.empleadosActualizados.push({
                        id: empleado.id,
                        nombre: nombreCompleto,
                        estado: 'Registros generados/sobreescritos'
                    });
                    
                    console.log(`✅ Registros generados/sobreescritos para ${nombreCompleto}`);
                } catch (errorGenerar) {
                    console.error(`❌ Error al generar registros para ${nombreCompleto}:`, errorGenerar.message);
                    resultados.empleadosConError.push({
                        id: empleado.id,
                        nombre: nombreCompleto,
                        error: errorGenerar.message
                    });
                }
                
                resultados.empleadosProcesados++;
            } catch (errorEmpleado) {
                console.error(`❌ Error al procesar empleado ${empleado.nombre}:`, errorEmpleado.message);
                resultados.empleadosConError.push({
                    id: empleado.id,
                    nombre: `${empleado.nombre} ${empleado.apellido}`,
                    error: errorEmpleado.message
                });
            }
        }
        
        await connection.commit();
        
        res.json({
            success: true,
            message: `Proceso completado. ${resultados.empleadosActualizados.length} empleado(s) procesado(s) exitosamente.`,
            resumen: {
                totalEmpleados: resultados.empleadosProcesados,
                exitosos: resultados.empleadosActualizados.length,
                conError: resultados.empleadosConError.length
            },
            empleadosActualizados: resultados.empleadosActualizados,
            empleadosConError: resultados.empleadosConError,
            aniosProcesados: `${anioInicio}-${anioFin}`
        });
        
    } catch (error) {
        await connection.rollback();
        console.error('❌ Error al generar/sobreescribir registros:', error);
        res.status(500).json({
            success: false,
            message: 'Error al generar/sobreescribir registros',
            error: error.message
        });
    } finally {
        connection.release();
    }
};

