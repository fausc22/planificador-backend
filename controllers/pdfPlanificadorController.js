// controllers/pdfPlanificadorController.js - Controlador para PDF del planificador
const pdfPlanificadorService = require('../services/pdfPlanificadorService');
const db = require('./dbPromise');
const { obtenerNumeroMes, obtenerNombreMes, generarFechasMes } = require('../utils/dateUtils');

exports.generarPdfPlanificador = async (req, res) => {
    try {
        const { mes, anio } = req.params;
        const { colores } = req.body; // { "Juan Pérez": "#E3F2FD", "María López": "#FFF3E0", ... }

        console.log('📄 Solicitud de PDF planificador:', { mes, anio });

        // Parsear mes
        let nroMes = parseInt(mes);
        if (isNaN(nroMes)) {
            nroMes = obtenerNumeroMes(mes);
        }
        const nroAnio = parseInt(anio);

        if (!nroMes || !nroAnio || nroMes < 1 || nroMes > 12) {
            return res.status(400).json({
                success: false,
                message: 'Mes y año inválidos'
            });
        }

        const tabla = `turnos_${nroAnio}`;

        // 1. Generar fechas del mes
        const fechas = generarFechasMes(nroMes, nroAnio);

        // 2. Obtener empleados
        const [empleados] = await db.execute(
            'SELECT CONCAT(nombre, " ", apellido) as nombre_completo FROM empleados ORDER BY nombre ASC'
        );
        const nombresEmpleados = empleados.map(e => e.nombre_completo);

        // 3. Obtener feriados
        const [feriadosResult] = await db.execute(
            `SELECT fecha FROM feriados 
             WHERE fecha LIKE ? OR fecha LIKE ?`,
            [`%/${String(nroMes).padStart(2, '0')}/${nroAnio}`,
             `%/${nroMes}/${nroAnio}`]
        );
        const feriadosSet = new Set(feriadosResult.map(f => f.fecha));

        // 4. Obtener turnos
        const placeholders = fechas.map(() => '?').join(',');
        const fechasStr = fechas.map(f => f.fecha);
        
        const [turnosResult] = await db.execute(
            `SELECT fecha, nombre_empleado, turno 
             FROM ${tabla} 
             WHERE fecha IN (${placeholders})`,
            fechasStr
        );

        const turnosMap = new Map();
        turnosResult.forEach(t => {
            const key = `${t.fecha}_${t.nombre_empleado}`;
            turnosMap.set(key, t.turno);
        });

        // 5. Construir datos para PDF
        const datosPdf = fechas.map(fechaObj => {
            const fila = {
                fecha: fechaObj.fecha,
                diaSemana: fechaObj.diaSemana,
                esFeriado: feriadosSet.has(fechaObj.fecha),
                empleados: {}
            };

            nombresEmpleados.forEach(empleado => {
                const key = `${fechaObj.fecha}_${empleado}`;
                fila.empleados[empleado] = turnosMap.get(key) || 'Libre';
            });

            return fila;
        });

        // 6. Generar PDF
        const pdfBuffer = await pdfPlanificadorService.generarPdfPlanificador({
            mes: obtenerNombreMes(nroMes),
            anio: nroAnio,
            empleados: nombresEmpleados,
            fechas: datosPdf
        }, {
            colores: colores || {}
        });

        // 7. Enviar PDF
        const filename = `planificador_${obtenerNombreMes(nroMes)}_${nroAnio}.pdf`;
        
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
        res.setHeader('Content-Length', pdfBuffer.length);
        
        console.log(`✅ PDF enviado: ${filename} (${pdfBuffer.length} bytes)`);
        res.end(pdfBuffer);

    } catch (error) {
        console.error('❌ Error generando PDF planificador:', error);
        res.status(500).json({
            success: false,
            message: 'Error al generar PDF',
            error: error.message
        });
    }
};


