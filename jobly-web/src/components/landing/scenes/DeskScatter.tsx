import { motion, useTransform, type MotionValue } from "framer-motion";
import { cubicInOut, cubicOut, limit } from "../beagleEase";
import { ramp, settle, useVisible } from "./choreography";

/**
 * Beats 0 -> 4: the desk.
 *
 * Opens on the mess everyone actually starts with — a closed folder and
 * fourteen loose sheets scattered across the desk, drifting. As the thesis
 * passes, the scatter converges into a tidy grid behind the copy; by beat 4
 * every sheet has flown into a single stack and one of them lifts out to
 * become the resume the rest of the story follows.
 *
 * TIMING
 *   0.0 - 1.3   scattered, slow drift            (hero copy owns the centre)
 *   1.3 - 2.6   converge into a grid             (thesis beat)
 *   2.6 - 4.0   collapse into a stack            (gather beat)
 *   4.0 - 4.7   the chosen sheet lifts out, rest fade; hand off to the laptop
 *
 * The handoff at 4.4 overlaps `LaptopStage`'s entry at 4.3, so the stack is
 * still on screen when the laptop slides in — no gap.
 */

/** Fourteen sheets: scattered pose, grid pose, stack pose. */
const SHEETS = [
  { sx: -0.38, sy: -0.22, sr: -19, gx: -0.3, gy: -0.16, gr: -4 },
  { sx: 0.34, sy: -0.28, sr: 23, gx: -0.15, gy: -0.16, gr: 2 },
  { sx: -0.44, sy: 0.14, sr: 11, gx: 0, gy: -0.16, gr: -2 },
  { sx: 0.41, sy: 0.19, sr: -14, gx: 0.15, gy: -0.16, gr: 3 },
  { sx: -0.22, sy: 0.3, sr: 27, gx: 0.3, gy: -0.16, gr: -3 },
  { sx: 0.19, sy: 0.34, sr: -8, gx: -0.3, gy: 0.02, gr: 4 },
  { sx: -0.3, sy: -0.04, sr: 6, gx: -0.15, gy: 0.02, gr: -2 },
  { sx: 0.28, sy: -0.08, sr: -21, gx: 0, gy: 0.02, gr: 2 },
  { sx: -0.12, sy: -0.32, sr: 15, gx: 0.15, gy: 0.02, gr: -4 },
  { sx: 0.08, sy: 0.08, sr: -26, gx: 0.3, gy: 0.02, gr: 3 },
  { sx: -0.47, sy: -0.1, sr: 18, gx: -0.22, gy: 0.2, gr: -3 },
  { sx: 0.46, sy: 0.04, sr: -11, gx: -0.07, gy: 0.2, gr: 2 },
  { sx: -0.06, sy: 0.24, sr: 9, gx: 0.08, gy: 0.2, gr: -2 },
  { sx: 0.14, sy: -0.18, sr: -17, gx: 0.23, gy: 0.2, gr: 4 },
] as const;

/** The sheet that becomes the protagonist — it lifts out of the stack. */
const CHOSEN = 7;

interface DeskScatterProps {
  pos: MotionValue<number>;
  anchor: number;
  visibleLength: number;
}

export function DeskScatter({ pos, anchor, visibleLength }: DeskScatterProps) {
  const visibility = useVisible(pos, anchor, visibleLength);

  return (
    <motion.div
      aria-hidden="true"
      className="landing-desk"
      style={{ visibility, zIndex: 12 }}
    >
      {SHEETS.map((sheet, i) => (
        <DeskSheet key={i} pos={pos} index={i} sheet={sheet} />
      ))}
      <DeskFolder pos={pos} />
    </motion.div>
  );
}

