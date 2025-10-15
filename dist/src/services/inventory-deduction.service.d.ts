export declare const inventoryService: {
    /**
     * Update inventory status based on current quantity
     */
    updateInventoryStatus(inventoryItemId: string): Promise<import(".prisma/client").$Enums.InventoryStatus>;
    /**
     * Deduct inventory for an order (branch-based using main inventory)
     */
    deductInventoryForOrder(order: any): Promise<void>;
    /**
     * Restore inventory when order is cancelled (branch-based using main inventory)
     */
    restoreInventoryForOrder(order: any): Promise<void>;
    /**
     * Check if there's sufficient inventory for an order (branch-based awareness)
     */
    checkInventoryAvailability(orderData: any): Promise<{
        available: boolean;
        issues: {
            itemName: string;
            ingredientName: string;
            required: number;
            available: number;
            branch: any;
            message: string;
            currentStatus: import(".prisma/client").$Enums.InventoryStatus;
        }[];
    }>;
    /**
     * Get branch-specific inventory levels (using transactions for tracking)
     */
    getBranchInventory(branchName: string): Promise<{
        branchQuantity: number;
        branchNetChange: number;
        lastBranchTransaction: {
            id: string;
            createdAt: Date;
            createdById: string | null;
            branchName: string | null;
            type: import(".prisma/client").$Enums.TransactionType;
            inventoryItemId: string;
            quantity: number;
            reason: string;
            referenceId: string | null;
            referenceType: string | null;
            previousQuantity: number;
            newQuantity: number;
            goodsReceiptId: string | null;
        };
        isLowStock: boolean;
        isOutOfStock: boolean;
        needsRestock: boolean;
        InventoryTransaction: {
            id: string;
            createdAt: Date;
            createdById: string | null;
            branchName: string | null;
            type: import(".prisma/client").$Enums.TransactionType;
            inventoryItemId: string;
            quantity: number;
            reason: string;
            referenceId: string | null;
            referenceType: string | null;
            previousQuantity: number;
            newQuantity: number;
            goodsReceiptId: string | null;
        }[];
        category: {
            id: string;
            name: string;
            createdAt: Date;
            updatedAt: Date;
            description: string | null;
            isActive: boolean;
            branchName: string | null;
            color: string;
        };
        subcategory: {
            id: string;
            name: string;
            createdAt: Date;
            updatedAt: Date;
            description: string | null;
            isActive: boolean;
            branchName: string | null;
            categoryId: string;
        } | null;
        id: string;
        name: string;
        status: import(".prisma/client").$Enums.InventoryStatus;
        createdAt: Date;
        updatedAt: Date;
        supplier: string;
        description: string | null;
        branchName: string | null;
        cost: number;
        categoryId: string;
        quantity: number;
        unit: string;
        subcategoryId: string | null;
        minStock: number;
        maxStock: number;
        location: string;
        expiryDate: Date | null;
        lastUpdated: Date;
    }[]>;
    /**
     * Get inventory consumption report by branch
     */
    getBranchInventoryReport(branchName: string, startDate?: Date, endDate?: Date): Promise<{
        inventoryItemId: string;
        inventoryItemName: string;
        unit: string;
        type: import(".prisma/client").$Enums.TransactionType;
        totalQuantity: number;
        transactionCount: number;
        currentStatus: import(".prisma/client").$Enums.InventoryStatus | undefined;
        currentQuantity: number | undefined;
        minStock: number | undefined;
        isLowStock: boolean;
        isOutOfStock: boolean;
    }[]>;
    /**
     * Get low stock alerts for a branch
     */
    getLowStockAlerts(branchName?: string): Promise<{
        needsImmediateAttention: boolean;
        restockUrgency: string;
        category: {
            id: string;
            name: string;
            createdAt: Date;
            updatedAt: Date;
            description: string | null;
            isActive: boolean;
            branchName: string | null;
            color: string;
        };
        subcategory: {
            id: string;
            name: string;
            createdAt: Date;
            updatedAt: Date;
            description: string | null;
            isActive: boolean;
            branchName: string | null;
            categoryId: string;
        } | null;
        id: string;
        name: string;
        status: import(".prisma/client").$Enums.InventoryStatus;
        createdAt: Date;
        updatedAt: Date;
        supplier: string;
        description: string | null;
        branchName: string | null;
        cost: number;
        categoryId: string;
        quantity: number;
        unit: string;
        subcategoryId: string | null;
        minStock: number;
        maxStock: number;
        location: string;
        expiryDate: Date | null;
        lastUpdated: Date;
    }[]>;
    /**
     * Bulk update inventory status for all items (useful for migration or cleanup)
     */
    bulkUpdateInventoryStatus(): Promise<{
        updatedCount: number;
        totalCount: number;
    }>;
};
