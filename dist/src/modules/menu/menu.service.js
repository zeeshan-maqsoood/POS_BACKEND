"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.modifierService = exports.menuItemService = exports.categoryService = void 0;
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
// --- MenuCategory ---
exports.categoryService = {
    async create(data, user) {
        console.log(data, "data");
        console.log(user, "menuUser");
        // For managers, set their branch if not provided
        if (user?.role === 'MANAGER' && user?.branch && !data.branchName) {
            // Normalize the branch name before storing
            const normalizedUserBranch = user.branch.startsWith('branch')
                ? user.branch.replace('branch1', 'Main Branch')
                    .replace('branch2', 'Downtown Branch')
                    .replace('branch3', 'Uptown Branch')
                    .replace('branch4', 'Westside Branch')
                    .replace('branch5', 'Eastside Branch')
                : user.branch;
            data.branchName = normalizedUserBranch;
        }
        // For admins, if no branch is specified, throw an error (they must choose)
        else if (user?.role === 'ADMIN' && !data.branchName) {
            throw new Error('Branch is required when creating categories as admin');
        }
        return prisma.menuCategory.create({
            data,
            include: {
                menuItems: true
            }
        });
    },
    async list(user, queryParams) {
        const where = {};
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
            where.branchName = normalizedUserBranch;
            console.log('Filtering categories by branch:', user.branch, '->', normalizedUserBranch);
        }
        // Admins see all categories
        // If branchName is provided as a query parameter, normalize it and use it for additional filtering
        if (queryParams?.branchName) {
            // Normalize the query parameter branch name
            const normalizedQueryBranch = queryParams.branchName.startsWith('branch')
                ? queryParams.branchName.replace('branch1', 'Main Branch')
                    .replace('branch2', 'Downtown Branch')
                    .replace('branch3', 'Uptown Branch')
                    .replace('branch4', 'Westside Branch')
                    .replace('branch5', 'Eastside Branch')
                : queryParams.branchName;
            where.branchName = normalizedQueryBranch;
            console.log('Filtering by query parameter branchName:', queryParams.branchName, '->', normalizedQueryBranch);
        }
        console.log('Final where clause for categories:', where);
        const categories = await prisma.menuCategory.findMany({
            where,
            include: {
                menuItems: true
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
    async get(id, user) {
        const where = { id };
        console.log(user, "menuUser");
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
            where.branchName = normalizedUserBranch;
        }
        // Admins can access any category
        return prisma.menuCategory.findUnique({
            where,
            include: {
                menuItems: true
            }
        });
    },
    async update(id, data, user) {
        console.log(user, "menuUser");
        // First verify the category exists and user has access
        const existing = await prisma.menuCategory.findUnique({
            where: { id },
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
            if (existing.branchName !== normalizedUserBranch) {
                throw new Error('You do not have permission to update this category');
            }
            // Prevent changing the branch
            if (data.branchName && data.branchName !== normalizedUserBranch) {
                throw new Error('You cannot change the branch of a category');
            }
        }
        // Admins can update any category
        return prisma.menuCategory.update({
            where: { id },
            data,
            include: {
                menuItems: true
            }
        });
    },
    async remove(id, user) {
        console.log(user, "user");
        // First verify the category exists and the user has access to it
        const existing = await prisma.menuCategory.findUnique({
            where: { id },
            include: {
                menuItems: true
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
            if (existing.branchName !== normalizedUserBranch) {
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
exports.menuItemService = {
    async create(data, user) {
        const { modifiers, ...itemData } = data;
        // For managers, set their branch if not provided
        if (user?.role === 'MANAGER' && user?.branch && !itemData.branchName) {
            // Normalize the branch name before storing
            const normalizedUserBranch = user.branch.startsWith('branch')
                ? user.branch.replace('branch1', 'Main Branch')
                    .replace('branch2', 'Downtown Branch')
                    .replace('branch3', 'Uptown Branch')
                    .replace('branch4', 'Westside Branch')
                    .replace('branch5', 'Eastside Branch')
                : user.branch;
            itemData.branchName = normalizedUserBranch;
        }
        // For admins, if no branch is specified, throw an error (they must choose)
        else if (user?.role === 'ADMIN' && !itemData.branchName) {
            throw new Error('Branch is required when creating menu items as admin');
        }
        // Prepare the create data
        const createData = { ...itemData };
        // Handle modifiers if they exist
        if (modifiers && modifiers.connect) {
            // For many-to-many relationship using connect
            createData.modifiers = {
                create: modifiers.connect.map(({ id }) => ({
                    modifier: {
                        connect: { id }
                    }
                    // No additional fields needed as per the Prisma schema
                    // The MenuItemModifier is a pure join table
                }))
            };
        }
        return prisma.menuItem.create({
            data: createData,
            include: {
                category: true,
                modifiers: {
                    include: {
                        modifier: true
                    }
                }
            },
        });
    },
    async list(user, queryParams) {
        const where = {};
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
            where.branchName = normalizedUserBranch;
            console.log('Filtering menu items by branch:', user.branch, '->', normalizedUserBranch);
        }
        // Admins see all items
        // If branchName is provided as a query parameter, normalize it and use it for additional filtering
        if (queryParams?.branchName) {
            // Normalize the query parameter branch name
            const normalizedQueryBranch = queryParams.branchName.startsWith('branch')
                ? queryParams.branchName.replace('branch1', 'Main Branch')
                    .replace('branch2', 'Downtown Branch')
                    .replace('branch3', 'Uptown Branch')
                    .replace('branch4', 'Westside Branch')
                    .replace('branch5', 'Eastside Branch')
                : queryParams.branchName;
            where.branchName = normalizedQueryBranch;
            console.log('Filtering by query parameter branchName:', queryParams.branchName, '->', normalizedQueryBranch);
        }
        // Also check for null branchName items if no specific branch is requested
        // This is for items that might not have a branch assigned yet
        if (!where.branchName && user?.role === 'MANAGER') {
            console.log('Manager has no branch, showing items without branchName');
            // For managers without a branch, show only items without branchName
            where.branchName = null;
        }
        console.log('Final where clause:', where);
        const items = await prisma.menuItem.findMany({
            where,
            include: {
                category: true,
                modifiers: true
            },
        });
        console.log('Found menu items:', items.length);
        console.log('Menu items with branches:', items.map(item => ({
            id: item.id,
            name: item.name,
            branchName: item.branchName
        })));
        return items;
    },
    async get(id, user) {
        const where = { id };
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
            where.branchName = normalizedUserBranch;
        }
        // Admins can access any item
        return prisma.menuItem.findUnique({
            where,
            include: {
                category: true,
                modifiers: true
            },
        });
    },
    async update(id, data, user) {
        // First verify the item exists and the user has access to it
        const existingItem = await prisma.menuItem.findUnique({
            where: { id },
            select: { branchName: true }
        });
        if (!existingItem) {
            throw new Error('Menu item not found');
        }
        // For managers, ensure they can only update items from their branch
        if (user?.role === 'MANAGER' && user?.branch) {
            // Normalize the user's branch name
            const normalizedUserBranch = user.branch.startsWith('branch')
                ? user.branch.replace('branch1', 'Main Branch')
                    .replace('branch2', 'Downtown Branch')
                    .replace('branch3', 'Uptown Branch')
                    .replace('branch4', 'Westside Branch')
                    .replace('branch5', 'Eastside Branch')
                : user.branch;
            if (existingItem.branchName !== normalizedUserBranch) {
                throw new Error('You do not have permission to update this menu item');
            }
            // Prevent changing the branch
            if (data.branchName && data.branchName !== normalizedUserBranch) {
                throw new Error('You cannot change the branch of a menu item');
            }
        }
        // Admins can update any item
        const { modifiers, ...itemData } = data;
        return prisma.menuItem.update({
            where: { id },
            data: {
                ...itemData,
                // if modifiers are passed, replace them
                ...(modifiers && {
                    modifiers: {
                        deleteMany: {}, // remove existing
                        create: modifiers.map((m) => ({
                            name: m.name,
                            price: m.price,
                            isActive: m.isActive ?? true,
                        })),
                    },
                }),
            },
            include: {
                category: true,
                modifiers: true
            },
        });
    },
    async remove(id, user) {
        // First verify the item exists and the user has access to it
        const existingItem = await prisma.menuItem.findUnique({
            where: { id },
            select: { branchName: true }
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
            if (existingItem.branchName !== normalizedUserBranch) {
                throw new Error('You do not have permission to delete this menu item');
            }
        }
        // Admins can delete any item
        return prisma.menuItem.delete({ where: { id } });
    },
};
// --- Modifier ---
exports.modifierService = {
    async create(data) {
        return prisma.modifier.create({
            data,
        });
    },
    async list() {
        return prisma.modifier.findMany();
    },
    async get(id) {
        return prisma.modifier.findUnique({ where: { id } });
    },
    async update(id, data) {
        return prisma.modifier.update({
            where: { id },
            data,
        });
    },
    async remove(id) {
        return prisma.modifier.delete({ where: { id } });
    },
};
//# sourceMappingURL=menu.service.js.map