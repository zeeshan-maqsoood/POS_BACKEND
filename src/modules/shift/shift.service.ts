import prisma from "../../loaders/prisma";
import { ApiError } from "../../utils/apiResponse";
import { UserRole } from "@prisma/client";

type JwtPayload = {
  userId: string;
  role: UserRole;
  branch?: string | null;
  // ...other fields you keep in JWT
};

export const shiftService = {
  // start shift for user - prevents multiple active shifts
  async startShift(userId: string, branchName?: string) {
    // Check for existing active shift
    const active = await prisma.shift.findFirst({
      where: { userId, status: "ACTIVE" },
    });
    if (active) {
      throw ApiError.badRequest("An active shift already exists for this user");
    }

    const shift = await prisma.shift.create({
      data: {
        userId,
        branchName: branchName || null,
        startTime: new Date(),
        status: "ACTIVE",
      },
    });

    return shift;
  },

  // end current active shift for user
  async endShift(userId: string) {
    const active = await prisma.shift.findFirst({
      where: { userId, status: "ACTIVE" },
      orderBy: { startTime: "desc" },
    });

    if (!active) {
      throw ApiError.notFound("No active shift found for this user");
    }

    const endTime = new Date();
    const totalHours = (endTime.getTime() - active.startTime.getTime()) / (1000 * 60 * 60);

    const updated = await prisma.shift.update({
      where: { id: active.id },
      data: {
        endTime,
        totalHours: parseFloat((Math.max(totalHours, 0)).toFixed(3)),
        status: "ENDED",
      },
    });

    return updated;
  },

  // get shifts for the current user (pagination optional)
  async getUserShifts(userId: string, limit = 50, skip = 0) {
    const shifts = await prisma.shift.findMany({
      where: { userId },
      orderBy: { startTime: "desc" },
      take: limit,
      skip,
    });
    return shifts;
  },

  // get shifts for a branch (manager / admin)
  async getBranchShifts(branchName?: string, limit = 100, skip = 0) {
    const whereClause = branchName ? { branchName } : {};
    const shifts = await prisma.shift.findMany({
      where: whereClause,
      include: { user: { select: { id: true, name: true, email: true, role: true } } },
      orderBy: { startTime: "desc" },
      take: limit,
      skip,
    });
    return shifts;
  },

  // get active shifts across branch (for managers to see who's on now)
  async getActiveShifts(branchName?: string) {
    const whereClause: any = { status: "ACTIVE" };
    if (branchName) whereClause.branchName = branchName;
    const shifts = await prisma.shift.findMany({
      where: whereClause,
      include: { user: { select: { id: true, name: true, role: true, branch: true } } },
      orderBy: { startTime: "asc" },
    });
    return shifts;
  },

  // small report: shifts on a given date range
  async getShiftsReport(branchName?: string, from?: Date, to?: Date) {
    const where: any = {};
    if (branchName) where.branchName = branchName;
    if (from && to) {
      where.startTime = { gte: from, lte: to };
    } else if (from) {
      where.startTime = { gte: from };
    } else if (to) {
      where.startTime = { lte: to };
    }

    const shifts = await prisma.shift.findMany({
      where,
      include: { user: { select: { id: true, name: true, role: true } } },
      orderBy: { startTime: "desc" },
    });

    // aggregate totals
    const totalHours = shifts.reduce((s, sh) => s + (sh.totalHours || 0), 0);

    return { shifts, totalHours };
  },

  // get a specific shift by ID
  async getShiftById(shiftId: string) {
    const shift = await prisma.shift.findUnique({
      where: { id: shiftId },
      include: { user: { select: { id: true, name: true, email: true, role: true } } },
    });

    if (!shift) {
      throw ApiError.notFound("Shift not found");
    }

    return shift;
  },

  // update shift details (admin only)
  async updateShift(shiftId: string, updateData: any) {
    // Check if shift exists
    const existingShift = await prisma.shift.findUnique({
      where: { id: shiftId },
    });

    if (!existingShift) {
      throw ApiError.notFound("Shift not found");
    }

    // Update the shift
    const updatedShift = await prisma.shift.update({
      where: { id: shiftId },
      data: updateData,
      include: { user: { select: { id: true, name: true, email: true, role: true } } },
    });

    return updatedShift;
  },

  // delete a shift (admin only)
  async deleteShift(shiftId: string) {
    // Check if shift exists
    const existingShift = await prisma.shift.findUnique({
      where: { id: shiftId },
    });

    if (!existingShift) {
      throw ApiError.notFound("Shift not found");
    }

    // Delete the shift
    await prisma.shift.delete({
      where: { id: shiftId },
    });

    return { success: true };
  },

  // get active shift status for a user
  async getActiveShiftStatus(userId: string) {
    const activeShift = await prisma.shift.findFirst({
      where: {
        userId,
        status: "ACTIVE"
      },
      orderBy: { startTime: "desc" },
    });

    return {
      hasActiveShift: !!activeShift,
      activeShift: activeShift || undefined,
    };
  },

  // get shift statistics for a date range
  async getShiftStats(branchName?: string, from?: Date, to?: Date) {
    const where: any = {};
    if (branchName) where.branchName = branchName;
    if (from && to) {
      where.startTime = { gte: from, lte: to };
    } else if (from) {
      where.startTime = { gte: from };
    } else if (to) {
      where.startTime = { lte: to };
    }
    

    const shifts = await prisma.shift.findMany({
      where,
    });

    const totalShifts = shifts.length;
    const totalHours = shifts.reduce((sum, shift) => sum + (shift.totalHours || 0), 0);
    const averageHoursPerShift = totalShifts > 0 ? totalHours / totalShifts : 0;
    const activeShifts = shifts.filter(shift => shift.status === "ACTIVE").length;

    return {
      totalShifts,
      totalHours,
      averageHoursPerShift: parseFloat(averageHoursPerShift.toFixed(2)),
      activeShifts,
    };
  },
};