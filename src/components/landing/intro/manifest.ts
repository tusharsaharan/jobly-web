/**
 * THE INTRO STORY — hero triptych, thesis, import, ATS calculation.
 *
 * The scroll ENGINE is the same faithful Beagle port the long story uses
 * (`useSnapScroll`, `SwipeElement`, `PanelElement`, `beagleEase`). Only the
 * story is new, and it stays deliberately SPARE: the reference reads as premium
 * because each resting beat holds exactly one idea at enormous scale with a
 * great deal of nothing around it. Density is the enemy here.
 *
 * ───────────────────────────────────────────────────────────────────────────
 *  0   hero       hero.jpg full-bleed, "Introducing Jobly", scroll cue
 *  1  ·through·   the frame closes to a triptych, the two siblings slide in,
 *                 the backdrop blurs + desaturates + washes to cream, and the
 *                 ink panel rises carrying "Because we believe"
 *  2   thesis     the five-line serif/display stack, outlined glyphs drifting
 *  3  ·through·   ink retracts, mint wipes open from its centre line, the page
 *                 rises into frame
 *  4   import     the page types itself, five siblings fly in, the headline
 *                 wipes open through a centre rule
 *  5  ·through·   the mint retracts, the siblings scatter, and the page GROWS —
 *                 its skeleton bars cross-fading into real, readable text
 *  6   calc       "Step two / ATS Calculation", warm glyphs behind the sheet
 *  7   scan       a band sweeps the document, phrases get painted, skill chips
 *                 fly into the seven categories, the ring counts to 82
 *  8   seam       CTA cap
 * ───────────────────────────────────────────────────────────────────────────
 *
 * ONE MOVE, NOT TWO SLIDES. Steps 1, 3 and 5 are pass-through: the engine
 * refuses to rest there and immediately continues in the direction of travel,
 * so each chapter change reads as a single continuous gesture rather than two
 * separate scrolls. That auto-continuation is the whole reason the reference
 * feels like film instead of a slideshow.
 *
 * STEP 5 DOES TRIPLE DUTY, and that is the point: the clutter clears outward
 * (mint retracts 4.5 -> 5.5, siblings scatter 4.52 -> 5.14) while the one
 * document you care about comes forward and resolves into something you can
 * actually read. None of the clearing is hand-authored — `panelPhase` was
 * already in its outro and the siblings' `out` positions are just the far end
 * of the interpolation that brought them in.
 */

import { limit } from "../beagleEase";
import {
  ATS_CATEGORIES,
  CANDIDATES,
  EVIDENCE,
  RESUME_SECTIONS,
  type Surface,
} from "../sceneManifest";

export type { Surface };
export { ATS_CATEGORIES, EVIDENCE };

export const END_STEP = 8;
export const TOTAL_STEPS = END_STEP + 1;

/** One dot per resting beat. */
export const DOT_STEPS = [0, 2, 4, 6, 7, 8] as const;

export const DOT_LABELS: Record<number, string> = {
  0: "Introducing Jobly",
  2: "Why evidence",
  4: "Upload your resume",
  6: "ATS calculation",
  7: "Scanned and scored",
  8: "Get started",
};

/** The three chapter changes. The engine refuses to rest on any of them. */
export const PASS_THROUGH_STEPS = [1, 3, 5] as const;

/**
 * The reference ALSO treats `endStep - 1` as a desktop-only pass-through,
 * because its own penultimate step is transitional. Ours is step 7 — the scan,
 * a real rest and the payoff of the whole section — so leaving that rule on
 * would make it unreachable on any viewport wider than 1023px. Turn it back on
 * only once a step 9 exists and step 7 is no longer the penultimate one.
 */
export const EDGE_PASS_THROUGH = false;

/* ──────────────────────────── beats ──────────────────────────── */

export interface Beat {
  step: number;
  id: string;
  /** Drives `whiteTheme`: dark surfaces get white nav + white dots. */
  surface: Surface;
  label: string;
}

export const BEATS: readonly Beat[] = [
  { step: 0, id: "hero", surface: "dark", label: "Introducing Jobly" },
  { step: 2, id: "thesis", surface: "dark", label: "Why evidence" },
  // The mint band is a LIGHT surface — the nav and dots have to go dark here.
  { step: 4, id: "import", surface: "light", label: "Upload your resume" },
  // By 5.5 the mint has fully retracted and the stage is bare cream.
  { step: 6, id: "calc", surface: "light", label: "ATS calculation" },
  { step: 7, id: "scan", surface: "light", label: "Scanned and scored" },
  // At step 8 the bottom 39% carries the dark footer band, but everything above
  // it is still cream — so this reads LIGHT. A white nav here would vanish.
  { step: 8, id: "seam", surface: "light", label: "Get started" },
];

