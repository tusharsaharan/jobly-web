import React from "react";
import {
  Mic,
  MicOff,
  Video,
  VideoOff,
  Monitor,
  PhoneOff,
  Clock,
  Maximize,
  Minimize,
  ListTree,
  History,
  StickyNote,
  Code2,
  PenTool,
  ChevronDown,
} from "lucide-react";

interface FloatingToolbarProps {
  activeMode: "VIDEO" | "CODING" | "WHITEBOARD";
  onModeChange: (mode: "VIDEO" | "CODING" | "WHITEBOARD") => void;

  // Call controls
  isMicEnabled: boolean;
  isCameraEnabled: boolean;
  isScreenShareEnabled: boolean;
  onToggleMic: () => void;
  onToggleCamera: () => void;
  onToggleScreenShare: () => void;
  onEndCall: () => void;

  // Toolbar panels (video mode only)
  activePanel: "TIMELINE" | "CHECKPOINTS" | "NOTES" | null;
  onTogglePanel: (panel: "TIMELINE" | "CHECKPOINTS" | "NOTES") => void;

  // Timer
  elapsedSeconds: number;

  // Fullscreen
  isFullscreen: boolean;
  onToggleFullscreen: () => void;

  // Recruiter controls
  isRecruiter: boolean;
  sessionStatus?: string;
  currentStage?: string;
  onStageChange?: (stage: string) => void;
  onStartSession?: () => void;
  onEndSession?: () => void;
  onOpenScorecard?: () => void;
}

function formatTimer(totalSeconds: number): string {
  const mins = Math.floor(totalSeconds / 60).toString().padStart(2, "0");
  const secs = (totalSeconds % 60).toString().padStart(2, "0");
  return `${mins}:${secs}`;
}

