// validations/extrasValidation.js - Esquemas de validación para pagos extras
const Joi = require('joi');
const { mesSchema, anioSchema } = require('./commonValidation');

// Esquema para crear pago extra
const crearExtraSchema = Joi.object({
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
    
    mes: mesSchema
        .required()
        .messages({
            'any.required': 'El mes es obligatorio'
        }),
    
    detalle: Joi.number()
        .integer()
        .valid(1, 2)
        .required()
        .messages({
            'number.base': 'El detalle debe ser un número',
            'any.only': 'El detalle debe ser 1 (bonificación) o 2 (deducción)',
            'any.required': 'El detalle es obligatorio'
        }),
    
    categoria: Joi.string()
        .trim()
        .min(2)
        .max(50)
        .required()
        .messages({
            'string.empty': 'La categoría es obligatoria',
            'string.min': 'La categoría debe tener al menos 2 caracteres',
            'string.max': 'La categoría no puede exceder 50 caracteres'
        }),
    
    monto: Joi.number()
        .positive()
        .precision(2)
        .required()
        .messages({
            'number.base': 'El monto debe ser un número',
            'number.positive': 'El monto debe ser mayor a 0',
            'any.required': 'El monto es obligatorio'
        }),
    
    descripcion: Joi.string()
        .trim()
        .min(3)
        .max(200)
        .required()
        .messages({
            'string.empty': 'La descripción es obligatoria',
            'string.min': 'La descripción debe tener al menos 3 caracteres',
            'string.max': 'La descripción no puede exceder 200 caracteres'
        })
});

// Esquema para actualizar pago extra
const actualizarExtraSchema = Joi.object({
    categoria: Joi.string()
        .trim()
        .min(2)
        .max(50)
        .messages({
            'string.min': 'La categoría debe tener al menos 2 caracteres',
            'string.max': 'La categoría no puede exceder 50 caracteres'
        }),
    
    monto: Joi.number()
        .positive()
        .precision(2)
        .messages({
            'number.base': 'El monto debe ser un número',
            'number.positive': 'El monto debe ser mayor a 0'
        }),
    
    descripcion: Joi.string()
        .trim()
        .min(3)
        .max(200)
        .messages({
            'string.min': 'La descripción debe tener al menos 3 caracteres',
            'string.max': 'La descripción no puede exceder 200 caracteres'
        }),
    
    detalle: Joi.number()
        .integer()
        .valid(1, 2)
        .messages({
            'number.base': 'El detalle debe ser un número',
            'any.only': 'El detalle debe ser 1 (bonificación) o 2 (deducción)'
        })
}).min(1); // Al menos un campo debe ser enviado

// Esquema para parámetros de año y mes
const anioMesParamsSchema = Joi.object({
    anio: anioSchema.required(),
    mes: mesSchema.required()
});

// Esquema para parámetros con nombre de empleado
const anioMesEmpleadoParamsSchema = Joi.object({
    anio: anioSchema.required(),
    mes: mesSchema.required(),
    nombre_empleado: Joi.string()
        .trim()
        .min(2)
        .max(100)
        .required()
});

// Esquema para parámetros con ID
const anioIdParamsSchema = Joi.object({
    anio: anioSchema.required(),
    id: Joi.number()
        .integer()
        .positive()
        .required()
        .messages({
            'number.base': 'El ID debe ser un número',
            'number.positive': 'El ID debe ser positivo'
        })
});

// Esquema para parámetros solo con año
const anioParamsSchema = Joi.object({
    anio: anioSchema.required()
});

module.exports = {
    crearExtraSchema,
    actualizarExtraSchema,
    anioMesParamsSchema,
    anioMesEmpleadoParamsSchema,
    anioIdParamsSchema,
    anioParamsSchema
};

