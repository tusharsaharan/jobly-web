import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Loader2, RotateCcw, Send, Sparkles } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { useAuth } from "@/lib/auth";
import { apiCall } from "@/lib/api";
import { CandidatePoolMeter } from "@/components/jobs/CandidatePoolMeter";
import { RequirementFlags } from "@/components/jobs/RequirementFlags";
import { HealthScoreGauge } from "@/components/jobs/HealthScoreGauge";
import { PredictiveInsightsPanel } from "@/components/jobs/PredictiveInsightsPanel";
import { DeiRewriteModal } from "@/components/jobs/DeiRewriteModal";
import { FieldCoachingTooltip } from "@/components/jobs/FieldCoachingTooltip";
import { VoiceToJD } from "@/components/jobs/VoiceToJD";
import { MarketComparePanel } from "@/components/jobs/MarketComparePanel";
import { RequirementBlocksDrawer } from "@/components/jobs/RequirementBlocksDrawer";
import { CollaborativeJDEditor } from "@/components/jobs/CollaborativeJDEditor";
import { CandidateQuestionsPreview } from "@/components/jobs/CandidateQuestionsPreview";
import { Layers } from "lucide-react";

export const Route = createFileRoute("/_app/post-job")({
  head: () => ({
    meta: [
      { title: "Post a role | JobMatch" },
      { name: "description", content: "Create a new opening." },
    ],
  }),
  component: PostJobPage,
});

type AtsRequirementsForm = {
  minCgpa: string;
  targetCollegeTier: string;
  minExperienceYears: string;
  requiredDegree: string;
};

type SalaryRangeForm = {
  min: string;
  max: string;
  currency: string;
  period: "annual" | "monthly" | "hourly";
  visible: boolean;
};

type JobForm = {
  title: string;
  company: string;
  location: string;
  type: string;
  description: string;
  skills: string;
  atsRequirements: AtsRequirementsForm;
  salaryRange: SalaryRangeForm;
};

type FormErrors = Partial<Record<"title" | "company" | "location" | "type" | "description" | "skills" | "minCgpa" | "minExperienceYears" | "requiredDegree", string>>;

type ChatMessage = {
  id: number;
  role: "user" | "ai";
  text: string;
};

const emptyForm: JobForm = {
  title: "",
  company: "",
  location: "",
  type: "",
  description: "",
  skills: "",
  atsRequirements: {
    minCgpa: "",
    targetCollegeTier: "any",
    minExperienceYears: "",
    requiredDegree: "",
  },
  salaryRange: {
    min: "",
    max: "",
    currency: "USD",
    period: "annual",
    visible: true,
  },
};

function normalizeSkills(value: string) {
  return value.split(/[,;\n\r|\u2022]+/).map((skill) => skill.trim()).filter(Boolean);
}

function optionalNumber(value: string) {
  return value.trim() === "" ? undefined : Number(value);
}

function toPayload(form: JobForm) {
  return {
    title: form.title,
    company: form.company,
    location: form.location,
    type: form.type,
    description: form.description,
    skills: normalizeSkills(form.skills),
    atsRequirements: {
      minCgpa: optionalNumber(form.atsRequirements.minCgpa),
      targetCollegeTier: form.atsRequirements.targetCollegeTier,
      minExperienceYears: optionalNumber(form.atsRequirements.minExperienceYears),
      requiredDegree: form.atsRequirements.requiredDegree,
    },
    salaryRange: {
      min: optionalNumber(form.salaryRange.min),
      max: optionalNumber(form.salaryRange.max),
      currency: form.salaryRange.currency || "USD",
      period: form.salaryRange.period || "annual",
      visible: form.salaryRange.visible,
    },
  };
}

