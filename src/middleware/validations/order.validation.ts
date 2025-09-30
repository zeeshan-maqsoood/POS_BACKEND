import Joi from 'joi';
import { OrderStatus, PaymentStatus, PaymentMethod } from "@prisma/client";

// Get enum values as arrays
const orderStatuses = Object.values(OrderStatus);
const paymentStatuses = Object.values(PaymentStatus);
const paymentMethods = Object.values(PaymentMethod);

// Base schema for order items
const orderItemSchema = Joi.object({
  menuItemId: Joi.string().required().messages({
    'string.empty': 'Menu item ID is required',
    'any.required': 'Menu item ID is required'
  }),
  name: Joi.string().required().messages({
    'string.empty': 'Item name is required',
    'any.required': 'Item name is required'
  }),
  price: Joi.number().min(0).required().messages({
    'number.base': 'Price must be a number',
    'number.min': 'Price must be a positive number',
    'any.required': 'Price is required'
  }),
  quantity: Joi.number().integer().min(1).required().messages({
    'number.base': 'Quantity must be a number',
    'number.integer': 'Quantity must be an integer',
    'number.min': 'Quantity must be at least 1',
    'any.required': 'Quantity is required'
  }),
  taxRate: Joi.number().min(0).max(100).default(0).messages({
    'number.base': 'Tax rate must be a number',
    'number.min': 'Tax rate cannot be negative',
    'number.max': 'Tax rate cannot exceed 100%'
  }),
  total: Joi.number().min(0).optional(),
  notes: Joi.string().optional()
});

// Schema for creating a new order
export const createOrderValidator = {
  body: Joi.object({
    orderType: Joi.string().valid('DINE_IN', 'TAKEAWAY', 'DELIVERY').default('DINE_IN'),
    tableNumber: Joi.string().optional().allow(''),
    customerName: Joi.string().optional().allow(''),
    customerEmail: Joi.string().email({ tlds: { allow: false } }).optional().allow(''),
    customerPhone: Joi.string().optional().allow(''),
    items: Joi.array().items(orderItemSchema).min(1).required().messages({
      'array.min': 'At least one item is required',
      'any.required': 'Order items are required'
    }),
    paymentMethod: Joi.string().valid(...paymentMethods).optional(),

    branchName: Joi.string().required().messages({
      'string.empty': 'Branch name is required',
      'any.required': 'Branch name is required'
    }),
    status: Joi.string().valid(...orderStatuses).default('PENDING'),
    paymentStatus: Joi.string().valid(...paymentStatuses).default('PENDING'),
    notes: Joi.string().optional().allow(''),
    total: Joi.number().min(0).required().messages({
      'number.base': 'Total must be a number',
      'number.min': 'Total must be a positive number',
      'any.required': 'Total is required'
    }),
    subtotal: Joi.number().min(0).required().messages({
      'number.base': 'Subtotal must be a number',
      'number.min': 'Subtotal must be a positive number',
      'any.required': 'Subtotal is required'
    }),
    tax: Joi.number().min(0).default(0).messages({
      'number.base': 'Tax must be a number',
      'number.min': 'Tax cannot be negative'
    }),
    discount: Joi.number().min(0).default(0).messages({
      'number.base': 'Discount must be a number',
      'number.min': 'Discount cannot be negative'
    }),
  })
};

// Schema for updating order status
export const updateOrderStatusValidator = {
  body: Joi.object({
    status: Joi.string().valid(...orderStatuses).required().messages({
      'any.required': 'Status is required',
      'any.only': `Status must be one of: ${orderStatuses.join(', ')}`
    }),
    notes: Joi.string().optional().allow('')
  }),
  params: Joi.object({
    id: Joi.string().uuid({ version: 'uuidv4' }).required().messages({
      'string.guid': 'Invalid order ID format',
      'any.required': 'Order ID is required'
    })
  })
};

// Type exports for TypeScript
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

// Validation middleware
export const validateRequest = (schema: JoiSchema) => {
  return (req: any, res: any, next: any) => {
    try {
      // Validate each part of the request
      const dataToValidate: ValidatedData = {};
      const validationErrors: { [key: string]: string[] } = {};
      // Validate body if schema exists
      if (schema.body) {
        const { error, value } = schema.body.validate(req.body, { abortEarly: false });
        if (error) {
          validationErrors.body = error.details.map((detail: any) => detail.message);
        } else {
          dataToValidate.body = value;
        }
      }
      
      // Validate params if schema exists
      if (schema.params) {
        const { error, value } = schema.params.validate(req.params, { abortEarly: false });
        if (error) {
          validationErrors.params = error.details.map((detail: any) => detail.message);
        } else {
          dataToValidate.params = value;
        }
      }
      
      // Validate query if schema exists
      if (schema.query) {
        const { error, value } = schema.query.validate(req.query, { abortEarly: false });
        if (error) {
          validationErrors.query = error.details.map((detail: any) => detail.message);
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

// Type exports for TypeScript
export type CreateOrderInput = {
  items: Array<{
    menuItemId: string;
    quantity: number;
    selectedModifiers?: Array<{
      modifierId: string;
      selectedOptions: string[];
    }>;
  }>;
  customerName: string;
  customerPhone: string;
  customerEmail?: string;
  paymentMethod: PaymentMethod;
  deliveryAddress?: string;
  tableNumber?: string;
};

export type UpdateOrderStatusInput = {
  status: OrderStatus;
  cancellationReason?: string;
};