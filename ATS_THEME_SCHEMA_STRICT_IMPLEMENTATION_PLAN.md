# Strict implementation plan: ATS analysis, upload suggestions, shared themes, and schema enforcement

## 0. Mission and non-negotiable rules

Build an ATS experience that is more useful and explainable than the current keyword heuristic. The target is the quality of actionable feedback associated with products such as Resume Worded; do **not** claim to reproduce its private model or scores. A score must be a transparent Jobly calculation backed by specific resume and job evidence.

This work has five deliverables:

1. A deterministic, versioned, job-specific ATS score with evidence, category scores, and truthful suggestions.
2. Resume-quality suggestions visible during and immediately after upload, before a candidate applies to a job.
3. One light/dark theme preference that drives the interview IDE and both whiteboard implementations consistently.
4. No emoji characters in any product button, link styled as a button, menu action, or interactive control. Use the existing Lucide icon system instead.
5. One fixed, canonical schema for resume extraction, ATS input, ATS output, upload status, and API transport. No route or worker may invent a parallel shape.

### Guardrails

- Never calculate eligibility from protected characteristics (race, caste, religion, gender, age, disability, nationality, photo, name origin, marital status, or address).
- Do not use institution “tier” as a hidden general ranking. Only evaluate an explicit recruiter-entered requirement, explain it to the candidate, and never use it as an automatic rejection.
- Never advise a candidate to claim an unverified skill, credential, or metric. Suggestions must say “add evidence if accurate.”
- Do not silently replace the old score definition. Version every score and preserve the source inputs/evidence needed to explain it.
- Treat parse confidence and missing data as uncertainty, not as evidence that the candidate lacks a qualification.
- Theme is a local accessibility/display preference. It must not modify shared code or whiteboard content, and one participant choosing light mode must not force another participant’s display to change.

## 1. Current-state findings to preserve while refactoring

The implementation must start from these verified facts in the current repository:

| Area | Current implementation | Problem to solve |
| --- | --- | --- |
| ATS scorer | `jobly-api/src/services/ai.service.js` exports `basicAtsScore` through `computeAtsScore` | Six coarse heuristic values are calculated from words, profile fields, and a small alias map; no score version/evidence/confidence exists. |
| Parser schema | `jobly-api/src/modules/ai/schemas.js` | The extraction schema contains only skills, shallow experience, education, achievements, and summary. It is not the same shape as scoring data. |
| Score storage | `jobly-api/src/models/Application.js` | `atsScore`, a hard-coded six-key breakdown, and `atsTips: string[]` lose why a number was produced. |
| Re-scoring | `jobly-api/src/workers/resume.processor.js` and `src/infrastructure/temporal/activities/resumeActivities.js` | Both call the same heuristic but do not persist an analysis run, schema version, or job/resume input version. |
| Upload page | `jobly-web/src/routes/_app.resume.tsx` | It displays simulated steps (20/70/100) and immediately calls `refresh`; it has no real analysis progress or upload-time resume-health suggestions. |
| Editor | `jobly-web/src/components/interview/ide/MonacoWorkspace.tsx` | Monaco is hard-coded to `theme="vs-dark"`. |
| Whiteboard | `ExcalidrawWhiteboard.tsx` and legacy `WhiteboardCanvas.tsx` | The room uses many hard-coded dark values, while Excalidraw/legacy canvas do not share a controlled theme contract. |

Do not “fix” these by adding another set of optional fields to the current models. Complete the fixed contract first, then make old data read-compatible during migration.

## 2. Architecture decision: one contract package and versioned analysis runs

### 2.1 Create the shared contract package

Create `packages/contracts` as a small dependency used by both `jobly-api` and `jobly-web`. Configure the root workspace scripts so both applications resolve it consistently. The package must contain:

```text
packages/contracts/
  package.json
  src/
    resume.ts
    ats.ts
    job.ts
    upload.ts
    theme.ts
    index.ts
  dist/                         # generated only; do not hand-edit
```

Use Zod as the executable schema source of truth. Export inferred TypeScript types to the web and server. Where a JSON Schema is needed for external validation or documentation, generate it from the Zod schema in CI rather than maintaining a second manually edited contract.

The API is currently CommonJS. Either compile the package to dual ESM/CommonJS output or add a CommonJS entry point. Do not import browser-only code into the API.

### 2.2 Contract rules

