import { test, expect } from "@playwright/test";
import fc from "fast-check";

test.describe("Brutal Fuzzing - 1,000+ API Interactions", () => {
  let authToken = "";

  test.beforeAll(async ({ request }) => {
    // Register a recruiter for fuzzing
    const email = `fuzzer-${Date.now()}@example.com`;
    const res = await request.post("/api/auth/register", {
      data: {
        name: "Fuzz Recruiter",
        email,
        password: "password123",
        role: "recruiter",
      },
    });
    const loginRes = await request.post("/api/auth/login", {
      data: { email, password: "password123" },
    });
    const data = await loginRes.json();
    authToken = data.token;
  });

  test("should handle 1,000 randomized job creations gracefully without 500 errors", async ({ request }) => {
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
            // Validation should catch empty required fields
            expect(status).toBe(400);
          }
        }
      ),
      { numRuns: 1000, endOnFailure: true }
    );
  });
});
