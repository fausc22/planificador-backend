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
 * Genera la plantilla HTML del recibo con diseño mejorado
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
        <tr style="background-color: #f8fafc;">
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
            <tr style="background-color: #fff1f2;">
                <td>Consumos</td>
                <td>Descuento aplicado 20%</td>
                <td align="right" style="color: #be123c;"><strong>- $ ${formatearDinero(descuento20)}</strong></td>
            </tr>
        `;
    }

    // Bonificaciones
    if (extras?.items) {
        extras.items.filter(e => e.detalle === 1).forEach(extra => {
            filas2 += `
                <tr style="background-color: #f0fdf4;">
                    <td><strong>${extra.categoria}</strong></td>
                    <td>${extra.descripcion}</td>
                    <td align="right" style="color: #15803d;"><strong>+ $ ${formatearDinero(extra.monto)}</strong></td>
                </tr>
            `;
        });
    }

    // Deducciones
    if (extras?.items) {
        extras.items.filter(e => e.detalle === 2).forEach(extra => {
            filas2 += `
                <tr style="background-color: #fff1f2;">
                    <td><strong>${extra.categoria}</strong></td>
                    <td>${extra.descripcion}</td>
                    <td align="right" style="color: #be123c;"><strong>- $ ${formatearDinero(extra.monto)}</strong></td>
                </tr>
            `;
        });
    }

    if (!filas2) {
        filas2 = '<tr><td colspan="3" align="center" style="padding: 15px; color: #94a3b8; font-style: italic;">No hay descuentos ni bonificaciones adicionales</td></tr>';
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
            margin: 1.5cm;
        }
        
        body {
            font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
            font-size: 10pt;
            color: #334155;
            margin: 0;
            padding: 0;
            line-height: 1.5;
        }

        .container {
            max-width: 100%;
            margin: 0 auto;
        }
        
        /* Header Moderno */
        .header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 30px;
            border-bottom: 2px solid #0f172a;
            padding-bottom: 20px;
        }

        .empresa-info h1 {
            margin: 0;
            font-size: 24px;
            font-weight: 800;
            color: #0f172a;
            letter-spacing: -0.5px;
        }

        .empresa-info h2 {
            margin: 5px 0 0 0;
            font-size: 14px;
            font-weight: 500;
            color: #64748b;
            text-transform: uppercase;
            letter-spacing: 1px;
        }

        .recibo-titulo {
            text-align: right;
        }

        .recibo-titulo h3 {
            margin: 0;
            font-size: 18px;
            color: #0f172a;
            text-transform: uppercase;
            border: 1px solid #0f172a;
            padding: 5px 15px;
            border-radius: 4px;
        }

        /* Info Empleado */
        .info-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 20px;
            background-color: #f8fafc;
            padding: 20px;
            border-radius: 8px;
            margin-bottom: 30px;
            border: 1px solid #e2e8f0;
        }

        .info-item {
            display: flex;
            flex-direction: column;
        }

        .info-label {
            font-size: 9px;
            text-transform: uppercase;
            color: #64748b;
            font-weight: 600;
            margin-bottom: 2px;
        }

        .info-value {
            font-size: 12px;
            font-weight: 600;
            color: #0f172a;
        }

        /* Tablas */
        .section-title {
            font-size: 12px;
            font-weight: 700;
            color: #0f172a;
            text-transform: uppercase;
            margin-bottom: 10px;
            padding-left: 10px;
            border-left: 3px solid #3b82f6;
        }

        table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 25px;
            font-size: 10px;
        }

        th {
            text-align: left;
            padding: 10px;
            background-color: #0f172a;
            color: white;
            font-weight: 600;
            text-transform: uppercase;
            font-size: 9px;
        }

        td {
            padding: 10px;
            border-bottom: 1px solid #e2e8f0;
        }

        tr:last-child td {
            border-bottom: none;
        }

        /* Totales */
        .subtotal-row td {
            background-color: #f1f5f9;
            font-weight: 700;
            border-top: 2px solid #cbd5e1;
        }

        .total-container {
            margin-top: 20px;
            background-color: #0f172a;
            color: white;
            padding: 20px;
            border-radius: 8px;
            display: flex;
            justify-content: space-between;
            align-items: center;
        }

        .total-label {
            font-size: 14px;
            font-weight: 500;
            text-transform: uppercase;
        }

        .total-amount {
            font-size: 24px;
            font-weight: 800;
        }

        /* Footer */
        .footer {
            margin-top: 50px;
            text-align: center;
            font-size: 8px;
            color: #94a3b8;
            border-top: 1px solid #e2e8f0;
            padding-top: 20px;
        }
    </style>
</head>
<body>
    <div class="container">
        <!-- Header -->
        <div class="header">
            <div class="empresa-info">
                <h1>PUNTO SUR</h1>
                <h2>Multimercado</h2>
            </div>
            <div class="recibo-titulo">
                <h3>Recibo de Haberes</h3>
            </div>
        </div>

        <!-- Info Empleado -->
        <div class="info-grid">
            <div class="info-item">
                <span class="info-label">Empleado</span>
                <span class="info-value">${empleado.nombre} ${empleado.apellido}</span>
            </div>
            <div class="info-item">
                <span class="info-label">Período Liquidado</span>
                <span class="info-value">${mes} ${anio}</span>
            </div>
            <div class="info-item">
                <span class="info-label">Email</span>
                <span class="info-value">${empleado.mail || '-'}</span>
            </div>
            <div class="info-item">
                <span class="info-label">Fecha de Emisión</span>
                <span class="info-value">${new Date().toLocaleDateString('es-AR')}</span>
            </div>
        </div>

        <!-- Tabla 1: Horas -->
        <div class="section-title">Detalle de Horas</div>
        <table>
            <thead>
                <tr>
                    <th width="30%">Concepto</th>
                    <th width="40%">Descripción</th>
                    <th width="15%" style="text-align: center;">Cantidad</th>
                    <th width="15%" style="text-align: right;">Importe</th>
                </tr>
            </thead>
            <tbody>
                ${filas1}
                <tr class="subtotal-row">
                    <td colspan="2"></td>
                    <td align="right">SUBTOTAL</td>
                    <td align="right">$ ${formatearDinero(subtotal1)}</td>
                </tr>
            </tbody>
        </table>

        <!-- Tabla 2: Adicionales -->
        <div class="section-title">Adicionales y Deducciones</div>
        <table>
            <thead>
                <tr>
                    <th width="30%">Concepto</th>
                    <th width="50%">Descripción</th>
                    <th width="20%" style="text-align: right;">Importe</th>
                </tr>
            </thead>
            <tbody>
                ${filas2}
                <tr class="subtotal-row">
                    <td colspan="1"></td>
                    <td align="right">SUBTOTAL</td>
                    <td align="right">$ ${formatearDinero(subtotal2)}</td>
                </tr>
            </tbody>
        </table>

        <!-- Total Final -->
        <div class="total-container">
            <span class="total-label">Neto a Cobrar</span>
            <span class="total-amount">$ ${formatearDinero(total)}</span>
        </div>

        <!-- Footer -->
        <div class="footer">
            <p>Documento generado electrónicamente el ${new Date().toLocaleDateString('es-AR')} a las ${new Date().toLocaleTimeString('es-AR')}</p>
            <p>PUNTO SUR MULTIMERCADO - Sistema de Gestión de Personal</p>
        </div>
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
