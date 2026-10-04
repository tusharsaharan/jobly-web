/**
 * Penner easing set, ported verbatim from the Beagle reference
 * (`nolz.Tween.Ease`, application.js @29700).
 *
 * Signature is Penner's original `(t, b, c, d)`:
 *   t = elapsed time, b = begin value, c = CHANGE in value (to - from), d = duration.
 *
 * Note `easeIn`/`easeOut`/`easeInOut` are aliases of the cubic variants in the
 * original source, not separate curves. Kept as aliases so ported call sites read
 * the same as the reference.
 */

export const linear = (t: number, b: number, c: number, d: number): number => (c * t) / d + b;

export const quadIn = (t: number, b: number, c: number, d: number): number => {
  const x = t / d;
  return c * x * x + b;
};

export const quadOut = (t: number, b: number, c: number, d: number): number => {
  const x = t / d;
  return -c * x * (x - 2) + b;
};

export const quadInOut = (t: number, b: number, c: number, d: number): number => {
  let x = t / (d / 2);
  if (x < 1) return (c / 2) * x * x + b;
  x -= 1;
  return (-c / 2) * (x * (x - 2) - 1) + b;
};

export const cubicIn = (t: number, b: number, c: number, d: number): number => {
  const x = t / d;
  return c * x * x * x + b;
};

export const cubicOut = (t: number, b: number, c: number, d: number): number => {
  const x = t / d - 1;
  return c * (x * x * x + 1) + b;
};

export const cubicInOut = (t: number, b: number, c: number, d: number): number => {
  let x = t / (d / 2);
  if (x < 1) return (c / 2) * x * x * x + b;
  x -= 2;
  return (c / 2) * (x * x * x + 2) + b;
};

/** Aliases, exactly as in the reference. */
export const easeIn = cubicIn;
export const easeOut = cubicOut;
export const easeInOut = cubicInOut;

export type EaseFn = (t: number, b: number, c: number, d: number) => number;

/** Normalised 0→1 form, for Framer/CSS-style consumers. */
export const norm =
  (ease: EaseFn) =>
  (p: number): number =>
    ease(p, 0, 1, 1);

/** `Number.prototype.limit` from the reference (application.js @~1300). */
export const limit = (v: number, min: number, max: number): number =>
  Math.min(max, Math.max(min, v));
