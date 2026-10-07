import { motion, useTransform, type MotionValue } from "framer-motion";
import { cubicInOut, cubicOut, limit } from "../beagleEase";
import { ramp, settle } from "./choreography";
import { PAPER_SHADOW } from "./paper";
import { EVIDENCE, type Candidate, type Evidence } from "../sceneManifest";

/**
 * THE PROTAGONIST.
 *
 * One resume sheet, mounted exactly once, alive across the whole story. It is
 * the thread that makes the beats a narrative instead of a slide deck — the
 * same object is chosen off the desk, flown into the laptop, posted to three
 * mailboxes, set aside for the interview, broken by the feedback, repaired by
 * the marker, and finally filed.
 *
 *   pos  4-5     chosen     lifts out of the gathered stack
 *   pos  5-6     ingested   flies into the laptop screen and is absorbed
 *   pos  6-8     (hidden)   the laptop's parse page is the resume now
 *   pos  9       posted     returns, triplicates, flies into the mailboxes
 *   pos 11-12    aside      the candidate is in the room; the sheet waits
 *   pos 13       broken     the two weak lines fracture and shed shards
 *   pos 14       repaired   marker rewrites the headline and the weak lines
 *   pos 15+      filed      hands over to FolderStage
 *
 * Every state is a function of one scroll value, so the transitions between
 * them are continuous by construction and scrubbing backwards is exact.
 */

const WEAK_IDS = EVIDENCE.filter((e) => e.weak).map((e) => e.id);

interface ResumeSheetProps {
  pos: MotionValue<number>;
  anchor: number;
  visibleLength: number;
  candidate: Candidate;
}

