import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, BookOpen, BrainCircuit, Code2, Database, Gamepad2, Trophy } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis } from "recharts";
import { Metric } from "@/components/dashboard/Metric";
import { PipelineBar, PipelineDatum } from "@/components/dashboard/PipelineBar";
import { EmptyGraphic, StatusLabel } from "@/components/dashboard/StatusLabel";
import { RecruiterLeaderboard } from "@/components/dashboard/RecruiterLeaderboard";
import { useAuth } from "@/lib/auth";
import { apiCall } from "@/lib/api";

export const Route = createFileRoute("/_app/dashboard")({
  head: () => ({
    meta: [
      { title: "Overview | Jobly" },
      { name: "description", content: "Your Jobly workspace overview." },
    ],
  }),
  component: Dashboard,
});

interface JobSummary {
  _id: string;
  applicationCount?: number;
  company?: string;
  createdAt?: string;
  latestApplicationAt?: string | null;
  shortlistedCount?: number;
  title?: string;
}

interface ApplicationSummary {
  _id: string;
  atsScore?: number;
  createdAt?: string;
  seeker?: { name?: string };
  job?: { company?: string; title?: string };
  status?: string;
}

function Dashboard() {
  const { user, token } = useAuth();
  const [jobs, setJobs] = useState<JobSummary[]>([]);
  const [applications, setApplications] = useState<ApplicationSummary[]>([]);

  useEffect(() => {
    if (!token) return;

    let active = true;
    const loadWorkspace = async () => {
      const [jobsResult, applicationsResult] = await Promise.all([
        apiCall<unknown[]>(user?.role === "recruiter" ? "/jobs" : "/jobs/match", "GET", null, token).catch(() => []),
        apiCall<unknown[]>(
          user?.role === "recruiter" ? "/applications/recruiter" : "/applications/me",
          "GET",
          null,
          token,
        ).catch(() => []),
      ]);

      if (!active) return;
      setJobs(Array.isArray(jobsResult) ? jobsResult as JobSummary[] : []);
      setApplications(Array.isArray(applicationsResult) ? applicationsResult as ApplicationSummary[] : []);
    };

    const reloadWhenVisible = () => {
      if (document.visibilityState === "visible") void loadWorkspace();
    };

    void loadWorkspace();
    window.addEventListener("focus", loadWorkspace);
    document.addEventListener("visibilitychange", reloadWhenVisible);
    return () => {
      active = false;
      window.removeEventListener("focus", loadWorkspace);
      document.removeEventListener("visibilitychange", reloadWhenVisible);
    };
  }, [token, user?.id, user?._id, user?.role, user?.resumeText]);

  const isRecruiter = user?.role === "recruiter";
  const workspace = useMemo(() => summarizeWorkspace(jobs, applications), [jobs, applications]);

  return isRecruiter ? (
    <RecruiterOverview name={user?.name} workspace={workspace} />
  ) : (
    <CandidateOverview hasResume={Boolean(user?.resumeText)} name={user?.name} workspace={workspace} />
  );
}

