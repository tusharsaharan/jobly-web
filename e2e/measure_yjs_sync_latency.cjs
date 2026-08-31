const Y = require("yjs");
const { WebsocketProvider } = require("y-websocket");
const WebSocket = require("ws");
const { performance } = require("perf_hooks");

// Polyfill WebSocket for Node runtime
global.WebSocket = WebSocket;

async function measureYjsLatency() {
  console.log("=== GAP 1: Yjs CRDT Synchronization Latency Benchmark ===\n");
  const roomName = `latency-benchmark-room-${Date.now()}`;
  const serverUrl = "ws://localhost:5000/collab";

  console.log(`Connecting 2 independent Yjs clients to ${serverUrl} (Room: ${roomName})...`);

  // Client A (Sender)
  const docA = new Y.Doc();
  const providerA = new WebsocketProvider(serverUrl, roomName, docA, { WebSocketPolyfill: WebSocket });
  const yTextA = docA.getText("monaco");

  // Client B (Receiver)
  const docB = new Y.Doc();
  const providerB = new WebsocketProvider(serverUrl, roomName, docB, { WebSocketPolyfill: WebSocket });
  const yTextB = docB.getText("monaco");

  // Wait for both providers to establish WebSocket connection and sync initial state
  await new Promise((resolve) => {
    let aSynced = false;
    let bSynced = false;
    providerA.on("synced", (isSynced) => {
      if (isSynced) {
        aSynced = true;
        if (bSynced) resolve();
      }
    });
    providerB.on("synced", (isSynced) => {
      if (isSynced) {
        bSynced = true;
        if (aSynced) resolve();
      }
    });
    setTimeout(resolve, 3000); // safety fallback
  });

  console.log("Both Yjs WebSocket clients synced. Starting 10 single-keystroke sync events...\n");

  const latencies = [];
  const chars = "def solve_task(nodes):".split("");

  for (let i = 0; i < 10; i++) {
    const charToInsert = chars[i % chars.length];
    const sendTimestamp = performance.now();

    const latencyPromise = new Promise((resolve) => {
      const observer = (event, transaction) => {
        // Measure when update is received and applied on Client B from remote origin
        if (transaction.origin !== docB) {
          const receiveTimestamp = performance.now();
          const deltaMs = receiveTimestamp - sendTimestamp;
          yTextB.unobserve(observer);
          resolve(deltaMs);
        }
      };
      yTextB.observe(observer);
    });

    // Client A inserts 1 character
    yTextA.insert(yTextA.length, charToInsert);

    const delta = await latencyPromise;
    latencies.push(delta);
    console.log(`Event ${String(i + 1).padStart(2, " ")}: Character '${charToInsert}' -> Sync Latency: ${delta.toFixed(3)} ms`);

    // Wait 100ms between keystrokes to simulate human/typing interval
    await new Promise((r) => setTimeout(r, 100));
  }

  // Calculate statistics
  latencies.sort((a, b) => a - b);
  const min = latencies[0];
  const max = latencies[latencies.length - 1];
  const avg = latencies.reduce((sum, v) => sum + v, 0) / latencies.length;
  const median = latencies.length % 2 === 0
    ? (latencies[latencies.length / 2 - 1] + latencies[latencies.length / 2]) / 2
    : latencies[Math.floor(latencies.length / 2)];

  console.log("\n--- Latency Benchmark Results ---");
  console.log(`Total Sync Events: ${latencies.length}`);
  console.log(`Min Latency:       ${min.toFixed(3)} ms`);
  console.log(`Max Latency:       ${max.toFixed(3)} ms`);
  console.log(`Average Latency:   ${avg.toFixed(3)} ms`);
  console.log(`Median Latency:    ${median.toFixed(3)} ms`);
  console.log("Raw Deltas (ms):  ", latencies.map((l) => Number(l.toFixed(3))));

  providerA.destroy();
  providerB.destroy();
  docA.destroy();
  docB.destroy();
}

measureYjsLatency().catch((err) => {
  console.error("Yjs Benchmark Error:", err);
  process.exit(1);
});
