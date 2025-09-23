import { Response } from 'express';

type ResponseType<T> = {
  success: boolean;
  message: string;
  data?: T;
  error?: string;
  statusCode: number;
};

export class ApiResponse<T> {
  static badRequest(arg0: string): ApiResponse<unknown> {
    throw new Error("Method not implemented.");
  }
  constructor(
    public success: boolean,
    public message: string,
    public data: T | null = null,
    public statusCode: number = 200
  ) {}

  static success<T>(data: T, message: string = 'Success', statusCode: number = 200): ApiResponse<T> {
    return new ApiResponse<T>(true, message, data, statusCode);
  }

  static error(message: string = 'An error occurred', statusCode: number = 500): ApiResponse<null> {
    return new ApiResponse<null>(false, message, null, statusCode);
  }

  static send<T>(res: Response, response: ApiResponse<T>): void {
    res.status(response.statusCode).json({
      success: response.success,
      message: response.message,
      data: response.data,
      statusCode: response.statusCode
    });
  }
}

export class ApiError extends Error {
  constructor(
    public statusCode: number,
    message: string,
    public isOperational: boolean = true,
    public errors?: any[]
  ) {
    super(message);
    this.name = this.constructor.name;
    Error.captureStackTrace(this, this.constructor);
  }

  static badRequest(message: string = 'Bad Request', errors?: any[]): ApiError {
    return new ApiError(400, message, true, errors);
  }

  static unauthorized(message: string = 'Unauthorized'): ApiError {
    return new ApiError(401, message);
  }

  static forbidden(message: string = 'Forbidden'): ApiError {
    return new ApiError(403, message);
  }

  static notFound(message: string = 'Not Found'): ApiError {
    return new ApiError(404, message);
  }

  static conflict(message: string = 'Conflict'): ApiError {
    return new ApiError(409, message);
  }

  static internal(message: string = 'Internal Server Error'): ApiError {
    return new ApiError(500, message);
  }
}

export const errorHandler = (err: any, req: any, res: Response, next: any) => {
  let error = { ...err };
  error.message = err.message;

  // Log to console for development
  console.error(err);

  // Handle known error types
  if (err instanceof ApiError) {
    return res.status(err.statusCode).json({
      success: false,
      message: err.message,
      error: err.errors,
      statusCode: err.statusCode
    });
  }

  // Handle JWT errors
  if (err.name === 'JsonWebTokenError') {
    const message = 'Invalid token';
    error = new ApiError(401, message);
  }

  // Handle validation errors
  if (err.name === 'ValidationError') {
    const message = Object.values(err.errors).map((val: any) => val.message);
    error = new ApiError(400, 'Validation Error', true, message);
  }

  // Handle duplicate field errors
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue)[0];
    const message = `${field} already exists`;
    error = new ApiError(400, message);
  }

  // Handle cast errors (invalid ObjectId, etc.)
  if (err.name === 'CastError') {
    const message = `Resource not found with id of ${err.value}`;
    error = new ApiError(404, message);
  }

  // Default to 500 server error
  res.status(error.statusCode || 500).json({
    success: false,
    message: error.message || 'Server Error',
    statusCode: error.statusCode || 500
  });
};
