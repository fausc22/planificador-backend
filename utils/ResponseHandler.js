// utils/ResponseHandler.js - Manejador de respuestas consistentes

class ResponseHandler {
    /**
     * Respuesta exitosa estándar
     */
    static success(res, data, message = 'Operación exitosa', statusCode = 200) {
        return res.status(statusCode).json({
            success: true,
            message,
            data,
            timestamp: new Date().toISOString()
        });
    }

    /**
     * Respuesta exitosa para creación
     */
    static created(res, data, message = 'Recurso creado exitosamente') {
        return this.success(res, data, message, 201);
    }

    /**
     * Respuesta exitosa sin contenido
     */
    static noContent(res, message = 'Operación exitosa') {
        return res.status(200).json({
            success: true,
            message,
            timestamp: new Date().toISOString()
        });
    }

    /**
     * Respuesta de error
     */
    static error(res, message = 'Error en la operación', statusCode = 500, errors = null) {
        const response = {
            success: false,
            message,
            timestamp: new Date().toISOString()
        };

        if (errors) {
            response.errors = errors;
        }

        return res.status(statusCode).json(response);
    }

    /**
     * Error de validación
     */
    static validationError(res, errors) {
        return this.error(res, 'Error de validación', 400, errors);
    }

    /**
     * Recurso no encontrado
     */
    static notFound(res, message = 'Recurso no encontrado') {
        return this.error(res, message, 404);
    }

    /**
     * No autorizado
     */
    static unauthorized(res, message = 'No autorizado') {
        return this.error(res, message, 401);
    }

    /**
     * Prohibido
     */
    static forbidden(res, message = 'Acceso prohibido') {
        return this.error(res, message, 403);
    }

    /**
     * Conflicto (ejemplo: recurso ya existe)
     */
    static conflict(res, message = 'El recurso ya existe') {
        return this.error(res, message, 409);
    }

    /**
     * Respuesta paginada
     */
    static paginated(res, data, pagination, message = 'Operación exitosa') {
        return res.status(200).json({
            success: true,
            message,
            data,
            pagination: {
                page: pagination.page,
                limit: pagination.limit,
                total: pagination.total,
                totalPages: Math.ceil(pagination.total / pagination.limit),
                hasMore: pagination.page < Math.ceil(pagination.total / pagination.limit)
            },
            timestamp: new Date().toISOString()
        });
    }
}

module.exports = ResponseHandler;

