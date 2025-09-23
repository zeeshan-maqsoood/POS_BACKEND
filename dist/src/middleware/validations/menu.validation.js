"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateModifierSchema = exports.createModifierSchema = exports.updateMenuItemSchema = exports.createMenuItemSchema = exports.updateCategorySchema = exports.createCategorySchema = void 0;
const joi_1 = __importDefault(require("joi"));
// --- MenuCategory ---
exports.createCategorySchema = joi_1.default.object({
    name: joi_1.default.string().required(),
    description: joi_1.default.string().allow(""),
    imageUrl: joi_1.default.string().uri().optional(),
    isActive: joi_1.default.boolean().default(true),
    branchName: joi_1.default.string().optional(),
});
exports.updateCategorySchema = exports.createCategorySchema.fork(Object.keys(exports.createCategorySchema.describe().keys), (field) => field.optional());
// --- MenuItem ---
exports.createMenuItemSchema = joi_1.default.object({
    name: joi_1.default.string().required(),
    description: joi_1.default.string().allow(""),
    imageUrl: joi_1.default.string().uri().optional(),
    price: joi_1.default.number().required(),
    cost: joi_1.default.number().optional(),
    taxRate: joi_1.default.number().required(),
    taxExempt: joi_1.default.boolean().default(false),
    isActive: joi_1.default.boolean().default(true),
    categoryId: joi_1.default.string().required(),
    branchName: joi_1.default.string().optional(),
    // modifiers: Joi.array().items(Joi.string()).optional(),
    tags: joi_1.default.array().items(joi_1.default.string()).optional(),
});
exports.updateMenuItemSchema = exports.createMenuItemSchema.fork(Object.keys(exports.createMenuItemSchema.describe().keys), (field) => field.optional());
// --- Modifier ---
exports.createModifierSchema = joi_1.default.object({
    name: joi_1.default.string().required(),
    description: joi_1.default.string().allow(""),
    type: joi_1.default.string().valid("SINGLE", "MULTIPLE", "QUANTITY").default("SINGLE"),
    isRequired: joi_1.default.boolean().default(false),
    isActive: joi_1.default.boolean().default(true),
    minSelection: joi_1.default.number().integer().min(0).default(0),
    maxSelection: joi_1.default.number().integer().min(1).default(1),
    options: joi_1.default.array().items(joi_1.default.object({
        id: joi_1.default.string().optional(),
        name: joi_1.default.string().required(),
        price: joi_1.default.number().min(0).default(0),
        isDefault: joi_1.default.boolean().default(false),
        isActive: joi_1.default.boolean().default(true),
    })).min(1).required()
});
exports.updateModifierSchema = exports.createModifierSchema.fork(Object.keys(exports.createModifierSchema.describe().keys), (field) => field.optional());
//# sourceMappingURL=menu.validation.js.map