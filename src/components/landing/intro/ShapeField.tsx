import { memo } from "react";
import { motion, useTransform, type MotionValue } from "framer-motion";
import { limit } from "../beagleEase";
import { ramp } from "../scenes/choreography";
import { useStepIndex } from "../SwipeElement";
import { ANCHORS, SHAPES, type Shape, type ShapeKind } from "./manifest";

/**
 * The outlined glyphs — behind the thesis in white hairlines, behind the resume
 * sheet in pale yellow at three times the weight.
 *
 * Two motions compose, and the split is deliberate:
 *
 *   1. The IDLE DRIFT — a slow rise plus a few degrees of rotation — is a CSS
 *      animation. It runs on the compositor for free, and crucially it keeps
 *      moving while the user is standing still, which is exactly when they
 *      notice it. Driving this from rAF would cost more and buy nothing. Each
 *      glyph gets its own duration (24-40s) and a NEGATIVE delay so it is
 *      already mid-cycle on first paint; nothing ever synchronises.
 *
 *   2. The PARALLAX is scroll-driven, one `useTransform` per glyph, so the
 *      field has depth as the beat arrives and leaves.
 *
 * TWO REGIMES, NOT ONE PALETTE SWAP. On the ink the strokes sit at 0.07-0.15
 * opacity, so you register the movement a beat before you register the shapes —
 * pushed any higher this reads cheap immediately. On the cream they go the other
 * way: solid `--lp-marker` at 0.55-0.9 with a 3-4px stroke, bigger and sparser,
 * and they sit BEHIND the sheet so the paper occludes them. Faint pale yellow on
 * cream would just read as dirt.
 */

const VIEW = 100;

/** Normalised 100x100 geometry. `non-scaling-stroke` keeps hairlines hairlines. */
function Glyph({ kind, strokeWidth }: { kind: ShapeKind; strokeWidth: number }) {
  const common = {
    fill: "none",
    stroke: "currentColor",
    strokeWidth,
    vectorEffect: "non-scaling-stroke" as const,
    strokeLinejoin: "round" as const,
    strokeLinecap: "round" as const,
  };

  switch (kind) {
    case "triangle":
      return <path d="M50 8 L92 88 L8 88 Z" {...common} />;
    case "triangleDown":
      return <path d="M8 12 L92 12 L50 92 Z" {...common} />;
    case "diamond":
      return <path d="M50 6 L94 50 L50 94 L6 50 Z" {...common} />;
    case "circle":
      return <circle cx={50} cy={50} r={44} {...common} />;
    case "square":
      return <rect x={9} y={9} width={82} height={82} rx={2} {...common} />;
    case "arc":
      // a quarter arc, open — the reference's most distinctive glyph
      return <path d="M10 90 A 80 80 0 0 1 90 10" {...common} />;
  }
}

const Drifter = memo(function Drifter({
  shape,
  pos,
  anchor,
  color,
  strokeWidth,
}: {
  shape: Shape;
  pos: MotionValue<number>;
  anchor: number;
  color: string;
  strokeWidth: number;
}) {
  // Scroll-driven parallax: the far planes lag, the near ones lead.
  const y = useTransform(pos, (p) => `${limit(anchor - p, -1.6, 1.6) * 7 * shape.depth}vh`);

  return (
    <motion.div
      className="landing-glyph"
      style={{
        left: `${shape.x}%`,
        top: `${shape.y}%`,
        width: shape.size,
        height: shape.size,
        marginLeft: -shape.size / 2,
        marginTop: -shape.size / 2,
        // `color` feeds `stroke: currentColor`, so one property tints the glyph,
        // and `op` rides on the wrapper's opacity rather than the stroke's alpha.
        // Visually identical for a single non-self-overlapping path, and it keeps
        // the colour a plain token instead of an rgba() built by string surgery.
        color,
        opacity: shape.op,
        y,
      }}
    >
      <div
        className="landing-glyph-drift"
        style={{
          animationDuration: `${shape.dur}s`,
          animationDelay: `${shape.delay}s`,
          // start and end rotation, so the glyph turns monotonically as it rises
          ["--glyph-r0" as string]: `${shape.rot - 5}deg`,
          ["--glyph-r1" as string]: `${shape.rot + 5}deg`,
        }}
      >
        <svg viewBox={`0 0 ${VIEW} ${VIEW}`} width="100%" height="100%" aria-hidden="true">
          <Glyph kind={shape.kind} strokeWidth={shape.sw ?? strokeWidth} />
        </svg>
      </div>
    </motion.div>
  );
});

/** Explicit fade windows, for fields whose beat is not one step long. */
export interface GlyphEnvelope {
  enterAt: number;
  enterLen: number;
  exitAt: number;
  exitLen: number;
}

export function ShapeField({
  pos,
  anchor = ANCHORS.shapeField.anchor,
  visibleLength = ANCHORS.shapeField.length,
  zIndex,
  shapes = SHAPES,
  color = "#ffffff",
  strokeWidth = 2,
  envelope,
}: {
  pos: MotionValue<number>;
  anchor?: number;
  visibleLength?: number;
  zIndex?: number;
  shapes?: readonly Shape[];
  /** Any CSS colour; per-glyph `op` is mixed into it. */
  color?: string;
  /** Default stroke width in px; a glyph's own `sw` wins. */
  strokeWidth?: number;
  /**
   * The thesis field's beat is exactly one step, so the `stepIndex` envelope
   * below fits it. The warm field spans two rests (6 and 7) and has to survive
   * the move between them, which that envelope cannot express — so it supplies
   * its own windows instead.
   */
  envelope?: GlyphEnvelope;
}) {
  const stepIndex = useStepIndex(pos, anchor, visibleLength);

  // Fade in over the approach, hold, fade out on the way to the next surface.
  const stepOpacity = useTransform(stepIndex, (si) =>
    si < 1 ? limit(si / 0.7, 0, 1) : limit(1 - (si - 1.5) / 0.7, 0, 1),
  );
  const rampOpacity = useTransform(pos, (p) =>
    envelope
      ? ramp(p, envelope.enterAt, envelope.enterLen) *
        (1 - ramp(p, envelope.exitAt, envelope.exitLen))
      : 0,
  );
  const opacity = envelope ? rampOpacity : stepOpacity;

  const visibility = useTransform(pos, (p) =>
    Math.abs(anchor - p) < visibleLength ? "visible" : "hidden",
  );

  return (
    <motion.div
      aria-hidden="true"
      className="landing-glyph-field"
      style={{ zIndex, opacity, visibility }}
    >
      {shapes.map((shape, i) => (
        <Drifter
          key={i}
          shape={shape}
          pos={pos}
          anchor={anchor}
          color={color}
          strokeWidth={strokeWidth}
        />
      ))}
    </motion.div>
  );
}
