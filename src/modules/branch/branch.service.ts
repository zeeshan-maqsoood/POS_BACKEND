import prisma from "../../loaders/prisma";

export interface CreateBranchData {
  name: string;
  restaurantName: string;
  city?: string;
  state?: string;
  postalCode?: string;
}

export interface UpdateBranchData {
  name?: string;
  restaurantName?: string;
  city?: string;
  state?: string;
  postalCode?: string;
  isActive?: boolean;
}

export const branchService = {
  async createBranch(data: CreateBranchData) {
    return await prisma.branch.create({
      data: {
        ...data,
        isActive: true
      }
    });
  },

  async getAllBranches() {
    return await prisma.branch.findMany({
      include: {
        _count: {
          select: {
            users: true,
            orders: true,
            menuItems: true
          }
        }
      },
      orderBy: { name: 'asc' }
    });
  },

  async getActiveBranches() {
    return await prisma.branch.findMany({
      where: { isActive: true },
      include: {
        _count: {
          select: {
            users: true,
            orders: true,
            menuItems: true
          }
        }
      },
      orderBy: { name: 'asc' }
    });
  },

  async getBranchById(id: string) {
    return await prisma.branch.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            users: true,
            orders: true,
            menuItems: true,
            shifts: true,
            inventoryItems: true
          }
        }
      }
    });
  },

  async getBranchByName(name: string) {
    return await prisma.branch.findUnique({
      where: { name },
      include: {
        _count: {
          select: {
            users: true,
            orders: true,
            menuItems: true
          }
        }
      }
    });
  },

  async updateBranch(id: string, data: UpdateBranchData) {
    return await prisma.branch.update({
      where: { id },
      data,
      include: {
        _count: {
          select: {
            users: true,
            orders: true,
            menuItems: true
          }
        }
      }
    });
  },

  async deleteBranch(id: string) {
    // Soft delete - set isActive to false
    return await prisma.branch.update({
      where: { id },
      data: { isActive: false }
    });
  },

  async getUserBranches(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { branchId: true, role: true, branch: true }
    });

    if (!user) {
      throw new Error('User not found');
    }

    // If user is admin, return all active branches
    if (user.role === 'ADMIN') {
      const branches = await this.getActiveBranches();
      return branches.map(branch => ({
        id: branch.id,
        name: branch.name,
        value: branch.name,
        restaurantName: branch.restaurantName
      }));
    }

    // For other roles, return their assigned branch if they have one
    if (user.branch) {
      return [{
        id: user.branch.id,
        name: user.branch.name,
        value: user.branch.name,
        restaurantName: user.branch.restaurantName
      }];
    }

    return [];
  },

  async getBranchesForDropdown() {
    const branches = await this.getActiveBranches();
    return branches.map(branch => ({
      id: branch.id,
      name: branch.name,
      value: branch.name,
      restaurantName: branch.restaurantName
    }));
  },

  async getBranchStats(branchId: string) {
    const branch = await prisma.branch.findUnique({
      where: { id: branchId },
      include: {
        _count: {
          select: {
            users: true,
            orders: true,
            menuItems: true,
            shifts: true,
            inventoryItems: true
          }
        },
        orders: {
          where: {
            createdAt: {
              gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) // Last 30 days
            }
          },
          select: {
            total: true,
            status: true
          }
        }
      }
    });

    if (!branch) {
      throw new Error('Branch not found');
    }

    // Calculate revenue for last 30 days
    const revenue = branch.orders
      .filter(order => order.status === 'COMPLETED')
      .reduce((sum, order) => sum + order.total, 0);

    return {
      id: branch.id,
      name: branch.name,
      restaurantName: branch.restaurantName,
      isActive: branch.isActive,
      stats: {
        totalUsers: branch._count.users,
        totalOrders: branch._count.orders,
        totalMenuItems: branch._count.menuItems,
        totalShifts: branch._count.shifts,
        totalInventoryItems: branch._count.inventoryItems,
        revenueLast30Days: revenue,
        orderCountLast30Days: branch.orders.length
      }
    };
  }
};
