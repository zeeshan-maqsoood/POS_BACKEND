import { Router } from "express";
import { getBranches, getAllBranches } from "./branch.controllers";
import { authenticate } from "../../middleware/authenticate";

const router = Router();

// GET /api/branches - Get branches for current user
router.get("/", authenticate, getBranches);

// GET /api/branches/all - Get all branches (admin only)
router.get("/all", authenticate, getAllBranches);
    
export default router;
