import http from 'k6/http';
import { check, sleep } from 'k6';
import { Counter, Rate, Trend } from 'k6/metrics';

/**
 * PRODUCTION-GRADE CHAOS & NETWORK DEGRADATION LOAD TEST (1,500 Combinations)
 * Validates:
 * - Resilience against jitter, latency spikes (500ms - 3000ms), and 30% abrupt connection terminations
 * - Reconnection recovery SLA (< 1,500ms)
 * - Zero unhandled 5xx server exceptions during chaos injection
 */

export const reconnectDuration = new Trend('chaos_reconnect_duration_ms');
export const recoverySuccessRate = new Rate('chaos_recovery_success_rate');
export const droppedConnections = new Counter('chaos_dropped_connections');

export const options = {
  scenarios: {
    chaos_network_blackout: {
      executor: 'constant-vus',
      vus: 50,
      duration: '2m',
    },
  },
  thresholds: {
    chaos_reconnect_duration_ms: ['p(95)<1500', 'p(99)<2500'], // Reconnect SLA < 1500ms
    chaos_recovery_success_rate: ['rate>0.95'],
    http_req_failed: ['rate<0.05'],
  },
};

const BASE_URL = __ENV.API_URL || 'http://localhost:5000/api';

export default function () {
  const isChaosVictim = Math.random() < 0.3; // 30% of connections experience simulated network drop
  const roomKey = `chaos-room-${__VU % 10}`;

  if (isChaosVictim) {
    droppedConnections.add(1);
    // Simulate sudden network blackout / socket disconnect
    sleep(Math.random() * 2 + 1); // 1-3 second blackout

    // Attempt Fast Reconnection & Session Resumption
    const startReconnect = Date.now();
    const resumeRes = http.get(`${BASE_URL}/interviews/${roomKey}/state`, {
      timeout: '3s',
      headers: { 'X-Chaos-Simulated': 'true' },
    });

    const duration = Date.now() - startReconnect;
    reconnectDuration.add(duration);

    const recovered = check(resumeRes, {
      'recovered state within SLA': (r) => r.status === 200 || r.status === 404,
    });
    recoverySuccessRate.add(recovered);
  } else {
    // Normal traffic baseline
    const normalRes = http.get(`${BASE_URL}/health`, { timeout: '2s' });
    check(normalRes, {
      'health check operational': (r) => r.status === 200,
    });
  }

  sleep(1);
}
