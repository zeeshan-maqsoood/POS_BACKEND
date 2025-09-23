"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const order_controllers_1 = __importDefault(require("./order.controllers"));
const auth_middleware_1 = require("../../middleware/auth.middleware");
const order_validation_1 = require("../../middleware/validations/order.validation");
const router = (0, express_1.Router)();
// Apply authentication to all order routes
router.use(auth_middleware_1.authenticateJWT);
// Create a new order
router.post("/", (0, auth_middleware_1.validateRequest)(order_validation_1.createOrderValidator), order_controllers_1.default.createOrder);
// Get orders with filtering and pagination
router.get("/", order_controllers_1.default.getOrders);
// Get order statistics
router.get("/stats", order_controllers_1.default.getOrderStats);
// Get order by ID
router.get("/:id", order_controllers_1.default.getOrderById);
// Update order status
router.put("/:id/status", (0, auth_middleware_1.validateRequest)(order_validation_1.updateOrderStatusValidator), order_controllers_1.default.updateOrderStatus);
// Update payment status
router.put("/:id/payment-status", order_controllers_1.default.updatePaymentStatus);
// Delete an order
router.delete("/:id", order_controllers_1.default.deleteOrder);
exports.default = router;
//# sourceMappingURL=order.routes.js.map