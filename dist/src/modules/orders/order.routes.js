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
const express_1 = require("express");
const orderController = __importStar(require("./order.controllers"));
const auth_middleware_1 = require("../../middleware/auth.middleware");
const order_validation_1 = require("../../middleware/validations/order.validation");
const router = (0, express_1.Router)();
// Create a new order
router.post("/", (0, auth_middleware_1.validateRequest)(order_validation_1.createOrderValidator), orderController.createOrder);
// Get orders with filtering and pagination
router.get("/", orderController.getOrders);
// Get order statistics
router.get("/stats", orderController.getOrderStats);
// Get order by ID
router.get("/:id", orderController.getOrderById);
// Update order status
router.put("/:id/status", (0, auth_middleware_1.validateRequest)(order_validation_1.updateOrderStatusValidator), orderController.updateOrderStatus);
// Update payment status
router.put("/:id/payment-status", orderController.updatePaymentStatus);
// Delete an order
router.delete("/:id", orderController.deleteOrder);
exports.default = router;
//# sourceMappingURL=order.routes.js.map