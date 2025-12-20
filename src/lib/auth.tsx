import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { apiCall } from "./api";

export type UserRole = "seeker" | "recruiter";

export interface AuthUser {
  id?: string;
  _id?: string;
  name: string;
  email: string;
  role: UserRole;
  skills?: string[];
  resumeUrl?: string;
  resumeText?: string;
  resumeSummary?: string;
  degree?: string;
  cgpa?: number;
  college?: string;
  collegeTier?: string;
  achievements?: string[];
  experience?: { title?: string; company?: string; duration?: string }[];
  [k: string]: any;
}

interface AuthContextValue {
  user: AuthUser | null;
  token: string | null;
  ready: boolean;
  login: (user: AuthUser, token: string) => void;
  logout: () => void;
  refresh: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

const TOKEN_KEY = "jm_token";

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [ready, setReady] = useState(false);

  const fetchUser = useCallback(async (authToken: string) => {
    try {
      const data = await apiCall<{ user?: AuthUser } | AuthUser>(
        "/users/me",
        "GET",
        null,
        authToken,
      );
      const u = (data as any)?.user ?? (data as AuthUser);
      setUser(u);
    } catch {
      localStorage.removeItem(TOKEN_KEY);
      setToken(null);
      setUser(null);
    }
  }, []);

  useEffect(() => {
    const t =
      typeof window !== "undefined" ? localStorage.getItem(TOKEN_KEY) : null;
    if (t) {
      setToken(t);
      fetchUser(t).finally(() => setReady(true));
    } else {
      setReady(true);
    }
  }, [fetchUser]);

  const login = useCallback((u: AuthUser, t: string) => {
    localStorage.setItem(TOKEN_KEY, t);
    setToken(t);
    setUser(u);
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem(TOKEN_KEY);
    setToken(null);
    setUser(null);
  }, []);

  const refresh = useCallback(async () => {
    if (token) await fetchUser(token);
  }, [token, fetchUser]);

  const value = useMemo(
    () => ({ user, token, ready, login, logout, refresh }),
    [user, token, ready, login, logout, refresh],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}