/** Nearest beat at or before `pos` — mirrors `selectItemForStep`. */
export function surfaceAt(pos: number): Surface {
  let surface: Surface = BEATS[0].surface;
  for (const beat of BEATS) {
    if (beat.step <= pos + 0.5) surface = beat.surface;
    else break;
  }
  return surface;
}

/* ──────────────────────────── copy ──────────────────────────── */

export const COPY = {
  hero: {
    title: "Introducing Jobly",
    subheader: "A tool for proving what you can actually do",
  },
  /**
   * The reference's alternating serif / geometric-bold stack. Read down:
   * "Because we believe / Great Offers / start with / Great Evidence /
   * Here's how it works:" — the two bold lines carry the argument, the serif
   * lines are connective tissue.
   */
  thesis: {
    upper: "Because we believe",
    boldA: "Great Offers",
    mid: "start with",
    boldB: "Real Evidence",
    bottom: "Here's how it works:",
  },
  import: {
    label: "Step one",
    title: "Upload Resume",
    subheader: "Start from the CV you already have",
  },
  calc: {
    label: "Step two",
    title: "ATS Calculation",
    subheader: "Seven weighted categories, scored off your own sentences",
  },
  /** What the page says about itself while it is being read. */
  scan: {
    chip: "ATS parse",
    cap: "ATS score",
    foot: "Every point traced to a quote",
  },
  seam: {
    lead: "Great Offers start with",
    em: "Real Evidence",
    trail: "Now",
    kicker: "Sign up for the free beta",
  },
} as const;

/* ──────────────────────── the triptych ──────────────────────── */

/**
 * Three cards, measured off the reference. Three DIFFERENT aspect ratios is
 * what stops it reading as a grid:
 *
 *   left    17.6vw x 30vh   ~1.04  (square)
 *   centre  32.0vw x 77vh   ~0.74  (portrait)  <- the hero itself
 *   right   17.4vw x 54vh   ~0.57  (tall portrait)
 *
 * All three crop the SAME photograph (`hero.jpg`, 1920x1280). That is not a
 * compromise — the reference's siblings are visibly of a piece with its hero
 * too. What sells them as three separate photographs is that each one is at a
 * different scale AND a different grade, over one shared light source.
 *
 * `size`/`position` are static CSS, so the crops cost nothing to animate.
 * The centre card carries no crop: it is the full frame, revealed by closing a
 * `clip-path` around the untouched full-bleed image.
 */
export interface Card {
  id: "left" | "centre" | "right";
  /** Rest size, in viewport units. */
  w: number;
  h: number;
  /** Rest offset of the card's centre from the stage centre, in vw. */
  x: number;
  /** Rest offset from the stage centre, in vh. */
  y: number;
  /** `background-size`, as a percentage of the card box. Centre is unused. */
  size?: string;
  /** `background-position`. */
  position?: string;
  /** Per-card grade, so three crops read as three photographs. */
  filter?: string;
  /** Where it slides in from, in vw — siblings arrive from outside the frame. */
  fromX?: number;
}

export const CARDS: readonly Card[] = [
  {
    id: "left",
    w: 17.6,
    h: 30,
    x: -23.5,
    y: 8,
    // the laptop + hands: the warmest, busiest corner of the frame
    size: "240%",
    position: "68% 62%",
    filter: "saturate(1.08) contrast(1.04)",
    fromX: -4,
  },
  { id: "centre", w: 32, h: 77, x: 0, y: 0 },
  {
    id: "right",
    w: 17.4,
    h: 54,
    x: 24.7,
    y: -2,
    // the left figure in profile: cooler and flatter, so it reads as a
    // different exposure rather than the same photo twice
    size: "300%",
    position: "33% 38%",
    filter: "saturate(0.72) brightness(1.04)",
    fromX: 4,
  },
];

export const CENTRE_CARD = CARDS[1];

/**
 * The centre card's rest rect as `clip-path: inset()` values. A 32vw x 77vh box
 * centred in the viewport leaves (100-77)/2 = 11.5vh above and below, and
 * (100-32)/2 = 34vw either side.
 *
 * Animating the CLIP rather than a scale is the whole trick. Scaling a
 * 32vw x 77vh box up to cover the viewport needs scaleX 3.125 and scaleY 1.30 —
 * non-uniform distorts the photograph, and a uniform 3.125 blows the image up
 * more than 3x so step 0 would show a heavily zoomed crop instead of the full
 * frame. Closing a clip keeps the pixels exactly where they are and narrows the
 * window onto them, which is literally what the reference does: the image does
 * not shrink, the frame shortens.
 */
export const CENTRE_INSET = {
  top: (100 - CENTRE_CARD.h) / 2,
  side: (100 - CENTRE_CARD.w) / 2,
} as const;

/* ─────────────────────── the drifting glyphs ─────────────────────── */