function validateForm(form: JobForm): FormErrors {
  const errors: FormErrors = {};
  const title = form.title.trim();
  const description = form.description.trim();
  const skills = normalizeSkills(form.skills);

  if (title.length < 2) errors.title = "Enter a title with at least 2 characters.";
  else if (title.length > 160) errors.title = "Title cannot exceed 160 characters.";
  if (description.length < 20) errors.description = "Add at least 20 characters so candidates understand the role.";
  else if (description.length > 8000) errors.description = "Description cannot exceed 8,000 characters.";
  if (form.company.trim().length > 160) errors.company = "Company cannot exceed 160 characters.";
  if (form.location.trim().length > 160) errors.location = "Location cannot exceed 160 characters.";
  if (skills.length > 30) errors.skills = "Add at most 30 skills.";
  else if (skills.some((skill) => skill.length > 80)) errors.skills = "Each skill must be 80 characters or fewer.";
  if (form.type && !["Full-time", "Part-time", "Contract", "Internship"].includes(form.type)) {
    errors.type = "Choose a supported employment type.";
  }

  const cgpa = optionalNumber(form.atsRequirements.minCgpa);
  if (cgpa !== undefined && (!Number.isFinite(cgpa) || cgpa < 0 || cgpa > 10)) {
    errors.minCgpa = "Enter a CGPA from 0 to 10.";
  }
  const experience = optionalNumber(form.atsRequirements.minExperienceYears);
  if (experience !== undefined && (!Number.isFinite(experience) || experience < 0 || experience > 60)) {
    errors.minExperienceYears = "Enter experience from 0 to 60 years.";
  }
  if (form.atsRequirements.requiredDegree.trim().length > 120) {
    errors.requiredDegree = "Required degree cannot exceed 120 characters.";
  }
  return errors;
}

function asForm(job: any): JobForm {
  const requirements = job?.atsRequirements ?? {};
  const salary = job?.salaryRange ?? {};
  const cgpa = Number(requirements.minCgpa);
  const experience = Number(requirements.minExperienceYears);
  const salaryMin = Number(salary.min);
  const salaryMax = Number(salary.max);
  return {
    title: typeof job?.title === "string" ? job.title : "",
    company: typeof job?.company === "string" ? job.company : "",
    location: typeof job?.location === "string" ? job.location : "",
    type: ["Full-time", "Part-time", "Contract", "Internship"].includes(job?.type) ? job.type : "",
    description: typeof job?.description === "string" ? job.description : "",
    skills: Array.isArray(job?.skills) ? job.skills.join(", ") : typeof job?.skills === "string" ? job.skills : "",
    atsRequirements: {
      minCgpa: Number.isFinite(cgpa) && cgpa > 0 ? String(cgpa) : "",
      targetCollegeTier: ["tier1", "tier2", "tier3", "any"].includes(requirements.targetCollegeTier) ? requirements.targetCollegeTier : "any",
      minExperienceYears: Number.isFinite(experience) && experience > 0 ? String(experience) : "",
      requiredDegree: typeof requirements.requiredDegree === "string" ? requirements.requiredDegree : "",
    },
    salaryRange: {
      min: Number.isFinite(salaryMin) && salaryMin > 0 ? String(salaryMin) : "",
      max: Number.isFinite(salaryMax) && salaryMax > 0 ? String(salaryMax) : "",
      currency: typeof salary.currency === "string" ? salary.currency : "USD",
      period: ["annual", "monthly", "hourly"].includes(salary.period) ? salary.period : "annual",
      visible: typeof salary.visible === "boolean" ? salary.visible : true,
    },
  };
}

