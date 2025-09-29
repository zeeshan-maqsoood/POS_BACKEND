import { Server as HttpServer } from 'http';
import { type SocketService } from '../services/socket.service';
export declare const setupSocket: (server: HttpServer) => {
    readonly io: import("socket.io").Server<import("socket.io").DefaultEventsMap, import("socket.io").DefaultEventsMap, import("socket.io").DefaultEventsMap, any>;
    readonly getUserConnections: () => Map<string, import("../services/socket.service").UserConnection>;
};
export declare const getSocketService: () => SocketService;
