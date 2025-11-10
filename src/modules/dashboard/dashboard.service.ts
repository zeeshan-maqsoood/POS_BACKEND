// src/modules/dashboard/dashboard.service.ts
import { Prisma, PrismaClient, OrderStatus, UserRole, PaymentStatus } from '@prisma/client';
import { startOfDay, endOfDay, subDays, subMonths, format } from 'date-fns';

const prisma = new PrismaClient();

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
  popularItems: Array<{ name: string; orders: number }>;
  recentOrders: Array<{
    id: string;
    total: number;
    status: string;
    createdAt: Date;
    orderNumber: string;
    orderType: string;
    paymentStatus: string;
    paymentMethod: string;
  }>;
  revenueData: Array<{ date: string; revenue: number }>;
  orderTrends: Array<{ date: string; count: number }>;
  salesByCategory: CategorySales[];
  // Add new fields with default values
  ordersByStatus: Record<string, number>;
  revenueByStatus: Record<string, number>;
  paymentBreakdown: {
    byMethod: Record<string, { count: number; revenue: number }>;
    byStatus: Record<string, number>;
  };
  topCategories: Array<{ name: string; orders: number }>;
  hourlyOrders: Array<{ hour: string; count: number }>;
}

export const DashboardService = {
  async getDashboardStats(
    period: 'day' | 'week' | 'month' | 'custom' = 'day', 
    branchId?: string,
    customStartDate?: Date,
    customEndDate?: Date
  ): Promise<DashboardStats> {
    try {
      console.log('=== DASHBOARD SERVICE START ===');
      console.log('Period:', period, 'Branch ID:', branchId || 'ALL BRANCHES');
      console.log('Custom Dates:', { 
        start: customStartDate?.toISOString(), 
        end: customEndDate?.toISOString() 
      });

      const now = new Date();
      let startDate: Date;
      let endDate: Date;
      
      if (period === 'custom' && customStartDate && customEndDate) {
        // Use custom date range
        startDate = startOfDay(customStartDate);
        endDate = endOfDay(customEndDate);
      } else {
        // Use predefined periods
        endDate = endOfDay(now);
        
        switch (period) {
          case 'day':
            startDate = startOfDay(now);
            break;
          case 'week':
            startDate = startOfDay(subDays(now, 7));
            break;
          case 'month':
            startDate = startOfDay(subMonths(now, 1));
            break;
          default:
            startDate = startOfDay(now);
        }
      }

      console.log('Final date range:', { 
        start: startDate.toISOString(), 
        end: endDate.toISOString() 
      });
      
      const orderWhere = {
        createdAt: { 
          gte: startDate,
          lte: endDate 
        },
        paymentStatus: PaymentStatus.PAID,
        status: OrderStatus.COMPLETED,
        ...(branchId ? { branchId } : {})
      };

      console.log('Date range:', { 
        start: startDate.toISOString(), 
        end: endDate.toISOString() 
      });

      // Get all data in parallel
      const [
        revenueResult,
        totalOrders,
        paidOrders,
        newCustomers,
        popularItems,
        recentOrders,
        revenueData,
        orderTrends,
        salesByCategory,
        ordersByStatus,
        revenueByStatus,
        paymentBreakdown,
        topCategories,
        hourlyOrders
      ] = await Promise.all([
        // Revenue from paid orders
        prisma.order.aggregate({
          where: {
            ...orderWhere,
            paymentStatus: 'PAID',
            status:"COMPLETED"
          },
          _sum: {
            total: true
          }
        }),
        
        // Total orders
        prisma.order.count({
          where: orderWhere
        }),
        
        // Paid orders
        prisma.order.findMany({
          where: {
            ...orderWhere,
            paymentStatus: 'PAID',
            status:"COMPLETED"
          },
          select: {
            total: true
          }
        }),
        
        // New customers
        this.getNewCustomersCount(startDate, endDate, branchId),
        
        // Popular items
        this.getPopularItems(startDate, endDate, branchId),
        
        // Recent orders
        this.getRecentOrders(orderWhere),
        
        // Revenue data
        this.getRevenueData(startDate, endDate, branchId),
        
        // Order trends
        this.getOrderTrends(startDate, endDate, branchId),
        
        // Sales by category
        this.getSalesByCategory(startDate, endDate, branchId),
        
        // Orders by status
        this.getOrdersByStatus(startDate, endDate, branchId),
        
        // Revenue by status
        this.getRevenueByStatus(startDate, endDate, branchId),
        
        // Payment breakdown
        this.getPaymentBreakdown(startDate, endDate, branchId),
        
        // Top categories
        this.getTopCategories(startDate, endDate, branchId),
        
        // Hourly orders
        this.getHourlyOrders(startDate, endDate, branchId)
      ]);

      const totalRevenue = Number(revenueResult._sum?.total) || 0;
      const averageOrderValue = paidOrders.length > 0 ? totalRevenue / paidOrders.length : 0;

      const result: DashboardStats = {
        totalRevenue,
        totalOrders,
        averageOrderValue,
        newCustomers,
        popularItems,
        recentOrders,
        revenueData,
        orderTrends,
        salesByCategory,
        ordersByStatus,
        revenueByStatus,
        paymentBreakdown,
        topCategories,
        hourlyOrders
      };

      console.log('=== DASHBOARD SERVICE COMPLETE ===');
      console.log('Result summary:', {
        totalRevenue,
        totalOrders,
        newCustomers,
        recentOrdersCount: recentOrders.length
      });

      return result;

    } catch (error) {
      console.error('Error in getDashboardStats:', error);
      // Return default empty structure
      return this.getEmptyDashboardStats();
    }
  },

  // Helper method to return empty stats
  getEmptyDashboardStats(): DashboardStats {
    return {
      totalRevenue: 0,
      totalOrders: 0,
      averageOrderValue: 0,
      newCustomers: 0,
      popularItems: [],
      recentOrders: [],
      revenueData: [],
      orderTrends: [],
      salesByCategory: [],
      ordersByStatus: {},
      revenueByStatus: {},
      paymentBreakdown: {
        byMethod: {},
        byStatus: {}
      },
      topCategories: [],
      hourlyOrders: []
    };
  },

  async getNewCustomersCount(startDate: Date, endDate: Date, branchId?: string): Promise<number> {
    try {
      const newCustomersWhere: any = {
        createdAt: { gte: startDate, lte: endDate },
        role: UserRole.USER,
      };

      if (branchId) {
        newCustomersWhere.orders = {
          some: {
            branchId,
            createdAt: { gte: startDate, lte: endDate }
          },
        };
      }

      return await prisma.user.count({
        where: newCustomersWhere,
      });
    } catch (error) {
      console.error('Error in getNewCustomersCount:', error);
      return 0;
    }
  },

  async getPopularItems(startDate: Date, endDate: Date, branchId?: string) {
    try {
      const popularItems = await prisma.$queryRaw`
        SELECT 
          mi.name as name,
          COUNT(oi.id)::int as orders
        FROM "OrderItem" oi
        JOIN "MenuItem" mi ON oi."menuItemId" = mi.id
        JOIN "Order" o ON oi."orderId" = o.id
        WHERE o."createdAt" >= ${startDate} AND o."createdAt" <= ${endDate}
        ${branchId ? Prisma.sql`AND o."branchId" = ${branchId}` : Prisma.empty}
        GROUP BY mi.id, mi.name
        ORDER BY orders DESC
        LIMIT 5
      `;

      return (popularItems as Array<{ name: string; orders: number }>).map((item) => ({
        name: item.name || 'Unknown',
        orders: item.orders,
      }));
    } catch (error) {
      console.error('Error in getPopularItems:', error);
      return [];
    }
  },

  async getRecentOrders(orderWhere: any) {
    try {
      const orders = await prisma.order.findMany({
        where: orderWhere,
        take: 5,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          total: true,
          status: true,
          createdAt: true,
          orderNumber: true,
          orderType: true,
          paymentStatus: true,
          paymentMethod: true,
        },
      });

      return orders.map((order) => ({
        id: order.id,
        total: Number(order.total),
        status: order.status,
        createdAt: order.createdAt,
        orderNumber: order.orderNumber,
        orderType: order.orderType,
        paymentStatus: order.paymentStatus,
        paymentMethod: order.paymentMethod,
      }));
    } catch (error) {
      console.error('Error in getRecentOrders:', error);
      return [];
    }
  },

  async getRevenueData(startDate: Date, endDate: Date, branchId?: string) {
    try {
      const dates: { date: string; revenue: number }[] = [];
      let currentDate = new Date(startDate);

      while (currentDate <= endDate) {
        dates.push({
          date: format(currentDate, 'MMM dd'),
          revenue: 0,
        });
        currentDate = new Date(currentDate);
        currentDate.setDate(currentDate.getDate() + 1);
      }

      const whereClause: any = {
        paymentStatus: 'PAID',
        status: 'COMPLETED',
        createdAt: { gte: startDate, lte: endDate },
      };

      if (branchId) {
        whereClause.branchId = branchId;
      }

      const revenueData = await prisma.order.groupBy({
        by: ['createdAt'],
        where: whereClause,
        _sum: { total: true },
      });

      return dates.map(day => {
        const revenueForDay = revenueData.find(item => 
          format(item.createdAt, 'yyyy-MM-dd') === format(new Date(day.date + ' ' + new Date().getFullYear()), 'yyyy-MM-dd')
        );
        
        return {
          date: day.date,
          revenue: Number(revenueForDay?._sum.total || 0),
        };
      });
    } catch (error) {
      console.error('Error in getRevenueData:', error);
      return [];
    }
  },

  async getOrderTrends(startDate: Date, endDate: Date, branchId?: string) {
    try {
      const dates: { date: string; count: number }[] = [];
      let currentDate = new Date(startDate);
      
      while (currentDate <= endDate) {
        dates.push({
          date: format(currentDate, 'MMM dd'),
          count: 0,
        });
        currentDate = new Date(currentDate);
        currentDate.setDate(currentDate.getDate() + 1);
      }

      const whereClause: any = {
        createdAt: { gte: startDate, lte: endDate },
      };

      if (branchId) {
        whereClause.branchId = branchId;
      }

      const orderCounts = await prisma.order.groupBy({
        by: ['createdAt'],
        where: whereClause,
        _count: { _all: true },
      });

      return dates.map(day => {
        const countForDay = orderCounts.find(item => 
          format(item.createdAt, 'yyyy-MM-dd') === format(new Date(day.date + ' ' + new Date().getFullYear()), 'yyyy-MM-dd')
        );
        
        return {
          date: day.date,
          count: countForDay?._count._all || 0,
        };
      });
    } catch (error) {
      console.error('Error in getOrderTrends:', error);
      return [];
    }
  },

  async getSalesByCategory(startDate: Date, endDate: Date, branchId?: string): Promise<CategorySales[]> {
    try {
      const categories = await prisma.menuCategory.findMany();
      
      const orderWhere: any = {
        paymentStatus: 'PAID',
        createdAt: { gte: startDate, lte: endDate },
      };

      if (branchId) {
        orderWhere.branchId = branchId;
      }

      const orderItems = await prisma.orderItem.findMany({
        where: {
          order: orderWhere,
          menuItem: { isNot: null },
        },
        include: {
          order: { select: { id: true, branchId: true } },
          menuItem: { include: { category: true } },
        },
      });

      const categoryMap = new Map<string, {
        categoryId: string;
        categoryName: string;
        sales: number;
        orderCount: Set<string>;
        itemsSold: number;
      }>();

      categories.forEach((category: any) => {
        categoryMap.set(category.id, {
          categoryId: category.id,
          categoryName: category.name,
          sales: 0,
          orderCount: new Set<string>(),
          itemsSold: 0,
        });
      });

      orderItems.forEach((item: any) => {
        if (!item.menuItem || !item.menuItem.category) return;
        
        const categoryId = item.menuItem.category.id;
        const categoryData = categoryMap.get(categoryId);
        
        if (categoryData) {
          categoryData.sales += Number(item.price) * item.quantity;
          if (item.order?.id) {
            categoryData.orderCount.add(item.order.id);
          }
          categoryData.itemsSold += item.quantity || 0;
        }
      });

      const result: CategorySales[] = Array.from(categoryMap.values()).map(category => ({
        categoryId: category.categoryId,
        categoryName: category.categoryName,
        sales: parseFloat(category.sales.toFixed(2)),
        orderCount: category.orderCount.size,
        itemsSold: category.itemsSold,
      }));

      return result
        .filter(cat => cat.sales > 0)
        .sort((a, b) => b.sales - a.sales);

    } catch (error) {
      console.error('Error in getSalesByCategory:', error);
      return [];
    }
  },

  // New methods for additional data
  async getOrdersByStatus(startDate: Date, endDate: Date, branchId?: string) {
    try {
      const whereClause: any = {
        createdAt: { gte: startDate, lte: endDate },
      };

      if (branchId) {
        whereClause.branchId = branchId;
      }

      const statusData = await prisma.order.groupBy({
        by: ['status'],
        where: whereClause,
        _count: { _all: true },
      });

      const result: Record<string, number> = {};
      statusData.forEach(item => {
        result[item.status] = item._count._all;
      });

      return result;
    } catch (error) {
      console.error('Error in getOrdersByStatus:', error);
      return {};
    }
  },

  async getRevenueByStatus(startDate: Date, endDate: Date, branchId?: string) {
    try {
      const whereClause: any = {
        createdAt: { gte: startDate, lte: endDate },
      };

      if (branchId) {
        whereClause.branchId = branchId;
      }

      const revenueData = await prisma.order.groupBy({
        by: ['status'],
        where: whereClause,
        _sum: { total: true },
      });

      const result: Record<string, number> = {};
      revenueData.forEach(item => {
        result[item.status] = Number(item._sum.total) || 0;
      });

      return result;
    } catch (error) {
      console.error('Error in getRevenueByStatus:', error);
      return {};
    }
  },

  async getPaymentBreakdown(startDate: Date, endDate: Date, branchId?: string) {
    try {
      const whereClause: any = {
        createdAt: { gte: startDate, lte: endDate },
      };

      if (branchId) {
        whereClause.branchId = branchId;
      }

      const paymentData = await prisma.order.groupBy({
        by: ['paymentMethod', 'paymentStatus'],
        where: whereClause,
        _sum: { total: true },
        _count: { _all: true },
      });

      const byMethod: Record<string, { count: number; revenue: number }> = {};
      const byStatus: Record<string, number> = {};

      paymentData.forEach(item => {
        // By method
        if (item.paymentMethod) {
          if (!byMethod[item.paymentMethod]) {
            byMethod[item.paymentMethod] = { count: 0, revenue: 0 };
          }
          byMethod[item.paymentMethod].count += item._count._all;
          byMethod[item.paymentMethod].revenue += Number(item._sum.total) || 0;
        }

        // By status
        if (item.paymentStatus) {
          byStatus[item.paymentStatus] = (byStatus[item.paymentStatus] || 0) + item._count._all;
        }
      });

      return { byMethod, byStatus };
    } catch (error) {
      console.error('Error in getPaymentBreakdown:', error);
      return { byMethod: {}, byStatus: {} };
    }
  },

  async getTopCategories(startDate: Date, endDate: Date, branchId?: string) {
    try {
      const result = await prisma.$queryRaw`
        SELECT 
          mc.name as name,
          COUNT(oi.id)::int as orders
        FROM "OrderItem" oi
        JOIN "MenuItem" mi ON oi."menuItemId" = mi.id
        JOIN "MenuCategory" mc ON mi."categoryId" = mc.id
        JOIN "Order" o ON oi."orderId" = o.id
        WHERE o."createdAt" >= ${startDate} AND o."createdAt" <= ${endDate}
        ${branchId ? Prisma.sql`AND o."branchId" = ${branchId}` : Prisma.empty}
        GROUP BY mc.id, mc.name
        ORDER BY orders DESC
        LIMIT 5
      `;

      return (result as Array<{ name: string; orders: number }>).map(item => ({
        name: item.name,
        orders: item.orders
      }));
    } catch (error) {
      console.error('Error in getTopCategories:', error);
      return [];
    }
  },

  async getHourlyOrders(startDate: Date, endDate: Date, branchId?: string) {
    try {
      const result = await prisma.$queryRaw`
        SELECT 
          TO_CHAR("createdAt", 'HH24') as hour,
          COUNT(*)::int as count
        FROM "Order"
        WHERE "createdAt" >= ${startDate} AND "createdAt" <= ${endDate}
        ${branchId ? Prisma.sql`AND "branchId" = ${branchId}` : Prisma.empty}
        GROUP BY TO_CHAR("createdAt", 'HH24')
        ORDER BY hour
      `;

      return (result as Array<{ hour: string; count: number }>).map(item => ({
        hour: `${item.hour}:00`,
        count: item.count
      }));
    } catch (error) {
      console.error('Error in getHourlyOrders:', error);
      return [];
    }
  },
};

export default DashboardService;