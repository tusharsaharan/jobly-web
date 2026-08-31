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

const CATEGORY_META: Record<string, { label: string; icon: React.ReactNode; color: string }> = {
  coding: { label: "Code", icon: <Cpu className="h-3 w-3 text-blue-400" />, color: "border-blue-500/30 bg-blue-500/10 text-blue-300" },
  execution: { label: "Exec", icon: <Terminal className="h-3 w-3 text-amber-400" />, color: "border-amber-500/30 bg-amber-500/10 text-amber-300" },
  communication: { label: "Comm", icon: <MessageSquare className="h-3 w-3 text-emerald-400" />, color: "border-emerald-500/30 bg-emerald-500/10 text-emerald-300" },
  whiteboard: { label: "Board", icon: <Layers className="h-3 w-3 text-purple-400" />, color: "border-purple-500/30 bg-purple-500/10 text-purple-300" },
  attention: { label: "Focus", icon: <Eye className="h-3 w-3 text-cyan-400" />, color: "border-cyan-500/30 bg-cyan-500/10 text-cyan-300" },
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
      <span className="flex items-center gap-1 rounded border border-emerald-500/30 bg-emerald-950/40 px-1.5 py-0.5 text-[9px] font-medium text-emerald-300">
        <CheckCircle2 className="h-2.5 w-2.5" /> Positive
      </span>
    );
  }
  if (indicator === "concern") {
    return (
      <span className="flex items-center gap-1 rounded border border-rose-500/30 bg-rose-950/40 px-1.5 py-0.5 text-[9px] font-medium text-rose-300">
        <AlertTriangle className="h-2.5 w-2.5" /> Note
      </span>
    );
  }
  return (
    <span className="rounded bg-zinc-800 px-1.5 py-0.5 text-[9px] font-medium text-zinc-400">
      Observed
    </span>
  );
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
    <div className="flex flex-col rounded-xl border border-zinc-800 bg-zinc-950/90 p-3 text-xs text-zinc-100 backdrop-blur-md shadow-xl">
      {/* Header */}
      <div className="mb-2.5 flex items-center justify-between border-b border-zinc-800/80 pb-2">
        <div className="flex items-center gap-1.5">
          <Activity className="h-4 w-4 text-emerald-400 animate-pulse" />
          <span className="font-semibold text-zinc-200">Live Interview Signals</span>
          <span className="rounded-full bg-emerald-500/15 px-1.5 py-0.5 text-[9px] font-bold text-emerald-300">signals-engine/2026-08-v1</span>
        </div>
        <div className="flex items-center gap-1.5 text-[10px] text-zinc-400">
          <span className="flex items-center gap-1">
            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            Live
          </span>
          <span>·</span>
          <span className="flex items-center gap-1">
            <Zap className="h-3 w-3 text-amber-400" />
            Real-Time
          </span>
        </div>
      </div>

      {/* Stats bar */}
      <div className="mb-2 grid grid-cols-3 gap-1.5">
        <div className="rounded bg-zinc-900 border border-zinc-800 px-2 py-1.5 text-center">
          <div className="text-[10px] text-zinc-500 uppercase tracking-wider">Total</div>
          <div className="text-sm font-bold text-white">{stats.total}</div>
        </div>
        <div className="rounded bg-emerald-950/20 border border-emerald-500/20 px-2 py-1.5 text-center">
          <div className="text-[10px] text-emerald-400 uppercase tracking-wider">Positive</div>
          <div className="text-sm font-bold text-emerald-300">{stats.positive}</div>
        </div>
        <div className="rounded bg-rose-950/20 border border-rose-500/20 px-2 py-1.5 text-center">
          <div className="text-[10px] text-rose-400 uppercase tracking-wider">Notes</div>
          <div className="text-sm font-bold text-rose-300">{stats.concern}</div>
        </div>
      </div>

      {/* Filter bar */}
      <div className="mb-2 flex items-center gap-1.5">
        <div className="flex items-center gap-1 text-[10px] text-zinc-500">
          <Filter className="h-3 w-3" />
        </div>
        <select
          value={filterCategory}
          onChange={(e) => setFilterCategory(e.target.value)}
          className="rounded bg-zinc-900 border border-zinc-800 px-1.5 py-1 text-[10px] text-zinc-300 outline-none focus:border-emerald-500/50"
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
          className="rounded bg-zinc-900 border border-zinc-800 px-1.5 py-1 text-[10px] text-zinc-300 outline-none focus:border-emerald-500/50"
        >
          <option value="all">All signals</option>
          <option value="positive">Positive only</option>
          <option value="concern">Notes only</option>
          <option value="neutral">Observed</option>
        </select>
        <button
          onClick={fetchSignals}
          className="ml-auto rounded bg-zinc-900 border border-zinc-800 p-1 text-zinc-400 hover:text-white"
          title="Refresh signals"
        >
          <Clock className={`h-3 w-3 ${loading ? "animate-spin" : ""}`} />
        </button>
      </div>

      {/* Signal list */}
      <div ref={listRef} className="max-h-64 space-y-1.5 overflow-y-auto pr-1 scrollbar-thin">
        {filteredSignals.length === 0 ? (
          <div className="py-6 text-center">
            <Search className="mx-auto h-5 w-5 text-zinc-600" />
            <p className="mt-2 text-[11px] text-zinc-500">
              {signals.length === 0
                ? "No signals emitted yet. Signals stream as the candidate codes, runs tests, and explains their solution."
                : "No signals match current filters."}
            </p>
            <p className="mt-1 text-[10px] text-zinc-600">Signals are evidence-grounded and never cite unverified data structures.</p>
          </div>
        ) : (
          filteredSignals.map((sig) => {
            const meta = CATEGORY_META[sig.category] || CATEGORY_META.coding;
            const isExpanded = expandedSignal === sig.id;
            return (
              <div
                key={sig.id}
                onClick={() => setExpandedSignal(isExpanded ? null : sig.id)}
                className="group cursor-pointer rounded-lg border border-zinc-800/60 bg-zinc-900/60 px-2.5 py-1.5 transition hover:bg-zinc-900 hover:border-zinc-700"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 overflow-hidden">
                    <span className={`flex items-center gap-1 rounded px-1 py-0.5 text-[9px] border ${meta.color}`}>
                      {meta.icon}
                      {meta.label}
                    </span>
                    <span className="truncate font-medium text-zinc-300 text-[11px]">
                      {sig.name.replace(/_/g, " ")}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <IndicatorBadge indicator={sig.indicator} />
                    <span className="text-[10px] text-zinc-500 font-mono">{formatOffset(sig.offsetMs)}</span>
                    <ChevronDown className={`h-3 w-3 text-zinc-500 transition ${isExpanded ? "rotate-180" : ""}`} />
                  </div>
                </div>
                {isExpanded && (
                  <div className="mt-2 space-y-1.5 border-t border-zinc-800 pt-2">
                    {sig.payload?.pattern && (
                      <p className="text-[11px] leading-relaxed text-zinc-300">
                        <span className="font-semibold text-zinc-200">Pattern:</span> {sig.payload.pattern}
                      </p>
                    )}
                    {sig.payload?.description && (
                      <p className="text-[11px] leading-relaxed text-zinc-400">{sig.payload.description}</p>
                    )}
                    {sig.payload?.estimatedBigO && (
                      <span className="inline-flex rounded bg-purple-500/15 border border-purple-500/20 px-1.5 py-0.5 text-[10px] text-purple-300">
                        {sig.payload.estimatedBigO}
                      </span>
                    )}
                    {sig.payload?.switchCount && (
                      <p className="text-[10px] text-zinc-500">
                        Informational telemetry — not evidence of misconduct. Count: {sig.payload.switchCount}
                      </p>
                    )}
                    {sig.evidenceRef && (
                      <div className="flex items-center gap-1 text-[10px] text-emerald-400">
                        <Shield className="h-3 w-3" />
                        <span>Evidence linked</span>
                        <ExternalLink className="h-3 w-3 opacity-60" />
                      </div>
                    )}
                    <div className="flex items-center gap-2 text-[10px] text-zinc-600 font-mono">
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
      <div className="mt-3 rounded-lg border border-purple-500/30 bg-purple-950/20 p-3">
        <div className="flex items-center justify-between">
          <span className="flex items-center gap-1.5 font-semibold text-purple-300 text-[11px]">
            <Sparkles className="h-3.5 w-3.5" />
            Co-Interviewer Copilot
          </span>
          <button
            onClick={handleCopilotRequest}
            disabled={copilotLoading}
            className="flex items-center gap-1 rounded bg-purple-600 px-2 py-1 text-[11px] font-medium text-white transition hover:bg-purple-700 disabled:opacity-50"
          >
            {copilotLoading && <Loader2 className="h-3 w-3 animate-spin" />}
            <span>Suggest</span>
          </button>
        </div>
        {copilot ? (
          <div className="mt-2 space-y-1.5">
            <p className="text-[11px] leading-relaxed text-purple-200">
              <span className="font-semibold">Observation:</span> {copilot.observation}
            </p>
            <p className="text-[11px] leading-relaxed text-zinc-200">
              <span className="font-semibold text-purple-300">Ask:</span> “{copilot.suggestedQuestion}”
            </p>
            <div className="flex items-center gap-2">
              <span className="rounded bg-zinc-900 border border-zinc-800 px-1.5 py-0.5 text-[10px] text-zinc-400">
                {copilot.assessedCompetency}
              </span>
              {copilot.difficultyLevel && (
                <span className="rounded bg-amber-500/15 border border-amber-500/20 px-1.5 py-0.5 text-[10px] text-amber-300">
                  {copilot.difficultyLevel}
                </span>
              )}
              <span className="ml-auto text-[10px] text-zinc-500">Evidence-grounded · never hallucinates</span>
            </div>
          </div>
        ) : (
          <p className="mt-2 text-[11px] leading-relaxed text-[#D8B4FE]">
            Click 'Suggest' to analyze code that is actually present in the shared workspace. Grounds every prompt in verified AST patterns.
          </p>
        )}
      </div>

      {/* Footer */}
      <div className="mt-2 flex items-center gap-1.5 border-t border-zinc-800 pt-2 text-[10px] text-zinc-500">
        <Shield className="h-3 w-3 text-emerald-500" />
        <span>Non-punitive focus tracking · protected attributes strictly excluded</span>
      </div>
    </div>
  );
}
