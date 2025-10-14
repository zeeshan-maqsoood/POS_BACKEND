import prisma from '../../loaders/prisma';
import { InventoryStatus, OrderStatus, PaymentMethod, OrderType } from '@prisma/client';

interface ReportParams {
  startDate?: string;
  endDate?: string;
  branchName?: string;
  user?: any;
  [key: string]: any;
}

export const reportsService = {
  // ==================== SALES & ORDER REPORTS ====================
  async getSalesOverview(params: ReportParams) {
    try {
      const { startDate, endDate, branchName, user } = params;

      const where = buildWhereClause({ startDate, endDate, branchName, user });

      const [
        ordersByStatus,
        ordersByType,
        paymentMethods,
        dailySales,
        totalStats,
        // Add paid orders aggregation
        paidOrdersStats
      ] = await Promise.all([
        // Orders by status
        prisma.order.groupBy({
          by: ['status'],
          where,
          _count: { _all: true },
          _sum: { total: true }
        }),

        // Orders by type
        prisma.order.groupBy({
          by: ['orderType'],
          where:{...where,paymentStatus:'PAID'},
          _count: { _all: true },
          _sum: { total: true }
        }),

        // Payment methods
        prisma.order.groupBy({
          by: ['paymentMethod'],
          where:{...where,paymentStatus:'PAID'},
          _count: { _all: true },
          _sum: { total: true }
        }),

        // Daily sales for chart (only paid orders)
        prisma.order.groupBy({
          by: ['createdAt'],
          where: { ...where, paymentStatus: 'PAID' },
          _sum: { total: true },
          orderBy: { createdAt: 'asc' }
        }),

        // Total statistics (all orders)
        prisma.order.aggregate({
          where,
          _count: { _all: true },
          _sum: { total: true, subtotal: true, tax: true }
        }),

        // Paid orders statistics
        prisma.order.aggregate({
          where: { ...where, paymentStatus: 'PAID' },
          _count: { _all: true },
          _sum: { total: true, subtotal: true, tax: true }
        })
      ]);

      const overview = {
        totalOrders: totalStats._count._all,
        totalRevenue: paidOrdersStats._sum.total || 0, // Only count paid orders
        totalSubtotal: paidOrdersStats._sum.subtotal || 0,
        totalTax: paidOrdersStats._sum.tax || 0,
        paidOrders: paidOrdersStats._count._all,
        pendingPaymentOrders: totalStats._count._all - paidOrdersStats._count._all,
        ordersByStatus,
        ordersByType,
        paymentMethods,
        dailySales: dailySales.map(item => ({
          date: item.createdAt.toISOString().split('T')[0],
          revenue: item._sum.total || 0
        })),
        avgOrderValue: paidOrdersStats._count._all > 0 ?
          (paidOrdersStats._sum.total || 0) / paidOrdersStats._count._all : 0
      };
      return {
        success: true,
        message: "Sales overview fetched successfully",
        data: overview,
        statusCode: 200
      };
    } catch (error) {
      console.error('Error in getSalesOverview:', error);
      throw error;
    }
  },


  async getOrderReports(params: ReportParams) {
    try {
      const { startDate, endDate, branchName, status, user } = params;

      const where = buildWhereClause({ startDate, endDate, branchName, status, user });

      const orders = await prisma.order.findMany({
        where,
        include: {
          items: true,
          createdBy: {
            select: { name: true, email: true, role: true }
          }
        },
        orderBy: { createdAt: 'desc' }
      });
  const paidOrders=orders.filter(o=>o.paymentStatus==='PAID')
      // Calculate metrics
      const metrics = {
        totalOrders: orders.length,
        completedOrders: orders.filter(o => o.status === 'COMPLETED').length,
        cancelledOrders: orders.filter(o => o.status === 'CANCELLED').length,
        pendingOrders: orders.filter(o => o.status === 'PENDING').length,
        totalRevenue: orders.reduce((sum, order) => sum + order.total, 0),
        avgOrderValue: paidOrders.length > 0 ?
          paidOrders.reduce((sum, order) => sum + order.total, 0) / paidOrders.length : 0,
        revenueByStatus: orders.reduce((acc, order) => {
          acc[order.status] = (acc[order.status] || 0) + order.total;
          return acc;
        }, {} as any)
      };

      return {
        success: true,
        message: "Order reports fetched successfully",
        data: { orders, metrics },
        statusCode: 200
      };
    } catch (error) {
      console.error('Error in getOrderReports:', error);
      throw error;
    }
  },

  async getPaymentReports(params: ReportParams) {
    try {
      const { startDate, endDate, branchName, paymentMethod, user } = params;

      const where = buildWhereClause({ startDate, endDate, branchName, paymentMethod, user });

      const payments = await prisma.order.groupBy({
        by: ['paymentMethod', 'paymentStatus'],
        where,
        _count: { _all: true },
        _sum: { total: true }
      });

      const paymentSummary = await prisma.order.groupBy({
        by: ['paymentMethod'],
        where,
        _count: { _all: true },
        _sum: { total: true }
      });

      const paymentStatusSummary = await prisma.order.groupBy({
        by: ['paymentStatus'],
        where,
        _count: { _all: true },
        _sum: { total: true }
      });
     
      return {
        success: true,
        message: "Payment reports fetched successfully",
        data: {
          paymentDetails: payments,
          paymentSummary,
          paymentStatusSummary,
          totalTransactions: payments.reduce((sum, item) => sum + item._count._all, 0),
          totalAmount: payments.reduce((sum, item) => sum + (item._sum.total || 0), 0)
        },
        statusCode: 200
      };
    } catch (error) {
      console.error('Error in getPaymentReports:', error);
      throw error;
    }
  },

  // ==================== INVENTORY REPORTS ====================
  async getInventoryStatus(params: ReportParams) {
    try {
      const { branchName, categoryId, status, user } = params;
      const where: any = {};
      
      if (categoryId) where.categoryId = categoryId;
      if (status) where.status = status as InventoryStatus;
      
      // Branch filter for managers
      if (user?.role === 'MANAGER' && user?.branch) {
        where.branchName = user.branch;
      } else if (branchName) {
        where.branchName = branchName;

      }

      const inventory = await prisma.inventoryItem.findMany({
        where,
        include: {
          category: true,
          subcategory: true,
          _count: {
            select: {
              MenuItemIngredient: true,
              ModifierIngredient: true,
              InventoryTransaction: true
            }
          }
        },
        orderBy: { name: 'asc' }
      });
    
      // Calculate inventory metrics
      const metrics = {
        totalItems: inventory.length,
        inStock: inventory.filter(item => item.status === 'IN_STOCK').length,
        lowStock: inventory.filter(item => item.status === 'LOW_STOCK').length,
        outOfStock: inventory.filter(item => item.status === 'OUT_OF_STOCK').length,
        totalValue: inventory.reduce((sum, item) => sum + (item.quantity * item.cost), 0),
        avgCost: inventory.length > 0 ?
          inventory.reduce((sum, item) => sum + item.cost, 0) / inventory.length : 0,
        itemsByCategory: await prisma.inventoryCategory.findMany({
          where: { branchName: where.branchName },
          include: {
            _count: {
              select: { items: true }
            }
          }
        })
      };

      return {
        success: true,
        message: "Inventory status fetched successfully",
        data: { inventory, metrics },
        statusCode: 200
      };
    } catch (error) {
      console.error('Error in getInventoryStatus:', error);
      throw error;
    }
  },

  async getInventoryTransactions(params: ReportParams) {
    try {
      const { startDate, endDate, branchName, type, user } = params;

      const where: any = {};

      if (startDate || endDate) {
        where.createdAt = {};
        if (startDate) where.createdAt.gte = new Date(startDate);
        if (endDate) {
          const end = new Date(endDate);
          end.setHours(23, 59, 59, 999);
          where.createdAt.lte = end;
        }
      }

      if (type) where.type = type;

      // Branch filter for managers
      if (user?.role === 'MANAGER' && user?.branch) {
        where.branchName = user.branch;
      } else if (branchName) {
        where.branchName = branchName;
      }

      const transactions = await prisma.inventoryTransaction.findMany({
        where,
        include: {
          inventoryItem: {
            include: {
              category: true
            }
          },
          createdBy: {
            select: { name: true, email: true }
          }
        },
        orderBy: { createdAt: 'desc' }
      });

      const transactionSummary = await prisma.inventoryTransaction.groupBy({
        by: ['type'],
        where,
        _count: { _all: true },
        _sum: { quantity: true }
      });

      const monthlyTransactions = await prisma.inventoryTransaction.groupBy({
        by: ['createdAt'],
        where,
        _count: { _all: true },
        _sum: { quantity: true },
        orderBy: { createdAt: 'asc' }
      });

      return {
        success: true,
        message: "Inventory transactions fetched successfully",
        data: {
          transactions,
          summary: transactionSummary,
          monthlyTrend: monthlyTransactions,
          totalTransactions: transactions.length
        },
        statusCode: 200
      };
    } catch (error) {
      console.error('Error in getInventoryTransactions:', error);
      throw error;
    }
  },

  async getLowStockAlerts(params: ReportParams) {
    try {
      const { branchName, user } = params;

      const where: any = {
        OR: [
          { status: 'LOW_STOCK' },
          { status: 'OUT_OF_STOCK' }
        ]
      };

      // Branch filter for managers
      if (user?.role === 'MANAGER' && user?.branch) {
        where.branchName = user.branch;
      } else if (branchName) {
        where.branchName = branchName;
      }

      const lowStockItems = await prisma.inventoryItem.findMany({
        where,
        include: {
          category: true,
          subcategory: true
        },
        orderBy: [
          { status: 'desc' }, // OUT_OF_STOCK first
          { quantity: 'asc' } // Lowest quantity first
        ]
      });

      const alerts = lowStockItems.map(item => ({
        ...item,
        urgency: item.status === 'OUT_OF_STOCK' ? 'CRITICAL' :
          item.quantity <= (item.minStock * 0.5) ? 'HIGH' : 'MEDIUM',
        needsRestock: item.status === 'OUT_OF_STOCK' || item.quantity <= item.minStock,
        restockQuantity: item.maxStock - item.quantity
      }));
   
      return {
        success: true,
        message: "Low stock alerts fetched successfully",
        data: {
          alerts,
          criticalCount: alerts.filter(a => a.urgency === 'CRITICAL').length,
          highCount: alerts.filter(a => a.urgency === 'HIGH').length,
          mediumCount: alerts.filter(a => a.urgency === 'MEDIUM').length,
          totalAlerts: alerts.length
        },
        statusCode: 200
      };
    } catch (error) {
      console.error('Error in getLowStockAlerts:', error);
      throw error;
    }
  },

  // ==================== MENU REPORTS ====================
  async getMenuPerformance(params: ReportParams) {
    try {
      const { startDate, endDate, branchName, categoryId, user } = params;

      const where = buildWhereClause({ startDate, endDate, branchName, user });

      // Get order items with menu item details
      const orderItems = await prisma.orderItem.findMany({
        where: {
          order: where,
          menuItemId: { not: null }
        },
        include: {
          menuItem: {
            include: {
              category: true
            }
          },
          order: {
            select: {
              branchName: true,
              createdAt: true
            }
          }
        }
      });

      // Group by menu item
      const menuItemPerformance = orderItems.reduce((acc, item) => {
        const menuItemId = item.menuItemId;
        if (!menuItemId) return acc;
        
        if (!acc[menuItemId]) {
          acc[menuItemId] = {
            menuItem: item.menuItem,
            totalQuantity: 0,
            totalRevenue: 0,
            ordersCount: 0
          };
        }

        acc[menuItemId].totalQuantity += item.quantity;
        acc[menuItemId].totalRevenue += item.total;
        acc[menuItemId].ordersCount += 1;
        
        return acc;
      }, {} as any);

      const performanceArray = Object.values(menuItemPerformance)
        .sort((a: any, b: any) => b.totalRevenue - a.totalRevenue);

      // Filter by category if specified
      const filteredPerformance = categoryId
        ? performanceArray.filter((item: any) => item.menuItem.categoryId === categoryId)
        : performanceArray;

      return {
        success: true,
        message: "Menu performance fetched successfully",
        data: {
          menuItems: filteredPerformance,
          totalItems: filteredPerformance.length,
          totalRevenue: filteredPerformance.reduce((sum: number, item: any) => sum + item.totalRevenue, 0),
          totalQuantity: filteredPerformance.reduce((sum: number, item: any) => sum + item.totalQuantity, 0)
        },
        statusCode: 200
      };
    } catch (error) {
      console.error('Error in getMenuPerformance:', error);
      throw error;
    }
  },

  async getCategoryPerformance(params: ReportParams) {
    try {
      const { startDate, endDate, branchName, user } = params;

      const where = buildWhereClause({ startDate, endDate, branchName, user });

      const orderItems = await prisma.orderItem.findMany({
        where: {
          order: where,
          menuItem: { isNot: null }
        },
        include: {
          menuItem: {
            include: {
              category: true
            }
          }
        }
      });

      // Group by category
      const categoryPerformance = orderItems.reduce((acc, item) => {
        const category = item.menuItem?.category;
        if (!category) return acc;

        if (!acc[category.id]) {
          acc[category.id] = {
            category: category,
            totalQuantity: 0,
            totalRevenue: 0,
            itemsCount: 0,
            uniqueItems: new Set()
          };
        }

        acc[category.id].totalQuantity += item.quantity;
        acc[category.id].totalRevenue += item.total;
        acc[category.id].itemsCount += 1;
        acc[category.id].uniqueItems.add(item.menuItemId);

        return acc;
      }, {} as any);

      // Convert to array and calculate additional metrics
      const performanceArray = Object.values(categoryPerformance).map((item: any) => ({
        ...item,
        uniqueItemsCount: item.uniqueItems.size,
        avgItemValue: item.totalRevenue / item.itemsCount,
        popularity: item.totalQuantity
      })).sort((a: any, b: any) => b.totalRevenue - a.totalRevenue);

      return {
        success: true,
        message: "Category performance fetched successfully",
        data: {
          categories: performanceArray,
          totalCategories: performanceArray.length,
          totalRevenue: performanceArray.reduce((sum: number, item: any) => sum + item.totalRevenue, 0)
        },
        statusCode: 200
      };
    } catch (error) {
      console.error('Error in getCategoryPerformance:', error);
      throw error;
    }

  },

  // ==================== BRANCH REPORTS ====================
  async getBranchPerformance(params: ReportParams) {
    try {
      const { startDate, endDate, user } = params;

      const where = buildWhereClause({ startDate, endDate, user });

      const branchPerformance = await prisma.order.groupBy({
        by: ['branchName'],
        where,
        _count: { _all: true },
        _sum: {
          total: true,
          subtotal: true,
          tax: true
        },
        orderBy: {
          _sum: {
            total: 'desc'
          }
        }
      });

      // Calculate additional metrics
      const performanceWithMetrics = await Promise.all(
        branchPerformance.map(async (branch) => {
          const branchWhere = { ...where, branchName: branch.branchName };

          const [completedOrders, staffCount, inventoryValue] = await Promise.all([
            // Completed orders count
            prisma.order.count({
              where: { ...branchWhere, status: 'COMPLETED' }
            }),
            // Staff count
            prisma.user.count({
              where: {
                branch: branch.branchName,
                role: { in: ['MANAGER', 'CASHIER', 'WAITER', 'KITCHEN_STAFF'] }
              }
            }),
            // Inventory value
            prisma.inventoryItem.aggregate({
              where: { branchName: branch.branchName },
              _sum: {
                quantity: true,
                cost: true
              }
            })
          ]);


          return {
            ...branch,
            completedOrders,
            completionRate: branch._count._all > 0 ? (completedOrders / branch._count._all) * 100 : 0,
            staffCount,
            inventoryValue: (inventoryValue._sum.quantity || 0) * (inventoryValue._sum.cost || 0),
            avgOrderValue: branch._count._all > 0 ? (branch._sum.total || 0) / branch._count._all : 0
          };
        })
      );

      return {
        success: true,
        message: "Branch performance fetched successfully",
        data: {
          branches: performanceWithMetrics,
          totalBranches: performanceWithMetrics.length,
          overallRevenue: performanceWithMetrics.reduce((sum, branch) => sum + (branch._sum.total || 0), 0)
        },
        statusCode: 200
      };
    } catch (error) {
      console.error('Error in getBranchPerformance:', error);
      throw error;
    }
  },

  async getBranchComparison(params: ReportParams) {
    try {
      const { startDate, endDate, user } = params;

      const where = buildWhereClause({ startDate, endDate, user });

      const branchData = await prisma.order.groupBy({
        by: ['branchName', 'createdAt'],
        where,
        _count: { _all: true },
        _sum: { total: true }
      });

      // Group by branch and date for comparison charts
      const comparisonData = branchData.reduce((acc, item) => {
        const branch = item.branchName || 'Unknown';
        const date = item.createdAt.toISOString().split('T')[0];

        if (!acc[branch]) {
          acc[branch] = {};
        }

        if (!acc[branch][date]) {
          acc[branch][date] = {
            orders: 0,
            revenue: 0
          };
        }
      
        acc[branch][date].orders += item._count._all;
        acc[branch][date].revenue += item._sum.total || 0;

        return acc;
      }, {} as any);

      return {
        success: true,
        message: "Branch comparison fetched successfully",
        data: {
          comparison: comparisonData,
          branches: Object.keys(comparisonData)
        },
        statusCode: 200
      };
    } catch (error) {
      console.error('Error in getBranchComparison:', error);
      throw error;
    }
  },

  // ==================== STAFF REPORTS ====================
  async getStaffPerformance(params: ReportParams) {
    try {
      const { startDate, endDate, branchName, user } = params;

      const where = buildWhereClause({ startDate, endDate, branchName, user });

      const staffPerformance = await prisma.order.groupBy({
        by: ['createdById'],
        where,
        _count: { _all: true },
        _sum: { total: true },
        orderBy: {
          _sum: {
            total: 'desc'
          }
        }
      });

      // Get user details for each staff member
      const performanceWithDetails = await Promise.all(
        staffPerformance.map(async (staff) => {
          const userDetails = await prisma.user.findUnique({
            where: { id: staff.createdById },
            select: {
              id: true,
              name: true,
              email: true,
              role: true,
              branch: true
            }
          });
      
          const completedOrders = await prisma.order.count({
            where: {
              ...where,
              createdById: staff.createdById,
              status: 'COMPLETED'
            }
          });

          return {
            user: userDetails,
            totalOrders: staff._count._all,
            totalRevenue: staff._sum.total || 0,
            completedOrders,
            completionRate: staff._count._all > 0 ? (completedOrders / staff._count._all) * 100 : 0,
            avgOrderValue: staff._count._all > 0 ? (staff._sum.total || 0) / staff._count._all : 0
          };
        })
      );

      return {
        success: true,
        message: "Staff performance fetched successfully",
        data: {
          staff: performanceWithDetails,
          totalStaff: performanceWithDetails.length,
          overallPerformance: {
            totalOrders: performanceWithDetails.reduce((sum, staff) => sum + staff.totalOrders, 0),
            totalRevenue: performanceWithDetails.reduce((sum, staff) => sum + staff.totalRevenue, 0),
            avgCompletionRate: performanceWithDetails.reduce((sum, staff) => sum + staff.completionRate, 0) / performanceWithDetails.length
          }
        },
        statusCode: 200
      };
    } catch (error) {
      console.error('Error in getStaffPerformance:', error);
      throw error;
    }
  },

  async getStaffActivity(params: ReportParams) {
    try {
      const { startDate, endDate, branchName, user } = params;

      const where: any = {};

      if (startDate || endDate) {
        where.createdAt = {};
        if (startDate) where.createdAt.gte = new Date(startDate);
        if (endDate) {
          const end = new Date(endDate);
          end.setHours(23, 59, 59, 999);
          where.createdAt.lte = end;
        }
      }

      // Branch filter for user
      if (user?.role === 'MANAGER' && user?.branch) {
        where.branch = user.branch;
      } else if (branchName) {
        where.branch = branchName;
      }

      // Get staff activity (users who created orders)
      const staffWithOrders = await prisma.user.findMany({
        where: {
          ...where,
          role: { in: ['MANAGER', 'CASHIER', 'WAITER'] },
          orders: {
            some: where.createdAt ? { createdAt: where.createdAt } : {}
          }
        },
        include: {
          orders: {
            where: where.createdAt ? { createdAt: where.createdAt } : {},
            select: {
              id: true,
              status: true,
              total: true,
              createdAt: true
            },
            orderBy: { createdAt: 'desc' }
          },
          _count: {
            select: {
              orders: true
            }
          }
        },
        orderBy: {
          orders: {
            _count: 'desc',
          },
          createdAt: 'desc'
        }
      });

      const staffActivity = staffWithOrders.map(staff => ({
        user: {
          id: staff.id,
          name: staff.name,
          email: staff.email,
          role: staff.role,
          branch: staff.branch
        },

        totalOrders: staff._count.orders,
        recentOrders: staff.orders.slice(0, 5), // Last 5 orders
        totalRevenue: staff.orders.reduce((sum, order) => sum + order.total, 0),
        lastActivity: staff.orders[0]?.createdAt || null,
        ordersToday: staff.orders.filter(order =>
          order.createdAt.toDateString() === new Date().toDateString()
        ).length
      }));

      return {
        success: true,
        message: "Staff activity fetched successfully",
        data: {
          staff: staffActivity,
          activeStaff: staffActivity.length,
          totalActivity: staffActivity.reduce((sum, staff) => sum + staff.totalOrders, 0)
        },
        statusCode: 200
      };
    } catch (error) {
      console.error('Error in getStaffActivity:', error);
      throw error;
    }
  },

  // ==================== FINANCIAL REPORTS ====================
  async getRevenueReports(params: ReportParams) {
    try {
      const { startDate, endDate, branchName, user } = params;

      const where = buildWhereClause({ startDate, endDate, branchName, user });
      
      const revenueData = await prisma.order.groupBy({
        by: ['createdAt'],
        where,
        _sum: {
          total: true,
          subtotal: true,
          tax: true,
          discount: true
        },
        orderBy: { createdAt: 'asc' }
      });

      const summary = await prisma.order.aggregate({
        where,
        _sum: {
          total: true,
          subtotal: true,
          tax: true,
          discount: true
        },
        _count: { _all: true }
      });

      const revenueByType = await prisma.order.groupBy({
        by: ['orderType'],
        where,
        _sum: { total: true },
        _count: { _all: true }
      });

      return {
        success: true,
        message: "Revenue reports fetched successfully",
        data: {
          dailyRevenue: revenueData,
          summary: {
            totalRevenue: summary._sum.total || 0,
            totalSubtotal: summary._sum.subtotal || 0,
            totalTax: summary._sum.tax || 0,
            totalDiscount: summary._sum.discount || 0,
            totalOrders: summary._count._all,
            avgOrderValue: summary._count._all > 0 ? (summary._sum.total || 0) / summary._count._all : 0
          },
          revenueByType,
          growthRate: calculateGrowthRate(revenueData)
        },
        statusCode: 200
      };
    } catch (error) {
      console.error('Error in getRevenueReports:', error);
      throw error;
    }
  },

  async getTaxReports(params: ReportParams) {
    try {
      const { startDate, endDate, branchName, user } = params;

      const where = buildWhereClause({ startDate, endDate, branchName, user });

      const taxData = await prisma.order.groupBy({
        by: ['createdAt'],
        where,
        _sum: { tax: true },
        orderBy: { createdAt: 'asc' }
      });

      const taxSummary = await prisma.order.aggregate({
        where,
        _sum: { tax: true },
        _count: { _all: true }
      });

      const taxByBranch = await prisma.order.groupBy({
        by: ['branchName'],
        where,
        _sum: { tax: true },
        _count: { _all: true }
      });

      return {
        success: true,
        message: "Tax reports fetched successfully",
        data: {
          dailyTax: taxData,
          summary: {
            totalTax: taxSummary._sum.tax || 0,
            avgTaxPerOrder: taxSummary._count._all > 0 ? (taxSummary._sum.tax || 0) / taxSummary._count._all : 0,
            taxRate: taxSummary._sum.tax && taxSummary._sum.tax > 0 ?
              ((taxSummary._sum.tax || 0) / (taxSummary._sum.tax || 1)) * 100 : 0
          },
          taxByBranch,
          taxTrend: calculateGrowthRate(taxData)
        },
        statusCode: 200
      };
    } catch (error) {
      console.error('Error in getTaxReports:', error);
      throw error;
    }
  },

  // ==================== DASHBOARD OVERVIEW ====================
  async getDashboardOverview(params: ReportParams) {
    try {
      const { user } = params;

      const today = new Date();
      const startOfToday = new Date(today.setHours(0, 0, 0, 0));
      const startOfWeek = new Date(today.setDate(today.getDate() - today.getDay()));
      const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);

      const where = buildWhereClause({ user });

      const [
        todayStats,
        weekStats,
        monthStats,
        lowStockCount,
        pendingOrders,
        staffActivity
      ] = await Promise.all([
        // Today's stats
        prisma.order.aggregate({
          where: { ...where, createdAt: { gte: startOfToday } },
          _count: { _all: true },
          _sum: { total: true }
        }),

        // This week's stats
        prisma.order.aggregate({
          where: { ...where, createdAt: { gte: startOfWeek } },
          _count: { _all: true },
          _sum: { total: true }
        }),

        // This month's stats
        prisma.order.aggregate({
          where: { ...where, createdAt: { gte: startOfMonth } },
          _count: { _all: true },
          _sum: { total: true }
        }),

        // Low stock count
        prisma.inventoryItem.count({
          where: {
            ...buildWhereClause({ user }),
            OR: [
              { status: 'LOW_STOCK' },
              { status: 'OUT_OF_STOCK' }
            ]
          }
        }),

        // Pending orders
        prisma.order.count({
          where: { ...where, status: 'PENDING' }
        }),

        // Active staff today
        prisma.user.count({
          where: {
            ...buildWhereClause({ user }),
            role: { in: ['MANAGER', 'CASHIER', 'WAITER', 'KITCHEN_STAFF'] },
            orders: {
              some: {
                createdAt: { gte: startOfToday }
              }
            }
          }
        })
      ]);

  

      const overview = {
        today: {
          orders: todayStats._count._all,
          revenue: todayStats._sum.total || 0
        },
        week: {
          orders: weekStats._count._all,
          revenue: weekStats._sum.total || 0
        },
        month: {
          orders: monthStats._count._all,
          revenue: monthStats._sum.total || 0
        },
        alerts: {
          lowStock: lowStockCount,
          pendingOrders: pendingOrders
        },
        staff: {
          activeToday: staffActivity
        }
      };

      return {
        success: true,
        message: "Dashboard overview fetched successfully",
        data: overview,
        statusCode: 200
      };
    } catch (error) {
      console.error('Error in getDashboardOverview:', error);
      throw error;
    }
  },
  async getTimeAnalytics(params: ReportParams) {
    try {
      const { startDate, endDate, branchName, user } = params;

      const where = buildWhereClause({ startDate, endDate, branchName, user });

      // Get all orders for the period with their items
      const orders = await prisma.order.findMany({
        where,
        include: {
          items: {
            include: {
              menuItem: {
                include: {
                  category: true
                }
              }
            }
          }
        },
        orderBy: { createdAt: 'asc' }
      });

      // Sales by Hour
      const salesByHour = calculateSalesByHour(orders);

      // Sales by Day of Week
      const salesByDay = calculateSalesByDay(orders);

      // Peak Hours Analysis
      const peakHours = calculatePeakHours(salesByHour);

      // Customer Behavior Metrics
      const customerBehavior = await calculateCustomerBehavior(where);

      // Product Performance by Time
      const productPerformance = calculateProductPerformanceByTime(orders);

      // Staff Performance by Shift
      const staffPerformance = await calculateStaffPerformanceByShift(where, startDate, endDate);

      return {
        success: true,
        message: "Time analytics fetched successfully",
        data: {
          salesByHour,
          salesByDay,
          peakHours,
          customerBehavior,
          productPerformance,
          staffPerformance
        },
        statusCode: 200
      };
    } catch (error) {
      console.error('Error in getTimeAnalytics:', error);
      throw error;
    }
  },

  async getSalesByHour(params: ReportParams) {
    try {
      const { startDate, endDate, branchName, user } = params;

      const where = buildWhereClause({ startDate, endDate, branchName, user });

      const orders = await prisma.order.findMany({
        where,
        include: {
          items: true
        },
        orderBy: { createdAt: 'asc' }
      });

      const salesByHour = calculateSalesByHour(orders);
      const peakHours = calculatePeakHours(salesByHour);

      return {
        success: true,
        message: "Sales by hour fetched successfully",
        data: {
          salesByHour,
          peakHours,
          summary: {
            totalSales: salesByHour.reduce((sum, hour) => sum + hour.sales, 0),
            totalOrders: salesByHour.reduce((sum, hour) => sum + hour.orders, 0),
            avgOrderValue: salesByHour.reduce((sum, hour) => sum + hour.sales, 0) /
              salesByHour.reduce((sum, hour) => sum + hour.orders, 0) || 0
          }
        },
        statusCode: 200
      };
    } catch (error) {
      console.error('Error in getSalesByHour:', error);
      throw error;
    }
  },

  async getPeakHoursAnalysis(params: ReportParams) {
    try {
      const { startDate, endDate, branchName, user } = params;

      const where = buildWhereClause({ startDate, endDate, branchName, user });

      const orders = await prisma.order.findMany({
        where,
        include: {
          items: true
        }
      });

      const salesByHour = calculateSalesByHour(orders);
      const peakHours = calculatePeakHours(salesByHour);
      const recommendations = generatePeakHourRecommendations(peakHours, salesByHour);

      return {
        success: true,
        message: "Peak hours analysis fetched successfully",
        data: {
          peakHours,
          hourlyBreakdown: salesByHour,
          recommendations,
          timeSlots: {
            breakfast: calculateTimeSlotPerformance(salesByHour, 6, 10),
            lunch: calculateTimeSlotPerformance(salesByHour, 11, 14),
            afternoon: calculateTimeSlotPerformance(salesByHour, 15, 17),
            dinner: calculateTimeSlotPerformance(salesByHour, 18, 21),
            late: calculateTimeSlotPerformance(salesByHour, 22, 23)
          }
        },
        statusCode: 200
      };
    } catch (error) {
      console.error('Error in getPeakHoursAnalysis:', error);
      throw error;
    }
  },

  async getCustomerBehaviorAnalytics(params: ReportParams) {
    try {
      const { startDate, endDate, branchName, user } = params;

      const where = buildWhereClause({ startDate, endDate, branchName, user });

      const customerBehavior = await calculateCustomerBehavior(where);
      const visitPatterns = await calculateVisitPatterns(where);

      return {
        success: true,
        message: "Customer behavior analytics fetched successfully",
        data: {
          ...customerBehavior,
          visitPatterns,
          insights: generateCustomerBehaviorInsights(customerBehavior, visitPatterns)
        },
        statusCode: 200
      };
    } catch (error) {
      console.error('Error in getCustomerBehaviorAnalytics:', error);
      throw error;
    }
  },

  async getProductPerformanceByTime(params: ReportParams) {
    try {
      const { startDate, endDate, branchName, user } = params;

      const where = buildWhereClause({ startDate, endDate, branchName, user });
    
      const orders = await prisma.order.findMany({
        where,
        include: {
          items: {
            include: {
              menuItem: {
                include: {
                  category: true
                }
              }
            }
          }
        }
      });

      const productPerformance = calculateProductPerformanceByTime(orders);
      const timeSlotPerformance = calculateTimeSlotProductPerformance(orders);

      return {
        success: true,
        message: "Product performance by time fetched successfully",
        data: {
          productPerformance,
          timeSlotPerformance,
          topPerformers: {
            breakfast: getTopProductsByTimeSlot(productPerformance, 'breakfast'),
            lunch: getTopProductsByTimeSlot(productPerformance, 'lunch'),
            dinner: getTopProductsByTimeSlot(productPerformance, 'dinner')
          }
        },
        statusCode: 200
      };
    } catch (error) {
      console.error('Error in getProductPerformanceByTime:', error);
      throw error;
    }
  },

  async getStaffPerformanceByTime(params: ReportParams) {
    try {
      const { startDate, endDate, branchName, user } = params;

      const where = buildWhereClause({ startDate, endDate, branchName, user });

      const staffPerformance = await calculateStaffPerformanceByShift(where, startDate, endDate);
      const shiftEfficiency = await calculateShiftEfficiency(where, startDate, endDate);

      return {
        success: true,
        message: "Staff performance by time fetched successfully",
        data: {
          staffPerformance,
          shiftEfficiency,
          recommendations: generateStaffOptimizationRecommendations(staffPerformance, shiftEfficiency)
        },
        statusCode: 200
      };
    } catch (error) {
      console.error('Error in getStaffPerformanceByTime:', error);
      throw error;
    }
  }

};

