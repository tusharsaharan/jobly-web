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
  competencies: Array<{ category: string; score: number; notes: string }>;
  completedAt?: string;
}

function CandidateFeedbackPage() {
  const { roomKey } = Route.useParams();
  const { token, user } = useAuth();
  const navigate = useNavigate();
  const [feedback, setFeedback] = useState<Feedback | null>(null);
  const [session, setSession] = useState<{
    title: string;
    job?: { title?: string; company?: string };
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
        setSession(data.session);
      } catch (cause) {
        setError(cause instanceof Error ? cause.message : "Unable to load interview feedback.");
      } finally {
        setLoading(false);
      }
    }
    if (token) void loadFeedback();
  }, [roomKey, token]);

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
            icon={<CheckCircle2 className="h-5 w-5 text-[#7ee0c5]" />}
            items={feedback.strengths}
            empty="No strengths were recorded."
            tone="positive"
          />
          <FeedbackList
            title="Focus for your next interview"
            icon={<Target className="h-5 w-5 text-amber-300" />}
            items={feedback.improvementAreas}
            empty="No improvement areas were recorded."
            tone="improve"
          />
        </section>
        <section className="mt-6 rounded-2xl border border-[#303640] bg-[#12151b] p-6">
          <div className="flex items-center gap-2">
            <CircleGauge className="h-5 w-5 text-[#7ee0c5]" />
            <h2 className="text-lg font-semibold">Competency breakdown</h2>
          </div>
          <div className="mt-5 space-y-4">
            {feedback.competencies.map((competency) => (
              <article key={competency.category}>
                <div className="flex items-center justify-between gap-3">
                  <h3 className="text-sm font-medium">{competency.category}</h3>
                  <span className="text-sm font-semibold text-[#7ee0c5]">{competency.score}/5</span>
                </div>
                <div className="mt-2 h-2 overflow-hidden rounded-full bg-[#29313b]">
                  <div
                    className="h-full rounded-full bg-[#2A9D7B]"
                    style={{ width: `${competency.score * 20}%` }}
                  />
                </div>
                {competency.notes && (
                  <p className="mt-2 text-sm leading-6 text-[#b4bdc8]">{competency.notes}</p>
                )}
              </article>
            ))}
          </div>
        </section>
        <section className="mt-6 rounded-2xl border border-[#2A9D7B]/30 bg-[#2A9D7B]/10 p-5">
          <div className="flex items-start gap-3">
            <TrendingUp className="mt-0.5 h-5 w-5 shrink-0 text-[#7ee0c5]" />
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
          </div>
        </section>
      </div>
    </main>
  );
}

function FeedbackList({
  title,
  icon,
  items,
  empty,
  tone,
}: {
  title: string;
  icon: React.ReactNode;
  items: string[];
  empty: string;
  tone: "positive" | "improve";
}) {
  return (
    <section className="rounded-2xl border border-[#303640] bg-[#12151b] p-6">
      <div className="flex items-center gap-2">
        <span>{icon}</span>
        <h2 className="text-lg font-semibold">{title}</h2>
      </div>
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
