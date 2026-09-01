import React from "react";
import { X } from "lucide-react";
import {
  UnifiedTimelineView,
  TimelineItem,
} from "@/components/interview/timeline/UnifiedTimelineView";
import { CheckpointTimeline, CheckpointItem } from "@/components/interview/ide/CheckpointTimeline";
import { NotesPanel } from "@/components/interview/NotesPanel";

interface ToolbarSlidePanelProps {
  activePanel: "TIMELINE" | "CHECKPOINTS" | "NOTES";
  onClose: () => void;

  // Timeline
  timelineEvents?: TimelineItem[];

  // Checkpoints
  sessionId?: string;
  token?: string;
  onRestoreCheckpoint?: (cp: CheckpointItem) => void;
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
    <div className="iv-panel-slide-up iv-glass absolute bottom-[52px] left-0 right-0 z-30 flex h-[40%] flex-col overflow-hidden border-t border-iv-line">
      {/* Panel header */}
      <div className="flex h-10 shrink-0 items-center justify-between border-b border-iv-line px-4">
        <span className="text-[13px] font-semibold text-iv-text">{panelTitles[activePanel]}</span>
        <button
          type="button"
          onClick={onClose}
          className="iv-icon-btn iv-icon-btn-sm"
          title="Close panel"
        >
          <X strokeWidth={1.75} className="h-4 w-4" />
        </button>
      </div>

      {/* Panel content */}
      <div className="iv-scroll flex-1 overflow-y-auto p-4">
        {activePanel === "TIMELINE" && <UnifiedTimelineView events={timelineEvents} />}

        {activePanel === "CHECKPOINTS" && sessionId && (
          <CheckpointTimeline
            sessionId={sessionId}
            token={token}
            onRestoreComplete={onRestoreCheckpoint || (() => {})}
            readOnly={checkpointReadOnly}
          />
        )}

        {activePanel === "NOTES" && (
          <NotesPanel roomKey={roomKey || ""} sessionId={sessionId || ""} />
        )}
      </div>
    </div>
  );
}
