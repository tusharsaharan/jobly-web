import { useMemo, type CSSProperties, type ReactNode } from "react";
import { motion, useTransform, type MotionValue } from "framer-motion";
import { cubicIn, cubicInOut, cubicOut, limit, linear } from "./beagleEase";

/**
 * Port of `nolz.SwipeElement` and its two concrete position grammars.
 * Reference: `.beagle-ref/application.js`; see `.beagle-ref/FINDINGS.md`.
 *
 * SwipeController.render gives every element the same scalar:
 *
 *   p = anchor - pos          // +1 = one step below, 0 = at rest, -1 = gone
 *
 * SwipeElement.handlePosition then derives:
 *
 *   stepIndex   = visibleLength - p      // NOTE: equals visibleLength at rest
 *   scrollAspect = p / visibleLength     // -1 … +1
 *
 * and the element is culled when |p| >= visibleLength.
 *
 * Two grammars are built on that:
 *
 * 1. `useTemplateTransform` — TemplateConstructPaperPixiElement. For
 *    `visibleLength === 1` elements, where stepIndex hits exactly 1 at rest:
 *       stepIndex < 1 -> cubicOut(stepIndex,     from,   middle - from)
 *       stepIndex >= 1 -> cubicIn (stepIndex - 1, middle, to - middle)
 *    Decelerate in, accelerate out, passing through `middle` at the anchor.
 *
 * 2. `usePanelPhase` — BackgroundColorPixiElement. Three phases, which is how
 *    elements with `visibleLength > 1` hold still across a plateau:
 *       outroStepStart = 2 * visibleLength - 1
 *       stepIndex < 1              -> intro
 *       stepIndex < outroStepStart -> hold
 *       else                       -> outro
 */

export interface Keyframe {
  from: number;
  middle: number;
  to: number;
}

export interface ElementProps {
  /** Fraction of viewport width. */
  x?: Keyframe;
  /** Fraction of viewport height. */
  y?: Keyframe;
  /** Scale, raw. */
  s?: Keyframe;
  /** Rotation in radians, raw. */
  r?: Keyframe;
  /** Opacity, raw. Not in the reference's property bag; useful for DOM parity. */
  o?: Keyframe;
}

const RAD_TO_DEG = 180 / Math.PI;
const still = (v: number): Keyframe => ({ from: v, middle: v, to: v });

/** `p = anchor - pos`. */
export function useElementP(pos: MotionValue<number>, anchor: number): MotionValue<number> {
  return useTransform(pos, (v) => anchor - v);
}

/** `stepIndex = visibleLength - p`. */
export function useStepIndex(
  pos: MotionValue<number>,
  anchor: number,
  visibleLength: number,
): MotionValue<number> {
  return useTransform(pos, (v) => visibleLength - (anchor - v));
}

/** `scrollAspect = p / visibleLength`, clamped to -1…1. */
export function useScrollAspect(
  pos: MotionValue<number>,
  anchor: number,
  visibleLength: number,
): MotionValue<number> {
  return useTransform(pos, (v) => limit((anchor - v) / visibleLength, -1, 1));
}

/** True while `|p| < visibleLength`. */
export function useIsVisible(
  pos: MotionValue<number>,
  anchor: number,
  visibleLength: number,
): MotionValue<number> {
  return useTransform(pos, (v): number => (Math.abs(anchor - v) < visibleLength ? 1 : 0));
}

/**
 * The unified position rule.
 *
 * The reference has two apparent grammars, but they are the same rule at
 * different `visibleLength`s. `BackgroundColorPixiElement` defines
 * `outroStepStart = 2 * visibleLength - 1`, giving three phases:
 *
 *   stepIndex < 1               -> intro:  cubicOut(stepIndex, from, middle - from)
 *   stepIndex < outroStepStart  -> hold:   middle
 *   stepIndex >= outroStepStart -> outro:  cubicIn(stepIndex - outroStepStart, middle, to - middle)
 *
 * At `visibleLength === 1`, `outroStepStart === 1`, the hold window collapses to
 * nothing and this reduces *exactly* to `TemplateConstructPaperPixiElement`'s
 * two-phase rule. At `visibleLength === 2` the element rests at `stepIndex === 2`
 * and therefore sits on `middle`, which is what makes the collaborate papers
 * hold still across their two-step window instead of flying past.
 */
