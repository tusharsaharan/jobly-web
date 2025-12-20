import { io, Socket } from "socket.io-client";
import { API_BASE } from "./api";

let socket: Socket | null = null;

export function getInterviewSocket(token?: string | null): Socket {
  if (!socket) {
    const socketUrl = API_BASE.replace("/api", "");
    socket = io(socketUrl, {
      auth: {
        token: token || (typeof window !== "undefined" ? localStorage.getItem("jm_token") : null),
      },
      transports: ["websocket", "polling"],
      autoConnect: true,
    });
  } else if (token && socket.auth) {
    (socket.auth as any).token = token;
  }
  return socket;
}

export function disconnectInterviewSocket() {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
}
