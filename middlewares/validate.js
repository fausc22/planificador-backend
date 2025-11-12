// middlewares/validate.js - Middleware de validación con Joi

const AppError = require('../utils/AppError');

/**
 * Middleware para validar datos con esquemas Joi
 * @param {Object} schema - Esquema de validación Joi
 * @param {string} property - Propiedad a validar (body, params, query)
 */
const validate = (schema, property = 'body') => {
    return (req, res, next) => {
        const { error, value } = schema.validate(req[property], {
            abortEarly: false, // Retornar todos los errores
            stripUnknown: true // Eliminar campos no definidos en el schema
        });

        if (error) {
            const errors = error.details.map(detail => ({
                field: detail.path.join('.'),
                message: detail.message.replace(/['"]/g, '')
            }));

            return next(new AppError('Error de validación', 400, errors));
        }

        // Reemplazar con valores validados y sanitizados
        req[property] = value;
        next();
    };
};

module.exports = validate;

