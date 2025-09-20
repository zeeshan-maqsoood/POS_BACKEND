import { Request, Response } from 'express';
import { userService } from './user.service';
import { ApiResponse, ApiError } from '../../utils/apiResponse';
import { JwtPayload } from '../../types/auth.types';

// Controller methods
export const getUsers = async (req: Request, res: Response) => {
  try {
    const users = await userService.getAllUsers(req.user as JwtPayload);
    const response = ApiResponse.success(users, 'Users retrieved successfully');
    ApiResponse.send(res, response);
  } catch (error: any) {
    const apiError = error instanceof ApiError 
      ? error 
      : ApiError.internal('Error retrieving users');
    ApiResponse.send(res, new ApiResponse(false, apiError.message, null, apiError.statusCode));
  }
};

export const getUser = async (req: Request, res: Response) => {
  try {
    const user = await userService.getUserById(req.params.id, req.user as JwtPayload);
    if (!user) {
      throw ApiError.notFound('User not found');
    }
    const response = ApiResponse.success(user, 'User retrieved successfully');
    ApiResponse.send(res, response);
  } catch (error: any) {
    const apiError = error instanceof ApiError 
      ? error 
      : ApiError.internal('Error retrieving user');
    ApiResponse.send(res, new ApiResponse(false, apiError.message, null, apiError.statusCode));
  }
};

export const createUser = async (req: Request, res: Response) => {
  try {
    const user = await userService.createUser(req.body, req.user as JwtPayload);
    const response = ApiResponse.success(user, 'User created successfully', 201);
    ApiResponse.send(res, response);
  } catch (error: any) {
    const apiError = error instanceof ApiError 
      ? error 
      : ApiError.badRequest(error.message);
    ApiResponse.send(res, new ApiResponse(false, apiError.message, null, apiError.statusCode));
  }
};

export const createManager = async (req: Request, res: Response) => {
  try {
    // Set default manager role and permissions if not provided
    const managerData = {
      ...req.body,
      role: 'MANAGER' as const,
      // Default permissions for a new manager
      permissions: req.body.permissions || [
        'MENU_READ',
        'MENU_UPDATE',
        'ORDER_READ',
        'ORDER_UPDATE',
        'USER_READ',
      ] as const,
    };

    const manager = await userService.createManager(managerData, req.user as JwtPayload);
    const response = ApiResponse.success(manager, 'Manager created successfully', 201);
    ApiResponse.send(res, response);
  } catch (error: any) {
    const apiError = error instanceof ApiError 
      ? error 
      : ApiError.badRequest(error.message);
    ApiResponse.send(res, new ApiResponse(false, apiError.message, null, apiError.statusCode));
  }
};

export const updateManager = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const updateData = {
      ...req.body,
      // Ensure role remains MANAGER
      role: 'MANAGER' as const,
    };

    const manager = await userService.updateUser(id, updateData, req.user as JwtPayload);
    const response = ApiResponse.success(manager, 'Manager updated successfully');
    ApiResponse.send(res, response);
  } catch (error: any) {
    const apiError = error instanceof ApiError 
      ? error 
      : ApiError.badRequest(error.message);
    ApiResponse.send(res, new ApiResponse(false, apiError.message, null, apiError.statusCode));
  }
};

export const updateUser = async (req: Request, res: Response) => {
  try {
    console.log('Updating user:', {
      userId: req.params.id,
      updateData: req.body,
      currentUser: req.user
    });
    
    const user = await userService.updateUser(req.params.id, req.body, req.user as JwtPayload);
    
    console.log('User updated successfully:', user);
    const response = ApiResponse.success(user, 'User updated successfully');
    ApiResponse.send(res, response);
  } catch (error: any) {
    console.error('Error updating user:', error);
    const apiError = error instanceof ApiError 
      ? error 
      : ApiError.internal(error.message || 'Failed to update user');
    
    console.error('Sending error response:', apiError);
    ApiResponse.send(res, new ApiResponse(false, apiError.message, null, apiError.statusCode));
  }
};

export const deleteUser = async (req: Request, res: Response) => {
  try {
    await userService.deleteUser(req.params.id, req.user as JwtPayload);
    const response = ApiResponse.success(null, 'User deleted successfully', 204);
    ApiResponse.send(res, response);
  } catch (error: any) {
    const apiError = error instanceof ApiError 
      ? error 
      : ApiError.badRequest(error.message);
    ApiResponse.send(res, new ApiResponse(false, apiError.message, null, apiError.statusCode));
  }
};

export const login = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      throw ApiError.badRequest('Email and password are required');
    }

    const result = await userService.login(email, password);
    if (!result) {
      throw ApiError.unauthorized('Invalid email or password');
    }

    // Determine if the request is over HTTPS (works behind proxies too)
    const isSecure = req.secure || req.headers['x-forwarded-proto'] === 'https';

    // Single cookie configuration that works for both local (HTTP) and prod (HTTPS)
    // - httpOnly always true
    // - secure only when the request is HTTPS (prevents cookie drop on HTTP)
    // - sameSite defaults to 'lax' (works for same-site across ports); if HTTPS and you need cross-site, adjust to 'none'
    const cookieOptions: any = {
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

    const response = ApiResponse.success(result, 'Login successful');
    ApiResponse.send(res, response);
  } catch (error: any) {
    console.log(error,"error")
    const apiError = error instanceof ApiError 
      ? error 
      : ApiError.unauthorized('Authentication failed');
    ApiResponse.send(res, new ApiResponse(false, apiError.message, null, apiError.statusCode));
  }
};

export const getProfile = async (req: Request, res: Response) => {
  console.log(req.user,"user")
  try {
    if (!req.user?.userId) {
      throw ApiError.unauthorized('User not authenticated');
    }

    const user = await userService.getUserById(req.user.userId, req.user);
    if (!user) {
      throw ApiError.notFound('User not found');
    }


    // Include permissions in response
    const response = ApiResponse.success(
      {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        permissions: user.permissions.map(p => p.permission),
        createdAt: user.createdAt,
        updatedAt: user.updatedAt
      },
      'Profile retrieved successfully'
    );

    ApiResponse.send(res, response);
  } catch (error: any) {
    console.log(error,"error")
    const apiError =
      error instanceof ApiError
        ? error
        : ApiError.internal('Error retrieving profile');

    ApiResponse.send(
      res,
      new ApiResponse(false, apiError.message, null, apiError.statusCode)
    );
  }
};