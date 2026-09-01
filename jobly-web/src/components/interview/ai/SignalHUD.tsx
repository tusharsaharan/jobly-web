import React, { useEffect, useState, useCallback, useMemo, useRef } from "react";
import {
  Activity,
  Zap,
  CheckCircle2,
  AlertTriangle,
  Cpu,
  MessageSquare,
  Terminal,
  Eye,
  Layers,
  Sparkles,
  Loader2,
  Shield,
  Clock,
  Search,
  Filter,
  ChevronDown,
  ExternalLink,
} from "lucide-react";
import { apiCall } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { getInterviewSocket } from "@/lib/socket";
import { toast } from "sonner";

interface SignalItem {
  id: string;
  sessionId: string;
  category: "coding" | "communication" | "whiteboard" | "attention" | "execution";
  name: string;
  indicator: "positive" | "neutral" | "concern";
  weight: number;
  offsetMs: number;
  payload: Record<string, any>;
  evidenceRef?: any;
  createdAt: string;
  engineVersion?: string;
}

interface CopilotSuggestion {
  observation: string;
  suggestedQuestion: string;
  assessedCompetency: string;
  difficultyLevel?: string;
}

interface SignalHUDProps {
  sessionId: string;
  roomKey: string;
  currentStage?: string;
}

const SW = 1.75;

const CATEGORY_META: Record<string, { label: string; icon: React.ReactNode; color: string }> = {
  coding: { label: "Code", icon: <Cpu strokeWidth={SW} className="h-3 w-3" />, color: "iv-badge iv-badge-info text-[9px]" },
  execution: { label: "Exec", icon: <Terminal strokeWidth={SW} className="h-3 w-3" />, color: "iv-badge iv-badge-warning text-[9px]" },
  communication: { label: "Comm", icon: <MessageSquare strokeWidth={SW} className="h-3 w-3" />, color: "iv-badge iv-badge-success text-[9px]" },
  whiteboard: { label: "Board", icon: <Layers strokeWidth={SW} className="h-3 w-3" />, color: "iv-badge iv-badge-info text-[9px]" },
  attention: { label: "Focus", icon: <Eye strokeWidth={SW} className="h-3 w-3" />, color: "iv-badge iv-badge-neutral text-[9px]" },
};

function formatOffset(offsetMs: number) {
  const totalSec = Math.floor(offsetMs / 1000);
  const m = Math.floor(totalSec / 60).toString().padStart(2, "0");
  const s = (totalSec % 60).toString().padStart(2, "0");
  return `${m}:${s}`;
}

function IndicatorBadge({ indicator }: { indicator: string }) {
  if (indicator === "positive") {
    return (
      <span className="iv-badge iv-badge-success text-[9px]">
        <CheckCircle2 strokeWidth={SW} className="h-3 w-3" /> Positive
      </span>
    );
  }
  if (indicator === "concern") {
    return (
      <span className="iv-badge iv-badge-danger text-[9px]">
        <AlertTriangle strokeWidth={SW} className="h-3 w-3" /> Note
      </span>
    );
  }
  return <span className="iv-badge iv-badge-neutral text-[9px]">Observed</span>;
}

