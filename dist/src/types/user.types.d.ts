import { UserRole, Permission } from '@prisma/client';
export interface CreateUserInput {
    email: string;
    password: string;
    name?: string;
    branch?: string | null;
    role?: UserRole;
    status?: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED';
    permissions?: Permission[];
    createdById?: string;
}
export interface UpdateUserInput {
    name?: string;
    email?: string;
    password?: string;
    branch?: string | null;
    role?: UserRole;
    status?: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED';
    permissions?: Permission[];
}
export interface LoginInput {
    email: string;
    password: string;
}
export interface UserPermission {
    id: string;
    userId: string;
    permission: Permission;
    createdAt: Date;
}
export interface SafeUser {
    id: string;
    email: string;
    name: string | null;
    branch: string | null;
    role: UserRole;
    permissions: UserPermission[];
    createdAt: Date;
    updatedAt: Date;
}
export interface UserWithToken {
    user: Omit<SafeUser, 'password'>;
    token: string;
}
