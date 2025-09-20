"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const receipt_service_1 = require("../../services/receipt.service");
const apiResponse_1 = require("../../utils/apiResponse");
const router = (0, express_1.Router)();
/**
 * @route   POST /api/receipts/print/:orderId
 * @desc    Print a receipt for an order
 * @access  Private
 */
router.post('/print/:orderId', async (req, res) => {
    try {
        const { orderId } = req.params;
        const success = await (0, receipt_service_1.printReceipt)(orderId);
        if (!success) {
            return apiResponse_1.ApiResponse.send(res, apiResponse_1.ApiResponse.error('Failed to print receipt. The printer might be offline.', 500));
        }
        apiResponse_1.ApiResponse.send(res, apiResponse_1.ApiResponse.success({}, 'Receipt sent to printer'));
    }
    catch (error) {
        console.error('Error printing receipt:', error);
        apiResponse_1.ApiResponse.send(res, apiResponse_1.ApiResponse.error(error.message || 'Failed to print receipt', 500));
    }
});
exports.default = router;
//# sourceMappingURL=receipt.routes.js.map