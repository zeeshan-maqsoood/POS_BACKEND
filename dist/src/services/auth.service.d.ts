declare class AuthService {
    login(email: string, password: string): Promise<{
        user: {
            id: string;
            email: string;
            name: string | null;
            role: import(".prisma/client").$Enums.UserRole;
            permissions: ("USER_CREATE" | "USER_READ" | "USER_UPDATE" | "USER_DELETE" | "MANAGER_CREATE" | "MANAGER_READ" | "MANAGER_UPDATE" | "ORDER_CREATE" | "ORDER_READ" | "ORDER_UPDATE" | "ORDER_DELETE" | "PRODUCT_CREATE" | "PRODUCT_READ" | "PRODUCT_UPDATE" | "PRODUCT_DELETE" | "POS_CREATE" | "POS_READ" | "POS_UPDATE" | "POS_DELETE" | "MENU_CREATE" | "MENU_READ" | "MENU_UPDATE" | "MENU_DELETE")[];
            createdAt: Date;
            updatedAt: Date;
        };
        token: string;
    }>;
    getCurrentUser(userId: string): Promise<{
        id: string;
        email: string;
        name: string | null;
        role: import(".prisma/client").$Enums.UserRole;
        permissions: ("USER_CREATE" | "USER_READ" | "USER_UPDATE" | "USER_DELETE" | "MANAGER_CREATE" | "MANAGER_READ" | "MANAGER_UPDATE" | "ORDER_CREATE" | "ORDER_READ" | "ORDER_UPDATE" | "ORDER_DELETE" | "PRODUCT_CREATE" | "PRODUCT_READ" | "PRODUCT_UPDATE" | "PRODUCT_DELETE" | "POS_CREATE" | "POS_READ" | "POS_UPDATE" | "POS_DELETE" | "MENU_CREATE" | "MENU_READ" | "MENU_UPDATE" | "MENU_DELETE")[];
        createdAt: Date;
        updatedAt: Date;
    }>;
    private updateUserPermissions;
}
export declare const authService: AuthService;
export {};
