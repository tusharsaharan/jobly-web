// Thin fetch wrapper for the external JobMatch backend.
const API_BASE =
  (import.meta.env.VITE_API_BASE_URL as string | undefined) ??
  "http://localhost:5000/api";

export class ApiError extends Error {
  status: number;
  details?: Record<string, string>;

  constructor(message: string, status: number, details?: Record<string, string>) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.details = details;
  }
}

interface ApiCallOptions {
  method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  body?: any;
  token?: string | null;
  isFormData?: boolean;
  headers?: Record<string, string>;
}

export async function apiCall<T = any>(
  endpoint: string,
  methodOrOptions: "GET" | "POST" | "PUT" | "PATCH" | "DELETE" | ApiCallOptions = "GET",
  body: any = null,
  token: string | null = null,
  isFormData = false,
): Promise<T> {
  let method: "GET" | "POST" | "PUT" | "PATCH" | "DELETE" = "GET";
  let payload: any = body;
  let authToken: string | null = token;
  let formDataMode = isFormData;
  let customHeaders: Record<string, string> = {};

  if (typeof methodOrOptions === "object" && methodOrOptions !== null) {
    method = methodOrOptions.method || "GET";
    payload = methodOrOptions.body !== undefined ? methodOrOptions.body : null;
    authToken = methodOrOptions.token !== undefined ? methodOrOptions.token : null;
    formDataMode = Boolean(methodOrOptions.isFormData);
    customHeaders = methodOrOptions.headers || {};
  } else if (typeof methodOrOptions === "string") {
    method = methodOrOptions;
  }

  // Auto-resolve token from localStorage in client environment if not explicitly provided
  if (!authToken && typeof window !== "undefined") {
    authToken = localStorage.getItem("jm_token") || localStorage.getItem("token");
  }

  const isForm = formDataMode || (typeof FormData !== "undefined" && payload instanceof FormData);

  const headers: Record<string, string> = { ...customHeaders };
  if (authToken) headers["Authorization"] = `Bearer ${authToken}`;
  if (!isForm) headers["Content-Type"] = "application/json";

  const config: RequestInit = { method, headers };
  if (payload !== null && payload !== undefined) {
    config.body = isForm ? payload : JSON.stringify(payload);
  }

  const res = await fetch(`${API_BASE}${endpoint}`, config);
  let data: any = null;
  try {
    data = await res.json();
  } catch {
    /* non-json */
  }
  if (!res.ok) {
    throw new ApiError(
      data?.message ?? data?.msg ?? `Error ${res.status}: ${res.statusText}`,
      res.status,
      data?.errors && typeof data.errors === "object" ? data.errors : undefined,
    );
  }
  return data as T;
}

export { API_BASE };
