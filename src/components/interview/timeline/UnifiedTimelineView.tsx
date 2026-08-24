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
        return <span className="flex items-center gap-1 text-emerald-400"><Code2 className="h-3 w-3" /> IDE</span>;
      case "WHITEBOARD":
        return <span className="flex items-center gap-1 text-cyan-400"><Layers className="h-3 w-3" /> Board</span>;
      case "COMMUNICATION":
        return <span className="flex items-center gap-1 text-blue-400"><MessageSquare className="h-3 w-3" /> Speech</span>;
      case "STAGE":
        return <span className="flex items-center gap-1 text-amber-400"><UserCheck className="h-3 w-3" /> Stage</span>;
      case "AI":
        return <span className="flex items-center gap-1 text-purple-400"><Sparkles className="h-3 w-3" /> AI</span>;
      case "INTEGRITY":
        return <span className="flex items-center gap-1 text-rose-400"><ShieldAlert className="h-3 w-3" /> Signal</span>;
      default:
        return <span className="flex items-center gap-1 text-gray-400"><Clock className="h-3 w-3" /> Event</span>;
    }
  };

  const formatEventTitle = (ev: TimelineItem) => {
    if (ev.eventType === "code.execution") {
      return `Code Run (${ev.payload?.language || "Solution"})`;
    }
    if (ev.eventType === "whiteboard.snapshot") {
      return "Whiteboard Snapshot";
    }
    if (ev.eventType === "stage.transition" || ev.eventType === "stage_change") {
      return `Stage: ${(ev.payload?.stage || "").replace("_", " ")}`;
    }
    if (ev.eventType === "transcript.segment") {
      return "Transcript";
    }
    if (ev.eventType === "checkpoint.saved") {
      return "Workspace Checkpoint";
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
    <div className="flex h-full flex-col overflow-hidden rounded-xl border border-[#2A2A2A] bg-[#161616] p-2.5 text-xs text-white shadow-xl select-none">
      {/* Header */}
      <div className="mb-2 flex items-center justify-between border-b border-[#2A2A2A] pb-2 font-semibold text-[#CCCCCC]">
        <div className="flex items-center gap-1.5">
          <Clock className="h-4 w-4 text-[#2A9D7B]" />
          <span>Unified Timeline</span>
        </div>
        <span className="rounded bg-[#252526] px-2 py-0.5 text-[10px] text-[#888888]">
          {filteredEvents.length} / {meaningfulEvents.length} Events
        </span>
      </div>

      {/* Filter and Search Bar */}
      <div className="mb-2 flex flex-col gap-1.5">
        <div className="flex items-center rounded border border-[#333333] bg-[#0E0E0E] px-2 py-1">
          <Search className="h-3 w-3 text-[#777777] mr-1.5" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search transcript, code, stage..."
            className="w-full bg-transparent text-[11px] text-white outline-none placeholder:text-[#555555]"
          />
        </div>

        <div className="flex items-center gap-1 overflow-x-auto pb-0.5 scrollbar-none text-[10px]">
          {["ALL", "CODING", "WHITEBOARD", "COMMUNICATION", "STAGE", "AI"].map((pipe) => (
            <button
              key={pipe}
              onClick={() => setPipelineFilter(pipe)}
              className={`rounded px-1.5 py-0.5 whitespace-nowrap transition ${
                pipelineFilter === pipe
                  ? "bg-[#2A9D7B] text-white font-semibold"
                  : "bg-[#222222] text-[#888888] hover:text-white"
              }`}
            >
              {pipe}
            </button>
          ))}
        </div>
      </div>

      {/* Event Stream */}
      <div className="flex-1 space-y-1.5 overflow-y-auto pr-0.5">
        {filteredEvents.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center text-[#666666] text-center p-3">
            <Clock className="mb-1.5 h-5 w-5" />
            <p className="text-[11px]">No timeline events match the filter.</p>
          </div>
        ) : (
          filteredEvents.map((ev, idx) => (
            <div
              key={ev._id || idx}
              onClick={() => onSelectEvent && onSelectEvent(ev)}
              className="group flex cursor-pointer items-start gap-2 rounded border border-transparent bg-[#1F1F1F] p-2 transition hover:border-[#2A9D7B] hover:bg-[#262626]"
            >
              <span className="mt-0.5 rounded bg-[#111111] px-1 py-0.5 font-mono text-[9px] text-[#888888]">
                {formatOffset(ev.offsetMs)}
              </span>

              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <div className="text-[10px] font-semibold">{getPipelineBadge(ev.pipeline)}</div>
                  <span className="text-[9px] text-[#888888] font-medium truncate">{formatEventTitle(ev)}</span>
                </div>

                <p className="mt-0.5 text-[11px] text-[#D0D0D0] leading-snug line-clamp-2">
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
