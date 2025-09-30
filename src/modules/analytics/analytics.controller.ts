import { Request, Response } from 'express';
import { startOfDay, endOfDay, subDays, parseISO } from 'date-fns';
import { JwtPayload, hasPermission, Permission } from '../../types/auth.types';
import AnalyticalService from './analytic.service';
// Extend Express Request type
declare global {
  namespace Express {
    interface Request {
      user?: JwtPayload;
    }
  }
}

export const getAnalytics = async (req: Request, res: Response) => {
  try {
    // Check if user is authenticated and has permission to view analytics
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Check if user has permission to view analytics
    if (!hasPermission(req.user, ['POS_READ', 'ORDER_READ'])) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }

    const { from: fromStr, to: toStr, branch: branchName } = req.query;
    
    // Set default date range to last 30 days if not provided
    const to = toStr ? parseISO(toStr as string) : new Date();
    const from = fromStr ? parseISO(fromStr as string) : subDays(to, 30);

    // Ensure we have valid dates
    if (isNaN(from.getTime()) || isNaN(to.getTime())) {
      return res.status(400).json({ error: 'Invalid date format. Use ISO 8601 format (YYYY-MM-DD)' });
    }

    // Ensure from is before to
    if (from > to) {
      return res.status(400).json({ error: '"from" date must be before "to" date' });
    }

    const analytics = await AnalyticalService.getDashboardAnalytics(
      { from: startOfDay(from), to: endOfDay(to) },
      branchName as string | undefined
    );

    res.json(analytics);
  } catch (error) {
    console.error('Error fetching analytics:', error);
    res.status(500).json({ error: 'Failed to fetch analytics data' });
  }
};

export const getSalesData = async (req: Request, res: Response) => {
  try {
    const { from: fromStr, to: toStr, branch: branchName } = req.query;
    
    const to = toStr ? parseISO(toStr as string) : new Date();
    const from = fromStr ? parseISO(fromStr as string) : subDays(to, 30);

    if (isNaN(from.getTime()) || isNaN(to.getTime())) {
      return res.status(400).json({ error: 'Invalid date format' });
    }

    const salesData = await AnalyticalService.getSalesData(
      { from: startOfDay(from), to: endOfDay(to) },
      branchName as string | undefined
    );

    res.json(salesData);
  } catch (error) {
    console.error('Error fetching sales data:', error);
    res.status(500).json({ error: 'Failed to fetch sales data' });
  }
};

export const getOrdersByType = async (req: Request, res: Response) => {
  try {
    const { from: fromStr, to: toStr, branch: branchName } = req.query;
    
    const to = toStr ? parseISO(toStr as string) : new Date();
    const from = fromStr ? parseISO(fromStr as string) : subDays(to, 30);

    const ordersByType = await AnalyticalService.getOrdersByType(
      { from: startOfDay(from), to: endOfDay(to) },
      branchName as string | undefined
    );

    res.json(ordersByType);
  } catch (error) {
    console.error('Error fetching orders by type:', error);
    res.status(500).json({ error: 'Failed to fetch orders by type' });
  }
};

// Add similar controller methods for other analytics endpoints
// ...

export default {
  getAnalytics,
  getSalesData,
  getOrdersByType,
  // ... export other methods
};
