/**
 * The Jobly landing story — single source of truth.
 *
 * The scroll ENGINE is a faithful port of the Beagle reference (see
 * `.beagle-ref/FINDINGS.md`): same anchors, same easings, same physics,
 * same pass-through steps. The STORY is Jobly's own.
 *
 * Jobly is a loop, not a funnel. Evidence goes in, a score comes out, the
 * score earns an interview, the interview produces evidence-backed feedback,
 * the feedback says what to fix and what to study, and the fixed resume
 * scores higher. The scroll literally returns to its opening image.
 *
 *   0  hero        the resume
 *   2  thesis      why evidence
 *   4  upload      parse it
 *   5  score       the laptop computes the ATS score
 *   6  match       role fit -> interview scheduled
 *   7  room        the live interview
 *   8  verdict     scorecard, both outcomes
 *   9  study       what to learn next
 *  11  loop        resume v2, higher score, sign up
 *
 * Steps 1, 3 and 10 are pass-through — the engine refuses to rest there, so
 * 0->2, 2->4 and 9->11 are double-length moves. They are the three places the
 * story changes chapter.
 *
 * Every number quoted on screen comes from the real engine:
 *   7 ATS categories + weights  -> jobly-api/src/modules/ats/score-role-fit.js
 *   4 competency pillars        -> jobly-web/src/routes/_app.interview.$roomKey.feedback.tsx
 *   study categories            -> jobly-api/src/constants/topicTaxonomy.js
 *   parse copy                  -> jobly-web/src/routes/_app.resume.tsx
 */

export const END_STEP = 11;
export const TOTAL_STEPS = END_STEP + 1;

/** SideNavigation steps. Unchanged from the reference. */
export const DOT_STEPS = [0, 2, 4, 5, 6, 7, 8, 9, 11] as const;

/** Steps `onActivityEnd` refuses to rest on. 10 is desktop-only. */
export const PASS_THROUGH_STEPS = [1, 3, 10] as const;

/**
 * Landing palette. Roles are the reference's; hues are Jobly brand tokens.
 * Defined as CSS vars on `.landing-stage` so global tokens stay untouched.
 */
export const PALETTE = {
  ink: "var(--lp-ink)",
  mint: "var(--lp-mint)",
  cream: "var(--lp-cream)",
  /** deep green — the "apply" surface */
  deep: "var(--lp-deep)",
  marker: "var(--lp-marker)",
  /** the interview room's near-black, matching the real IDE chrome */
  room: "var(--lp-room)",
  particle: "var(--lp-particle)",
} as const;

/* ────────────────────────── beats ────────────────────────── */

export type Surface = "dark" | "light";

export interface Beat {
  step: number;
  id: string;
  /** Drives `whiteTheme`: dark surfaces get white nav + white dots. */
  surface: Surface;
  label: string;
}

/**
 * The resting beats, in order. `surface` replaces the reference's hardcoded
 * `p<1 || 1<p<3 || 6<p<9` theme ranges, which produced dark-on-dark chrome on
 * the step-6 panel. Deriving it here keeps chrome and background in lockstep.
 */
export const BEATS: Beat[] = [
  { step: 0, id: "hero", surface: "dark", label: "Intro" },
  { step: 2, id: "thesis", surface: "dark", label: "Why Jobly" },
  { step: 4, id: "upload", surface: "light", label: "Upload your resume" },
  { step: 5, id: "score", surface: "light", label: "ATS score" },
  { step: 6, id: "match", surface: "dark", label: "Role fit and apply" },
  { step: 7, id: "room", surface: "dark", label: "Live interview" },
  { step: 8, id: "verdict", surface: "dark", label: "Your feedback" },
  { step: 9, id: "study", surface: "light", label: "What to study" },
  { step: 11, id: "loop", surface: "light", label: "Sign up" },
];

/** Nearest beat at or after `pos` — mirrors `selectItemForStep`. */
export function surfaceAt(pos: number): Surface {
  let surface: Surface = BEATS[0].surface;
  for (const beat of BEATS) {
    if (beat.step <= pos + 0.5) surface = beat.surface;
    else break;
  }
  return surface;
}

/* ────────────────────────── copy ────────────────────────── */

