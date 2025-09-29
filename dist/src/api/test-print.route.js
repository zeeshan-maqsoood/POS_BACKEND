"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.testPrintRouter = void 0;
const express_1 = require("express");
const receipt_service_1 = require("../services/receipt.service");
const auth_middleware_1 = require("../middleware/auth.middleware");
const apiResponse_1 = require("../utils/apiResponse");
exports.testPrintRouter = (0, express_1.Router)();
// Test receipt printing endpoint
// GET /api/orders/test-print/:orderId
exports.testPrintRouter.get('/test-print/:orderId', auth_middleware_1.authenticateJWT, async (req, res) => {
    try {
        const { orderId } = req.params;
        if (!orderId) {
            return apiResponse_1.ApiResponse.send(res, apiResponse_1.ApiResponse.badRequest('Order ID is required'));
        }
        console.log(`🖨️  Test print request received for order ${orderId}`);
        const success = await (0, receipt_service_1.printReceipt)(orderId);
        if (success) {
            return apiResponse_1.ApiResponse.send(res, apiResponse_1.ApiResponse.success({ orderId }, 'Receipt sent to printer successfully'));
        }
        else {
            return apiResponse_1.ApiResponse.send(res, apiResponse_1.ApiResponse.error('Failed to print receipt', 500));
        }
    }
    catch (error) {
        console.error('Error in test print endpoint:', error);
        return apiResponse_1.ApiResponse.send(res, apiResponse_1.ApiResponse.error(error.message || 'Internal server error', 500));
    }
});
exports.default = exports.testPrintRouter;
//# sourceMappingURL=test-print.route.js.map