
import { PrismaClient, User, UserRole, Prisma, Permission } from '@prisma/client';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { JwtPayload, PERMISSIONS } from '../types/auth.types';
import { getPermissionsForRole } from '../types/auth.types';

const prisma = new PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

class AuthService {
  async login(email: string, password: string) {
    // Find user with their permissions and branch
    const user = await prisma.user.findUnique({ 
      where: { email },
      include: { 
        permissions: {
          select: {
            permission: true
          }
        },
        branch: {
          select: {
            id: true,
            name: true
          }
        }
      }
    });
    
    if (!user) {
      throw new Error('Invalid credentials');
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      throw new Error('Invalid credentials');
    }

    // Get permissions based on user role
    const rolePermissions = getPermissionsForRole(user.role);
    
    // Update user permissions if needed
    const currentPermissions = user.permissions.map(up => up.permission as string);
    const needsUpdate = JSON.stringify([...currentPermissions].sort()) !== JSON.stringify([...rolePermissions].sort());
    
    let updatedUser = user;
    
    if (needsUpdate) {
      // Delete existing permissions
      await prisma.userPermission.deleteMany({
        where: { userId: user.id }
      });
      
      // Create new permissions with proper typing
      const permissionData = rolePermissions.map(permission => ({
        userId: user.id,
        permission: permission as Permission
      }));
      
      // Create permissions one by one to avoid type issues with createMany
      for (const perm of permissionData) {
        await prisma.userPermission.create({
          data: {
            userId: perm.userId,
            permission: perm.permission
          }
        });
      }
      
      // Fetch updated user with new permissions and branch
      updatedUser = await prisma.user.findUnique({
        where: { id: user.id },
        include: { 
          permissions: {
            select: {
              permission: true
            }
          },
          branch: {
            select: {
              id: true,
              name: true
            }
          }
        }
      }) as any;
    }

    // Generate JWT token with branch information
    const token = jwt.sign(
      {
        userId: updatedUser.id,
        email: updatedUser.email,
        role: updatedUser.role,
        branchId: updatedUser.branch?.id || null, // Include branch ID in the token
        permissions: updatedUser.permissions.map(up => up.permission as Permission),
      } as JwtPayload,
      JWT_SECRET,
      { expiresIn: '1d' }
    );

    return { 
      user: {
        id: updatedUser.id,
        email: updatedUser.email,
        name: updatedUser.name,
        role: updatedUser.role,
        permissions: updatedUser.permissions.map(up => up.permission as Permission),
        createdAt: updatedUser.createdAt,
        updatedAt: updatedUser.updatedAt
      }, 
      token 
    };    
  }

  async getCurrentUser(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { 
        permissions: {
          select: {
            permission: true
          },
          orderBy: {
            permission: 'asc' // Ensure consistent ordering
          }
        },
        branch: {
          select: {
            id: true,
            name: true,
            address: true,
            phone: true
          }
        },
        restaurant:{
          select:{
            id:true,
            name:true,
            address:true,
            phone:true
          }
        }
      }
    });

    if (!user) {
      throw new Error('User not found');
    }

    // Get the current permissions without resetting them
    const currentPermissions = user.permissions.map(up => up.permission);
    
    // Log the permissions for debugging
    console.log(`User ${user.id} (${user.role}) permissions:`, currentPermissions);

    return {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      branch: user.branch,
      restaurant:user.restaurant,
      permissions: currentPermissions as Permission[],
      createdAt: user.createdAt,
      updatedAt: user.updatedAt
    };
  }

  private async updateUserPermissions(userId: string, permissions: string[]) {
    // Delete existing permissions
    await prisma.userPermission.deleteMany({
      where: { userId }
    });

    // Add new permissions one by one to avoid type issues
    for (const permission of permissions) {
      await prisma.userPermission.create({
        data: {
          userId,
          permission: permission as Permission
        }
      });
    }

    // Fetch updated user with new permissions
    const updatedUser = await prisma.user.findUnique({
      where: { id: userId },
      include: { 
        permissions: {
          select: {
            permission: true
          }
        },
        branch: {
          select: {
            id: true,
            name: true
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
      branch: updatedUser.branch,
      permissions: updatedUser.permissions.map(up => up.permission as Permission),
      createdAt: updatedUser.createdAt,
      updatedAt: updatedUser.updatedAt
    };
  }
}

export const authService = new AuthService();
