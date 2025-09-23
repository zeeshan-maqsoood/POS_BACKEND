import { OrderStatus, PaymentMethod, PaymentStatus, OrderType, Prisma } from "@prisma/client";
import { JwtPayload } from "../../types/auth.types";
import { CreateOrderInput, UpdateOrderInput, GetOrdersQuery, OrderResponse } from "../../types/order.types";
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
export declare const orderService: {
    createOrder: (data: CreateOrderInput, currentUser: JwtPayload) => Promise<{
        items: {
            id: string;
            name: string;
            createdAt: Date;
            updatedAt: Date;
            taxRate: number;
            price: number;
            modifiers: Prisma.JsonValue | null;
            menuItemId: string | null;
            total: number;
            tax: number;
            notes: string | null;
            quantity: number;
            orderId: string;
        }[];
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        status: import(".prisma/client").$Enums.OrderStatus;
        createdById: string | null;
        branchName: string | null;
        paymentMethod: import(".prisma/client").$Enums.PaymentMethod | null;
        paymentStatus: import(".prisma/client").$Enums.PaymentStatus;
        total: number;
        orderNumber: string;
        orderType: import(".prisma/client").$Enums.OrderType;
        subtotal: number;
        tax: number;
        discount: number | null;
        tableNumber: string | null;
        customerName: string | null;
        customerEmail: string | null;
        customerPhone: string | null;
        notes: string | null;
    }>;
    getOrders: (query: GetOrdersQuery, currentUser: JwtPayload) => Promise<OrderResponse>;
    getOrderById: (id: string, currentUser: JwtPayload) => Promise<{
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
            menuItemId: string | null;
            total: number;
            tax: number;
            notes: string | null;
            quantity: number;
            orderId: string;
        }[];
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        status: import(".prisma/client").$Enums.OrderStatus;
        createdById: string | null;
        branchName: string | null;
        paymentMethod: import(".prisma/client").$Enums.PaymentMethod | null;
        paymentStatus: import(".prisma/client").$Enums.PaymentStatus;
        total: number;
        orderNumber: string;
        orderType: import(".prisma/client").$Enums.OrderType;
        subtotal: number;
        tax: number;
        discount: number | null;
        tableNumber: string | null;
        customerName: string | null;
        customerEmail: string | null;
        customerPhone: string | null;
        notes: string | null;
    }>;
    updateOrder: (id: string, data: UpdateOrderInput, currentUser: JwtPayload) => Promise<{
        items: {
            id: string;
            name: string;
            createdAt: Date;
            updatedAt: Date;
            taxRate: number;
            price: number;
            modifiers: Prisma.JsonValue | null;
            menuItemId: string | null;
            total: number;
            tax: number;
            notes: string | null;
            quantity: number;
            orderId: string;
        }[];
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        status: import(".prisma/client").$Enums.OrderStatus;
        createdById: string | null;
        branchName: string | null;
        paymentMethod: import(".prisma/client").$Enums.PaymentMethod | null;
        paymentStatus: import(".prisma/client").$Enums.PaymentStatus;
        total: number;
        orderNumber: string;
        orderType: import(".prisma/client").$Enums.OrderType;
        subtotal: number;
        tax: number;
        discount: number | null;
        tableNumber: string | null;
        customerName: string | null;
        customerEmail: string | null;
        customerPhone: string | null;
        notes: string | null;
    }>;
    deleteOrder: (id: string, currentUser: JwtPayload) => Promise<void>;
};
export default orderService;
export declare function createOrder(data: CreateOrderInput, currentUser: JwtPayload): Promise<OrderWithItems>;
interface GetOrdersServiceParams {
    status?: OrderStatus;
    paymentStatus?: PaymentStatus;
    orderType?: OrderType;
    branchName?: string;
    startDate?: Date;
    endDate?: Date;
    search?: string;
    page: number;
    pageSize: number;
    sortBy: string;
    sortOrder: 'asc' | 'desc';
}
export declare function getOrdersService(params: GetOrdersServiceParams, currentUser: JwtPayload): Promise<{
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
            menuItemId: string | null;
            total: number;
            tax: number;
            notes: string | null;
            quantity: number;
            orderId: string;
        }[];
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        status: import(".prisma/client").$Enums.OrderStatus;
        createdById: string | null;
        branchName: string | null;
        paymentMethod: import(".prisma/client").$Enums.PaymentMethod | null;
        paymentStatus: import(".prisma/client").$Enums.PaymentStatus;
        total: number;
        orderNumber: string;
        orderType: import(".prisma/client").$Enums.OrderType;
        subtotal: number;
        tax: number;
        discount: number | null;
        tableNumber: string | null;
        customerName: string | null;
        customerEmail: string | null;
        customerPhone: string | null;
        notes: string | null;
    })[];
    meta: {
        total: number;
        page: number;
        pageSize: number;
        totalPages: number;
    };
}>;
export declare function updatePaymentStatusService(id: string, paymentStatus: PaymentStatus, paymentMethod: PaymentMethod, currentUser?: JwtPayload): Promise<{
    items: {
        id: string;
        name: string;
        createdAt: Date;
        updatedAt: Date;
        taxRate: number;
        price: number;
        modifiers: Prisma.JsonValue | null;
        menuItemId: string | null;
        total: number;
        tax: number;
        notes: string | null;
        quantity: number;
        orderId: string;
    }[];
} & {
    id: string;
    createdAt: Date;
    updatedAt: Date;
    status: import(".prisma/client").$Enums.OrderStatus;
    createdById: string | null;
    branchName: string | null;
    paymentMethod: import(".prisma/client").$Enums.PaymentMethod | null;
    paymentStatus: import(".prisma/client").$Enums.PaymentStatus;
    total: number;
    orderNumber: string;
    orderType: import(".prisma/client").$Enums.OrderType;
    subtotal: number;
    tax: number;
    discount: number | null;
    tableNumber: string | null;
    customerName: string | null;
    customerEmail: string | null;
    customerPhone: string | null;
    notes: string | null;
}>;
export declare function getOrderStatsService(arg0: {
    startDate: Date | undefined;
    endDate: Date | undefined;
}): void;
export declare function getOrderByIdService(id: string, currentUser: JwtPayload): Promise<{
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
        menuItemId: string | null;
        total: number;
        tax: number;
        notes: string | null;
        quantity: number;
        orderId: string;
    }[];
} & {
    id: string;
    createdAt: Date;
    updatedAt: Date;
    status: import(".prisma/client").$Enums.OrderStatus;
    createdById: string | null;
    branchName: string | null;
    paymentMethod: import(".prisma/client").$Enums.PaymentMethod | null;
    paymentStatus: import(".prisma/client").$Enums.PaymentStatus;
    total: number;
    orderNumber: string;
    orderType: import(".prisma/client").$Enums.OrderType;
    subtotal: number;
    tax: number;
    discount: number | null;
    tableNumber: string | null;
    customerName: string | null;
    customerEmail: string | null;
    customerPhone: string | null;
    notes: string | null;
}>;
export declare function updateOrderStatusService(id: string, status: OrderStatus, currentUser: JwtPayload): Promise<{
    items: {
        id: string;
        name: string;
        createdAt: Date;
        updatedAt: Date;
        taxRate: number;
        price: number;
        modifiers: Prisma.JsonValue | null;
        menuItemId: string | null;
        total: number;
        tax: number;
        notes: string | null;
        quantity: number;
        orderId: string;
    }[];
} & {
    id: string;
    createdAt: Date;
    updatedAt: Date;
    status: import(".prisma/client").$Enums.OrderStatus;
    createdById: string | null;
    branchName: string | null;
    paymentMethod: import(".prisma/client").$Enums.PaymentMethod | null;
    paymentStatus: import(".prisma/client").$Enums.PaymentStatus;
    total: number;
    orderNumber: string;
    orderType: import(".prisma/client").$Enums.OrderType;
    subtotal: number;
    tax: number;
    discount: number | null;
    tableNumber: string | null;
    customerName: string | null;
    customerEmail: string | null;
    customerPhone: string | null;
    notes: string | null;
}>;
export declare function updateOrder(id: string, data: {
    notes: any;
}, currentUser?: JwtPayload): Promise<{
    items: {
        id: string;
        name: string;
        createdAt: Date;
        updatedAt: Date;
        taxRate: number;
        price: number;
        modifiers: Prisma.JsonValue | null;
        menuItemId: string | null;
        total: number;
        tax: number;
        notes: string | null;
        quantity: number;
        orderId: string;
    }[];
} & {
    id: string;
    createdAt: Date;
    updatedAt: Date;
    status: import(".prisma/client").$Enums.OrderStatus;
    createdById: string | null;
    branchName: string | null;
    paymentMethod: import(".prisma/client").$Enums.PaymentMethod | null;
    paymentStatus: import(".prisma/client").$Enums.PaymentStatus;
    total: number;
    orderNumber: string;
    orderType: import(".prisma/client").$Enums.OrderType;
    subtotal: number;
    tax: number;
    discount: number | null;
    tableNumber: string | null;
    customerName: string | null;
    customerEmail: string | null;
    customerPhone: string | null;
    notes: string | null;
}>;
export declare function deleteOrderService(id: string, currentUser?: JwtPayload): Promise<void>;
