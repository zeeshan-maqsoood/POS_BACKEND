"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const date_fns_1 = require("date-fns");
const prisma = new client_1.PrismaClient();
exports.default = {
    async getSalesData({ from, to }, branchName) {
        const orders = await prisma.order.findMany({
            where: {
                createdAt: {
                    gte: from,
                    lte: to,
                },
                paymentStatus: 'PAID',
                ...(branchName && { branchName }),
            },
            include: {
                items: true,
                payments: true,
            },
        });
        // Group by date
        const daysInRange = (0, date_fns_1.eachDayOfInterval)({ start: from, end: to });
        const salesByDate = daysInRange.map(day => {
            const dayOrders = orders.filter(order => (0, date_fns_1.isWithinInterval)(new Date(order.createdAt), {
                start: (0, date_fns_1.startOfDay)(day),
                end: (0, date_fns_1.endOfDay)(day)
            }));
            return {
                date: (0, date_fns_1.format)(day, 'yyyy-MM-dd'),
                orders: dayOrders.length,
                revenue: dayOrders.reduce((sum, order) => sum + order.total, 0),
            };
        });
        return salesByDate;
    },
    async getOrdersByStatus({ from, to }, branchName) {
        const orders = await prisma.order.groupBy({
            by: ['status'],
            where: {
                createdAt: { gte: from, lte: to },
                ...(branchName && { branchName }),
            },
            _count: { id: true },
        });
        return orders.map(status => ({
            status: status.status,
            value: status._count.id,
        }));
    },
    async getOrdersByType({ from, to }, branchName) {
        const orders = await prisma.$queryRaw `
      SELECT "orderType" as type, COUNT(*)::int as count
      FROM "Order"
      WHERE "createdAt" >= ${from} AND "createdAt" <= ${to}
        ${branchName ? client_1.Prisma.sql `AND "branchName" = ${branchName}` : client_1.Prisma.empty}
      GROUP BY "orderType"
    `;
        return orders.map(item => ({
            type: item.type,
            value: item.count,
        }));
    },
    async getRevenueByPaymentMethod({ from, to }, branchName) {
        try {
            // First, get all payment methods from the enum to ensure we include all possible methods
            const paymentMethods = Object.values(client_1.PaymentMethod);
            // Initialize payment totals with 0 for all methods
            const paymentTotals = new Map();
            paymentMethods.forEach(method => {
                paymentTotals.set(method, 0);
            });
            // First try to get data from orders if payments are empty
            const orders = await prisma.order.findMany({
                where: {
                    createdAt: { gte: from, lte: to },
                    paymentStatus: 'PAID',
                    ...(branchName ? { branchName } : {}),
                    paymentMethod: { not: null },
                    total: { gt: 0 }
                },
                select: {
                    paymentMethod: true,
                    total: true,
                    branchName: true
                }
            });
            // If we have orders with payment methods, use them
            if (orders.length > 0) {
                orders.forEach(order => {
                    if (order.paymentMethod) {
                        const currentTotal = paymentTotals.get(order.paymentMethod) || 0;
                        paymentTotals.set(order.paymentMethod, currentTotal + Number(order.total || 0));
                    }
                });
            }
            else {
                // Fall back to payments table if no orders with payment methods found
                const payments = await prisma.payment.findMany({
                    where: {
                        createdAt: { gte: from, lte: to },
                        order: {
                            paymentStatus: 'PAID',
                            ...(branchName ? { branchName } : {})
                        }
                    },
                    include: {
                        order: {
                            select: {
                                total: true,
                                branchName: true,
                                paymentStatus: true
                            }
                        }
                    }
                });
                payments.forEach(payment => {
                    const currentTotal = paymentTotals.get(payment.method) || 0;
                    paymentTotals.set(payment.method, currentTotal + Number(payment.order?.total || 0));
                });
            }
            // Convert to array of { method, value }
            return paymentMethods.map(method => ({
                method,
                value: Number((paymentTotals.get(method) || 0).toFixed(2))
            }));
        }
        catch (error) {
            console.error('Error getting revenue by payment method:', error);
            // Return all payment methods with 0 values in case of error
            return Object.values(client_1.PaymentMethod).map(method => ({
                method,
                value: 0,
            }));
        }
    },
    async getRevenueByBranch({ from, to }) {
        try {
            const branches = await prisma.order.groupBy({
                by: ['branchName'],
                where: {
                    createdAt: { gte: from, lte: to },
                    paymentStatus: 'PAID',
                    branchName: { not: null },
                },
                _sum: { total: true },
            });
            return branches.map(branch => ({
                branch: branch.branchName || 'Unknown',
                revenue: branch._sum.total || 0,
            }));
        }
        catch (error) {
            console.error('Error getting revenue by branch:', error);
            return [];
        }
    },
    async getBestSellingItems({ from, to, limit = 5 }, branchName) {
        const items = await prisma.orderItem.groupBy({
            by: ['name'],
            where: {
                order: {
                    createdAt: { gte: from, lte: to },
                    paymentStatus: 'PAID',
                    ...(branchName && { branchName }),
                },
            },
            _sum: {
                quantity: true,
                price: true
            },
            _count: {
                _all: true // Count of orders containing this item
            },
            orderBy: { _sum: { quantity: 'desc' } },
            take: limit,
        });
        return items.map(item => ({
            name: item.name,
            sales: Number(item._count?._all) || 0, // Use count of orders instead of sum of quantities
            revenue: Number(item._sum.price) || 0
        }));
    },
    async getOrdersByDayOfWeek({ from, to }, branchName) {
        const orders = await prisma.$queryRaw `
      WITH daily_orders AS (
        SELECT 
          TO_CHAR("createdAt" AT TIME ZONE 'UTC', 'Dy') as day_name,
          COUNT(*)::int as count
        FROM "Order"
        WHERE 
          "createdAt" >= ${from} 
          AND "createdAt" <= ${to}
          ${branchName ? client_1.Prisma.sql `AND "branchName" = ${branchName}` : client_1.Prisma.empty}
        GROUP BY day_name
      )
      SELECT 
        TRIM(day_name) as day,
        count
      FROM daily_orders
      ORDER BY 
        CASE 
          WHEN TRIM(day_name) = 'Mon' THEN 1
          WHEN TRIM(day_name) = 'Tue' THEN 2
          WHEN TRIM(day_name) = 'Wed' THEN 3
          WHEN TRIM(day_name) = 'Thu' THEN 4
          WHEN TRIM(day_name) = 'Fri' THEN 5
          WHEN TRIM(day_name) = 'Sat' THEN 6
          WHEN TRIM(day_name) = 'Sun' THEN 7
        END
    `;
        return orders.map(day => ({
            day: day.day,
            orders: Number(day.count),
        }));
    },
    async getPopularModifiers({ from, to, limit = 4 }, branchName) {
        try {
            // First, get all order items with their modifiers
            const orderItems = await prisma.orderItem.findMany({
                where: {
                    order: {
                        createdAt: {
                            gte: from,
                            lte: to,
                        },
                        ...(branchName && { branchName }),
                    },
                    AND: [
                        { modifiers: { not: client_1.Prisma.JsonNull } },
                        { modifiers: { not: '[]' } },
                        { modifiers: { not: 'null' } }
                    ]
                },
                select: {
                    id: true,
                    modifiers: true
                }
            });
            // Count modifier occurrences
            const modifierCounts = {};
            orderItems.forEach(item => {
                try {
                    // Try to parse the modifiers if it's a string
                    const modifiers = typeof item.modifiers === 'string'
                        ? JSON.parse(item.modifiers)
                        : item.modifiers;
                    // If modifiers is an array, process each modifier
                    if (Array.isArray(modifiers)) {
                        modifiers.forEach((mod) => {
                            if (mod?.name) {
                                modifierCounts[mod.name] = (modifierCounts[mod.name] || 0) + 1;
                            }
                        });
                    }
                }
                catch (e) {
                    console.error('Error processing modifiers:', e);
                    // Skip this item if there's an error parsing modifiers
                }
            });
            // Convert to array and sort by count
            const popularModifiers = Object.entries(modifierCounts)
                .map(([name, count]) => ({ name, count }))
                .sort((a, b) => b.count - a.count)
                .slice(0, limit);
            return popularModifiers;
        }
        catch (error) {
            console.error('Error getting popular modifiers:', error);
            return [];
        }
    },
    async getPeakHours({ from, to }, branchName) {
        // Get all orders in the date range
        const orders = await prisma.order.findMany({
            where: {
                createdAt: {
                    gte: from,
                    lte: to,
                },
                ...(branchName && { branchName }),
            },
            select: {
                createdAt: true,
            },
        });
        // Initialize an array to hold counts for each hour (0-23)
        const hoursCount = Array(24).fill(0);
        // Count orders by hour
        orders.forEach(order => {
            const hour = new Date(order.createdAt).getHours();
            hoursCount[hour]++;
        });
        // Convert to array of { hour, count } objects and sort by count (descending)
        const peakHours = hoursCount
            .map((count, hour) => ({
            hour: `${hour}:00`,
            count,
            percentage: orders.length > 0 ? Math.round((count / orders.length) * 100) : 0,
        }))
            .sort((a, b) => b.count - a.count);
        return {
            peakHours: peakHours.slice(0, 8), // Return top 8 busiest hours
            totalOrders: orders.length,
        };
    },
    async getDashboardAnalytics({ from, to }, branchName) {
        // Get all orders (including all statuses)
        const allOrders = await prisma.order.findMany({
            where: {
                createdAt: { gte: from, lte: to },
                ...(branchName && { branchName }),
            },
        });
        // First, get all paid orders to calculate summary statistics
        const paidOrders = await prisma.order.findMany({
            where: {
                paymentStatus: 'PAID',
                createdAt: { gte: from, lte: to },
                ...(branchName ? { branchName } : {}),
            },
            select: {
                total: true,
                items: true,
            },
        });
        const cancelledOrders = await prisma.order.count({
            where: {
                status: 'CANCELLED',
                createdAt: { gte: from, lte: to },
                ...(branchName && { branchName }),
            },
        });
        // Calculate cancellation rate
        // Calculate summary statistics from paid orders only
        const totalOrders = allOrders.length;
        const cancelOrders = allOrders.filter(order => order.status === 'CANCELLED').length;
        const totalRevenue = paidOrders.reduce((sum, order) => sum + Number(order.total), 0);
        const avgOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;
        const cancellationRate = totalOrders > 0
            ? (cancelOrders / totalOrders) * 100
            : 0;
        console.log(cancellationRate, "cancellationRate");
        const [salesData, ordersByType, ordersByStatus, revenueByPayment, revenueByBranch, bestSellingItems, ordersByDayData, peakHoursData, popularModifiers,] = await Promise.all([
            this.getSalesData({ from, to }, branchName),
            this.getOrdersByType({ from, to }, branchName),
            this.getOrdersByStatus({ from, to }, branchName),
            this.getRevenueByPaymentMethod({ from, to }, branchName),
            this.getRevenueByBranch({ from, to }),
            this.getBestSellingItems({ from, to, limit: 5 }, branchName),
            this.getOrdersByDayOfWeek({ from, to }, branchName),
            this.getPeakHours({ from, to }, branchName),
            this.getPopularModifiers({ from, to, limit: 4 }, branchName),
        ]);
        return {
            summary: {
                totalOrders,
                totalRevenue: Number(totalRevenue.toFixed(2)),
                avgOrderValue: Number(avgOrderValue.toFixed(2)),
                cancellationRate: Number(cancellationRate.toFixed(2)),
            },
            salesData,
            ordersByType,
            ordersByStatus,
            revenueByPayment: revenueByPayment.map(p => ({
                method: p.method,
                value: Number(Number(p.value).toFixed(2))
            })),
            revenueByBranch: revenueByBranch.map(b => ({
                branch: b.branch,
                revenue: Number(Number(b.revenue).toFixed(2))
            })),
            bestSellingItems,
            ordersByDay: ordersByDayData,
            peakHours: peakHoursData.peakHours,
            popularModifiers,
        };
    },
};
//# sourceMappingURL=analytic.service.js.map