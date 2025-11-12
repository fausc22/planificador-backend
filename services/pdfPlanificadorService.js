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
}

const pdfPlanificadorService = new PdfPlanificadorService();
module.exports = pdfPlanificadorService;


