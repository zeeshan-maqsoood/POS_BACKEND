import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

// --- MenuCategory ---
export const categoryService = {
  async create(data: any, user?: any) {
    console.log(data,"data")
    console.log(user,"menuUser")

    // For managers, set their branch if not provided
    if (user?.role === 'MANAGER' && user?.branch && !data.branchId) {
      // Normalize the branch name before storing
      const normalizedUserBranch = user.branch.startsWith('branch')
        ? user.branch.replace('branch1', 'Main Branch')
          .replace('branch2', 'Downtown Branch')
          .replace('branch3', 'Uptown Branch')
          .replace('branch4', 'Westside Branch')
          .replace('branch5', 'Eastside Branch')
        : user.branch;
      data.branchId = normalizedUserBranch;
    }
    // For admins, allow creation of global categories (no branchId) or require branch if specified
    else if (user?.role === 'ADMIN' && !data.branchId) {
      // Global categories are allowed for admins - no error thrown
      console.log('Admin creating global category (no branch specified)');
    }

    // Handle restaurantId for admins
    if (user?.role === 'ADMIN' && data.restaurantId) {
      // Verify the restaurant exists
      const restaurant = await prisma.restaurant.findUnique({
        where: { id: data.restaurantId }
      });
      if (!restaurant) {
        throw new Error('Restaurant not found');
      }
    }

    return prisma.menuCategory.create({
      data,
      include: {
        menuItems: true,
        branch: true
      }
    });
  },

  async list(user?: any, queryParams?: any) {
    const where: any = {};

    console.log('CategoryService.list called with:', {
      userRole: user?.role,
      userBranch: user?.branch,
      queryParams: queryParams
    });

    let normalizedUserBranch = null;

    // For managers, only show categories from their branch
    if (user?.role === 'MANAGER' && user?.branch) {
      // Handle both old branch format (branch1, branch2, etc.) and new format (Uptown Branch, etc.)
      normalizedUserBranch = user.branch.startsWith('branch')
        ? user.branch.replace('branch1', 'Main Branch')
          .replace('branch2', 'Downtown Branch')
          .replace('branch3', 'Uptown Branch')
          .replace('branch4', 'Westside Branch')
          .replace('branch5', 'Eastside Branch')
        : user.branch;

      where.branchId = normalizedUserBranch;
      console.log('Filtering categories by branch:', user.branch, '->', normalizedUserBranch);
    }
    // Admins see all categories

    // If branchId is provided as a query parameter, filter by it
    if (queryParams?.branchId) {
      if (queryParams.branchId === 'global' || queryParams.branchId === 'null') {
        where.branchId = null;
        console.log('Filtering by global categories (null branchId)');
      } else {
        where.branchId = queryParams.branchId;
        console.log('Filtering by branchId:', queryParams.branchId);
      }
    }

    console.log('Final where clause for categories:', where);

    const categories = await prisma.menuCategory.findMany({
      where,
      include: {
        menuItems: true,
        branch: true
      }
    });

    console.log('Found categories:', categories.length);
    console.log('Categories with branches:', categories.map(category => ({
      id: category.id,
      name: category.name,
      branchName: category.branchName
    })));

    return categories;
  },

  async get(id: string, user?: any) {
    const where: any = { id };
console.log(user,"menuUser")
    // For managers, only allow access to their branch's categories
    if (user?.role === 'MANAGER' && user?.branch) {
      // Normalize the user's branch name
      const normalizedUserBranch = user.branch.startsWith('branch')
        ? user.branch.replace('branch1', 'Main Branch')
          .replace('branch2', 'Downtown Branch')
          .replace('branch3', 'Uptown Branch')
          .replace('branch4', 'Westside Branch')
          .replace('branch5', 'Eastside Branch')
        : user.branch;

      where.branchId = normalizedUserBranch;
    }
    // Admins can access any category

    return prisma.menuCategory.findUnique({
      where,
      include: {
        menuItems: true,
        branch: true
      }
    });
  },

  async update(id: string, data: any, user?: any) {
    console.log(user,"menuUser")
    // First verify the category exists and user has access
    const existing = await prisma.menuCategory.findUnique({
      where: { id },
      include: {
        branch: true
      }
    });

    if (!existing) {
      throw new Error('Category not found');
    }

    // For managers, verify they can only update their branch's categories
    if (user?.role === 'MANAGER' && user?.branch) {
      // Normalize the user's branch name
      const normalizedUserBranch = user.branch.startsWith('branch')
        ? user.branch.replace('branch1', 'Main Branch')
          .replace('branch2', 'Downtown Branch')
          .replace('branch3', 'Uptown Branch')
          .replace('branch4', 'Westside Branch')
          .replace('branch5', 'Eastside Branch')
        : user.branch;

      if (existing.branchId !== normalizedUserBranch) {
        throw new Error('You do not have permission to update this category');
      }
      // Prevent changing the branch
      if (data.branchId && data.branchId !== normalizedUserBranch) {
        throw new Error('You cannot change the branch of a category');
      }
    }
    // Admins can update any category

    // Handle restaurantId validation for admins
    if (user?.role === 'ADMIN' && data.restaurantId) {
      // Verify the restaurant exists
      const restaurant = await prisma.restaurant.findUnique({
        where: { id: data.restaurantId }
      });
      if (!restaurant) {
        throw new Error('Restaurant not found');
      }
    }

    return prisma.menuCategory.update({
      where: { id },
      data,
      include: {
        menuItems: true
      }
    });
  },

  async remove(id: string, user?: any) {
    console.log(user,"user")
    // First verify the category exists and the user has access to it
    const existing = await prisma.menuCategory.findUnique({
      where: { id },
      include: {
        menuItems: true,
        branch: true
      }
    });

    if (!existing) {
      throw new Error('Category not found');
    }

    // For managers, verify they can only delete their branch's categories
    if (user?.role === 'MANAGER' && user?.branch) {
      const normalizedUserBranch = user.branch.startsWith('branch')
        ? user.branch.replace('branch1', 'Main Branch')
          .replace('branch2', 'Downtown Branch')
          .replace('branch3', 'Uptown Branch')
          .replace('branch4', 'Westside Branch')
          .replace('branch5', 'Eastside Branch')
        : user.branch;

      if (existing.branchId !== normalizedUserBranch) {
        throw new Error('You do not have permission to delete this category');
      }
    }
    // Admins can delete any category

    // Prevent deleting categories with menu items
    if (existing.menuItems.length > 0) {
      throw new Error('Cannot delete category with active menu items');
    }

    return prisma.menuCategory.delete({
      where: { id }
    });
  },
};