// ==================== HELPER FUNCTIONS ====================
function buildWhereClause(params: ReportParams) {
  const { startDate, endDate, branchName, status, paymentMethod, user } = params;

  const where: any = {};

  // Date range filter
  if (startDate || endDate) {
    where.createdAt = {};
    if (startDate) where.createdAt.gte = new Date(startDate);
    if (endDate) {
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      where.createdAt.lte = end;
    }
  }

  // Status filter
  if (status) where.status = status;

  // Payment method filter
  if (paymentMethod) where.paymentMethod = paymentMethod;

  // Branch filter for managers
  if (user?.role === 'MANAGER' && user?.branch) {
    where.branchName = user.branch;
  } else if (branchName) {
    where.branchName = branchName;
  }

  return where;
}

function calculateGrowthRate(data: any[]) {
  if (data.length < 2) return 0;

  const firstPeriod = data[0]._sum?.total || 0;
  const lastPeriod = data[data.length - 1]._sum?.total || 0;

  if (firstPeriod === 0) return lastPeriod > 0 ? 100 : 0;

  return ((lastPeriod - firstPeriod) / firstPeriod) * 100;
}

function calculateSalesByHour(orders: any[]) {
  const hourlySales: { [key: string]: { sales: number; orders: number; avgOrderValue: number } } = {};

  // Initialize all hours
  for (let hour = 0; hour < 24; hour++) {
    const hourStr = hour.toString().padStart(2, '0') + ':00';
    hourlySales[hourStr] = { sales: 0, orders: 0, avgOrderValue: 0 };
  }
  // Aggregate sales by hour
  orders.forEach(order => {
    const orderHour = new Date(order.createdAt).getHours();
    const hourStr = orderHour.toString().padStart(2, '0') + ':00';

    hourlySales[hourStr].sales += order.total;
    hourlySales[hourStr].orders += 1;
  });

  // Calculate average order value
  Object.keys(hourlySales).forEach(hour => {
    if (hourlySales[hour].orders > 0) {
      hourlySales[hour].avgOrderValue = hourlySales[hour].sales / hourlySales[hour].orders;
    }
  });

  // Convert to array and format
  return Object.entries(hourlySales)
    .map(([hour, data]) => ({
      hour,
      sales: Number(data.sales.toFixed(2)),
      orders: data.orders,
      avgOrderValue: Number(data.avgOrderValue.toFixed(2))
    }))
    .filter(item => item.sales > 0); // Only return hours with sales
}

