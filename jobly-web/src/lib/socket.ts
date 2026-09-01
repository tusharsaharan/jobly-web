import { io, Socket } from "socket.io-client";
import { API_BASE } from "./api";

let socket: Socket | null = null;

export function getInterviewSocket(token?: string | null): Socket {
  const resolvedToken = token || (typeof window !== "undefined" ? localStorage.getItem("jm_token") : null);
  if (!socket) {
    const socketUrl = API_BASE.replace("/api", "");
    socket = io(socketUrl, {
      auth: {
        token: resolvedToken,
      },
      transports: ["websocket", "polling"],
      autoConnect: true,
    });
    if (typeof window !== "undefined") {
      (window as any).__joblySocket = socket;
    }
  } else if (resolvedToken) {
    // Re-auth if token changed (logout/login same tab) — previous socket stayed as old user
    const currentAuth = (socket.auth as any)?.token;
    if (currentAuth !== resolvedToken) {
      (socket.auth as any).token = resolvedToken;
      if (socket.connected) {
        socket.disconnect();
        socket.connect();
      }
    }
  }
  return socket;
}

export function disconnectInterviewSocket() {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
}
