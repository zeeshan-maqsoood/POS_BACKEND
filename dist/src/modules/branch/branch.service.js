"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.branchService = void 0;
const prisma_1 = __importDefault(require("../../loaders/prisma"));
exports.branchService = {
    async getAllBranches() {
        // Get all unique branches from users table
        const users = await prisma_1.default.user.findMany({
            select: { branch: true },
            where: { branch: { not: null } }
        });
        // Extract unique branches
        const branches = [...new Set(users.map(user => user.branch).filter(Boolean))];
        return branches.map(branch => ({
            name: branch,
            value: branch
        }));
    },
    async getUserBranches(userId) {
        const user = await prisma_1.default.user.findUnique({
            where: { id: userId },
            select: { branch: true, role: true }
        });
        if (!user) {
            throw new Error('User not found');
        }
        // If user is admin, return all branches
        if (user.role === 'ADMIN') {
            return this.getAllBranches();
        }
        // For other roles, return only their branch if they have one
        if (user.branch) {
            return [{
                    name: user.branch,
                    value: user.branch
                }];
        }
        return [];
    }
};
//# sourceMappingURL=branch.service.js.map