// services/pdfReciboService.js - Servicio para generar PDFs de recibos de sueldo
const puppeteer = require('puppeteer');

/**
 * Formatea número a moneda argentina sin símbolo
 */
function formatearDinero(valor) {
    return new Intl.NumberFormat('es-AR', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    }).format(valor || 0);
}

/**
 * Genera la plantilla HTML del recibo basada en la plantilla original mejorada
 */
function generarPlantillaHTML(datosRecibo) {
    const { empleado, recibo, extras, mes, anio } = datosRecibo;
    
    const descuento20 = Math.round(recibo.consumos * 0.8 * 100) / 100;
    const bonificaciones = extras?.suma || 0;
    const deducciones = extras?.resta || 0;
    const total = recibo.hsTrabajadasValor - descuento20 + bonificaciones - deducciones;
    const subtotal1 = recibo.hsTrabajadasValor;
    const subtotal2 = bonificaciones - deducciones - descuento20;

    // Generar filas de la primera tabla (Horas)
    let filas1 = `
        <tr>
            <td>Horas Planificadas</td>
            <td>Según planificación mensual</td>
            <td align="center">${recibo.hsPlaniCantidad} hs</td>
            <td align="right">$ ${formatearDinero(recibo.hsPlaniValor)}</td>
        </tr>
        <tr style="background-color: #EFF6FF;">
            <td><strong>Horas Trabajadas</strong></td>
            <td><strong>Según control de horas</strong></td>
            <td align="center"><strong>${recibo.hsTrabajadasCantidad} hs</strong></td>
            <td align="right"><strong>$ ${formatearDinero(recibo.hsTrabajadasValor)}</strong></td>
        </tr>
    `;

    // Generar filas de la segunda tabla (Descuentos y Extras)
    let filas2 = '';
    
    // Descuentos manuales
    if (recibo.consumos > 0) {
        filas2 += `
            <tr style="background-color: #FEF2F2;">
                <td>Consumos</td>
                <td>Descuento aplicado 20%</td>
                <td align="right" style="color: #DC2626;"><strong>- $ ${formatearDinero(descuento20)}</strong></td>
            </tr>
        `;
    }

    // Bonificaciones
    if (extras?.items) {
        extras.items.filter(e => e.detalle === 1).forEach(extra => {
            filas2 += `
                <tr style="background-color: #F0FDF4;">
                    <td><strong>${extra.categoria}</strong></td>
                    <td>${extra.descripcion}</td>
                    <td align="right" style="color: #059669;"><strong>+ $ ${formatearDinero(extra.monto)}</strong></td>
                </tr>
            `;
        });
    }

    // Deducciones
    if (extras?.items) {
        extras.items.filter(e => e.detalle === 2).forEach(extra => {
            filas2 += `
                <tr style="background-color: #FEF2F2;">
                    <td><strong>${extra.categoria}</strong></td>
                    <td>${extra.descripcion}</td>
                    <td align="right" style="color: #DC2626;"><strong>- $ ${formatearDinero(extra.monto)}</strong></td>
                </tr>
            `;
        });
    }

    if (!filas2) {
        filas2 = '<tr><td colspan="3" align="center" style="padding: 15px; color: #6B7280; font-style: italic;">No hay descuentos ni bonificaciones adicionales</td></tr>';
    }

    return `
<!DOCTYPE html>
<html xmlns="http://www.w3.org/1999/xhtml">
<head>
    <meta charset="UTF-8">
    <title>RECIBO DE SUELDO</title>
    <style>
        @page {
            size: A4;
            margin: 2cm;
        }
        
        body {
            font-family: 'Arial', 'Helvetica', sans-serif;
            font-size: 11px;
            color: #1F2937;
            margin: 0;
            padding: 0;
        }
        
        table.border {
            border-collapse: collapse;
            width: 100%;
            border: 2px solid #2563EB;
            margin-bottom: 15px;
        }
        
        table.border th {
            padding: 12px 8px;
            border: 1px solid #93C5FD;
            background: linear-gradient(to bottom, #3B82F6, #2563EB);
            color: white;
            font-weight: bold;
            text-transform: uppercase;
            font-size: 10px;
            letter-spacing: 0.5px;
        }
        
        table.border td {
            padding: 10px 8px;
            border: 1px solid #E5E7EB;
        }
        
        .header-empresa {
            text-align: center;
            background: linear-gradient(to right, #1E40AF, #3B82F6);
            color: white;
            padding: 20px;
            margin-bottom: 25px;
            border-radius: 8px;
        }
        
        .header-empresa h1 {
            margin: 0;
            font-size: 22px;
            font-weight: bold;
            letter-spacing: 1px;
        }
        
        .header-empresa h2 {
            margin: 5px 0 0 0;
            font-size: 16px;
            font-weight: normal;
            opacity: 0.95;
        }
        
        .info-empleado {
            background-color: #F3F4F6;
            padding: 15px;
            border-left: 4px solid #2563EB;
            margin-bottom: 20px;
            border-radius: 4px;
        }
        
        .info-empleado table {
            width: 100%;
        }
        
        .info-empleado td {
            padding: 6px 10px;
        }
        
        .info-label {
            font-weight: bold;
            color: #4B5563;
            width: 25%;
        }
        
        .info-value {
            color: #1F2937;
            font-weight: 600;
            border-bottom: 1px solid #D1D5DB;
        }
        
        .nowrap {
            white-space: nowrap;
        }
        
        .footer {
            margin-top: 30px;
            padding-top: 15px;
            border-top: 2px solid #E5E7EB;
            text-align: center;
            font-size: 9px;
            color: #6B7280;
        }
        
        .total-final {
            background: linear-gradient(to right, #059669, #10B981) !important;
            color: white !important;
            font-size: 16px !important;
            font-weight: bold !important;
            padding: 15px !important;
        }
    </style>
</head>
<body>
    <!-- Header Empresa -->
    <div class="header-empresa">
        <h1>PUNTO SUR MULTIMERCADO</h1>
        <h2>RECIBO DE SUELDO</h2>
    </div>

    <!-- Información del Empleado -->
    <div class="info-empleado">
        <table>
            <tr>
                <td class="info-label">EMPLEADO:</td>
                <td class="info-value">${empleado.nombre} ${empleado.apellido}</td>
                <td class="info-label">MES:</td>
                <td class="info-value">${mes} ${anio}</td>
            </tr>
            <tr>
                <td class="info-label">EMAIL:</td>
                <td class="info-value">${empleado.mail || 'N/A'}</td>
                <td class="info-label">FECHA EMISIÓN:</td>
                <td class="info-value">${new Date().toLocaleDateString('es-AR')}</td>
            </tr>
        </table>
    </div>

    <!-- Tabla 1: Horas Trabajadas -->
    <table class="border">
        <thead>
            <tr>
                <th style="width: 25%;">CONCEPTO</th>
                <th style="width: 40%;">DESCRIPCIÓN</th>
                <th style="width: 15%;">CANT. EN HORAS</th>
                <th style="width: 20%;">ACUMULADO ($ARS)</th>
            </tr>
        </thead>
        <tbody>
            ${filas1}
            <tr>
                <td style="border: 0px !important"></td>
                <td style="border: 0px !important"></td>
                <td style="background-color: #DBEAFE; padding: 12px;" align="right"><strong>SUBTOTAL:</strong></td>
                <td style="background-color: #DBEAFE; padding: 12px;"><strong>$ ${formatearDinero(subtotal1)}</strong></td>
            </tr>
        </tbody>
    </table>

    <!-- Tabla 2: Bonificaciones y Deducciones -->
    <table class="border">
        <thead>
            <tr>
                <th style="width: 30%;">CONCEPTO</th>
                <th style="width: 50%;">DESCRIPCIÓN</th>
                <th style="width: 20%;">ACUMULADO ($ARS)</th>
            </tr>
        </thead>
        <tbody>
            ${filas2}
            <tr>
                <td style="border: 0px !important"></td>
                <td style="background-color: #DBEAFE; padding: 12px;" align="right"><strong>SUBTOTAL:</strong></td>
                <td style="background-color: #DBEAFE; padding: 12px;"><strong>$ ${formatearDinero(subtotal2)}</strong></td>
            </tr>
        </tbody>
    </table>

    <!-- Total Final -->
    <table class="border" style="border: 3px solid #059669;">
        <tr>
            <td style="border: 0px !important; width: 40%;"></td>
            <td style="border: 0px !important; width: 20%;"></td>
            <td class="total-final" align="right">TOTAL A PAGAR:</td>
            <td class="total-final" align="right" style="font-size: 20px;">$ ${formatearDinero(total)}</td>
        </tr>
    </table>

    <!-- Footer -->
    <div class="footer">
        <p><strong>PUNTO SUR MULTIMERCADO</strong></p>
        <p>Este recibo fue generado automáticamente - ${new Date().toLocaleDateString('es-AR')} ${new Date().toLocaleTimeString('es-AR')}</p>
        <p>Sistema de Planificador © ${new Date().getFullYear()}</p>
    </div>
</body>
</html>
    `;
}

