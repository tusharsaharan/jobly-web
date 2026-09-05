import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import {
  AlertCircle,
  ArrowLeft,
  CheckCircle2,
  ChevronRight,
  CircleGauge,
  Loader2,
  Target,
  TrendingUp,
} from "lucide-react";
import { useAuth } from "@/lib/auth";
import { apiCall } from "@/lib/api";

export const Route = createFileRoute("/_app/interview/$roomKey/feedback")({
  head: () => ({ meta: [{ title: "Interview feedback | Jobly" }] }),
  component: CandidateFeedbackPage,
});

interface Feedback {
  overallRating: number;
  decision: string;
  strengths: string[];
  improvementAreas: string[];
  competencies: Array<{ category: string; score: number; notes: string; evidenceRefs?: any[]; pillar?: string; rationale?: string }>;
  completedAt?: string;
}

const PILLAR_META: Record<string, { label: string }> = {
  problem_solving: { label: "Problem Solving & Decomposition" },
  coding_algorithms: { label: "Algorithmic Implementation & Code Quality" },
  system_design: { label: "System Architecture & Tradeoff Reasoning" },
  communication: { label: "Technical Communication & Collaboration" },
};

function CandidateFeedbackPage() {
  const { roomKey } = Route.useParams();
  const { token, user } = useAuth();
  const navigate = useNavigate();
  const [feedback, setFeedback] = useState<Feedback | null>(null);
  const [session, setSession] = useState<{
    title: string;
    job?: { title?: string; company?: string };
    _id?: string;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [fullEvaluation, setFullEvaluation] = useState<any>(null);
  const [resolvingId, setResolvingId] = useState<string | null>(null);
  const [resolvedArtifact, setResolvedArtifact] = useState<Record<string, any>>({});

  useEffect(() => {
    async function loadFeedback() {
      try {
        const room = await apiCall<{ session: { _id: string } }>(
          `/interviews/room/${roomKey}`,
          "GET",
          null,
          token,
        );
        const data = await apiCall<{
          feedback: Feedback;
          session: { title: string; job?: { title?: string; company?: string } };
        }>(`/evaluations/${room.session._id}/candidate-feedback`, "GET", null, token);
        setFeedback(data.feedback);
        setSession(data.session as any);
        // Try to load full evaluation for evidence links if recruiter
        try {
          const evalData = await apiCall<{ evaluation: any }>(`/evaluations/${room.session._id}`, "GET", null, token);
          if (evalData?.evaluation) setFullEvaluation(evalData.evaluation);
        } catch {
          // candidate view hides evidence — expected 403 for seekers without recruiter perms
        }
      } catch (cause) {
        setError(cause instanceof Error ? cause.message : "Unable to load interview feedback.");
      } finally {
        setLoading(false);
      }
    }
    if (token) void loadFeedback();
  }, [roomKey, token]);

  const handleResolveEvidence = async (evidenceId: string) => {
    if (!session?._id) return;
    setResolvingId(evidenceId);
    try {
      const res = await apiCall<{ evidenceRef: any; resolvedArtifact: any }>(`/evaluations/${session._id}/evidence/${evidenceId}`, "GET", null, token);
      setResolvedArtifact((m) => ({ ...m, [evidenceId]: res.resolvedArtifact }));
    } catch (e: any) {
      setResolvedArtifact((m) => ({ ...m, [evidenceId]: { error: e.message } }));
    } finally {
      setResolvingId(null);
    }
  };

  if (loading)
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#07090d] text-white">
        <Loader2 className="h-7 w-7 animate-spin text-[#2A9D7B]" />
      </div>
    );
  if (error || !feedback)
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#07090d] p-6 text-white">
        <section className="max-w-md rounded-xl border border-[#303640] bg-[#12151b] p-6 text-center">
          <AlertCircle className="mx-auto h-8 w-8 text-amber-300" />
          <h1 className="mt-3 text-lg font-semibold">Feedback is not available yet</h1>
          <p className="mt-2 text-sm leading-6 text-[#b0b8c3]">
            {error || "The interviewer has not published feedback for this session."}
          </p>
          <button
            type="button"
            onClick={() => navigate({ to: "/interviews" })}
            className="mt-5 rounded-lg bg-[#2A9D7B] px-4 py-2 text-sm font-semibold transition hover:bg-[#238266] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-[#7ee0c5]"
          >
            Back to interviews
          </button>
        </section>
      </main>
    );

  const ratingPercent = `${Math.max(0, Math.min(100, feedback.overallRating * 20))}%`;
  return (
    <main className="min-h-screen bg-[#07090d] px-4 py-8 font-sans text-[#f7fafc] sm:px-8">
      <div className="mx-auto max-w-5xl">
        <Link
          to="/interviews"
          className="inline-flex items-center gap-1.5 text-sm text-[#b2bac5] transition hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#7ee0c5]"
        >
          <ArrowLeft className="h-4 w-4" />
          All interviews
        </Link>
        <header className="mt-6 rounded-2xl border border-[#303640] bg-[radial-gradient(circle_at_top_right,#174837,transparent_45%),#12151b] p-6 sm:p-8">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#7ee0c5]">
            Your interview reflection
          </p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight">{session?.title}</h1>
          <p className="mt-2 text-sm text-[#b7bfca]">
            {[session?.job?.title, session?.job?.company].filter(Boolean).join(" · ")}
          </p>
          <div className="mt-6 flex flex-wrap items-center gap-6">
            <div
              className="relative flex h-24 w-24 items-center justify-center rounded-full border-8 border-[#2A9D7B]/25"
              style={{
                background: `conic-gradient(#2A9D7B ${ratingPercent}, #28313b ${ratingPercent})`,
              }}
            >
              <div className="flex h-16 w-16 flex-col items-center justify-center rounded-full bg-[#12151b]">
                <strong className="text-xl">{feedback.overallRating}</strong>
                <span className="text-[10px] text-[#aeb7c2]">out of 5</span>
              </div>
            </div>
            <div>
              <p className="text-sm text-[#b7bfca]">Recruiter outcome</p>
              <p className="mt-1 text-xl font-semibold">{feedback.decision.replaceAll("_", " ")}</p>
              <p className="mt-2 text-xs text-[#aeb7c2]">
                This coaching view excludes private hiring-team notes.
              </p>
            </div>
          </div>
        </header>
        <section className="mt-6 grid gap-6 lg:grid-cols-2">
          <FeedbackList
            title="What went well"
            items={feedback.strengths}
            empty="No strengths were recorded."
            tone="positive"
          />
          <FeedbackList
            title="Focus for your next interview"
            items={feedback.improvementAreas}
            empty="No improvement areas were recorded."
            tone="improve"
          />
        </section>
        <section className="mt-6 rounded-2xl border border-[#303640] bg-[#12151b] p-6">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">Competency breakdown — 4 Pillars (signals-engine/2026-08-v1)</h2>
            <span className="rounded bg-emerald-500/10 border border-emerald-500/20 px-2 py-1 text-xs text-emerald-300">Evidence-grounded</span>
          </div>
          <p className="mt-1 text-xs text-[#8b95a5]">Each score cites verifiable timeline evidence. Click evidence badges to resolve artifacts.</p>
          <div className="mt-5 space-y-5">
            {feedback.competencies.map((competency) => {
              const pillarKey = (competency as any).pillar || String(competency.category).toLowerCase().replace(/[^a-z_]/g, "_");
              const meta = PILLAR_META[pillarKey] || { label: competency.category };
              const fullComp = fullEvaluation?.competencies?.find((c: any) => (c.category === competency.category || c.pillar === pillarKey));
              const evidenceList: any[] = fullComp?.evidenceRefs || (competency as any).evidenceRefs || [];
              return (
                <article key={competency.category} className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-4">
                  <div className="flex items-center justify-between gap-3">
                    <h3 className="text-sm font-medium flex items-center gap-2">
                      {meta.label}
                      <span className="rounded bg-zinc-800 border border-zinc-700 px-1.5 py-0.5 text-[10px] text-zinc-400">{pillarKey}</span>
                    </h3>
                    <span className="text-sm font-semibold text-[#7ee0c5]">{competency.score}/5</span>
                  </div>
                  <div className="mt-2 h-2 overflow-hidden rounded-full bg-[#29313b]">
                    <div className="h-full rounded-full bg-[#2A9D7B]" style={{ width: `${competency.score * 20}%` }} />
                  </div>
                  {(competency.notes || (competency as any).rationale) && (
                    <p className="mt-2 text-sm leading-6 text-[#b4bdc8]">{competency.notes || (competency as any).rationale}</p>
                  )}
                  {/* Evidence links — plan Phase 7b interactive */}
                  {evidenceList.length > 0 ? (
                    <div className="mt-3 space-y-2">
                      <div className="flex items-center gap-2 text-xs text-zinc-400">
                        <span className="flex items-center gap-1">
                          <CircleGauge className="h-3 w-3 text-emerald-400" />
                          Evidence ({evidenceList.length})
                        </span>
                        <span className="text-[10px] text-zinc-600">click badge to resolve to timeline artifact</span>
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {evidenceList.slice(0, 5).map((ref: any) => {
                          const id = String(ref._id || ref.id || ref.timelineEventId || Math.random().toString(36).slice(2, 6));
                          const label = ref.refType || ref.type || "TIMELINE_EVENT";
                          return (
                            <button
                              key={id}
                              onClick={() => handleResolveEvidence(id)}
                              disabled={resolvingId === id}
                              className="inline-flex items-center gap-1 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-1 text-[11px] font-medium text-emerald-300 hover:bg-emerald-500/20 transition"
                            >
                              {resolvingId === id ? <Loader2 className="h-3 w-3 animate-spin" /> : <Target className="h-3 w-3" />}
                              {label} · {id.slice(-6)}
                            </button>
                          );
                        })}
                      </div>
                      {evidenceList.slice(0, 5).map((ref: any) => {
                        const id = String(ref._id || ref.id || ref.timelineEventId);
                        const artifact = resolvedArtifact[id];
                        if (!artifact) return null;
                        return (
                          <div key={`artifact-${id}`} className="rounded-lg border border-zinc-800 bg-zinc-950 p-3 text-xs text-zinc-300">
                            <div className="font-semibold text-zinc-200">Resolved artifact — {ref.refType || ref.type}</div>
                            {artifact.error ? (
                              <p className="mt-1 text-rose-300">{artifact.error}</p>
                            ) : (
                              <pre className="mt-1 max-h-32 overflow-auto whitespace-pre-wrap break-words text-[11px] text-zinc-400">{JSON.stringify(artifact, null, 2).slice(0, 800)}</pre>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <p className="mt-2 text-xs text-zinc-500">No direct evidence cited for this pillar in candidate view (hiring team sees full evidence graph).</p>
                  )}
                </article>
              );
            })}
          </div>
          <div className="mt-4 flex items-center gap-2 text-[11px] text-zinc-500">
            <span>engineVersion: signals-engine/2026-08-v1</span>
            <span>·</span>
            <span>Scoring is deterministic; redo with same signals produces identical 1–5 scores.</span>
            <button onClick={() => navigate({ to: `/interview/${roomKey}/replay` as any })} className="ml-auto inline-flex items-center gap-1 text-emerald-300 hover:text-white bg-transparent border-0 p-0 text-xs cursor-pointer">
              View timeline replay with evidence markers <ChevronRight className="h-3 w-3" />
            </button>
          </div>
        </section>
        <section className="mt-6 rounded-2xl border border-[#2A9D7B]/30 bg-[#2A9D7B]/10 p-5">
          <div>
            <h2 className="font-semibold">Turn feedback into practice</h2>
            <p className="mt-1 text-sm leading-6 text-[#c2d7d0]">
              Choose one improvement area, practice it with a timed problem, then use the same
              collaborative IDE and whiteboard tools to replay your approach.
            </p>
            <Link
              to="/interviews"
              className="mt-3 inline-flex items-center gap-1 text-sm font-semibold text-[#7ee0c5] hover:text-white"
            >
              Return to interview history <ChevronRight className="h-4 w-4" />
            </Link>
          </div>
        </section>
      </div>
    </main>
  );
}

function FeedbackList({
  title,
  items,
  empty,
  tone,
}: {
  title: string;
  items: string[];
  empty: string;
  tone: "positive" | "improve";
}) {
  return (
    <section className="rounded-2xl border border-[#303640] bg-[#12151b] p-6">
      <h2 className="text-lg font-semibold">{title}</h2>
      {items.length ? (
        <ul className="mt-4 space-y-3">
          {items.map((item) => (
            <li key={item} className="flex gap-2 text-sm leading-6 text-[#c8d0da]">
              <span
                className={`mt-2 h-1.5 w-1.5 shrink-0 rounded-full ${tone === "positive" ? "bg-[#7ee0c5]" : "bg-amber-300"}`}
              />
              {item}
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-4 text-sm text-[#aeb7c2]">{empty}</p>
      )}
    </section>
  );
}
