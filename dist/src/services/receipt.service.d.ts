export interface ReceiptData {
    orderNumber: string;
    date: string;
    items: {
        name: string;
        quantity: number;
        price: number;
        total: number;
    }[];
    subtotal: number;
    tax: number;
    total: number;
    paymentMethod: string;
    paymentStatus?: string;
    branchName: string;
    tableNumber?: string;
    customerName?: string;
}
export declare const generateReceipt: (order: any) => string;
export declare const printReceipt: (orderId: string) => Promise<boolean>;
