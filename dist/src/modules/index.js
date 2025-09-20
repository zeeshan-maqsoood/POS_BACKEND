"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const user_routes_1 = __importDefault(require("./user/user.routes"));
const product_routes_1 = __importDefault(require("./products/product.routes"));
const menu_routes_1 = __importDefault(require("./menu/menu.routes"));
const order_routes_1 = __importDefault(require("./orders/order.routes"));
const dashboard_routes_1 = require("./dashboard/dashboard.routes");
const receipt_routes_1 = __importDefault(require("./receipt/receipt.routes"));
// import authRoutes from "./auth/auth.routes";
const router = (0, express_1.Router)();
// API routes
router.use("/auth", user_routes_1.default);
router.use("/products", product_routes_1.default);
router.use("/menu", menu_routes_1.default);
router.use("/orders", order_routes_1.default);
router.use("/dashboard", dashboard_routes_1.dashboardRouter);
router.use("/receipts", receipt_routes_1.default);
// router.use("/auth", authRoutes);
exports.default = router;
//# sourceMappingURL=index.js.map