export type ShapeKind = "triangle" | "triangleDown" | "diamond" | "circle" | "square" | "arc";

/**
 * The outlined glyphs behind the thesis.
 *
 * This is the single biggest "premium" tell in the whole section, and it is
 * mostly a restraint exercise: `fill: none`, a hairline stroke, and an opacity
 * low enough that you register the movement before you register the shapes.
 * Visible outlines read cheap immediately.
 *
 * Two motions compose. The idle drift (up + a few degrees of rotation) is a CSS
 * animation, on purpose: it runs on the compositor for free and — crucially —
 * keeps moving while the user is STATIONARY, which is exactly when they notice
 * it. A rAF loop would cost more and buy nothing. Each glyph gets its own
 * duration and a NEGATIVE delay, so they start mid-cycle and never sync up.
 * The scroll-driven parallax rides on top, from the wrapper.
 *
 *   x, y   position in %, relative to the stage
 *   size   px
 *   dur    idle drift cycle, seconds
 *   delay  negative, so the cycle is already running on first paint
 *   op     stroke opacity — the large ones stay fainter
 *   depth  parallax multiplier
 *   sw     stroke width in px; omitted means the field's default
 */
export interface Shape {
  kind: ShapeKind;
  x: number;
  y: number;
  size: number;
  rot: number;
  dur: number;
  delay: number;
  op: number;
  depth: number;
  sw?: number;
}

/**
 * Fourteen glyphs, denser toward the edges and deliberately absent from the
 * central type column (roughly x 28-72) so nothing ever sits behind a word.
 */
export const SHAPES: readonly Shape[] = [
  { kind: "triangle", x: 8, y: 22, size: 96, rot: -8, dur: 31, delay: -4, op: 0.1, depth: 0.5 },
  { kind: "circle", x: 17, y: 62, size: 64, rot: 0, dur: 27, delay: -11, op: 0.13, depth: 0.8 },
  { kind: "diamond", x: 5, y: 78, size: 54, rot: 12, dur: 35, delay: -19, op: 0.11, depth: 0.6 },
  { kind: "square", x: 22, y: 12, size: 44, rot: 18, dur: 24, delay: -7, op: 0.14, depth: 1.1 },
  { kind: "arc", x: 13, y: 40, size: 112, rot: -22, dur: 38, delay: -25, op: 0.08, depth: 0.4 },
  {
    kind: "triangleDown",
    x: 25,
    y: 86,
    size: 58,
    rot: 6,
    dur: 29,
    delay: -14,
    op: 0.12,
    depth: 0.9,
  },
  { kind: "circle", x: 2, y: 48, size: 38, rot: 0, dur: 26, delay: -2, op: 0.15, depth: 1.3 },

  { kind: "diamond", x: 92, y: 18, size: 88, rot: -14, dur: 33, delay: -9, op: 0.1, depth: 0.55 },
  { kind: "triangle", x: 80, y: 70, size: 66, rot: 10, dur: 28, delay: -21, op: 0.12, depth: 0.85 },
  { kind: "circle", x: 95, y: 56, size: 120, rot: 0, dur: 40, delay: -30, op: 0.07, depth: 0.35 },
  { kind: "square", x: 76, y: 30, size: 40, rot: -20, dur: 25, delay: -5, op: 0.14, depth: 1.2 },
  { kind: "arc", x: 88, y: 84, size: 74, rot: 34, dur: 36, delay: -16, op: 0.09, depth: 0.5 },
  {
    kind: "triangleDown",
    x: 97,
    y: 34,
    size: 48,
    rot: -6,
    dur: 30,
    delay: -23,
    op: 0.13,
    depth: 1,
  },
  { kind: "diamond", x: 71, y: 92, size: 42, rot: 8, dur: 27, delay: -12, op: 0.12, depth: 1.05 },
];

/**
 * The WARM set, behind the sheet at steps 6-7. A different regime entirely from
 * the thesis glyphs, and that difference is the point — the same field in a new
 * colour would read as a reskin.
 *
 *   · solid yellow (`--lp-marker-edge`) rather than translucent white
 *   · 0.7-1.0 opacity rather than 0.07-0.15, so they are properly present
 *   · 3-4px strokes rather than hairlines
 *   · nine, not fourteen: bigger and sparser
 *
 * On `--lp-marker` itself they drew as smudges: that token is tuned to be the
 * brightest thing on a dark surface, and against the cream stage it is nearly
 * the same luminance. See `--lp-marker-edge` in `landing-intro.css`.
 *
 * They sit BEHIND the page (z 22 against the page's 30), so the sheet occludes
 * whatever it overlaps. That occlusion is what puts the page in front of a
 * world instead of on top of a pattern.
 *
 * PLACEMENT IS CONSTRAINED, not decorative. The score column (x 71-97, y 15-85
 * at step 7) has no background, so a glyph behind it shows through BETWEEN the
 * rows — a half-occluded triangle pointing at "Required Skills Evidence" reads
 * as a rendering fault. So the right-hand glyphs live in the 57-71vw gutter and
 * the top/bottom edges instead. A happy side effect: at step 6 the centred page
 * covers the gutter, so the field visibly opens up as the page settles left.
 */
