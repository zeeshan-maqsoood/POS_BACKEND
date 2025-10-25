import { Request, Response } from 'express';
import { RestaurantService } from './restaurant.service';
import { ApiResponse } from '../../utils/apiResponse';
import { JwtPayload } from '../../types/auth.types';

const restaurantService = new RestaurantService();

export const getAllRestaurants = async (req: Request, res: Response) => {
  try {
    const restaurants = await restaurantService.getAllRestaurants();
    ApiResponse.send(res, ApiResponse.success(restaurants));
  } catch (error: any) {
    console.error('Error fetching restaurants:', error);
    ApiResponse.send(res, ApiResponse.error(error.message || 'Failed to fetch restaurants', 500));
  }
};

export const getActiveRestaurants = async (req: Request, res: Response) => {
  try {
    const restaurants = await restaurantService.getActiveRestaurants();
    ApiResponse.send(res, ApiResponse.success(restaurants));
  } catch (error: any) {
    console.error('Error fetching active restaurants:', error);
    ApiResponse.send(res, ApiResponse.error(error.message || 'Failed to fetch active restaurants', 500));
  }
};

export const getRestaurantById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const restaurant = await restaurantService.getRestaurantById(id);

    if (!restaurant) {
      return ApiResponse.send(res, ApiResponse.error('Restaurant not found', 404));
    }

    ApiResponse.send(res, ApiResponse.success(restaurant));
  } catch (error: any) {
    console.error('Error fetching restaurant:', error);
    ApiResponse.send(res, ApiResponse.error(error.message || 'Failed to fetch restaurant', 500));
  }
};

export const getRestaurantsForDropdown = async (req: Request, res: Response) => {
  try {
    const restaurants = await restaurantService.getRestaurantsForDropdown();
    ApiResponse.send(res, ApiResponse.success(restaurants));
  } catch (error: any) {
    console.error('Error fetching restaurants for dropdown:', error);
    ApiResponse.send(res, ApiResponse.error(error.message || 'Failed to fetch restaurants for dropdown', 500));
  }
};

export const getRestaurantStats = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const stats = await restaurantService.getRestaurantStats(id);
    ApiResponse.send(res, ApiResponse.success(stats));
  } catch (error: any) {
    console.error('Error fetching restaurant stats:', error);
    ApiResponse.send(res, ApiResponse.error(error.message || 'Failed to fetch restaurant stats', 500));
  }
};

export const createRestaurant = async (req: Request, res: Response) => {
  try {
    const currentUser = req.user as unknown as JwtPayload;
    const restaurantData = req.body;

    // Check if user is admin (only admins can create restaurants)
    if (currentUser.role !== 'ADMIN') {
      return ApiResponse.send(res, ApiResponse.error("Unauthorized: Only admins can create restaurants", 403));
    }

    const restaurant = await restaurantService.createRestaurant(restaurantData);
    ApiResponse.send(res, ApiResponse.success(restaurant, 'Restaurant created successfully'));
  } catch (error: any) {
    console.error('Error creating restaurant:', error);
    ApiResponse.send(res, ApiResponse.error(error.message || 'Failed to create restaurant', 500));
  }
};

export const updateRestaurant = async (req: Request, res: Response) => {
  try {
    const currentUser = req.user as unknown as JwtPayload;
    const { id } = req.params;
    const updateData = req.body;

    // Check if user is admin (only admins can update restaurants)
    if (currentUser.role !== 'ADMIN') {
      return ApiResponse.send(res, ApiResponse.error("Unauthorized: Only admins can update restaurants", 403));
    }

    // Check if restaurant exists
    const existingRestaurant = await restaurantService.getRestaurantById(id);
    if (!existingRestaurant) {
      return ApiResponse.send(res, ApiResponse.error("Restaurant not found", 404));
    }

    const restaurant = await restaurantService.updateRestaurant(id, updateData);
    ApiResponse.send(res, ApiResponse.success(restaurant, 'Restaurant updated successfully'));
  } catch (error: any) {
    console.error('Error updating restaurant:', error);
    ApiResponse.send(res, ApiResponse.error(error.message || 'Failed to update restaurant', 500));
  }
};

export const deleteRestaurant = async (req: Request, res: Response) => {
  try {
    const currentUser = req.user as unknown as JwtPayload;
    const { id } = req.params;

    // Check if user is admin (only admins can delete restaurants)
    if (currentUser.role !== 'ADMIN') {
      return ApiResponse.send(res, ApiResponse.error("Unauthorized: Only admins can delete restaurants", 403));
    }

    // Check if restaurant exists
    const existingRestaurant = await restaurantService.getRestaurantById(id);
    if (!existingRestaurant) {
      return ApiResponse.send(res, ApiResponse.error("Restaurant not found", 404));
    }

    await restaurantService.deleteRestaurant(id);

    ApiResponse.send(res, ApiResponse.success(null, "Restaurant deactivated successfully"));
  } catch (error: any) {
    console.error('Error deleting restaurant:', error);
    ApiResponse.send(res, ApiResponse.error(error.message || 'Failed to delete restaurant', 500));
  }
};
