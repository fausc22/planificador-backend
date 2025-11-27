// services/pdfPlanificadorService.js - Servicio para generar PDF del planificador
const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

class PdfPlanificadorService {
    constructor() {
        this.templatePath = path.join(__dirname, '../public/documents/planificador.html');
    }

    /**
     * Obtener configuración de Puppeteer para macOS
     */
    getPuppeteerConfig() {
        const isMac = process.platform === 'darwin';

        const baseConfig = {
            headless: 'new',
            args: [
                '--no-sandbox',
                '--disable-setuid-sandbox',
                '--disable-dev-shm-usage',
                '--disable-web-security'
            ]
        };

        if (isMac) {
            const possibleChromePaths = [
                '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
                '/Applications/Chromium.app/Contents/MacOS/Chromium',
                process.env.CHROME_PATH
            ].filter(Boolean);

            for (const chromePath of possibleChromePaths) {
                if (fs.existsSync(chromePath)) {
                    baseConfig.executablePath = chromePath;
                    console.log(`✅ Chrome encontrado: ${chromePath}`);
                    break;
                }
            }
        }

        return baseConfig;
    }

    /**
     * Generar HTML del planificador
     */
    generarHtmlPlanificador(datos, configuracion) {
        const { mes, anio, empleados, fechas } = datos;
        const { colores } = configuracion;

        // Generar cabeceras de empleados
        const cabecerasEmpleados = empleados.map((emp, idx) => {
            const color = colores[emp] || colores[idx] || '#E3F2FD';
            return `<th style="background-color: ${color}; padding: 8px; border: 1px solid #333; font-size: 11px;">${emp}</th>`;
        }).join('');

        // Generar filas de fechas
        const filasFechas = fechas.map(fecha => {
            const esFinDeSemana = fecha.diaSemana === 'Sábado' || fecha.diaSemana === 'Domingo';
            const bgFecha = fecha.esFeriado ? '#FFEBEE' : (esFinDeSemana ? '#F5F5F5' : '#FFFFFF');

            const celdasEmpleados = empleados.map((emp, idx) => {
                const turno = fecha.empleados[emp] || 'Libre';
                const color = colores[emp] || colores[idx] || '#E3F2FD';
                const estaLibre = !turno || turno === 'Libre';

                return `<td style="background-color: ${estaLibre ? '#FAFAFA' : color}; padding: 6px; border: 1px solid #333; text-align: center; font-size: 10px;">
                    ${turno}
                </td>`;
            }).join('');

            return `
                <tr>
                    <td style="background-color: ${bgFecha}; padding: 6px; border: 1px solid #333; font-weight: bold; white-space: nowrap; font-size: 10px;">
                        ${fecha.fecha}<br>
                        <span style="font-size: 8px; color: #666;">${fecha.diaSemana}</span>
                    </td>
                    ${celdasEmpleados}
                </tr>
            `;
        }).join('');

        return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Planificador ${mes} ${anio}</title>
    <style>
        @page {
            size: landscape;
            margin: 10mm;
        }
        
        body {
            font-family: Arial, sans-serif;
            margin: 0;
            padding: 20px;
        }
        
        .header {
            text-align: center;
            margin-bottom: 20px;
        }
        
        .header h1 {
            margin: 0;
            font-size: 24px;
            color: #1976D2;
        }
        
        .header h2 {
            margin: 5px 0 0 0;
            font-size: 16px;
            color: #666;
        }
        
        table {
            width: 100%;
            border-collapse: collapse;
        }
        
        th, td {
            border: 1px solid #333;
        }
        
        .leyenda {
            margin-top: 15px;
            font-size: 9px;
            color: #666;
        }
        
        .feriado-mark {
            color: #D32F2F;
            font-weight: bold;
        }
    </style>
</head>
<body>
    <div class="header">
        <h1>PLANIFICADOR DE TURNOS</h1>
        <h2>${mes} ${anio}</h2>
    </div>
    
    <table>
        <thead>
            <tr>
                <th style="background-color: #1976D2; color: white; padding: 8px; border: 1px solid #333; font-size: 12px;">FECHA</th>
                ${cabecerasEmpleados}
            </tr>
        </thead>
        <tbody>
            ${filasFechas}
        </tbody>
    </table>
    
    <div class="leyenda">
        <strong>Leyenda:</strong> 
        Días con fondo rojo = Feriados (pago doble) | 
        Días con fondo gris = Fin de semana
    </div>
</body>
</html>
        `;
    }

    /**
     * Generar PDF del planificador
     */
    async generarPdfPlanificador(datos, configuracion = {}) {
        let browser = null;
        try {
            console.log(`📅 Generando PDF planificador ${datos.mes} ${datos.anio}...`);

            // Generar HTML
            const htmlContent = this.generarHtmlPlanificador(datos, configuracion);

            // Configurar Puppeteer
            const config = this.getPuppeteerConfig();
            browser = await puppeteer.launch(config);
            const page = await browser.newPage();

            // Cargar contenido
            await page.setContent(htmlContent, {
                waitUntil: 'networkidle0',
                timeout: 30000
            });

            // Generar PDF en formato horizontal
            const pdfBuffer = await page.pdf({
                format: 'A4',
                landscape: true,
                printBackground: true,
                margin: {
                    top: '10mm',
                    right: '10mm',
                    bottom: '10mm',
                    left: '10mm'
                }
            });

            await browser.close();
            browser = null;

            console.log(`✅ PDF planificador generado - Tamaño: ${pdfBuffer.length} bytes`);
            return pdfBuffer;

        } catch (error) {
            console.error('❌ Error generando PDF planificador:', error);

            if (browser) {
                try {
                    await browser.close();
                } catch (e) {
                    console.error('Error cerrando navegador:', e);
                }
            }

            throw error;
        }
    }
    /**
     * Generar HTML del planificador SEMANAL
     */
    generarHtmlSemanal(datos) {
        const { mes, anio, fechas } = datos;

        // Organizar fechas por semanas
        const semanas = [];
        let semanaActual = [];

        fechas.forEach((fecha, index) => {
            if (index > 0 && (fecha.diaSemana === 'Lunes' || semanaActual.length === 7)) {
                if (semanaActual.length > 0) semanas.push(semanaActual);
                semanaActual = [];
            }
            semanaActual.push(fecha);
        });
        if (semanaActual.length > 0) semanas.push(semanaActual);

        // Generar HTML de semanas
        const htmlSemanas = semanas.map((semana, index) => {
            const diasHtml = semana.map(dia => {
                // Filtrar empleados que trabajan (no Libre)
                const empleadosTrabajando = Object.entries(dia.empleados)
                    .filter(([_, turno]) => turno && turno !== 'Libre')
                    .map(([emp, turno]) => `
                        <div class="empleado-item">
                            <span class="emp-nombre">${emp}</span>
                            <span class="emp-turno">${turno}</span>
                        </div>
                    `).join('');

                return `
                    <div class="dia-columna ${dia.esFeriado ? 'feriado' : ''}">
                        <div class="dia-header">
                            <span class="dia-nombre">${dia.diaSemana}</span>
                            <span class="dia-fecha">${dia.fecha}</span>
                        </div>
                        <div class="dia-contenido">
                            ${empleadosTrabajando || '<div class="sin-turnos">-</div>'}
                        </div>
                    </div>
                `;
            }).join('');

            return `
                <div class="semana-container">
                    <h3>Semana ${index + 1}</h3>
                    <div class="semana-grid">
                        ${diasHtml}
                    </div>
                </div>
                <div class="page-break"></div>
            `;
        }).join('');

        return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Planificador Semanal ${mes} ${anio}</title>
    <style>
        @page { size: A4 landscape; margin: 10mm; }
        body { font-family: 'Helvetica', Arial, sans-serif; margin: 0; padding: 20px; color: #333; }
        .header { text-align: center; margin-bottom: 30px; border-bottom: 2px solid #1976D2; padding-bottom: 10px; }
        .header h1 { margin: 0; color: #1976D2; font-size: 24px; text-transform: uppercase; }
        .header h2 { margin: 5px 0 0; color: #666; font-size: 16px; }
        
        .semana-container { margin-bottom: 20px; }
        .semana-container h3 { color: #444; border-left: 4px solid #1976D2; padding-left: 10px; margin-bottom: 15px; }
        
        .semana-grid { display: flex; gap: 10px; justify-content: space-between; }
        
        .dia-columna { 
            flex: 1; 
            border: 1px solid #ddd; 
            border-radius: 4px; 
            overflow: hidden; 
            min-width: 0; /* Para que flex funcione bien con contenido largo */
        }
        
        .dia-header { 
            background-color: #f5f5f5; 
            padding: 8px; 
            text-align: center; 
            border-bottom: 1px solid #ddd;
        }
        .dia-nombre { display: block; font-weight: bold; font-size: 12px; text-transform: uppercase; }
        .dia-fecha { display: block; font-size: 11px; color: #666; }
        
        .feriado .dia-header { background-color: #ffebee; color: #c62828; }
        .feriado .dia-nombre { color: #c62828; }
        
        .dia-contenido { padding: 5px; font-size: 10px; }
        
        .empleado-item { 
            margin-bottom: 4px; 
            padding: 4px; 
            background-color: #e3f2fd; 
            border-radius: 3px; 
            border-left: 2px solid #2196f3;
        }
        
        .emp-nombre { display: block; font-weight: bold; margin-bottom: 1px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .emp-turno { display: block; color: #555; font-size: 9px; }
        
        .sin-turnos { text-align: center; color: #ccc; padding: 10px 0; font-style: italic; }
        
        .page-break { page-break-after: always; }
        .page-break:last-child { page-break-after: auto; }
    </style>
</head>
<body>
    <div class="header">
        <h1>Planificación Semanal</h1>
        <h2>${mes} ${anio}</h2>
    </div>
    ${htmlSemanas}
</body>
</html>
        `;
    }

    /**
     * Generar PDF Semanal
     */
    async generarPdfSemanal(datos) {
        let browser = null;
        try {
            console.log(`📅 Generando PDF Semanal ${datos.mes} ${datos.anio}...`);

            const htmlContent = this.generarHtmlSemanal(datos);
            const config = this.getPuppeteerConfig();

            browser = await puppeteer.launch(config);
            const page = await browser.newPage();

            await page.setContent(htmlContent, { waitUntil: 'networkidle0' });

            const pdfBuffer = await page.pdf({
                format: 'A4',
                landscape: true,
                printBackground: true,
                margin: { top: '10mm', right: '10mm', bottom: '10mm', left: '10mm' }
            });

            await browser.close();
            browser = null;

            return pdfBuffer;
        } catch (error) {
            console.error('❌ Error generando PDF semanal:', error);
            if (browser) await browser.close();
            throw error;
        }
    }

}

const pdfPlanificadorService = new PdfPlanificadorService();
module.exports = pdfPlanificadorService;






