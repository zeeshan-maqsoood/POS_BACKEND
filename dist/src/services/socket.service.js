"use strict";
// import { Server } from 'http';
// import { Server as SocketIOServer, Socket } from 'socket.io';
Object.defineProperty(exports, "__esModule", { value: true });
exports.initializeSocket = void 0;
const socket_io_1 = require("socket.io");
let io;
const initializeSocket = (server) => {
    io = new socket_io_1.Server(server, {
        cors: {
            origin: ["http://localhost:3000", "http://127.0.0.1:3000"], // allow both
            credentials: true
        },
    });
    const userConnections = new Map(); // userId -> UserConnection
    // Helper to get all users in a branch
    const getUsersInBranch = (branchId) => {
        return Array.from(userConnections.entries())
            .filter(([_, conn]) => conn.branchId && conn.branchId === branchId)
            .map(([userId, conn]) => ({
            userId,
            ...conn,
            branchId: conn.branchId // We know branchId is defined here due to the filter
        }));
    };
    // Helper to notify specific roles in a branch
    const notifyRolesInBranch = (branchId, roles, event, data) => {
        const users = getUsersInBranch(branchId)
            .filter(user => roles.includes(user.role));
        users.forEach(user => {
            io.to(user.socketId).emit(event, data);
        });
    };
    io.on('connection', (socket) => {
        console.log('A user connected:', socket.id);
        socket.emit("welcome", { message: "Welcome to the socket server" });
        // Handle user authentication
        socket.on('authenticate', (data) => {
            const { userId, role, branchId } = data;
            console.log(`User ${userId} (${role}) authenticated`);
            console.log(branchId, "branchId");
            if (branchId) {
                userConnections.set(userId, {
                    socketId: socket.id,
                    role,
                    branchId
                });
            }
            else {
                userConnections.set(userId, {
                    socketId: socket.id,
                    role
                });
            }
            if (branchId) {
                socket.join(`branch-${branchId}`);
                console.log(`User ${userId} joined branch-${branchId}`);
            }
        });
        // Handle order creation
        socket.on('new_order', (data) => {
            const { order, createdByRole } = data;
            let branchId = order.branchId;
            if (!branchId) {
                console.error('Order has no branchId');
                return;
            }
            if (createdByRole === "MANAGER" || createdByRole === "KITCHEN_STAFF") {
                const userId = [...userConnections.entries()].find(([_, conn]) => conn.socketId === socket.id)?.[0];
                console.log(userId, "userId");
                const userBranchId = userId ? userConnections.get(userId)?.branchId : null;
                console.log(userBranchId, "userBranchId");
                if (!userBranchId) {
                    throw new Error(`${createdByRole} has no branch assigned`);
                    return;
                }
                branchId = userBranchId;
            }
            if (createdByRole === 'ADMIN') {
                // Notify managers and kitchen staff
                notifyRolesInBranch(branchId, ['MANAGER', 'KITCHEN_STAFF'], 'new-order', {
                    order,
                    createdByRole,
                    message: 'New order created by admin'
                });
            }
            else if (createdByRole === 'MANAGER') {
                // Notify admins and kitchen staff
                notifyRolesInBranch(branchId, ['ADMIN', 'KITCHEN_STAFF'], 'new-order', {
                    order,
                    createdByRole,
                    message: 'New order created by manager'
                });
            }
        });
        // Handle order updates
        socket.on('order-updated', (data) => {
            const { order, updatedByRole } = data;
            let branchId = order.branchId;
            if (!branchId) {
                console.error('Order has no branchId');
                return;
            }
            // Notify all users in the branch about the update
            io.to(`branch-${branchId}`).emit('order-updated', {
                order,
                updatedByRole,
                message: `Order ${order.id} has been updated`
            });
        });
        // Handle disconnection
        socket.on('disconnect', () => {
            console.log('User disconnected:', socket.id);
            // Find and remove the disconnected user
            for (const [userId, conn] of userConnections.entries()) {
                if (conn.socketId === socket.id) {
                    userConnections.delete(userId);
                    console.log(`User ${userId} removed from connections`);
                    break;
                }
            }
        });
    });
    return {
        io,
        getUserConnections: () => new Map(userConnections)
    };
};
exports.initializeSocket = initializeSocket;
//# sourceMappingURL=socket.service.js.map