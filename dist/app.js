"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const morgan_1 = __importDefault(require("morgan"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const modules_1 = __importDefault(require("./src/modules"));
const client_1 = require("@prisma/client");
const http_status_1 = __importDefault(require("http-status"));
const cookieParser = require('cookie-parser');
const app = (0, express_1.default)();
// Security middleware
app.use((0, helmet_1.default)());
// CORS configuration - Allow all origins while supporting credentials
const corsOptions = {
    origin: true, // Reflects the request origin
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
    allowedHeaders: [
        'Origin',
        'X-Requested-With',
        'Content-Type',
        'Accept',
        'Authorization',
        'X-CSRF-Token',
    ],
    exposedHeaders: ['set-cookie', 'token', 'Authorization'],
};
// Ensure caches and proxies vary by Origin when reflecting origin
app.use((req, res, next) => {
    res.header('Vary', 'Origin');
    next();
});
app.use((0, cors_1.default)(corsOptions));
// Explicitly handle preflight across all routes (Express 5 safe)
app.use((req, res, next) => {
    if (req.method === 'OPTIONS') {
        return res.sendStatus(204);
    }
    next();
});
app.use(cookieParser());
// Rate limiting
// app.use(apiLimiter);
// Parse JSON bodies
app.use(express_1.default.json({ limit: '10kb' }));
// Logging
if (process.env.NODE_ENV === 'development') {
    app.use((0, morgan_1.default)('dev'));
}
// Health check endpoint
app.get('/health', (_req, res) => {
    res.status(200).json({ status: 'ok', timestamp: new Date() });
});
app.get("/", (req, res) => {
    res.send("Hello world");
});
// Register API routes
app.use('/api', modules_1.default);
// 404 handler
app.use((_req, res) => {
    res.status(404).json({
        status: 'error',
        message: 'Not Found | Please check the URL',
    });
});
// Error handling middleware
app.use((err, _req, res, _next) => {
    // Handle Prisma errors
    if (err instanceof client_1.Prisma.PrismaClientKnownRequestError) {
        // Handle specific Prisma errors
        if (err.code === 'P2002') {
            return res.status(http_status_1.default.CONFLICT).json({
                status: 'error',
                message: 'A unique constraint was violated',
            });
        }
        return res.status(http_status_1.default.BAD_REQUEST).json({
            status: 'error',
            message: 'Database error occurred',
        });
    }
    // Handle JWT errors
    if (err.name === 'JsonWebTokenError') {
        return res.status(http_status_1.default.UNAUTHORIZED).json({
            status: 'error',
            message: 'Invalid token',
        });
    }
    // Handle JWT expired error
    if (err.name === 'TokenExpiredError') {
        return res.status(http_status_1.default.UNAUTHORIZED).json({
            status: 'error',
            message: 'Token expired',
        });
    }
    // Handle other errors
    const statusCode = err.statusCode || http_status_1.default.INTERNAL_SERVER_ERROR;
    const message = err.message || 'Internal Server Error';
    if (process.env.NODE_ENV === 'development') {
        console.error(err);
        return res.status(statusCode).json({
            status: 'error',
            message,
            stack: err.stack,
        });
    }
    return res.status(statusCode).json({
        status: 'error',
        message,
    });
});
exports.default = app;
//# sourceMappingURL=app.js.map