export const COPY = {
  hero: {
    title: "Introducing Jobly",
    subheader: "Your resume is evidence, not a formality",
  },
  thesis: {
    uppertitle: "Because we believe",
    title: "Great Matches",
    subheader: "start with",
    subtitle: "Real Evidence",
    bottomtitle: "Here's how it works:",
  },
  upload: {
    title: "Upload Once",
    subheader: "AI extracts your skills, roles and impact in seconds",
  },
  score: {
    title: "Know Your Score",
    subheader: "Seven weighted categories. Every point traced to a quote.",
  },
  match: {
    title: "Apply Where You Fit",
    subheader: "See your role fit before you spend the application",
  },
  room: {
    title: "A Real Interview",
    subheader: "Code, whiteboard and video\nin one room",
  },
  verdict: {
    title: "Honest Feedback",
    subheader: "Four competencies, each tied to a moment in your session",
  },
  study: {
    title: "Know What To Fix",
    subheader: "Your weak topics, pulled straight from that feedback",
  },
  loop: {
    title: "Then Go Again",
    subheader: "A sharper resume, a better score, a stronger match",
  },
} as const;

/* ────────────────────────── the candidate ────────────────────────── */

/**
 * One candidate carried across all nine beats. Picked at random on load, as
 * `MainScene` does with `data.json > proposals[]`.
 */
export const CANDIDATES = [
  {
    name: "Ari Patel",
    headline: "Frontend Engineer",
    improvedHeadline: "Full-stack Engineer",
    /** marker sweep range on the headline, as `newtitlemarkerstart|length` */
    markerStart: 0,
    markerLength: 8,
    company: "Orbit Studio",
    role: "Senior Frontend Engineer",
    scoreBefore: 82,
    scoreAfter: 94,
    fields: ["React", "TypeScript", "Node.js", "3 yrs experience", "B.Tech CSE", "CGPA 8.4"],
  },
  {
    name: "Priya Raman",
    headline: "Data Analyst",
    improvedHeadline: "Data Scientist",
    markerStart: 0,
    markerLength: 4,
    company: "Meridian Health",
    role: "Data Scientist II",
    scoreBefore: 78,
    scoreAfter: 91,
    fields: ["Python", "SQL", "Pandas", "4 yrs experience", "M.Sc Statistics", "CGPA 9.1"],
  },
  {
    name: "Dev Sharma",
    headline: "Backend Developer",
    improvedHeadline: "Platform Engineer",
    markerStart: 0,
    markerLength: 7,
    company: "Northwind Labs",
    role: "Platform Engineer",
    scoreBefore: 80,
    scoreAfter: 93,
    fields: ["Go", "Kubernetes", "PostgreSQL", "5 yrs experience", "B.E. IT", "CGPA 8.7"],
  },
] as const;

export type Candidate = (typeof CANDIDATES)[number];

/* ────────────────────────── step 5: the ATS engine ────────────────────────── */

/**
 * The real seven categories and point budgets from `score-role-fit.js`.
 * `earned` is an illustrative run that sums to `scoreBefore` (82).
 */
export const ATS_CATEGORIES = [
  { id: "required_skills", label: "Required Skills Evidence", max: 35, earned: 30 },
  { id: "preferred_skills", label: "Preferred Skills & Terminology", max: 10, earned: 7 },
  { id: "relevant_experience", label: "Relevant Experience & Depth", max: 15, earned: 12 },
  { id: "responsibilities", label: "Responsibilities & Projects", max: 15, earned: 13 },
  { id: "impact_and_outcomes", label: "Quantified Impact & Outcomes", max: 10, earned: 5 },
  { id: "education_and_certifications", label: "Education & Certifications", max: 5, earned: 5 },
  { id: "ats_readability", label: "ATS Readability & Hygiene", max: 10, earned: 10 },
] as const;

/** Trust markers — all three are real properties of the scoring engine. */
export const ATS_PROOF = [
  "Deterministic — same resume, same score, every time",
  "Every point cites a quote from your resume",
  "Institution tier and protected traits excluded by design",
] as const;

/* ────────────────────────── step 6: roles ────────────────────────── */

export const ROLE_CARDS = [
  {
    id: "r1",
    title: "Senior Frontend Engineer",
    company: "Orbit Studio",
    fit: 91,
    state: "scheduled",
  },
  { id: "r2", title: "Product Engineer", company: "Northwind Labs", fit: 84, state: "open" },
  { id: "r3", title: "UI Platform Engineer", company: "Meridian", fit: 76, state: "open" },
] as const;

/* ────────────────────────── step 7: the room ────────────────────────── */

export const ROOM_FEATURES = [
  "Collaborative editor",
  "Shared whiteboard",
  "Live video",
  "Runnable terminal",
] as const;

/** AI co-interviewer prompts, in the voice of the real copilot panel. */
export const ROOM_MESSAGES = [
  { from: "ai", text: "Candidate chose a hash map.\nAsk about memory tradeoffs." },
  { from: "you", text: "What happens when the input\nno longer fits in memory?" },
] as const;

export const ROOM_CODE = [
  "function twoSum(nums, target) {",
  "  const seen = new Map();",
  "  for (let i = 0; i < nums.length; i++) {",
  "    const need = target - nums[i];",
  "    if (seen.has(need))",
  "      return [seen.get(need), i];",
  "    seen.set(nums[i], i);",
  "  }",
  "}",
] as const;

