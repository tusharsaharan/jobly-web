import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useFocusMode } from "@/contexts/FocusModeContext";
import { apiCall } from "@/lib/api";
import { toast } from "sonner";
import { CheckCircle2, Clock, ArrowLeft, Send, XCircle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { GlowCard } from "@/components/ui/spotlight-card";

export const Route = createFileRoute("/focus/$sessionId")({
  component: FocusEnvironment,
});

const OPTION_LETTERS = ["A", "B", "C", "D"];

const GREEN_SHADES = [
  {
    name: "Emerald",
    badgeBg: "rgba(16, 185, 129, 0.22)",
    badgeText: "#6ee7b7",
    cardBg: "linear-gradient(135deg, rgba(16, 185, 129, 0.10) 0%, rgba(6, 78, 59, 0.18) 100%)",
    cardBorder: "rgba(16, 185, 129, 0.35)",
  },
  {
    name: "Sage",
    badgeBg: "rgba(20, 184, 166, 0.22)",
    badgeText: "#5eead4",
    cardBg: "linear-gradient(135deg, rgba(20, 184, 166, 0.10) 0%, rgba(19, 78, 74, 0.18) 100%)",
    cardBorder: "rgba(20, 184, 166, 0.35)",
  },
  {
    name: "Forest",
    badgeBg: "rgba(34, 197, 94, 0.22)",
    badgeText: "#86efac",
    cardBg: "linear-gradient(135deg, rgba(34, 197, 94, 0.10) 0%, rgba(20, 83, 45, 0.18) 100%)",
    cardBorder: "rgba(34, 197, 94, 0.35)",
  },
  {
    name: "Mint",
    badgeBg: "rgba(52, 211, 153, 0.22)",
    badgeText: "#a7f3d0",
    cardBg: "linear-gradient(135deg, rgba(52, 211, 153, 0.10) 0%, rgba(6, 95, 70, 0.18) 100%)",
    cardBorder: "rgba(52, 211, 153, 0.35)",
  },
];

function FocusEnvironment() {
  const { sessionId } = Route.useParams();
  const navigate = useNavigate();
  const { isFocusMode, activeSession, endFocusMode, warningOverlay } = useFocusMode();
  
  const [timeLeft, setTimeLeft] = useState(0);
  const [quizAnswers, setQuizAnswers] = useState<Record<number, number>>({});
  const [submitted, setSubmitted] = useState(false);
  const [score, setScore] = useState<number | null>(null);
  const [hoveredOption, setHoveredOption] = useState<string | null>(null);

  // If we arrive here without an active session (e.g. reload or direct link), kick them out.
  useEffect(() => {
    if (!isFocusMode || !activeSession || activeSession._id !== sessionId) {
      navigate({ to: "/learn" });
    }
  }, [isFocusMode, activeSession, sessionId, navigate]);

  useEffect(() => {
    if (activeSession) {
      setTimeLeft(activeSession.durationMinutes * 60);
    }
  }, [activeSession]);

  useEffect(() => {
    if (timeLeft <= 0 || submitted || warningOverlay) return;
    
    const interval = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          handleTimeUp();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [timeLeft, submitted, warningOverlay]);

  const handleTimeUp = async () => {
    toast.success("Time's up! Session completed.");
    await submitSession();
  };

  const calculateScore = () => {
    if (!activeSession?.quizData || !Array.isArray(activeSession.quizData)) return 0;
    const questions = activeSession.quizData;
    let correct = 0;
    questions.forEach((q: any, i: number) => {
      if (quizAnswers[i] === q.correctAnswer) correct++;
    });
    return Math.round((correct / questions.length) * 100);
  };

  const submitSession = async () => {
    if (submitted) return;
    setSubmitted(true);
    let finalScore: number | undefined = undefined;
    
    if (activeSession?.type === "QUIZ") {
      finalScore = calculateScore();
      setScore(finalScore);
    }

    try {
      // Send both verified answers (server will recompute) and legacy score for backwards compat
      const body: any = {};
      if (activeSession?.type === "QUIZ") {
        body.answers = quizAnswers;
        body.score = finalScore;
      }
      const res = await apiCall(`/learn/session/${sessionId}/complete`, {
        method: "POST",
        body,
      });
      // Prefer server-verified score if returned
      if (res.verifiedScore !== undefined && res.verifiedScore !== finalScore) {
        setScore(res.verifiedScore);
      }
      if (res.autoResolvedCount > 0) {
        toast.success(`Earned ${res.pointsAwarded} pts · ${res.autoResolvedCount} weakness(es) auto-resolved!`);
      } else {
        toast.success(`Earned ${res.pointsAwarded} Focus Points!`);
      }
    } catch (e) {
      console.error("Failed to submit", e);
    }
  };

  const handleExit = async () => {
    if (!submitted) {
      const confirm = window.confirm("Are you sure you want to end early? You will not get points for incomplete sessions.");
      if (!confirm) return;
    }
    await endFocusMode();
    navigate({ to: "/learn" });
  };

  if (!activeSession) return null;

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;
  const isUrgent = timeLeft < 60 && timeLeft > 0;
  const answeredCount = Object.keys(quizAnswers).length;
  const totalQuestions = activeSession.quizData?.length || 0;

  return (
    <div className="min-h-screen flex flex-col font-sans select-none" style={{ background: "#0c0c0f", color: "#fff" }}>
      {/* Ambient glow */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-40 left-1/2 -translate-x-1/2 w-[800px] h-[400px] rounded-full opacity-[0.06] blur-[100px]"
          style={{ background: "radial-gradient(ellipse, rgba(99,102,241,0.6), transparent 70%)" }} />
      </div>

      {/* Top Bar */}
      <header className="relative z-10 flex justify-between items-center px-8 py-5 border-b" style={{ borderColor: "rgba(255,255,255,0.06)" }}>
        <div className="flex items-center gap-4">
          <div
            className="text-[10px] font-bold uppercase tracking-[0.15em] px-3 py-1 rounded-md"
            style={{ background: "rgba(255,255,255,0.06)", color: "rgba(255,255,255,0.4)" }}
          >
            {activeSession.type}
          </div>
          <h1 className="text-lg font-semibold text-white/90 tracking-tight">{activeSession.topic}</h1>
        </div>
        
        <div className="flex items-center gap-3">
          <Clock className="w-4 h-4" style={{ color: isUrgent ? "#ef4444" : "rgba(255,255,255,0.3)" }} />
          <span
            className="text-2xl font-mono font-bold tabular-nums"
            style={{ color: isUrgent ? "#ef4444" : "rgba(255,255,255,0.85)" }}
          >
            {String(minutes).padStart(2, "0")}:{String(seconds).padStart(2, "0")}
          </span>
        </div>

        <button 
          onClick={handleExit}
          className="flex items-center gap-2 px-5 py-2 rounded-lg text-sm font-medium transition-all duration-200 cursor-pointer"
          style={{
            background: "rgba(255,255,255,0.05)",
            border: "1px solid rgba(255,255,255,0.08)",
            color: "rgba(255,255,255,0.6)",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = "rgba(255,255,255,0.1)";
            e.currentTarget.style.borderColor = "rgba(255,255,255,0.15)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = "rgba(255,255,255,0.05)";
            e.currentTarget.style.borderColor = "rgba(255,255,255,0.08)";
          }}
        >
          {submitted ? (
            <><ArrowLeft className="w-4 h-4" /> Exit</>
          ) : (
            <><XCircle className="w-4 h-4" /> End Session</>
          )}
        </button>
      </header>

      {/* Main Content Area */}
      <main className="relative z-10 flex-1 overflow-y-auto">
        <AnimatePresence mode="wait">
          {submitted ? (
            <motion.div
              key="complete"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex flex-col items-center justify-center min-h-[calc(100vh-80px)] text-center px-6"
            >
              {/* Score ring */}
              <div className="relative mb-8">
                <svg width="160" height="160" viewBox="0 0 160 160" className="-rotate-90">
                  <circle cx="80" cy="80" r="68" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="6" />
                  <circle
                    cx="80" cy="80" r="68" fill="none"
                    stroke="rgba(34,197,94,0.6)" strokeWidth="6" strokeLinecap="round"
                    strokeDasharray={2 * Math.PI * 68}
                    strokeDashoffset={2 * Math.PI * 68 * (1 - (score || 0) / 100)}
                    style={{ transition: "stroke-dashoffset 1.2s ease" }}
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  {score !== null ? (
                    <>
                      <span className="text-4xl font-bold text-white">{score}</span>
                      <span className="text-xs text-white/30 font-medium mt-0.5">percent</span>
                    </>
                  ) : (
                    <CheckCircle2 className="w-12 h-12 text-emerald-400" />
                  )}
                </div>
              </div>

              <h2 className="text-3xl font-bold tracking-tight text-white/95 mb-2">Session Complete</h2>
              <p className="text-sm text-white/40 mb-10">Your responses have been submitted</p>

              <button 
                onClick={handleExit}
                className="inline-flex items-center gap-2.5 px-8 py-3 rounded-xl text-sm font-semibold transition-all duration-200 cursor-pointer"
                style={{
                  background: "rgba(255,255,255,0.08)",
                  border: "1px solid rgba(255,255,255,0.12)",
                  color: "rgba(255,255,255,0.85)",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = "rgba(255,255,255,0.14)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = "rgba(255,255,255,0.08)";
                }}
              >
                <ArrowLeft className="w-4 h-4" />
                Back to Dashboard
              </button>
            </motion.div>
          ) : activeSession.type === "QUIZ" && Array.isArray(activeSession.quizData) ? (
            <motion.div
              key="quiz"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="max-w-3xl w-full mx-auto px-6 py-10 pb-32"
            >
              {/* Progress bar */}
              <div className="mb-10">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-medium text-white/30">Progress</span>
                  <span className="text-xs font-mono text-white/30">{answeredCount}/{totalQuestions}</span>
                </div>
                <div className="h-1 w-full rounded-full" style={{ background: "rgba(255,255,255,0.06)" }}>
                  <motion.div
                    className="h-full rounded-full"
                    style={{ background: "linear-gradient(90deg, rgba(99,102,241,0.6), rgba(168,85,247,0.6))" }}
                    animate={{ width: `${totalQuestions > 0 ? (answeredCount / totalQuestions) * 100 : 0}%` }}
                    transition={{ duration: 0.4, ease: "easeOut" }}
                  />
                </div>
              </div>

              {/* Questions */}
              <div className="space-y-8">
                {activeSession.quizData.map((q: any, i: number) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.06, duration: 0.4 }}
                    className="rounded-2xl border p-7"
                    style={{
                      background: "rgba(255,255,255,0.025)",
                      borderColor: quizAnswers[i] !== undefined ? "rgba(99,102,241,0.2)" : "rgba(255,255,255,0.05)",
                    }}
                  >
                    {/* Question header */}
                    <div className="flex items-start gap-4 mb-6">
                      <span
                        className="shrink-0 w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold font-mono"
                        style={{
                          background: quizAnswers[i] !== undefined ? "rgba(99,102,241,0.15)" : "rgba(255,255,255,0.06)",
                          color: quizAnswers[i] !== undefined ? "rgba(129,140,248,0.9)" : "rgba(255,255,255,0.3)",
                        }}
                      >
                        {i + 1}
                      </span>
                      <h3 className="text-[16px] font-medium leading-relaxed text-white/90 pt-1">
                        {q.question}
                      </h3>
                    </div>

                    {/* Options */}
                    <div className="grid grid-cols-1 gap-2.5 pl-12">
                      {q.options.map((opt: string, optIdx: number) => {
                        const shade = GREEN_SHADES[optIdx % 4];
                        const isSelected = quizAnswers[i] === optIdx;

                        return (
                          <motion.div
                            key={optIdx}
                            whileHover={{ scale: 1.008, y: -1 }}
                            whileTap={{ scale: 0.995 }}
                            className="w-full"
                          >
                            <GlowCard
                              customSize={true}
                              glowColor="green"
                              onClick={() => setQuizAnswers(prev => ({ ...prev, [i]: optIdx }))}
                              style={{
                                background: isSelected
                                  ? shade.cardBg
                                  : "rgba(18, 26, 22, 0.4)",
                                borderColor: isSelected
                                  ? shade.cardBorder
                                  : "rgba(255,255,255,0.06)",
                                cursor: "pointer",
                              }}
                              className="w-full !p-3.5 flex items-center gap-3.5 rounded-xl border text-left transition-colors duration-200"
                            >
                              <span
                                className="shrink-0 w-7 h-7 rounded-md flex items-center justify-center text-xs font-bold font-mono transition-colors duration-200"
                                style={{
                                  background: isSelected ? "#10b981" : shade.badgeBg,
                                  color: isSelected ? "#090d0b" : shade.badgeText,
                                }}
                              >
                                {OPTION_LETTERS[optIdx]}
                              </span>
                              <span className={`text-sm font-medium ${isSelected ? "text-white/95" : "text-white/70"} transition-colors duration-200`}>
                                {opt}
                              </span>
                            </GlowCard>
                          </motion.div>
                        );
                      })}
                    </div>
                  </motion.div>
                ))}
              </div>

              {/* Submit button — sticky at bottom */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="fixed bottom-0 left-0 right-0 flex justify-center py-6 z-20"
                style={{
                  background: "linear-gradient(0deg, #0c0c0f 60%, transparent)",
                }}
              >
                <button 
                  onClick={submitSession}
                  disabled={answeredCount === 0}
                  className="inline-flex items-center gap-2.5 px-10 py-3.5 rounded-xl text-sm font-semibold transition-all duration-200 cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
                  style={{
                    background: answeredCount === totalQuestions
                      ? "linear-gradient(135deg, rgba(99,102,241,0.6), rgba(168,85,247,0.5))"
                      : "rgba(255,255,255,0.08)",
                    border: `1px solid ${answeredCount === totalQuestions ? "rgba(129,140,248,0.4)" : "rgba(255,255,255,0.1)"}`,
                    color: "rgba(255,255,255,0.9)",
                  }}
                >
                  <Send className="w-4 h-4" />
                  Submit Quiz {answeredCount > 0 && `(${answeredCount}/${totalQuestions})`}
                </button>
              </motion.div>
            </motion.div>
          ) : (
            <motion.div
              key="deep-work"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex flex-col items-center justify-center min-h-[calc(100vh-80px)] text-center px-6"
            >
              <div className="w-20 h-20 rounded-2xl flex items-center justify-center mb-6"
                style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.06)" }}>
                <Clock className="w-9 h-9 text-white/20" />
              </div>
              <h2 className="text-2xl font-semibold text-white/80 tracking-tight mb-2">Deep Work in Progress</h2>
              <p className="max-w-sm text-sm text-white/35 leading-relaxed">
                Focus entirely on studying {activeSession.topic}. No tabs, no distractions. 
                The timer is running.
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}
