import type { ReactNode } from "react";
import { motion, useTransform, type MotionValue } from "framer-motion";
import { cubicInOut, cubicOut, limit } from "../beagleEase";
import { ramp, settle, useVisible } from "./choreography";

/**
 * Beats 5 -> 9: the laptop, full frame.
 *
 * The laptop is the stage for parse, extract and score, so it is not a prop
 * sitting in the middle of the page — it grows until the screen IS the
 * viewport, and the three beats happen inside it.
 *
 * TIMING
 *   4.30 - 5.00  slides in CLOSED and lying flat, while the stack is still up
 *   5.00 - 5.55  hinge opens -78deg -> 0deg with a damped settle
 *   5.45 - 5.75  screen flicker-wakes, bloom comes up
 *   5.60 - 6.10  camera pushes in until the screen is full-bleed
 *   6.10 - 8.90  holds while parse / extract / score play out inside
 *   8.90 - 9.60  pulls back out and the sheet leaves for the mailboxes
 *
 * The open overlaps the gather (DeskScatter fades 4.05-4.55) and the pull-back
 * overlaps MailboxFlight's entry at 9.1, so both ends hand over cleanly.
 */

interface LaptopStageProps {
  pos: MotionValue<number>;
  anchor: number;
  visibleLength: number;
  /** Parse page, skill rail and score breakdown render inside the screen. */
  children?: ReactNode;
}

