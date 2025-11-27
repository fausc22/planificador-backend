// validations/turnosValidation.js - Esquemas de validación para turnos/horarios
const Joi = require('joi');

// Esquema para crear turno
const crearTurnoSchema = Joi.object({
    turnos: Joi.string()
        .trim()
        .min(1)
        .max(50)
        .required()
        .messages({
            'string.empty': 'El nombre del turno es obligatorio',
            'string.min': 'El nombre del turno debe tener al menos 1 carácter',
            'string.max': 'El nombre del turno no puede exceder 50 caracteres',
            'any.required': 'El nombre del turno es obligatorio'
        }),
    
    horaInicio: Joi.number()
        .integer()
        .min(0)
        .max(23)
        .required()
        .messages({
            'number.base': 'La hora de inicio debe ser un número',
            'number.integer': 'La hora de inicio debe ser un número entero',
            'number.min': 'La hora de inicio debe estar entre 0 y 23',
            'number.max': 'La hora de inicio debe estar entre 0 y 23',
            'any.required': 'La hora de inicio es obligatoria'
        }),
    
    horaFin: Joi.number()
        .integer()
        .min(0)
        .max(23)
        .required()
        .messages({
            'number.base': 'La hora de fin debe ser un número',
            'number.integer': 'La hora de fin debe ser un número entero',
            'number.min': 'La hora de fin debe estar entre 0 y 23',
            'number.max': 'La hora de fin debe estar entre 0 y 23',
            'any.required': 'La hora de fin es obligatoria'
        }),
    
    horas: Joi.number()
        .integer()
        .min(0)
        .max(24)
        .required()
        .messages({
            'number.base': 'Las horas deben ser un número',
            'number.integer': 'Las horas deben ser un número entero',
            'number.min': 'Las horas no pueden ser negativas',
            'number.max': 'Las horas no pueden exceder 24',
            'any.required': 'Las horas son obligatorias'
        })
}).custom((value, helpers) => {
    // Validar que las horas calculadas coincidan con las horas ingresadas
    const inicio = value.horaInicio;
    const fin = value.horaFin;
    
    let horasCalculadas = fin - inicio;
    if (horasCalculadas < 0) {
        horasCalculadas = 24 + horasCalculadas; // Turno que cruza medianoche
    }
    
    if (horasCalculadas !== value.horas) {
        return helpers.error('horas.no_coinciden');
    }
    
    return value;
}, 'Validación de horas')
.messages({
    'horas.no_coinciden': 'Las horas ingresadas no coinciden con el cálculo automático basado en hora inicio y fin'
});

// Esquema para actualizar turno
const actualizarTurnoSchema = Joi.object({
    turnos: Joi.string()
        .trim()
        .min(1)
        .max(50)
        .messages({
            'string.min': 'El nombre del turno debe tener al menos 1 carácter',
            'string.max': 'El nombre del turno no puede exceder 50 caracteres'
        }),
    
    horaInicio: Joi.number()
        .integer()
        .min(0)
        .max(23)
        .messages({
            'number.base': 'La hora de inicio debe ser un número',
            'number.integer': 'La hora de inicio debe ser un número entero',
            'number.min': 'La hora de inicio debe estar entre 0 y 23',
            'number.max': 'La hora de inicio debe estar entre 0 y 23'
        }),
    
    horaFin: Joi.number()
        .integer()
        .min(0)
        .max(23)
        .messages({
            'number.base': 'La hora de fin debe ser un número',
            'number.integer': 'La hora de fin debe ser un número entero',
            'number.min': 'La hora de fin debe estar entre 0 y 23',
            'number.max': 'La hora de fin debe estar entre 0 y 23'
        }),
    
    horas: Joi.number()
        .integer()
        .min(0)
        .max(24)
        .messages({
            'number.base': 'Las horas deben ser un número',
            'number.integer': 'Las horas deben ser un número entero',
            'number.min': 'Las horas no pueden ser negativas',
            'number.max': 'Las horas no pueden exceder 24'
        })
}).min(1) // Al menos un campo debe ser enviado
.custom((value, helpers) => {
    // Si se envían horaInicio, horaFin y horas, validar que coincidan
    if (value.horaInicio !== undefined && value.horaFin !== undefined && value.horas !== undefined) {
        const inicio = value.horaInicio;
        const fin = value.horaFin;
        
        let horasCalculadas = fin - inicio;
        if (horasCalculadas < 0) {
            horasCalculadas = 24 + horasCalculadas;
        }
        
        if (horasCalculadas !== value.horas) {
            return helpers.error('horas.no_coinciden');
        }
    }
    return value;
}, 'Validación de horas')
.messages({
    'horas.no_coinciden': 'Las horas ingresadas no coinciden con el cálculo automático'
});

// Esquema para calcular horas
const calcularHorasSchema = Joi.object({
    horaInicio: Joi.number()
        .integer()
        .min(0)
        .max(23)
        .required()
        .messages({
            'any.required': 'La hora de inicio es obligatoria'
        }),
    
    horaFin: Joi.number()
        .integer()
        .min(0)
        .max(23)
        .required()
        .messages({
            'any.required': 'La hora de fin es obligatoria'
        })
});

module.exports = {
    crearTurnoSchema,
    actualizarTurnoSchema,
    calcularHorasSchema
};

