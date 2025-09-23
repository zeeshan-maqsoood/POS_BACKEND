"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.errorHandler = exports.ApiError = exports.ApiResponse = void 0;
class ApiResponse {
    static badRequest(arg0) {
        throw new Error("Method not implemented.");
    }
    constructor(success, message, data = null, statusCode = 200) {
        this.success = success;
        this.message = message;
        this.data = data;
        this.statusCode = statusCode;
    }
    static success(data, message = 'Success', statusCode = 200) {
        return new ApiResponse(true, message, data, statusCode);
    }
    static error(message = 'An error occurred', statusCode = 500) {
        return new ApiResponse(false, message, null, statusCode);
    }
    static send(res, response) {
        res.status(response.statusCode).json({
            success: response.success,
            message: response.message,
            data: response.data,
            statusCode: response.statusCode
        });
    }
}
exports.ApiResponse = ApiResponse;
class ApiError extends Error {
    constructor(statusCode, message, isOperational = true, errors) {
        super(message);
        this.statusCode = statusCode;
        this.isOperational = isOperational;
        this.errors = errors;
        this.name = this.constructor.name;
        Error.captureStackTrace(this, this.constructor);
    }
    static badRequest(message = 'Bad Request', errors) {
        return new ApiError(400, message, true, errors);
    }
    static unauthorized(message = 'Unauthorized') {
        return new ApiError(401, message);
    }
    static forbidden(message = 'Forbidden') {
        return new ApiError(403, message);
    }
    static notFound(message = 'Not Found') {
        return new ApiError(404, message);
    }
    static conflict(message = 'Conflict') {
        return new ApiError(409, message);
    }
    static internal(message = 'Internal Server Error') {
        return new ApiError(500, message);
    }
}
exports.ApiError = ApiError;
const errorHandler = (err, req, res, next) => {
    let error = { ...err };
    error.message = err.message;
    // Log to console for development
    console.error(err);
    // Handle known error types
    if (err instanceof ApiError) {
        return res.status(err.statusCode).json({
            success: false,
            message: err.message,
            error: err.errors,
            statusCode: err.statusCode
        });
    }
    // Handle JWT errors
    if (err.name === 'JsonWebTokenError') {
        const message = 'Invalid token';
        error = new ApiError(401, message);
    }
    // Handle validation errors
    if (err.name === 'ValidationError') {
        const message = Object.values(err.errors).map((val) => val.message);
        error = new ApiError(400, 'Validation Error', true, message);
    }
    // Handle duplicate field errors
    if (err.code === 11000) {
        const field = Object.keys(err.keyValue)[0];
        const message = `${field} already exists`;
        error = new ApiError(400, message);
    }
    // Handle cast errors (invalid ObjectId, etc.)
    if (err.name === 'CastError') {
        const message = `Resource not found with id of ${err.value}`;
        error = new ApiError(404, message);
    }
    // Default to 500 server error
    res.status(error.statusCode || 500).json({
        success: false,
        message: error.message || 'Server Error',
        statusCode: error.statusCode || 500
    });
};
exports.errorHandler = errorHandler;
//# sourceMappingURL=apiResponse.js.map