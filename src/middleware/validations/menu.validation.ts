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
  imageUrl: Joi.string().uri().allow('').optional(),
  price: Joi.number().required(),
  cost: Joi.number().optional().default(0),
  taxRate: Joi.number().required(),
  taxExempt: Joi.boolean().default(false),
  isActive: Joi.boolean().default(true),
  categoryId: Joi.string().required(),
  branchName: Joi.string().optional(),
  // Modifiers field for many-to-many relationship
  modifiers: Joi.object({
    connect: Joi.array().items(
      Joi.object({
        id: Joi.string().required()
      })
    )
  }).optional(),
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
  price: Joi.number().min(0).default(0),
  isRequired: Joi.boolean().default(false),
  isActive: Joi.boolean().default(true)
});


export const updateModifierSchema = createModifierSchema.fork(
  Object.keys(createModifierSchema.describe().keys),
  (field) => field.optional()
);