function calculateSalesByDay(orders: any[]) {
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const dailySales: { [key: string]: { sales: number; orders: number; avgOrderValue: number } } = {};

  // Initialize all days
  days.forEach(day => {
    dailySales[day] = { sales: 0, orders: 0, avgOrderValue: 0 };
  });

  // Aggregate sales by day
  orders.forEach(order => {
    const dayOfWeek = new Date(order.createdAt).getDay();
    const dayName = days[dayOfWeek];

    dailySales[dayName].sales += order.total;
    dailySales[dayName].orders += 1;
  });

  // Calculate average order value
  Object.keys(dailySales).forEach(day => {
    if (dailySales[day].orders > 0) {
      dailySales[day].avgOrderValue = dailySales[day].sales / dailySales[day].orders;
    }
  });

  // Convert to array
  return days.map(day => ({
    day,
    sales: Number(dailySales[day].sales.toFixed(2)),
    orders: dailySales[day].orders,
    avgOrderValue: Number(dailySales[day].avgOrderValue.toFixed(2))
  }));
}

function calculatePeakHours(salesByHour: any[]) {
  if (salesByHour.length === 0) {
    return {
      busiestHour: 'N/A',
      busiestHourSales: 0,
      busiestHourOrders: 0,
      quietestHour: 'N/A',
      quietestHourSales: 0,
      quietestHourOrders: 0,
      peakToQuietRatio: 0
    };
  }

  const busiest = salesByHour.reduce((max, hour) =>
    hour.sales > max.sales ? hour : max, salesByHour[0]);

  const quietest = salesByHour.reduce((min, hour) =>
    hour.sales < min.sales ? hour : min, salesByHour[0]);

  return {
    busiestHour: busiest.hour,
    busiestHourSales: busiest.sales,
    busiestHourOrders: busiest.orders,
    quietestHour: quietest.hour,
    quietestHourSales: quietest.sales,
    quietestHourOrders: quietest.orders,
    peakToQuietRatio: quietest.sales > 0 ? busiest.sales / quietest.sales : busiest.sales
  };
}

