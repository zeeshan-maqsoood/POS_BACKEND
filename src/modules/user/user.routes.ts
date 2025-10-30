import { Router } from "express";
import * as userController from "./user.controller";
import {
  authenticateJWT,
  checkPermission,
  checkRole,
} from "../../middleware/auth.middleware";
import { UserRole } from "@prisma/client";
import { PERMISSIONS } from "../../types/auth.types";

const router = Router();

// Public routes (no authentication required)
router.post("/login", userController.login);
router.post("/logout", userController.logout);

// Apply authentication middleware to all routes below this line
router.use(authenticateJWT);

// Protected routes (require authentication)
router.get("/profile", checkPermission([PERMISSIONS.USER_READ]), userController.getProfile);

// Manager/User management routes
router.get("/", checkPermission([PERMISSIONS.USER_READ]), userController.getUsers);
router.get("/:id", checkPermission([PERMISSIONS.USER_READ]), userController.getUser);
router.post("/", checkPermission([PERMISSIONS.USER_CREATE]), userController.createUser);
router.put("/:id", checkPermission([PERMISSIONS.USER_UPDATE]), userController.updateUser);
router.delete("/:id", checkPermission([PERMISSIONS.USER_DELETE]), userController.deleteUser);

// Manager-specific routes (using same controller methods)
router.post("/manager", checkPermission([PERMISSIONS.USER_CREATE]), userController.createManager);
router.put("/manager/:id", checkPermission([PERMISSIONS.USER_UPDATE]), userController.updateManager);





export default router;