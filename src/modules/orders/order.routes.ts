import { Router } from "express";
import orderController from "./order.controllers";
import { authenticateJWT, validateRequest } from "../../middleware/auth.middleware";
import { createOrderValidator, updateOrderStatusValidator } from "../../middleware/validations/order.validation";

const router = Router();

// Apply authentication to all order routes
router.use(authenticateJWT);

// Create a new order
router.post("/", validateRequest(createOrderValidator), orderController.createOrder);

// Get orders with filtering and pagination
router.get("/", orderController.getOrders);

// Get order statistics
router.get("/stats", orderController.getOrderStats);

// Get order by ID
router.get("/:id", orderController.getOrderById);

// Update order status
router.put(
  "/:id/status",
  validateRequest(updateOrderStatusValidator),
  orderController.updateOrderStatus
);

// Update payment status
router.put(
  "/:id/payment-status",
  orderController.updatePaymentStatus
);

// Delete an order
router.delete("/:id", orderController.deleteOrder);

export default router;