// In your report.service.ts - Fix the calculateCustomerBehavior function
async function calculateCustomerBehavior(where: any) {
  // Calculate average order processing time
  const ordersWithTimes = await prisma.order.findMany({
    where: { ...where, status: 'COMPLETED' },
    select: {
      createdAt: true,
      updatedAt: true,
      items: {
        select: {
          menuItem: {
            select: {
              id: true, // Remove preparationTime since it doesn't exist
              name: true
            }
          }
        }
      }
    }
  });

  let totalProcessingTime = 0;
  let totalOrders = 0;
  ordersWithTimes.forEach(order => {
    const processingTime = order.updatedAt.getTime() - order.createdAt.getTime();
    totalProcessingTime += processingTime;
    totalOrders++;
  });
  
  const avgProcessingTime = totalOrders > 0 ? totalProcessingTime / totalOrders : 0;
  const avgVisitDuration = Math.round(avgProcessingTime / (1000 * 60)); // Convert to minutes
  
  // Calculate table turnover (simplified - assuming 2 hours per table on average)
  const totalTables = 20; // This should come from your restaurant configuration
  const avgTableTurnover = totalOrders > 0 ? (totalOrders / totalTables) * 2 : 0;

  return {
    avgVisitDuration: `${avgVisitDuration} minutes`,
    peakWaitTime: '12 minutes', // This would need more detailed calculation
    avgWaitTime: '6 minutes', // This would need more detailed calculation
    tableTurnoverRate: `${avgTableTurnover.toFixed(1)} times/day`
  };
}

