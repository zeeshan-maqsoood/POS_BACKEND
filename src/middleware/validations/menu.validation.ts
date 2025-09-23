import Joi from "joi";

// --- MenuCategory ---
export const createCategorySchema = Joi.object({
  name: Joi.string().required(),
  description: Joi.string().allow(""),
  imageUrl: Joi.string().uri().optional(),
  isActive: Joi.boolean().default(true),
  branchName: Joi.string().optional(),
});

export const updateCategorySchema = createCategorySchema.fork(
  Object.keys(createCategorySchema.describe().keys),
  (field) => field.optional()
);

// --- MenuItem ---
export const createMenuItemSchema = Joi.object({
  name: Joi.string().required(),
  description: Joi.string().allow(""),
  imageUrl: Joi.string().uri().optional(),
  price: Joi.number().required(),
  cost: Joi.number().optional(),
  taxRate: Joi.number().required(),
  taxExempt: Joi.boolean().default(false),
  isActive: Joi.boolean().default(true),
  categoryId: Joi.string().required(),
  branchName: Joi.string().optional(),
  // modifiers: Joi.array().items(Joi.string()).optional(),
  tags: Joi.array().items(Joi.string()).optional(),
});

export const updateMenuItemSchema = createMenuItemSchema.fork(
  Object.keys(createMenuItemSchema.describe().keys),
  (field) => field.optional()
);

// --- Modifier ---
export const createModifierSchema = Joi.object({
  name: Joi.string().required(),
  description: Joi.string().allow(""),
  type: Joi.string().valid("SINGLE", "MULTIPLE", "QUANTITY").default("SINGLE"),
  isRequired: Joi.boolean().default(false),
  isActive: Joi.boolean().default(true),
  minSelection: Joi.number().integer().min(0).default(0),
  maxSelection: Joi.number().integer().min(1).default(1),
  options: Joi.array().items(
    Joi.object({
      id: Joi.string().optional(),
      name: Joi.string().required(),
      price: Joi.number().min(0).default(0),
      isDefault: Joi.boolean().default(false),
      isActive: Joi.boolean().default(true),
    })
  ).min(1).required()
});


export const updateModifierSchema = createModifierSchema.fork(
  Object.keys(createModifierSchema.describe().keys),
  (field) => field.optional()
);