export const SHAPES_WARM: readonly Shape[] = [
  {
    kind: "triangle",
    x: 18,
    y: 26,
    size: 150,
    rot: -10,
    dur: 34,
    delay: -6,
    op: 0.92,
    depth: 0.5,
    sw: 4,
  },
  {
    kind: "circle",
    x: 9,
    y: 66,
    size: 110,
    rot: 0,
    dur: 29,
    delay: -13,
    op: 0.85,
    depth: 0.8,
    sw: 4,
  },
  {
    kind: "arc",
    x: 26,
    y: 88,
    size: 170,
    rot: -18,
    dur: 38,
    delay: -22,
    op: 0.72,
    depth: 0.45,
    sw: 4,
  },
  {
    kind: "diamond",
    x: 4,
    y: 38,
    size: 90,
    rot: 12,
    dur: 31,
    delay: -3,
    op: 0.8,
    depth: 1,
    sw: 3.5,
  },
  {
    kind: "square",
    x: 31,
    y: 12,
    size: 72,
    rot: 16,
    dur: 26,
    delay: -17,
    op: 1,
    depth: 1.15,
    sw: 3.5,
  },

  {
    kind: "triangleDown",
    x: 62,
    y: 9,
    size: 128,
    rot: 8,
    dur: 33,
    delay: -9,
    op: 0.88,
    depth: 0.6,
    sw: 4,
  },
  {
    kind: "circle",
    x: 58,
    y: 93,
    size: 164,
    rot: 0,
    dur: 40,
    delay: -28,
    op: 0.7,
    depth: 0.4,
    sw: 4,
  },
  {
    kind: "diamond",
    x: 95,
    y: 97,
    size: 96,
    rot: -14,
    dur: 28,
    delay: -19,
    op: 0.82,
    depth: 0.95,
    sw: 3.5,
  },
  {
    kind: "triangle",
    x: 67,
    y: 62,
    size: 80,
    rot: 22,
    dur: 25,
    delay: -11,
    op: 0.96,
    depth: 1.2,
    sw: 3.5,
  },
];

/* ─────────────────────── the page, at step 4 ─────────────────────── */

/**
 * What the page types into itself. The reference types a client name then a
 * campaign title; ours types the resume header, because that is the artefact
 * the section is actually about.
 */
export const PAGE = {
  tag: "RESUME.PDF",
  /** Typed character by character, in order. */
  name: "Ari Patel",
  role: "Senior Frontend Engineer",
  section: "Experience",
  /**
   * Body skeleton. `w` is the line's width as a fraction of the text column;
   * they grow by `scaleX` from the left, which reads as text being laid in
   * rather than a block fading up.
   */
  lines: [0.96, 0.88, 0.94, 0.72, 0.9, 0.84, 0.66] as const,
} as const;

/**
 * The five sibling documents.
 *
 * They arrive from outside the frame and come to rest PARTLY off it — that
 * clipping is what makes the composition feel larger than the viewport instead
 * of politely contained. Two are rotated 90 degrees with vertical titles, as in
 * the reference.
 *
 *   from   where it enters, in viewport fractions from centre
 *   to     rest offset, in viewport fractions from centre
 *   out    where it scatters to on the outro (step 4 -> 5)
 *   rot    rest rotation, degrees
 *   rotOut scatter rotation, degrees
 *   w/h    size in vw/vh
 *   lead   stagger offset, in steps
 */
export interface Sibling {
  id: string;
  title: string;
  /** 90-degree rotated card with a vertical title, as in the reference. */
  vertical?: boolean;
  from: readonly [number, number];
  to: readonly [number, number];
  out: readonly [number, number];
  rot: number;
  rotOut: number;
  w: number;
  h: number;
  lead: number;
}