export function ResumeSheet({ pos, anchor, visibleLength, candidate }: ResumeSheetProps) {
  /* ── position ─────────────────────────────────────────────────────
     Title cards own the top ~25-48% of the viewport, so every rest pose
     sits below that band. The sheet vacates entirely for the beats that
     have their own centrepiece (laptop interior, room, verdict, folder). */
  const x = useTransform(pos, (p) => {
    // lifts out of the stack, centre-left
    if (p < 4.4) return 0;
    // 4.4 -> 5.5 drifts toward the laptop screen
    if (p < 5.5) return cubicInOut((p - 4.4) / 1.1, 0, 0.02, 1);
    if (p < 8.9) return 0.02;
    // 8.9 -> 9.3 returns to centre to be copied
    if (p < 9.3) return cubicInOut((p - 8.9) / 0.4, 0.02, -0.04, 1);
    // 9.3 -> 10.4 slides left as the mailboxes take the stage
    if (p < 10.4) return cubicInOut((p - 9.3) / 1.1, -0.02, -0.38, 1);
    if (p < 12.9) return -0.4;
    // 12.9 -> 13.4 returns for the fix beat
    if (p < 13.4) return cubicInOut((p - 12.9) / 0.5, -0.4, 0.26, 1);
    if (p < 14.9) return -0.14;
    // hands over to the folder
    return cubicInOut(limit((p - 14.9) / 0.6, 0, 1), -0.14, 0.04, 1);
  });

  const y = useTransform(pos, (p) => {
    if (p < 4.0) return 1.2;
    // 4.0 -> 4.7 rises out of the stack
    if (p < 4.7) return cubicInOut((p - 4.0) / 0.7, 1.2, -1.02, 1);
    // 4.7 -> 5.6 travels up into the laptop screen
    if (p < 5.6) return cubicInOut((p - 4.7) / 0.9, 0.18, -0.34, 1);
    if (p < 8.9) return -0.16;
    // 8.9 -> 9.3 drops back to centre, carrying its score
    if (p < 9.3) return cubicInOut((p - 8.9) / 0.4, -0.16, 0.2, 1);
    // 9.3 -> 10.4 lifts away with the exit
    if (p < 10.4) return cubicInOut((p - 9.3) / 1.1, 0.04, -0.46, 1);
    if (p < 12.9) return -0.42;
    // 12.9 -> 13.4 comes back for the repair
    if (p < 13.4) return cubicInOut((p - 12.9) / 0.5, -0.42, 0.4, 1);
    if (p < 14.9) return -0.02;
    return cubicInOut(limit((p - 14.9) / 0.6, 0, 1), -0.02, -0.3, 1);
  });

  const scale = useTransform(pos, (p) => {
    if (p < 4.0) return 0.6;
    // readable while it is the hero of the gather beat
    if (p < 4.7) return cubicInOut((p - 4.0) / 0.7, 0.6, 0.34, 1);
    // shrinks into the laptop screen
    if (p < 5.6) return cubicInOut((p - 4.7) / 0.9, 0.94, -0.72, 1);
    if (p < 8.9) return 0.22;
    // returns at a legible size to be posted
    if (p < 9.3) return cubicInOut((p - 8.9) / 0.4, 0.22, 0.34, 1);
    if (p < 12.9) return 0.56;
    // the fix beat needs the text readable again
    if (p < 13.4) return cubicInOut((p - 12.9) / 0.5, 0.56, 0.34, 1);
    if (p < 14.9) return 0.9;
    return cubicInOut(limit((p - 14.9) / 0.6, 0, 1), 0.9, -0.3, 1);
  });

  const rotate = useTransform(pos, (p) => {
    if (p < 4.7) return cubicInOut(limit((p - 4.0) / 0.7, 0, 1), -0.06, 0.06, 1);
    if (p < 9.3) return 0;
    if (p < 10.4) return 0.04 * Math.sin((p - 9.3) * Math.PI);
    if (p < 13.4) return 0;
    if (p < 14.9) return -0.012;
    return cubicInOut(limit((p - 14.9) / 0.6, 0, 1), -0.012, 0.05, 1);
  });

  /* Hidden while the laptop interior, the room, the verdict and the folder
     own the stage. Visible at the gather, apply, fix and rewrite beats. */
  const opacity = useTransform(pos, (p) => {
    if (p < 4.0) return 0;
    const born = ramp(p, 4.0, 0.3);
    if (p > 5.62 && p < 8.86) return 0; // absorbed by the laptop
    if (p > 10.5 && p < 12.95) return 0; // room + verdict own the stage
    const filed = ramp(p, 15.3, 0.4); // folder takes over
    return born * (1 - filed);
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

  /* ── state tracks ─────────────────────────────────────────────── */

  /** Score badge: appears as the sheet leaves the laptop, 8.9 -> 9.3. */
  const scoreBadge = useTransform(pos, (p) => ramp(p, 8.9, 0.35));

  /** Applied stamp, once the copies are posted. */
  const appliedStamp = useTransform(pos, (p) => ramp(p, 9.95, 0.35) * (1 - ramp(p, 10.3, 0.3)));

  /** The fracture, 13.4 -> 13.85, and the repair, 14.1 -> 14.55. */
  const fracture = useTransform(pos, (p) => ramp(p, 13.4, 0.45));
  const repair = useTransform(pos, (p) => ramp(p, 14.1, 0.45));

  /** The marker rewriting the headline, 14.2 -> 14.6. */
  const upgrade = useTransform(pos, (p) => ramp(p, 14.2, 0.4));
  const markerWidth = useTransform(upgrade, (u) => `${u * candidate.markerLength}ch`);
  const headlineOld = useTransform(upgrade, [0.4, 0.68], [1, 0]);
  const headlineNew = useTransform(upgrade, [0.4, 0.68], [0, 1]);
  const scoreNow = useTransform([scoreBadge, upgrade] as const, ([s, u]: number[]) =>
    Math.round(
      candidate.scoreBefore + (candidate.scoreAfter - candidate.scoreBefore) * (s > 0 ? u : 0),
    ),
  );
  const badgeOpacity = useTransform(
    [scoreBadge, fracture] as const,
    ([s, f]: number[]) => Math.max(s, f),
  );
  const badgeScale = useTransform(badgeOpacity, (v) => settle(v, 0.08, 1));

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
      <div className="flex h-full flex-col p-[6%]">
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

          <motion.div
            className="landing-resume-badge shrink-0"
            style={{ opacity: badgeOpacity, scale: badgeScale }}
          >
            <motion.span className="landing-resume-badge-num">{scoreNow}</motion.span>
            <span className="landing-resume-badge-cap">fit</span>
          </motion.div>
        </div>

        <div className="mt-[5%] h-px bg-[var(--lp-ink)]/12" />

        {/* Real sentences. The weak ones fracture in beat 13 and are rewritten
            in beat 14, so the text itself carries the story. */}
        <div className="landing-resume-content mt-[4%]">
          {EVIDENCE.map((atom) => (
            <ResumeTextLine
              key={atom.id}
              atom={atom}
              fracture={fracture}
              repair={repair}
            />
          ))}
        </div>

        <motion.div
          className="landing-resume-stamp mt-[5%]"
          style={{ opacity: appliedStamp, scale: appliedStamp }}
        >
          Applied · 3 roles
        </motion.div>

        <div className="mt-auto flex items-center justify-between border-t border-[var(--lp-ink)]/10 pt-[4%]">
          <span className="h-2.5 w-2.5 rounded-full bg-[var(--lp-mint)]" />
          <span className="landing-resume-foot">Jobly</span>
        </div>
      </div>
    </motion.article>
  );
}

/**
 * One line of the resume.
 *
 * Strong lines keep their mint highlight from the parse. Weak lines grow a
 * fracture across them, dim, and shed their shards; then the repair closes
 * the crack and swaps the text for the rewritten version.
 */
function ResumeTextLine({
  atom,
  fracture,
  repair,
}: {
  atom: Evidence;
  fracture: MotionValue<number>;
  repair: MotionValue<number>;
}) {
  const isWeak = WEAK_IDS.includes(atom.id);
  const weakIndex = WEAK_IDS.indexOf(atom.id);

  // Crack opens, then heals.
  const crack = useTransform([fracture, repair] as const, ([f, r]: number[]) =>
    isWeak ? limit((f - weakIndex * 0.12) / 0.5, 0, 1) * (1 - r) : 0,
  );
  const crackWidth = useTransform(crack, (v) => `${v * 100}%`);
  const crackOpacity = useTransform(crack, (v) => limit(v / 0.3, 0, 1));
  // The line dims while broken.
  const dim = useTransform(crack, (v) => 1 - v * 0.45);
  const shiftX = useTransform(crack, (v) => `${Math.sin(v * Math.PI) * 3}px`);

  // Rewritten text swaps in on repair.
  const oldText = useTransform(repair, (r) => (isWeak ? 1 - limit((r - 0.3) / 0.3, 0, 1) : 1));
  const newText = useTransform(repair, (r) => (isWeak ? limit((r - 0.3) / 0.3, 0, 1) : 0));

  const { text, mark } = atom;
  const before = text.slice(0, mark[0]);
  const phrase = text.slice(mark[0], mark[1]);
  const after = text.slice(mark[1]);

  return (
    <motion.p
      className={`landing-resume-text-line${isWeak ? " is-weak" : ""}`}
      style={{ opacity: dim, x: shiftX }}
    >
      <motion.span style={{ opacity: oldText }}>
        {before}
        <mark className="landing-resume-hl">{phrase}</mark>
        {after}
      </motion.span>
      {isWeak && atom.rewrite ? (
        <motion.span className="landing-resume-rewrite" style={{ opacity: newText }}>
          {atom.rewrite}
        </motion.span>
      ) : null}
      {isWeak ? (
        <motion.span
          aria-hidden="true"
          className="landing-resume-crack"
          style={{ width: crackWidth, opacity: crackOpacity }}
        />
      ) : null}
    </motion.p>
  );
}
