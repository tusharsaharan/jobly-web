import React, { createContext, useContext, useState, useEffect } from "react";
import { apiCall } from "@/lib/api";

type FocusSessionData = {
  _id: string;
  topic: string;
  durationMinutes: number;
  type: "STUDY" | "QUIZ";
  strikes: number;
};

type FocusModeContextType = {
  isFocusMode: boolean;
  activeSession: FocusSessionData | null;
  startFocusMode: (session: FocusSessionData) => Promise<void>;
  endFocusMode: (options?: { isFail?: boolean; score?: number }) => Promise<void>;
  strikes: number;
  warningOverlay: boolean;
};

const FocusModeContext = createContext<FocusModeContextType | undefined>(undefined);

export const FocusModeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isFocusMode, setIsFocusMode] = useState(false);
  const [activeSession, setActiveSession] = useState<FocusSessionData | null>(null);
  const [strikes, setStrikes] = useState(0);
  const [warningOverlay, setWarningOverlay] = useState(false);

  // The strict tab monitoring engine
  useEffect(() => {
    if (!isFocusMode || !activeSession) return;

    const handleFocusLost = async () => {
      // Record a strike!
      setWarningOverlay(true);
      const newStrikes = strikes + 1;
      setStrikes(newStrikes);

      try {
        if (newStrikes >= 3) {
          // Instant fail
          await apiCall(`/learn/session/${activeSession._id}/fail`, { method: "POST" });
          await endFocusMode({ isFail: true });
        } else {
          // Just record the strike
          await apiCall(`/learn/session/${activeSession._id}/fail`, { method: "POST" }); // this endpoint increments strike and fails if we want to change logic, but let's assume it increments. Wait, the controller fails it immediately.
          // Let's modify: the controller currently fails it immediately on /fail. 
          // So if we hit /fail, the session is dead. The plan said 3 strikes or 1 strike. Since user said "strict", 1 strike is instant fail.
          await apiCall(`/learn/session/${activeSession._id}/fail`, { method: "POST" });
          await endFocusMode({ isFail: true });
        }
      } catch (e) {
        console.error("Error reporting strike", e);
      }
    };

    const onVisibilityChange = () => {
      if (document.hidden) {
        handleFocusLost();
      }
    };

    const onBlur = () => {
      handleFocusLost();
    };

    const onFullscreenChange = () => {
      if (!document.fullscreenElement) {
        handleFocusLost();
      }
    };

    document.addEventListener("visibilitychange", onVisibilityChange);
    window.addEventListener("blur", onBlur);
    document.addEventListener("fullscreenchange", onFullscreenChange);

    return () => {
      document.removeEventListener("visibilitychange", onVisibilityChange);
      window.removeEventListener("blur", onBlur);
      document.removeEventListener("fullscreenchange", onFullscreenChange);
    };
  }, [isFocusMode, activeSession, strikes]);

  const startFocusMode = async (session: FocusSessionData) => {
    try {
      if (document.documentElement.requestFullscreen) {
        await document.documentElement.requestFullscreen();
      }
    } catch (e) {
      console.warn("Could not enter fullscreen", e);
    }
    setActiveSession(session);
    setStrikes(0);
    setWarningOverlay(false);
    setIsFocusMode(true);
  };

  const endFocusMode = async (options?: { isFail?: boolean; score?: number }) => {
    setIsFocusMode(false);
    setWarningOverlay(false);
    setActiveSession(null);
    setStrikes(0);

    if (document.fullscreenElement && document.exitFullscreen) {
      document.exitFullscreen().catch(() => {});
    }
    
    // The route component (focus.$sessionId) will react to isFocusMode turning false and redirect, 
    // or we can handle it there.
  };

  return (
    <FocusModeContext.Provider
      value={{
        isFocusMode,
        activeSession,
        startFocusMode,
        endFocusMode,
        strikes,
        warningOverlay,
      }}
    >
      {children}
      {warningOverlay && isFocusMode && (
        <div className="fixed inset-0 z-[9999] bg-red-900/90 flex flex-col items-center justify-center text-white backdrop-blur-md">
          <h1 className="text-6xl font-black mb-4 tracking-tighter">FOCUS LOST</h1>
          <p className="text-xl max-w-lg text-center">
            You switched tabs, exited fullscreen, or minimized the window.
            This strict session has been immediately failed and recorded.
          </p>
          <button 
            onClick={() => endFocusMode({ isFail: true })}
            className="mt-8 px-8 py-3 bg-white text-red-900 font-bold rounded-full hover:bg-red-50 transition-colors"
          >
            Return to Dashboard
          </button>
        </div>
      )}
    </FocusModeContext.Provider>
  );
};

export const useFocusMode = () => {
  const context = useContext(FocusModeContext);
  if (!context) {
    throw new Error("useFocusMode must be used within FocusModeProvider");
  }
  return context;
};
