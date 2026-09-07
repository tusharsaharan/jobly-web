import React, { useState, useEffect, useRef } from "react";
import { getInterviewSocket as getSocket } from "@/lib/socket";
import { motion, AnimatePresence } from "framer-motion";
import { SkipForward, CheckCircle2, XCircle, Trophy, Zap, ShieldCheck } from "lucide-react";
import { GlowCard } from "@/components/ui/spotlight-card";

/* ───────────────────── Sleek Compact Circular Timer ───────────────────── */
function TimerRing({ timeLeft, totalTime, isUrgent }: { timeLeft: number; totalTime: number; isUrgent: boolean }) {
  const radius = 20;
  const circumference = 2 * Math.PI * radius;
  const progress = Math.max(0, Math.min(1, timeLeft / totalTime));
  const offset = circumference * (1 - progress);

  return (
    <div className="relative flex items-center justify-center">
      <svg width="52" height="52" viewBox="0 0 52 52" className="-rotate-90">
        <circle cx="26" cy="26" r={radius} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="3.5" />
        <circle
          cx="26"
          cy="26"
          r={radius}
          fill="none"
          stroke={isUrgent ? "#f87171" : "#34d399"}
          strokeWidth="3.5"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          style={{ transition: "stroke-dashoffset 0.35s ease, stroke 0.3s ease" }}
        />
      </svg>
      <motion.span
        key={timeLeft}
        initial={{ scale: 1.2, opacity: 0.8 }}
        animate={{ scale: 1, opacity: 1 }}
        className={`absolute font-mono text-sm font-bold tracking-tight ${
          isUrgent ? "text-red-400" : "text-emerald-300"
        }`}
      >
        {timeLeft}
      </motion.span>
    </div>
  );
}

const OPTION_LETTERS = ["A", "B", "C", "D"];

/* ───────────────────── 4 Elegant Non-Neon Shades of Green ───────────────────── */
const GREEN_SHADES = [
  {
    name: "Emerald",
    badgeBg: "rgba(16, 185, 129, 0.22)",
    badgeText: "#6ee7b7",
    cardBg: "linear-gradient(135deg, rgba(16, 185, 129, 0.12) 0%, rgba(6, 78, 59, 0.22) 100%)",
    cardBorder: "rgba(16, 185, 129, 0.30)",
    hoverBorder: "rgba(52, 211, 153, 0.55)",
    glowColor: "green" as const,
  },
  {
    name: "Sage",
    badgeBg: "rgba(20, 184, 166, 0.22)",
    badgeText: "#5eead4",
    cardBg: "linear-gradient(135deg, rgba(20, 184, 166, 0.12) 0%, rgba(19, 78, 74, 0.22) 100%)",
    cardBorder: "rgba(20, 184, 166, 0.30)",
    hoverBorder: "rgba(45, 212, 191, 0.55)",
    glowColor: "green" as const,
  },
  {
    name: "Forest",
    badgeBg: "rgba(34, 197, 94, 0.22)",
    badgeText: "#86efac",
    cardBg: "linear-gradient(135deg, rgba(34, 197, 94, 0.12) 0%, rgba(20, 83, 45, 0.22) 100%)",
    cardBorder: "rgba(34, 197, 94, 0.30)",
    hoverBorder: "rgba(74, 222, 128, 0.55)",
    glowColor: "green" as const,
  },
  {
    name: "Mint",
    badgeBg: "rgba(52, 211, 153, 0.22)",
    badgeText: "#a7f3d0",
    cardBg: "linear-gradient(135deg, rgba(52, 211, 153, 0.12) 0%, rgba(6, 95, 70, 0.22) 100%)",
    cardBorder: "rgba(52, 211, 153, 0.30)",
    hoverBorder: "rgba(110, 231, 183, 0.55)",
    glowColor: "green" as const,
  },
];

