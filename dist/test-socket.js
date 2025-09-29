"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const socket_io_client_1 = require("socket.io-client");
const socket = (0, socket_io_client_1.io)("http://localhost:4000", {
    path: "/socket.io/",
});
socket.on("connect", () => {
    console.log("Connected:", socket.id);
    socket.emit("new-order", { orderId: 123, createdByRole: "ADMIN" });
});
socket.on("new-order", (data) => {
    console.log("Received new order:", data);
});
//# sourceMappingURL=test-socket.js.map