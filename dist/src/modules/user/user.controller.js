"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getProfile = exports.login = exports.logout = exports.deleteUser = exports.updateUser = exports.updateManager = exports.createManager = exports.createUser = exports.getUser = exports.getUsers = void 0;
const user_service_1 = require("./user.service");
const apiResponse_1 = require("../../utils/apiResponse");
// Controller methods
const getUsers = async (req, res) => {
    try {
        const users = await user_service_1.userService.getAllUsers(req.user);
        const response = apiResponse_1.ApiResponse.success(users, 'Users retrieved successfully');
        apiResponse_1.ApiResponse.send(res, response);
    }
    catch (error) {
        const apiError = error instanceof apiResponse_1.ApiError
            ? error
            : apiResponse_1.ApiError.internal('Error retrieving users');
        apiResponse_1.ApiResponse.send(res, new apiResponse_1.ApiResponse(false, apiError.message, null, apiError.statusCode));
    }
};
exports.getUsers = getUsers;
const getUser = async (req, res) => {
    try {
        const user = await user_service_1.userService.getUserById(req.params.id, req.user);
        if (!user) {
            throw apiResponse_1.ApiError.notFound('User not found');
        }
        const response = apiResponse_1.ApiResponse.success(user, 'User retrieved successfully');
        apiResponse_1.ApiResponse.send(res, response);
    }
    catch (error) {
        const apiError = error instanceof apiResponse_1.ApiError
            ? error
            : apiResponse_1.ApiError.internal('Error retrieving user');
        apiResponse_1.ApiResponse.send(res, new apiResponse_1.ApiResponse(false, apiError.message, null, apiError.statusCode));
    }
};
exports.getUser = getUser;
const createUser = async (req, res) => {
    try {
        const user = await user_service_1.userService.createUser(req.body, req.user);
        const response = apiResponse_1.ApiResponse.success(user, 'User created successfully', 201);
        apiResponse_1.ApiResponse.send(res, response);
    }
    catch (error) {
        const apiError = error instanceof apiResponse_1.ApiError
            ? error
            : apiResponse_1.ApiError.badRequest(error.message);
        apiResponse_1.ApiResponse.send(res, new apiResponse_1.ApiResponse(false, apiError.message, null, apiError.statusCode));
    }
};
exports.createUser = createUser;
const createManager = async (req, res) => {
    try {
        // Set default manager role and permissions if not provided
        const managerData = {
            ...req.body,
            role: 'MANAGER',
            // Default permissions for a new manager
            permissions: req.body.permissions || [
                'POS_CREATE',
                'POS_READ',
                'POS_UPDATE',
                'MENU_READ',
                'MENU_UPDATE',
                'ORDER_READ',
                'ORDER_UPDATE',
                'USER_READ',
            ],
        };
        const manager = await user_service_1.userService.createManager(managerData, req.user);
        const response = apiResponse_1.ApiResponse.success(manager, 'Manager created successfully', 201);
        apiResponse_1.ApiResponse.send(res, response);
    }
    catch (error) {
        const apiError = error instanceof apiResponse_1.ApiError
            ? error
            : apiResponse_1.ApiError.badRequest(error.message);
        apiResponse_1.ApiResponse.send(res, new apiResponse_1.ApiResponse(false, apiError.message, null, apiError.statusCode));
    }
};
exports.createManager = createManager;
const updateManager = async (req, res) => {
    try {
        const { id } = req.params;
        const updateData = {
            ...req.body,
            // Ensure role remains MANAGER
            role: 'MANAGER',
        };
        const manager = await user_service_1.userService.updateUser(id, updateData, req.user);
        const response = apiResponse_1.ApiResponse.success(manager, 'Manager updated successfully');
        apiResponse_1.ApiResponse.send(res, response);
    }
    catch (error) {
        const apiError = error instanceof apiResponse_1.ApiError
            ? error
            : apiResponse_1.ApiError.badRequest(error.message);
        apiResponse_1.ApiResponse.send(res, new apiResponse_1.ApiResponse(false, apiError.message, null, apiError.statusCode));
    }
};
exports.updateManager = updateManager;
const updateUser = async (req, res) => {
    try {
        console.log('Updating user:', {
            userId: req.params.id,
            updateData: req.body,
            currentUser: req.user
        });
        const user = await user_service_1.userService.updateUser(req.params.id, req.body, req.user);
        console.log('User updated successfully:', user);
        const response = apiResponse_1.ApiResponse.success(user, 'User updated successfully');
        apiResponse_1.ApiResponse.send(res, response);
    }
    catch (error) {
        console.error('Error updating user:', error);
        const apiError = error instanceof apiResponse_1.ApiError
            ? error
            : apiResponse_1.ApiError.internal(error.message || 'Failed to update user');
        console.error('Sending error response:', apiError);
        apiResponse_1.ApiResponse.send(res, new apiResponse_1.ApiResponse(false, apiError.message, null, apiError.statusCode));
    }
};
exports.updateUser = updateUser;
const deleteUser = async (req, res) => {
    try {
        await user_service_1.userService.deleteUser(req.params.id, req.user);
        const response = apiResponse_1.ApiResponse.success(null, 'User deleted successfully', 204);
        apiResponse_1.ApiResponse.send(res, response);
    }
    catch (error) {
        const apiError = error instanceof apiResponse_1.ApiError
            ? error
            : apiResponse_1.ApiError.badRequest(error.message);
        apiResponse_1.ApiResponse.send(res, new apiResponse_1.ApiResponse(false, apiError.message, null, apiError.statusCode));
    }
};
exports.deleteUser = deleteUser;
const logout = async (req, res) => {
    try {
        // Clear the token cookie
        res.clearCookie('token', {
            httpOnly: true,
            path: '/',
            // Must match the same options used when setting the cookie
            secure: req.secure || req.headers['x-forwarded-proto'] === 'https',
            sameSite: 'lax',
            domain: process.env.DOMAIN || undefined,
        });
        const response = apiResponse_1.ApiResponse.success(null, 'Logout successful');
        apiResponse_1.ApiResponse.send(res, response);
    }
    catch (error) {
        const apiError = error instanceof apiResponse_1.ApiError
            ? error
            : apiResponse_1.ApiError.internal('Error during logout');
        apiResponse_1.ApiResponse.send(res, new apiResponse_1.ApiResponse(false, apiError.message, null, apiError.statusCode));
    }
};
exports.logout = logout;
const login = async (req, res) => {
    try {
        const { email, password } = req.body;
        if (!email || !password) {
            throw apiResponse_1.ApiError.badRequest('Email and password are required');
        }
        const result = await user_service_1.userService.login(email, password);
        if (!result) {
            throw apiResponse_1.ApiError.unauthorized('Invalid email or password');
        }
        // Determine if the request is over HTTPS (works behind proxies too)
        const isSecure = req.secure || req.headers['x-forwarded-proto'] === 'https';
        // Single cookie configuration that works for both local (HTTP) and prod (HTTPS)
        // - httpOnly always true
        // - secure only when the request is HTTPS (prevents cookie drop on HTTP)
        // - sameSite defaults to 'lax' (works for same-site across ports); if HTTPS and you need cross-site, adjust to 'none'
        const cookieOptions = {
            httpOnly: true,
            secure: Boolean(isSecure),
            sameSite: isSecure ? 'none' : 'lax',
            maxAge: 24 * 60 * 60 * 1000, // 1 day
            path: '/',
        };
        // Set domain only if explicitly provided; otherwise keep host-only for widest compatibility
        if (process.env.DOMAIN) {
            cookieOptions.domain = process.env.DOMAIN;
        }
        res.cookie('token', result.token, cookieOptions);
        const response = apiResponse_1.ApiResponse.success(result, 'Login successful');
        apiResponse_1.ApiResponse.send(res, response);
    }
    catch (error) {
        console.log(error, "error");
        const apiError = error instanceof apiResponse_1.ApiError
            ? error
            : apiResponse_1.ApiError.unauthorized('Authentication failed');
        apiResponse_1.ApiResponse.send(res, new apiResponse_1.ApiResponse(false, apiError.message, null, apiError.statusCode));
    }
};
exports.login = login;
const getProfile = async (req, res) => {
    console.log(req.user, "user");
    try {
        if (!req.user?.userId) {
            throw apiResponse_1.ApiError.unauthorized('User not authenticated');
        }
        const user = await user_service_1.userService.getUserById(req.user.userId, req.user);
        if (!user) {
            throw apiResponse_1.ApiError.notFound('User not found');
        }
        // Include permissions and branch in response
        const response = apiResponse_1.ApiResponse.success({
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role,
            branch: user.branch || null,
            permissions: user.permissions.map(p => p.permission),
            createdAt: user.createdAt,
            updatedAt: user.updatedAt
        }, 'Profile retrieved successfully');
        apiResponse_1.ApiResponse.send(res, response);
    }
    catch (error) {
        console.log(error, "error");
        const apiError = error instanceof apiResponse_1.ApiError
            ? error
            : apiResponse_1.ApiError.internal('Error retrieving profile');
        apiResponse_1.ApiResponse.send(res, new apiResponse_1.ApiResponse(false, apiError.message, null, apiError.statusCode));
    }
};
exports.getProfile = getProfile;
//# sourceMappingURL=user.controller.js.map