- Every HTTP request is parsed by Zod at the controller boundary.
- Every AI provider response is parsed through the same Zod extraction schema before it can be saved.
- Every worker input/output uses the contract type and stores `schemaVersion`.
- Every API response shown in the web app uses a Zod parser in `jobly-web/src/lib/api-contracts.ts`; a malformed response shows a safe error state and is logged with a correlation ID.
- Mongoose validates persistence constraints, but Zod is authoritative for payload shape and cross-field refinements.
- Unknown keys are rejected (`.strict()`) for server-generated schemas. Only explicitly designated extension maps may use `.catchall()`.

### 2.3 Version constants

Define constants in `packages/contracts/src/ats.ts`:

```ts
export const RESUME_SCHEMA_VERSION = "resume-profile/1";
export const JOB_ATS_PROFILE_VERSION = "job-ats-profile/1";
export const ATS_ANALYSIS_VERSION = "ats-analysis/2026-08-v1";
export const WORKSPACE_THEME_VERSION = "workspace-theme/1";
```

Never change the meaning or weights under an existing `ATS_ANALYSIS_VERSION`. Increment the version, add a migration/read adapter where needed, and recompute only through an explicit backfill job.

## 3. The fixed schemas

### 3.1 Canonical `ResumeProfile`

Replace the shallow extraction object with the strict `ResumeProfileSchema`. Keep raw PDF text separate from structured facts.

Required top-level shape:

```ts
ResumeProfile = {
  schemaVersion: "resume-profile/1";
  source: {
    uploadId: string;
    fileName: string;
    mimeType: "application/pdf";
    sha256: string;
    extractedAt: string;           // ISO 8601 UTC
    extractor: "gemini" | "fallback" | "manual";
    extractionConfidence: number;  // 0..1, parser confidence only
  };
  contact: {
    email: string | null;
    phone: string | null;
    location: string | null;
    links: Array<{ kind: "linkedin" | "github" | "portfolio" | "other"; url: string }>;
  };
  headline: string | null;
  summary: string | null;
  skills: Array<{
    canonicalId: string;
    label: string;
    aliasesObserved: string[];
    evidence: EvidenceRef[];
  }>;
  experience: Array<ExperienceEntry>;
  projects: Array<ProjectEntry>;
  education: Array<EducationEntry>;
  certifications: Array<CertificationEntry>;
  achievements: Array<AchievementEntry>;
  sectionsDetected: Array<ResumeSection>;
  parseWarnings: ParseWarning[];
};
```

Detailed requirements:

- `EvidenceRef` must contain an allowed source section, page number when known, character offsets when available, and a short quote limited to 240 characters. It must never include a fabricated source.
- `ExperienceEntry` has `title`, `organization`, `startDate`, `endDate | null`, `isCurrent`, `location | null`, `bullets`, `skills`, and `evidence`. Dates use `YYYY-MM` when known; use `null` plus a warning when ambiguous instead of guessing.
- `ProjectEntry` has `name`, `description`, `bullets`, `links`, `skills`, and evidence.
- An achievement carries its text, optional quantified outcome, and evidence. A metric is represented only if present in source text.
- `EducationEntry` has `qualification`, `fieldOfStudy`, `institution`, `startDate`, `endDate`, `gpa` (number/null), `gpaScale` (`4 | 10 | 100 | null`), and evidence. Do not save a guessed tier.
- `canonicalId` comes from a curated, versioned skills taxonomy; candidate-facing `label` preserves recognizable spelling.
- Apply limits to prevent abuse: 100 skills, 40 experience entries, 40 projects, 40 bullets per entry, 4,000 characters per free-text field, and an overall parsed-content limit.

### 3.2 Canonical job ATS profile

Extend recruiter job authoring with a strict `JobAtsProfileSchema`; do not derive all requirements from unstructured description keywords.

```ts
JobAtsProfile = {
  schemaVersion: "job-ats-profile/1";
  targetTitles: string[];
  mustHaveSkills: RequiredSkill[];
  preferredSkills: RequiredSkill[];
  responsibilityPhrases: string[];
  minimumExperienceYears: number | null;
  requiredEducation: {
    degrees: string[];
    fieldsOfStudy: string[];
    required: boolean;
  };
  certifications: RequiredCredential[];
  keywords: Array<{ phrase: string; weight: number; source: "recruiter" | "approved-extractor" }>;
};
```

Rules:

- Recruiters edit and confirm this profile in the post-job screen. AI may propose fields but never silently invents a must-have.
- There is no `collegeTier` matching field in the new rubric. Keep the legacy `atsRequirements.targetCollegeTier` readable only for historical applications; do not use it in new scoring.
- A `RequiredSkill` has `canonicalId`, `label`, `required: boolean`, `weight: 1..5`, and optional synonyms selected from the taxonomy. Never use fuzzy substring matching as proof of a skill.
- Job descriptions can produce candidate-facing terminology suggestions, but only recruiter-confirmed must-have/preferred requirements affect the score.

