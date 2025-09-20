export interface CategorySales {
    categoryId: string;
    categoryName: string;
    sales: number;
    orderCount: number;
    itemsSold: number;
}
export interface DashboardStats {
    totalRevenue: number;
    totalOrders: number;
    averageOrderValue: number;
    newCustomers: number;
    popularItems: Array<{
        name: string;
        orders: number;
    }>;
    recentOrders: Array<{
        id: string;
        total: number;
        status: string;
        createdAt: Date;
    }>;
    revenueData: Array<{
        date: string;
        revenue: number;
    }>;
    orderTrends: Array<{
        date: string;
        count: number;
    }>;
    salesByCategory: CategorySales[];
}
export declare const DashboardService: {
    getDashboardStats(period?: "day" | "week" | "month"): Promise<DashboardStats>;
    getRevenueData(startDate: Date, endDate: Date): Promise<{
        date: string;
        revenue: number;
    }[]>;
    getOrderTrends(startDate: Date, endDate: Date): Promise<{
        date: string;
        count: number;
    }[]>;
    getSalesByCategory(startDate: Date, endDate: Date): Promise<CategorySales[]>;
};
export default DashboardService;
