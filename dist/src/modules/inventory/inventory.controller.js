"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.supplierController = exports.inventoryItemController = exports.inventorySubcategoryController = exports.inventoryCategoryController = void 0;
const inventory_service_1 = require("./inventory.service");
const apiResponse_1 = require("../../utils/apiResponse");
// --- Inventory Category Controller ---
exports.inventoryCategoryController = {
    create: async (req, res) => {
        try {
            const category = await inventory_service_1.inventoryCategoryService.create(req.body, req.user);
            apiResponse_1.ApiResponse.send(res, apiResponse_1.ApiResponse.success(category, "Inventory category created successfully", 201));
        }
        catch (error) {
            apiResponse_1.ApiResponse.send(res, new apiResponse_1.ApiResponse(false, error.message, null, 400));
        }
    },
    list: async (req, res) => {
        try {
            const { user } = req;
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
            const categories = await inventory_service_1.inventoryCategoryService.list(user, queryParams);
            // ✅ FIX: Use consistent ApiResponse format
            apiResponse_1.ApiResponse.send(res, apiResponse_1.ApiResponse.success(categories, "Inventory categories retrieved successfully"));
        }
        catch (error) {
            // ✅ FIX: Use consistent error handling
            apiResponse_1.ApiResponse.send(res, new apiResponse_1.ApiResponse(false, error.message, null, 400));
        }
    },
    get: async (req, res) => {
        try {
            const category = await inventory_service_1.inventoryCategoryService.get(req.params.id, req.user);
            if (!category)
                throw apiResponse_1.ApiError.notFound("Inventory category not found");
            apiResponse_1.ApiResponse.send(res, apiResponse_1.ApiResponse.success(category, "Inventory category retrieved successfully"));
        }
        catch (error) {
            apiResponse_1.ApiResponse.send(res, new apiResponse_1.ApiResponse(false, error.message, null, 400));
        }
    },
    update: async (req, res) => {
        try {
            const category = await inventory_service_1.inventoryCategoryService.update(req.params.id, req.body, req.user);
            apiResponse_1.ApiResponse.send(res, apiResponse_1.ApiResponse.success(category, "Inventory category updated successfully"));
        }
        catch (error) {
            apiResponse_1.ApiResponse.send(res, new apiResponse_1.ApiResponse(false, error.message, null, 400));
        }
    },
    remove: async (req, res) => {
        try {
            await inventory_service_1.inventoryCategoryService.remove(req.params.id, req.user);
            apiResponse_1.ApiResponse.send(res, apiResponse_1.ApiResponse.success(null, "Inventory category deleted successfully"));
        }
        catch (error) {
            apiResponse_1.ApiResponse.send(res, new apiResponse_1.ApiResponse(false, error.message, null, 400));
        }
    },
};
// --- Inventory Subcategory Controller ---
exports.inventorySubcategoryController = {
    create: async (req, res) => {
        try {
            const subcategory = await inventory_service_1.inventorySubcategoryService.create(req.body, req.user);
            apiResponse_1.ApiResponse.send(res, apiResponse_1.ApiResponse.success(subcategory, "Inventory subcategory created successfully", 201));
        }
        catch (error) {
            apiResponse_1.ApiResponse.send(res, new apiResponse_1.ApiResponse(false, error.message, null, 400));
        }
    },
    list: async (req, res) => {
        try {
            const subcategories = await inventory_service_1.inventorySubcategoryService.list(req.user, req.query);
            apiResponse_1.ApiResponse.send(res, apiResponse_1.ApiResponse.success(subcategories, "Inventory subcategories retrieved successfully"));
        }
        catch (error) {
            apiResponse_1.ApiResponse.send(res, new apiResponse_1.ApiResponse(false, error.message, null, 400));
        }
    },
    get: async (req, res) => {
        try {
            const subcategory = await inventory_service_1.inventorySubcategoryService.get(req.params.id, req.user);
            if (!subcategory)
                throw apiResponse_1.ApiError.notFound("Inventory subcategory not found");
            apiResponse_1.ApiResponse.send(res, apiResponse_1.ApiResponse.success(subcategory, "Inventory subcategory retrieved successfully"));
        }
        catch (error) {
            apiResponse_1.ApiResponse.send(res, new apiResponse_1.ApiResponse(false, error.message, null, 400));
        }
    },
    update: async (req, res) => {
        try {
            const subcategory = await inventory_service_1.inventorySubcategoryService.update(req.params.id, req.body, req.user);
            apiResponse_1.ApiResponse.send(res, apiResponse_1.ApiResponse.success(subcategory, "Inventory subcategory updated successfully"));
        }
        catch (error) {
            apiResponse_1.ApiResponse.send(res, new apiResponse_1.ApiResponse(false, error.message, null, 400));
        }
    },
    remove: async (req, res) => {
        try {
            await inventory_service_1.inventorySubcategoryService.remove(req.params.id, req.user);
            apiResponse_1.ApiResponse.send(res, apiResponse_1.ApiResponse.success(null, "Inventory subcategory deleted successfully"));
        }
        catch (error) {
            apiResponse_1.ApiResponse.send(res, new apiResponse_1.ApiResponse(false, error.message, null, 400));
        }
    },
};
// --- Inventory Item Controller ---
exports.inventoryItemController = {
    create: async (req, res) => {
        try {
            const item = await inventory_service_1.inventoryItemService.create(req.body, req.user);
            apiResponse_1.ApiResponse.send(res, apiResponse_1.ApiResponse.success(item, "Inventory item created successfully", 201));
        }
        catch (error) {
            apiResponse_1.ApiResponse.send(res, new apiResponse_1.ApiResponse(false, error.message, null, 400));
        }
    },
    list: async (req, res) => {
        try {
            const items = await inventory_service_1.inventoryItemService.list(req.user, req.query);
            apiResponse_1.ApiResponse.send(res, apiResponse_1.ApiResponse.success(items, "Inventory items retrieved successfully"));
        }
        catch (error) {
            apiResponse_1.ApiResponse.send(res, new apiResponse_1.ApiResponse(false, error.message, null, 400));
        }
    },
    get: async (req, res) => {
        try {
            const item = await inventory_service_1.inventoryItemService.get(req.params.id, req.user);
            if (!item)
                throw apiResponse_1.ApiError.notFound("Inventory item not found");
            apiResponse_1.ApiResponse.send(res, apiResponse_1.ApiResponse.success(item, "Inventory item retrieved successfully"));
        }
        catch (error) {
            apiResponse_1.ApiResponse.send(res, new apiResponse_1.ApiResponse(false, error.message, null, 400));
        }
    },
    update: async (req, res) => {
        try {
            const item = await inventory_service_1.inventoryItemService.update(req.params.id, req.body, req.user);
            apiResponse_1.ApiResponse.send(res, apiResponse_1.ApiResponse.success(item, "Inventory item updated successfully"));
        }
        catch (error) {
            apiResponse_1.ApiResponse.send(res, new apiResponse_1.ApiResponse(false, error.message, null, 400));
        }
    },
    remove: async (req, res) => {
        try {
            await inventory_service_1.inventoryItemService.remove(req.params.id, req.user);
            apiResponse_1.ApiResponse.send(res, apiResponse_1.ApiResponse.success(null, "Inventory item deleted successfully"));
        }
        catch (error) {
            apiResponse_1.ApiResponse.send(res, new apiResponse_1.ApiResponse(false, error.message, null, 400));
        }
    },
};
// --- Supplier Controller ---
exports.supplierController = {
    create: async (req, res) => {
        try {
            const supplier = await inventory_service_1.supplierService.create(req.body, req.user);
            apiResponse_1.ApiResponse.send(res, apiResponse_1.ApiResponse.success(supplier, "Supplier created successfully", 201));
        }
        catch (error) {
            apiResponse_1.ApiResponse.send(res, new apiResponse_1.ApiResponse(false, error.message, null, 400));
        }
    },
    list: async (req, res) => {
        try {
            const suppliers = await inventory_service_1.supplierService.list(req.user, req.query);
            apiResponse_1.ApiResponse.send(res, apiResponse_1.ApiResponse.success(suppliers, "Suppliers retrieved successfully"));
        }
        catch (error) {
            apiResponse_1.ApiResponse.send(res, new apiResponse_1.ApiResponse(false, error.message, null, 400));
        }
    },
    get: async (req, res) => {
        try {
            const supplier = await inventory_service_1.supplierService.get(req.params.id, req.user);
            if (!supplier)
                throw apiResponse_1.ApiError.notFound("Supplier not found");
            apiResponse_1.ApiResponse.send(res, apiResponse_1.ApiResponse.success(supplier, "Supplier retrieved successfully"));
        }
        catch (error) {
            apiResponse_1.ApiResponse.send(res, new apiResponse_1.ApiResponse(false, error.message, null, 400));
        }
    },
    update: async (req, res) => {
        try {
            const supplier = await inventory_service_1.supplierService.update(req.params.id, req.body, req.user);
            apiResponse_1.ApiResponse.send(res, apiResponse_1.ApiResponse.success(supplier, "Supplier updated successfully"));
        }
        catch (error) {
            apiResponse_1.ApiResponse.send(res, new apiResponse_1.ApiResponse(false, error.message, null, 400));
        }
    },
    remove: async (req, res) => {
        try {
            await inventory_service_1.supplierService.remove(req.params.id, req.user);
            apiResponse_1.ApiResponse.send(res, apiResponse_1.ApiResponse.success(null, "Supplier deleted successfully"));
        }
        catch (error) {
            apiResponse_1.ApiResponse.send(res, new apiResponse_1.ApiResponse(false, error.message, null, 400));
        }
    },
    addProduct: async (req, res) => {
        try {
            const { supplierId } = req.params;
            const { inventoryItemId, ...supplierProductData } = req.body;
            const supplierProduct = await inventory_service_1.supplierService.addProductToSupplier(supplierId, inventoryItemId, supplierProductData, req.user);
            apiResponse_1.ApiResponse.send(res, apiResponse_1.ApiResponse.success(supplierProduct, "Product added to supplier successfully", 201));
        }
        catch (error) {
            apiResponse_1.ApiResponse.send(res, new apiResponse_1.ApiResponse(false, error.message, null, 400));
        }
    },
    getProducts: async (req, res) => {
        try {
            const { supplierId } = req.params;
            const products = await inventory_service_1.supplierService.getSupplierProducts(supplierId, req.user);
            apiResponse_1.ApiResponse.send(res, apiResponse_1.ApiResponse.success(products, "Supplier products retrieved successfully"));
        }
        catch (error) {
            apiResponse_1.ApiResponse.send(res, new apiResponse_1.ApiResponse(false, error.message, null, 400));
        }
    },
    updateProduct: async (req, res) => {
        try {
            const { supplierProductId } = req.params;
            const supplierProduct = await inventory_service_1.supplierService.updateSupplierProduct(supplierProductId, req.body, req.user);
            apiResponse_1.ApiResponse.send(res, apiResponse_1.ApiResponse.success(supplierProduct, "Supplier product updated successfully"));
        }
        catch (error) {
            apiResponse_1.ApiResponse.send(res, new apiResponse_1.ApiResponse(false, error.message, null, 400));
        }
    },
    removeProduct: async (req, res) => {
        try {
            const { supplierProductId } = req.params;
            await inventory_service_1.supplierService.removeSupplierProduct(supplierProductId, req.user);
            apiResponse_1.ApiResponse.send(res, apiResponse_1.ApiResponse.success(null, "Supplier product removed successfully"));
        }
        catch (error) {
            apiResponse_1.ApiResponse.send(res, new apiResponse_1.ApiResponse(false, error.message, null, 400));
        }
    },
};
//# sourceMappingURL=inventory.controller.js.map