### 3.3 ATS analysis output

Create a strict immutable `AtsAnalysisSchema` and save it as a dedicated `AtsAnalysis` collection. `Application` should reference the latest analysis ID and denormalize only the display score/status during transition.

```ts
AtsAnalysis = {
  schemaVersion: "ats-analysis/2026-08-v1";
  id: string;
  applicationId: string | null;       // null for upload-time health analysis
  resumeUploadId: string;
  resumeHash: string;
  jobId: string | null;
  jobRevision: number | null;
  calculatedAt: string;
  status: "completed" | "partial" | "failed";
  overallScore: number | null;        // 0..100, null if analysis unavailable
  confidence: number;                 // 0..1, data completeness only
  categories: AtsCategoryResult[];
  matchedRequirements: RequirementEvidence[];
  gaps: RequirementGap[];
  suggestions: AtsSuggestion[];
  exclusions: AnalysisExclusion[];
  engine: { version: string; rulesetHash: string; taxonomyVersion: string };
};
```

`AtsSuggestion` must include `id`, `priority` (`high | medium | low`), `category`, `title`, `message`, `action`, `evidence`, `safeToApply`, and `dedupeKey`. UI strings must come from a known suggestion type; never store unbounded raw model prose as an instruction.

### 3.4 Upload status schema

Create `ResumeUploadStatusSchema` with exactly these states:

```text
received -> scanning -> text_extracting -> profile_extracting -> validating
         -> health_analyzing -> rescoring_applications -> completed
                                   \-> completed_with_warnings
Any state -> failed
```

The server returns `uploadId`, `state`, `progress` (0..100), `messageCode`, `updatedAt`, `warnings`, and optional `analysisId`. The client maps `messageCode` to UI copy; it does not use untrusted worker text as the primary UI message.

## 4. ATS scoring engine: precise, fair, and explainable

### 4.1 Split resume health from role fit

Implement two explicit analyses:

1. **Resume health analysis** at upload time: completeness, parse quality, readable structure, evidence/impact, and contact/link integrity. This is not a hiring suitability score and is displayed as “Resume quality check”.
2. **Job-fit ATS analysis** only when a specific job exists: compares the canonical profile with the recruiter-confirmed job ATS profile. This is displayed as “Match for [job title]”.

Do not present a generic upload score as a prediction of hiring chance.

### 4.2 Fixed job-fit rubric (`ats-analysis/2026-08-v1`)

The total is exactly 100 points. Categories are capped independently and rounded only at final presentation.

| Category | Points | Exact calculation | Candidate explanation |
| --- | ---: | --- | --- |
| Required skills evidence | 30 | Sum matched must-have requirement weights / total must-have weights. A match requires taxonomy match plus profile evidence. If no must-have skills exist, redistribute this weight proportionally across preferred skills and responsibilities, and record redistribution. | Which requested skills have sourced evidence and which are not found. |
| Preferred skills and terminology | 15 | Weighted preferred-skill and recruiter-approved phrase coverage; cap each phrase/skill once. | Relevant terminology that could be made easier to find if truthful. |
| Relevant experience | 20 | Compare normalized role/title taxonomy, dated overlapping experience, and responsibility evidence. Experience years are capped at the job minimum; more years do not inflate score indefinitely. | Closest roles/projects and whether dates/scope are missing. |
| Responsibilities and project evidence | 15 | Match recruiter-confirmed responsibility phrases to experience/project bullets using taxonomy and phrase rules. Each job requirement can receive credit once. | Concrete bullets that support the match; gaps only where no evidence was found. |
| Impact and outcomes | 10 | Score sourced quantified outcomes, ownership verbs, scale, and outcome context across experience/projects. No invented metrics. | Missing evidence such as “describe outcome, scale, or result if accurate.” |
| Required education/certification | 5 | Award points only for requirements explicitly marked required. Missing/ambiguous parser data is “not verified”, not “does not have.” | Verified qualification/certification or what needs manual confirmation. |
| ATS readability and completeness | 5 | Validate section presence, usable text extraction, normal headings, contact method, link syntax, duplicate noise, and extreme length. No visual judgment from PDF alone. | Concrete readability/remediation suggestions. |

### 4.3 Eligibility is separate from the score

