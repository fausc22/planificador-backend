// validations/empleadoValidation.js - Esquemas de validación para empleados
const Joi = require('joi');

// Esquema para crear empleado
const crearEmpleadoSchema = Joi.object({
    nombre: Joi.string()
        .trim()
        .min(2)
        .max(100)
        .required()
        .messages({
            'string.empty': 'El nombre es obligatorio',
            'string.min': 'El nombre debe tener al menos 2 caracteres',
            'string.max': 'El nombre no puede exceder 100 caracteres'
        }),
    
    apellido: Joi.string()
        .trim()
        .min(2)
        .max(100)
        .required()
        .messages({
            'string.empty': 'El apellido es obligatorio',
            'string.min': 'El apellido debe tener al menos 2 caracteres'
        }),
    
    mail: Joi.string()
        .email()
        .required()
        .messages({
            'string.email': 'El email debe ser válido',
            'string.empty': 'El email es obligatorio'
        }),
    
    fecha_ingreso: Joi.string()
        .pattern(/^\d{2}\/\d{2}\/\d{4}$/)
        .required()
        .messages({
            'string.pattern.base': 'La fecha debe tener formato DD/MM/YYYY',
            'string.empty': 'La fecha de ingreso es obligatoria'
        }),
    
    antiguedad: Joi.number()
        .integer()
        .min(0)
        .default(0),
    
    hora_normal: Joi.number()
        .integer()
        .min(1)
        .required()
        .messages({
            'number.base': 'La hora normal debe ser un número',
            'number.min': 'La hora normal debe ser mayor a 0',
            'any.required': 'La hora normal es obligatoria'
        }),
    
    dia_vacaciones: Joi.number()
        .integer()
        .min(0)
        .default(0),
    
    horas_vacaciones: Joi.number()
        .integer()
        .min(0)
        .default(0),
    
    foto_perfil: Joi.binary()
        .allow(null)
        .optional(),
    
    huella_dactilar: Joi.binary()
        .allow(null)
        .optional()
});

// Esquema para actualizar empleado
const actualizarEmpleadoSchema = Joi.object({
    nombre: Joi.string().trim().min(2).max(100),
    apellido: Joi.string().trim().min(2).max(100),
    mail: Joi.string().email(),
    fecha_ingreso: Joi.string().pattern(/^\d{2}\/\d{2}\/\d{4}$/),
    antiguedad: Joi.number().integer().min(0),
    hora_normal: Joi.number().integer().min(1),
    dia_vacaciones: Joi.number().integer().min(0),
    horas_vacaciones: Joi.number().integer().min(0),
    foto_perfil: Joi.binary().allow(null),
    huella_dactilar: Joi.binary().allow(null)
}).min(1); // Al menos un campo debe ser enviado

// Esquema para actualizar hora normal
const actualizarHoraNormalSchema = Joi.object({
    hora_normal: Joi.number()
        .integer()
        .min(1)
        .required()
        .messages({
            'number.min': 'La hora normal debe ser mayor a 0'
        })
});

// Esquema para calcular antigüedad
const calcularAntiguedadSchema = Joi.object({
    fecha_ingreso: Joi.string()
        .pattern(/^\d{2}\/\d{2}\/\d{4}$/)
        .required()
        .messages({
            'string.pattern.base': 'La fecha debe tener formato DD/MM/YYYY'
        })
});

module.exports = {
    crearEmpleadoSchema,
    actualizarEmpleadoSchema,
    actualizarHoraNormalSchema,
    calcularAntiguedadSchema
};

