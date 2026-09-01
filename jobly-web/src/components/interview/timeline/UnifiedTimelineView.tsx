import React, { useState } from "react";
import {
  Clock,
  MessageSquare,
  Code2,
  Layers,
  Sparkles,
  UserCheck,
  Search,
  ShieldAlert,
  Terminal,
} from "lucide-react";

export interface TimelineItem {
  _id?: string;
  pipeline: "COMMUNICATION" | "CODING" | "WHITEBOARD" | "STAGE" | "AI" | "NOTE" | "SYSTEM" | "INTEGRITY";
  eventType: string;
  offsetMs: number;
  participantRole?: string;
  payload?: any;
  createdAt?: string;
}

interface UnifiedTimelineViewProps {
  events: TimelineItem[];
  onSelectEvent?: (event: TimelineItem) => void;
}

const SW = 1.75;

export function UnifiedTimelineView({ events, onSelectEvent }: UnifiedTimelineViewProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [pipelineFilter, setPipelineFilter] = useState<string>("ALL");

  const formatOffset = (ms: number) => {
    const totalSec = Math.floor(ms / 1000);
    const m = Math.floor(totalSec / 60);
    const s = totalSec % 60;
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  const getPipelineBadge = (pipeline: string) => {
    switch (pipeline) {
      case "CODING":
        return <span className="flex items-center gap-1 font-semibold text-iv-success"><Code2 strokeWidth={SW} className="h-3 w-3" /> IDE</span>;
      case "WHITEBOARD":
        return <span className="flex items-center gap-1 font-semibold text-cyan-400"><Layers strokeWidth={SW} className="h-3 w-3" /> Board</span>;
      case "COMMUNICATION":
        return <span className="flex items-center gap-1 font-semibold text-iv-info"><MessageSquare strokeWidth={SW} className="h-3 w-3" /> Speech</span>;
      case "STAGE":
        return <span className="flex items-center gap-1 font-semibold text-iv-warning-text"><UserCheck strokeWidth={SW} className="h-3 w-3" /> Stage</span>;
      case "AI":
        return <span className="flex items-center gap-1 font-semibold text-[#c084fc]"><Sparkles strokeWidth={SW} className="h-3 w-3" /> AI</span>;
      case "INTEGRITY":
        return <span className="flex items-center gap-1 font-semibold text-iv-danger"><ShieldAlert strokeWidth={SW} className="h-3 w-3" /> Signal</span>;
      default:
        return <span className="flex items-center gap-1 font-semibold text-iv-dim"><Clock strokeWidth={SW} className="h-3 w-3" /> Event</span>;
    }
  };

  const formatEventTitle = (ev: TimelineItem) => {
    if (ev.eventType === "code.execution") {
      return `Code Run (${ev.payload?.language || "Solution"})`;
    }
    if (ev.eventType === "code.checkpoint" || ev.eventType === "checkpoint.saved") {
      return ev.payload?.sequenceNumber ? `Checkpoint #${ev.payload.sequenceNumber}` : "Code Checkpoint";
    }
    if (ev.eventType === "checkpoint.restored") {
      return ev.payload?.sequenceNumber ? `Restored to Checkpoint #${ev.payload.sequenceNumber}` : "Checkpoint Restored";
    }
    if (ev.eventType === "whiteboard.snapshot") {
      return "Whiteboard Snapshot";
    }
    if (ev.eventType === "stage.transition" || ev.eventType === "stage_change") {
      return `Stage: ${(ev.payload?.stage || "").replace(/_/g, " ")}`;
    }
    if (ev.eventType === "session.status_change" || ev.eventType === "session.status") {
      return `Session: ${(ev.payload?.status || "").toUpperCase()}`;
    }
    if (ev.eventType === "transcript.segment") {
      return "Transcript";
    }
    return ev.eventType.replace(".", " ").toUpperCase();
  };

  // Filter out noise/telemetry events (routine focus in/out) unless marked anomalous
  const meaningfulEvents = events.filter((ev) => {
    if (ev.eventType?.startsWith("focus.") || ev.pipeline === "INTEGRITY") {
      return Boolean(ev.payload?.isAnomalous);
    }
    return true;
  });

  const filteredEvents = meaningfulEvents.filter((ev) => {
    const matchesPipeline = pipelineFilter === "ALL" || ev.pipeline === pipelineFilter;
    const textToMatch = `${ev.eventType} ${ev.payload?.text || ""} ${ev.payload?.stage || ""} ${ev.payload?.codeSnippet || ""}`.toLowerCase();
    const matchesSearch = !searchQuery.trim() || textToMatch.includes(searchQuery.trim().toLowerCase());
    return matchesPipeline && matchesSearch;
  });

  return (
    <div className="iv-card flex h-full select-none flex-col overflow-hidden p-2.5 text-xs text-iv-text">
      {/* Header */}
      <div className="mb-2 flex items-center justify-between border-b border-iv-line pb-2 font-semibold text-iv-muted">
        <div className="flex items-center gap-1.5">
          <Clock strokeWidth={SW} className="h-4 w-4 text-iv-accent" />
          <span>Unified Timeline</span>
        </div>
        <span className="iv-badge iv-badge-neutral font-num">
          {filteredEvents.length} / {meaningfulEvents.length} Events
        </span>
      </div>

      {/* Filter and Search Bar */}
      <div className="mb-2 flex flex-col gap-1.5">
        <div className="flex items-center rounded-md border border-iv-line bg-iv-bg px-2 py-1">
          <Search strokeWidth={SW} className="mr-1.5 h-3 w-3 text-iv-dim" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search transcript, code, stage..."
            className="w-full bg-transparent text-[11px] text-iv-text outline-none placeholder:text-iv-dim"
          />
        </div>

        <div className="iv-scroll flex items-center gap-1 overflow-x-auto pb-0.5 text-[10px]">
          {["ALL", "CODING", "WHITEBOARD", "COMMUNICATION", "STAGE", "AI"].map((pipe) => (
            <button
              key={pipe}
              onClick={() => setPipelineFilter(pipe)}
              className={`iv-seg-btn h-6 whitespace-nowrap text-[10px] ${pipelineFilter === pipe ? "active" : ""}`}
            >
              {pipe}
            </button>
          ))}
        </div>
      </div>

      {/* Event Stream */}
      <div className="iv-scroll flex-1 space-y-1.5 overflow-y-auto pr-0.5">
        {filteredEvents.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center p-3 text-center text-iv-dim">
            <Clock strokeWidth={SW} className="mb-1.5 h-5 w-5" />
            <p className="text-[11px]">No timeline events match the filter.</p>
          </div>
        ) : (
          filteredEvents.map((ev, idx) => (
            <div
              key={ev._id || idx}
              onClick={() => onSelectEvent && onSelectEvent(ev)}
              className="group flex cursor-pointer items-start gap-2 rounded-md border border-transparent bg-iv-surface-alt p-2 transition hover:border-iv-accent hover:bg-iv-elevated"
            >
              <span className="mt-0.5 rounded bg-iv-bg px-1 py-0.5 font-num text-[9px] text-iv-dim">
                {formatOffset(ev.offsetMs)}
              </span>

              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between">
                  <div className="text-[10px] font-semibold">{getPipelineBadge(ev.pipeline)}</div>
                  <span className="truncate text-[9px] font-medium text-iv-dim">{formatEventTitle(ev)}</span>
                </div>

                <p className="mt-0.5 line-clamp-2 text-[11px] leading-snug text-iv-muted">
                  {ev.payload?.text ||
                    (ev.payload?.stage ? `Stage changed to ${ev.payload.stage.replace("_", " ")}` : null) ||
                    (ev.payload?.exitCode !== undefined
                      ? `Execution Exit ${ev.payload.exitCode} (${ev.payload.durationMs || 0}ms)`
                      : null) ||
                    ev.eventType}
                </p>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
