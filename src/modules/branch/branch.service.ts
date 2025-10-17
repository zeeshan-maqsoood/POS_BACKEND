import prisma from "../../loaders/prisma";

export const branchService = {
  async getAllBranches() {
    // Get all unique branches from users table
    const users = await prisma.user.findMany({
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
  
  async getUserBranches(userId: string) {
    const user = await prisma.user.findUnique({
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
