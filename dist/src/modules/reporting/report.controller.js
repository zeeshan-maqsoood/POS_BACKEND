"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.reportsController = void 0;
const report_service_1 = require("./report.service");
const apiResponse_1 = require("../../utils/apiResponse");
exports.reportsController = {
    // Sales & Order Reports
    async getSalesOverview(req, res) {
        try {
            const { startDate, endDate, branchName } = req.query;
            const { user } = req;
            const result = await report_service_1.reportsService.getSalesOverview({
                startDate: startDate,
                endDate: endDate,
                branchName: branchName,
                user
            });
            apiResponse_1.ApiResponse.send(res, result);
        }
        catch (error) {
            console.error('Error in sales overview:', error);
            apiResponse_1.ApiResponse.send(res, apiResponse_1.ApiResponse.error('Failed to fetch sales overview', 500));
        }
    },
    async getOrderReports(req, res) {
        try {
            const { startDate, endDate, branchName, status } = req.query;
            const { user } = req;
            const result = await report_service_1.reportsService.getOrderReports({
                startDate: startDate,
                endDate: endDate,
                branchName: branchName,
                status: status,
                user
            });
            apiResponse_1.ApiResponse.send(res, result);
        }
        catch (error) {
            console.error('Error in order reports:', error);
            apiResponse_1.ApiResponse.send(res, apiResponse_1.ApiResponse.error('Failed to fetch order reports', 500));
        }
    },
    async getPaymentReports(req, res) {
        try {
            const { startDate, endDate, branchName, paymentMethod } = req.query;
            const { user } = req;
            const result = await report_service_1.reportsService.getPaymentReports({
                startDate: startDate,
                endDate: endDate,
                branchName: branchName,
                paymentMethod: paymentMethod,
                user
            });
            apiResponse_1.ApiResponse.send(res, result);
        }
        catch (error) {
            console.error('Error in payment reports:', error);
            apiResponse_1.ApiResponse.send(res, apiResponse_1.ApiResponse.error('Failed to fetch payment reports', 500));
        }
    },
    // Inventory Reports
    async getInventoryStatus(req, res) {
        try {
            const { branchName, categoryId, status } = req.query;
            const { user } = req;
            const result = await report_service_1.reportsService.getInventoryStatus({
                branchName: branchName,
                categoryId: categoryId,
                status: status,
                user
            });
            apiResponse_1.ApiResponse.send(res, result);
        }
        catch (error) {
            console.error('Error in inventory status:', error);
            apiResponse_1.ApiResponse.send(res, apiResponse_1.ApiResponse.error('Failed to fetch inventory status', 500));
        }
    },
    async getInventoryTransactions(req, res) {
        try {
            const { startDate, endDate, branchName, type } = req.query;
            const { user } = req;
            const result = await report_service_1.reportsService.getInventoryTransactions({
                startDate: startDate,
                endDate: endDate,
                branchName: branchName,
                type: type,
                user
            });
            apiResponse_1.ApiResponse.send(res, result);
        }
        catch (error) {
            console.error('Error in inventory transactions:', error);
            apiResponse_1.ApiResponse.send(res, apiResponse_1.ApiResponse.error('Failed to fetch inventory transactions', 500));
        }
    },
    async getLowStockAlerts(req, res) {
        try {
            const { branchName } = req.query;
            const { user } = req;
            const result = await report_service_1.reportsService.getLowStockAlerts({
                branchName: branchName,
                user
            });
            apiResponse_1.ApiResponse.send(res, result);
        }
        catch (error) {
            console.error('Error in low stock alerts:', error);
            apiResponse_1.ApiResponse.send(res, apiResponse_1.ApiResponse.error('Failed to fetch low stock alerts', 500));
        }
    },
    // Menu Reports
    async getMenuPerformance(req, res) {
        try {
            const { startDate, endDate, branchName, categoryId } = req.query;
            const { user } = req;
            const result = await report_service_1.reportsService.getMenuPerformance({
                startDate: startDate,
                endDate: endDate,
                branchName: branchName,
                categoryId: categoryId,
                user
            });
            apiResponse_1.ApiResponse.send(res, result);
        }
        catch (error) {
            console.error('Error in menu performance:', error);
            apiResponse_1.ApiResponse.send(res, apiResponse_1.ApiResponse.error('Failed to fetch menu performance', 500));
        }
    },
    async getCategoryPerformance(req, res) {
        try {
            const { startDate, endDate, branchName } = req.query;
            const { user } = req;
            const result = await report_service_1.reportsService.getCategoryPerformance({
                startDate: startDate,
                endDate: endDate,
                branchName: branchName,
                user
            });
            apiResponse_1.ApiResponse.send(res, result);
        }
        catch (error) {
            console.error('Error in category performance:', error);
            apiResponse_1.ApiResponse.send(res, apiResponse_1.ApiResponse.error('Failed to fetch category performance', 500));
        }
    },
    // Branch Reports
    async getBranchPerformance(req, res) {
        try {
            const { startDate, endDate } = req.query;
            const { user } = req;
            const result = await report_service_1.reportsService.getBranchPerformance({
                startDate: startDate,
                endDate: endDate,
                user
            });
            apiResponse_1.ApiResponse.send(res, result);
        }
        catch (error) {
            console.error('Error in branch performance:', error);
            apiResponse_1.ApiResponse.send(res, apiResponse_1.ApiResponse.error('Failed to fetch branch performance', 500));
        }
    },
    async getBranchComparison(req, res) {
        try {
            const { startDate, endDate } = req.query;
            const { user } = req;
            const result = await report_service_1.reportsService.getBranchComparison({
                startDate: startDate,
                endDate: endDate,
                user
            });
            apiResponse_1.ApiResponse.send(res, result);
        }
        catch (error) {
            console.error('Error in branch comparison:', error);
            apiResponse_1.ApiResponse.send(res, apiResponse_1.ApiResponse.error('Failed to fetch branch comparison', 500));
        }
    },
    // Staff Reports
    async getStaffPerformance(req, res) {
        try {
            const { startDate, endDate, branchName } = req.query;
            const { user } = req;
            const result = await report_service_1.reportsService.getStaffPerformance({
                startDate: startDate,
                endDate: endDate,
                branchName: branchName,
                user
            });
            apiResponse_1.ApiResponse.send(res, result);
        }
        catch (error) {
            console.error('Error in staff performance:', error);
            apiResponse_1.ApiResponse.send(res, apiResponse_1.ApiResponse.error('Failed to fetch staff performance', 500));
        }
    },
    async getStaffActivity(req, res) {
        try {
            const { startDate, endDate, branchName } = req.query;
            const { user } = req;
            const result = await report_service_1.reportsService.getStaffActivity({
                startDate: startDate,
                endDate: endDate,
                branchName: branchName,
                user
            });
            apiResponse_1.ApiResponse.send(res, result);
        }
        catch (error) {
            console.error('Error in staff activity:', error);
            apiResponse_1.ApiResponse.send(res, apiResponse_1.ApiResponse.error('Failed to fetch staff activity', 500));
        }
    },
    // Financial Reports
    async getRevenueReports(req, res) {
        try {
            const { startDate, endDate, branchName } = req.query;
            const { user } = req;
            const result = await report_service_1.reportsService.getRevenueReports({
                startDate: startDate,
                endDate: endDate,
                branchName: branchName,
                user
            });
            apiResponse_1.ApiResponse.send(res, result);
        }
        catch (error) {
            console.error('Error in revenue reports:', error);
            apiResponse_1.ApiResponse.send(res, apiResponse_1.ApiResponse.error('Failed to fetch revenue reports', 500));
        }
    },
    async getTaxReports(req, res) {
        try {
            const { startDate, endDate, branchName } = req.query;
            const { user } = req;
            const result = await report_service_1.reportsService.getTaxReports({
                startDate: startDate,
                endDate: endDate,
                branchName: branchName,
                user
            });
            apiResponse_1.ApiResponse.send(res, result);
        }
        catch (error) {
            console.error('Error in tax reports:', error);
            apiResponse_1.ApiResponse.send(res, apiResponse_1.ApiResponse.error('Failed to fetch tax reports', 500));
        }
    },
    // Dashboard Overview
    async getDashboardOverview(req, res) {
        try {
            const { user } = req;
            const result = await report_service_1.reportsService.getDashboardOverview({
                user
            });
            apiResponse_1.ApiResponse.send(res, result);
        }
        catch (error) {
            console.error('Error in dashboard overview:', error);
            apiResponse_1.ApiResponse.send(res, apiResponse_1.ApiResponse.error('Failed to fetch dashboard overview', 500));
        }
    },
    async getTimeAnalytics(req, res) {
        try {
            const { startDate, endDate, branchName } = req.query;
            const { user } = req;
            const result = await report_service_1.reportsService.getTimeAnalytics({
                startDate: startDate,
                endDate: endDate,
                branchName: branchName,
                user
            });
            apiResponse_1.ApiResponse.send(res, result);
        }
        catch (error) {
            console.error('Error in time analytics:', error);
            apiResponse_1.ApiResponse.send(res, apiResponse_1.ApiResponse.error('Failed to fetch time analytics', 500));
        }
    },
    async getSalesByHour(req, res) {
        try {
            const { startDate, endDate, branchName } = req.query;
            const { user } = req;
            const result = await report_service_1.reportsService.getSalesByHour({
                startDate: startDate,
                endDate: endDate,
                branchName: branchName,
                user
            });
            apiResponse_1.ApiResponse.send(res, result);
        }
        catch (error) {
            console.error('Error in sales by hour:', error);
            apiResponse_1.ApiResponse.send(res, apiResponse_1.ApiResponse.error('Failed to fetch sales by hour data', 500));
        }
    },
    async getPeakHoursAnalysis(req, res) {
        try {
            const { startDate, endDate, branchName } = req.query;
            const { user } = req;
            const result = await report_service_1.reportsService.getPeakHoursAnalysis({
                startDate: startDate,
                endDate: endDate,
                branchName: branchName,
                user
            });
            apiResponse_1.ApiResponse.send(res, result);
        }
        catch (error) {
            console.error('Error in peak hours analysis:', error);
            apiResponse_1.ApiResponse.send(res, apiResponse_1.ApiResponse.error('Failed to fetch peak hours analysis', 500));
        }
    },
    async getCustomerBehaviorAnalytics(req, res) {
        try {
            const { startDate, endDate, branchName } = req.query;
            const { user } = req;
            const result = await report_service_1.reportsService.getCustomerBehaviorAnalytics({
                startDate: startDate,
                endDate: endDate,
                branchName: branchName,
                user
            });
            apiResponse_1.ApiResponse.send(res, result);
        }
        catch (error) {
            console.error('Error in customer behavior analytics:', error);
            apiResponse_1.ApiResponse.send(res, apiResponse_1.ApiResponse.error('Failed to fetch customer behavior analytics', 500));
        }
    },
    async getProductPerformanceByTime(req, res) {
        try {
            const { startDate, endDate, branchName } = req.query;
            const { user } = req;
            const result = await report_service_1.reportsService.getProductPerformanceByTime({
                startDate: startDate,
                endDate: endDate,
                branchName: branchName,
                user
            });
            apiResponse_1.ApiResponse.send(res, result);
        }
        catch (error) {
            console.error('Error in product performance by time:', error);
            apiResponse_1.ApiResponse.send(res, apiResponse_1.ApiResponse.error('Failed to fetch product performance by time', 500));
        }
    },
    async getStaffPerformanceByTime(req, res) {
        try {
            const { startDate, endDate, branchName } = req.query;
            const { user } = req;
            const result = await report_service_1.reportsService.getStaffPerformanceByTime({
                startDate: startDate,
                endDate: endDate,
                branchName: branchName,
                user
            });
            apiResponse_1.ApiResponse.send(res, result);
        }
        catch (error) {
            console.error('Error in staff performance by time:', error);
            apiResponse_1.ApiResponse.send(res, apiResponse_1.ApiResponse.error('Failed to fetch staff performance by time', 500));
        }
    },
};
//# sourceMappingURL=report.controller.js.map