import { PrismaClient, Prisma, OrderStatus, PaymentStatus, PaymentMethod, OrderType } from '@prisma/client';

const prisma = new PrismaClient();

interface DayEndReportInput {
  expectedTotal: number;
  actualCash: number;
  branchId?: string;
  userId: string;
}

export interface PaymentMethodSummary {
  method: string;
  amount: number;
  count: number;
}

export interface SalesByCategory {
  category: string;
  amount: number;
  count: number;
}

export interface TopSellingItem {
  id: string;
  name: string;
  quantity: number;
  total: number;
}

export interface DiscountSummary {
  totalDiscounts: number;
  discountedOrders: number;
  averageDiscount: number;
  totalOrders?: number;
}

export interface TaxSummary {
  totalTax: number;
  taxableAmount: number;
  taxRate: number;
}

export interface HourlySales {
  hour: number;
  amount: number;
  orderCount: number;
}

export interface OrderTypeSummary {
  type: OrderType | string;
  count: number;
  total: number;
}

export interface DayEndReportData {
  id: string;
  date: Date;
  expectedTotal: number;
  actualCash: number;
  difference: number;
  ordersCount: number;
  totalSales: number;
  averageOrderValue: number;
  paymentMethods: PaymentMethodSummary[];
  salesByCategory: SalesByCategory[];
  topSellingItems: TopSellingItem[];
  discountSummary: DiscountSummary;
  taxSummary: TaxSummary;
  hourlySales: HourlySales[];
  orderTypes: OrderTypeSummary[];
  branchId?: string | null;
  branch?: {
    id: string;
    name: string;
  };
  createdBy?: {
    id: string;
    name: string;
  };
  createdById: string;
  createdAt: Date;
  updatedAt: Date;
}

