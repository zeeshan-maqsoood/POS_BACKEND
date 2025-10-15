import { Router } from "express";
import { 
  inventoryCategoryController, 
  inventorySubcategoryController, 
  inventoryItemController,
  supplierController
} from "./inventory.controller";
import { authenticateJWT, checkPermission, validateRequest } from "../../middleware/auth.middleware";
import { PERMISSIONS } from "../../types/auth.types";

const router = Router();
router.use(authenticateJWT);

// --- Inventory Categories ---
router.get("/categories", checkPermission([PERMISSIONS.PRODUCT_READ]), inventoryCategoryController.list);
router.get("/categories/:id", checkPermission([PERMISSIONS.PRODUCT_READ]), inventoryCategoryController.get);
router.post("/categories", checkPermission([PERMISSIONS.PRODUCT_CREATE]), inventoryCategoryController.create);
router.put("/categories/:id", checkPermission([PERMISSIONS.PRODUCT_UPDATE]), inventoryCategoryController.update);
router.delete("/categories/:id", checkPermission([PERMISSIONS.PRODUCT_DELETE]), inventoryCategoryController.remove);

// --- Inventory Subcategories ---
router.get("/subcategories", checkPermission([PERMISSIONS.PRODUCT_READ]), inventorySubcategoryController.list);
router.get("/subcategories/:id", checkPermission([PERMISSIONS.PRODUCT_READ]), inventorySubcategoryController.get);
router.post("/subcategories", checkPermission([PERMISSIONS.PRODUCT_CREATE]), inventorySubcategoryController.create);
router.put("/subcategories/:id", checkPermission([PERMISSIONS.PRODUCT_UPDATE]), inventorySubcategoryController.update);
router.delete("/subcategories/:id", checkPermission([PERMISSIONS.PRODUCT_DELETE]), inventorySubcategoryController.remove);

// --- Inventory Items ---
router.get("/items", checkPermission([PERMISSIONS.PRODUCT_READ]), inventoryItemController.list);
router.get("/items/:id", checkPermission([PERMISSIONS.PRODUCT_READ]), inventoryItemController.get);
router.post("/items", checkPermission([PERMISSIONS.PRODUCT_CREATE]), inventoryItemController.create);
router.put("/items/:id", checkPermission([PERMISSIONS.PRODUCT_UPDATE]), inventoryItemController.update);
router.delete("/items/:id", checkPermission([PERMISSIONS.PRODUCT_DELETE]), inventoryItemController.remove);

// --- Suppliers ---
router.get("/suppliers", checkPermission([PERMISSIONS.SUPPLIER_READ]), supplierController.list);
router.get("/suppliers/:id", checkPermission([PERMISSIONS.SUPPLIER_READ]), supplierController.get);
router.post("/suppliers", checkPermission([PERMISSIONS.SUPPLIER_CREATE]), supplierController.create);
router.put("/suppliers/:id", checkPermission([PERMISSIONS.SUPPLIER_UPDATE]), supplierController.update);
router.delete("/suppliers/:id", checkPermission([PERMISSIONS.SUPPLIER_DELETE]), supplierController.remove);

// --- Supplier Products ---
router.get("/suppliers/:supplierId/products", checkPermission([PERMISSIONS.SUPPLIER_READ]), supplierController.getProducts);
router.post("/suppliers/:supplierId/products", checkPermission([PERMISSIONS.SUPPLIER_UPDATE]), supplierController.addProduct);
router.put("/supplier-products/:supplierProductId", checkPermission([PERMISSIONS.SUPPLIER_UPDATE]), supplierController.updateProduct);
router.delete("/supplier-products/:supplierProductId", checkPermission([PERMISSIONS.SUPPLIER_UPDATE]), supplierController.removeProduct);

export default router;