import { motion, useTransform, type MotionValue } from "framer-motion";
import { cubicOut, limit } from "../beagleEase";
import { ramp, settle } from "./choreography";
import { HighlightedLine, MarkerNib } from "./Highlighter";
import { EVIDENCE, RESUME_SECTIONS, type Candidate, type Evidence } from "../sceneManifest";

/**
 * Beat 6: the parse page, rendered INSIDE the laptop screen.
 *
 * This is the resume as a document view — real sentences, real sections, a
 * line gutter — and the highlighter works through it one phrase at a time.
 * Each phrase finishes painted and stays painted, because the paint value is
 * the thing the next two beats consume (extract reads it to peel the phrase
 * off; score reads it to award the points).
 *
 * TIMING
 *   6.10 - 6.22  page fades up behind the cursor
 *   6.22 - 7.05  seven phrases painted, 0.12 step apart, 0.2 step each
 *   7.05 - 7.35  painted phrases flash once, then lift away (extract takes over)
 *   7.35 - 8.10  page recedes left to make room for the rail and the rows
 *
 * The lift at 7.05 overlaps SkillRail's entry at 6.95 — the phrase is already
 * on its way to the rail before the rail finishes arriving.
 */

export const PARSE_START = 6.22;
export const PARSE_LINE_STEP = 0.12;
export const PARSE_PAINT_LEN = 0.2;

/** Paint progress for a single evidence atom. */
export function evidencePaint(p: number, index: number): number {
  return ramp(p, PARSE_START + index * PARSE_LINE_STEP, PARSE_PAINT_LEN);
}

interface ParsePageProps {
  pos: MotionValue<number>;
  candidate: Candidate;
}

export function ParsePage({ pos, candidate }: ParsePageProps) {
  // The page holds the left of the screen, then slides back as rows arrive.
  const x = useTransform(pos, (p) => {
    const shift = ramp(p, 7.35, 0.6);
    return `${-shift * 9}%`;
  });
  const scale = useTransform(pos, (p) => 1 - ramp(p, 7.35, 0.6) * 0.08);
  const opacity = useTransform(pos, (p) => ramp(p, 6.1, 0.22) * (1 - ramp(p, 8.95, 0.4)));

  // Progress read-out across the parse beat.
  const progress = useTransform(pos, (p) =>
    limit((p - PARSE_START) / (EVIDENCE.length * PARSE_LINE_STEP + PARSE_PAINT_LEN), 0, 1),
  );
  const percent = useTransform(progress, (v) => `${Math.round(v * 100)}%`);
  const status = useTransform(pos, (p): string => {
    if (p < 6.3) return "Reading the document";
    if (p < 6.62) return "Marking evidence";
    if (p < 6.95) return "Matching skills to sentences";
    if (p < 7.3) return "Lifting the proof";
    return "Scoring against the role";
  });

  const grouped = RESUME_SECTIONS.map((section) => ({
    ...section,
    items: EVIDENCE.map((e, i) => ({ e, i })).filter(({ e }) => e.section === section.id),
  })).filter((s) => s.items.length > 0);

  return (
    <motion.section
      className="landing-parse-page"
      style={{ x, scale, opacity }}
      aria-label="Resume being parsed"
    >
      <header className="landing-parse-page-head">
        <div className="min-w-0">
          <p className="landing-parse-page-name">{candidate.name}</p>
          <p className="landing-parse-page-role">{candidate.headline}</p>
        </div>
        <div className="landing-parse-page-meta">
          <motion.span className="landing-parse-page-status">{status}</motion.span>
          <div className="landing-parse-page-bar">
            <motion.span style={{ scaleX: progress }} />
          </div>
          <motion.span className="landing-parse-page-pct">{percent}</motion.span>
        </div>
      </header>

      <div className="landing-parse-page-body">
        {grouped.map((section) => (
          <div key={section.id} className="landing-parse-group">
            <p className="landing-parse-group-cap">{section.label}</p>
            {section.items.map(({ e, i }) => (
              <ParseLine key={e.id} pos={pos} evidence={e} index={i} />
            ))}
          </div>
        ))}
      </div>

      <MarkerNib
        pos={pos}
        lines={EVIDENCE.length}
        startAt={PARSE_START}
        lineStep={PARSE_LINE_STEP}
        paintLen={PARSE_PAINT_LEN}
      />
    </motion.section>
  );
}

