import { Permission } from '@prisma/client';
import { JwtPayload } from '../../types/auth.types';
import { CreateUserInput, UpdateUserInput, SafeUser } from '../../types/user.types';
type LoginResponse = {
    user: Omit<SafeUser, 'permissions'> & {
        permissions: string[];
    };
    token: string;
};
export declare const userService: {
    createUser: (data: CreateUserInput, currentUser?: JwtPayload) => Promise<SafeUser>;
    createManager: (data: Omit<CreateUserInput, "role" | "permissions" | "branch"> & {
        permissions?: Permission[];
        branch?: string | null;
    }, currentUser: JwtPayload) => Promise<SafeUser>;
    getAllUsers: (currentUser: JwtPayload) => Promise<SafeUser[]>;
    getUserById: (id: string, currentUser: JwtPayload) => Promise<SafeUser | null>;
    getProfile: (userId: string) => Promise<SafeUser>;
    updateUser: (id: string, data: UpdateUserInput, currentUser: JwtPayload) => Promise<SafeUser>;
    deleteUser: (id: string, currentUser: JwtPayload) => Promise<void>;
    login: (email: string, password: string) => Promise<LoginResponse>;
};
export {};