export function FloatingToolbar({
  activeMode,
  onModeChange,
  isMicEnabled,
  isCameraEnabled,
  isScreenShareEnabled,
  onToggleMic,
  onToggleCamera,
  onToggleScreenShare,
  onEndCall,
  activePanel,
  onTogglePanel,
  elapsedSeconds,
  isFullscreen,
  onToggleFullscreen,
  isRecruiter,
  sessionStatus,
  currentStage,
  onStageChange,
  onStartSession,
  onEndSession,
  onOpenScorecard,
}: FloatingToolbarProps) {
  return (
    <div
      className="iv-glass flex h-[52px] flex-shrink-0 items-center justify-between px-4 select-none"
      style={{ fontFamily: "var(--font-iv-ui)" }}
    >
      {/* Left: Panel toggles (Video mode) / Mode label (other modes) */}
      <div className="flex items-center gap-1">
        <button
          type="button"
          onClick={() => onTogglePanel("TIMELINE")}
          className={`iv-mode-btn text-[12px] ${activePanel === "TIMELINE" ? "active" : ""}`}
          title="Timeline"
        >
          <ListTree className="mr-1.5 inline h-3.5 w-3.5" />
          Timeline
        </button>
        <button
          type="button"
          onClick={() => onTogglePanel("CHECKPOINTS")}
          className={`iv-mode-btn text-[12px] ${activePanel === "CHECKPOINTS" ? "active" : ""}`}
          title="Checkpoints"
        >
          <History className="mr-1.5 inline h-3.5 w-3.5" />
          Checkpoints
        </button>
        <button
          type="button"
          onClick={() => onTogglePanel("NOTES")}
          className={`iv-mode-btn text-[12px] ${activePanel === "NOTES" ? "active" : ""}`}
          title="Notes"
        >
          <StickyNote className="mr-1.5 inline h-3.5 w-3.5" />
          Notes
        </button>
      </div>

      {/* Center: Mode switch + Call controls */}
      <div className="flex items-center gap-5">
        {/* Mode switchers */}
        <div className="flex items-center gap-1 rounded-xl bg-white/[0.04] p-1">
          <button
            type="button"
            onClick={() => onModeChange("CODING")}
            className={`iv-mode-btn text-[12px] ${activeMode === "CODING" ? "active" : ""}`}
          >
            <Code2 className="mr-1.5 inline h-3.5 w-3.5" />
            Code
          </button>
          <button
            type="button"
            onClick={() => onModeChange("WHITEBOARD")}
            className={`iv-mode-btn text-[12px] ${activeMode === "WHITEBOARD" ? "active" : ""}`}
          >
            <PenTool className="mr-1.5 inline h-3.5 w-3.5" />
            Whiteboard
          </button>
        </div>

        {/* Divider */}
        <div className="h-6 w-px bg-white/10" />

        {/* Call controls */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onToggleMic}
            className={`iv-call-btn ${isMicEnabled ? "active" : "muted"}`}
            title={isMicEnabled ? "Mute microphone" : "Unmute microphone"}
          >
            {isMicEnabled ? <Mic className="h-4 w-4" /> : <MicOff className="h-4 w-4" />}
          </button>
          <button
            type="button"
            onClick={onToggleCamera}
            className={`iv-call-btn ${isCameraEnabled ? "active" : "muted"}`}
            title={isCameraEnabled ? "Turn camera off" : "Turn camera on"}
          >
            {isCameraEnabled ? <Video className="h-4 w-4" /> : <VideoOff className="h-4 w-4" />}
          </button>
          <button
            type="button"
            onClick={onToggleScreenShare}
            className={`iv-call-btn ${isScreenShareEnabled ? "active" : "muted"}`}
            title={isScreenShareEnabled ? "Stop sharing" : "Share screen"}
          >
            <Monitor className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={onEndCall}
            className="iv-call-btn end-call"
            title="Leave call"
          >
            <PhoneOff className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Right: Timer, Fullscreen, Recruiter controls */}
      <div className="flex items-center gap-3">
        {/* Recruiter stage controls */}
        {isRecruiter && onStageChange && (
          <div className="relative">
            <select
              value={currentStage || "WAITING_ROOM"}
              onChange={(e) => onStageChange(e.target.value)}
              className="appearance-none rounded-md border border-white/10 bg-white/[0.06] py-1 pl-2.5 pr-7 text-[11px] font-medium text-white/80 outline-none transition hover:border-white/20 focus:border-[var(--iv-accent)]"
              style={{ fontFamily: "var(--font-iv-ui)" }}
            >
              <option value="WAITING_ROOM">Waiting Room</option>
              <option value="INTRO">Introduction</option>
              <option value="CODING">Live Coding</option>
              <option value="SYSTEM_DESIGN">System Design</option>
              <option value="DEBUGGING">Debugging</option>
              <option value="BEHAVIORAL">Behavioral</option>
              <option value="WRAP_UP">Wrap Up</option>
            </select>
            <ChevronDown className="pointer-events-none absolute right-2 top-1/2 h-3 w-3 -translate-y-1/2 text-white/40" />
          </div>
        )}

        {isRecruiter && sessionStatus !== "LIVE" && onStartSession && (
          <button
            type="button"
            onClick={onStartSession}
            className="iv-btn iv-btn-primary text-[11px]"
          >
            Go Live
          </button>
        )}

        {isRecruiter && sessionStatus === "LIVE" && onEndSession && (
          <button
            type="button"
            onClick={onEndSession}
            className="rounded-md bg-rose-600 px-2.5 py-1 text-[11px] font-medium text-white transition hover:bg-rose-700"
            style={{ fontFamily: "var(--font-iv-ui)" }}
          >
            End Session
          </button>
        )}

        {isRecruiter && onOpenScorecard && (
          <button
            type="button"
            onClick={onOpenScorecard}
            className="iv-btn iv-btn-ghost text-[11px]"
          >
            Scorecard
          </button>
        )}

        {/* Divider */}
        <div className="h-6 w-px bg-white/10" />

        {/* Timer */}
        <div className="flex items-center gap-1.5 text-white/60">
          <Clock className="h-3.5 w-3.5" />
          <span
            className="text-[12px] font-medium tabular-nums tracking-wider"
            style={{ fontFamily: "var(--font-iv-code)" }}
          >
            {formatTimer(elapsedSeconds)}
          </span>
        </div>

        {/* Fullscreen */}
        <button
          type="button"
          onClick={onToggleFullscreen}
          className="iv-btn iv-btn-ghost p-1.5"
          title={isFullscreen ? "Exit fullscreen" : "Fullscreen"}
        >
          {isFullscreen ? <Minimize className="h-4 w-4" /> : <Maximize className="h-4 w-4" />}
        </button>
      </div>
    </div>
  );
}
