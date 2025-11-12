// controllers/planeamientoController.js - Controlador principal de planificación
const db = require('./dbPromise');
const {
    obtenerNumeroMes,
    obtenerNombreMes,
    generarFechasMes,
    obtenerNombreDiaEspanol,
    validarFormatoFecha
} = require('../utils/dateUtils');

// ========================================
// FUNCIONES AUXILIARES
// ========================================

// Verificar si una fecha es feriado
const esFeriado = async (fecha) => {
    try {
        const [feriados] = await db.execute(
            'SELECT COUNT(*) as count FROM feriados WHERE fecha = ?',
            [fecha]
        );
        return feriados[0].count > 0;
    } catch (error) {
        console.error('Error al verificar feriado:', error);
        return false;
    }
};

// Obtener horas de un turno
const obtenerHorasTurno = async (turno) => {
    try {
        const [turnos] = await db.execute(
            'SELECT horas FROM horarios WHERE turnos = ?',
            [turno]
        );
        return turnos.length > 0 ? turnos[0].horas : 0;
    } catch (error) {
        console.error('Error al obtener horas del turno:', error);
        return 0;
    }
};

// Calcular acumulado (horas * tarifa por hora, doble si es feriado)
const calcularAcumulado = async (nombreEmpleado, horas, fecha) => {
    try {
        // El nombreEmpleado viene como "Nombre Apellido"
        // Buscar por nombre completo concatenado
        const [empleados] = await db.execute(
            'SELECT hora_normal FROM empleados WHERE CONCAT(nombre, " ", apellido) = ?',
            [nombreEmpleado]
        );

        if (empleados.length === 0) {
            console.error(`⚠️  Empleado no encontrado: "${nombreEmpleado}"`);
            return 0;
        }

        let acumulado = empleados[0].hora_normal * horas;

        // Doble pago si es feriado
        if (await esFeriado(fecha)) {
            acumulado *= 2;
        }

        return acumulado;
    } catch (error) {
        console.error('Error al calcular acumulado:', error);
        return 0;
    }
};

// ========================================
// CARGAR PLANIFICADOR (GRILLA) - OPTIMIZADO
// ========================================

exports.cargarPlanificador = async (req, res) => {
    try {
        const { mes, anio } = req.params;

        // Intentar parsear como número primero, si falla intentar como texto
        let nroMes = parseInt(mes);
        if (isNaN(nroMes)) {
            nroMes = obtenerNumeroMes(mes);
        }
        const nroAnio = parseInt(anio);

        if (!nroMes || !nroAnio || nroMes < 1 || nroMes > 12) {
            return res.status(400).json({
                success: false,
                message: 'Mes y año son requeridos'
            });
        }

        const tabla = `turnos_${nroAnio}`;

        // 1. Generar fechas del mes
        const fechas = generarFechasMes(nroMes, nroAnio);

        // 2. Obtener todos los empleados con nombre completo (1 query)
        const [empleados] = await db.execute(
            'SELECT CONCAT(nombre, " ", apellido) as nombre_completo FROM empleados ORDER BY nombre ASC'
        );
        const nombresEmpleados = empleados.map(e => e.nombre_completo);

        // 3. Obtener todos los feriados del mes (1 query) - OPTIMIZACIÓN
        const [feriadosResult] = await db.execute(
            `SELECT fecha FROM feriados 
             WHERE fecha LIKE ? OR fecha LIKE ?`,
            [`%/${String(nroMes).padStart(2, '0')}/${nroAnio}`,
             `%/${nroMes}/${nroAnio}`]
        );
        const feriadosSet = new Set(feriadosResult.map(f => f.fecha));

        // 4. Obtener TODOS los turnos del mes en UNA sola query - GRAN OPTIMIZACIÓN
        // Antes: N * M queries (días * empleados = ~900 queries para un mes)
        // Ahora: 1 query
        const placeholders = fechas.map(() => '?').join(',');
        const fechasStr = fechas.map(f => f.fecha);
        
        const [turnosResult] = await db.execute(
            `SELECT fecha, nombre_empleado, turno 
             FROM ${tabla} 
             WHERE fecha IN (${placeholders})`,
            fechasStr
        );

        // Crear mapa para acceso O(1)
        const turnosMap = new Map();
        turnosResult.forEach(t => {
            const key = `${t.fecha}_${t.nombre_empleado}`;
            turnosMap.set(key, t.turno);
        });

        // 5. Construir respuesta
        const datos = fechas.map(fechaObj => {
            const fila = {
                fecha: fechaObj.fecha,
                diaSemana: fechaObj.diaSemana,
                display: fechaObj.display,
                esFeriado: feriadosSet.has(fechaObj.fecha),
                empleados: {}
            };

            nombresEmpleados.forEach(empleado => {
                const key = `${fechaObj.fecha}_${empleado}`;
                fila.empleados[empleado] = turnosMap.get(key) || null;
            });

            return fila;
        });

        res.json({
            success: true,
            mes: obtenerNombreMes(nroMes),
            nroMes,
            anio: nroAnio,
            empleados: nombresEmpleados,
            fechas: datos,
            resumen: {
                totalDias: fechas.length,
                totalEmpleados: nombresEmpleados.length,
                totalFeriados: Array.from(feriadosSet).length
            }
        });

    } catch (error) {
        console.error('❌ Error al cargar planificador:', error);
        res.status(500).json({
            success: false,
            message: 'Error al cargar planificador',
            error: error.message
        });
    }
};

