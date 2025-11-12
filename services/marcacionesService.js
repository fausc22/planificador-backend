// services/marcacionesService.js - Servicio de marcaciones con OpenCage API
const db = require('../controllers/db');
const axios = require('axios');

// Coordenadas de la tienda/trabajo (cache)
let workplaceCoordinates = { lat: 0, lng: 0 };

/**
 * Obtiene coordenadas de la dirección de trabajo usando OpenCage API
 */
async function getWorkplaceCoordinates() {
    const address = process.env.WORKPLACE_ADDRESS;
    const apiKey = process.env.OPENCAGE_API_KEY;
    
    if (!address || !apiKey) {
        throw new Error('WORKPLACE_ADDRESS y OPENCAGE_API_KEY deben estar configurados en .env');
    }
    
    try {
        console.log(`🔍 Obteniendo coordenadas de: ${address}`);
        
        const response = await axios.get(
            `https://api.opencagedata.com/geocode/v1/json?q=${encodeURIComponent(address)}&key=${apiKey}`,
            { timeout: 10000 }
        );
        
        if (!response.data.results || response.data.results.length === 0) {
            throw new Error('Dirección de trabajo no válida');
        }
        
        const { lat, lng } = response.data.results[0].geometry;
        workplaceCoordinates = { lat, lng };
        
        console.log(`✅ Coordenadas obtenidas: ${lat}, ${lng}`);
        return workplaceCoordinates;
        
    } catch (error) {
        console.error('❌ Error obteniendo coordenadas de trabajo:', error.message);
        throw error;
    }
}

/**
 * Inicializar coordenadas al arrancar el servidor
 */
getWorkplaceCoordinates().catch(error => {
    console.error('❌ Error crítico inicializando coordenadas:', error.message);
});

/**
 * Calcula distancia usando fórmula de Haversine (en kilómetros)
 */
function getDistanceFromLatLonInKm(lat1, lon1, lat2, lon2) {
    const R = 6371; // Radio de la Tierra en km
    const dLat = deg2rad(lat2 - lat1);
    const dLon = deg2rad(lon2 - lon1);
    const a = 
        Math.sin(dLat/2) * Math.sin(dLat/2) +
        Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) * 
        Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    const d = R * c;
    return Math.round(d * 100) / 100; // Redondear a 2 decimales
}

function deg2rad(deg) {
    return deg * (Math.PI/180);
}

/**
 * Valida ubicación usando coordenadas directas o dirección
 */
async function validateLocation(userLatitude, userLongitude, userAddress = null) {
    const apiKey = process.env.OPENCAGE_API_KEY;
    
    try {
        let lat, lng, formatted = 'Ubicación validada';
        
        // Si se proporcionan coordenadas directamente, usarlas
        if (userLatitude && userLongitude) {
            lat = userLatitude;
            lng = userLongitude;
            
            // Opcionalmente, hacer geocodificación inversa para obtener dirección
            try {
                const response = await axios.get(
                    `https://api.opencagedata.com/geocode/v1/json?q=${lat}+${lng}&key=${apiKey}`,
                    { timeout: 5000 }
                );
                
                if (response.data.results && response.data.results.length > 0) {
                    formatted = response.data.results[0].formatted;
                }
            } catch (error) {
                console.log('⚠️ No se pudo obtener dirección formateada, continuando...');
            }
        } 
        // Si se proporciona dirección, geocodificarla
        else if (userAddress) {
            const response = await axios.get(
                `https://api.opencagedata.com/geocode/v1/json?q=${encodeURIComponent(userAddress)}&key=${apiKey}`,
                { timeout: 10000 }
            );
            
            if (!response.data.results || response.data.results.length === 0) {
                throw new Error('Dirección no válida o no encontrada');
            }
            
            const userLocation = response.data.results[0].geometry;
            lat = userLocation.lat;
            lng = userLocation.lng;
            formatted = response.data.results[0].formatted;
        } else {
            throw new Error('Debe proporcionar coordenadas o dirección');
        }
        
        // Calcular distancia
        const distanceKm = getDistanceFromLatLonInKm(
            workplaceCoordinates.lat,
            workplaceCoordinates.lng,
            lat,
            lng
        );
        
        const distanceMeters = Math.round(distanceKm * 1000);
        const maxDistanceMeters = parseInt(process.env.MAX_DISTANCE_METERS || '100');
        const isValid = distanceMeters <= maxDistanceMeters;
        
        return {
            valid: isValid,
            distance: distanceMeters,
            maxDistance: maxDistanceMeters,
            userLat: lat,
            userLng: lng,
            workplaceLat: workplaceCoordinates.lat,
            workplaceLng: workplaceCoordinates.lng,
            formatted
        };
        
    } catch (error) {
        console.error('❌ Error validando ubicación:', error.message);
        throw error;
    }
}

/**
 * Obtiene el año actual para determinar la tabla
 */
function getCurrentYear() {
    return new Date().getFullYear();
}

/**
 * Obtiene el último logueo de un empleado (sin importar la fecha)
 */