/**
 * Genera PDF del recibo de sueldo
 */
async function generarPDFRecibo(datosRecibo) {
    let browser = null;
    
    try {
        console.log('🚀 Iniciando generación de PDF de recibo...');
        
        // Generar HTML
        const htmlContent = generarPlantillaHTML(datosRecibo);
        
        // Iniciar Puppeteer
        browser = await puppeteer.launch({
            headless: 'new',
            args: [
                '--no-sandbox',
                '--disable-setuid-sandbox',
                '--disable-dev-shm-usage',
                '--disable-accelerated-2d-canvas',
                '--disable-gpu'
            ]
        });
        
        const page = await browser.newPage();
        
        // Configurar el contenido HTML
        await page.setContent(htmlContent, {
            waitUntil: 'networkidle0'
        });
        
        // Generar PDF
        const pdfBuffer = await page.pdf({
            format: 'A4',
            printBackground: true,
            margin: {
                top: '1.5cm',
                right: '1.5cm',
                bottom: '1.5cm',
                left: '1.5cm'
            },
            preferCSSPageSize: true
        });
        
        console.log('✅ PDF generado exitosamente');
        
        return pdfBuffer;
        
    } catch (error) {
        console.error('❌ Error generando PDF:', error);
        throw error;
    } finally {
        if (browser) {
            await browser.close();
        }
    }
}

module.exports = {
    generarPDFRecibo
};
