import { Request, Response } from "express";
import { 
  inventoryCategoryService, 
  inventorySubcategoryService, 
  inventoryItemService,
  supplierService
} from "./inventory.service";
import { ApiResponse, ApiError } from "../../utils/apiResponse";

// --- Inventory Category Controller ---
export const inventoryCategoryController = {
  create: async (req: Request, res: Response) => {
    try {
      const category = await inventoryCategoryService.create(req.body, req.user);
      ApiResponse.send(res, ApiResponse.success(category, "Inventory category created successfully", 201));
    } catch (error: any) {
      ApiResponse.send(res, new ApiResponse(false, error.message, null, 400));
    }
  },
  list: async (req: Request, res: Response) => {
  try {
    const { user } = req as any;
    
    // Extract query parameters and normalize branch name
    const queryParams = { ...req.query };
    
    // If user is manager and has a branch, filter by branchName
    if (user?.role === 'MANAGER' && user?.branch) {
      // Normalize branch name to match your database format
      const normalizedBranch = user.branch.startsWith('branch')
        ? user.branch.replace('branch1', 'Bradford')
          .replace('branch2', 'Leeds')
          .replace('branch3', 'Helifax')
          .replace('branch4', 'Darley St Market')
        : user.branch;
      
      queryParams.branchName = normalizedBranch;
    }

    console.log('InventoryCategoryService.list called with:', {
      userRole: user?.role,
      userBranch: user?.branch,
      queryParams
    });

    // ✅ FIX: Pass user as first parameter, queryParams as second
    const categories = await inventoryCategoryService.list(user, queryParams);
    
    // ✅ FIX: Use consistent ApiResponse format
    ApiResponse.send(res, ApiResponse.success(categories, "Inventory categories retrieved successfully"));
  } catch (error: any) {
    // ✅ FIX: Use consistent error handling
    ApiResponse.send(res, new ApiResponse(false, error.message, null, 400));
  }
},
  get: async (req: Request, res: Response) => {
    try {
      const category = await inventoryCategoryService.get(req.params.id, req.user);
      if (!category) throw ApiError.notFound("Inventory category not found");
      ApiResponse.send(res, ApiResponse.success(category, "Inventory category retrieved successfully"));
    } catch (error: any) {
      ApiResponse.send(res, new ApiResponse(false, error.message, null, 400));
    }
  },
  update: async (req: Request, res: Response) => {
    try {
      const category = await inventoryCategoryService.update(req.params.id, req.body, req.user);
      ApiResponse.send(res, ApiResponse.success(category, "Inventory category updated successfully"));
    } catch (error: any) {
      ApiResponse.send(res, new ApiResponse(false, error.message, null, 400));
    }
  },
  remove: async (req: Request, res: Response) => {
    try {
      await inventoryCategoryService.remove(req.params.id, req.user);
      ApiResponse.send(res, ApiResponse.success(null, "Inventory category deleted successfully"));
    } catch (error: any) {
      ApiResponse.send(res, new ApiResponse(false, error.message, null, 400));
    }
  },
};

// --- Inventory Subcategory Controller ---
export const inventorySubcategoryController = {
  create: async (req: Request, res: Response) => {
    try {
      const subcategory = await inventorySubcategoryService.create(req.body, req.user);
      ApiResponse.send(res, ApiResponse.success(subcategory, "Inventory subcategory created successfully", 201));
    } catch (error: any) {
      ApiResponse.send(res, new ApiResponse(false, error.message, null, 400));
    }
  },
  list: async (req: Request, res: Response) => {
    try {
      const subcategories = await inventorySubcategoryService.list(req.user, req.query);
      ApiResponse.send(res, ApiResponse.success(subcategories, "Inventory subcategories retrieved successfully"));
    } catch (error: any) {
      ApiResponse.send(res, new ApiResponse(false, error.message, null, 400));
    }
  },
  get: async (req: Request, res: Response) => {
    try {
      const subcategory = await inventorySubcategoryService.get(req.params.id, req.user);
      if (!subcategory) throw ApiError.notFound("Inventory subcategory not found");
      ApiResponse.send(res, ApiResponse.success(subcategory, "Inventory subcategory retrieved successfully"));
    } catch (error: any) {
      ApiResponse.send(res, new ApiResponse(false, error.message, null, 400));
    }
  },
  update: async (req: Request, res: Response) => {
    try {
      const subcategory = await inventorySubcategoryService.update(req.params.id, req.body, req.user);
      ApiResponse.send(res, ApiResponse.success(subcategory, "Inventory subcategory updated successfully"));
    } catch (error: any) {
      ApiResponse.send(res, new ApiResponse(false, error.message, null, 400));
    }
  },
  remove: async (req: Request, res: Response) => {
    try {
      await inventorySubcategoryService.remove(req.params.id, req.user);
      ApiResponse.send(res, ApiResponse.success(null, "Inventory subcategory deleted successfully"));
    } catch (error: any) {
      ApiResponse.send(res, new ApiResponse(false, error.message, null, 400));
    }
  },
};