export const SIBLINGS: readonly Sibling[] = [
  {
    id: "s1",
    title: "Resume v1",
    from: [0.62, -0.58],
    to: [0.3, -0.26],
    out: [0.78, -0.72],
    rot: 7,
    rotOut: 19,
    w: 13,
    h: 32,
    lead: 0,
  },
  {
    id: "s2",
    title: "Cover letter",
    vertical: true,
    from: [0.74, 0.06],
    to: [0.37, 0.1],
    out: [0.92, 0.2],
    rot: 90,
    rotOut: 102,
    w: 11,
    h: 27,
    lead: 0.03,
  },
  {
    id: "s3",
    title: "Portfolio",
    from: [-0.66, 0.6],
    to: [-0.31, 0.28],
    out: [-0.84, 0.78],
    rot: -9,
    rotOut: -22,
    w: 12.5,
    h: 30,
    lead: 0.06,
  },
  {
    id: "s4",
    title: "Transcript",
    vertical: true,
    from: [-0.76, -0.1],
    to: [-0.38, -0.08],
    out: [-0.95, -0.24],
    rot: -90,
    rotOut: -104,
    w: 11,
    h: 26,
    lead: 0.09,
  },
  {
    id: "s5",
    title: "References",
    from: [0.08, 0.78],
    // Was [0.04, 0.42]: centred under the sheet with its bottom 6vh below the
    // fold, then [0.14, 0.33]: still tucked behind the sheet's bottom-right
    // corner. Now parked fully clear of the sheet (sheet's right edge is
    // ~15vw from centre at the step-4 scale; this card spans 16-28vw), so it
    // reads as its own document instead of a sliver behind the protagonist.
    to: [0.22, 0.36],
    out: [0.3, 0.96],
    rot: 4,
    rotOut: 13,
    w: 12,
    h: 28,
    lead: 0.12,
  },
];

/* ───────────────── the page, grown: real geometry ───────────────── */

/**
 * THE A4 PROBLEM.
 *
 * The page cannot animate width/height — that is layout work on every frame.
 * It has to be `scale`. Which means the box is rendered at its FINAL size and
 * scaled DOWN for step 4, never up, so the text is never a stretched bitmap.
 *
 * That forces the step-4 geometry to change slightly, and it is worth getting
 * right. The old page was 30vw x 76vh, which at 1600x900 is 480x684 — a 0.70
 * ratio, near A4 by accident. This makes it deliberate, using the house pattern
 * already in `styles.css` (`.landing-resume`: height in vh, width derived):
 *
 *   height 92vh  ->  width = 92vh * 17/22   (US Letter, 0.7727)
 *   step 4:  scale(0.75)  ->  30vw x 69vh   (was 30vw x 76vh)
 *   step 6:  scale(1)     ->  40vw x 92vh
 *
 * Correctly proportioned at both sizes and locked to HEIGHT, so it holds at any
 * viewport aspect. The one visual regression: step 4's page is a touch shorter
 * than before.
 *
 * `vwCap` stops a tall-narrow viewport (1024x1200, say) from producing a sheet
 * wider than the frame: the height becomes `min(92vh, vwCap)`.
 */
export const PAGE_BOX = {
  h: 92,
  /** width = height * ratio */
  ratio: 17 / 22,
  vwCap: 56,
  /** scale at the step-4 rest, and at the step-6/7 rests */
  smallScale: 0.75,
  fullScale: 1,
} as const;

/**
 * The grown page's rhythm.
 *
 * These numbers become CSS custom properties on the page AND derive the chip
 * launch points below, so the two cannot drift apart. Change a value here and
 * both the layout and the flight paths follow.
 *
 * The vertical/horizontal split is not cosmetic: vertical measures are emitted
 * as fractions of the page HEIGHT and horizontal ones as fractions of its
 * WIDTH, so the sheet keeps its proportions at any viewport instead of only at
 * 16:9. A document that stretches is the fastest way to stop looking like paper.
 *
 * Budget check at 1600x900: the page is 828px tall, 745px of it content after
 * padding. Header + three sections + seven bullets + a skills line comes to
 * about 72vh of the 82vh available — so it breathes, which is most of what makes
 * a document look real rather than mocked.
 */
export const DOC = {
  /** Vertical rhythm, in vh against a 92vh page. */
  v: {
    padY: 5,
    tagH: 1.7,
    nameTop: 2,
    nameH: 3.8,
    roleH: 2.4,
    ruleTop: 3.2,
    /** gap before each section block */
    secTop: 4.4,
    secHeadH: 2.4,
    bulletGap: 2,
    bulletH: 2.2,
    skillsTop: 4,
    skillsHeadH: 2.2,
    skillsLineH: 2.8,
  },
  /** Horizontal measures, in vw at the 16:9 reference viewport. */
  h: {
    padX: 2.9,
    /** indent of the bullet text past its marker */
    bulletIndent: 1.4,
  },
} as const;

/** The page's width in vw at the 16:9 reference — 92 * 17/22 * 9/16 ≈ 40. */
export const PAGE_REF_W = PAGE_BOX.h * PAGE_BOX.ratio * (9 / 16);

/**
 * Approximate advance width of the body face, in vw at the 16:9 reference
 * (12.2px glyphs in a 1600px frame). Used ONLY to aim a chip's launch point at
 * roughly the phrase it came from; a vw or two of error there is invisible,
 * because the row flashes at the same moment and the eye ties them together.
 */
const BODY_CHAR_W = 0.381;

/* ───────────────── the resume, for real ───────────────── */

