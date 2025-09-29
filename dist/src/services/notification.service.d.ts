import { Order } from '@prisma/client';
export declare class NotificationService {
    /**
     * Notify relevant users about a new order
     */
    static notifyNewOrder(order: Order & {
        branchName: string;
    }): Promise<void>;
}
