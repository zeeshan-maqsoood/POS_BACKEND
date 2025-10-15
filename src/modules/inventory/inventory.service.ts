import { InventoryStatus, PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

// --- Inventory Category Service ---
export const inventoryCategoryService = {
  async create(data: any, user?: any) {
    console.log(data, "category data");
    console.log(user, "inventory user");

    // For managers, set their branch if not provided
    if (user?.role === 'MANAGER' && user?.branch && !data.branch) {
      const normalizedUserBranch = user.branch.startsWith('branch')
        ? user.branch.replace('branch1', 'Main Branch')
          .replace('branch2', 'Downtown Branch')
          .replace('branch3', 'Uptown Branch')
          .replace('branch4', 'Westside Branch')
          .replace('branch5', 'Eastside Branch')
        : user.branch;
      data.branch = normalizedUserBranch;
    }
    // For admins, if no branch is specified, throw an error
    else if (user?.role === 'ADMIN' && !data.branch) {
      throw new Error('Branch is required when creating inventory categories as admin');
    }
    const payload = {
      name: data.name,
      description: data.description,
      color: data.color,
      branchName: data.branch
    }
    return prisma.inventoryCategory.create({
      data: payload,
      include: {
        subcategories: true,
        items: true
      }
    });
  },

  async list(user?: any, queryParams?: any) {
    const where: any = {};

    console.log('InventoryCategoryService.list called with:', {
      userRole: user?.role,
      userBranch: user?.branch,
      queryParams: queryParams
    });

    let normalizedUserBranch = null;

    // For managers, only show categories from their branch
    if (user?.role === 'MANAGER' && user?.branch) {
      normalizedUserBranch = user.branch.startsWith('branch')
        ? user.branch.replace('branch1', 'Main Branch')
          .replace('branch2', 'Downtown Branch')
          .replace('branch3', 'Uptown Branch')
          .replace('branch4', 'Westside Branch')
          .replace('branch5', 'Eastside Branch')
        : user.branch;

      where.branch = normalizedUserBranch;
    }

    // If branchName is provided as a query parameter, use it for filtering
    if (queryParams?.branchName) {
      const normalizedQueryBranch = queryParams.branchName.startsWith('branch')
        ? queryParams.branchName.replace('branch1', 'Main Branch')
          .replace('branch2', 'Downtown Branch')
          .replace('branch3', 'Uptown Branch')
          .replace('branch4', 'Westside Branch')
          .replace('branch5', 'Eastside Branch')
        : queryParams.branchName;

      where.branch = normalizedQueryBranch;
    }

    const categories = await prisma.inventoryCategory.findMany({
      where,
      include: {
        subcategories: {
          include: {
            _count: {
              select: { items: true }
            }
          }
        },
        _count: {
          select: { items: true }
        }
      }
    });

    // Transform to include itemCount
    return categories.map(category => ({
      ...category,
      itemCount: category._count.items,
      subcategories: category.subcategories.map(sub => ({
        ...sub,
        itemCount: sub._count.items
      }))
    }));
  },

  async get(id: string, user?: any) {
    const where: any = { id };

    if (user?.role === 'MANAGER' && user?.branch) {
      const normalizedUserBranch = user.branch.startsWith('branch')
        ? user.branch.replace('branch1', 'Main Branch')
          .replace('branch2', 'Downtown Branch')
          .replace('branch3', 'Uptown Branch')
          .replace('branch4', 'Westside Branch')
          .replace('branch5', 'Eastside Branch')
        : user.branch;

      where.branchName = normalizedUserBranch;
    }

    const category = await prisma.inventoryCategory.findUnique({
      where,
      include: {
        subcategories: {
          include: {
            _count: {
              select: { items: true }
            }
          }
        },
        _count: {
          select: { items: true }
        }
      }
    });

    if (!category) return null;

    return {
      ...category,
      itemCount: category._count.items,
      subcategories: category.subcategories.map(sub => ({
        ...sub,
        itemCount: sub._count.items
      }))
    };
  },

  async update(id: string, data: any, user?: any) {
    console.log(data, "updatedData")
    // First verify the category exists and user has access
    const existing = await prisma.inventoryCategory.findUnique({
      where: { id },
    });

    if (!existing) {
      throw new Error('Inventory category not found');
    }

    // For managers, verify they can only update their branch's categories
    if (user?.role === 'MANAGER' && user?.branch) {
      const normalizedUserBranch = user.branch.startsWith('branch')
        ? user.branch.replace('branch1', 'Main Branch')
          .replace('branch2', 'Downtown Branch')
          .replace('branch3', 'Uptown Branch')
          .replace('branch4', 'Westside Branch')
          .replace('branch5', 'Eastside Branch')
        : user.branch;

      if (existing.branchName !== normalizedUserBranch) {
        throw new Error('You do not have permission to update this inventory category');
      }
    }

    const { branch, ...updatedData } = data
    const payload = {
      ...updatedData,
      branchName: branch
    }



    return prisma.inventoryCategory.update({
      where: { id },
      data: payload,
      include: {
        subcategories: {
          include: {
            _count: {
              select: { items: true }
            }
          }
        },
        _count: {
          select: { items: true }
        }
      }
    });
  },

  async remove(id: string, user?: any) {
    // First verify the category exists and the user has access to it
    const existing = await prisma.inventoryCategory.findUnique({
      where: { id },
      include: {
        items: true,
        subcategories: {
          include: {
            items: true
          }
        }
      }
    });

    if (!existing) {
      throw new Error('Inventory category not found');
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

      if (existing.branchName !== normalizedUserBranch) {
        throw new Error('You do not have permission to delete this inventory category');
      }
    }

    // Prevent deleting categories with items or subcategories with items
    if (existing.items.length > 0) {
      throw new Error('Cannot delete category with active inventory items');
    }

    // Check if any subcategory has items
    const subcategoriesWithItems = existing.subcategories.filter(sub => sub.items.length > 0);
    if (subcategoriesWithItems.length > 0) {
      throw new Error('Cannot delete category that has subcategories with inventory items');
    }

    // Delete subcategories first (they will be cascade deleted due to schema)
    return prisma.inventoryCategory.delete({
      where: { id }
    });
  },
};

// --- Inventory Subcategory Service ---
export const inventorySubcategoryService = {
  async create(data: any, user?: any) {
    console.log('Creating subcategory with data:', data);
    
    // Prepare the data for Prisma
    const subcategoryData: any = {
      name: data.name,
      description: data.description,
      categoryId: data.categoryId,
    };

    // Handle branch logic - use branchName field
    if (data.branch) {
      // If branch is provided in the form, use it
      subcategoryData.branchName = data.branch;
    } else if (user?.role === 'MANAGER' && user?.branch) {
      // For managers, set their branch if not provided
      const normalizedUserBranch = user.branch.startsWith('branch')
        ? user.branch.replace('branch1', 'Main Branch')
          .replace('branch2', 'Downtown Branch')
          .replace('branch3', 'Uptown Branch')
          .replace('branch4', 'Westside Branch')
          .replace('branch5', 'Eastside Branch')
        : user.branch;
      subcategoryData.branchName = normalizedUserBranch;
    }
    // For admins, if no branch is specified, throw an error
    else if (user?.role === 'ADMIN' && !data.branch) {
      throw new Error('Branch is required when creating inventory subcategories as admin');
    }

    console.log('Final subcategory data:', subcategoryData);

    return prisma.inventorySubcategory.create({
      data: subcategoryData,
      include: {
        category: true,
        _count: {
          select: { items: true }
        }
      }
    });
  },

  async list(user?: any, queryParams?: any) {
    const where: any = {};

    if (user?.role === 'MANAGER' && user?.branch) {
      const normalizedUserBranch = user.branch.startsWith('branch')
        ? user.branch.replace('branch1', 'Main Branch')
          .replace('branch2', 'Downtown Branch')
          .replace('branch3', 'Uptown Branch')
          .replace('branch4', 'Westside Branch')
          .replace('branch5', 'Eastside Branch')
        : user.branch;

      where.branchName = normalizedUserBranch;
    }

    if (queryParams?.categoryId) {
      where.categoryId = queryParams.categoryId;
    }

    const subcategories = await prisma.inventorySubcategory.findMany({
      where,
      include: {
        category: true,
        _count: {
          select: { items: true }
        }
      }
    });

    return subcategories.map(sub => ({
      ...sub,
      itemCount: sub._count.items
    }));
  },

  async get(id: string, user?: any) {
    const where: any = { id };

    if (user?.role === 'MANAGER' && user?.branch) {
      const normalizedUserBranch = user.branch.startsWith('branch')
        ? user.branch.replace('branch1', 'Main Branch')
          .replace('branch2', 'Downtown Branch')
          .replace('branch3', 'Uptown Branch')
          .replace('branch4', 'Westside Branch')
          .replace('branch5', 'Eastside Branch')
        : user.branch;

      where.branchName = normalizedUserBranch;
    }

    const subcategory = await prisma.inventorySubcategory.findUnique({
      where,
      include: {
        category: true,
        _count: {
          select: { items: true }
        }
      }
    });

    if (!subcategory) return null;

    return {
      ...subcategory,
      itemCount: subcategory._count.items
    };
  },

  async update(id: string, data: any, user?: any) {
    const existing = await prisma.inventorySubcategory.findUnique({
      where: { id },
    });

    if (!existing) {
      throw new Error('Inventory subcategory not found');
    }

    if (user?.role === 'MANAGER' && user?.branch) {
      const normalizedUserBranch = user.branch.startsWith('branch')
        ? user.branch.replace('branch1', 'Main Branch')
          .replace('branch2', 'Downtown Branch')
          .replace('branch3', 'Uptown Branch')
          .replace('branch4', 'Westside Branch')
          .replace('branch5', 'Eastside Branch')
        : user.branch;

      if (existing.branchName !== normalizedUserBranch) {
        throw new Error('You do not have permission to update this inventory subcategory');
      }
    }

    // Prepare update data - map branch to branchName
    const updateData: any = {
      name: data.name,
      description: data.description,
    };

    // Only update branchName if branch is provided
    if (data.branch) {
      updateData.branchName = data.branch;
    }

    return prisma.inventorySubcategory.update({
      where: { id },
      data: updateData,
      include: {
        category: true,
        _count: {
          select: { items: true }
        }
      }
    });
  },

  async remove(id: string, user?: any) {
    const existing = await prisma.inventorySubcategory.findUnique({
      where: { id },
      include: {
        items: true
      }
    });

    if (!existing) {
      throw new Error('Inventory subcategory not found');
    }

    if (user?.role === 'MANAGER' && user?.branch) {
      const normalizedUserBranch = user.branch.startsWith('branch')
        ? user.branch.replace('branch1', 'Main Branch')
          .replace('branch2', 'Downtown Branch')
          .replace('branch3', 'Uptown Branch')
          .replace('branch4', 'Westside Branch')
          .replace('branch5', 'Eastside Branch')
        : user.branch;

      if (existing.branchName !== normalizedUserBranch) {
        throw new Error('You do not have permission to delete this inventory subcategory');
      }
    }

    if (existing.items.length > 0) {
      throw new Error('Cannot delete subcategory with active inventory items');
    }

    return prisma.inventorySubcategory.delete({
      where: { id }
    });
  },
};

// --- Inventory Item Service ---
// --- Inventory Item Service ---
export const inventoryItemService = {
  async create(data: any, user?: any) {
    console.log('Creating inventory item with data:', data);
    // For managers, set their branch if not provided
    if (user?.role === 'MANAGER' && user?.branch && !data.branchName) {
      const normalizedUserBranch = user.branch.startsWith('branch')
        ? user.branch.replace('branch1', 'Main Branch')
          .replace('branch2', 'Downtown Branch')
          .replace('branch3', 'Uptown Branch')
          .replace('branch4', 'Westside Branch')
          .replace('branch5', 'Eastside Branch')
        : user.branch;
      data.branchName = normalizedUserBranch;
    }
    // For admins, if no branch is specified, throw an error
    else if (user?.role === 'ADMIN' && !data.branchName) {
      throw new Error('Branch is required when creating inventory items as admin');
    }
  

    return prisma.inventoryItem.create({
      data: {
        ...data,
        lastUpdated: new Date()
      },
      include: {
        category: true,
        subcategory: true
      }
    });
  },

  async list(user?: any, queryParams?: any) {
    const where: any = {};

    if (user?.role === 'MANAGER' && user?.branch) {
      const normalizedUserBranch = user.branch.startsWith('branch')
        ? user.branch.replace('branch1', 'Main Branch')
          .replace('branch2', 'Downtown Branch')
          .replace('branch3', 'Uptown Branch')
          .replace('branch4', 'Westside Branch')
          .replace('branch5', 'Eastside Branch')
        : user.branch;

      where.branchName = normalizedUserBranch;
    }

    if (queryParams?.categoryId) {
      where.categoryId = queryParams.categoryId;
    }

    if (queryParams?.subcategoryId) {
      where.subcategoryId = queryParams.subcategoryId;
    }

    if (queryParams?.status) {
      where.status = queryParams.status;
    }

    return prisma.inventoryItem.findMany({
      where,
      include: {
        category: true,
        subcategory: true
      },
      orderBy: {
        lastUpdated: 'desc'
      }
    });
  },

  async get(id: string, user?: any) {
    const where: any = { id };

    if (user?.role === 'MANAGER' && user?.branch) {
      const normalizedUserBranch = user.branch.startsWith('branch')
        ? user.branch.replace('branch1', 'Main Branch')
          .replace('branch2', 'Downtown Branch')
          .replace('branch3', 'Uptown Branch')
          .replace('branch4', 'Westside Branch')
          .replace('branch5', 'Eastside Branch')
        : user.branch;

      where.branch = normalizedUserBranch;
    }

    return prisma.inventoryItem.findUnique({
      where,
      include: {
        category: true,
        subcategory: true
      }
    });
  },

  async update(id: string, data: any, user?: any) {
    const existing = await prisma.inventoryItem.findUnique({
      where: { id },
    });
  
    if (!existing) {
      throw new Error('Inventory item not found');
    }
  
    if (user?.role === 'MANAGER' && user?.branch) {
      const normalizedUserBranch = user.branch.startsWith('branch')
        ? user.branch.replace('branch1', 'Main Branch')
          .replace('branch2', 'Downtown Branch')
          .replace('branch3', 'Uptown Branch')
          .replace('branch4', 'Westside Branch')
          .replace('branch5', 'Eastside Branch')
        : user.branch;
  
      if (existing.branchName !== normalizedUserBranch) {
        throw new Error('You do not have permission to update this inventory item');
      }
    }
  
    // Determine the new status based on quantity
    let newStatus = existing.status;
    const updatedQuantity = data.quantity !== undefined ? data.quantity : existing.quantity;
    const minStock = data.minStock !== undefined ? data.minStock : existing.minStock;
  
    if (updatedQuantity <= 0) {
      newStatus = InventoryStatus.OUT_OF_STOCK;
    } else if (updatedQuantity <= minStock) {
      newStatus = InventoryStatus.LOW_STOCK;
    } else {
      newStatus = InventoryStatus.IN_STOCK;
    }
  
    // Prepare update data
    const updateData: any = {
      ...data,
      status: newStatus,
      lastUpdated: new Date()
    };
  
    // Create status change transaction if status changed
    let statusChangeTransaction = null;
    if (existing.status !== newStatus) {
      statusChangeTransaction = prisma.inventoryTransaction.create({
        data: {
          inventoryItemId: id,
          type: 'ADJUSTMENT',
          quantity: 0, // Status change only
          reason: `Status changed from ${existing.status} to ${newStatus} during update`,
          referenceType: 'STATUS_UPDATE',
          branchName: existing.branchName,
          previousQuantity: existing.quantity,
          newQuantity: updatedQuantity,
          createdById: user?.id
        }
      });
    }
  
    // If quantity changed, create quantity transaction
    let quantityTransaction = null;
    if (data.quantity !== undefined && data.quantity !== existing.quantity) {
      const quantityChange = data.quantity - existing.quantity;
      const transactionType = quantityChange > 0 ? 'INCOMING' : 'OUTGOING';
      
      quantityTransaction = prisma.inventoryTransaction.create({
        data: {
          inventoryItemId: id,
          type: transactionType,
          quantity: Math.abs(quantityChange),
          reason: `Manual quantity adjustment`,
          referenceType: 'MANUAL_ADJUSTMENT',
          branchName: existing.branchName,
          previousQuantity: existing.quantity,
          newQuantity: data.quantity,
          createdById: user?.id
        }
      });
    }
  
    // Execute all operations in a transaction
    return await prisma.$transaction(async (tx) => {
      // Update the inventory item
      const updatedItem = await tx.inventoryItem.update({
        where: { id },
        data: updateData,
        include: {
          category: true,
          subcategory: true
        }
      });
  
      // Create transactions if needed
      if (statusChangeTransaction) {
        await statusChangeTransaction;
      }
      if (quantityTransaction) {
        await quantityTransaction;
      }
  
      // Log the status change if it occurred
      if (existing.status !== newStatus) {
        console.log(`Inventory item ${existing.name} status changed from ${existing.status} to ${newStatus}`);
      }
  
      return updatedItem;
    });
  },

  async remove(id: string, user?: any) {
    const existing = await prisma.inventoryItem.findUnique({
      where: { id },
    });

    if (!existing) {
      throw new Error('Inventory item not found');
    }

    if (user?.role === 'MANAGER' && user?.branch) {
      const normalizedUserBranch = user.branch.startsWith('branch')
        ? user.branch.replace('branch1', 'Main Branch')
          .replace('branch2', 'Downtown Branch')
          .replace('branch3', 'Uptown Branch')
          .replace('branch4', 'Westside Branch')
          .replace('branch5', 'Eastside Branch')
        : user.branch;

      if (existing.branchName !== normalizedUserBranch) {
        throw new Error('You do not have permission to delete this inventory item');
      }
    }

    return prisma.inventoryItem.delete({
      where: { id }
    });
  },
};

// --- Supplier Service ---
export const supplierService = {
 async create(data: any, user?: any) {
    try {
      console.log(data, "supplier data");
      console.log(user, "supplier user");

      // Generate supplier code if not provided
      if (!data.code) {
        const lastSupplier = await prisma.supplier.findFirst({
          orderBy: { code: 'desc' },
          take: 1
        });
        const nextNumber = lastSupplier ? parseInt(lastSupplier.code.replace('SUP', '')) + 1 : 1;
        data.code = `SUP${nextNumber.toString().padStart(3, '0')}`;
      }

      // Prepare the base data
      const createData: any = {
        code: data.code,
        name: data.name,
        legalName: data.legalName || null,
        description: data.description || null,
        taxNumber: data.taxNumber || null,
        registrationNumber: data.registrationNumber || null,
        email: data.email || null,
        phone: data.phone || null,
        mobile: data.mobile || null,
        website: data.website || null,
        address: data.address || null,
        city: data.city || null,
        state: data.state || null,
        country: data.country || 'US',
        postalCode: data.postalCode || null,
        businessType: data.businessType || null,
        industry: data.industry || null,
        status: data.status || 'ACTIVE',
        rating: data.rating || 'AVERAGE',
        paymentTerms: data.paymentTerms || 'NET_30',
        bankName: data.bankName || null,
        bankAccount: data.bankAccount || null,
        bankRouting: data.bankRouting || null,
        currency: data.currency || 'USD',
        notes: data.notes || null,
      };

      // Add numeric fields only if they have values
      if (data.establishedYear) {
        createData.establishedYear = parseInt(data.establishedYear);
      }
      if (data.employeeCount) {
        createData.employeeCount = parseInt(data.employeeCount);
      }
      if (data.creditLimit) {
        createData.creditLimit = parseFloat(data.creditLimit);
      }

      // Add the createdBy relation if user exists - use userId from your JWT payload
      const userId = user?.userId || user?.id;
      if (userId) {
        createData.createdBy = {
          connect: { id: userId }
        };
      } else {
        // If no user ID, you might want to handle this case
        // Either throw an error or set a default user
        throw new Error('User ID is required to create a supplier');
      }

      console.log('Final create data:', createData);

      return await prisma.supplier.create({
        data: createData,
        include: {
          contacts: true,
          products: {
            include: {
              inventoryItem: true
            }
          },
          purchaseOrders: {
            take: 5,
            orderBy: { createdAt: 'desc' }
          },
          createdBy: {
            select: {
              id: true,
              name: true,
              email: true
            }
          }
        }
      });
    } catch (error) {
      console.error('Error creating supplier:', error);
      throw error;
    }
  },


  async list(user?: any, queryParams?: any) {
    const where: any = {};

    console.log('SupplierService.list called with:', {
      userRole: user?.role,
      userBranch: user?.branch,
      queryParams: queryParams
    });

    // If status is provided as a query parameter, use it for filtering
    if (queryParams?.status) {
      where.status = queryParams.status;
    }

    if (queryParams?.name) {
      where.name = {
        contains: queryParams.name,
        mode: 'insensitive'
      };
    }

    const suppliers = await prisma.supplier.findMany({
      where,
      include: {
        contacts: true,
        products: {
          include: {
            inventoryItem: true
          }
        },
        purchaseOrders: {
          take: 5,
          orderBy: { createdAt: 'desc' }
        },
        _count: {
          select: {
            purchaseOrders: true,
            products: true
          }
        }
      },
      orderBy: {
        name: 'asc'
      }
    });

    return suppliers.map(supplier => ({
      ...supplier,
      purchaseOrderCount: supplier._count.purchaseOrders,
      productCount: supplier._count.products
    }));
  },

  async get(id: string, user?: any) {
    const supplier = await prisma.supplier.findUnique({
      where: { id },
      include: {
        contacts: true,
        products: {
          include: {
            inventoryItem: true
          }
        },
        purchaseOrders: {
          take: 10,
          orderBy: { createdAt: 'desc' }
        },
        evaluations: {
          take: 5,
          orderBy: { evaluationDate: 'desc' }
        }
      }
    });

    if (!supplier) return null;

    return supplier;
  },

  async update(id: string, data: any, user?: any) {
    console.log(data, "updatedSupplierData")

    // First verify the supplier exists
    const existing = await prisma.supplier.findUnique({
      where: { id },
    });

    if (!existing) {
      throw new Error('Supplier not found');
    }

    // Remove createdById from data if it exists (shouldn't be updatable)
    const { createdById, ...updateData } = data;

    return prisma.supplier.update({
      where: { id },
      data: updateData,
      include: {
        contacts: true,
        products: {
          include: {
            inventoryItem: true
          }
        },
        purchaseOrders: {
          take: 5,
          orderBy: { createdAt: 'desc' }
        }
      }
    });
  },

  async remove(id: string, user?: any) {
    // First verify the supplier exists
    const existing = await prisma.supplier.findUnique({
      where: { id },
      include: {
        purchaseOrders: true,
        products: true
      }
    });

    if (!existing) {
      throw new Error('Supplier not found');
    }

    // Prevent deleting suppliers with active purchase orders or products
    if (existing.purchaseOrders.length > 0) {
      throw new Error('Cannot delete supplier with active purchase orders');
    }

    if (existing.products.length > 0) {
      throw new Error('Cannot delete supplier with associated products');
    }

    return prisma.supplier.delete({
      where: { id }
    });
  },

  // Supplier product association functions
  async addProductToSupplier(supplierId: string, inventoryItemId: string, supplierProductData: any, user?: any) {
    // First verify the supplier exists
    const supplier = await prisma.supplier.findUnique({
      where: { id: supplierId }
    });

    if (!supplier) {
      throw new Error('Supplier not found');
    }

    // Verify the inventory item exists
    const inventoryItem = await prisma.inventoryItem.findUnique({
      where: { id: inventoryItemId }
    });

    if (!inventoryItem) {
      throw new Error('Inventory item not found');
    }

    // Check if the supplier-product relationship already exists
    const existingRelation = await prisma.supplierProduct.findUnique({
      where: {
        supplierId_inventoryItemId: {
          supplierId,
          inventoryItemId
        }
      }
    });

    if (existingRelation) {
      throw new Error('Supplier-product relationship already exists');
    }

    return prisma.supplierProduct.create({
      data: {
        supplierId,
        inventoryItemId,
        ...supplierProductData
      },
      include: {
        supplier: true,
        inventoryItem: true
      }
    });
  },

  async getSupplierProducts(supplierId: string, user?: any) {
    const supplier = await prisma.supplier.findUnique({
      where: { id: supplierId },
      include: {
        products: {
          include: {
            inventoryItem: true
          }
        }
      }
    });

    if (!supplier) {
      throw new Error('Supplier not found');
    }

    return supplier.products;
  },

  async updateSupplierProduct(supplierProductId: string, data: any, user?: any) {
    const existing = await prisma.supplierProduct.findUnique({
      where: { id: supplierProductId },
      include: {
        supplier: true,
        inventoryItem: true
      }
    });

    if (!existing) {
      throw new Error('Supplier product relationship not found');
    }

    return prisma.supplierProduct.update({
      where: { id: supplierProductId },
      data: data,
      include: {
        supplier: true,
        inventoryItem: true
      }
    });
  },

  async removeSupplierProduct(supplierProductId: string, user?: any) {
    const existing = await prisma.supplierProduct.findUnique({
      where: { id: supplierProductId }
    });

    if (!existing) {
      throw new Error('Supplier product relationship not found');
    }

    return prisma.supplierProduct.delete({
      where: { id: supplierProductId }
    });
  },
};
