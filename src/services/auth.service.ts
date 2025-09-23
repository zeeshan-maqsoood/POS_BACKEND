
import { PrismaClient, User, UserRole, Prisma } from '@prisma/client';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { JwtPayload, Permission, PERMISSIONS } from '../types/auth.types';
import { getPermissionsForRole } from '../types/auth.types';

const prisma = new PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

class AuthService {
  async login(email: string, password: string) {
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

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      throw new Error('Invalid credentials');
    }

    // Get permissions based on user role
    const rolePermissions = getPermissionsForRole(user.role);
    
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
      }) as typeof user;
    }

    // Generate JWT token
    const token = jwt.sign(
      {
        userId: updatedUser.id,
        email: updatedUser.email,
        role: updatedUser.role,
        branch: updatedUser.branch,
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
          }
        }
      }
    });

    if (!user) {
      throw new Error('User not found');
    }

    // Ensure permissions are up to date with role
    const expectedPermissions = getPermissionsForRole(user.role);
    const currentPermissions = user.permissions.map(up => up.permission);
    
    if (JSON.stringify(currentPermissions.sort()) !== JSON.stringify(expectedPermissions.sort())) {
      return this.updateUserPermissions(user.id, expectedPermissions);
    }

    return {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      permissions: currentPermissions as Permission[],
      createdAt: user.createdAt,
      updatedAt: user.updatedAt
    };
  }

  private async updateUserPermissions(userId: string, permissions: Permission[]) {
    // Filter out any invalid permissions
    const validPermissions = permissions.filter(p => 
      Object.values(PERMISSIONS).includes(p as any)
    );

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
      permissions: updatedUser.permissions.map(up => up.permission as Permission),
      createdAt: updatedUser.createdAt,
      updatedAt: updatedUser.updatedAt
    };
  }
}

export const authService = new AuthService();