// --- MenuItem ---
export const menuItemService = {
  async create(data: any, user?: any) {
    const { modifiers, ingredients, ...itemData } = data;
console.log(data,"data")
    // Handle branch assignment for managers and admins
    if (user?.role === 'MANAGER' && user?.branch && !itemData.branchId) {
      // For managers, find their branch by name and get the ID
      const normalizedUserBranch = user.branch.startsWith('branch')
        ? user.branch.replace('branch1', 'Main Branch')
          .replace('branch2', 'Downtown Branch')
          .replace('branch3', 'Uptown Branch')
          .replace('branch4', 'Westside Branch')
          .replace('branch5', 'Eastside Branch')
        : user.branch;

      const branch = await prisma.branch.findFirst({
        where: { name: normalizedUserBranch }
      });

      if (branch) {
        itemData.branchId = branch.id;
      } else {
        // If manager's branch doesn't exist, allow creation without branchId
        console.log(`Manager's branch '${normalizedUserBranch}' not found, creating item without branch assignment`);
      }
    }
    else if (user?.role === 'ADMIN' && !itemData.branchId && !itemData.branchName) {
      // For admins, allow creation of global items (no branchId) or require branch if specified
      // Global items are allowed for admins - no error thrown
      console.log('Admin creating global menu item (no branch specified)');
    }
    // For admins, if branchName is provided instead of branchId, look it up
    else if (user?.role === 'ADMIN' && itemData.branchName && !itemData.branchId) {
      const branch = await prisma.branch.findFirst({
        where: { name: itemData.branchName }
      });

      if (!branch) {
        throw new Error(`Branch '${itemData.branchName}' not found`);
      }

      itemData.branchId = branch.id;
      delete itemData.branchName; // Remove branchName as it's not a valid field
    }

    const createData: any = { ...itemData };

    // Handle modifiers
    if (modifiers && modifiers.connect) {
      createData.modifiers = {
        create: modifiers.connect.map(({ id }: { id: string }) => ({
          modifier: { connect: { id } }
        }))
      };
    }

    // Handle ingredients
    if (ingredients && ingredients.create) {
      createData.menuItemIngredients = {
        create: ingredients.create.map((ing: any) => ({
          inventoryItem: { connect: { id: ing.inventoryItemId } },
          quantity: ing.quantity,
          unit: ing.unit
        }))
      };
    }

    return prisma.menuItem.create({
      data: createData,
      include: {
        category: true,
        modifiers: { include: { modifier: true } },
        menuItemIngredients: { include: { inventoryItem: true } }
      },
    });
  },

  async list(user?: any, queryParams?: any) {
    const where: any = {};

    console.log('MenuItemService.list called with:', {
      userRole: user?.role,
      userBranch: user?.branch,
      queryParams: queryParams
    });

    // For managers, only show items from their branch
    if (user?.role === 'MANAGER' && user?.branch) {
      // Handle both old branch format (branch1, branch2, etc.) and new format (Uptown Branch, etc.)
      const normalizedUserBranch = user.branch.startsWith('branch')
        ? user.branch.replace('branch1', 'Main Branch')
          .replace('branch2', 'Downtown Branch')
          .replace('branch3', 'Uptown Branch')
          .replace('branch4', 'Westside Branch')
          .replace('branch5', 'Eastside Branch')
        : user.branch;

      // Find the branch by name to get its ID
      const branch = await prisma.branch.findFirst({
        where: { name: normalizedUserBranch }
      });

      if (branch) {
        where.branchId = branch.id;
        console.log('Filtering menu items by branch:', user.branch, '->', normalizedUserBranch, '->', branch.id);
      } else {
        console.log('Manager branch not found:', normalizedUserBranch, '- showing items without branch assignment');
        // If manager's branch doesn't exist, show only items without branchId
        where.branchId = null;
      }
    }
    // Admins see all items

    // If restaurantId is provided as a query parameter, filter by it
    if (queryParams?.restaurantId) {
      // For restaurant filtering, we need to filter menu items where their branch belongs to the restaurant
      // We'll do this by first finding branches that belong to the restaurant, then filtering menu items by those branch IDs
      const restaurantBranches = await prisma.branch.findMany({
        where: { restaurantId: queryParams.restaurantId },
        select: { id: true }
      });

      const branchIds = restaurantBranches.map(b => b.id);

      if (branchIds.length > 0) {
        // Include both branch-specific items and global items (null branchId)
        where.branchId = { in: [...branchIds, null] };
      } else {
        // If no branches found for the restaurant, only show global items
        where.branchId = null;
      }

      console.log('Filtering by restaurantId:', queryParams.restaurantId, 'found branchIds:', branchIds);
    }

    // If branchId is provided as a query parameter, filter by it
    if (queryParams?.branchId) {
      if (queryParams.branchId === 'global' || queryParams.branchId === 'null') {
        where.branchId = null;
        console.log('Filtering by global menu items (null branchId)');
      } else {
        where.branchId = queryParams.branchId;
        console.log('Filtering by branchId:', queryParams.branchId);
      }
    }

    // If categoryId is provided as a query parameter, filter by it
    if (queryParams?.categoryId) {
      where.categoryId = queryParams.categoryId;
      console.log('Filtering by categoryId:', queryParams.categoryId);
    }

    // Also check for null branchId items if no specific branch is requested
    // This is for items that might not have a branch assigned yet
    if (!where.branchId && user?.role === 'MANAGER') {
      console.log('Manager has no branch, showing items without branchId');
      // For managers without a branch, show only items without branchId
      where.branchId = null;
    }

    console.log('Final where clause:', where);

    const items = await prisma.menuItem.findMany({
      where: where,
      include: {
        category: true,
       modifiers:{
        include:{
          modifier:true
        }
       },
       menuItemIngredients:true,
       branch: true
      },
    });

    console.log('Found menu items:', items.length);
    console.log('Menu items with branches:', items.map(item => ({
      id: item.id,
      name: item.name,
      branchId: item.branchId
    })));

    const transformedItems = items.map(item => ({
      ...item,
      modifiers: item.modifiers.map(m => ({
        ...m.modifier,
        menuItemModifierId: m.id  // Keep the join table ID if needed
      })),
      // Include branch information for frontend display
      branch: item.branch || null
    }));
    return transformedItems;
  },

  async get(id: string, user?: any) {
    const where: any = { id };
    console.log('MenuItem get called with id:', id);

    // For managers, only allow access to items from their branch
    if (user?.role === 'MANAGER' && user?.branch) {
      // Normalize the user's branch name
      const normalizedUserBranch = user.branch.startsWith('branch')
        ? user.branch.replace('branch1', 'Main Branch')
          .replace('branch2', 'Downtown Branch')
          .replace('branch3', 'Uptown Branch')
          .replace('branch4', 'Westside Branch')
          .replace('branch5', 'Eastside Branch')
        : user.branch;

      // Find the branch by name to get its ID
      const branch = await prisma.branch.findFirst({
        where: { name: normalizedUserBranch }
      });

      if (branch) {
        where.branchId = branch.id;
      } else {
        // If manager's branch doesn't exist, allow access to items without branchId
        where.branchId = null;
      }
    }
    // Admins can access any item

    const result = await prisma.menuItem.findUnique({
      where,
      include: {
        category: true,
        modifiers:{
          include:{
            modifier:true
          }
        },
        menuItemIngredients:true,
        branch: true,
        restaurant:true
      },
    });

    console.log('MenuItem query result:', result);
    return result;
  },

//   async update(id: string, data: any, user?: any) {
//     const { modifiers, ...itemData } = data;
//     return prisma.menuItem.update({
//     where: { id },
//     data: {
//       ...itemData,
//       ...(modifiers && {
//         modifiers: {
//           deleteMany: {}, // remove old links
  
//           // connect existing modifiers
//           ...(modifiers.connect && {
//             create: modifiers.connect.map((m: any) => ({
//               modifier: {
//                 connect: { id: m.id }
//               }
//             }))
//           }),
  
//           // create new modifiers + link
//           ...(modifiers.create && {
//             create: modifiers.create.map((m: any) => ({
//               modifier: {
//                 create: {
//                   name: m.name,
//                   description: m.description,
//                   price: m.price,
//                   type: m.type ?? "SINGLE",
//                   isRequired: m.isRequired ?? false,
//                   isActive: m.isActive ?? true,
//                 }
//               }
//             }))
//           }),
//         },
//       }),
//     },
//     include: {
//       category: true,
//       modifiers: { include: { modifier: true } },
//     },
//   })    
// },

async update(id: string, data: any, user?: any) {
  const { modifiers, ingredients, ...itemData } = data;
  
  const updateData: any = { ...itemData };

  // Handle modifiers
  if (modifiers) {
    updateData.modifiers = {
      deleteMany: {},
      ...(modifiers.connect && {
        create: modifiers.connect.map(({ id }: { id: string }) => ({
          modifier: { connect: { id } }
        }))
      })
    };
  }

  // Handle ingredients
  if (ingredients) {
    updateData.menuItemIngredients = {
      deleteMany: {},
      ...(ingredients.create && {
        create: ingredients.create.map((ing: any) => ({
          inventoryItem: { connect: { id: ing.inventoryItemId } },
          quantity: ing.quantity,
          unit: ing.unit
        }))
      })
    };
  }

  return prisma.menuItem.update({
    where: { id },
    data: updateData,
    include: {
      category: true,
      modifiers: { include: { modifier: true } },
      menuItemIngredients: { include: { inventoryItem: true } },
      branch: true,
      restaurant: true
    },
  });
},

async remove(id: string, user?: any) {
  // First verify the item exists and the user has access to it
  const existingItem = await prisma.menuItem.findUnique({
    where: { id },
    select: { branchId: true }
  });

  if (!existingItem) {
    throw new Error('Menu item not found');
  }

  // For managers, ensure they can only delete items from their branch
  if (user?.role === 'MANAGER' && user?.branch) {
    // Normalize the user's branch name
    const normalizedUserBranch = user.branch.startsWith('branch')
      ? user.branch.replace('branch1', 'Main Branch')
        .replace('branch2', 'Downtown Branch')
        .replace('branch3', 'Uptown Branch')
        .replace('branch4', 'Westside Branch')
        .replace('branch5', 'Eastside Branch')
      : user.branch;

    // Find the branch by name to get its ID for comparison
    const branch = await prisma.branch.findFirst({
      where: { name: normalizedUserBranch }
    });

    if (branch && existingItem.branchId !== branch.id) {
      throw new Error('You do not have permission to delete this menu item');
    }
    // If manager's branch doesn't exist, they can only delete items without a branch
    else if (!branch && existingItem.branchId !== null) {
      throw new Error('You do not have permission to delete this menu item');
    }
  }
  // Admins can delete any item

  return prisma.menuItem.delete({ where: { id } });
},
};

