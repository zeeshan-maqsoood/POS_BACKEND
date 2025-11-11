// Import types first to avoid circular dependencies
import { OrderStatus, PaymentMethod, PaymentStatus, OrderType, UserRole, Prisma, Order, OrderItem } from "@prisma/client";
import { JwtPayload } from "../../types/auth.types";
import { ApiError } from "../../utils/apiResponse";
import {
  CreateOrderInput,
  UpdateOrderInput,
  GetOrdersQuery,
  OrderItemInput,
  OrderResponse
} from "../../types/order.types";
import { randomUUID } from 'crypto';
import { inventoryService } from "../../services/inventory-deduction.service";
import { printService } from "../../services/print.service";
// Import prisma after the types to avoid circular dependencies
import prisma from "../../loaders/prisma";

// Helper function to handle order receipt
async function handleOrderReceipt(order: Order & { items: any[] }) {
  try {
    // Get branch info for the receipt
    const branch = order.branchId ? await prisma.branch.findUnique({
      where: { id: order.branchId },
      select: { name: true }
    }) : null;

    // Log receipt data
    console.log(`[${new Date().toISOString()}] Receipt generated for order ${order.orderNumber}:`, {
      orderNumber: order.orderNumber,
      subtotal: order.subtotal,
      tax: order.tax,
      total: order.total,
      branch: branch?.name || 'Main Branch',
      itemCount: order.items.length
    });
    
    return { success: true, message: 'Receipt logged successfully' };
  } catch (error) {
    console.error('Error handling receipt:', error);
    // Don't throw the error to avoid failing the order creation
    return { success: false, message: 'Failed to log receipt' };
  }
}

// Extend the Prisma types to include the relations we need
type OrderWithItems = Prisma.OrderGetPayload<{
  include: {
    items: true;
    createdBy: {
      select: {
        id: true;
        name: true;
        email: true;
      };
    };
  };
}>;

const checkBranchAccess = async (userId: string, branchName: string) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { branch: true, role: true }
  });

  if (!user) throw ApiError.notFound('User not found');

  // Admin can access all branches
  if (user.role === 'ADMIN') return true;

  // Manager and Kitchen Staff can only access their own branch
  if ((user.role === 'MANAGER' || user.role === 'KITCHEN_STAFF') && 
      user.branch && branchName && user.branch.toString() === branchName.toString()) {
    return true;
  }

  return false;
};

