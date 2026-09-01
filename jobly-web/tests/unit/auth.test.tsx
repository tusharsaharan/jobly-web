import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, act } from "@testing-library/react";
import { AuthProvider, useAuth } from "../../src/lib/auth";
import * as api from "../../src/lib/api";
import React from "react";

vi.mock("../../src/lib/api", async (importOriginal) => {
  const actual = await importOriginal<typeof import("../../src/lib/api")>();
  return {
    ...actual,
    apiCall: vi.fn(),
  };
});

function TestComponent() {
  const { user, token, login, logout } = useAuth();
  return (
    <div>
      <span data-testid="user">{user ? user.name : "anonymous"}</span>
      <span data-testid="token">{token || "notoken"}</span>
      <button
        onClick={() => login({ name: "Alice", email: "alice@example.com", role: "seeker" }, "token123")}
      >
        Login
      </button>
      <button onClick={logout}>Logout</button>
    </div>
  );
}

describe("AuthProvider & useAuth", () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  it("should initialize with default guest state", () => {
    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    expect(screen.getByTestId("user")).toHaveTextContent("anonymous");
    expect(screen.getByTestId("token")).toHaveTextContent("notoken");
  });

  it("should support login and persist token in localStorage", async () => {
    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    const loginBtn = screen.getByText("Login");
    await act(async () => {
      loginBtn.click();
    });

    expect(screen.getByTestId("user")).toHaveTextContent("Alice");
    expect(screen.getByTestId("token")).toHaveTextContent("token123");
    expect(localStorage.getItem("jm_token")).toBe("token123");
  });

  it("should support logout and clear localStorage", async () => {
    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    await act(async () => {
      screen.getByText("Login").click();
    });
    await act(async () => {
      screen.getByText("Logout").click();
    });

    expect(screen.getByTestId("user")).toHaveTextContent("anonymous");
    expect(screen.getByTestId("token")).toHaveTextContent("notoken");
    expect(localStorage.getItem("jm_token")).toBeNull();
  });

  it("should attempt profile hydration on mount if token exists", async () => {
    localStorage.setItem("jm_token", "existing_token");
    const mockUser = { name: "Bob", email: "bob@example.com", role: "recruiter" };

    (api.apiCall as any).mockResolvedValueOnce({ user: mockUser });

    await act(async () => {
      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );
    });

    expect(api.apiCall).toHaveBeenCalledWith("/users/me", "GET", null, "existing_token");
    expect(screen.getByTestId("user")).toHaveTextContent("Bob");
    expect(screen.getByTestId("token")).toHaveTextContent("existing_token");
  });
});
