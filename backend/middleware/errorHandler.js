/**
 * Global error handling middleware for Express.
 * Catches unhandled errors and returns consistent error responses.
 */

/**
 * Custom API Error class for structured error handling.
 */
class ApiError extends Error {
    constructor(statusCode, message, isOperational = true) {
        super(message);
        this.statusCode = statusCode;
        this.isOperational = isOperational;
        Error.captureStackTrace(this, this.constructor);
    }
}

/**
 * Global error handler middleware.
 * @param {Error} err - Error object
 * @param {Object} req - Express request
 * @param {Object} res - Express response
 * @param {Function} next - Express next function
 */
function errorHandler(err, req, res, next) {
    let statusCode = err.statusCode || 500;
    let message = err.message || "Internal server error";

    // Log error details server-side
    if (statusCode >= 500) {
        console.error("Server error:", {
            method: req.method,
            path: req.path,
            error: err.message,
            stack: err.stack
        });
    } else {
        console.warn("Client error:", {
            method: req.method,
            path: req.path,
            status: statusCode,
            message
        });
    }

    // Send consistent error response
    res.status(statusCode).json({
        success: false,
        message,
        ...(process.env.NODE_ENV === "development" && {
            stack: err.stack
        })
    });
}

/**
 * 404 Not Found handler for undefined routes.
 * @param {Object} req - Express request
 * @param {Object} res - Express response
 */
function notFoundHandler(req, res) {
    res.status(404).json({
        success: false,
        message: `Route ${req.method} ${req.path} not found`
    });
}

/**
 * Async route wrapper to catch promise rejections.
 * @param {Function} fn - Async route handler
 * @returns {Function} Wrapped handler
 */
function asyncHandler(fn) {
    return (req, res, next) => {
        Promise.resolve(fn(req, res, next)).catch(next);
    };
}

module.exports = {
    ApiError,
    errorHandler,
    notFoundHandler,
    asyncHandler
};
