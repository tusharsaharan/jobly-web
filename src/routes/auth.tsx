import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { apiCall } from "@/lib/api";
import { useAuth, type UserRole } from "@/lib/auth";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Log in · Jobly" },
      { name: "description", content: "Sign in or create a Jobly account." },
    ],
  }),
  component: AuthPage,
});

// Palette — white-first with subtle mint accents.
const CREAM = "#F7FFFB";
const CREAM_SOFT = "rgba(255, 255, 255, 0.72)";
const INK = "#183A32";
const CORAL = "#2A9D7B";
const MINT = "#D6F6E7";
const MINT_HOVER = "#A9EBD1";

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
    if (queryMode === "signup") setMode("signup");
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
    <main
      className="relative h-screen w-full overflow-hidden flex flex-col items-center justify-center px-4 sm:px-6"
      style={{ backgroundColor: CREAM, color: INK, fontFamily: "'Nunito', system-ui, sans-serif" }}
    >
      {/* Wordmark in top-left */}
      <div className="absolute left-6 top-6 flex items-center gap-2 sm:left-10 sm:top-8">
        <a href="/" className="flex items-center gap-2 group">
          <span
            className="flex h-8 w-8 items-center justify-center rounded-full text-xs font-extrabold transition-transform duration-200 group-hover:scale-105"
            style={{ backgroundColor: CORAL, color: "#fff" }}
          >
            jr
          </span>
          <span
            className="text-lg font-extrabold tracking-tight"
            style={{ color: INK, fontFamily: "'Fredoka', 'Nunito', system-ui, sans-serif" }}
          >
            Jobly
          </span>
        </a>
      </div>

      <div className="w-full max-w-md my-auto flex flex-col items-center justify-center">
        <div
          className="w-full rounded-[1.75rem] p-6 sm:p-8 transition-all duration-300 shadow-2xl"
          style={{
            backgroundColor: CREAM_SOFT,
            border: "1px solid rgba(24,58,50,0.12)",
            boxShadow: "0 30px 80px -40px rgba(42,157,123,0.28), 0 2px 8px rgba(24,58,50,0.05)",
            backdropFilter: "blur(18px)",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.boxShadow =
              "0 40px 90px -36px rgba(42,157,123,0.36), 0 4px 14px rgba(24,58,50,0.08)";
            e.currentTarget.style.borderColor = "rgba(42,157,123,0.28)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.boxShadow =
              "0 30px 80px -40px rgba(42,157,123,0.28), 0 2px 8px rgba(24,58,50,0.05)";
            e.currentTarget.style.borderColor = "rgba(24,58,50,0.12)";
          }}
        >
          <p
            className="mb-2 text-[10px] font-medium uppercase"
            style={{
              color: `${INK}8C`,
              letterSpacing: "0.24em",
              fontFamily: "'JetBrains Mono', ui-monospace, monospace",
            }}
          >
            {isLogin ? "Log in · Jobly" : "Sign up · Jobly"}
          </p>
          <h1
            className="text-3xl font-black leading-[1.05] tracking-tight sm:text-4xl"
            style={{
              color: INK,
              fontFamily: "'Fredoka', 'Nunito', system-ui, sans-serif",
            }}
          >
            {isLogin ? "Hey, welcome back." : "Nice to meet you."}
          </h1>
          <p
            className="mt-2 text-xs sm:text-sm leading-relaxed"
            style={{ color: `${INK}A6` }}
          >
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
                  <span
                    className="text-[10px] font-semibold uppercase"
                    style={{
                      color: `${INK}B3`,
                      letterSpacing: "0.16em",
                      fontFamily: "'JetBrains Mono', ui-monospace, monospace",
                    }}
                  >
                    I am a
                  </span>
                  <div className="mt-1.5 grid grid-cols-2 gap-2">
                    {(["seeker", "recruiter"] as const).map((r) => (
                      <button
                        type="button"
                        key={r}
                        onClick={() => setRole(r)}
                        className="rounded-full px-3 py-2 text-xs font-bold capitalize transition-all duration-200 hover:-translate-y-[1px]"
                        style={
                          role === r
                            ? { backgroundColor: INK, color: CREAM }
                            : { backgroundColor: "rgba(214,246,231,0.72)", color: `${INK}CC` }
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
              className="mt-2 w-full rounded-full py-3 text-sm font-extrabold tracking-wide transition-all duration-200 hover:-translate-y-[1px] hover:shadow-[0_16px_30px_-16px_rgba(14,17,22,0.28)] disabled:opacity-50 cursor-pointer"
              style={{ backgroundColor: MINT, color: INK }}
              onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = MINT_HOVER)}
              onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = MINT)}
            >
              {loading ? "Hold on…" : isLogin ? "Log in" : "Sign up"}
            </button>
          </form>
        </div>

        <div className="mt-4 flex flex-wrap items-center justify-center gap-x-2 gap-y-1 text-center text-xs font-medium" style={{ color: `${INK}A6` }}>
          <span>{isLogin ? "New here?" : "Already a member?"}</span>
          <button
            type="button"
            onClick={() => setMode(isLogin ? "signup" : "login")}
            className="font-extrabold underline underline-offset-4 transition-opacity hover:opacity-70 cursor-pointer"
            style={{ color: CORAL }}
          >
            {isLogin ? "Create an account" : "Log in"}
          </button>
        </div>
        <a
          href="/"
          className="mt-2.5 block text-center text-xs font-semibold transition-opacity hover:opacity-65 cursor-pointer"
          style={{ color: `${INK}8C` }}
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
      <span
        className="text-[11px] font-semibold uppercase"
        style={{
          color: `${INK}B3`,
          letterSpacing: "0.16em",
          fontFamily: "'JetBrains Mono', ui-monospace, monospace",
        }}
      >
        {label}
      </span>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        required={required}
        className="mt-2 w-full rounded-2xl px-4 py-3 text-[15px] transition-colors duration-200 focus:outline-none focus:ring-2"
        style={{
          backgroundColor: "rgba(255,255,255,0.72)",
          color: INK,
          border: "1px solid rgba(24,58,50,0.14)",
        }}
      />
    </label>
  );
}