// --- Inventory Item Controller ---
export const inventoryItemController = {
  create: async (req: Request, res: Response) => {
    try {
      const item = await inventoryItemService.create(req.body, req.user);
      ApiResponse.send(res, ApiResponse.success(item, "Inventory item created successfully", 201));
    } catch (error: any) {
      ApiResponse.send(res, new ApiResponse(false, error.message, null, 400));
    }
  },
  list: async (req: Request, res: Response) => {
    try {
      const items = await inventoryItemService.list(req.user, req.query);
      ApiResponse.send(res, ApiResponse.success(items, "Inventory items retrieved successfully"));
    } catch (error: any) {
      ApiResponse.send(res, new ApiResponse(false, error.message, null, 400));
    }
  },
  get: async (req: Request, res: Response) => {
    try {
      const item = await inventoryItemService.get(req.params.id, req.user);
      if (!item) throw ApiError.notFound("Inventory item not found");
      ApiResponse.send(res, ApiResponse.success(item, "Inventory item retrieved successfully"));
    } catch (error: any) {
      ApiResponse.send(res, new ApiResponse(false, error.message, null, 400));
    }
  },
  update: async (req: Request, res: Response) => {
    try {
      const item = await inventoryItemService.update(req.params.id, req.body, req.user);
      ApiResponse.send(res, ApiResponse.success(item, "Inventory item updated successfully"));
    } catch (error: any) {
      ApiResponse.send(res, new ApiResponse(false, error.message, null, 400));
    }
  },
  remove: async (req: Request, res: Response) => {
    try {
      await inventoryItemService.remove(req.params.id, req.user);
      ApiResponse.send(res, ApiResponse.success(null, "Inventory item deleted successfully"));
    } catch (error: any) {
      ApiResponse.send(res, new ApiResponse(false, error.message, null, 400));
    }
  },
};

// --- Supplier Controller ---
export const supplierController = {
  create: async (req: Request, res: Response) => {
    try {
      const supplier = await supplierService.create(req.body, req.user);
      ApiResponse.send(res, ApiResponse.success(supplier, "Supplier created successfully", 201));
    } catch (error: any) {
      ApiResponse.send(res, new ApiResponse(false, error.message, null, 400));
    }
  },
  list: async (req: Request, res: Response) => {
    try {
      const suppliers = await supplierService.list(req.user, req.query);
      ApiResponse.send(res, ApiResponse.success(suppliers, "Suppliers retrieved successfully"));
    } catch (error: any) {
      ApiResponse.send(res, new ApiResponse(false, error.message, null, 400));
    }
  },
  get: async (req: Request, res: Response) => {
    try {
      const supplier = await supplierService.get(req.params.id, req.user);
      if (!supplier) throw ApiError.notFound("Supplier not found");
      ApiResponse.send(res, ApiResponse.success(supplier, "Supplier retrieved successfully"));
    } catch (error: any) {
      ApiResponse.send(res, new ApiResponse(false, error.message, null, 400));
    }
  },
  update: async (req: Request, res: Response) => {
    try {
      const supplier = await supplierService.update(req.params.id, req.body, req.user);
      ApiResponse.send(res, ApiResponse.success(supplier, "Supplier updated successfully"));
    } catch (error: any) {
      ApiResponse.send(res, new ApiResponse(false, error.message, null, 400));
    }
  },
  remove: async (req: Request, res: Response) => {
    try {
      await supplierService.remove(req.params.id, req.user);
      ApiResponse.send(res, ApiResponse.success(null, "Supplier deleted successfully"));
    } catch (error: any) {
      ApiResponse.send(res, new ApiResponse(false, error.message, null, 400));
    }
  },
  addProduct: async (req: Request, res: Response) => {
    try {
      const { supplierId } = req.params;
      const { inventoryItemId, ...supplierProductData } = req.body;
      const supplierProduct = await supplierService.addProductToSupplier(supplierId, inventoryItemId, supplierProductData, req.user);
      ApiResponse.send(res, ApiResponse.success(supplierProduct, "Product added to supplier successfully", 201));
    } catch (error: any) {
      ApiResponse.send(res, new ApiResponse(false, error.message, null, 400));
    }
  },
  getProducts: async (req: Request, res: Response) => {
    try {
      const { supplierId } = req.params;
      const products = await supplierService.getSupplierProducts(supplierId, req.user);
      ApiResponse.send(res, ApiResponse.success(products, "Supplier products retrieved successfully"));
    } catch (error: any) {
      ApiResponse.send(res, new ApiResponse(false, error.message, null, 400));
    }
  },
  updateProduct: async (req: Request, res: Response) => {
    try {
      const { supplierProductId } = req.params;
      const supplierProduct = await supplierService.updateSupplierProduct(supplierProductId, req.body, req.user);
      ApiResponse.send(res, ApiResponse.success(supplierProduct, "Supplier product updated successfully"));
    } catch (error: any) {
      ApiResponse.send(res, new ApiResponse(false, error.message, null, 400));
    }
  },
  removeProduct: async (req: Request, res: Response) => {
    try {
      const { supplierProductId } = req.params;
      await supplierService.removeSupplierProduct(supplierProductId, req.user);
      ApiResponse.send(res, ApiResponse.success(null, "Supplier product removed successfully"));
    } catch (error: any) {
      ApiResponse.send(res, new ApiResponse(false, error.message, null, 400));
    }
  },
};