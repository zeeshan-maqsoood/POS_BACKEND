import { Router } from "express";
import { categoryController, menuItemController, modifierController } from "./menu.controller";
import { authenticateJWT, checkPermission, validateRequest } from "../../middleware/auth.middleware";
import { createCategorySchema, updateCategorySchema, createMenuItemSchema, updateMenuItemSchema, createModifierSchema, updateModifierSchema } from "../../middleware/validations/menu.validation";
import { PERMISSIONS } from "../../types/auth.types";

const router = Router();
router.use(authenticateJWT);

// --- Categories ---
router.get("/categories", checkPermission([PERMISSIONS.MENU_READ, PERMISSIONS.POS_READ]), categoryController.list);
router.get("/categories/:id", checkPermission([PERMISSIONS.MENU_READ]), categoryController.get);
router.post("/categories", checkPermission([PERMISSIONS.MENU_CREATE]), validateRequest({ body: createCategorySchema }), categoryController.create);
router.put("/categories/:id", checkPermission([PERMISSIONS.MENU_UPDATE]), validateRequest({ body: updateCategorySchema }), categoryController.update);
router.delete("/categories/:id", checkPermission([PERMISSIONS.MENU_DELETE]), categoryController.remove);

// --- MenuItems ---
router.get("/items", checkPermission([PERMISSIONS.MENU_READ, PERMISSIONS.POS_READ]), menuItemController.list);
router.get("/items/:id", checkPermission([PERMISSIONS.MENU_READ]), menuItemController.get);
router.post("/items", checkPermission([PERMISSIONS.MENU_CREATE]), validateRequest({ body: createMenuItemSchema }), menuItemController.create);
router.put("/items/:id", checkPermission([PERMISSIONS.MENU_UPDATE]), validateRequest({ body: updateMenuItemSchema }), menuItemController.update);
router.delete("/items/:id", checkPermission([PERMISSIONS.MENU_DELETE]), menuItemController.remove);

// --- Modifiers ---
router.get("/modifiers", checkPermission([PERMISSIONS.MENU_READ]), modifierController.list);
router.get("/modifiers/:id", checkPermission([PERMISSIONS.MENU_READ]), modifierController.get);
router.post("/modifiers", checkPermission([PERMISSIONS.MENU_CREATE]), validateRequest({ body: createModifierSchema }), modifierController.create);
router.put("/modifiers/:id", checkPermission([PERMISSIONS.MENU_UPDATE]), validateRequest({ body: updateModifierSchema }), modifierController.update);
router.delete("/modifiers/:id", checkPermission([PERMISSIONS.MENU_DELETE]), modifierController.remove);

export default router;