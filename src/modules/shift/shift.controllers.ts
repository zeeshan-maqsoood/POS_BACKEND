import { Request, Response } from "express";
import { shiftService, CreateShiftData, UpdateShiftData } from "./shift.service";
import { ApiResponse } from "../../utils/apiResponse";
import { JwtPayload } from "../../types/auth.types";

export const getAllShifts = async (req: Request, res: Response) => {
  try {
    const currentUser = req.user as unknown as JwtPayload;
    const {
      branchId,
      userId,
      status,
      startDate,
      endDate,
      page = '1',
      limit = '20'
    } = req.query;

    // Build filters
    const filters: any = {};

    if (branchId) filters.branchId = branchId as string;
    if (userId) filters.userId = userId as string;
    if (status) filters.status = status as 'ACTIVE' | 'ENDED';

    if (startDate || endDate) {
      filters.startDate = startDate ? new Date(startDate as string) : undefined;
      filters.endDate = endDate ? new Date(endDate as string) : undefined;
    }

    // Pagination
    const pageNum = parseInt(page as string, 10);
    const limitNum = parseInt(limit as string, 10);
    const skip = (pageNum - 1) * limitNum;

    const shifts = await shiftService.getAllShifts(filters);

    // Apply pagination manually since Prisma doesn't support offset/limit on complex queries
    const paginatedShifts = shifts.slice(skip, skip + limitNum);

    ApiResponse.send(res, ApiResponse.success({
      shifts: paginatedShifts,
      pagination: {
        currentPage: pageNum,
        totalPages: Math.ceil(shifts.length / limitNum),
        totalShifts: shifts.length,
        hasNext: skip + limitNum < shifts.length,
        hasPrev: pageNum > 1
      }
    }, "Shifts retrieved successfully"));
  } catch (error: any) {
    console.error('Error getting shifts:', error);
    ApiResponse.send(res, ApiResponse.error(error.message || 'Failed to retrieve shifts', 500));
  }
};

export const getShiftById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const shift = await shiftService.getShiftById(id);

    if (!shift) {
      return ApiResponse.send(res, ApiResponse.error("Shift not found", 404));
    }

    ApiResponse.send(res, ApiResponse.success(shift, "Shift retrieved successfully"));
  } catch (error: any) {
    console.error('Error getting shift:', error);
    ApiResponse.send(res, ApiResponse.error(error.message || 'Failed to retrieve shift', 500));
  }
};

export const getUserShifts = async (req: Request, res: Response) => {
  try {
    const currentUser = req.user as unknown as JwtPayload;
    const { userId } = req.params;
    const { status, startDate, endDate } = req.query;

    // Users can only view their own shifts unless they're admin/manager
    if (currentUser.role !== 'ADMIN' && currentUser.role !== 'MANAGER' && currentUser.userId !== userId) {
      return ApiResponse.send(res, ApiResponse.error("Unauthorized: Can only view own shifts", 403));
    }

    const filters: any = {};
    if (status) filters.status = status as 'ACTIVE' | 'ENDED';
    if (startDate || endDate) {
      filters.startDate = startDate ? new Date(startDate as string) : undefined;
      filters.endDate = endDate ? new Date(endDate as string) : undefined;
    }

    const shifts = await shiftService.getUserShifts(userId, filters);

    ApiResponse.send(res, ApiResponse.success(shifts, "User shifts retrieved successfully"));
  } catch (error: any) {
    console.error('Error getting user shifts:', error);
    ApiResponse.send(res, ApiResponse.error(error.message || 'Failed to retrieve user shifts', 500));
  }
};

export const getActiveShifts = async (req: Request, res: Response) => {
  try {
    const { branchId } = req.query;

    const shifts = await shiftService.getActiveShifts(branchId as string);

    ApiResponse.send(res, ApiResponse.success(shifts, "Active shifts retrieved successfully"));
  } catch (error: any) {
    console.error('Error getting active shifts:', error);
    ApiResponse.send(res, ApiResponse.error(error.message || 'Failed to retrieve active shifts', 500));
  }
};

