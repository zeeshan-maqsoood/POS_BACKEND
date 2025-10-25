import { Router } from 'express';
import { authenticate } from "../../middleware/authenticate";
import {
  getAllRestaurants,
  getActiveRestaurants,
  getRestaurantById,
  getRestaurantsForDropdown,
  getRestaurantStats,
  createRestaurant,
  updateRestaurant,
  deleteRestaurant,
} from './restaurant.controllers';

const router = Router();

// All restaurant routes require authentication
router.use(authenticate);

// Public routes (for dropdowns, etc.)
router.get('/dropdown', getRestaurantsForDropdown);

// Protected routes (require admin role)
router.get('/', getAllRestaurants);
router.get('/active', getActiveRestaurants);
router.get('/:id', getRestaurantById);
router.get('/:id/stats', getRestaurantStats);
router.post('/', createRestaurant);
router.put('/:id', updateRestaurant);
router.delete('/:id', deleteRestaurant);

export { router as restaurantRoutes };