// ========================================
// CARGAR PLANIFICADOR CON HORAS/ACUMULADO (OPTIMIZADO)
// ========================================

exports.cargarPlanificadorDetallado = async (req, res) => {
    try {
        const { mes, anio } = req.params;
        const { campo } = req.query; // 'horas' o 'acumulado'

        // Intentar parsear como número primero, si falla intentar como texto
        let nroMes = parseInt(mes);
        if (isNaN(nroMes)) {
            nroMes = obtenerNumeroMes(mes);
        }
        const nroAnio = parseInt(anio);
        const campoMostrar = campo || 'turno';

        if (!nroMes || !nroAnio || nroMes < 1 || nroMes > 12) {
            return res.status(400).json({
                success: false,
                message: 'Mes y año son requeridos'
            });
        }

        const tabla = `turnos_${nroAnio}`;

        // Generar fechas del mes
        const fechas = generarFechasMes(nroMes, nroAnio);

        // Obtener empleados con nombre completo (1 query)
        const [empleados] = await db.execute(
            'SELECT CONCAT(nombre, " ", apellido) as nombre_completo FROM empleados ORDER BY nombre ASC'
        );

        const nombresEmpleados = empleados.map(e => e.nombre_completo);

        // Obtener todos los feriados del mes (1 query) - OPTIMIZACIÓN
        const [feriadosResult] = await db.execute(
            `SELECT fecha FROM feriados 
             WHERE fecha LIKE ? OR fecha LIKE ?`,
            [`%/${String(nroMes).padStart(2, '0')}/${nroAnio}`,
             `%/${nroMes}/${nroAnio}`]
        );
        const feriadosSet = new Set(feriadosResult.map(f => f.fecha));

        // Obtener TODOS los datos en UNA sola query - GRAN OPTIMIZACIÓN
        const placeholders = fechas.map(() => '?').join(',');
        const fechasStr = fechas.map(f => f.fecha);
        
        const [datosResult] = await db.execute(
            `SELECT fecha, nombre_empleado, ${campoMostrar} 
             FROM ${tabla} 
             WHERE fecha IN (${placeholders})`,
            fechasStr
        );

        // Crear mapa para acceso O(1)
        const datosMap = new Map();
        datosResult.forEach(d => {
            const key = `${d.fecha}_${d.nombre_empleado}`;
            datosMap.set(key, d[campoMostrar]);
        });

        // Construir respuesta
        const datos = fechas.map(fechaObj => {
            const fila = {
                fecha: fechaObj.fecha,
                diaSemana: fechaObj.diaSemana,
                display: fechaObj.display,
                esFeriado: feriadosSet.has(fechaObj.fecha),
                empleados: {}
            };

            nombresEmpleados.forEach(empleado => {
                const key = `${fechaObj.fecha}_${empleado}`;
                fila.empleados[empleado] = datosMap.get(key) || (campoMostrar === 'turno' ? null : 0);
            });

            return fila;
        });

        res.json({
            success: true,
            mes: obtenerNombreMes(nroMes),
            nroMes,
            anio: nroAnio,
            campo: campoMostrar,
            empleados: nombresEmpleados,
            fechas: datos,
            resumen: {
                totalDias: fechas.length,
                totalEmpleados: nombresEmpleados.length,
                totalFeriados: Array.from(feriadosSet).length
            }
        });

    } catch (error) {
        console.error('❌ Error al cargar planificador detallado:', error);
        res.status(500).json({
            success: false,
            message: 'Error al cargar planificador detallado',
            error: error.message
        });
    }
};

