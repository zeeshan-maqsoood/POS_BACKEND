interface ReportParams {
    startDate?: string;
    endDate?: string;
    branchName?: string;
    user?: any;
    [key: string]: any;
}
export declare const reportsService: {
    getSalesOverview(params: ReportParams): Promise<{
        success: boolean;
        message: string;
        data: {
            totalOrders: number;
            totalRevenue: number;
            totalSubtotal: number;
            totalTax: number;
            paidOrders: number;
            pendingPaymentOrders: number;
            ordersByStatus: (import(".prisma/client").Prisma.PickEnumerable<import(".prisma/client").Prisma.OrderGroupByOutputType, "status"[]> & {
                _count: {
                    _all: number;
                };
                _sum: {
                    total: number | null;
                };
            })[];
            ordersByType: (import(".prisma/client").Prisma.PickEnumerable<import(".prisma/client").Prisma.OrderGroupByOutputType, "orderType"[]> & {
                _count: {
                    _all: number;
                };
                _sum: {
                    total: number | null;
                };
            })[];
            paymentMethods: (import(".prisma/client").Prisma.PickEnumerable<import(".prisma/client").Prisma.OrderGroupByOutputType, "paymentMethod"[]> & {
                _count: {
                    _all: number;
                };
                _sum: {
                    total: number | null;
                };
            })[];
            dailySales: {
                date: string;
                revenue: number;
            }[];
            avgOrderValue: number;
        };
        statusCode: number;
    }>;
    getOrderReports(params: ReportParams): Promise<{
        success: boolean;
        message: string;
        data: {
            orders: ({
                createdBy: {
                    email: string;
                    role: import(".prisma/client").$Enums.UserRole;
                    name: string | null;
                } | null;
                items: {
                    id: string;
                    name: string;
                    createdAt: Date;
                    updatedAt: Date;
                    taxRate: number;
                    price: number;
                    modifiers: import(".prisma/client/runtime/library").JsonValue | null;
                    menuItemId: string | null;
                    quantity: number;
                    total: number;
                    tax: number;
                    notes: string | null;
                    orderId: string;
                }[];
            } & {
                id: string;
                status: import(".prisma/client").$Enums.OrderStatus;
                createdAt: Date;
                updatedAt: Date;
                createdById: string | null;
                branchName: string | null;
                paymentMethod: import(".prisma/client").$Enums.PaymentMethod | null;
                paymentStatus: import(".prisma/client").$Enums.PaymentStatus;
                total: number;
                orderNumber: string;
                orderType: import(".prisma/client").$Enums.OrderType;
                subtotal: number;
                tax: number;
                discount: number | null;
                tableNumber: string | null;
                customerName: string | null;
                customerEmail: string | null;
                customerPhone: string | null;
                notes: string | null;
            })[];
            metrics: {
                totalOrders: number;
                completedOrders: number;
                cancelledOrders: number;
                pendingOrders: number;
                totalRevenue: number;
                avgOrderValue: number;
                revenueByStatus: any;
            };
        };
        statusCode: number;
    }>;
    getPaymentReports(params: ReportParams): Promise<{
        success: boolean;
        message: string;
        data: {
            paymentDetails: (import(".prisma/client").Prisma.PickEnumerable<import(".prisma/client").Prisma.OrderGroupByOutputType, ("paymentMethod" | "paymentStatus")[]> & {
                _count: {
                    _all: number;
                };
                _sum: {
                    total: number | null;
                };
            })[];
            paymentSummary: (import(".prisma/client").Prisma.PickEnumerable<import(".prisma/client").Prisma.OrderGroupByOutputType, "paymentMethod"[]> & {
                _count: {
                    _all: number;
                };
                _sum: {
                    total: number | null;
                };
            })[];
            paymentStatusSummary: (import(".prisma/client").Prisma.PickEnumerable<import(".prisma/client").Prisma.OrderGroupByOutputType, "paymentStatus"[]> & {
                _count: {
                    _all: number;
                };
                _sum: {
                    total: number | null;
                };
            })[];
            totalTransactions: number;
            totalAmount: number;
        };
        statusCode: number;
    }>;
    getInventoryStatus(params: ReportParams): Promise<{
        success: boolean;
        message: string;
        data: {
            inventory: ({
                _count: {
                    InventoryTransaction: number;
                    MenuItemIngredient: number;
                    ModifierIngredient: number;
                };
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
            } & {
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
            })[];
            metrics: {
                totalItems: number;
                inStock: number;
                lowStock: number;
                outOfStock: number;
                totalValue: number;
                avgCost: number;
                itemsByCategory: ({
                    _count: {
                        items: number;
                    };
                } & {
                    id: string;
                    name: string;
                    createdAt: Date;
                    updatedAt: Date;
                    description: string | null;
                    isActive: boolean;
                    branchName: string | null;
                    color: string;
                })[];
            };
        };
        statusCode: number;
    }>;
    getInventoryTransactions(params: ReportParams): Promise<{
        success: boolean;
        message: string;
        data: {
            transactions: ({
                createdBy: {
                    email: string;
                    name: string | null;
                } | null;
                inventoryItem: {
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
                } & {
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
                };
            } & {
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
            })[];
            summary: (import(".prisma/client").Prisma.PickEnumerable<import(".prisma/client").Prisma.InventoryTransactionGroupByOutputType, "type"[]> & {
                _count: {
                    _all: number;
                };
                _sum: {
                    quantity: number | null;
                };
            })[];
            monthlyTrend: (import(".prisma/client").Prisma.PickEnumerable<import(".prisma/client").Prisma.InventoryTransactionGroupByOutputType, "createdAt"[]> & {
                _count: {
                    _all: number;
                };
                _sum: {
                    quantity: number | null;
                };
            })[];
            totalTransactions: number;
        };
        statusCode: number;
    }>;
    getLowStockAlerts(params: ReportParams): Promise<{
        success: boolean;
        message: string;
        data: {
            alerts: {
                urgency: string;
                needsRestock: boolean;
                restockQuantity: number;
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
            }[];
            criticalCount: number;
            highCount: number;
            mediumCount: number;
            totalAlerts: number;
        };
        statusCode: number;
    }>;
    getMenuPerformance(params: ReportParams): Promise<{
        success: boolean;
        message: string;
        data: {
            menuItems: unknown[];
            totalItems: number;
            totalRevenue: number;
            totalQuantity: number;
        };
        statusCode: number;
    }>;
    getCategoryPerformance(params: ReportParams): Promise<{
        success: boolean;
        message: string;
        data: {
            categories: any[];
            totalCategories: number;
            totalRevenue: any;
        };
        statusCode: number;
    }>;
    getBranchPerformance(params: ReportParams): Promise<{
        success: boolean;
        message: string;
        data: {
            branches: {
                completedOrders: number;
                completionRate: number;
                staffCount: number;
                inventoryValue: number;
                avgOrderValue: number;
                branchName: string | null;
                _count: {
                    _all: number;
                };
                _sum: {
                    total: number | null;
                    subtotal: number | null;
                    tax: number | null;
                };
            }[];
            totalBranches: number;
            overallRevenue: number;
        };
        statusCode: number;
    }>;
    getBranchComparison(params: ReportParams): Promise<{
        success: boolean;
        message: string;
        data: {
            comparison: any;
            branches: string[];
        };
        statusCode: number;
    }>;
    getStaffPerformance(params: ReportParams): Promise<{
        success: boolean;
        message: string;
        data: {
            staff: {
                user: {
                    email: string;
                    role: import(".prisma/client").$Enums.UserRole;
                    branch: string | null;
                    password: string;
                    id: string;
                    name: string | null;
                    status: import(".prisma/client").$Enums.UserStatus;
                    createdAt: Date;
                    updatedAt: Date;
                    shiftSchedule: import(".prisma/client/runtime/library").JsonValue | null;
                    isShiftActive: boolean;
                    createdById: string | null;
                } | null;
                totalOrders: number;
                totalRevenue: number;
                completedOrders: number;
                completionRate: number;
                avgOrderValue: number;
            }[];
            totalStaff: number;
            overallPerformance: {
                totalOrders: number;
                totalRevenue: number;
                avgCompletionRate: number;
            };
        };
        statusCode: number;
    }>;
    getStaffActivity(params: ReportParams): Promise<{
        success: boolean;
        message: string;
        data: {
            staff: {
                user: {
                    id: string;
                    name: string | null;
                    email: string;
                    role: import(".prisma/client").$Enums.UserRole;
                    branch: string | null;
                };
                totalOrders: number;
                recentOrders: {
                    id: string;
                    status: import(".prisma/client").$Enums.OrderStatus;
                    createdAt: Date;
                    total: number;
                }[];
                totalRevenue: number;
                lastActivity: Date;
                ordersToday: number;
            }[];
            activeStaff: number;
            totalActivity: number;
        };
        statusCode: number;
    }>;
    getRevenueReports(params: ReportParams): Promise<{
        success: boolean;
        message: string;
        data: {
            dailyRevenue: (import(".prisma/client").Prisma.PickEnumerable<import(".prisma/client").Prisma.OrderGroupByOutputType, "createdAt"[]> & {
                _sum: {
                    total: number | null;
                    subtotal: number | null;
                    tax: number | null;
                    discount: number | null;
                };
            })[];
            summary: {
                totalRevenue: number;
                totalSubtotal: number;
                totalTax: number;
                totalDiscount: number;
                totalOrders: number;
                avgOrderValue: number;
            };
            revenueByType: (import(".prisma/client").Prisma.PickEnumerable<import(".prisma/client").Prisma.OrderGroupByOutputType, "orderType"[]> & {
                _count: {
                    _all: number;
                };
                _sum: {
                    total: number | null;
                };
            })[];
            growthRate: number;
        };
        statusCode: number;
    }>;
    getTaxReports(params: ReportParams): Promise<{
        success: boolean;
        message: string;
        data: {
            dailyTax: (import(".prisma/client").Prisma.PickEnumerable<import(".prisma/client").Prisma.OrderGroupByOutputType, "createdAt"[]> & {
                _sum: {
                    tax: number | null;
                };
            })[];
            summary: {
                totalTax: number;
                avgTaxPerOrder: number;
                taxRate: number;
            };
            taxByBranch: (import(".prisma/client").Prisma.PickEnumerable<import(".prisma/client").Prisma.OrderGroupByOutputType, "branchName"[]> & {
                _count: {
                    _all: number;
                };
                _sum: {
                    tax: number | null;
                };
            })[];
            taxTrend: number;
        };
        statusCode: number;
    }>;
    getDashboardOverview(params: ReportParams): Promise<{
        success: boolean;
        message: string;
        data: {
            today: {
                orders: number;
                revenue: number;
            };
            week: {
                orders: number;
                revenue: number;
            };
            month: {
                orders: number;
                revenue: number;
            };
            alerts: {
                lowStock: number;
                pendingOrders: number;
            };
            staff: {
                activeToday: number;
            };
        };
        statusCode: number;
    }>;
    getTimeAnalytics(params: ReportParams): Promise<{
        success: boolean;
        message: string;
        data: {
            salesByHour: {
                hour: string;
                sales: number;
                orders: number;
                avgOrderValue: number;
            }[];
            salesByDay: {
                day: string;
                sales: number;
                orders: number;
                avgOrderValue: number;
            }[];
            peakHours: {
                busiestHour: any;
                busiestHourSales: any;
                busiestHourOrders: any;
                quietestHour: any;
                quietestHourSales: any;
                quietestHourOrders: any;
                peakToQuietRatio: any;
            };
            customerBehavior: {
                avgVisitDuration: string;
                peakWaitTime: string;
                avgWaitTime: string;
                tableTurnoverRate: string;
            };
            productPerformance: unknown[];
            staffPerformance: {
                shift: string;
                staffCount: number;
                performance: any[];
                totalSales: any;
                totalOrders: any;
            }[];
        };
        statusCode: number;
    }>;
    getSalesByHour(params: ReportParams): Promise<{
        success: boolean;
        message: string;
        data: {
            salesByHour: {
                hour: string;
                sales: number;
                orders: number;
                avgOrderValue: number;
            }[];
            peakHours: {
                busiestHour: any;
                busiestHourSales: any;
                busiestHourOrders: any;
                quietestHour: any;
                quietestHourSales: any;
                quietestHourOrders: any;
                peakToQuietRatio: any;
            };
            summary: {
                totalSales: number;
                totalOrders: number;
                avgOrderValue: number;
            };
        };
        statusCode: number;
    }>;
    getPeakHoursAnalysis(params: ReportParams): Promise<{
        success: boolean;
        message: string;
        data: {
            peakHours: {
                busiestHour: any;
                busiestHourSales: any;
                busiestHourOrders: any;
                quietestHour: any;
                quietestHourSales: any;
                quietestHourOrders: any;
                peakToQuietRatio: any;
            };
            hourlyBreakdown: {
                hour: string;
                sales: number;
                orders: number;
                avgOrderValue: number;
            }[];
            recommendations: {
                type: string;
                priority: string;
                message: string;
            }[];
            timeSlots: {
                breakfast: {
                    sales: any;
                    orders: any;
                    avgOrderValue: number;
                };
                lunch: {
                    sales: any;
                    orders: any;
                    avgOrderValue: number;
                };
                afternoon: {
                    sales: any;
                    orders: any;
                    avgOrderValue: number;
                };
                dinner: {
                    sales: any;
                    orders: any;
                    avgOrderValue: number;
                };
                late: {
                    sales: any;
                    orders: any;
                    avgOrderValue: number;
                };
            };
        };
        statusCode: number;
    }>;
    getCustomerBehaviorAnalytics(params: ReportParams): Promise<{
        success: boolean;
        message: string;
        data: {
            visitPatterns: {
                peakVisits: number;
                offPeakVisits: number;
                averageDailyVisits: number;
                mostPopularDay: string;
                leastPopularDay: string;
            };
            insights: {
                type: string;
                insight: string;
            }[];
            avgVisitDuration: string;
            peakWaitTime: string;
            avgWaitTime: string;
            tableTurnoverRate: string;
        };
        statusCode: number;
    }>;
    getProductPerformanceByTime(params: ReportParams): Promise<{
        success: boolean;
        message: string;
        data: {
            productPerformance: unknown[];
            timeSlotPerformance: any;
            topPerformers: {
                breakfast: {
                    product: any;
                    sales: any;
                    quantity: any;
                }[];
                lunch: {
                    product: any;
                    sales: any;
                    quantity: any;
                }[];
                dinner: {
                    product: any;
                    sales: any;
                    quantity: any;
                }[];
            };
        };
        statusCode: number;
    }>;
    getStaffPerformanceByTime(params: ReportParams): Promise<{
        success: boolean;
        message: string;
        data: {
            staffPerformance: {
                shift: string;
                staffCount: number;
                performance: any[];
                totalSales: any;
                totalOrders: any;
            }[];
            shiftEfficiency: {
                shift: string;
                totalOrders: number;
                totalSales: number;
                avgOrderValue: number;
                efficiency: number;
            }[];
            recommendations: {
                type: string;
                priority: string;
                message: string;
            }[];
        };
        statusCode: number;
    }>;
};
export {};
