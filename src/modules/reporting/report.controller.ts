import { Request, Response } from 'express';
import { reportsService } from './report.service';
import { ApiResponse } from '../../utils/apiResponse';

export const reportsController = {
  // Sales & Order Reports
  async getSalesOverview(req: Request, res: Response) {
    try {
      const { startDate, endDate, branchName } = req.query;
      const { user } = req as any;
      
      const result = await reportsService.getSalesOverview({
        startDate: startDate as string,
        endDate: endDate as string,
        branchName: branchName as string,
        user
      });
      
      ApiResponse.send(res, result);
    } catch (error) {
      console.error('Error in sales overview:', error);
      ApiResponse.send(res, ApiResponse.error('Failed to fetch sales overview', 500));
    }
  },

  async getOrderReports(req: Request, res: Response) {
    try {
      const { startDate, endDate, branchName, status } = req.query;
      const { user } = req as any;
      
      const result = await reportsService.getOrderReports({
        startDate: startDate as string,
        endDate: endDate as string,
        branchName: branchName as string,
        status: status as string,
        user
      });
      
      ApiResponse.send(res, result);
    } catch (error) {
      console.error('Error in order reports:', error);
      ApiResponse.send(res, ApiResponse.error('Failed to fetch order reports', 500));
    }
  },

  async getPaymentReports(req: Request, res: Response) {
    try {
      const { startDate, endDate, branchName, paymentMethod } = req.query;
      const { user } = req as any;
      
      const result = await reportsService.getPaymentReports({
        startDate: startDate as string,
        endDate: endDate as string,
        branchName: branchName as string,
        paymentMethod: paymentMethod as string,
        user
      });
      
      ApiResponse.send(res, result);
    } catch (error) {
      console.error('Error in payment reports:', error);
      ApiResponse.send(res, ApiResponse.error('Failed to fetch payment reports', 500));
    }
  },

  // Inventory Reports
  async getInventoryStatus(req: Request, res: Response) {
    try {
      const { branchName, categoryId, status } = req.query;
      const { user } = req as any;
      
      const result = await reportsService.getInventoryStatus({
        branchName: branchName as string,
        categoryId: categoryId as string,
        status: status as string,
        user
      });
      
      ApiResponse.send(res, result);
    } catch (error) {
      console.error('Error in inventory status:', error);
      ApiResponse.send(res, ApiResponse.error('Failed to fetch inventory status', 500));
    }
  },

  async getInventoryTransactions(req: Request, res: Response) {
    try {
      const { startDate, endDate, branchName, type } = req.query;
      const { user } = req as any;
      
      const result = await reportsService.getInventoryTransactions({
        startDate: startDate as string,
        endDate: endDate as string,
        branchName: branchName as string,
        type: type as string,
        user
      });
      
      ApiResponse.send(res, result);
    } catch (error) {
      console.error('Error in inventory transactions:', error);
      ApiResponse.send(res, ApiResponse.error('Failed to fetch inventory transactions', 500));
    }
  },

  async getLowStockAlerts(req: Request, res: Response) {
    try {
      const { branchName } = req.query;
      const { user } = req as any;
      
      const result = await reportsService.getLowStockAlerts({
        branchName: branchName as string,
        user
      });
      
      ApiResponse.send(res, result);
    } catch (error) {
      console.error('Error in low stock alerts:', error);
      ApiResponse.send(res, ApiResponse.error('Failed to fetch low stock alerts', 500));
    }
  },

  // Menu Reports
  async getMenuPerformance(req: Request, res: Response) {
    try {
      const { startDate, endDate, branchName, categoryId } = req.query;
      const { user } = req as any;
      
      const result = await reportsService.getMenuPerformance({
        startDate: startDate as string,
        endDate: endDate as string,
        branchName: branchName as string,
        categoryId: categoryId as string,
        user
      });
      
      ApiResponse.send(res, result);
    } catch (error) {
      console.error('Error in menu performance:', error);
      ApiResponse.send(res, ApiResponse.error('Failed to fetch menu performance', 500));
    }
  },

  async getCategoryPerformance(req: Request, res: Response) {
    try {
      const { startDate, endDate, branchName } = req.query;
      const { user } = req as any;
      
      const result = await reportsService.getCategoryPerformance({
        startDate: startDate as string,
        endDate: endDate as string,
        branchName: branchName as string,
        user
      });
      
      ApiResponse.send(res, result);
    } catch (error) {
      console.error('Error in category performance:', error);
      ApiResponse.send(res, ApiResponse.error('Failed to fetch category performance', 500));
    }
  },

  // Branch Reports
  async getBranchPerformance(req: Request, res: Response) {
    try {
      const { startDate, endDate } = req.query;
      const { user } = req as any;
      
      const result = await reportsService.getBranchPerformance({
        startDate: startDate as string,
        endDate: endDate as string,
        user
      });
      
      ApiResponse.send(res, result);
    } catch (error) {
      console.error('Error in branch performance:', error);
      ApiResponse.send(res, ApiResponse.error('Failed to fetch branch performance', 500));
    }
  },

  async getBranchComparison(req: Request, res: Response) {
    try {
      const { startDate, endDate } = req.query;
      const { user } = req as any;
      
      const result = await reportsService.getBranchComparison({
        startDate: startDate as string,
        endDate: endDate as string,
        user
      });
      
      ApiResponse.send(res, result);
    } catch (error) {
      console.error('Error in branch comparison:', error);
      ApiResponse.send(res, ApiResponse.error('Failed to fetch branch comparison', 500));
    }
  },

  // Staff Reports
  async getStaffPerformance(req: Request, res: Response) {
    try {
      const { startDate, endDate, branchName } = req.query;
      const { user } = req as any;
      
      const result = await reportsService.getStaffPerformance({
        startDate: startDate as string,
        endDate: endDate as string,
        branchName: branchName as string,
        user
      });
      
      ApiResponse.send(res, result);
    } catch (error) {
      console.error('Error in staff performance:', error);
      ApiResponse.send(res, ApiResponse.error('Failed to fetch staff performance', 500));
    }
  },

  async getStaffActivity(req: Request, res: Response) {
    try {
      const { startDate, endDate, branchName } = req.query;
      const { user } = req as any;
      
      const result = await reportsService.getStaffActivity({
        startDate: startDate as string,
        endDate: endDate as string,
        branchName: branchName as string,
        user
      });
      
      ApiResponse.send(res, result);
    } catch (error) {
      console.error('Error in staff activity:', error);
      ApiResponse.send(res, ApiResponse.error('Failed to fetch staff activity', 500));
    }
  },

  // Financial Reports
  async getRevenueReports(req: Request, res: Response) {
    try {
      const { startDate, endDate, branchName } = req.query;
      const { user } = req as any;
      
      const result = await reportsService.getRevenueReports({
        startDate: startDate as string,
        endDate: endDate as string,
        branchName: branchName as string,
        user
      });
      
      ApiResponse.send(res, result);
    } catch (error) {
      console.error('Error in revenue reports:', error);
      ApiResponse.send(res, ApiResponse.error('Failed to fetch revenue reports', 500));
    }
  },

  async getTaxReports(req: Request, res: Response) {
    try {
      const { startDate, endDate, branchName } = req.query;
      const { user } = req as any;
      
      const result = await reportsService.getTaxReports({
        startDate: startDate as string,
        endDate: endDate as string,
        branchName: branchName as string,
        user
      });
      
      ApiResponse.send(res, result);
    } catch (error) {
      console.error('Error in tax reports:', error);
      ApiResponse.send(res, ApiResponse.error('Failed to fetch tax reports', 500));
    }
  },

  // Dashboard Overview
  async getDashboardOverview(req: Request, res: Response) {
    try {
      const { user } = req as any;
      
      const result = await reportsService.getDashboardOverview({
        user
      });
      
      ApiResponse.send(res, result);
    } catch (error) {
      console.error('Error in dashboard overview:', error);
      ApiResponse.send(res, ApiResponse.error('Failed to fetch dashboard overview', 500));
    }
  },

  async getTimeAnalytics(req: Request, res: Response) {
    try {
      const { startDate, endDate, branchName } = req.query;
      const { user } = req as any;
      
      const result = await reportsService.getTimeAnalytics({
        startDate: startDate as string,
        endDate: endDate as string,
        branchName: branchName as string,
        user
      });
      
      ApiResponse.send(res, result);
    } catch (error) {
      console.error('Error in time analytics:', error);
      ApiResponse.send(res, ApiResponse.error('Failed to fetch time analytics', 500));
    }
  },

  async getSalesByHour(req: Request, res: Response) {
    try {
      const { startDate, endDate, branchName } = req.query;
      const { user } = req as any;
      
      const result = await reportsService.getSalesByHour({
        startDate: startDate as string,
        endDate: endDate as string,
        branchName: branchName as string,
        user
      });
      
      ApiResponse.send(res, result);
    } catch (error) {
      console.error('Error in sales by hour:', error);
      ApiResponse.send(res, ApiResponse.error('Failed to fetch sales by hour data', 500));
    }
  },

  async getPeakHoursAnalysis(req: Request, res: Response) {
    try {
      const { startDate, endDate, branchName } = req.query;
      const { user } = req as any;
      
      const result = await reportsService.getPeakHoursAnalysis({
        startDate: startDate as string,
        endDate: endDate as string,
        branchName: branchName as string,
        user
      });
      
      ApiResponse.send(res, result);
    } catch (error) {
      console.error('Error in peak hours analysis:', error);
      ApiResponse.send(res, ApiResponse.error('Failed to fetch peak hours analysis', 500));
    }
  },

  async getCustomerBehaviorAnalytics(req: Request, res: Response) {
    try {
      const { startDate, endDate, branchName } = req.query;
      const { user } = req as any;
      
      const result = await reportsService.getCustomerBehaviorAnalytics({
        startDate: startDate as string,
        endDate: endDate as string,
        branchName: branchName as string,
        user
      });
      
      ApiResponse.send(res, result);
    } catch (error) {
      console.error('Error in customer behavior analytics:', error);
      ApiResponse.send(res, ApiResponse.error('Failed to fetch customer behavior analytics', 500));
    }
  },

  async getProductPerformanceByTime(req: Request, res: Response) {
    try {
      const { startDate, endDate, branchName } = req.query;
      const { user } = req as any;
      
      const result = await reportsService.getProductPerformanceByTime({
        startDate: startDate as string,
        endDate: endDate as string,
        branchName: branchName as string,
        user
      });
      
      ApiResponse.send(res, result);
    } catch (error) { 
      console.error('Error in product performance by time:', error);
      ApiResponse.send(res, ApiResponse.error('Failed to fetch product performance by time', 500));
    }
  },

  async getStaffPerformanceByTime(req: Request, res: Response) {
    try {
      const { startDate, endDate, branchName } = req.query;
      const { user } = req as any;
      
      const result = await reportsService.getStaffPerformanceByTime({
        startDate: startDate as string,
        endDate: endDate as string,
        branchName: branchName as string,
        user
      });
      
      ApiResponse.send(res, result);
    } catch (error) {
      console.error('Error in staff performance by time:', error);
      ApiResponse.send(res, ApiResponse.error('Failed to fetch staff performance by time', 500));
    }
  },


};