export const orderService = {
  getOrders: async (query: GetOrdersQuery, currentUser: JwtPayload): Promise<OrderResponse> => {
    // Get user's branch and role with more detailed selection
    const user = await prisma.user.findUnique({
      where: { id: currentUser.userId },
      select: {
        branch: true,
        role: true,
        id: true,
        name: true
      }
    });

    if (!user) throw ApiError.notFound('User not found');

    console.log(`[getOrders] User ${user.name} (${user.role}) - Branch: ${user.branch}`);

    // Build where clause
    const where: any = {};

    // For kitchen staff, only show orders from their branch
    if (user.role === 'KITCHEN_STAFF') {
      if (!user.branch) {
        console.error(`[getOrders] Kitchen staff ${user.id} has no branch assigned`);
        throw ApiError.forbidden('No branch assigned to your account');
      }
      // Allow filtering by specific branch if provided, otherwise use their own branch
      where.branchName = query.branchName || user.branch;
      console.log(`[getOrders] Filtering orders for kitchen staff - Branch: ${where.branchName}`);
    }
    // For managers, show all orders from their branch (not just their own)
    else if (user.role === 'MANAGER') {
      // Allow filtering by specific branch if provided, otherwise use their own branch
      if (query.branchName) {
        where.branchName = query.branchName;
        console.log(`[getOrders] Manager filtering by branch: ${query.branchName}`);
      } else if (user.branch) {
        where.branchName = user.branch;
        console.log(`[getOrders] Filtering orders for manager - Branch: ${user.branch}, All branch orders`);
      } else {
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

    // Apply restaurant filter for all users
    if (query.restaurantId) {
      where.restaurantId = query.restaurantId;
      console.log(`[getOrders] Filtering by restaurant: ${query.restaurantId}`);
    }

    // Apply other filters
    if (query.status) where.status = query.status;
    if (query.paymentStatus) where.paymentStatus = query.paymentStatus;
    if (query.orderType) where.orderType = query.orderType;
    if (query.startDate) where.createdAt = { gte: new Date(query.startDate) };
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
    const total = await prisma.order.count({ where });

    // Get orders with pagination and sorting
    const orders = await prisma.order.findMany({
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

    // Check permissions for each order if needed
    if (user) {
      for (const order of orders) {
        // If user is a manager or kitchen staff
        if (user.role === 'MANAGER' || user.role === 'KITCHEN_STAFF') {
          // Allow managers to view all orders from their branch, not just their own
          if (user.role === 'KITCHEN_STAFF' && user.branch && 
              order.branchName && user.branch.toString() !== order.branchName.toString()) {
            // Kitchen staff can only see orders from their branch
            throw ApiError.forbidden('You do not have permission to view this order');
          }
          // For managers, allow viewing any order from their branch
        } 
        // If user is admin and order has a branch, check branch access
        else if (order.branchName) {
          const hasAccess = await checkBranchAccess(currentUser.userId, order.branchName);
          if (!hasAccess) {
            throw ApiError.forbidden('You do not have permission to view this order');
          }
        }
      }
    }

    return {
      data: orders,
      meta: {
        total,
        page,
        pageSize,
        totalPages: Math.ceil(total / pageSize)
      }
    };
  },

  updateOrder: async (id: string, data: UpdateOrderInput, currentUser: JwtPayload) => {
    console.log("calling update order ")
    // First get the existing order to check access
    const existingOrder = await prisma.order.findUnique({
      where: { id },
      include: { items: true }
    });

    if (!existingOrder) {
      throw ApiError.notFound('Order not found');
    }

    // Get user's details
    const user = await prisma.user.findUnique({
      where: { id: currentUser.userId },
      select: { branch: true, role: true, id: true }
    });

    if (!user) throw ApiError.notFound('User not found');

    // If user is a manager or kitchen staff
    if (user.role === 'MANAGER' || user.role === 'KITCHEN_STAFF') {
      // Allow managers to update all orders from their branch, not just their own
      if (user.role === 'KITCHEN_STAFF' && user.branch && existingOrder.branchName !== user.branch) {
        // Kitchen staff can only update orders from their branch
        throw ApiError.forbidden('You do not have permission to update this order');
      }
      // For managers, allow updating any order from their branch
    }
    // If user is admin and order has a branch, check branch access
    else if (existingOrder.branchName) {
      const hasAccess = await checkBranchAccess(currentUser.userId, existingOrder.branchName);
      if (!hasAccess) {
        throw ApiError.forbidden('You do not have permission to update this order');
      }
    }
    console.log(data, "dataOrder")

    // Prepare update data
    const updateData: Prisma.OrderUpdateInput = {
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
      await prisma.orderItem.deleteMany({
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
    console.log(updateData, "updateData")

    // Update the order with the specified status
    const order = await prisma.order.update({
      where: { id },
      data: updateData,
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

    return order;
  },

  deleteOrder: async (id: string, currentUser: JwtPayload) => {
    // First get the order to check access
    const order = await prisma.order.findUnique({
      where: { id }
    });

    if (!order) {
      throw ApiError.notFound('Order not found');
    }

    // Get user's details
    const user = await prisma.user.findUnique({
      where: { id: currentUser.userId },
      select: { branch: true, role: true, id: true }
    });

    if (!user) throw ApiError.notFound('User not found');

    // If user is a manager
    if (user.role === 'MANAGER') {
      // Allow managers to delete any order from their branch, not just their own
      if (user.branch && order.branchName !== user.branch.name) {
        throw ApiError.forbidden('You do not have permission to delete this order');
      }
    }
    // If user is admin and order has a branch, check branch access
    else if (order.branchName) {
      const hasAccess = await checkBranchAccess(currentUser.userId, order.branchName);
      if (!hasAccess) {
        throw ApiError.forbidden('You do not have permission to delete this order');
      }
    }

    try {
      await prisma.order.delete({ where: { id } });
    } catch (error) {
      console.error('Error deleting order:', error);
      throw ApiError.internal("Failed to delete order");
    }
  },
};

export default orderService;

export async function createOrder(data: CreateOrderInput, currentUser: JwtPayload): Promise<OrderWithItems> {
  console.log('[DEBUG] createOrder service called with data:', JSON.stringify(data, null, 2));
  console.log('[DEBUG] Current user ID:', currentUser?.userId);
  
  try {
    if (!currentUser?.userId) {
      const error = new Error('User ID is required');
      console.error('[ERROR] No user ID found in createOrder');
      throw error;
    }

    const { items, ...orderData } = data;

    // Set status from input or default to PENDING
    const status = orderData.status || 'PENDING';
    console.log('Creating order with status:', status);

    // Verify user has access to the branch if branchName is provided and get branch ID
    let branchId: string | undefined;
    if (orderData.branchName) {
      await checkBranchAccess(currentUser.userId, orderData.branchName);
      
      // Find the branch to get its ID
      const branch = await prisma.branch.findFirst({
        where: { 
          name: orderData.branchName,
          ...(orderData.restaurantId && { restaurantId: orderData.restaurantId })
        },
        select: { id: true }
      });

      if (!branch) {
        throw new Error(`Branch '${orderData.branchName}' not found`);
      }
      
      branchId = branch.id;
      console.log('Using branch ID:', branchId, 'for branch:', orderData.branchName);
    }

    // Check inventory availability before creating order
    const inventoryCheck = await inventoryService.checkInventoryAvailability({
      ...orderData,
      items
    });

    if (!inventoryCheck.available) {
      throw new Error(
        `Insufficient inventory for the following items:\n` +
        inventoryCheck.issues.map(issue => 
          `- ${issue.itemName}: ${issue.ingredientName} (Required: ${issue.required}, Available: ${issue.available})`
        ).join('\n')
      );
    }

    // Generate order number if not provided
    if (!orderData.orderNumber) {
      const timestamp = Date.now().toString().slice(-6);
      const randomStr = Math.random().toString(36).substring(2, 6).toUpperCase();
      orderData.orderNumber = `ORD-${timestamp}-${randomStr}`;
    }

    // Create the order with items in a transaction
    const order = await prisma.$transaction(async (tx) => {
      // Calculate item totals and taxes
      const itemsWithTotals = items.map(item => {
        const quantity = item.quantity || 1;
        const price = parseFloat(item.price.toString()) || 0;
        const taxRate = parseFloat((item.taxRate || 0).toString());
        const subtotal = price * quantity;
        const tax = subtotal * (taxRate / 100);
        const total = subtotal + tax;

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
      const subtotal = itemsWithTotals.reduce((sum: number, item: any) => sum + (item.price * item.quantity), 0);
      const tax = itemsWithTotals.reduce((sum: number, item: any) => sum + (item.tax || 0), 0);
      const total = subtotal + tax;

      // Create the order with the specified status
      const order = await tx.order.create({
        data: {
          ...orderData,
          status, // Make sure status is included here
          subtotal,
          tax,
          total,
          branchId,
          createdById: currentUser.userId,
          items: {
            create: itemsWithTotals.map(item => ({
              menuItemId: item.menuItemId,
              name: item.name || 'Unnamed Item',
              quantity: item.quantity,
              price: item.price,
              taxRate: item.taxRate,
              tax: item.tax,
              total: item.total,
              notes: item.notes,
              modifiers: item.modifiers ? {
                create: item.modifiers.map(mod => ({
                  name: mod.name,
                  price: mod.price,
                  menuModifierId: mod.id
                }))
              } : undefined
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

      // Deduct inventory after successful order creation
      await inventoryService.deductInventoryForOrder({
        ...order,
        items: itemsWithTotals
      });

      return order;
    });

    console.log('Order created successfully:', order);
    
    // Print receipt in the background (don't await to avoid blocking the response)
    console.log('[DEBUG] Sending order to print service...');
    
    // Prepare order data for printing
    const receiptData = {
      ...order,
      items: order.items || []
    };
    
    // Print the receipt in the background
    printService.printOrderReceipt(receiptData as any)
      .then(() => console.log('[DEBUG] Receipt sent to printer successfully'))
      .catch(error => console.error('[ERROR] Failed to print receipt:', error));
    
    return order;
  } catch (error) {
    console.error('Error in createOrder:', error);
    throw error;
  }
}


export async function getOrdersService(params: GetOrdersServiceParams, currentUser: JwtPayload) {
  // Get user's branch and role with more details
  const user = await prisma.user.findUnique({
    where: { id: currentUser.userId },
    select: {
      branch: true,
      role: true,
      id: true,
      name: true
    }
  });

  if (!user) throw new Error('User not found');

  console.log(`[getOrdersService] User ${user.name} (${user.role}) - Branch: ${user.branch}`);

  // Build where clause
  const where: any = {};

  // For kitchen staff, only show orders from their branch
  if (user.role === 'KITCHEN_STAFF') {
    if (!user.branch) {
      console.error(`[getOrdersService] Kitchen staff ${user.id} has no branch assigned`);
      throw new Error('No branch assigned to your account');
    }
    // Allow filtering by specific branch if provided, otherwise use their own branch
    where.branchName = params.branchName || user.branch;
    console.log(`[getOrdersService] Filtering orders for kitchen staff - Branch: ${where.branchName}`);
  }
  // For managers, show all orders from their branch (not just their own)
  else if (user.role === 'MANAGER') {
    // Allow filtering by specific branch if provided, otherwise use their own branch
    if (params.branchName) {
      where.branchName = params.branchName;
      console.log(`[getOrdersService] Manager filtering by branch: ${params.branchName}`);
    } else if (user.branch) {
      where.branchName = user.branch;
      console.log(`[getOrdersService] Filtering orders for manager - Branch: ${user.branch}, All branch orders`);
    } else {
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

  // Apply restaurant filter for all users
  if (params.restaurantId) {
    where.restaurantId = params.restaurantId;
    console.log(`[getOrdersService] Filtering by restaurant: ${params.restaurantId}`);
  }

  // Apply other filters
  if (params.status) where.status = params.status;
  if (params.paymentStatus) where.paymentStatus = params.paymentStatus;
  if (params.orderType) where.orderType = params.orderType;
  if (params.startDate) where.createdAt = { gte: new Date(params.startDate) };
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
  const total = await prisma.order.count({ where });

  // Get orders with pagination and sorting
  const orders = await prisma.order.findMany({
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


export async function updatePaymentStatusService(id: string, paymentStatus: PaymentStatus, paymentMethod: PaymentMethod, currentUser?: JwtPayload) {
  // First get the existing order to check access if currentUser is provided
  const existingOrder = await prisma.order.findUnique({
    where: { id }
  });

  if (!existingOrder) {
    throw new Error('Order not found');
  }

  if (currentUser) {
    // Get user's details
    const user = await prisma.user.findUnique({
      where: { id: currentUser.userId },
      select: { branch: true, role: true, id: true }
    });

    if (!user) throw new Error('User not found');

    // If user is a manager or kitchen staff
    if (user.role === 'MANAGER' || user.role === 'KITCHEN_STAFF') {
      // Allow managers to update payment status of any order from their branch
      if (user.role === 'KITCHEN_STAFF') {
        // Kitchen staff can only update orders from their branch
        if (user.branch && existingOrder.branchName !== user.branch.name) {
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
    // Start a transaction to ensure data consistency
    const [updatedOrder] = await prisma.$transaction([
      // Update the order's payment status and method
      prisma.order.update({
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
      }),
      // Only create a payment record if status is being updated to PAID
      ...(paymentStatus === 'PAID' ? [
        prisma.payment.create({
          data: {
            orderId: id,
            method: paymentMethod,
            amount: existingOrder.total,
            status: 'PAID'
          }
        })
      ] : [])
    ]);

    return updatedOrder;
  } catch (error) {
    console.error('Error creating order:', error);
    throw new Error('Failed to create order');
  }
}


export async function getOrderStatsService({ startDate, endDate, branchName, restaurantId }: {
  startDate?: Date;
  endDate?: Date;
  branchName?: string;
  restaurantId?: string;
}) {
  try {
    const where: any = {};

    // Add date range filter if provided
    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt.gte = startDate;
      if (endDate) {
        // Set to end of the day
        const endOfDay = new Date(endDate);
        endOfDay.setHours(23, 59, 59, 999);
        where.createdAt.lte = endOfDay;
      }
    }

    // Add branch filter if provided
    if (branchName) {
      where.branchName = branchName;
    }

    // Add restaurant filter if provided - use flexible approach
    if (restaurantId) {
      // Try to match orders that either have the restaurantId directly or belong to a branch of that restaurant
      where.OR = [
        { restaurantId: restaurantId },
        {
          branch: {
            restaurantId: restaurantId
          }
        }
      ];
    }

    console.log('=== STATS SERVICE DEBUG ===');
    console.log('Input params:', { startDate, endDate, branchName, restaurantId });
    console.log('Final where clause:', JSON.stringify(where, null, 2));

    // Get all orders count
    const totalOrders = await prisma.order.count({ where });
    console.log('Total orders found with current filter:', totalOrders);

    // If still no orders found, try even more flexible approaches
    if (totalOrders === 0 && (restaurantId || branchName)) {
      console.log('No orders found, trying alternative filtering approaches...');

      // Try 1: Just restaurantId without branch filter
      if (restaurantId && !branchName) {
        const ordersByRestaurantOnly = await prisma.order.count({
          where: {
            OR: [
              { restaurantId: restaurantId },
              { branch: { restaurantId: restaurantId } }
            ]
          }
        });
        console.log('Orders found with restaurant only:', ordersByRestaurantOnly);

        if (ordersByRestaurantOnly > 0) {
          console.log('Found orders with restaurant only, proceeding with that...');
          where.OR = [
            { restaurantId: restaurantId },
            { branch: { restaurantId: restaurantId } }
          ];
        }
      }

      // Try 2: Just branchName without restaurant filter
      else if (branchName && !restaurantId) {
        const ordersByBranchOnly = await prisma.order.count({
          where: { branchName: branchName }
        });
        console.log('Orders found with branch only:', ordersByBranchOnly);

        if (ordersByBranchOnly > 0) {
          console.log('Found orders with branch only, proceeding with that...');
          where.branchName = branchName;
        }
      }

      // Try 3: Check what orders actually exist in the database
      else if (restaurantId && branchName) {
        console.log('Checking actual orders in database for debugging...');

        // Get sample of orders to see what data they contain
        const sampleOrders = await prisma.order.findMany({
          take: 5,
          select: {
            id: true,
            branchName: true,
            restaurantId: true,
            status: true,
            branch: {
              select: {
                id: true,
                name: true,
                restaurantId: true,
                restaurant: {
                  select: {
                    id: true,
                    name: true
                  }
                }
              }
            }
          }
        });

        console.log('Sample orders in database:', JSON.stringify(sampleOrders, null, 2));

        // Check if there are any orders for this restaurant at all
        const allRestaurantOrders = await prisma.order.count({
          where: {
            OR: [
              { restaurantId: restaurantId },
              { branch: { restaurantId: restaurantId } }
            ]
          }
        });
        console.log('Total orders for restaurant (any branch):', allRestaurantOrders);

        // Check if there are any orders for this branch name
        const allBranchOrders = await prisma.order.count({
          where: { branchName: branchName }
        });
        console.log('Total orders for branch name:', allBranchOrders);
      }
    }

    // Use the potentially updated where clause
    const finalWhere = totalOrders > 0 ? where : where;
    console.log('Final where clause after debugging:', JSON.stringify(finalWhere, null, 2));

    // Get orders by status
    const [completedOrders, cancelledOrders, pendingOrders, processingOrders] = await Promise.all([
      prisma.order.count({
        where: {
          ...finalWhere,
          status: 'COMPLETED'
        }
      }),
      prisma.order.count({
        where: {
          ...finalWhere,
          status: 'CANCELLED'
        }
      }),
      prisma.order.count({
        where: {
          ...finalWhere,
          status: 'PENDING'
        }
      }),
      prisma.order.count({
        where: {
          ...finalWhere,
          status: 'PROCESSING'
        }
      })
    ]);

    // Get total revenue from completed and paid orders
    const revenueResult = await prisma.order.aggregate({
      where: {
        ...finalWhere,
        status: 'COMPLETED',
        paymentStatus: 'PAID'
      },
      _sum: {
        total: true
      }
    });

    // Get average order value (only for completed orders)
    const completedOrdersCount = completedOrders || 1; // Avoid division by zero
    const avgOrderValue = completedOrders > 0
      ? (revenueResult._sum.total || 0) / completedOrdersCount
      : 0;

    // Calculate cancellation rate
    const totalOrdersFinal = completedOrders + cancelledOrders + pendingOrders + processingOrders;
    const cancellationRate = totalOrdersFinal > 0
      ? (cancelledOrders / totalOrdersFinal) * 100
      : 0;

    // Get orders by status for the pie chart
    const ordersByStatus = await prisma.order.groupBy({
      by: ['status'],
      where: {
        ...finalWhere,
        status: {
          in: ['PENDING', 'PROCESSING', 'CONFIRMED', 'PREPARING', 'READY_FOR_PICKUP', 'COMPLETED', 'CANCELLED']
        }
      },
      _count: {
        _all: true
      }
    });

    return {
      totalOrders: totalOrdersFinal,
      completedOrders,
      cancelledOrders,
      pendingOrders,
      processingOrders,
      ordersByStatus: ordersByStatus.map(item => ({
        status: item.status,
        count: item._count._all
      })),
      totalRevenue: revenueResult._sum.total || 0,
      avgOrderValue,
      cancellationRate
    };
  } catch (error) {
    console.error('Error in getOrderStatsService:', error);
    throw new Error('Failed to get order statistics');
  }
}


export async function getOrderByIdService(id: string, currentUser: JwtPayload) {
  // First get the order without access check to see if it exists
  const order = await prisma.order.findUnique({
    where: { id },
    include: {
      items: true,
      // createdBy: {
      //   select: {
      //     id: true,
      //     name: true,
      //     email: true,
      //   },
      // },
    },

  });
  console.log(order, "orderbyId")
  if (!order) {
    throw new Error('Order not found');
  }

  // Get user's details
  const user = await prisma.user.findUnique({
    where: { id: currentUser.userId },
    select: { branch: true, role: true, id: true }
  });

  if (!user) throw new Error('User not found');

  // If user is a manager
  console.log(order.branchName,"branchName")
  console.log(user.branch,"userbranch")
  // if (user.role === 'MANAGER') {
  //   // Allow managers to view any order from their branch, not just their own
  //   if (user.branch && order.branchName !== user.branch) {
  //     throw new Error('You do not have permission to view this order');
  //   }
  // }
  // // If user is admin and order has a branch, check branch access
  // else if (order.branchName) {
  //   const hasAccess = await checkBranchAccess(currentUser.userId, order.branchName);
  //   if (!hasAccess) {
  //     throw new Error('You do not have permission to view this order');
  //   }
  // }

  return order;
}


export async function updateOrderStatusService(id: string, status: OrderStatus, currentUser: JwtPayload) {
   // First get the existing order to check access
   const existingOrder = await prisma.order.findUnique({
    where: { id },
    include: { items: true }
  });

  if (!existingOrder) {
    throw new Error('Order not found');
  }

  // Get user's details
  const user = await prisma.user.findUnique({
    where: { id: currentUser.userId },
    select: { branch: true, role: true, id: true }
  });

  if (!user) throw new Error('User not found');

  // Access check logic (keep your existing logic)
  if (user.role === 'MANAGER' || user.role === 'KITCHEN_STAFF') {
    if (user.role === 'KITCHEN_STAFF') {
      if (user.branch && existingOrder.branchName !== user.branch.name) {
        throw new Error('You do not have permission to update this order');
      }
    }
  } else if (existingOrder.branchName) {
    const hasAccess = await checkBranchAccess(currentUser.userId, existingOrder.branchName);
    if (!hasAccess) {
      throw new Error('You do not have permission to update this order');
    }
  }

  try {
    // Update the status field
    const updatedOrder = await prisma.order.update({
      where: { id },
      data: { status },
      include: { items: true }
    });

    // After order is updated, handle receipt if status changed to COMPLETED
    if (status === 'COMPLETED' && existingOrder.status !== 'COMPLETED') {
      await handleOrderReceipt({
        ...existingOrder,
        items: existingOrder.items.map(item => ({
          ...item,
          modifiers: item.modifiers || []
        }))
      });
    }

    return updatedOrder;
  } catch (error) {
    console.error('Error updating order status:', error);
    throw new Error('Failed to update order status');
  }
}


export async function updateOrder(
  id: string,
  data: {
    tableNumber: string;
    customerName: string;
    subtotal: number;
    tax: number;
    discount: number;
    total: number;
    paymentStatus: string;
    paymentMethod: string;
    status: string;
    orderType: string;
    branchName: string;
    notes: string;
    items?: Array<{
      menuItemId: string;
      name: string;
      quantity: number;
      price: number;
      taxRate?: number;
      tax?: number;
      total?: number;
      notes?: string;
      modifiers?: any;
    }>;
  },
  currentUser?: JwtPayload
) {
  try {
    return await prisma.$transaction(async (tx) => {
      // 1. Get existing order with items
      const existingOrder = await tx.order.findUnique({
        where: { id },
        include: { items: true }
      });

      if (!existingOrder) {
        throw new Error('Order not found');
      }
      // 2. Update the order
      const updatedOrder = await tx.order.update({
        where: { id },
        data: {
          tableNumber: data.tableNumber || 'DEFAULT',
          customerName: data.customerName || 'DEFAULT',
          subtotal: data.subtotal || 0,
          tax: data.tax || 0,
          discount: data.discount || 0,
          total: data.total || 0,
          paymentStatus: data.paymentStatus as PaymentStatus || PaymentStatus.PENDING,
          paymentMethod: data.paymentMethod as PaymentMethod || PaymentMethod.CASH,
          status: data.status as OrderStatus || OrderStatus.PENDING,
          orderType: data.orderType as OrderType || OrderType.DINE_IN,
          branchName: data.branchName || 'DEFAULT',
          notes: data.notes || '',
        },
        include: { items: true }
      });

      // 3. Process items if provided
      let newItems: string | any[] = [];
      let itemsToPrint: string | any[] = [];
      if (data.items && Array.isArray(data.items)) {
        // Get existing item IDs
        // Get existing items with their details
        const existingItems = existingOrder.items.map(item => ({
          menuItemId: item.menuItemId,
          quantity: item.quantity,
          // Include other fields that might be modified
          price: item.price,
          tax: item.tax,
          modifiers: item.modifiers
        }));
        itemsToPrint = data.items.filter(newItem => {
          const existingItem = existingItems.find(item =>
            item.menuItemId === newItem.menuItemId
          );

          // If item doesn't exist in existing items, it's new
          if (!existingItem) return true;
          if (existingItem.quantity !== newItem.quantity) {
            // Calculate the difference
            const quantityDifference = newItem.quantity - existingItem.quantity;
            if (quantityDifference > 0) {
              // Update the quantity to just the difference
              newItem.quantity = quantityDifference;
              return true;
            }
            return false;
          }
          return false;
        });
        // If any of these fields have changed, consider it modified

        console.log('Items to print receipt for:', itemsToPrint);

        newItems = data.items.filter(newItem => {
          const existingItem = existingItems.find(item =>
            item.menuItemId === newItem.menuItemId
          );

          // If item doesn't exist in existing items, it's new
          if (!existingItem) return true;

          // If any of these fields have changed, consider it modified
          return existingItem.quantity !== newItem.quantity ||
            existingItem.price !== newItem.price ||
            JSON.stringify(existingItem.modifiers) !== JSON.stringify(newItem.modifiers);
        });
        console.log(existingItems, "existingItems")
        console.log("all new Items", data.items)

        // Delete all existing items
        await tx.orderItem.deleteMany({
          where: { orderId: id }
        });

        // Create all items (existing + new)
        if (data.items.length > 0) {
          await tx.orderItem.createMany({
            data: data.items.map(item => {
              const price = item.price || 0;
              const quantity = item.quantity || 0;
              const tax = item.tax || 0;
              const total = item.total || (price * quantity) + tax;

              return {
                orderId: id,
                menuItemId: item.menuItemId,
                name: item.name,
                quantity: quantity,
                price: price,
                taxRate: item.taxRate || 0,
                tax: tax,
                total: total,
                notes: item.notes || null,
                modifiers: item.modifiers || null
              };
            })
          });
        }
      }

      // 4. Get the complete updated order
      const completeOrder = await tx.order.findUnique({
        where: { id },
        include: { items: true }
      });
      console.log(completeOrder, "completeOrder")
      console.log(newItems, "newItemsss")
      // 5. If there are new items, print receipts for them
      if (itemsToPrint.length > 0) {
        console.log("newItems", newItems);
        const orderWithNewItems = {
          ...completeOrder,
          items: newItems,
          isPartialUpdate: true
        };

        // Print in the background
        printService.printOrderReceipt(orderWithNewItems as any)
          .then(result => {
            console.log('PrintService result for update:', result); // Debug: Log the full result
            const { manager, kitchen } = result;

            // Log full receipt to console if printing succeeds
            if (manager || kitchen) {
              console.log('\n========== PHYSICAL RECEIPT CONTENT (NEW ITEMS) =========='); // Indicate it's for new items
              logReceiptToConsole(orderWithNewItems); // Log the receipt details for new items
              console.log('=====================================================\n');
            }

            if (manager && completeOrder) console.log('Manager receipt printed successfully for order:', completeOrder.orderNumber);
            if (kitchen && completeOrder) console.log('Kitchen receipt printed successfully for order:', completeOrder.orderNumber);
            if (!manager) console.warn('Failed to print manager receipt for updated order');
            if (!kitchen) console.warn('Failed to print kitchen receipt for updated order');
          })
          .catch(error => {
            console.error('Error printing receipt for updated order:', error);
          });
      }

      // Log receipt to console after order update
      if (completeOrder) {
        // Note: Full receipt logging is now handled in the print success callback above
        // Print receipt for the updated order
        printService.printOrderReceipt(completeOrder as any)
          .then(result => {
            console.log('PrintService result for full update:', result); // Debug: Log the full result
            const { manager, kitchen } = result;

            // Log full receipt to console if printing succeeds
            if (manager || kitchen) {
              console.log('\n========== PHYSICAL RECEIPT CONTENT (FULL ORDER) =========='); // Indicate it's for the full order
              logReceiptToConsole(completeOrder); // Log the receipt details for the full order
              console.log('=======================================================\n');
            }

            if (manager) console.log('Manager receipt printed successfully for order:', completeOrder.orderNumber);
            if (kitchen) console.log('Kitchen receipt printed successfully for order:', completeOrder.orderNumber);
            if (!manager) console.warn('Failed to print manager receipt for updated order');
            if (!kitchen) console.warn('Failed to print kitchen receipt for updated order');
          })
          .catch(error => {
            console.error('Error printing receipt for updated order:', error);
          });
      }

      return completeOrder;
    });
  } catch (error) {
    console.error('Error updating order:', error);
    throw error;
  }
}
export async function deleteOrderService(id: string, currentUser?: JwtPayload) {
  // First get the order to check access if currentUser is provided
  const order = await prisma.order.findUnique({
    where: { id }
  });

  if (!order) {
    throw new Error('Order not found');
  }

  if (currentUser) {
    // Get user's details
    const user = await prisma.user.findUnique({
      where: { id: currentUser.userId },
      select: { branch: true, role: true, id: true }
    });

    if (!user) throw new Error('User not found');

    // If user is a manager
    if (user.role === 'MANAGER') {
      // Allow managers to delete any order from their branch, not just their own
      if (user.branch && order.branchName !== user.branch.name) {
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
    await prisma.order.delete({ where: { id } });
  } catch (error) {
    console.error('Error deleting order:', error);
    throw new Error('Failed to delete order');
  }


}

export async function getOrderByTableService(currentUser: JwtPayload, branchName: string) {
  try {
    console.log(currentUser, "currentUser");
    console.log(branchName, "branchName");

    // Tables should be occupied until payment status is PAID
    // This means we want orders where payment is NOT yet completed
    const orders = await prisma.order.findMany({
      where: {
        branchName: branchName,
        paymentStatus: {
          not: 'PAID'  // Tables are occupied until payment is completed
        },
        tableNumber: { not: null }
      },
      select: {
        tableNumber: true,
        paymentStatus: true,
        status: true
      },
      orderBy: {
        createdAt: 'asc'
      },
      distinct: ['tableNumber']
    });
    console.log(orders, "orders with payment status");

    // Return only the table numbers that are occupied
    const occupiedTables = orders.map(order => ({
      tableNumber: order.tableNumber
    }));

    return occupiedTables;
  } catch (error) {
    console.error('Error fetching orders by table:', error);
    throw new Error('Failed to fetch orders by table');
  }
}