function calculateProductPerformanceByTime(orders: any[]) {
  const timeSlots = {
    breakfast: { start: 6, end: 10 },
    lunch: { start: 11, end: 14 },
    afternoon: { start: 15, end: 17 },
    dinner: { start: 18, end: 21 },
    late: { start: 22, end: 23 }
  };
  

  const performance: any = {};

  orders.forEach(order => {
    const orderHour = new Date(order.createdAt).getHours();
    let timeSlot = '';

    // Determine time slot
    if (orderHour >= timeSlots.breakfast.start && orderHour <= timeSlots.breakfast.end) {
      timeSlot = 'breakfast';
    } else if (orderHour >= timeSlots.lunch.start && orderHour <= timeSlots.lunch.end) {
      timeSlot = 'lunch';
    } else if (orderHour >= timeSlots.afternoon.start && orderHour <= timeSlots.afternoon.end) {
      timeSlot = 'afternoon';
    } else if (orderHour >= timeSlots.dinner.start && orderHour <= timeSlots.dinner.end) {
      timeSlot = 'dinner';
    } else if (orderHour >= timeSlots.late.start && orderHour <= timeSlots.late.end) {
      timeSlot = 'late';
    } else {
      return; // Skip orders outside defined time slots
    }

    // Process order items
    order.items.forEach((item: any) => {
      if (!item.menuItem) return;

      const productId = item.menuItem.id;
      const productName = item.menuItem.name;

      if (!performance[productId]) {
        performance[productId] = {
          product: item.menuItem,
          timeSlots: {}
        };
      }

      if (!performance[productId].timeSlots[timeSlot]) {
        performance[productId].timeSlots[timeSlot] = {
          sales: 0,
          quantity: 0,
          orders: 0
        };
      }

      performance[productId].timeSlots[timeSlot].sales += item.total;
      performance[productId].timeSlots[timeSlot].quantity += item.quantity;
      performance[productId].timeSlots[timeSlot].orders += 1;
    });
  });

  // Convert to array and find top products per time slot
  return Object.values(performance);
}

