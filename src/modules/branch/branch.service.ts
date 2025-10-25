import prisma from "../../loaders/prisma";

export interface CreateBranchData {
  name: string;
  restaurantId: string;
  description?: string;
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  postalCode?: string;
  phone?: string;
  email?: string;
  manager?: string;
  operatingHours?: any;
  serviceType?: 'DINE_IN' | 'TAKE_AWAY' | 'BOTH';
}

export interface UpdateBranchData {
  name?: string;
  restaurantId?: string;
  description?: string;
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  postalCode?: string;
  phone?: string;
  email?: string;
  manager?: string;
  operatingHours?: any;
  isActive?: boolean;
  serviceType?: 'DINE_IN' | 'TAKE_AWAY' | 'BOTH';
}

export const branchService = {
  async createBranch(data: CreateBranchData) {
    // Verify restaurant exists
    const restaurant = await prisma.restaurant.findUnique({
      where: { id: data.restaurantId }
    });

    if (!restaurant) {
      throw new Error('Restaurant not found');
    }

    return await prisma.branch.create({
      data: {
        ...data,
        isActive: true
      },
      select: {
        id: true,
        name: true,
        serviceType: true,
        restaurantId: true,
        description: true,
        address: true,
        city: true,
        state: true,
        country: true,
        postalCode: true,
        phone: true,
        email: true,
        manager: true,
        isActive: true,
        operatingHours: true,
        createdAt: true,
        updatedAt: true,
        restaurant: {
          select: {
            id: true,
            name: true
          }
        },
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
    }).then(branch => ({
      ...branch,
      restaurantName: branch.restaurant?.name || null
    }));
  },

  async getAllBranches() {
    const branches = await prisma.branch.findMany({
      select: {
        id: true,
        name: true,
        serviceType: true,
        restaurantId: true,
        description: true,
        address: true,
        city: true,
        state: true,
        country: true,
        postalCode: true,
        phone: true,
        email: true,
        manager: true,
        isActive: true,
        operatingHours: true,
        createdAt: true,
        updatedAt: true,
        restaurant: {
          select: {
            id: true,
            name: true
          }
        },
        _count: {
          select: {
            users: true,
            orders: true,
            menuItems: true,
            shifts: true,
            inventoryItems: true
          }
        }
      },
      orderBy: { name: 'asc' }
    });

    return branches.map(branch => ({
      ...branch,
      restaurantName: branch.restaurant?.name || null
    }));
  },

  async getActiveBranches() {
    const branches = await prisma.branch.findMany({
      where: { isActive: true },
      select: {
        id: true,
        name: true,
        serviceType: true,
        restaurantId: true,
        description: true,
        address: true,
        city: true,
        state: true,
        country: true,
        postalCode: true,
        phone: true,
        email: true,
        manager: true,
        isActive: true,
        operatingHours: true,
        createdAt: true,
        updatedAt: true,
        restaurant: {
          select: {
            id: true,
            name: true
          }
        },
        _count: {
          select: {
            users: true,
            orders: true,
            menuItems: true,
            shifts: true,
            inventoryItems: true
          }
        }
      },
      orderBy: { name: 'asc' }
    });

    return branches.map(branch => ({
      ...branch,
      restaurantName: branch.restaurant?.name || null
    }));
  },

  async getBranchById(id: string) {
    const branch = await prisma.branch.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        serviceType: true,
        restaurantId: true,
        description: true,
        address: true,
        city: true,
        state: true,
        country: true,
        postalCode: true,
        phone: true,
        email: true,
        manager: true,
        isActive: true,
        operatingHours: true,
        createdAt: true,
        updatedAt: true,
        restaurant: {
          select: {
            id: true,
            name: true
          }
        },
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

    if (!branch) return null;

    return {
      ...branch,
      restaurantName: branch.restaurant?.name || null
    };
  },

  async getBranchByName(name: string) {
    return await prisma.branch.findUnique({
      where: { name },
      select: {
        id: true,
        name: true,
        serviceType: true,
        restaurantId: true,
        description: true,
        address: true,
        city: true,
        state: true,
        country: true,
        postalCode: true,
        phone: true,
        email: true,
        manager: true,
        isActive: true,
        operatingHours: true,
        createdAt: true,
        updatedAt: true,
        restaurant: {
          select: {
            id: true,
            name: true
          }
        },
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

  async updateBranch(id: string, data: UpdateBranchData) {
    const branch = await prisma.branch.update({
      where: { id },
      data,
      select: {
        id: true,
        name: true,
        serviceType: true,
        restaurantId: true,
        description: true,
        address: true,
        city: true,
        state: true,
        country: true,
        postalCode: true,
        phone: true,
        email: true,
        manager: true,
        isActive: true,
        operatingHours: true,
        createdAt: true,
        updatedAt: true,
        restaurant: {
          select: {
            id: true,
            name: true
          }
        },
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

    return {
      ...branch,
      restaurantName: branch.restaurant?.name || null
    };
  },

  async deleteBranch(id: string) {
    // Soft delete - set isActive to false
    const branch = await prisma.branch.update({
      where: { id },
      data: { isActive: false },
      select: {
        id: true,
        name: true,
        serviceType: true,
        restaurantId: true,
        description: true,
        address: true,
        city: true,
        state: true,
        country: true,
        postalCode: true,
        phone: true,
        email: true,
        manager: true,
        isActive: true,
        operatingHours: true,
        createdAt: true,
        updatedAt: true,
        restaurant: {
          select: {
            id: true,
            name: true
          }
        },
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

    return {
      ...branch,
      restaurantName: branch.restaurant?.name || null
    };
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
        restaurantName: branch.restaurant?.name || 'No Restaurant'
      }));
    }

    // For other roles, return their assigned branch if they have one
    if (user.branch) {
      return [user.branch];
    }

    return [];
  },

  async getBranchesForDropdown() {
    const branches = await this.getActiveBranches();
    return branches.map(branch => ({
      id: branch.id,
      name: branch.name,
      value: branch.name,
      restaurantName: branch.restaurant?.name || 'No Restaurant'
    }));
  },

  async getBranchesByRestaurant(restaurantId: string) {
    const branches = await prisma.branch.findMany({
      where: {
        restaurantId: restaurantId,
        isActive: true
      },
      select: {
        id: true,
        name: true,
        serviceType: true,
        restaurantId: true,
        description: true,
        address: true,
        city: true,
        state: true,
        country: true,
        postalCode: true,
        phone: true,
        email: true,
        manager: true,
        isActive: true,
        operatingHours: true,
        createdAt: true,
        updatedAt: true,
        restaurant: {
          select: {
            id: true,
            name: true
          }
        },
        _count: {
          select: {
            users: true,
            orders: true,
            menuItems: true,
            shifts: true,
            inventoryItems: true
          }
        }
      },
      orderBy: {
        name: 'asc'
      }
    });

    return branches.map(branch => ({
      ...branch,
      restaurantName: branch.restaurant?.name || null
    }));
  },

  async getBranchStats(branchId: string) {
    const branch = await prisma.branch.findUnique({
      where: { id: branchId },
      select: {
        id: true,
        name: true,
        serviceType: true,
        isActive: true,
        restaurant: {
          select: {
            id: true,
            name: true
          }
        },
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
      serviceType: branch.serviceType,
      restaurantName: branch.restaurant?.name || 'No Restaurant',
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