Return an `eligibility` object separately, with `met | not_met | unverified | not_applicable` per explicit recruiter hard requirement. The score must not hide a hard requirement failure. A candidate sees an honest message such as “This role lists a current work authorization requirement; Jobly could not verify it from your resume.” Do not infer eligibility from name, location, or other sensitive data.

### 4.4 Deterministic rule engine first, AI second

Implement `jobly-api/src/modules/ats/`:

```text
ats/
  taxonomy/skills.v1.json
  normalize.ts
  evidence.ts
  score-role-fit.ts
  score-resume-health.ts
  suggestion-builder.ts
  eligibility.ts
  rulesets/ats-analysis-2026-08-v1.ts
  analysis-repository.ts
  __tests__/
```

- The calculation must be deterministic: same normalized resume, job profile, taxonomy version, and engine version produces byte-for-byte equivalent analysis other than IDs/timestamps.
- Use AI only for extraction or bounded classification candidates. AI output is validated, then rules choose the final score. AI must not directly select an overall score.
- Maintain a human-reviewed taxonomy with canonical IDs and aliases (`node.js`, `nodejs` -> `nodejs`; `react.js`, `reactjs` -> `react`). Do not use contains/substring matches such as treating “Java” as “JavaScript”.
- Record every credited or missing item in evidence form. The UI must be able to answer “why did this number change?” without rerunning an LLM.
- Tokenize phrases, preserve multi-word skills, normalize punctuation/case, and enforce word boundaries. Use exact canonical match before controlled aliases. Log ambiguous aliases and award no credit until taxonomy approval.
- Keep rules and weights in a signed/hashable ruleset object, expose its hash in analysis, and snapshot it in tests.

### 4.5 Suggestion policy

Prioritize a maximum of five suggestions on upload and five for a job match. Generate in this strict order:

1. High-impact missing required evidence that is truthful to add if accurate.
2. Parse or ATS-readability issue blocking reliable matching.
3. Missing dates/scope/impact in already relevant experience.
4. Relevant role terminology not visible in an otherwise matching bullet.
5. Low-priority polish.

Each suggestion needs a source and safe action. Examples:

- Good: “Your React project lists the framework but no outcome. If accurate, add the user, performance, reliability, or delivery result.”
- Good: “The job lists Docker as preferred. It was not found in your parsed resume; add it only if you used it and can describe where.”
- Bad: “Add Kubernetes to raise your score.”
- Bad: “Change your college tier.”

Do not show duplicate messages generated by both health and job-fit analyses. Deduplicate with stable `dedupeKey` and show the highest-priority instance.

## 5. Upload and suggestion user experience

### 5.1 Upload flow

Replace the current simulated `20/70/100` progress states in `jobly-web/src/routes/_app.resume.tsx` with server-authoritative status polling or Server-Sent Events. Prefer SSE because one upload can trigger extraction and many application re-scores.

1. Client validates extension, MIME, size, and file name; server performs the authoritative checks.
2. `POST /api/resume/uploads` returns `202 Accepted` with the strict `ResumeUploadStatus` object.
3. Worker stores an immutable upload record, scans/extracts text, parses into `ResumeProfile`, validates it, creates health analysis, and queues affected application re-scores.
4. Client subscribes to `GET /api/resume/uploads/:uploadId/events` (SSE) with a polling fallback. Resume upload must survive browser refresh via `uploadId` in the route/query or durable profile state.
5. Display only real stage transitions. If the process completes with warnings, show “We extracted what we could” and list reviewable fields.
6. Once health analysis is ready, render a “Resume quality check” panel with category chips, confidence context, and actionable suggestions.
7. Update user profile after validated profile completion, not merely after a request returns.

### 5.2 Resume page layout

Use the existing calm Jobly visual language. No emoji controls; use Lucide icons with visible text labels or accessible labels.

```text
Resume page
  Upload / replace card
    real stage progress + cancel/retry
    parse warnings
  Resume quality check
    score, confidence, category breakdown, five prioritized suggestions
  Parsed profile review
    skills / experience / projects / education / achievements
    “Correct extracted data” action, not hidden auto-corrections
  Job-specific score section
    appears only after selecting/viewing a job
    exact requirements, credited evidence, gaps, suggestions
```

The score ring must include a text equivalent such as `78 out of 100, medium confidence`, not color alone. Do not use red/green as the only way to distinguish matched/not-found status.

### 5.3 New API surface

Implement and validate these routes:

