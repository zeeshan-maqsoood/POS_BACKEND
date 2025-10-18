import { Router } from "express";
import {
  getAllBranches,
  getActiveBranches,
  getUserBranches,
  getBranchesForDropdown,
  getBranchById,
  getBranchStats,
  createBranch,
  updateBranch,
  deleteBranch
} from "./branch.controllers";
import { authenticate } from "../../middleware/authenticate";

const router = Router();

// GET /api/branches - Get all branches (admin only)
router.get("/", authenticate, getAllBranches);

// GET /api/branches/active - Get all active branches
router.get("/active", authenticate, getActiveBranches);

// GET /api/branches/user - Get branches for current user
router.get("/user", authenticate, getUserBranches);

// GET /api/branches/dropdown - Get branches for dropdown (active branches)
router.get("/dropdown", authenticate, getBranchesForDropdown);

// GET /api/branches/:id - Get specific branch by ID
router.get("/:id", authenticate, getBranchById);

// GET /api/branches/:id/stats - Get branch statistics
router.get("/:id/stats", authenticate, getBranchStats);

// POST /api/branches - Create new branch (admin only)
router.post("/", authenticate, createBranch);

// PUT /api/branches/:id - Update branch (admin only)
router.put("/:id", authenticate, updateBranch);

// DELETE /api/branches/:id - Delete/deactivate branch (admin only)
router.delete("/:id", authenticate, deleteBranch);

export default router;
