"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.orderService = void 0;
exports.createOrder = createOrder;
exports.getOrdersService = getOrdersService;
exports.updatePaymentStatusService = updatePaymentStatusService;
exports.getOrderStatsService = getOrderStatsService;
exports.getOrderByIdService = getOrderByIdService;
exports.updateOrderStatusService = updateOrderStatusService;
exports.updateOrder = updateOrder;
exports.deleteOrderService = deleteOrderService;
// Import types first to avoid circular dependencies
const client_1 = require("@prisma/client");
const apiResponse_1 = require("../../utils/apiResponse");
const print_service_1 = __importDefault(require("../../services/print.service"));
const crypto_1 = require("crypto");
// Import prisma after the types to avoid circular dependencies
const prisma_1 = __importDefault(require("../../loaders/prisma"));
const checkBranchAccess = async (userId, branchName) => {
    const user = await prisma_1.default.user.findUnique({
        where: { id: userId },
        select: { branch: true, role: true }
    });
    if (!user)
        throw apiResponse_1.ApiError.notFound('User not found');
    // Admin can access all branches
    if (user.role === 'ADMIN')
        return true;
    // Manager and Kitchen Staff can only access their own branch
    if ((user.role === 'MANAGER' || user.role === 'KITCHEN_STAFF') && user.branch === branchName) {
        return true;
    }
    return false;
};
exports.orderService = {
    createOrder: async (data, currentUser) => {
        if (!data.tableNumber && !data.customerName) {
            throw apiResponse_1.ApiError.badRequest("Order must have either a table number or customer name");
        }
        // Get user's details
        const user = await prisma_1.default.user.findUnique({
            where: { id: currentUser.userId },
            select: { branch: true, role: true }
        });
        if (!user)
            throw apiResponse_1.ApiError.notFound('User not found');
        // Kitchen staff cannot create orders
        if (user.role === 'KITCHEN_STAFF') {
            throw apiResponse_1.ApiError.forbidden('Kitchen staff cannot create orders');
        }
        // If user is a manager and no branch is specified, use their branch
        if (user.role === 'MANAGER' && !data.branchName && user.branch) {
            data.branchName = user.branch;
        }
        // If branch is provided or set from manager, verify the user has access to it
        if (data.branchName) {
            // For managers, we already know they have access to their own branch
            if (!(user.role === 'MANAGER' && user.branch === data.branchName)) {
                const hasAccess = await checkBranchAccess(currentUser.userId, data.branchName);
                if (!hasAccess) {
                    throw apiResponse_1.ApiError.forbidden('You do not have permission to create orders for this branch');
                }
            }
        }
        try {
            // Get all menu items with their tax rates
            const menuItemIds = data.items.map(item => item.menuItemId);
            const menuItems = await prisma_1.default.menuItem.findMany({
                where: { id: { in: menuItemIds } },
                select: { id: true, taxRate: true, taxExempt: true }
            });
            // Create a map of menu item IDs to their tax rates
            const menuItemTaxInfo = new Map(menuItems.map(item => [item.id, {
                    taxRate: item.taxExempt ? 0 : item.taxRate,
                    taxExempt: item.taxExempt
                }]));
            // Calculate order items with proper tax
            const orderItems = data.items.map(item => {
                const itemInfo = menuItemTaxInfo.get(item.menuItemId) || { taxRate: 0, taxExempt: false };
                const itemSubtotal = item.price * item.quantity;
                const itemTax = itemInfo.taxExempt ? 0 : (itemSubtotal * (itemInfo.taxRate || 0)) / 100;
                const payload = {
                    menuItemId: item.menuItemId,
                    name: item.name || `Item ${item.menuItemId}`,
                    price: item.price,
                    quantity: item.quantity,
                    taxRate: itemInfo.taxRate,
                    tax: itemTax,
                    total: itemSubtotal + itemTax,
                    notes: item.notes,
                    modifiers: item.modifiers
                };
                return payload;
            });
            // Calculate order totals
            const subtotal = orderItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
            const tax = orderItems.reduce((sum, item) => sum + item.tax, 0);
            const total = subtotal + tax - (data.discount || 0);
            // Generate a unique order number if not provided
            const orderNumber = data.orderNumber || `ORD-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
            // Verify all menu items exist
            if (menuItems.length !== new Set(menuItemIds).size) {
                const foundIds = new Set(menuItems.map(item => item.id));
                const missingIds = menuItemIds.filter(id => !foundIds.has(id));
                throw apiResponse_1.ApiError.badRequest(`The following menu items do not exist: ${missingIds.join(', ')}`);
            }
            const order = await prisma_1.default.order.create({
                data: {
                    id: (0, crypto_1.randomUUID)(),
                    orderNumber,
                    orderType: data.orderType ?? client_1.OrderType.DINE_IN,
                    status: data.status || 'PENDING',
                    paymentStatus: data.paymentStatus || 'PENDING',
                    paymentMethod: data.paymentMethod,
                    subtotal,
                    tax,
                    total,
                    tableNumber: data.tableNumber,
                    customerName: data.customerName,
                    customerEmail: data.customerEmail,
                    customerPhone: data.customerPhone,
                    notes: data.notes,
                    branchName: data.branchName,
                    createdById: currentUser.userId,
                    items: {
                        create: orderItems.map(item => ({
                            id: (0, crypto_1.randomUUID)(),
                            menuItemId: item.menuItemId,
                            name: item.name,
                            price: item.price,
                            quantity: item.quantity,
                            taxRate: item.taxRate,
                            tax: item.tax,
                            total: item.total,
                            notes: item.notes,
                            modifiers: item.modifiers
                        }))
                    }
                },
                include: {
                    items: true,
                    createdBy: {
                        select: {
                            id: true,
                            name: true,
                            email: true
                        }
                    }
                }
            });
            // console.log(order,"order");
            return order;
        }
        catch (error) {
            console.error('Error creating order:', error);
            throw apiResponse_1.ApiError.internal('Failed to create order');
        }
    },
    getOrders: async (query, currentUser) => {
        // Get user's branch and role with more detailed selection
        const user = await prisma_1.default.user.findUnique({
            where: { id: currentUser.userId },
            select: {
                branch: true,
                role: true,
                id: true,
                name: true
            }
        });
        if (!user)
            throw apiResponse_1.ApiError.notFound('User not found');
        console.log(`[getOrders] User ${user.name} (${user.role}) - Branch: ${user.branch}`);
        // Build where clause
        const where = {};
        // For kitchen staff, only show orders from their branch
        if (user.role === 'KITCHEN_STAFF') {
            if (!user.branch) {
                console.error(`[getOrders] Kitchen staff ${user.id} has no branch assigned`);
                throw apiResponse_1.ApiError.forbidden('No branch assigned to your account');
            }
            where.branchName = user.branch;
            console.log(`[getOrders] Filtering orders for kitchen staff - Branch: ${user.branch}`);
        }
        // For managers, show all orders from their branch (not just their own)
        else if (user.role === 'MANAGER') {
            // Only filter by their branch, allow seeing all orders from their branch
            if (user.branch) {
                where.branchName = user.branch;
                console.log(`[getOrders] Filtering orders for manager - Branch: ${user.branch}, All branch orders`);
            }
            else {
                // Manager without branch - only show their own orders
                where.createdById = user.id;
                console.log(`[getOrders] Manager without branch - Only own orders`);
            }
        }
        // For admins, allow filtering by branch if specified
        else if (user.role === 'ADMIN' && query.branchName) {
            where.branchName = query.branchName;
            console.log(`[getOrders] Admin filtering by branch: ${query.branchName}`);
        }
        console.log(where, "where");
        // Apply other filters
        if (query.status)
            where.status = query.status;
        if (query.paymentStatus)
            where.paymentStatus = query.paymentStatus;
        if (query.orderType)
            where.orderType = query.orderType;
        if (query.startDate)
            where.createdAt = { gte: new Date(query.startDate) };
        if (query.endDate) {
            const endDate = new Date(query.endDate);
            endDate.setHours(23, 59, 59, 999);
            where.createdAt = { ...where.createdAt, lte: endDate };
        }
        if (query.search) {
            where.OR = [
                { orderNumber: { contains: query.search, mode: 'insensitive' } },
                { customerName: { contains: query.search, mode: 'insensitive' } },
                { customerPhone: { contains: query.search, mode: 'insensitive' } },
                { customerEmail: { contains: query.search, mode: 'insensitive' } },
            ];
        }
        // Handle pagination
        const page = query.page ? parseInt(query.page.toString(), 10) : 1;
        const pageSize = query.pageSize ? parseInt(query.pageSize.toString(), 10) : 10;
        const skip = (page - 1) * pageSize;
        // Get total count for pagination
        const total = await prisma_1.default.order.count({ where });
        // Get orders with pagination and sorting
        const orders = await prisma_1.default.order.findMany({
            where,
            include: {
                items: true,
                createdBy: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                    }
                }
            },
            orderBy: {
                [query.sortBy || 'createdAt']: query.sortOrder || 'desc'
            },
            skip,
            take: pageSize,
        });
        // console.log(orders,"orders")
        return {
            data: orders,
            meta: {
                total,
                page,
                pageSize,
                totalPages: Math.ceil(total / pageSize),
            }
        };
    },
    getOrderById: async (id, currentUser) => {
        // First get the order without access check to see if it exists
        const order = await prisma_1.default.order.findUnique({
            where: { id },
            include: {
                items: true,
                createdBy: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                    }
                }
            },
        });
        if (!order) {
            throw apiResponse_1.ApiError.notFound('Order not found');
        }
        // Get user's details
        const user = await prisma_1.default.user.findUnique({
            where: { id: currentUser.userId },
            select: { branch: true, role: true, id: true }
        });
        // console.log(order,"order")
        if (!user)
            throw apiResponse_1.ApiError.notFound('User not found');
        // If user is a manager
        if (user.role === 'MANAGER' || user.role === 'KITCHEN_STAFF') {
            // Allow managers to view all orders from their branch, not just their own
            if (user.role === 'KITCHEN_STAFF') {
                // Kitchen staff can only see orders from their branch
                if (user.branch && order.branchName !== user.branch) {
                    throw apiResponse_1.ApiError.forbidden('You do not have permission to view this order');
                }
            }
            // For managers, allow viewing any order from their branch
            console.log(order.branchName, "order.branchName");
            console.log(user.branch, "user.branch");
        }
        // If user is admin and order has a branch, check branch access
        else if (order.branchName) {
            console.log(order.branchName, "order.branchName");
            console.log(currentUser.userId, "currentUser.userId");
            const hasAccess = await checkBranchAccess(currentUser.userId, order.branchName);
            console.log(hasAccess, "hasAccess");
            if (!hasAccess) {
                throw apiResponse_1.ApiError.forbidden('You do not have permission to view this order');
            }
        }
        return order;
    },
    updateOrder: async (id, data, currentUser) => {
        // First get the existing order to check access
        const existingOrder = await prisma_1.default.order.findUnique({
            where: { id },
            include: { items: true }
        });
        if (!existingOrder) {
            throw apiResponse_1.ApiError.notFound('Order not found');
        }
        // Get user's details
        const user = await prisma_1.default.user.findUnique({
            where: { id: currentUser.userId },
            select: { branch: true, role: true, id: true }
        });
        if (!user)
            throw apiResponse_1.ApiError.notFound('User not found');
        // If user is a manager
        if (user.role === 'MANAGER' || user.role === 'KITCHEN_STAFF') {
            // Allow managers to update all orders from their branch, not just their own
            if (user.role === 'KITCHEN_STAFF') {
                // Kitchen staff can only update orders from their branch
                if (user.branch && existingOrder.branchName !== user.branch) {
                    throw apiResponse_1.ApiError.forbidden('You do not have permission to update this order');
                }
            }
            // For managers, allow updating any order from their branch
        }
        // If user is admin and order has a branch, check branch access
        else if (existingOrder.branchName) {
            const hasAccess = await checkBranchAccess(currentUser.userId, existingOrder.branchName);
            if (!hasAccess) {
                throw apiResponse_1.ApiError.forbidden('You do not have permission to update this order');
            }
        }
        // Prepare update data
        const updateData = {
            status: data.status,
            paymentMethod: data.paymentMethod,
            paymentStatus: data.paymentStatus,
            total: data.total,
            // Add other fields as needed
        };
        // Only allow branch updates for admins
        if (user.role === 'ADMIN' && data.branchName) {
            updateData.branchName = data.branchName;
        }
        // Handle items update if provided
        if (data.items) {
            // Delete existing items and create new ones
            await prisma_1.default.orderItem.deleteMany({
                where: { orderId: id }
            });
            updateData.items = {
                create: data.items.map(item => ({
                    menuItemId: item.menuItemId,
                    name: item.name || 'Unnamed Item',
                    quantity: item.quantity,
                    price: item.price,
                    taxRate: item.taxRate || 0,
                    tax: (item.price * (item.taxRate || 0) / 100) * item.quantity,
                    total: item.quantity * item.price,
                    notes: item.notes,
                    modifiers: item.modifiers || {}
                }))
            };
        }
        // Proceed with update
        const order = await prisma_1.default.order.update({
            where: { id },
            data: updateData,
            include: { items: true }
        });
        return order;
    },
    deleteOrder: async (id, currentUser) => {
        // First get the order to check access
        const order = await prisma_1.default.order.findUnique({
            where: { id }
        });
        if (!order) {
            throw apiResponse_1.ApiError.notFound('Order not found');
        }
        // Get user's details
        const user = await prisma_1.default.user.findUnique({
            where: { id: currentUser.userId },
            select: { branch: true, role: true, id: true }
        });
        if (!user)
            throw apiResponse_1.ApiError.notFound('User not found');
        // If user is a manager
        if (user.role === 'MANAGER') {
            // Allow managers to delete any order from their branch, not just their own
            if (user.branch && order.branchName !== user.branch) {
                throw apiResponse_1.ApiError.forbidden('You do not have permission to delete this order');
            }
        }
        // If user is admin and order has a branch, check branch access
        else if (order.branchName) {
            const hasAccess = await checkBranchAccess(currentUser.userId, order.branchName);
            if (!hasAccess) {
                throw apiResponse_1.ApiError.forbidden('You do not have permission to delete this order');
            }
        }
        try {
            await prisma_1.default.order.delete({ where: { id } });
        }
        catch (error) {
            console.error('Error deleting order:', error);
            throw apiResponse_1.ApiError.internal("Failed to delete order");
        }
    },
};
exports.default = exports.orderService;
async function createOrder(data, currentUser) {
    try {
        if (!currentUser.userId) {
            throw new Error('User ID is required');
        }
        const { items, ...orderData } = data;
        // console.log(orderData,"orderData")
        // Verify user has access to the branch if branchName is provided
        if (orderData.branchName) {
            await checkBranchAccess(currentUser.userId, orderData.branchName);
        }
        // Generate order number if not provided
        if (!orderData.orderNumber) {
            // Generate a unique order number with timestamp and random string
            const timestamp = Date.now().toString().slice(-6);
            const randomStr = Math.random().toString(36).substring(2, 6).toUpperCase();
            orderData.orderNumber = `ORD-${timestamp}-${randomStr}`;
        }
        else if (typeof orderData.orderNumber !== 'string' || orderData.orderNumber.trim() === '') {
            throw new Error('Invalid order number format');
        }
        // Set default status if not provided
        if (!orderData.status) {
            orderData.status = client_1.OrderStatus.PENDING;
        }
        // Create the order with items in a transaction
        const order = await prisma_1.default.$transaction(async (tx) => {
            // Create the order
            // Calculate item totals and taxes
            const itemsWithTotals = items.map(item => {
                const quantity = item.quantity || 1;
                const price = parseFloat(item.price.toString()) || 0;
                const taxRate = parseFloat((item.taxRate || 0).toString());
                const subtotal = price * quantity;
                const tax = orderData.tax;
                const total = subtotal + tax;
                // console.log(item,"item")
                return {
                    ...item,
                    quantity,
                    price,
                    taxRate,
                    tax,
                    total,
                    notes: item.notes || null,
                };
            });
            // Calculate order totals
            const subtotal = orderData.subtotal;
            const taxTotal = orderData.tax;
            const total = subtotal + taxTotal - (orderData.discount || 0);
            console.log(subtotal, "subtotal");
            console.log(taxTotal, "taxTotal");
            console.log(total, "total");
            // Update order data with calculated totals
            const orderWithTotals = {
                ...orderData,
                subtotal: parseFloat(subtotal.toFixed(2)),
                tax: parseFloat(taxTotal.toFixed(2)),
                total: parseFloat(total.toFixed(2)),
            };
            const createdOrder = await tx.order.create({
                data: {
                    ...orderWithTotals,
                    branchName: orderData.branchName, // ✅ Add branchName to standalone createOrder function
                    createdById: currentUser.userId,
                    items: {
                        create: itemsWithTotals.map(item => ({
                            name: item.name,
                            quantity: item.quantity,
                            price: item.price,
                            taxRate: item.taxRate,
                            tax: item.tax,
                            total: item.total,
                            notes: item.notes || null,
                            ...(item.menuItemId ? { menuItemId: item.menuItemId } : {})
                        }))
                    }
                },
                include: {
                    items: true,
                    createdBy: {
                        select: {
                            id: true,
                            name: true,
                            email: true,
                        },
                    },
                },
            });
            return createdOrder;
        });
        // Print the receipt in the background (don't await to avoid blocking the response)
        print_service_1.default.printOrderReceipt(order).catch(error => {
            console.error('Failed to print receipt:', error);
        });
        return order;
    }
    catch (error) {
        console.error('Error creating order:', error);
        throw new Error(error instanceof Error ? error.message : 'Failed to create order');
    }
}
async function getOrdersService(params, currentUser) {
    // Get user's branch and role with more details
    const user = await prisma_1.default.user.findUnique({
        where: { id: currentUser.userId },
        select: {
            branch: true,
            role: true,
            id: true,
            name: true
        }
    });
    if (!user)
        throw new Error('User not found');
    console.log(`[getOrdersService] User ${user.name} (${user.role}) - Branch: ${user.branch}`);
    // Build where clause
    const where = {};
    // For kitchen staff, only show orders from their branch
    if (user.role === 'KITCHEN_STAFF') {
        if (!user.branch) {
            console.error(`[getOrdersService] Kitchen staff ${user.id} has no branch assigned`);
            throw new Error('No branch assigned to your account');
        }
        where.branchName = user.branch;
        console.log(`[getOrdersService] Filtering orders for kitchen staff - Branch: ${user.branch}`);
    }
    // For managers, show all orders from their branch (not just their own)
    else if (user.role === 'MANAGER') {
        // Only filter by their branch, allow seeing all orders from their branch
        if (user.branch) {
            where.branchName = user.branch;
            console.log(`[getOrdersService] Filtering orders for manager - Branch: ${user.branch}, All branch orders`);
        }
        else {
            // Manager without branch - only show their own orders
            where.createdById = user.id;
            console.log(`[getOrdersService] Manager without branch - Only own orders`);
        }
    }
    // For admins, allow filtering by branch if specified
    else if (user.role === 'ADMIN' && params.branchName) {
        where.branchName = params.branchName;
        console.log(`[getOrdersService] Admin filtering by branch: ${params.branchName}`);
    }
    // Apply other filters
    if (params.status)
        where.status = params.status;
    if (params.paymentStatus)
        where.paymentStatus = params.paymentStatus;
    if (params.orderType)
        where.orderType = params.orderType;
    if (params.startDate)
        where.createdAt = { gte: new Date(params.startDate) };
    if (params.endDate) {
        const endDate = new Date(params.endDate);
        endDate.setHours(23, 59, 59, 999);
        where.createdAt = { ...where.createdAt, lte: endDate };
    }
    if (params.search) {
        where.OR = [
            { orderNumber: { contains: params.search, mode: 'insensitive' } },
            { customerName: { contains: params.search, mode: 'insensitive' } },
            { customerPhone: { contains: params.search, mode: 'insensitive' } },
            { customerEmail: { contains: params.search, mode: 'insensitive' } },
        ];
    }
    // Handle pagination
    const page = params.page || 1;
    const pageSize = params.pageSize || 10;
    const skip = (page - 1) * pageSize;
    // Get total count for pagination
    const total = await prisma_1.default.order.count({ where });
    // Get orders with pagination and sorting
    const orders = await prisma_1.default.order.findMany({
        where,
        include: {
            items: true,
            createdBy: {
                select: {
                    id: true,
                    name: true,
                    email: true,
                }
            }
        },
        orderBy: {
            [params.sortBy || 'createdAt']: params.sortOrder || 'desc'
        },
        skip,
        take: pageSize,
    });
    // console.log(orders,"orders")
    return {
        data: orders,
        meta: {
            total,
            page,
            pageSize,
            totalPages: Math.ceil(total / pageSize),
        }
    };
}
async function updatePaymentStatusService(id, paymentStatus, paymentMethod, currentUser) {
    // First get the existing order to check access if currentUser is provided
    const existingOrder = await prisma_1.default.order.findUnique({
        where: { id }
    });
    if (!existingOrder) {
        throw new Error('Order not found');
    }
    if (currentUser) {
        // Get user's details
        const user = await prisma_1.default.user.findUnique({
            where: { id: currentUser.userId },
            select: { branch: true, role: true, id: true }
        });
        if (!user)
            throw new Error('User not found');
        // If user is a manager or kitchen staff
        if (user.role === 'MANAGER' || user.role === 'KITCHEN_STAFF') {
            // Allow managers to update payment status of any order from their branch
            if (user.role === 'KITCHEN_STAFF') {
                // Kitchen staff can only update orders from their branch
                if (user.branch && existingOrder.branchName !== user.branch) {
                    throw new Error('You do not have permission to update this order');
                }
            }
            // For managers, allow updating any order from their branch
        }
        // If user is admin and order has a branch, check branch access
        else if (existingOrder.branchName) {
            const hasAccess = await checkBranchAccess(currentUser.userId, existingOrder.branchName);
            if (!hasAccess) {
                throw new Error('You do not have permission to update this order');
            }
        }
    }
    try {
        // Update payment status and method
        const updatedOrder = await prisma_1.default.order.update({
            where: { id },
            data: {
                paymentStatus,
                paymentMethod
            },
            include: {
                items: true,
                createdBy: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                        role: true
                    }
                }
            }
        });
        // Print receipt when payment status is updated to PAID
        if (paymentStatus === 'PAID') {
            try {
                await print_service_1.default.printOrderReceipt(updatedOrder);
                console.log('Receipt printed successfully for order:', updatedOrder.orderNumber);
            }
            catch (printError) {
                console.error('Failed to print receipt:', printError);
                // Don't fail the whole operation if printing fails
            }
        }
        return updatedOrder;
    }
    catch (error) {
        console.error('Error updating payment status:', error);
        throw new Error('Failed to update payment status');
    }
}
function getOrderStatsService(arg0) {
    throw new Error("Function not implemented.");
}
async function getOrderByIdService(id, currentUser) {
    // First get the order without access check to see if it exists
    const order = await prisma_1.default.order.findUnique({
        where: { id },
        include: {
            items: true,
            createdBy: {
                select: {
                    id: true,
                    name: true,
                    email: true,
                },
            },
        },
    });
    if (!order) {
        throw new Error('Order not found');
    }
    // Get user's details
    const user = await prisma_1.default.user.findUnique({
        where: { id: currentUser.userId },
        select: { branch: true, role: true, id: true }
    });
    if (!user)
        throw new Error('User not found');
    // If user is a manager
    if (user.role === 'MANAGER') {
        // Allow managers to view any order from their branch, not just their own
        if (user.branch && order.branchName !== user.branch) {
            throw new Error('You do not have permission to view this order');
        }
    }
    // If user is admin and order has a branch, check branch access
    else if (order.branchName) {
        const hasAccess = await checkBranchAccess(currentUser.userId, order.branchName);
        if (!hasAccess) {
            throw new Error('You do not have permission to view this order');
        }
    }
    return order;
}
async function updateOrderStatusService(id, status, currentUser) {
    // First get the existing order to check access
    const existingOrder = await prisma_1.default.order.findUnique({
        where: { id }
    });
    if (!existingOrder) {
        throw new Error('Order not found');
    }
    // Get user's details
    const user = await prisma_1.default.user.findUnique({
        where: { id: currentUser.userId },
        select: { branch: true, role: true, id: true }
    });
    if (!user)
        throw new Error('User not found');
    // If user is a manager or kitchen staff
    if (user.role === 'MANAGER' || user.role === 'KITCHEN_STAFF') {
        // Allow managers to update status of any order from their branch
        if (user.role === 'KITCHEN_STAFF') {
            // Kitchen staff can only update orders from their branch
            if (user.branch && existingOrder.branchName !== user.branch) {
                throw new Error('You do not have permission to update this order');
            }
        }
        // For managers, allow updating any order from their branch
    }
    // If user is admin and order has a branch, check branch access
    else if (existingOrder.branchName) {
        const hasAccess = await checkBranchAccess(currentUser.userId, existingOrder.branchName);
        if (!hasAccess) {
            throw new Error('You do not have permission to update this order');
        }
    }
    try {
        // Update only the status field
        const updatedOrder = await prisma_1.default.order.update({
            where: { id },
            data: { status },
            include: { items: true }
        });
        return updatedOrder;
    }
    catch (error) {
        console.error('Error updating order status:', error);
        throw new Error('Failed to update order status');
    }
}
async function updateOrder(id, data, currentUser) {
    // First get the existing order to check access if currentUser is provided
    if (currentUser) {
        const existingOrder = await prisma_1.default.order.findUnique({
            where: { id }
        });
        if (!existingOrder) {
            throw new Error('Order not found');
        }
        // Get user's details
        const user = await prisma_1.default.user.findUnique({
            where: { id: currentUser.userId },
            select: { branch: true, role: true, id: true }
        });
        if (!user)
            throw new Error('User not found');
        // If user is a manager
        if (user.role === 'MANAGER' || user.role === 'KITCHEN_STAFF') {
            // Allow managers to update any order from their branch
            if (user.role === 'KITCHEN_STAFF') {
                // Kitchen staff can only update orders from their branch
                if (user.branch && existingOrder.branchName !== user.branch) {
                    throw new Error('You do not have permission to update this order');
                }
            }
            // For managers, allow updating any order from their branch
        }
        // If user is admin and order has a branch, check branch access
        else if (existingOrder.branchName) {
            const hasAccess = await checkBranchAccess(currentUser.userId, existingOrder.branchName);
            if (!hasAccess) {
                throw new Error('You do not have permission to update this order');
            }
        }
    }
    try {
        // Update only the notes field
        const updatedOrder = await prisma_1.default.order.update({
            where: { id },
            data: { notes: data.notes },
            include: { items: true }
        });
        return updatedOrder;
    }
    catch (error) {
        console.error('Error updating order:', error);
        throw new Error('Failed to update order');
    }
}
async function deleteOrderService(id, currentUser) {
    // First get the order to check access if currentUser is provided
    const order = await prisma_1.default.order.findUnique({
        where: { id }
    });
    if (!order) {
        throw new Error('Order not found');
    }
    if (currentUser) {
        // Get user's details
        const user = await prisma_1.default.user.findUnique({
            where: { id: currentUser.userId },
            select: { branch: true, role: true, id: true }
        });
        if (!user)
            throw new Error('User not found');
        // If user is a manager
        if (user.role === 'MANAGER') {
            // Allow managers to delete any order from their branch, not just their own
            if (user.branch && order.branchName !== user.branch) {
                throw new Error('You do not have permission to delete this order');
            }
        }
        // If user is admin and order has a branch, check branch access
        else if (order.branchName) {
            const hasAccess = await checkBranchAccess(currentUser.userId, order.branchName);
            if (!hasAccess) {
                throw new Error('You do not have permission to delete this order');
            }
        }
    }
    try {
        await prisma_1.default.order.delete({ where: { id } });
    }
    catch (error) {
        console.error('Error deleting order:', error);
        throw new Error('Failed to delete order');
    }
}
//# sourceMappingURL=order.service.js.map