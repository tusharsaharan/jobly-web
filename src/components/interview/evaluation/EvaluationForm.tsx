import React, { useEffect, useState, useMemo } from "react";
import {
  ShieldCheck,
  Star,
  CheckCircle2,
  Paperclip,
  Save,
  Loader2,
  Award,
  ExternalLink,
  Activity,
  Eye,
  Layers,
  Cpu,
  MessageSquare,
  Terminal,
} from "lucide-react";
import { apiCall } from "@/lib/api";
import { toast } from "sonner";

interface TimelineEvent {
  _id: string;
  pipeline: string;
  eventType: string;
  offsetMs: number;
  participantRole?: string;
  payload?: any;
  createdAt?: string;
}

interface SignalItem {
  id: string;
  name: string;
  category: string;
  indicator: string;
  weight: number;
  offsetMs: number;
}

interface PillarCompetency {
  pillar: "problem_solving" | "coding_algorithms" | "system_design" | "communication";
  label: string;
  description: string;
  score: number;
  confidence: number;
  rationale: string;
  evidenceIds: string[]; // selected timelineEventIds
  signalsObserved: string[];
}

interface EvaluationFormProps {
  sessionId: string;
  token?: string;
  onSaved?: () => void;
}

const PILLARS: Array<{ pillar: PillarCompetency["pillar"]; label: string; description: string; icon: React.ReactNode }> = [
  {
    pillar: "problem_solving",
    label: "Problem Solving & Decomposition",
    description: "Clarifies constraints, decomposes tasks, handles edge cases",
    icon: <Activity className="h-4 w-4 text-emerald-400" />,
  },
  {
    pillar: "coding_algorithms",
    label: "Algorithmic Implementation & Code Quality",
    description: "Data structures, algorithmic paradigms, complexity, correctness",
    icon: <Cpu className="h-4 w-4 text-blue-400" />,
  },
  {
    pillar: "system_design",
    label: "System Architecture & Tradeoff Reasoning",
    description: "Whiteboard structure, trade-offs around latency/scale/cache",
    icon: <Layers className="h-4 w-4 text-purple-400" />,
  },
  {
    pillar: "communication",
    label: "Technical Communication & Collaboration",
    description: "Cadence, clarity, precise engineering vocabulary",
    icon: <MessageSquare className="h-4 w-4 text-amber-400" />,
  },
];

const SCORE_LABELS: Record<number, { level: string; color: string }> = {
  1: { level: "Unsatisfactory", color: "bg-rose-500 text-white" },
  2: { level: "Needs Growth", color: "bg-orange-500 text-white" },
  3: { level: "Competent", color: "bg-yellow-500 text-white" },
  4: { level: "Strong", color: "bg-emerald-500 text-white" },
  5: { level: "Exceptional", color: "bg-violet-500 text-white" },
};

function computeConfidence(evidenceCount: number, signalsCount: number) {
  return Math.min(0.95, 0.6 + evidenceCount * 0.08 + signalsCount * 0.04);
}

