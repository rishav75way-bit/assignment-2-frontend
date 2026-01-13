import { io, Socket } from "socket.io-client";

let socket: Socket | null = null;

export function getSocket() {
  if (!socket) {
    socket = io(import.meta.env.VITE_SOCKET_URL, {
      transports: ["websocket"],
    });
  }
  return socket;
}
