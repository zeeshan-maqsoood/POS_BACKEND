import { Router } from "express";
import {
  getAllShifts,
  getShiftById,
  getUserShifts,
  getActiveShifts,
  getShiftStats,
  createShift,
  updateShift,
  endShift,
  deleteShift,
  getUsersForShiftAssignment,
  getBranchesForShift
} from "./shift.controllers";
import { authenticate } from "../../middleware/authenticate";

const router = Router();

// GET /api/shift - Get all shifts with optional filters
router.get("/", authenticate, getAllShifts);

// GET /api/shift/active - Get all active shifts
router.get("/active", authenticate, getActiveShifts);

// GET /api/shift/stats - Get shift statistics
router.get("/stats", authenticate, getShiftStats);

// GET /api/shift/users - Get users available for shift assignment
router.get("/users", authenticate, getUsersForShiftAssignment);

// GET /api/shift/branches - Get branches for shift management
router.get("/branches", authenticate, getBranchesForShift);

// GET /api/shift/:id - Get specific shift by ID
router.get("/:id", authenticate, getShiftById);

// GET /api/shift/user/:userId - Get shifts for a specific user
router.get("/user/:userId", authenticate, getUserShifts);

// POST /api/shift - Create new shift
router.post("/", authenticate, createShift);

// PUT /api/shift/:id - Update shift
router.put("/:id", authenticate, updateShift);

// PUT /api/shift/:id/end - End a shift
router.put("/:id/end", authenticate, endShift);

// DELETE /api/shift/:id - Delete shift
router.delete("/:id", authenticate, deleteShift);

export default router;
