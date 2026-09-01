import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth";
import { apiCall } from "@/lib/api";
import {
  Calendar,
  ChevronRight,
  Plus,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_app/interviews")({
  head: () => ({
    meta: [
      { title: "Technical Interviews | Jobly Interview OS" },
      { name: "description", content: "Manage and join scheduled real-time technical interviews." },
    ],
  }),
  component: InterviewsListPage,
});

const SW = 1.75;

function InterviewsListPage() {
  const { user, token } = useAuth();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [interviews, setInterviews] = useState<any[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [statusFilter, setStatusFilter] = useState<string>("ALL");

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        const [intData, statsData] = await Promise.all([
          apiCall<{ interviews: any[] }>(
            `/dashboard/interviews?status=${statusFilter}`,
            "GET",
            null,
            token,
          ),
          apiCall<any>("/dashboard/stats", "GET", null, token),
        ]);
        setInterviews(intData.interviews || []);
        setStats(statsData);
      } catch (err: any) {
        toast.error(err.message || "Failed loading interviews");
      } finally {
        setLoading(false);
      }
    }

    if (token) {
      loadData();
    }
  }, [token, statusFilter]);

  return (
    <main className="mx-auto max-w-6xl px-6 pb-16 pt-28 sm:px-10">
      <header className="flex flex-wrap items-end justify-between gap-4 border-b border-border pb-8">
        <div>
          <p className="marker-num">Real-Time Interview OS</p>
          <h1 className="font-display mt-4 text-[clamp(2.5rem,5vw,4.5rem)] text-ink">
            Technical Interviews
          </h1>
          <p className="mt-3 max-w-2xl text-base leading-relaxed text-ink/70">
            {user?.role === "recruiter"
              ? "Schedule, launch, and review collaborative technical interview sessions with synchronized IDE, Whiteboard, and AI Evidence."
              : "Access your scheduled live technical interview rooms with interactive coding workspace and architecture whiteboard."}
          </p>
        </div>

        {user?.role === "recruiter" && (
          <Link to="/applicants" className="pill-mint flex items-center gap-2">
            <Plus strokeWidth={SW} className="h-4 w-4" />
            <span>Schedule from Applicants</span>
          </Link>
        )}
      </header>

      {/* Analytics KPI Bar */}
      {stats && (
        <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <div className="surface rounded-xl p-4">
            <div className="text-xs font-semibold uppercase text-ink/60">Total Interviews</div>
            <div className="mt-1 text-2xl font-bold text-ink">{stats.totalSessions}</div>
          </div>
          <div className="surface rounded-xl p-4">
            <div className="text-xs font-semibold uppercase text-success">Live / In Progress</div>
            <div className="mt-1 text-2xl font-bold text-success">{stats.liveSessions}</div>
          </div>
          <div className="surface rounded-xl p-4">
            <div className="text-xs font-semibold uppercase text-info">Scheduled</div>
            <div className="mt-1 text-2xl font-bold text-info">{stats.scheduledSessions}</div>
          </div>
          <div className="surface rounded-xl p-4">
            <div className="text-xs font-semibold uppercase text-ink/60">Completed & Evaluated</div>
            <div className="mt-1 text-2xl font-bold text-ink">{stats.completedSessions}</div>
          </div>
        </div>
      )}

      {/* Filter Tabs */}
      <div className="mt-6 flex items-center gap-2 border-b border-border pb-2 font-num text-xs">
        {["ALL", "LIVE", "SCHEDULED", "COMPLETED"].map((st) => (
          <button
            key={st}
            onClick={() => setStatusFilter(st)}
            className={`rounded-lg px-3 py-1.5 font-semibold transition ${
              statusFilter === st
                ? "bg-ink text-cream"
                : "bg-surface text-ink/70 hover:text-ink"
            }`}
          >
            {st}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-24">
          <Loader2 strokeWidth={SW} className="h-8 w-8 animate-spin text-mint-deep" />
        </div>
      ) : interviews.length === 0 ? (
        <div className="surface mt-6 flex flex-col items-center justify-center p-12 text-center">
          <Calendar strokeWidth={SW} className="mb-3 h-10 w-10 text-ink/40" />
          <h3 className="text-lg font-bold text-ink">No interviews found</h3>
          <p className="mt-1 max-w-md text-sm text-ink/60">
            {user?.role === "recruiter"
              ? "Shortlist an applicant from your candidate pipeline to schedule their live technical interview session."
              : "You do not have any interview sessions under this filter."}
          </p>
        </div>
      ) : (
        <div className="mt-6 space-y-4">
          {interviews.map((item) => (
            <div
              key={item._id}
              className="surface flex flex-wrap items-center justify-between gap-4 p-5 transition hover:border-mint-deep"
            >
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold text-ink">{item.title}</h3>
                  <span
                    className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${
                      item.status === "LIVE"
                        ? "animate-pulse bg-success/15 text-success"
                        : item.status === "COMPLETED"
                          ? "bg-ink/10 text-ink/60"
                          : "bg-info/10 text-info"
                    }`}
                  >
                    {item.status}
                  </span>

                  {item.evaluation && (
                    <span className="rounded-full bg-success/15 px-2.5 py-0.5 text-[10px] font-bold text-success">
                      {item.evaluation.decision} ({item.evaluation.overallRating}/5)
                    </span>
                  )}
                </div>

                <div className="mt-1.5 flex flex-wrap items-center gap-2 text-xs text-ink/60">
                  <span>{item.job?.title} ({item.job?.company})</span>
                  <span>·</span>
                  <span>
                    {user?.role === "recruiter"
                      ? `Candidate: ${item.seeker?.name}`
                      : `Interviewer: ${item.recruiter?.name}`}
                  </span>
                  <span>·</span>
                  <span>{new Date(item.scheduledStart).toLocaleString()}</span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center gap-2">
                {item.status === "COMPLETED" && (
                  <>
                    <Link
                      to="/interview/$roomKey/replay"
                      params={{ roomKey: item.roomKey }}
                      className="rounded-lg border border-border bg-surface px-3 py-1.5 text-xs font-semibold text-ink transition hover:border-mint-deep"
                    >
                      Timeline & Replay
                    </Link>

                    {user?.role === "recruiter" && (
                      <Link
                        to="/interview/$roomKey/evaluation"
                        params={{ roomKey: item.roomKey }}
                        className="rounded-lg border border-border bg-surface px-3 py-1.5 text-xs font-semibold text-ink transition hover:border-mint-deep"
                      >
                        Scorecard
                      </Link>
                    )}
                    {user?.role !== "recruiter" && item.evaluation?.feedbackAvailable && (
                      <Link
                        to="/interview/$roomKey/feedback"
                        params={{ roomKey: item.roomKey }}
                        className="rounded-lg border border-success/40 bg-success/10 px-3 py-1.5 text-xs font-semibold text-success transition hover:bg-success/20"
                      >
                        Feedback & practice plan
                      </Link>
                    )}
                  </>
                )}

                <Link
                  to="/interview/$roomKey"
                  params={{ roomKey: item.roomKey }}
                  className="pill-mint flex items-center gap-1.5 text-xs"
                >
                  <span>{item.status === "COMPLETED" ? "Review Room" : "Enter Room"}</span>
                  <ChevronRight strokeWidth={SW} className="h-4 w-4" />
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </main>
  );
}
