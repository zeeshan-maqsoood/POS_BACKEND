type DateRange = {
    from: Date;
    to: Date;
};
declare const _default: {
    getSalesData({ from, to }: DateRange, branchName?: string): Promise<{
        date: string;
        orders: number;
        revenue: number;
    }[]>;
    getOrdersByStatus({ from, to }: DateRange, branchName?: string): Promise<{
        status: import(".prisma/client").$Enums.OrderStatus;
        value: number;
    }[]>;
    getOrdersByType({ from, to }: DateRange, branchName?: string): Promise<{
        type: import(".prisma/client").$Enums.OrderType;
        value: number;
    }[]>;
    getRevenueByPaymentMethod({ from, to }: DateRange, branchName?: string): Promise<{
        method: "CASH" | "CARD" | "MOBILE_PAYMENT" | "OTHER";
        value: number;
    }[]>;
    getRevenueByBranch({ from, to }: DateRange): Promise<{
        branch: string;
        revenue: number;
    }[]>;
    getBestSellingItems({ from, to, limit }: DateRange & {
        limit?: number;
    }, branchName?: string): Promise<{
        name: string;
        sales: number;
        revenue: number;
    }[]>;
    getOrdersByDayOfWeek({ from, to }: DateRange, branchName?: string): Promise<{
        day: string;
        orders: number;
    }[]>;
    getPopularModifiers({ from, to, limit }: DateRange & {
        limit?: number;
    }, branchName?: string): Promise<{
        name: string;
        count: number;
    }[]>;
    getPeakHours({ from, to }: DateRange, branchName?: string): Promise<{
        peakHours: {
            hour: string;
            count: any;
            percentage: number;
        }[];
        totalOrders: number;
    }>;
    getDashboardAnalytics({ from, to }: DateRange, branchName?: string): Promise<{
        summary: {
            totalOrders: number;
            totalRevenue: number;
            avgOrderValue: number;
            cancellationRate: number;
        };
        salesData: {
            date: string;
            orders: number;
            revenue: number;
        }[];
        ordersByType: {
            type: import(".prisma/client").$Enums.OrderType;
            value: number;
        }[];
        ordersByStatus: {
            status: import(".prisma/client").$Enums.OrderStatus;
            value: number;
        }[];
        revenueByPayment: {
            method: "CASH" | "CARD" | "MOBILE_PAYMENT" | "OTHER";
            value: number;
        }[];
        revenueByBranch: {
            branch: string;
            revenue: number;
        }[];
        bestSellingItems: {
            name: string;
            sales: number;
            revenue: number;
        }[];
        ordersByDay: {
            day: string;
            orders: number;
        }[];
        peakHours: {
            hour: string;
            count: any;
            percentage: number;
        }[];
        popularModifiers: {
            name: string;
            count: number;
        }[];
    }>;
};
export default _default;