async function calculateStaffPerformanceByShift(where: any, startDate?: string, endDate?: string) {
  const shifts = [
    { name: 'Morning (6-14)', start: 6, end: 14 },
    { name: 'Evening (14-22)', start: 14, end: 22 },
    { name: 'Late (22-23)', start: 22, end: 23 }
  ];

  const staffPerformance = [];

  for (const shift of shifts) {
    // Create date filter for the shift hours
    const shiftWhere = {
      ...where,
      AND: [
        {
          createdAt: {
            gte: startDate ? new Date(startDate) : undefined,
            lte: endDate ? new Date(endDate) : undefined
          }
        }
      ]
    };

    const shiftOrders = await prisma.order.findMany({
      where: shiftWhere,
      include: {
        createdBy: {
          select: {
            id: true,
            name: true,
            role: true
          }
        }
      }
    });

    // Filter orders by shift hours
    const filteredOrders = shiftOrders.filter(order => {
      const orderHour = new Date(order.createdAt).getHours();
      return orderHour >= shift.start && orderHour <= shift.end;
    });
   
    // Group by staff member
    const staffMap = new Map();

    filteredOrders.forEach(order => {
      const staffId = order.createdById;
      if (!staffMap.has(staffId)) {
        staffMap.set(staffId, {
          staff: order.createdBy,
          orders: 0,
          sales: 0
        });
      }

      const staffData = staffMap.get(staffId);
      staffData.orders += 1;
      staffData.sales += order.total;
    });


    const shiftPerformance = Array.from(staffMap.values()).map((data: any) => ({
      ...data,
      salesPerStaff: data.orders > 0 ? data.sales / data.orders : 0,
      ordersPerStaff: data.orders
    }));

    staffPerformance.push({
      shift: shift.name,
      staffCount: shiftPerformance.length,
      performance: shiftPerformance,
      totalSales: shiftPerformance.reduce((sum, staff) => sum + staff.sales, 0),
      totalOrders: shiftPerformance.reduce((sum, staff) => sum + staff.orders, 0)
    });
  }

  return staffPerformance;
}