function templateValue(stepIndex: number, k: Keyframe, visibleLength: number): number {
  if (stepIndex < 1) return cubicOut(stepIndex, k.from, k.middle - k.from, 1);
  const outroStepStart = 2 * visibleLength - 1;
  if (stepIndex < outroStepStart) return k.middle;
  return cubicIn(stepIndex - outroStepStart, k.middle, k.to - k.middle, 1);
}

export interface PanelPhase {
  /** 0 → 1 while intro is running, then 1 through hold, then 1 → 0 on outro. */
  reveal: number;
  /** Outro y offset as a fraction of viewport height: 0 → -1. */
  shift: number;
  phase: "intro" | "hold" | "outro";
}

/**
 * BackgroundColorPixiElement.handlePosition.
 * `introOffset` defaults to -0.5 as in the reference.
 */
export function panelPhase(
  stepIndex: number,
  visibleLength: number,
  introOffset = -0.5,
  outro = true,
): PanelPhase {
  const outroStepStart = 2 * visibleLength - 1;
  if (stepIndex < 1) {
    return {
      reveal: cubicInOut(limit(stepIndex + introOffset, 0, 0.5), 0, 1, 0.5),
      shift: 0,
      phase: "intro",
    };
  }
  if (stepIndex < outroStepStart || outro === false) {
    return { reveal: 1, shift: 0, phase: "hold" };
  }
  return {
    reveal: limit(linear(stepIndex - outroStepStart, 1, -1, 1), 0, 1),
    shift: limit(linear(stepIndex - outroStepStart, 0, -1, 1), -1, 0),
    phase: "outro",
  };
}

/* ────────────────────────── components ────────────────────────── */

interface SwipeElementProps {
  pos: MotionValue<number>;
  /** `scrollAnchorPosition` — the step at which this element is at rest. */
  anchor: number;
  /** `visibleLength` — culled outside ±this. */
  visibleLength?: number;
  props?: ElementProps;
  /** Extra offset in viewport fractions, applied after the keyframes. */
  className?: string;
  style?: CSSProperties;
  zIndex?: number;
  children?: ReactNode;
  /** Set for elements that should keep their layout box (panels). */
  fill?: boolean;
}

/**
 * A positioned element driven by the template grammar. Its box is centred on the
 * viewport, and `x`/`y` move that centre by fractions of the viewport — matching
 * how the reference multiplies keyframes by `parentWidth` / `parentHeight`.
 */
export function SwipeElement({
  pos,
  anchor,
  visibleLength = 1,
  props,
  className,
  style,
  zIndex,
  children,
  fill = false,
}: SwipeElementProps) {
  const kf = useMemo(
    () => ({
      x: props?.x ?? still(0),
      y: props?.y ?? still(0),
      s: props?.s ?? still(1),
      r: props?.r ?? still(0),
      o: props?.o,
    }),
    [props],
  );

  const stepIndex = useStepIndex(pos, anchor, visibleLength);

  const transform = useTransform(stepIndex, (si) => {
    const x = templateValue(si, kf.x, visibleLength) * 100;
    const y = templateValue(si, kf.y, visibleLength) * 100;
    const s = templateValue(si, kf.s, visibleLength);
    const r = templateValue(si, kf.r, visibleLength) * RAD_TO_DEG;
    return `translate3d(${x}vw, ${y}vh, 0) rotate(${r}deg) scale(${s})`;
  });

  const opacity = useTransform(stepIndex, (si) =>
    kf.o ? templateValue(si, kf.o, visibleLength) : 1,
  );

  const visibility = useTransform(pos, (v) =>
    Math.abs(anchor - v) < visibleLength ? "visible" : "hidden",
  );

  return (
    <motion.div
      aria-hidden={fill ? "true" : undefined}
      className={className}
      style={{
        position: "absolute",
        ...(fill ? { inset: 0 } : { left: "50%", top: "50%" }),
        zIndex,
        transform,
        opacity,
        visibility,
        willChange: "transform, opacity",
        ...style,
      }}
    >
      {children}
    </motion.div>
  );
}

