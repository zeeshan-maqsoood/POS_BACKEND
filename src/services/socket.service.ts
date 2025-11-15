// socketService.ts
import { Server as HttpServer } from "http";
import { Server as SocketIOServer, Socket } from "socket.io";

export type UserRole =
  | "ADMIN"
  | "MANAGER"
  | "KITCHEN_STAFF"
  | "CASHIER"
  | "WAITER"
  | "USER"
  | "PRINTER_AGENT";

export interface UserConnection {
  socketId: string;
  role: UserRole;
  branchId?: string;
  agentId?: string;
}

interface Order {
  id: string;
  branchId: string;
}

let io: SocketIOServer;

export const initializeSocket = (server: HttpServer) => {
  io = new SocketIOServer(server, {
    cors: {
      origin: ["http://localhost:3000", "http://127.0.0.1:3000"],
      credentials: true
    }
  });

  // Store all users + printer agents
  const userConnections = new Map<string, UserConnection>(); // key = userId OR agentId

  // -------------------------------
  // Helpers
  // -------------------------------

  const getUsersInBranch = (branchId: string) => {
    return Array.from(userConnections.entries())
      .filter(([_, conn]) => conn.branchId === branchId)
      .map(([id, conn]) => ({ id, ...conn }));
  };

  const notifyRolesInBranch = (
    branchId: string,
    roles: UserRole[],
    event: string,
    data: any
  ) => {
    const users = getUsersInBranch(branchId).filter(u =>
      roles.includes(u.role)
    );

    users.forEach(user => io.to(user.socketId).emit(event, data));
  };

  const emitToPrinter = (branchId: string, event: string, data: any) => {
    const room = `printer-${branchId}`;
    console.log(`📤 Sending '${event}' to printers in ${room}`);
    
    // Debug: Log all rooms
    console.log('🏠 Current rooms:', Array.from(io.sockets.adapter.rooms.keys()));
    
    // Emit to the room
    io.to(room).emit(event, data);
    
    // Also try to find any printer socket with matching branchId
    const printerSockets = Array.from(io.sockets.sockets.values())
      .filter(socket => 
        socket.handshake.query.branchId === branchId ||
        (socket.data && socket.data.branchId === branchId)
      );
      
    if (printerSockets.length > 0) {
      console.log(`🔍 Found ${printerSockets.length} printer(s) for branch ${branchId}`);
      printerSockets.forEach(socket => {
        console.log(`📤 Sending '${event}' directly to socket ${socket.id}`);
        socket.emit(event, data);
      });
    } else {
      console.log(`⚠️ No active printer connections found for branch ${branchId}`);
    }
  };

  // -------------------------------
  // Main Connection
  // -------------------------------
  io.on("connection", (socket: Socket) => {
    console.log("🔗 Client connected:", socket.id);

    socket.emit("welcome", { message: "Connected to server" });

    // -------------------------------
    // USER AUTHENTICATION
    // -------------------------------
    socket.on(
      "authenticate",
      (data: { userId: string; role: UserRole; branchId?: string }) => {
        const { userId, role, branchId } = data;

        console.log(`🟢 User authenticated: ${userId} (${role})`);

        userConnections.set(userId, {
          socketId: socket.id,
          role,
          branchId
        });

        if (branchId) {
          socket.join(`branch-${branchId}`);
          console.log(`✔ User ${userId} joined branch-${branchId}`);
        }
      }
    );

    // -------------------------------
    // PRINTER AGENT AUTHENTICATION
    // -------------------------------
    socket.on(
      "authenticate-printer",
      (data: { agentId: string; branchId: string }) => {
        const { agentId, branchId } = data;
        const room = `printer-${branchId}`;

        console.log(`🖨 Printer agent ${agentId} connecting to branch ${branchId}`);
        
        // Store branchId in socket data for later use
        socket.data = {
          ...socket.data,
          agentId,
          branchId,
          type: 'printer'
        };

        // Join the printer room
        socket.join(room);
        console.log(`🖨 Printer ${agentId} joined room: ${room}`);

        // Store the connection
        userConnections.set(agentId, {
          socketId: socket.id,
          role: "PRINTER_AGENT",
          branchId,
          agentId
        });

        // Send success response with room info
        socket.emit("authenticated", { 
          success: true, 
          message: `Printer connected to branch ${branchId}`,
          room: room,
          socketId: socket.id
        });
        
        // Log all rooms after joining
        console.log('🏠 All rooms after join:', Array.from(io.sockets.adapter.rooms.keys()));
      }
    );

    // -------------------------------
    // NEW ORDER
    // -------------------------------
    socket.on(
      "new_order",
      (data: { order: Order; createdByRole: UserRole }) => {
        const { order, createdByRole } = data;
        let branchId = order.branchId;

        if (!branchId) {
          console.error("❌ Order has no branchId");
          return;
        }

        // If manager/kitchen → force their own branch
        if (["MANAGER", "KITCHEN_STAFF"].includes(createdByRole)) {
          const userId = [...userConnections.entries()].find(
            ([_, conn]) => conn.socketId === socket.id
          )?.[0];

          const userBranch = userId
            ? userConnections.get(userId)?.branchId
            : null;

          if (!userBranch) {
            console.error(`${createdByRole} has no branch assigned`);
            return;
          }

          branchId = userBranch;
        }

        // Notify based on creator role
        if (createdByRole === "ADMIN") {
          notifyRolesInBranch(branchId, ["MANAGER", "KITCHEN_STAFF"], "new-order", {
            order,
            createdByRole
          });
        } else if (createdByRole === "MANAGER") {
          notifyRolesInBranch(branchId, ["ADMIN", "KITCHEN_STAFF"], "new-order", {
            order,
            createdByRole
          });
        }

        // Also notify printers
        emitToPrinter(branchId, "print-order", order);
      }
    );

    // -------------------------------
    // ORDER UPDATED
    // -------------------------------
    socket.on(
      "order-updated",
      (data: { order: Order; updatedByRole: UserRole }) => {
        const { order, updatedByRole } = data;

        if (!order.branchId) return;

        io.to(`branch-${order.branchId}`).emit("order-updated", {
          order,
          updatedByRole
        });
      }
    );

    // -------------------------------
    // DISCONNECT
    // -------------------------------
    socket.on("disconnect", () => {
      console.log("🔴 Disconnected:", socket.id);

      for (const [id, conn] of userConnections.entries()) {
        if (conn.socketId === socket.id) {
          userConnections.delete(id);
          console.log(`❎ Removed connection for ${id}`);
          break;
        }
      }
    });
  });

  return {
    io,
    emitToPrinter,
    getUserConnections: () => userConnections
  } as const;
};

export type SocketService = ReturnType<typeof initializeSocket>;