function PostJobPage() {
  const { user, token } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState<JobForm>(emptyForm);
  const [errors, setErrors] = useState<FormErrors>({});
  const [loading, setLoading] = useState(false);
  const [chatInput, setChatInput] = useState("");
  const [chatLoading, setChatLoading] = useState(false);
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const [isDeiModalOpen, setIsDeiModalOpen] = useState(false);
  const [isBlocksDrawerOpen, setIsBlocksDrawerOpen] = useState(false);
  const [selectedTextForBlock, setSelectedTextForBlock] = useState("");
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (user?.role === "seeker") navigate({ to: "/dashboard", replace: true });
  }, [user, navigate]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }, [chatHistory, chatLoading]);

  function updateForm(next: JobForm, field?: keyof FormErrors) {
    setForm(next);
    if (field && errors[field]) setErrors((current) => ({ ...current, [field]: undefined }));
  }

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    const validationErrors = validateForm(form);
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      toast.error("Review the highlighted fields before publishing.");
      return;
    }

    setLoading(true);
    try {
      await apiCall("/jobs", "POST", toPayload(form), token);
      toast.success("Role posted");
      navigate({ to: "/dashboard" });
    } catch (error: any) {
      setErrors(error?.details ?? {});
      toast.error(error.message ?? "Could not post the role.");
    } finally {
      setLoading(false);
    }
  }

  async function handleChat(event: React.FormEvent) {
    event.preventDefault();
    const message = chatInput.trim();
    if (!message || chatLoading || loading) return;

    setChatHistory((history) => [...history, { id: Date.now(), role: "user", text: message }]);
    setChatInput("");
    setChatLoading(true);

    try {
      const result = await apiCall<any>("/jobs/ai-generate", "POST", { prompt: message, draft: toPayload(form) }, token);
      const job = result?.job ?? result;
      setForm(asForm(job));
      setErrors({});
      const response = typeof result?.message === "string" ? result.message : "I updated the role draft. Review it before publishing.";
      setChatHistory((history) => [...history, { id: Date.now() + 1, role: "ai", text: response }]);
      if (Array.isArray(result?.missingFields) && result.missingFields.length > 0) {
        toast.message("The assistant needs a little more information before this role can be published.");
      } else {
        toast.success("Draft updated");
      }
    } catch (error: any) {
      const response = error?.message ?? "I could not update the draft. Please try that again.";
      setChatHistory((history) => [...history, { id: Date.now() + 1, role: "ai", text: response }]);
      toast.error(response);
    } finally {
      setChatLoading(false);
    }
  }

  const disabled = chatLoading || loading;

  return (
    <main className="mx-auto max-w-7xl px-6 pb-16 pt-28 sm:px-10">
      <section className="grid items-start gap-10 border-b border-border pb-10 lg:grid-cols-[minmax(0,0.9fr)_minmax(360px,1fr)]">
        <div>
          <p className="marker-num">A new opening</p>
          <h1 className="mt-4 font-display text-[clamp(2.7rem,5.4vw,5.5rem)] text-ink">Post a role.</h1>
          <p className="mt-6 max-w-xl text-base leading-7 text-ink/65">
            Start in plain language, paste a brief, or fill in the details yourself. The assistant works on the draft you already have and never publishes for you.
          </p>
        </div>

        <section aria-label="Recruiter assistant" className="surface p-5 sm:p-6">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-3">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-mint text-ink">
                <Sparkles className="h-5 w-5" aria-hidden="true" />
              </span>
              <div className="min-w-0">
                <p className="font-semibold text-ink">Recruiter assistant</p>
                <p className="mt-1 text-sm text-ink/60">Describe a role or ask for a change to the current draft.</p>
              </div>
            </div>
            <VoiceToJD 
              onTranscriptComplete={(text) => {
                setChatInput((prev) => (prev ? `${prev} ${text}` : text));
              }}
              disabled={disabled}
            />
          </div>

          <div aria-live="polite" className="mt-5 max-h-64 min-h-28 space-y-3 overflow-y-auto rounded-md border border-border bg-panel/40 p-4">
            {chatHistory.length === 0 && !chatLoading ? (
              <p className="text-sm leading-6 text-ink/60">Use a short role brief, a labeled list, or paste an existing job description. You can edit every result below.</p>
            ) : (
              chatHistory.map((message) => (
                <div key={message.id} className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}>
                  <div className={`max-w-[85%] rounded-md px-4 py-2.5 text-sm leading-6 ${message.role === "user" ? "bg-ink text-cream" : "bg-mint-soft text-ink"}`}>
                    {message.text}
                  </div>
                </div>
              ))
            )}
            {chatLoading && (
              <div className="flex justify-start">
                <div className="inline-flex items-center gap-2 rounded-md bg-mint-soft px-4 py-2.5 text-sm text-ink">
                  <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                  Updating the draft...
                </div>
              </div>
            )}
            <div ref={chatEndRef} />
          </div>

          <form onSubmit={handleChat} className="mt-4 grid gap-3 sm:grid-cols-[1fr_auto]">
            <label className="sr-only" htmlFor="recruiter-assistant-input">Describe the role or a change to the draft</label>
            <textarea
              id="recruiter-assistant-input"
              value={chatInput}
              onChange={(event) => setChatInput(event.target.value)}
              disabled={disabled}
              maxLength={4000}
              rows={3}
              placeholder="Describe the role or change a detail..."
              className="control-surface min-h-24 resize-none px-4 py-3 text-sm placeholder:text-ink/40 focus:border-ink focus:outline-none disabled:opacity-50"
            />
            <button type="submit" disabled={disabled || !chatInput.trim()} className="pill-mint inline-flex cursor-pointer gap-2 disabled:cursor-not-allowed disabled:opacity-50 sm:self-end">
              {chatLoading ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : <Send className="h-4 w-4" aria-hidden="true" />}
              Update draft
            </button>
          </form>
        </section>
      </section>

      <div className="mt-10 flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="marker-num">Live Metrics &amp; Market Alignment</p>
          <p className="mt-1 text-xs text-ink/60">Real-time candidate reach, predictive hiring timelines, and quality score.</p>
        </div>
        <MarketComparePanel payload={toPayload(form)} />
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-3">
        <CandidatePoolMeter 
          skills={normalizeSkills(form.skills)}
          minCgpa={optionalNumber(form.atsRequirements.minCgpa)}
          targetCollegeTier={form.atsRequirements.targetCollegeTier}
        />
        <HealthScoreGauge payload={toPayload(form)} />
        <PredictiveInsightsPanel payload={toPayload(form)} />
      </div>

      <form onSubmit={submit} noValidate className="mt-10 space-y-6">
        <RequirementFlags payload={toPayload(form)} />
        
        <Field 
          label="Title" 
          value={form.title} 
          onChange={(value) => updateForm({ ...form, title: value }, "title")} 
          placeholder="Senior Product Engineer" 
          disabled={disabled} 
          required 
          error={errors.title} 
          maxLength={160} 
          coachingField="title"
        />
        <Field label="Company (optional)" value={form.company} onChange={(value) => updateForm({ ...form, company: value }, "company")} placeholder="Your organization" disabled={disabled} error={errors.company} maxLength={160} />
        
        <div className="grid gap-4 sm:grid-cols-2">
          <Field 
            label="Location (optional)" 
            value={form.location} 
            onChange={(value) => updateForm({ ...form, location: value }, "location")} 
            placeholder="Remote, hybrid, or city" 
            disabled={disabled} 
            error={errors.location} 
            maxLength={160} 
            coachingField="location"
          />
          <label className="block">
            <span className="marker-num">Employment type (optional)</span>
            <select value={form.type} onChange={(event) => updateForm({ ...form, type: event.target.value }, "type")} disabled={disabled} aria-invalid={Boolean(errors.type)} className="control-surface mt-2 w-full px-4 py-3.5 text-base focus:border-ink focus:outline-none disabled:opacity-50">
              <option value="">Not specified</option>
              <option value="Full-time">Full-time</option>
              <option value="Part-time">Part-time</option>
              <option value="Contract">Contract</option>
              <option value="Internship">Internship</option>
            </select>
            {errors.type && <p className="mt-2 text-sm text-destructive" role="alert">{errors.type}</p>}
          </label>
        </div>

        {/* Salary Range Section */}
        <section aria-labelledby="salary-heading" className="rounded-xl border border-border/70 bg-panel/30 p-5">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center">
              <span className="font-semibold text-ink text-sm">Compensation &amp; Salary Range</span>
              <FieldCoachingTooltip fieldKey="salary" />
            </div>
            <label className="flex items-center gap-2 cursor-pointer text-xs text-ink/70">
              <input
                type="checkbox"
                checked={form.salaryRange.visible}
                onChange={(e) => updateForm({ ...form, salaryRange: { ...form.salaryRange, visible: e.target.checked } })}
                className="rounded border-border accent-emerald-500"
              />
              <span>Show in public listing</span>
            </label>
          </div>

          <div className="mt-4 grid gap-4 sm:grid-cols-4">
            <div className="sm:col-span-1">
              <span className="marker-num">Currency</span>
              <select
                value={form.salaryRange.currency}
                onChange={(e) => updateForm({ ...form, salaryRange: { ...form.salaryRange, currency: e.target.value } })}
                disabled={disabled}
                className="control-surface mt-2 w-full px-3 py-3 text-sm focus:border-ink focus:outline-none"
              >
                <option value="USD">USD ($)</option>
                <option value="EUR">EUR (€)</option>
                <option value="GBP">GBP (£)</option>
                <option value="INR">INR (₹)</option>
                <option value="CAD">CAD ($)</option>
              </select>
            </div>

            <div className="sm:col-span-1">
              <NumberField
                label="Min Salary"
                value={form.salaryRange.min}
                onChange={(value) => updateForm({ ...form, salaryRange: { ...form.salaryRange, min: value } })}
                placeholder="e.g. 80000"
                disabled={disabled}
              />
            </div>

            <div className="sm:col-span-1">
              <NumberField
                label="Max Salary"
                value={form.salaryRange.max}
                onChange={(value) => updateForm({ ...form, salaryRange: { ...form.salaryRange, max: value } })}
                placeholder="e.g. 120000"
                disabled={disabled}
              />
            </div>

            <div className="sm:col-span-1">
              <span className="marker-num">Period</span>
              <select
                value={form.salaryRange.period}
                onChange={(e) => updateForm({ ...form, salaryRange: { ...form.salaryRange, period: e.target.value as any } })}
                disabled={disabled}
                className="control-surface mt-2 w-full px-3 py-3 text-sm focus:border-ink focus:outline-none"
              >
                <option value="annual">Annual</option>
                <option value="monthly">Monthly</option>
                <option value="hourly">Hourly</option>
              </select>
            </div>
          </div>
        </section>

        {/* Description with DEI Rewrite & Requirement Blocks Actions */}
        <div className="space-y-2">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="marker-num">Description <span className="text-destructive">*</span></span>
            <div className="flex flex-wrap items-center gap-2">
              <CandidateQuestionsPreview
                jobPayload={toPayload(form)}
                onAppendFaq={(faqText) => {
                  const currentDesc = form.description ? `${form.description}\n\n${faqText}` : faqText;
                  updateForm({ ...form, description: currentDesc }, "description");
                }}
                disabled={disabled}
              />
              <button
                type="button"
                onClick={() => setIsBlocksDrawerOpen(true)}
                className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-panel px-3 py-1 text-xs font-semibold text-ink transition-colors hover:bg-panel/80 cursor-pointer"
              >
                <Layers className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
                <span>Requirement Blocks</span>
              </button>
              <button
                type="button"
                onClick={() => setIsDeiModalOpen(true)}
                disabled={disabled || form.description.trim().length < 20}
                className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-700 dark:text-emerald-300 transition-colors hover:bg-emerald-500/20 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
              >
                <Sparkles className="h-3.5 w-3.5" />
                <span>Make DEI-Friendly</span>
              </button>
            </div>
          </div>

          <CollaborativeJDEditor
            value={form.description}
            onChange={(val) => updateForm({ ...form, description: val }, "description")}
            disabled={disabled}
          />
          {errors.description && <p id="description-error" className="mt-1 text-sm text-destructive" role="alert">{errors.description}</p>}
        </div>

        <Field 
          label="Skills (optional)" 
          value={form.skills} 
          onChange={(value) => updateForm({ ...form, skills: value }, "skills")} 
          placeholder="React, TypeScript, Postgres" 
          disabled={disabled} 
          error={errors.skills} 
          maxLength={2400} 
          multiline 
          coachingField="skills"
        />

        <section aria-labelledby="eligibility-heading" className="surface-subtle mt-10 p-6">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <h2 id="eligibility-heading" className="font-semibold text-ink">Eligibility rules (optional)</h2>
              <p className="mt-1 text-xs leading-5 text-ink/60">Only set a rule when it is genuinely required. A blank rule does not exclude anyone.</p>
            </div>
            <button type="button" onClick={() => updateForm({ ...form, atsRequirements: emptyForm.atsRequirements })} disabled={disabled} className="inline-flex min-h-10 cursor-pointer items-center gap-2 rounded-md border border-border px-4 text-sm font-medium text-ink transition-colors hover:bg-panel disabled:cursor-not-allowed disabled:opacity-50">
              <RotateCcw className="h-4 w-4" aria-hidden="true" />
              Clear rules
            </button>
          </div>
          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            <NumberField 
              label="Minimum CGPA" 
              value={form.atsRequirements.minCgpa} 
              onChange={(value) => updateForm({ ...form, atsRequirements: { ...form.atsRequirements, minCgpa: value } }, "minCgpa")} 
              placeholder="e.g. 8.5" 
              disabled={disabled} 
              error={errors.minCgpa} 
              coachingField="cgpa"
            />
            <label className="block">
              <span className="marker-num">College tier</span>
              <select value={form.atsRequirements.targetCollegeTier} onChange={(event) => updateForm({ ...form, atsRequirements: { ...form.atsRequirements, targetCollegeTier: event.target.value } })} disabled={disabled} className="control-surface mt-2 w-full px-4 py-3.5 text-base focus:border-ink focus:outline-none disabled:opacity-50">
                <option value="any">No tier requirement</option>
                <option value="tier1">Tier 1</option>
                <option value="tier2">Tier 2 or better</option>
                <option value="tier3">Tier 3 or better</option>
              </select>
            </label>
            <NumberField label="Minimum experience (years)" value={form.atsRequirements.minExperienceYears} onChange={(value) => updateForm({ ...form, atsRequirements: { ...form.atsRequirements, minExperienceYears: value } }, "minExperienceYears")} placeholder="e.g. 2" disabled={disabled} error={errors.minExperienceYears} />
            <label className="block">
              <span className="marker-num">Required degree</span>
              <input type="text" value={form.atsRequirements.requiredDegree} onChange={(event) => updateForm({ ...form, atsRequirements: { ...form.atsRequirements, requiredDegree: event.target.value } }, "requiredDegree")} placeholder="Leave blank when no degree is required" maxLength={120} disabled={disabled} aria-invalid={Boolean(errors.requiredDegree)} className="control-surface mt-2 w-full px-4 py-3.5 text-base placeholder:text-ink/30 focus:border-ink focus:outline-none disabled:opacity-50" />
              <p className="mt-2 text-xs leading-5 text-ink/60">Blank includes candidates who have no recorded degree.</p>
              {errors.requiredDegree && <p className="mt-2 text-sm text-destructive" role="alert">{errors.requiredDegree}</p>}
            </label>
          </div>
        </section>

        <button type="submit" disabled={disabled} data-cursor="publish" className="pill-mint-lg inline-flex w-full cursor-pointer gap-3 disabled:cursor-not-allowed disabled:opacity-60">
          {loading ? <><Loader2 className="h-5 w-5 animate-spin" aria-hidden="true" /> Publishing</> : "Publish role"}
        </button>
      </form>

      {/* DEI Rewrite Modal */}
      <DeiRewriteModal
        isOpen={isDeiModalOpen}
        onClose={() => setIsDeiModalOpen(false)}
        title={form.title}
        description={form.description}
        onApply={(newDescription) => {
          updateForm({ ...form, description: newDescription }, "description");
          toast.success("Applied DEI-friendly rewrite to description!");
        }}
      />
      {/* Requirement Blocks Drawer */}
      <RequirementBlocksDrawer
        isOpen={isBlocksDrawerOpen}
        onClose={() => setIsBlocksDrawerOpen(false)}
        selectedText={selectedTextForBlock}
        onInsertContent={(content) => {
          const currentDesc = form.description ? `${form.description}\n\n${content}` : content;
          updateForm({ ...form, description: currentDesc }, "description");
        }}
        onAppendSkills={(newSkills) => {
          const currentList = normalizeSkills(form.skills);
          const merged = Array.from(new Set([...currentList, ...newSkills]));
          updateForm({ ...form, skills: merged.join(", ") }, "skills");
        }}
      />
    </main>
  );
}

