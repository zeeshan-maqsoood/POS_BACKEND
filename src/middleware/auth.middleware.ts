import { RequestHandler } from "express";
import jwt from "jsonwebtoken";
import rateLimit from "express-rate-limit";
import { hasPermission, JwtPayload, Permission } from "../types/auth.types";
import { UserRole } from "@prisma/client";

// Extend Express types
declare global {
  namespace Express {
    interface Request {
      user?: JwtPayload;
    }
  }
}

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key";

/**
 * 🔑 Authentication Middleware
 */
export const authenticateJWT: RequestHandler = (req, res, next) => {
  // Gather potential tokens
  const authHeader = req.headers.authorization;
  const headerToken = authHeader && authHeader.startsWith('Bearer ')
    ? authHeader.split(' ')[1]
    : undefined;
  const cookieToken = req.cookies?.token;

  if (!headerToken && !cookieToken) {
    return res.status(401).json({ message: 'No token provided' });
  }

  // Helper to verify and attach user
  const tryVerify = (token?: string) => {
    if (!token) return null;
    try {
      const decoded = jwt.verify(token, JWT_SECRET) as JwtPayload;
      if (!decoded?.userId || !decoded?.role) return null;
      return decoded;
    } catch {
      return null;
    }
  };

  // Prefer header token, but fall back to cookie token if header invalid
  let decoded = tryVerify(headerToken);
  const source = decoded ? 'header' : (decoded = tryVerify(cookieToken)) ? 'cookie' : null;

  if (!decoded || !source) {
    return res.status(403).json({ message: 'Invalid or expired token' });
  }

  // Attach user to request
  req.user = {
    userId: decoded.userId,
    email: decoded.email,
    role: decoded.role,
    branch: decoded.branch,
    permissions: decoded.permissions || [],
    iat: decoded.iat,
    exp: decoded.exp,
  };

  next();
};

/**
 * 🔑 Role-based Access Middleware
 */
export const checkRole = (roles: UserRole[]): RequestHandler => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ message: "Not authenticated" });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ message: "Insufficient role permissions" });
    }

    next();
  };
};

/**
 * 🔑 Permission-based Access Middleware
 */
export const checkPermission = (permissions: Permission[]): RequestHandler => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ message: "Not authenticated" });
    }

    if (!hasPermission(req.user, permissions)) {
      return res.status(403).json({
        message: "Insufficient permissions",
        required: permissions,
        has: req.user.permissions,
      });
    }

    next();
  };
};

/**
 * 🔑 Rate Limiter
 */
export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 min
  max: 100, // limit each IP
  message: "Too many requests from this IP, please try again later",
});

import Joi from 'joi';

/**
 * 🔑 Request Validator for Joi schemas
 */
type JoiSchema = {
  body?: Joi.ObjectSchema;
  params?: Joi.ObjectSchema;
  query?: Joi.ObjectSchema;
};

type ValidatedData = {
  body?: any;
  query?: any;
  params?: any;
};

export const validateRequest = (schema: JoiSchema): RequestHandler => {
  return (req, res, next) => {
    try {
      const dataToValidate: ValidatedData = {};
      const validationErrors: { [key: string]: string[] } = {};
      
      // Validate body if schema exists
      if (schema.body) {
        const { error, value } = schema.body.validate(req.body, { abortEarly: false });
        if (error) {
          validationErrors.body = error.details.map((detail: Joi.ValidationErrorItem) => detail.message);
        } else {
          dataToValidate.body = value;
        }
      }
      
      // Validate params if schema exists
      if (schema.params) {
        const { error, value } = schema.params.validate(req.params, { abortEarly: false });
        if (error) {
          validationErrors.params = error.details.map((detail: Joi.ValidationErrorItem) => detail.message);
        } else {
          dataToValidate.params = value;
        }
      }
      
      // Validate query if schema exists
      if (schema.query) {
        const { error, value } = schema.query.validate(req.query, { abortEarly: false });
        if (error) {
          validationErrors.query = error.details.map((detail: Joi.ValidationErrorItem) => detail.message);
        } else {
          dataToValidate.query = value;
        }
      }
      
      // If there are validation errors, return them
      if (Object.keys(validationErrors).length > 0) {
        return res.status(400).json({
          status: 'error',
          message: 'Validation error',
          errors: validationErrors
        });
      }
      
      // Replace request data with validated data
      if (dataToValidate.body) req.body = dataToValidate.body;
      if (dataToValidate.params) req.params = dataToValidate.params;
      if (dataToValidate.query) req.query = dataToValidate.query;
      
      next();
    } catch (error) {
      console.error('Validation error:', error);
      return res.status(500).json({
        status: 'error',
        message: 'Internal server error during validation'
      });
    }
  };
};
