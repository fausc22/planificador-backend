// validations/logueoValidation.js - Esquemas de validación para logueos
const Joi = require('joi');

// Esquema para crear logueo
const crearLogueoSchema = Joi.object({
    nombre_empleado: Joi.string()
        .trim()
        .min(1)
        .max(255)
        .required()
        .messages({
            'string.empty': 'El nombre del empleado es obligatorio',
            'string.min': 'El nombre del empleado debe tener al menos 1 carácter',
            'string.max': 'El nombre del empleado no puede exceder 255 caracteres',
            'any.required': 'El nombre del empleado es obligatorio'
        }),
    
    fecha: Joi.string()
        .pattern(/^\d{2}\/\d{2}\/\d{4}$/)
        .required()
        .messages({
            'string.pattern.base': 'La fecha debe estar en formato DD/MM/YYYY',
            'any.required': 'La fecha es obligatoria'
        }),
    
    accion: Joi.string()
        .valid('INGRESO', 'EGRESO')
        .required()
        .messages({
            'any.only': 'La acción debe ser INGRESO o EGRESO',
            'any.required': 'La acción es obligatoria'
        }),
    
    hora: Joi.string()
        .pattern(/^\d{2}:\d{2}:\d{2}$/)
        .required()
        .messages({
            'string.pattern.base': 'La hora debe estar en formato HH:MM:SS',
            'any.required': 'La hora es obligatoria'
        }),
    
    mes: Joi.string()
        .valid('ENERO', 'FEBRERO', 'MARZO', 'ABRIL', 'MAYO', 'JUNIO', 
               'JULIO', 'AGOSTO', 'SEPTIEMBRE', 'OCTUBRE', 'NOVIEMBRE', 'DICIEMBRE')
        .required()
        .messages({
            'any.only': 'El mes debe ser un mes válido',
            'any.required': 'El mes es obligatorio'
        })
});

// Esquema para actualizar logueo
const actualizarLogueoSchema = Joi.object({
    hora: Joi.string()
        .pattern(/^\d{2}:\d{2}:\d{2}$/)
        .required()
        .messages({
            'string.pattern.base': 'La hora debe estar en formato HH:MM:SS',
            'any.required': 'La hora es obligatoria'
        })
});

module.exports = {
    crearLogueoSchema,
    actualizarLogueoSchema
};

