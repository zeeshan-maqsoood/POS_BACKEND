import { Request, Response } from "express";
import { categoryService, menuItemService, modifierService } from "./menu.service";
import { ApiResponse, ApiError } from "../../utils/apiResponse";

// --- Category ---
export const categoryController = {
  create: async (req: Request, res: Response) => {
    try {
      const category = await categoryService.create(req.body, req.user);
      ApiResponse.send(res, ApiResponse.success(category, "Category created successfully", 201));
    } catch (error: any) {
      ApiResponse.send(res, new ApiResponse(false, error.message, null, 400));
    }
  },
  list: async (req: Request, res: Response) => {
    const categories = await categoryService.list(req.user, req.query);
    ApiResponse.send(res, ApiResponse.success(categories, "Categories retrieved successfully"));
  },
  get: async (req: Request, res: Response) => {
    const category = await categoryService.get(req.params.id, req.user);
    if (!category) throw ApiError.notFound("Category not found");
    ApiResponse.send(res, ApiResponse.success(category, "Category retrieved successfully"));
  },
  update: async (req: Request, res: Response) => {
    const category = await categoryService.update(req.params.id, req.body, req.user);
    ApiResponse.send(res, ApiResponse.success(category, "Category updated successfully"));
  },
  remove: async (req: Request, res: Response) => {
    await categoryService.remove(req.params.id, req.user);
    ApiResponse.send(res, ApiResponse.success(null, "Category deleted successfully"));
  },
};

// --- MenuItem ---
export const menuItemController = {
  create: async (req: Request, res: Response) => {
    console.log(req.body)
    const menuItem = await menuItemService.create(req.body, req.user);
    ApiResponse.send(res, ApiResponse.success(menuItem, "Menu item created successfully", 201));
  },
  list: async (req: Request, res: Response) => {
    const items = await menuItemService.list(req.user, req.query);
    ApiResponse.send(res, ApiResponse.success(items, "Menu items retrieved successfully"));
  },
  get: async (req: Request, res: Response) => {
    const item = await menuItemService.get(req.params.id, req.user);
    if (!item) throw ApiError.notFound("Menu item not found");
    ApiResponse.send(res, ApiResponse.success(item, "Menu item retrieved successfully"));
  },
  update: async (req: Request, res: Response) => {
    const item = await menuItemService.update(req.params.id, req.body, req.user);
    ApiResponse.send(res, ApiResponse.success(item, "Menu item updated successfully"));
  },
  remove: async (req: Request, res: Response) => {
    await menuItemService.remove(req.params.id, req.user);
    ApiResponse.send(res, ApiResponse.success(null, "Menu item deleted successfully"));
  },
};

// --- Modifier ---
export const modifierController = {
  create: async (req: Request, res: Response) => {
    console.log(req.body)
    const modifier = await modifierService.create(req.body, req.user);
    ApiResponse.send(res, ApiResponse.success(modifier, "Modifier created successfully", 201));
  },
  list: async (req: Request, res: Response) => {
    const modifiers = await modifierService.list(req.user, req.query);
    ApiResponse.send(res, ApiResponse.success(modifiers, "Modifiers retrieved successfully"));
  },
  get: async (req: Request, res: Response) => {
    const modifier = await modifierService.get(req.params.id, req.user);
    if (!modifier) throw ApiError.notFound("Modifier not found");
    ApiResponse.send(res, ApiResponse.success(modifier, "Modifier retrieved successfully"));
  },
  update: async (req: Request, res: Response) => {
    const modifier = await modifierService.update(req.params.id, req.body, req.user);
    ApiResponse.send(res, ApiResponse.success(modifier, "Modifier updated successfully"));
  },
  remove: async (req: Request, res: Response) => {
    await modifierService.remove(req.params.id, req.user);
    ApiResponse.send(res, ApiResponse.success(null, "Modifier deleted successfully"));
  },
};