export const getShiftStats = async (req: Request, res: Response) => {
  try {
    const { branchId, userId, startDate, endDate } = req.query;

    const filters: any = {};
    if (branchId) filters.branchId = branchId as string;
    if (userId) filters.userId = userId as string;
    if (startDate || endDate) {
      filters.startDate = startDate ? new Date(startDate as string) : undefined;
      filters.endDate = endDate ? new Date(endDate as string) : undefined;
    }

    const stats = await shiftService.getShiftStats(filters);

    ApiResponse.send(res, ApiResponse.success(stats, "Shift stats retrieved successfully"));
  } catch (error: any) {
    console.error('Error getting shift stats:', error);
    ApiResponse.send(res, ApiResponse.error(error.message || 'Failed to retrieve shift stats', 500));
  }
};

export const createShift = async (req: Request, res: Response) => {
  try {
    const currentUser = req.user as unknown as JwtPayload;
    const shiftData: CreateShiftData = req.body;

    // Check permissions - Admin and Manager can create shifts for others, users can create their own
    if (shiftData.userId !== currentUser.userId && currentUser.role !== 'ADMIN' && currentUser.role !== 'MANAGER') {
      return ApiResponse.send(res, ApiResponse.error("Unauthorized: Can only create shifts for yourself", 403));
    }

    // If creating for another user, verify they exist and are in the same branch (if specified)
    if (shiftData.userId !== currentUser.userId) {
      const targetUser = await shiftService.getUsersForShiftAssignment(shiftData.branchId).then(users =>
        users.find(u => u.id === shiftData.userId)
      );

      if (!targetUser) {
        return ApiResponse.send(res, ApiResponse.error("Target user not found or not eligible for shifts", 404));
      }
    }

    // Validate shift times
    if (shiftData.startTime >= (shiftData.endTime || new Date(Date.now() + 24 * 60 * 60 * 1000))) {
      return ApiResponse.send(res, ApiResponse.error("End time must be after start time", 400));
    }

    const newShift = await shiftService.createShift(shiftData);

    ApiResponse.send(res, ApiResponse.success(newShift, "Shift created successfully", 201));
  } catch (error: any) {
    console.error('Error creating shift:', error);
    ApiResponse.send(res, ApiResponse.error(error.message || 'Failed to create shift', 500));
  }
};

export const updateShift = async (req: Request, res: Response) => {
  try {
    const currentUser = req.user as unknown as JwtPayload;
    const { id } = req.params;
    const updateData: UpdateShiftData = req.body;

    // Check if shift exists
    const existingShift = await shiftService.getShiftById(id);
    if (!existingShift) {
      return ApiResponse.send(res, ApiResponse.error("Shift not found", 404));
    }

    // Check permissions - Admin/Manager can update any shift, users can only update their own active shifts
    if (existingShift.userId !== currentUser.userId && currentUser.role !== 'ADMIN' && currentUser.role !== 'MANAGER') {
      return ApiResponse.send(res, ApiResponse.error("Unauthorized: Can only update your own shifts", 403));
    }

    // If updating user, check permissions
    if (updateData.userId && updateData.userId !== existingShift.userId) {
      if (currentUser.role !== 'ADMIN' && currentUser.role !== 'MANAGER') {
        return ApiResponse.send(res, ApiResponse.error("Unauthorized: Cannot reassign shifts", 403));
      }

      const targetUser = await shiftService.getUsersForShiftAssignment(updateData.branchId).then(users =>
        users.find(u => u.id === updateData.userId)
      );

      if (!targetUser) {
        return ApiResponse.send(res, ApiResponse.error("Target user not found or not eligible for shifts", 404));
      }
    }

    // Validate shift times if updating times
    if (updateData.startTime && updateData.endTime && updateData.startTime >= updateData.endTime) {
      return ApiResponse.send(res, ApiResponse.error("End time must be after start time", 400));
    }

    const updatedShift = await shiftService.updateShift(id, updateData);

    ApiResponse.send(res, ApiResponse.success(updatedShift, "Shift updated successfully"));
  } catch (error: any) {
    console.error('Error updating shift:', error);
    ApiResponse.send(res, ApiResponse.error(error.message || 'Failed to update shift', 500));
  }
};

