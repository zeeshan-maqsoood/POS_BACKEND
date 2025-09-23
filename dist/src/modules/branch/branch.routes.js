"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const branch_controllers_1 = require("./branch.controllers");
const authenticate_1 = require("../../middleware/authenticate");
const router = (0, express_1.Router)();
// GET /api/branches - Get branches for current user
router.get("/", authenticate_1.authenticate, branch_controllers_1.getBranches);
// GET /api/branches/all - Get all branches (admin only)
router.get("/all", authenticate_1.authenticate, branch_controllers_1.getAllBranches);
exports.default = router;
//# sourceMappingURL=branch.routes.js.map