import React, { useState, useEffect, useRef } from "react";
import { getInterviewSocket as getSocket } from "@/lib/socket";
import { motion, AnimatePresence } from "framer-motion";
import { SkipForward } from "lucide-react";

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
    return () => { if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current); };
  }, [question, questionStartTime, isAnswerRevealed]);

  const handleTimeUp = () => {
    setIsAnswerRevealed(true);
    getSocket().emit("submit_comp_answer", { 
      pin: lobbyState.pin, 
      questionIndex: currentQIndex, 
      answer: -1 
    });
  };

  const handleOptionSelect = (index: number) => {
    if (selectedOption !== null || isAnswerRevealed) return;
    setSelectedOption(index);
    setIsAnswerRevealed(true);
    
    getSocket().emit("submit_comp_answer", { 
      pin: lobbyState.pin, 
      questionIndex: currentQIndex, 
      answer: index 
    });
  };

  const colors = ["bg-red-500", "bg-blue-500", "bg-yellow-500", "bg-green-500"];

  if (lobbyState.status === "LEADERBOARD") {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8 text-white relative">
        <h1 className="text-6xl font-black mb-12 text-mint">Final Podium</h1>
        <div className="flex items-end justify-center gap-4 h-64">
          {lobbyState.players.slice(0, 3).map((p: any, i: number) => (
            <motion.div 
              key={p.userId}
              initial={{ height: 0 }}
              animate={{ height: i === 0 ? 200 : i === 1 ? 150 : 100 }}
              className={`w-32 flex flex-col items-center justify-end rounded-t-xl ${
                i === 0 ? "bg-yellow-400" : i === 1 ? "bg-gray-300" : "bg-amber-700"
              }`}
            >
              <div className="text-ink font-bold mb-2 truncate px-2 w-full text-center">{p.name}</div>
              <div className="text-ink font-black text-2xl mb-4">{p.score}</div>
            </motion.div>
          ))}
        </div>
      </div>
    );
  }

  if (!question) return <div className="text-white p-8">No questions generated.</div>;

  return (
    <div className="flex-1 flex flex-col p-8 text-white relative">
      {/* Top Bar */}
      <div className="flex justify-between items-center mb-12">
        <div className="text-2xl font-black text-white/50">{currentQIndex + 1} / {lobbyState.quizData.length}</div>
        <div className="text-5xl font-black font-mono">
          <motion.span animate={{ scale: timeLeft <= 5 && !isAnswerRevealed ? [1, 1.2, 1] : 1 }} transition={{ repeat: Infinity }}>
            {timeLeft}
          </motion.span>
        </div>
        <div className="text-2xl font-black text-mint">Score: {score}</div>
      </div>

      {/* Question */}
      <div className="flex-1 flex items-center justify-center mb-12">
        <h2 className="text-4xl md:text-5xl font-bold text-center leading-tight bg-white/10 p-12 rounded-3xl backdrop-blur-sm border border-white/20 shadow-xl max-w-4xl">
          {question.question}
        </h2>
      </div>

      {/* 4 Colored Options */}
      <div className="grid grid-cols-2 gap-4 md:gap-6 h-64 md:h-80">
        <AnimatePresence>
          {question.options.map((opt: string, idx: number) => {
            const isSelected = selectedOption === idx;
            let btnClass = `${colors[idx]} hover:opacity-90`;
            
            if (isAnswerRevealed) {
               if (idx === question.correctAnswer) btnClass = "bg-green-500 animate-pulse border-4 border-white";
               else if (isSelected) btnClass = "bg-red-500 opacity-50";
               else btnClass = "bg-gray-600 opacity-30";
            } else if (selectedOption !== null && !isSelected) {
               btnClass += " opacity-50";
            }

            return (
              <motion.button
                key={idx}
                whileHover={selectedOption === null ? { scale: 1.02 } : {}}
                whileTap={selectedOption === null ? { scale: 0.98 } : {}}
                onClick={() => handleOptionSelect(idx)}
                className={`relative flex items-center justify-center p-6 rounded-2xl text-2xl font-bold shadow-lg transition-all ${btnClass}`}
              >
                {opt}
              </motion.button>
            );
          })}
        </AnimatePresence>
      </div>

      {/* Host Next Question Button */}
      {isHost && isAnswerRevealed && currentQIndex < (lobbyState.quizData?.length || 0) - 1 && (
        <div className="mt-8 text-center">
          <button
            onClick={handleNextQuestion}
            className="inline-flex items-center justify-center gap-2 px-8 py-3 bg-mint text-ink font-black text-lg rounded-full hover:bg-mint/90 transition-colors shadow-lg"
          >
            <SkipForward className="w-5 h-5" />
            Next Question
          </button>
        </div>
      )}

      {/* Explanation after answer revealed */}
      {isAnswerRevealed && question.explanation && (
        <div className="mt-6 p-4 bg-white/5 rounded-xl border border-white/10">
          <div className="text-xs font-bold text-mint uppercase tracking-wider mb-2">Explanation</div>
          <p className="text-white/80">{question.explanation}</p>
        </div>
      )}
    </div>
  );
}