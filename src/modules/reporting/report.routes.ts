import { Router } from "express";
import { authenticateJWT, checkPermission } from "../../middleware/auth.middleware";
import { reportsController } from "./report.controller";

const router = Router();
router.use(authenticateJWT);

// Sales & Order Reports
router.get("/sales/overview", checkPermission(['ORDER_READ']), reportsController.getSalesOverview);
router.get("/sales/orders", checkPermission(['ORDER_READ']), reportsController.getOrderReports);
router.get("/sales/payments", checkPermission(['ORDER_READ']), reportsController.getPaymentReports);

// Inventory Reports
router.get("/inventory/status", checkPermission(['PRODUCT_READ']), reportsController.getInventoryStatus);
router.get("/inventory/transactions", checkPermission(['PRODUCT_READ']), reportsController.getInventoryTransactions);
router.get("/inventory/alerts", checkPermission(['PRODUCT_READ']), reportsController.getLowStockAlerts);

// Menu Reports
router.get("/menu/performance", checkPermission(['MENU_READ']), reportsController.getMenuPerformance);
router.get("/menu/categories", checkPermission(['MENU_READ']), reportsController.getCategoryPerformance);

// Branch Reports
router.get("/branch/performance", checkPermission(['ORDER_READ']), reportsController.getBranchPerformance);
router.get("/branch/comparison", checkPermission(['ORDER_READ']), reportsController.getBranchComparison);

// Staff Reports
router.get("/staff/performance", checkPermission(['USER_READ']), reportsController.getStaffPerformance);
router.get("/staff/activity", checkPermission(['USER_READ']), reportsController.getStaffActivity);

// Financial Reports
router.get("/financial/revenue", checkPermission(['ORDER_READ']), reportsController.getRevenueReports);
router.get("/financial/taxes", checkPermission(['ORDER_READ']), reportsController.getTaxReports);

// Dashboard Overview
router.get("/dashboard/overview", checkPermission(['ORDER_READ']), reportsController.getDashboardOverview);

// Time Analytics
router.get("/time-analytics", checkPermission(['ORDER_READ']), reportsController.getTimeAnalytics);
router.get("/time-analytics/sales-by-hour", checkPermission(['ORDER_READ']), reportsController.getSalesByHour);
router.get("/time-analytics/peak-hours", checkPermission(['ORDER_READ']), reportsController.getPeakHoursAnalysis);
router.get("/time-analytics/customer-behavior", checkPermission(['ORDER_READ']), reportsController.getCustomerBehaviorAnalytics);
router.get("/time-analytics/product-performance", checkPermission(['MENU_READ']), reportsController.getProductPerformanceByTime);
router.get("/time-analytics/staff-performance", checkPermission(['USER_READ']), reportsController.getStaffPerformanceByTime);
export default router;