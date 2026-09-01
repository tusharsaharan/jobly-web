// Minimal in-memory RESP server for local dev only.
// Supports the subset rate-limiter-flexible needs: INCRBY, EXPIRE, PTTL, DEL, SET, GET, PEXPIRE.
// Not a real Redis. Run: node scratch/mini-redis.mjs  (port 6399)
import net from "node:net";

const PORT = 6399;
const store = new Map(); // key -> { value: number|string, expiresAt: number|null }

const encode = (v) => {
  if (v === null || v === undefined) return "$-1\r\n";
  const s = String(v);
  return `$${Buffer.byteLength(s)}\r\n${s}\r\n`;
};
const int = (n) => `:${n}\r\n`;
const ok = "+OK\r\n";

const server = net.createServer((socket) => {
  let buffer = Buffer.alloc(0);
  socket.on("data", (chunk) => {
    buffer = Buffer.concat([buffer, chunk]);
    let idx;
    while ((idx = buffer.indexOf("\r\n")) !== -1) {
      // parse one command (array of bulk strings)
      if (buffer[0] !== 0x2a /* * */) { buffer = Buffer.alloc(0); break; }
      const line = buffer.subarray(0, idx).toString();
      const count = parseInt(line.slice(1), 10);
      let pos = idx + 2;
      const args = [];
      let okParse = true;
      for (let i = 0; i < count; i++) {
        if (buffer[pos] !== 0x24 /* $ */) { okParse = false; break; }
        const hdrEnd = buffer.indexOf("\r\n", pos);
        if (hdrEnd === -1) { okParse = false; break; }
        const len = parseInt(buffer.subarray(pos + 1, hdrEnd).toString(), 10);
        const valStart = hdrEnd + 2;
        const valEnd = valStart + len;
        if (buffer.length < valEnd + 2) { okParse = false; break; }
        args.push(buffer.subarray(valStart, valEnd).toString());
        pos = valEnd + 2;
      }
      if (!okParse) break;
      buffer = buffer.subarray(pos);

      const [cmd, ...rest] = args;
      const key = rest[0];
      const now = Date.now();
      // lazy expire
      if (key && store.has(key) && store.get(key).expiresAt !== null && store.get(key).expiresAt < now) {
        store.delete(key);
      }
      switch ((cmd || "").toUpperCase()) {
        case "PING": socket.write("+PONG\r\n"); break;
        case "INCR":
        case "INCRBY": {
          const by = cmd.toUpperCase() === "INCRBY" ? parseInt(rest[1], 10) : 1;
          const cur = store.get(key);
          const base = cur ? Number(cur.value) : 0;
          const next = base + by;
          store.set(key, { value: next, expiresAt: cur?.expiresAt ?? null });
          socket.write(int(next));
          break;
        }
        case "EXPIRE": {
          const cur = store.get(key);
          if (!cur) socket.write(int(0));
          else { cur.expiresAt = now + parseInt(rest[1], 10) * 1000; socket.write(int(1)); }
          break;
        }
        case "PEXPIRE": {
          const cur = store.get(key);
          if (!cur) socket.write(int(0));
          else { cur.expiresAt = now + parseInt(rest[1], 10); socket.write(int(1)); }
          break;
        }
        case "TTL":
        case "PTTL": {
          const cur = store.get(key);
          if (!cur) socket.write(int(-2));
          else if (cur.expiresAt === null) socket.write(int(-1));
          else socket.write(int(Math.max(0, Math.ceil((cur.expiresAt - now) / (cmd.toUpperCase() === "TTL" ? 1000 : 1)))));
          break;
        }
        case "SET": store.set(key, { value: rest[1], expiresAt: null }); socket.write(ok); break;
        case "GET": {
          const cur = store.get(key);
          socket.write(encode(cur ? cur.value : null));
          break;
        }
        case "DEL": {
          let n = 0;
          for (const k of rest) if (store.delete(k)) n++;
          socket.write(int(n));
          break;
        }
        case "INFO": socket.write(encode("redis_version:7.0.0-mock\r\n")); break;
        case "CLIENT": socket.write(ok); break;
        case "COMMAND": socket.write("*0\r\n"); break;
        case "QUIT": socket.write(ok); socket.end(); break;
        default: socket.write(encode(null));
      }
    }
  });
  socket.on("error", () => {});
});

server.listen(PORT, () => console.log(`mini-redis on :${PORT}`));
