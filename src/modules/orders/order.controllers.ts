import { Request, Response } from "express";
import * as orderService from "./order.service";
import { ApiResponse } from "../../utils/apiResponse";
import { Order, OrderStatus, PaymentStatus, OrderType, PaymentMethod } from '@prisma/client';
import { JwtPayload } from "../../types/auth.types";
import { parseISO, isDate } from 'date-fns';
import { getIo } from "../../../app";
interface OrderQueryParams {
  status?: OrderStatus;
  paymentStatus?: PaymentStatus;
  orderType?: OrderType;
  branchName?: string;
  startDate?: string;
  endDate?: string;
  search?: string;
  page?: string;
  pageSize?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

// Define the expected order type based on what the service returns
type OrderWithItems = Order & {
  items: Array<{
    id: string;
    menuItemId: string;
    name: string;
    quantity: number;
    price: number;
    taxRate: number;
    tax: number;
    total: number;
    notes: string | null;
  }>;
};

// Mock implementation of printReceipt if it doesn't exist
async function mockPrintReceipt(orderId: string): Promise<void> {  // Implementation would go here
  console.log(`Printing receipt for order ${orderId}`);
}

export const createOrder = async (req: Request, res: Response): Promise<void> => {
  try {
    const currentUser = req.user as unknown as JwtPayload;
    const order = await orderService.createOrder(req.body, currentUser) as OrderWithItems;
    const io=getIo()
    io.emit('new-order', {
      order,
      createdByRole: currentUser.role,
      message:"New order created"
    });
    if (!order || !order.id) {
      throw new Error('Failed to create order: Invalid order data returned from service');
    }
    
    // Print receipt in the background (don't await to avoid delaying the response)
    mockPrintReceipt(order.id).catch((error: Error) => {
      console.error('Error printing receipt:', error);
    });
    
    ApiResponse.send(res, ApiResponse.success<OrderWithItems>(order, "Order created successfully", 201));
  } catch (error: any) {
    console.error('Error creating order:', error);
    const statusCode = error.statusCode || 400;
    const message = error.message || 'Failed to create order';
    ApiResponse.send(res, ApiResponse.error(message, statusCode));
  }
};

export const getOrders = async (req: Request<{}, {}, {}, OrderQueryParams>, res: Response) => {
  try {
    const currentUser = req.user as unknown as JwtPayload;
    const { 
      status, 
      paymentStatus, 
      orderType,
      branchName,
      startDate,
      endDate,
      search,
      page = '1',
      pageSize = '10',
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    const orders = await orderService.getOrdersService(
      {
        status,
        paymentStatus: paymentStatus as PaymentStatus | undefined,
        orderType: orderType as OrderType | undefined,
        branchName: branchName as string | undefined,
        startDate: startDate ? parseISO(startDate) : undefined,
        endDate: endDate ? parseISO(endDate) : undefined,
        search,
        page: parseInt(page, 10),
        pageSize: parseInt(pageSize, 10),
        sortBy,
        sortOrder: sortOrder as 'asc' | 'desc',
      },
      currentUser
    );

    ApiResponse.send(res, ApiResponse.success(orders, "Orders retrieved successfully"));
  } catch (error: any) {
    console.error('Error in getOrders:', error);
    ApiResponse.send(res, ApiResponse.error(error.message || 'Failed to retrieve orders', 500));
  }
};

export const updatePaymentStatus = async (req: Request, res: Response) => {
  try {
    const currentUser = req.user as unknown as JwtPayload;
    const { id } = req.params;
    const { paymentStatus, paymentMethod } = req.body;

    if (!paymentStatus || !paymentMethod) {
      return ApiResponse.send(res, ApiResponse.badRequest('Payment status and payment method are required'));
    }

    const order = await orderService.updatePaymentStatusService(
      id,
      paymentStatus,
      paymentMethod,
      currentUser
    );

    // Print receipt when payment is completed
    if (paymentStatus === 'PAID') {
      mockPrintReceipt(id).catch((error: Error) => {
        console.error('Error printing receipt:', error);
      });
    }

    ApiResponse.send(res, ApiResponse.success(order, 'Payment status updated successfully'));
  } catch (error: any) {
    ApiResponse.send(res, ApiResponse.error(error.message || 'Failed to update payment status', 500));
  }
};

export const getOrderStats = async (req: Request, res: Response) => {
  try {
    const { startDate, endDate } = req.query;
    
    const stats = await orderService.getOrderStatsService({
      startDate: startDate && isDate(new Date(startDate as string)) ? new Date(startDate as string) : undefined,
      endDate: endDate && isDate(new Date(endDate as string)) ? new Date(endDate as string) : undefined,
    });

    ApiResponse.send(res, ApiResponse.success(stats, "Order statistics retrieved successfully"));
  } catch (error: any) {
    console.error('Error in getOrderStats:', error);
    ApiResponse.send(res, ApiResponse.error(error.message || 'Failed to retrieve order statistics', 500));
  }
};

export const getOrderById = async (req: Request, res: Response) => {
  try {
    const currentUser = req.user as unknown as JwtPayload;
    const order = await orderService.getOrderByIdService(req.params.id, currentUser);

    if (!order) {
      return ApiResponse.send(res, ApiResponse.error("Order not found", 404));
    }
    ApiResponse.send(res, ApiResponse.success(order, "Order retrieved successfully"));
  } catch (error: any) {
    console.error('Error getting order:', error);
    const statusCode = error.statusCode || 500;
    const message = error.message || 'Failed to get order';
    ApiResponse.send(res, ApiResponse.error(message, statusCode));
  }
};

export const updateOrderStatus = async (req: Request, res: Response) => {
  try {
    const currentUser = req.user as unknown as JwtPayload;
    const { status, notes } = req.body;
    const { id } = req.params;

    // Update order status with the validated data
    const order = await orderService.updateOrderStatusService(id, status, currentUser);

    // If there are notes, update them as well
    if (notes) {
      await orderService.updateOrder(id, { notes }, currentUser);
    }

    // Get the updated order with all fields
    const updatedOrder = await orderService.getOrderByIdService(id, currentUser);

    ApiResponse.send(res, ApiResponse.success(updatedOrder, "Order status updated successfully"));
  } catch (error: any) {
    console.error('Error updating order status:', error);
    const statusCode = error.statusCode || 500;
    const message = error.message || 'Failed to update order status';
    ApiResponse.send(res, ApiResponse.error(message, statusCode));
  }
};

export const deleteOrder = async (req: Request, res: Response) => {
  try {
    const currentUser = req.user as unknown as JwtPayload;
    await orderService.deleteOrderService(req.params.id, currentUser);
    ApiResponse.send(res, ApiResponse.success(null, "Order deleted successfully", 204));
  } catch (error: any) {
    ApiResponse.send(res, ApiResponse.error(error.message, 400));
  }
};

export default {
  createOrder,
  getOrders,
  updatePaymentStatus,
  getOrderStats,
  getOrderById,
  updateOrderStatus,
  deleteOrder
};