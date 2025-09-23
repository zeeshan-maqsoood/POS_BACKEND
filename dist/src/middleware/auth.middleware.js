"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateRequest = exports.apiLimiter = exports.checkPermission = exports.checkRole = exports.authenticateJWT = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
const auth_types_1 = require("../types/auth.types");
const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key";
/**
 * 🔑 Authentication Middleware
 */
const authenticateJWT = (req, res, next) => {
    // Gather potential tokens
    const authHeader = req.headers.authorization;
    const headerToken = authHeader && authHeader.startsWith('Bearer ')
        ? authHeader.split(' ')[1]
        : undefined;
    const cookieToken = req.cookies?.token;
    if (!headerToken && !cookieToken) {
        return res.status(401).json({ message: 'No token provided' });
    }
    // Helper to verify and attach user
    const tryVerify = (token) => {
        if (!token)
            return null;
        try {
            const decoded = jsonwebtoken_1.default.verify(token, JWT_SECRET);
            if (!decoded?.userId || !decoded?.role)
                return null;
            return decoded;
        }
        catch {
            return null;
        }
    };
    // Prefer header token, but fall back to cookie token if header invalid
    let decoded = tryVerify(headerToken);
    const source = decoded ? 'header' : (decoded = tryVerify(cookieToken)) ? 'cookie' : null;
    if (!decoded || !source) {
        return res.status(403).json({ message: 'Invalid or expired token' });
    }
    // Attach user to request
    req.user = {
        userId: decoded.userId,
        email: decoded.email,
        role: decoded.role,
        branch: decoded.branch,
        permissions: decoded.permissions || [],
        iat: decoded.iat,
        exp: decoded.exp,
    };
    next();
};
exports.authenticateJWT = authenticateJWT;
/**
 * 🔑 Role-based Access Middleware
 */
const checkRole = (roles) => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({ message: "Not authenticated" });
        }
        if (!roles.includes(req.user.role)) {
            return res.status(403).json({ message: "Insufficient role permissions" });
        }
        next();
    };
};
exports.checkRole = checkRole;
/**
 * 🔑 Permission-based Access Middleware
 */
const checkPermission = (permissions) => {
    console.log(permissions, "permissions2222");
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({ message: "Not authenticated" });
        }
        if (!(0, auth_types_1.hasPermission)(req.user, permissions)) {
            return res.status(403).json({
                message: "Insufficient permissions",
                required: permissions,
                has: req.user.permissions,
            });
        }
        next();
    };
};
exports.checkPermission = checkPermission;
/**
 * 🔑 Rate Limiter
 */
exports.apiLimiter = (0, express_rate_limit_1.default)({
    windowMs: 15 * 60 * 1000, // 15 min
    max: 100, // limit each IP
    message: "Too many requests from this IP, please try again later",
});
const validateRequest = (schema) => {
    return (req, res, next) => {
        try {
            const dataToValidate = {};
            const validationErrors = {};
            // Validate body if schema exists
            if (schema.body) {
                const { error, value } = schema.body.validate(req.body, { abortEarly: false });
                if (error) {
                    validationErrors.body = error.details.map((detail) => detail.message);
                }
                else {
                    dataToValidate.body = value;
                }
            }
            // Validate params if schema exists
            if (schema.params) {
                const { error, value } = schema.params.validate(req.params, { abortEarly: false });
                if (error) {
                    validationErrors.params = error.details.map((detail) => detail.message);
                }
                else {
                    dataToValidate.params = value;
                }
            }
            // Validate query if schema exists
            if (schema.query) {
                const { error, value } = schema.query.validate(req.query, { abortEarly: false });
                if (error) {
                    validationErrors.query = error.details.map((detail) => detail.message);
                }
                else {
                    dataToValidate.query = value;
                }
            }
            // If there are validation errors, return them
            if (Object.keys(validationErrors).length > 0) {
                return res.status(400).json({
                    status: 'error',
                    message: 'Validation error',
                    errors: validationErrors
                });
            }
            // Replace request data with validated data
            if (dataToValidate.body)
                req.body = dataToValidate.body;
            if (dataToValidate.params)
                req.params = dataToValidate.params;
            if (dataToValidate.query)
                req.query = dataToValidate.query;
            next();
        }
        catch (error) {
            console.error('Validation error:', error);
            return res.status(500).json({
                status: 'error',
                message: 'Internal server error during validation'
            });
        }
    };
};
exports.validateRequest = validateRequest;
//# sourceMappingURL=auth.middleware.js.map