/** The candidate the sheet actually shows. */
export const RESUME_CANDIDATE = CANDIDATES[0];

export interface ResumeBullet {
  id: string;
  /** Index into EVIDENCE — identity, skill and ATS category come from there. */
  atom: number;
  /** Scan order: DOCUMENT order, top to bottom. The band only ever travels down. */
  order: number;
  /** `mark[0]` — how far into the line the phrase starts, in characters. */
  markAt: number;
  before: string;
  phrase: string;
  after: string;
  skill: string;
  atsCat: string;
}

export interface ResumeBlock {
  id: string;
  label: string;
  bullets: readonly ResumeBullet[];
}

/**
 * Built from data that already exists: `CANDIDATES[0]` for the header and the
 * skills line, and all seven `EVIDENCE` sentences dropped into their real
 * section. Every phrase that needs highlighting already carries a character
 * range in `EVIDENCE[].mark`, so nothing here is authored twice.
 *
 * Note the ORDER. `EVIDENCE` is in atom order (e1..e7), but e5 lives under
 * Impact and e6 under Education, so document order is e1 e2 e3 e4 e7 e5 e6.
 * `order` is the document position and it is what drives the scan — otherwise
 * the band would jump back up the page twice.
 */
function buildBody(): ResumeBlock[] {
  let order = 0;
  return RESUME_SECTIONS.map((section) => ({
    id: section.id,
    label: section.label,
    bullets: EVIDENCE.flatMap((e, atom): ResumeBullet[] => {
      if (e.section !== section.id) return [];
      const [a, b] = e.mark;
      return [
        {
          id: e.id,
          atom,
          order: order++,
          markAt: a,
          before: e.text.slice(0, a),
          phrase: e.text.slice(a, b),
          after: e.text.slice(b),
          skill: e.skill,
          atsCat: e.atsCat,
        },
      ];
    }),
  })).filter((block) => block.bullets.length > 0);
}

export const RESUME_BODY: readonly ResumeBlock[] = buildBody();

/** Every bullet, flattened, in document order. */
export const RESUME_BULLETS: readonly ResumeBullet[] = RESUME_BODY.flatMap((b) => [...b.bullets]);

export const RESUME = {
  tag: PAGE.tag,
  name: RESUME_CANDIDATE.name,
  role: RESUME_CANDIDATE.role,
  org: RESUME_CANDIDATE.company,
  skillsLabel: "Skills",
  skills: RESUME_CANDIDATE.fields,
  score: RESUME_CANDIDATE.scoreBefore,
} as const;

/* ───────────────── step 7: the scan ───────────────── */

/**
 * SEVEN ATOMS, ONE AFTER ANOTHER, 0.082 of a step apart — essentially the long
 * story's `PARSE_LINE_STEP` of 0.12, tightened so that the last chip not only
 * LANDS before the rest at 7.0 but has finished dissolving into its row. The
 * first cut of this left "B.Tech CSE" parked on the Education row at a third
 * opacity for the entire beat. Worked backwards from that:
 *
 *   last chip must be GONE by  <= 6.96
 *   dissolve                    = 0.06
 *   flight                      = 0.13
 *   leaves at                   = its phrase's paint start + 0.055
 *   => last phrase starts      <= 6.72  =>  start + 6 * step <= 6.72
 *
 * `paint` (0.1) is longer than `step` (0.082), so adjacent strokes overlap and
 * the band reads as one continuous travel rather than seven separate dabs.
 *
 * `ats_readability` has no sentence — it is structural — so it lands last, on
 * its own, which is exactly what the real `useLiveScore` did.
 */
export const SCAN = {
  start: 6.22,
  step: 0.082,
  paint: 0.1,
  readabilityAt: 6.73,
  readabilityLen: 0.1,
  /** Chip launch, relative to its phrase's paint start. */
  chipLead: 0.055,
  chipLen: 0.13,
  /**
   * Fraction of each slot the band spends parked on the row before travelling
   * to the next. Bigger when the next row is in a new section, so the pause at
   * a section boundary is legible as a pause.
   */
  hold: 0.42,
  holdSection: 0.62,
} as const;

/** When the band finishes its last row. */
export const SCAN_END = SCAN.start + (RESUME_BULLETS.length - 1) * SCAN.step + SCAN.paint;

/** 0 -> 1 paint progress for the bullet at document position `order`. */
export function bulletPaint(p: number, order: number): number {
  return limit((p - (SCAN.start + order * SCAN.step)) / SCAN.paint, 0, 1);
}

/** Document positions of the bullets that pay into each ATS category. */
export const CAT_ORDERS: Readonly<Record<string, readonly number[]>> = (() => {
  const map: Record<string, number[]> = {};
  for (const b of RESUME_BULLETS) (map[b.atsCat] ??= []).push(b.order);
  return map;
})();