export async function generateDayEndReport(data: DayEndReportInput): Promise<DayEndReportData> {
  const { expectedTotal, actualCash, branchId, userId } = data;
  const today = new Date();
  const startOfDay = new Date(today.setHours(0, 0, 0, 0));
  const endOfDay = new Date(today.setHours(23, 59, 59, 999));
  
  // Base where clause for all queries
  const baseWhere = {
    createdAt: {
      gte: startOfDay,
      lte: endOfDay
    },
    status: OrderStatus.COMPLETED,
    ...(branchId && { branchId })
  };

  // Get all orders for today with detailed information
  const [orders, orderItems, orderTypes] = await Promise.all([
    // Main orders query
    prisma.order.findMany({
      where: baseWhere,
      select: {
        id: true,
        total: true,
        subtotal: true,
        tax: true,
        discount: true,
        paymentMethod: true,
        orderType: true,
        createdAt: true,
        payments: true,
        branchId: true,
        branch: {
          select: {
            id: true,
            name: true
          }
        },
        items: {
          select: {
            id: true,
            name: true,
            quantity: true,
            price: true,
            total: true,
            menuItem: {
              select: {
                id: true,
                name: true,
                category: true
              }
            }
          }
        }
      }
    }),
    
    // Order items with menu item details for sales by category and top items
    prisma.orderItem.findMany({
      where: {
        order: baseWhere
      },
      select: {
        id: true,
        name: true,
        quantity: true,
        price: true,
        total: true,
        menuItem: {
          select: {
            id: true,
            name: true,
            category: true
          }
        }
      }
    }),
    
    // Get order types summary
    prisma.$queryRaw`
      SELECT "orderType" as type, 
             COUNT(*) as count,
             COALESCE(SUM(total), 0) as total
      FROM "Order"
      WHERE "createdAt" >= ${startOfDay}
        AND "createdAt" <= ${endOfDay}
        AND status = 'COMPLETED'
        ${branchId ? Prisma.sql`AND "branchId" = ${branchId}` : Prisma.empty}
      GROUP BY "orderType"
    ` as Promise<Array<{ type: OrderType; count: bigint; total: Prisma.Decimal }>>
  ]);
  
  // Calculate hourly sales with timezone adjustment
  const hourlySales = await prisma.$queryRaw<Array<{ hour: number; amount: Prisma.Decimal; orderCount: bigint }>>`
    SELECT 
      EXTRACT(HOUR FROM "createdAt" AT TIME ZONE 'UTC' AT TIME ZONE 'Asia/Karachi') as hour,
      COALESCE(SUM(total), 0) as amount,
      COUNT(*)::int as "orderCount"
    FROM "Order"
    WHERE "createdAt" >= ${startOfDay}
      AND "createdAt" <= ${endOfDay}
      ${branchId ? Prisma.sql`AND "branchId" = ${branchId}` : Prisma.empty}
      AND status = 'COMPLETED'
    GROUP BY EXTRACT(HOUR FROM "createdAt" AT TIME ZONE 'UTC' AT TIME ZONE 'Asia/Karachi')
    ORDER BY hour ASC
  `;

  // Helper function to safely convert Prisma.Decimal to number
  const toNumber = (value: number | Prisma.Decimal | bigint | null | undefined): number => {
    if (value === null || value === undefined) return 0;
    if (typeof value === 'bigint') return Number(value);
    return typeof value === 'number' ? value : value.toNumber();
  };
  
  // Calculate payment method totals
  const paymentMethods = new Map<string, { amount: number; count: number }>();
  
  // Calculate sales by category
  const salesByCategory = orderItems.reduce((acc, item) => {
    const categoryName = typeof item.menuItem?.category === 'object' 
      ? item.menuItem.category.name 
      : (item.menuItem?.category || 'Uncategorized');
    
    const existing = acc.get(categoryName) || { amount: 0, count: 0 };
    acc.set(categoryName, {
      amount: existing.amount + toNumber(item.total),
      count: existing.count + item.quantity
    });
    return acc;
  }, new Map<string, { amount: number; count: number }>());
  
  // Calculate top selling items
  const topSellingItems = Array.from(
    orderItems.reduce((acc, item) => {
      const existing = acc.get(item.menuItem?.id || item.id) || {
        id: item.menuItem?.id || item.id,
        name: item.menuItem?.name || item.name,
        quantity: 0,
        total: 0
      };
      acc.set(item.menuItem?.id || item.id, {
        ...existing,
        quantity: existing.quantity + item.quantity,
        total: existing.total + toNumber(item.total)
      });
      return acc;
    }, new Map<string, { id: string; name: string; quantity: number; total: number }>())
    .values()
  )
  .sort((a, b) => b.quantity - a.quantity)
  .slice(0, 10); // Top 10 items
  
  // Calculate discount summary
  const discountSummary = orders.reduce((acc, order) => {
    const discount = toNumber(order.discount);
    return {
      totalDiscounts: acc.totalDiscounts + discount,
      discountedOrders: discount > 0 ? acc.discountedOrders + 1 : acc.discountedOrders,
      totalOrders: acc.totalOrders + 1
    };
  }, { totalDiscounts: 0, discountedOrders: 0, totalOrders: 0 });
  
  // Calculate tax summary
  const taxSummary = orders.reduce((acc, order) => ({
    totalTax: acc.totalTax + toNumber(order.tax),
    taxableAmount: acc.taxableAmount + toNumber(order.subtotal)
  }), { totalTax: 0, taxableAmount: 0 });
  
  // Calculate average order value
  const totalSales = orders.reduce((sum, order) => sum + toNumber(order.total), 0);
  const averageOrderValue = orders.length > 0 ? totalSales / orders.length : 0;

  // Process payments from all orders
  orders.forEach(order => {
    // Process direct payment method on the order if it exists
    if (order.paymentMethod) {
      const method = order.paymentMethod;
      const amount = toNumber(order.total);
      
      const current = paymentMethods.get(method) || { amount: 0, count: 0 };
      
      paymentMethods.set(method, {
        amount: current.amount + amount,
        count: current.count + 1
      });
    }
    
    // Process payments from the payments relation if they exist
    if (order.payments && order.payments.length > 0) {
      order.payments.forEach(payment => {
        // Use the payment method from the payment record, or fall back to the order's payment method
        const method = payment.method || order.paymentMethod || 'UNKNOWN';
        const amount = toNumber(payment.amount) || toNumber(order.total);
        
        const current = paymentMethods.get(method) || { amount: 0, count: 0 };
        
        paymentMethods.set(method, {
          amount: current.amount + amount,
          count: current.count + 1
        });
      });
    }
  });

  // Convert payment methods to array
  const paymentMethodsArray = Array.from(paymentMethods.entries()).map(([method, data]) => ({
    method,
    amount: data.amount,
    count: data.count
  }));

  // Format the data for the report
  const formattedSalesByCategory = Array.from(salesByCategory.entries()).map(([category, data]) => ({
    category,
    amount: data.amount,
    count: data.count
  })).sort((a, b) => b.amount - a.amount);
  
  const formattedOrderTypes = orderTypes.map(type => ({
    type: type.type,
    count: toNumber(type.count),
    total: toNumber(type.total)
  }));
  
  const formattedHourlySales = hourlySales.map(hour => ({
    hour: Number(hour.hour),
    amount: toNumber(hour.amount),
    orderCount: toNumber(hour.orderCount)
  }));

  // Calculate average order value
  const avgOrderValue = orders.length > 0 ? totalSales / orders.length : 0;

  // Create day end report record with all the enhanced data
  const report = await prisma.dayEndReport.create({
    data: {
      expectedTotal: new Prisma.Decimal(expectedTotal),
      actualCash: new Prisma.Decimal(actualCash),
      difference: new Prisma.Decimal(actualCash - expectedTotal),
      ordersCount: orders.length,
      totalSales: new Prisma.Decimal(totalSales),
      averageOrderValue: new Prisma.Decimal(avgOrderValue),
      paymentMethods: Array.from(paymentMethods.entries()).map(([method, data]) => ({
        method,
        amount: data.amount,
        count: data.count
      })),
      salesByCategory: Array.from(salesByCategory.entries()).map(([category, data]) => ({
        category,
        amount: data.amount,
        count: data.count
      })),
      topSellingItems: topSellingItems,
      discountSummary: {
        totalDiscounts: discountSummary.totalDiscounts,
        discountedOrders: discountSummary.discountedOrders,
        averageDiscount: discountSummary.averageDiscount,
        totalOrders: orders.length
      },
      taxSummary: {
        totalTax: taxSummary.totalTax,
        taxableAmount: taxSummary.taxableAmount,
        taxRate: taxSummary.taxableAmount > 0 
          ? (taxSummary.totalTax / taxSummary.taxableAmount) * 100 
          : 0
      },
      hourlySales: formattedHourlySales,
      orderTypes: formattedOrderTypes,
      branchId,
      createdById: userId
    },
    include: {
      branch: {
        select: {
          id: true,
          name: true
        }
      },
      createdBy: {
        select: {
          id: true,
          name: true
        }
      }
    }
  });

  // Map the Prisma response to our DayEndReportData interface
  const result: DayEndReportData = {
    id: report.id,
    date: report.createdAt,
    expectedTotal: toNumber(report.expectedTotal),
    actualCash: toNumber(report.actualCash),
    difference: toNumber(report.difference),
    ordersCount: report.ordersCount,
    totalSales: toNumber(report.totalSales),
    averageOrderValue: toNumber(report.averageOrderValue || 0),
    paymentMethods: Array.isArray(report.paymentMethods) 
      ? report.paymentMethods.map((pm: any) => ({
          method: pm.method,
          amount: Number(pm.amount),
          count: Number(pm.count)
        }))
      : [],
    salesByCategory: Array.isArray(report.salesByCategory)
      ? report.salesByCategory.map((cat: any) => ({
          category: cat.category,
          amount: Number(cat.amount),
          count: Number(cat.count)
        }))
      : [],
    topSellingItems: Array.isArray(report.topSellingItems)
      ? report.topSellingItems.map((item: any) => ({
          id: item.id,
          name: item.name,
          quantity: Number(item.quantity),
          total: Number(item.total)
        }))
      : [],
    discountSummary: report.discountSummary ? {
      totalDiscounts: Number(report.discountSummary.totalDiscounts || 0),
      discountedOrders: Number(report.discountSummary.discountedOrders || 0),
      averageDiscount: Number(report.discountSummary.averageDiscount || 0),
      totalOrders: Number(report.discountSummary.totalOrders || 0)
    } : {
      totalDiscounts: 0,
      discountedOrders: 0,
      averageDiscount: 0,
      totalOrders: 0
    },
    taxSummary: report.taxSummary ? {
      totalTax: Number(report.taxSummary.totalTax || 0),
      taxableAmount: Number(report.taxSummary.taxableAmount || 0),
      taxRate: Number(report.taxSummary.taxRate || 0)
    } : {
      totalTax: 0,
      taxableAmount: 0,
      taxRate: 0
    },
    hourlySales: Array.isArray(report.hourlySales)
      ? report.hourlySales.map((hour: any) => ({
          hour: Number(hour.hour),
          amount: Number(hour.amount),
          orderCount: Number(hour.orderCount)
        }))
      : [],
    orderTypes: Array.isArray(report.orderTypes)
      ? report.orderTypes.map((type: any) => ({
          type: type.type,
          count: Number(type.count),
          total: Number(type.total)
        }))
      : [],
    branchId: report.branchId,
    branch: report.branch ? {
      id: report.branch.id,
      name: report.branch.name
    } : undefined,
    createdBy: report.createdBy ? {
      id: report.createdBy.id,
      name: report.createdBy.name
    } : undefined,
    createdById: report.createdById,
    createdAt: report.createdAt,
    updatedAt: report.updatedAt
  };

  return result;
}

