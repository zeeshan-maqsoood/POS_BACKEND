import prisma from "../../loaders/prisma";

export interface CreateShiftData {
  userId: string;
  branchId?: string;
  startTime: Date;
  endTime?: Date;
}

export interface UpdateShiftData {
  userId?: string;
  branchId?: string;
  startTime?: Date;
  endTime?: Date;
  status?: 'ACTIVE' | 'ENDED';
}

export const shiftService = {
  async createShift(data: CreateShiftData) {
    const startTime = new Date(data.startTime);
    const endTime = data.endTime ? new Date(data.endTime) : null;

    // Calculate total hours if end time is provided
    let totalHours = null;
    if (endTime && startTime) {
      totalHours = Math.abs(endTime.getTime() - startTime.getTime()) / (1000 * 60 * 60);
    }

    return await prisma.shift.create({
      data: {
        ...data,
        startTime,
        endTime,
        totalHours,
        status: 'ACTIVE'
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        branch: {
          select: {
            id: true,
            name: true
          }
        }
      }
    });
  },

  async getAllShifts(filters?: {
    branchId?: string;
    userId?: string;
    status?: 'ACTIVE' | 'ENDED';
    startDate?: Date;
    endDate?: Date;
  }) {
    const where: any = {};

    if (filters?.branchId) {
      where.branchId = filters.branchId;
    }

    if (filters?.userId) {
      where.userId = filters.userId;
    }

    if (filters?.status) {
      where.status = filters.status;
    }

    if (filters?.startDate || filters?.endDate) {
      where.createdAt = {};
      if (filters.startDate) {
        where.createdAt.gte = filters.startDate;
      }
      if (filters.endDate) {
        where.createdAt.lte = filters.endDate;
      }
    }

    return await prisma.shift.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true
          }
        },
        branch: {
          select: {
            id: true,
            name: true
          }
        }
      },
      orderBy: { startTime: 'desc' }
    });
  },

  async getShiftById(id: string) {
    return await prisma.shift.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true
          }
        },
        branch: {
          select: {
            id: true,
            name: true
          }
        }
      }
    });
  },

  async getUserShifts(userId: string, filters?: {
    status?: 'ACTIVE' | 'ENDED';
    startDate?: Date;
    endDate?: Date;
  }) {
    const where: any = { userId };

    if (filters?.status) {
      where.status = filters.status;
    }

    if (filters?.startDate || filters?.endDate) {
      where.startTime = {};
      if (filters.startDate) {
        where.startTime.gte = filters.startDate;
      }
      if (filters.endDate) {
        where.startTime.lte = filters.endDate;
      }
    }

    return await prisma.shift.findMany({
      where,
      include: {
        branch: {
          select: {
            id: true,
            name: true
          }
        }
      },
      orderBy: { startTime: 'desc' }
    });
  },

  async getActiveShifts(branchId?: string) {
    const where: any = { status: 'ACTIVE' };

    if (branchId) {
      where.branchId = branchId;
    }

    return await prisma.shift.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true
          }
        },
        branch: {
          select: {
            id: true,
            name: true
          }
        }
      },
      orderBy: { startTime: 'asc' }
    });
  },

  async updateShift(id: string, data: UpdateShiftData) {
    const updateData: any = { ...data };

    // Recalculate total hours if start or end time is updated
    if (data.startTime || data.endTime) {
      const shift = await prisma.shift.findUnique({ where: { id } });
      if (shift) {
        const startTime = data.startTime || shift.startTime;
        const endTime = data.endTime || shift.endTime;

        if (startTime && endTime) {
          updateData.totalHours = Math.abs(endTime.getTime() - startTime.getTime()) / (1000 * 60 * 60);
        } else if (startTime && !endTime) {
          // If only start time is provided and shift is active, don't calculate hours yet
          updateData.totalHours = null;
        }
      }
    }

    return await prisma.shift.update({
      where: { id },
      data: updateData,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true
          }
        },
        branch: {
          select: {
            id: true,
            name: true
          }
        }
      }
    });
  },

  async endShift(id: string, endTime?: Date) {
    const end = endTime || new Date();

    return await this.updateShift(id, {
      endTime: end,
      status: 'ENDED'
    });
  },

  async deleteShift(id: string) {
    return await prisma.shift.delete({
      where: { id }
    });
  },

  async getShiftStats(filters?: {
    branchId?: string;
    userId?: string;
    startDate?: Date;
    endDate?: Date;
  }) {
    const shifts = await this.getAllShifts(filters);

    const totalShifts = shifts.length;
    const activeShifts = shifts.filter(s => s.status === 'ACTIVE').length;
    const endedShifts = shifts.filter(s => s.status === 'ENDED').length;

    const totalHours = shifts
      .filter(s => s.totalHours)
      .reduce((sum, s) => sum + (s.totalHours || 0), 0);

    const averageHours = totalShifts > 0 ? totalHours / endedShifts : 0;

    return {
      totalShifts,
      activeShifts,
      endedShifts,
      totalHours,
      averageHours: Math.round(averageHours * 100) / 100
    };
  },

  async getUsersForShiftAssignment(branchId?: string) {
    const where: any = {
      status: 'ACTIVE',
      role: {
        in: ['MANAGER', 'CASHIER', 'WAITER', 'KITCHEN_STAFF']
      }
    };

    if (branchId) {
      where.branchId = branchId;
    }

    const users = await prisma.user.findMany({
      where,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        branch: {
          select: {
            id: true,
            name: true
          }
        }
      },
      orderBy: { name: 'asc' }
    });

    return users.map(user => ({
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      branch: user.branch
    }));
  },

  async getBranchesForShift() {
    return await prisma.branch.findMany({
      where: { isActive: true },
      select: {
        id: true,
        name: true
      },
      orderBy: { name: 'asc' }
    });
  }
};