/**
 * How full a category row is.
 *
 * The MEAN of its contributing bullets, not the max — `required_skills` is paid
 * for by two sentences (React, then TypeScript), so it fills halfway, then
 * fills the rest. That reads as "two quotes bought this row", which is the
 * claim the section is making.
 */
export function catProgress(p: number, catId: string): number {
  if (catId === "ats_readability") {
    return limit((p - SCAN.readabilityAt) / SCAN.readabilityLen, 0, 1);
  }
  const orders = CAT_ORDERS[catId];
  if (!orders || orders.length === 0) return 0;
  let sum = 0;
  for (const order of orders) sum += bulletPaint(p, order);
  return sum / orders.length;
}

/**
 * The number on screen.
 *
 * Sum of `earned` weighted by how much of each row has actually been scanned,
 * so it is always honest about what has been read. At completion this is
 * 30 + 7 + 12 + 13 + 5 + 5 + 10 = 82, which is `CANDIDATES[0].scoreBefore`.
 *
 * (EVIDENCE's own `pts` field sums to 60 and is the long story's business. The
 * on-screen number here is driven by the CATEGORIES, because that is what
 * mirrors the real `score-role-fit.js` structure.)
 */
export function liveScore(p: number): number {
  let total = 0;
  for (const cat of ATS_CATEGORIES) total += cat.earned * catProgress(p, cat.id);
  return total;
}

/** Sanity: what the ring reads at rest. */
export const SCORE_TOTAL = ATS_CATEGORIES.reduce((n, c) => n + c.earned, 0);

/* ───────────────── step 7: the score column ───────────────── */

/**
 * The column lives on the RIGHT only. The left margin stays empty, because one
 * new element per beat is the discipline that is making this feel premium.
 *
 * Every box is authored in vh here rather than left to flow, for one reason:
 * `scoreRowY` has to be able to say where a row IS without measuring, so the
 * chips can be aimed at it from a completely different component.
 */
export const SCORE = {
  /** right inset and width, in vw */
  right: 3.4,
  w: 26,
  ringH: 16.5,
  headGap: 2.6,
  rowH: 5.4,
  rowGap: 1,
  footGap: 2.2,
  footH: 3.2,
  /** Ring geometry, same as the long story's: r=52 in a 112 box. */
  r: 52,
  circ: 326.7,
  /** Where a chip comes to rest, in viewport fractions from the stage centre. */
  chipX: 0.225,
} as const;

export const SCORE_ROWS = ATS_CATEGORIES.length;

export const SCORE_COL_H =
  SCORE.ringH +
  SCORE.headGap +
  SCORE_ROWS * SCORE.rowH +
  (SCORE_ROWS - 1) * SCORE.rowGap +
  SCORE.footGap +
  SCORE.footH;

/** Centre of row `k`, in viewport fractions from the stage centre. */
export function scoreRowY(k: number): number {
  const top = -SCORE_COL_H / 2 + SCORE.ringH + SCORE.headGap;
  return (top + k * (SCORE.rowH + SCORE.rowGap) + SCORE.rowH / 2) / 100;
}

/* ───────────────── step 7: the keyword flight ───────────────── */

/**
 * The page settles LEFT of centre at step 7 to clear room for the column. It
 * ends up spanning roughly 17vw-57vw, with the column from 71vw-97vw — a 14vw
 * gutter between them and a quiet 17vw left margin.
 */
export const PAGE_SHIFT_X = -13;

/** Where the page sits vertically at each rest, in vh from the stage centre.
 *  `grown` was 4, which parked the 92vh sheet's bottom edge exactly on the
 *  viewport fold (50 + 46 + 4 = 100) so it read as clipped. 2 leaves breathing
 *  room at any aspect. */
export const PAGE_Y = { grown: 2, settled: -1 } as const;

export interface Chip {
  id: string;
  label: string;
  /** Document position — drives when it leaves. */
  order: number;
  /** Row index in `ATS_CATEGORIES`. */
  row: number;
  /** Which lane in that row, when two phrases pay into the same one. */
  lane: number;
  /** Launch point, viewport fractions from the stage centre. */
  from: readonly [number, number];
}

/**
 * Where bullet `order` sits on the grown page, in viewport fractions from the
 * stage centre, walked straight down `DOC` so it tracks the real layout.
 */
function bulletPoint(bullet: ResumeBullet): [number, number] {
  const { v, h } = DOC;
  let y = -PAGE_BOX.h / 2 + v.padY;
  y += v.tagH + v.nameTop + v.nameH + v.roleH + v.ruleTop;

  let centre = y;
  for (const block of RESUME_BODY) {
    y += v.secTop + v.secHeadH;
    for (const b of block.bullets) {
      y += v.bulletGap;
      if (b.order === bullet.order) centre = y + v.bulletH / 2;
      y += v.bulletH;
    }
  }

  // The page's left text edge at the step-7 rest, then along the line to the
  // middle of the marked phrase.
  const textLeft = PAGE_SHIFT_X - PAGE_REF_W / 2 + h.padX + h.bulletIndent;
  const x = textLeft + (bullet.markAt + bullet.phrase.length / 2) * BODY_CHAR_W;

  return [x / 100, centre / 100];
}

