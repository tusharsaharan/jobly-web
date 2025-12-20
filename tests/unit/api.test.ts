import { describe, it, expect, vi, beforeEach } from "vitest";
import { apiCall, ApiError } from "../../src/lib/api";

describe("apiCall wrapper", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should make a GET request to correct endpoint", async () => {
    const mockResponse = { data: "success" };
    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => mockResponse,
    });

    const result = await apiCall("/test");
    expect(result).toEqual(mockResponse);
    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining("/api/test"),
      expect.objectContaining({ method: "GET" })
    );
  });

  it("should attach Authorization header when token is provided", async () => {
    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => ({}),
    });

    await apiCall("/test", "GET", null, "mytoken123");
    expect(global.fetch).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({
        headers: expect.objectContaining({
          Authorization: "Bearer mytoken123",
        }),
      })
    );
  });

  it("should stringify body and set Content-Type header on POST", async () => {
    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => ({}),
    });

    const body = { name: "John" };
    await apiCall("/test", "POST", body);
    expect(global.fetch).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify(body),
        headers: expect.objectContaining({
          "Content-Type": "application/json",
        }),
      })
    );
  });

  it("should throw ApiError if response is not ok", async () => {
    const errorDetails = { message: "Validation failed" };
    (global.fetch as any).mockResolvedValue({
      ok: false,
      status: 400,
      statusText: "Bad Request",
      json: async () => errorDetails,
    });

    await expect(apiCall("/test")).rejects.toThrow(ApiError);
    try {
      await apiCall("/test");
    } catch (e: any) {
      expect(e.status).toBe(400);
      expect(e.message).toBe("Validation failed");
    }
  });
});