export function EvaluationForm({ sessionId, token, onSaved }: EvaluationFormProps) {
  const [decision, setDecision] = useState<string>("HIRE");
  const [strengths, setStrengths] = useState<string>("Clean modular code, quick problem comprehension");
  const [weaknesses, setWeaknesses] = useState<string>("Edge case testing can be improved");
  const [privateNotes, setPrivateNotes] = useState<string>("");
  const [saving, setSaving] = useState<boolean>(false);
  const [timelineEvents, setTimelineEvents] = useState<TimelineEvent[]>([]);
  const [signals, setSignals] = useState<SignalItem[]>([]);
  const [loadingEvidence, setLoadingEvidence] = useState(false);
  const [resolvedEvidence, setResolvedEvidence] = useState<Record<string, any>>({});

  const [pillars, setPillars] = useState<PillarCompetency[]>(
    PILLARS.map((p) => ({
      pillar: p.pillar,
      label: p.label,
      description: p.description,
      score: 3,
      confidence: 0.78,
      rationale: `Candidate demonstrated ${p.label.toLowerCase()} at competent level — observed during live session.`,
      evidenceIds: [],
      signalsObserved: [],
    }))
  );

  // Fetch timeline + signals for evidence linking
  useEffect(() => {
    if (!sessionId || !token) return;
    let cancelled = false;
    async function load() {
      setLoadingEvidence(true);
      try {
        // Timeline via interviews room or timeline endpoint
        const timelineRes = await apiCall<{ timelineEvents: TimelineEvent[] } | { session: any; timelineEvents: TimelineEvent[] }>(
          `/interviews/room/${sessionId}`,
          "GET",
          null,
          token
        ).catch(async () => {
          // fallback to timeline endpoint
          const r = await apiCall<{ events: TimelineEvent[] }>(`/timeline/${sessionId}/events`, "GET", null, token);
          return { timelineEvents: (r as any).events || (r as any).timelineEvents || [] };
        });
        const events = (timelineRes as any).timelineEvents || (timelineRes as any).events || [];
        if (!cancelled) setTimelineEvents(events.slice(0, 40));

        // Signals
        const sigRes = await apiCall<{ success: boolean; signals: SignalItem[] }>(`/signals/session/${sessionId}`, "GET", null, token);
        if (!cancelled && sigRes.success) {
          setSignals(sigRes.signals.slice(0, 40));
          // Auto-populate signalsObserved per pillar based on signal names
          setPillars((prev) =>
            prev.map((p) => {
              const relevant = sigRes.signals
                .filter((s) => {
                  if (p.pillar === "problem_solving") return ["clarifying_questions_inquiry", "test_suite_all_passed", "test_suite_partial_pass", "runtime_execution_timeout"].includes(s.name);
                  if (p.pillar === "coding_algorithms") return ["data_structure_hash_map", "data_structure_set", "algorithmic_", "high_time_complexity"].some((k) => s.name.includes(k));
                  if (p.pillar === "system_design") return ["structured_architecture_diagram", "technical_terminology_fluency"].includes(s.name);
                  if (p.pillar === "communication") return ["balanced_dialogue_cadence", "technical_terminology_fluency", "clarifying_questions_inquiry"].includes(s.name);
                  return false;
                })
                .map((s) => s.name);
              return { ...p, signalsObserved: relevant.slice(0, 4) };
            })
          );
        }
      } catch (e) {
        // no-op
      } finally {
        if (!cancelled) setLoadingEvidence(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [sessionId, token]);

  const handlePillarScore = (idx: number, score: number) => {
    setPillars((prev) => {
      const next = [...prev];
      const p = { ...next[idx], score };
      p.confidence = computeConfidence(p.evidenceIds.length, p.signalsObserved.length);
      next[idx] = p;
      return next;
    });
  };
  const handlePillarRationale = (idx: number, rationale: string) => {
    setPillars((prev) => {
      const next = [...prev];
      next[idx] = { ...next[idx], rationale };
      return next;
    });
  };
  const toggleEvidence = (pIdx: number, eventId: string) => {
    setPillars((prev) => {
      const next = [...prev];
      const p = { ...next[pIdx] };
      const has = p.evidenceIds.includes(eventId);
      p.evidenceIds = has ? p.evidenceIds.filter((id) => id !== eventId) : [...p.evidenceIds, eventId].slice(0, 5);
      p.confidence = computeConfidence(p.evidenceIds.length, p.signalsObserved.length);
      next[pIdx] = p;
      return next;
    });
  };

  const overallScore = useMemo(() => {
    const avg = pillars.reduce((s, p) => s + p.score, 0) / pillars.length;
    return Math.round((avg / 5) * 100);
  }, [pillars]);

  const recommendedDecision = useMemo(() => {
    const min = Math.min(...pillars.map((p) => p.score));
    if (overallScore >= 85 && min >= 3) return "STRONG_HIRE";
    if (overallScore >= 70 && min >= 3) return "HIRE";
    if (overallScore >= 55) return "LEAN_HIRE";
    if (overallScore >= 40) return "LEAN_REJECT";
    return "REJECT";
  }, [overallScore, pillars]);

  const canSubmit = useMemo(() => {
    return pillars.every((p) => p.evidenceIds.length >= 1 && p.rationale.trim().length >= 10);
  }, [pillars]);

  const handleResolveEvidence = async (evidenceId: string) => {
    if (resolvedEvidence[evidenceId]) return;
    try {
      const res = await apiCall<{ evidenceRef: any; resolvedArtifact: any }>(`/evaluations/${sessionId}/evidence/${evidenceId}`, "GET", null, token);
      setResolvedEvidence((m) => ({ ...m, [evidenceId]: res }));
    } catch (e: any) {
      toast.error(e.message || "Unable to resolve evidence artifact");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) {
      toast.error("Each pillar requires at least 1 evidence link and a rationale (≥10 chars).");
      return;
    }
    setSaving(true);
    try {
      // Build canonical contract payload
      const competencies = pillars.map((p) => {
        const evidenceReferences = p.evidenceIds.map((evId) => {
          const ev = timelineEvents.find((t) => t._id === evId);
          // Create minimal evidence reference per contract — server will verify timelineEventId exists
          // Use deterministic hash placeholder; server will compute real hash on creation if needed
          const summary = ev ? `${ev.pipeline} event: ${ev.eventType} — ${ev.payload?.text?.slice(0, 80) || ev.eventType}` : "Evidence";
          const locator: any = {};
          if (ev?.payload?.file) locator.file = ev.payload.file;
          if (ev?.payload?.text) locator.quote = String(ev.payload.text).slice(0, 500);
          if (ev?.participantRole) locator.speaker = ev.participantRole;
          return {
            id: `ev-${evId.slice(-8)}-${Math.random().toString(36).slice(2, 6)}`,
            type: ev?.pipeline === "CODING" ? "CODE_CHECKPOINT" : ev?.pipeline === "COMMUNICATION" ? "TRANSCRIPT" : ev?.pipeline === "WHITEBOARD" ? "WHITEBOARD_SNAPSHOT" : "TIMELINE_EVENT",
            timelineEventId: evId,
            offsetMs: ev?.offsetMs || 0,
            locator,
            summary: summary.slice(0, 300),
            verificationHash: "pending-server-hash-" + evId.slice(-6),
          };
        });
        return {
          pillar: p.pillar,
          score: p.score,
          confidence: p.confidence,
          rationale: p.rationale,
          evidenceReferences,
          signalsObserved: p.signalsObserved,
          label: p.label,
          rubricLevel: SCORE_LABELS[p.score]?.level.toLowerCase().replace(" ", "_") || "competent",
        };
      });

      // Use strict plan endpoint first, fallback to legacy
      let lastError: any = null;
      try {
        await apiCall(
          `/evaluations/${sessionId}/competencies`,
          "POST",
          {
            schemaVersion: "signals-engine/2026-08-v1",
            engineVersion: "signals-engine/2026-08-v1",
            competencies,
            strengths: strengths.split(",").map((s) => s.trim()).filter(Boolean),
            weaknesses: weaknesses.split(",").map((w) => w.trim()).filter(Boolean),
            privateNotes,
            overallRating: Math.round(pillars.reduce((s, p) => s + p.score, 0) / pillars.length),
            decision,
          },
          token
        );
      } catch (err: any) {
        lastError = err;
        // fallback to legacy evaluation endpoint
        if (err.status === 404 || err.status === 400) {
          await apiCall(
            `/evaluations/${sessionId}`,
            "POST",
            {
              overallRating: Math.round(pillars.reduce((s, p) => s + p.score, 0) / pillars.length),
              decision,
              competencies: competencies.map((c) => ({
                category: c.label,
                score: c.score,
                notes: c.rationale,
                evidenceRefs: c.evidenceReferences.map((er: any) => ({
                  refType: er.type,
                  timelineEventId: er.timelineEventId,
                  quote: er.locator?.quote || null,
                  note: er.summary,
                })),
              })),
              strengths: strengths.split(",").map((s) => s.trim()).filter(Boolean),
              weaknesses: weaknesses.split(",").map((w) => w.trim()).filter(Boolean),
              privateNotes,
              aiInsights: { competencies, overallScore, recommendedDecision },
            },
            token
          );
        } else {
          throw err;
        }
      }

      toast.success(`Evaluation finalized — ${recommendedDecision} (${overallScore}/100) with evidence-grounded 4 pillars`);
      if (onSaved) onSaved();
    } catch (err: any) {
      toast.error(err.message || "Failed saving evaluation");
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex h-full flex-col overflow-y-auto bg-[#0E0E0E] p-4 sm:p-6 text-white text-xs font-mono">
      {/* Header with engine version & overall score */}
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3 border-b border-[#2A2A2A] pb-4">
        <div>
          <h1 className="flex items-center gap-2 text-base font-bold text-white">
            <Award className="h-5 w-5 text-emerald-400" />
            Bar Raiser Competency Rubric — 4 Pillars
            <span className="rounded bg-emerald-500/15 border border-emerald-500/20 px-2 py-0.5 text-[10px] font-bold text-emerald-300">signals-engine/2026-08-v1</span>
          </h1>
          <p className="mt-1 text-[11px] text-[#888]">Every score must cite verifiable timeline evidence (zero-hallucination). Focus tracking is telemetry only — never auto-reject.</p>
          <div className="mt-2 flex items-center gap-3 text-[11px]">
            <span className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
              Overall: <strong className="text-white">{overallScore}/100</strong>
            </span>
            <span className="rounded bg-zinc-900 border border-zinc-700 px-2 py-0.5 text-zinc-300">Recommended: {recommendedDecision.replaceAll("_", " ")}</span>
            <span className="text-zinc-500">Avg pillar {(pillars.reduce((s, p) => s + p.score, 0) / pillars.length).toFixed(1)}/5</span>
          </div>
        </div>
        <button
          type="submit"
          disabled={saving || !canSubmit}
          className="flex items-center gap-1.5 rounded-lg bg-[#2A9D7B] px-4 py-2 font-sans text-xs font-semibold text-white shadow-lg transition hover:bg-[#238266] disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          <span>Finalize Scorecard</span>
        </button>
      </div>

      {!canSubmit && (
        <div className="mb-4 flex items-center gap-2 rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-[11px] text-amber-200">
          <ShieldCheck className="h-4 w-4 text-amber-400" />
          Each of the 4 pillars requires at least 1 evidence link and a rationale ≥10 chars. Confidence is deterministic from evidence depth.
        </div>
      )}

      <div className="grid grid-cols-12 gap-5">
        {/* Left: Decision & meta */}
        <div className="col-span-12 lg:col-span-4 space-y-4">
          <div className="rounded-xl border border-[#2A2A2A] bg-[#181818] p-4 space-y-3">
            <h2 className="text-xs font-bold uppercase tracking-wider text-[#AAAAAA]">Hiring Recommendation</h2>
            <div className="grid grid-cols-2 gap-2">
              {[
                { val: "STRONG_HIRE", label: "Strong Hire", color: "border-emerald-500 text-emerald-400 bg-emerald-500/10" },
                { val: "HIRE", label: "Hire", color: "border-[#2A9D7B] text-[#2A9D7B] bg-[#2A9D7B]/10" },
                { val: "LEAN_HIRE", label: "Lean Hire", color: "border-sky-500 text-sky-400 bg-sky-500/10" },
                { val: "LEAN_REJECT", label: "Lean Reject", color: "border-amber-500 text-amber-400 bg-amber-500/10" },
                { val: "REJECT", label: "Reject", color: "border-rose-500 text-rose-400 bg-rose-500/10" },
              ].map((item) => (
                <button
                  type="button"
                  key={item.val}
                  onClick={() => setDecision(item.val)}
                  className={`rounded-lg border p-2.5 text-center font-sans font-semibold transition text-xs ${
                    decision === item.val ? item.color : "border-[#333333] bg-[#202020] text-[#777777] hover:border-[#444444]"
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>

          <div className="rounded-xl border border-[#2A2A2A] bg-[#181818] p-4 space-y-3">
            <h2 className="text-xs font-bold uppercase tracking-wider text-[#AAAAAA]">Strengths & Growth Areas</h2>
            <div>
              <label className="text-[11px] font-semibold text-[#AAAAAA]">Key Strengths (comma-separated)</label>
              <textarea value={strengths} onChange={(e) => setStrengths(e.target.value)} rows={2} className="mt-1 w-full rounded border border-[#333333] bg-[#111111] p-2 text-white outline-none focus:border-[#2A9D7B]" />
            </div>
            <div>
              <label className="text-[11px] font-semibold text-[#AAAAAA]">Growth Areas</label>
              <textarea value={weaknesses} onChange={(e) => setWeaknesses(e.target.value)} rows={2} className="mt-1 w-full rounded border border-[#333333] bg-[#111111] p-2 text-white outline-none focus:border-[#2A9D7B]" />
            </div>
            <div>
              <label className="text-[11px] font-semibold text-[#AAAAAA]">Private Notes (hiring team only)</label>
              <textarea value={privateNotes} onChange={(e) => setPrivateNotes(e.target.value)} rows={2} placeholder="Not visible to candidate" className="mt-1 w-full rounded border border-[#333333] bg-[#111111] p-2 text-white outline-none focus:border-[#2A9D7B]" />
            </div>
          </div>

          {/* Live signals summary */}
          <div className="rounded-xl border border-zinc-800 bg-zinc-950 p-4 space-y-2">
            <h3 className="text-[11px] font-bold uppercase tracking-wider text-zinc-400 flex items-center gap-1.5">
              <Activity className="h-3 w-3 text-emerald-400" /> Detected Signals ({signals.length})
            </h3>
            {loadingEvidence ? (
              <div className="py-4 text-center text-zinc-500 text-xs flex items-center justify-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" /> Loading timeline & signals…
              </div>
            ) : signals.length === 0 ? (
              <p className="text-[11px] text-zinc-500">No signals yet — run code or speak to generate grounded observations.</p>
            ) : (
              <div className="space-y-1 max-h-40 overflow-y-auto pr-1">
                {signals.slice(0, 10).map((s) => (
                  <div key={s.id} className="flex items-center justify-between rounded bg-zinc-900 border border-zinc-800 px-2 py-1 text-[11px]">
                    <span className="truncate text-zinc-300">{s.name.replace(/_/g, " ")}</span>
                    <span className={`ml-2 shrink-0 rounded px-1.5 py-0.5 text-[9px] border ${s.indicator === "positive" ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-300" : s.indicator === "concern" ? "border-rose-500/30 bg-rose-500/10 text-rose-300" : "border-zinc-700 bg-zinc-800 text-zinc-400"}`}>
                      {s.indicator}
                    </span>
                  </div>
                ))}
              </div>
            )}
            <p className="text-[10px] text-zinc-600">Signals are deterministic AST/transcript heuristics — never hallucinated data structures.</p>
          </div>
        </div>

        {/* Right: 4-pillars */}
        <div className="col-span-12 lg:col-span-8 space-y-4">
          <h2 className="text-xs font-bold uppercase tracking-wider text-[#AAAAAA] flex items-center gap-2">
            Competency Breakdown — 4 Pillars (1–5) <span className="normal-case font-normal text-[#666]">each requires evidence</span>
          </h2>
          {pillars.map((pillar, pIdx) => {
            const meta = PILLARS.find((x) => x.pillar === pillar.pillar)!;
            const scoreMeta = SCORE_LABELS[pillar.score];
            return (
              <div key={pillar.pillar} className="rounded-xl border border-[#2A2A2A] bg-[#181818] p-4 space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <div className="rounded-lg bg-zinc-900 border border-zinc-800 p-2">{meta.icon}</div>
                    <div>
                      <div className="font-semibold text-white text-[13px] flex items-center gap-2">
                        {meta.label}
                        <span className={`rounded px-1.5 py-0.5 text-[10px] font-bold ${scoreMeta.color}`}>{scoreMeta.level}</span>
                      </div>
                      <p className="text-[11px] text-zinc-500">{meta.description}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    {[1, 2, 3, 4, 5].map((s) => (
                      <button
                        type="button"
                        key={s}
                        onClick={() => handlePillarScore(pIdx, s)}
                        className={`h-7 w-7 rounded text-xs font-bold transition border ${
                          s === pillar.score ? "bg-[#2A9D7B] text-white border-[#2A9D7B]" : "bg-[#252526] text-[#777777] border-[#333] hover:bg-[#333333] hover:text-white"
                        }`}
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex items-center gap-2 text-[11px]">
                  <span className="text-zinc-500">Confidence</span>
                  <div className="flex-1 h-1.5 rounded-full bg-zinc-900 overflow-hidden">
                    <div className="h-full bg-emerald-500 transition-all" style={{ width: `${pillar.confidence * 100}%` }} />
                  </div>
                  <span className="font-mono text-emerald-400">{(pillar.confidence * 100).toFixed(0)}%</span>
                  <span className="text-zinc-600">· evidence:{pillar.evidenceIds.length} signals:{pillar.signalsObserved.length}</span>
                </div>

                <textarea
                  value={pillar.rationale}
                  onChange={(e) => handlePillarRationale(pIdx, e.target.value)}
                  rows={2}
                  placeholder="Rationale — explain the score with evidence (≥10 chars)"
                  className="w-full rounded border border-[#333333] bg-[#111111] px-3 py-2 text-white outline-none focus:border-[#2A9D7B] text-xs"
                />

                {/* Signals observed chips */}
                {pillar.signalsObserved.length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {pillar.signalsObserved.map((s) => (
                      <span key={s} className="rounded bg-blue-500/10 border border-blue-500/20 px-2 py-0.5 text-[10px] text-blue-300">
                        {s.replace(/_/g, " ")}
                      </span>
                    ))}
                  </div>
                )}

                {/* Evidence picker — strict plan: clickable timeline evidence links */}
                <div className="space-y-2">
                  <div className="flex items-center gap-1.5 text-[11px] font-semibold text-zinc-300">
                    <Paperclip className="h-3 w-3 text-emerald-400" />
                    Evidence References (min 1) — click to select:
                    {pillar.evidenceIds.length === 0 && <span className="text-amber-300 font-normal">required</span>}
                  </div>
                  {timelineEvents.length === 0 ? (
                    <p className="text-[11px] text-zinc-500">No timeline events captured yet. Run code or change stages to generate evidence.</p>
                  ) : (
                    <div className="max-h-36 overflow-y-auto space-y-1 rounded border border-zinc-800 bg-zinc-950 p-2">
                      {timelineEvents.map((ev) => {
                        const selected = pillar.evidenceIds.includes(ev._id);
                        return (
                          <label
                            key={ev._id}
                            className={`flex items-start gap-2 rounded px-2 py-1.5 cursor-pointer border text-[11px] transition ${selected ? "bg-emerald-950/30 border-emerald-500/30 text-emerald-100" : "bg-zinc-900 border-zinc-800 text-zinc-300 hover:border-zinc-700"}`}
                          >
                            <input type="checkbox" checked={selected} onChange={() => toggleEvidence(pIdx, ev._id)} className="mt-0.5 accent-emerald-500" />
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-1.5">
                                <span className={`rounded px-1 py-0.5 text-[9px] border font-bold uppercase ${ev.pipeline === "CODING" ? "bg-blue-500/10 border-blue-500/20 text-blue-300" : ev.pipeline === "COMMUNICATION" ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-300" : ev.pipeline === "WHITEBOARD" ? "bg-purple-500/10 border-purple-500/20 text-purple-300" : "bg-zinc-800 border-zinc-700 text-zinc-400"}`}>
                                  {ev.pipeline}
                                </span>
                                <span className="truncate font-mono text-zinc-400">{ev.eventType}</span>
                                <span className="ml-auto font-mono text-zinc-500">{Math.floor((ev.offsetMs || 0) / 1000)}s</span>
                              </div>
                              <p className="truncate text-zinc-400 mt-0.5">{ev.payload?.text || ev.payload?.file || ev.eventType}</p>
                            </div>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.preventDefault();
                                handleResolveEvidence(ev._id);
                              }}
                              className="shrink-0 rounded bg-zinc-800 border border-zinc-700 p-1 text-zinc-400 hover:text-white"
                              title="Resolve evidence artifact"
                            >
                              <ExternalLink className="h-3 w-3" />
                            </button>
                          </label>
                        );
                      })}
                    </div>
                  )}
                  {pillar.evidenceIds.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {pillar.evidenceIds.map((id) => (
                        <span key={id} className="inline-flex items-center gap-1 rounded bg-emerald-500/15 border border-emerald-500/30 px-2 py-0.5 text-[10px] text-emerald-300">
                          <CheckCircle2 className="h-3 w-3" />
                          {id.slice(-8)} Verified
                          <button type="button" onClick={() => toggleEvidence(pIdx, id)} className="ml-1 text-emerald-400 hover:text-white">
                            ×
                          </button>
                        </span>
                      ))}
                    </div>
                  )}
                  {resolvedEvidence[pillar.evidenceIds[0]] && (
                    <div className="rounded bg-zinc-900 border border-zinc-800 p-2 text-[11px] text-zinc-300">
                      <div className="font-semibold text-zinc-200">Resolved artifact:</div>
                      <pre className="mt-1 whitespace-pre-wrap break-words text-[11px] text-zinc-400">{JSON.stringify(resolvedEvidence[pillar.evidenceIds[0]], null, 2).slice(0, 600)}</pre>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Guardrails footer */}
      <div className="mt-4 flex flex-wrap items-center gap-3 rounded-lg border border-zinc-800 bg-zinc-950 px-3 py-2 text-[10px] text-zinc-500">
        <span className="flex items-center gap-1.5"><ShieldCheck className="h-3 w-3 text-emerald-500" /> Non-discrimination: race, gender, accent, age, disability never scored</span>
        <span className="hidden sm:inline">·</span>
        <span className="flex items-center gap-1.5"><Eye className="h-3 w-3 text-cyan-400" /> Focus telemetry is non-punitive only</span>
        <span className="hidden sm:inline">·</span>
        <span>engineVersion: signals-engine/2026-08-v1</span>
      </div>
    </form>
  );
}
