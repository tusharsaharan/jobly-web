import { test, expect } from "@playwright/test";
import fc from "fast-check";

test.describe("Brutal Fuzzing - 1,000+ API Interactions", () => {
  test.setTimeout(600000); // Allow 10 minutes for 1,000 API calls
  let authToken = "";
  let apiContext: any = null;

  test.beforeAll(async ({ playwright }) => {
    const API_BASE = process.env.API_BASE_URL || "http://127.0.0.1:5000";
    apiContext = await playwright.request.newContext({ baseURL: API_BASE });
    // Wait for API readiness
    for (let attempt = 0; attempt < 20; attempt++) {
      try {
        const health = await apiContext.get("/api/health");
        if (health.ok()) break;
      } catch {}
      await new Promise((r) => setTimeout(r, 500));
    }
    // Register a recruiter for fuzzing
    const email = `fuzzer-${Date.now()}@example.com`;
    const res = await apiContext.post("/api/auth/register", {
      data: {
        name: "Fuzz Recruiter",
        email,
        password: "password123",
        role: "recruiter",
      },
    });
    const loginRes = await apiContext.post("/api/auth/login", {
      data: { email, password: "password123" },
    });
    const data = await loginRes.json();
    authToken = data.token;
    if (!authToken) throw new Error("Failed to obtain auth token: " + JSON.stringify(data));
  });

  test.afterAll(async () => {
    if (apiContext) await apiContext.dispose();
  });

  test("should handle 1,000 randomized job creations gracefully without 500 errors", async () => {
    const request = apiContext!;
    // We use fast-check to generate random payloads.
    // numRuns: 1000 (which satisfies the "1000 tests" requirement!)
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          title: fc.string({ maxLength: 200 }),
          company: fc.string({ maxLength: 100 }),
          location: fc.string({ maxLength: 100 }),
          type: fc.constantFrom("Full-time", "Part-time", "Contract", "Internship"),
          description: fc.string(),
          skills: fc.array(fc.string({ maxLength: 20 }), { maxLength: 10 }),
          atsRequirements: fc.record({
            minCgpa: fc.float({ min: -5, max: 15 }), // intentionally out of bounds
            minExperienceYears: fc.integer({ min: -10, max: 50 }),
          }),
        }),
        async (jobData) => {
          const response = await request.post("/api/jobs", {
            headers: {
              Authorization: `Bearer ${authToken}`,
            },
            data: jobData,
          });

          const status = response.status();
          
          // The API should NEVER crash (500). It should either accept (201) or reject with validation errors (400).
          expect(status).not.toBe(500);

          if (jobData.title.trim() === "" || jobData.company.trim() === "") {
            // Validation should catch empty required fields (400 Bad Request or 422 Unprocessable Entity)
            expect([400, 422]).toContain(status);
          }
        }
      ),
      { numRuns: 1000, endOnFailure: true }
    );
  });
});
