import { Server } from 'http';
import { initializeSocket, SocketService } from '../services/socket.service';

let socketService: SocketService;

export const setupSocket = (server: Server) => {
  socketService = initializeSocket(server);
  return socketService;
};

export const getSocketService = (): SocketService => {
  if (!socketService) {
    throw new Error('Socket service not initialized. Call setupSocket first.');
  }
  return socketService;
};
