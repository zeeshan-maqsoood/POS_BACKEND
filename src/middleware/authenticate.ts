import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { UserRole } from '@prisma/client';
import { JwtPayload, PERMISSIONS, Permission } from '../types/auth.types';

declare global {
  namespace Express {
    interface Request {
      user?: JwtPayload;
    }
  }
}

export const authenticate = (req: Request, res: Response, next: NextFunction) => {
  try {
    // Get token from header
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'No token provided' });
    }

    const token = authHeader.split(' ')[1];
    if (!token) {
      return res.status(401).json({ message: 'No token provided' });
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
    
    // Type guard to ensure the decoded token has the expected shape
    if (typeof decoded !== 'object' || decoded === null) {
      throw new Error('Invalid token payload');
    }

    const { userId, email, role, branch, permissions } = decoded as JwtPayload;

    // Add user to request object with properly typed permissions
    req.user = {
      userId,
      email,
      role,
      branch,
      permissions: Array.isArray(permissions)
        ? permissions.filter((p): p is Permission =>
            typeof p === 'string' && Object.values(PERMISSIONS).includes(p as any)
          )
        : []
    };

    next();
  } catch (error) {
    console.error('Authentication error:', error);
    return res.status(401).json({ message: 'Invalid or expired token' });
  }
};