export function LaptopStage({ pos, anchor, visibleLength, children }: LaptopStageProps) {
  const visibility = useVisible(pos, anchor, visibleLength);

  /* ── body: arrives closed, lifts to centre, leaves on the apply beat ── */
  const transform = useTransform(pos, (p) => {
    // arrive from below-right, lying flat on the desk
    let x = 0.1;
    let y = 0.46;
    let s = 0.52;
    let rot = 6;

    const arrive = ramp(p, 4.3, 0.7);
    if (arrive > 0) {
      const e = cubicOut(arrive, 0, 1, 1);
      x = 0.1 - e * 0.1;
      y = 0.46 - e * 0.28;
      s = 0.52 + e * 0.18;
      rot = 6 - e * 6;
    }

    // camera push: the screen becomes the frame
    const push = ramp(p, 5.6, 0.5);
    if (push > 0) {
      const e = cubicInOut(push, 0, 1, 1);
      y = 0.18 - e * 0.18;
      s = 0.7 + e * 0.3;
    }

    // pull back out, then exit left as the application posts
    const out = ramp(p, 8.9, 0.7);
    if (out > 0) {
      const e = cubicInOut(out, 0, 1, 1);
      s = 1 - e * 0.34;
      y = 0 - e * 0.12;
      x = x - e * 0.08;
    }

    return `translate3d(calc(-50% + ${x * 100}vw), calc(-50% + ${y * 100}vh), 0) scale(${s}) rotate(${rot}deg)`;
  });

  const opacity = useTransform(pos, (p) => ramp(p, 4.3, 0.35) * (1 - ramp(p, 9.2, 0.45)));

  /* ── the hinge ── */
  const lidRotate = useTransform(pos, (p) => {
    const t = ramp(p, 5.0, 0.55);
    if (t <= 0) return "-78deg";
    // open to 0, then ring down around it
    const base = cubicOut(t, -78, 78, 1);
    const ring = t > 0.6 ? Math.sin((t - 0.6) / 0.4 * Math.PI * 2.2) * 2.6 * (1 - t) : 0;
    return `${base + ring}deg`;
  });

  // Lid shell dims while closed so the open reads as a light turning on.
  const shellLight = useTransform(pos, (p) => 0.5 + ramp(p, 5.0, 0.55) * 0.5);

  /* ── the screen waking ── */
  const screenOn = useTransform(pos, (p) => ramp(p, 5.45, 0.3));
  // Three-blink flicker before it settles, like a panel actually powering up.
  const screenFlicker = useTransform(pos, (p) => {
    const t = ramp(p, 5.45, 0.3);
    if (t <= 0) return 0;
    if (t >= 1) return 1;
    const blink = 0.55 + 0.45 * Math.abs(Math.sin(t * Math.PI * 3.4));
    return t * blink;
  });
  const bloom = useTransform(screenOn, (v) => v * 0.85);
  const wakeSweep = useTransform(pos, (p) => ramp(p, 5.5, 0.45));
  const wakeSweepTop = useTransform(wakeSweep, (v) => `${v * 100}%`);
  const wakeSweepOpacity = useTransform(wakeSweep, (v) => (v > 0.02 && v < 0.98 ? 0.75 : 0));

  const shadow = useTransform(screenOn, (v) =>
    `0 ${34 + v * 58}px ${72 + v * 72}px -${34 - v * 6}px rgb(8 16 12 / ${0.42 + v * 0.26})`,
  );

  const screenState = useTransform(pos, (p): string => {
    if (p < 5.0) return "STANDBY";
    if (p < 5.6) return "WAKING";
    if (p < 6.9) return "READING RESUME";
    if (p < 7.9) return "EXTRACTING SKILLS";
    if (p < 8.8) return "WEIGHTED ATS ANALYSIS";
    return "SCORE LOCKED · CITED";
  });

  return (
    <motion.div className="landing-lapstage" style={{ transform, opacity, visibility, zIndex: 22 }}>
      <div className="landing-lapstage-body">
        <motion.div
          className="landing-lapstage-lid"
          style={{ rotateX: lidRotate, opacity: shellLight, boxShadow: shadow }}
        >
          <motion.div className="landing-lapstage-screen" style={{ opacity: screenFlicker }}>
            <div className="landing-lapstage-bar">
              <span className="landing-lapstage-brand">
                <i /> JOBLY <b>·</b> RESUME INTELLIGENCE
              </span>
              <motion.span className="landing-lapstage-state">{screenState}</motion.span>
            </div>

            <div className="landing-lapstage-inner">{children}</div>

            {/* wake sweep */}
            <motion.div
              aria-hidden="true"
              className="landing-lapstage-sweep"
              style={{ top: wakeSweepTop, opacity: wakeSweepOpacity }}
            />
            {/* green bloom, static gradient faded by opacity only (cheap) */}
            <motion.div
              aria-hidden="true"
              className="landing-lapstage-bloom"
              style={{ opacity: bloom }}
            />
            <div aria-hidden="true" className="landing-lapstage-scanlines" />
          </motion.div>
        </motion.div>

        <div className="landing-lapstage-base">
          <div className="landing-lapstage-notch" />
          <motion.div
            aria-hidden="true"
            className="landing-lapstage-glow"
            style={{ opacity: bloom }}
          />
        </div>
      </div>
    </motion.div>
  );
}

/**
 * The ATS trust markers, parked under the laptop once the score locks.
 * Kept outside the screen so they read as the page's voice, not the app's.
 */
export function LaptopProof({ pos, items }: { pos: MotionValue<number>; items: readonly string[] }) {
  const opacity = useTransform(pos, (p) => ramp(p, 8.55, 0.3) * (1 - ramp(p, 8.95, 0.3)));
  return (
    <motion.ul className="landing-lapstage-proof" style={{ opacity }}>
      {items.map((label, i) => (
        <ProofPill key={label} pos={pos} index={i} label={label} />
      ))}
    </motion.ul>
  );
}

function ProofPill({
  pos,
  index,
  label,
}: {
  pos: MotionValue<number>;
  index: number;
  label: string;
}) {
  const t = useTransform(pos, (p) => ramp(p, 8.58 + index * 0.07, 0.24));
  const opacity = useTransform(t, (v) => limit(v / 0.4, 0, 1));
  const y = useTransform(t, (v) => `${(1 - cubicOut(v, 0, 1, 1)) * 16}px`);
  const scale = useTransform(t, (v) => settle(v, 0.06, 1));
  return (
    <motion.li className="landing-proof-pill" style={{ opacity, y, scale }}>
      {label}
    </motion.li>
  );
}
