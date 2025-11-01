import { Request, Response } from 'express';
import DashboardService from './dashboard.service';
import { createRouteHandler } from '../../utils/route-handler';

// Use the default exported service
const dashboardService = DashboardService;

// Validation function for period parameter
const validatePeriod = (period: unknown): 'day' | 'week' | 'month' => {
  if (period === 'day' || period === 'week' || period === 'month') {
    return period;
  }
  return 'day';
};

export const DashboardController = {
  getDashboardStats: createRouteHandler(async (req: Request, res: Response) => {
    const period = req.query.period as 'day' | 'week' | 'month' | 'custom';
    const branchId = req.query.branchId as string | undefined;
    const startDate = req.query.startDate as string | undefined;
    const endDate = req.query.endDate as string | undefined;
    const user = (req as any).user; // Get user from request (added by auth middleware)
    
    console.log('=== DASHBOARD CONTROLLER ===');
    console.log('Request from user:', {
      userId: user?.userId,
      role: user?.role,
      branchId: user?.branchId,
      requestedBranchId: branchId,
      period,
      startDate,
      endDate
    });
    
    try {
      // Determine effective branch ID based on user role and request
      let effectiveBranchId: string | undefined;
      
      if (branchId) {
        // If a specific branch is requested, use that
        effectiveBranchId = branchId;
      } else if (user?.role === 'MANAGER') {
        // For managers, use their assigned branch ID
        effectiveBranchId = typeof user.branchId === 'string' ? user.branchId : user.branch?.id;
      }
      
      console.log('Effective branch ID:', {
        branchId: effectiveBranchId || 'ALL BRANCHES',
        isManager: user?.role === 'MANAGER',
        userBranchId: user?.branchId
      });
      
      // Get dashboard stats from the service
      const stats = await dashboardService.getDashboardStats(
        period,
        effectiveBranchId,
        startDate ? new Date(startDate) : undefined,
        endDate ? new Date(endDate) : undefined
      );
      
      console.log('Dashboard stats response:', { 
        totalRevenue: stats.totalRevenue,
        totalOrders: stats.totalOrders,
      });
      
      return res.json({ success: true, data: stats });
    } catch (error) {
      console.error('Error in getDashboardStats:', error);
      return res.status(500).json({
        success: false,
        error: 'Failed to fetch dashboard stats',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  })
};

// Add more controller methods as needed

// Routes are now handled by the main router

export default DashboardController;