// --- Modifier ---
export const modifierService = {
  async create(data: any, user?: any) {
    const { modifierIngredients, ...modifierData } = data;
    
    // Handle restaurant and branch assignment for managers and admins
    if (user?.role === 'MANAGER' && user?.branch && !modifierData.restaurantId) {
      // For managers, find their restaurant and branch by name and get the IDs
      const normalizedUserBranch = user.branch.startsWith('branch')
        ? user.branch.replace('branch1', 'Main Branch')
          .replace('branch2', 'Downtown Branch')
          .replace('branch3', 'Uptown Branch')
          .replace('branch4', 'Westside Branch')
          .replace('branch5', 'Eastside Branch')
        : user.branch;

      const branch = await prisma.branch.findFirst({
        where: { name: normalizedUserBranch }
      });

      if (branch) {
        modifierData.restaurantId = branch.restaurantId;
        modifierData.branchId = branch.id;
      } else {
        // If manager's branch doesn't exist, allow creation without restaurant/branch (global modifier)
        console.log(`Manager's branch '${normalizedUserBranch}' not found, creating global modifier`);
      }
    }
    else if (user?.role === 'ADMIN' && !modifierData.restaurantId && !modifierData.branchId) {
      // For admins, if no restaurant or branch is specified, throw an error
      throw new Error('Restaurant or Branch is required when creating modifiers as admin');
    }

    // Handle global selection (frontend sends 'global' string, backend should treat as null)
    if (modifierData.restaurantId === 'global') {
      modifierData.restaurantId = null;
    }
    if (modifierData.branchId === 'global') {
      modifierData.branchId = null;
    }

    // For admins, if restaurantName is provided instead of restaurantId, look it up
    else if (user?.role === 'ADMIN' && modifierData.restaurantName && !modifierData.restaurantId) {
      const restaurant = await prisma.restaurant.findFirst({
        where: { name: modifierData.restaurantName }
      });

      if (!restaurant) {
        throw new Error(`Restaurant '${modifierData.restaurantName}' not found`);
      }

      modifierData.restaurantId = restaurant.id;
      delete modifierData.restaurantName; // Remove restaurantName as it's not a valid field
    }
    // For admins, if branchName is provided instead of branchId, look it up
    else if (user?.role === 'ADMIN' && modifierData.branchName && !modifierData.branchId && modifierData.restaurantId) {
      const branch = await prisma.branch.findFirst({
        where: {
          name: modifierData.branchName,
          restaurantId: modifierData.restaurantId
        }
      });

      if (!branch) {
        throw new Error(`Branch '${modifierData.branchName}' not found in selected restaurant`);
      }

      modifierData.branchId = branch.id;
      delete modifierData.branchName; // Remove branchName as it's not a valid field
    }

    const createData: any = { ...modifierData };
    
    // Handle ingredients
    if (modifierIngredients && modifierIngredients.create) {
      createData.modifierIngredients = {
        create: modifierIngredients.create.map((ing: any) => ({
          inventoryItem: { connect: { id: ing.inventoryItemId } },
          quantity: ing.quantity,
          unit: ing.unit
        }))
      };
    }

    return prisma.modifier.create({
      data: createData,
      include: {
        modifierIngredients: { include: { inventoryItem: true } },
        restaurant: true,
        branch: true
      }
    });
  },

  async list(user?: any, queryParams?: any) {
    const where: any = {};

    console.log('ModifierService.list called with:', {
      userRole: user?.role,
      userBranch: user?.branch,
      queryParams: queryParams
    });

    // For managers, only show modifiers from their restaurant/branch (or global modifiers)
    if (user?.role === 'MANAGER' && user?.branch) {
      // Handle both old branch format (branch1, branch2, etc.) and new format (Uptown Branch, etc.)
      const normalizedUserBranch = user.branch.startsWith('branch')
        ? user.branch.replace('branch1', 'Main Branch')
          .replace('branch2', 'Downtown Branch')
          .replace('branch3', 'Uptown Branch')
          .replace('branch4', 'Westside Branch')
          .replace('branch5', 'Eastside Branch')
        : user.branch;

      // Find the branch by name to get its ID and restaurant
      const branch = await prisma.branch.findFirst({
        where: { name: normalizedUserBranch }
      });

      if (branch) {
        // Show modifiers from this restaurant/branch or global modifiers (null restaurantId/branchId)
        where.OR = [
          { restaurantId: branch.restaurantId, branchId: branch.id },
          { restaurantId: branch.restaurantId, branchId: null },
          { restaurantId: null, branchId: null }
        ];
        console.log('Filtering modifiers by restaurant/branch:', branch.restaurantId, branch.id);
      } else {
        console.log('Manager branch not found:', normalizedUserBranch, '- showing global modifiers only');
        // If manager's branch doesn't exist, show only global modifiers
        where.restaurantId = null;
        where.branchId = null;
      }
    }
    // Admins see all modifiers

    // If restaurantId is provided as a query parameter, filter by it
    if (queryParams?.restaurantId) {
      where.restaurantId = queryParams.restaurantId;
      console.log('Filtering by restaurantId:', queryParams.restaurantId);
    }

    // If branchId is provided as a query parameter, filter by it
    if (queryParams?.branchId) {
      where.branchId = queryParams.branchId;
      console.log('Filtering by branchId:', queryParams.branchId);
    }

    console.log('Final where clause for modifiers:', where);

    return prisma.modifier.findMany({
      where,
      include: {
        modifierIngredients: { include: { inventoryItem: true } },
        restaurant: true,
        branch: true
      }
    });
  },

  async get(id: string, user?: any) {
    const where: any = { id };
    console.log('Modifier get called with id:', id);

    // For managers, only allow access to modifiers from their restaurant/branch (or global modifiers)
    if (user?.role === 'MANAGER' && user?.branch) {
      // Normalize the user's branch name
      const normalizedUserBranch = user.branch.startsWith('branch')
        ? user.branch.replace('branch1', 'Main Branch')
          .replace('branch2', 'Downtown Branch')
          .replace('branch3', 'Uptown Branch')
          .replace('branch4', 'Westside Branch')
          .replace('branch5', 'Eastside Branch')
        : user.branch;

      // Find the branch by name to get its ID and restaurant
      const branch = await prisma.branch.findFirst({
        where: { name: normalizedUserBranch }
      });

      if (branch) {
        // Only allow access to modifiers from this restaurant/branch or global modifiers
        where.OR = [
          { restaurantId: branch.restaurantId, branchId: branch.id },
          { restaurantId: branch.restaurantId, branchId: null },
          { restaurantId: null, branchId: null }
        ];
      } else {
        // If manager's branch doesn't exist, only allow global modifiers
        where.restaurantId = null;
        where.branchId = null;
      }
    }
    // Admins can access any modifier

    return prisma.modifier.findUnique({
      where,
      include: {
        modifierIngredients: { include: { inventoryItem: true } },
        restaurant: true,
        branch: true
      }
    });
  },

  async update(id: string, data: any, user?: any) {
    const { modifierIngredients, ...modifierData } = data;

    // First verify the modifier exists and user has access
    const existing = await prisma.modifier.findUnique({
      where: { id },
      include: {
        restaurant: true,
        branch: true
      }
    });

    if (!existing) {
      throw new Error('Modifier not found');
    }

    // For managers, verify they can only update modifiers from their restaurant/branch (or global modifiers)
    if (user?.role === 'MANAGER' && user?.branch) {
      const normalizedUserBranch = user.branch.startsWith('branch')
        ? user.branch.replace('branch1', 'Main Branch')
          .replace('branch2', 'Downtown Branch')
          .replace('branch3', 'Uptown Branch')
          .replace('branch4', 'Westside Branch')
          .replace('branch5', 'Eastside Branch')
        : user.branch;

      // Find the branch by name to get its ID and restaurant for comparison
      const branch = await prisma.branch.findFirst({
        where: { name: normalizedUserBranch }
      });

      if (branch) {
        // Check if modifier belongs to manager's restaurant/branch or is global
        const hasAccess = (
          (existing.restaurantId === branch.restaurantId && existing.branchId === branch.id) ||
          (existing.restaurantId === branch.restaurantId && existing.branchId === null) ||
          (existing.restaurantId === null && existing.branchId === null)
        );

        if (!hasAccess) {
          throw new Error('You do not have permission to update this modifier');
        }
      } else {
        // If manager's branch doesn't exist, they can only update global modifiers
        if (existing.restaurantId !== null || existing.branchId !== null) {
          throw new Error('You do not have permission to update this modifier');
        }
      }

      // Prevent changing the restaurant/branch
      if (modifierData.restaurantId && modifierData.restaurantId !== existing.restaurantId && modifierData.restaurantId !== 'global') {
        throw new Error('You cannot change the restaurant of a modifier');
      }
      if (modifierData.branchId && modifierData.branchId !== existing.branchId && modifierData.branchId !== 'global') {
        throw new Error('You cannot change the branch of a modifier');
      }
    }
    // Admins can update any modifier

    // Handle global selection (frontend sends 'global' string, backend should treat as null)
    if (modifierData.restaurantId === 'global') {
      modifierData.restaurantId = null;
    }
    if (modifierData.branchId === 'global') {
      modifierData.branchId = null;
    }

    const updateData: any = { ...modifierData };

    // Handle ingredients
    if (modifierIngredients) {
      updateData.modifierIngredients = {
        deleteMany: {},
        ...(modifierIngredients.create && {
          create: modifierIngredients.create.map((ing: any) => ({
            inventoryItem: { connect: { id: ing.inventoryItemId } },
            quantity: ing.quantity,
            unit: ing.unit
          }))
        })
      };
    }

    return prisma.modifier.update({
      where: { id },
      data: updateData,
      include: {
        modifierIngredients: { include: { inventoryItem: true } },
        restaurant: true,
        branch: true
      }
    });
  },

  async remove(id: string, user?: any) {
    // First verify the modifier exists and the user has access to it
    const existing = await prisma.modifier.findUnique({
      where: { id },
      select: { restaurantId: true, branchId: true }
    });

    if (!existing) {
      throw new Error('Modifier not found');
    }

    // For managers, ensure they can only delete modifiers from their restaurant/branch (or global modifiers)
    if (user?.role === 'MANAGER' && user?.branch) {
      // Normalize the user's branch name
      const normalizedUserBranch = user.branch.startsWith('branch')
        ? user.branch.replace('branch1', 'Main Branch')
          .replace('branch2', 'Downtown Branch')
          .replace('branch3', 'Uptown Branch')
          .replace('branch4', 'Westside Branch')
          .replace('branch5', 'Eastside Branch')
        : user.branch;

      // Find the branch by name to get its ID and restaurant for comparison
      const branch = await prisma.branch.findFirst({
        where: { name: normalizedUserBranch }
      });

      if (branch) {
        // Check if modifier belongs to manager's restaurant/branch or is global
        const hasAccess = (
          (existing.restaurantId === branch.restaurantId && existing.branchId === branch.id) ||
          (existing.restaurantId === branch.restaurantId && existing.branchId === null) ||
          (existing.restaurantId === null && existing.branchId === null)
        );

        if (!hasAccess) {
          throw new Error('You do not have permission to delete this modifier');
        }
      } else {
        // If manager's branch doesn't exist, they can only delete global modifiers
        if (existing.restaurantId !== null || existing.branchId !== null) {
          throw new Error('You do not have permission to delete this modifier');
        }
      }
    }
    // Admins can delete any modifier

    return prisma.modifier.delete({ where: { id } });
  },
};