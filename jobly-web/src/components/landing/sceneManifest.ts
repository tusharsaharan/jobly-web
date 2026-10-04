/**
 * The Jobly landing story — single source of truth.
 *
 * The scroll ENGINE is a faithful port of the Beagle reference (see
 * `.beagle-ref/FINDINGS.md`): same anchors, same easings, same physics,
 * same pass-through steps. The STORY is Jobly's own.
 *
 * ──────────────────────────────────────────────────────────────────────
 * THE CONNECTIVE TISSUE
 *
 * Jobly is a loop, not a funnel, and the landing page proves it by never
 * throwing anything away. One folder, one resume, and seven EVIDENCE atoms
 * are mounted once and travel the whole story. An atom's nine lives:
 *
 *   highlighted phrase → skill chip → ATS category row → mailbox payload
 *   → interview moment → feedback comment → study shard → v2 edit
 *   → filed in the folder
 *
 * Because every atom is the same DOM node throughout, nothing appears from
 * nowhere. That is what makes the beats a narrative instead of 19 slides.
 *
 * HANDOFF RULE: adjacent scenes overlap by >= 0.3 step and the outgoing
 * object BECOMES the incoming one. No scene may start after the previous
 * one has finished — that gap is what used to read as "disconnected".
 * ──────────────────────────────────────────────────────────────────────
 *
 *   0  desk        the folder and the sheets you already have
 *   2  thesis      why evidence
 *   4  gather      sheets stack, the laptop arrives closed
 *   5  open        the laptop fills the frame and wakes
 *   6  parse       a yellow highlighter paints the real sentences
 *   7  extract     painted phrases peel off and become skills
 *   8  score       skills dock into the seven weighted categories
 *   9  apply       the application flies to three company mailboxes
 *  11  room        the live interview
 *  12  feedback    the flagged moments assemble into the scorecard
 *  13  fix         weak lines crack; the shards become study cards
 *  14  rewrite     the marker repairs the resume
 *  15  folder      the folder opens; v1 -> v2 -> v3
 *  16  file        everything files away; the folder is selected
 *  18  cta         sign up
 *
 * Steps 1, 3, 10 and 17 are pass-through — the engine refuses to rest
 * there, so those are double-length moves and the four chapter changes.
 *
 * Every number quoted on screen comes from the real engine:
 *   7 ATS categories + weights  -> jobly-api/src/modules/ats/score-role-fit.js
 *   4 competency pillars        -> jobly-web/src/routes/_app.interview.$roomKey.feedback.tsx
 *   study categories            -> jobly-api/src/constants/topicTaxonomy.js
 *   parse copy                  -> jobly-web/src/routes/_app.resume.tsx
 */

export const END_STEP = 18;
export const TOTAL_STEPS = END_STEP + 1;

/** SideNavigation steps — one dot per chapter head, not per beat. */
export const DOT_STEPS = [0, 2, 4, 6, 8, 9, 11, 12, 13, 15, 18] as const;

/**
 * Steps `onActivityEnd` refuses to rest on — the four chapter changes.
 * `useSnapScroll` reads this directly, so adding a chapter here is enough.
 * 17 is the reference's desktop-only `endStep - 1` pass-through.
 */
export const PASS_THROUGH_STEPS = [1, 3, 10, 17] as const;

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
  /** the feedback surface — teal, deliberately NOT the room's black */
  verdict: "var(--lp-verdict)",
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
 * theme ranges, which produced dark-on-dark chrome once the surfaces changed.
 * Deriving it here keeps chrome and background in lockstep.
 */
