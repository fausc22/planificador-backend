// utils/dateUtils.js - Utilidades para manejo de fechas
const moment = require('moment-timezone');

// Configurar moment en español
moment.locale('es', {
    months: 'Enero_Febrero_Marzo_Abril_Mayo_Junio_Julio_Agosto_Septiembre_Octubre_Noviembre_Diciembre'.split('_'),
    monthsShort: 'Ene_Feb_Mar_Abr_May_Jun_Jul_Ago_Sep_Oct_Nov_Dic'.split('_'),
    weekdays: 'Domingo_Lunes_Martes_Miércoles_Jueves_Viernes_Sábado'.split('_'),
    weekdaysShort: 'Dom_Lun_Mar_Mié_Jue_Vie_Sáb'.split('_'),
    weekdaysMin: 'Do_Lu_Ma_Mi_Ju_Vi_Sá'.split('_')
});

moment.locale('es');

// Obtener nombre del día en español
const obtenerNombreDiaEspanol = (fecha) => {
    const dias = {
        0: 'Domingo',
        1: 'Lunes',
        2: 'Martes',
        3: 'Miércoles',
        4: 'Jueves',
        5: 'Viernes',
        6: 'Sábado'
    };
    
    const date = moment(fecha, 'DD/MM/YYYY');
    return dias[date.day()];
};

// Obtener número de mes desde nombre en español
const obtenerNumeroMes = (mesTexto) => {
    const meses = {
        'ENERO': 1,
        'FEBRERO': 2,
        'MARZO': 3,
        'ABRIL': 4,
        'MAYO': 5,
        'JUNIO': 6,
        'JULIO': 7,
        'AGOSTO': 8,
        'SEPTIEMBRE': 9,
        'OCTUBRE': 10,
        'NOVIEMBRE': 11,
        'DICIEMBRE': 12
    };
    
    return meses[mesTexto.toUpperCase()] || 0;
};

// Obtener nombre del mes desde número
const obtenerNombreMes = (numeroMes) => {
    const meses = [
        '', 'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
        'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
    ];
    
    return meses[numeroMes] || '';
};

// Formatear fecha al formato DD/MM/YYYY
const formatearFecha = (fecha) => {
    if (!fecha) return null;
    
    // Si ya está en formato DD/MM/YYYY
    if (typeof fecha === 'string' && fecha.includes('/')) {
        return fecha;
    }
    
    return moment(fecha).format('DD/MM/YYYY');
};

// Parsear fecha del formato DD/MM/YYYY
const parsearFecha = (fechaString) => {
    return moment(fechaString, 'DD/MM/YYYY');
};

// Obtener días en un mes
const diasEnMes = (mes, anio) => {
    return moment(`${anio}-${mes}`, 'YYYY-M').daysInMonth();
};

// Generar array de fechas para un mes
const generarFechasMes = (mes, anio) => {
    const fechas = [];
    const dias = diasEnMes(mes, anio);
    
    for (let dia = 1; dia <= dias; dia++) {
        const fecha = moment(`${anio}-${mes}-${dia}`, 'YYYY-M-D').format('DD/MM/YYYY');
        const diaSemana = obtenerNombreDiaEspanol(fecha);
        
        fechas.push({
            fecha,
            diaSemana,
            display: `${fecha} (${diaSemana})`
        });
    }
    
    return fechas;
};

// Validar formato de fecha DD/MM/YYYY
const validarFormatoFecha = (fechaString) => {
    const regex = /^\d{2}\/\d{2}\/\d{4}$/;
    if (!regex.test(fechaString)) return false;
    
    const fecha = moment(fechaString, 'DD/MM/YYYY', true);
    return fecha.isValid();
};

// Obtener fecha actual en formato DD/MM/YYYY
const obtenerFechaActual = () => {
    return moment().format('DD/MM/YYYY');
};

// Obtener mes y año actual
const obtenerMesAnioActual = () => {
    return {
        mes: moment().month() + 1,
        anio: moment().year(),
        mesNombre: obtenerNombreMes(moment().month() + 1)
    };
};

// Comparar fechas (retorna -1 si fecha1 < fecha2, 0 si son iguales, 1 si fecha1 > fecha2)
const compararFechas = (fecha1, fecha2) => {
    const m1 = moment(fecha1, 'DD/MM/YYYY');
    const m2 = moment(fecha2, 'DD/MM/YYYY');
    
    if (m1.isBefore(m2)) return -1;
    if (m1.isAfter(m2)) return 1;
    return 0;
};

// Agregar días a una fecha
const agregarDias = (fecha, dias) => {
    return moment(fecha, 'DD/MM/YYYY').add(dias, 'days').format('DD/MM/YYYY');
};

// Restar días a una fecha
const restarDias = (fecha, dias) => {
    return moment(fecha, 'DD/MM/YYYY').subtract(dias, 'days').format('DD/MM/YYYY');
};

// Obtener diferencia en días entre dos fechas
const diferenciaDias = (fecha1, fecha2) => {
    const m1 = moment(fecha1, 'DD/MM/YYYY');
    const m2 = moment(fecha2, 'DD/MM/YYYY');
    return m2.diff(m1, 'days');
};

// Obtener rango de fechas entre dos fechas
const obtenerRangoFechas = (fechaInicio, fechaFin) => {
    const fechas = [];
    const inicio = moment(fechaInicio, 'DD/MM/YYYY');
    const fin = moment(fechaFin, 'DD/MM/YYYY');
    
    let actual = inicio.clone();
    while (actual.isSameOrBefore(fin)) {
        fechas.push(actual.format('DD/MM/YYYY'));
        actual.add(1, 'days');
    }
    
    return fechas;
};

module.exports = {
    obtenerNombreDiaEspanol,
    obtenerNumeroMes,
    obtenerNombreMes,
    formatearFecha,
    parsearFecha,
    diasEnMes,
    generarFechasMes,
    validarFormatoFecha,
    obtenerFechaActual,
    obtenerMesAnioActual,
    compararFechas,
    agregarDias,
    restarDias,
    diferenciaDias,
    obtenerRangoFechas
};

