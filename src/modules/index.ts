import { Router } from "express";
import userRoutes from "./user/user.routes";
import productRoutes from "./products/product.routes";
import menuRoutes from "./menu/menu.routes";
import orderRoutes from "./orders/order.routes";
import { dashboardRouter } from "./dashboard/dashboard.routes";
import receiptRoutes from "./receipt/receipt.routes";
import branchRoutes from "./branch/branch.routes";
import analyticsRoutes from "./analytics/analytics.routes"
import reportingRoutes from "./reporting/report.routes"
import inventoryRoutes from "./inventory/inventory.routes"
import shiftRoutes from "./shift/shift.routes"
// import authRoutes from "./auth/auth.routes";

const router = Router();

// API routes
router.use("/auth", userRoutes);
router.use("/products", productRoutes);
router.use("/menu", menuRoutes);
router.use("/orders", orderRoutes);
router.use("/branches", branchRoutes);
router.use("/dashboard", dashboardRouter);
router.use("/receipts", receiptRoutes);
router.use("/analytics", analyticsRoutes);
router.use("/reports", reportingRoutes);
router.use("/inventory",inventoryRoutes)
router.use("/shift",shiftRoutes)
// router.use("/auth", authRoutes);

export default router;