| Method and route | Auth | Purpose |
| --- | --- | --- |
| `POST /api/resume/uploads` | candidate | Create upload + return `202` status. |
| `GET /api/resume/uploads/:uploadId` | owner | Read current strict upload status. |
| `GET /api/resume/uploads/:uploadId/events` | owner | SSE status updates; support `Last-Event-ID`. |
| `GET /api/resume/health/latest` | candidate | Latest health analysis, validated against `AtsAnalysisSchema`. |
| `PATCH /api/resume/profile` | candidate | Apply explicit manual corrections using `ResumeProfilePatchSchema`; record source `manual`. |
| `GET /api/applications/:id/ats-analysis` | involved candidate/recruiter | Return analysis with role-specific authorization and redacted recruiter-only details where necessary. |
| `POST /api/applications/:id/ats-analysis/recalculate` | authorized system/recruiter | Queue, rate-limit, and audit an explicit recalculation. |

Never return raw resume text, evidence offsets, or private recruiter requirement notes to an unauthorized user.

### 5.4 Worker and persistence changes

- Add `ResumeUpload` model: owner, immutable source metadata, SHA-256, S3/object key, status, error code, timestamps, profile/analysis IDs, and TTL policy for temporary source files.
- Add `ResumeProfile` model or versioned embedded collection with `owner`, `uploadId`, schema version, normalized structured profile, extraction warnings, and revision number.
- Add immutable `AtsAnalysis` model with indexes `{ applicationId, calculatedAt: -1 }`, `{ resumeUploadId, jobId, calculatedAt: -1 }`, and `{ engine.version }`.
- Change `Application` to `latestAtsAnalysis`, `atsScoreDisplay`, `atsAnalysisStatus`. Keep legacy breakdown only during migration, then remove it in a scheduled major-version cleanup.
- Change Temporal and legacy worker paths to call the same `runResumeAnalysis` activity. There must be one scoring service, not duplicated controller/worker logic.
- Re-score an application only when its resume revision or job ATS profile revision changes. De-duplicate jobs with key `{applicationId}:{resumeHash}:{jobRevision}:{engineVersion}`.
- Store raw source files in object storage with encryption, access control, retention/deletion job, and no public URLs. Store only needed structured evidence in MongoDB.

## 6. Shared IDE and whiteboard light/dark mode

### 6.1 Theme model

Create `WorkspaceTheme = "light" | "dark" | "system"`. Persist the explicit selection in the user profile (`preferences.workspaceTheme`) and cache it in localStorage for initial paint. `system` resolves with `prefers-color-scheme` and updates when the OS setting changes.

Implement `jobly-web/src/components/theme/WorkspaceThemeProvider.tsx` and `useWorkspaceTheme()`:

- Resolve only once before mounting the workspace to prevent a light/dark flash.
- Set `document.documentElement.dataset.workspaceTheme` to `light` or `dark`.
- Synchronize only the current user’s devices through the profile preference API; use `BroadcastChannel`/storage events for same-browser tabs.
- Do not broadcast display theme through Yjs/Socket.IO. Code and board objects remain collaborative, while each attendee controls their own visual accessibility preference.

Add a labeled theme switcher to the interview workspace toolbar and settings. Use `Sun`, `Moon`, and `Monitor` Lucide icons plus visible or screen-reader text; icon-only controls require `aria-label`, tooltip, focus style, and keyboard support.

### 6.2 Semantic visual tokens

Define semantic CSS variables in `jobly-web/src/styles/workspace-theme.css` and import them into the root style entry. Use names that describe purpose, never a specific color:

```css
:root[data-workspace-theme="dark"] {
  --workspace-page: #0b0d0c;
  --workspace-surface: #151817;
  --workspace-elevated: #202523;
  --workspace-border: #343c38;
  --workspace-text: #f2f5f3;
  --workspace-muted: #a9b3ae;
  --workspace-accent: #66c7a5;
  --workspace-danger: #f26d7d;
  --workspace-editor-bg: #111312;
  --workspace-editor-gutter: #151817;
}

:root[data-workspace-theme="light"] {
  --workspace-page: #f7faf8;
  --workspace-surface: #ffffff;
  --workspace-elevated: #edf4f0;
  --workspace-border: #c8d6cf;
  --workspace-text: #15211c;
  --workspace-muted: #52635b;
  --workspace-accent: #187a59;
  --workspace-danger: #b42337;
  --workspace-editor-bg: #fbfcfb;
  --workspace-editor-gutter: #eef4f0;
}
```

Use a token class/style mapping for all room components. Eliminate direct `bg-[#171717]`, `text-[#999]`, `#7ee0c5`, and similar hard-coded workspace values from the room, IDE, terminal, and board components. Maintain a documented exception list only for syntax/semantic diagnostic colors.

