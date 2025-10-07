import { PrismaClient, OrderStatus, OrderType, PaymentMethod, Prisma } from '@prisma/client';
import { startOfDay, endOfDay, subDays, format, eachDayOfInterval, isWithinInterval, subMonths, eachMonthOfInterval, eachWeekOfInterval, eachHourOfInterval } from 'date-fns';

const prisma = new PrismaClient();

type DateRange = {
  from: Date;
  to: Date;
};

type GroupBy = 'day' | 'week' | 'month' | 'year';

export default {
  // Sales Reports
  async getSalesReport({ from, to, groupBy = 'day' }: DateRange & { groupBy?: GroupBy }, branchName?: string) {
    // Get all orders in the date range
    const orders = await prisma.order.findMany({
      where: {
        createdAt: { gte: from, lte: to },
        paymentStatus: 'PAID',
        ...(branchName && { branchName }),
      },
      include: {
        items: true,
        payments: true,
      },
    });

    // Group by the selected time period
    let dateGroups: Date[] = [];
    let formatString = '';
    
    switch (groupBy) {
      case 'day':
        dateGroups = eachDayOfInterval({ start: from, end: to });
        formatString = 'yyyy-MM-dd';
        break;
      case 'week':
        dateGroups = eachWeekOfInterval({ start: from, end: to }, { weekStartsOn: 1 });
        formatString = 'yyyy-\'W\'ww';
        break;
      case 'month':
        dateGroups = eachMonthOfInterval({ start: from, end: to });
        formatString = 'yyyy-MM';
        break;
      default:
        dateGroups = eachDayOfInterval({ start: from, end: to });
        formatString = 'yyyy-MM-dd';
    }

    // Calculate sales data for each time period
    const salesData = dateGroups.map(periodStart => {
      const periodEnd = groupBy === 'day' 
        ? endOfDay(periodStart)
        : groupBy === 'week'
        ? endOfDay(new Date(periodStart.getTime() + 6 * 24 * 60 * 60 * 1000))
        : endOfDay(new Date(periodStart.getFullYear(), periodStart.getMonth() + 1, 0));
      
      const periodOrders = orders.filter(order => 
        isWithinInterval(new Date(order.createdAt), {
          start: periodStart,
          end: periodEnd
        })
      );
      
      return {
        period: format(periodStart, formatString),
        orders: periodOrders.length,
        revenue: periodOrders.reduce((sum, order) => sum + order.total, 0),
        tax: periodOrders.reduce((sum, order) => sum + (order.taxAmount || 0), 0),
        discount: periodOrders.reduce((sum, order) => sum + (order.discountAmount || 0), 0),
      };
    });

    return salesData;
  },

  // Order Analysis
  async getOrderAnalysis({ from, to }: DateRange, branchName?: string) {
    const [statusCounts, typeCounts, hourlyData] = await Promise.all([
      // Order status distribution
      prisma.order.groupBy({
        by: ['status'],
        where: {
          createdAt: { gte: from, lte: to },
          ...(branchName && { branchName }),
        },
        _count: { id: true },
      }),
      
      // Order type distribution
      prisma.order.groupBy({
        by: ['orderType'],
        where: {
          createdAt: { gte: from, lte: to },
          ...(branchName && { branchName }),
        },
        _count: { id: true },
      }),
      
      // Hourly order volume
      prisma.$queryRaw`
        SELECT 
          EXTRACT(HOUR FROM "createdAt") as hour,
          COUNT(*)::int as count
        FROM "Order"
        WHERE "createdAt" >= ${from} AND "createdAt" <= ${to}
          ${branchName ? Prisma.sql`AND "branchName" = ${branchName}` : Prisma.empty}
        GROUP BY EXTRACT(HOUR FROM "createdAt")
        ORDER BY hour
      ` as Promise<Array<{ hour: number, count: number }>>
    ]);

    // Calculate average order value
    const orderTotals = await prisma.order.aggregate({
      where: {
        createdAt: { gte: from, lte: to },
        paymentStatus: 'PAID',
        ...(branchName && { branchName }),
      },
      _sum: { total: true },
      _count: { id: true },
    });

    const avgOrderValue = orderTotals._count.id > 0 
      ? (orderTotals._sum.total || 0) / orderTotals._count.id 
      : 0;

    return {
      statusDistribution: statusCounts.map(item => ({
        status: item.status,
        count: item._count.id,
      })),
      typeDistribution: typeCounts.map(item => ({
        type: item.orderType,
        count: item._count.id,
      })),
      hourlyData: hourlyData.map(item => ({
        hour: item.hour,
        count: item.count,
      })),
      summary: {
        totalOrders: orderTotals._count.id,
        totalRevenue: orderTotals._sum.total || 0,
        avgOrderValue,
      },
    };
  },

  // Menu Performance
  async getMenuPerformance({ from, to }: DateRange, branchName?: string) {
    const [bestSellingItems, categoryPerformance, modifierPerformance] = await Promise.all([
      // Best selling items
      prisma.orderItem.groupBy({
        by: ['menuItemId'],
        where: {
          order: {
            createdAt: { gte: from, lte: to },
            paymentStatus: 'PAID',
            ...(branchName && { branchName }),
          },
        },
        _sum: { quantity: true },
        _count: { id: true },
        orderBy: { _sum: { quantity: 'desc' } },
        take: 10,
      }),
      
      // Category performance
      prisma.$queryRaw`
        SELECT 
          c.id as "categoryId",
          c.name as "categoryName",
          COUNT(oi.id)::int as "itemCount",
          SUM(oi.quantity)::int as "totalQuantity",
          SUM(oi.price * oi.quantity) as "totalRevenue"
        FROM "MenuItem" mi
        JOIN "MenuCategory" c ON mi."categoryId" = c.id
        JOIN "OrderItem" oi ON oi."menuItemId" = mi.id
        JOIN "Order" o ON oi."orderId" = o.id
        WHERE o."createdAt" >= ${from} AND o."createdAt" <= ${to}
          AND o."paymentStatus" = 'PAID'
          ${branchName ? Prisma.sql`AND o."branchName" = ${branchName}` : Prisma.empty}
        GROUP BY c.id, c.name
        ORDER BY "totalRevenue" DESC
      ` as Promise<Array<{
        categoryId: string;
        categoryName: string;
        itemCount: number;
        totalQuantity: number;
        totalRevenue: number;
      }>>,
      
      // Popular modifiers
      prisma.$queryRaw`
        SELECT 
          mm.id as "modifierId",
          mm.name as "modifierName",
          COUNT(omi.id)::int as "timesUsed"
        FROM "OrderMenuItemModifier" omi
        JOIN "MenuItemModifier" mm ON omi."menuItemModifierId" = mm.id
        JOIN "OrderItem" oi ON omi."orderItemId" = oi.id
        JOIN "Order" o ON oi."orderId" = o.id
        WHERE o."createdAt" >= ${from} AND o."createdAt" <= ${to}
          AND o."paymentStatus" = 'PAID'
          ${branchName ? Prisma.sql`AND o."branchName" = ${branchName}` : Prisma.empty}
        GROUP BY mm.id, mm.name
        ORDER BY "timesUsed" DESC
        LIMIT 10
      ` as Promise<Array<{
        modifierId: string;
        modifierName: string;
        timesUsed: number;
      }>>
    ]);

    // Get menu item details for best selling items
    const menuItemIds = bestSellingItems.map(item => item.menuItemId);
    const menuItems = await prisma.menuItem.findMany({
      where: { id: { in: menuItemIds } },
      select: { id: true, name: true, price: true },
    });

    const bestSellingWithDetails = bestSellingItems.map(item => {
      const menuItem = menuItems.find(mi => mi.id === item.menuItemId);
      return {
        id: item.menuItemId,
        name: menuItem?.name || 'Unknown Item',
        price: menuItem?.price || 0,
        quantity: item._sum.quantity || 0,
        orderCount: item._count.id,
      };
    });

    return {
      bestSellingItems: bestSellingWithDetails,
      categoryPerformance,
      popularModifiers: modifierPerformance,
    };
  },

  // Staff Performance
  async getStaffPerformance({ from, to }: DateRange, branchName?: string) {
    const staffPerformance = await prisma.$queryRaw`
      SELECT 
        u.id as "staffId",
        u.name as "staffName",
        COUNT(DISTINCT o.id)::int as "orderCount",
        SUM(o.total) as "totalSales",
        AVG(o.total) as "avgOrderValue",
        AVG(EXTRACT(EPOCH FROM (o.updatedAt - o.createdAt))/60) as "avgProcessingTimeMinutes"
      FROM "Order" o
      JOIN "User" u ON o."staffId" = u.id
      WHERE o."createdAt" >= ${from} AND o."createdAt" <= ${to}
        AND o."paymentStatus" = 'PAID'
        ${branchName ? Prisma.sql`AND o."branchName" = ${branchName}` : Prisma.empty}
      GROUP BY u.id, u.name
      ORDER BY "totalSales" DESC
    ` as Promise<Array<{
      staffId: string;
      staffName: string | null;
      orderCount: number;
      totalSales: number;
      avgOrderValue: number;
      avgProcessingTimeMinutes: number;
    }>>;

    return staffPerformance;
  },

  // Financial Summary
  async getFinancialSummary({ from, to }: DateRange, branchName?: string) {
    const [summary, paymentMethods, taxSummary] = await Promise.all([
      // Basic financial summary
      prisma.order.aggregate({
        where: {
          createdAt: { gte: from, lte: to },
          paymentStatus: 'PAID',
          ...(branchName && { branchName }),
        },
        _sum: {
          total: true,
          taxAmount: true,
          discountAmount: true,
          serviceCharge: true,
        },
        _count: { id: true },
      }),
      
      // Payment method breakdown
      prisma.order.groupBy({
        by: ['paymentMethod'],
        where: {
          createdAt: { gte: from, lte: to },
          paymentStatus: 'PAID',
          ...(branchName && { branchName }),
        },
        _sum: { total: true },
        _count: { id: true },
      }),
      
      // Tax summary
      prisma.$queryRaw`
        SELECT 
          o."taxRate" as "taxRate",
          SUM(o."taxAmount") as "totalTax",
          COUNT(o.id)::int as "orderCount",
          SUM(o.total) as "totalSales"
        FROM "Order" o
        WHERE o."createdAt" >= ${from} AND o."createdAt" <= ${to}
          AND o."paymentStatus" = 'PAID'
          ${branchName ? Prisma.sql`AND o."branchName" = ${branchName}` : Prisma.empty}
        GROUP BY o."taxRate"
        ORDER BY "totalTax" DESC
      ` as Promise<Array<{
        taxRate: number;
        totalTax: number;
        orderCount: number;
        totalSales: number;
      }>>
    ]);

    return {
      totalRevenue: summary._sum.total || 0,
      totalTax: summary._sum.taxAmount || 0,
      totalDiscount: summary._sum.discountAmount || 0,
      totalServiceCharge: summary._sum.serviceCharge || 0,
      orderCount: summary._count.id,
      paymentMethods: paymentMethods.map(method => ({
        method: method.paymentMethod,
        amount: method._sum.total || 0,
        orderCount: method._count.id,
      })),
      taxSummary,
    };
  },
};
