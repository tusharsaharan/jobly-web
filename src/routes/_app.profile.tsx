import { createFileRoute, Link } from "@tanstack/react-router";
import { BriefcaseBusiness, FileText, GraduationCap, Mail, Sparkles } from "lucide-react";
import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth";
import { apiCall } from "@/lib/api";

export const Route = createFileRoute("/_app/profile")({
  head: () => ({
    meta: [
      { title: "Profile | JobMatch" },
      { name: "description", content: "Your JobMatch profile." },
    ],
  }),
  component: ProfilePage,
});

function ProfilePage() {
  const { user, token } = useAuth();
  const [recruiterStats, setRecruiterStats] = useState({ jobs: 0, applicants: 0 });

  useEffect(() => {
    if (!token || user?.role !== "recruiter") return;
    Promise.all([
      apiCall<unknown[]>("/jobs", "GET", null, token).catch(() => []),
      apiCall<unknown[]>("/applications/recruiter", "GET", null, token).catch(() => []),
    ]).then(([jobs, applicants]) => {
      setRecruiterStats({
        jobs: Array.isArray(jobs) ? jobs.length : 0,
        applicants: Array.isArray(applicants) ? applicants.length : 0,
      });
    });
  }, [token, user?.role]);

  const isRecruiter = user?.role === "recruiter";
  const experience = Array.isArray(user?.experience) ? user.experience : [];
  const achievements = Array.isArray(user?.achievements) ? user.achievements : [];
  const skills = Array.isArray(user?.skills) ? user.skills : [];

  return (
    <main className="mx-auto max-w-6xl px-6 py-16 sm:px-10">
      <p className="marker-num">Account</p>
      <section className="mt-4 border-b border-border pb-10">
        <div className="flex flex-wrap items-end justify-between gap-6">
          <div>
            <h1 className="font-display mt-4 text-[clamp(2.7rem,5.4vw,5.5rem)] text-ink">Your profile.</h1>
            <p className="mt-4 max-w-xl text-base leading-7 text-ink/65">The details JobMatch uses across your workspace.</p>
          </div>
        </div>
        <div className="mt-10 grid gap-5 sm:grid-cols-3">
          <ProfileDatum icon={<Mail className="h-4 w-4" />} label="Email" value={user?.email || "Not available"} />
          <ProfileDatum icon={<BriefcaseBusiness className="h-4 w-4" />} label={isRecruiter ? "Open roles" : "Experience entries"} value={isRecruiter ? String(recruiterStats.jobs) : String(experience.length)} />
          <ProfileDatum icon={<FileText className="h-4 w-4" />} label={isRecruiter ? "Applicants" : "Resume status"} value={isRecruiter ? String(recruiterStats.applicants) : user?.resumeText ? "Parsed" : "Not uploaded"} />
        </div>
      </section>

      {isRecruiter ? (
        <section className="py-12">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="marker-num">Recruiting workspace</p>
              <h2 className="mt-3 font-display text-4xl">Keep the pipeline moving.</h2>
            </div>
            <Link to="/applicants" className="pill-mint">Review applicants</Link>
          </div>
          <p className="mt-6 max-w-2xl text-base leading-7 text-ink/65">Your profile controls the roles and applicant conversations visible in this workspace.</p>
        </section>
      ) : (
        <>
          <section className="grid gap-10 border-b border-border py-12 lg:grid-cols-[minmax(0,1fr)_minmax(280px,0.65fr)]">
            <div>
              <p className="marker-num">Resume summary</p>
              <p className="mt-4 max-w-2xl text-base leading-7 text-ink/75">{user?.resumeSummary || "Upload a resume to build your candidate profile."}</p>
              <Link to="/resume" className="link-underline mt-6 inline-block text-sm font-medium text-ink">Update resume</Link>
            </div>
            <div>
              <p className="marker-num">Education</p>
              <div className="mt-4 space-y-2 text-sm leading-6 text-ink/75">
                <ProfileLine icon={<GraduationCap className="h-4 w-4" />} value={user?.degree || "Degree not recorded"} />
                <ProfileLine icon={<GraduationCap className="h-4 w-4" />} value={[user?.college, user?.cgpa !== undefined ? `CGPA ${user.cgpa}` : ""].filter(Boolean).join(" | ") || "College details not recorded"} />
              </div>
            </div>
          </section>

          <section className="border-b border-border py-12">
            <p className="marker-num">Skills</p>
            <div className="mt-5 flex flex-wrap gap-2">
              {skills.length > 0 ? skills.map((skill) => <span key={skill} className="rounded-full border border-border bg-card px-4 py-1.5 font-mono text-xs uppercase tracking-widest text-ink/75">{skill}</span>) : <p className="text-sm text-ink/60">No skills are recorded yet.</p>}
            </div>
          </section>

          <section className="grid gap-10 py-12 lg:grid-cols-2">
            <div>
              <p className="marker-num">Experience</p>
              <div className="mt-5 space-y-4">
                {experience.length > 0 ? experience.map((entry, index) => <div key={`${entry.title}-${index}`} className="border-l-2 border-lime pl-4"><p className="font-semibold text-ink">{entry.title || "Experience"}</p><p className="text-sm text-ink/60">{[entry.company, entry.duration].filter(Boolean).join(" | ")}</p></div>) : <p className="text-sm text-ink/60">No experience entries recorded.</p>}
              </div>
            </div>
            <div>
              <p className="marker-num">Achievements</p>
              <div className="mt-5 space-y-3">
                {achievements.length > 0 ? achievements.map((achievement, index) => <p key={`${achievement}-${index}`} className="border-l-2 border-warm pl-4 text-sm leading-6 text-ink/75">{achievement}</p>) : <p className="text-sm text-ink/60">No achievements recorded.</p>}
              </div>
            </div>
          </section>
        </>
      )}
    </main>
  );
}

function ProfileDatum({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return <div className="border-l-2 border-ink/15 pl-4"><div className="flex items-center gap-2 text-ink/50">{icon}<p className="font-mono text-[10px] uppercase tracking-widest">{label}</p></div><p className="mt-2 break-words text-base font-medium text-ink">{value}</p></div>;
}

function ProfileLine({ icon, value }: { icon: React.ReactNode; value: string }) {
  return <p className="flex gap-2"><span className="mt-1 shrink-0 text-ink/45">{icon}</span><span>{value}</span></p>;
}
