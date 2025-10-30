import { UserRole } from '@prisma/client';

// Permission constants for easy reference (matches Prisma enum)
export const PERMISSIONS = {
  // User permissions
  USER_CREATE: 'USER_CREATE',
  USER_READ: 'USER_READ',
  USER_UPDATE: 'USER_UPDATE',
  USER_DELETE: 'USER_DELETE',

  // Restaurant permissions
  RESTAURANT_CREATE: 'RESTAURANT_CREATE',
  RESTAURANT_READ: 'RESTAURANT_READ',
  RESTAURANT_UPDATE: 'RESTAURANT_UPDATE',
  RESTAURANT_DELETE: 'RESTAURANT_DELETE',
  RESTAURANT_BRANCH_MANAGE: 'RESTAURANT_BRANCH_MANAGE',

  // Manager permissions
  MANAGER_CREATE: 'MANAGER_CREATE',
  MANAGER_READ: 'MANAGER_READ',
  MANAGER_UPDATE: 'MANAGER_UPDATE',
  MANAGER_DELETE: 'MANAGER_DELETE',

  // Order permissions
  ORDER_CREATE: 'ORDER_CREATE',
  ORDER_READ: 'ORDER_READ',
  ORDER_UPDATE: 'ORDER_UPDATE',
  ORDER_DELETE: 'ORDER_DELETE',

  // Product permissions
  PRODUCT_CREATE: 'PRODUCT_CREATE',
  PRODUCT_READ: 'PRODUCT_READ',
  PRODUCT_UPDATE: 'PRODUCT_UPDATE',
  PRODUCT_DELETE: 'PRODUCT_DELETE',

  // POS permissions
  POS_CREATE: 'POS_CREATE',
  POS_READ: 'POS_READ',
  POS_UPDATE: 'POS_UPDATE',
  POS_DELETE: 'POS_DELETE',

  // Menu permissions
  MENU_CREATE: 'MENU_CREATE',
  MENU_READ: 'MENU_READ',
  MENU_UPDATE: 'MENU_UPDATE',
  MENU_DELETE: 'MENU_DELETE',

  // Supplier permissions
  SUPPLIER_CREATE: 'SUPPLIER_CREATE',
  SUPPLIER_READ: 'SUPPLIER_READ',
  SUPPLIER_UPDATE: 'SUPPLIER_UPDATE',
  SUPPLIER_DELETE: 'SUPPLIER_DELETE',

  // Purchase Order permissions
  PURCHASE_ORDER_CREATE: 'PURCHASE_ORDER_CREATE',
  PURCHASE_ORDER_READ: 'PURCHASE_ORDER_READ',
  PURCHASE_ORDER_UPDATE: 'PURCHASE_ORDER_UPDATE',
  PURCHASE_ORDER_DELETE: 'PURCHASE_ORDER_DELETE',

  // Dashboard permissions
  DASHBOARD_READ: 'DASHBOARD_READ',
} as const;

