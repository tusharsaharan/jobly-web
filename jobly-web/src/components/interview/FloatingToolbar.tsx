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

const SW = 1.75;

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
    <div className="iv-glass flex h-[52px] shrink-0 select-none items-center justify-between px-4">
      {/* Left: Panel toggles (Video mode) / Mode label (other modes) */}
      <div className="flex items-center gap-1">
        <button
          type="button"
          onClick={() => onTogglePanel("TIMELINE")}
          className={`iv-mode-btn ${activePanel === "TIMELINE" ? "active" : ""}`}
          title="Timeline"
        >
          <ListTree strokeWidth={SW} className="h-4 w-4" />
          Timeline
        </button>
        <button
          type="button"
          onClick={() => onTogglePanel("CHECKPOINTS")}
          className={`iv-mode-btn ${activePanel === "CHECKPOINTS" ? "active" : ""}`}
          title="Checkpoints"
        >
          <History strokeWidth={SW} className="h-4 w-4" />
          Checkpoints
        </button>
        <button
          type="button"
          onClick={() => onTogglePanel("NOTES")}
          className={`iv-mode-btn ${activePanel === "NOTES" ? "active" : ""}`}
          title="Notes"
        >
          <StickyNote strokeWidth={SW} className="h-4 w-4" />
          Notes
        </button>
      </div>

      {/* Center: Mode switch + Call controls */}
      <div className="flex items-center gap-5">
        {/* Mode switchers */}
        <div className="iv-seg">
          <button
            type="button"
            onClick={() => onModeChange("CODING")}
            className={`iv-seg-btn ${activeMode === "CODING" ? "active" : ""}`}
          >
            <Code2 strokeWidth={SW} className="h-4 w-4" />
            Code
          </button>
          <button
            type="button"
            onClick={() => onModeChange("WHITEBOARD")}
            className={`iv-seg-btn ${activeMode === "WHITEBOARD" ? "active" : ""}`}
          >
            <PenTool strokeWidth={SW} className="h-4 w-4" />
            Whiteboard
          </button>
        </div>

        {/* Divider */}
        <div className="h-6 w-px bg-white/10" />

        {/* Call controls — 48px circles, 20px icons */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onToggleMic}
            className={`iv-call-btn ${isMicEnabled ? "" : "off"}`}
            title={isMicEnabled ? "Mute microphone" : "Unmute microphone"}
          >
            {isMicEnabled ? (
              <Mic strokeWidth={SW} className="h-5 w-5" />
            ) : (
              <MicOff strokeWidth={SW} className="h-5 w-5" />
            )}
          </button>
          <button
            type="button"
            onClick={onToggleCamera}
            className={`iv-call-btn ${isCameraEnabled ? "" : "off"}`}
            title={isCameraEnabled ? "Turn camera off" : "Turn camera on"}
          >
            {isCameraEnabled ? (
              <Video strokeWidth={SW} className="h-5 w-5" />
            ) : (
              <VideoOff strokeWidth={SW} className="h-5 w-5" />
            )}
          </button>
          <button
            type="button"
            onClick={onToggleScreenShare}
            className={`iv-call-btn ${isScreenShareEnabled ? "active" : ""}`}
            title={isScreenShareEnabled ? "Stop sharing" : "Share screen"}
          >
            <Monitor strokeWidth={SW} className="h-5 w-5" />
          </button>
          <button type="button" onClick={onEndCall} className="iv-call-btn end-call" title="Leave call">
            <PhoneOff strokeWidth={SW} className="h-5 w-5" />
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
              className="iv-select h-7 w-auto pr-7 text-[11px] font-medium"
            >
              <option value="WAITING_ROOM">Waiting Room</option>
              <option value="INTRO">Introduction</option>
              <option value="CODING">Live Coding</option>
              <option value="SYSTEM_DESIGN">System Design</option>
              <option value="DEBUGGING">Debugging</option>
              <option value="BEHAVIORAL">Behavioral</option>
              <option value="WRAP_UP">Wrap Up</option>
            </select>
            <ChevronDown
              strokeWidth={SW}
              className="pointer-events-none absolute right-2 top-1/2 h-3 w-3 -translate-y-1/2 text-iv-dim"
            />
          </div>
        )}

        {isRecruiter && sessionStatus !== "LIVE" && onStartSession && (
          <button type="button" onClick={onStartSession} className="iv-btn iv-btn-primary iv-btn-sm">
            Go Live
          </button>
        )}

        {isRecruiter && sessionStatus === "LIVE" && onEndSession && (
          <button type="button" onClick={onEndSession} className="iv-btn iv-btn-danger iv-btn-sm">
            End Session
          </button>
        )}

        {isRecruiter && onOpenScorecard && (
          <button type="button" onClick={onOpenScorecard} className="iv-btn iv-btn-ghost iv-btn-sm">
            Scorecard
          </button>
        )}

        {/* Divider */}
        <div className="h-6 w-px bg-white/10" />

        {/* Timer */}
        <div className="flex items-center gap-1.5 text-iv-muted">
          <Clock strokeWidth={SW} className="h-4 w-4" />
          <span className="font-num text-xs font-medium tracking-wider">{formatTimer(elapsedSeconds)}</span>
        </div>

        {/* Fullscreen */}
        <button
          type="button"
          onClick={onToggleFullscreen}
          className="iv-icon-btn"
          title={isFullscreen ? "Exit fullscreen" : "Fullscreen"}
        >
          {isFullscreen ? (
            <Minimize strokeWidth={SW} className="h-4 w-4" />
          ) : (
            <Maximize strokeWidth={SW} className="h-4 w-4" />
          )}
        </button>
      </div>
    </div>
  );
}