function calculateTimeSlotPerformance(salesByHour: any[], startHour: number, endHour: number) {
  const slotHours = salesByHour.filter(hour => {
    const hourNum = parseInt(hour.hour.split(':')[0]);
    return hourNum >= startHour && hourNum <= endHour;
  });

  return {
    sales: slotHours.reduce((sum, hour) => sum + hour.sales, 0),
    orders: slotHours.reduce((sum, hour) => sum + hour.orders, 0),
    avgOrderValue: slotHours.reduce((sum, hour) => sum + hour.sales, 0) /
      slotHours.reduce((sum, hour) => sum + hour.orders, 0) || 0
  };
}

async function calculateVisitPatterns(where: any) {
  // Get orders grouped by hour to understand visit patterns
  const hourlyOrders = await prisma.order.groupBy({
    by: ['createdAt'],
    where,
    _count: { _all: true }
  });

  const patterns = {
    peakVisits: 0,
    offPeakVisits: 0,
    averageDailyVisits: 0,
    mostPopularDay: '',
    leastPopularDay: ''
  };

  // Simple pattern analysis - you can enhance this based on your needs
  if (hourlyOrders.length > 0) {
    patterns.averageDailyVisits = hourlyOrders.reduce((sum, hour) => sum + hour._count._all, 0) /
      (hourlyOrders.length / 24); // Approximate days
  }

  return patterns;
}

