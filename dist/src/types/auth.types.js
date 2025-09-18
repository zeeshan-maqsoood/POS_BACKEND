"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.hasPermission = exports.RolePermissions = exports.getPermissionsForRole = exports.PERMISSIONS = void 0;
const client_1 = require("@prisma/client");
// Explicitly type the permissions to ensure they match the Prisma schema
exports.PERMISSIONS = {
    // User permissions
    USER_CREATE: 'USER_CREATE',
    USER_READ: 'USER_READ',
    USER_UPDATE: 'USER_UPDATE',
    USER_DELETE: 'USER_DELETE',
    // Manager permissions
    MANAGER_CREATE: 'MANAGER_CREATE',
    MANAGER_READ: 'MANAGER_READ',
    MANAGER_UPDATE: 'MANAGER_UPDATE',
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
};
// Helper to get all permissions for a role
const getPermissionsForRole = (role) => {
    const permissions = [];
    // Base permissions for all roles
    const basePermissions = [
        exports.PERMISSIONS.USER_READ, // All users can view their own profile
    ];
    // Role-specific permissions
    const rolePermissions = {
        [client_1.UserRole.ADMIN]: [
            ...basePermissions,
            exports.PERMISSIONS.USER_CREATE,
            exports.PERMISSIONS.USER_UPDATE,
            exports.PERMISSIONS.USER_DELETE,
            exports.PERMISSIONS.POS_CREATE,
            exports.PERMISSIONS.POS_READ,
            exports.PERMISSIONS.POS_UPDATE,
            exports.PERMISSIONS.POS_DELETE,
            exports.PERMISSIONS.MANAGER_CREATE,
            exports.PERMISSIONS.MANAGER_READ,
            exports.PERMISSIONS.MANAGER_UPDATE,
            exports.PERMISSIONS.MENU_CREATE,
            exports.PERMISSIONS.MENU_READ,
            exports.PERMISSIONS.MENU_UPDATE,
            exports.PERMISSIONS.MENU_DELETE,
            exports.PERMISSIONS.ORDER_CREATE,
            exports.PERMISSIONS.ORDER_READ,
            exports.PERMISSIONS.ORDER_UPDATE,
            exports.PERMISSIONS.ORDER_DELETE,
            exports.PERMISSIONS.PRODUCT_READ,
            exports.PERMISSIONS.PRODUCT_CREATE,
            exports.PERMISSIONS.PRODUCT_UPDATE,
            exports.PERMISSIONS.PRODUCT_DELETE,
        ],
        [client_1.UserRole.MANAGER]: [
            ...basePermissions,
            exports.PERMISSIONS.USER_READ,
            exports.PERMISSIONS.USER_UPDATE,
            exports.PERMISSIONS.POS_CREATE,
            exports.PERMISSIONS.POS_READ,
            exports.PERMISSIONS.POS_UPDATE,
            exports.PERMISSIONS.MENU_CREATE,
            exports.PERMISSIONS.MENU_READ,
            exports.PERMISSIONS.MENU_UPDATE,
            exports.PERMISSIONS.MENU_DELETE,
            exports.PERMISSIONS.ORDER_CREATE,
            exports.PERMISSIONS.ORDER_READ,
            exports.PERMISSIONS.ORDER_UPDATE,
            exports.PERMISSIONS.ORDER_DELETE,
            exports.PERMISSIONS.PRODUCT_READ,
        ],
        [client_1.UserRole.USER]: basePermissions,
    };
    return rolePermissions[role] || [];
};
exports.getPermissionsForRole = getPermissionsForRole;
exports.RolePermissions = {
    [client_1.UserRole.ADMIN]: (0, exports.getPermissionsForRole)(client_1.UserRole.ADMIN),
    [client_1.UserRole.MANAGER]: (0, exports.getPermissionsForRole)(client_1.UserRole.MANAGER),
    [client_1.UserRole.USER]: (0, exports.getPermissionsForRole)(client_1.UserRole.USER),
};
// Helper function to check if user has required permissions
const hasPermission = (user, requiredPermissions) => {
    if (user.role === client_1.UserRole.ADMIN)
        return true;
    if (!user.permissions)
        return false;
    console.log(user, "user");
    return requiredPermissions.every(permission => {
        console.log(permission, "permission");
        console.log(user.permissions, "user.permissions");
        console.log(user.permissions.includes(permission), "user.permissions.includes(permission)");
        const isPermissionValid = user.permissions.includes(permission);
        console.log(isPermissionValid, "isPermissionValid");
        return user.permissions.includes(permission);
    });
};
exports.hasPermission = hasPermission;
//# sourceMappingURL=auth.types.js.map