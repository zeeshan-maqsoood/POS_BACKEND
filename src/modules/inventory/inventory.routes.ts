import { Router } from "express";
import { 
  inventoryCategoryController, 
  inventorySubcategoryController, 
  inventoryItemController 
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

export default router;