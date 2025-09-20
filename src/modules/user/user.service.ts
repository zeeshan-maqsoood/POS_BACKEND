import { Prisma, User, UserRole, Permission } from '@prisma/client';
import prisma from '../../loaders/prisma';
import bcrypt from 'bcrypt';
import { v4 as uuidv4 } from 'uuid';
import jwt from 'jsonwebtoken';
import { JwtPayload } from '../../types/auth.types';
import { CreateUserInput, UpdateUserInput, SafeUser, UserPermission } from '../../types/user.types';
import { ApiError } from '../../utils/apiResponse';

// Types
type UserWithPermissions = User & {
  permissions: Permission[];
};

type LoginResponse = {
  user: Omit<User, 'password'>;
  token: string;
};

const SALT_ROUNDS = 10;

// Password hashing
const hashPassword = async (password: string): Promise<string> => {
  if (!password) {
    throw ApiError.badRequest('Password is required');
  }
  return bcrypt.hash(password, SALT_ROUNDS);
};

// Helper to remove password from user object
const excludePassword = (user: User): Omit<User, 'password'> => {
  const { password, ...userWithoutPassword } = user;
  return userWithoutPassword;
};

export const userService = {
  // Create a new user
  createUser: async (data: CreateUserInput, currentUser?: JwtPayload): Promise<SafeUser> => {
    // Input validation
    if (!data.email) {
      throw ApiError.badRequest('Email is required');
    }
    if (!data.password) {
      throw ApiError.badRequest('Password is required');
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(data.email)) {
      throw ApiError.badRequest('Invalid email format');
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: data.email },
    });

    if (existingUser) {
      throw ApiError.conflict('User with this email already exists');
    }

    // Set default role if not provided
    const role = data.role || UserRole.USER;
    
    // Hash password
    const hashedPassword = await hashPassword(data.password);

    try {
      // Create user with role and permissions
      const newUser = await prisma.user.create({
        data: {
          id: uuidv4(),
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
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2002') {
          throw ApiError.conflict('A user with this email already exists');
        }
      }
      throw ApiError.internal('Failed to create user');
    }
  },

  // Create a new manager (admin only)
  createManager: async (data: Omit<CreateUserInput, 'role' | 'permissions'> & { permissions?: Permission[] }, currentUser: JwtPayload): Promise<SafeUser> => {
    if (currentUser.role !== UserRole.ADMIN) {
      throw ApiError.forbidden('Only admins can create managers');
    }
    console.log(currentUser,"currentUser")

    // Default manager permissions if none provided
    const defaultManagerPermissions: Permission[] = [
      'MENU_READ',
      'MENU_UPDATE',
      'ORDER_READ',
      'ORDER_UPDATE',
      'PRODUCT_READ',
      'USER_READ',
    ];

    return userService.createUser({
      ...data,
      role: UserRole.MANAGER,
      permissions: data.permissions || defaultManagerPermissions,
    }, currentUser);
  },

  // Get all users with pagination and filtering
  getAllUsers: async (currentUser: JwtPayload): Promise<SafeUser[]> => {
    try {
      // Only allow admins to see all users
      if (currentUser.role !== UserRole.ADMIN) {
        throw ApiError.forbidden('Only admins can view all users');
      }

      const users = await prisma.user.findMany({
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
        where:{
          role: UserRole.MANAGER
        }
      });

      return users;
    } catch (error) {
      if (error instanceof ApiError) throw error;
      throw ApiError.internal('Failed to fetch users');
    }
  },

  // Get user by ID
  getUserById: async (id: string, currentUser: JwtPayload): Promise<SafeUser | null> => {
    try {
      // Users can only view their own profile unless they're admin
      if (currentUser.role !== UserRole.ADMIN && currentUser.userId !== id) {
        throw ApiError.forbidden('You can only view your own profile');
      }

      const user = await prisma.user.findUnique({
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
      console.log(user,"user")

      if (!user) {
        throw ApiError.notFound('User not found');
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
          permission: p.permission as Permission,
          createdAt: p.createdAt
        })),
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      };
    } catch (error) {
      if (error instanceof ApiError) throw error;
      throw ApiError.internal('Failed to fetch user');
    }
  },

  // Update user
  updateUser: async (id: string, data: UpdateUserInput, currentUser: JwtPayload): Promise<SafeUser> => {
    console.log('Starting updateUser with:', { id, data, currentUserId: currentUser?.userId });
    try {
      // Get the existing user to check their current role
      const existingUser = await prisma.user.findUnique({
        where: { id },
        include: { permissions: true },
      });

      if (!existingUser) {
        throw ApiError.notFound('User not found');
      }

      // Only allow users to update their own profile or admins to update any profile
      if (currentUser.role !== UserRole.ADMIN && currentUser.userId !== id) {
        throw ApiError.forbidden('You can only update your own profile');
      }

      // Prevent role escalation and ensure managers can't be converted to other roles
      if (data.role) {
        if (currentUser.role !== UserRole.ADMIN) {
          throw ApiError.forbidden('Only admins can change user roles');
        }
        // Prevent changing role of other admins
        if (existingUser.role === UserRole.ADMIN && id !== currentUser.userId) {
          throw ApiError.forbidden('Cannot modify another admin\'s role');
        }
      }

      // If updating password, hash the new one
      if (data.password) {
        data.password = await hashPassword(data.password);
      }

      // Prepare the update data
      const updateData: any = {
        email: data.email?.toLowerCase()?.trim(),
        name: data.name?.trim(),
        role: data.role,
      };

      // Only include password if it's being updated
      if (data.password) {
        updateData.password = data.password;
      }

      // Start a transaction to ensure data consistency
      return await prisma.$transaction(async (tx) => {
        // Update the user
        const updatedUser = await tx.user.update({
          where: { id },
          data: updateData,
        });

        // Update permissions if provided
        if (data.permissions) {
          // Only admins can modify permissions
          if (currentUser.role !== UserRole.ADMIN) {
            throw ApiError.forbidden('Only admins can modify permissions');
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
          throw ApiError.notFound('User not found after update');
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
            permission: p.permission as Permission,
            createdAt: p.createdAt,
          })) as unknown as UserPermission[], // Type assertion to handle the Prisma type
          createdAt: userWithPermissions.createdAt,
          updatedAt: userWithPermissions.updatedAt,
        };
      });
    } catch (error: unknown) {
      const errorObj = error as Error & { code?: string; meta?: any; };
      console.error('Error in updateUser:', {
        error: errorObj,
        errorName: errorObj?.name,
        errorMessage: errorObj?.message,
        errorCode: errorObj?.code,
        errorStack: errorObj?.stack,
        isPrismaError: error instanceof Prisma.PrismaClientKnownRequestError,
        isApiError: error instanceof ApiError
      });

      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        console.error('Prisma error details:', {
          code: error.code,
          meta: error.meta,
          message: error.message
        });
        
        if (error.code === 'P2002') {
          const meta = error.meta as { target?: string[] };
          const field = meta?.target?.[0] || 'unknown field';
          throw ApiError.conflict(`A user with this ${field} already exists`);
        }
        if (error.code === 'P2025') {
          throw ApiError.notFound('User not found');
        }
      }
      
      if (error instanceof ApiError) {
        console.error('API Error in updateUser:', error);
        throw error;
      }
      
      console.error('Unexpected error in updateUser:', error);
      const errorMessage = errorObj?.message || 'Unknown error';
      throw ApiError.internal(`Failed to update user: ${errorMessage}`);
    }
  },

  // Delete user
  deleteUser: async (id: string, currentUser: JwtPayload): Promise<void> => {
    try {
      // Only allow admins to delete users
      if (currentUser.role !== UserRole.ADMIN) {
        throw ApiError.forbidden('Only admins can delete users');
      }

      // First delete all user permissions to avoid foreign key constraint
      await prisma.userPermission.deleteMany({
        where: { userId: id },
      });

      // Then delete the user
      await prisma.user.delete({
        where: { id },
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2025') {
          throw ApiError.notFound('User not found');
        }
      }
      console.log(error,"error")
      if (error instanceof ApiError) throw error;
      throw ApiError.internal('Failed to delete user');
    }
  },

  // User login
  login: async (email: string, password: string): Promise<LoginResponse> => {
    if (!email || !password) {
      throw ApiError.badRequest('Email and password are required');
    }

    try {
      const user = await prisma.user.findUnique({
        where: { email: email.toLowerCase().trim() },
      });

      if (!user) {
        throw ApiError.unauthorized('Invalid email or password');
      }

      const isPasswordValid = await bcrypt.compare(password, user.password);
      if (!isPasswordValid) {
        throw ApiError.unauthorized('Invalid email or password');
      }

      // Generate JWT token
      // Get user with permissions
      const userWithPermissions = await prisma.user.findUnique({
        where: { id: user.id },
        include: { permissions: true }
      });

      if (!userWithPermissions) {
        throw ApiError.unauthorized('User not found');
      }

      const token = jwt.sign(
        { 
          userId: user.id, 
          role: user.role, 
          email: user.email,
          permissions: userWithPermissions.permissions.map(p => p.permission as Permission)
        },
        process.env.JWT_SECRET || 'your-secret-key',
        { expiresIn: '1d' }
      );

      return { 
        user: excludePassword(user), 
        token 
      };
    } catch (error) {
      console.log(error,"error")
      if (error instanceof ApiError) throw error;
      throw ApiError.internal('Login failed');
    }
  },

  // Get user profile (current user)
  getProfile: async (userId: string): Promise<SafeUser> => {
    try {
      const user = await prisma.user.findUnique({
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
        throw ApiError.notFound('User not found');
      }

      return user;
    } catch (error) {
      console.log(error,"error")
      if (error instanceof ApiError) throw error;
      throw ApiError.internal('Failed to fetch profile');
    }
  },
};