function Field({ label, value, onChange, placeholder, required, disabled, error, maxLength, multiline = false, coachingField }: { label: string; value: string; onChange: (value: string) => void; placeholder?: string; required?: boolean; disabled?: boolean; error?: string; maxLength?: number; multiline?: boolean; coachingField?: "title" | "salary" | "location" | "skills" | "cgpa" }) {
  const controlClass = "control-surface mt-2 w-full px-4 py-3.5 text-base placeholder:text-ink/30 focus:border-ink focus:outline-none disabled:opacity-50";
  return (
    <label className="block">
      <span className="marker-num flex items-center">
        <span>{label} {required && <span className="text-destructive">*</span>}</span>
        {coachingField && <FieldCoachingTooltip fieldKey={coachingField} />}
      </span>
      {multiline ? (
        <textarea value={value} onChange={(event) => onChange(event.target.value)} placeholder={placeholder} maxLength={maxLength} rows={3} disabled={disabled} aria-invalid={Boolean(error)} className={`${controlClass} resize-y`} />
      ) : (
        <input value={value} onChange={(event) => onChange(event.target.value)} placeholder={placeholder} maxLength={maxLength} disabled={disabled} aria-invalid={Boolean(error)} className={controlClass} />
      )}
      {error && <p className="mt-2 text-sm text-destructive" role="alert">{error}</p>}
    </label>
  );
}

function NumberField({ label, value, onChange, placeholder, disabled, error, coachingField }: { label: string; value: string; onChange: (value: string) => void; placeholder: string; disabled?: boolean; error?: string; coachingField?: "title" | "salary" | "location" | "skills" | "cgpa" }) {
  return (
    <label className="block">
      <span className="marker-num flex items-center">
        <span>{label}</span>
        {coachingField && <FieldCoachingTooltip fieldKey={coachingField} />}
      </span>
      <input type="text" inputMode="decimal" value={value} onChange={(event) => onChange(event.target.value)} placeholder={placeholder} disabled={disabled} aria-invalid={Boolean(error)} className="control-surface mt-2 w-full px-4 py-3.5 text-base placeholder:text-ink/30 focus:border-ink focus:outline-none disabled:opacity-50" />
      {error && <p className="mt-2 text-sm text-destructive" role="alert">{error}</p>}
    </label>
  );
}
