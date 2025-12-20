import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Loader2, RotateCcw, Send, Sparkles } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { useAuth } from "@/lib/auth";
import { apiCall } from "@/lib/api";

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

type JobForm = {
  title: string;
  company: string;
  location: string;
  type: string;
  description: string;
  skills: string;
  atsRequirements: AtsRequirementsForm;
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
  const cgpa = Number(requirements.minCgpa);
  const experience = Number(requirements.minExperienceYears);
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
          <div className="flex items-start gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-mint text-ink">
              <Sparkles className="h-5 w-5" aria-hidden="true" />
            </span>
            <div className="min-w-0">
              <p className="font-semibold text-ink">Recruiter assistant</p>
              <p className="mt-1 text-sm text-ink/60">Describe a role or ask for a change to the current draft.</p>
            </div>
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

      <div className="mt-10 flex items-center justify-between gap-4">
        <div>
          <p className="marker-num">Role details</p>
          <p className="mt-2 text-sm text-ink/60">Every field stays editable after the assistant updates the draft.</p>
        </div>
      </div>

      <form onSubmit={submit} noValidate className="mt-10 space-y-6">
        <Field label="Title" value={form.title} onChange={(value) => updateForm({ ...form, title: value }, "title")} placeholder="Senior Product Engineer" disabled={disabled} required error={errors.title} maxLength={160} />
        <Field label="Company (optional)" value={form.company} onChange={(value) => updateForm({ ...form, company: value }, "company")} placeholder="Your organization" disabled={disabled} error={errors.company} maxLength={160} />
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Location (optional)" value={form.location} onChange={(value) => updateForm({ ...form, location: value }, "location")} placeholder="Remote, hybrid, or city" disabled={disabled} error={errors.location} maxLength={160} />
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
        <label className="block">
          <span className="marker-num">Description <span className="text-destructive">*</span></span>
          <textarea
            value={form.description}
            onChange={(event) => updateForm({ ...form, description: event.target.value }, "description")}
            rows={7}
            maxLength={8000}
            disabled={disabled}
            aria-invalid={Boolean(errors.description)}
            aria-describedby={errors.description ? "description-error" : undefined}
            className="control-surface mt-2 w-full resize-y px-4 py-3 text-base placeholder:text-ink/30 focus:border-ink focus:outline-none disabled:opacity-50"
            placeholder="Describe the work, outcomes, and the person you need."
          />
          {errors.description && <p id="description-error" className="mt-2 text-sm text-destructive" role="alert">{errors.description}</p>}
        </label>
        <Field label="Skills (optional)" value={form.skills} onChange={(value) => updateForm({ ...form, skills: value }, "skills")} placeholder="React, TypeScript, Postgres" disabled={disabled} error={errors.skills} maxLength={2400} multiline />

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
            <NumberField label="Minimum CGPA" value={form.atsRequirements.minCgpa} onChange={(value) => updateForm({ ...form, atsRequirements: { ...form.atsRequirements, minCgpa: value } }, "minCgpa")} placeholder="e.g. 8.5" disabled={disabled} error={errors.minCgpa} />
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
    </main>
  );
}

function Field({ label, value, onChange, placeholder, required, disabled, error, maxLength, multiline = false }: { label: string; value: string; onChange: (value: string) => void; placeholder?: string; required?: boolean; disabled?: boolean; error?: string; maxLength?: number; multiline?: boolean }) {
  const controlClass = "control-surface mt-2 w-full px-4 py-3.5 text-base placeholder:text-ink/30 focus:border-ink focus:outline-none disabled:opacity-50";
  return (
    <label className="block">
      <span className="marker-num">{label} {required && <span className="text-destructive">*</span>}</span>
      {multiline ? (
        <textarea value={value} onChange={(event) => onChange(event.target.value)} placeholder={placeholder} maxLength={maxLength} rows={3} disabled={disabled} aria-invalid={Boolean(error)} className={`${controlClass} resize-y`} />
      ) : (
        <input value={value} onChange={(event) => onChange(event.target.value)} placeholder={placeholder} maxLength={maxLength} disabled={disabled} aria-invalid={Boolean(error)} className={controlClass} />
      )}
      {error && <p className="mt-2 text-sm text-destructive" role="alert">{error}</p>}
    </label>
  );
}

function NumberField({ label, value, onChange, placeholder, disabled, error }: { label: string; value: string; onChange: (value: string) => void; placeholder: string; disabled?: boolean; error?: string }) {
  return (
    <label className="block">
      <span className="marker-num">{label}</span>
      <input type="text" inputMode="decimal" value={value} onChange={(event) => onChange(event.target.value)} placeholder={placeholder} disabled={disabled} aria-invalid={Boolean(error)} className="control-surface mt-2 w-full px-4 py-3.5 text-base placeholder:text-ink/30 focus:border-ink focus:outline-none disabled:opacity-50" />
      {error && <p className="mt-2 text-sm text-destructive" role="alert">{error}</p>}
    </label>
  );
}
