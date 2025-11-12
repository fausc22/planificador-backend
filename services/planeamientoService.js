// services/planeamientoService.js - Servicio optimizado de planificación
const db = require('../controllers/dbPromise');
const AppError = require('../utils/AppError');
const { obtenerNumeroMes, obtenerNombreMes, generarFechasMes } = require('../utils/dateUtils');

class PlaneamientoService {
    /**
     * Cargar planificador optimizado (resuelve problema N+1)
     */
    async cargarPlanificador(mes, anio) {
        const nroMes = typeof mes === 'string' ? obtenerNumeroMes(mes) : parseInt(mes);
        const nroAnio = parseInt(anio);

        if (!nroMes || !nroAnio) {
            throw new AppError('Mes y año inválidos', 400);
        }

        const tabla = `turnos_${nroAnio}`;

        // 1. Generar fechas del mes
        const fechas = generarFechasMes(nroMes, nroAnio);

        // 2. Obtener todos los empleados (1 query)
        const [empleados] = await db.execute(
            'SELECT nombre FROM empleados ORDER BY nombre ASC'
        );
        const nombresEmpleados = empleados.map(e => e.nombre);

        // 3. Obtener todos los feriados del mes (1 query) - OPTIMIZACIÓN
        const [feriadosResult] = await db.execute(
            `SELECT fecha FROM feriados 
             WHERE fecha LIKE ? 
             OR fecha LIKE ?`,
            [`%/${String(nroMes).padStart(2, '0')}/${nroAnio}`,
             `%/${nroMes}/${nroAnio}`]
        );
        const feriadosSet = new Set(feriadosResult.map(f => f.fecha));

        // 4. Obtener TODOS los turnos del mes en UNA sola query - GRAN OPTIMIZACIÓN
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

        return {
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
        };
    }

