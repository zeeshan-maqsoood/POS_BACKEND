//@ts-nocheck
import { Prisma, PrismaClient, OrderStatus, UserRole } from '@prisma/client';
import { startOfDay, endOfDay, subDays, subMonths, format, utcToZonedTime, zonedTimeToUtc } from 'date-fns';

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
  }>;
  revenueData: Array<{ date: string; revenue: number }>;
  orderTrends: Array<{ date: string; count: number }>;
  salesByCategory: CategorySales[];
}

export const DashboardService = {
  async getDashboardStats(period: 'day' | 'week' | 'month' = 'day', branchId?: string): Promise<DashboardStats> {
    const now = new Date();
    let startDate: Date;
    
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

    // Set end date to end of current day
    const endDate = endOfDay(now);
    
    // Base where clause for all order queries
    const orderWhere = {
      createdAt: { 
        gte: startDate,
        lte: endDate 
      },
      ...(branchId ? { branchId } : {}) // Add branch filter if branchId is provided
    };
    
    console.log('=== DASHBOARD STATS REQUEST ===');
    console.log('Time period:', period);
    console.log('Date range:', { 
      start: startDate.toISOString(), 
      end: endDate.toISOString(),
      branchId: branchId || 'ALL BRANCHES'
    });
    console.log('Order where clause:', JSON.stringify(orderWhere, null, 2));

    // Get total revenue from PAID orders only
    const revenueResult = await prisma.order.aggregate({
      where: {
        ...orderWhere,
        paymentStatus: "PAID",
      },
      _sum: { 
        total: true 
      },
    }).catch(error => {
      console.error('Error fetching revenue data:', error);
      return { _sum: { total: 0 } };
    });

    // Get total orders (filtered by branch if needed)
    const totalOrders = await prisma.order.count({
      where: orderWhere,
    }).catch(error => {
      console.error('Error counting orders:', error);
      return 0;
    });

    // Get average order value from paid orders only
    const paidOrders = await prisma.order.aggregate({
      where: {
        ...orderWhere,
        paymentStatus: "PAID",
      },
      _avg: { total: true },
      _count: true,
    }).catch(error => {
      console.error('Error calculating average order value:', error);
      return { _avg: { total: 0 }, _count: 0 };
    });
    
    console.log('Paid orders stats:', { 
      avg: paidOrders._avg, 
      count: paidOrders._count 
    });

    // Get new customers (filter by branch if needed)
    const newCustomersWhere: any = {
      createdAt: { 
        gte: startDate,
        lte: endDate 
      },
      role: UserRole.USER,
    };

    if (branchId) {
      newCustomersWhere.orders = {
        some: {
          branchId,
          createdAt: {
            gte: startDate,
            lte: endDate
          }
        },
      };
    }

    console.log('New customers query:', JSON.stringify(newCustomersWhere, null, 2));
    
    const newCustomers = await prisma.user.count({
      where: newCustomersWhere,
    }).catch(error => {
      console.error('Error counting new customers:', error);
      return 0;
    });
    
    console.log('New customers count:', newCustomers);

    // Get popular items with branch filter using Prisma's query builder
    const popularItems = await prisma.$queryRaw`
      SELECT 
        mi.id as "menuItemId",
        mi.name as name,
        COUNT(oi.id)::int as count
      FROM "OrderItem" oi
      JOIN "MenuItem" mi ON oi."menuItemId" = mi.id
      JOIN "Order" o ON oi."orderId" = o.id
      WHERE o."createdAt" >= ${startDate}
      ${branchId ? Prisma.sql`AND o."branchId" = ${branchId}` : Prisma.empty}
      GROUP BY mi.id, mi.name
      ORDER BY count DESC
      LIMIT 5
    `;

    // Get recent orders with branch filter
    const recentOrders = await prisma.order.findMany({
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

    // Get revenue data for charts with branch filter
    const revenueData = await this.getRevenueData(startDate, now, branchId);

    // Get order trends for charts with branch filter
    const orderTrends = await this.getOrderTrends(startDate, now, branchId);

    const salesByCategory = await this.getSalesByCategory(startDate, now, branchId);

    const totalRevenue = Number(revenueResult._sum.total) || 0;
    const averageOrderValue = paidOrders._count > 0 ? totalRevenue / paidOrders._count : 0;

    return {
      totalRevenue,
      totalOrders,
      averageOrderValue,
      newCustomers,
      popularItems: (popularItems as Array<{ name: string; count: number }>).map((item) => ({
        name: item.name || 'Unknown',
        orders: item.count,
      })),
      recentOrders: recentOrders.map((order) => ({
        id: order.id,
        total: Number(order.total),
        status: order.status,
        createdAt: order.createdAt,
        orderNumber: order.orderNumber,
        orderType: order.orderType,
        paymentStatus: order.paymentStatus,
        paymentMethod: order.paymentMethod,
      })),
      revenueData,
      orderTrends,
      salesByCategory,
    };
  },

  async getRevenueData(startDate: Date, endDate: Date, branchId?: string) {
    const timezone = process.env.TZ || 'UTC';
    const formatString = 'yyyy-MM-dd';

    // Generate date range for the period
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

    // Build where clause with branch filter if provided
    const whereClause: any = {
      paymentStatus: 'PAID',
      createdAt: {
        gte: startDate,
        lte: endDate,
      },
    };

    if (branchId) {
      whereClause.branchId = branchId;
    }

    // Get revenue data from database
    const revenueData = await prisma.order.groupBy({
      by: ['createdAt'],
      where: whereClause,
      _sum: {
        total: true,
      },
    });

    // Map database results to our date range
    return dates.map(day => {
      const revenueForDay = revenueData.find(item => 
        format(item.createdAt, formatString) === format(new Date(day.date), formatString)
      );
      
      return {
        date: day.date,
        revenue: Number(revenueForDay?._sum.total || 0),
      };
    });
  },

  async getOrderTrends(startDate: Date, endDate: Date, branchId?: string) {
    const timezone = process.env.TZ || 'UTC';
    const formatString = 'yyyy-MM-dd';
    
    // Generate date range for the period
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

    // Build where clause with branch filter if provided
    const whereClause: any = {
      createdAt: {
        gte: startDate,
        lte: endDate,
      },
    };

    if (branchId) {
      whereClause.branchId = branchId;
    }

    // Get order count data from database
    const orderCounts = await prisma.order.groupBy({
      by: ['createdAt'],
      where: whereClause,
      _count: {
        _all: true,
      },
    });

    // Map database results to our date range
    return dates.map(day => {
      const countForDay = orderCounts.find(item => 
        format(item.createdAt, formatString) === format(new Date(day.date), formatString)
      );
      
      return {
        date: day.date,
        count: countForDay?._count._all || 0,
      };
    });
  },

  async getSalesByCategory(startDate: Date, endDate: Date, branchId?: string): Promise<CategorySales[]> {
    try {
      console.log('Fetching categories...');
      let categories = [];
      try {
        // Use the correct model name 'menuCategory' instead of 'category'
        categories = await prisma.menuCategory.findMany();
      } catch (error) {
        console.error('Error fetching categories:', error);
        return [];
      }
      
      console.log(`Found ${categories.length} categories`);

      // Build where clause for orders
      const orderWhere: any = {
        paymentStatus: 'PAID',
        createdAt: {
          gte: startDate,
          lte: endDate,
        },
      };

      if (branchId) {
        orderWhere.branchId = branchId;
      }

      console.log('Fetching order items with where clause:', JSON.stringify({
        order: orderWhere,
        menuItem: { isNot: null }
      }, null, 2));

      // Get order items with their menu item and category information
      const orderItems = await prisma.orderItem.findMany({
        where: {
          order: orderWhere,
          menuItem: {
            isNot: null, // Only include items that have a menu item
          },
        },
        include: {
          order: {
            select: {
              id: true,
              branchId: true,
            },
          },
          menuItem: {
            include: {
              category: true,
            },
          },
        },
      });
      
      console.log(`Found ${orderItems.length} order items for branch: ${branchId || 'all'}`);

      // Group order items by category
      const categoryMap = new Map<string, {
        categoryId: string;
        categoryName: string;
        sales: number;
        orderCount: Set<string>;
        itemsSold: number;
      }>();

      // Initialize all categories with 0 values
      categories.forEach((category: { id: string; name: string }) => {
        categoryMap.set(category.id, {
          categoryId: category.id,
          categoryName: category.name,
          sales: 0,
          orderCount: new Set<string>(),
          itemsSold: 0,
        });
      });

      // Process each order item
      orderItems.forEach((item: any) => {
        if (!item.menuItem || !item.menuItem.category) return;
        
        const categoryId = item.menuItem.category.id;
        const categoryData = categoryMap.get(categoryId);
        
        if (categoryData) {
          // Add to sales (price * quantity)
          categoryData.sales += Number(item.price) * item.quantity;
          
          // Add order ID to count unique orders
          if (item.order?.id) {
            categoryData.orderCount.add(item.order.id);
          }
          
          // Add to items sold
          categoryData.itemsSold += item.quantity || 0;
        }
      });

      // Convert the map to an array of CategorySales
      const result: CategorySales[] = Array.from(categoryMap.values()).map(category => ({
        categoryId: category.categoryId,
        categoryName: category.categoryName,
        sales: parseFloat(category.sales.toFixed(2)),
        orderCount: category.orderCount.size,
        itemsSold: category.itemsSold,
      }));

      // Sort by sales in descending order and filter out categories with no sales
      return result
        .filter(cat => cat.sales > 0)
        .sort((a, b) => b.sales - a.sales);

    } catch (error) {
      console.error('Error in getSalesByCategory:', error);
      return [];
    }
  },
};

export default DashboardService;
