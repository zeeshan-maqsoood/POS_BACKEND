import { Server as HttpServer } from 'http';
import { initializeSocket, type SocketService } from '../services/socket.service';

let socketService: SocketService;

export const setupSocket = (server: HttpServer) => {
  socketService = initializeSocket(server);
  return socketService;
};

export const getSocketService = (): SocketService => {
  if (!socketService) {
    throw new Error('Socket service not initialized. Call setupSocket first.');
  }
  return socketService;
};