function RecruiterOverview({ name, workspace }: { name?: string; workspace: WorkspaceSummary }) {
  const firstName = name?.trim().split(/\s+/)[0] || "there";

  return (
    <main className="mx-auto max-w-7xl px-6 pb-16 pt-28 sm:px-10">
      <header className="flex flex-col justify-between gap-8 border-b border-border pb-8 lg:flex-row lg:items-end">
        <div className="max-w-3xl">
          <p className="marker-num">Recruiting workspace | live pipeline</p>
          <h1 className="font-display mt-4 text-[clamp(2.7rem,5.4vw,5.5rem)] text-ink">
            Good to see you, {firstName}.
          </h1>
          <p className="mt-5 max-w-2xl text-lg leading-relaxed text-ink/68">
            Your current hiring picture, grounded in the roles and candidates already in the workspace.
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <Link to="/post-job" className="pill-mint">
            Post a role
          </Link>
          <Link
            to="/applicants"
            className="inline-flex min-h-10 items-center rounded-md border border-border px-4 text-sm font-semibold text-ink transition-colors hover:bg-ink hover:text-cream"
          >
            Review applicants
          </Link>
        </div>
      </header>

      <dl className="grid divide-y divide-border border-b border-border sm:grid-cols-2 sm:divide-x sm:divide-y-0 lg:grid-cols-4">
        <Metric label="Open roles" value={workspace.jobs.length} />
        <Metric label="Applications" value={workspace.applications.length} />
        <Metric label="Average fit" value={workspace.averageScore} suffix="%" />
        <Metric label="Shortlisted" value={workspace.shortlisted} />
      </dl>

      <section className="mt-10 border-y border-border py-7" aria-labelledby="posted-roles-heading">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="marker-num">Published roles</p>
            <h2 id="posted-roles-heading" className="font-display mt-2 text-3xl text-ink">Everything you have posted.</h2>
          </div>
          <Link to="/post-job" className="text-sm font-semibold text-ink hover:text-ink/65">Post another role</Link>
        </div>
        <div className="mt-6 divide-y divide-border">
          {workspace.jobs.length > 0 ? workspace.jobs.map((job) => (
            <Link
              key={job._id}
              to="/applicants"
              className="hover-row grid gap-3 py-4 sm:grid-cols-[minmax(0,1fr)_auto_auto] sm:items-center"
            >
              <div className="min-w-0">
                <p className="truncate font-semibold text-ink">{job.title || "Untitled role"}</p>
                <p className="mt-1 truncate text-sm text-ink/55">{[job.company || "Company not specified", `Posted ${formatDate(job.createdAt)}`].join(" | ")}</p>
              </div>
              <p className="text-sm font-semibold text-ink/72">{formatApplicantCount(job.applicationCount)}</p>
              <p className="text-sm text-ink/55">{job.shortlistedCount ? `${job.shortlistedCount} shortlisted` : job.latestApplicationAt ? `Last activity ${formatDate(job.latestApplicationAt)}` : "No applicants yet"}</p>
            </Link>
          )) : <p className="py-8 text-sm leading-6 text-ink/60">No roles have been posted yet. Publish one when you are ready to start the pipeline.</p>}
        </div>
      </section>

      <section className="mt-10 grid gap-6 lg:grid-cols-[minmax(0,1.4fr)_minmax(300px,0.8fr)]">
        <motion.section
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45 }}
          className="surface p-6 sm:p-7"
          aria-labelledby="application-activity-heading"
        >
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="marker-num">Applicant activity</p>
              <h2 id="application-activity-heading" className="font-display mt-2 text-2xl text-ink">Last seven days</h2>
            </div>
            <p className="text-sm text-ink/55">Live application volume</p>
          </div>
          <div className="mt-7 h-52 sm:h-64">
            {workspace.applications.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={workspace.activity} margin={{ bottom: 0, left: -20, right: 0, top: 4 }}>
                  <XAxis
                    axisLine={false}
                    dataKey="label"
                    tick={{ fill: "#183A32B3", fontSize: 12 }}
                    tickLine={false}
                  />
                  <Tooltip
                    contentStyle={{ border: "1px solid #C5EBDD", borderRadius: 8, boxShadow: "0 14px 30px -22px rgba(24, 58, 50, 0.28)" }}
                    cursor={{ stroke: "#A9EBD1", strokeWidth: 1 }}
                    formatter={(value) => [value, "Applications"]}
                  />
                  <Area
                    dataKey="applications"
                    fill="#E9FBF2"
                    fillOpacity={0.82}
                    stroke="#2A9D7B"
                    strokeWidth={2.25}
                    type="monotone"
                  />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <EmptyGraphic label="Application activity will appear here once candidates apply." />
            )}
          </div>
        </motion.section>

        <section className="surface p-6 sm:p-7" aria-labelledby="pipeline-heading">
          <p className="marker-num">Pipeline composition</p>
          <h2 id="pipeline-heading" className="font-display mt-2 text-2xl text-ink">Where candidates are now</h2>
          <div className="mt-8 space-y-6">
            <PipelineBar label="New" value={workspace.applied} total={workspace.applications.length} color="bg-[#C5EBDD]" />
            <PipelineBar label="Shortlisted" value={workspace.shortlisted} total={workspace.applications.length} color="bg-[#8DDCBE]" />
            <PipelineBar label="Closed" value={workspace.rejected} total={workspace.applications.length} color="bg-[#70B99D]" />
          </div>
          <Link to="/applicants" className="mt-9 inline-flex items-center gap-2 text-sm font-semibold text-ink hover:text-ink/65">
            Open candidate pipeline
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </Link>
        </section>
      </section>

      <section className="mt-10 border-y border-border py-7" aria-labelledby="recent-applicants-heading">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="marker-num">Latest activity</p>
            <h2 id="recent-applicants-heading" className="font-display mt-2 text-3xl text-ink">Recent candidates</h2>
          </div>
          <Link to="/applicants" className="text-sm font-semibold text-ink hover:text-ink/65">See all applicants</Link>
        </div>
        <div className="mt-6 divide-y divide-border">
          {workspace.recentApplications.length > 0 ? workspace.recentApplications.map((application) => (
            <div key={application._id} className="grid gap-3 py-4 sm:grid-cols-[minmax(0,1fr)_auto_auto] sm:items-center">
              <div className="min-w-0">
                <p className="truncate font-semibold text-ink">{application.seeker?.name || "Candidate"}</p>
                <p className="mt-1 truncate text-sm text-ink/55">{application.job?.title || "Role"}</p>
              </div>
              <StatusLabel status={application.status} />
              <p className="text-sm font-semibold text-ink/72">{typeof application.atsScore === "number" ? `${Math.round(application.atsScore)}% fit` : "Score pending"}</p>
            </div>
          )) : <p className="py-8 text-sm leading-6 text-ink/60">No candidate activity yet. Publish a role when you are ready to start the pipeline.</p>}
        </div>
      </section>

      {/* Recruiter Hiring Velocity Leaderboard */}
      <section className="mt-10">
        <RecruiterLeaderboard />
      </section>
    </main>
  );
}

