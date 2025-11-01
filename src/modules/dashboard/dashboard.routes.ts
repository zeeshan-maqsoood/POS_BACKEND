import { Router } from 'express';
import { DashboardController } from './dashboard.controller';
import { authenticateJWT, checkPermission } from '../../middleware/auth.middleware';
import { PERMISSIONS } from '../../types/auth.types';

const router = Router();

router.use(authenticateJWT);

// Dashboard stats route
router.get('/stats', 
  checkPermission([PERMISSIONS.DASHBOARD_READ]), 
  DashboardController.getDashboardStats
);

// // New alerts route
// router.get('/alerts',
//   checkPermission([PERMISSIONS.DASHBOARD_READ, PERMISSIONS.INVENTORY_READ]),
//   DashboardController.getAlerts
// );

// // Custom reports route
// router.get('/custom-report',
//   checkPermission([PERMISSIONS.DASHBOARD_READ]),
//   DashboardController.getCustomReport
// );

export { router as dashboardRouter };