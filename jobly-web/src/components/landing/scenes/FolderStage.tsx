import { motion, useTransform, type MotionValue } from "framer-motion";
import { cubicInOut, cubicOut, limit } from "../beagleEase";
import { getScoreGreenShade } from "@/components/ui/AtsScoreRing";
import { bezier, ramp, settle, useVisible } from "./choreography";
import { FILED_ARTIFACTS, FOLDER_TABS, type Candidate } from "../sceneManifest";

/**
 * Beats 15 -> 18: the folder closes the loop.
 *
 * This is the same folder that was sitting closed on the desk in beat 0. It
 * returns full-screen, opens, and the whole story files into it: the v2
 * resume, the new score, the three applications, the interview scorecard and
 * the study plan. Three tabs — v1, v2, v3 — because every pass is kept, which
 * is the actual argument for going round again.
 *
 * Then it stamps itself SELECTED and flies out of frame toward the signup.
 *
 * TIMING
 *  15.10 - 15.55  folder rises full-screen, tabs fan out
 *  15.45 - 15.90  front flap opens; interior light comes up
 *  15.70 - 16.20  v2 resume rises out; ring counts scoreBefore -> scoreAfter
 *  16.20 - 16.95  five artifacts file in, staggered, flap catching each one
 *  16.95 - 17.30  flap shuts, SELECTED wax stamp thumps down
 *  17.30 - 18.00  folder lifts off the plane and flies out to the CTA
 */

interface FolderStageProps {
  pos: MotionValue<number>;
  anchor: number;
  visibleLength: number;
  candidate: Candidate;
}

export function FolderStage({ pos, anchor, visibleLength, candidate }: FolderStageProps) {
  const visibility = useVisible(pos, anchor, visibleLength);

  /* ── the folder body ── */
  const transform = useTransform(pos, (p) => {
    // rises from below, full-screen scale
    const rise = ramp(p, 15.1, 0.45);
    let y = cubicOut(rise, 0.55, -0.49, 1);
    let s = 0.7 + cubicOut(rise, 0, 0.3, 1);
    let x = 0;
    let r = 0;

    // flies out to the CTA
    const fly = ramp(p, 17.3, 0.7);
    if (fly > 0) {
      const t = cubicInOut(fly, 0, 1, 1);
      const [bx, by] = bezier(t, 0, y, 0.12, y - 0.3, -0.06, -0.95);
      x = bx;
      y = by;
      s = s * (1 - t * 0.45);
      r = t * -14;
    }

    return `translate3d(calc(-50% + ${x * 100}vw), calc(-50% + ${y * 100}vh), 0) rotate(${r}deg) scale(${s})`;
  });

  const opacity = useTransform(pos, (p) => ramp(p, 15.05, 0.3) * (1 - ramp(p, 17.85, 0.4)));

  /* ── the lid ── */
  const flap = useTransform(pos, (p) => {
    const open = ramp(p, 15.45, 0.45);
    const shut = ramp(p, 16.95, 0.3);
    const a = open * (1 - shut);
    return `${-a * 68 * settle(open, 0.05, 1.2)}deg`;
  });
  const interior = useTransform(pos, (p) => ramp(p, 15.5, 0.4) * (1 - ramp(p, 16.95, 0.3)));

  /* ── the score climb ── */
  const climb = useTransform(pos, (p) => ramp(p, 15.7, 0.5));
  const score = useTransform(climb, (v) =>
    Math.round(candidate.scoreBefore + (candidate.scoreAfter - candidate.scoreBefore) * cubicOut(v, 0, 1, 1)),
  );
  const ringDash = useTransform(score, (v) => `${(v / 100) * 326.7} 326.7`);
  const ringColor = useTransform(score, (v) => getScoreGreenShade(v));
  const ringScale = useTransform(climb, (v) => settle(v, 0.06, 1));
  const scoreOpacity = useTransform(pos, (p) => ramp(p, 15.68, 0.3) * (1 - ramp(p, 17.1, 0.3)));
  const deltaOpacity = useTransform(pos, (p) => ramp(p, 16.0, 0.3) * (1 - ramp(p, 17.1, 0.3)));

  /* ── the stamp ── */
  const stamp = useTransform(pos, (p) => ramp(p, 17.0, 0.26));
  const stampScale = useTransform(stamp, (v) => (v <= 0 ? 1.8 : 1.8 - cubicOut(v, 0, 0.8, 1)));
  const stampOpacity = useTransform(stamp, (v) => limit(v / 0.26, 0, 1));
  const stampRot = useTransform(stamp, (v) => `${-13 + (1 - v) * 10}deg`);
  const bodyThump = useTransform(stamp, (v) => {
    const t = limit(v / 0.4, 0, 1);
    return t > 0 && t < 1 ? 1 + Math.sin(t * Math.PI) * 0.025 : 1;
  });

  return (
    <motion.div className="landing-folderstage" style={{ transform, opacity, visibility, zIndex: 33 }}>
      <motion.div className="landing-folder" style={{ scale: bodyThump }}>
        {/* tabs = ATS versions */}
        <ul className="landing-folder-tabs">
          {FOLDER_TABS.map((tab, i) => (
            <FolderTab key={tab.id} pos={pos} index={i} tab={tab} />
          ))}
        </ul>

        <div className="landing-folder-back">
          <motion.div className="landing-folder-interior" style={{ opacity: interior }} />

          {/* the v2 resume rising out of the folder */}
          <ResumeV2 pos={pos} candidate={candidate} />

          {/* the new score */}
          <motion.div className="landing-folder-score" style={{ opacity: scoreOpacity }}>
            <motion.div className="landing-folder-ring" style={{ scale: ringScale }}>
              <svg className="-rotate-90" viewBox="0 0 112 112" aria-hidden="true">
                <circle cx="56" cy="56" r="52" fill="none" stroke="rgba(47,48,45,.1)" strokeWidth="8" />
                <motion.circle
                  cx="56"
                  cy="56"
                  r="52"
                  fill="none"
                  strokeWidth="8"
                  strokeLinecap="round"
                  style={{ stroke: ringColor, strokeDasharray: ringDash }}
                />
              </svg>
              <div className="landing-folder-ring-mid">
                <motion.span className="landing-folder-num">{score}</motion.span>
                <span className="landing-folder-cap">ATS score</span>
              </div>
            </motion.div>
            <motion.p className="landing-folder-delta" style={{ opacity: deltaOpacity }}>
              <s>{candidate.scoreBefore}</s>
              <span className="landing-folder-arrow">→</span>
              <b>{candidate.scoreAfter}</b>
              <span className="landing-folder-deltacap">second pass</span>
            </motion.p>
          </motion.div>

          {/* everything filing away */}
          <div className="landing-folder-filing">
            {FILED_ARTIFACTS.map((a, i) => (
              <FiledArtifact key={a.id} pos={pos} index={i} label={a.label} />
            ))}
          </div>
        </div>

        <motion.div className="landing-folder-flap" style={{ rotateX: flap }}>
          <span className="landing-folder-flap-face" />
        </motion.div>

        <motion.span
          className="landing-folder-stamp"
          style={{ opacity: stampOpacity, scale: stampScale, rotate: stampRot }}
        >
          Selected
        </motion.span>
      </motion.div>
    </motion.div>
  );
}

