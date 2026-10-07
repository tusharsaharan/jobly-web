import { motion, useTransform, type MotionValue } from "framer-motion";
import { limit } from "../beagleEase";
import { overshoot, ramp } from "./choreography";

/**
 * The yellow highlighter.
 *
 * The previous build swept a 2px gradient bar across skeleton rows, which is
 * why it read as "random scanning". This paints the real thing: a marker
 * stroke that grows across an actual character range, with the tells that
 * make a highlighter look hand-held —
 *
 *   · the nib is wider than tall and slightly angled, so ends are chisel-cut
 *   · the stroke overshoots the last character then pulls back
 *   · a second, shorter pass darkens the middle (nobody highlights evenly)
 *   · ink bleeds a pixel past the baseline and pools at the start
 *   · the row the nib is on lifts and brightens; the others stay quiet
 *
 * Everything is driven off `pos`, so scrubbing backwards un-highlights.
 */

interface HighlightProps {
  /** 0 -> 1 paint progress for this phrase. */
  paint: MotionValue<number>;
  /** Text before the highlighted phrase. */
  before: string;
  /** The phrase that earns the points. */
  phrase: string;
  /** Text after the phrase. */
  after: string;
  /**
   * Surface colours. The defaults are the long story's: light type on the dark
   * laptop screen. The intro paints the same marker on WHITE paper, where
   * `rgba(226,240,234,.86)` would be invisible — so the two colours the phrase
   * moves between are props rather than constants.
   *
   *   rest  — the phrase before the marker reaches it
   *   inked — the phrase once it is under yellow, which has to be dark enough
   *           to survive the highlighter on top of it
   */
  rest?: string;
  inked?: string;
  /** Colour of the unmarked remainder of the line. */
  body?: string;
}

export function HighlightedLine({
  paint,
  before,
  phrase,
  after,
  rest = "rgba(226,240,234,0.86)",
  inked = "#13241d",
  body,
}: HighlightProps) {
  // Main pass: overshoots to 1.06 of the phrase width then settles back.
  const width = useTransform(paint, (v) => `${overshoot(v, 1.06) * 100}%`);
  // Second pass lags and only covers the middle 70%.
  const secondWidth = useTransform(paint, (v) => `${limit((v - 0.22) / 0.62, 0, 1) * 72}%`);
  const secondOpacity = useTransform(paint, (v) => limit((v - 0.22) / 0.3, 0, 1) * 0.55);
  // Ink pools where the nib lands first.
  const poolOpacity = useTransform(paint, (v) => limit(v / 0.12, 0, 1) * (1 - v * 0.35));
  // The phrase itself gains weight as it is marked.
  const phraseWeight = useTransform(paint, (v) => (v > 0.45 ? 700 : 500));
  const phraseColor = useTransform(paint, (v) => (v > 0.3 ? inked : rest));
  const bodyStyle = body ? { color: body } : undefined;

  return (
    <>
      <span className="landing-parse-text" style={bodyStyle}>
        {before}
      </span>
      <span className="landing-mark-wrap">
        <motion.span className="landing-mark" style={{ width }} />
        <motion.span
          className="landing-mark landing-mark--second"
          style={{ width: secondWidth, opacity: secondOpacity }}
        />
        <motion.span className="landing-mark-pool" style={{ opacity: poolOpacity }} />
        <motion.span
          className="landing-mark-text"
          style={{ fontWeight: phraseWeight, color: phraseColor }}
        >
          {phrase}
        </motion.span>
      </span>
      <span className="landing-parse-text" style={bodyStyle}>
        {after}
      </span>
    </>
  );
}

/**
 * The marker nib itself — a physical object that travels along the line being
 * painted, then hops to the next one. Visible only during the parse beat.
 */
export function MarkerNib({
  pos,
  lines,
  startAt,
  lineStep,
  paintLen,
}: {
  pos: MotionValue<number>;
  lines: number;
  startAt: number;
  lineStep: number;
  paintLen: number;
}) {
  const transform = useTransform(pos, (p) => {
    // which line is being painted, and how far along
    const raw = (p - startAt) / lineStep;
    const idx = Math.floor(limit(raw, 0, lines - 1));
    const local = limit((p - (startAt + idx * lineStep)) / paintLen, 0, 1);

    // lines are laid out as rows inside the page; approximate their geometry
    const rowY = -0.2 + idx * 0.078;
    // travel across the marked phrase, with a small hop between lines
    const travel = overshoot(local, 1.06);
    const hop = local < 0.08 ? Math.sin((local / 0.08) * Math.PI) * -0.022 : 0;
    const x = -0.17 + travel * 0.3;
    // pressure wobble
    const wob = Math.sin(local * Math.PI * 6) * 0.0022 * (1 - local);

    const tilt = -34 + Math.sin(local * Math.PI * 3) * 3;
    return `translate3d(calc(-50% + ${x * 100}vw), calc(-50% + ${(rowY + hop + wob) * 100}vh), 0) rotate(${tilt}deg)`;
  });

  const opacity = useTransform(pos, (p) => {
    const inT = ramp(p, startAt - 0.12, 0.14);
    const outT = ramp(p, startAt + lines * lineStep + 0.04, 0.22);
    return inT * (1 - outT);
  });

  // nib squashes against the paper at the start of each stroke
  const squashY = useTransform(pos, (p) => {
    const raw = (p - startAt) / lineStep;
    const idx = Math.floor(limit(raw, 0, lines - 1));
    const local = limit((p - (startAt + idx * lineStep)) / paintLen, 0, 1);
    return 1 + Math.sin(limit(local / 0.14, 0, 1) * Math.PI) * 0.12;
  });

  return (
    <motion.div aria-hidden="true" className="landing-nib" style={{ transform, opacity }}>
      <motion.span className="landing-nib-body" style={{ scaleY: squashY }}>
        <span className="landing-nib-barrel" />
        <span className="landing-nib-tip" />
      </motion.span>
      <span className="landing-nib-glow" />
    </motion.div>
  );
}