export const BEATS: Beat[] = [
  { step: 0, id: "desk", surface: "dark", label: "Your desk" },
  { step: 2, id: "thesis", surface: "dark", label: "Why Jobly" },
  { step: 4, id: "gather", surface: "light", label: "One resume" },
  { step: 5, id: "open", surface: "dark", label: "Upload" },
  { step: 6, id: "parse", surface: "dark", label: "Parsing" },
  { step: 7, id: "extract", surface: "dark", label: "Skills found" },
  { step: 8, id: "score", surface: "dark", label: "ATS score" },
  { step: 9, id: "apply", surface: "dark", label: "Apply where you fit" },
  { step: 11, id: "room", surface: "dark", label: "Live interview" },
  { step: 12, id: "feedback", surface: "dark", label: "Your feedback" },
  { step: 13, id: "fix", surface: "light", label: "What to fix" },
  { step: 14, id: "rewrite", surface: "light", label: "Resume v2" },
  { step: 15, id: "folder", surface: "light", label: "A better score" },
  { step: 16, id: "file", surface: "dark", label: "Filed" },
  { step: 18, id: "cta", surface: "dark", label: "Sign up" },
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
  gather: {
    title: "Start With One",
    subheader: "The resume you already have is enough",
  },
  open: {
    title: "Upload Once",
    subheader: "Drop it in. We read every line.",
  },
  parse: {
    title: "We Read It Properly",
    subheader: "Line by line, the way a careful recruiter would",
  },
  extract: {
    title: "Skills, With Receipts",
    subheader: "Every skill lifted straight off the sentence that proves it",
  },
  score: {
    title: "Know Your Score",
    subheader: "Seven weighted categories. Every point traced to a quote.",
  },
  apply: {
    title: "Apply Where You Fit",
    subheader: "One profile, sent only where the evidence lands",
  },
  room: {
    title: "A Real Interview",
    subheader: "Code, whiteboard and video\nin one room",
  },
  feedback: {
    title: "Honest Feedback",
    subheader: "Assembled from the moments you actually had",
  },
  fix: {
    title: "Know What To Fix",
    subheader: "The weak lines break first, so you can see them",
  },
  rewrite: {
    title: "Then Fix It",
    subheader: "Same resume, sharper evidence",
  },
  folder: {
    title: "A Better Score",
    subheader: "Every version kept, so you can see the climb",
  },
  file: {
    title: "Then Go Again",
    subheader: "Filed, scored and ready for the next one",
  },
} as const;

/* ────────────────────────── the candidate ────────────────────────── */

/**
 * One candidate carried across all beats, picked at random on load, as
 * `MainScene` does with `data.json > proposals[]`.
 *
 * `lines` is the candidate's REAL resume body. The highlighter in step 6
 * paints `mark` character ranges out of these exact strings, so the
 * highlighting lands on real words instead of sweeping a skeleton.
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

/* ══════════════════════ THE EVIDENCE ATOMS ══════════════════════ */

/**
 * The spine of the whole page.
 *
 * Seven atoms, mounted once in `EvidenceLayer`, each one a real resume
 * sentence. `mark` is the character range the highlighter paints — the
 * phrase that earns the points — and every downstream field says where
 * that same phrase shows up next.
 *
 *   text      the sentence as printed on the resume
 *   mark      [start, end] char range the yellow marker covers
 *   skill     the chip it becomes in step 7
 *   atsCat    the category row it docks into in step 8 (id from ATS_CATEGORIES)
 *   pts       points this atom contributes to that row
 *   mailbox   which company it convinces in step 9
 *   moment    ROOM_CODE line index it triggers in step 11 (-1 = not raised)
 *   pillar    the competency its feedback comment lands under in step 12
 *   weak      cracks in step 13 and becomes a study card
 *   studyTopic id from STUDY_TOPICS, only for weak atoms
 *   comment   the feedback line this moment produces in step 12
 *   rewrite   what step 14's marker turns a weak line into
 */
export interface Evidence {
  id: string;
  /** The sentence as printed on the resume. */
  text: string;
  /** [start, end] char range the yellow marker covers. */
  mark: readonly [number, number];
  /** The chip it becomes in step 7. */
  skill: string;
  /** The category row it docks into in step 8 (id from ATS_CATEGORIES). */
  atsCat: string;
  /** Points this atom contributes to that row. */
  pts: number;
  /** Which company it convinces in step 9. */
  mailbox: string;
  /** ROOM_CODE line index it triggers in step 11; -1 = not raised. */
  moment: number;
  /** The competency its feedback comment lands under in step 12. */
  pillar: string;
  /** Cracks in step 13 and becomes a study card. */
  weak: boolean;
  /** The feedback line this moment produces in step 12. */
  comment: string;
  /** Which block of the resume it is printed under. */
  section: string;
  /** Only for weak atoms — id from STUDY_TOPICS. */
  studyTopic?: string;
  /** Only for weak atoms — what step 14's marker turns the line into. */
  rewrite?: string;
}

