// routes/printer.routes.ts
import { Router } from "express";
import { printerController } from "./printer-management.controller";
import { authenticateJWT, checkPermission, validateRequest } from "../../middleware/auth.middleware";
import { createPrinterSchema, updatePrinterSchema } from "../../middleware/validations/printer-management.validation";
import { PERMISSIONS } from "../../types/auth.types";

const router = Router();
router.use(authenticateJWT);

// ==================== PRINTER MANAGEMENT ROUTES ====================
router.get("/", checkPermission([PERMISSIONS.ORDER_READ, PERMISSIONS.POS_READ]), printerController.list);
router.get("/:id", checkPermission([PERMISSIONS.ORDER_READ]), printerController.get);
router.post("/", checkPermission([PERMISSIONS.ORDER_UPDATE]), validateRequest({ body: createPrinterSchema }), printerController.create);
router.put("/:id", checkPermission([PERMISSIONS.ORDER_UPDATE]), validateRequest({ body: updatePrinterSchema }), printerController.update);
router.delete("/:id", checkPermission([PERMISSIONS.ORDER_DELETE]), printerController.remove);
router.put("/:id/status", checkPermission([PERMISSIONS.ORDER_UPDATE]), printerController.updateStatus);
router.get("/stats", checkPermission([PERMISSIONS.ORDER_READ]), printerController.getStats);

// ==================== PRINT OPERATIONS ROUTES ====================
router.post("/:id/test", checkPermission([PERMISSIONS.ORDER_UPDATE]), printerController.testPrint);
router.post("/order", checkPermission([PERMISSIONS.ORDER_CREATE]), printerController.printOrder);
router.post("/report", checkPermission([PERMISSIONS.ORDER_READ]), printerController.printReport);

// ==================== PRINT JOB MANAGEMENT ROUTES ====================
router.get("/:id/jobs", checkPermission([PERMISSIONS.ORDER_READ]), printerController.getPrintJobs);
router.get("/queue", checkPermission([PERMISSIONS.ORDER_READ]), printerController.getPrintQueue);
router.put("/jobs/:jobId/printed", checkPermission([PERMISSIONS.ORDER_UPDATE]), printerController.markJobPrinted);
router.post("/:id/retry-jobs", checkPermission([PERMISSIONS.ORDER_UPDATE]), printerController.retryFailedJobs);
router.delete("/jobs/clear-old", checkPermission([PERMISSIONS.ORDER_DELETE]), printerController.clearOldJobs);

export default router;