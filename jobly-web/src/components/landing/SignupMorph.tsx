import { useEffect, useRef, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { motion, useReducedMotion } from "framer-motion";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function SignupMorph() {
  const navigate = useNavigate();
  const reduce = Boolean(useReducedMotion());
  const [email, setEmail] = useState("");
  const [phase, setPhase] = useState<"idle" | "morphing" | "done">("idle");
  const redirectedRef = useRef(false);

  const valid = EMAIL_RE.test(email.trim());

  useEffect(() => {
    if (phase !== "done") return;
    const timer = setTimeout(() => {
      if (redirectedRef.current) return;
      redirectedRef.current = true;
      navigate({
        to: "/auth",
        search: { mode: "signup", email: email.trim() },
      });
    }, 900);
    return () => clearTimeout(timer);
  }, [phase, email, navigate]);

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    if (!valid || phase !== "idle") return;
    setPhase(reduce ? "done" : "morphing");
    if (reduce) return;
    setTimeout(() => setPhase("done"), 1450);
  };

  const morphing = phase === "morphing" || phase === "done";

  return (
    <div className="relative">
      <form onSubmit={handleSubmit} noValidate>
        <div className="relative flex items-center">
          <motion.input
            id="landing-email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Enter your email address"
            autoComplete="email"
            aria-label="Enter your email address"
            className="h-14 w-[68%] rounded-l-full border-0 bg-[#4d4c49] px-7 text-sm text-white outline-none placeholder:text-white/40 focus:ring-0"
            animate={{ opacity: morphing ? 0 : 1 }}
            transition={{ duration: 0.3, delay: morphing ? 0.4 : 0, ease: "easeOut" }}
          />
          <motion.button
            type="submit"
            disabled={morphing}
            className="absolute right-0 top-0 flex h-14 items-center justify-center rounded-r-full bg-mint text-sm font-bold text-ink transition-colors hover:bg-mint-hover disabled:cursor-default"
            initial={{ width: "32%", left: "68%" }}
            animate={
              morphing
                ? { width: ["32%", "44%", "56px"], left: ["68%", "72%", "calc(100% - 56px)"], borderRadius: "999px" }
                : { width: "32%", left: "68%" }
            }
            transition={
              reduce
                ? { duration: 0.2 }
                : { duration: 1, times: [0, 0.36, 1], ease: [0.2, 0.1, 0.2, 1] }
            }
            style={{ pointerEvents: morphing ? "none" : "auto" }}
          >
            {morphing ? (
              <motion.svg
                viewBox="0 0 24 24"
                className="h-6 w-6"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.95 }}
              >
                <motion.path
                  d="M4.5 12.5 L 9.5 17.5 L 19.5 6.5"
                  fill="none"
                  stroke="#302f2c"
                  strokeWidth={3}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  initial={{ pathLength: 0 }}
                  animate={{ pathLength: 1 }}
                  transition={{ duration: 1, delay: 1.05, ease: [0.5, 0.3, 0.3, 1] }}
                />
              </motion.svg>
            ) : (
              <span>Sign up</span>
            )}
          </motion.button>
        </div>
      </form>

      <motion.p
        aria-live="polite"
        className="absolute -bottom-8 left-0 text-sm text-white"
        initial={{ opacity: 0 }}
        animate={{ opacity: phase === "done" ? 1 : 0 }}
        transition={{ duration: 0.4, delay: 0.3 }}
      >
        Thanks — taking you to sign up
      </motion.p>
    </div>
  );
}