export async function getDayEndReports(params: {
  startDate?: Date;
  endDate?: Date;
  branchId?: string;
  page?: number;
  pageSize?: number;
}) {
  const { startDate, endDate, branchId, page = 1, pageSize = 10 } = params;
  const skip = (page - 1) * pageSize;

  const where: any = {};
  
  if (startDate || endDate) {
    where.createdAt = {};
    if (startDate) where.createdAt.gte = startDate;
    if (endDate) where.createdAt.lte = endDate;
  }
  
  if (branchId) where.branchId = branchId;

  const [reports, total] = await Promise.all([
    prisma.dayEndReport.findMany({
      where,
      include: {
        branch: {
          select: {
            id: true,
            name: true
          }
        },
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      },
      skip,
      take: pageSize
    }),
    prisma.dayEndReport.count({ where })
  ]);

  return {
    data: reports.map(report => ({
      ...report,
      expectedTotal: report.expectedTotal.toNumber(),
      actualCash: report.actualCash.toNumber(),
      difference: report.difference.toNumber(),
      totalSales: report.totalSales.toNumber()
    })),
    meta: {
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize)
    }
  };
}

export async function getDayEndReportById(id: string) {
  const report = await prisma.dayEndReport.findUnique({
    where: { id },
    include: {
      branch: {
        select: {
          id: true,
          name: true
        }
      },
      createdBy: {
        select: {
          id: true,
          name: true,
          email: true
        }
      }
    }
  });

  if (!report) return null;

  return {
    ...report,
    expectedTotal: report.expectedTotal.toNumber(),
    actualCash: report.actualCash.toNumber(),
    difference: report.difference.toNumber(),
    totalSales: report.totalSales.toNumber()
  };
}