/* ────────────────────────── step 8: the scorecard ────────────────────────── */

/** The real four pillars from `PILLAR_META`, with their display scores. */
export const PILLARS = [
  {
    id: "problem_solving",
    label: "Problem Solving & Decomposition",
    short: "Problem Solving",
    score: 4,
  },
  {
    id: "coding_algorithms",
    label: "Algorithmic Implementation & Code Quality",
    short: "Code Quality",
    score: 4,
  },
  {
    id: "system_design",
    label: "System Architecture & Tradeoff Reasoning",
    short: "System Design",
    score: 3,
  },
  {
    id: "communication",
    label: "Technical Communication & Collaboration",
    short: "Communication",
    score: 5,
  },
] as const;

export const VERDICT = {
  overall: 4,
  strengths: ["Clear decomposition under pressure", "Explained tradeoffs without prompting"],
  improvements: ["Scaling beyond a single node", "Index choice under write load"],
  /** Both outcomes are shown. The loop is the point. */
  outcomes: [
    { id: "hired", label: "Hired", detail: "Offer moves to the recruiter" },
    { id: "not-yet", label: "Not this time", detail: "You still leave with the plan below" },
  ],
} as const;

/* ────────────────────────── step 9: study ────────────────────────── */

/**
 * Weak topics are extracted from the interviewer's own feedback text by
 * `topicExtractionService.processCandidateFeedback()` and matched against the
 * canonical taxonomy. Categories are the real ones.
 */
export const STUDY_TOPICS = [
  {
    id: "t1",
    topic: "Sharding & Partitioning",
    category: "HLD",
    from: "Scaling beyond a single node",
    resources: ["Curated reading", "Practice set"],
  },
  {
    id: "t2",
    topic: "Database Indexing",
    category: "CS Fundamentals",
    from: "Index choice under write load",
    resources: ["Curated reading", "Quiz battle"],
  },
  {
    id: "t3",
    topic: "Dynamic Programming",
    category: "DSA",
    from: "Optimal substructure hesitation",
    resources: ["Practice set", "Focus session"],
  },
] as const;

/* ────────────────────────── step 11: the loop + footer ────────────────────────── */

export const LOOP_STEPS = ["Resume", "Score", "Interview", "Feedback", "Study"] as const;

export const FOOTER_CTA = {
  lead: "Great Matches start with",
  em: "Real Evidence",
  trail: "Now",
  kicker: "Sign up for the free beta",
} as const;

/* ────────────────────────── anchors ────────────────────────── */

/**
 * Every element's `(anchor, visibleLength)`. Anchors keep the reference's
 * rhythm — panels lead their beat by half a step, titles sit on the integer,
 * and the protagonist spans the whole story.
 */
export const ANCHORS = {
  /* chapter 1 — the resume */
  inkPanel: { anchor: -1, length: 1 },
  scrollHint: { anchor: 0, length: 1 },
  heroTitle: { anchor: 0.5, length: 1.5 },
  heroPhoto: { anchor: 1, length: 2 },
  heroSideLeft: { anchor: 1, length: 1 },
  heroSideRight: { anchor: 1, length: 1 },

  /* chapter 2 — the thesis */
  particleBg: { anchor: 2, length: 1 },
  thesisTitle: { anchor: 2, length: 1 },

  /* chapter 3 — upload + score */
  mintPanel: { anchor: 3.5, length: 1.5 },
  uploadTitle: { anchor: 4, length: 1 },
  fieldChips: { anchor: 4, length: 1 },
  scoreTitle: { anchor: 5, length: 1 },
  laptop: { anchor: 5, length: 1 },
  atsBars: { anchor: 5, length: 1 },

  /* the protagonist — alive across the entire story */
  resume: { anchor: 6, length: 6.5 },

  /* chapter 4 — match */
  deepPanel: { anchor: 6, length: 1 },
  matchTitle: { anchor: 6, length: 1 },
  roleCards: { anchor: 6, length: 1 },

  /* chapter 5 — the room + verdict */
  roomPanel: { anchor: 7.5, length: 1.5 },
  roomTitle: { anchor: 7, length: 1 },
  interviewRoom: { anchor: 7, length: 1 },
  verdictTitle: { anchor: 8, length: 1 },
  scorecard: { anchor: 8, length: 1 },

  /* chapter 6 — study */
  studyTitle: { anchor: 9, length: 1 },
  studyTopics: { anchor: 9, length: 1 },

  /* chapter 7 — the loop closes */
  footerColor: { anchor: 11, length: 1 },
  loopTitle: { anchor: 11, length: 1 },
  loopDiagram: { anchor: 11, length: 2 },
} as const;
