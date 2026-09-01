import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import {
  AlertCircle,
  ArrowLeft,
  ChevronRight,
  CircleGauge,
  Code2,
  Loader2,
  MessageSquare,
  Puzzle,
  Target,
  Workflow,
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

const SW = 1.75;

const PILLAR_META: Record<string, { label: string; icon: React.ComponentType<{ className?: string; strokeWidth?: number }> }> = {
  problem_solving: { label: "Problem Solving & Decomposition", icon: Puzzle },
  coding_algorithms: { label: "Algorithmic Implementation & Code Quality", icon: Code2 },
  system_design: { label: "System Architecture & Tradeoff Reasoning", icon: Workflow },
  communication: { label: "Technical Communication & Collaboration", icon: MessageSquare },
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
      <div className="flex min-h-screen items-center justify-center bg-iv-bg">
        <Loader2 strokeWidth={SW} className="h-8 w-8 animate-spin text-iv-accent" />
      </div>
    );
  if (error || !feedback)
    return (
      <main className="flex min-h-screen items-center justify-center bg-iv-bg p-6 text-iv-text">
        <section className="iv-card max-w-md p-6 text-center">
          <AlertCircle strokeWidth={SW} className="mx-auto h-8 w-8 text-iv-warning" />
          <h1 className="mt-3 text-lg font-semibold">Feedback is not available yet</h1>
          <p className="mt-2 text-sm leading-6 text-iv-muted">
            {error || "The interviewer has not published feedback for this session."}
          </p>
          <button
            type="button"
            onClick={() => navigate({ to: "/interviews" })}
            className="iv-btn iv-btn-primary mt-5"
          >
            Back to interviews
          </button>
        </section>
      </main>
    );

  const ratingPercent = `${Math.max(0, Math.min(100, feedback.overallRating * 20))}%`;
  return (
    <main className="iv-scroll min-h-screen bg-iv-bg px-4 py-8 text-iv-text sm:px-8">
      <div className="mx-auto max-w-5xl">
        <Link
          to="/interviews"
          className="inline-flex items-center gap-1.5 text-sm text-iv-muted transition hover:text-iv-text"
        >
          <ArrowLeft strokeWidth={SW} className="h-4 w-4" />
          All interviews
        </Link>
        <header className="iv-card mt-6 p-6 sm:p-8">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-iv-accent-glow">
            Your interview reflection
          </p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight">{session?.title}</h1>
          <p className="mt-2 text-sm text-iv-muted">
            {[session?.job?.title, session?.job?.company].filter(Boolean).join(" · ")}
          </p>
          <div className="mt-6 flex flex-wrap items-center gap-6">
            <div
              className="relative flex h-24 w-24 items-center justify-center rounded-full border-8 border-iv-accent/25"
              style={{
                background: `conic-gradient(var(--iv-accent) ${ratingPercent}, rgb(255 255 255 / 0.08) ${ratingPercent})`,
              }}
            >
              <div className="flex h-16 w-16 flex-col items-center justify-center rounded-full bg-iv-surface">
                <strong className="text-xl">{feedback.overallRating}</strong>
                <span className="text-[10px] text-iv-dim">out of 5</span>
              </div>
            </div>
            <div>
              <p className="text-sm text-iv-muted">Recruiter outcome</p>
              <p className="mt-1 text-xl font-semibold">{feedback.decision.replaceAll("_", " ")}</p>
              <p className="mt-2 text-xs text-iv-dim">
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
        <section className="iv-card mt-6 p-6">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">Competency breakdown — 4 Pillars</h2>
            <span className="iv-badge iv-badge-success">Evidence-grounded</span>
          </div>
          <p className="mt-1 text-xs text-iv-dim">Each score cites verifiable timeline evidence. Click evidence badges to resolve artifacts.</p>
          <div className="mt-5 space-y-5">
            {feedback.competencies.map((competency) => {
              const pillarKey = (competency as any).pillar || String(competency.category).toLowerCase().replace(/[^a-z_]/g, "_");
              const meta = PILLAR_META[pillarKey] || { label: competency.category, icon: Target };
              const PillarIcon = meta.icon;
              const fullComp = fullEvaluation?.competencies?.find((c: any) => (c.category === competency.category || c.pillar === pillarKey));
              const evidenceList: any[] = fullComp?.evidenceRefs || (competency as any).evidenceRefs || [];
              return (
                <article key={competency.category} className="rounded-xl border border-iv-line bg-iv-surface-alt p-4">
                  <div className="flex items-center justify-between gap-3">
                    <h3 className="flex items-center gap-2 text-sm font-medium">
                      <PillarIcon className="h-4 w-4 text-iv-accent-glow" strokeWidth={SW} />
                      {meta.label}
                      <span className="iv-badge iv-badge-neutral">{pillarKey}</span>
                    </h3>
                    <span className="font-num text-sm font-semibold text-iv-accent-glow">{competency.score}/5</span>
                  </div>
                  <div className="mt-2 h-2 overflow-hidden rounded-full bg-white/10">
                    <div className="h-full rounded-full bg-iv-accent" style={{ width: `${competency.score * 20}%` }} />
                  </div>
                  {(competency.notes || (competency as any).rationale) && (
                    <p className="mt-2 text-sm leading-6 text-iv-muted">{competency.notes || (competency as any).rationale}</p>
                  )}
                  {/* Evidence links */}
                  {evidenceList.length > 0 ? (
                    <div className="mt-3 space-y-2">
                      <div className="flex items-center gap-2 text-xs text-iv-dim">
                        <span className="flex items-center gap-1">
                          <CircleGauge strokeWidth={SW} className="h-3 w-3 text-iv-success" />
                          Evidence ({evidenceList.length})
                        </span>
                        <span className="text-[10px]">click badge to resolve to timeline artifact</span>
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
                              className="iv-badge iv-badge-accent cursor-pointer transition hover:bg-iv-accent-surface"
                            >
                              {resolvingId === id ? (
                                <Loader2 strokeWidth={SW} className="h-3 w-3 animate-spin" />
                              ) : (
                                <Target strokeWidth={SW} className="h-3 w-3" />
                              )}
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
                          <div key={`artifact-${id}`} className="iv-card bg-iv-bg p-3 text-xs text-iv-muted">
                            <div className="font-semibold text-iv-text">Resolved artifact — {ref.refType || ref.type}</div>
                            {artifact.error ? (
                              <p className="mt-1 text-iv-danger">{artifact.error}</p>
                            ) : (
                              <pre className="iv-scroll mt-1 max-h-32 overflow-auto whitespace-pre-wrap break-words font-iv-code text-[11px] text-iv-dim">{JSON.stringify(artifact, null, 2).slice(0, 800)}</pre>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <p className="mt-2 text-xs text-iv-dim">No direct evidence cited for this pillar in candidate view (hiring team sees full evidence graph).</p>
                  )}
                </article>
              );
            })}
          </div>
          <div className="mt-4 flex items-center gap-2 text-[11px] text-iv-dim">
            <span>engineVersion: signals-engine/2026-08-v1</span>
            <span>·</span>
            <span>Scoring is deterministic; redo with same signals produces identical 1–5 scores.</span>
            <button onClick={() => navigate({ to: `/interview/${roomKey}/replay` as any })} className="ml-auto inline-flex cursor-pointer items-center gap-1 border-0 bg-transparent p-0 text-xs text-iv-accent-glow transition hover:text-iv-text">
              View timeline replay with evidence markers <ChevronRight strokeWidth={SW} className="h-3 w-3" />
            </button>
          </div>
        </section>
        <section className="iv-card mt-6 border-iv-accent/30 bg-iv-accent-surface p-5">
          <div>
            <h2 className="font-semibold">Turn feedback into practice</h2>
            <p className="mt-1 text-sm leading-6 text-iv-muted">
              Choose one improvement area, practice it with a timed problem, then use the same
              collaborative IDE and whiteboard tools to replay your approach.
            </p>
            <Link
              to="/interviews"
              className="mt-3 inline-flex items-center gap-1 text-sm font-semibold text-iv-accent-glow transition hover:text-iv-text"
            >
              Return to interview history <ChevronRight strokeWidth={SW} className="h-4 w-4" />
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
    <section className="iv-card p-6">
      <h2 className="text-lg font-semibold">{title}</h2>
      {items.length ? (
        <ul className="mt-4 space-y-3">
          {items.map((item) => (
            <li key={item} className="flex gap-2 text-sm leading-6 text-iv-muted">
              <span
                className={`mt-2 h-1.5 w-1.5 shrink-0 rounded-full ${tone === "positive" ? "bg-iv-accent-glow" : "bg-iv-warning"}`}
              />
              {item}
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-4 text-sm text-iv-dim">{empty}</p>
      )}
    </section>
  );
}
