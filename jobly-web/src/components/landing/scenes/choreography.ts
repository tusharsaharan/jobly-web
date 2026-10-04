import { useTransform, type MotionValue } from "framer-motion";
import { cubicInOut, cubicOut, limit } from "../beagleEase";

/**
 * Shared choreography helpers.
 *
 * Every scene in the story is a pure function of `pos` (the scroll step), so
 * the only thing that makes two scenes feel connected is agreeing on the
 * grammar. These are that grammar.
 *
 * HANDOFF RULE: a scene's `enter` window must START before the previous
 * scene's `exit` window ENDS, by at least OVERLAP. The gaps are what used to
 * read as "nothing is connected" — an object vanished, then an unrelated one
 * appeared.
 */

/** Minimum overlap between adjacent scenes, in steps. */
export const OVERLAP = 0.3;

/** 0 -> 1 ramp over [from, from + len], clamped. */
export const ramp = (p: number, from: number, len: number): number =>
  limit((p - from) / len, 0, 1);

/** Classic enter/exit envelope: fade in over `len`, out over `outLen`. */
export function useEnvelope(
  pos: MotionValue<number>,
  enterAt: number,
  enterLen: number,
  exitAt: number,
  exitLen: number,
): MotionValue<number> {
  return useTransform(pos, (p) => {
    const a = ramp(p, enterAt, enterLen);
    const b = ramp(p, exitAt, exitLen);
    return a * (1 - b);
  });
}

/** Cull outside the element's visible window. */
export function useVisible(
  pos: MotionValue<number>,
  anchor: number,
  visibleLength: number,
): MotionValue<"visible" | "hidden"> {
  return useTransform(pos, (p): "visible" | "hidden" =>
    Math.abs(anchor - p) < visibleLength ? "visible" : "hidden",
  );
}

/**
 * Damped settle — the overshoot that makes a hinge, a card snap or a stamp
 * feel like it has mass instead of easing politely into place.
 *
 * `t` 0->1, returns a multiplier around 1.0 that rings down.
 */
export function settle(t: number, amplitude = 0.08, cycles = 1.5): number {
  if (t <= 0) return 1 - amplitude;
  if (t >= 1) return 1;
  return 1 + Math.sin(t * Math.PI * 2 * cycles) * amplitude * (1 - t);
}

/** Overshoot ease: travels past the target then returns. Good for ink + nibs. */
export function overshoot(t: number, by = 1.08): number {
  if (t <= 0) return 0;
  if (t >= 1) return 1;
  const e = cubicOut(t, 0, by, 1);
  return e > 1 ? 1 - (e - 1) * 0.5 : e;
}

/** Squash-and-stretch factor for a launching object. Returns [scaleX, scaleY]. */
export function squash(t: number, strength = 0.18): [number, number] {
  const s = Math.sin(limit(t, 0, 1) * Math.PI) * strength;
  return [1 - s * 0.6, 1 + s];
}

/**
 * Quadratic bezier point, used for every flight path in the story (phrases
 * peeling to the rail, applications posting into mailboxes, comments docking
 * into the scorecard, artifacts filing into the folder).
 */
export function bezier(
  t: number,
  x0: number,
  y0: number,
  cx: number,
  cy: number,
  x1: number,
  y1: number,
): [number, number] {
  const u = 1 - t;
  const a = u * u;
  const b = 2 * u * t;
  const c = t * t;
  return [a * x0 + b * cx + c * x1, a * y0 + b * cy + c * y1];
}

/**
 * A flight along a bezier with an eased parameter, returned as a transform
 * string in viewport units. Centre-origin: (0,0) is the middle of the stage.
 */
export function useFlight(
  pos: MotionValue<number>,
  startAt: number,
  len: number,
  from: [number, number],
  control: [number, number],
  to: [number, number],
): MotionValue<string> {
  return useTransform(pos, (p) => {
    const t = cubicInOut(ramp(p, startAt, len), 0, 1, 1);
    const [x, y] = bezier(t, from[0], from[1], control[0], control[1], to[0], to[1]);
    return `translate3d(calc(-50% + ${x * 100}vw), calc(-50% + ${y * 100}vh), 0)`;
  });
}

/** Staggered sub-window for item `i` of `n` inside a parent window. */
export function stagger(
  p: number,
  startAt: number,
  index: number,
  step: number,
  len: number,
): number {
  return ramp(p, startAt + index * step, len);
}

/** Parallax depth planes — background drifts slower than foreground. */
export const DEPTH = { back: 0.55, mid: 1, front: 1.45 } as const;

/** Per-plane drift across a beat, in vh. */
export function useDrift(
  pos: MotionValue<number>,
  center: number,
  plane: number,
  amount = 6,
): MotionValue<string> {
  return useTransform(pos, (p) => `${(center - p) * amount * plane}vh`);
}
