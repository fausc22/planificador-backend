// validations/vacacionesValidation.js - Esquemas de validación para vacaciones
const Joi = require('joi');
const { fechaSchema, anioSchema } = require('./commonValidation');

// Esquema para crear vacaciones
const crearVacacionesSchema = Joi.object({
    nombre_empleado: Joi.string()
        .trim()
        .min(2)
        .max(100)
        .required()
        .messages({
            'string.empty': 'El nombre del empleado es obligatorio',
            'string.min': 'El nombre del empleado debe tener al menos 2 caracteres',
            'string.max': 'El nombre del empleado no puede exceder 100 caracteres'
        }),
    
    dias: Joi.number()
        .integer()
        .positive()
        .min(1)
        .max(365)
        .required()
        .messages({
            'number.base': 'Los días deben ser un número',
            'number.positive': 'Los días deben ser positivos',
            'number.min': 'Debe ser al menos 1 día',
            'number.max': 'No puede exceder 365 días',
            'any.required': 'Los días son obligatorios'
        }),
    
    salida: fechaSchema
        .required()
        .messages({
            'any.required': 'La fecha de salida es obligatoria'
        }),
    
    regreso: fechaSchema
        .required()
        .messages({
            'any.required': 'La fecha de regreso es obligatoria'
        }),
    
    mes: Joi.string()
        .valid('ENERO', 'FEBRERO', 'MARZO', 'ABRIL', 'MAYO', 'JUNIO',
               'JULIO', 'AGOSTO', 'SEPTIEMBRE', 'OCTUBRE', 'NOVIEMBRE', 'DICIEMBRE')
        .required()
        .messages({
            'any.only': 'El mes debe ser un mes válido',
            'any.required': 'El mes es obligatorio'
        }),
    
    anio: anioSchema
        .required()
        .messages({
            'any.required': 'El año es obligatorio'
        }),
    
    tipo: Joi.string()
        .valid('vacaciones', 'vacaciones sin goce')
        .default('vacaciones')
        .messages({
            'any.only': 'El tipo debe ser "vacaciones" o "vacaciones sin goce"'
        })
}).custom((value, helpers) => {
    // Validar que la fecha de regreso sea posterior a la de salida
    if (value.salida && value.regreso) {
        const [diaS, mesS, anioS] = value.salida.split('/');
        const [diaR, mesR, anioR] = value.regreso.split('/');
        const fechaSalida = new Date(anioS, mesS - 1, diaS);
        const fechaRegreso = new Date(anioR, mesR - 1, diaR);
        
        if (fechaRegreso < fechaSalida) {
            return helpers.error('date.regreso_anterior');
        }
        
        // Validar que los días coincidan con el rango de fechas
        const diffTime = Math.abs(fechaRegreso - fechaSalida);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
        
        if (diffDays !== value.dias) {
            return helpers.error('date.dias_no_coinciden');
        }
    }
    return value;
}, 'Validación de fechas y días')
.messages({
    'date.regreso_anterior': 'La fecha de regreso debe ser posterior a la fecha de salida',
    'date.dias_no_coinciden': 'Los días no coinciden con el rango de fechas'
});

// Esquema para actualizar vacaciones
const actualizarVacacionesSchema = Joi.object({
    nombre_empleado: Joi.string()
        .trim()
        .min(2)
        .max(100)
        .messages({
            'string.min': 'El nombre del empleado debe tener al menos 2 caracteres',
            'string.max': 'El nombre del empleado no puede exceder 100 caracteres'
        }),
    
    dias: Joi.number()
        .integer()
        .positive()
        .min(1)
        .max(365)
        .messages({
            'number.base': 'Los días deben ser un número',
            'number.positive': 'Los días deben ser positivos',
            'number.min': 'Debe ser al menos 1 día',
            'number.max': 'No puede exceder 365 días'
        }),
    
    salida: fechaSchema,
    regreso: fechaSchema,
    
    mes: Joi.string()
        .valid('ENERO', 'FEBRERO', 'MARZO', 'ABRIL', 'MAYO', 'JUNIO',
               'JULIO', 'AGOSTO', 'SEPTIEMBRE', 'OCTUBRE', 'NOVIEMBRE', 'DICIEMBRE'),
    
    anio: anioSchema
}).min(1) // Al menos un campo debe ser enviado
.custom((value, helpers) => {
    // Si se envían salida y regreso, validar que regreso sea posterior
    if (value.salida && value.regreso) {
        const [diaS, mesS, anioS] = value.salida.split('/');
        const [diaR, mesR, anioR] = value.regreso.split('/');
        const fechaSalida = new Date(anioS, mesS - 1, diaS);
        const fechaRegreso = new Date(anioR, mesR - 1, diaR);
        
        if (fechaRegreso < fechaSalida) {
            return helpers.error('date.regreso_anterior');
        }
    }
    return value;
}, 'Validación de fechas')
.messages({
    'date.regreso_anterior': 'La fecha de regreso debe ser posterior a la fecha de salida'
});

// Esquema para actualizar días de vacaciones de un empleado
const actualizarDiasVacacionesSchema = Joi.object({
    dia_vacaciones: Joi.number()
        .integer()
        .min(0)
        .max(365)
        .required()
        .messages({
            'number.base': 'Los días de vacaciones deben ser un número',
            'number.min': 'Los días no pueden ser negativos',
            'number.max': 'No puede exceder 365 días',
            'any.required': 'Los días de vacaciones son obligatorios'
        })
});

module.exports = {
    crearVacacionesSchema,
    actualizarVacacionesSchema,
    actualizarDiasVacacionesSchema
};