export const EVIDENCE: readonly Evidence[] = [
  {
    id: "e1",
    text: "Rebuilt the checkout flow in React, cutting time-to-interactive by 40%.",
    mark: [25, 30],
    skill: "React",
    atsCat: "required_skills",
    pts: 12,
    mailbox: "orbit",
    moment: 1,
    pillar: "coding_algorithms",
    weak: false,
    comment: "Clear decomposition under pressure",
    section: "experience",
  },
  {
    id: "e2",
    text: "Migrated 60k lines of JavaScript to TypeScript with zero downtime.",
    mark: [33, 43],
    skill: "TypeScript",
    atsCat: "required_skills",
    pts: 10,
    mailbox: "northwind",
    moment: -1,
    pillar: "coding_algorithms",
    weak: false,
    comment: "Explained tradeoffs without prompting",
    section: "experience",
  },
  {
    id: "e3",
    text: "Built the Node.js service layer behind a 2M-request/day API.",
    mark: [10, 17],
    skill: "Node.js",
    atsCat: "relevant_experience",
    pts: 10,
    mailbox: "orbit",
    moment: 2,
    pillar: "problem_solving",
    weak: false,
    comment: "Chose the right structure first time",
    section: "experience",
  },
  {
    id: "e4",
    text: "Owned the deploy pipeline for three services across two regions.",
    mark: [10, 25],
    skill: "CI/CD",
    atsCat: "responsibilities",
    pts: 11,
    mailbox: "meridian",
    moment: 4,
    pillar: "system_design",
    weak: true,
    studyTopic: "t1",
    comment: "Scaling beyond a single node",
    rewrite: "Owned the deploy pipeline for three services, sharded by region.",
    section: "experience",
  },
  {
    id: "e5",
    text: "Cut p95 query latency from 900ms to 120ms on the orders table.",
    mark: [4, 22],
    skill: "SQL tuning",
    atsCat: "impact_and_outcomes",
    pts: 5,
    mailbox: "meridian",
    moment: 6,
    pillar: "system_design",
    weak: true,
    studyTopic: "t2",
    comment: "Index choice under write load",
    rewrite: "Cut p95 latency 900ms to 120ms with a covering index, write-load tested.",
    section: "impact",
  },
  {
    id: "e6",
    text: "B.Tech Computer Science, CGPA 8.4 — graduated 2021.",
    mark: [0, 29],
    skill: "B.Tech CSE",
    atsCat: "education_and_certifications",
    pts: 5,
    mailbox: "northwind",
    moment: -1,
    pillar: "communication",
    weak: false,
    comment: "Communicated assumptions clearly",
    section: "education",
  },
  {
    id: "e7",
    text: "Mentored four interns; two converted to full-time offers.",
    mark: [0, 20],
    skill: "Mentoring",
    atsCat: "preferred_skills",
    pts: 7,
    mailbox: "orbit",
    moment: 8,
    pillar: "communication",
    weak: false,
    comment: "Walked through the tradeoff out loud",
    section: "experience",
  },
];

/** The weak atoms, in order — these are the ones that crack in step 13. */
export const WEAK_EVIDENCE = EVIDENCE.filter((e) => e.weak);

/** Atoms that raise a moment during the interview, in code-line order. */
export const MOMENT_EVIDENCE = EVIDENCE.filter((e) => e.moment >= 0).slice().sort(
  (a, b) => a.moment - b.moment,
);

/** Header lines printed above the body text on the sheet. */
export const RESUME_SECTIONS = [
  { id: "experience", label: "Experience" },
  { id: "impact", label: "Impact" },
  { id: "education", label: "Education" },
] as const;

/* ────────────────────────── step 8: the ATS engine ────────────────────────── */

/**
 * The real seven categories and point budgets from `score-role-fit.js`.
 * `earned` is an illustrative run that sums to `scoreBefore` (82) and is
 * reconciled against the EVIDENCE atoms' `pts` at render time.
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

/* ────────────────────────── step 9: the mailboxes ────────────────────────── */

/**
 * Three companies, three mailboxes. The resume triplicates and one copy
 * flies into each slot; the fit number is what the evidence actually
 * earned for that role, so the flight is motivated.
 */
export const MAILBOXES = [
  {
    id: "orbit",
    company: "Orbit Studio",
    role: "Senior Frontend Engineer",
    fit: 91,
    state: "scheduled",
    /** rest position, viewport fractions from centre */
    x: -0.28,
    y: 0.04,
  },
  {
    id: "northwind",
    company: "Northwind Labs",
    role: "Product Engineer",
    fit: 84,
    state: "received",
    x: 0,
    y: 0.1,
  },
  {
    id: "meridian",
    company: "Meridian",
    role: "UI Platform Engineer",
    fit: 76,
    state: "received",
    x: 0.28,
    y: 0.04,
  },
] as const;

export type Mailbox = (typeof MAILBOXES)[number];

/** Kept for the reduced-motion fallback, which lists roles rather than posting them. */
export const ROLE_CARDS = MAILBOXES;

/* ────────────────────────── step 11: the room ────────────────────────── */

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

/* ────────────────────────── step 12: the scorecard ────────────────────────── */

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

/**
 * The verdict is DERIVED from the evidence atoms, not authored separately —
 * that is what makes the comments in step 12 look like they came from the
 * interview instead of appearing at random.
 */
