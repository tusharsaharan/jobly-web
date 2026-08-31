import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import {
  ArrowRight,
  Check,
  ClipboardCheck,
  FileText,
  Loader2,
  Search,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { AtsBreakdown, AtsScoreRing } from "@/components/ui/AtsScoreRing";
import { useAuth } from "@/lib/auth";
import { apiCall } from "@/lib/api";

export const Route = createFileRoute("/_app/jobs")({
  head: () => ({
    meta: [
      { title: "Jobs | Jobly" },
      { name: "description", content: "Explore every posted role with clear fit and eligibility context." },
    ],
  }),
  component: JobsPage,
});

interface Job {
  _id: string;
  applied?: boolean;
  atsBreakdown?: unknown;
  atsRequirements?: {
    minCgpa?: number;
    minExperienceYears?: number;
    requiredDegree?: string;
    targetCollegeTier?: string;
  };
  atsScore?: number;
  atsTips?: string[];
  company?: string;
  description: string;
  eligible?: boolean;
  eligibilityReasons?: string[];
  match?: number;
  skills: string[];
  title: string;
}

function JobsPage() {
  const { token, user } = useAuth();
  const navigate = useNavigate();
  const [applying, setApplying] = useState<string | null>(null);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [scoreExpandedId, setScoreExpandedId] = useState<string | null>(null);
  const [scoring, setScoring] = useState<string | null>(null);

  useEffect(() => {
    if (user?.role === "recruiter") navigate({ to: "/dashboard", replace: true });
  }, [navigate, user?.role]);

  useEffect(() => {
    if (!token) return;
    Promise.all([
      apiCall<unknown[]>("/jobs/match", "GET", null, token),
      apiCall<unknown[]>("/applications/me", "GET", null, token).catch(() => []),
    ])
      .then(([matchedJobs, applications]) => {
        const safeJobs = Array.isArray(matchedJobs) ? matchedJobs as Array<Job & { score?: number }> : [];
        const safeApplications = Array.isArray(applications) ? applications as { job?: string | { _id?: string } }[] : [];
        const appliedIds = new Set(safeApplications.map((application) => (
          application.job && typeof application.job === "object" ? application.job._id : application.job
        )));

        setJobs(safeJobs.map((job) => ({
          ...job,
          applied: appliedIds.has(job._id),
          description: typeof job.description === "string" ? job.description : "",
          eligible: job.eligible !== false,
          eligibilityReasons: Array.isArray(job.eligibilityReasons) ? job.eligibilityReasons : [],
          match: job.score,
          skills: Array.isArray(job.skills) ? job.skills : [],
        })));
      })
      .catch((error) => {
        console.error(error);
        setJobs([]);
      })
      .finally(() => setLoading(false));
  }, [token, user?.id, user?._id, user?.resumeText, user?.role]);

  async function apply(jobId: string) {
    if (applying) return;
    if (!user?.resumeText) {
      toast.error("Upload your resume before applying.");
      return;
    }

    setApplying(jobId);
    try {
      const application = await apiCall<any>(`/applications/${jobId}`, "POST", {}, token);
      setJobs((current) => current.map((job) => job._id === jobId ? {
        ...job,
        applied: true,
        atsBreakdown: application?.atsBreakdown ?? job.atsBreakdown,
        atsScore: application?.atsScore ?? job.atsScore,
        atsTips: application?.atsTips ?? job.atsTips,
      } : job));
      toast.success("Application sent");
    } catch (error: any) {
      toast.error(error.message ?? "Could not apply to this role.");
    } finally {
      setApplying(null);
    }
  }

  async function checkScore(jobId: string) {
    if (scoring) return;
    if (!user?.resumeText) {
      toast.error("Upload your resume to calculate a fit score.");
      return;
    }

    setScoring(jobId);
    try {
      const response = await apiCall<any>(`/jobs/${jobId}/ats-score`, "GET", null, token);
      setJobs((current) => current.map((job) => job._id === jobId ? {
        ...job,
        atsBreakdown: response.breakdown,
        atsScore: response.score,
        atsTips: response.tips,
      } : job));
      setScoreExpandedId(jobId);
    } catch (error: any) {
      toast.error(error.message ?? "Could not calculate a fit score.");
    } finally {
      setScoring(null);
    }
  }

  const filteredJobs = useMemo(() => jobs.filter((job) => {
    const normalized = query.trim().toLowerCase();
    return !normalized
      || job.title?.toLowerCase().includes(normalized)
      || job.company?.toLowerCase().includes(normalized)
      || job.skills?.some((skill) => skill.toLowerCase().includes(normalized));
  }), [jobs, query]);

  return (
    <main className="mx-auto max-w-7xl px-6 pb-16 pt-28 sm:px-10">
      <header className="flex flex-col justify-between gap-7 border-b border-border pb-8 lg:flex-row lg:items-end">
        <div>
          <p className="marker-num">Role intelligence</p>
          <h1 className="font-display mt-4 text-[clamp(2.7rem,5.4vw,5.5rem)] text-ink">Opportunities, with context.</h1>
          <p className="mt-5 max-w-2xl text-lg leading-relaxed text-ink/68">
            Every posted role stays visible here. Check fit, inspect the evidence, and see any eligibility rule before you apply.
          </p>
        </div>
        <label className="control-surface flex min-h-11 w-full items-center gap-3 px-3 lg:max-w-sm">
          <Search className="h-4 w-4 shrink-0 text-ink/45" aria-hidden="true" />
          <span className="sr-only">Search roles</span>
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search title, company, or skill"
            className="min-w-0 flex-1 bg-transparent text-sm text-ink placeholder:text-ink/40 focus:outline-none"
          />
        </label>
      </header>

      <div className="mt-7 flex flex-wrap items-center justify-between gap-3 text-sm text-ink/55" aria-live="polite">
        <span>{loading ? "Finding posted roles..." : `${filteredJobs.length} role${filteredJobs.length === 1 ? "" : "s"} available`}</span>
        <span>{user?.resumeText ? "Scores use your current resume" : "Add a resume to unlock scoring"}</span>
      </div>

      <section className="mt-6 grid gap-5 md:grid-cols-2 xl:grid-cols-3" aria-label="Posted roles">
        {loading ? <LoadingCards /> : null}
        {!loading && filteredJobs.length === 0 ? <EmptyRoles hasResume={Boolean(user?.resumeText)} /> : null}
        {!loading && filteredJobs.map((job, index) => (
          <motion.article
            key={job._id}
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.32, delay: Math.min(index * 0.035, 0.2) }}
            className="surface flex min-h-[430px] flex-col p-5"
          >
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0">
                <p className="marker-num truncate text-ink/50">{job.company || "Company"}</p>
                <h2 className="font-display mt-2 text-2xl leading-tight text-ink">{job.title}</h2>
              </div>
              {typeof job.match === "number" ? (
                <div className="shrink-0 border-l border-border pl-3 text-right">
                  <p className="font-display text-3xl text-[#2A9D7B]">{Math.round(job.match)}%</p>
                  <p className="mt-1 text-xs font-semibold text-ink/50">Role fit</p>
                </div>
              ) : null}
            </div>

            <p className="mt-5 line-clamp-3 text-sm leading-6 text-ink/68">{job.description}</p>

            {job.skills.length > 0 ? (
              <div className="mt-5 flex flex-wrap gap-1.5">
                {job.skills.slice(0, 5).map((skill) => (
                  <span key={skill} className="rounded-md bg-panel px-2 py-1 text-xs font-medium text-ink/70">{skill}</span>
                ))}
              </div>
            ) : null}

            <Requirements requirements={job.atsRequirements} />

            <div className="mt-auto border-t border-border pt-5">
              {typeof job.atsScore === "number" ? (
                <div>
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <AtsScoreRing score={job.atsScore} size={48} />
                      <div>
                        <p className="text-sm font-semibold text-ink">Profile fit</p>
                        <p className="text-xs text-ink/55">Based on your resume</p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setScoreExpandedId((id) => id === job._id ? null : job._id)}
                      aria-expanded={scoreExpandedId === job._id}
                      className="text-sm font-semibold text-ink underline decoration-ink/30 underline-offset-4 hover:decoration-ink"
                    >
                      {scoreExpandedId === job._id ? "Hide evidence" : "View evidence"}
                    </button>
                  </div>
                  {scoreExpandedId === job._id ? <AtsBreakdown breakdown={job.atsBreakdown} tips={job.atsTips} /> : null}
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => void checkScore(job._id)}
                  disabled={scoring === job._id}
                  className="inline-flex min-h-10 items-center gap-2 text-sm font-semibold text-ink transition-colors hover:text-ink/65 disabled:opacity-50"
                >
                  {scoring === job._id ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : <ClipboardCheck className="h-4 w-4" aria-hidden="true" />}
                  {scoring === job._id ? "Calculating fit" : "Analyze profile fit"}
                </button>
              )}

              <div className="mt-5">
                {job.applied ? (
                  <div className="flex items-center justify-between gap-3 border border-[#8DDCBE] bg-[#E9FBF2] px-3 py-2.5 text-sm text-[#1E7058]">
                    <span className="inline-flex items-center gap-2 font-semibold"><Check className="h-4 w-4" aria-hidden="true" />Application sent</span>
                    <Link to="/applications" className="font-semibold underline underline-offset-4">Track it</Link>
                  </div>
                ) : !user?.resumeText ? (
                  <Link to="/resume" className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-md bg-ink px-4 text-sm font-semibold text-cream transition-colors hover:bg-ink/85">
                    <FileText className="h-4 w-4" aria-hidden="true" />
                    Add resume to apply
                  </Link>
                ) : job.eligible === false ? (
                  <div className="border border-[#A9EBD1] bg-[#ECFBF4] px-3 py-2.5 text-sm text-[#1E7058]">
                    <p className="font-semibold">Requirements not met</p>
                    <p className="mt-1 leading-5 text-[#276D59]">{job.eligibilityReasons?.[0] || "This role has a requirement your current profile does not meet."}</p>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => void apply(job._id)}
                    disabled={applying === job._id}
                    className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-md bg-ink px-4 text-sm font-semibold text-cream transition-colors hover:bg-ink/85 disabled:opacity-55"
                  >
                    {applying === job._id ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : null}
                    {applying === job._id ? "Sending application" : "Apply to role"}
                    {applying === job._id ? null : <ArrowRight className="h-4 w-4" aria-hidden="true" />}
                  </button>
                )}
              </div>
            </div>
          </motion.article>
        ))}
      </section>
    </main>
  );
}

