import { Prisma, User, UserRole, Permission, DayOfWeek } from '@prisma/client';
import prisma from '../../loaders/prisma';
import bcrypt from 'bcrypt';
import { randomUUID } from 'crypto';
import jwt from 'jsonwebtoken';
import { JwtPayload } from '../../types/auth.types';
import { CreateUserInput, UpdateUserInput, SafeUser, UserPermission } from '../../types/user.types';
import { ApiError } from '../../utils/apiResponse';

// Types
type UserWithPermissions = User & {
  permissions: Permission[];
  branch?: string | null;
};


type LoginResponse = {
  user: Omit<SafeUser, 'permissions'> & { permissions: string[] };
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
    const role = data.role || UserRole.CUSTOMER;
    // Hash password
    const hashedPassword = await hashPassword(data.password);

    try {
      // Create user with role, branch, and permissions
      const userData: any = {
        id: randomUUID(),
        email: data.email.toLowerCase().trim(),
        password: hashedPassword,
        name: data.name?.trim(),
        role,
        createdById: currentUser?.userId || null,
      };

      // Add shift schedule if provided
      if (data.shiftSchedule !== undefined) {
        userData.shiftSchedule = data.shiftSchedule;
      }
      if (data.isShiftActive !== undefined) {
        userData.isShiftActive = data.isShiftActive;
      }

      const newUser = await prisma.user.create({
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
          branch: {
            select: {
              id: true,
              name: true,
              restaurant: {
                select: {
                  id: true,
                  name: true,
                }
              }
            }
          },
          role: true,
          status: true,
          permissions: {
            select: {
              id: true,
              userId: true,
              permission: true,
              createdAt: true,
            },
          },
          shiftSchedule: true,
          isShiftActive: true,
          createdAt: true,
          updatedAt: true,
        },
      });

      // Format the response to match SafeUser type
      return {
        id: newUser.id,
        email: newUser.email,
        name: newUser.name,
        branch: newUser.branch ? {
          id: newUser.branch.id,
          name: newUser.branch.name,
          restaurant: newUser.branch.restaurant ? {
            id: newUser.branch.restaurant.id,
            name: newUser.branch.restaurant.name,
          } : {
            id: '',
            name: '',
          }
        } : null,
        role: newUser.role,
        status: newUser.status,
        permissions: newUser.permissions.map((p: any) => ({
          id: p.id,
          userId: p.userId,
          permission: p.permission as Permission,
          createdAt: p.createdAt,
        })),
        shiftSchedule: newUser.shiftSchedule as SafeUser['shiftSchedule'] || null,
        isShiftActive: newUser.isShiftActive || false,
        createdAt: newUser.createdAt,
        updatedAt: newUser.updatedAt,
      };
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2002') {
          throw ApiError.conflict('A user with this email already exists');
        }
      }
      console.error('Error creating user:', error);
      throw ApiError.internal('Failed to create user');
    }
  },

  // Create a new manager (admin only)
  createManager: async (data: Omit<CreateUserInput, 'role' | 'permissions' | 'branch'> & {
    permissions?: Permission[];
    branch?: string | null;
    role?: UserRole; // Allow role to be passed optionally
    shiftSchedule?: {
      MONDAY?: { startTime?: string; endTime?: string };
      TUESDAY?: { startTime?: string; endTime?: string };
      WEDNESDAY?: { startTime?: string; endTime?: string };
      THURSDAY?: { startTime?: string; endTime?: string };
      FRIDAY?: { startTime?: string; endTime?: string };
      SATURDAY?: { startTime?: string; endTime?: string };
      SUNDAY?: { startTime?: string; endTime?: string };
    };

    isShiftActive?: boolean;
  }, currentUser: JwtPayload): Promise<SafeUser> => {
    if (currentUser.role !== UserRole.ADMIN) {
      throw ApiError.forbidden('Only admins can create managers');
    }
    console.log("creating manager service")
    console.log(data, "data")
    // Default manager permissions if none provided
    const defaultManagerPermissions: Permission[] = [
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

    const managerData: CreateUserInput = {
      ...data,
      role: data.role || UserRole.MANAGER,
      permissions: data.permissions || defaultManagerPermissions,
      shiftSchedule: data.shiftSchedule,
      isShiftActive: data.isShiftActive || false,
    };

    // Only include branch if it's provided
    if (data.branch !== undefined) {
      managerData.branch = data.branch;
    }

    return userService.createUser(managerData, currentUser);
  },

  // Get all users with pagination and filtering
  getAllUsers: async (currentUser: JwtPayload): Promise<SafeUser[]> => {
    try {
      // Only allow admins to see all users
      if (currentUser.role !== UserRole.ADMIN) {
        throw ApiError.forbidden('Only admins can view all users');
      }

      const users = await prisma.user.findMany({
        where: {
          role: {
            in: [UserRole.MANAGER, UserRole.KITCHEN_STAFF],
          },
        },
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          status: true,
          permissions: {
            select: {
              id: true,
              permission: true,
              userId: true,
              createdAt: true,

            },
          },
          shiftSchedule: true,
          isShiftActive: true,
          createdAt: true,
          updatedAt: true,
          branch: {
            select: {
              id: true,
              name: true,
              restaurant: {
                select: {
                  id: true,
                  name: true,
                }
              }
            }
          }
        },
        orderBy: { createdAt: 'desc' },
      });

      return users.map(user => ({
        id: user.id,
        email: user.email,
        name: user.name,
        branch: user.branch ? {
          id: user.branch.id,
          name: user.branch.name,
          restaurant: user.branch.restaurant ? {
            id: user.branch.restaurant.id,
            name: user.branch.restaurant.name,
          } : null
        } : null,
        role: user.role,
        permissions: user.permissions.map((p: any) => ({
          id: p.id,
          userId: p.userId,
          permission: p.permission as Permission,
          createdAt: p.createdAt,
        })),
        shiftSchedule: user.shiftSchedule as SafeUser['shiftSchedule'] || null,
        isShiftActive: user.isShiftActive || false,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
        status: user.status
      }));
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
        select: {
          id: true,
          email: true,
          name: true,
          branch: {
            select: {
              id: true,
              name: true,
              restaurant: {
                select: {
                  id: true,
                  name: true,
                }
              }
            }
          },
          role: true,
          status: true,
          permissions: {
            select: {
              id: true,
              userId: true,
              permission: true,
              createdAt: true,
            },
          },
          shiftSchedule: true,
          isShiftActive: true,
          createdAt: true,
          updatedAt: true,
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
        branch: user.branch ? {
          id: user.branch.id,
          name: user.branch.name,
          restaurant: user.branch.restaurant ? {
            id: user.branch.restaurant.id,
            name: user.branch.restaurant.name,
          } : {
            id: '',
            name: '',
          }
        } : null,
        role: user.role,
        permissions: user.permissions.map(p => ({
          id: p.id,
          userId: p.userId,
          permission: p.permission as Permission,
          createdAt: p.createdAt,
        })),
        shiftSchedule: user.shiftSchedule as SafeUser['shiftSchedule'] || null,
        isShiftActive: user.isShiftActive,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
        status: user.status
      };
    } catch (error) {
      console.error('Error fetching user by ID:', error);
      if (error instanceof ApiError) throw error;
      throw ApiError.internal('Failed to fetch user');
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
          branch: {
            select: {
              id: true,
              name: true,
              restaurant: {
                select: {
                  id: true,
                  name: true,
                }
              }
            }
          },
          role: true,
          status: true,
          permissions: {
            select: {
              id: true,
              userId: true,
              permission: true,
              createdAt: true,
            },
          },
          shiftSchedule: true,
          isShiftActive: true,
          createdAt: true,
          updatedAt: true,
        },
      });

      if (!user) {
        throw ApiError.notFound('User not found');
      }

      // Format the response to match SafeUser type
      return {
        id: user.id,
        email: user.email,
        name: user.name,
        branch: user.branch ? {
          id: user.branch.id,
          name: user.branch.name,
          restaurant: user.branch.restaurant ? {
            id: user.branch.restaurant.id,
            name: user.branch.restaurant.name,
          } : {
            id: '',
            name: '',
          }
        } : null,
        role: user.role,
        permissions: user.permissions.map(p => ({
          id: p.id,
          userId: p.userId,
          permission: p.permission as Permission,
          createdAt: p.createdAt,
        })),
        shiftSchedule: user.shiftSchedule as SafeUser['shiftSchedule'] || null,
        isShiftActive: user.isShiftActive,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
        status: user.status
      };
    } catch (error) {
      console.error('Error fetching user profile:', error);
      if (error instanceof ApiError) throw error;
      throw ApiError.internal('Failed to fetch profile');
    }
  },

  // Update user
  updateUser: async (id: string, data: UpdateUserInput, currentUser: JwtPayload): Promise<SafeUser> => {
    try {
      // Check if user exists
      const existingUser = await prisma.user.findUnique({
        where: { id },
        select: {
          id: true,
          permissions: {
            select: {
              id: true,
              permission: true,
            }
          }
        }
      });
      console.log(data, "data")
      if (!existingUser) {
        throw ApiError.notFound('User not found');
      }

      // Only allow admins to update users
      if (currentUser.role !== UserRole.ADMIN && currentUser.userId !== id) {
        throw ApiError.forbidden('You do not have permission to update this user');
      }

      // Prepare update data - exclude status as it's not a valid field
      const { permissions, ...updateData } = data;

      // Hash password if it's being updated
      if (updateData.password) {
        updateData.password = await hashPassword(updateData.password);
      }

      // Start a transaction to ensure data consistency
      return await prisma.$transaction(async (tx) => {
        // Update the user
        const updatedUser = await tx.user.update({
          where: { id },
          data: {
            ...(updateData as any),
            ...(data.permissions && {
              permissions: {
                deleteMany: {},
                create: data.permissions.map((permission: Permission) => ({ permission }))
              }
            })
          },
          select: {
            id: true,
            email: true,
            name: true,
            branch: {
              select: {
                id: true,
                name: true,
                restaurant: {
                  select: {
                    id: true,
                    name: true,
                  }
                }
              }
            },
            role: true,
            status: true,
            permissions: {
              select: {
                id: true,
                userId: true,
                permission: true,
                createdAt: true,
              },
            },
            shiftSchedule: true,
            isShiftActive: true,
            createdAt: true,
            updatedAt: true,
          }
        });

        // Return the user with permissions in the correct format
        return {
          id: updatedUser.id,
          email: updatedUser.email,
          name: updatedUser.name,
          branch: updatedUser.branch ? {
            id: updatedUser.branch.id,
            name: updatedUser.branch.name,
            restaurant: updatedUser.branch.restaurant ? {
              id: updatedUser.branch.restaurant.id,
              name: updatedUser.branch.restaurant.name,
            } : null
          } : null,
          role: updatedUser.role,
          status: updatedUser.status,
          permissions: updatedUser.permissions.map((p: any) => ({
            id: p.id,
            userId: p.userId,
            permission: p.permission as Permission,
            createdAt: p.createdAt,
          })),
          shiftSchedule: updatedUser.shiftSchedule as SafeUser['shiftSchedule'],
          isShiftActive: updatedUser.isShiftActive,
          createdAt: updatedUser.createdAt,
          updatedAt: updatedUser.updatedAt,
        };
      });
    } catch (error: unknown) {
      const errorObj = error as Error & { code?: string; meta?: any; };
      console.error('Error in updateUser:', {
        error: errorObj,
        errorName: errorObj?.name,
        errorMessage: errorObj?.message,
        errorCode: errorObj?.code,
      });

      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        console.error('Prisma error details:', {
          code: error.code,
          meta: error.meta,
          message: error.message,
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

      if (error instanceof ApiError) throw error;

      throw ApiError.internal(`Failed to update user: ${errorObj?.message || 'Unknown error'}`);
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
      console.error('Error deleting user:', error);
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2025') {
          throw ApiError.notFound('User not found');
        }
      }
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
        select: {
          id: true,
          email: true,
          name: true,
          branch: {
            select: {
              id: true,
              name: true,
              restaurant: {
                select: {
                  id: true,
                  name: true,
                }
              }
            }
          },
          role: true,
          status: true,
          password: true,
          createdAt: true,
          updatedAt: true,
          permissions: {
            select: {
              permission: true,
            },
          },
        },
      });

      if (!user) {
        throw ApiError.unauthorized('Invalid email or password');
      }

      // Verify password
      const isPasswordValid = await bcrypt.compare(password, user.password);
      if (!isPasswordValid) {
        throw ApiError.unauthorized('Invalid email or password');
      }

      // Generate JWT token
      const token = jwt.sign(
        {
          userId: user.id,
          email: user.email,
          role: user.role,
          branch: user.branch ? {
            id: user.branch.id,
            name: user.branch.name,
            restaurant: user.branch.restaurant ? {
              id: user.branch.restaurant.id,
              name: user.branch.restaurant.name,
            } : null
          } : null,
          permissions: user.permissions.map((p) => p.permission),
        },
        process.env.JWT_SECRET || 'your-secret-key',
        { expiresIn: '1d' },
      );

      // Return user data with permissions
      return {
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          branch: user.branch ? {
            id: user.branch.id,
            name: user.branch.name,
            restaurant: user.branch.restaurant ? {
              id: user.branch.restaurant.id,
              name: user.branch.restaurant.name,
            } : null
          } : null,
          role: user.role,
          status: user.status,
          permissions: user.permissions.map((p) => p.permission),
          createdAt: user.createdAt,
          updatedAt: user.updatedAt,
        },
        token,
      };
    } catch (error) {
      console.error('Login error:', error);
      if (error instanceof ApiError) throw error;
      throw ApiError.internal('Login failed');
    }
  },
};
