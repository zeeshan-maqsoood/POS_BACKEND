import { RequestHandler } from "express";
import { JwtPayload, Permission } from "../types/auth.types";
import { UserRole } from "@prisma/client";
declare global {
    namespace Express {
        interface Request {
            user?: JwtPayload;
        }
    }
}
/**
 * 🔑 Authentication Middleware
 */
export declare const authenticateJWT: RequestHandler;
/**
 * 🔑 Role-based Access Middleware
 */
export declare const checkRole: (roles: UserRole[]) => RequestHandler;
/**
 * 🔑 Permission-based Access Middleware
 */
export declare const checkPermission: (permissions: Permission[]) => RequestHandler;
/**
 * 🔑 Rate Limiter
 */
export declare const apiLimiter: import("express-rate-limit").RateLimitRequestHandler;
import Joi from 'joi';
/**
 * 🔑 Request Validator for Joi schemas
 */
type JoiSchema = {
    body?: Joi.ObjectSchema;
    params?: Joi.ObjectSchema;
    query?: Joi.ObjectSchema;
};
export declare const validateRequest: (schema: JoiSchema) => RequestHandler;
export {};
