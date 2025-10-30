import { Router } from 'express';
import { DashboardController } from './dashboard.controller';
import { authenticateJWT, checkPermission } from '../../middleware/auth.middleware';
import { PERMISSIONS } from '../../types/auth.types';

const router = Router();

// Apply authentication to all dashboard routes
router.use(authenticateJWT);

// Dashboard stats route - requires DASHBOARD_READ permission
router.get('/stats', checkPermission([PERMISSIONS.DASHBOARD_READ]), DashboardController.getDashboardStats);

export { router as dashboardRouter };
