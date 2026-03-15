/**
 * Global error handler with structured error responses
 */
const errorHandler = (err, req, res, next) => {
    // Generate request ID for tracing
    const requestId = req.headers['x-request-id'] || `req-${Date.now()}`

    // Determine error type and status
    let statusCode = err.statusCode || err.status || 500
    let type = 'InternalError'

    if (err.name === 'ValidationError' || err.message?.includes('required')) {
        statusCode = 400
        type = 'ValidationError'
    } else if (err.name === 'UnauthorizedError' || statusCode === 401) {
        type = 'AuthError'
    } else if (err.name === 'CastError' || statusCode === 404) {
        statusCode = 404
        type = 'NotFoundError'
    } else if (err.code === 11000) {
        statusCode = 409
        type = 'DuplicateError'
    }

    // Log with context
    const logEntry = {
        requestId,
        type,
        status: statusCode,
        message: err.message,
        path: req.originalUrl,
        method: req.method,
    }

    if (statusCode >= 500) {
        console.error('🔴 Server Error:', logEntry)
        if (process.env.NODE_ENV !== 'production') {
            console.error(err.stack)
        }
    } else {
        console.warn('🟡 Client Error:', logEntry)
    }

    // Response — never expose stack traces in production
    res.status(statusCode).json({
        success: false,
        error: statusCode >= 500 && process.env.NODE_ENV === 'production'
            ? 'Internal server error'
            : err.message || 'Something went wrong',
        type,
        requestId,
        ...(process.env.NODE_ENV !== 'production' && { stack: err.stack }),
    })
}

export default errorHandler
