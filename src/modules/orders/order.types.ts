import { Order, OrderItem, OrderStatus, PaymentStatus, OrderType, PaymentMethod, Prisma } from '@prisma/client';

export interface OrderWithItems extends Order {
  items: OrderItem[];
  branch?: {
    id: string;
    name: string;
  };
  createdBy?: {
    id: string;
    name: string;
    email: string;
  };
  payment?: {
    id: string;
    status: string;
    amount: number;
    method: string;
  };
}

export interface CreateOrderInput {
  items: Array<{
    menuItemId: string;
    quantity: number;
    price: number;
    notes?: string;
    modifiers?: string[];
  }>;
  customerName?: string;
  customerPhone?: string;
  customerEmail?: string;
  tableNumber?: string;
  orderType: OrderType;
  paymentMethod: PaymentMethod;
  branchId: string;
  notes?: string;
}

export interface UpdateOrderInput extends Partial<CreateOrderInput> {
  status?: OrderStatus;
  paymentStatus?: PaymentStatus;
}

export interface OrderQueryParams {
  status?: OrderStatus;
  paymentStatus?: PaymentStatus;
  orderType?: OrderType;
  branchId?: string;
  search?: string;
  startDate?: string;
  endDate?: string;
  page?: number;
  pageSize?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface OrderStats {
  totalOrders: number;
  totalRevenue: number;
  averageOrderValue: number;
  ordersByStatus: Record<string, number>;
  ordersByType: Record<string, number>;
  revenueByPaymentMethod: Record<string, number>;
  recentOrders: OrderWithItems[];
}

export interface OrderResponse {
  success: boolean;
  data: OrderWithItems | OrderWithItems[] | OrderStats | null;
  message: string;
  meta?: {
    total: number;
    page: number;
    pageSize: number;
    totalPages: number;
  };
}
