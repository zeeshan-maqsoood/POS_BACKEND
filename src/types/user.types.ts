import { UserRole, Permission, UserStatus } from '@prisma/client';

export interface CreateUserInput {
  email: string;
  password: string;
  name?: string;
  branch?: string | null;
  branchId?: string;
  restaurantId?: string;
  role?: UserRole;
  status?: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED';
  permissions?: Permission[];
  createdById?: string;
  // Shift management fields
  shiftSchedule?: {
    MONDAY?: { startTime?: string; endTime?: string };
    TUESDAY?: { startTime?: string; endTime?: string };
    WEDNESDAY?: { startTime?: string; endTime?: string };
    THURSDAY?: { startTime?: string; endTime?: string };
    FRIDAY?: { startTime?: string; endTime?: string };
    SATURDAY?: { startTime?: string; endTime?: string };
    SUNDAY?: { startTime?: string; endTime?: string };
  };
  isShiftActive?: boolean;
}

export interface UpdateUserInput {
  name?: string;
  email?: string;
  password?: string;
  branch?: string | null;
  branchId?: string;
  restaurantId?: string;
  role?: UserRole;
  status?: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED';
  permissions?: Permission[];
  // Shift management fields
  shiftSchedule?: {
    MONDAY?: { startTime?: string; endTime?: string };
    TUESDAY?: { startTime?: string; endTime?: string };
    WEDNESDAY?: { startTime?: string; endTime?: string };
    THURSDAY?: { startTime?: string; endTime?: string };
    FRIDAY?: { startTime?: string; endTime?: string };
    SATURDAY?: { startTime?: string; endTime?: string };
    SUNDAY?: { startTime?: string; endTime?: string };
  } | null;
  isShiftActive?: boolean | null;
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
  branch: {
    id: string;
    name: string;
    restaurant: {
      id: string;
      name: string;
    } | null;
  } | null;
  role: UserRole;
  status: UserStatus;
  permissions: UserPermission[];
  createdAt: Date;
  updatedAt: Date;
  // Shift management fields
  shiftSchedule?: {
    MONDAY?: { startTime?: string; endTime?: string };
    TUESDAY?: { startTime?: string; endTime?: string };
    WEDNESDAY?: { startTime?: string; endTime?: string };
    THURSDAY?: { startTime?: string; endTime?: string };
    FRIDAY?: { startTime?: string; endTime?: string };
    SATURDAY?: { startTime?: string; endTime?: string };
    SUNDAY?: { startTime?: string; endTime?: string };
  } | null;
  isShiftActive?: boolean | null;
}

export interface UserWithToken {
  user: Omit<SafeUser, 'password'>;
  token: string;
}
