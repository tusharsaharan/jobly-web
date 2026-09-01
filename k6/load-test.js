import http from "k6/http";
import { check, sleep } from "k6";

export const options = {
  stages: [
    { duration: "10s", target: 50 },   // Warm up to 50 users
    { duration: "20s", target: 200 },  // Ramp to 200 concurrent users
    { duration: "10s", target: 500 },  // Spike to 500 concurrent users
    { duration: "10s", target: 0 },    // Scale down
  ],
  thresholds: {
    http_req_duration: ["p(95)<250"], // 95% of requests must complete below 250ms
    http_req_failed: ["rate<0.01"],   // Less than 1% errors
  },
};

const BASE_URL = "http://localhost:5000";

export default function () {
  // 1. Health Check
  const resHealth = http.get(`${BASE_URL}/api/health`);
  check(resHealth, {
    "health status is 200/207": (r) => r.status === 200 || r.status === 207,
  });

  // 2. Metrics Endpoint
  const resMetrics = http.get(`${BASE_URL}/api/metrics`);
  check(resMetrics, {
    "metrics returns 200": (r) => r.status === 200,
  });

  sleep(0.5);
}
