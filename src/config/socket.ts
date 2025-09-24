import { Server as SocketServer } from 'socket.io';
import { Server as HTTPServer } from 'http';
import jwt from 'jsonwebtoken';
import { JwtPayload } from '../types/auth.types';
import { UserRole } from '@prisma/client';

interface SocketUser extends JwtPayload {
  socketId: string;
}

class SocketManager {
  private io: SocketServer;
  private connectedUsers: Map<string, SocketUser> = new Map();

  constructor(server: HTTPServer) {
    this.io = new SocketServer(server, {
      cors: {
        origin: true,
        credentials: true,
        methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
      },
    });

    this.initializeSocket();
  }

  private initializeSocket() {
    this.io.on('connection', (socket) => {
      console.log(`User connected: ${socket.id}`);

      // Handle user authentication
      socket.on('authenticate', (token: string) => {
        try {
          const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key') as JwtPayload;
          const socketUser: SocketUser = {
            ...decoded,
            socketId: socket.id,
          };

          this.connectedUsers.set(socket.id, socketUser);
          socket.join(`branch:${decoded.branch}`);
          socket.join(`role:${decoded.role}`);

          console.log(`User authenticated: ${decoded.userId} (${decoded.role}) - Branch: ${decoded.branch}`);
        } catch (error) {
          console.error('Socket authentication failed:', error);
          socket.emit('auth_error', 'Invalid token');
        }
      });

      // Handle disconnect
      socket.on('disconnect', () => {
        console.log(`User disconnected: ${socket.id}`);
        this.connectedUsers.delete(socket.id);
      });
    });
  }

  // Emit order notification to specific branch and roles
  public emitOrderNotification(orderData: any, branchName: string) {
    console.log(`Emitting order notification to branch: ${branchName}`);

    // Notify managers and kitchen staff of the specific branch
    this.io.to(`branch:${branchName}`)
      .to('role:MANAGER')
      .to('role:KITCHEN_STAFF')
      .emit('new_order', {
        type: 'NEW_ORDER',
        message: `New order created for ${branchName}`,
        order: orderData,
        timestamp: new Date().toISOString(),
      });
  }

  // Emit order update to specific branch
  public emitOrderUpdate(orderData: any, branchName: string) {
    console.log(`Emitting order update to branch: ${branchName}`);

    this.io.to(`branch:${branchName}`)
      .emit('order_updated', {
        type: 'ORDER_UPDATE',
        order: orderData,
        timestamp: new Date().toISOString(),
      });
  }

  // Get connected users count
  public getConnectedUsersCount(): number {
    return this.connectedUsers.size;
  }

  // Get users by branch
  public getUsersByBranch(branchName: string): SocketUser[] {
    return Array.from(this.connectedUsers.values())
      .filter(user => user.branch === branchName);
  }
}

let socketManager: SocketManager;

export const initializeSocket = (server: HTTPServer) => {
  socketManager = new SocketManager(server);
  return socketManager;
};

export const getSocketManager = () => {
  if (!socketManager) {
    throw new Error('Socket manager not initialized');
  }
  return socketManager;
};
