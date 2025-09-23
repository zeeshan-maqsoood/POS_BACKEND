import { Response } from 'express';
export declare class ApiResponse<T> {
    success: boolean;
    message: string;
    data: T | null;
    statusCode: number;
    static badRequest(arg0: string): ApiResponse<unknown>;
    constructor(success: boolean, message: string, data?: T | null, statusCode?: number);
    static success<T>(data: T, message?: string, statusCode?: number): ApiResponse<T>;
    static error(message?: string, statusCode?: number): ApiResponse<null>;
    static send<T>(res: Response, response: ApiResponse<T>): void;
}
export declare class ApiError extends Error {
    statusCode: number;
    isOperational: boolean;
    errors?: any[] | undefined;
    constructor(statusCode: number, message: string, isOperational?: boolean, errors?: any[] | undefined);
    static badRequest(message?: string, errors?: any[]): ApiError;
    static unauthorized(message?: string): ApiError;
    static forbidden(message?: string): ApiError;
    static notFound(message?: string): ApiError;
    static conflict(message?: string): ApiError;
    static internal(message?: string): ApiError;
}
export declare const errorHandler: (err: any, req: any, res: Response, next: any) => Response<any, Record<string, any>> | undefined;
