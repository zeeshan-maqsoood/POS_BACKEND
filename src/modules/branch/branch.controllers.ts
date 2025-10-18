import { Request, Response } from "express";
import { branchService, CreateBranchData, UpdateBranchData } from "./branch.service";
import { ApiResponse } from "../../utils/apiResponse";
import { JwtPayload } from "../../types/auth.types";

export const getAllBranches = async (req: Request, res: Response) => {
  try {
    const branches = await branchService.getAllBranches();
    ApiResponse.send(res, ApiResponse.success(branches, "Branches retrieved successfully"));
  } catch (error: any) {
    console.error('Error getting branches:', error);
    ApiResponse.send(res, ApiResponse.error(error.message || 'Failed to retrieve branches', 500));
  }
};

export const getActiveBranches = async (req: Request, res: Response) => {
  try {
    const branches = await branchService.getActiveBranches();
    ApiResponse.send(res, ApiResponse.success(branches, "Active branches retrieved successfully"));
  } catch (error: any) {
    console.error('Error getting active branches:', error);
    ApiResponse.send(res, ApiResponse.error(error.message || 'Failed to retrieve active branches', 500));
  }
};

export const getUserBranches = async (req: Request, res: Response) => {
  try {
    const currentUser = req.user as unknown as JwtPayload;
    const branches = await branchService.getUserBranches(currentUser.userId);

    ApiResponse.send(res, ApiResponse.success(branches, "User branches retrieved successfully"));
  } catch (error: any) {
    console.error('Error getting user branches:', error);
    ApiResponse.send(res, ApiResponse.error(error.message || 'Failed to retrieve user branches', 500));
  }
};

export const getBranchesForDropdown = async (req: Request, res: Response) => {
  try {
    const branches = await branchService.getBranchesForDropdown();
    ApiResponse.send(res, ApiResponse.success(branches, "Branches for dropdown retrieved successfully"));
  } catch (error: any) {
    console.error('Error getting branches for dropdown:', error);
    ApiResponse.send(res, ApiResponse.error(error.message || 'Failed to retrieve branches for dropdown', 500));
  }
};

export const getBranchById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const branch = await branchService.getBranchById(id);

    if (!branch) {
      return ApiResponse.send(res, ApiResponse.error("Branch not found", 404));
    }

    ApiResponse.send(res, ApiResponse.success(branch, "Branch retrieved successfully"));
  } catch (error: any) {
    console.error('Error getting branch:', error);
    ApiResponse.send(res, ApiResponse.error(error.message || 'Failed to retrieve branch', 500));
  }
};

export const getBranchStats = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const branchStats = await branchService.getBranchStats(id);

    ApiResponse.send(res, ApiResponse.success(branchStats, "Branch stats retrieved successfully"));
  } catch (error: any) {
    console.error('Error getting branch stats:', error);
    ApiResponse.send(res, ApiResponse.error(error.message || 'Failed to retrieve branch stats', 500));
  }
};

export const createBranch = async (req: Request, res: Response) => {
  try {
    const currentUser = req.user as unknown as JwtPayload;
    const branchData: CreateBranchData = req.body;

    // Check if user is admin (only admins can create branches)
    if (currentUser.role !== 'ADMIN') {
      return ApiResponse.send(res, ApiResponse.error("Unauthorized: Only admins can create branches", 403));
    }

    // Check if branch name already exists
    const existingBranch = await branchService.getBranchByName(branchData.name);
    if (existingBranch) {
      return ApiResponse.send(res, ApiResponse.error("Branch name already exists", 400));
    }

    const newBranch = await branchService.createBranch(branchData);

    ApiResponse.send(res, ApiResponse.success(newBranch, "Branch created successfully", 201));
  } catch (error: any) {
    console.error('Error creating branch:', error);
    ApiResponse.send(res, ApiResponse.error(error.message || 'Failed to create branch', 500));
  }
};

export const updateBranch = async (req: Request, res: Response) => {
  try {
    const currentUser = req.user as unknown as JwtPayload;
    const { id } = req.params;
    const updateData: UpdateBranchData = req.body;

    // Check if user is admin (only admins can update branches)
    if (currentUser.role !== 'ADMIN') {
      return ApiResponse.send(res, ApiResponse.error("Unauthorized: Only admins can update branches", 403));
    }

    // Check if branch exists
    const existingBranch = await branchService.getBranchById(id);
    if (!existingBranch) {
      return ApiResponse.send(res, ApiResponse.error("Branch not found", 404));
    }

    // If updating name, check if new name already exists
    if (updateData.name && updateData.name !== existingBranch.name) {
      const nameExists = await branchService.getBranchByName(updateData.name);
      if (nameExists) {
        return ApiResponse.send(res, ApiResponse.error("Branch name already exists", 400));
      }
    }

    const updatedBranch = await branchService.updateBranch(id, updateData);

    ApiResponse.send(res, ApiResponse.success(updatedBranch, "Branch updated successfully"));
  } catch (error: any) {
    console.error('Error updating branch:', error);
    ApiResponse.send(res, ApiResponse.error(error.message || 'Failed to update branch', 500));
  }
};

export const deleteBranch = async (req: Request, res: Response) => {
  try {
    const currentUser = req.user as unknown as JwtPayload;
    const { id } = req.params;

    // Check if user is admin (only admins can delete branches)
    if (currentUser.role !== 'ADMIN') {
      return ApiResponse.send(res, ApiResponse.error("Unauthorized: Only admins can delete branches", 403));
    }

    // Check if branch exists
    const existingBranch = await branchService.getBranchById(id);
    if (!existingBranch) {
      return ApiResponse.send(res, ApiResponse.error("Branch not found", 404));
    }

    await branchService.deleteBranch(id);

    ApiResponse.send(res, ApiResponse.success(null, "Branch deactivated successfully"));
  } catch (error: any) {
    console.error('Error deleting branch:', error);
    ApiResponse.send(res, ApiResponse.error(error.message || 'Failed to delete branch', 500));
  }
};
