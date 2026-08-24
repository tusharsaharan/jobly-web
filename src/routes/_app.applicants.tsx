import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import {
  Award,
  BriefcaseBusiness,
  CalendarDays,
  GraduationCap,
  MessageSquare,
  Search,
  UserRound,
  Video,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { ApplicationConversation } from "@/components/ApplicationConversation";
import { AtsBreakdown, AtsScoreRing, getScoreGreenShade } from "@/components/ui/AtsScoreRing";
import { useAuth } from "@/lib/auth";
import { apiCall } from "@/lib/api";

export const Route = createFileRoute("/_app/applicants")({
  head: () => ({
    meta: [
      { title: "Applicants | Jobly" },
      { name: "description", content: "Review applicants to your roles." },
    ],
  }),
  component: ApplicantsPage,
});

interface Applicant {
  _id: string;
  atsBreakdown?: unknown;
  atsScore?: number;
  createdAt?: string;
  job?: { _id?: string; skills?: string[]; title?: string };
  seeker?: {
    _id?: string;
    achievements?: string[];
    cgpa?: number;
    college?: string;
    collegeTier?: string;
    degree?: string;
    email?: string;
    experience?: { company?: string; duration?: string; title?: string }[];
    id?: string;
    name?: string;
    skills?: string[];
  };
  status: "applied" | "shortlisted" | "rejected" | string;
  searchMetadata?: {
    rrfScore?: number;
    bm25Score?: number;
    vectorScore?: number;
    matchedTokens?: string[];
  };
}

interface PostedJob {
  _id: string;
  title?: string;
}

type SortMode = "relevance" | "newest" | "status";

const statusOrder = { shortlisted: 0, applied: 1, rejected: 2 };

function ApplicantsPage() {
  const { user, token } = useAuth();
  const navigate = useNavigate();
  const [applications, setApplications] = useState<Applicant[]>([]);
  const [postedJobs, setPostedJobs] = useState<PostedJob[]>([]);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [jobFilter, setJobFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [profileId, setProfileId] = useState<string | null>(null);
  const [sortMode, setSortMode] = useState<SortMode>("relevance");
  const [updating, setUpdating] = useState<string | null>(null);

  useEffect(() => {
    if (user?.role === "seeker") navigate({ to: "/dashboard", replace: true });
  }, [navigate, user?.role]);

  useEffect(() => {
    if (!token) return;
    let active = true;
    const loadPipeline = async () => {
      const [applicationsResult, jobsResult] = await Promise.all([
        apiCall<Applicant[]>("/applications/recruiter", "GET", null, token).catch(() => []),
        apiCall<PostedJob[]>("/jobs", "GET", null, token).catch(() => []),
      ]);
      if (!active) return;
      setApplications(Array.isArray(applicationsResult) ? applicationsResult : []);
      setPostedJobs(Array.isArray(jobsResult) ? jobsResult : []);
      setLoading(false);
    };

    void loadPipeline();
    window.addEventListener("focus", loadPipeline);
    return () => {
      active = false;
      window.removeEventListener("focus", loadPipeline);
    };
  }, [token]);

  const jobs = useMemo(() => {
    const entries = new Map<string, string>();
    postedJobs.forEach((job) => {
      if (job._id) entries.set(job._id, job.title || "Untitled role");
    });
    applications.forEach((application) => {
      if (application.job?._id && application.job.title) entries.set(application.job._id, application.job.title);
    });
    return [...entries.entries()];
  }, [applications, postedJobs]);

  const visibleApplications = useMemo(() => {
    const term = searchQuery.trim().toLowerCase();
    const filtered = applications.filter((app) => {
      const matchesJob = jobFilter === "all" || app.job?._id === jobFilter;
      if (!matchesJob) return false;
      if (!term) return true;

      const candidateText = `${app.seeker?.name || ""} ${app.seeker?.email || ""} ${app.job?.title || ""} ${(app.seeker?.skills || []).join(" ")} ${app.seeker?.college || ""} ${app.seeker?.degree || ""} ${(app.seeker?.achievements || []).join(" ")} ${(app.seeker?.experience || []).map((e) => `${e.title || ""} ${e.company || ""}`).join(" ")}`.toLowerCase();
      return candidateText.includes(term);
    });

    return [...filtered].sort((left, right) => {
      if (sortMode === "relevance") {
        return (right.atsScore ?? -1) - (left.atsScore ?? -1) || dateValue(right) - dateValue(left);
      }
      if (sortMode === "newest") return dateValue(right) - dateValue(left);
      return (statusOrder[left.status as keyof typeof statusOrder] ?? 3) - (statusOrder[right.status as keyof typeof statusOrder] ?? 3)
        || dateValue(right) - dateValue(left);
    });
  }, [applications, jobFilter, sortMode, searchQuery]);

  const pipeline = useMemo(() => ({
    applied: applications.filter((application) => application.status === "applied").length,
    shortlisted: applications.filter((application) => application.status === "shortlisted").length,
    rejected: applications.filter((application) => application.status === "rejected").length,
  }), [applications]);
  const selectedJobTitle = jobFilter === "all" ? "" : jobs.find(([id]) => id === jobFilter)?.[1] || "this role";

  async function setStatus(id: string, status: Applicant["status"]) {
    setUpdating(id);
    try {
      await apiCall(`/applications/${id}/status`, "PATCH", { status }, token);
      setApplications((current) => current.map((application) => application._id === id ? { ...application, status } : application));
      toast.success(`Candidate marked ${status}`);
    } catch (error: any) {
      toast.error(error.message ?? "Could not update the candidate status.");
    } finally {
      setUpdating(null);
    }
  }

  return (
    <main className="mx-auto max-w-7xl px-6 pb-16 pt-28 sm:px-10">
      <header className="flex flex-col justify-between gap-7 border-b border-border pb-8 lg:flex-row lg:items-end">
        <div>
          <p className="marker-num">Recruiting pipeline</p>
          <h1 className="font-display mt-4 text-[clamp(2.7rem,5.4vw,5.5rem)] text-ink">Applicants, in context.</h1>
          <p className="mt-5 max-w-2xl text-lg leading-relaxed text-ink/68">
            Review the evidence, choose a status, schedule live technical interviews, and message candidates directly.
          </p>
        </div>
        <Link to="/post-job" className="pill-mint gap-2">
          <BriefcaseBusiness className="h-4 w-4" aria-hidden="true" />
          Post a role
        </Link>
      </header>

      <section className="mt-8 grid divide-y divide-border border-y border-border sm:grid-cols-3 sm:divide-x sm:divide-y-0" aria-label="Pipeline counts">
        <PipelineCount label="New" value={pipeline.applied} />
        <PipelineCount label="Shortlisted" value={pipeline.shortlisted} tone="text-[#2A9D7B]" />
        <PipelineCount label="Closed" value={pipeline.rejected} tone="text-[#183A32]" />
      </section>

      <section className="surface-subtle mt-8 p-4 sm:p-5" aria-label="Applicant filters">
        <div className="grid gap-5 lg:grid-cols-[minmax(200px,0.7fr)_minmax(200px,1fr)_minmax(0,1fr)_auto] lg:items-end">
          <label className="block">
            <span className="marker-num">Search Candidates</span>
            <div className="control-surface mt-2 flex min-h-11 items-center gap-2 px-3">
              <Search className="h-4 w-4 text-ink/40" />
              <input
                type="text"
                placeholder="Name, skills, college..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-transparent text-sm placeholder:text-ink/40 focus:outline-none"
              />
            </div>
          </label>

          <label className="block">
            <span className="marker-num">Role</span>
            <select
              value={jobFilter}
              onChange={(event) => setJobFilter(event.target.value)}
              className="control-surface mt-2 min-h-11 w-full px-3 text-sm font-medium focus:border-ink focus:outline-none"
            >
              <option value="all">All roles</option>
              {jobs.map(([id, title]) => <option key={id} value={id}>{title}</option>)}
            </select>
          </label>

          <fieldset>
            <legend className="marker-num">Order</legend>
            <div className="mt-2 flex flex-wrap gap-2" role="group" aria-label="Sort applicants">
              {([
                ["relevance", "Best fit"],
                ["newest", "Most recent"],
                ["status", "Pipeline status"],
              ] as const).map(([value, label]) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setSortMode(value)}
                  aria-pressed={sortMode === value}
                  className={`min-h-10 rounded-md border px-3 text-sm font-semibold transition-colors ${
                    sortMode === value ? "border-ink bg-ink text-cream" : "border-border bg-card text-ink/70 hover:border-ink/45"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </fieldset>

          <p className="pb-1 text-sm text-ink/55">{visibleApplications.length} shown</p>
        </div>
      </section>

      <section className="mt-8 border-y border-border" aria-label="Applicant list">
        {loading ? (
          <LoadingRows />
        ) : visibleApplications.length === 0 ? (
          <div className="py-14 text-center">
            <p className="font-display text-3xl text-ink">No candidates in this view.</p>
            <p className="mt-3 text-sm text-ink/60">{selectedJobTitle ? `No candidates have applied to ${selectedJobTitle} yet.` : "Change the filters or publish a role to start receiving applications."}</p>
          </div>
        ) : (
          visibleApplications.map((application) => (
            <ApplicantRow
              key={application._id}
              application={application}
              conversationOpen={conversationId === application._id}
              currentUserId={user?._id ?? user?.id}
              onConversation={() => setConversationId((id) => id === application._id ? null : application._id)}
              onProfile={() => setProfileId((id) => id === application._id ? null : application._id)}
              onStatusChange={setStatus}
              profileOpen={profileId === application._id}
              token={token}
              updating={updating === application._id}
            />
          ))
        )}
      </section>
    </main>
  );
}

function ApplicantRow({
  application,
  conversationOpen,
  currentUserId,
  onConversation,
  onProfile,
  onStatusChange,
  profileOpen,
  token,
  updating,
}: {
  application: Applicant;
  conversationOpen: boolean;
  currentUserId?: string;
  onConversation: () => void;
  onProfile: () => void;
  onStatusChange: (id: string, status: Applicant["status"]) => Promise<void>;
  profileOpen: boolean;
  token: string | null;
  updating: boolean;
}) {
  const navigate = useNavigate();
  const candidate = application.seeker;
  const firstExperience = candidate?.experience?.[0];
  const status = supportedStatus(application.status);
  const initials = (candidate?.name || "Candidate")
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join("");

  return (
    <article className="border-b border-border px-1 py-6 last:border-b-0 sm:px-3">
      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_auto_auto] lg:items-center">
        <div className="flex min-w-0 gap-4">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-md bg-panel text-sm font-bold text-ink">
            {initials || "C"}
          </span>
          <div className="min-w-0">
            <p className="marker-num text-ink/50">{application.job?.title || "Role"}</p>
            <h2 className="mt-1 truncate text-lg font-semibold text-ink">{candidate?.name || "Candidate"}</h2>
            <p className="mt-1 truncate text-sm text-ink/55">{candidate?.email || "No email recorded"}</p>
            {firstExperience?.title ? (
              <p className="mt-2 text-sm text-ink/65">
                {firstExperience.title}{firstExperience.company ? ` | ${firstExperience.company}` : ""}
              </p>
            ) : null}
            {candidate?.skills && candidate.skills.length > 0 ? (
              <div className="mt-3 flex flex-wrap gap-1.5">
                {candidate.skills.slice(0, 5).map((skill) => (
                  <span key={skill} className="rounded-md bg-panel px-2 py-1 text-xs font-medium text-ink/70">{skill}</span>
                ))}
              </div>
            ) : null}
          </div>
        </div>

        <div className="flex items-center gap-3 lg:justify-center">
          {typeof application.atsScore === "number" ? (
            <>
              <AtsScoreRing score={application.atsScore} size={52} />
              <div className="lg:hidden">
                <p
                  className="text-sm font-semibold"
                  style={{ color: getScoreGreenShade(application.atsScore) }}
                >
                  {Math.round(application.atsScore)}% fit
                </p>
                <p className="text-xs text-ink/55">ATS relevance</p>
              </div>
            </>
          ) : (
            <p className="text-sm text-ink/55">Score pending</p>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2 lg:justify-end">
          <label className="sr-only" htmlFor={`candidate-status-${application._id}`}>
            Candidate status
          </label>
          <select
            id={`candidate-status-${application._id}`}
            value={status}
            onChange={(event) => void onStatusChange(application._id, event.target.value)}
            disabled={updating}
            className={`min-h-10 rounded-md border px-3 text-sm font-semibold capitalize focus:outline-none disabled:opacity-50 ${statusClass(status)}`}
          >
            <option value="applied">Applied</option>
            <option value="shortlisted">Shortlisted</option>
            <option value="rejected">Rejected</option>
          </select>

          {status === "shortlisted" && (
            <button
              type="button"
              onClick={async () => {
                try {
                  const res = await apiCall<{ session: any }>(
                    "/interviews/schedule",
                    "POST",
                    {
                      applicationId: application._id,
                      title: `Technical Interview: ${application.job?.title || "Engineering"}`,
                      scheduledStart: new Date(Date.now() + 3600000).toISOString(),
                      allowedLanguages: ["python", "javascript", "typescript", "cpp", "java"],
                    },
                    token
                  );
                  toast.success("Interview room generated!");
                  if (res.session?.roomKey) {
                    navigate({ to: "/interview/$roomKey", params: { roomKey: res.session.roomKey } });
                  }
                } catch (err: any) {
                  toast.error(err.message || "Failed scheduling interview");
                }
              }}
              className="inline-flex min-h-10 items-center gap-2 rounded-md bg-[#2A9D7B] px-3.5 text-sm font-semibold text-white transition-colors hover:bg-[#238266]"
            >
              <Video className="h-4 w-4" />
              Launch Interview
            </button>
          )}

          <button
            type="button"
            onClick={onProfile}
            aria-expanded={profileOpen}
            className="inline-flex min-h-10 items-center gap-2 rounded-md border border-border px-3 text-sm font-semibold text-ink transition-colors hover:bg-panel"
          >
            <UserRound className="h-4 w-4" aria-hidden="true" />
            {profileOpen ? "Close profile" : "Profile"}
          </button>
          <button
            type="button"
            onClick={onConversation}
            aria-expanded={conversationOpen}
            className={`inline-flex min-h-10 items-center gap-2 rounded-xl px-3.5 text-sm font-semibold transition-all ${
              conversationOpen
                ? "bg-emerald-600 text-white shadow-sm hover:bg-emerald-700"
                : "border border-border text-ink hover:border-emerald-600 hover:bg-emerald-500/10 hover:text-emerald-700"
            }`}
          >
            <MessageSquare className="h-4 w-4" aria-hidden="true" />
            {conversationOpen ? "Hide Chat" : "Message"}
          </button>
        </div>
      </div>

      <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-border pt-4 text-sm text-ink/55">
        <span className="inline-flex items-center gap-2">
          <CalendarDays className="h-4 w-4" aria-hidden="true" />
          Applied {formatDate(application.createdAt)}
        </span>
        {typeof application.atsScore === "number" ? (
          <span className="hidden font-semibold text-ink/72 lg:inline">
            {Math.round(application.atsScore)}% ATS fit
          </span>
        ) : null}
      </div>

      {profileOpen ? <ApplicantProfile applicant={candidate} /> : null}
      {profileOpen && application.atsBreakdown ? (
        <div className="mt-5 border-t border-border pt-5">
          <AtsBreakdown breakdown={application.atsBreakdown} />
        </div>
      ) : null}
      {conversationOpen && token ? (
        <ApplicationConversation
          applicationId={application._id}
          counterpartName={candidate?.name || "candidate"}
          currentUserId={currentUserId}
          token={token}
        />
      ) : null}
    </article>
  );
}

function ApplicantProfile({ applicant }: { applicant?: Applicant["seeker"] }) {
  const achievements = applicant?.achievements ?? [];
  const experience = applicant?.experience ?? [];

  return (
    <section aria-label="Candidate profile" className="mt-5 grid gap-8 border-t border-border pt-5 lg:grid-cols-3">
      <div>
        <p className="marker-num">Education</p>
        <div className="mt-3 space-y-2 text-sm leading-6 text-ink/70">
          <p className="flex gap-2"><GraduationCap className="mt-1 h-4 w-4 shrink-0 text-ink/45" aria-hidden="true" />{applicant?.degree || "No degree recorded"}</p>
          <p>{[applicant?.college, applicant?.cgpa !== undefined ? `CGPA ${applicant.cgpa}` : "", applicant?.collegeTier && applicant.collegeTier !== "unknown" ? applicant.collegeTier.toUpperCase() : ""].filter(Boolean).join(" | ") || "No education details recorded"}</p>
        </div>
      </div>
      <div>
        <p className="marker-num">Experience</p>
        <div className="mt-3 space-y-3">
          {experience.length > 0 ? experience.map((entry, index) => (
            <div key={`${entry.title}-${index}`} className="flex gap-2 text-sm leading-6 text-ink/70">
              <BriefcaseBusiness className="mt-1 h-4 w-4 shrink-0 text-ink/45" aria-hidden="true" />
              <p><span className="font-semibold text-ink">{entry.title || "Experience"}</span><br />{[entry.company, entry.duration].filter(Boolean).join(" | ") || "Details not recorded"}</p>
            </div>
          )) : <p className="text-sm text-ink/60">No experience details recorded.</p>}
        </div>
      </div>
      <div>
        <p className="marker-num">Achievements</p>
        <div className="mt-3 space-y-3">
          {achievements.length > 0 ? achievements.map((achievement, index) => (
            <p key={`${achievement}-${index}`} className="flex gap-2 text-sm leading-6 text-ink/70"><Award className="mt-1 h-4 w-4 shrink-0 text-warm" aria-hidden="true" />{achievement}</p>
          )) : <p className="text-sm text-ink/60">No achievements recorded.</p>}
        </div>
      </div>
    </section>
  );
}

function PipelineCount({ label, tone = "text-ink", value }: { label: string; tone?: string; value: number }) {
  return (
    <div className="py-5 sm:px-6 sm:first:pl-0">
      <p className="marker-num">{label}</p>
      <p className={`font-display mt-2 text-4xl ${tone}`}>{value}</p>
    </div>
  );
}

function LoadingRows() {
  return (
    <div className="divide-y divide-border">
      {Array.from({ length: 4 }).map((_, index) => <div key={index} className="h-36 animate-pulse bg-card/40" />)}
    </div>
  );
}

function dateValue(application: Applicant) {
  const date = application.createdAt ? new Date(application.createdAt).getTime() : 0;
  return Number.isFinite(date) ? date : 0;
}

function formatDate(value?: string) {
  if (!value) return "recently";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "recently" : date.toLocaleDateString();
}

function supportedStatus(status: string) {
  return status === "shortlisted" || status === "rejected" ? status : "applied";
}

function statusClass(status: string) {
  if (status === "shortlisted") return "border-[#8DDCBE] bg-[#E9FBF2] text-[#1E7058]";
  if (status === "rejected") return "border-[#B6DCCB] bg-[#F2FAF6] text-[#335E50]";
  return "border-[#C5EBDD] bg-[#EFFBF5] text-[#23765E]";
}
