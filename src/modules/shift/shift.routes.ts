import { Router } from "express";
import { shiftController } from "./shift.controller";
import { authenticateJWT, checkRole, checkPermission } from "../../middleware/auth.middleware";
import { UserRole } from "@prisma/client";

const router = Router();
router.use(authenticateJWT);

// Any authenticated staff can start/end their own shifts
router.post("/start", shiftController.startShift);
router.post("/end", shiftController.endShift);
router.get("/my", shiftController.getMyShifts);

// Manager/Admin endpoints - you can protect with checkRole middleware
router.get("/branch", checkRole([UserRole.MANAGER, UserRole.ADMIN]), shiftController.getBranchShifts);
router.get("/active", checkRole([UserRole.MANAGER, UserRole.ADMIN]), shiftController.getActiveShifts);
router.get("/report", checkRole([UserRole.MANAGER, UserRole.ADMIN]), shiftController.getReport);

// Additional utility endpoints
router.get("/:id", shiftController.getShiftById);
router.put("/:id", checkRole([UserRole.ADMIN]), shiftController.updateShift);
router.delete("/:id", checkRole([UserRole.ADMIN]), shiftController.deleteShift);

// User-specific endpoints
router.get("/user/:userId", shiftController.getUserShifts);
router.get("/active-status", shiftController.getActiveShiftStatus);

// Statistics endpoint (Manager/Admin only)
router.get("/stats", checkRole([UserRole.MANAGER, UserRole.ADMIN]), shiftController.getShiftStats);

export default router;