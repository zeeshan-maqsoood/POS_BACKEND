import { io } from "socket.io-client";

const socket = io("http://localhost:4000", {
  path: "/socket.io/",
});

socket.on("connect", () => {
  console.log("Connected:", socket.id);
  socket.emit("new-order", { orderId: 123, createdByRole: "ADMIN" });
});

socket.on("new-order", (data) => {
  console.log("Received new order:", data);
});