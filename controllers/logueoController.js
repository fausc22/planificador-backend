// controllers/logueoController.js - Gestión de logueos/fichajes
const db = require('./dbPromise');
const fs = require('fs');
const path = require('path');

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

        // Verificar que la acción sea válida
        if (accion !== 'INGRESO' && accion !== 'EGRESO') {
            return res.status(400).json({
                success: false,
                message: 'La acción debe ser INGRESO o EGRESO'
            });
        }

        const tabla = `logueo_${anio}`;

        // Validar secuencia INGRESO/EGRESO
        // Obtener el último logueo del empleado
        const [ultimosLogueos] = await db.execute(
            `SELECT * FROM ${tabla} WHERE nombre_empleado = ? ORDER BY id DESC LIMIT 1`,
            [nombre_empleado]
        );

        if (ultimosLogueos.length > 0) {
            const ultimoLogueo = ultimosLogueos[0];
            
            // Verificar que no haya dos INGRESO o dos EGRESO seguidos
            if (ultimoLogueo.accion === accion) {
                return res.status(400).json({
                    success: false,
                    message: `No se puede registrar ${accion}. El último registro fue ${ultimoLogueo.accion}. Debe alternar entre INGRESO y EGRESO.`
                });
            }
        } else {
            // Si no hay logueos previos, debe ser INGRESO
            if (accion !== 'INGRESO') {
                return res.status(400).json({
                    success: false,
                    message: 'El primer logueo debe ser un INGRESO'
                });
            }
        }

        // Obtener huella dactilar del empleado
        const [empleados] = await db.execute(
            'SELECT huella_dactilar, hora_normal FROM empleados WHERE CONCAT(nombre, " ", apellido) = ?',
            [nombre_empleado]
        );

        if (empleados.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Empleado no encontrado'
            });
        }

        const huella_dactilar = empleados[0].huella_dactilar || '';
        const hora_normal = empleados[0].hora_normal;

        // Insertar el logueo
        const [result] = await db.execute(
            `INSERT INTO ${tabla} (fecha, nombre_empleado, accion, hora, mes, huella_dactilar) 
             VALUES (?, ?, ?, ?, ?, ?)`,
            [fecha, nombre_empleado, accion, hora, mes, huella_dactilar]
        );

        // Si es un EGRESO, buscar el INGRESO del mismo día y actualizar control de horas
        if (accion === 'EGRESO') {
            const [ingresos] = await db.execute(
                `SELECT * FROM ${tabla} WHERE nombre_empleado = ? AND fecha = ? AND accion = 'INGRESO' ORDER BY id DESC LIMIT 1`,
                [nombre_empleado, fecha]
            );

            if (ingresos.length > 0) {
                const ingreso = ingresos[0];
                await actualizarControlHoras(anio, nombre_empleado, fecha, ingreso.hora, hora, mes);
            }
        }

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
        const { hora } = req.body;

        const tabla = `logueo_${anio}`;

        // Obtener información del logueo antes de actualizar
        const [logueoActual] = await db.execute(
            `SELECT * FROM ${tabla} WHERE id = ?`,
            [id]
        );

        if (logueoActual.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Logueo no encontrado'
            });
        }

        const logueo = logueoActual[0];

        // Actualizar la hora del logueo
        await db.execute(
            `UPDATE ${tabla} SET hora = ? WHERE id = ?`,
            [hora, id]
        );

        // Si es un EGRESO, buscar el INGRESO del mismo día y actualizar el control de horas
        if (logueo.accion === 'EGRESO') {
            // Buscar el INGRESO correspondiente
            const [ingresos] = await db.execute(
                `SELECT * FROM ${tabla} WHERE nombre_empleado = ? AND fecha = ? AND accion = 'INGRESO' AND id < ? ORDER BY id DESC LIMIT 1`,
                [logueo.nombre_empleado, logueo.fecha, id]
            );

            if (ingresos.length > 0) {
                const ingreso = ingresos[0];
                await actualizarControlHoras(anio, logueo.nombre_empleado, logueo.fecha, ingreso.hora, hora, logueo.mes);
            }
        }

        // Si es un INGRESO, buscar el EGRESO del mismo día y actualizar el control de horas
        if (logueo.accion === 'INGRESO') {
            const [egresos] = await db.execute(
                `SELECT * FROM ${tabla} WHERE nombre_empleado = ? AND fecha = ? AND accion = 'EGRESO' AND id > ? ORDER BY id ASC LIMIT 1`,
                [logueo.nombre_empleado, logueo.fecha, id]
            );

            if (egresos.length > 0) {
                const egreso = egresos[0];
                await actualizarControlHoras(anio, logueo.nombre_empleado, logueo.fecha, hora, egreso.hora, logueo.mes);
            }
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

// Obtener configuración actual de logueo (contraseña y teléfono)
exports.obtenerConfiguracionLogueo = async (req, res) => {
    try {
        res.json({
            success: true,
            contrasena: process.env.LOGIN_PASS || '251199',
            telefono: process.env.ADMIN_PHONE || ''
        });
    } catch (error) {
        console.error('❌ Error al obtener configuración:', error);
        res.status(500).json({
            success: false,
            message: 'Error al obtener configuración',
            error: error.message
        });
    }
};

// Cambiar configuración de logueo (contraseña y teléfono)
exports.actualizarConfiguracionLogueo = async (req, res) => {
    try {
        const { contrasenaNueva, telefono } = req.body;

        if (!contrasenaNueva && !telefono) {
            return res.status(400).json({
                success: false,
                message: 'Debe proporcionar al menos una configuración para actualizar'
            });
        }

        // Actualizar el archivo .env
        const envPath = path.join(__dirname, '../.env');
        let envContent = fs.readFileSync(envPath, 'utf8');

        // Actualizar contraseña si se proporciona
        if (contrasenaNueva) {
            const regexPass = /LOGIN_PASS=.*/;
            if (regexPass.test(envContent)) {
                envContent = envContent.replace(regexPass, `LOGIN_PASS=${contrasenaNueva}`);
            } else {
                envContent += `\nLOGIN_PASS=${contrasenaNueva}`;
            }
            // Actualizar la variable de entorno en memoria
            process.env.LOGIN_PASS = contrasenaNueva;
        }

        // Actualizar teléfono si se proporciona
        if (telefono !== undefined) {
            const regexPhone = /ADMIN_PHONE=.*/;
            if (regexPhone.test(envContent)) {
                envContent = envContent.replace(regexPhone, `ADMIN_PHONE=${telefono}`);
            } else {
                envContent += `\nADMIN_PHONE=${telefono}`;
            }
            // Actualizar la variable de entorno en memoria
            process.env.ADMIN_PHONE = telefono;
        }

        fs.writeFileSync(envPath, envContent, 'utf8');

        const mensajes = [];
        if (contrasenaNueva) mensajes.push('Contraseña');
        if (telefono !== undefined) mensajes.push('Teléfono');
        
        res.json({
            success: true,
            message: `${mensajes.join(' y ')} actualizado${mensajes.length > 1 ? 's' : ''} exitosamente`
        });

    } catch (error) {
        console.error('❌ Error al cambiar contraseña:', error);
        res.status(500).json({
            success: false,
            message: 'Error al cambiar contraseña',
            error: error.message
        });
    }
};

// Función auxiliar para actualizar control de horas
async function actualizarControlHoras(anio, nombreEmpleado, fecha, horaIngreso, horaEgreso, mes) {
    try {
        const tablaControlHs = `controlhs_${anio}`;

        // Calcular nuevos minutos trabajados
        const [hI, mI] = horaIngreso.split(':').map(Number);
        const [hE, mE] = horaEgreso.split(':').map(Number);
        
        const minutosIngreso = hI * 60 + mI;
        let minutosEgreso = hE * 60 + mE;
        
        if (minutosEgreso < minutosIngreso) {
            minutosEgreso += 24 * 60;
        }
        
        const minutosTrabajados = minutosEgreso - minutosIngreso;
        const horasTrabajadas = Math.round((minutosTrabajados / 60) * 100) / 100;

        // Obtener hora_normal del empleado
        const [empleados] = await db.execute(
            'SELECT hora_normal FROM empleados WHERE CONCAT(nombre, " ", apellido) = ?',
            [nombreEmpleado]
        );

        if (empleados.length === 0) {
            console.error('❌ Empleado no encontrado:', nombreEmpleado);
            return;
        }

        const horaNormal = empleados[0].hora_normal;
        const acumulado = Math.round(horasTrabajadas * horaNormal * 100) / 100;

        // Buscar si existe un registro de control de horas para esta fecha y empleado
        const [controlExistente] = await db.execute(
            `SELECT * FROM ${tablaControlHs} WHERE fecha = ? AND nombre_empleado = ?`,
            [fecha, nombreEmpleado]
        );

        if (controlExistente.length > 0) {
            // Actualizar el registro existente
            await db.execute(
                `UPDATE ${tablaControlHs} SET hora_ingreso = ?, hora_egreso = ?, horas_trabajadas = ?, acumulado = ? WHERE fecha = ? AND nombre_empleado = ?`,
                [horaIngreso, horaEgreso, minutosTrabajados, acumulado, fecha, nombreEmpleado]
            );
        } else {
            // Crear un nuevo registro
            await db.execute(
                `INSERT INTO ${tablaControlHs} (fecha, nombre_empleado, hora_ingreso, hora_egreso, horas_trabajadas, acumulado, mes) VALUES (?, ?, ?, ?, ?, ?, ?)`,
                [fecha, nombreEmpleado, horaIngreso, horaEgreso, minutosTrabajados, acumulado, mes]
            );
        }

        console.log('✅ Control de horas actualizado:', { fecha, nombreEmpleado, minutosTrabajados, acumulado });

    } catch (error) {
        console.error('❌ Error al actualizar control de horas:', error);
        throw error;
    }
}