async function getLastLogueoToday(nombreEmpleado) {
    const year = getCurrentYear();
    
    return new Promise((resolve, reject) => {
        db.query(
            `SELECT * FROM logueo_${year} 
             WHERE nombre_empleado = ? 
             ORDER BY id DESC 
             LIMIT 1`,
            [nombreEmpleado],
            (error, results) => {
                if (error) {
                    console.error('Error obteniendo último logueo:', error);
                    return reject(error);
                }
                resolve(results && results.length > 0 ? results[0] : null);
            }
        );
    });
}

/**
 * Valida si se puede hacer la acción solicitada (INGRESO o EGRESO)
 */
async function validateAction(nombreEmpleado, accion) {
    const lastLogueo = await getLastLogueoToday(nombreEmpleado);
    
    if (accion === 'INGRESO') {
        // Si hay un ingreso previo sin egreso, no permitir otro ingreso
        if (lastLogueo && lastLogueo.accion === 'INGRESO') {
            return {
                valid: false,
                message: 'Ya existe un INGRESO sin EGRESO. Debe registrar primero un EGRESO.'
            };
        }
        return { valid: true };
    }
    
    if (accion === 'EGRESO') {
        // Debe haber un ingreso previo
        if (!lastLogueo || lastLogueo.accion !== 'INGRESO') {
            return {
                valid: false,
                message: 'No existe un INGRESO previo. Debe registrar primero un INGRESO.'
            };
        }
        return { valid: true, ingresoData: lastLogueo };
    }
    
    return { valid: false, message: 'Acción inválida' };
}

/**
 * Formatea fecha a DD/MM/YYYY
 */
function formatearFecha(date) {
    const d = new Date(date);
    const dia = String(d.getDate()).padStart(2, '0');
    const mes = String(d.getMonth() + 1).padStart(2, '0');
    const anio = d.getFullYear();
    return `${dia}/${mes}/${anio}`;
}

/**
 * Registra un logueo (INGRESO o EGRESO)
 */
async function registrarLogueo(nombreEmpleado, accion, hora) {
    const year = getCurrentYear();
    const fecha = formatearFecha(new Date());
    const mes = new Date().toLocaleString('es-ES', { month: 'long' }).toUpperCase();
    
    return new Promise((resolve, reject) => {
        db.query(
            `INSERT INTO logueo_${year} 
            (fecha, nombre_empleado, accion, hora, mes) 
            VALUES (?, ?, ?, ?, ?)`,
            [fecha, nombreEmpleado, accion, hora, mes],
            (error, results) => {
                if (error) {
                    console.error('Error registrando logueo:', error);
                    return reject(error);
                }
                resolve(results.insertId);
            }
        );
    });
}

/**
 * Calcula minutos trabajados entre ingreso y egreso
 * @param {string} horaIngreso - Hora en formato HH:MM:SS
 * @param {string} horaEgreso - Hora en formato HH:MM:SS
 */
function calcularMinutosTrabajados(horaIngreso, horaEgreso) {
    // Convertir horas de ingreso/egreso a minutos
    const [hI, mI] = horaIngreso.split(':').map(Number);
    const [hE, mE] = horaEgreso.split(':').map(Number);
    
    const minutosIngreso = hI * 60 + mI;
    const minutosEgreso = hE * 60 + mE;
    
    // Minutos trabajados
    let minutosTrabajados = minutosEgreso - minutosIngreso;
    
    // Si el egreso es al día siguiente (ej: 23:00 a 02:00)
    if (minutosTrabajados < 0) {
        minutosTrabajados += 24 * 60; // Agregar 24 horas en minutos
    }
    
    // Convertir a horas para mostrar (redondeado a 2 decimales)
    const horasTrabajadas = Math.round((minutosTrabajados / 60) * 100) / 100;
    
    return {
        minutosTrabajados,
        horasTrabajadas
    };
}


/**
 * Registra control de horas cuando hay un par INGRESO-EGRESO
 * @param {string} nombreEmpleado - Nombre completo del empleado
 * @param {string} horaIngreso - Hora de ingreso HH:MM:SS
 * @param {string} horaEgreso - Hora de egreso HH:MM:SS
 * @param {number} horaNormal - Precio por hora del empleado
 */