// Helper function to get permissions for a role
export const getPermissionsForRole = (role: UserRole): string[] => {
  const basePermissions = [PERMISSIONS.USER_READ];

  const rolePermissions: Record<UserRole, string[]> = {
    [UserRole.ADMIN]: [
      ...basePermissions,
      PERMISSIONS.USER_CREATE,
      PERMISSIONS.USER_UPDATE,
      PERMISSIONS.USER_DELETE,
      PERMISSIONS.POS_CREATE,
      PERMISSIONS.POS_READ,
      PERMISSIONS.POS_UPDATE,
      PERMISSIONS.POS_DELETE,
      PERMISSIONS.MANAGER_CREATE,
      PERMISSIONS.MANAGER_READ,
      PERMISSIONS.MANAGER_UPDATE,
      PERMISSIONS.MENU_CREATE,
      PERMISSIONS.MENU_READ,
      PERMISSIONS.MENU_UPDATE,
      PERMISSIONS.MENU_DELETE,
      PERMISSIONS.ORDER_CREATE,
      PERMISSIONS.ORDER_READ,
      PERMISSIONS.ORDER_UPDATE,
      PERMISSIONS.ORDER_DELETE,
      PERMISSIONS.PRODUCT_READ,
      PERMISSIONS.PRODUCT_CREATE,
      PERMISSIONS.PRODUCT_UPDATE,
      PERMISSIONS.PRODUCT_DELETE,
      PERMISSIONS.DASHBOARD_READ,
    ],
    [UserRole.MANAGER]: [
      ...basePermissions,
      PERMISSIONS.USER_READ,
      PERMISSIONS.USER_UPDATE,
      PERMISSIONS.POS_CREATE,
      PERMISSIONS.POS_READ,
      PERMISSIONS.POS_UPDATE,
      PERMISSIONS.MENU_CREATE,
      PERMISSIONS.MENU_READ,
      PERMISSIONS.MENU_UPDATE,
      PERMISSIONS.MENU_DELETE,
      PERMISSIONS.ORDER_CREATE,
      PERMISSIONS.ORDER_READ,
      PERMISSIONS.ORDER_UPDATE,
      PERMISSIONS.ORDER_DELETE,
      PERMISSIONS.PRODUCT_READ,
      PERMISSIONS.DASHBOARD_READ,
    ],
    [UserRole.SUPER_ADMIN]: [
      ...basePermissions,
      PERMISSIONS.USER_CREATE,
      PERMISSIONS.USER_UPDATE,
      PERMISSIONS.USER_DELETE,
      PERMISSIONS.POS_CREATE,
      PERMISSIONS.POS_READ,
      PERMISSIONS.POS_UPDATE,
      PERMISSIONS.POS_DELETE,
      PERMISSIONS.MANAGER_CREATE,
      PERMISSIONS.MANAGER_READ,
      PERMISSIONS.MANAGER_UPDATE,
      PERMISSIONS.MENU_CREATE,
      PERMISSIONS.MENU_READ,
      PERMISSIONS.MENU_UPDATE,
      PERMISSIONS.MENU_DELETE,
      PERMISSIONS.ORDER_CREATE,
      PERMISSIONS.ORDER_READ,
      PERMISSIONS.ORDER_UPDATE,
      PERMISSIONS.ORDER_DELETE,
      PERMISSIONS.PRODUCT_READ,
      PERMISSIONS.PRODUCT_CREATE,
      PERMISSIONS.PRODUCT_UPDATE,
      PERMISSIONS.PRODUCT_DELETE,
      PERMISSIONS.DASHBOARD_READ,
    ],
    [UserRole.RESTAURANT]: [
      ...basePermissions,
      PERMISSIONS.USER_READ,
      PERMISSIONS.USER_UPDATE,
      PERMISSIONS.POS_CREATE,
      PERMISSIONS.POS_READ,
      PERMISSIONS.POS_UPDATE,
      PERMISSIONS.MENU_CREATE,
      PERMISSIONS.MENU_READ,
      PERMISSIONS.MENU_UPDATE,
      PERMISSIONS.MENU_DELETE,
      PERMISSIONS.ORDER_CREATE,
      PERMISSIONS.ORDER_READ,
      PERMISSIONS.ORDER_UPDATE,
      PERMISSIONS.ORDER_DELETE,
      PERMISSIONS.PRODUCT_READ,
      PERMISSIONS.DASHBOARD_READ,
    ],
    [UserRole.SUPPLIER_MANAGER]: [
      ...basePermissions,
      PERMISSIONS.USER_READ,
      PERMISSIONS.USER_UPDATE,
      PERMISSIONS.ORDER_CREATE,
      PERMISSIONS.ORDER_READ,
      PERMISSIONS.ORDER_UPDATE,
      PERMISSIONS.ORDER_DELETE,
      PERMISSIONS.PRODUCT_READ,
      PERMISSIONS.DASHBOARD_READ,
    ],
    [UserRole.KITCHEN_STAFF]: [
      ...basePermissions,
      PERMISSIONS.ORDER_READ,
      PERMISSIONS.ORDER_UPDATE,
    ],
    [UserRole.CUSTOMER]: basePermissions,
    [UserRole.CASHIER]: [
      ...basePermissions,
      PERMISSIONS.ORDER_READ,
      PERMISSIONS.ORDER_UPDATE,
    ],
    [UserRole.WAITER]: [
      ...basePermissions,
      PERMISSIONS.ORDER_READ,
      PERMISSIONS.ORDER_UPDATE,
    ],
  };

  return rolePermissions[role] || [];
};

export interface JwtPayload {
  userId: string;
  email: string;
  role: UserRole;
  branchId?: string;
  branch?: string;
  permissions: string[];
  iat?: number;
  exp?: number;
  Id?:string;
};

export type RequestWithUser = Request & {
  user: JwtPayload;
};

// Helper function to check if user has any of the required permissions
export const hasPermission = (user: JwtPayload, requiredPermissions: string[]): boolean => {
  if (user.role === UserRole.ADMIN || user.role === UserRole.SUPER_ADMIN) return true;

  if (!user.permissions || user.permissions.length === 0) {
    console.log("No permissions found for user");
    return false;
  }

  console.log("User permissions:", user.permissions);
  console.log("Required permissions (any of):", requiredPermissions);

  // Check if user has ANY of the required permissions
  const hasPermission = requiredPermissions.some(permission =>
    user.permissions.includes(permission)
  );

  console.log("Has permission:", hasPermission);
  return hasPermission;
};