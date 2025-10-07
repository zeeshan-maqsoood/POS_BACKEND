import { Router } from 'express';
import reportController from './report.controller';
import { authenticate } from '../../middleware/authenticate';
import { authorize } from '../../middleware/authorize';
import { Permission } from '@prisma/client';

const router = Router();

// Sales Reports
router.get(
  '/sales',
  authenticate,
  authorize([Permission.ORDER_READ]),
  reportController.getSalesReport
);

// Order Analysis
router.get(
  '/orders/analysis',
  authenticate,
  authorize([Permission.ORDER_READ]),
  reportController.getOrderAnalysis
);

// Menu Performance
router.get(
  '/menu/performance',
  authenticate,
  authorize([Permission.MENU_READ]),
  reportController.getMenuPerformance
);

// Staff Performance
router.get(
  '/staff/performance',
  authenticate,
  authorize([Permission.USER_READ]),
  reportController.getStaffPerformance
);

// Financial Summary
router.get(
  '/financial/summary',
  authenticate,
  authorize([Permission.ORDER_READ]),
  reportController.getFinancialSummary
);

export default router;