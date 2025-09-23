"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.authService = void 0;
const client_1 = require("@prisma/client");
const bcrypt_1 = __importDefault(require("bcrypt"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const auth_types_1 = require("../types/auth.types");
const auth_types_2 = require("../types/auth.types");
const prisma = new client_1.PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';
class AuthService {
    async login(email, password) {
        // Find user with their permissions
        const user = await prisma.user.findUnique({
            where: { email },
            include: {
                permissions: {
                    select: {
                        permission: true
                    }
                }
            }
        });
        if (!user) {
            throw new Error('Invalid credentials');
        }
        const isPasswordValid = await bcrypt_1.default.compare(password, user.password);
        if (!isPasswordValid) {
            throw new Error('Invalid credentials');
        }
        // Get permissions based on user role
        const rolePermissions = (0, auth_types_2.getPermissionsForRole)(user.role);
        // Update user permissions if needed
        const currentPermissions = user.permissions.map(up => up.permission);
        const needsUpdate = JSON.stringify(currentPermissions.sort()) !== JSON.stringify(rolePermissions.sort());
        let updatedUser = user;
        if (needsUpdate) {
            // Delete existing permissions
            await prisma.userPermission.deleteMany({
                where: { userId: user.id }
            });
            // Create new permissions
            await prisma.userPermission.createMany({
                data: rolePermissions.map(permission => ({
                    userId: user.id,
                    permission
                }))
            });
            // Fetch updated user with new permissions
            updatedUser = await prisma.user.findUnique({
                where: { id: user.id },
                include: {
                    permissions: {
                        select: {
                            permission: true
                        }
                    }
                }
            });
        }
        // Generate JWT token
        const token = jsonwebtoken_1.default.sign({
            userId: updatedUser.id,
            email: updatedUser.email,
            role: updatedUser.role,
            branch: updatedUser.branch,
            permissions: updatedUser.permissions.map(up => up.permission),
        }, JWT_SECRET, { expiresIn: '1d' });
        return {
            user: {
                id: updatedUser.id,
                email: updatedUser.email,
                name: updatedUser.name,
                role: updatedUser.role,
                permissions: updatedUser.permissions.map(up => up.permission),
                createdAt: updatedUser.createdAt,
                updatedAt: updatedUser.updatedAt
            },
            token
        };
    }
    async getCurrentUser(userId) {
        const user = await prisma.user.findUnique({
            where: { id: userId },
            include: {
                permissions: {
                    select: {
                        permission: true
                    }
                }
            }
        });
        if (!user) {
            throw new Error('User not found');
        }
        // Ensure permissions are up to date with role
        const expectedPermissions = (0, auth_types_2.getPermissionsForRole)(user.role);
        const currentPermissions = user.permissions.map(up => up.permission);
        if (JSON.stringify(currentPermissions.sort()) !== JSON.stringify(expectedPermissions.sort())) {
            return this.updateUserPermissions(user.id, expectedPermissions);
        }
        return {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role,
            permissions: currentPermissions,
            createdAt: user.createdAt,
            updatedAt: user.updatedAt
        };
    }
    async updateUserPermissions(userId, permissions) {
        // Filter out any invalid permissions
        const validPermissions = permissions.filter(p => Object.values(auth_types_1.PERMISSIONS).includes(p));
        // Delete existing permissions
        await prisma.userPermission.deleteMany({
            where: { userId }
        });
        // Create new permissions
        await prisma.userPermission.createMany({
            data: validPermissions.map(permission => ({
                userId,
                permission
            }))
        });
        // Fetch updated user with new permissions
        const updatedUser = await prisma.user.findUnique({
            where: { id: userId },
            include: {
                permissions: {
                    select: {
                        permission: true
                    }
                }
            }
        });
        if (!updatedUser) {
            throw new Error('Failed to update user permissions');
        }
        return {
            id: updatedUser.id,
            email: updatedUser.email,
            name: updatedUser.name,
            role: updatedUser.role,
            permissions: updatedUser.permissions.map(up => up.permission),
            createdAt: updatedUser.createdAt,
            updatedAt: updatedUser.updatedAt
        };
    }
}
exports.authService = new AuthService();
//# sourceMappingURL=auth.service.js.map