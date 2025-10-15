"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_middleware_1 = require("../../middleware/auth.middleware");
const report_controller_1 = require("./report.controller");
const router = (0, express_1.Router)();
router.use(auth_middleware_1.authenticateJWT);
// Sales & Order Reports
router.get("/sales/overview", (0, auth_middleware_1.checkPermission)(['ORDER_READ']), report_controller_1.reportsController.getSalesOverview);
router.get("/sales/orders", (0, auth_middleware_1.checkPermission)(['ORDER_READ']), report_controller_1.reportsController.getOrderReports);
router.get("/sales/payments", (0, auth_middleware_1.checkPermission)(['ORDER_READ']), report_controller_1.reportsController.getPaymentReports);
// Inventory Reports
router.get("/inventory/status", (0, auth_middleware_1.checkPermission)(['PRODUCT_READ']), report_controller_1.reportsController.getInventoryStatus);
router.get("/inventory/transactions", (0, auth_middleware_1.checkPermission)(['PRODUCT_READ']), report_controller_1.reportsController.getInventoryTransactions);
router.get("/inventory/alerts", (0, auth_middleware_1.checkPermission)(['PRODUCT_READ']), report_controller_1.reportsController.getLowStockAlerts);
// Menu Reports
router.get("/menu/performance", (0, auth_middleware_1.checkPermission)(['MENU_READ']), report_controller_1.reportsController.getMenuPerformance);
router.get("/menu/categories", (0, auth_middleware_1.checkPermission)(['MENU_READ']), report_controller_1.reportsController.getCategoryPerformance);
// Branch Reports
router.get("/branch/performance", (0, auth_middleware_1.checkPermission)(['ORDER_READ']), report_controller_1.reportsController.getBranchPerformance);
router.get("/branch/comparison", (0, auth_middleware_1.checkPermission)(['ORDER_READ']), report_controller_1.reportsController.getBranchComparison);
// Staff Reports
router.get("/staff/performance", (0, auth_middleware_1.checkPermission)(['USER_READ']), report_controller_1.reportsController.getStaffPerformance);
router.get("/staff/activity", (0, auth_middleware_1.checkPermission)(['USER_READ']), report_controller_1.reportsController.getStaffActivity);
// Financial Reports
router.get("/financial/revenue", (0, auth_middleware_1.checkPermission)(['ORDER_READ']), report_controller_1.reportsController.getRevenueReports);
router.get("/financial/taxes", (0, auth_middleware_1.checkPermission)(['ORDER_READ']), report_controller_1.reportsController.getTaxReports);
// Dashboard Overview
router.get("/dashboard/overview", (0, auth_middleware_1.checkPermission)(['ORDER_READ']), report_controller_1.reportsController.getDashboardOverview);
// Time Analytics
router.get("/time-analytics", (0, auth_middleware_1.checkPermission)(['ORDER_READ']), report_controller_1.reportsController.getTimeAnalytics);
router.get("/time-analytics/sales-by-hour", (0, auth_middleware_1.checkPermission)(['ORDER_READ']), report_controller_1.reportsController.getSalesByHour);
router.get("/time-analytics/peak-hours", (0, auth_middleware_1.checkPermission)(['ORDER_READ']), report_controller_1.reportsController.getPeakHoursAnalysis);
router.get("/time-analytics/customer-behavior", (0, auth_middleware_1.checkPermission)(['ORDER_READ']), report_controller_1.reportsController.getCustomerBehaviorAnalytics);
router.get("/time-analytics/product-performance", (0, auth_middleware_1.checkPermission)(['MENU_READ']), report_controller_1.reportsController.getProductPerformanceByTime);
router.get("/time-analytics/staff-performance", (0, auth_middleware_1.checkPermission)(['USER_READ']), report_controller_1.reportsController.getStaffPerformanceByTime);
exports.default = router;
//# sourceMappingURL=report.routes.js.map