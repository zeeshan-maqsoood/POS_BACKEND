"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.authenticate = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const auth_types_1 = require("../types/auth.types");
const authenticate = (req, res, next) => {
    try {
        // Get token from header
        const authHeader = req.headers.authorization;
        if (!authHeader?.startsWith('Bearer ')) {
            return res.status(401).json({ message: 'No token provided' });
        }
        const token = authHeader.split(' ')[1];
        if (!token) {
            return res.status(401).json({ message: 'No token provided' });
        }
        // Verify token
        const decoded = jsonwebtoken_1.default.verify(token, process.env.JWT_SECRET || 'your-secret-key');
        // Type guard to ensure the decoded token has the expected shape
        if (typeof decoded !== 'object' || decoded === null) {
            throw new Error('Invalid token payload');
        }
        const { userId, email, role, branch, permissions } = decoded;
        // Add user to request object with properly typed permissions
        req.user = {
            userId,
            email,
            role,
            branch,
            permissions: Array.isArray(permissions)
                ? permissions.filter((p) => typeof p === 'string' && Object.values(auth_types_1.PERMISSIONS).includes(p))
                : []
        };
        next();
    }
    catch (error) {
        console.error('Authentication error:', error);
        return res.status(401).json({ message: 'Invalid or expired token' });
    }
};
exports.authenticate = authenticate;
//# sourceMappingURL=authenticate.js.map