Meet WCAG 2.2 AA: normal text contrast at least 4.5:1, large text and UI indicators at least 3:1, with visible focus rings in both modes. Test rendered output; do not rely only on token naming.

### 6.3 Monaco integration

In `MonacoWorkspace.tsx`:

1. Create `jobly-workspace-dark` and `jobly-workspace-light` with `monaco.editor.defineTheme` after Monaco loads.
2. Define editor background, line number, gutter, selection, cursor, find match, active line, minimap, widget, error/warning/info hint colors, and accessibility colors using the resolved workspace token palette.
3. Replace the hard-coded `theme="vs-dark"` with the resolved Jobly Monaco theme.
4. On theme change call `monaco.editor.setTheme()` and call `layout()` after the next animation frame; preserve model, selection, undo stack, cursor decorations, LSP markers, and Yjs binding.
5. Do not turn off diagnostics to make light theme look clean. Keep red/yellow marker contrast and distinguish severity with icons/text in the Problems view.
6. Verify themes for C++, Python, TypeScript, Java, Go, Rust, Ruby, JSON, Markdown, and plain text.

### 6.4 Terminal integration

Expose `getTerminalTheme(theme)` using xterm’s theme contract. Set background, foreground, cursor, selection, ANSI normal/bright colors, and link colors for each resolved workspace theme. Call `terminal.options.theme = ...` without recreating the terminal or dropping the PTY/WebSocket session.

The Fish prompt and terminal output must remain readable in both modes. Validate text contrast for user input, command errors, warnings, hyperlinks, and disabled connection status.

### 6.5 Excalidraw integration

In `ExcalidrawWhiteboard.tsx`:

- Pass `theme={resolvedTheme}` to Excalidraw.
- Surround it with semantic workspace surfaces rather than hard-coded `bg-[#f8fafc]` or dark panel colors.
- Set a consistent `UIOptions` configuration and ensure toolbar/action controls follow the resolved mode.
- Keep Yjs element serialization independent of theme. Do not store stroke/background colors as “dark mode” values; an element’s explicitly chosen color stays an intentional shared drawing property.
- Render a safe default scene using neutral colors readable against either board background.
- Add `onChange` protection so theme transition itself does not emit a Yjs scene mutation or create a replay/history event.

### 6.6 Legacy canvas disposition

The legacy canvas currently has functional limitations beyond theme. Make Excalidraw the only production board once its collaboration tests pass. Until then:

- Add token-driven rendering to `WhiteboardCanvas.tsx`.
- Ensure its background/grid/selection/toolbar colors use the resolved theme.
- Do not advertise legacy board as a feature-complete alternative.
- Keep a recruiter-only migration/export action; remove the “switch to legacy” path from normal participant UI after data migration.

## 7. Remove emojis from controls, safely

### 7.1 Scope

Remove Unicode emoji from:

- `<button>` text and descendants;
- link components styled/used as buttons;
- menu items, command palette actions, tabs, toolbar controls, submit controls, and interactive cards;
- `aria-label`, tooltip, toast action labels, and button title text.

Do **not** alter emoji in candidate-uploaded resumes, interviewer notes, chat content, terminal output, stored transcript content, or third-party content. That would corrupt user data and is outside this request.

### 7.2 Implementation process

1. Add `scripts/audit-interactive-emoji.mjs` using TypeScript AST/JSX parsing, not a fragile grep alone.
2. Traverse `.tsx` source, identify interactive components (`button`, project `Button`, `Link` with button semantics, menu items), and inspect static text attributes/children for Unicode `Extended_Pictographic` characters.
3. Produce file/line/label output and exit non-zero in CI.
4. Replace each discovered emoji with the semantically appropriate Lucide icon. Keep an adjacent text label for non-obvious actions. Decorative icons have `aria-hidden="true"`; icon-only controls require an accessible name.
5. Add an allowlist comment mechanism only for a literal that represents user sample data, reviewed per case. Do not allowlist production controls wholesale.
6. Add visual regression tests to confirm no label truncation after replacements.

Do not remove Lucide `Sparkles`, `Upload`, `Sun`, etc.; they are vector icons, not emoji characters. The current resume route imports `Sparkles` but does not need it; remove unused imports as part of lint cleanup.

## 8. Data migration and rollout

### 8.1 Preparatory release