function Requirements({ requirements }: { requirements?: Job["atsRequirements"] }) {
  if (!requirements) return null;
  const rules = [
    requirements.minCgpa && requirements.minCgpa > 0 ? `CGPA ${requirements.minCgpa}+` : "",
    requirements.minExperienceYears && requirements.minExperienceYears > 0 ? `${requirements.minExperienceYears}+ years` : "",
    requirements.targetCollegeTier && requirements.targetCollegeTier !== "any" ? requirements.targetCollegeTier.toUpperCase() : "",
    requirements.requiredDegree ? requirements.requiredDegree : "",
  ].filter(Boolean);

  return rules.length > 0 ? (
    <div className="mt-5 border-l-2 border-[#2A9D7B] pl-3">
      <p className="marker-num text-ink/50">Role requirements</p>
      <p className="mt-1 text-xs leading-5 text-ink/65">{rules.join(" | ")}</p>
    </div>
  ) : null;
}

function EmptyRoles({ hasResume }: { hasResume: boolean }) {
  return (
    <div className="surface col-span-full flex min-h-64 flex-col items-center justify-center px-6 text-center">
      <p className="font-display text-3xl text-ink">{hasResume ? "No roles match that search." : "Your resume unlocks scoring."}</p>
      <p className="mt-3 max-w-md text-sm leading-6 text-ink/60">
        {hasResume ? "Try a different title, company, or skill. New roles will appear here as they are posted." : "You can browse every role now. Upload a PDF resume when you are ready to see fit evidence and apply."}
      </p>
      {!hasResume ? <Link to="/resume" className="pill-mint mt-6 gap-2"><FileText className="h-4 w-4" aria-hidden="true" />Upload resume</Link> : null}
    </div>
  );
}

function LoadingCards() {
  return <>{Array.from({ length: 6 }).map((_, index) => <div key={index} className="h-[430px] animate-pulse rounded-md border border-border bg-card/45" />)}</>;
}
