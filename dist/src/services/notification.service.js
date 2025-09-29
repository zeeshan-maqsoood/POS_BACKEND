"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.NotificationService = void 0;
const socket_1 = require("../config/socket");
const prisma_1 = __importDefault(require("../loaders/prisma"));
class NotificationService {
    /**
     * Notify relevant users about a new order
     */
    static async notifyNewOrder(order) {
        try {
            if (!order.branchName)
                return;
            const socketService = (0, socket_1.getSocketService)();
            const { io } = socketService;
            // Find all managers and kitchen staff in the same branch
            const users = await prisma_1.default.user.findMany({
                where: {
                    branch: order.branchName,
                    role: {
                        in: ['MANAGER', 'KITCHEN_STAFF'] // Only notify these roles
                    }
                },
                select: {
                    id: true
                }
            });
            // Get all connected users
            const connectedUsers = socketService.getUserConnections();
            // Notify each user in the branch
            for (const user of users) {
                const userSockets = Array.from(connectedUsers.entries())
                    .filter(([_, conn]) => conn.userId === user.id);
                // Emit to all sockets for this user
                for (const [socketId] of userSockets) {
                    io.to(socketId).emit('newOrder', {
                        orderId: order.id,
                        orderNumber: order.orderNumber,
                        status: order.status,
                        orderType: order.orderType,
                        branch: order.branchName,
                        createdAt: order.createdAt
                    });
                }
            }
            // Also notify the branch room for dashboard updates
            io.to(`branch-${order.branchName}`).emit('orderUpdate', {
                type: 'NEW_ORDER',
                orderId: order.id,
                status: order.status,
                timestamp: new Date()
            });
        }
        catch (error) {
            console.error('Error in notifyNewOrder:', error);
        }
    }
}
exports.NotificationService = NotificationService;
//# sourceMappingURL=notification.service.js.map