/**
 * `DOC` and `PAGE_BOX` as CSS custom properties, so the stylesheet and the
 * flight paths above are reading the same numbers. Spread onto the page's
 * `style`; every rhythm value in `landing-intro.css` is a `var(--doc-*)`.
 */
export const PAGE_VARS: Record<string, string> = (() => {
  const kebab = (k: string) => k.replace(/[A-Z]/g, (c) => `-${c.toLowerCase()}`);
  const out: Record<string, string> = {
    "--page-h": `min(${PAGE_BOX.h}vh, ${PAGE_BOX.vwCap}vw)`,
    "--page-w": `calc(var(--page-h) * ${PAGE_BOX.ratio.toFixed(6)})`,
  };
  for (const [k, val] of Object.entries(DOC.v)) {
    out[`--doc-${kebab(k)}`] = `calc(var(--page-h) * ${(val / PAGE_BOX.h).toFixed(6)})`;
  }
  for (const [k, val] of Object.entries(DOC.h)) {
    out[`--doc-${kebab(k)}`] = `calc(var(--page-w) * ${(val / PAGE_REF_W).toFixed(6)})`;
  }
  return out;
})();

export const CHIPS: readonly Chip[] = (() => {
  const lanes: Record<number, number> = {};
  return RESUME_BULLETS.map((bullet): Chip => {
    const row = ATS_CATEGORIES.findIndex((c) => c.id === bullet.atsCat);
    const lane = lanes[row] ?? 0;
    lanes[row] = lane + 1;
    return {
      id: bullet.id,
      label: bullet.skill,
      order: bullet.order,
      row: row < 0 ? 0 : row,
      lane,
      from: bulletPoint(bullet),
    };
  });
})();

/* ──────────────────────────── anchors ──────────────────────────── */

/**
 * `(anchor, length)` in the engine's grammar: `anchor` is the step at which the
 * element rests, `length` the half-window outside which it is culled.
 *
 * Only elements that genuinely use the `SwipeElement` / `PanelElement` grammar
 * appear here. Several beats are driven by explicit `ramp()` windows instead,
 * and that is a deliberate choice rather than a shortcut — the template grammar
 * fixes every intro phase at exactly one step long, which is too coarse for the
 * things that have to happen in sequence INSIDE one continuous move:
 *
 *   · the side cards must wait until the centre frame is already closing, so
 *     they enter over pos 0.42 -> 1.0 rather than the 0 -> 1 the grammar forces
 *   · the ink panel needs a hard edge travelling up, which is a slide, not the
 *     centre-line `scaleY` wipe `PanelElement` performs
 *   · the page's six typed elements have to land in order between 3.5 and 4.0,
 *     and the page itself then has to grow, settle and leave across 4.5 -> 8.0
 *
 * Those windows live next to the code that uses them, in `HeroTriptych`,
 * `ThesisPanel`, `ImportStage` and `ResumePage`.
 */
export const ANCHORS = {
  /** A dark floor behind the hero, so the preloader reveal never flashes cream. */
  inkFloor: { anchor: -1, length: 1 },

  /* ── steps 0-1: the hero becomes a triptych ── */
  heroPhoto: { anchor: 0, length: 2.2 },
  heroTitle: { anchor: 0, length: 1.3 },

  /* ── step 2: the thesis ── */
  shapeField: { anchor: 2, length: 1.6 },

  /* ── steps 3-4: the import ──
     See the note at the head of `ImportStage` for how this window is derived:
     `anchor - length = 2.5` puts the opening wipe at pos 3.0 -> 3.5, and
     `length > 5 - anchor` is what keeps step 4 inside the hold phase. Retracts
     over 4.5 -> 5.5, which is the first third of step 5's triple duty. */
  mintPanel: { anchor: 4, length: 1.5 },

  /* ── the protagonist: one sheet from 2.7 to 8.5 ──
     It rises at 3.12, types itself, grows and resolves across step 5, is read
     at step 7 and lifts away into the CTA. Never unmounted in between, which is
     the whole reason step 5 reads as the same document coming forward rather
     than one document leaving and another arriving. */
  resumePage: { anchor: 5.6, length: 2.9 },

  /* ── steps 6-7: the ATS calculation ── */
  warmShapes: { anchor: 6.5, length: 1.6 },
  scoreColumn: { anchor: 7, length: 1.2 },

  /* ── step 8: the seam (temporary CTA cap) ── */
  seamFooter: { anchor: 8, length: 1 },
} as const;