function FolderTab({
  pos,
  index,
  tab,
}: {
  pos: MotionValue<number>;
  index: number;
  tab: (typeof FOLDER_TABS)[number];
}) {
  const t = useTransform(pos, (p) => ramp(p, 15.22 + index * 0.07, 0.3));
  const opacity = useTransform(t, (v) => limit(v / 0.4, 0, 1));
  const y = useTransform(t, (v) => `${(1 - cubicOut(v, 0, 1, 1)) * 14}px`);
  // v2 is the live one once the score climbs
  const live = useTransform(pos, (p) => (index === 1 ? ramp(p, 15.9, 0.3) : 0));
  const bg = useTransform(live, (v) => `rgba(184, 221, 210, ${0.3 + v * 0.6})`);
  const scale = useTransform(live, (v) => 1 + v * 0.06);

  return (
    <motion.li className="landing-folder-tab" style={{ opacity, y, backgroundColor: bg, scale }}>
      <span className="landing-folder-tab-label">{tab.label}</span>
      <span className="landing-folder-tab-cap">{tab.caption}</span>
    </motion.li>
  );
}

/** The repaired resume, rising out of the open folder. */
function ResumeV2({ pos, candidate }: { pos: MotionValue<number>; candidate: Candidate }) {
  const t = useTransform(pos, (p) => ramp(p, 15.7, 0.45));
  const sink = useTransform(pos, (p) => ramp(p, 16.75, 0.35));

  const transform = useTransform([t, sink] as const, ([v, s]: number[]) => {
    const e = cubicOut(v, 0, 1, 1);
    const y = 0.16 - e * 0.3 + s * 0.3;
    const sc = (0.8 + e * 0.2) * (1 - s * 0.24);
    const r = (1 - e) * -5;
    return `translate3d(-50%, calc(-50% + ${y * 100}vh), 0) rotate(${r}deg) scale(${sc})`;
  });
  const opacity = useTransform(
    [t, sink] as const,
    ([v, s]: number[]) => limit(v / 0.35, 0, 1) * (1 - s * 0.85),
  );

  return (
    <motion.div className="landing-folder-sheet" style={{ transform, opacity }}>
      <p className="landing-folder-sheet-name">{candidate.name}</p>
      <p className="landing-folder-sheet-role">
        <mark>{candidate.improvedHeadline}</mark>
      </p>
      <span className="landing-folder-sheet-line" />
      <span className="landing-folder-sheet-line is-mid" />
      <span className="landing-folder-sheet-line is-short" />
      <span className="landing-folder-sheet-tag">v2 · evidence-backed</span>
    </motion.div>
  );
}

/**
 * One artifact filing itself into the folder mouth. These are the summary
 * labels for things the visitor has already watched happen, so the filing
 * reads as "all of that is kept" rather than new information.
 */
function FiledArtifact({
  pos,
  index,
  label,
}: {
  pos: MotionValue<number>;
  index: number;
  label: string;
}) {
  const start = 16.2 + index * 0.1;
  const transform = useTransform(pos, (p) => {
    const t = cubicInOut(ramp(p, start, 0.5), 0, 1, 1);
    // comes in from alternating sides, arcs over the lip, drops in
    const side = index % 2 === 0 ? -1 : 1;
    const from: [number, number] = [side * 0.42, -0.26 + index * 0.03];
    const [bx, by] = bezier(t, from[0], from[1], side * 0.2, -0.34, 0, 0.08);
    const r = side * 16 * (1 - t) + t * side * 8;
    const s = 0.94 - t * 0.42;
    return `translate3d(calc(-50% + ${bx * 100}vw), calc(-50% + ${by * 100}vh), 0) rotate(${r}deg) scale(${s})`;
  });

  const opacity = useTransform(pos, (p) => {
    const appear = ramp(p, start - 0.06, 0.2);
    const swallow = ramp(p, start + 0.42, 0.18);
    return appear * (1 - swallow);
  });

  return (
    <motion.span className="landing-filed" style={{ transform, opacity }}>
      {label}
    </motion.span>
  );
}
