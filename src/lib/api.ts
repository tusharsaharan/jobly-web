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

export async function apiCall<T = any>(
  endpoint: string,
  method: "GET" | "POST" | "PUT" | "PATCH" | "DELETE" = "GET",
  body: any = null,
  token: string | null = null,
  isFormData = false,
): Promise<T> {
  const headers: Record<string, string> = {};
  if (token) headers["Authorization"] = `Bearer ${token}`;
  if (!isFormData) headers["Content-Type"] = "application/json";

  const config: RequestInit = { method, headers };
  if (body) config.body = isFormData ? body : JSON.stringify(body);

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
