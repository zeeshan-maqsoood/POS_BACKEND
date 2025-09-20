import { Order } from "@prisma/client";
export declare class PrinterService {
    private printer;
    private isConnected;
    constructor();
    private initializePrinter;
    printReceipt(order: Order & {
        items: any[];
    }): Promise<boolean>;
}
export declare const printerService: PrinterService;