- Ship contract package, read-only adapters for the old `User` resume fields and old `Application.atsBreakdown`, and the new collections/indexes.
- Add feature flags: `ATS_V2_ENABLED`, `RESUME_UPLOAD_V2_ENABLED`, `WORKSPACE_THEME_ENABLED`, `LEGACY_WHITEBOARD_ENABLED`.
- Preserve current scoring result in the UI while V2 runs in shadow mode.

### 8.2 Backfill and comparison

1. Create a resumable, idempotent `backfill-resume-profile-v1` worker. It reads existing stored resume text/source, builds profiles, validates them, and records warnings.
2. Create `backfill-ats-v2` with rate limits and checkpointing. For each application, calculate V1 and V2 without overwriting V1.
3. Store score deltas, category deltas, failure reason, analyzer version, and sample evidence for monitoring.
4. Review a stratified sample: no skills, one skill, aliases, junior/senior, non-English/poor extraction, complex PDF, no education, jobs with/without hard requirements.
5. Enable V2 only when threshold tests and human review acceptance criteria pass. Do not use “score changed” alone as success.

### 8.3 Cutover and rollback

- Cut over new uploads first, then candidates viewing their own job matches, then recruiter applicant pages.
- Keep `latestAtsAnalysis` pointer so rollback only changes display/read selection; do not delete V2 analysis history.
- If analysis failure rate, latency, schema rejection rate, or unexplained score deltas exceed defined thresholds, disable the feature flag and retain upload functionality with clear status messaging.
- After a minimum agreed retention period and a completed export/backfill audit, remove V1 write paths and then legacy fields in a migration release.

## 9. Required test suite — no feature is complete without it

### 9.1 Contract tests

- Unit-test every Zod schema with valid, missing, unknown, excessively long, incorrect type, and cross-field-invalid payloads.
- Assert all API endpoint responses parse with the same shared schemas used by the browser.
- Generate JSON Schema snapshot in CI; review changes deliberately.
- Verify old Application/User records pass only through explicit adapters and cannot be written as V2 without version fields.

### 9.2 Scoring tests

Create fixtures in `jobly-api/tests/fixtures/ats-v2/` with source text, canonical profile, job profile, expected category points, evidence IDs, gaps, and suggestions.

Required cases:

- Exact must-have match; controlled alias match; ambiguous alias that receives no credit.
- `Java` does not match `JavaScript`; `C` does not match `C++`; `Node` only matches documented Node aliases.
- Repeated keyword stuffing does not increase a category after first valid evidence.
- A skill listed in one project but not all jobs receives credit once, with correct evidence.
- Missing parser data becomes `unverified`, never an invented negative fact.
- Experience date overlap, ongoing roles, invalid dates, no dates, and seniority caps.
- Explicit required degree/certification versus optional education; no college-tier score in V2.
- Job with no must-have requirements exercises documented redistribution and still totals exactly 100.
- No resume/job text produces a safe partial analysis, no NaN/Infinity, and no unbounded score.
- Suggestion safety tests reject directives to fabricate qualifications and reject suggestions without evidence/source.
- Determinism test runs the same fixture 100 times and compares canonical JSON after removal of ID/timestamp.
- Property-based tests using `fast-check`: total range, category caps, total math, no duplicate gaps, no protected terms in rule input, and score monotonicity for adding verified required evidence.

### 9.3 Upload and worker tests

- Malware/file scanner failure, non-PDF MIME spoofing, >5 MB, encrypted PDF, image-only PDF, malformed PDF, timeout, S3 failure, AI failure, fallback parse, and duplicate SHA-256 upload.
- State-machine tests prove every state has valid transitions, terminal states do not transition, SSE `Last-Event-ID` resumes correctly, and polling fallback reaches the same final state.
- Test Temporal retry/idempotency so a retry produces one profile revision and one analysis per idempotency key.
- Load-test a batch re-score after a resume replacement; verify queue limits, no duplicate analysis, and no candidate sees another user’s status/event.

### 9.4 Front-end tests

- React Testing Library tests for upload states, warning display, partial analysis, failed retry, health versus job-fit labels, evidence accordion, and safe suggestion language.
- Test user edits to parsed data and verify analysis refreshes only after a saved new profile revision.
- Test `system`, light, and dark theme initial resolution, persistence, cross-tab synchronization, and no hydration/initial-paint mismatch.
- Theme switch must preserve Monaco text, selection, undo history, LSP markers, terminal socket/scrollback, Yjs provider, whiteboard scene, and participant presence.
- Test Excalidraw theme update does not produce a persisted board mutation or collaboration broadcast.
- Test no emoji audit violations. Compile fixture code containing emoji outside controls to prove user content is not falsely blocked.

