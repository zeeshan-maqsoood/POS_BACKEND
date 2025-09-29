declare class PrintService {
    /**
     * Print order details
     * @param order Order details to print
     */
    static printOrderReceipt(order: any): Promise<boolean>;
    /**
     * Format the receipt content
     */
    private static formatReceipt;
    /**
     * Format order items for the receipt
     */
    private static formatOrderItems;
    /**
     * Execute a shell command
     */
    private static execCommand;
}
export default PrintService;
