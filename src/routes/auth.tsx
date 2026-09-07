import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { apiCall } from "@/lib/api";
import { useAuth, type UserRole } from "@/lib/auth";

export const Route = createFileRoute("/auth")({
  validateSearch: (
    search: Record<string, unknown>,
  ): {
    mode?: "signup";
    email?: string;
  } => ({
    mode: search.mode === "signup" ? "signup" : undefined,
    email: typeof search.email === "string" ? search.email : undefined,
  }),
  head: () => ({
    meta: [
      { title: "Log in · Jobly" },
      { name: "description", content: "Sign in or create a Jobly account." },
    ],
  }),
  component: AuthPage,
});

// Palette — theme tokens (see styles.css). No private hex values.
// mint-tint bg · ink text · accent actions · mint-light hovers

function AuthPage() {
  const { user, login } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (user) navigate({ to: "/dashboard", replace: true });
  }, [user, navigate]);

  const [mode, setMode] = useState<"login" | "signup">("login");
  const [role, setRole] = useState<UserRole>("seeker");
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const queryMode = new URLSearchParams(window.location.search).get("mode");
    const queryEmail = new URLSearchParams(window.location.search).get("email");
    if (queryMode === "signup") setMode("signup");
    if (queryEmail && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(queryEmail)) {
      setForm((prev) => ({ ...prev, email: queryEmail }));
    }
  }, []);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      if (mode === "login") {
        const data = await apiCall<{ token: string }>("/auth/login", "POST", {
          email: form.email,
          password: form.password,
        });
        const user = await apiCall<any>("/users/me", "GET", null, data.token);
        login(user, data.token);
        toast.success("Welcome back");
        navigate({ to: "/dashboard" });
      } else {
        const body = { ...form, role };
        await apiCall("/auth/register", "POST", body);
        toast.success("Account created! Please log in.");
        setMode("login");
      }
    } catch (err: any) {
      toast.error(err.message ?? "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  const isLogin = mode === "login";

  return (
    <main className="relative h-screen w-full overflow-hidden flex flex-col items-center justify-center bg-mint-tint px-4 text-ink font-sans sm:px-6">
      {/* Wordmark in top-left */}
      <div className="absolute left-6 top-6 flex items-center gap-2 sm:left-10 sm:top-8">
        <a href="/" className="flex items-center gap-2 group">
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-accent text-xs font-bold text-white transition-transform duration-200 group-hover:scale-105">
            jr
          </span>
          <span className="font-display text-lg text-ink">
            Jobly
          </span>
        </a>
      </div>

      <div className="w-full max-w-md my-auto flex flex-col items-center justify-center">
        <div
          className="surface w-full rounded-3xl p-6 sm:p-8"
          style={{
            boxShadow: "0 30px 80px -40px rgb(42 157 123 / 0.28), 0 2px 8px rgb(47 48 45 / 0.05)",
          }}
        >
          <p className="marker-num mb-2">
            {isLogin ? "Log in · Jobly" : "Sign up · Jobly"}
          </p>
          <h1 className="font-display text-h3 sm:text-4xl sm:leading-[1.05]">
            {isLogin ? "Hey, welcome back." : "Nice to meet you."}
          </h1>
          <p className="mt-2 text-sm leading-relaxed text-ink/65">
            {isLogin
              ? "A friendlier way to find work. Sign in to pick up where you left off."
              : "Set up your account in a minute — then dive in."}
          </p>

          <form onSubmit={onSubmit} className="mt-5 space-y-3.5">
            {mode === "signup" && (
              <>
                <UField
                  label="Your name"
                  placeholder="Ada Lovelace"
                  value={form.name}
                  onChange={(v) => setForm({ ...form, name: v })}
                  required
                />
                <div>
                  <span className="marker-num">
                    I am a
                  </span>
                  <div className="mt-1.5 grid grid-cols-2 gap-2">
                    {(["seeker", "recruiter"] as const).map((r) => (
                      <button
                        type="button"
                        key={r}
                        onClick={() => setRole(r)}
                        className={
                          role === r
                            ? "rounded-full bg-ink px-3 py-2 text-xs font-bold capitalize text-cream transition-all duration-200 hover:-translate-y-[1px]"
                            : "rounded-full bg-mint-light/70 px-3 py-2 text-xs font-bold capitalize text-ink/80 transition-all duration-200 hover:-translate-y-[1px]"
                        }
                      >
                        {r}
                      </button>
                    ))}
                  </div>
                </div>
              </>
            )}

            <UField
              label="Email"
              type="email"
              placeholder="you@example.com"
              value={form.email}
              onChange={(v) => setForm({ ...form, email: v })}
              required
            />
            <UField
              label="Password"
              type="password"
              placeholder="••••••••"
              value={form.password}
              onChange={(v) => setForm({ ...form, password: v })}
              required
            />

            <button
              type="submit"
              disabled={loading}
              className="pill-mint mt-2 w-full rounded-full py-3 hover:shadow-[0_16px_30px_-16px_rgb(42_157_123/0.4)]"
            >
              {loading ? "Hold on…" : isLogin ? "Log in" : "Sign up"}
            </button>

            {isLogin && (
              <div className="pt-2 border-t border-ink/10 mt-3">
                <div className="flex items-center justify-between mb-2">
                  <span className="marker-num text-ink/60">
                    Quick Demo Accounts
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setForm({ ...form, email: "sarah@techcorp.com", password: "password123" })}
                    className="flex flex-col items-start rounded-xl border border-ink/10 bg-white/70 p-2.5 text-left transition-all duration-150 hover:-translate-y-0.5 hover:border-accent/30 cursor-pointer group"
                  >
                    <span className="text-xs font-bold text-ink">
                      Sarah (Recruiter)
                    </span>
                    <span className="font-mono text-2xs text-ink/70 truncate max-w-full group-hover:opacity-100">
                      sarah@techcorp.com
                    </span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setForm({ ...form, email: "alex@example.com", password: "password123" })}
                    className="flex flex-col items-start rounded-xl border border-ink/10 bg-white/70 p-2.5 text-left transition-all duration-150 hover:-translate-y-0.5 hover:border-accent/30 cursor-pointer group"
                  >
                    <span className="text-xs font-bold text-ink">
                      Alex (Candidate)
                    </span>
                    <span className="font-mono text-2xs text-ink/70 truncate max-w-full group-hover:opacity-100">
                      alex@example.com
                    </span>
                  </button>
                </div>
              </div>
            )}
          </form>
        </div>

        <div className="mt-4 flex flex-wrap items-center justify-center gap-x-2 gap-y-1 text-center text-sm font-medium text-ink/65">
          <span>{isLogin ? "New here?" : "Already a member?"}</span>
          <a
            href={isLogin ? "?mode=signup" : "?mode=login"}
            onClick={(e) => {
              e.preventDefault();
              setMode(isLogin ? "signup" : "login");
            }}
            className="font-bold text-accent underline underline-offset-4 transition-opacity hover:opacity-70 cursor-pointer"
          >
            {isLogin ? "Create an account" : "Log in"}
          </a>
        </div>
        <a
          href="/"
          className="mt-2.5 block text-center text-sm font-semibold text-ink/55 transition-opacity hover:opacity-75 cursor-pointer"
        >
          Back to home
        </a>
      </div>
    </main>
  );
}

function UField({
  label,
  value,
  onChange,
  type = "text",
  placeholder,
  required,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  placeholder?: string;
  required?: boolean;
}) {
  return (
    <label className="block">
      <span className="marker-num">
        {label}
      </span>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        required={required}
        className="control-surface mt-2 w-full rounded-2xl bg-white/70 px-4 py-3 text-base placeholder:text-ink/40 focus:outline-none"
      />
    </label>
  );
}