// ========================================
// CARGAR TOTALES MENSUALES - OPTIMIZADO
// ========================================

exports.cargarTotalesMensuales = async (req, res) => {
    try {
        const { mes, anio } = req.params;
        const { campo } = req.query; // 'horas' o 'acumulado'

        // Intentar parsear como número primero, si falla intentar como texto
        let nroMes = parseInt(mes);
        if (isNaN(nroMes)) {
            nroMes = obtenerNumeroMes(mes);
        }
        const nroAnio = parseInt(anio);
        const campoMostrar = campo || 'horas';

        if (!nroMes || !nroAnio || nroMes < 1 || nroMes > 12) {
            return res.status(400).json({
                success: false,
                message: 'Mes y año son requeridos'
            });
        }

        // Validar campo
        if (!['horas', 'acumulado'].includes(campoMostrar)) {
            return res.status(400).json({
                success: false,
                message: 'Campo debe ser "horas" o "acumulado"'
            });
        }

        const tabla = `totales_${nroAnio}`;

        // OPTIMIZACIÓN: 1 sola query en vez de N queries (una por empleado)
        const [resultados] = await db.execute(
            `SELECT nombre_empleado, ${campoMostrar} 
             FROM ${tabla} 
             WHERE mes = ? 
             ORDER BY nombre_empleado ASC`,
            [nroMes]
        );

        // Convertir a objeto para fácil acceso
        const totales = {};
        resultados.forEach(r => {
            totales[r.nombre_empleado] = r[campoMostrar] || 0;
        });

        res.json({
            success: true,
            mes: obtenerNombreMes(nroMes),
            nroMes,
            anio: nroAnio,
            campo: campoMostrar,
            totales
        });

    } catch (error) {
        console.error('❌ Error al cargar totales mensuales:', error);
        res.status(500).json({
            success: false,
            message: 'Error al cargar totales mensuales',
            error: error.message
        });
    }
};

// ========================================
// ACTUALIZAR TURNO
// ========================================

