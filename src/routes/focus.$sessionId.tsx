import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useFocusMode } from "@/contexts/FocusModeContext";
import { apiCall } from "@/lib/api";
import { toast } from "sonner";
import { CheckCircle2 } from "lucide-react";

export const Route = createFileRoute("/focus/$sessionId")({
  component: FocusEnvironment,
});

function FocusEnvironment() {
  const { sessionId } = Route.useParams();
  const navigate = useNavigate();
  const { isFocusMode, activeSession, endFocusMode, warningOverlay } = useFocusMode();
  
  const [timeLeft, setTimeLeft] = useState(0);
  const [quizAnswers, setQuizAnswers] = useState<Record<number, number>>({});
  const [submitted, setSubmitted] = useState(false);
  const [score, setScore] = useState<number | null>(null);

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
    let finalScore = undefined;
    
    if (activeSession?.type === "QUIZ") {
      finalScore = calculateScore();
      setScore(finalScore);
    }

    try {
      const res = await apiCall(`/learn/session/${sessionId}/complete`, {
        method: "POST",
        body: { score: finalScore }
      });
      toast.success(`Earned ${res.pointsAwarded} Focus Points!`);
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

  return (
    <div className="min-h-screen bg-ink text-white flex flex-col font-sans select-none">
      {/* Top Bar */}
      <header className="flex justify-between items-center p-6 border-b border-white/10">
        <div>
          <div className="text-white/50 text-xs font-bold tracking-widest uppercase mb-1">
            {activeSession.type} SESSION
          </div>
          <h1 className="text-xl font-bold">{activeSession.topic}</h1>
        </div>
        
        <div className={`text-4xl font-mono font-bold ${timeLeft < 60 ? "text-red-400 animate-pulse" : "text-white"}`}>
          {String(minutes).padStart(2, "0")}:{String(seconds).padStart(2, "0")}
        </div>

        <button 
          onClick={handleExit}
          className="px-6 py-2 rounded-full border border-white/20 hover:bg-white/10 transition-colors text-sm font-bold"
        >
          {submitted ? "Exit to Dashboard" : "Give Up"}
        </button>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto p-8 max-w-4xl w-full mx-auto">
        {submitted ? (
          <div className="flex flex-col items-center justify-center h-full text-center space-y-6">
            <CheckCircle2 className="w-24 h-24 text-mint" />
            <h2 className="text-4xl font-black">Session Complete!</h2>
            {score !== null && (
              <div className="text-2xl">
                You scored: <span className="font-bold text-mint">{score}%</span>
              </div>
            )}
            <button 
              onClick={handleExit}
              className="mt-8 px-8 py-3 bg-white text-ink font-bold rounded-full hover:bg-white/90"
            >
              Back to Dashboard
            </button>
          </div>
        ) : activeSession.type === "QUIZ" && Array.isArray(activeSession.quizData) ? (
          <div className="space-y-12 pb-24">
            {activeSession.quizData.map((q: any, i: number) => (
              <div key={i} className="bg-white/5 p-8 rounded-2xl border border-white/10">
                <h3 className="text-xl font-medium mb-6">
                  <span className="text-white/50 mr-4">{i + 1}.</span>
                  {q.question}
                </h3>
                <div className="space-y-3">
                  {q.options.map((opt: string, optIdx: number) => (
                    <button
                      key={optIdx}
                      onClick={() => setQuizAnswers(prev => ({ ...prev, [i]: optIdx }))}
                      className={`w-full text-left px-6 py-4 rounded-xl border transition-all ${
                        quizAnswers[i] === optIdx 
                          ? "bg-mint/20 border-mint text-white" 
                          : "border-white/10 hover:bg-white/10"
                      }`}
                    >
                      {opt}
                    </button>
                  ))}
                </div>
              </div>
            ))}
            
            <div className="text-center">
              <button 
                onClick={submitSession}
                className="px-12 py-4 bg-mint text-ink font-bold rounded-full hover:bg-mint/90 text-lg"
              >
                Submit Quiz
              </button>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-center space-y-6 opacity-70">
            <h2 className="text-3xl font-light">Deep Work in Progress</h2>
            <p className="max-w-md text-white/50">
              Focus entirely on studying {activeSession.topic}. No tabs, no distractions. 
              The timer is running.
            </p>
          </div>
        )}
      </main>
    </div>
  );
}
