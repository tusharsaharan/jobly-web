import { createFileRoute, useNavigate } from "@tanstack/react-router";
import {
  Award,
  BriefcaseBusiness,
  CheckCircle2,
  FileText,
  GraduationCap,
  Loader2,
  Upload,
  Sparkles,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { useAuth } from "@/lib/auth";
import { apiCall } from "@/lib/api";

export const Route = createFileRoute("/_app/resume")({
  head: () => ({
    meta: [
      { title: "Resume | Jobly" },
      { name: "description", content: "Upload and review your resume." },
    ],
  }),
  component: ResumePage,
});

function ResumePage() {
  const { user, token, refresh } = useAuth();
  const navigate = useNavigate();
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<{ step: string; message: string; progress: number } | null>(null);

  useEffect(() => {
    if (user?.role === "recruiter") navigate({ to: "/dashboard", replace: true });
  }, [navigate, user?.role]);

  async function upload(file: File) {
    if (file.type !== "application/pdf") {
      toast.error("Choose a PDF resume.");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error("The resume must be 5MB or smaller.");
      return;
    }

    setUploading(true);
    setUploadProgress({ step: "uploading", message: "Uploading document to S3 storage...", progress: 20 });
    try {
      const formData = new FormData();
      formData.append("resume", file);
      const res = await apiCall<{ msg?: string; status?: string }>("/resume/upload", "POST", formData, token, true);
      
      setUploadProgress({ step: "processing", message: "AI extracting skills and recalibrating ATS scores...", progress: 70 });
      await refresh();
      setUploadProgress({ step: "completed", message: "Extraction and scoring complete!", progress: 100 });
      toast.success(res.msg || "Resume parsed and profile refreshed.");
    } catch (error: any) {
      toast.error(error.message ?? "Resume upload failed.");
    } finally {
      setUploading(false);
      setTimeout(() => setUploadProgress(null), 3000);
    }
  }

  const hasResume = Boolean(user?.resumeText);
  const skills = Array.isArray(user?.skills) ? user.skills : [];
  const experience = Array.isArray(user?.experience) ? user.experience : [];
  const achievements = Array.isArray(user?.achievements) ? user.achievements : [];
  const tierLabel: Record<string, string> = {
    tier1: "Tier 1",
    tier2: "Tier 2",
    tier3: "Tier 3",
    unknown: "Not recorded",
  };

  return (
    <main className="mx-auto max-w-6xl px-6 pb-16 pt-28 sm:px-10">
      <header className="border-b border-border pb-8">
        <p className="marker-num">Candidate profile source</p>
        <h1 className="font-display mt-4 text-[clamp(2.7rem,5.4vw,5.5rem)] text-ink">Your resume, made useful.</h1>
        <p className="mt-5 max-w-2xl text-lg leading-relaxed text-ink/68">
          Keep one current PDF here. Jobly uses it to refresh your skills, profile context, and role-fit analysis.
        </p>
      </header>

      <section
        onDragOver={(event) => { event.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={(event) => {
          event.preventDefault();
          setDragging(false);
          const file = event.dataTransfer.files?.[0];
          if (file) void upload(file);
        }}
        className={`surface mt-8 grid gap-6 p-6 sm:p-7 md:grid-cols-[auto_minmax(0,1fr)_auto] md:items-center ${
          dragging ? "border-[#2A9D7B] bg-mint-soft" : ""
        }`}
      >
        <span className="inline-flex h-12 w-12 items-center justify-center rounded-md bg-panel text-ink">
          {uploading ? <Loader2 className="h-5 w-5 animate-spin" aria-hidden="true" /> : <FileText className="h-5 w-5" aria-hidden="true" />}
        </span>
        <div>
          <p className="font-semibold text-ink">
            {uploadProgress ? uploadProgress.message : uploading ? "Processing your resume" : hasResume ? "Your resume is active" : "Add your resume"}
          </p>
          <p className="mt-1 text-sm leading-6 text-ink/60">
            {uploading
              ? "Extracting the profile details used in matching via async worker pipeline."
              : hasResume
                ? "Upload a newer PDF any time to refresh the profile and recalibrate future scores."
                : "Drop a PDF here or browse to start building your candidate profile."}
          </p>
          {uploadProgress && (
            <div className="mt-3 w-full max-w-md">
              <div className="h-1.5 w-full overflow-hidden rounded-full bg-ink/10">
                <div
                  className="h-full bg-[#2A9D7B] transition-all duration-500 ease-out"
                  style={{ width: `${uploadProgress.progress}%` }}
                />
              </div>
            </div>
          )}
          {hasResume && !uploading ? <p className="mt-3 inline-flex items-center gap-2 text-sm font-semibold text-[#2A9D7B]"><CheckCircle2 className="h-4 w-4" aria-hidden="true" />Parsed and ready for matching</p> : null}
        </div>
        <div className="flex flex-wrap gap-3 md:justify-end">
          <input
            ref={inputRef}
            type="file"
            accept="application/pdf,.pdf"
            className="hidden"
            onChange={(event) => {
              const file = event.target.files?.[0];
              if (file) void upload(file);
              event.target.value = "";
            }}
          />
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={uploading}
            className="pill-mint gap-2 disabled:opacity-55"
          >
            <Upload className="h-4 w-4" aria-hidden="true" />
            {hasResume ? "Replace PDF" : "Browse PDF"}
          </button>
        </div>
      </section>

      {hasResume ? (
        <>
          <section className="grid gap-10 border-b border-border py-10 lg:grid-cols-[minmax(0,1.15fr)_minmax(280px,0.85fr)]">
            <div>
              <p className="marker-num">Profile summary</p>
              <p className="mt-4 max-w-2xl text-base leading-7 text-ink/75">
                {user?.resumeSummary || "Your profile was parsed successfully. Add a newer PDF if your experience or skills change."}
              </p>
            </div>
            <div className="grid gap-5 sm:grid-cols-3 lg:grid-cols-1">
              <ProfileFact label="College" value={user?.college || "Not recorded"} />
              <ProfileFact label="CGPA" value={user?.cgpa !== undefined && user?.cgpa !== null ? String(user.cgpa) : "Not recorded"} />
              <ProfileFact label="Education tier" value={tierLabel[user?.collegeTier || "unknown"]} />
            </div>
          </section>

          <section className="border-b border-border py-10">
            <p className="marker-num">Skills from your resume</p>
            <div className="mt-5 flex flex-wrap gap-2">
              {skills.length > 0 ? skills.map((skill) => (
                <span key={skill} className="rounded-md bg-panel px-3 py-1.5 text-sm font-medium text-ink/75">{skill}</span>
              )) : <p className="text-sm text-ink/60">No skills were extracted from this file.</p>}
            </div>
          </section>

          <section className="grid gap-10 border-b border-border py-10 lg:grid-cols-2">
            <div>
              <p className="marker-num">Experience</p>
              <div className="mt-5 space-y-5">
                {experience.length > 0 ? experience.map((entry, index) => (
                  <div key={`${entry.title}-${index}`} className="flex gap-3 border-l-2 border-[#A9EBD1] pl-4">
                    <BriefcaseBusiness className="mt-1 h-4 w-4 shrink-0 text-ink/45" aria-hidden="true" />
                    <div>
                      <p className="font-semibold text-ink">{entry.title || "Experience"}</p>
                      <p className="mt-1 text-sm text-ink/60">{[entry.company, entry.duration].filter(Boolean).join(" | ") || "Details not recorded"}</p>
                    </div>
                  </div>
                )) : <p className="text-sm text-ink/60">No experience entries were extracted.</p>}
              </div>
            </div>
            <div>
              <p className="marker-num">Achievements</p>
              <div className="mt-5 space-y-5">
                {achievements.length > 0 ? achievements.map((achievement, index) => (
                  <div key={`${achievement}-${index}`} className="flex gap-3 border-l-2 border-[#2A9D7B] pl-4">
                    <Award className="mt-1 h-4 w-4 shrink-0 text-warm" aria-hidden="true" />
                    <p className="text-sm leading-6 text-ink/75">{achievement}</p>
                  </div>
                )) : <p className="text-sm text-ink/60">No achievements were extracted.</p>}
              </div>
            </div>
          </section>
        </>
      ) : null}
    </main>
  );
}

function ProfileFact({ label, value }: { label: string; value: string }) {
  return (
    <div className="border-l-2 border-ink/14 pl-4">
      <p className="marker-num">{label}</p>
      <p className="mt-2 text-sm font-semibold text-ink">{value}</p>
    </div>
  );
}
