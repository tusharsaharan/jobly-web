import { test, expect } from "@playwright/test";

test.describe("Replay Page", () => {
  test.beforeEach(async ({ page, context }) => {
    await context.clearCookies();
    await page.goto("/auth");
    await page.evaluate(() => localStorage.clear());
    await page.goto("/auth");
  });

  test("should redirect to auth when not authenticated", async ({ page }) => {
    await page.goto("/interview/fake-room-123/replay");
    // Should redirect to /auth via _app layout
    await expect(page).toHaveURL(/.*auth/, { timeout: 8000 });
  });

  test("should render replay interface with mocked backend", async ({ page }) => {
    const email = `replay-tester-${Date.now()}@example.com`;
    const password = "password123";
    const fakeToken = "fake-jwt-replay-token";

    // Mock auth to bypass real backend and rate limiter
    await page.route(/\/api\/auth\/register/, async (route) => {
      await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ msg: "Registered", token: fakeToken, user: { _id: "507f1f77bcf86cd799439011", name: "Replay Tester", email, role: "seeker" } }) });
    });
    await page.route(/\/api\/auth\/login/, async (route) => {
      await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ token: fakeToken, refreshToken: "fake-refresh", user: { _id: "507f1f77bcf86cd799439011", name: "Replay Tester", email, role: "seeker" } }) });
    });
    await page.route(/\/api\/users\/me/, async (route) => {
      const auth = route.request().headers()["authorization"] || "";
      if (auth.includes(fakeToken)) {
        await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ user: { _id: "507f1f77bcf86cd799439011", name: "Replay Tester", email, role: "seeker" } }) });
      } else {
        await route.continue();
      }
    });
    // Mock dashboard data to prevent errors after login
    await page.route(/\/api\/interviews$/, async (route) => {
      if (route.request().method() === "GET") {
        await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ interviews: [] }) });
      } else await route.continue();
    });
    await page.route(/\/api\/jobs.*/, async (route) => {
      if (route.request().method() === "GET") {
        await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ jobs: [] }) });
      } else await route.continue();
    });

    await page.getByRole("link", { name: "Create an account" }).click();
    await page.getByLabel("Your name").fill("Replay Tester");
    await page.click("button:has-text('seeker')");
    await page.fill("input[type='email']", email);
    await page.fill("input[type='password']", password);
    await page.click("button[type='submit']");
    await expect(page.locator("text=Hey, welcome back.")).toBeVisible({ timeout: 10000 });
    await page.fill("input[type='email']", email);
    await page.fill("input[type='password']", password);
    await page.click("button[type='submit']");
    await expect(page).toHaveURL(/.*dashboard/, { timeout: 15000 });

    const mockRoomKey = `room-replay-mock-${Date.now()}`;
    const mockSessionId = "507f1f77bcf86cd799439011";
    const mockSession = {
      _id: mockSessionId,
      roomKey: mockRoomKey,
      title: "Mock Interview Replay",
      status: "COMPLETED",
      stage: "CODING",
      seeker: { name: "Replay Tester", email },
      recruiter: { name: "Mock Recruiter", email: "recruiter@example.com" },
      actualStart: new Date(Date.now() - 60000).toISOString(),
      actualEnd: new Date().toISOString(),
      recordingUrl: null,
    };

    const mockManifest = {
      session: mockSession,
      totalDurationMs: 60000,
      eventCount: 2,
      stages: [{ stage: "CODING", offsetMs: 5000 }],
      milestones: [],
      speakers: {
        seeker: { name: "Replay Tester", role: "Candidate" },
        recruiter: { name: "Mock Recruiter", role: "Interviewer" },
      },
      timelineEvents: [
        { _id: "ev1", offsetMs: 5000, pipeline: "STAGE", eventType: "stage.transition", payload: { stage: "CODING" } },
        { _id: "ev2", offsetMs: 12000, pipeline: "COMMUNICATION", eventType: "transcript.segment", payload: { text: "Explaining dynamic programming approach." } },
      ],
    };

    const mockCheckpoints = {
      checkpoints: [
        {
          _id: "cp1",
          sequenceNumber: 1,
          triggerType: "MANUAL",
          triggerLabel: "Initial Working Code",
          filesSnapshot: [{ path: "/solution.py", name: "solution.py", content: "def dp_solution():\n    return True\n\n# line 3\n# line 4", language: "python" }],
          createdAt: new Date().toISOString(),
          offsetMs: 1000,
        },
        {
          _id: "cp2",
          sequenceNumber: 2,
          triggerType: "EXECUTION",
          triggerLabel: "After execution",
          filesSnapshot: [{ path: "/solution.py", name: "solution.py", content: "def dp_solution():\n    return True\n\ndef helper():\n    pass", language: "python" }],
          createdAt: new Date().toISOString(),
          offsetMs: 30000,
        },
      ],
    };

    await page.route(/\/api\/interviews\/room\/.*/, async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ session: mockSession, roomToken: "fake", role: "seeker" }),
      });
    });

    await page.route(/\/api\/replay\/.*\/manifest/, async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(mockManifest),
      });
    });

    await page.route(/\/api\/coding\/.*\/checkpoints/, async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(mockCheckpoints),
      });
    });

    await page.goto(`/interview/${mockRoomKey}/replay`);

    await expect(page.getByRole("button", { name: /Checkpoints/ })).toBeVisible({ timeout: 15000 });
    await expect(page.getByRole("button", { name: /Timeline/ })).toBeVisible();
    await expect(page.locator("text=/solution.py").first()).toBeVisible();
    await expect(page.getByRole("button", { name: /Initial Working Code/ })).toBeVisible();
    await expect(page.getByRole("button", { name: /After execution/ })).toBeVisible();
    await expect(page.getByRole("button", { name: /Play|Pause/ })).toBeVisible();
    await expect(page.getByRole("slider")).toBeVisible();

    const playButton = page.getByRole("button", { name: /Play/ });
    if (await playButton.isVisible()) {
      await playButton.click();
      await expect(page.getByRole("button", { name: /Pause/ })).toBeVisible({ timeout: 5000 });
    }

    const slider = page.getByRole("slider");
    await slider.fill("1");
    await expect(page.locator("text=Frame")).toBeVisible();

    await page.getByRole("button", { name: /After execution/ }).click();
    await expect(page.locator("text=helper")).toBeVisible({ timeout: 5000 });

    await expect(page.getByRole("button", { name: "2x" })).toBeVisible();
    await page.getByRole("button", { name: "2x" }).click();

    await expect(page.locator("button[title='Fullscreen']")).toBeVisible();
  });

  test("should handle empty checkpoints gracefully", async ({ page }) => {
    const email = `replay-empty-${Date.now()}@example.com`;
    const password = "password123";
    const fakeToken = "fake-jwt-empty-token";
    await page.route(/\/api\/auth\/register/, async (route) => {
      await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ msg: "Registered", token: fakeToken, user: { _id: "507f1f77bcf86cd799439012", name: "Empty Tester", email, role: "seeker" } }) });
    });
    await page.route(/\/api\/auth\/login/, async (route) => {
      await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ token: fakeToken, refreshToken: "fake-refresh", user: { _id: "507f1f77bcf86cd799439012", name: "Empty Tester", email, role: "seeker" } }) });
    });
    await page.route(/\/api\/users\/me/, async (route) => {
      const auth = route.request().headers()["authorization"] || "";
      if (auth.includes(fakeToken)) {
        await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ user: { _id: "507f1f77bcf86cd799439012", name: "Empty Tester", email, role: "seeker" } }) });
      } else await route.continue();
    });
    await page.route(/\/api\/interviews$/, async (route) => {
      if (route.request().method() === "GET") await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ interviews: [] }) });
      else await route.continue();
    });

    await page.getByRole("link", { name: "Create an account" }).click();
    await page.getByLabel("Your name").fill("Empty Tester");
    await page.click("button:has-text('seeker')");
    await page.fill("input[type='email']", email);
    await page.fill("input[type='password']", password);
    await page.click("button[type='submit']");
    await expect(page.locator("text=Hey, welcome back.")).toBeVisible({ timeout: 10000 });
    await page.fill("input[type='email']", email);
    await page.fill("input[type='password']", password);
    await page.click("button[type='submit']");
    await expect(page).toHaveURL(/.*dashboard/, { timeout: 15000 });

    const mockRoomKey = `room-empty-${Date.now()}`;
    const mockSessionId = "507f1f77bcf86cd799439012";

    await page.route(/\/api\/interviews\/room\/.*/, async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          session: { _id: mockSessionId, roomKey: mockRoomKey, title: "Empty Session", status: "COMPLETED", actualStart: new Date().toISOString(), actualEnd: new Date().toISOString() },
          roomToken: "fake",
        }),
      });
    });
    await page.route(/\/api\/replay\/.*\/manifest/, async (route) => {
      await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ totalDurationMs: 60000, timelineEvents: [], stages: [], milestones: [], eventCount: 0 }) });
    });
    await page.route(/\/api\/coding\/.*\/checkpoints/, async (route) => {
      await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ checkpoints: [] }) });
    });

    await page.goto(`/interview/${mockRoomKey}/replay`);
    await expect(page.locator("text=No Replay Data Available")).toBeVisible({ timeout: 15000 });
  });
});
