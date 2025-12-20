import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth";
import { apiCall } from "@/lib/api";
import {
  Calendar,
  Clock,
  User,
  Building,
  Video,
  FileCode,
  CheckCircle2,
  ChevronRight,
  Plus,
  Loader2,
  AlertCircle,
  Sparkles,
  ShieldCheck,
  Play,
  TrendingUp,
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
            <Plus className="h-4 w-4" />
            <span>Schedule from Applicants</span>
          </Link>
        )}
      </header>

      {/* Analytics KPI Bar */}
      {stats && (
        <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <div className="surface rounded-xl p-4">
            <div className="text-xs font-semibold text-ink/60 uppercase">Total Interviews</div>
            <div className="mt-1 text-2xl font-bold text-ink">{stats.totalSessions}</div>
          </div>
          <div className="surface rounded-xl p-4">
            <div className="text-xs font-semibold text-emerald-600 uppercase">
              Live / In Progress
            </div>
            <div className="mt-1 text-2xl font-bold text-emerald-600">{stats.liveSessions}</div>
          </div>
          <div className="surface rounded-xl p-4">
            <div className="text-xs font-semibold text-blue-600 uppercase">Scheduled</div>
            <div className="mt-1 text-2xl font-bold text-blue-600">{stats.scheduledSessions}</div>
          </div>
          <div className="surface rounded-xl p-4">
            <div className="text-xs font-semibold text-ink/60 uppercase">Completed & Evaluated</div>
            <div className="mt-1 text-2xl font-bold text-ink">{stats.completedSessions}</div>
          </div>
        </div>
      )}

      {/* Filter Tabs */}
      <div className="mt-6 flex items-center gap-2 border-b border-border pb-2 text-xs font-mono">
        {["ALL", "LIVE", "SCHEDULED", "COMPLETED"].map((st) => (
          <button
            key={st}
            onClick={() => setStatusFilter(st)}
            className={`rounded-lg px-3 py-1.5 font-semibold transition ${
              statusFilter === st
                ? "bg-[#2A9D7B] text-white"
                : "bg-surface text-ink/70 hover:text-ink"
            }`}
          >
            {st}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex py-24 items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-[#2A9D7B]" />
        </div>
      ) : interviews.length === 0 ? (
        <div className="surface mt-6 flex flex-col items-center justify-center p-12 text-center">
          <Calendar className="mb-3 h-10 w-10 text-ink/40" />
          <h3 className="text-lg font-bold text-ink">No interviews found</h3>
          <p className="mt-1 text-sm text-ink/60 max-w-md">
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
              className="surface flex flex-wrap items-center justify-between gap-4 p-5 transition hover:border-[#2A9D7B]"
            >
              <div className="flex items-start gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#2A9D7B]/10 text-[#2A9D7B]">
                  <Video className="h-6 w-6" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-ink">{item.title}</h3>
                    <span
                      className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${
                        item.status === "LIVE"
                          ? "bg-emerald-500/20 text-emerald-600 animate-pulse"
                          : item.status === "COMPLETED"
                            ? "bg-gray-200 text-gray-700"
                            : "bg-blue-500/10 text-blue-600"
                      }`}
                    >
                      {item.status}
                    </span>

                    {item.evaluation && (
                      <span className="rounded-full bg-emerald-500/15 px-2.5 py-0.5 text-[10px] font-bold text-emerald-700">
                        {item.evaluation.decision} ({item.evaluation.overallRating}/5)
                      </span>
                    )}
                  </div>

                  <div className="mt-1 flex flex-wrap items-center gap-4 text-xs text-ink/60">
                    <span className="flex items-center gap-1">
                      <Building className="h-3.5 w-3.5" />
                      {item.job?.title} ({item.job?.company})
                    </span>
                    <span className="flex items-center gap-1">
                      <User className="h-3.5 w-3.5" />
                      {user?.role === "recruiter"
                        ? `Candidate: ${item.seeker?.name}`
                        : `Interviewer: ${item.recruiter?.name}`}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="h-3.5 w-3.5" />
                      {new Date(item.scheduledStart).toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center gap-2">
                {item.status === "COMPLETED" && (
                  <>
                    <Link
                      to="/interview/$roomKey/replay"
                      params={{ roomKey: item.roomKey }}
                      className="flex items-center gap-1 rounded-lg border border-border bg-surface px-3 py-1.5 text-xs font-semibold text-ink hover:border-[#2A9D7B] transition"
                    >
                      <Play className="h-3.5 w-3.5 text-[#2A9D7B]" />
                      <span>Replay Session</span>
                    </Link>

                    {user?.role === "recruiter" && (
                      <Link
                        to="/interview/$roomKey/evaluation"
                        params={{ roomKey: item.roomKey }}
                        className="flex items-center gap-1 rounded-lg border border-border bg-surface px-3 py-1.5 text-xs font-semibold text-ink hover:border-[#2A9D7B] transition"
                      >
                        <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />
                        <span>Scorecard</span>
                      </Link>
                    )}
                    {user?.role !== "recruiter" && item.evaluation?.feedbackAvailable && (
                      <Link
                        to="/interview/$roomKey/feedback"
                        params={{ roomKey: item.roomKey }}
                        className="flex items-center gap-1 rounded-lg border border-[#2A9D7B]/40 bg-[#2A9D7B]/10 px-3 py-1.5 text-xs font-semibold text-[#187258] transition hover:bg-[#2A9D7B]/20"
                      >
                        <TrendingUp className="h-3.5 w-3.5" />
                        <span>Feedback & practice plan</span>
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
                  <ChevronRight className="h-3.5 w-3.5" />
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </main>
  );
}
