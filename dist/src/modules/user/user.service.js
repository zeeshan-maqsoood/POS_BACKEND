"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.userService = void 0;
const client_1 = require("@prisma/client");
const prisma_1 = __importDefault(require("../../loaders/prisma"));
const bcrypt_1 = __importDefault(require("bcrypt"));
const crypto_1 = require("crypto");
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const apiResponse_1 = require("../../utils/apiResponse");
const SALT_ROUNDS = 10;
// Password hashing
const hashPassword = async (password) => {
    if (!password) {
        throw apiResponse_1.ApiError.badRequest('Password is required');
    }
    return bcrypt_1.default.hash(password, SALT_ROUNDS);
};
// Helper to remove password from user object
const excludePassword = (user) => {
    const { password, ...userWithoutPassword } = user;
    return userWithoutPassword;
};
exports.userService = {
    // Create a new user
    createUser: async (data, currentUser) => {
        // Input validation
        if (!data.email) {
            throw apiResponse_1.ApiError.badRequest('Email is required');
        }
        if (!data.password) {
            throw apiResponse_1.ApiError.badRequest('Password is required');
        }
        // Validate email format
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(data.email)) {
            throw apiResponse_1.ApiError.badRequest('Invalid email format');
        }
        // Check if user already exists
        const existingUser = await prisma_1.default.user.findUnique({
            where: { email: data.email },
        });
        if (existingUser) {
            throw apiResponse_1.ApiError.conflict('User with this email already exists');
        }
        // Set default role if not provided
        const role = data.role || client_1.UserRole.CUSTOMER;
        // Hash password
        const hashedPassword = await hashPassword(data.password);
        try {
            // Create user with role, branch, and permissions
            const userData = {
                id: (0, crypto_1.randomUUID)(),
                email: data.email.toLowerCase().trim(),
                password: hashedPassword,
                name: data.name?.trim(),
                role,
                createdById: currentUser?.userId || null,
            };
            // Add branch if provided
            if (data.branch !== undefined) {
                userData.branch = data.branch;
            }
            const newUser = await prisma_1.default.user.create({
                data: {
                    ...userData,
                    permissions: {
                        create: (data.permissions || []).map((p) => ({
                            permission: p,
                        })),
                    },
                },
                select: {
                    id: true,
                    email: true,
                    name: true,
                    branch: true,
                    role: true,
                    permissions: {
                        select: {
                            id: true,
                            userId: true,
                            permission: true,
                            createdAt: true,
                        },
                    },
                    createdAt: true,
                    updatedAt: true,
                },
            });
            // Format the response to match SafeUser type
            return {
                id: newUser.id,
                email: newUser.email,
                name: newUser.name,
                branch: newUser.branch || null,
                role: newUser.role,
                permissions: newUser.permissions.map(p => ({
                    id: p.id,
                    userId: p.userId,
                    permission: p.permission,
                    createdAt: p.createdAt,
                })),
                createdAt: newUser.createdAt,
                updatedAt: newUser.updatedAt,
            };
        }
        catch (error) {
            if (error instanceof client_1.Prisma.PrismaClientKnownRequestError) {
                if (error.code === 'P2002') {
                    throw apiResponse_1.ApiError.conflict('A user with this email already exists');
                }
            }
            console.error('Error creating user:', error);
            throw apiResponse_1.ApiError.internal('Failed to create user');
        }
    },
    // Create a new manager (admin only)
    createManager: async (data, currentUser) => {
        if (currentUser.role !== client_1.UserRole.ADMIN) {
            throw apiResponse_1.ApiError.forbidden('Only admins can create managers');
        }
        // Default manager permissions if none provided
        const defaultManagerPermissions = [
            'POS_CREATE',
            'POS_READ',
            'POS_UPDATE',
            'MENU_READ',
            'MENU_UPDATE',
            'ORDER_READ',
            'ORDER_UPDATE',
            'PRODUCT_READ',
            'USER_READ',
        ];
        const managerData = {
            ...data,
            role: data.role || client_1.UserRole.MANAGER,
            permissions: data.permissions || defaultManagerPermissions,
        };
        // Only include branch if it's provided
        if (data.branch !== undefined) {
            managerData.branch = data.branch;
        }
        return exports.userService.createUser(managerData, currentUser);
    },
    // Get all users with pagination and filtering
    getAllUsers: async (currentUser) => {
        try {
            // Only allow admins to see all users
            if (currentUser.role !== client_1.UserRole.ADMIN) {
                throw apiResponse_1.ApiError.forbidden('Only admins can view all users');
            }
            const users = await prisma_1.default.user.findMany({
                where: {
                    role: {
                        in: [client_1.UserRole.MANAGER, client_1.UserRole.KITCHEN_STAFF],
                    },
                },
                include: {
                    permissions: {
                        select: {
                            id: true,
                            permission: true,
                            userId: true,
                            createdAt: true,
                        },
                    },
                },
                orderBy: { createdAt: 'desc' },
            });
            return users.map(user => ({
                id: user.id,
                email: user.email,
                name: user.name,
                branch: user.branch || null,
                role: user.role,
                permissions: user.permissions.map(p => ({
                    id: p.id,
                    userId: p.userId,
                    permission: p.permission,
                    createdAt: p.createdAt,
                })),
                createdAt: user.createdAt,
                updatedAt: user.updatedAt,
            }));
        }
        catch (error) {
            if (error instanceof apiResponse_1.ApiError)
                throw error;
            throw apiResponse_1.ApiError.internal('Failed to fetch users');
        }
    },
    // Get user by ID
    getUserById: async (id, currentUser) => {
        try {
            // Users can only view their own profile unless they're admin
            if (currentUser.role !== client_1.UserRole.ADMIN && currentUser.userId !== id) {
                throw apiResponse_1.ApiError.forbidden('You can only view your own profile');
            }
            const user = await prisma_1.default.user.findUnique({
                where: { id },
                include: {
                    permissions: {
                        select: {
                            id: true,
                            userId: true,
                            permission: true,
                            createdAt: true,
                        },
                    },
                },
            });
            if (!user) {
                return null;
            }
            // Return the user with permissions in the expected format
            return {
                id: user.id,
                email: user.email,
                name: user.name,
                branch: user.branch || null,
                role: user.role,
                permissions: user.permissions.map(p => ({
                    id: p.id,
                    userId: p.userId,
                    permission: p.permission,
                    createdAt: p.createdAt,
                })),
                createdAt: user.createdAt,
                updatedAt: user.updatedAt,
            };
        }
        catch (error) {
            console.error('Error fetching user by ID:', error);
            if (error instanceof apiResponse_1.ApiError)
                throw error;
            throw apiResponse_1.ApiError.internal('Failed to fetch user');
        }
    },
    // Get user profile (current user)
    getProfile: async (userId) => {
        try {
            const user = await prisma_1.default.user.findUnique({
                where: { id: userId },
                include: {
                    permissions: {
                        select: {
                            id: true,
                            userId: true,
                            permission: true,
                            createdAt: true,
                        },
                    },
                },
            });
            if (!user) {
                throw apiResponse_1.ApiError.notFound('User not found');
            }
            // Format the response to match SafeUser type
            return {
                id: user.id,
                email: user.email,
                name: user.name,
                branch: user.branch || null,
                role: user.role,
                permissions: user.permissions.map(p => ({
                    id: p.id,
                    userId: p.userId,
                    permission: p.permission,
                    createdAt: p.createdAt,
                })),
                createdAt: user.createdAt,
                updatedAt: user.updatedAt,
            };
        }
        catch (error) {
            console.error('Error fetching user profile:', error);
            if (error instanceof apiResponse_1.ApiError)
                throw error;
            throw apiResponse_1.ApiError.internal('Failed to fetch profile');
        }
    },
    // Update user
    updateUser: async (id, data, currentUser) => {
        try {
            // Check if user exists
            const existingUser = await prisma_1.default.user.findUnique({
                where: { id },
                include: { permissions: true }
            });
            if (!existingUser) {
                throw apiResponse_1.ApiError.notFound('User not found');
            }
            // Only allow admins to update users
            if (currentUser.role !== client_1.UserRole.ADMIN && currentUser.userId !== id) {
                throw apiResponse_1.ApiError.forbidden('You do not have permission to update this user');
            }
            // Prepare update data - exclude status as it's not a valid field
            const { permissions, status, ...updateData } = data;
            // Hash password if it's being updated
            if (updateData.password) {
                updateData.password = await hashPassword(updateData.password);
            }
            // Start a transaction to ensure data consistency
            return await prisma_1.default.$transaction(async (tx) => {
                // Update the user
                const updatedUser = await tx.user.update({
                    where: { id },
                    data: {
                        ...updateData,
                        ...(permissions && {
                            permissions: {
                                deleteMany: {},
                                create: permissions.map(permission => ({ permission }))
                            }
                        })
                    },
                    include: {
                        permissions: true
                    }
                });
                // Return the user with permissions in the correct format
                return {
                    id: updatedUser.id,
                    email: updatedUser.email,
                    name: updatedUser.name,
                    branch: updatedUser.branch || null,
                    role: updatedUser.role,
                    permissions: updatedUser.permissions.map(p => ({
                        id: p.id,
                        userId: p.userId,
                        permission: p.permission,
                        createdAt: p.createdAt,
                    })),
                    createdAt: updatedUser.createdAt,
                    updatedAt: updatedUser.updatedAt,
                };
            });
        }
        catch (error) {
            const errorObj = error;
            console.error('Error in updateUser:', {
                error: errorObj,
                errorName: errorObj?.name,
                errorMessage: errorObj?.message,
                errorCode: errorObj?.code,
            });
            if (error instanceof client_1.Prisma.PrismaClientKnownRequestError) {
                console.error('Prisma error details:', {
                    code: error.code,
                    meta: error.meta,
                    message: error.message,
                });
                if (error.code === 'P2002') {
                    const meta = error.meta;
                    const field = meta?.target?.[0] || 'unknown field';
                    throw apiResponse_1.ApiError.conflict(`A user with this ${field} already exists`);
                }
                if (error.code === 'P2025') {
                    throw apiResponse_1.ApiError.notFound('User not found');
                }
            }
            if (error instanceof apiResponse_1.ApiError)
                throw error;
            throw apiResponse_1.ApiError.internal(`Failed to update user: ${errorObj?.message || 'Unknown error'}`);
        }
    },
    // Delete user
    deleteUser: async (id, currentUser) => {
        try {
            // Only allow admins to delete users
            if (currentUser.role !== client_1.UserRole.ADMIN) {
                throw apiResponse_1.ApiError.forbidden('Only admins can delete users');
            }
            // First delete all user permissions to avoid foreign key constraint
            await prisma_1.default.userPermission.deleteMany({
                where: { userId: id },
            });
            // Then delete the user
            await prisma_1.default.user.delete({
                where: { id },
            });
        }
        catch (error) {
            console.error('Error deleting user:', error);
            if (error instanceof client_1.Prisma.PrismaClientKnownRequestError) {
                if (error.code === 'P2025') {
                    throw apiResponse_1.ApiError.notFound('User not found');
                }
            }
            if (error instanceof apiResponse_1.ApiError)
                throw error;
            throw apiResponse_1.ApiError.internal('Failed to delete user');
        }
    },
    // User login
    login: async (email, password) => {
        if (!email || !password) {
            throw apiResponse_1.ApiError.badRequest('Email and password are required');
        }
        try {
            const user = await prisma_1.default.user.findUnique({
                where: { email: email.toLowerCase().trim() },
                include: {
                    permissions: {
                        select: {
                            permission: true,
                        },
                    },
                },
            });
            if (!user) {
                throw apiResponse_1.ApiError.unauthorized('Invalid email or password');
            }
            // Verify password
            const isPasswordValid = await bcrypt_1.default.compare(password, user.password);
            if (!isPasswordValid) {
                throw apiResponse_1.ApiError.unauthorized('Invalid email or password');
            }
            // Generate JWT token
            const token = jsonwebtoken_1.default.sign({
                userId: user.id,
                email: user.email,
                role: user.role,
                branch: user.branch,
                permissions: user.permissions.map((p) => p.permission),
            }, process.env.JWT_SECRET || 'your-secret-key', { expiresIn: '1d' });
            // Return user data with permissions
            return {
                user: {
                    id: user.id,
                    email: user.email,
                    name: user.name,
                    branch: user.branch || null,
                    role: user.role,
                    permissions: user.permissions.map((p) => p.permission),
                    createdAt: user.createdAt,
                    updatedAt: user.updatedAt,
                },
                token,
            };
        }
        catch (error) {
            console.error('Login error:', error);
            if (error instanceof apiResponse_1.ApiError)
                throw error;
            throw apiResponse_1.ApiError.internal('Login failed');
        }
    },
};
//# sourceMappingURL=user.service.js.map