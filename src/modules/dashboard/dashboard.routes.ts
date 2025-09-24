import { Router } from 'express';
import { DashboardController } from './dashboard.controller';
import { authenticateJWT } from '../../middleware/auth.middleware';

const router = Router();

// Apply authentication to all dashboard routes
router.use(authenticateJWT);

// Dashboard stats route
router.get('/stats', DashboardController.getDashboardStats);

export { router as dashboardRouter };