async function registrarControlHoras(nombreEmpleado, horaIngreso, horaEgreso, horaNormal) {
    const year = getCurrentYear();
    const fecha = formatearFecha(new Date());
    const mes = new Date().toLocaleString('es-ES', { month: 'long' }).toUpperCase();
    
    // Calcular minutos y horas trabajadas
    const { minutosTrabajados, horasTrabajadas } = calcularMinutosTrabajados(horaIngreso, horaEgreso);
    
    // Calcular la plata ganada ese día: horasTrabajadas × precio_por_hora
    // Redondeado a 2 decimales
    const acumulado = Math.round(horasTrabajadas * horaNormal * 100) / 100;
    
    return new Promise((resolve, reject) => {
        db.query(
            `INSERT INTO controlhs_${year} 
            (fecha, nombre_empleado, hora_ingreso, hora_egreso, horas_trabajadas, acumulado, mes) 
            VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [fecha, nombreEmpleado, horaIngreso, horaEgreso, minutosTrabajados, acumulado, mes],
            (error, results) => {
                if (error) {
                    console.error('Error registrando control de horas:', error);
                    return reject(error);
                }
                resolve({
                    id: results.insertId,
                    minutosTrabajados,
                    horasTrabajadas,
                    acumulado  // Plata ganada ese día
                });
            }
        );
    });
}

/**
 * Procesa una marcación completa (validación + registro)
 */
async function procesarMarcacion(empleado, accion, userLatitude = null, userLongitude = null, userAddress = null) {
    try {
        // 1. Validar ubicación
        console.log(`📍 Validando ubicación para ${empleado.nombre} ${empleado.apellido}...`);
        const locationValidation = await validateLocation(userLatitude, userLongitude, userAddress);
        
        if (!locationValidation.valid) {
            return {
                success: false,
                rechazado: true,
                message: `Ubicación fuera del rango permitido. Estás a ${locationValidation.distance}m (máximo: ${locationValidation.maxDistance}m)`,
                data: {
                    distance: locationValidation.distance,
                    maxDistance: locationValidation.maxDistance
                }
            };
        }
        
        // 2. Validar acción (evitar doble ingreso/egreso)
        const nombreCompleto = `${empleado.nombre} ${empleado.apellido}`;
        console.log(`✓ Ubicación válida. Validando acción ${accion}...`);
        
        const actionValidation = await validateAction(nombreCompleto, accion);
        
        if (!actionValidation.valid) {
            return {
                success: false,
                rechazado: true,
                message: actionValidation.message
            };
        }
        
        // 3. Registrar logueo
        const horaActual = new Date().toTimeString().split(' ')[0]; // HH:MM:SS
        console.log(`✓ Acción válida. Registrando ${accion} a las ${horaActual}...`);
        
        await registrarLogueo(nombreCompleto, accion, horaActual);
        
        let controlHsData = null;
        
        // 4. Si es EGRESO, calcular y registrar horas
        if (accion === 'EGRESO' && actionValidation.ingresoData) {
            console.log(`📊 Calculando horas trabajadas...`);
            
            controlHsData = await registrarControlHoras(
                nombreCompleto,
                actionValidation.ingresoData.hora,
                horaActual,
                empleado.hora_normal  // Precio por hora del empleado
            );
            
            console.log(`✅ Control de horas registrado: ${controlHsData.horasTrabajadas} horas = $${controlHsData.acumulado}`);
        }
        
        return {
            success: true,
            rechazado: false,
            message: `${accion} registrado exitosamente`,
            data: {
                empleado: nombreCompleto,
                accion,
                hora: horaActual,
                distance: locationValidation.distance,
                maxDistance: locationValidation.maxDistance,
                ubicacion: locationValidation.formatted,
                controlHs: controlHsData
            }
        };
        
    } catch (error) {
        console.error('❌ Error procesando marcación:', error);
        throw error;
    }
}

/**
 * Obtiene historial de logueos
 */
async function obtenerHistorialLogueos(nombreEmpleado, fechaInicio, fechaFin) {
    const year = getCurrentYear();
    
    return new Promise((resolve, reject) => {
        let query = `SELECT * FROM logueo_${year} WHERE nombre_empleado = ?`;
        const params = [nombreEmpleado];
        
        if (fechaInicio) {
            query += ' AND fecha >= ?';
            params.push(fechaInicio);
        }
        
        if (fechaFin) {
            query += ' AND fecha <= ?';
            params.push(fechaFin);
        }
        
        query += ' ORDER BY fecha DESC, hora DESC LIMIT 100';
        
        db.query(query, params, (error, results) => {
            if (error) {
                console.error('Error obteniendo historial:', error);
                return reject(error);
            }
            resolve(results || []);
        });
    });
}

/**
 * Obtiene historial de control de horas
 */
async function obtenerHistorialControlHs(nombreEmpleado, fechaInicio, fechaFin) {
    const year = getCurrentYear();
    
    return new Promise((resolve, reject) => {
        let query = `SELECT * FROM controlhs_${year} WHERE nombre_empleado = ?`;
        const params = [nombreEmpleado];
        
        if (fechaInicio) {
            query += ' AND fecha >= ?';
            params.push(fechaInicio);
        }
        
        if (fechaFin) {
            query += ' AND fecha <= ?';
            params.push(fechaFin);
        }
        
        query += ' ORDER BY fecha DESC LIMIT 50';
        
        db.query(query, params, (error, results) => {
            if (error) {
                console.error('Error obteniendo control horas:', error);
                return reject(error);
            }
            resolve(results || []);
        });
    });
}

module.exports = {
    getWorkplaceCoordinates,
    validateLocation,
    validateAction,
    procesarMarcacion,
    obtenerHistorialLogueos,
    obtenerHistorialControlHs,
    getLastLogueoToday
};
