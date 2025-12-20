import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { CalendarDays, MessageSquare, Video } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { ApplicationConversation } from "@/components/ApplicationConversation";
import { AtsScoreRing } from "@/components/ui/AtsScoreRing";
import { useAuth } from "@/lib/auth";
import { apiCall } from "@/lib/api";

export const Route = createFileRoute("/_app/applications")({
  head: () => ({
    meta: [
      { title: "Applications | Jobly" },
      { name: "description", content: "Track your applications." },
    ],
  }),
  component: ApplicationsPage,
});

interface Application {
  _id: string;
  atsScore?: number;
  createdAt?: string;
  job?: { _id?: string; company?: string; title?: string };
  status: "applied" | "shortlisted" | "rejected" | string;
}

function ApplicationsPage() {
  const { user, token } = useAuth();
  const navigate = useNavigate();
  const [applications, setApplications] = useState<Application[]>([]);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user?.role === "recruiter") navigate({ to: "/dashboard", replace: true });
  }, [navigate, user?.role]);

  useEffect(() => {
    if (!token) return;
    apiCall<Application[]>("/applications/me", "GET", null, token)
      .then((response) => setApplications(Array.isArray(response) ? response : []))
      .catch(() => setApplications([]))
      .finally(() => setLoading(false));
  }, [token]);

  const pipeline = useMemo(() => ({
    applied: applications.filter((application) => application.status === "applied").length,
    shortlisted: applications.filter((application) => application.status === "shortlisted").length,
    rejected: applications.filter((application) => application.status === "rejected").length,
  }), [applications]);
  const orderedApplications = useMemo(() => [...applications].sort((left, right) => dateValue(right.createdAt) - dateValue(left.createdAt)), [applications]);

  return (
    <main className="mx-auto max-w-6xl px-6 pb-16 pt-28 sm:px-10">
      <header className="flex flex-col justify-between gap-7 border-b border-border pb-8 md:flex-row md:items-end">
        <div>
          <p className="marker-num">Application history</p>
          <h1 className="font-display mt-4 text-[clamp(2.7rem,5.4vw,5.5rem)] text-ink">Your applications, in motion.</h1>
          <p className="mt-5 max-w-2xl text-lg leading-relaxed text-ink/68">
            Track a role from submitted to decision, access live technical interview rooms, and converse with recruiters.
          </p>
        </div>
      </header>

      <section className="mt-8 grid divide-y divide-border border-y border-border sm:grid-cols-3 sm:divide-x sm:divide-y-0" aria-label="Pipeline counts">
        <PipelineCount label="Active" value={pipeline.applied} />
        <PipelineCount label="Shortlisted" value={pipeline.shortlisted} tone="text-[#2A9D7B]" />
        <PipelineCount label="Closed" value={pipeline.rejected} tone="text-[#183A32]" />
      </section>

      <section className="mt-8 border-y border-border" aria-label="Application history">
        {loading ? (
          <LoadingRows />
        ) : orderedApplications.length === 0 ? (
          <div className="py-14 text-center">
            <p className="font-display text-3xl text-ink">No applications yet.</p>
            <p className="mt-3 text-sm text-ink/60">Browse roles to compare your profile and make your first application.</p>
          </div>
        ) : null}
        {!loading && orderedApplications.map((application) => {
          const conversationOpen = conversationId === application._id;
          const recruiterName = application.job?.company || "the recruiter";
          return (
            <article key={application._id} className="border-b border-border px-1 py-6 last:border-b-0 sm:px-3">
              <div className="grid gap-5 sm:grid-cols-[minmax(0,1fr)_auto_auto] sm:items-center">
                <div className="min-w-0">
                  <p className="marker-num truncate text-ink/50">{application.job?.company || "Company"}</p>
                  <h2 className="font-display mt-1 truncate text-2xl text-ink">{application.job?.title || "Role"}</h2>
                  <p className="mt-2 inline-flex items-center gap-2 text-sm text-ink/55"><CalendarDays className="h-4 w-4" aria-hidden="true" />Submitted {formatDate(application.createdAt)}</p>
                </div>

                {typeof application.atsScore === "number" ? (
                  <div className="flex items-center gap-3 sm:flex-col sm:gap-1">
                    <AtsScoreRing score={application.atsScore} size={46} />
                    <p className="text-xs font-semibold text-ink/55">{Math.round(application.atsScore)}% fit</p>
                  </div>
                ) : <p className="text-sm text-ink/55">Score pending</p>}

                <div className="flex flex-wrap items-center gap-2 sm:justify-end">
                  <StatusLabel status={application.status} />

                  {application.status === "shortlisted" && (
                    <button
                      type="button"
                      onClick={async () => {
                        try {
                          const res = await apiCall<{ session: any }>(
                            `/interviews/application/${application._id}`,
                            "GET",
                            null,
                            token
                          );
                          if (res.session?.roomKey) {
                            navigate({ to: "/interview/$roomKey", params: { roomKey: res.session.roomKey } });
                          } else {
                            toast.info("Your interview room will be active shortly.");
                          }
                        } catch (err: any) {
                          toast.info("Interview room is being configured by the recruiter.");
                        }
                      }}
                      className="inline-flex min-h-10 items-center gap-1.5 rounded-md bg-[#2A9D7B] px-3 text-sm font-semibold text-white transition-colors hover:bg-[#238266]"
                    >
                      <Video className="h-4 w-4" />
                      Join Interview Room
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={() => setConversationId((id) => id === application._id ? null : application._id)}
                    aria-expanded={conversationOpen}
                    className="inline-flex min-h-10 items-center gap-2 rounded-md border border-border px-3 text-sm font-semibold text-ink transition-colors hover:bg-panel"
                  >
                    <MessageSquare className="h-4 w-4" aria-hidden="true" />
                    {conversationOpen ? "Close message" : "Message"}
                  </button>
                </div>
              </div>

              {conversationOpen && token ? (
                <ApplicationConversation
                  applicationId={application._id}
                  counterpartName={recruiterName}
                  currentUserId={user?._id ?? user?.id}
                  token={token}
                />
              ) : null}
            </article>
          );
        })}
      </section>
    </main>
  );
}

function PipelineCount({ label, tone = "text-ink", value }: { label: string; tone?: string; value: number }) {
  return (
    <button type="button" className="group flex w-full flex-col items-start py-5 px-4 text-left transition-colors hover:bg-panel sm:px-6 sm:first:pl-0">
      <p className="marker-num transition-colors group-hover:text-mint-deep">{label}</p>
      <p className={`font-display mt-2 text-4xl ${tone}`}>{value}</p>
    </button>
  );
}

function StatusLabel({ status }: { status: string }) {
  const normalized = status === "shortlisted" || status === "rejected" ? status : "applied";
  const className = normalized === "shortlisted"
    ? "border-[#8DDCBE] bg-[#E9FBF2] text-[#1E7058]"
    : normalized === "rejected"
      ? "border-[#B6DCCB] bg-[#F2FAF6] text-[#335E50]"
      : "border-[#C5EBDD] bg-[#EFFBF5] text-[#23765E]";
  return <span className={`rounded-md border px-2.5 py-1 text-xs font-semibold capitalize ${className}`}>{normalized}</span>;
}

function LoadingRows() {
  return <>{Array.from({ length: 4 }).map((_, index) => <div key={index} className="h-32 animate-pulse border-b border-border bg-card/40" />)}</>;
}

function dateValue(value?: string) {
  const date = value ? new Date(value).getTime() : 0;
  return Number.isFinite(date) ? date : 0;
}

function formatDate(value?: string) {
  if (!value) return "recently";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "recently" : date.toLocaleDateString();
}
