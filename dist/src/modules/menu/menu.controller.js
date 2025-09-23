"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.modifierController = exports.menuItemController = exports.categoryController = void 0;
const menu_service_1 = require("./menu.service");
const apiResponse_1 = require("../../utils/apiResponse");
// --- Category ---
exports.categoryController = {
    create: async (req, res) => {
        try {
            const category = await menu_service_1.categoryService.create(req.body, req.user);
            apiResponse_1.ApiResponse.send(res, apiResponse_1.ApiResponse.success(category, "Category created successfully", 201));
        }
        catch (error) {
            apiResponse_1.ApiResponse.send(res, new apiResponse_1.ApiResponse(false, error.message, null, 400));
        }
    },
    list: async (req, res) => {
        const categories = await menu_service_1.categoryService.list(req.user, req.query);
        apiResponse_1.ApiResponse.send(res, apiResponse_1.ApiResponse.success(categories, "Categories retrieved successfully"));
    },
    get: async (req, res) => {
        const category = await menu_service_1.categoryService.get(req.params.id, req.user);
        if (!category)
            throw apiResponse_1.ApiError.notFound("Category not found");
        apiResponse_1.ApiResponse.send(res, apiResponse_1.ApiResponse.success(category, "Category retrieved successfully"));
    },
    update: async (req, res) => {
        const category = await menu_service_1.categoryService.update(req.params.id, req.body, req.user);
        apiResponse_1.ApiResponse.send(res, apiResponse_1.ApiResponse.success(category, "Category updated successfully"));
    },
    remove: async (req, res) => {
        await menu_service_1.categoryService.remove(req.params.id, req.user);
        apiResponse_1.ApiResponse.send(res, apiResponse_1.ApiResponse.success(null, "Category deleted successfully"));
    },
};
// --- MenuItem ---
exports.menuItemController = {
    create: async (req, res) => {
        console.log(req.body);
        const menuItem = await menu_service_1.menuItemService.create(req.body, req.user);
        apiResponse_1.ApiResponse.send(res, apiResponse_1.ApiResponse.success(menuItem, "Menu item created successfully", 201));
    },
    list: async (req, res) => {
        const items = await menu_service_1.menuItemService.list(req.user, req.query);
        apiResponse_1.ApiResponse.send(res, apiResponse_1.ApiResponse.success(items, "Menu items retrieved successfully"));
    },
    get: async (req, res) => {
        const item = await menu_service_1.menuItemService.get(req.params.id, req.user);
        if (!item)
            throw apiResponse_1.ApiError.notFound("Menu item not found");
        apiResponse_1.ApiResponse.send(res, apiResponse_1.ApiResponse.success(item, "Menu item retrieved successfully"));
    },
    update: async (req, res) => {
        const item = await menu_service_1.menuItemService.update(req.params.id, req.body, req.user);
        apiResponse_1.ApiResponse.send(res, apiResponse_1.ApiResponse.success(item, "Menu item updated successfully"));
    },
    remove: async (req, res) => {
        await menu_service_1.menuItemService.remove(req.params.id, req.user);
        apiResponse_1.ApiResponse.send(res, apiResponse_1.ApiResponse.success(null, "Menu item deleted successfully"));
    },
};
// --- Modifier ---
exports.modifierController = {
    create: async (req, res) => {
        console.log(req.body);
        const modifier = await menu_service_1.modifierService.create(req.body);
        apiResponse_1.ApiResponse.send(res, apiResponse_1.ApiResponse.success(modifier, "Modifier created successfully", 201));
    },
    list: async (_req, res) => {
        const modifiers = await menu_service_1.modifierService.list();
        apiResponse_1.ApiResponse.send(res, apiResponse_1.ApiResponse.success(modifiers, "Modifiers retrieved successfully"));
    },
    get: async (req, res) => {
        const modifier = await menu_service_1.modifierService.get(req.params.id);
        if (!modifier)
            throw apiResponse_1.ApiError.notFound("Modifier not found");
        apiResponse_1.ApiResponse.send(res, apiResponse_1.ApiResponse.success(modifier, "Modifier retrieved successfully"));
    },
    update: async (req, res) => {
        const modifier = await menu_service_1.modifierService.update(req.params.id, req.body);
        apiResponse_1.ApiResponse.send(res, apiResponse_1.ApiResponse.success(modifier, "Modifier updated successfully"));
    },
    remove: async (req, res) => {
        await menu_service_1.modifierService.remove(req.params.id);
        apiResponse_1.ApiResponse.send(res, apiResponse_1.ApiResponse.success(null, "Modifier deleted successfully"));
    },
};
//# sourceMappingURL=menu.controller.js.map