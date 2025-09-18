import { UserRole } from '@prisma/client';

// Explicitly type the permissions to ensure they match the Prisma schema
export const PERMISSIONS = {
  // User permissions
  USER_CREATE: 'USER_CREATE' as const,
  USER_READ: 'USER_READ' as const,
  USER_UPDATE: 'USER_UPDATE' as const,
  USER_DELETE: 'USER_DELETE' as const,
  
  // Manager permissions
  MANAGER_CREATE: 'MANAGER_CREATE' as const,
  MANAGER_READ: 'MANAGER_READ' as const,
  MANAGER_UPDATE: 'MANAGER_UPDATE' as const,
  
  // Order permissions
  ORDER_CREATE: 'ORDER_CREATE' as const,
  ORDER_READ: 'ORDER_READ' as const,
  ORDER_UPDATE: 'ORDER_UPDATE' as const,
  ORDER_DELETE: 'ORDER_DELETE' as const,
  
  // Product permissions
  PRODUCT_CREATE: 'PRODUCT_CREATE' as const,
  PRODUCT_READ: 'PRODUCT_READ' as const,
  PRODUCT_UPDATE: 'PRODUCT_UPDATE' as const,
  PRODUCT_DELETE: 'PRODUCT_DELETE' as const,
  
  // POS permissions
  POS_CREATE: 'POS_CREATE' as const,
  POS_READ: 'POS_READ' as const,
  POS_UPDATE: 'POS_UPDATE' as const,
  POS_DELETE: 'POS_DELETE' as const,

  // Menu permissions
  MENU_CREATE: 'MENU_CREATE' as const,
  MENU_READ: 'MENU_READ' as const,
  MENU_UPDATE: 'MENU_UPDATE' as const,
  MENU_DELETE: 'MENU_DELETE' as const,
} as const;

type PermissionKey = keyof typeof PERMISSIONS;
type PermissionValue = typeof PERMISSIONS[PermissionKey];

// Override the Permission type from Prisma to ensure type safety
export type Permission = PermissionValue;

export type JwtPayload = {
  userId: string;
  email: string;
  role: UserRole;
  permissions: Permission[];
  iat?: number;
  exp?: number;
};

export type RequestWithUser = Request & {
  user: JwtPayload;
};

type RolePermissionsType = Record<UserRole, Permission[]>;

// Helper to get all permissions for a role
export const getPermissionsForRole = (role: UserRole): Permission[] => {
  const permissions: Permission[] = [];
  
  // Base permissions for all roles
  const basePermissions: Permission[] = [
    PERMISSIONS.USER_READ,  // All users can view their own profile
  ];

  // Role-specific permissions
  const rolePermissions: Record<UserRole, Permission[]> = {
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
    ],
    [UserRole.USER]: basePermissions,
  };

  return rolePermissions[role] || [];
};

export const RolePermissions: RolePermissionsType = {
  [UserRole.ADMIN]: getPermissionsForRole(UserRole.ADMIN),
  [UserRole.MANAGER]: getPermissionsForRole(UserRole.MANAGER),
  [UserRole.USER]: getPermissionsForRole(UserRole.USER),
};

// Helper function to check if user has required permissions
export const hasPermission = (user: JwtPayload, requiredPermissions: Permission[]): boolean => {
  if (user.role === UserRole.ADMIN) return true;
  
  if (!user.permissions) return false;
  console.log(user,"user")
  return requiredPermissions.every(permission => 
  {
    console.log(permission,"permission")
    console.log(user.permissions,"user.permissions")
    console.log(user.permissions.includes(permission),"user.permissions.includes(permission)")
    const isPermissionValid=user.permissions.includes(permission)
    console.log(isPermissionValid,"isPermissionValid")

    return (user.permissions as string[]).includes(permission)
  }
  );
};
