import { motion, useTransform, type MotionValue } from "framer-motion";
import { cubicInOut, limit } from "../beagleEase";
import { PAPER_SHADOW } from "./paper";
import type { Candidate } from "../sceneManifest";

/**
 * THE PROTAGONIST.
 *
 * One resume sheet, mounted exactly once, alive across the whole story. It is
 * the thread that makes the nine beats a narrative instead of nine slides —
 * the same object is uploaded, parsed, scored, applied with, set aside for the
 * interview, annotated by the feedback, and finally handed back improved.
 *
 * Driven directly off `pos` (the scroll step) rather than `stepIndex`, because
 * the beats are the step numbers and that keeps the branches readable:
 *
 *   pos  0-2   raw        a plain resume, the thing you already have
 *   pos  3-4   parsed     fields light up as the AI extracts them
 *   pos  5     ingested   shrinks into the laptop screen to be scored
 *   pos  6     scored     returns carrying its 82, docks right to apply
 *   pos  7-8   aside      the candidate is in the room; the sheet waits
 *   pos  9     annotated  feedback pins attach to the weak lines
 *   pos 11     v2         rewritten headline, filled gaps, 94
 *
 * Because every state is a function of one scroll value, the transitions
 * between them are continuous by construction — there is no state machine to
 * fall out of sync.
 */

export type ResumeState = "raw" | "parsed" | "ingested" | "scored" | "aside" | "annotated" | "v2";

interface ResumeSheetProps {
  pos: MotionValue<number>;
  anchor: number;
  visibleLength: number;
  candidate: Candidate;
}

export function ResumeSheet({ pos, anchor, visibleLength, candidate }: ResumeSheetProps) {
  /* ── position track ───────────────────────────────────────────────
     Hard constraint: title cards own the top 25-48% of the viewport, so every
     rest pose sits below that band. The sheet also vacates the stage entirely
     for the three beats that have their own centrepiece (room, scorecard,
     study cards) and returns as v2 for the payoff. */
  const x = useTransform(pos, (p) => {
    if (p < 5) return 0;
    // 5 -> 6: slides right so the role cards own the left
    if (p < 6) return cubicInOut(p - 5, 0, 0.26, 1);
    // 6 -> 7: exits right while the interview runs
    if (p < 7) return cubicInOut(p - 6, 0.26, 0.5, 1);
    if (p < 10) return 0.76;
    // returns on the left for the loop payoff
    return cubicInOut(limit(p - 10, 0, 1), -0.12, -0.14, 1);
  });

  const y = useTransform(pos, (p) => {
    // hero: resting below the title
    if (p < 1.3) return 0.2;
    // 1.3 -> 2: drops away for the thesis
    if (p < 2) return cubicInOut((p - 1.3) / 0.7, 0.2, 0.95, 1);
    if (p < 3.2) return 1.15;
    // 3.2 -> 4: rises back for the upload beat
    if (p < 4) return cubicInOut((p - 3.2) / 0.8, 1.15, -0.88, 1);
    // 4 -> 5: travels up into the laptop screen
    if (p < 5) return cubicInOut(p - 4, 0.27, -0.29, 1);
    // 5 -> 6: comes back out carrying a score
    if (p < 6) return cubicInOut(p - 5, -0.02, 0.24, 1);
    // 6 -> 7: lifts out with the exit
    if (p < 7) return cubicInOut(p - 6, 0.22, -0.5, 1);
    if (p < 10) return -0.28;
    // the loop payoff
    return cubicInOut(limit(p - 10, 0, 1), -0.28, 0.21, 1);
  });

  const scale = useTransform(pos, (p) => {
    if (p < 2) return 0.78;
    if (p < 4) return 0.72;
    // shrinks into the laptop screen
    if (p < 5) return cubicInOut(p - 4, 0.72, -0.48, 1);
    // returns smaller, carrying its score
    if (p < 6) return cubicInOut(p - 5, 0.24, 0.42, 1);
    if (p < 10) return 0.66;
    return cubicInOut(limit(p - 10, 0, 1), 0.66, -0.2, 1);
  });

  const rotate = useTransform(pos, (p) => {
    if (p < 1.3) return -0.035;
    if (p < 2) return cubicInOut((p - 1.3) / 0.7, -0.035, 0.07, 1);
    if (p < 5) return 0;
    if (p < 6) return 0.03 * Math.sin((p - 5) * Math.PI);
    if (p < 10) return 0;
    return cubicInOut(limit(p - 10, 0, 1), 0.05, -0.05, 1);
  });

  /* Hidden inside the laptop, and while the room / verdict / study beats own
     the stage. Visible at steps 0, 4, 6 and 11. */
  const opacity = useTransform(pos, (p) => {
    if (p < 0.2) return limit(p / 0.2, 0, 1);
    if (p > 4.62 && p < 5.42) return 0; // absorbed by the laptop
    if (p > 6.75 && p < 10.1) return 0; // room, verdict, study own the stage
    return 1;
  });

  const transform = useTransform(
    [x, y, scale, rotate] as const,
    ([xv, yv, sv, rv]: number[]) =>
      `translate3d(calc(-50% + ${xv * 100}vw), calc(-50% + ${yv * 100}vh), 0) rotate(${
        rv * (180 / Math.PI)
      }deg) scale(${sv})`,
  );

  const visibility = useTransform(pos, (p) =>
    Math.abs(anchor - p) < visibleLength ? "visible" : "hidden",
  );

  /* ── state tracks ─────────────────────────────────────────────────
     Each visual change is its own transform over `pos`, so states blend
     rather than switch. */

  /** Extraction: field rows light up mint as the parser finds them, 3.3 -> 4. */
  const parseFill = useTransform(pos, (p) => limit((p - 3.3) / 0.55, 0, 1));

  /** Score badge: appears as the sheet leaves the laptop, 5.45 -> 6. */
  const scoreBadge = useTransform(pos, (p) => limit((p - 5.45) / 0.45, 0, 1));

  /** Applied stamp, 6.05 -> 6.45. */
  const appliedStamp = useTransform(pos, (p) => limit((p - 6.05) / 0.4, 0, 1));

  /**
   * The payoff, compressed into the 10 -> 11 return. The feedback pins land
   * first so you see what the interview flagged, then the marker rewrites the
   * headline and the flagged rows fill out — cause, then effect.
   */
  const annotations = useTransform(pos, (p) => limit((p - 10.15) / 0.3, 0, 1));
  const upgrade = useTransform(pos, (p) => limit((p - 10.5) / 0.45, 0, 1));

  const markerWidth = useTransform(upgrade, (u) => `${u * candidate.markerLength}ch`);
  const headlineOld = useTransform(upgrade, [0.45, 0.72], [1, 0]);
  const headlineNew = useTransform(upgrade, [0.45, 0.72], [0, 1]);
  const scoreNow = useTransform(upgrade, (u) =>
    Math.round(candidate.scoreBefore + (candidate.scoreAfter - candidate.scoreBefore) * u),
  );
  const badgeOpacity = useTransform([scoreBadge, upgrade] as const, ([s, u]: number[]) =>
    Math.max(s, u),
  );

  return (
    <motion.article
      className="landing-resume"
      style={{
        position: "absolute",
        left: "50%",
        top: "50%",
        zIndex: 30,
        transform,
        opacity,
        visibility,
        boxShadow: PAPER_SHADOW,
        willChange: "transform, opacity",
      }}
    >
      <div className="flex h-full flex-col p-[7%]">
        {/* header */}
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="landing-resume-name">{candidate.name}</p>
            <h3 className="landing-resume-role relative mt-1 inline-block">
              <motion.span
                aria-hidden="true"
                className="absolute inset-y-[-1px] -z-10 origin-left"
                style={{
                  left: `${candidate.markerStart}ch`,
                  width: markerWidth,
                  backgroundColor: "var(--lp-marker)",
                }}
              />
              <span className="relative inline-block whitespace-nowrap">
                <motion.span className="inline-block" style={{ opacity: headlineOld }}>
                  {candidate.headline}
                </motion.span>
                <motion.span
                  className="absolute left-0 top-0 inline-block whitespace-nowrap"
                  style={{ opacity: headlineNew }}
                >
                  {candidate.improvedHeadline}
                </motion.span>
              </span>
            </h3>
          </div>

          {/* the score it is carrying */}
          <motion.div
            className="landing-resume-badge shrink-0"
            style={{ opacity: badgeOpacity, scale: badgeOpacity }}
          >
            <motion.span className="landing-resume-badge-num">{scoreNow}</motion.span>
            <span className="landing-resume-badge-cap">fit</span>
          </motion.div>
        </div>

        <div className="mt-[6%] h-px bg-[var(--lp-ink)]/12" />

        {/* body — rows light up as they are parsed, then fill in on v2 */}
        <div className="mt-[6%] space-y-[4.5%]">
          {RESUME_ROWS.map((row, i) => (
            <ResumeRow
              key={i}
              index={i}
              width={row.w}
              weak={row.weak}
              parseFill={parseFill}
              annotations={annotations}
              upgrade={upgrade}
            />
          ))}
        </div>

        {/* applied stamp */}
        <motion.div
          className="landing-resume-stamp mt-[6%]"
          style={{ opacity: appliedStamp, scale: appliedStamp }}
        >
          Applied · {candidate.company}
        </motion.div>

        <div className="mt-auto flex items-center justify-between border-t border-[var(--lp-ink)]/10 pt-[5%]">
          <span className="h-2.5 w-2.5 rounded-full bg-[var(--lp-mint)]" />
          <span className="landing-resume-foot">Jobly</span>
        </div>
      </div>
    </motion.article>
  );
}

