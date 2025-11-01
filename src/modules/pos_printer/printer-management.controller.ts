// controllers/printer.controller.ts
import { Request, Response } from "express";
import { printerService } from "./printer-management.service";
import { ApiResponse, ApiError } from "../../utils/apiResponse";

export const printerController = {
  // ==================== PRINTER MANAGEMENT ====================
  create: async (req: Request, res: Response) => {
    try {
      const printer = await printerService.create(req.body, req.user);
      ApiResponse.send(res, ApiResponse.success(printer, "Printer created successfully", 201));
    } catch (error: any) {
      ApiResponse.send(res, new ApiResponse(false, error.message, null, 400));
    }
  },

  list: async (req: Request, res: Response) => {
    try {
      const printers = await printerService.list(req.user, req.query);
      ApiResponse.send(res, ApiResponse.success(printers, "Printers retrieved successfully"));
    } catch (error: any) {
      ApiResponse.send(res, new ApiResponse(false, error.message, null, 400));
    }
  },

  get: async (req: Request, res: Response) => {
    try {
      const printer = await printerService.get(req.params.id, req.user);
      if (!printer) throw ApiError.notFound("Printer not found");
      ApiResponse.send(res, ApiResponse.success(printer, "Printer retrieved successfully"));
    } catch (error: any) {
      ApiResponse.send(res, new ApiResponse(false, error.message, null, 404));
    }
  },

  update: async (req: Request, res: Response) => {
    try {
      const printer = await printerService.update(req.params.id, req.body, req.user);
      ApiResponse.send(res, ApiResponse.success(printer, "Printer updated successfully"));
    } catch (error: any) {
      ApiResponse.send(res, new ApiResponse(false, error.message, null, 400));
    }
  },

  remove: async (req: Request, res: Response) => {
    try {
      await printerService.remove(req.params.id, req.user);
      ApiResponse.send(res, ApiResponse.success(null, "Printer deleted successfully"));
    } catch (error: any) {
      ApiResponse.send(res, new ApiResponse(false, error.message, null, 400));
    }
  },

  updateStatus: async (req: Request, res: Response) => {
    try {
      const { status } = req.body;
      const printer = await printerService.updateStatus(req.params.id, status, req.user);
      ApiResponse.send(res, ApiResponse.success(printer, "Printer status updated successfully"));
    } catch (error: any) {
      ApiResponse.send(res, new ApiResponse(false, error.message, null, 400));
    }
  },

  getStats: async (req: Request, res: Response) => {
    try {
      const stats = await printerService.getStats(req.query.branchId as string, req.user);
      ApiResponse.send(res, ApiResponse.success(stats, "Printer statistics retrieved successfully"));
    } catch (error: any) {
      ApiResponse.send(res, new ApiResponse(false, error.message, null, 400));
    }
  },

  // ==================== PRINT OPERATIONS ====================
  testPrint: async (req: Request, res: Response) => {
    try {
      const printJob = await printerService.testPrint(req.params.id, req.user);
      ApiResponse.send(res, ApiResponse.success(printJob, "Test print job created successfully"));
    } catch (error: any) {
      ApiResponse.send(res, new ApiResponse(false, error.message, null, 400));
    }
  },

  printOrder: async (req: Request, res: Response) => {
    try {
      const { orderId } = req.body;
      
      // In a real implementation, you would fetch the order from the database
      // For now, we'll use the provided order data
      const order = req.body.order;
      
      const result = await printerService.printOrder(order, req.user);
      ApiResponse.send(res, ApiResponse.success(result, "Print jobs created successfully"));
    } catch (error: any) {
      ApiResponse.send(res, new ApiResponse(false, error.message, null, 400));
    }
  },

  printReport: async (req: Request, res: Response) => {
    try {
      const { reportType, data, printerId } = req.body;
      const printJobs = await printerService.printReport(reportType, data, printerId, req.user);
      ApiResponse.send(res, ApiResponse.success(printJobs, "Report print jobs created successfully"));
    } catch (error: any) {
      ApiResponse.send(res, new ApiResponse(false, error.message, null, 400));
    }
  },

  // ==================== PRINT JOB MANAGEMENT ====================
  getPrintJobs: async (req: Request, res: Response) => {
    try {
      const jobs = await printerService.getPrintJobs(req.params.id, req.user, req.query);
      ApiResponse.send(res, ApiResponse.success(jobs, "Print jobs retrieved successfully"));
    } catch (error: any) {
      ApiResponse.send(res, new ApiResponse(false, error.message, null, 400));
    }
  },

  getPrintQueue: async (req: Request, res: Response) => {
    try {
      const queue = await printerService.getPrintQueue(
        req.query.branchId as string, 
        req.query.status as string
      );
      ApiResponse.send(res, ApiResponse.success(queue, "Print queue retrieved successfully"));
    } catch (error: any) {
      ApiResponse.send(res, new ApiResponse(false, error.message, null, 400));
    }
  },

  markJobPrinted: async (req: Request, res: Response) => {
    try {
      const job = await printerService.markJobAsPrinted(req.params.jobId);
      ApiResponse.send(res, ApiResponse.success(job, "Job marked as printed successfully"));
    } catch (error: any) {
      ApiResponse.send(res, new ApiResponse(false, error.message, null, 400));
    }
  },

  retryFailedJobs: async (req: Request, res: Response) => {
    try {
      const printerId = req.params.id;
      const results = await printerService.retryFailedJobs(printerId);
      ApiResponse.send(res, ApiResponse.success(results, "Failed jobs retried successfully"));
    } catch (error: any) {
      ApiResponse.send(res, new ApiResponse(false, error.message, null, 400));
    }
  },

  clearOldJobs: async (req: Request, res: Response) => {
    try {
      const days = parseInt(req.query.days as string) || 30;
      const result = await printerService.clearOldJobs(days);
      ApiResponse.send(res, ApiResponse.success(result, "Old print jobs cleared successfully"));
    } catch (error: any) {
      ApiResponse.send(res, new ApiResponse(false, error.message, null, 400));
    }
  }
};