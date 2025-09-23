import { Request, Response } from "express";
import { branchService } from "./branch.service";
import { ApiResponse } from "../../utils/apiResponse";
import { JwtPayload } from "../../types/auth.types";

export const getBranches = async (req: Request, res: Response) => {
  try {
    const currentUser = req.user as unknown as JwtPayload;
    const branches = await branchService.getUserBranches(currentUser.userId);

    ApiResponse.send(res, ApiResponse.success(branches, "Branches retrieved successfully"));
  } catch (error: any) {
    console.error('Error getting branches:', error);
    ApiResponse.send(res, ApiResponse.error(error.message || 'Failed to retrieve branches', 500));
  }
};

export const getAllBranches = async (req: Request, res: Response) => {
  try {
    const branches = await branchService.getAllBranches();

    ApiResponse.send(res, ApiResponse.success(branches, "All branches retrieved successfully"));
  } catch (error: any) {
    console.error('Error getting all branches:', error);
    ApiResponse.send(res, ApiResponse.error(error.message || 'Failed to retrieve branches', 500));
  }
};
