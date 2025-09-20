import { OrderStatus, Prisma, PaymentMethod, PaymentStatus, OrderType } from '@prisma/client';
interface OrderFilterOptions {
    status?: OrderStatus;
    paymentStatus?: PaymentStatus;
    orderType?: OrderType;
    startDate?: Date;
    endDate?: Date;
    search?: string;
    page?: number;
    pageSize?: number;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
}
interface OrderItemInput {
    menuItemId: string;
    name: string;
    price: number;
    quantity: number;
    taxRate: number;
    total: number;
    notes?: string;
}
interface CreateOrderInput {
    tableNumber?: string | null;
    customerName?: string | null;
    customerEmail?: string | null;
    customerPhone?: string | null;
    items: OrderItemInput[];
    paymentMethod: PaymentMethod;
    paymentStatus?: PaymentStatus;
    status?: OrderStatus;
    orderType?: OrderType;
    notes?: string | null;
    total?: number;
    subtotal?: number;
    tax?: number;
    discount?: number;
    branchName?: string | null;
    createdById?: string | null;
}
export declare const createOrderService: (data: CreateOrderInput) => Promise<{
    createdBy: {
        email: string;
        id: string;
        name: string | null;
    } | null;
    items: {
        id: string;
        name: string;
        createdAt: Date;
        updatedAt: Date;
        taxRate: number;
        price: number;
        modifiers: Prisma.JsonValue | null;
        tax: number;
        total: number;
        notes: string | null;
        orderId: string;
        menuItemId: string | null;
        quantity: number;
    }[];
} & {
    id: string;
    createdAt: Date;
    updatedAt: Date;
    createdById: string | null;
    orderNumber: string;
    orderType: import(".prisma/client").$Enums.OrderType;
    status: import(".prisma/client").$Enums.OrderStatus;
    paymentStatus: import(".prisma/client").$Enums.PaymentStatus;
    paymentMethod: import(".prisma/client").$Enums.PaymentMethod | null;
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
}>;
export declare const getOrdersService: (options?: OrderFilterOptions) => Promise<{
    data: ({
        createdBy: {
            email: string;
            id: string;
            name: string | null;
        } | null;
        items: {
            id: string;
            name: string;
            createdAt: Date;
            updatedAt: Date;
            taxRate: number;
            price: number;
            modifiers: Prisma.JsonValue | null;
            tax: number;
            total: number;
            notes: string | null;
            orderId: string;
            menuItemId: string | null;
            quantity: number;
        }[];
        payments: {
            id: string;
            createdAt: Date;
            status: import(".prisma/client").$Enums.PaymentStatus;
            orderId: string;
            method: import(".prisma/client").$Enums.PaymentMethod;
            amount: number;
            transactionId: string | null;
        }[];
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        createdById: string | null;
        orderNumber: string;
        orderType: import(".prisma/client").$Enums.OrderType;
        status: import(".prisma/client").$Enums.OrderStatus;
        paymentStatus: import(".prisma/client").$Enums.PaymentStatus;
        paymentMethod: import(".prisma/client").$Enums.PaymentMethod | null;
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
    })[];
    meta: {
        total: number;
        page: number;
        pageSize: number;
        totalPages: number;
    };
}>;
export declare const getOrderByIdService: (id: string) => Promise<{
    createdBy: {
        email: string;
        id: string;
        name: string | null;
    } | null;
    items: ({
        menuItem: {
            id: string;
            name: string;
            createdAt: Date;
            updatedAt: Date;
            description: string | null;
            tags: string[];
            taxRate: number;
            taxExempt: boolean;
            categoryId: string;
            imageUrl: string | null;
            isActive: boolean;
            price: number;
            cost: number | null;
        } | null;
    } & {
        id: string;
        name: string;
        createdAt: Date;
        updatedAt: Date;
        taxRate: number;
        price: number;
        modifiers: Prisma.JsonValue | null;
        tax: number;
        total: number;
        notes: string | null;
        orderId: string;
        menuItemId: string | null;
        quantity: number;
    })[];
    payments: {
        id: string;
        createdAt: Date;
        status: import(".prisma/client").$Enums.PaymentStatus;
        orderId: string;
        method: import(".prisma/client").$Enums.PaymentMethod;
        amount: number;
        transactionId: string | null;
    }[];
} & {
    id: string;
    createdAt: Date;
    updatedAt: Date;
    createdById: string | null;
    orderNumber: string;
    orderType: import(".prisma/client").$Enums.OrderType;
    status: import(".prisma/client").$Enums.OrderStatus;
    paymentStatus: import(".prisma/client").$Enums.PaymentStatus;
    paymentMethod: import(".prisma/client").$Enums.PaymentMethod | null;
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
}>;
export declare const updateOrderStatusService: (id: string, status: OrderStatus, notes?: string) => Promise<{
    createdBy: {
        email: string;
        id: string;
        name: string | null;
    } | null;
    items: ({
        menuItem: {
            id: string;
            name: string;
            createdAt: Date;
            updatedAt: Date;
            description: string | null;
            tags: string[];
            taxRate: number;
            taxExempt: boolean;
            categoryId: string;
            imageUrl: string | null;
            isActive: boolean;
            price: number;
            cost: number | null;
        } | null;
    } & {
        id: string;
        name: string;
        createdAt: Date;
        updatedAt: Date;
        taxRate: number;
        price: number;
        modifiers: Prisma.JsonValue | null;
        tax: number;
        total: number;
        notes: string | null;
        orderId: string;
        menuItemId: string | null;
        quantity: number;
    })[];
} & {
    id: string;
    createdAt: Date;
    updatedAt: Date;
    createdById: string | null;
    orderNumber: string;
    orderType: import(".prisma/client").$Enums.OrderType;
    status: import(".prisma/client").$Enums.OrderStatus;
    paymentStatus: import(".prisma/client").$Enums.PaymentStatus;
    paymentMethod: import(".prisma/client").$Enums.PaymentMethod | null;
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
}>;
export declare const updateOrder: (id: string, data: Partial<Prisma.OrderUpdateInput>) => Promise<{
    items: {
        id: string;
        name: string;
        createdAt: Date;
        updatedAt: Date;
        taxRate: number;
        price: number;
        modifiers: Prisma.JsonValue | null;
        tax: number;
        total: number;
        notes: string | null;
        orderId: string;
        menuItemId: string | null;
        quantity: number;
    }[];
} & {
    id: string;
    createdAt: Date;
    updatedAt: Date;
    createdById: string | null;
    orderNumber: string;
    orderType: import(".prisma/client").$Enums.OrderType;
    status: import(".prisma/client").$Enums.OrderStatus;
    paymentStatus: import(".prisma/client").$Enums.PaymentStatus;
    paymentMethod: import(".prisma/client").$Enums.PaymentMethod | null;
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
}>;
export declare const getOrderStatsService: (options?: OrderFilterOptions) => Promise<{
    data: {
        totalOrders: number;
        totalRevenue: number;
        ordersByStatus: Record<import(".prisma/client").$Enums.OrderStatus, number>;
        revenueByStatus: Record<import(".prisma/client").$Enums.OrderStatus, number>;
        paymentStatus: Record<string, number>;
        recentOrders: {
            createdBy: {
                id: string;
                name: string;
                email: string;
            } | null;
            items: {
                id: string;
                name: string;
                price: number;
                quantity: number;
                total: number;
            }[];
            id: string;
        }[];
    };
    meta: {
        total: number;
        page: number;
        pageSize: number;
        totalPages: number;
    };
}>;
export declare const updatePaymentStatusService: (id: string, paymentStatus: PaymentStatus, paymentMethod: PaymentMethod) => Promise<{
    items: {
        id: string;
        name: string;
        createdAt: Date;
        updatedAt: Date;
        taxRate: number;
        price: number;
        modifiers: Prisma.JsonValue | null;
        tax: number;
        total: number;
        notes: string | null;
        orderId: string;
        menuItemId: string | null;
        quantity: number;
    }[];
} & {
    id: string;
    createdAt: Date;
    updatedAt: Date;
    createdById: string | null;
    orderNumber: string;
    orderType: import(".prisma/client").$Enums.OrderType;
    status: import(".prisma/client").$Enums.OrderStatus;
    paymentStatus: import(".prisma/client").$Enums.PaymentStatus;
    paymentMethod: import(".prisma/client").$Enums.PaymentMethod | null;
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
}>;
export declare const deleteOrderService: (id: string) => Promise<{
    id: string;
    createdAt: Date;
    updatedAt: Date;
    createdById: string | null;
    orderNumber: string;
    orderType: import(".prisma/client").$Enums.OrderType;
    status: import(".prisma/client").$Enums.OrderStatus;
    paymentStatus: import(".prisma/client").$Enums.PaymentStatus;
    paymentMethod: import(".prisma/client").$Enums.PaymentMethod | null;
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
}>;
export {};