export const endShift = async (req: Request, res: Response) => {
  try {
    const currentUser = req.user as unknown as JwtPayload;
    const { id } = req.params;
    const { endTime } = req.body;

    // Check if shift exists
    const existingShift = await shiftService.getShiftById(id);
    if (!existingShift) {
      return ApiResponse.send(res, ApiResponse.error("Shift not found", 404));
    }

    // Check permissions - Admin/Manager can end any shift, users can only end their own shifts
    if (existingShift.userId !== currentUser.userId && currentUser.role !== 'ADMIN' && currentUser.role !== 'MANAGER') {
      return ApiResponse.send(res, ApiResponse.error("Unauthorized: Can only end your own shifts", 403));
    }

    // Check if shift is already ended
    if (existingShift.status === 'ENDED') {
      return ApiResponse.send(res, ApiResponse.error("Shift is already ended", 400));
    }

    const end = endTime ? new Date(endTime) : new Date();
    const updatedShift = await shiftService.endShift(id, end);

    ApiResponse.send(res, ApiResponse.success(updatedShift, "Shift ended successfully"));
  } catch (error: any) {
    console.error('Error ending shift:', error);
    ApiResponse.send(res, ApiResponse.error(error.message || 'Failed to end shift', 500));
  }
};

export const deleteShift = async (req: Request, res: Response) => {
  try {
    const currentUser = req.user as unknown as JwtPayload;
    const { id } = req.params;

    // Check if shift exists
    const existingShift = await shiftService.getShiftById(id);
    if (!existingShift) {
      return ApiResponse.send(res, ApiResponse.error("Shift not found", 404));
    }

    // Check permissions - Admin/Manager can delete any shift, users can only delete their own non-active shifts
    if (existingShift.userId !== currentUser.userId && currentUser.role !== 'ADMIN' && currentUser.role !== 'MANAGER') {
      return ApiResponse.send(res, ApiResponse.error("Unauthorized: Can only delete your own shifts", 403));
    }

    // Don't allow deleting active shifts unless admin/manager
    if (existingShift.status === 'ACTIVE' && currentUser.role !== 'ADMIN' && currentUser.role !== 'MANAGER') {
      return ApiResponse.send(res, ApiResponse.error("Cannot delete active shifts", 400));
    }

    await shiftService.deleteShift(id);

    ApiResponse.send(res, ApiResponse.success(null, "Shift deleted successfully"));
  } catch (error: any) {
    console.error('Error deleting shift:', error);
    ApiResponse.send(res, ApiResponse.error(error.message || 'Failed to delete shift', 500));
  }
};

export const getUsersForShiftAssignment = async (req: Request, res: Response) => {
  try {
    const { branchId } = req.query;

    const users = await shiftService.getUsersForShiftAssignment(branchId as string);

    ApiResponse.send(res, ApiResponse.success(users, "Users for shift assignment retrieved successfully"));
  } catch (error: any) {
    console.error('Error getting users for shift assignment:', error);
    ApiResponse.send(res, ApiResponse.error(error.message || 'Failed to retrieve users for shift assignment', 500));
  }
};

export const getBranchesForShift = async (req: Request, res: Response) => {
  try {
    const branches = await shiftService.getBranchesForShift();

    ApiResponse.send(res, ApiResponse.success(branches, "Branches for shift retrieved successfully"));
  } catch (error: any) {
    console.error('Error getting branches for shift:', error);
    ApiResponse.send(res, ApiResponse.error(error.message || 'Failed to retrieve branches for shift', 500));
  }
};
