import prisma from '../../loaders/prisma';

export class RestaurantService {
  async createRestaurant(data: {
    name: string;
    description?: string;
    address?: string;
    city?: string;
    state?: string;
    country?: string;
    postalCode?: string;
    phone?: string;
    email?: string;
    website?: string;
    logoUrl?: string;
    businessType?: string;
    cuisine?: string[];
    establishedYear?: number;
    operatingHours?: any;
  }) {
    return await prisma.restaurant.create({
      data: {
        name: data.name,
        description: data.description,
        address: data.address,
        city: data.city,
        state: data.state,
        country: data.country || 'US',
        postalCode: data.postalCode,
        phone: data.phone,
        email: data.email,
        website: data.website,
        logoUrl: data.logoUrl,
        businessType: data.businessType,
        cuisine: data.cuisine || [],
        establishedYear: data.establishedYear,
        operatingHours: data.operatingHours,
      },
      include: {
        branches: true,
      },
    });
  }

  async getAllRestaurants() {
    const restraunts=await prisma.restaurant.findMany({
      include: {
        branches: {
          where: { isActive: true },
          include: {
            _count: {
              select: {
                users: true,
                orders: true,
                menuItems: true,
                shifts: true,
                inventoryItems: true,
              },
            },
          },
        },
        _count: {
          select: {
            branches: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
    return restraunts;
  }


  async getActiveRestaurants() {
    const activeRestarants= await prisma.restaurant.findMany({
      where: { isActive: true },
      include: {
        branches: {
          where: { isActive: true },
          include: {
            _count: {
              select: {
                users: true,
                orders: true,
                menuItems: true,
                shifts: true,
                inventoryItems: true,
              },
            },
          },
        },
        _count: {
          select: {
            branches: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
    return activeRestarants
  }

  async getRestaurantById(id: string) {
    return await prisma.restaurant.findUnique({
      where: { id },
      include: {
        branches: {
          include: {
            users: {
              select: { id: true, name: true, email: true, role: true },
            },
            _count: {
              select: {
                users: true,
                orders: true,
                menuItems: true,
                shifts: true,
                inventoryItems: true,
              },
            },
          },
        },
      },
    });
  }

  async getRestaurantsForDropdown() {
    const restaurants = await this.getActiveRestaurants();
    return restaurants.map((restaurant: any) => ({
      id: restaurant.id,
      name: restaurant.name,
      value: restaurant.name,
    }));
  }

  async updateRestaurant(
    id: string,
    data: {
      name?: string;
      description?: string;
      address?: string;
      city?: string;
      state?: string;
      country?: string;
      postalCode?: string;
      phone?: string;
      email?: string;
      website?: string;
      logoUrl?: string;
      businessType?: string;
      cuisine?: string[];
      establishedYear?: number;
      operatingHours?: any;
      isActive?: boolean;
    }
  ) {
    return await prisma.restaurant.update({
      where: { id },
      data: {
        name: data.name,
        description: data.description,
        address: data.address,
        city: data.city,
        state: data.state,
        country: data.country,
        postalCode: data.postalCode,
        phone: data.phone,
        email: data.email,
        website: data.website,
        logoUrl: data.logoUrl,
        businessType: data.businessType,
        cuisine: data.cuisine,
        establishedYear: data.establishedYear,
        operatingHours: data.operatingHours,
        isActive: data.isActive,
      },
      include: {
        branches: true,
      },
    });
  }

  async deleteRestaurant(id: string) {
    // Soft delete - set isActive to false
    return await prisma.restaurant.update({
      where: { id },
      data: { isActive: false }
    });
  }

  async getRestaurantStats(restaurantId: string) {
    const restaurant = await prisma.restaurant.findUnique({
      where: { id: restaurantId },
      include: {
        branches: {
          include: {
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
            },
            _count: {
              select: {
                users: true,
                orders: true,
                menuItems: true,
                shifts: true,
                inventoryItems: true,
              },
            },
          },
        },
      },
    });

    if (!restaurant) {
      throw new Error('Restaurant not found');
    }

    // Calculate aggregated stats across all branches
    const allBranches = restaurant.branches;
    const totalUsers = allBranches.reduce((sum: number, branch: any) => sum + branch._count.users, 0);
    const totalOrders = allBranches.reduce((sum: number, branch: any) => sum + branch._count.orders, 0);
    const totalMenuItems = allBranches.reduce((sum: number, branch: any) => sum + branch._count.menuItems, 0);
    const totalShifts = allBranches.reduce((sum: number, branch: any) => sum + branch._count.shifts, 0);
    const totalInventoryItems = allBranches.reduce((sum: number, branch: any) => sum + branch._count.inventoryItems, 0);

    // Calculate revenue for last 30 days
    const revenue = allBranches
      .flatMap((branch: any) => branch.orders)
      .filter((order: any) => order.status === 'COMPLETED')
      .reduce((sum: number, order: any) => sum + order.total, 0);

    const orderCountLast30Days = allBranches
      .flatMap((branch: any) => branch.orders)
      .length;

    return {
      id: restaurant.id,
      name: restaurant.name,
      isActive: restaurant.isActive,
      stats: {
        totalBranches: restaurant.branches.length,
        totalUsers,
        totalOrders,
        totalMenuItems,
        totalShifts,
        totalInventoryItems,
        revenueLast30Days: revenue,
        orderCountLast30Days,
      },
    };
  }
}
