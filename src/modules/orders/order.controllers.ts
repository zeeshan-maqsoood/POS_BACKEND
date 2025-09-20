// import { Request, Response } from "express";
// import { orderService } from "./order.service";
// import { ApiResponse, ApiError } from "../../utils/apiResponse";
// import { JwtPayload } from "../../types/auth.types";

// // Create Order
// export const createOrder = async (req: Request, res: Response) => {
//   try {
//     const order = await orderService.createOrder(req.body, req.user as JwtPayload);
//     const response = ApiResponse.success(order, "Order created successfully", 201);
//     ApiResponse.send(res, response);
//   } catch (error: any) {
//     const apiError = error instanceof ApiError
//       ? error
//       : ApiError.internal("Error creating order");
//     ApiResponse.send(res, new ApiResponse(false, apiError.message, null, apiError.statusCode));
//   }
// };

// // Get all orders
// export const getOrders = async (req: Request, res: Response) => {
//   try {
//     const orders = await orderService.getAllOrders(req.user as JwtPayload);
//     const response = ApiResponse.success(orders, "Orders retrieved successfully");
//     ApiResponse.send(res, response);
//   } catch (error: any) {
//     const apiError = error instanceof ApiError
//       ? error
//       : ApiError.internal("Error retrieving orders");
//     ApiResponse.send(res, new ApiResponse(false, apiError.message, null, apiError.statusCode));
//   }
// };

// // Get order by ID
// export const getOrder = async (req: Request, res: Response) => {
//   try {
//     const order = await orderService.getOrderById(req.params.id, req.user as JwtPayload);
//     if (!order) throw ApiError.notFound("Order not found");
//     const response = ApiResponse.success(order, "Order retrieved successfully");
//     ApiResponse.send(res, response);
//   } catch (error: any) {
//     const apiError = error instanceof ApiError
//       ? error
//       : ApiError.internal("Error retrieving order");
//     ApiResponse.send(res, new ApiResponse(false, apiError.message, null, apiError.statusCode));
//   }
// };

// // Update order
// export const updateOrder = async (req: Request, res: Response) => {
//   try {
//     const order = await orderService.updateOrder(req.params.id, req.body, req.user as JwtPayload);
//     const response = ApiResponse.success(order, "Order updated successfully");
//     ApiResponse.send(res, response);
//   } catch (error: any) {
//     const apiError = error instanceof ApiError
//       ? error
//       : ApiError.internal("Error updating order");
//     ApiResponse.send(res, new ApiResponse(false, apiError.message, null, apiError.statusCode));
//   }
// };

// // Delete order
// export const deleteOrder = async (req: Request, res: Response) => {
//   try {
//     await orderService.deleteOrder(req.params.id, req.user as JwtPayload);
//     const response = ApiResponse.success(null, "Order deleted successfully", 204);
//     ApiResponse.send(res, response);
//   } catch (error: any) {
//     const apiError = error instanceof ApiError
//       ? error
//       : ApiError.internal("Error deleting order");
//     ApiResponse.send(res, new ApiResponse(false, apiError.message, null, apiError.statusCode));
//   }
// };

// @ts-nocheck


import { Request, Response } from "express";
import * as orderService from "./order.service";
import { ApiResponse } from "../../utils/apiResponse";
import { OrderStatus, PaymentStatus, OrderType } from '@prisma/client';
import { parseISO, isDate } from 'date-fns';
import { printReceipt } from '../../services/receipt.service';

interface OrderQueryParams {
  status?: OrderStatus;
  paymentStatus?: PaymentStatus;
  orderType?: OrderType;
  startDate?: string;
  endDate?: string;
  search?: string;
  page?: string;
  pageSize?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export const createOrder = async (req: Request, res: Response) => {
  try {
    const order = await orderService.createOrderService(req.body);
    
    // Print receipt in the background (don't await to avoid delaying the response)
    printReceipt(order.id).catch(error => {
      console.error('Error printing receipt:', error);
    });
    
    ApiResponse.send(res, ApiResponse.success(order, "Order created successfully", 201));
  } catch (error: any) {
    console.log(error);
    ApiResponse.send(res, ApiResponse.error(error.message, 400));
  }
};

export const getOrders = async (req: Request<{}, {}, {}, OrderQueryParams>, res: Response) => {
  try {
    const { 
      status, 
      paymentStatus, 
      orderType,
      startDate,
      endDate,
      search,
      page = '1',
      pageSize = '10',
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    const orders = await orderService.getOrdersService({
      status,
      paymentStatus: paymentStatus as PaymentStatus | undefined,
      orderType: orderType as OrderType | undefined,
      startDate: startDate ? parseISO(startDate) : undefined,
      endDate: endDate ? parseISO(endDate) : undefined,
      search,
      page: parseInt(page, 10),
      pageSize: parseInt(pageSize, 10),
      sortBy,
      sortOrder: sortOrder as 'asc' | 'desc',
    });

    ApiResponse.send(res, ApiResponse.success(orders, "Orders retrieved successfully"));
  } catch (error: any) {
    console.error('Error in getOrders:', error);
    ApiResponse.send(res, ApiResponse.error(error.message || 'Failed to retrieve orders', 500));
  }
};

export const updatePaymentStatus = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { paymentStatus, paymentMethod } = req.body;

    if (!paymentStatus || !paymentMethod) {
      return ApiResponse.send(res, ApiResponse.badRequest('Payment status and payment method are required'));
    }

    const order = await orderService.updatePaymentStatusService(
      id,
      paymentStatus,
      paymentMethod
    );

    // Print receipt when payment is completed
    if (paymentStatus === 'PAID') {
      printReceipt(id).catch(error => {
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
  const order = await orderService.getOrderByIdService(req.params.id);
  if (!order) {
    return ApiResponse.send(res, ApiResponse.error("Order not found", 404));
  }
  ApiResponse.send(res, ApiResponse.success(order, "Order retrieved successfully"));
};

export const updateOrderStatus = async (req: Request, res: Response) => {
  try {
    const { status, notes } = req.body;
    const { id } = req.params;
    
    // Update order status with the validated data
    const order = await orderService.updateOrderStatusService(id, status);
    
    // If there are notes, update them as well
    if (notes) {
      await orderService.updateOrder(id, { notes });
    }
    
    // Get the updated order with all fields
    const updatedOrder = await orderService.getOrderByIdService(id);
    
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
    await orderService.deleteOrderService(req.params.id);
    ApiResponse.send(res, ApiResponse.success(null, "Order deleted successfully", 204));
  } catch (error: any) {
    ApiResponse.send(res, ApiResponse.error(error.message, 400));
  }
};