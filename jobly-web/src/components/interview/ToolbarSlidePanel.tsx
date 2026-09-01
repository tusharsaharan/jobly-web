import React from "react";
import { X } from "lucide-react";
import {
  UnifiedTimelineView,
  TimelineItem,
} from "@/components/interview/timeline/UnifiedTimelineView";
import { CheckpointTimeline } from "@/components/interview/ide/CheckpointTimeline";
import { NotesPanel } from "@/components/interview/NotesPanel";

interface ToolbarSlidePanelProps {
  activePanel: "TIMELINE" | "CHECKPOINTS" | "NOTES";
  onClose: () => void;

  // Timeline
  timelineEvents?: TimelineItem[];

  // Checkpoints
  sessionId?: string;
  token?: string;
  onRestoreCheckpoint?: (cp: any) => void;
  checkpointReadOnly?: boolean;

  // Notes
  roomKey?: string;
}

export function ToolbarSlidePanel({
  activePanel,
  onClose,
  timelineEvents = [],
  sessionId,
  token,
  onRestoreCheckpoint,
  checkpointReadOnly,
  roomKey,
}: ToolbarSlidePanelProps) {
  const panelTitles: Record<string, string> = {
    TIMELINE: "Timeline",
    CHECKPOINTS: "Checkpoints",
    NOTES: "Notes",
  };

  return (
    <div
      className="iv-panel-slide-up absolute bottom-[52px] left-0 right-0 z-30 flex flex-col overflow-hidden border-t border-white/[0.06]"
      style={{
        height: "40%",
        background: "rgba(9, 9, 11, 0.92)",
        backdropFilter: "blur(20px)",
        fontFamily: "var(--font-iv-ui)",
      }}
    >
      {/* Panel header */}
      <div className="flex h-10 flex-shrink-0 items-center justify-between border-b border-white/[0.06] px-4">
        <span className="text-[13px] font-semibold text-white/90">
          {panelTitles[activePanel]}
        </span>
        <button
          type="button"
          onClick={onClose}
          className="iv-btn iv-btn-ghost p-1"
          title="Close panel"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* Panel content */}
      <div className="flex-1 overflow-y-auto iv-scroll p-4">
        {activePanel === "TIMELINE" && (
          <UnifiedTimelineView events={timelineEvents} />
        )}

        {activePanel === "CHECKPOINTS" && sessionId && (
          <CheckpointTimeline
            sessionId={sessionId}
            token={token}
            onRestoreComplete={onRestoreCheckpoint}
            readOnly={checkpointReadOnly}
          />
        )}

        {activePanel === "NOTES" && (
          <NotesPanel
            roomKey={roomKey || ""}
            sessionId={sessionId || ""}
          />
        )}
      </div>
    </div>
  );
}
