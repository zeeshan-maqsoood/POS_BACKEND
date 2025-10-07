import { Request, Response } from 'express';
import { z } from 'zod';
import reportService from './report.service';
import { startOfDay, endOfDay, subDays } from 'date-fns';

const dateRangeSchema = z.object({
  from: z.string().datetime().optional(),
  to: z.string().datetime().optional(),
  branchName: z.string().optional(),
});

const salesReportSchema = dateRangeSchema.extend({
  groupBy: z.enum(['day', 'week', 'month']).optional().default('day'),
});

export default {
  async getSalesReport(req: Request, res: Response) {
    try {
      const { from, to, groupBy, branchName } = salesReportSchema.parse({
        ...req.query,
        ...req.body,
      });

      const defaultFrom = startOfDay(subDays(new Date(), 30));
      const defaultTo = endOfDay(new Date());

      const data = await reportService.getSalesReport(
        {
          from: from ? new Date(from) : defaultFrom,
          to: to ? new Date(to) : defaultTo,
          groupBy,
        },
        branchName
      );

      res.json({
        success: true,
        data,
      });
    } catch (error) {
      console.error('Error in getSalesReport:', error);
      res.status(400).json({
        success: false,
        message: error instanceof Error ? error.message : 'Failed to generate sales report',
      });
    }
  },

  async getOrderAnalysis(req: Request, res: Response) {
    try {
      const { from, to, branchName } = dateRangeSchema.parse({
        ...req.query,
        ...req.body,
      });

      const defaultFrom = startOfDay(subDays(new Date(), 7));
      const defaultTo = endOfDay(new Date());

      const data = await reportService.getOrderAnalysis(
        {
          from: from ? new Date(from) : defaultFrom,
          to: to ? new Date(to) : defaultTo,
        },
        branchName
      );

      res.json({
        success: true,
        data,
      });
    } catch (error) {
      console.error('Error in getOrderAnalysis:', error);
      res.status(400).json({
        success: false,
        message: error instanceof Error ? error.message : 'Failed to generate order analysis',
      });
    }
  },

  async getMenuPerformance(req: Request, res: Response) {
    try {
      const { from, to, branchName } = dateRangeSchema.parse({
        ...req.query,
        ...req.body,
      });

      const defaultFrom = startOfDay(subDays(new Date(), 30));
      const defaultTo = endOfDay(new Date());

      const data = await reportService.getMenuPerformance(
        {
          from: from ? new Date(from) : defaultFrom,
          to: to ? new Date(to) : defaultTo,
        },
        branchName
      );

      res.json({
        success: true,
        data,
      });
    } catch (error) {
      console.error('Error in getMenuPerformance:', error);
      res.status(400).json({
        success: false,
        message: error instanceof Error ? error.message : 'Failed to generate menu performance report',
      });
    }
  },

  async getStaffPerformance(req: Request, res: Response) {
    try {
      const { from, to, branchName } = dateRangeSchema.parse({
        ...req.query,
        ...req.body,
      });

      const defaultFrom = startOfDay(subDays(new Date(), 30));
      const defaultTo = endOfDay(new Date());

      const data = await reportService.getStaffPerformance(
        {
          from: from ? new Date(from) : defaultFrom,
          to: to ? new Date(to) : defaultTo,
        },
        branchName
      );

      res.json({
        success: true,
        data,
      });
    } catch (error) {
      console.error('Error in getStaffPerformance:', error);
      res.status(400).json({
        success: false,
        message: error instanceof Error ? error.message : 'Failed to generate staff performance report',
      });
    }
  },

  async getFinancialSummary(req: Request, res: Response) {
    try {
      const { from, to, branchName } = dateRangeSchema.parse({
        ...req.query,
        ...req.body,
      });

      const defaultFrom = startOfDay(subDays(new Date(), 30));
      const defaultTo = endOfDay(new Date());

      const data = await reportService.getFinancialSummary(
        {
          from: from ? new Date(from) : defaultFrom,
          to: to ? new Date(to) : defaultTo,
        },
        branchName
      );

      res.json({
        success: true,
        data,
      });
    } catch (error) {
      console.error('Error in getFinancialSummary:', error);
      res.status(400).json({
        success: false,
        message: error instanceof Error ? error.message : 'Failed to generate financial summary',
      });
    }
  },
};