import type { ReactNode } from "react";
import { motion, useTransform, type MotionValue } from "framer-motion";
import { cubicOut, limit, quadInOut } from "../beagleEase";
import { useStepIndex } from "../SwipeElement";

/**
 * `TitleCardPixiElement.handlePosition` (`.beagle-ref/application.js` @~352k).
 *
 * Intro: the three text lines rise from a viewport-height below, staggered by
 * 0.1 step each, over a 0.6-step cubicOut.
 *
 *   title.y     = cubicOut(min(stepIndex - 0.2, 0.6), startY + H, -H, 0.6)
 *   subheader.y = cubicOut(min(stepIndex - 0.3, 0.6), ...)
 *   subtitle.y  = cubicOut(max(stepIndex - 0.4, 0),   ...)
 *
 * Outro: positions hold, the whole card scales 1 -> 0.5 on a quadInOut.
 *
 *   scale = quadInOut(min(stepIndex - 1, 1), 1, -0.5, 1)
 *
 * The reference has no alpha on the outro — the canvas dissolves the glyphs as
 * particles. DOM has no equivalent, so we fade instead; see README note in the
 * route. Everything else is the reference's arithmetic unchanged.
 */

/** Per-line rise, as a fraction of viewport height. */
function lineRise(stepIndex: number, stagger: number, clampMax: boolean): number {
  const t = clampMax ? Math.min(stepIndex - stagger, 0.6) : Math.max(stepIndex - stagger, 0);
  // start one viewport below, travel -1 viewport, over 0.6 steps
  return limit(cubicOut(limit(t, 0, 0.6), 1, -1, 0.6), 0, 1);
}

interface TitleCardProps {
  pos: MotionValue<number>;
  anchor: number;
  visibleLength?: number;
  /** Small label above the title. */
  kicker?: ReactNode;
  title: ReactNode;
  subheader?: ReactNode;
  subtitle?: ReactNode;
  /** Extra line under everything (intro's "Here's how it works:"). */
  footnote?: ReactNode;
  color?: string;
  /** Vertical anchor of the card. Reference: 25% of height + MarginTop. */
  top?: string;
  className?: string;
  zIndex?: number;
  align?: "center" | "left";
}

export function TitleCard({
  pos,
  anchor,
  visibleLength = 1,
  kicker,
  title,
  subheader,
  subtitle,
  footnote,
  color,
  top = "25%",
  className,
  zIndex = 40,
  align = "center",
}: TitleCardProps) {
  const stepIndex = useStepIndex(pos, anchor, visibleLength);
  // Outro begins after the hold window, as in BackgroundColorPixiElement.
  const outroStart = 2 * visibleLength - 1;

  const scale = useTransform(stepIndex, (si) =>
    si < outroStart ? 1 : quadInOut(Math.min(si - outroStart, 1), 1, -0.5, 1),
  );
  // Stand-in for the reference's particle dissolve.
  const opacity = useTransform(stepIndex, (si) =>
    si < 1 ? limit(si / 0.35, 0, 1) : limit(1 - (si - outroStart) / 0.4, 0, 1),
  );
  const exitY = useTransform(stepIndex, (si) =>
    si < outroStart ? 0 : -Math.min((si - outroStart) / 0.4, 1) * 18,
  );
  const visibility = useTransform(pos, (v) =>
    Math.abs(anchor - v) < visibleLength ? "visible" : "hidden",
  );

  const yTitle = useTransform(stepIndex, (si) =>
    si < 1 ? `${lineRise(si, 0.2, true) * 100}vh` : "0vh",
  );
  const ySubheader = useTransform(stepIndex, (si) =>
    si < 1 ? `${lineRise(si, 0.3, true) * 100}vh` : "0vh",
  );
  const ySubtitle = useTransform(stepIndex, (si) =>
    si < 1 ? `${lineRise(si, 0.4, false) * 100}vh` : "0vh",
  );

  return (
    <motion.div
      className={`pointer-events-none absolute inset-x-0 ${
        align === "center" ? "text-center" : "text-left"
      } landing-titlecard ${className ?? ""}`}
      style={{
        top,
        zIndex,
        color,
        scale,
        y: exitY,
        opacity,
        visibility,
        transformOrigin: "center center",
        willChange: "transform, opacity",
      }}
    >
      {kicker ? (
        <motion.p className="landing-kicker" style={{ y: yTitle }}>
          {kicker}
        </motion.p>
      ) : null}
      <motion.h2 className="landing-title" style={{ y: yTitle }}>
        {title}
      </motion.h2>
      {subheader ? (
        <motion.p className="landing-subtitle" style={{ y: ySubheader }}>
          {subheader}
        </motion.p>
      ) : null}
      {subtitle ? (
        <motion.p className="landing-title" style={{ y: ySubtitle }}>
          {subtitle}
        </motion.p>
      ) : null}
      {footnote ? (
        <motion.p className="landing-footnote" style={{ y: ySubtitle }}>
          {footnote}
        </motion.p>
      ) : null}
    </motion.div>
  );
}
