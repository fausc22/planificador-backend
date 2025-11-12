// validations/commonValidation.js - Validaciones comunes reutilizables
const Joi = require('joi');

// Validación de ID numérico en params
const idParamSchema = Joi.object({
    id: Joi.number()
        .integer()
        .positive()
        .required()
        .messages({
            'number.base': 'El ID debe ser un número',
            'number.positive': 'El ID debe ser positivo'
        })
});

// Validación de fecha en formato DD/MM/YYYY
const fechaSchema = Joi.string()
    .pattern(/^\d{2}\/\d{2}\/\d{4}$/)
    .messages({
        'string.pattern.base': 'La fecha debe tener formato DD/MM/YYYY'
    });

// Validación de mes (número o nombre)
const mesSchema = Joi.alternatives().try(
    Joi.number().integer().min(1).max(12),
    Joi.string().valid('ENERO', 'FEBRERO', 'MARZO', 'ABRIL', 'MAYO', 'JUNIO', 
                        'JULIO', 'AGOSTO', 'SEPTIEMBRE', 'OCTUBRE', 'NOVIEMBRE', 'DICIEMBRE',
                        'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
                        'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre')
);

// Validación de año
const anioSchema = Joi.number()
    .integer()
    .min(2020)
    .max(2100)
    .messages({
        'number.min': 'El año debe ser mayor o igual a 2020',
        'number.max': 'El año no puede ser mayor a 2100'
    });

// Validación de paginación
const paginacionSchema = Joi.object({
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(100).default(20),
    sortBy: Joi.string().optional(),
    sortOrder: Joi.string().valid('ASC', 'DESC', 'asc', 'desc').default('ASC')
});

module.exports = {
    idParamSchema,
    fechaSchema,
    mesSchema,
    anioSchema,
    paginacionSchema
};

