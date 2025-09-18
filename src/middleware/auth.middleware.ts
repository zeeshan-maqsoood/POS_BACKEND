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
  // Try Authorization header first
  const authHeader = req.headers.authorization;
  let token: string | undefined;

  if (authHeader && authHeader.startsWith("Bearer ")) {
    token = authHeader.split(" ")[1];
  } else if (req.cookies?.token) {
    // Fallback: check cookies (make sure cookie-parser middleware is used!)
    token = req.cookies.token;
  }

  if (!token) {
    return res.status(401).json({ message: "No token provided" });
  }

  try {
    console.log('Verifying token...');
    const decoded = jwt.verify(token, JWT_SECRET) as JwtPayload;
    console.log('Decoded token:', decoded);
    
    // Ensure required fields are present
    if (!decoded.userId || !decoded.role) {
      console.error('Invalid token payload:', decoded);
      return res.status(401).json({ message: 'Invalid token payload' });
    }
    
    // Attach user to request
    req.user = {
      userId: decoded.userId,
      email: decoded.email,
      role: decoded.role,
      permissions: decoded.permissions || [],
      iat: decoded.iat,
      exp: decoded.exp
    };
    
    console.log('User authenticated:', req.user);
    next();
  } catch (err) {
    return res.status(403).json({ message: "Invalid or expired token" });
  }
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
  console.log(permissions,"permissions2222")
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
