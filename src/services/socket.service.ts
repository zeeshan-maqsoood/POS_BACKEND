// import { Server } from 'http';
// import { Server as SocketIOServer, Socket } from 'socket.io';

// export const initializeSocket = (server: Server) => {
//   const io = new SocketIOServer(server, {
//     cors: {
//       origin: true, // Allow all origins in development
//       methods: ['GET', 'POST'],
//       credentials: true
//     },
//     path: '/socket.io/',
//   });

//   const connectedUsers = new Map<string, string>(); // userId -> socketId
//   const userSockets = new Map<string, Socket>(); // userId -> socket
//   const userRoles = new Map<string, string>(); // userId -> role
//   const userBranches = new Map<string, string>(); // userId -> branchId

//   io.on('connection', (socket: Socket) => {
//     console.log('A user connected:', socket.id);

//     // Handle user authentication
//     socket.on('authenticate', (data: { userId: string; role: string; branchId?: string }) => {
//       const { userId, role, branchId } = data;
//       console.log(`User ${userId} (${role}) authenticated`);
      
//       connectedUsers.set(userId, socket.id);
//       userSockets.set(socket.id, socket);
//       userRoles.set(userId, role);
      
//       if (branchId) {
//         userBranches.set(userId, branchId);
//         socket.join(`branch-${branchId}`);
//         console.log(`User ${userId} (${role}) joined branch-${branchId}`);
//       }
//     });

//     // Handle joining a branch room
//     socket.on('join-branch', (data: { branchId: string; role: string }) => {
//       const { branchId, role } = data;
//       const userId = Array.from(connectedUsers.entries())
//         .find(([_, socketId]) => socketId === socket.id)?.[0];
      
//       if (userId) {
//         userBranches.set(userId, branchId);
//         userRoles.set(userId, role);
//         socket.join(`branch-${branchId}`);
//         console.log(`User ${userId} (${role}) joined branch-${branchId}`);
//       }
//     });

//     // Handle disconnection
//     socket.on('disconnect', () => {
//       console.log('User disconnected:', socket.id);
//       // Find and remove the disconnected user
//       for (const [userId, socketId] of connectedUsers.entries()) {
//         if (socketId === socket.id) {
//           connectedUsers.delete(userId);
//           userSockets.delete(socketId);
//           userRoles.delete(userId);
//           userBranches.delete(userId);
//           break;
//         }
//       }
//     });
//   });

//   // Function to notify relevant users about a new order
//   const notifyNewOrder = (order: any, createdByRole: string) => {
//     const { branchId } = order;
//     const branchRoom = `branch-${branchId}`;
    
//     // Get all users in the branch
//     const branchUsers = Array.from(userBranches.entries())
//       .filter(([_, userBranchId]) => userBranchId === branchId)
//       .map(([userId]) => ({
//         userId,
//         role: userRoles.get(userId),
//         socketId: connectedUsers.get(userId)
//       }));

//     // Determine who should be notified based on who created the order
//     const rolesToNotify = createdByRole === 'ADMIN' 
//       ? ['MANAGER', 'KITCHEN_STAFF'] 
//       : ['ADMIN', 'KITCHEN_STAFF'];

//     // Notify each relevant user
//     branchUsers.forEach(({ userId, role, socketId }) => {
//       if (role && rolesToNotify.includes(role) && socketId) {
//         const userSocket = userSockets.get(socketId);
//         if (userSocket) {
//           userSocket.emit('new-order', {
//             type: 'NEW_ORDER',
//             order,
//             timestamp: new Date().toISOString(),
//             createdByRole
//           });
//         }
//       }
//     });
//   };

//   // Function to notify order status update
//   const notifyOrderUpdate = (order: any, updatedByRole: string) => {
//     const { branchId } = order;
//     const branchRoom = `branch-${branchId}`;
    
//     // Notify all relevant users in the branch
//     io.to(branchRoom).emit('order-updated', {
//       type: 'ORDER_UPDATED',
//       order,
//       updatedByRole,
//       timestamp: new Date().toISOString()
//     });
//   };

//   return {
//     io,
//     notifyNewOrder,
//     notifyOrderUpdate,
//     connectedUsers,
//     userSockets,
//     userRoles,
//     userBranches
//   };
// };

// export type SocketService = ReturnType<typeof initializeSocket>;
import { Server } from 'http';
import { Server as SocketIOServer, Socket } from 'socket.io';

type UserRole = 'ADMIN' | 'MANAGER' | 'KITCHEN_STAFF' | 'CASHIER' | 'WAITER' | 'USER';

interface UserConnection {
  socketId: string;
  role: UserRole;
  branchId?: string;
}

interface Order {
  id: string;
  branchId: string;
  // Add other order properties as needed
}

export const initializeSocket = (server: Server) => {
  const io = new SocketIOServer(server, {
    cors: {
      origin: true,
      methods: ['GET', 'POST'],
      credentials: true
    },
    path: '/socket.io/',
  });

  const userConnections = new Map<string, UserConnection>(); // userId -> UserConnection

  // Helper to get all users in a branch
  const getUsersInBranch = (branchId: string) => {
    return Array.from(userConnections.entries())
      .filter(([_, conn]) => conn.branchId === branchId)
      .map(([userId, conn]) => ({
        userId,
        ...conn
      }));
  };

  // Helper to notify specific roles in a branch
  const notifyRolesInBranch = (branchId: string, roles: UserRole[], event: string, data: any) => {
    const users = getUsersInBranch(branchId)
      .filter(user => roles.includes(user.role));

    users.forEach(user => {
      io.to(user.socketId).emit(event, data);
    });
  };

  io.on('connection', (socket: Socket) => {
    console.log('A user connected:', socket.id);

    // Handle user authentication
    socket.on('authenticate', (data: { userId: string; role: UserRole; branchId?: string }) => {
      const { userId, role, branchId } = data;
      console.log(`User ${userId} (${role}) authenticated`);
      
      userConnections.set(userId, {
        socketId: socket.id,
        role,
        branchId
      });

      if (branchId) {
        socket.join(`branch-${branchId}`);
        console.log(`User ${userId} joined branch-${branchId}`);
      }
    });

    // Handle order creation
    socket.on('new-order', (data: { order: Order; createdByRole: UserRole }) => {
      const { order, createdByRole } = data;
      const branchId = order.branchId;
      
      if (!branchId) {
        console.error('Order has no branchId');
        return;
      }

      if (createdByRole === 'ADMIN') {
        // Notify managers and kitchen staff
        notifyRolesInBranch(branchId, ['MANAGER', 'KITCHEN_STAFF'], 'new-order', {
          order,
          createdByRole,
          message: 'New order created by admin'
        });
      } else if (createdByRole === 'MANAGER') {
        // Notify admins and kitchen staff
        notifyRolesInBranch(branchId, ['ADMIN', 'KITCHEN_STAFF'], 'new-order', {
          order,
          createdByRole,
          message: 'New order created by manager'
        });
      }
    });

    // Handle order updates
    socket.on('order-updated', (data: { order: Order; updatedByRole: UserRole }) => {
      const { order, updatedByRole } = data;
      const branchId = order.branchId;
      
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

export type SocketService = ReturnType<typeof initializeSocket>;