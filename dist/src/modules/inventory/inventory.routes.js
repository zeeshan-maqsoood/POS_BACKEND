"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const inventory_controller_1 = require("./inventory.controller");
const auth_middleware_1 = require("../../middleware/auth.middleware");
const auth_types_1 = require("../../types/auth.types");
const router = (0, express_1.Router)();
router.use(auth_middleware_1.authenticateJWT);
// --- Inventory Categories ---
router.get("/categories", (0, auth_middleware_1.checkPermission)([auth_types_1.PERMISSIONS.PRODUCT_READ]), inventory_controller_1.inventoryCategoryController.list);
router.get("/categories/:id", (0, auth_middleware_1.checkPermission)([auth_types_1.PERMISSIONS.PRODUCT_READ]), inventory_controller_1.inventoryCategoryController.get);
router.post("/categories", (0, auth_middleware_1.checkPermission)([auth_types_1.PERMISSIONS.PRODUCT_CREATE]), inventory_controller_1.inventoryCategoryController.create);
router.put("/categories/:id", (0, auth_middleware_1.checkPermission)([auth_types_1.PERMISSIONS.PRODUCT_UPDATE]), inventory_controller_1.inventoryCategoryController.update);
router.delete("/categories/:id", (0, auth_middleware_1.checkPermission)([auth_types_1.PERMISSIONS.PRODUCT_DELETE]), inventory_controller_1.inventoryCategoryController.remove);
// --- Inventory Subcategories ---
router.get("/subcategories", (0, auth_middleware_1.checkPermission)([auth_types_1.PERMISSIONS.PRODUCT_READ]), inventory_controller_1.inventorySubcategoryController.list);
router.get("/subcategories/:id", (0, auth_middleware_1.checkPermission)([auth_types_1.PERMISSIONS.PRODUCT_READ]), inventory_controller_1.inventorySubcategoryController.get);
router.post("/subcategories", (0, auth_middleware_1.checkPermission)([auth_types_1.PERMISSIONS.PRODUCT_CREATE]), inventory_controller_1.inventorySubcategoryController.create);
router.put("/subcategories/:id", (0, auth_middleware_1.checkPermission)([auth_types_1.PERMISSIONS.PRODUCT_UPDATE]), inventory_controller_1.inventorySubcategoryController.update);
router.delete("/subcategories/:id", (0, auth_middleware_1.checkPermission)([auth_types_1.PERMISSIONS.PRODUCT_DELETE]), inventory_controller_1.inventorySubcategoryController.remove);
// --- Inventory Items ---
router.get("/items", (0, auth_middleware_1.checkPermission)([auth_types_1.PERMISSIONS.PRODUCT_READ]), inventory_controller_1.inventoryItemController.list);
router.get("/items/:id", (0, auth_middleware_1.checkPermission)([auth_types_1.PERMISSIONS.PRODUCT_READ]), inventory_controller_1.inventoryItemController.get);
router.post("/items", (0, auth_middleware_1.checkPermission)([auth_types_1.PERMISSIONS.PRODUCT_CREATE]), inventory_controller_1.inventoryItemController.create);
router.put("/items/:id", (0, auth_middleware_1.checkPermission)([auth_types_1.PERMISSIONS.PRODUCT_UPDATE]), inventory_controller_1.inventoryItemController.update);
router.delete("/items/:id", (0, auth_middleware_1.checkPermission)([auth_types_1.PERMISSIONS.PRODUCT_DELETE]), inventory_controller_1.inventoryItemController.remove);
// --- Suppliers ---
router.get("/suppliers", (0, auth_middleware_1.checkPermission)([auth_types_1.PERMISSIONS.SUPPLIER_READ]), inventory_controller_1.supplierController.list);
router.get("/suppliers/:id", (0, auth_middleware_1.checkPermission)([auth_types_1.PERMISSIONS.SUPPLIER_READ]), inventory_controller_1.supplierController.get);
router.post("/suppliers", (0, auth_middleware_1.checkPermission)([auth_types_1.PERMISSIONS.SUPPLIER_CREATE]), inventory_controller_1.supplierController.create);
router.put("/suppliers/:id", (0, auth_middleware_1.checkPermission)([auth_types_1.PERMISSIONS.SUPPLIER_UPDATE]), inventory_controller_1.supplierController.update);
router.delete("/suppliers/:id", (0, auth_middleware_1.checkPermission)([auth_types_1.PERMISSIONS.SUPPLIER_DELETE]), inventory_controller_1.supplierController.remove);
// --- Supplier Products ---
router.get("/suppliers/:supplierId/products", (0, auth_middleware_1.checkPermission)([auth_types_1.PERMISSIONS.SUPPLIER_READ]), inventory_controller_1.supplierController.getProducts);
router.post("/suppliers/:supplierId/products", (0, auth_middleware_1.checkPermission)([auth_types_1.PERMISSIONS.SUPPLIER_UPDATE]), inventory_controller_1.supplierController.addProduct);
router.put("/supplier-products/:supplierProductId", (0, auth_middleware_1.checkPermission)([auth_types_1.PERMISSIONS.SUPPLIER_UPDATE]), inventory_controller_1.supplierController.updateProduct);
router.delete("/supplier-products/:supplierProductId", (0, auth_middleware_1.checkPermission)([auth_types_1.PERMISSIONS.SUPPLIER_UPDATE]), inventory_controller_1.supplierController.removeProduct);
exports.default = router;
//# sourceMappingURL=inventory.routes.js.map