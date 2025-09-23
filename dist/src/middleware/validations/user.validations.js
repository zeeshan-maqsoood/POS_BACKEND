"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.validate = exports.loginSchema = exports.updateUserSchema = exports.createUserSchema = void 0;
const joi_1 = __importDefault(require("joi"));
const client_1 = require("@prisma/client");
// Request validation schemas
exports.createUserSchema = joi_1.default.object({
    email: joi_1.default.string().email().required(),
    password: joi_1.default.string().min(8).required(),
    name: joi_1.default.string(),
    branch: joi_1.default.string().allow('').optional(),
    role: joi_1.default.string().valid(...Object.values(client_1.UserRole)),
    permissions: joi_1.default.array().items(joi_1.default.string())
});
exports.updateUserSchema = joi_1.default.object({
    email: joi_1.default.string().email(),
    name: joi_1.default.string(),
    branch: joi_1.default.string().allow('').optional(),
    role: joi_1.default.string().valid(...Object.values(client_1.UserRole)),
    permissions: joi_1.default.array().items(joi_1.default.string())
}).min(1);
exports.loginSchema = joi_1.default.object({
    email: joi_1.default.string().email().required(),
    password: joi_1.default.string().required()
});
// Validation middleware
const validate = (schema) => {
    return (req, res, next) => {
        const { error } = schema.validate(req.body);
        if (error) {
            return res.status(400).json({
                status: 'error',
                message: 'Validation error',
                details: error.details.map(d => d.message)
            });
        }
        next();
    };
};
exports.validate = validate;
//# sourceMappingURL=user.validations.js.map