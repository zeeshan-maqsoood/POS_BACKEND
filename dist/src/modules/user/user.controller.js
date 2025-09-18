"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getProfile = exports.login = exports.deleteUser = exports.updateUser = exports.updateManager = exports.createManager = exports.createUser = exports.getUser = exports.getUsers = void 0;
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
        const user = await user_service_1.userService.updateUser(req.params.id, req.body, req.user);
        const response = apiResponse_1.ApiResponse.success(user, 'User updated successfully');
        apiResponse_1.ApiResponse.send(res, response);
    }
    catch (error) {
        const apiError = error instanceof apiResponse_1.ApiError
            ? error
            : apiResponse_1.ApiError.badRequest(error.message);
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
        const cookieOptions = {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
            maxAge: 24 * 60 * 60 * 1000, // 1 day
            path: '/',
        };
        // Only set domain in production
        if (process.env.NODE_ENV === 'production' && process.env.DOMAIN) {
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
        // Include permissions in response
        const response = apiResponse_1.ApiResponse.success({
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role,
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