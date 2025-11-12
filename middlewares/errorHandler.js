// middlewares/errorHandler.js - Middleware centralizado de manejo de errores

const AppError = require('../utils/AppError');

const errorHandler = (err, req, res, next) => {
    let error = { ...err };
    error.message = err.message;
    error.statusCode = err.statusCode || 500;

    // Log del error en desarrollo
    if (process.env.NODE_ENV === 'development') {
        console.error('❌ Error:', err);
    }

    // Error de MySQL - Duplicate entry
    if (err.code === 'ER_DUP_ENTRY') {
        error.message = 'Este registro ya existe en la base de datos';
        error.statusCode = 409;
    }

    // Error de MySQL - Foreign key constraint
    if (err.code === 'ER_ROW_IS_REFERENCED' || err.code === 'ER_ROW_IS_REFERENCED_2') {
        error.message = 'No se puede eliminar porque tiene registros relacionados';
        error.statusCode = 400;
    }

    // Error de MySQL - Table doesn't exist
    if (err.code === 'ER_NO_SUCH_TABLE') {
        error.message = 'La tabla solicitada no existe. Posiblemente falte generar datos para este año.';
        error.statusCode = 404;
    }

    // Error de JWT - Token inválido
    if (err.name === 'JsonWebTokenError') {
        error.message = 'Token inválido';
        error.statusCode = 401;
    }

    // Error de JWT - Token expirado
    if (err.name === 'TokenExpiredError') {
        error.message = 'Token expirado';
        error.statusCode = 401;
    }

    // Error de validación de Joi
    if (err.name === 'ValidationError' && err.isJoi) {
        const errors = err.details.map(detail => ({
            field: detail.path.join('.'),
            message: detail.message
        }));
        error.message = 'Error de validación';
        error.statusCode = 400;
        error.errors = errors;
    }

    // Respuesta de error
    const response = {
        success: false,
        message: error.message || 'Error interno del servidor',
        timestamp: new Date().toISOString()
    };

    // Agregar errores específicos si existen
    if (error.errors) {
        response.errors = error.errors;
    }

    // Agregar stack trace solo en desarrollo
    if (process.env.NODE_ENV === 'development') {
        response.stack = err.stack;
    }

    res.status(error.statusCode).json(response);
};

module.exports = errorHandler;