function ParseLine({
  pos,
  evidence,
  index,
}: {
  pos: MotionValue<number>;
  evidence: Evidence;
  index: number;
}) {
  const paint = useTransform(pos, (p) => evidencePaint(p, index));

  // The row the nib is on lifts toward the reader and brightens.
  const focus = useTransform(pos, (p) => {
    const start = PARSE_START + index * PARSE_LINE_STEP;
    const d = Math.abs(p - (start + PARSE_PAINT_LEN / 2));
    return limit(1 - d / 0.22, 0, 1);
  });
  const rowX = useTransform(focus, (v) => `${v * 8}px`);
  const rowOpacity = useTransform([paint, focus] as const, ([a, f]: number[]) =>
    0.42 + a * 0.42 + f * 0.16,
  );
  const rowBg = useTransform(focus, (v) => `rgba(127, 210, 177, ${v * 0.07})`);

  // Confirmation tick in the gutter, popping as the phrase completes.
  const tick = useTransform(paint, (v) => limit((v - 0.72) / 0.28, 0, 1));
  const tickScale = useTransform(tick, (v) => settle(v, 0.22, 1));

  // Line fades out as its phrase peels away in the extract beat.
  const lifted = useTransform(pos, (p) => ramp(p, 7.05 + index * 0.05, 0.3));
  const liftedOpacity = useTransform(lifted, (v) => 1 - v * 0.55);

  const { text, mark } = evidence;
  const before = text.slice(0, mark[0]);
  const phrase = text.slice(mark[0], mark[1]);
  const after = text.slice(mark[1]);

  return (
    <motion.p
      className="landing-parse-line"
      style={{ x: rowX, opacity: useMultiply(rowOpacity, liftedOpacity), backgroundColor: rowBg }}
    >
      <motion.span className="landing-parse-gutter" style={{ scale: tickScale, opacity: tick }}>
        ✓
      </motion.span>
      <span className="landing-parse-num">{String(index + 1).padStart(2, "0")}</span>
      <span className="landing-parse-body">
        <HighlightedLine paint={paint} before={before} phrase={phrase} after={after} />
      </span>
    </motion.p>
  );
}

/** Small helper so two independent opacity tracks can multiply cleanly. */
function useMultiply(a: MotionValue<number>, b: MotionValue<number>): MotionValue<number> {
  return useTransform([a, b] as const, ([x, y]: number[]) => x * y);
}

/**
 * The count of marked phrases, shown under the page. Reads as the machine
 * agreeing with itself — it only ever counts what has actually been painted.
 */
export function ParseTally({ pos }: { pos: MotionValue<number> }) {
  const opacity = useTransform(pos, (p) => ramp(p, 6.3, 0.3) * (1 - ramp(p, 7.5, 0.4)));
  const found = useTransform(pos, (p) => {
    let n = 0;
    for (let i = 0; i < EVIDENCE.length; i += 1) {
      if (evidencePaint(p, i) > 0.7) n += 1;
    }
    return String(n).padStart(2, "0");
  });
  const barScale = useTransform(pos, (p) => {
    let n = 0;
    for (let i = 0; i < EVIDENCE.length; i += 1) n += evidencePaint(p, i);
    return cubicOut(limit(n / EVIDENCE.length, 0, 1), 0, 1, 1);
  });

  return (
    <motion.div className="landing-parse-tally" style={{ opacity }}>
      <span className="landing-parse-tally-cap">Evidence marked</span>
      <motion.span className="landing-parse-tally-num">{found}</motion.span>
      <span className="landing-parse-tally-of">/ {String(EVIDENCE.length).padStart(2, "0")}</span>
      <span className="landing-parse-tally-track">
        <motion.span style={{ scaleX: barScale }} />
      </span>
    </motion.div>
  );
}
