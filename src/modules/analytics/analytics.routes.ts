import { Router } from 'express';
import * as AnalyticsController from './analytics.controller';
import { authenticateJWT } from '../../middleware/auth.middleware';
const router = Router();

// Apply authentication middleware to all analytics routes
router.use(authenticateJWT);

// Main analytics endpoint - returns all analytics data
router.get('/', AnalyticsController.getAnalytics);

// Individual endpoints for specific analytics
router.get('/sales', AnalyticsController.getSalesData);
router.get('/orders/type', AnalyticsController.getOrdersByType);
// Add more routes for other analytics endpoints as needed

export default router;