function CandidateOverview({
  hasResume,
  name,
  workspace,
}: {
  hasResume: boolean;
  name?: string;
  workspace: WorkspaceSummary;
}) {
  const firstName = name?.trim().split(/\s+/)[0] || "there";
  const primaryPath = hasResume ? "/jobs" : "/resume";
  const primaryLabel = hasResume ? "Browse matched roles" : "Upload your resume";

  return (
    <main className="mx-auto max-w-7xl px-6 pb-16 pt-28 sm:px-10">
      <header className="flex flex-col justify-between gap-8 border-b border-border pb-8 lg:flex-row lg:items-end">
        <div className="max-w-3xl">
          <p className="marker-num">Candidate workspace</p>
          <h1 className="font-display mt-4 text-[clamp(2.7rem,5.4vw,5.5rem)] text-ink">Welcome back, {firstName}.</h1>
          <p className="mt-5 max-w-2xl text-lg leading-relaxed text-ink/68">
            {hasResume
              ? "Your resume is ready. Review where your experience aligns, then keep every application in view."
              : "Upload a resume to turn it into a profile and see evidence-led role matches."}
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <Link to={primaryPath} className="pill-mint">
            {primaryLabel}
          </Link>
          <Link
            to="/applications"
            className="inline-flex min-h-10 items-center rounded-md border border-border px-4 text-sm font-semibold text-ink transition-colors hover:bg-ink hover:text-cream"
          >
            Applications
          </Link>
        </div>
      </header>

      <dl className="grid divide-y divide-border border-b border-border sm:grid-cols-3 sm:divide-x sm:divide-y-0">
        <Metric label="Matched roles" value={workspace.jobs.length} />
        <Metric label="Applications" value={workspace.applications.length} />
        <Metric label="Average fit" value={workspace.averageScore} suffix="%" />
      </dl>

      <section className="mt-10 grid gap-6 lg:grid-cols-[minmax(0,1.25fr)_minmax(300px,0.75fr)]">
        <section className="surface p-6 sm:p-7" aria-labelledby="candidate-pulse-heading">
          <p className="marker-num">Application pulse</p>
          <h2 id="candidate-pulse-heading" className="font-display mt-2 text-2xl text-ink">Your pipeline at a glance</h2>
          <div className="mt-8 grid gap-5 sm:grid-cols-3">
            <PipelineDatum label="Submitted" value={workspace.applied} />
            <PipelineDatum label="Shortlisted" value={workspace.shortlisted} tone="text-[#2A9D7B]" />
            <PipelineDatum label="Closed" value={workspace.rejected} tone="text-[#183A32]" />
          </div>
          <Link to="/applications" className="mt-9 inline-flex items-center gap-2 text-sm font-semibold text-ink hover:text-ink/65">
            Review your applications
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </Link>
        </section>

        <section className="surface p-6 sm:p-7">
          <p className="marker-num">Next best move</p>
          <h2 className="font-display mt-2 text-2xl text-ink">{hasResume ? "Explore fit, not just volume." : "Build the profile first."}</h2>
          <p className="mt-4 text-sm leading-6 text-ink/65">
            {hasResume
              ? "Each role can show a detailed score before you apply, so you can decide with the requirements in view."
              : "Your resume unlocks role matching, score explanations, and a clearer application history."}
          </p>
        </section>
      </section>

      {/* Seeker Skill Elevation & Live Multiplayer Arenas */}
      <section className="mt-10 border-t border-border pt-10" aria-labelledby="skill-elevation-heading">
        <div>
          <p className="marker-num">Skill development & live competitions</p>
          <h2 id="skill-elevation-heading" className="font-display mt-2 text-3xl text-ink">Interview Preparation & Battle Arenas</h2>
          <p className="mt-2 text-sm text-ink/65">
            Strengthen your core engineering fundamentals, track Codeforces ratings, and battle peers in real-time.
          </p>
        </div>

        <div className="mt-8 grid gap-6 md:grid-cols-3">
          {/* Section 1: Study Hub & System Design Oracle */}
          <div className="surface flex flex-col justify-between p-6 transition-all hover:border-ink/30">
            <div>
              <div className="text-xs font-semibold uppercase tracking-wider text-ink/70">
                Curriculum
              </div>
              <h3 className="font-display mt-3 text-xl font-bold text-ink">Study Hub & DSA</h3>
              <p className="mt-2 text-sm leading-relaxed text-ink/65">
                Personalized interview weakness remediation, structured DSA checklist, and Codeforces rating tracker.
              </p>
            </div>
            <Link
              to="/learn"
              search={{ tab: "DSA" }}
              className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-ink hover:text-ink/65"
            >
              Open Study Hub
              <ArrowRight className="h-4 w-4 shrink-0" strokeWidth={2} />
            </Link>
          </div>

          {/* Section 2: Live Kahoot-Style Quiz Battles */}
          <div className="surface flex flex-col justify-between p-6 transition-all hover:border-ink/30">
            <div>
              <div className="text-xs font-semibold uppercase tracking-wider text-ink/70">
                Assessment
              </div>
              <h3 className="font-display mt-3 text-xl font-bold text-ink">Live Quiz Battles</h3>
              <p className="mt-2 text-sm leading-relaxed text-ink/65">
                Multiplayer Kahoot-style real-time technical quiz lobbies with speed multipliers and live leaderboards.
              </p>
            </div>
            <Link
              to="/learn"
              search={{ tab: "ARENA" }}
              className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-ink hover:text-ink/65"
            >
              Enter Quiz Arena
              <ArrowRight className="h-4 w-4 shrink-0" strokeWidth={2} />
            </Link>
          </div>

          {/* Section 3: Competitive Programming (CP) Arena */}
          <div className="surface flex flex-col justify-between p-6 transition-all hover:border-ink/30">
            <div>
              <div className="text-xs font-semibold uppercase tracking-wider text-ink/70">
                Competition
              </div>
              <h3 className="font-display mt-3 text-xl font-bold text-ink">CP Battle Arena</h3>
              <p className="mt-2 text-sm leading-relaxed text-ink/65">
                Head-to-head competitive coding battles with instant sandbox judging, test cases, and real-time scoreboards.
              </p>
            </div>
            <Link
              to="/learn"
              search={{ tab: "ARENA" }}
              className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-ink hover:text-ink/65"
            >
              Launch CP Match
              <ArrowRight className="h-4 w-4 shrink-0" strokeWidth={2} />
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}

interface WorkspaceSummary {
  activity: { applications: number; label: string }[];
  applied: number;
  applications: ApplicationSummary[];
  averageScore: number;
  jobs: JobSummary[];
  recentApplications: ApplicationSummary[];
  rejected: number;
  shortlisted: number;
}

function summarizeWorkspace(jobs: JobSummary[], applications: ApplicationSummary[]): WorkspaceSummary {
  const scoredApplications = applications.filter((application) => typeof application.atsScore === "number");
  const averageScore = scoredApplications.length > 0
    ? Math.round(scoredApplications.reduce((sum, application) => sum + (application.atsScore ?? 0), 0) / scoredApplications.length)
    : 0;
  const applied = applications.filter((application) => application.status !== "shortlisted" && application.status !== "rejected").length;
  const shortlisted = applications.filter((application) => application.status === "shortlisted").length;
  const rejected = applications.filter((application) => application.status === "rejected").length;
  const activity = buildActivity(applications);
  const recentApplications = [...applications]
    .sort((left, right) => dateValue(right.createdAt) - dateValue(left.createdAt))
    .slice(0, 5);

  return { activity, applied, applications, averageScore, jobs, recentApplications, rejected, shortlisted };
}

function buildActivity(applications: ApplicationSummary[]) {
  const formatter = new Intl.DateTimeFormat(undefined, { weekday: "short" });
  const days = Array.from({ length: 7 }, (_, index) => {
    const date = new Date();
    date.setHours(0, 0, 0, 0);
    date.setDate(date.getDate() - (6 - index));
    return {
      applications: 0,
      key: date.toISOString().slice(0, 10),
      label: formatter.format(date),
    };
  });
  const byDate = new Map(days.map((day) => [day.key, day]));

  applications.forEach((application) => {
    if (!application.createdAt) return;
    const date = new Date(application.createdAt);
    if (Number.isNaN(date.getTime())) return;
    const day = byDate.get(date.toISOString().slice(0, 10));
    if (day) day.applications += 1;
  });

  return days.map(({ applications: count, label }) => ({ applications: count, label }));
}

function dateValue(value?: string) {
  const date = value ? new Date(value).getTime() : 0;
  return Number.isFinite(date) ? date : 0;
}

function formatDate(value?: string | null) {
  if (!value) return "recently";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "recently" : date.toLocaleDateString();
}

function formatApplicantCount(value?: number) {
  const count = Number.isFinite(value) ? Math.max(0, Math.floor(value as number)) : 0;
  return `${count} applicant${count === 1 ? "" : "s"}`;
}