export default function QuizArena({ lobbyState, user, setLobbyState }: any) {
  const [currentQIndex, setCurrentQIndex] = useState(0);
  const [timeLeft, setTimeLeft] = useState(20);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [isAnswerRevealed, setIsAnswerRevealed] = useState(false);
  const [score, setScore] = useState(0);
  const [questionStartTime, setQuestionStartTime] = useState<number>(0);
  const animationFrameRef = useRef<number | null>(null);

  const isHost = lobbyState.hostId === user._id;
  const question = lobbyState.quizData?.[currentQIndex];
  const totalTime = question?.timeLimitSeconds || 20;

  const handleNextQuestion = () => {
    if (!isHost) return;
    getSocket().emit("next_question", { pin: lobbyState.pin });
  };

  useEffect(() => {
    const socket = getSocket();

    socket.on("comp_score_update", (data: any) => {
      setLobbyState((prev: any) => {
        const newPlayers = prev.players.map((p: any) => {
          if (p.userId === data.userId) {
            return { ...p, score: (p.score || 0) + (data.scoreDelta || 0) };
          }
          return p;
        });
        return { ...prev, players: newPlayers.sort((a: any, b: any) => (b.score || 0) - (a.score || 0)) };
      });

      if (data.userId === user._id) {
        setScore((prev) => prev + (data.scoreDelta || 0));
      }
    });

    socket.on("question_changed", (data: any) => {
      setCurrentQIndex(data.questionIndex);
      setSelectedOption(null);
      setIsAnswerRevealed(false);
      setQuestionStartTime(new Date(data.startedAt).getTime());
    });

    socket.on("quiz_complete", (data: any) => {
      setLobbyState((prev: any) => ({ ...prev, status: "LEADERBOARD", players: data.finalScores }));
    });

    socket.on("comp_started", (data: any) => {
      if (data.questionIndex !== undefined) {
        setCurrentQIndex(data.questionIndex);
        setQuestionStartTime(new Date(data.startedAt).getTime());
      }
    });

    return () => {
      socket.off("comp_score_update");
      socket.off("question_changed");
      socket.off("quiz_complete");
      socket.off("comp_started");
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
    };
  }, [user._id, setLobbyState]);

  useEffect(() => {
    if (!question || isAnswerRevealed) return;

    const tick = () => {
      const elapsed = (Date.now() - questionStartTime) / 1000;
      const limit = question.timeLimitSeconds || 20;
      const left = Math.max(0, Math.ceil(limit - elapsed));
      setTimeLeft(left);

      if (left > 0 && !isAnswerRevealed) {
        animationFrameRef.current = requestAnimationFrame(tick);
      } else if (left <= 0 && !isAnswerRevealed) {
        handleTimeUp();
      }
    };

    animationFrameRef.current = requestAnimationFrame(tick);
    return () => {
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
    };
  }, [question, questionStartTime, isAnswerRevealed]);

  const handleTimeUp = () => {
    setIsAnswerRevealed(true);
    getSocket().emit("submit_comp_answer", {
      pin: lobbyState.pin,
      questionIndex: currentQIndex,
      answer: -1,
    });
  };

  const handleOptionSelect = (index: number) => {
    if (selectedOption !== null || isAnswerRevealed) return;
    setSelectedOption(index);
    setIsAnswerRevealed(true);

    getSocket().emit("submit_comp_answer", {
      pin: lobbyState.pin,
      questionIndex: currentQIndex,
      answer: index,
    });
  };

  /* ═══════════════════════════ LEADERBOARD ═══════════════════════════ */
  if (lobbyState.status === "LEADERBOARD") {
    const podiumPlayers = lobbyState.players.slice(0, 3);
    const podiumOrder =
      podiumPlayers.length >= 3 ? [podiumPlayers[1], podiumPlayers[0], podiumPlayers[2]] : podiumPlayers;
    const podiumHeights = [140, 190, 110];
    const podiumColors = [
      "linear-gradient(180deg, rgba(20, 184, 166, 0.25) 0%, rgba(13, 78, 70, 0.08) 100%)",
      "linear-gradient(180deg, rgba(16, 185, 129, 0.35) 0%, rgba(6, 78, 59, 0.12) 100%)",
      "linear-gradient(180deg, rgba(52, 211, 153, 0.20) 0%, rgba(6, 95, 70, 0.06) 100%)",
    ];
    const podiumBorders = ["rgba(20, 184, 166, 0.4)", "rgba(16, 185, 129, 0.6)", "rgba(52, 211, 153, 0.35)"];
    const medals = ["🥈", "🥇", "🥉"];

    return (
      <div className="h-full max-h-full w-full flex flex-col items-center justify-center p-6 text-white overflow-hidden select-none bg-[#090d0b]">
        <motion.div
          initial={{ opacity: 0, y: -15 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-3 mb-8"
        >
          <Trophy className="w-7 h-7 text-emerald-400" />
          <h1 className="text-3xl font-bold tracking-tight text-white/95">Competition Results</h1>
        </motion.div>

        <div className="flex items-end justify-center gap-4 mb-8">
          {podiumOrder.map((p: any, i: number) => (
            <motion.div
              key={p.userId}
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: podiumHeights[i], opacity: 1 }}
              transition={{ delay: 0.2 + i * 0.15, type: "spring", stiffness: 90, damping: 14 }}
              className="w-32 md:w-36 flex flex-col items-center justify-end rounded-t-2xl backdrop-blur-sm border-t border-l border-r px-3 pb-3"
              style={{ background: podiumColors[i], borderColor: podiumBorders[i] }}
            >
              <span className="text-2xl mb-1">{medals[i]}</span>
              <div className="text-xs md:text-sm font-semibold text-white/90 truncate w-full text-center">
                {p.name}
              </div>
              <div className="text-lg font-bold text-emerald-300 font-mono mt-0.5">{p.score}</div>
            </motion.div>
          ))}
        </div>

        {lobbyState.players.length > 3 && (
          <div className="w-full max-w-sm space-y-1.5 overflow-y-auto max-h-32 px-1">
            {lobbyState.players.slice(3).map((p: any, i: number) => (
              <div
                key={p.userId}
                className="flex items-center justify-between py-2 px-4 rounded-xl bg-white/[0.03] border border-white/[0.06]"
              >
                <div className="flex items-center gap-2.5">
                  <span className="text-white/30 text-xs font-mono w-5">{i + 4}</span>
                  <span className="text-xs font-medium text-white/80">{p.name}</span>
                </div>
                <span className="text-xs font-mono text-emerald-400/80">{p.score}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  if (!question) {
    return (
      <div className="h-full w-full flex items-center justify-center bg-[#090d0b]">
        <div className="text-emerald-400/50 text-sm font-medium tracking-wide flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 animate-pulse" />
          Preparing arena questions…
        </div>
      </div>
    );
  }

  /* ═══════════════════════════ PLAYING QUIZ (Strictly Non-Scrollable) ═══════════════════════════ */
  return (
    <div className="h-full max-h-full w-full flex flex-col justify-between overflow-hidden select-none bg-[#090d0b] relative text-white">
      {/* Background Ambience: Subtle Dark Forest Gradient (No Neon) */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div
          className="absolute -top-32 left-1/2 -translate-x-1/2 w-[700px] h-[350px] rounded-full opacity-[0.06] blur-[120px]"
          style={{ background: "radial-gradient(ellipse, #10b981, transparent 70%)" }}
        />
      </div>

      {/* ── TOP HEADER (Fixed 56px height) ── */}
      <header className="h-14 shrink-0 px-6 flex items-center justify-between border-b border-emerald-900/30 bg-[#0c120e]/80 backdrop-blur-md z-10">
        {/* Question Counter & Progress Indicators */}
        <div className="flex items-center gap-3">
          <span className="text-xs font-mono font-medium text-emerald-400/80 bg-emerald-950/60 border border-emerald-800/40 px-2.5 py-1 rounded-md">
            Question {currentQIndex + 1} / {lobbyState.quizData.length}
          </span>
          <div className="hidden sm:flex items-center gap-1.5">
            {lobbyState.quizData.map((_: any, i: number) => (
              <div
                key={i}
                className="h-1.5 rounded-full transition-all duration-300"
                style={{
                  width: i === currentQIndex ? 18 : 6,
                  background:
                    i < currentQIndex
                      ? "rgba(16, 185, 129, 0.4)"
                      : i === currentQIndex
                      ? "#34d399"
                      : "rgba(255, 255, 255, 0.08)",
                }}
              />
            ))}
          </div>
        </div>

        {/* Center Countdown Ring */}
        <TimerRing timeLeft={timeLeft} totalTime={totalTime} isUrgent={timeLeft <= 5 && !isAnswerRevealed} />

        {/* Real-time Player Score */}
        <div className="flex items-center gap-2 bg-emerald-950/50 border border-emerald-800/40 px-3 py-1 rounded-full">
          <Zap className="w-3.5 h-3.5 text-emerald-400" />
          <span className="text-xs font-bold font-mono text-emerald-300">{score} pts</span>
        </div>
      </header>

      {/* ── MIDDLE QUESTION & OPTION CARDS (Fills available space, non-scrollable) ── */}
      <main className="flex-1 min-h-0 flex flex-col justify-center items-center px-4 md:px-8 py-2 w-full max-w-5xl mx-auto z-10">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentQIndex}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
            className="w-full flex flex-col items-center h-full justify-center max-h-[520px]"
          >
            {/* Question Text Box */}
            <div className="w-full shrink-0 text-center px-6 py-4 md:py-5 rounded-2xl border border-emerald-500/20 bg-[#121a15]/80 backdrop-blur-md mb-4 shadow-xl shadow-black/50">
              <h2 className="text-base md:text-xl lg:text-2xl font-semibold text-white/95 leading-snug tracking-tight">
                {question.question}
              </h2>
            </div>

            {/* 4 Professional Option Cards (2×2 Grid using Spotlight GlowCard) */}
            <div className="w-full grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-3.5 flex-1 min-h-0 max-h-[340px]">
              {question.options.map((opt: string, idx: number) => {
                const shade = GREEN_SHADES[idx % 4];
                const isSelected = selectedOption === idx;
                const isCorrect = idx === question.correctAnswer;

                let cardBg = shade.cardBg;
                let cardBorder = shade.cardBorder;
                let statusIcon: React.ReactNode = null;
                let opacity = "opacity-100";

                if (isAnswerRevealed) {
                  if (isCorrect) {
                    cardBg = "linear-gradient(135deg, rgba(16, 185, 129, 0.28) 0%, rgba(6, 78, 59, 0.45) 100%)";
                    cardBorder = "rgba(52, 211, 153, 0.85)";
                    statusIcon = <CheckCircle2 className="w-5 h-5 text-emerald-300 shrink-0" />;
                  } else if (isSelected && !isCorrect) {
                    cardBg = "linear-gradient(135deg, rgba(239, 68, 68, 0.18) 0%, rgba(127, 29, 29, 0.30) 100%)";
                    cardBorder = "rgba(248, 113, 113, 0.65)";
                    statusIcon = <XCircle className="w-5 h-5 text-red-400 shrink-0" />;
                    opacity = "opacity-80";
                  } else {
                    cardBg = "rgba(16, 22, 19, 0.4)";
                    cardBorder = "rgba(255, 255, 255, 0.05)";
                    opacity = "opacity-40";
                  }
                } else if (isSelected) {
                  cardBg = "linear-gradient(135deg, rgba(16, 185, 129, 0.22) 0%, rgba(6, 78, 59, 0.35) 100%)";
                  cardBorder = "rgba(52, 211, 153, 0.75)";
                }

                return (
                  <motion.div
                    key={idx}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.05 * idx, duration: 0.25 }}
                    whileHover={selectedOption === null && !isAnswerRevealed ? { y: -2, scale: 1.01 } : {}}
                    whileTap={selectedOption === null && !isAnswerRevealed ? { scale: 0.99 } : {}}
                    className="h-full min-h-0"
                  >
                    <GlowCard
                      customSize={true}
                      glowColor="green"
                      onClick={() => handleOptionSelect(idx)}
                      style={{
                        background: cardBg,
                        borderColor: cardBorder,
                        cursor: isAnswerRevealed ? "default" : "pointer",
                      }}
                      className={`h-full min-h-0 w-full !p-3.5 md:!p-4 flex items-center justify-between gap-3 border rounded-xl transition-all duration-200 ${opacity}`}
                    >
                      <div className="flex items-center gap-3 min-w-0 flex-1">
                        {/* Letter indicator in specific green shade */}
                        <span
                          className="shrink-0 w-8 h-8 rounded-lg flex items-center justify-center text-xs md:text-sm font-bold font-mono transition-colors"
                          style={{
                            background: isSelected || (isAnswerRevealed && isCorrect) ? "#10b981" : shade.badgeBg,
                            color: isSelected || (isAnswerRevealed && isCorrect) ? "#090d0b" : shade.badgeText,
                          }}
                        >
                          {OPTION_LETTERS[idx]}
                        </span>

                        {/* Option text */}
                        <span className="text-xs md:text-sm font-medium text-white/90 leading-snug line-clamp-3">
                          {opt}
                        </span>
                      </div>

                      {/* Status indicator on answer reveal */}
                      {statusIcon}
                    </GlowCard>
                  </motion.div>
                );
              })}
            </div>
          </motion.div>
        </AnimatePresence>
      </main>

      {/* ── BOTTOM ACTION & STATUS BAR (Fixed 64px height, prevents scroll) ── */}
      <footer className="h-16 shrink-0 px-6 border-t border-emerald-900/30 bg-[#0c120e]/80 backdrop-blur-md flex items-center justify-between z-10">
        <div className="flex-1 min-w-0 pr-4">
          {isAnswerRevealed && question.explanation ? (
            <p className="text-xs text-emerald-300/80 truncate">
              <span className="font-semibold text-emerald-400 mr-1.5">Note:</span>
              {question.explanation}
            </p>
          ) : (
            <p className="text-xs text-white/40">Select an answer before time expires</p>
          )}
        </div>

        {/* Host Next Question Button */}
        {isHost && isAnswerRevealed && currentQIndex < (lobbyState.quizData?.length || 0) - 1 ? (
          <button
            onClick={handleNextQuestion}
            className="inline-flex items-center gap-2 px-5 py-2 rounded-xl text-xs font-semibold bg-emerald-500 hover:bg-emerald-400 text-black shadow-lg shadow-emerald-950/50 transition-all cursor-pointer shrink-0 active:scale-95"
          >
            <SkipForward className="w-3.5 h-3.5" />
            Next Question
          </button>
        ) : isAnswerRevealed ? (
          <span className="text-xs text-emerald-400/60 font-mono shrink-0">Waiting for next round…</span>
        ) : null}
      </footer>
    </div>
  );
}