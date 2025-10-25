import Joi from "joi";

// --- MenuCategory ---
export const createCategorySchema = Joi.object({
  name: Joi.string().required(),
  description: Joi.string().allow(""),
  imageUrl: Joi.string().uri().optional(),
  isActive: Joi.boolean().default(true),
  branchId: Joi.string().optional().allow(null), // Allow null for global categories
  branchName: Joi.string().optional(),
  restaurantId: Joi.string().optional(),
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
  branchId: Joi.string().optional().allow(null), // Allow null for global items
  branchName: Joi.string().optional(),
  restaurantId: Joi.string().optional(),
  tags: Joi.array().items(Joi.string()).optional(),
  // Modifiers field for many-to-many relationship
  modifiers: Joi.object({
    connect: Joi.array().items(
      Joi.object({
        id: Joi.string().required()
      })
    )
  }).optional(),
  // Ingredients field for many-to-many relationship
  ingredients: Joi.object({
    create: Joi.array().items(
      Joi.object({
        inventoryItemId: Joi.string().optional(),
        quantity: Joi.number().min(0.01).optional(),
        unit: Joi.string().optional()
      })
    )
  }).optional(),
  createdAt:Joi.string().optional().allow(null),
  updatedAt:Joi.string().optional().allow(null)
});


export const updateMenuItemSchema = createMenuItemSchema.fork(
  Object.keys(createMenuItemSchema.describe().keys),
  (field) => field.optional()
);

// --- Modifier ---
export const createModifierSchema = Joi.object({
  name: Joi.string().required(),
  description: Joi.string().allow("").optional(),
  price: Joi.number().min(0).required(),
  isRequired: Joi.boolean().default(false),
  isActive: Joi.boolean().default(true),
  type: Joi.string().valid('SINGLE', 'MULTIPLE').default('SINGLE'),
  minSelection: Joi.number().min(0).default(0).optional(),
  maxSelection: Joi.number().min(1).default(1).optional(),
  restaurantId: Joi.string().allow('').optional(),
  restaurantName: Joi.string().allow('').optional(),
  branchId: Joi.string().optional().allow(null), // Allow null for global modifiers
  branchName: Joi.string().allow('').optional(),

  modifierIngredients: Joi.object({
    create: Joi.array().items(
      Joi.object({
        inventoryItemId: Joi.string().required(),
        quantity: Joi.number().min(0.01).required(),
        unit: Joi.string().required()
      })
    )
  }).optional(),
});


export const updateModifierSchema = createModifierSchema.fork(
  Object.keys(createModifierSchema.describe().keys),
  (field) => field.optional()
);