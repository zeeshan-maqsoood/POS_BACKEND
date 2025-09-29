"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getSocketService = exports.setupSocket = void 0;
const socket_service_1 = require("../services/socket.service");
let socketService;
const setupSocket = (server) => {
    socketService = (0, socket_service_1.initializeSocket)(server);
    return socketService;
};
exports.setupSocket = setupSocket;
const getSocketService = () => {
    if (!socketService) {
        throw new Error('Socket service not initialized. Call setupSocket first.');
    }
    return socketService;
};
exports.getSocketService = getSocketService;
//# sourceMappingURL=socket.js.map