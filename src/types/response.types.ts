import { Response } from 'express';

export interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data?: T;
  error?: string | Record<string, any>;
  statusCode?: number;
}

export interface PaginatedResponse<T = any> extends ApiResponse<T[]> {
  meta: {
    total: number;
    page: number;
    pageSize: number;
    totalPages: number;
  };
}

export interface ErrorResponse extends ApiResponse {
  error: string | Record<string, any>;
  statusCode: number;
}

export interface SuccessResponse<T = any> extends ApiResponse<T> {
  data: T;
  statusCode: number;
}

export type ControllerResponse<T = any> = Response<ApiResponse<T>>;

// Helper functions
export const createSuccessResponse = <T = any>(
  data: T,
  message = 'Success',
  statusCode = 200
): SuccessResponse<T> => ({
  success: true,
  message,
  data,
  statusCode
});

export const createErrorResponse = (
  error: string | Record<string, any>,
  statusCode = 500,
  message = 'An error occurred'
): ErrorResponse => ({
  success: false,
  message,
  error,
  statusCode
});

export const createPaginatedResponse = <T = any>(
  data: T[],
  total: number,
  page: number,
  pageSize: number,
  message = 'Success'
): PaginatedResponse<T> => ({
  success: true,
  message,
  data,
  meta: {
    total,
    page,
    pageSize,
    totalPages: Math.ceil(total / pageSize)
  }
});
