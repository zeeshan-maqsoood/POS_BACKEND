"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.userService = void 0;
const client_1 = require("@prisma/client");
const prisma_1 = __importDefault(require("../../loaders/prisma"));
const bcrypt_1 = __importDefault(require("bcrypt"));
const uuid_1 = require("uuid");
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
        const role = data.role || client_1.UserRole.USER;
        // Hash password
        const hashedPassword = await hashPassword(data.password);
        try {
            // Create user with role and permissions
            const newUser = await prisma_1.default.user.create({
                data: {
                    id: (0, uuid_1.v4)(),
                    email: data.email.toLowerCase().trim(),
                    password: hashedPassword,
                    name: data.name?.trim(),
                    role,
                    createdById: currentUser?.userId || null,
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
                    role: true,
                    permissions: true,
                    createdAt: true,
                    updatedAt: true,
                },
            });
            return newUser;
        }
        catch (error) {
            if (error instanceof client_1.Prisma.PrismaClientKnownRequestError) {
                if (error.code === 'P2002') {
                    throw apiResponse_1.ApiError.conflict('A user with this email already exists');
                }
            }
            throw apiResponse_1.ApiError.internal('Failed to create user');
        }
    },
    // Create a new manager (admin only)
    createManager: async (data, currentUser) => {
        if (currentUser.role !== client_1.UserRole.ADMIN) {
            throw apiResponse_1.ApiError.forbidden('Only admins can create managers');
        }
        console.log(currentUser, "currentUser");
        // Default manager permissions if none provided
        const defaultManagerPermissions = [
            'MENU_READ',
            'MENU_UPDATE',
            'ORDER_READ',
            'ORDER_UPDATE',
            'PRODUCT_READ',
            'USER_READ',
        ];
        return exports.userService.createUser({
            ...data,
            role: client_1.UserRole.MANAGER,
            permissions: data.permissions || defaultManagerPermissions,
        }, currentUser);
    },
    // Get all users with pagination and filtering
    getAllUsers: async (currentUser) => {
        try {
            // Only allow admins to see all users
            if (currentUser.role !== client_1.UserRole.ADMIN) {
                throw apiResponse_1.ApiError.forbidden('Only admins can view all users');
            }
            const users = await prisma_1.default.user.findMany({
                select: {
                    id: true,
                    email: true,
                    name: true,
                    role: true,
                    permissions: true,
                    createdAt: true,
                    updatedAt: true,
                },
                orderBy: { createdAt: 'desc' },
                where: {
                    role: client_1.UserRole.MANAGER
                }
            });
            return users;
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
                            createdAt: true
                        }
                    }
                },
            });
            console.log(user, "user");
            if (!user) {
                throw apiResponse_1.ApiError.notFound('User not found');
            }
            // Return the user with permissions in the expected format
            return {
                id: user.id,
                email: user.email,
                name: user.name,
                role: user.role,
                permissions: user.permissions.map(p => ({
                    id: p.id,
                    userId: p.userId,
                    permission: p.permission,
                    createdAt: p.createdAt
                })),
                createdAt: user.createdAt,
                updatedAt: user.updatedAt,
            };
        }
        catch (error) {
            if (error instanceof apiResponse_1.ApiError)
                throw error;
            throw apiResponse_1.ApiError.internal('Failed to fetch user');
        }
    },
    // Update user
    updateUser: async (id, data, currentUser) => {
        try {
            // Get the existing user to check their current role
            const existingUser = await prisma_1.default.user.findUnique({
                where: { id },
                include: { permissions: true },
            });
            if (!existingUser) {
                throw apiResponse_1.ApiError.notFound('User not found');
            }
            // Only allow users to update their own profile or admins to update any profile
            if (currentUser.role !== client_1.UserRole.ADMIN && currentUser.userId !== id) {
                throw apiResponse_1.ApiError.forbidden('You can only update your own profile');
            }
            // Prevent role escalation and ensure managers can't be converted to other roles
            if (data.role) {
                if (currentUser.role !== client_1.UserRole.ADMIN) {
                    throw apiResponse_1.ApiError.forbidden('Only admins can change user roles');
                }
                // Prevent changing role of other admins
                if (existingUser.role === client_1.UserRole.ADMIN && id !== currentUser.userId) {
                    throw apiResponse_1.ApiError.forbidden('Cannot modify another admin\'s role');
                }
            }
            // If updating password, hash the new one
            if (data.password) {
                data.password = await hashPassword(data.password);
            }
            // Prepare the update data
            const updateData = {
                email: data.email?.toLowerCase()?.trim(),
                name: data.name?.trim(),
                role: data.role,
            };
            // Only include password if it's being updated
            if (data.password) {
                updateData.password = data.password;
            }
            // Start a transaction to ensure data consistency
            return await prisma_1.default.$transaction(async (tx) => {
                // Update the user
                const updatedUser = await tx.user.update({
                    where: { id },
                    data: updateData,
                });
                // Update permissions if provided
                if (data.permissions) {
                    // Only admins can modify permissions
                    if (currentUser.role !== client_1.UserRole.ADMIN) {
                        throw apiResponse_1.ApiError.forbidden('Only admins can modify permissions');
                    }
                    // Delete existing permissions
                    await tx.userPermission.deleteMany({
                        where: { userId: id },
                    });
                    // Create new permissions
                    if (data.permissions.length > 0) {
                        await tx.userPermission.createMany({
                            data: data.permissions.map(permission => ({
                                userId: id,
                                permission,
                            })),
                        });
                    }
                }
                // Fetch the updated user with permissions
                const userWithPermissions = await tx.user.findUnique({
                    where: { id },
                    include: { permissions: true },
                });
                if (!userWithPermissions) {
                    throw apiResponse_1.ApiError.notFound('User not found after update');
                }
                // Return the user with permissions in the correct format
                return {
                    id: userWithPermissions.id,
                    email: userWithPermissions.email,
                    name: userWithPermissions.name,
                    role: userWithPermissions.role,
                    permissions: userWithPermissions.permissions.map(p => ({
                        id: p.id,
                        userId: p.userId,
                        permission: p.permission,
                        createdAt: p.createdAt,
                    })), // Type assertion to handle the Prisma type
                    createdAt: userWithPermissions.createdAt,
                    updatedAt: userWithPermissions.updatedAt,
                };
            });
        }
        catch (error) {
            if (error instanceof client_1.Prisma.PrismaClientKnownRequestError) {
                if (error.code === 'P2002') {
                    throw apiResponse_1.ApiError.conflict('A user with this email already exists');
                }
                if (error.code === 'P2025') {
                    throw apiResponse_1.ApiError.notFound('User not found');
                }
            }
            if (error instanceof apiResponse_1.ApiError)
                throw error;
            throw apiResponse_1.ApiError.internal('Failed to update user');
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
            if (error instanceof client_1.Prisma.PrismaClientKnownRequestError) {
                if (error.code === 'P2025') {
                    throw apiResponse_1.ApiError.notFound('User not found');
                }
            }
            console.log(error, "error");
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
            });
            if (!user) {
                throw apiResponse_1.ApiError.unauthorized('Invalid email or password');
            }
            const isPasswordValid = await bcrypt_1.default.compare(password, user.password);
            if (!isPasswordValid) {
                throw apiResponse_1.ApiError.unauthorized('Invalid email or password');
            }
            // Generate JWT token
            // Get user with permissions
            const userWithPermissions = await prisma_1.default.user.findUnique({
                where: { id: user.id },
                include: { permissions: true }
            });
            if (!userWithPermissions) {
                throw apiResponse_1.ApiError.unauthorized('User not found');
            }
            const token = jsonwebtoken_1.default.sign({
                userId: user.id,
                role: user.role,
                email: user.email,
                permissions: userWithPermissions.permissions.map(p => p.permission)
            }, process.env.JWT_SECRET || 'your-secret-key', { expiresIn: '1d' });
            return {
                user: excludePassword(user),
                token
            };
        }
        catch (error) {
            console.log(error, "error");
            if (error instanceof apiResponse_1.ApiError)
                throw error;
            throw apiResponse_1.ApiError.internal('Login failed');
        }
    },
    // Get user profile (current user)
    getProfile: async (userId) => {
        try {
            const user = await prisma_1.default.user.findUnique({
                where: { id: userId },
                select: {
                    id: true,
                    email: true,
                    name: true,
                    role: true,
                    permissions: true,
                    createdAt: true,
                    updatedAt: true,
                },
            });
            if (!user) {
                throw apiResponse_1.ApiError.notFound('User not found');
            }
            return user;
        }
        catch (error) {
            console.log(error, "error");
            if (error instanceof apiResponse_1.ApiError)
                throw error;
            throw apiResponse_1.ApiError.internal('Failed to fetch profile');
        }
    },
};
//# sourceMappingURL=user.service.js.map