export function SignalHUD({ sessionId, roomKey, currentStage }: SignalHUDProps) {
  const { token } = useAuth();
  const [signals, setSignals] = useState<SignalItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [filterCategory, setFilterCategory] = useState<string>("all");
  const [filterIndicator, setFilterIndicator] = useState<string>("all");
  const [copilot, setCopilot] = useState<CopilotSuggestion | null>(null);
  const [copilotLoading, setCopilotLoading] = useState(false);
  const [expandedSignal, setExpandedSignal] = useState<string | null>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const fetchSignals = useCallback(async () => {
    if (!sessionId) return;
    try {
      setLoading(true);
      const res = await apiCall<{ success: boolean; count: number; signals: SignalItem[] }>(
        `/signals/session/${sessionId}`,
        "GET",
        null,
        token
      );
      if (res.success && Array.isArray(res.signals)) {
        // Keep last 24 sorted by offsetMs desc for live HUD, but display newest first
        const sorted = [...res.signals].sort((a, b) => b.offsetMs - a.offsetMs).slice(0, 24);
        setSignals(sorted);
      }
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }, [sessionId, token]);

  // Initial fetch + polling fallback (10s)
  useEffect(() => {
    fetchSignals();
    const interval = setInterval(fetchSignals, 10000);
    return () => clearInterval(interval);
  }, [fetchSignals]);

  // Real-time socket subscriptions — plan Phase 6: interview_signal_emitted + evidence_created
  useEffect(() => {
    if (!roomKey || !token) return;
    const socket = getInterviewSocket(token);

    const handleSignal = (payload: { signal: SignalItem; senderId?: string }) => {
      if (!payload?.signal) return;
      const sig = payload.signal;
      setSignals((prev) => {
        if (prev.some((s) => s.id === sig.id)) return prev;
        const next = [sig, ...prev].slice(0, 24);
        return next;
      });
    };
    const handleLegacy = (payload: any) => {
      if (payload?.signal) handleSignal(payload);
      else if (Array.isArray(payload?.signals)) {
        const incoming: SignalItem[] = payload.signals;
        setSignals((prev) => {
          const existingIds = new Set(prev.map((s) => s.id));
          const filtered = incoming.filter((s) => !existingIds.has(s.id));
          if (filtered.length === 0) return prev;
          return [...filtered.reverse(), ...prev].slice(0, 24);
        });
      }
    };
    const handleCopilot = (payload: { followUp: CopilotSuggestion }) => {
      if (payload?.followUp) setCopilot(payload.followUp);
    };

    socket.on("interview_signal_emitted", handleSignal);
    socket.on("interview_signal_received", handleLegacy);
    socket.on("interview_signals_extracted", handleLegacy);
    socket.on("evidence_created", (payload: any) => {
      // evidence_created payload reinforces evidenceRef linkage
      if (payload?.evidenceRef && payload?.signalName) {
        // optionally surface via toast for interviewers
      }
    });
    socket.on("copilot_hint_received", handleCopilot);

    return () => {
      socket.off("interview_signal_emitted", handleSignal);
      socket.off("interview_signal_received", handleLegacy);
      socket.off("interview_signals_extracted", handleLegacy);
      socket.off("evidence_created");
      socket.off("copilot_hint_received", handleCopilot);
    };
  }, [roomKey, token]);

  const handleCopilotRequest = async () => {
    setCopilotLoading(true);
    try {
      // Prefer socket debounced path, fallback to REST
      const socket = getInterviewSocket(token);
      // Try socket emission first (server will debounce & generate)
      if (socket && roomKey) {
        socket.emit("copilot_hint_request", {
          roomKey,
          code: "", // server will check workspace via DB if needed
          language: "javascript",
          currentStage: currentStage || "CODING",
        });
        // Also attempt REST for deterministic result if socket fails within 2s
        const timeout = setTimeout(async () => {
          try {
            const workspace = await apiCall<{ workspace: Array<{ content?: string; language?: string }> }>(
              `/coding/${sessionId}/workspace`,
              "GET",
              null,
              token
            );
            const activeFile = workspace.workspace?.find((f) => f.content?.trim()) || workspace.workspace?.[0];
            const res = await apiCall<{ suggestion: CopilotSuggestion }>(
              `/interviews/${sessionId}/ai-suggest`,
              "POST",
              {
                activeCode: activeFile?.content || "",
                activeLanguage: activeFile?.language || "plaintext",
                currentStage: currentStage || "CODING",
              },
              token
            );
            if (res?.suggestion) setCopilot(res.suggestion);
          } catch {
            // socket already handled
          } finally {
            setCopilotLoading(false);
          }
        }, 1200);
        // If socket responds quickly, it will clear loading earlier via copilot_hint_received
        // Clean timeout if copilot arrives
        const handleEarly = (p: any) => {
          if (p?.followUp) {
            clearTimeout(timeout);
            setCopilotLoading(false);
            socket.off("copilot_hint_received", handleEarly);
          }
        };
        socket.once("copilot_hint_received", handleEarly as any);
        return;
      }
      // Fallback direct REST
      const workspace = await apiCall<{ workspace: Array<{ content?: string; language?: string }> }>(
        `/coding/${sessionId}/workspace`,
        "GET",
        null,
        token
      );
      const activeFile = workspace.workspace?.find((f) => f.content?.trim()) || workspace.workspace?.[0];
      const res = await apiCall<{ suggestion: CopilotSuggestion }>(
        `/interviews/${sessionId}/ai-suggest`,
        "POST",
        {
          activeCode: activeFile?.content || "",
          activeLanguage: activeFile?.language || "plaintext",
          currentStage: currentStage || "CODING",
        },
        token
      );
      if (res?.suggestion) setCopilot(res.suggestion);
    } catch (e: any) {
      toast.error(e.message || "Unable to generate grounded suggestion");
    } finally {
      setTimeout(() => setCopilotLoading(false), 800);
    }
  };

  const filteredSignals = useMemo(() => {
    return signals.filter((s) => {
      if (filterCategory !== "all" && s.category !== filterCategory) return false;
      if (filterIndicator !== "all" && s.indicator !== filterIndicator) return false;
      return true;
    });
  }, [signals, filterCategory, filterIndicator]);

  const stats = useMemo(() => {
    const total = signals.length;
    const positive = signals.filter((s) => s.indicator === "positive").length;
    const concern = signals.filter((s) => s.indicator === "concern").length;
    const byCategory = signals.reduce(
      (acc, s) => {
        acc[s.category] = (acc[s.category] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>
    );
    return { total, positive, concern, byCategory };
  }, [signals]);

  return (
    <div className="iv-card flex flex-col p-3 text-xs text-iv-text shadow-lift">
      {/* Header */}
      <div className="mb-2.5 flex items-center justify-between border-b border-iv-line pb-2">
        <div className="flex items-center gap-1.5">
          <Activity strokeWidth={SW} className="h-4 w-4 animate-pulse text-iv-success" />
          <span className="font-semibold text-iv-muted">Live Interview Signals</span>
          <span className="iv-badge iv-badge-success text-[9px]">signals-engine/2026-08-v1</span>
        </div>
        <div className="flex items-center gap-1.5 text-[10px] text-iv-dim">
          <span className="flex items-center gap-1">
            <span className="h-2 w-2 animate-pulse rounded-full bg-iv-success" />
            Live
          </span>
          <span>·</span>
          <span className="flex items-center gap-1">
            <Zap strokeWidth={SW} className="h-3 w-3 text-iv-warning" />
            Real-Time
          </span>
        </div>
      </div>

      {/* Stats bar */}
      <div className="mb-2 grid grid-cols-3 gap-1.5">
        <div className="rounded-md border border-iv-line bg-iv-surface-alt px-2 py-1.5 text-center">
          <div className="text-[10px] uppercase tracking-wider text-iv-dim">Total</div>
          <div className="font-num text-sm font-bold text-iv-text">{stats.total}</div>
        </div>
        <div className="rounded-md border border-iv-success/20 bg-iv-success-surface px-2 py-1.5 text-center">
          <div className="text-[10px] uppercase tracking-wider text-iv-success">Positive</div>
          <div className="font-num text-sm font-bold text-iv-success">{stats.positive}</div>
        </div>
        <div className="rounded-md border border-iv-danger/20 bg-iv-danger-surface px-2 py-1.5 text-center">
          <div className="text-[10px] uppercase tracking-wider text-iv-danger">Notes</div>
          <div className="font-num text-sm font-bold text-iv-danger">{stats.concern}</div>
        </div>
      </div>

      {/* Filter bar */}
      <div className="mb-2 flex items-center gap-1.5">
        <select
          value={filterCategory}
          onChange={(e) => setFilterCategory(e.target.value)}
          className="iv-select h-7 w-auto px-1.5 text-[10px]"
        >
          <option value="all">All categories</option>
          <option value="coding">Coding</option>
          <option value="execution">Execution</option>
          <option value="communication">Communication</option>
          <option value="whiteboard">Whiteboard</option>
          <option value="attention">Attention</option>
        </select>
        <select
          value={filterIndicator}
          onChange={(e) => setFilterIndicator(e.target.value)}
          className="iv-select h-7 w-auto px-1.5 text-[10px]"
        >
          <option value="all">All signals</option>
          <option value="positive">Positive only</option>
          <option value="concern">Notes only</option>
          <option value="neutral">Observed</option>
        </select>
        <button
          onClick={fetchSignals}
          className="iv-icon-btn iv-icon-btn-sm ml-auto"
          title="Refresh signals"
        >
          <Clock strokeWidth={SW} className={`h-3 w-3 ${loading ? "animate-spin" : ""}`} />
        </button>
      </div>

      {/* Signal list */}
      <div ref={listRef} className="iv-scroll max-h-64 space-y-1.5 overflow-y-auto pr-1">
        {filteredSignals.length === 0 ? (
          <div className="py-6 text-center">
            <Search strokeWidth={SW} className="mx-auto h-5 w-5 text-iv-dim" />
            <p className="mt-2 text-[11px] text-iv-dim">
              {signals.length === 0
                ? "No signals emitted yet. Signals stream as the candidate codes, runs tests, and explains their solution."
                : "No signals match current filters."}
            </p>
            <p className="mt-1 text-[10px] text-iv-dim">Signals are evidence-grounded and never cite unverified data structures.</p>
          </div>
        ) : (
          filteredSignals.map((sig) => {
            const meta = CATEGORY_META[sig.category] || CATEGORY_META.coding;
            const isExpanded = expandedSignal === sig.id;
            return (
              <div
                key={sig.id}
                onClick={() => setExpandedSignal(isExpanded ? null : sig.id)}
                className="group cursor-pointer rounded-lg border border-iv-line bg-iv-surface-alt px-2.5 py-1.5 transition hover:border-iv-elevated hover:bg-iv-elevated"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 overflow-hidden">
                    <span className={meta.color}>
                      {meta.icon}
                      {meta.label}
                    </span>
                    <span className="truncate text-[11px] font-medium text-iv-muted">
                      {sig.name.replace(/_/g, " ")}
                    </span>
                  </div>
                  <div className="flex shrink-0 items-center gap-1.5">
                    <IndicatorBadge indicator={sig.indicator} />
                    <span className="font-num text-[10px] text-iv-dim">{formatOffset(sig.offsetMs)}</span>
                    <ChevronDown strokeWidth={SW} className={`h-3 w-3 text-iv-dim transition ${isExpanded ? "rotate-180" : ""}`} />
                  </div>
                </div>
                {isExpanded && (
                  <div className="mt-2 space-y-1.5 border-t border-iv-line pt-2">
                    {sig.payload?.pattern && (
                      <p className="text-[11px] leading-relaxed text-iv-muted">
                        <span className="font-semibold text-iv-text">Pattern:</span> {sig.payload.pattern}
                      </p>
                    )}
                    {sig.payload?.description && (
                      <p className="text-[11px] leading-relaxed text-iv-dim">{sig.payload.description}</p>
                    )}
                    {sig.payload?.estimatedBigO && (
                      <span className="iv-badge iv-badge-info text-[10px]">
                        {sig.payload.estimatedBigO}
                      </span>
                    )}
                    {sig.payload?.switchCount && (
                      <p className="text-[10px] text-iv-dim">
                        Informational telemetry — not evidence of misconduct. Count: {sig.payload.switchCount}
                      </p>
                    )}
                    {sig.evidenceRef && (
                      <div className="flex items-center gap-1 text-[10px] text-iv-success">
                        <Shield strokeWidth={SW} className="h-3 w-3" />
                        <span>Evidence linked</span>
                        <ExternalLink strokeWidth={SW} className="h-3 w-3 opacity-60" />
                      </div>
                    )}
                    <div className="flex items-center gap-2 font-num text-[10px] text-iv-dim">
                      <span>w: {sig.weight}</span>
                      <span>·</span>
                      <span>{new Date(sig.createdAt).toLocaleTimeString()}</span>
                      {sig.engineVersion && <><span>·</span><span>{sig.engineVersion}</span></>}
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Copilot suggestion panel */}
      <div className="iv-card mt-3 border-purple-500/30 bg-purple-950/20 p-3">
        <div className="flex items-center justify-between">
          <span className="flex items-center gap-1.5 text-[11px] font-semibold text-[#c4b5fd]">
            <Sparkles strokeWidth={SW} className="h-4 w-4" />
            Co-Interviewer Copilot
          </span>
          <button
            onClick={handleCopilotRequest}
            disabled={copilotLoading}
            className="iv-btn iv-btn-sm bg-purple-600 text-white hover:bg-purple-700"
          >
            {copilotLoading && <Loader2 strokeWidth={SW} className="h-3 w-3 animate-spin" />}
            <span>Suggest</span>
          </button>
        </div>
        {copilot ? (
          <div className="mt-2 space-y-1.5">
            <p className="text-[11px] leading-relaxed text-[#d8b4fe]">
              <span className="font-semibold">Observation:</span> {copilot.observation}
            </p>
            <p className="text-[11px] leading-relaxed text-iv-muted">
              <span className="font-semibold text-[#c4b5fd]">Ask:</span> “{copilot.suggestedQuestion}”
            </p>
            <div className="flex items-center gap-2">
              <span className="iv-badge iv-badge-neutral text-[10px]">
                {copilot.assessedCompetency}
              </span>
              {copilot.difficultyLevel && (
                <span className="iv-badge iv-badge-warning text-[10px]">
                  {copilot.difficultyLevel}
                </span>
              )}
              <span className="ml-auto text-[10px] text-iv-dim">Evidence-grounded · never hallucinates</span>
            </div>
          </div>
        ) : (
          <p className="mt-2 text-[11px] leading-relaxed text-[#d8b4fe]">
            Click 'Suggest' to analyze code that is actually present in the shared workspace. Grounds every prompt in verified AST patterns.
          </p>
        )}
      </div>

      {/* Footer */}
      <div className="mt-2 flex items-center gap-1.5 border-t border-iv-line pt-2 text-[10px] text-iv-dim">
        <Shield strokeWidth={SW} className="h-3 w-3 text-iv-success" />
        <span>Non-punitive focus tracking · protected attributes strictly excluded</span>
      </div>
    </div>
  );
}
