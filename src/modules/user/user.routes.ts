import { Router } from "express";
import * as userController from "./user.controller";
import {
  authenticateJWT,
  checkPermission,
  checkRole,
} from "../../middleware/auth.middleware";
import { UserRole } from "@prisma/client";
import { Permission } from "@prisma/client";

const router = Router();

// Public routes (no authentication required)
router.post("/login", userController.login);
router.post("/logout", userController.logout);

// Apply authentication middleware to all routes below this line
router.use(authenticateJWT);

// Protected routes (require authentication)
router.get("/profile", userController.getProfile);
// GET all users (needs permission)
router.get("/", checkPermission([Permission.USER_READ]), userController.getUsers);


// Regular user routes
router.post(
  "/",
  checkPermission([Permission.USER_CREATE]),
  userController.createUser
);

// GET user by ID (needs permission)
router.get(
  "/:id",
  checkPermission([Permission.USER_READ]),
  userController.getUser
);

// UPDATE user (needs permission)
router.put(
  "/:id",
  (req, res, next) => {
    console.log('Update user route hit', { 
      method: req.method, 
      url: req.url, 
      params: req.params,
      body: req.body 
    });
    next();
  },
  checkPermission([Permission.USER_UPDATE]),
  userController.updateUser
);

// Manager specific update route
router.put(
  "/managers/:id",
  checkRole([UserRole.ADMIN]),
  checkPermission([Permission.USER_UPDATE]),
  userController.updateManager
);

// DELETE user (needs Admin role)
router.delete(
  "/:id",
  checkRole([UserRole.ADMIN]),
  userController.deleteUser
);

// GET profile (needs permission)
router.get(
  "/profile",
  checkPermission([Permission.USER_READ]),
  userController.getProfile
);





export default router;