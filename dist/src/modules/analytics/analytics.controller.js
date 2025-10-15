"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getOrdersByType = exports.getSalesData = exports.getAnalytics = void 0;
const date_fns_1 = require("date-fns");
const auth_types_1 = require("../../types/auth.types");
const analytic_service_1 = __importDefault(require("./analytic.service"));
const getAnalytics = async (req, res) => {
    try {
        // Check if user is authenticated and has permission to view analytics
        if (!req.user) {
            return res.status(401).json({ error: 'Unauthorized' });
        }
        // Check if user has permission to view analytics
        if (!(0, auth_types_1.hasPermission)(req.user, ['POS_READ', 'ORDER_READ'])) {
            return res.status(403).json({ error: 'Insufficient permissions' });
        }
        const { from: fromStr, to: toStr, branch: branchName } = req.query;
        // Set default date range to last 30 days if not provided
        const to = toStr ? (0, date_fns_1.parseISO)(toStr) : new Date();
        const from = fromStr ? (0, date_fns_1.parseISO)(fromStr) : (0, date_fns_1.subDays)(to, 30);
        // Ensure we have valid dates
        if (isNaN(from.getTime()) || isNaN(to.getTime())) {
            return res.status(400).json({ error: 'Invalid date format. Use ISO 8601 format (YYYY-MM-DD)' });
        }
        // Ensure from is before to
        if (from > to) {
            return res.status(400).json({ error: '"from" date must be before "to" date' });
        }
        const analytics = await analytic_service_1.default.getDashboardAnalytics({ from: (0, date_fns_1.startOfDay)(from), to: (0, date_fns_1.endOfDay)(to) }, branchName);
        res.json(analytics);
    }
    catch (error) {
        console.error('Error fetching analytics:', error);
        res.status(500).json({ error: 'Failed to fetch analytics data' });
    }
};
exports.getAnalytics = getAnalytics;
const getSalesData = async (req, res) => {
    try {
        const { from: fromStr, to: toStr, branch: branchName } = req.query;
        const to = toStr ? (0, date_fns_1.parseISO)(toStr) : new Date();
        const from = fromStr ? (0, date_fns_1.parseISO)(fromStr) : (0, date_fns_1.subDays)(to, 30);
        if (isNaN(from.getTime()) || isNaN(to.getTime())) {
            return res.status(400).json({ error: 'Invalid date format' });
        }
        const salesData = await analytic_service_1.default.getSalesData({ from: (0, date_fns_1.startOfDay)(from), to: (0, date_fns_1.endOfDay)(to) }, branchName);
        res.json(salesData);
    }
    catch (error) {
        console.error('Error fetching sales data:', error);
        res.status(500).json({ error: 'Failed to fetch sales data' });
    }
};
exports.getSalesData = getSalesData;
const getOrdersByType = async (req, res) => {
    try {
        const { from: fromStr, to: toStr, branch: branchName } = req.query;
        const to = toStr ? (0, date_fns_1.parseISO)(toStr) : new Date();
        const from = fromStr ? (0, date_fns_1.parseISO)(fromStr) : (0, date_fns_1.subDays)(to, 30);
        const ordersByType = await analytic_service_1.default.getOrdersByType({ from: (0, date_fns_1.startOfDay)(from), to: (0, date_fns_1.endOfDay)(to) }, branchName);
        res.json(ordersByType);
    }
    catch (error) {
        console.error('Error fetching orders by type:', error);
        res.status(500).json({ error: 'Failed to fetch orders by type' });
    }
};
exports.getOrdersByType = getOrdersByType;
// Add similar controller methods for other analytics endpoints
// ...
exports.default = {
    getAnalytics: exports.getAnalytics,
    getSalesData: exports.getSalesData,
    getOrdersByType: exports.getOrdersByType,
    // ... export other methods
};
//# sourceMappingURL=analytics.controller.js.map