import { Request, Response } from 'express';
import { DashboardService, DashboardStats } from './dashboard.service';
import { createRouteHandler } from '../../utils/route-handler';

// Validation function for period parameter
const validatePeriod = (period: unknown): 'day' | 'week' | 'month' => {
  if (period === 'day' || period === 'week' || period === 'month') {
    return period;
  }
  return 'day';
};

export const DashboardController = {
  getDashboardStats: createRouteHandler(async (req: Request, res: Response) => {
    const period = validatePeriod(req.query.period);
    const branchId = req.query.branchId as string | undefined;
    const user = (req as any).user; // Get user from request (added by auth middleware)
    console.log(user,"user")
    console.log('=== DASHBOARD CONTROLLER ===');
    console.log('Request from user:', {
      userId: user?.userId,
      role: user?.role,
      branchId: user?.branchId,
      requestedBranchId: branchId
    });
    
    console.log('Request query:', JSON.stringify(req.query, null, 2));
    
    try {
      // For managers, use their assigned branch ID if no specific branch is requested
      // For admins, only filter by branch if explicitly requested
      let effectiveBranchId: string | undefined;
      
      if (branchId) {
        // If a specific branch is requested, use that
        effectiveBranchId = branchId;
      } else if (user?.role === 'MANAGER') {
        // For managers, use their assigned branch ID
        effectiveBranchId = typeof user.branchId === 'string' ? user.branchId : user.branch?.id;
      }
      
      console.log('Fetching stats with:', {
        period,
        branchId: effectiveBranchId || 'ALL BRANCHES',
        isManager: user?.role === 'MANAGER',
        userBranchId: user?.branchId
      });
      
      const stats = await DashboardService.getDashboardStats(period, effectiveBranchId);
      
      console.log('Dashboard stats response:', { 
        totalRevenue: stats.totalRevenue,
        totalOrders: stats.totalOrders,
        branchIdUsed: effectiveBranchId || 'ALL BRANCHES',
        hasData: stats.totalRevenue > 0 || stats.totalOrders > 0,
        responseKeys: Object.keys(stats)
      });
      
      return res.json({
        success: true,
        data: stats,
      });
    } catch (error) {
      console.error('Error in getDashboardStats:', error);
      return res.status(500).json({
        success: false,
        error: 'Failed to fetch dashboard stats',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }), // Add missing closing bracket and parenthesis

  // Add more controller methods as needed
};

// Routes are now handled by the main router

export default DashboardController;