function DeskSheet({
  pos,
  index,
  sheet,
}: {
  pos: MotionValue<number>;
  index: number;
  sheet: (typeof SHEETS)[number];
}) {
  const isChosen = index === CHOSEN;
  // Sheets converge in a ripple, nearest-first, so the gather reads as a sweep.
  const delay = (index % 7) * 0.035;

  const transform = useTransform(pos, (p) => {
    // phase 1: scattered with a slow idle drift
    const idle = Math.sin(p * 1.6 + index) * 0.006;
    let x = sheet.sx;
    let y = sheet.sy + idle;
    let r = sheet.sr;
    let s = 1;

    // 1.3 -> 2.6 converge to the grid
    const toGrid = ramp(p, 1.3 + delay, 1.0);
    if (toGrid > 0) {
      const e = cubicInOut(toGrid, 0, 1, 1);
      x = sheet.sx + (sheet.gx - sheet.sx) * e;
      y = sheet.sy + (sheet.gy - sheet.sy) * e;
      r = sheet.sr + (sheet.gr - sheet.sr) * e;
      s = 1 - e * 0.22;
    }

    // 2.6 -> 4.0 collapse into one stack, with a tiny fan so it reads as paper
    const toStack = ramp(p, 2.6 + delay, 1.1);
    if (toStack > 0) {
      const e = cubicInOut(toStack, 0, 1, 1);
      const fanX = (index - SHEETS.length / 2) * 0.0035;
      const fanR = (index - SHEETS.length / 2) * 0.5;
      x = x + (fanX - x) * e;
      y = y + (0.16 - y) * e;
      r = r + (fanR - r) * e;
      s = s + (0.78 - s) * e;
    }

    // 4.0 -> 4.7 the chosen sheet lifts out and forward
    if (isChosen) {
      const lift = ramp(p, 4.0, 0.7);
      if (lift > 0) {
        const e = cubicOut(lift, 0, 1, 1);
        y = y - e * 0.1;
        s = s + e * 0.16;
        r = r * (1 - e);
      }
    }

    return `translate3d(calc(-50% + ${x * 100}vw), calc(-50% + ${y * 100}vh), 0) rotate(${r}deg) scale(${s})`;
  });

  const opacity = useTransform(pos, (p) => {
    const inFade = ramp(p, -0.4, 0.5);
    // Non-chosen sheets dissolve as the laptop takes the stage; the chosen one
    // hands straight over to `ResumeSheet`, so it leaves slightly later.
    const out = isChosen ? ramp(p, 4.35, 0.35) : ramp(p, 4.05, 0.5);
    return inFade * (1 - out);
  });

  const zIndex = isChosen ? 3 : 1;

  return (
    <motion.span
      className={`landing-desk-sheet${isChosen ? " is-chosen" : ""}`}
      style={{ transform, opacity, zIndex }}
    />
  );
}

/**
 * The folder. Closed and parked on the desk for the whole opening — this is
 * the same object that returns full-screen at beat 15, which is why the end
 * of the story reads as a return rather than a new scene.
 */
function DeskFolder({ pos }: { pos: MotionValue<number> }) {
  const transform = useTransform(pos, (p) => {
    let x = -0.04;
    let y = 0.3;
    let r = -5;
    let s = 1;

    // drifts back and shrinks as the sheets organise themselves
    const settleT = ramp(p, 1.3, 1.3);
    if (settleT > 0) {
      const e = cubicInOut(settleT, 0, 1, 1);
      x = -0.04 + e * 0.02;
      y = 0.3 + e * 0.04;
      r = -5 + e * 4;
      s = 1 - e * 0.16;
    }
    // sinks under the stack before the laptop arrives
    const sink = ramp(p, 3.4, 0.9);
    if (sink > 0) {
      const e = cubicInOut(sink, 0, 1, 1);
      y = y + e * 0.14;
      s = s - e * 0.12;
    }
    return `translate3d(calc(-50% + ${x * 100}vw), calc(-50% + ${y * 100}vh), 0) rotate(${r}deg) scale(${s})`;
  });

  const opacity = useTransform(pos, (p) => ramp(p, -0.3, 0.5) * (1 - ramp(p, 3.9, 0.5)));
  // the lid breathes open a crack as the sheets gather — it is being loaded
  const flap = useTransform(pos, (p) => {
    const t = ramp(p, 2.4, 0.9);
    return `${-6 - t * 12 * settle(t, 0.1)}deg`;
  });

  return (
    <motion.span className="landing-desk-folder" style={{ transform, opacity }}>
      <span className="landing-desk-folder-back" />
      <motion.span className="landing-desk-folder-flap" style={{ rotateX: flap }} />
      <span className="landing-desk-folder-tab" />
    </motion.span>
  );
}

/**
 * Beat 4's stack label — a quiet count that makes the gather legible
 * ("these 14 sheets become one profile").
 */
export function GatherCount({ pos }: { pos: MotionValue<number> }) {
  const opacity = useTransform(pos, (p) => ramp(p, 3.3, 0.4) * (1 - ramp(p, 4.2, 0.35)));
  const y = useTransform(pos, (p) => `${(1 - ramp(p, 3.3, 0.5)) * 14}px`);
  const count = useTransform(pos, (p) => {
    const t = ramp(p, 3.3, 0.8);
    return String(Math.max(1, Math.round(limit(14 - t * 13, 1, 14)))).padStart(2, "0");
  });

  return (
    <motion.div className="landing-gather-count" style={{ opacity, y }}>
      <motion.span className="landing-gather-num">{count}</motion.span>
      <span className="landing-gather-cap">sheets · one profile</span>
    </motion.div>
  );
}
