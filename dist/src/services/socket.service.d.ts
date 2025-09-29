import { Server as HttpServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';
export type UserRole = 'ADMIN' | 'MANAGER' | 'KITCHEN_STAFF' | 'CASHIER' | 'WAITER' | 'USER';
export interface UserConnection {
    socketId: string;
    role: UserRole;
    branchId?: string;
    [key: string]: string | undefined;
}
export declare const initializeSocket: (server: HttpServer) => {
    readonly io: SocketIOServer<import("socket.io").DefaultEventsMap, import("socket.io").DefaultEventsMap, import("socket.io").DefaultEventsMap, any>;
    readonly getUserConnections: () => Map<string, UserConnection>;
};
export type SocketService = ReturnType<typeof initializeSocket>;
