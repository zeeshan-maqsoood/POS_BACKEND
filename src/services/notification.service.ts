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
      
      // Find the branch to get its ID
      const branch = await prisma.branch.findFirst({
        where: { name: order.branchName },
        select: { id: true }
      });

      if (!branch) {
        console.error(`Branch not found: ${order.branchName}`);
        return;
      }

      // We're not sending a print job here to avoid duplicates
      // The print job is handled by the print service
      // Instead, we'll just log the notification
      console.log(`📢 Notified branch ${order.branchName} about new order ${order.orderNumber} (no duplicate print)`);
      
    } catch (error) {
      console.error('Error in notifyNewOrder:', error);
    }
  }
}