"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAllBranches = exports.getBranches = void 0;
const branch_service_1 = require("./branch.service");
const apiResponse_1 = require("../../utils/apiResponse");
const getBranches = async (req, res) => {
    try {
        const currentUser = req.user;
        const branches = await branch_service_1.branchService.getUserBranches(currentUser.userId);
        apiResponse_1.ApiResponse.send(res, apiResponse_1.ApiResponse.success(branches, "Branches retrieved successfully"));
    }
    catch (error) {
        console.error('Error getting branches:', error);
        apiResponse_1.ApiResponse.send(res, apiResponse_1.ApiResponse.error(error.message || 'Failed to retrieve branches', 500));
    }
};
exports.getBranches = getBranches;
const getAllBranches = async (req, res) => {
    try {
        const branches = await branch_service_1.branchService.getAllBranches();
        apiResponse_1.ApiResponse.send(res, apiResponse_1.ApiResponse.success(branches, "All branches retrieved successfully"));
    }
    catch (error) {
        console.error('Error getting all branches:', error);
        apiResponse_1.ApiResponse.send(res, apiResponse_1.ApiResponse.error(error.message || 'Failed to retrieve branches', 500));
    }
};
exports.getAllBranches = getAllBranches;
//# sourceMappingURL=branch.controllers.js.map