function calculateTimeSlotProductPerformance(orders: any[]) {
  const timeSlots = {
    breakfast: { start: 6, end: 10 },
    lunch: { start: 11, end: 14 },
    dinner: { start: 18, end: 21 }
  };

  const performance: any = {};

  Object.entries(timeSlots).forEach(([slotName, slot]) => {
    performance[slotName] = [];

    const slotOrders = orders.filter(order => {
      const orderHour = new Date(order.createdAt).getHours();
      return orderHour >= slot.start && orderHour <= slot.end;
    });

    // Aggregate product performance for this time slot
    const productMap = new Map();

    slotOrders.forEach(order => {
      order.items.forEach((item: any) => {
        if (!item.menuItem) return;

        const productId = item.menuItem.id;
        if (!productMap.has(productId)) {
          productMap.set(productId, {
            product: item.menuItem,
            sales: 0,
            quantity: 0,
            orders: 0
          });
        }


        const productData = productMap.get(productId);
        productData.sales += item.total;
        productData.quantity += item.quantity;
        productData.orders += 1;
      });
    });


    performance[slotName] = Array.from(productMap.values())
      .sort((a: any, b: any) => b.sales - a.sales)
      .slice(0, 5); // Top 5 products
  });

  return performance;
}

async function calculateShiftEfficiency(where: any, startDate?: string, endDate?: string) {
  const shifts = [
    { name: 'Morning (6-14)', start: 6, end: 14 },
    { name: 'Evening (14-22)', start: 14, end: 22 },
    { name: 'Late (22-23)', start: 22, end: 23 }
  ];


  const efficiency = [];

  for (const shift of shifts) {
    const shiftWhere = {
      ...where,
      AND: [
        {
          createdAt: {
            gte: startDate ? new Date(startDate) : undefined,
            lte: endDate ? new Date(endDate) : undefined
          }
        }
      ]
    };

    const shiftOrders = await prisma.order.findMany({
      where: shiftWhere
    });



    const filteredOrders = shiftOrders.filter(order => {
      const orderHour = new Date(order.createdAt).getHours();
      return orderHour >= shift.start && orderHour <= shift.end;
    });

    const totalSales = filteredOrders.reduce((sum, order) => sum + order.total, 0);
    const avgOrderValue = filteredOrders.length > 0 ? totalSales / filteredOrders.length : 0;

    efficiency.push({
      shift: shift.name,
      totalOrders: filteredOrders.length,
      totalSales,
      avgOrderValue,
      efficiency: filteredOrders.length / (shift.end - shift.start) // Orders per hour
    });
  }

  return efficiency;
}

function getTopProductsByTimeSlot(productPerformance: any[], timeSlot: string) {
  const products = productPerformance
    .filter((product: any) => product.timeSlots[timeSlot])
    .map((product: any) => ({
      product: product.product,
      sales: product.timeSlots[timeSlot].sales,
      quantity: product.timeSlots[timeSlot].quantity
    }))
    .sort((a: any, b: any) => b.sales - a.sales)
    .slice(0, 3); // Top 3 products
  return products;
}

function generatePeakHourRecommendations(peakHours: any, salesByHour: any[]) {
  const recommendations = [];

  if (peakHours.busiestHourOrders > 50) {
    recommendations.push({
      type: 'staffing',
      priority: 'high',
      message: `Increase staff during ${peakHours.busiestHour} to handle ${peakHours.busiestHourOrders} orders efficiently.`
    });
  }

  const quietSlot = calculateTimeSlotPerformance(salesByHour, 15, 17);
  if (quietSlot.orders < 10) {
    recommendations.push({
      type: 'promotion',
      priority: 'medium',
      message: 'Introduce happy hour promotions during 15:00-17:00 to boost sales.'
    });
  }


  // Add more recommendation logic based on your business rules
  if (peakHours.peakToQuietRatio > 8) {
    recommendations.push({
      type: 'operations',
      priority: 'medium',
      message: 'Consider extending operating hours during peak periods to accommodate demand.'
    });
  }


  return recommendations;
}

function generateCustomerBehaviorInsights(customerBehavior: any, visitPatterns: any) {
  const insights = [];

  if (parseInt(customerBehavior.avgVisitDuration) > 45) {
    insights.push({
      type: 'service',
      insight: 'Customers are spending significant time, consider table turnover strategies.'
    });
  }
  if (parseFloat(customerBehavior.avgVisitDuration) < 15) {
    insights.push({
      type: 'service',
      insight: "Customers are spending less time, consider table turnover strategies"
    })
  }
  if (parseFloat(customerBehavior.tableTurnoverRate) < 2) {
    insights.push({
      type: 'efficiency',
      insight: 'Table turnover rate is low, optimize service flow.'
    });
  }

  return insights;
}


function generateStaffOptimizationRecommendations(staffPerformance: any, shiftEfficiency: any) {
  const recommendations = [];

  // Find the most efficient shift
  const mostEfficientShift = shiftEfficiency.reduce((max: any, shift: any) =>
    shift.efficiency > max.efficiency ? shift : shift, shiftEfficiency[0]);
  const leastEfficientShift = shiftEfficiency.reduce((min: any, shift: any) =>
    shift.efficiency < min.efficiency ? shift : shift, shiftEfficiency[0]);


  if (mostEfficientShift.efficiency > leastEfficientShift.efficiency * 1.5) {
    recommendations.push({
      type: 'staffing',
      priority: 'medium',
      message: `Consider reallocating staff from ${leastEfficientShift.shift} to ${mostEfficientShift.shift} for better efficiency.`
    });
  }

  return recommendations;
}