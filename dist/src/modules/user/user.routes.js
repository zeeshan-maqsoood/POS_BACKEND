"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const userController = __importStar(require("./user.controller"));
const auth_middleware_1 = require("../../middleware/auth.middleware");
const client_1 = require("@prisma/client");
const client_2 = require("@prisma/client");
const router = (0, express_1.Router)();
// Public routes (no authentication required)
router.post("/login", userController.login);
router.post("/logout", userController.logout);
// Apply authentication middleware to all routes below this line
router.use(auth_middleware_1.authenticateJWT);
// Protected routes (require authentication)
router.get("/profile", userController.getProfile);
// GET all users (needs permission)
router.get("/", (0, auth_middleware_1.checkPermission)([client_2.Permission.USER_READ]), userController.getUsers);
// Regular user routes
router.post("/", (0, auth_middleware_1.checkPermission)([client_2.Permission.USER_CREATE]), userController.createUser);
// GET user by ID (needs permission)
router.get("/:id", (0, auth_middleware_1.checkPermission)([client_2.Permission.USER_READ]), userController.getUser);
// UPDATE user (needs permission)
router.put("/:id", (req, res, next) => {
    console.log('Update user route hit', {
        method: req.method,
        url: req.url,
        params: req.params,
        body: req.body
    });
    next();
}, (0, auth_middleware_1.checkPermission)([client_2.Permission.USER_UPDATE]), userController.updateUser);
// Manager specific update route
router.put("/managers/:id", (0, auth_middleware_1.checkRole)([client_1.UserRole.ADMIN]), (0, auth_middleware_1.checkPermission)([client_2.Permission.USER_UPDATE]), userController.updateManager);
// DELETE user (needs Admin role)
router.delete("/:id", (0, auth_middleware_1.checkRole)([client_1.UserRole.ADMIN]), userController.deleteUser);
// GET profile (needs permission)
router.get("/profile", (0, auth_middleware_1.checkPermission)([client_2.Permission.USER_READ]), userController.getProfile);
exports.default = router;
//# sourceMappingURL=user.routes.js.map