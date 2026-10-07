import { motion, useTransform, type MotionValue } from "framer-motion";
import { cubicIn, cubicOut, limit } from "../beagleEase";
import { ramp } from "../scenes/choreography";
import { CENTRE_CARD, COPY } from "./manifest";

/**
 * Step 2: the thesis.
 *
 * ── Why this is not a `PanelElement` ──
 *
 * `PanelElement` is `BackgroundColorPixiElement`: it wipes open from its centre
 * line via `scaleY`. The reference's dark panel here does something different —
 * a hard horizontal edge travels UP the frame, carrying the first line of type
 * with it. So this is a plain full-bleed div sliding `y: 100% -> 0`, which is
 * the only way to get that edge.
 *
 * ── The white-on-white ghost ──
 *
 * On the way out the panel slides further up and off, and the type fades
 * *slightly behind it*. For about a fifth of a step the white type is sitting on
 * the cream stage, i.e. white on near-white, and it dissolves rather than cuts.
 * That overlap is deliberate and it is the whole reason step 2 -> 4 reads as one
 * continuous move instead of two slides.
 */

/** Rise, hold, then leave upward. Returns y as a percentage of the viewport. */
function panelY(p: number): number {
  const rise = cubicOut(ramp(p, 1.4, 0.46), 0, 1, 1);
  const leave = cubicIn(ramp(p, 2.55, 0.6), 0, 1, 1);
  return 100 * (1 - rise) - 100 * leave;
}

/**
 * A line of type that rises out of a clipped box. Two nested elements with
 * `overflow: hidden` on the outer one — the standard mask reveal, and far more
 * expensive-looking than a fade for roughly the same cost.
 */
function Line({
  pos,
  at,
  len,
  className,
  children,
  top,
}: {
  pos: MotionValue<number>;
  at: number;
  len: number;
  className: string;
  children: React.ReactNode;
  top: number;
}) {
  const t = useTransform(pos, (p) => cubicOut(ramp(p, at, len), 0, 1, 1));
  const y = useTransform(t, (v) => `${(1 - v) * 105}%`);
  // Trails the panel on exit, so the type ghosts out white-on-white.
  const opacity = useTransform(pos, (p) => limit(1 - ramp(p, 2.7, 0.38), 0, 1));

  return (
    <motion.div className="landing-thesis-row" style={{ top: `${top}%`, opacity }}>
      <span className="landing-thesis-mask">
        <motion.span className={className} style={{ y }}>
          {children}
        </motion.span>
      </span>
    </motion.div>
  );
}

export function ThesisPanel({ pos, zIndex = 15 }: { pos: MotionValue<number>; zIndex?: number }) {
  const y = useTransform(pos, (p) => `${panelY(p)}%`);
  const visibility = useTransform(pos, (p) => (p > 1.25 && p < 3.4 ? "visible" : "hidden"));

  /**
   * The centre card does not simply vanish at step 2 — it persists as a barely
   * perceptible lighter rectangle on exactly the same x-bounds. You are not
   * meant to notice it; you are meant to notice that the thesis occupies the
   * same frame the photograph just did. A surprising amount of why the reference
   * reads as ONE move rather than two lives in this one 3.5%-opacity rectangle.
   */
  const ghostOpacity = useTransform(pos, (p) => ramp(p, 1.7, 0.5) * (1 - ramp(p, 2.5, 0.4)));

  return (
    <>
      <motion.div
        aria-hidden="true"
        className="landing-thesis-panel"
        style={{ zIndex, y, visibility }}
      >
        <div className="landing-grain absolute inset-0" />
        <motion.div
          className="landing-thesis-ghost"
          style={{
            width: `${CENTRE_CARD.w}vw`,
            height: `${CENTRE_CARD.h}vh`,
            opacity: ghostOpacity,
          }}
        />
      </motion.div>

      <motion.div className="landing-thesis-type" style={{ zIndex: zIndex + 25, visibility }}>
        {/* 1 — rides the rising edge, so it is already legible as the dark arrives */}
        <Line pos={pos} at={1.58} len={0.24} top={31} className="landing-thesis-serif">
          {COPY.thesis.upper}
        </Line>
        <Line pos={pos} at={1.6} len={0.28} top={40} className="landing-thesis-bold">
          {COPY.thesis.boldA}
        </Line>
        <Line pos={pos} at={1.66} len={0.26} top={50} className="landing-thesis-serif">
          {COPY.thesis.mid}
        </Line>
        <Line pos={pos} at={1.72} len={0.25} top={60} className="landing-thesis-bold">
          {COPY.thesis.boldB}
        </Line>
        <Line pos={pos} at={1.8} len={0.17} top={83} className="landing-thesis-foot">
          {COPY.thesis.bottom}
        </Line>
      </motion.div>
    </>
  );
}