/** `weak` rows are the ones the interview feedback later pins. */
const RESUME_ROWS = [
  { w: 100, weak: false },
  { w: 92, weak: false },
  { w: 84, weak: true },
  { w: 96, weak: false },
  { w: 70, weak: true },
  { w: 58, weak: false },
];

function ResumeRow({
  index,
  width,
  weak,
  parseFill,
  annotations,
  upgrade,
}: {
  index: number;
  width: number;
  weak: boolean;
  parseFill: MotionValue<number>;
  annotations: MotionValue<number>;
  upgrade: MotionValue<number>;
}) {
  const start = index / RESUME_ROWS.length;
  // parse sweep, staggered row by row
  const parsed = useTransform(parseFill, (f) => limit((f - start * 0.6) / 0.4, 0, 1));
  const parsedWidth = useTransform(parsed, (v) => `${v * 100}%`);
  // weak rows get a pin at step 9, then are repaired on v2
  const pin = useTransform([annotations, upgrade] as const, ([a, u]: number[]) =>
    weak ? a * (1 - u) : 0,
  );
  // v2 extends the short rows — the gaps literally fill in
  const grown = useTransform(upgrade, (u) => `${width + (weak ? u * (98 - width) : 0)}%`);

  return (
    <div className="relative flex items-center gap-2">
      <motion.div className="relative h-[0.9vh] min-h-[4px]" style={{ width: grown }}>
        <div className="absolute inset-0 bg-[var(--lp-ink)]/10" />
        <motion.div
          className="absolute inset-y-0 left-0 bg-[var(--lp-mint)]"
          style={{ width: parsedWidth }}
        />
      </motion.div>
      {weak ? (
        <motion.span className="landing-resume-pin" style={{ opacity: pin, scale: pin }} />
      ) : null}
    </div>
  );
}
