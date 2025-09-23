import Joi from 'joi';
import { Request, Response, NextFunction } from 'express';
import { UserRole } from '@prisma/client';

// Request validation schemas
export const createUserSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().min(8).required(),
  name: Joi.string(),
  branch: Joi.string().allow('').optional(),
  role: Joi.string().valid(...Object.values(UserRole)),
  permissions: Joi.array().items(Joi.string())
});

export const updateUserSchema = Joi.object({
  email: Joi.string().email(),
  name: Joi.string(),
  branch: Joi.string().allow('').optional(),
  role: Joi.string().valid(...Object.values(UserRole)),
  permissions: Joi.array().items(Joi.string())
}).min(1);

export const loginSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().required()
});

// Validation middleware
export const validate = (schema: Joi.ObjectSchema) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const { error } = schema.validate(req.body);
    if (error) {
      return res.status(400).json({
        status: 'error',
        message: 'Validation error',
        details: error.details.map(d => d.message)
      });
    }
    next();
  };
};