    /**
     * Actualizar turno con transacción
     */
    async actualizarTurno(mes, anio, datos) {
        const { fecha, nombreEmpleado, turno } = datos;
        const nroMes = typeof mes === 'string' ? obtenerNumeroMes(mes) : parseInt(mes);
        const nroAnio = parseInt(anio);
        const tabla = `turnos_${nroAnio}`;
        const tablaAnual = `totales_${nroAnio}`;

        // Obtener conexión para usar transacción
        const connection = await new Promise((resolve, reject) => {
            db.pool.getConnection((err, conn) => {
                if (err) reject(err);
                else resolve(conn);
            });
        });

        try {
            // Iniciar transacción
            await new Promise((resolve, reject) => {
                connection.beginTransaction(err => {
                    if (err) reject(err);
                    else resolve();
                });
            });

            // 1. Obtener valores anteriores
            const [turnoAnterior] = await new Promise((resolve, reject) => {
                connection.query(
                    `SELECT turno, horas, acumulado FROM ${tabla} WHERE fecha = ? AND nombre_empleado = ?`,
                    [fecha, nombreEmpleado],
                    (err, results) => {
                        if (err) reject(err);
                        else resolve([results]);
                    }
                );
            });

            const horasAnteriores = turnoAnterior.length > 0 ? turnoAnterior[0].horas : 0;
            const acumuladoAnterior = turnoAnterior.length > 0 ? turnoAnterior[0].acumulado : 0;

            // 2. Calcular nuevos valores
            const [turnoInfo] = await new Promise((resolve, reject) => {
                connection.query(
                    'SELECT horas FROM horarios WHERE turnos = ?',
                    [turno],
                    (err, results) => {
                        if (err) reject(err);
                        else resolve([results]);
                    }
                );
            });

            const horasNuevas = turnoInfo.length > 0 ? turnoInfo[0].horas : 0;

            // 3. Calcular acumulado
            const [empleadoInfo] = await new Promise((resolve, reject) => {
                connection.query(
                    'SELECT hora_normal FROM empleados WHERE nombre = ?',
                    [nombreEmpleado],
                    (err, results) => {
                        if (err) reject(err);
                        else resolve([results]);
                    }
                );
            });

            if (empleadoInfo.length === 0) {
                throw new AppError('Empleado no encontrado', 404);
            }

            let acumuladoNuevo = empleadoInfo[0].hora_normal * horasNuevas;

            // Verificar si es feriado
            const [feriados] = await new Promise((resolve, reject) => {
                connection.query(
                    'SELECT COUNT(*) as count FROM feriados WHERE fecha = ?',
                    [fecha],
                    (err, results) => {
                        if (err) reject(err);
                        else resolve([results]);
                    }
                );
            });

            if (feriados[0].count > 0) {
                acumuladoNuevo *= 2;
            }

            // 4. Obtener totales mensuales actuales
            const [totalMensual] = await new Promise((resolve, reject) => {
                connection.query(
                    `SELECT horas, acumulado FROM ${tablaAnual} WHERE mes = ? AND nombre_empleado = ?`,
                    [nroMes, nombreEmpleado],
                    (err, results) => {
                        if (err) reject(err);
                        else resolve([results]);
                    }
                );
            });

            let horasMensuales = totalMensual.length > 0 ? totalMensual[0].horas : 0;
            let acumuladoMensual = totalMensual.length > 0 ? totalMensual[0].acumulado : 0;

            // 5. Calcular nuevos totales
            horasMensuales = Math.max((horasMensuales - horasAnteriores) + horasNuevas, 0);
            acumuladoMensual = Math.max((acumuladoMensual - acumuladoAnterior) + acumuladoNuevo, 0);

            // 6. Actualizar turno diario
            await new Promise((resolve, reject) => {
                connection.query(
                    `UPDATE ${tabla} SET turno = ?, horas = ?, acumulado = ? WHERE fecha = ? AND nombre_empleado = ?`,
                    [turno, horasNuevas, acumuladoNuevo, fecha, nombreEmpleado],
                    (err, results) => {
                        if (err) reject(err);
                        else resolve(results);
                    }
                );
            });

            // 7. Actualizar o insertar totales mensuales
            if (totalMensual.length > 0) {
                await new Promise((resolve, reject) => {
                    connection.query(
                        `UPDATE ${tablaAnual} SET horas = ?, acumulado = ? WHERE mes = ? AND nombre_empleado = ?`,
                        [horasMensuales, acumuladoMensual, nroMes, nombreEmpleado],
                        (err, results) => {
                            if (err) reject(err);
                            else resolve(results);
                        }
                    );
                });
            } else {
                await new Promise((resolve, reject) => {
                    connection.query(
                        `INSERT INTO ${tablaAnual} (mes, nombre_empleado, horas, acumulado) VALUES (?, ?, ?, ?)`,
                        [nroMes, nombreEmpleado, horasMensuales, acumuladoMensual],
                        (err, results) => {
                            if (err) reject(err);
                            else resolve(results);
                        }
                    );
                });
            }

            // Commit transacción
            await new Promise((resolve, reject) => {
                connection.commit(err => {
                    if (err) reject(err);
                    else resolve();
                });
            });

            connection.release();

            return {
                fecha,
                empleado: nombreEmpleado,
                turno,
                horas: horasNuevas,
                acumulado: acumuladoNuevo,
                totalesMensuales: {
                    horas: horasMensuales,
                    acumulado: acumuladoMensual
                }
            };

        } catch (error) {
            // Rollback en caso de error
            await new Promise((resolve) => {
                connection.rollback(() => resolve());
            });
            connection.release();
            throw error;
        }
    }

    /**
     * Cargar totales mensuales optimizado
     */
    async cargarTotalesMensuales(mes, anio, campo = 'horas') {
        const nroMes = typeof mes === 'string' ? obtenerNumeroMes(mes) : parseInt(mes);
        const nroAnio = parseInt(anio);
        const tabla = `totales_${nroAnio}`;

        // Validar campo
        if (!['horas', 'acumulado'].includes(campo)) {
            throw new AppError('Campo debe ser "horas" o "acumulado"', 400);
        }

        // UNA sola query en vez de N queries
        const [resultados] = await db.execute(
            `SELECT nombre_empleado, ${campo} FROM ${tabla} WHERE mes = ? ORDER BY nombre_empleado ASC`,
            [nroMes]
        );

        const totales = {};
        resultados.forEach(r => {
            totales[r.nombre_empleado] = r[campo];
        });

        return {
            mes: obtenerNombreMes(nroMes),
            nroMes,
            anio: nroAnio,
            campo,
            totales
        };
    }
}

module.exports = new PlaneamientoService();

