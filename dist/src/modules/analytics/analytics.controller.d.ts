import { Request, Response } from 'express';
import { JwtPayload } from '../../types/auth.types';
declare global {
    namespace Express {
        interface Request {
            user?: JwtPayload;
        }
    }
}
export declare const getAnalytics: (req: Request, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
export declare const getSalesData: (req: Request, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
export declare const getOrdersByType: (req: Request, res: Response) => Promise<void>;
declare const _default: {
    getAnalytics: (req: Request, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
    getSalesData: (req: Request, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
    getOrdersByType: (req: Request, res: Response) => Promise<void>;
};
export default _default;
