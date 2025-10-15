"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_middleware_1 = require("../middleware/auth.middleware");
const client_1 = require("@prisma/client");
const date_fns_1 = require("date-fns");
const router = (0, express_1.Router)();
const prisma = new client_1.PrismaClient();
// Helper function to get date range based on time period
const getDateRange = (period) => {
    const now = new Date();
    switch (period) {
        case 'today':
            return {
                start: (0, date_fns_1.startOfDay)(now),
                end: (0, date_fns_1.endOfDay)(now)
            };
        case 'week':
            return {
                start: (0, date_fns_1.startOfWeek)(now, { weekStartsOn: 0 }),
                end: (0, date_fns_1.endOfWeek)(now, { weekStartsOn: 0 })
            };
        case 'month':
            return {
                start: (0, date_fns_1.startOfMonth)(now),
                end: (0, date_fns_1.endOfMonth)(now)
            };
        case 'year':
            return {
                start: (0, date_fns_1.startOfYear)(now),
                end: (0, date_fns_1.endOfYear)(now)
            };
        default:
            return {
                start: (0, date_fns_1.startOfDay)(now),
                end: (0, date_fns_1.endOfDay)(now)
            };
    }
};
// Get analytics overview
router.get('/overview', auth_middleware_1.authenticateJWT, async (req, res) => {
    try {
        const { period = 'week' } = req.query;
        const { start, end } = getDateRange(period);
        // Get total sales
        const totalSales = await prisma.order.aggregate({
            _sum: {
                total: true
            },
            where: {
                status: 'COMPLETED',
                createdAt: {
                    gte: start,
                    lte: end
                }
            }
        });
        // Get total orders
        const totalOrders = await prisma.order.count({
            where: {
                status: 'COMPLETED',
                createdAt: {
                    gte: start,
                    lte: end
                }
            }
        });
        // Get new customers
        const newCustomers = await prisma.user.count({
            where: {
                createdAt: {
                    gte: start,
                    lte: end
                },
                role: 'CUSTOMER'
            }
        });
        // Calculate average order value
        const avgOrderValue = totalOrders > 0
            ? (totalSales._sum.total || 0) / totalOrders
            : 0;
        // Get previous period for comparison
        const prevStart = (0, date_fns_1.subDays)(start, period === 'week' ? 7 : period === 'month' ? 30 : period === 'year' ? 365 : 1);
        const prevEnd = (0, date_fns_1.subDays)(end, period === 'week' ? 7 : period === 'month' ? 30 : period === 'year' ? 365 : 1);
        const prevTotalSales = await prisma.order.aggregate({
            _sum: {
                total: true
            },
            where: {
                status: 'COMPLETED',
                createdAt: {
                    gte: prevStart,
                    lte: prevEnd
                }
            }
        });
        // Calculate percentage changes
        const calculateChange = (current, previous) => {
            if (previous === 0)
                return 100;
            return ((current - previous) / previous) * 100;
        };
        const salesChange = calculateChange(Number(totalSales._sum.total || 0), Number(prevTotalSales._sum.total || 0));
        res.json({
            totalSales: {
                value: Number(totalSales._sum.total || 0).toFixed(2),
                change: salesChange.toFixed(1)
            },
            totalOrders: {
                value: totalOrders,
                change: 0 // You can implement similar logic for other metrics
            },
            newCustomers: {
                value: newCustomers,
                change: 0
            },
            avgOrderValue: {
                value: avgOrderValue.toFixed(2),
                change: 0
            }
        });
    }
    catch (error) {
        console.error('Error fetching analytics overview:', error);
        res.status(500).json({ error: 'Failed to fetch analytics data' });
    }
});
// Get sales data for charts
router.get('/sales', auth_middleware_1.authenticateJWT, async (req, res) => {
    try {
        const { period = 'week' } = req.query;
        const { start, end } = getDateRange(period);
        // Group sales by day/week/month based on period
        const salesData = await prisma.$queryRaw `
      SELECT 
        DATE_TRUNC(${period === 'year' ? 'month' : 'day'}, "createdAt") as date,
        SUM(total) as total
      FROM "Order"
      WHERE "status" = 'COMPLETED'
        AND "createdAt" >= ${start}
        AND "createdAt" <= ${end}
      GROUP BY 1
      ORDER BY 1 ASC
    `;
        res.json({
            labels: salesData.map(item => (0, date_fns_1.format)(new Date(item.date), period === 'year' ? 'MMM yyyy' : 'EEE')),
            values: salesData.map(item => Number(item.total))
        });
    }
    catch (error) {
        console.error('Error fetching sales data:', error);
        res.status(500).json({ error: 'Failed to fetch sales data' });
    }
});
// Get top products
router.get('/top-products', auth_middleware_1.authenticateJWT, async (req, res) => {
    try {
        const { limit = 5 } = req.query;
        const topProducts = await prisma.orderItem.groupBy({
            by: ['menuItemId'],
            _sum: {
                quantity: true
            },
            orderBy: {
                _sum: {
                    quantity: 'desc'
                }
            },
            take: Number(limit)
        });
        // Get product details
        const productIds = topProducts
            .map(item => item.menuItemId)
            .filter((id) => id !== null);
        const products = await prisma.menuItem.findMany({
            where: {
                id: {
                    in: productIds
                }
            },
            select: {
                id: true,
                name: true,
                price: true
            }
        });
        const result = topProducts.map(item => {
            const product = products.find(p => p.id === item.menuItemId);
            return {
                id: item.menuItemId,
                name: product?.name || 'Unknown',
                sales: item._sum.quantity || 0,
                revenue: (item._sum.quantity || 0) * (Number(product?.price) || 0)
            };
        });
        res.json(result);
    }
    catch (error) {
        console.error('Error fetching top products:', error);
        res.status(500).json({ error: 'Failed to fetch top products' });
    }
});
exports.default = router;
//# sourceMappingURL=analytics.route.js.map