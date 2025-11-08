import { Router } from 'express';
import { authenticate } from '../../middleware/authenticate';
import { authorize } from '../../middleware/authorize';
import { createDayEndReport, getDayEndReport, listDayEndReports } from './day-end.controller';

const router = Router();

// Create a new day end report
router.post(
  '/',
  authenticate,
  authorize(['ADMIN', 'MANAGER', 'CASHIER']),
  createDayEndReport
);

// Get all day end reports
router.get(
  '/',
  authenticate,
  authorize(['ADMIN', 'MANAGER']),
  listDayEndReports
);

// Get a specific day end report by ID
router.get(
  '/:id',
  authenticate,
  authorize(['ADMIN', 'MANAGER']),
  getDayEndReport
);

export default router;
