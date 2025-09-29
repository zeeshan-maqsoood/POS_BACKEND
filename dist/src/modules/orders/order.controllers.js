"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteOrder = exports.updateOrderStatus = exports.getOrderById = exports.getOrderStats = exports.updatePaymentStatus = exports.getOrders = exports.createOrder = void 0;
const orderService = __importStar(require("./order.service"));
const apiResponse_1 = require("../../utils/apiResponse");
const date_fns_1 = require("date-fns");
const app_1 = require("../../../app");
const receipt_service_1 = require("../../services/receipt.service");
const notification_service_1 = require("../../services/notification.service");
// Wrapper function to handle receipt printing
async function printOrderReceipt(orderId) {
    console.log(`\n=== printOrderReceipt called for order ${orderId} ===`);
    try {
        console.log('Calling printReceipt function...');
        const success = await (0, receipt_service_1.printReceipt)(orderId);
        if (!success) {
            console.error(`❌ Failed to print receipt for order ${orderId}`);
        }
        else {
            console.log(`✅ Successfully processed receipt for order ${orderId}`);
        }
    }
    catch (error) {
        console.error(`❌ Error in printOrderReceipt for order ${orderId}:`, error);
    }
}
const createOrder = async (req, res) => {
    try {
        const currentUser = req.user;
        const order = await orderService.createOrder(req.body, currentUser);
        if (order && order.branchName) {
            notification_service_1.NotificationService.notifyNewOrder(order).catch(error => {
                console.error('Failed to send new order notification:', error);
            });
        }
        const io = (0, app_1.getIo)();
        io.emit('new-order', {
            order,
            createdByRole: currentUser.role,
            message: "New order created"
        });
        if (!order || !order.id) {
            throw new Error('Failed to create order: Invalid order data returned from service');
        }
        // Print receipt in the background (don't await to avoid delaying the response)
        printOrderReceipt(order.id).catch((error) => {
            console.error('Error printing receipt:', error);
        });
        apiResponse_1.ApiResponse.send(res, apiResponse_1.ApiResponse.success(order, "Order created successfully", 201));
    }
    catch (error) {
        console.error('Error creating order:', error);
        const statusCode = error.statusCode || 400;
        const message = error.message || 'Failed to create order';
        apiResponse_1.ApiResponse.send(res, apiResponse_1.ApiResponse.error(message, statusCode));
    }
};
exports.createOrder = createOrder;
const getOrders = async (req, res) => {
    try {
        const currentUser = req.user;
        const { status, paymentStatus, orderType, branchName, startDate, endDate, search, page = '1', pageSize = '10', sortBy = 'createdAt', sortOrder = 'desc' } = req.query;
        const orders = await orderService.getOrdersService({
            status,
            paymentStatus: paymentStatus,
            orderType: orderType,
            branchName: branchName,
            startDate: startDate ? (0, date_fns_1.parseISO)(startDate) : undefined,
            endDate: endDate ? (0, date_fns_1.parseISO)(endDate) : undefined,
            search,
            page: parseInt(page, 10),
            pageSize: parseInt(pageSize, 10),
            sortBy,
            sortOrder: sortOrder,
        }, currentUser);
        apiResponse_1.ApiResponse.send(res, apiResponse_1.ApiResponse.success(orders, "Orders retrieved successfully"));
    }
    catch (error) {
        console.error('Error in getOrders:', error);
        apiResponse_1.ApiResponse.send(res, apiResponse_1.ApiResponse.error(error.message || 'Failed to retrieve orders', 500));
    }
};
exports.getOrders = getOrders;
const updatePaymentStatus = async (req, res) => {
    console.log('\n=== updatePaymentStatus called ===');
    console.log('Request body:', JSON.stringify(req.body, null, 2));
    try {
        const currentUser = req.user;
        const { id } = req.params;
        const { paymentStatus, paymentMethod } = req.body;
        console.log(`Processing payment update for order ${id}:`, { paymentStatus, paymentMethod });
        if (!paymentStatus || !paymentMethod) {
            console.error('Missing payment status or method');
            return apiResponse_1.ApiResponse.send(res, apiResponse_1.ApiResponse.badRequest('Payment status and payment method are required'));
        }
        console.log('Calling updatePaymentStatusService...');
        // First update the payment status
        const order = await orderService.updatePaymentStatusService(id, paymentStatus, paymentMethod, currentUser);
        console.log('Payment status updated successfully:', {
            orderId: order.id,
            orderNumber: order.orderNumber,
            status: order.status,
            paymentStatus: order.paymentStatus,
            paymentMethod: order.paymentMethod
        });
        // Print receipt when payment is completed
        if (paymentStatus === 'PAID') {
            console.log('Payment is PAID, calling printOrderReceipt...');
            await printOrderReceipt(id);
        }
        apiResponse_1.ApiResponse.send(res, apiResponse_1.ApiResponse.success(order, 'Payment status updated successfully'));
    }
    catch (error) {
        apiResponse_1.ApiResponse.send(res, apiResponse_1.ApiResponse.error(error.message || 'Failed to update payment status', 500));
    }
};
exports.updatePaymentStatus = updatePaymentStatus;
const getOrderStats = async (req, res) => {
    try {
        const { startDate, endDate } = req.query;
        const stats = await orderService.getOrderStatsService({
            startDate: startDate && (0, date_fns_1.isDate)(new Date(startDate)) ? new Date(startDate) : undefined,
            endDate: endDate && (0, date_fns_1.isDate)(new Date(endDate)) ? new Date(endDate) : undefined,
        });
        apiResponse_1.ApiResponse.send(res, apiResponse_1.ApiResponse.success(stats, "Order statistics retrieved successfully"));
    }
    catch (error) {
        console.error('Error in getOrderStats:', error);
        apiResponse_1.ApiResponse.send(res, apiResponse_1.ApiResponse.error(error.message || 'Failed to retrieve order statistics', 500));
    }
};
exports.getOrderStats = getOrderStats;
const getOrderById = async (req, res) => {
    try {
        const currentUser = req.user;
        const order = await orderService.getOrderByIdService(req.params.id, currentUser);
        if (!order) {
            return apiResponse_1.ApiResponse.send(res, apiResponse_1.ApiResponse.error("Order not found", 404));
        }
        apiResponse_1.ApiResponse.send(res, apiResponse_1.ApiResponse.success(order, "Order retrieved successfully"));
    }
    catch (error) {
        console.error('Error getting order:', error);
        const statusCode = error.statusCode || 500;
        const message = error.message || 'Failed to get order';
        apiResponse_1.ApiResponse.send(res, apiResponse_1.ApiResponse.error(message, statusCode));
    }
};
exports.getOrderById = getOrderById;
const updateOrderStatus = async (req, res) => {
    try {
        const currentUser = req.user;
        const { status, notes } = req.body;
        const { id } = req.params;
        // Update order status with the validated data
        const order = await orderService.updateOrderStatusService(id, status, currentUser);
        // If there are notes, update them as well
        if (notes) {
            await orderService.updateOrder(id, { notes }, currentUser);
        }
        // Get the updated order with all fields
        const updatedOrder = await orderService.getOrderByIdService(id, currentUser);
        apiResponse_1.ApiResponse.send(res, apiResponse_1.ApiResponse.success(updatedOrder, "Order status updated successfully"));
    }
    catch (error) {
        console.error('Error updating order status:', error);
        const statusCode = error.statusCode || 500;
        const message = error.message || 'Failed to update order status';
        apiResponse_1.ApiResponse.send(res, apiResponse_1.ApiResponse.error(message, statusCode));
    }
};
exports.updateOrderStatus = updateOrderStatus;
const deleteOrder = async (req, res) => {
    try {
        const currentUser = req.user;
        await orderService.deleteOrderService(req.params.id, currentUser);
        apiResponse_1.ApiResponse.send(res, apiResponse_1.ApiResponse.success(null, "Order deleted successfully", 204));
    }
    catch (error) {
        apiResponse_1.ApiResponse.send(res, apiResponse_1.ApiResponse.error(error.message, 400));
    }
};
exports.deleteOrder = deleteOrder;
exports.default = {
    createOrder: exports.createOrder,
    getOrders: exports.getOrders,
    updatePaymentStatus: exports.updatePaymentStatus,
    getOrderStats: exports.getOrderStats,
    getOrderById: exports.getOrderById,
    updateOrderStatus: exports.updateOrderStatus,
    deleteOrder: exports.deleteOrder
};
//# sourceMappingURL=order.controllers.js.map