import { Request, Response } from "express";
import { shiftService } from "./shift.service";
import { ApiResponse, ApiError } from "../../utils/apiResponse";

export const shiftController = {
  async startShift(req: Request, res: Response) {
    try {
      const user = req.user as any;
      if (!user?.userId) throw ApiError.unauthorized("Not authenticated");

      // Optionally restrict by role (allow only certain roles to start shift)
      // const allowed = [ "MANAGER", "WAITER", "KITCHEN_STAFF", "CASHIER" ];
      // if (!allowed.includes(user.role)) throw ApiError.forbidden("Role not allowed to start shifts");

      const branchName = user.branch || req.body.branchName;
      const shift = await shiftService.startShift(user.userId, branchName);
      ApiResponse.send(res, ApiResponse.success(shift, "Shift started", 201));
    } catch (error: any) {
      const apiErr = error instanceof ApiError ? error : ApiError.internal(error?.message || "Failed to start shift");
      ApiResponse.send(res, new ApiResponse(false, apiErr.message, null, apiErr.statusCode));
    }
  },

  async endShift(req: Request, res: Response) {
    try {
      const user = req.user as any;
      if (!user?.userId) throw ApiError.unauthorized("Not authenticated");

      const shift = await shiftService.endShift(user.userId);
      ApiResponse.send(res, ApiResponse.success(shift, "Shift ended", 200));
    } catch (error: any) {
      const apiErr = error instanceof ApiError ? error : ApiError.internal(error?.message || "Failed to end shift");
      ApiResponse.send(res, new ApiResponse(false, apiErr.message, null, apiErr.statusCode));
    }
  },

  async getMyShifts(req: Request, res: Response) {
    try {
      const user = req.user as any;
      if (!user?.userId) throw ApiError.unauthorized("Not authenticated");

      const limit = parseInt(String(req.query.limit || "50"), 10);
      const skip = parseInt(String(req.query.skip || "0"), 10);
      const shifts = await shiftService.getUserShifts(user.userId, limit, skip);
      ApiResponse.send(res, ApiResponse.success(shifts, "My shifts fetched"));
    } catch (error: any) {
      const apiErr = error instanceof ApiError ? error : ApiError.internal(error?.message || "Failed to fetch shifts");
      ApiResponse.send(res, new ApiResponse(false, apiErr.message, null, apiErr.statusCode));
    }
  },

  async getBranchShifts(req: Request, res: Response) {
    try {
      const user = req.user as any;
      if (!user) throw ApiError.unauthorized("Not authenticated");

      // Only manager/admin can hit this (enforce via checkRole middleware ideally)
      const branchName = user.branch || String(req.query.branchName || "");
      const limit = parseInt(String(req.query.limit || "100"), 10);
      const skip = parseInt(String(req.query.skip || "0"), 10);

      const shifts = await shiftService.getBranchShifts(branchName || undefined, limit, skip);
      ApiResponse.send(res, ApiResponse.success(shifts, "Branch shifts fetched"));
    } catch (error: any) {
      const apiErr = error instanceof ApiError ? error : ApiError.internal(error?.message || "Failed to fetch branch shifts");
      ApiResponse.send(res, new ApiResponse(false, apiErr.message, null, apiErr.statusCode));
    }
  },

  async getActiveShifts(req: Request, res: Response) {
    try {
      const user = req.user as any;
      if (!user) throw ApiError.unauthorized("Not authenticated");
      const branchName = user.branch || String(req.query.branchName || "");
      const shifts = await shiftService.getActiveShifts(branchName || undefined);
      ApiResponse.send(res, ApiResponse.success(shifts, "Active shifts fetched"));
    } catch (error: any) {
      const apiErr = error instanceof ApiError ? error : ApiError.internal(error?.message || "Failed to fetch active shifts");
      ApiResponse.send(res, new ApiResponse(false, apiErr.message, null, apiErr.statusCode));
    }
  },

  async getReport(req: Request, res: Response) {
    try {
      const user = req.user as any;
      if (!user) throw ApiError.unauthorized("Not authenticated");

      const branchName = user.branch || String(req.query.branchName || "");
      const from = req.query.from ? new Date(String(req.query.from)) : undefined;
      const to = req.query.to ? new Date(String(req.query.to)) : undefined;

      const report = await shiftService.getShiftsReport(branchName || undefined, from, to);
      ApiResponse.send(res, ApiResponse.success(report, "Shift report fetched"));
    } catch (error: any) {
      const apiErr = error instanceof ApiError ? error : ApiError.internal(error?.message || "Failed to fetch shift report");
      ApiResponse.send(res, new ApiResponse(false, apiErr.message, null, apiErr.statusCode));
    }
  },

  async getShiftById(req: Request, res: Response) {
    try {
      const user = req.user as any;
      if (!user) throw ApiError.unauthorized("Not authenticated");

      const { id } = req.params;
      const shift = await shiftService.getShiftById(id);

      if (!shift) throw ApiError.notFound("Shift not found");

      ApiResponse.send(res, ApiResponse.success(shift, "Shift fetched"));
    } catch (error: any) {
      const apiErr = error instanceof ApiError ? error : ApiError.internal(error?.message || "Failed to fetch shift");
      ApiResponse.send(res, new ApiResponse(false, apiErr.message, null, apiErr.statusCode));
    }
  },

  async updateShift(req: Request, res: Response) {
    try {
      const user = req.user as any;
      if (!user) throw ApiError.unauthorized("Not authenticated");

      // Only admin can update shifts
      if (user.role !== 'ADMIN') throw ApiError.forbidden("Only admins can update shifts");

      const { id } = req.params;
      const updateData = req.body;

      const shift = await shiftService.updateShift(id, updateData);
      ApiResponse.send(res, ApiResponse.success(shift, "Shift updated", 200));
    } catch (error: any) {
      const apiErr = error instanceof ApiError ? error : ApiError.internal(error?.message || "Failed to update shift");
      ApiResponse.send(res, new ApiResponse(false, apiErr.message, null, apiErr.statusCode));
    }
  },

  async deleteShift(req: Request, res: Response) {
    try {
      const user = req.user as any;
      if (!user) throw ApiError.unauthorized("Not authenticated");

      // Only admin can delete shifts
      if (user.role !== 'ADMIN') throw ApiError.forbidden("Only admins can delete shifts");

      const { id } = req.params;
      await shiftService.deleteShift(id);

      ApiResponse.send(res, ApiResponse.success({ success: true }, "Shift deleted", 200));
    } catch (error: any) {
      const apiErr = error instanceof ApiError ? error : ApiError.internal(error?.message || "Failed to delete shift");
      ApiResponse.send(res, new ApiResponse(false, apiErr.message, null, apiErr.statusCode));
    }
  },

  async getUserShifts(req: Request, res: Response) {
    try {
      const user = req.user as any;
      if (!user) throw ApiError.unauthorized("Not authenticated");

      const { userId } = req.params;
      const limit = parseInt(String(req.query.limit || "50"), 10);
      const skip = parseInt(String(req.query.skip || "0"), 10);

      const shifts = await shiftService.getUserShifts(userId, limit, skip);
      ApiResponse.send(res, ApiResponse.success(shifts, "User shifts fetched"));
    } catch (error: any) {
      const apiErr = error instanceof ApiError ? error : ApiError.internal(error?.message || "Failed to fetch user shifts");
      ApiResponse.send(res, new ApiResponse(false, apiErr.message, null, apiErr.statusCode));
    }
  },

  async getActiveShiftStatus(req: Request, res: Response) {
    try {
      const user = req.user as any;
      if (!user?.userId) throw ApiError.unauthorized("Not authenticated");

      const result = await shiftService.getActiveShiftStatus(user.userId);
      ApiResponse.send(res, ApiResponse.success(result, "Active shift status fetched"));
    } catch (error: any) {
      const apiErr = error instanceof ApiError ? error : ApiError.internal(error?.message || "Failed to fetch active shift status");
      ApiResponse.send(res, new ApiResponse(false, apiErr.message, null, apiErr.statusCode));
    }
  },

  async getShiftStats(req: Request, res: Response) {
    try {
      const user = req.user as any;
      if (!user) throw ApiError.unauthorized("Not authenticated");

      // Only manager/admin can view stats
      if (!['MANAGER', 'ADMIN'].includes(user.role)) {
        throw ApiError.forbidden("Only managers and admins can view shift statistics");
      }

      const branchName = user.branch || String(req.query.branchName || "");
      const from = req.query.from ? new Date(String(req.query.from)) : undefined;
      const to = req.query.to ? new Date(String(req.query.to)) : undefined;

      const stats = await shiftService.getShiftStats(branchName || undefined, from, to);
      ApiResponse.send(res, ApiResponse.success(stats, "Shift statistics fetched"));
    } catch (error: any) {
      const apiErr = error instanceof ApiError ? error : ApiError.internal(error?.message || "Failed to fetch shift statistics");
      ApiResponse.send(res, new ApiResponse(false, apiErr.message, null, apiErr.statusCode));
    }
  },
};