export const VERDICT = {
  overall: 4,
  strengths: EVIDENCE.filter((e) => !e.weak && e.moment >= 0).map((e) => e.comment),
  improvements: WEAK_EVIDENCE.map((e) => e.comment),
  /** Both outcomes are shown. The loop is the point. */
  outcomes: [
    { id: "hired", label: "Hired", detail: "Offer moves to the recruiter" },
    { id: "not-yet", label: "Not this time", detail: "You still leave with the plan below" },
  ],
} as const;

/* ────────────────────────── step 13: study ────────────────────────── */

/**
 * Weak topics are extracted from the interviewer's own feedback text by
 * `topicExtractionService.processCandidateFeedback()` and matched against the
 * canonical taxonomy. Categories are the real ones. `from` is wired to the
 * weak atom's comment so the causal chain stays visible on screen.
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

/* ────────────────────────── steps 15-16: the folder ────────────────────────── */

/**
 * The folder tabs are ATS versions. Every pass is kept, which is the
 * whole argument for going round the loop again.
 */
export const FOLDER_TABS = [
  { id: "v1", label: "v1", caption: "First pass" },
  { id: "v2", label: "v2", caption: "After feedback" },
  { id: "v3", label: "v3", caption: "Next round" },
] as const;

/** What files into the folder in step 16, in landing order. */
export const FILED_ARTIFACTS = [
  { id: "resume", label: "Resume v2" },
  { id: "score", label: "ATS 93" },
  { id: "applications", label: "3 applications" },
  { id: "scorecard", label: "Interview scorecard" },
  { id: "plan", label: "Study plan" },
] as const;

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
 * rhythm — panels lead their beat by half a step, titles sit on the integer —
 * but the long-lived objects (folder, resume, evidence) span whole chapters
 * so they can travel instead of unmounting.
 */
export const ANCHORS = {
  /* chapter 1 — the desk */
  inkPanel: { anchor: -1, length: 1 },
  scrollHint: { anchor: 0, length: 1 },
  heroTitle: { anchor: 0.5, length: 1.5 },
  heroPhoto: { anchor: 1, length: 2 },
  deskScatter: { anchor: 1.4, length: 2.6 },

  /* chapter 2 — the thesis */
  particleBg: { anchor: 2, length: 1 },
  thesisTitle: { anchor: 2, length: 1 },

  /* chapter 3 — gather, open, parse, extract, score */
  creamPanel: { anchor: 4.4, length: 1.4 },
  gatherTitle: { anchor: 4, length: 1 },
  screenPanel: { anchor: 6.9, length: 2.6 },
  openTitle: { anchor: 5, length: 1 },
  parseTitle: { anchor: 6, length: 1 },
  extractTitle: { anchor: 7, length: 1 },
  scoreTitle: { anchor: 8, length: 1 },
  laptop: { anchor: 6.6, length: 3.2 },
  parsePage: { anchor: 6.5, length: 2.2 },
  skillRail: { anchor: 7.4, length: 1.8 },
  scoreBreakdown: { anchor: 8.1, length: 1.6 },

  /* the protagonists — alive across the entire story */
  resume: { anchor: 9, length: 9.5 },
  evidence: { anchor: 9.5, length: 7 },
  folder: { anchor: 15.5, length: 4 },

  /* chapter 4 — apply */
  deepPanel: { anchor: 9.4, length: 1.4 },
  applyTitle: { anchor: 9, length: 1 },
  mailboxes: { anchor: 9.3, length: 1.6 },

  /* chapter 5 — the room */
  roomPanel: { anchor: 11.3, length: 1.3 },
  roomTitle: { anchor: 11, length: 1 },
  interviewRoom: { anchor: 11.2, length: 1.5 },

  /* chapter 6 — the verdict */
  verdictPanel: { anchor: 12.2, length: 1.2 },
  feedbackTitle: { anchor: 12, length: 1 },
  feedbackAssembly: { anchor: 12.2, length: 1.6 },

  /* chapter 7 — fix and rewrite */
  fixPanel: { anchor: 13.6, length: 1.8 },
  fixTitle: { anchor: 13, length: 1 },
  rewriteTitle: { anchor: 14, length: 1 },
  crackAndFix: { anchor: 13.4, length: 1.9 },
  studyTopics: { anchor: 13.4, length: 1.7 },

  /* chapter 8 — the folder closes the loop */
  folderPanel: { anchor: 15.6, length: 1.8 },
  folderTitle: { anchor: 15, length: 1 },
  fileTitle: { anchor: 16, length: 1 },
  fileAway: { anchor: 16.2, length: 1.8 },

  /* chapter 9 — the CTA */
  footerColor: { anchor: 18, length: 1 },
} as const;