### 9.5 Browser E2E and visual tests

Use Playwright with seeded API/worker fixtures and two authenticated browser contexts.

1. Candidate uploads PDF -> receives real stage events -> sees profile + health suggestions -> refreshes midway -> resumes status -> completes.
2. Recruiter authorizes a job ATS profile -> candidate views distinct job-fit analysis -> both see appropriate role-specific details.
3. Candidate corrects a parsed skill/date -> only relevant analysis revision changes; audit shows prior version.
4. Light mode: enter IDE, edit code, run terminal, draw/select/move Excalidraw object, switch routes and reload; mode persists and all surfaces match.
5. Dark mode: repeat exactly, comparing screenshots at standard desktop and 1280px widths.
6. Two users choose opposite display themes while editing the same code/board. Assert both synchronize content and retain their chosen theme.
7. Keyboard-only navigation and axe scans for upload, ATS panels, theme control, IDE toolbar, terminal, and whiteboard shell.
8. Screenshot baseline tests for Monaco, terminal, Excalidraw, legacy fallback, and all ATS states. Fail on unexplained pixel shifts after review.

### 9.6 Security and operational tests

- Authorization matrix for every upload/profile/analysis endpoint: owner, unrelated candidate, recruiter of an unrelated job, relevant recruiter, admin/system worker.
- Fuzz resume text and AI JSON response sizes; test prompt-injection-like resume contents cannot alter parser/scorer instructions or create arbitrary fields.
- Verify no raw resume text is emitted in analytics, error logs, SSE messages, client console, or unauthorized API response.
- Test encryption/object retention delete flow, account deletion, signed download expiry, and audit events for manual profile corrections/recalculations.
- Instrument metrics: upload duration by stage, parser validation failures, worker retries, analysis partial/failed rate, V1/V2 score delta distribution, suggestion dismissal/usefulness feedback, theme selection, and client theme errors. Do not log sensitive resume contents.

## 10. Execution sequence and acceptance gates

Follow the order below. Do not skip a gate because the screen “looks correct.”

1. **Baseline and inventory** — snapshot existing schemas, APIs, score fixtures, direct color literals, and interactive emoji audit. Gate: current test/build baseline recorded.
2. **Contracts** — create shared strict contracts, dual build, API/web parsers, migration adapters. Gate: schema/contract tests green.
3. **Canonical extraction** — extend parser prompt and fallback parser into `ResumeProfile`, source evidence, warnings, manual corrections. Gate: malformed/AI tests green.
4. **ATS V2 engine** — taxonomy, deterministic rules, evidence, suggestions, analysis storage. Run V1/V2 shadow comparison. Gate: fixture/property/safety tests green and human sample approved.
5. **Upload V2** — durable status model, worker state machine, SSE/polling, health suggestions. Gate: worker idempotency and browser upload E2E green.
6. **Job authoring and role-fit UI** — recruiter-confirmed job ATS profile, candidate/recruiter views, authorization/redaction. Gate: two-role E2E green.
7. **Theme foundation** — provider, semantic tokens, user preference API, app shell. Gate: accessibility and persistence tests green.
8. **IDE/terminal/board theming** — Monaco custom themes, xterm themes, Excalidraw theme, legacy fallback/removal plan. Gate: two-user opposite-theme collaboration E2E and visual snapshots green.
9. **Emoji cleanup** — AST audit, Lucide replacements, CI enforcement. Gate: audit returns zero product-control violations.
10. **Migration/cutover** — staged flags, backfill, monitoring, rollback drill. Gate: metrics within limits and rollback tested before broad enablement.

## 11. Definition of done

The work is complete only when all of the following are true:

- A candidate can upload a resume and see real, durable processing progress plus truthful resume-health suggestions.
- A job-specific score is deterministic, versioned, 0–100, category-explained, evidence-backed, and does not use protected data or college-tier ranking.
- A user can correct parsed data and a new immutable analysis revision is produced; old analysis remains explainable.
- API, worker, persistence, and web all accept/emit the one fixed schema version and reject unknown/malformed data.
- Monaco, terminal, Excalidraw, and any temporary legacy board honor one local light/dark/system preference without disrupting sockets, Yjs, editor state, or shared board content.
- Product controls contain no emoji characters; they use accessible Lucide icons and labels.
- Unit, contract, worker, property, accessibility, E2E, two-user realtime, visual, security, and rollback tests described above are automated and green in CI.
- Monitoring dashboards and runbooks exist for upload failures, score/version changes, worker retries, theme failures, and rollback.

