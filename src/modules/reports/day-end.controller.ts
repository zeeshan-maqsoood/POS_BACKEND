import { Request, Response } from 'express';
import { generateDayEndReport, getDayEndReports, getDayEndReportById } from './day-end.service';
import { JwtPayload } from 'jsonwebtoken';

export async function createDayEndReport(req: Request, res: Response) {
  try {
    const { expectedTotal, actualCash, branchId } = req.body;
    const user = req.user as JwtPayload;

    if (!expectedTotal || !actualCash) {
      return res.status(400).json({
        success: false,
        message: 'Expected total and actual cash are required'
      });
    }

    const report = await generateDayEndReport({
      expectedTotal: Number(expectedTotal),
      actualCash: Number(actualCash),
      branchId,
      userId: user.userId
    });

    return res.status(201).json({
      success: true,
      data: report
    });
  } catch (error) {
    console.error('Error creating day end report:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to create day end report',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

export async function listDayEndReports(req: Request, res: Response) {
  try {
    const { startDate, endDate, branchId, page = '1', pageSize = '10' } = req.query;
    const user = req.user as JwtPayload;

    // If user is not admin, only show reports for their branch
    const userBranchId = user.role !== 'ADMIN' && user.branchId ? user.branchId : undefined;
    const branchToUse = branchId ? String(branchId) : userBranchId;

    const reports = await getDayEndReports({
      startDate: startDate ? new Date(String(startDate)) : undefined,
      endDate: endDate ? new Date(String(endDate)) : undefined,
      branchId: branchToUse,
      page: parseInt(String(page), 10),
      pageSize: parseInt(String(pageSize), 10)
    });

    return res.json({
      success: true,
      data: reports.data,
      meta: reports.meta
    });
  } catch (error) {
    console.error('Error fetching day end reports:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch day end reports',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

export async function getDayEndReport(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const user = req.user as JwtPayload;

    const report = await getDayEndReportById(id);

    if (!report) {
      return res.status(404).json({
        success: false,
        message: 'Day end report not found'
      });
    }

    // If user is not admin and report is for a different branch, deny access
    if (user.role !== 'ADMIN' && report.branchId && report.branchId !== user.branchId) {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to view this report'
      });
    }

    return res.json({
      success: true,
      data: report
    });
  } catch (error) {
    console.error('Error fetching day end report:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch day end report',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}
