// services/notification.service.ts
import { Order, UserRole } from '@prisma/client';
import { getSocketService } from '../config/socket';
import prisma from '../loaders/prisma';

export class NotificationService {
  /**
   * Notify relevant users about a new order
   */
  static async notifyNewOrder(order: Order & { branchName: string }) {
    try {
      if (!order.branchName) return;
      
      const socketService = getSocketService();
      const { io } = socketService;
      
      // Find all managers and kitchen staff in the same branch
      const users = await prisma.user.findMany({
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
  
    } catch (error) {
      console.error('Error in notifyNewOrder:', error);
    }
  }
}