exports.actualizarTurno = async (req, res) => {
    try {
        const { mes, anio } = req.params;
        const { fecha, nombreEmpleado, turno } = req.body;

        if (!fecha || !nombreEmpleado || !turno) {
            return res.status(400).json({
                success: false,
                message: 'Fecha, nombre de empleado y turno son requeridos'
            });
        }

        // Intentar parsear como número primero, si falla intentar como texto
        let nroMes = parseInt(mes);
        if (isNaN(nroMes)) {
            nroMes = obtenerNumeroMes(mes);
        }
        const nroAnio = parseInt(anio);
        const tabla = `turnos_${nroAnio}`;
        const tablaAnual = `totales_${nroAnio}`;

        // Obtener valores anteriores del turno
        const [turnoAnterior] = await db.execute(
            `SELECT turno, horas, acumulado FROM ${tabla} WHERE fecha = ? AND nombre_empleado = ?`,
            [fecha, nombreEmpleado]
        );

        const horasAnteriores = turnoAnterior.length > 0 ? turnoAnterior[0].horas : 0;
        const acumuladoAnterior = turnoAnterior.length > 0 ? turnoAnterior[0].acumulado : 0;

        // Calcular nuevas horas y acumulado
        const horasNuevas = await obtenerHorasTurno(turno);
        const acumuladoNuevo = await calcularAcumulado(nombreEmpleado, horasNuevas, fecha);

        // Obtener totales mensuales actuales
        const [totalMensual] = await db.execute(
            `SELECT horas, acumulado FROM ${tablaAnual} WHERE mes = ? AND nombre_empleado = ?`,
            [nroMes, nombreEmpleado]
        );

        let horasMensuales = totalMensual.length > 0 ? totalMensual[0].horas : 0;
        let acumuladoMensual = totalMensual.length > 0 ? totalMensual[0].acumulado : 0;

        // Calcular nuevos totales
        horasMensuales = Math.max((horasMensuales - horasAnteriores) + horasNuevas, 0);
        acumuladoMensual = Math.max((acumuladoMensual - acumuladoAnterior) + acumuladoNuevo, 0);

        // Actualizar turno diario
        await db.execute(
            `UPDATE ${tabla} SET turno = ?, horas = ?, acumulado = ? WHERE fecha = ? AND nombre_empleado = ?`,
            [turno, horasNuevas, acumuladoNuevo, fecha, nombreEmpleado]
        );

        // Actualizar totales mensuales
        if (totalMensual.length > 0) {
            await db.execute(
                `UPDATE ${tablaAnual} SET horas = ?, acumulado = ? WHERE mes = ? AND nombre_empleado = ?`,
                [horasMensuales, acumuladoMensual, nroMes, nombreEmpleado]
            );
        } else {
            await db.execute(
                `INSERT INTO ${tablaAnual} (mes, nombre_empleado, horas, acumulado) VALUES (?, ?, ?, ?)`,
                [nroMes, nombreEmpleado, horasMensuales, acumuladoMensual]
            );
        }

        res.json({
            success: true,
            message: 'Turno actualizado con éxito',
            datos: {
                fecha,
                empleado: nombreEmpleado,
                turno,
                horas: horasNuevas,
                acumulado: acumuladoNuevo,
                totalesMensuales: {
                    horas: horasMensuales,
                    acumulado: acumuladoMensual
                }
            }
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

// ========================================
// ACTUALIZAR MES TRABAJADO (RECALCULAR ACUMULADOS)
// ========================================

exports.actualizarMesTrabajado = async (req, res) => {
    try {
        const { anio } = req.params;
        const { nombreEmpleado, diferencia } = req.body;

        if (!nombreEmpleado || diferencia === undefined) {
            return res.status(400).json({
                success: false,
                message: 'Nombre de empleado y diferencia son requeridos'
            });
        }

        const nroAnio = parseInt(anio);
        const tabla = `turnos_${nroAnio}`;
        const tablaAnual = `totales_${nroAnio}`;

        // Obtener todas las fechas del mes actual hasta hoy
        const fechaActual = new Date();
        const primerDia = new Date(fechaActual.getFullYear(), fechaActual.getMonth(), 1);
        const mesActual = fechaActual.getMonth() + 1;

        const [turnos] = await db.execute(
            `SELECT fecha, horas, acumulado FROM ${tabla} 
             WHERE nombre_empleado = ? 
             AND STR_TO_DATE(fecha, '%d/%m/%Y') >= ? 
             AND STR_TO_DATE(fecha, '%d/%m/%Y') <= ?
             ORDER BY STR_TO_DATE(fecha, '%d/%m/%Y') ASC`,
            [nombreEmpleado, primerDia.toISOString().split('T')[0], fechaActual.toISOString().split('T')[0]]
        );

        // Actualizar cada turno con la nueva diferencia
        for (const turno of turnos) {
            const nuevoAcumulado = turno.acumulado + (diferencia * turno.horas);
            await db.execute(
                `UPDATE ${tabla} SET acumulado = ? WHERE fecha = ? AND nombre_empleado = ?`,
                [nuevoAcumulado, turno.fecha, nombreEmpleado]
            );
        }

        // Actualizar totales mensuales
        const [totalMensual] = await db.execute(
            `SELECT horas, acumulado FROM ${tablaAnual} WHERE mes = ? AND nombre_empleado = ?`,
            [mesActual, nombreEmpleado]
        );

        if (totalMensual.length > 0) {
            const nuevoAcumuladoMensual = totalMensual[0].acumulado + (diferencia * totalMensual[0].horas);
            await db.execute(
                `UPDATE ${tablaAnual} SET acumulado = ? WHERE mes = ? AND nombre_empleado = ?`,
                [nuevoAcumuladoMensual, mesActual, nombreEmpleado]
            );
        }

        res.json({
            success: true,
            message: 'Acumulados actualizados con éxito',
            empleado: nombreEmpleado,
            diferencia,
            turnosActualizados: turnos.length
        });

    } catch (error) {
        console.error('❌ Error al actualizar mes trabajado:', error);
        res.status(500).json({
            success: false,
            message: 'Error al actualizar mes trabajado',
            error: error.message
        });
    }
};

// ========================================
// GENERAR TURNOS Y TOTALES PARA UN AÑO
// ========================================

exports.generarTurnosYTotales = async (req, res) => {
    try {
        const { anio } = req.params;
        const nroAnio = parseInt(anio);

        if (!nroAnio || nroAnio < 2020 || nroAnio > 2100) {
            return res.status(400).json({
                success: false,
                message: 'Año inválido'
            });
        }

        const tablaTurnos = `turnos_${nroAnio}`;
        const tablaTotales = `totales_${nroAnio}`;

        // Verificar si las tablas ya existen (opcional)
        // ... código de verificación ...

        // Obtener todos los empleados con nombre completo
        const [empleados] = await db.execute(
            'SELECT CONCAT(nombre, " ", apellido) as nombre_completo FROM empleados ORDER BY nombre ASC'
        );

        let turnosCreados = 0;
        let totalesCreados = 0;

        // Para cada empleado
        for (const empleado of empleados) {
            const nombre = empleado.nombre_completo;

            // Crear totales para cada mes (1-12)
            for (let mes = 1; mes <= 12; mes++) {
                try {
                    await db.execute(
                        `INSERT INTO ${tablaTotales} (mes, nombre_empleado, horas, acumulado) VALUES (?, ?, 0, 0)`,
                        [mes, nombre]
                    );
                    totalesCreados++;
                } catch (error) {
                    // Puede fallar si ya existe, ignorar
                    console.log(`Total ya existe para ${nombre}, mes ${mes}`);
                }
            }

            // Crear turnos para cada día del año
            for (let mes = 1; mes <= 12; mes++) {
                const fechas = generarFechasMes(mes, nroAnio);

                for (const fechaObj of fechas) {
                    try {
                        await db.execute(
                            `INSERT INTO ${tablaTurnos} (fecha, nombre_empleado, turno, horas, acumulado) VALUES (?, ?, 'Libre', 0, 0)`,
                            [fechaObj.fecha, nombre]
                        );
                        turnosCreados++;
                    } catch (error) {
                        // Puede fallar si ya existe, ignorar
                    }
                }
            }
        }

        res.json({
            success: true,
            message: `Turnos y totales generados con éxito para el año ${nroAnio}`,
            anio: nroAnio,
            empleados: empleados.length,
            turnosCreados,
            totalesCreados
        });

    } catch (error) {
        console.error('❌ Error al generar turnos y totales:', error);
        res.status(500).json({
            success: false,
            message: 'Error al generar turnos y totales',
            error: error.message
        });
    }
};

// ========================================
// OBTENER TURNO ESPECÍFICO
// ========================================

exports.obtenerTurno = async (req, res) => {
    try {
        const { anio, fecha, empleado } = req.params;

        if (!validarFormatoFecha(fecha)) {
            return res.status(400).json({
                success: false,
                message: 'Formato de fecha inválido. Use DD/MM/YYYY'
            });
        }

        const tabla = `turnos_${anio}`;

        const [turnos] = await db.execute(
            `SELECT * FROM ${tabla} WHERE fecha = ? AND nombre_empleado = ?`,
            [fecha, empleado]
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

