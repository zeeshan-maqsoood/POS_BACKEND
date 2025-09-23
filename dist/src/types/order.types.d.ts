import { OrderStatus, PaymentMethod, PaymentStatus, OrderType, Prisma } from "@prisma/client";
export interface OrderItem {
    id?: string;
    menuItemId?: string | null;
    name: string;
    quantity: number;
    price: number;
    taxRate: number;
    tax: number;
    total: number;
    notes?: string | null;
    modifiers?: any;
    orderId?: string;
    menuItem?: any;
    createdAt?: Date;
    updatedAt?: Date;
}
export interface GetOrdersQuery {
    status?: OrderStatus;
    paymentStatus?: PaymentStatus;
    orderType?: OrderType;
    branchName?: string;
    startDate?: string;
    endDate?: string;
    search?: string;
    page?: number | string;
    pageSize?: number | string;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
}
export interface OrderResponse {
    data: Order[];
    meta: {
        total: number;
        page: number;
        pageSize: number;
        totalPages: number;
    };
}
export interface Order {
    id: string;
    orderNumber: string;
    status: OrderStatus;
    paymentStatus: PaymentStatus;
    paymentMethod?: PaymentMethod | null;
    subtotal: number;
    tax: number;
    discount: number | null;
    total: number;
    tableNumber: string | null;
    customerName: string | null;
    customerEmail: string | null;
    customerPhone: string | null;
    notes: string | null;
    branchName: string | null;
    items: OrderItem[];
    createdBy: {
        id: string;
        name: string | null;
        email: string | null;
    } | null;
    createdAt: Date;
    updatedAt: Date;
}
export interface OrderItemInput {
    menuItemId: string;
    name: string;
    quantity: number;
    price: number;
    taxRate: number;
    tax: number;
    total: number;
    notes?: string | null;
    modifiers?: any;
}
export interface CreateOrderInput {
    orderNumber: string;
    orderType?: OrderType;
    status?: OrderStatus;
    paymentStatus?: PaymentStatus;
    paymentMethod?: PaymentMethod | null;
    subtotal: number;
    tax: number;
    discount?: number;
    total: number;
    tableNumber?: string | null;
    customerName?: string | null;
    customerEmail?: string | null;
    customerPhone?: string | null;
    notes?: string | null;
    branchName?: string | null;
    items: OrderItemInput[];
}
export interface UpdateOrderInput {
    status?: OrderStatus | Prisma.EnumOrderStatusFieldUpdateOperationsInput;
    paymentMethod?: PaymentMethod | Prisma.EnumPaymentMethodFieldUpdateOperationsInput;
    paymentStatus?: PaymentStatus | Prisma.EnumPaymentStatusFieldUpdateOperationsInput;
    total?: number | Prisma.FloatFieldUpdateOperationsInput;
    items?: OrderItemInput[];
    branchName?: string;
    [key: string]: any;
}