interface PanelElementProps {
  pos: MotionValue<number>;
  anchor: number;
  visibleLength?: number;
  /** Any CSS colour, or `undefined` when children supply the surface. */
  color?: string;
  introOffset?: number;
  outro?: boolean;
  /** `marginAspect` in the reference — 0 means bleed to the viewport edges. */
  marginAspect?: number;
  zIndex?: number;
  className?: string;
  children?: ReactNode;
}

/**
 * BackgroundColorPixiElement: a full-bleed panel that wipes open from its centre
 * line (`maskScaleY`), holds, then slides up and closes. This is the mechanism
 * the previous build faked with one-off `CreamWipe` / `PinkBand` components.
 */
export function PanelElement({
  pos,
  anchor,
  visibleLength = 1,
  color,
  introOffset = -0.5,
  outro = true,
  marginAspect = 0,
  zIndex,
  className,
  children,
}: PanelElementProps) {
  const stepIndex = useStepIndex(pos, anchor, visibleLength);

  const scaleY = useTransform(
    stepIndex,
    (si) => panelPhase(si, visibleLength, introOffset, outro).reveal,
  );
  const y = useTransform(
    stepIndex,
    (si) => `${panelPhase(si, visibleLength, introOffset, outro).shift * 100}vh`,
  );
  const visibility = useTransform(pos, (v) =>
    Math.abs(anchor - v) < visibleLength ? "visible" : "hidden",
  );

  // ScreenManager.Margin = 0.03 * viewportHeight; MarginTop = max(62, 2*Margin + 34)
  const margin = marginAspect ? `calc(3vh * ${marginAspect})` : "0px";
  const marginTop = marginAspect ? `calc(max(62px, 6vh + 34px) * ${marginAspect})` : "0px";

  return (
    <motion.div
      aria-hidden="true"
      className={className}
      style={{
        position: "absolute",
        left: margin,
        right: margin,
        top: marginTop,
        bottom: margin,
        zIndex,
        backgroundColor: color,
        transform: "translateZ(0)",
        scaleY,
        y,
        visibility,
        transformOrigin: "center center",
        willChange: "transform",
      }}
    >
      {children}
    </motion.div>
  );
}

/**
 * FooterColorPixiElement: a bottom-anchored band, 39% of viewport height
 * (45% under 459px), min 160px, that rises into place with cubicOut over the
 * first half step.
 */
export function FooterPanel({
  pos,
  anchor,
  visibleLength = 1,
  color,
  zIndex,
  children,
}: PanelElementProps) {
  const stepIndex = useStepIndex(pos, anchor, visibleLength);
  const y = useTransform(stepIndex, (si) =>
    si < 1 ? cubicOut(limit(si - 0.5, 0, 0.5), 1, -1, 0.5) : 0,
  );
  const translate = useTransform(y, (v) => `${v * 100}%`);
  const visibility = useTransform(pos, (v) =>
    Math.abs(anchor - v) < visibleLength ? "visible" : "hidden",
  );

  return (
    <motion.div
      className="landing-footer-band"
      style={{
        position: "absolute",
        left: 0,
        right: 0,
        bottom: 0,
        zIndex,
        backgroundColor: color,
        y: translate,
        visibility,
        willChange: "transform",
      }}
    >
      {children}
    </motion.div>
  );
}
